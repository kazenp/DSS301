import {
  addAuditEntry,
  assignOrderLocally,
  createOrderLocally,
  evaluateTelemetry,
  getSeedState,
  loadState,
  saveState,
  updateAdminLocally,
} from "./data";

const DEFAULT_API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api/v1";
const seedState = getSeedState();

function mergeDrone(drone) {
  const fallback =
    seedState.drones.find(
      (item) => Number(item.drone_id) === Number(drone.drone_id),
    ) || {};
  return {
    ...fallback,
    ...drone,
    drone_id: Number(drone.drone_id),
    battery: Number(
      drone.battery ?? drone.battery_capacity ?? fallback.battery ?? 0,
    ),
    current_payload: drone.current_payload ?? fallback.current_payload ?? null,
  };
}

function mergeOrder(order) {
  const fallback =
    seedState.orders.find((item) => Number(item.id) === Number(order.id)) || {};
  return {
    ...fallback,
    ...order,
    id: Number(order.id),
    weight: Number(order.weight ?? fallback.weight ?? 0),
    distance: Number(order.distance ?? fallback.distance ?? 0),
    created_at: order.created_at ?? fallback.created_at,
    risk_score: order.risk_score ?? fallback.risk_score ?? null,
    dss_decision: order.dss_decision ?? fallback.dss_decision ?? null,
    reason: order.reason ?? fallback.reason ?? null,
    assigned_drone_id: order.assigned_drone_id ?? fallback.assigned_drone_id ?? null,
    eta_minutes: order.eta_minutes ?? fallback.eta_minutes ?? null,
    timeline: order.timeline ?? fallback.timeline ?? null,
  };
}

export function normalizeCreatedOrder(backendOrder, localOrder) {
  if (!backendOrder && !localOrder) return null;
  if (!backendOrder) return localOrder;
  const merged = mergeOrder(backendOrder);
  if (!localOrder) return merged;
  return {
    ...localOrder,
    ...merged,
    id: merged.id ?? localOrder.id,
    created_at: merged.created_at ?? localOrder.created_at,
    status: merged.status ?? localOrder.status,
  };
}

function timeoutSignal(timeoutMs = 10000) {
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), timeoutMs);
  return { signal: controller.signal, clear: () => window.clearTimeout(timer) };
}

async function requestJson(path, options = {}) {
  const { signal, clear } = timeoutSignal(options.timeoutMs || 10000);
  try {
    const response = await fetch(new URL(path, DEFAULT_API_BASE_URL), {
      method: options.method || "GET",
      headers: {
        ...(options.body !== undefined
          ? { "Content-Type": "application/json" }
          : {}),
        ...(options.headers || {}),
      },
      body:
        options.body === undefined ? undefined : JSON.stringify(options.body),
      signal,
    });
    const payload = await response.json().catch(() => null);
    if (!response.ok) {
      throw new Error(payload?.detail || `Request failed (${response.status})`);
    }
    return payload;
  } finally {
    clear();
  }
}

export async function bootstrapAppData() {
  const state = loadState();
  try {
    const [orders, drones, adminStatus] = await Promise.all([
      requestJson("/orders/").catch(() => state.orders),
      requestJson("/drones/").catch(() => state.drones),
      requestJson("/admin/status").catch(() => state.admin),
    ]);
    return {
      ...state,
      orders: (orders || state.orders || []).map(mergeOrder),
      drones: (drones || state.drones || []).map(mergeDrone),
      admin: adminStatus || state.admin,
    };
  } catch {
    return state;
  }
}

export async function evaluateDss(
  telemetry,
  busyDay = false,
  modelType = "logistic",
) {
  try {
    return await requestJson("/predict/dss-evaluate", {
      method: "POST",
      body: { telemetry, busy_day: busyDay, model_type: modelType },
    });
  } catch {
    return evaluateTelemetry(telemetry, busyDay, modelType);
  }
}

export async function createOrder(orderInput, telemetry, busyDay = false) {
  const evaluation = telemetry
    ? await evaluateDss(telemetry, busyDay)
    : evaluateTelemetry(
        {
          wind_speed: 6,
          battery_remaining: 85,
          actual_carry_weight: orderInput.weight,
          payload_type: orderInput.payload_type,
          altitude: 120,
          distance_flown: orderInput.distance,
          gps_accuracy: 1.2,
          obstacles_encountered: 0,
        },
        busyDay,
      );

  const bodyPayload = {
    ...orderInput,
    status: evaluation?.dss_approved ? "approved" : "pending",
    risk_score: evaluation?.risk_score ?? null,
    dss_decision: evaluation?.final_status ?? null,
    reason: evaluation?.decision_reason ?? null,
    assigned_drone_id: null,
    eta_minutes: evaluation?.dss_approved
      ? Math.max(12, Math.round(Number(orderInput.distance) * 4))
      : null,
    timeline: [{ label: "Request created", at: new Date().toISOString() }],
  };

  try {
    const backendOrder = await requestJson("/orders/", {
      method: "POST",
      body: bodyPayload,
    });
    return { evaluation, backendOrder: mergeOrder(backendOrder) };
  } catch {
    const state = createOrderLocally(loadState(), orderInput, evaluation);
    saveState(state);
    return { evaluation, backendOrder: null, state };
  }
}

export async function updateAdminStatus(update) {
  try {
    return await requestJson("/admin/status", { method: "POST", body: update });
  } catch {
    const next = updateAdminLocally(loadState(), update);
    saveState(next);
    return next.admin;
  }
}

export async function updateOrderBackend(orderId, updateData) {
  return await requestJson(`/orders/${orderId}/update-status`, {
    method: "POST",
    body: updateData,
  });
}

export async function updateDroneStatusBackend(droneId, status, battery) {
  return await requestJson(`/drones/${droneId}/update-status?status=${status}&battery=${battery}`, {
    method: "POST",
  });
}

export async function assignDrone(orderId, droneId, action = "assign") {
  const state = loadState();
  const order = state.orders.find((item) => String(item.id) === String(orderId));
  const drone = state.drones.find((item) => String(item.drone_id) === String(droneId));
  
  if (!order) {
    throw new Error("Order not found");
  }
  
  const next = assignOrderLocally(state, orderId, droneId, action);
  
  try {
    const updatedOrder = next.orders.find((item) => String(item.id) === String(orderId));
    const orderUpdateBody = {
      status: updatedOrder.status,
      risk_score: updatedOrder.risk_score,
      dss_decision: updatedOrder.dss_decision,
      reason: updatedOrder.reason,
      assigned_drone_id: updatedOrder.assigned_drone_id,
      eta_minutes: updatedOrder.eta_minutes,
      timeline: updatedOrder.timeline,
    };
    
    // Call order update API
    await updateOrderBackend(orderId, orderUpdateBody);
    
    // If assigned/overridden, call drone status update API
    if (action !== "reject" && drone) {
      await updateDroneStatusBackend(droneId, "busy", drone.battery);
    }
  } catch (err) {
    console.warn("Failed to sync drone assignment to backend:", err);
  }
  
  saveState(next);
  return next;
}

export async function logAudit(action, actor, detail) {
  const state = addAuditEntry(loadState(), action, actor, detail);
  saveState(state);
  return state.auditLogs;
}

export { getSeedState };
