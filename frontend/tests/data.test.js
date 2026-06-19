import { describe, expect, it } from "vitest";
import {
  assignOrderLocally,
  createOrderLocally,
  evaluateTelemetry,
  getSeedState,
  updateAdminLocally,
} from "../src/data.js";
import { normalizeCreatedOrder } from "../src/api.js";

describe("frontend data helpers", () => {
  it("approves a safe telemetry payload", () => {
    const result = evaluateTelemetry(
      {
        wind_speed: 5,
        battery_remaining: 88,
        actual_carry_weight: 1.8,
        payload_type: "medical",
        distance_flown: 4,
        obstacles_encountered: 0,
      },
      false,
    );

    expect(result.dss_approved).toBe(true);
    expect(result.final_status).toBe("approved");
    expect(result.risk_score).toBeGreaterThanOrEqual(0);
  });

  it("rejects telemetry when the battery is too low for busy day mode", () => {
    const result = evaluateTelemetry(
      {
        wind_speed: 7,
        battery_remaining: 25,
        actual_carry_weight: 2,
        payload_type: "food",
        distance_flown: 4,
        obstacles_encountered: 0,
      },
      true,
    );

    expect(result.dss_approved).toBe(false);
    expect(result.final_status).toBe("rejected");
    expect(result.decision_reason).toContain("battery");
  });

  it("creates a local order and audit entry", () => {
    const state = getSeedState();
    const next = createOrderLocally(
      state,
      {
        client_name: "Acme Clinic",
        destination: "Ward 4",
        weight: 1.2,
        payload_type: "medical",
        distance: 3.4,
      },
      {
        dss_approved: true,
        risk_score: 0.2,
        final_status: "approved",
        decision_reason: "OK",
      },
    );

    expect(next.orders[0].client_name).toBe("Acme Clinic");
    expect(next.orders[0].status).toBe("approved");
    expect(next.auditLogs[0].action).toBe("Order created");
  });

  it("assigns orders and drones locally", () => {
    const state = getSeedState();
    const next = assignOrderLocally(state, 101, 1, "assign");
    const order = next.orders.find((item) => item.id === 101);
    const drone = next.drones.find((item) => item.drone_id === 1);

    expect(order.status).toBe("assigned");
    expect(order.assigned_drone_id).toBe(1);
    expect(drone.status).toBe("busy");
    expect(next.auditLogs[0].action).toContain("assigned");
  });

  it("merges backend order data without losing local context", () => {
    const merged = normalizeCreatedOrder(
      {
        id: 999,
        client_name: "Backend Clinic",
        destination: "Bay 9",
        weight: 2.5,
        distance: 5.8,
        status: "pending",
        created_at: "2026-06-19T00:00:00.000Z",
      },
      {
        id: 1,
        client_name: "Local Clinic",
        destination: "Bay 1",
        weight: 2.1,
        distance: 4.2,
        status: "approved",
        created_at: "2026-06-18T00:00:00.000Z",
        timeline: [
          { label: "Request created", at: "2026-06-18T00:00:00.000Z" },
        ],
      },
    );

    expect(merged.id).toBe(999);
    expect(merged.client_name).toBe("Backend Clinic");
    expect(merged.timeline).toHaveLength(1);
    expect(merged.status).toBe("pending");
  });

  it("updates admin settings locally", () => {
    const next = updateAdminLocally(getSeedState(), {
      busy_day: true,
      system_status: "maintenance",
    });

    expect(next.admin.busy_day).toBe(true);
    expect(next.admin.system_status).toBe("maintenance");
    expect(next.auditLogs[0].action).toBe("System settings updated");
  });
});
