import React, { useEffect, useMemo, useState } from "react";
import {
  assignDrone,
  bootstrapAppData,
  createOrder,
  evaluateDss,
  normalizeCreatedOrder,
  getSeedState,
  logAudit,
  updateAdminStatus,
  updateOrderBackend,
} from "./api";
import {
  clearAuth,
  loadAuth,
  saveAuth,
  saveState,
  safeClone,
  createOrderLocally,
  updateAdminLocally,
  assignOrderLocally,
} from "./data";
import { ROUTES, currentRoute, navigate } from "./routes";
import { Badge, CenteredShell, Kpi, NavButton, Toast } from "./components";
import {
  AdminPage,
  AuditPage,
  CustomerPage,
  DispatcherPage,
  DronePage,
  HomePage,
  LoginPage,
  OrderPage,
  RegisterPage,
} from "./pages";
import { randomTelemetry, tone } from "./utils";

function useRoute() {
  const [route, setRoute] = useState(currentRoute());
  useEffect(() => {
    const handler = () => setRoute(currentRoute());
    window.addEventListener("hashchange", handler);
    return () => window.removeEventListener("hashchange", handler);
  }, []);
  return [route, navigate, setRoute];
}

function useLocalStorageState(key, fallback) {
  const [value, setValue] = useState(() => {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch {
      return fallback;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      return;
    }
  }, [key, value]);

  return [value, setValue];
}

function App() {
  const [route, navigateTo, setRoute] = useRoute();
  const [auth, setAuth] = useLocalStorageState("dss.auth", loadAuth());
  const [state, setState] = useState(getSeedState());
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [selectedOrderId, setSelectedOrderId] = useState(101);
  const [selectedDroneId, setSelectedDroneId] = useState(1);
  const [orderForm, setOrderForm] = useState({
    client_name: "",
    destination: "",
    weight: "",
    payload_type: "medical",
    distance: "",
  });
  const [busyDay, setBusyDay] = useState(false);

  useEffect(() => {
    let mounted = true;
    bootstrapAppData()
      .then((data) => {
        if (!mounted) return;
        setState(data);
        setBusyDay(Boolean(data.admin?.busy_day));
        saveState(data);
        setLoading(false);
      })
      .catch(() => mounted && setLoading(false));
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!window.location.hash) {
      navigateTo(ROUTES.home);
    }
  }, [navigateTo]);

  useEffect(() => {
    saveAuth(auth);
  }, [auth]);

  const notify = (message, type = "success") => {
    setToast({ message, type, id: Date.now() });
    window.clearTimeout(window.__dssToastTimer);
    window.__dssToastTimer = window.setTimeout(() => setToast(null), 3200);
  };

  const updateState = (updater) => {
    setState((current) => {
      const next =
        typeof updater === "function" ? updater(safeClone(current)) : updater;
      saveState(next);
      return next;
    });
  };

  const refresh = async () => {
    setLoading(true);
    const data = await bootstrapAppData();
    setState(data);
    setBusyDay(Boolean(data.admin?.busy_day));
    saveState(data);
    setLoading(false);
    notify("Dashboard refreshed.", "success");
  };

  const signIn = (role) => {
    const profile = {
      role,
      displayName:
        role === "customer"
          ? "Customer User"
          : role === "admin"
            ? "Admin User"
            : "Dispatcher User",
      token: `${role}-demo-token`,
      signedInAt: new Date().toISOString(),
    };
    saveAuth(profile);
    setAuth(profile);
    notify(`Signed in as ${profile.displayName}`, "success");
    navigateTo(
      role === "customer"
        ? ROUTES.customer
        : role === "admin"
          ? ROUTES.admin
          : ROUTES.dispatcher,
    );
  };

  const signOut = () => {
    clearAuth();
    setAuth(null);
    navigateTo(ROUTES.login);
    notify("Signed out", "warning");
  };

  const orders = state.orders || [];
  const drones = state.drones || [];
  const auditLogs = state.auditLogs || [];
  const admin = state.admin || { busy_day: false, system_status: "active" };
  const selectedOrder =
    orders.find((order) => order.id === Number(selectedOrderId)) ||
    orders[0] ||
    null;
  const selectedDrone =
    drones.find((drone) => drone.drone_id === Number(selectedDroneId)) ||
    drones[0] ||
    null;

  const stats = useMemo(
    () => ({
      pending: orders.filter((order) => order.status === "pending").length,
      approved: orders.filter((order) => order.status === "approved").length,
      assigned: orders.filter((order) =>
        ["assigned", "override"].includes(order.status),
      ).length,
      idle: drones.filter((drone) => drone.status === "idle").length,
      busy: drones.filter((drone) => drone.status !== "idle").length,
      audit: auditLogs.length,
    }),
    [orders, drones, auditLogs],
  );

  async function submitOrder(event) {
    event.preventDefault();
    if (
      !orderForm.client_name ||
      !orderForm.destination ||
      !orderForm.weight ||
      !orderForm.distance
    ) {
      notify("Please fill all required fields.", "error");
      return;
    }
    const telemetry = randomTelemetry(
      Number(orderForm.weight),
      Number(orderForm.distance),
      orderForm.payload_type,
    );
    const evaluation = await evaluateDss(telemetry, busyDay);
    const created = await createOrder(
      {
        client_name: orderForm.client_name,
        destination: orderForm.destination,
        weight: Number(orderForm.weight),
        payload_type: orderForm.payload_type,
        distance: Number(orderForm.distance),
      },
      telemetry,
      busyDay,
    );
    const localOrderInput = {
      client_name: orderForm.client_name,
      destination: orderForm.destination,
      weight: Number(orderForm.weight),
      payload_type: orderForm.payload_type,
      distance: Number(orderForm.distance),
    };
    updateState((current) => {
      const next = createOrderLocally(current, localOrderInput, evaluation);
      const savedOrder = normalizeCreatedOrder(
        created.backendOrder,
        next.orders[0],
      );
      if (savedOrder) {
        next.orders[0] = {
          ...next.orders[0],
          ...savedOrder,
          timeline: next.orders[0].timeline,
          reason: savedOrder.reason ?? next.orders[0].reason,
          risk_score: savedOrder.risk_score ?? next.orders[0].risk_score,
          dss_decision: savedOrder.dss_decision ?? next.orders[0].dss_decision,
        };
      }
      return next;
    });
    setOrderForm({
      client_name: "",
      destination: "",
      weight: "",
      payload_type: "medical",
      distance: "",
    });
    notify(
      evaluation.dss_approved
        ? "Order approved and created."
        : "Order created but rejected by DSS.",
      evaluation.dss_approved ? "success" : "warning",
    );
    navigateTo(ROUTES.orders);
  }

  async function evaluateSelectedOrder() {
    if (!selectedOrder) return notify("Select an order first.", "warning");
    const evaluation = await evaluateDss(
      randomTelemetry(
        selectedOrder.weight,
        selectedOrder.distance,
        selectedOrder.payload_type,
      ),
      busyDay,
    );
    
    const updatedTimeline = [
      ...(selectedOrder.timeline || []),
      {
        label: evaluation.dss_approved ? "DSS approved" : "DSS rejected",
        at: new Date().toISOString(),
      },
    ];

    updateState((current) => {
      const next = safeClone(current);
      next.orders = next.orders.map((order) =>
        order.id === selectedOrder.id
          ? {
              ...order,
              status: evaluation.dss_approved ? "approved" : "rejected",
              risk_score: evaluation.risk_score,
              dss_decision: evaluation.final_status,
              reason: evaluation.decision_reason,
              timeline: updatedTimeline,
            }
          : order,
      );
      next.auditLogs = [
        {
          id: Date.now(),
          action: `Evaluated order ${selectedOrder.id}`,
          actor: "dispatcher",
          detail: evaluation.final_status,
          at: new Date().toISOString(),
        },
        ...(next.auditLogs || []),
      ];
      return next;
    });

    try {
      await updateOrderBackend(selectedOrder.id, {
        status: evaluation.dss_approved ? "approved" : "rejected",
        risk_score: evaluation.risk_score,
        dss_decision: evaluation.final_status,
        reason: evaluation.decision_reason,
        assigned_drone_id: selectedOrder.assigned_drone_id || null,
        eta_minutes: evaluation.dss_approved
          ? Math.max(12, Math.round(Number(selectedOrder.distance) * 4))
          : null,
        timeline: updatedTimeline,
      });
    } catch (err) {
      console.warn("Failed to sync manual evaluation to backend:", err);
    }

    await logAudit(
      `Evaluated order ${selectedOrder.id}`,
      "dispatcher",
      evaluation.final_status,
    );
    notify(
      evaluation.dss_approved
        ? "Order approved by DSS."
        : "Order rejected by DSS.",
      evaluation.dss_approved ? "success" : "warning",
    );
  }

  async function assignSelectedOrder(action = "assign") {
    if (!selectedOrder) return notify("Select an order first.", "warning");
    if (action !== "reject" && !selectedDrone)
      return notify("Select a drone first.", "warning");
    const next = await assignDrone(
      selectedOrder.id,
      selectedDrone?.drone_id,
      action,
    );
    updateState(next);
    notify(`Order ${selectedOrder.id} ${action} action saved.`, "success");
  }

  async function saveAdminSettings() {
    const result = await updateAdminStatus({
      busy_day: busyDay,
      system_status: admin.system_status || "active",
    });
    updateState((current) => updateAdminLocally(current, result));
    notify("Admin settings updated.", "success");
  }

  if (loading) return <CenteredShell message="Loading dashboard..." />;

  return (
    <div className="shell">
      <header className="topbar">
        <div className="brand">
          <div className="brand-mark">DD</div>
          <div>
            <h1>Drone Delivery DSS</h1>
            <p>
              {auth ? `${auth.displayName} · ${auth.role}` : "ReactJS frontend"}{" "}
              · ready
            </p>
          </div>
        </div>
        <nav className="inline-nav">
          <NavButton
            active={route === ROUTES.home}
            onClick={() => navigateTo(ROUTES.home)}
          >
            Home
          </NavButton>
          {!auth && route !== ROUTES.login && (
            <NavButton
              active={route === ROUTES.login}
              onClick={() => navigateTo(ROUTES.login)}
            >
              Login
            </NavButton>
          )}
          {auth && (
            <>
              <NavButton
                active={route === ROUTES.customer}
                onClick={() => navigateTo(ROUTES.customer)}
              >
                Customer
              </NavButton>
              <NavButton
                active={route === ROUTES.orders}
                onClick={() => navigateTo(ROUTES.orders)}
              >
                Orders
              </NavButton>
              <NavButton
                active={route === ROUTES.dispatcher}
                onClick={() => navigateTo(ROUTES.dispatcher)}
              >
                Dispatcher
              </NavButton>
              <NavButton
                active={route === ROUTES.drones}
                onClick={() => navigateTo(ROUTES.drones)}
              >
                Drones
              </NavButton>
              <NavButton
                active={route === ROUTES.admin}
                onClick={() => navigateTo(ROUTES.admin)}
              >
                Admin
              </NavButton>
              <NavButton
                active={route === ROUTES.audit}
                onClick={() => navigateTo(ROUTES.audit)}
              >
                Audit
              </NavButton>
              <NavButton onClick={refresh}>Refresh</NavButton>
              <NavButton onClick={signOut}>Sign out</NavButton>
            </>
          )}
        </nav>
      </header>

      {toast && <Toast toast={toast} />}

      {route !== ROUTES.login && route !== ROUTES.register && (
        <section className="hero">
          <div className="hero-panel">
            <div className="hero-meta">
              <span className="chip active">Role-based SPA</span>
              <span className="route-chip">{route}</span>
            </div>
            <h1>
              Customer order flow, dispatcher dashboard, fleet monitoring, and DSS
              decisions in one React app.
            </h1>
            <p className="lede">
              This frontend covers the major screens from the requirement docs and
              can run with backend API or with local fallback data. It is
              structured as a React single-page app with route-like screens.
            </p>
            <div className="mini-stats">
              <div className="mini-stat">
                <span>API mode</span>
                <strong>Hybrid sync</strong>
              </div>
              <div className="mini-stat">
                <span>Selected order</span>
                <strong>{selectedOrder ? `#${selectedOrder.id}` : "none"}</strong>
              </div>
              <div className="mini-stat">
                <span>Selected drone</span>
                <strong>{selectedDrone ? selectedDrone.name : "none"}</strong>
              </div>
            </div>
            <div className="landing-actions">
              <button className="btn" onClick={() => navigateTo(ROUTES.customer)}>
                Customer flow
              </button>
              <button
                className="btn-secondary"
                onClick={() => navigateTo(ROUTES.dispatcher)}
              >
                Dispatcher dashboard
              </button>
              <button className="btn-ghost" onClick={refresh}>
                Refresh
              </button>
            </div>
          </div>
          <div className="hero-side">
            <div className="card">
              <div className="card-header">
                <h2>System snapshot</h2>
                <Badge status="active">API + fallback</Badge>
              </div>
              <div className="kpi-grid" style={{ marginTop: 14 }}>
                <Kpi label="Pending orders" value={stats.pending} />
                <Kpi label="Approved orders" value={stats.approved} />
                <Kpi label="Assigned orders" value={stats.assigned} />
                <Kpi label="Audit entries" value={stats.audit} />
              </div>
            </div>
            <div className="card">
              <div className="row-between">
                <div>
                  <h2>Current user</h2>
                  <p className="muted">
                    {auth
                      ? `${auth.displayName} · ${auth.role}`
                      : "Not signed in"}
                  </p>
                </div>
                <Badge status={auth?.role || "pending"}>
                  {auth?.role || "guest"}
                </Badge>
              </div>
              <div className="surface" style={{ marginTop: 14 }}>
                <p className="muted" style={{ margin: 0 }}>
                  Backend state is merged into local seeded data so the UI remains
                  usable even when the API returns partial records.
                </p>
              </div>
            </div>
          </div>
        </section>
      )}

      {route === ROUTES.home && (
        <HomePage navigate={navigateTo} stats={stats} auth={auth} />
      )}
      {route === ROUTES.login && <LoginPage onSignIn={signIn} navigate={navigateTo} />}
      {route === ROUTES.register && <RegisterPage navigate={navigateTo} />}
      {route === ROUTES.customer && (
        <CustomerPage
          orders={orders}
          orderForm={orderForm}
          setOrderForm={setOrderForm}
          onSubmit={submitOrder}
          onOpenOrders={() => navigateTo(ROUTES.orders)}
        />
      )}
      {route === ROUTES.orders && (
        <OrderPage
          orders={orders}
          selectedOrder={selectedOrder}
          selectedOrderId={selectedOrderId}
          setSelectedOrderId={setSelectedOrderId}
        />
      )}
      {route === ROUTES.dispatcher && (
        <DispatcherPage
          admin={admin}
          orders={orders}
          drones={drones}
          auditLogs={auditLogs}
          selectedOrder={selectedOrder}
          selectedDrone={selectedDrone}
          selectedOrderId={selectedOrderId}
          selectedDroneId={selectedDroneId}
          setSelectedOrderId={setSelectedOrderId}
          setSelectedDroneId={setSelectedDroneId}
          onEvaluate={evaluateSelectedOrder}
          onAssign={assignSelectedOrder}
          onToggleBusyDay={setBusyDay}
          busyDay={busyDay}
        />
      )}
      {route === ROUTES.drones && (
        <DronePage
          drones={drones}
          selectedDroneId={selectedDroneId}
          setSelectedDroneId={setSelectedDroneId}
        />
      )}
      {route === ROUTES.admin && (
        <AdminPage
          admin={admin}
          busyDay={busyDay}
          onBusyDayChange={setBusyDay}
          onSave={saveAdminSettings}
        />
      )}
      {route === ROUTES.audit && <AuditPage state={state} />}

      <footer className="page-footer">
        Use <code>VITE_API_BASE_URL</code> to point the React app at another
        backend.
      </footer>
    </div>
  );
}

export default App;
