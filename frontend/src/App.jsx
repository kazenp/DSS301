import React, { useEffect, useMemo, useState } from "react";
import {
  bootstrapAppData,
  createOrder,
  evaluateDss,
  updateAdminStatus,
  updateOrderBackend,
  updateDroneStatusBackend,
  getMeAPI,
} from "./api";
import {
  clearAuth,
  loadAuth,
  saveAuth,
  safeClone,
} from "./data";
import { ROUTES, currentRoute, navigate } from "./routes";
import { AccessDenied, Badge, CenteredShell, Kpi, NavButton, Toast } from "./components";
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
  const [state, setState] = useState({ orders: [], drones: [], admin: {}, auditLogs: [] });
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
    async function initApp() {
      try {
        let authUser = auth;
        // Verify current session with backend if we have a token
        if (auth && auth.token) {
          try {
            const me = await getMeAPI();
            authUser = {
              role: me.role,
              displayName: me.username,
              token: auth.token,
              signedInAt: auth.signedInAt || new Date().toISOString()
            };
            if (mounted) setAuth(authUser);
          } catch (meError) {
            // Token is invalid/expired
            if (mounted) {
              setAuth(null);
              clearAuth();
              navigateTo(ROUTES.login);
            }
            authUser = null;
          }
        }

        const data = await bootstrapAppData();
        if (!mounted) return;
        setState(data);
        setBusyDay(Boolean(data.admin?.busy_day));
        setLoading(false);
      } catch (err) {
        if (mounted) setLoading(false);
      }
    }
    initApp();
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

  // Listen for global 401/403 errors – sign out automatically
  useEffect(() => {
    const handler = (e) => {
      // Only sign out on 401 (token expired/invalid), not 403 (wrong role)
      if (e.detail?.status === 401) {
        clearAuth();
        setAuth(null);
        navigateTo(ROUTES.login);
        notify("Session expired. Please sign in again.", "warning");
      } else if (e.detail?.status === 403) {
        notify("You don't have permission to perform that action.", "error");
      }
    };
    window.addEventListener("api:auth-error", handler);
    return () => window.removeEventListener("api:auth-error", handler);
  }, [navigateTo]);

  const notify = (message, type = "success") => {
    setToast({ message, type, id: Date.now() });
    window.clearTimeout(window.__dssToastTimer);
    window.__dssToastTimer = window.setTimeout(() => setToast(null), 3200);
  };

  const updateState = (updater) => {
    setState((current) => {
      return typeof updater === "function" ? updater(safeClone(current)) : updater;
    });
  };

  const refresh = async () => {
    setLoading(true);
    const data = await bootstrapAppData();
    setState(data);
    setBusyDay(Boolean(data.admin?.busy_day));
    setLoading(false);
    notify("Dashboard refreshed.", "success");
  };

  const signIn = (authUser) => {
    saveAuth(authUser);
    setAuth(authUser);
    notify(`Signed in as ${authUser.displayName}`, "success");
    navigateTo(
      authUser.role === "customer"
        ? ROUTES.customer
        : authUser.role === "admin"
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
    try {
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

      updateState((current) => {
        const next = safeClone(current);
        if (created.backendOrder) {
           next.orders.unshift(created.backendOrder);
        }
        next.auditLogs.unshift({
           id: Date.now(),
           action: "Order created",
           actor: "customer",
           detail: `${orderForm.client_name} -> ${orderForm.destination}`,
           at: new Date().toISOString()
        });
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
        created.evaluation?.dss_approved
          ? "Order approved and created."
          : "Order created but rejected by DSS.",
        created.evaluation?.dss_approved ? "success" : "warning",
      );
      navigateTo(ROUTES.orders);
    } catch (err) {
      notify("Failed to create order.", "error");
    }
  }

  async function evaluateSelectedOrder() {
    if (!selectedOrder) return notify("Select an order first.", "warning");
    try {
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

      updateState((current) => {
        const next = safeClone(current);
        const order = next.orders.find(o => o.id === selectedOrder.id);
        if (order) {
            order.status = evaluation.dss_approved ? "approved" : "rejected";
            order.risk_score = evaluation.risk_score;
            order.dss_decision = evaluation.final_status;
            order.reason = evaluation.decision_reason;
            order.timeline = updatedTimeline;
        }
        next.auditLogs.unshift({
            id: Date.now(),
            action: `Evaluated order ${selectedOrder.id}`,
            actor: "dispatcher",
            detail: evaluation.final_status,
            at: new Date().toISOString(),
        });
        return next;
      });

      notify(
        evaluation.dss_approved
          ? "Order approved by DSS."
          : "Order rejected by DSS.",
        evaluation.dss_approved ? "success" : "warning",
      );
    } catch (err) {
      notify("Failed to evaluate order.", "error");
    }
  }

  async function assignSelectedOrder(action = "assign") {
    if (!selectedOrder) return notify("Select an order first.", "warning");
    if (action !== "reject" && !selectedDrone)
      return notify("Select a drone first.", "warning");
    
    try {
      const orderStatus = action === "override" ? "override" : (action === "reject" ? "rejected" : "assigned");
      const dss_decision = action === "reject" ? "rejected" : orderStatus;
      const reason = action === "override" ? "Manual override by dispatcher" : (action === "reject" ? "Rejected by dispatcher" : `Assigned to ${selectedDrone.name}`);
      const actionLabel = action === "override" ? "overridden" : (action === "reject" ? "rejected" : "assigned");
      
      const updatedTimeline = [
        ...(selectedOrder.timeline || []),
        { label: `Dispatcher ${actionLabel}`, at: new Date().toISOString() },
      ];

      await updateOrderBackend(selectedOrder.id, {
        status: orderStatus,
        dss_decision: dss_decision,
        reason: reason,
        assigned_drone_id: action === "reject" ? null : selectedDrone.drone_id,
        timeline: updatedTimeline,
      });

      if (action !== "reject" && selectedDrone) {
        await updateDroneStatusBackend(selectedDrone.drone_id, "busy", selectedDrone.battery || selectedDrone.battery_capacity || 100);
      }

      updateState((current) => {
        const next = safeClone(current);
        const order = next.orders.find(o => o.id === selectedOrder.id);
        if (order) {
            order.status = orderStatus;
            order.dss_decision = dss_decision;
            order.reason = reason;
            order.assigned_drone_id = action === "reject" ? null : selectedDrone.drone_id;
            order.timeline = updatedTimeline;
        }
        if (action !== "reject" && selectedDrone) {
            const drone = next.drones.find(d => d.drone_id === selectedDrone.drone_id);
            if (drone) {
                drone.status = "busy";
            }
        }
        next.auditLogs.unshift({
            id: Date.now(),
            action: `Order ${selectedOrder.id} ${actionLabel}`,
            actor: "dispatcher",
            detail: action === "reject" ? selectedOrder.client_name : `Drone ${selectedDrone.name}`,
            at: new Date().toISOString(),
        });
        return next;
      });

      notify(`Order ${selectedOrder.id} ${action} action saved.`, "success");
    } catch (err) {
      notify(`Failed to ${action} order.`, "error");
    }
  }

  async function saveAdminSettings() {
    try {
      const result = await updateAdminStatus({
        busy_day: busyDay,
        system_status: admin.system_status || "active",
      });
      updateState((current) => {
        const next = safeClone(current);
        next.admin = result;
        next.auditLogs.unshift({
            id: Date.now(),
            action: "System settings updated",
            actor: "admin",
            detail: `busy_day=${result.busy_day}`,
            at: new Date().toISOString(),
        });
        return next;
      });
      notify("Admin settings updated.", "success");
    } catch (err) {
      notify("Failed to save admin settings.", "error");
    }
  }

  if (loading) return <CenteredShell message="Loading dashboard..." />;

  return (
    <div className="shell">
      {route !== ROUTES.login && route !== ROUTES.register && (
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
                {/* Customer: visible to all roles */}
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
                {/* Dispatcher & Admin only */}
                {["dispatcher", "admin"].includes(auth.role) && (
                  <NavButton
                    active={route === ROUTES.dispatcher}
                    onClick={() => navigateTo(ROUTES.dispatcher)}
                  >
                    Dispatcher
                  </NavButton>
                )}
                {["dispatcher", "admin"].includes(auth.role) && (
                  <NavButton
                    active={route === ROUTES.drones}
                    onClick={() => navigateTo(ROUTES.drones)}
                  >
                    Drones
                  </NavButton>
                )}
                {/* Admin only */}
                {auth.role === "admin" && (
                  <NavButton
                    active={route === ROUTES.admin}
                    onClick={() => navigateTo(ROUTES.admin)}
                  >
                    Admin
                  </NavButton>
                )}
                {auth.role === "admin" && (
                  <NavButton
                    active={route === ROUTES.audit}
                    onClick={() => navigateTo(ROUTES.audit)}
                  >
                    Audit
                  </NavButton>
                )}
                <NavButton onClick={refresh}>Refresh</NavButton>
                <NavButton onClick={signOut}>Sign out</NavButton>
              </>
            )}
          </nav>
        </header>
      )}

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
              can run with backend API. It is
              structured as a React single-page app with route-like screens.
            </p>
            <div className="mini-stats">
              <div className="mini-stat">
                <span>API mode</span>
                <strong>Live connected</strong>
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
                <Badge status="active">Live backend API</Badge>
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
                  System uses the real database backend without mock fallback.
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
      {/* Dispatcher & Admin only pages */}
      {route === ROUTES.dispatcher && (
        ["dispatcher", "admin"].includes(auth?.role)
          ? <DispatcherPage
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
          : <AccessDenied role={auth?.role} required="dispatcher or admin" navigate={navigateTo} />
      )}
      {route === ROUTES.drones && (
        ["dispatcher", "admin"].includes(auth?.role)
          ? <DronePage
              drones={drones}
              selectedDroneId={selectedDroneId}
              setSelectedDroneId={setSelectedDroneId}
            />
          : <AccessDenied role={auth?.role} required="dispatcher or admin" navigate={navigateTo} />
      )}
      {/* Admin only pages */}
      {route === ROUTES.admin && (
        auth?.role === "admin"
          ? <AdminPage
              admin={admin}
              busyDay={busyDay}
              onBusyDayChange={setBusyDay}
              onSave={saveAdminSettings}
            />
          : <AccessDenied role={auth?.role} required="admin" navigate={navigateTo} />
      )}
      {route === ROUTES.audit && (
        auth?.role === "admin"
          ? <AuditPage state={state} />
          : <AccessDenied role={auth?.role} required="admin" navigate={navigateTo} />
      )}

      <footer className="page-footer">
        Use <code>VITE_API_BASE_URL</code> to point the React app at another
        backend.
      </footer>
    </div>
  );
}

export default App;
