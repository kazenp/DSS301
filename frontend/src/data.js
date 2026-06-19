export const STORAGE_KEYS = {
  auth: "dss.auth",
  state: "dss.frontend.state",
};

const now = () => new Date().toISOString();

export const seedState = {
  admin: { busy_day: false, system_status: "active" },
  drones: [
    {
      drone_id: 1,
      name: "Northwind-01",
      status: "idle",
      battery: 94,
      current_payload: null,
      location: "Hub A / Bay 1",
      max_payload: 5,
      latitude: 10.7769,
      longitude: 106.7009,
    },
    {
      drone_id: 2,
      name: "Northwind-02",
      status: "busy",
      battery: 68,
      current_payload: 1.8,
      location: "Sector 7 / Route 2",
      max_payload: 4,
      latitude: 10.7821,
      longitude: 106.7054,
    },
    {
      drone_id: 3,
      name: "Northwind-03",
      status: "charging",
      battery: 41,
      current_payload: null,
      location: "Hub B / Charging",
      max_payload: 3,
      latitude: 10.7712,
      longitude: 106.6983,
    },
    {
      drone_id: 4,
      name: "Northwind-04",
      status: "maintenance",
      battery: 22,
      current_payload: null,
      location: "Workshop",
      max_payload: 2,
      latitude: 10.7683,
      longitude: 106.7091,
    },
  ],
  orders: [
    {
      id: 101,
      client_name: "Central Pharmacy",
      destination: "Sector 7, Area B",
      weight: 1.5,
      payload_type: "medical",
      distance: 4.2,
      status: "pending",
      created_at: new Date(Date.now() - 1000 * 60 * 27).toISOString(),
      risk_score: 0.24,
      dss_decision: "review",
      reason: "Awaiting dispatcher confirmation",
      assigned_drone_id: null,
      eta_minutes: 18,
      timeline: [
        {
          label: "Request created",
          at: new Date(Date.now() - 1000 * 60 * 27).toISOString(),
        },
        {
          label: "Pending review",
          at: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
        },
      ],
    },
    {
      id: 102,
      client_name: "City Cafe",
      destination: "Downtown Plaza",
      weight: 2.0,
      payload_type: "food",
      distance: 3.8,
      status: "approved",
      created_at: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
      risk_score: 0.18,
      dss_decision: "approved",
      reason: "Within battery and wind constraints",
      assigned_drone_id: 2,
      eta_minutes: 15,
      timeline: [
        {
          label: "Request created",
          at: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
        },
        {
          label: "DSS approved",
          at: new Date(Date.now() - 1000 * 60 * 40).toISOString(),
        },
        {
          label: "Assigned to Northwind-02",
          at: new Date(Date.now() - 1000 * 60 * 35).toISOString(),
        },
      ],
    },
    {
      id: 103,
      client_name: "Lab Med Express",
      destination: "Research Block C",
      weight: 5.4,
      payload_type: "medical",
      distance: 6.1,
      status: "rejected",
      created_at: new Date(Date.now() - 1000 * 60 * 75).toISOString(),
      risk_score: 0.81,
      dss_decision: "rejected",
      reason: "Over payload limit for available drones",
      assigned_drone_id: null,
      eta_minutes: null,
      timeline: [
        {
          label: "Request created",
          at: new Date(Date.now() - 1000 * 60 * 75).toISOString(),
        },
        {
          label: "Rejected by DSS",
          at: new Date(Date.now() - 1000 * 60 * 70).toISOString(),
        },
      ],
    },
  ],
  auditLogs: [
    {
      id: 1,
      action: "DSS approved order 102",
      actor: "system",
      detail: "Assigned Northwind-02 to City Cafe",
      at: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    },
    {
      id: 2,
      action: "Order 103 rejected",
      actor: "system",
      detail: "Payload exceeded safe limits",
      at: new Date(Date.now() - 1000 * 60 * 65).toISOString(),
    },
  ],
};

export function safeClone(value) {
  return typeof structuredClone === "function"
    ? structuredClone(value)
    : JSON.parse(JSON.stringify(value));
}

export function readJson(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

export function writeJson(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    return value;
  }
  return value;
}

export function getSeedState() {
  return safeClone(seedState);
}

export function loadState() {
  const stored = readJson(STORAGE_KEYS.state, null);
  const state =
    stored && stored.orders && stored.drones ? stored : getSeedState();
  return writeJson(STORAGE_KEYS.state, state);
}

export function saveState(nextState) {
  return writeJson(STORAGE_KEYS.state, nextState);
}

export function loadAuth() {
  return readJson(STORAGE_KEYS.auth, null);
}

export function saveAuth(auth) {
  return writeJson(STORAGE_KEYS.auth, auth);
}

export function clearAuth() {
  try {
    localStorage.removeItem(STORAGE_KEYS.auth);
  } catch {
    return;
  }
}

export function nextId(items) {
  return (
    items.reduce(
      (max, item) => Math.max(max, Number(item.id ?? item.drone_id ?? 0)),
      0,
    ) + 1
  );
}

export function addAuditEntry(state, action, actor, detail) {
  const next = safeClone(state);
  next.auditLogs.unshift({
    id: nextId(next.auditLogs),
    action,
    actor,
    detail,
    at: now(),
  });
  return next;
}

export function evaluateTelemetry(
  telemetry,
  busyDay = false,
  modelType = "logistic",
) {
  const wind = Number(telemetry.wind_speed || 0);
  const battery = Number(telemetry.battery_remaining || 0);
  const weight = Number(telemetry.actual_carry_weight || 0);
  const distance = Number(telemetry.distance_flown || 0);
  const obstacles = Number(telemetry.obstacles_encountered || 0);
  const batteryThreshold = busyDay ? 35 : 20;
  const windLimit = busyDay ? 10 : 12;
  const rawProbability =
    0.97 -
    wind * 0.03 -
    (100 - battery) * 0.003 -
    weight * 0.05 -
    distance * 0.004 -
    obstacles * 0.025;
  const successProbability = Math.max(
    0.1,
    Math.min(0.99, rawProbability - (busyDay ? 0.06 : 0)),
  );
  const approved =
    wind <= windLimit &&
    battery >= batteryThreshold &&
    weight <= 5 &&
    successProbability >= (busyDay ? 0.72 : 0.62);
  return {
    model_used: modelType,
    success_probability: successProbability,
    risk_score: 1 - successProbability,
    prediction: approved ? 1 : 0,
    dss_approved: approved,
    final_status: approved ? "approved" : "rejected",
    decision_reason: approved
      ? "Approved: telemetry is within safe limits."
      : `Rejected: ${wind > windLimit ? `wind > ${windLimit} m/s` : battery < batteryThreshold ? `battery < ${batteryThreshold}%` : "risk threshold too high"}.`,
    constraints: [
      `Wind <= ${windLimit} m/s`,
      `Battery >= ${batteryThreshold}%`,
      "Payload <= 5 kg",
    ],
  };
}

export function createOrderLocally(state, orderInput, evaluation) {
  const next = safeClone(state);
  const id = nextId(next.orders);
  const createdAt = now();
  const order = {
    id,
    client_name: orderInput.client_name,
    destination: orderInput.destination,
    weight: Number(orderInput.weight),
    payload_type: orderInput.payload_type,
    distance: Number(orderInput.distance),
    status: evaluation?.dss_approved ? "approved" : "pending",
    created_at: createdAt,
    risk_score: evaluation?.risk_score ?? 0.32,
    dss_decision: evaluation?.final_status ?? "review",
    reason: evaluation?.decision_reason ?? "Waiting for DSS evaluation",
    assigned_drone_id: null,
    eta_minutes: evaluation?.dss_approved
      ? Math.max(12, Math.round(Number(orderInput.distance) * 4))
      : null,
    timeline: [{ label: "Request created", at: createdAt }],
  };
  next.orders.unshift(order);
  return addAuditEntry(
    next,
    "Order created",
    "customer",
    `${order.client_name} -> ${order.destination}`,
  );
}

export function updateAdminLocally(state, update) {
  const next = safeClone(state);
  next.admin = { ...next.admin, ...update };
  return addAuditEntry(
    next,
    "System settings updated",
    "admin",
    `busy_day=${next.admin.busy_day}`,
  );
}

export function assignOrderLocally(state, orderId, droneId, action = "assign") {
  const next = safeClone(state);
  const order = next.orders.find((item) => String(item.id) === String(orderId));
  const drone = next.drones.find(
    (item) => String(item.drone_id) === String(droneId),
  );
  const actionLabel =
    action === "override"
      ? "overridden"
      : action === "reject"
        ? "rejected"
        : "assigned";
  if (!order) {
    throw new Error("Order not found");
  }
  if (action === "reject") {
    order.status = "rejected";
    order.dss_decision = "rejected";
    order.reason = "Rejected by dispatcher";
    order.timeline = [
      ...(order.timeline || []),
      { label: "Dispatcher rejected", at: now() },
    ];
    return addAuditEntry(
      next,
      `Order ${order.id} rejected`,
      "dispatcher",
      order.client_name,
    );
  }
  if (!drone) {
    throw new Error("Drone not found");
  }
  order.status = action === "override" ? "override" : "assigned";
  order.assigned_drone_id = drone.drone_id;
  order.dss_decision = order.status;
  order.reason =
    action === "override"
      ? "Manual override by dispatcher"
      : `Assigned to ${drone.name}`;
  order.timeline = [
    ...(order.timeline || []),
    { label: `Dispatcher ${actionLabel} ${drone.name}`, at: now() },
  ];
  drone.status = "busy";
  drone.current_payload = order.weight;
  return addAuditEntry(
    next,
    `Order ${order.id} ${actionLabel}`,
    "dispatcher",
    `Drone ${drone.name}`,
  );
}
