const DEFAULT_API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api/v1";

function timeoutSignal(timeoutMs = 10000) {
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), timeoutMs);
  return { signal: controller.signal, clear: () => window.clearTimeout(timer) };
}

async function requestJson(path, options = {}) {
  const { signal, clear } = timeoutSignal(options.timeoutMs || 10000);
  try {
    const baseUrl = DEFAULT_API_BASE_URL.endsWith("/")
      ? DEFAULT_API_BASE_URL
      : `${DEFAULT_API_BASE_URL}/`;
    const cleanPath = path.startsWith("/") ? path.slice(1) : path;
    
    // Read token from localStorage
    let authHeaders = {};
    try {
      const authRaw = localStorage.getItem("dss.auth");
      if (authRaw) {
        const auth = JSON.parse(authRaw);
        if (auth && auth.token) {
          authHeaders["Authorization"] = `Bearer ${auth.token}`;
        }
      }
    } catch (e) {
      // Ignore
    }

    const response = await fetch(new URL(cleanPath, baseUrl), {
      method: options.method || "GET",
      headers: {
        ...(options.body !== undefined
          ? { "Content-Type": "application/json" }
          : {}),
        ...authHeaders,
        ...(options.headers || {}),
      },
      body:
        options.body === undefined ? undefined : JSON.stringify(options.body),
      signal,
    });
    const payload = await response.json().catch(() => null);
    if (!response.ok) {
      // Dispatch a global event so App.jsx can react (e.g. sign out on 401)
      if (response.status === 401 || response.status === 403) {
        window.dispatchEvent(new CustomEvent("api:auth-error", {
          detail: { status: response.status, path }
        }));
      }
      throw new Error(payload?.detail || `Request failed (${response.status})`);
    }
    return payload;
  } finally {
    clear();
  }
}

export async function bootstrapAppData() {
  const [orders, drones, adminStatus] = await Promise.all([
    requestJson("/orders/").catch(() => []),
    requestJson("/drones/").catch(() => []),
    requestJson("/admin/status").catch(() => ({ busy_day: false, system_status: "active" })),
  ]);
  return {
    orders: orders || [],
    drones: drones || [],
    admin: adminStatus || { busy_day: false, system_status: "active" },
    auditLogs: [],
  };
}

export async function evaluateDss(
  telemetry,
  busyDay = false,
  modelType = "logistic",
) {
  return await requestJson("/predict/dss-evaluate", {
    method: "POST",
    body: { telemetry, busy_day: busyDay, model_type: modelType },
  });
}

export async function createOrder(orderInput, telemetry, busyDay = false) {
  const evaluation = await evaluateDss(telemetry, busyDay);

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

  const backendOrder = await requestJson("/orders/", {
    method: "POST",
    body: bodyPayload,
  });
  return { evaluation, backendOrder };
}

export async function updateAdminStatus(update) {
  return await requestJson("/admin/status", { method: "POST", body: update });
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

export async function loginAPI(email, password) {
  return await requestJson("/auth/login", {
    method: "POST",
    body: { email, password },
  });
}

export async function registerAPI(name, email, password, role) {
  return await requestJson("/auth/register", {
    method: "POST",
    body: { username: name, email, password, role },
  });
}

export async function getMeAPI() {
  return await requestJson("/auth/me");
}
