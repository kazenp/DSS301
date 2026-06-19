import React, { useEffect, useState } from "react";
import { Badge, Kpi, OrderDetail } from "./components";
import { ROUTES } from "./routes";
import { safeNumber, formatDate, tone, randomTelemetry } from "./utils";

export function HomePage({ navigate, auth, stats }) {
  const cards = [
    {
      title: "Customer pages",
      desc: "Request form, order history, order detail, timeline.",
      view: ROUTES.customer,
    },
    {
      title: "Dispatcher dashboard",
      desc: "Pending orders, model output, assignment actions.",
      view: ROUTES.dispatcher,
    },
    {
      title: "Monitoring views",
      desc: "Drone list, order monitoring, audit log, and system settings.",
      view: ROUTES.drones,
    },
  ];

  return (
    <section className="card" style={{ marginTop: 18 }}>
      <div className="row-between">
        <div>
          <h2>Frontend coverage</h2>
          <p className="muted">
            The app now exposes the major screens required in the work plan.
          </p>
        </div>
        <Badge status={auth?.role || "pending"}>{auth?.role || "guest"}</Badge>
      </div>
      <div className="kpi-grid" style={{ marginTop: 16 }}>
        <Kpi label="Orders in queue" value={stats.pending} />
        <Kpi label="Fleet active" value={stats.busy} />
        <Kpi label="Audit entries" value={stats.audit} />
        <Kpi label="Fallback ready" value="Yes" />
      </div>
      <div className="grid auto-fit" style={{ marginTop: 16 }}>
        {cards.map((card) => (
          <button
            key={card.title}
            className="surface"
            type="button"
            onClick={() => navigate(card.view)}
            style={{ textAlign: "left" }}
          >
            <h3>{card.title}</h3>
            <p className="muted">{card.desc}</p>
          </button>
        ))}
      </div>
    </section>
  );
}

export function LoginPage({ onSignIn, navigate }) {
  const [email, setEmail] = useState("customer@drones.dss");
  const [password, setPassword] = useState("password123");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Dynamically authorize the role based on the email content (for prototype convenience)
    let authenticatedRole = "customer";
    const lowerEmail = email.toLowerCase();
    
    if (lowerEmail.includes("admin")) {
      authenticatedRole = "admin";
    } else if (lowerEmail.includes("dispatcher") || lowerEmail.includes("staff")) {
      authenticatedRole = "dispatcher";
    }
    
    onSignIn(authenticatedRole);
  };

  const handleDemoFill = (demoEmail) => {
    setEmail(demoEmail);
    setPassword("password123");
  };

  return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", padding: "40px 0" }}>
      <section className="card" style={{ width: "100%", maxWidth: "450px", padding: "32px", border: "1px solid var(--line-strong)" }}>
        <div style={{ textAlign: "center", marginBottom: "24px" }}>
          <div className="brand-mark" style={{ margin: "0 auto 12px" }}>DD</div>
          <h2 style={{ fontSize: "1.6rem", color: "#ffffff" }}>Welcome Back</h2>
          <p className="muted" style={{ fontSize: "0.9rem" }}>Please sign in to access the DSS dashboard</p>
        </div>

        <form 
          onSubmit={handleSubmit} 
          className="form-grid" 
          style={{ gap: "16px" }}
        >
          <div className="field">
            <label>Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
              required
            />
          </div>

          <div className="field">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <label>Password</label>
              <button 
                type="button" 
                onClick={() => setShowPassword(!showPassword)}
                style={{ background: "none", border: "none", color: "var(--accent-2)", fontSize: "0.8rem", cursor: "pointer", padding: 0 }}
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.85rem", margin: "4px 0" }}>
            <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", color: "#cbd5e1" }}>
              <input 
                type="checkbox" 
                checked={rememberMe} 
                onChange={(e) => setRememberMe(e.target.checked)}
                style={{ cursor: "pointer", width: "16px", height: "16px", accentColor: "var(--accent)" }}
              />
              Remember me
            </label>
            <a href="#/login" onClick={(e) => { e.preventDefault(); alert("Demo password recovery: any password will work!"); }} style={{ color: "var(--accent-2)", fontWeight: "500" }}>
              Forgot password?
            </a>
          </div>

          <button 
            type="submit"
            className="btn" 
            style={{ width: "100%", marginTop: "8px", padding: "14px" }}
          >
            Sign In
          </button>
        </form>

        <div style={{ marginTop: "24px", borderTop: "1px solid var(--line)", paddingTop: "16px" }}>
          <p className="muted" style={{ marginBottom: "10px", fontWeight: "700", textTransform: "uppercase", fontSize: "0.75rem", letterSpacing: "0.05em", color: "var(--accent-2)" }}>Quick Demo Accounts</p>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <button type="button" onClick={() => handleDemoFill("customer@drones.dss")} style={{ background: "rgba(255,255,255,0.02)", border: "1px solid var(--line)", borderRadius: "8px", padding: "8px 12px", color: "#f8fafc", cursor: "pointer", textAlign: "left", display: "flex", justifyContent: "space-between", alignItems: "center", transition: "all 0.2s ease" }} className="demo-btn">
              <span style={{ fontWeight: "600" }}>Customer Portal</span>
              <code style={{ fontSize: "0.8rem", color: "var(--accent-2)" }}>customer@drones.dss</code>
            </button>
            <button type="button" onClick={() => handleDemoFill("dispatcher@drones.dss")} style={{ background: "rgba(255,255,255,0.02)", border: "1px solid var(--line)", borderRadius: "8px", padding: "8px 12px", color: "#f8fafc", cursor: "pointer", textAlign: "left", display: "flex", justifyContent: "space-between", alignItems: "center", transition: "all 0.2s ease" }} className="demo-btn">
              <span style={{ fontWeight: "600" }}>Dispatcher Panel</span>
              <code style={{ fontSize: "0.8rem", color: "var(--accent-2)" }}>dispatcher@drones.dss</code>
            </button>
            <button type="button" onClick={() => handleDemoFill("admin@drones.dss")} style={{ background: "rgba(255,255,255,0.02)", border: "1px solid var(--line)", borderRadius: "8px", padding: "8px 12px", color: "#f8fafc", cursor: "pointer", textAlign: "left", display: "flex", justifyContent: "space-between", alignItems: "center", transition: "all 0.2s ease" }} className="demo-btn">
              <span style={{ fontWeight: "600" }}>Admin Settings</span>
              <code style={{ fontSize: "0.8rem", color: "var(--accent-2)" }}>admin@drones.dss</code>
            </button>
          </div>
        </div>

        <div style={{ textAlign: "center", marginTop: "24px", fontSize: "0.85rem", color: "var(--muted)" }}>
          Don't have an account?{" "}
          <a href="#/login" onClick={(e) => { e.preventDefault(); navigate(ROUTES.register); }} style={{ color: "var(--accent-2)", fontWeight: "600" }}>
            Sign up
          </a>
        </div>
      </section>
    </div>
  );
}

export function RegisterPage({ navigate }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState("customer");
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      alert("Passwords do not match!");
      return;
    }
    
    // Simulate successful registration
    alert(`Registration successful for ${name} as ${role}! Please log in with your demo credentials.`);
    navigate(ROUTES.login);
  };

  return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", padding: "40px 0" }}>
      <section className="card" style={{ width: "100%", maxWidth: "450px", padding: "32px", border: "1px solid var(--line-strong)" }}>
        <div style={{ textAlign: "center", marginBottom: "24px" }}>
          <div className="brand-mark" style={{ margin: "0 auto 12px" }}>DD</div>
          <h2 style={{ fontSize: "1.6rem", color: "#ffffff" }}>Create Account</h2>
          <p className="muted" style={{ fontSize: "0.9rem" }}>Register a new account to access the DSS system</p>
        </div>

        <form onSubmit={handleSubmit} className="form-grid" style={{ gap: "16px" }}>
          <div className="field">
            <label>Full Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="John Doe"
              required
            />
          </div>

          <div className="field">
            <label>Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
              required
            />
          </div>

          <div className="field">
            <label>Desired Role / Account Type</label>
            <select value={role} onChange={(e) => setRole(e.target.value)}>
              <option value="customer">Customer Portal</option>
              <option value="dispatcher">Dispatcher Panel</option>
              <option value="admin">Admin Settings</option>
            </select>
            <p className="muted" style={{ fontSize: "0.75rem", marginTop: "4px" }}>
              * Tip: For prototype testing, make sure your email contains the keyword "admin" or "dispatcher" (e.g. jdoe_admin@drones.dss) to login with that role!
            </p>
          </div>

          <div className="field">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <label>Password</label>
              <button 
                type="button" 
                onClick={() => setShowPassword(!showPassword)}
                style={{ background: "none", border: "none", color: "var(--accent-2)", fontSize: "0.8rem", cursor: "pointer", padding: 0 }}
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>

          <div className="field">
            <label>Confirm Password</label>
            <input
              type={showPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>

          <button 
            type="submit"
            className="btn" 
            style={{ width: "100%", marginTop: "8px", padding: "14px" }}
          >
            Create Account
          </button>
        </form>

        <div style={{ textAlign: "center", marginTop: "24px", fontSize: "0.85rem", color: "var(--muted)" }}>
          Already have an account?{" "}
          <a href="#/login" onClick={(e) => { e.preventDefault(); navigate(ROUTES.login); }} style={{ color: "var(--accent-2)", fontWeight: "600" }}>
            Sign in
          </a>
        </div>
      </section>
    </div>
  );
}

export function CustomerPage({
  orders,
  orderForm,
  setOrderForm,
  onSubmit,
  onOpenOrders,
}) {
  const recent = orders.slice(0, 3);
  return (
    <section className="grid two-col" style={{ marginTop: 18 }}>
      <div className="card">
        <div className="card-header">
          <div>
            <h2>New request</h2>
            <p className="muted">
              Validation, DSS feedback, and backend-ready submit flow.
            </p>
          </div>
          <Badge status="pending">Customer</Badge>
        </div>
        <form
          className="form-grid two-col"
          onSubmit={onSubmit}
          style={{ marginTop: 16 }}
        >
          <label className="field">
            <span>Client name</span>
            <input
              value={orderForm.client_name}
              onChange={(e) =>
                setOrderForm({ ...orderForm, client_name: e.target.value })
              }
            />
          </label>
          <label className="field">
            <span>Destination</span>
            <input
              value={orderForm.destination}
              onChange={(e) =>
                setOrderForm({ ...orderForm, destination: e.target.value })
              }
            />
          </label>
          <label className="field">
            <span>Weight (kg)</span>
            <input
              type="number"
              value={orderForm.weight}
              onChange={(e) =>
                setOrderForm({ ...orderForm, weight: e.target.value })
              }
            />
          </label>
          <label className="field">
            <span>Distance (km)</span>
            <input
              type="number"
              value={orderForm.distance}
              onChange={(e) =>
                setOrderForm({ ...orderForm, distance: e.target.value })
              }
            />
          </label>
          <label className="field" style={{ gridColumn: "1 / -1" }}>
            <span>Payload type</span>
            <select
              value={orderForm.payload_type}
              onChange={(e) =>
                setOrderForm({ ...orderForm, payload_type: e.target.value })
              }
            >
              <option value="medical">Medical</option>
              <option value="food">Food</option>
              <option value="standard">Standard</option>
              <option value="fragile">Fragile</option>
            </select>
          </label>
          <button
            className="btn"
            type="submit"
            style={{ gridColumn: "1 / -1" }}
          >
            Submit request
          </button>
        </form>
      </div>
      <div className="grid" style={{ gap: 18 }}>
        <div className="card">
          <div className="row-between">
            <h2>Order history</h2>
            <button
              className="btn-secondary"
              onClick={onOpenOrders}
              type="button"
            >
              Open all
            </button>
          </div>
          <div className="stack" style={{ marginTop: 14 }}>
            {recent.map((order) => (
              <button
                key={order.id}
                className="surface"
                type="button"
                onClick={onOpenOrders}
                style={{ textAlign: "left" }}
              >
                <div className="row-between">
                  <strong>
                    #{order.id} · {order.client_name}
                  </strong>
                  <Badge status={order.status}>{order.status}</Badge>
                </div>
                <p className="muted">
                  {order.destination} · {safeNumber(order.distance)} km ·{" "}
                  {safeNumber(order.weight)} kg
                </p>
              </button>
            ))}
          </div>
        </div>
        <div className="card">
          <h2>Delivery status timeline</h2>
          <p className="muted">
            Open an order in the order view to see the full timeline and ETA.
          </p>
        </div>
      </div>
    </section>
  );
}

export function OrderPage({
  orders,
  selectedOrder,
  selectedOrderId,
  setSelectedOrderId,
}) {
  const [statusFilter, setStatusFilter] = useState("all");
  const filtered = orders.filter((order) =>
    statusFilter === "all" ? true : order.status === statusFilter,
  );
  const active =
    filtered.find((order) => order.id === Number(selectedOrderId)) ||
    selectedOrder ||
    filtered[0] ||
    null;

  useEffect(() => {
    if (active) {
      setSelectedOrderId(active.id);
    }
  }, [statusFilter]);

  return (
    <section className="grid two-col" style={{ marginTop: 18 }}>
      <div className="card">
        <div className="card-header">
          <div>
            <h2>Order monitoring</h2>
            <p className="muted">
              Filter by status and inspect the detail panel.
            </p>
          </div>
          <Badge status="active">Orders</Badge>
        </div>
        <div className="actions" style={{ marginTop: 12 }}>
          {["all", "pending", "approved", "assigned", "rejected"].map(
            (item) => (
              <button
                key={item}
                className={`chip ${statusFilter === item ? "active" : ""}`}
                onClick={() => setStatusFilter(item)}
                type="button"
              >
                {item}
              </button>
            ),
          )}
        </div>
        <div className="table-wrap" style={{ marginTop: 16 }}>
          <table className="table">
            <thead>
              <tr>
                <th>Client</th>
                <th>Destination</th>
                <th>Weight</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((order) => (
                <tr
                  key={order.id}
                  onClick={() => setSelectedOrderId(order.id)}
                  style={{ cursor: "pointer" }}
                >
                  <td>
                    <strong>#{order.id}</strong> {order.client_name}
                  </td>
                  <td>{order.destination}</td>
                  <td>{safeNumber(order.weight)} kg</td>
                  <td>
                    <Badge status={order.status}>{order.status}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <div className="card">
        <h2>Order detail</h2>
        {active ? (
          <OrderDetail order={active} />
        ) : (
          <div className="empty-state">No order selected.</div>
        )}
      </div>
    </section>
  );
}

export function DispatcherPage({
  admin,
  orders,
  drones,
  auditLogs,
  selectedOrder,
  selectedDrone,
  selectedOrderId,
  selectedDroneId,
  setSelectedOrderId,
  setSelectedDroneId,
  onEvaluate,
  onAssign,
  onToggleBusyDay,
  busyDay,
}) {
  const pending = orders.filter((order) => order.status === "pending");

  return (
    <section className="grid two-col" style={{ marginTop: 18 }}>
      <div className="grid" style={{ gap: 18 }}>
        <div className="card">
          <div className="card-header">
            <div>
              <h2>Dispatcher dashboard</h2>
              <p className="muted">
                Pending orders, drone availability, model output, and DSS
                recommendation.
              </p>
            </div>
            <Badge status="active">Live control</Badge>
          </div>
          <div className="kpi-grid" style={{ marginTop: 16 }}>
            <Kpi label="Pending" value={pending.length} />
            <Kpi
              label="Busy drones"
              value={
                (drones || []).filter((drone) => drone.status !== "idle").length
              }
            />
            <Kpi label="Audit events" value={(auditLogs || []).length} />
            <Kpi label="Busy day" value={busyDay ? "On" : "Off"} />
          </div>
          <label className="field" style={{ marginTop: 16 }}>
            <span>Busy day mode</span>
            <select
              value={busyDay ? "on" : "off"}
              onChange={(e) => onToggleBusyDay(e.target.value === "on")}
            >
              <option value="off">Off</option>
              <option value="on">On</option>
            </select>
          </label>
          <div className="actions" style={{ marginTop: 16 }}>
            <button className="btn" onClick={onEvaluate}>
              Evaluate selected order
            </button>
            <button
              className="btn-secondary"
              onClick={() => onAssign("assign")}
            >
              Assign
            </button>
            <button
              className="btn-secondary"
              onClick={() => onAssign("override")}
            >
              Override
            </button>
            <button className="btn-danger" onClick={() => onAssign("reject")}>
              Reject
            </button>
          </div>
        </div>

        <div className="card">
          <div className="row-between">
            <h2>Model and DSS result</h2>
            <Badge status={selectedOrder?.status || "pending"}>
              {selectedOrder?.status || "n/a"}
            </Badge>
          </div>
          {selectedOrder ? (
            <div className="grid" style={{ marginTop: 14 }}>
              <div className="surface">
                <strong>Order #{selectedOrder.id}</strong>
                <p className="muted">
                  {selectedOrder.client_name} · {selectedOrder.destination}
                </p>
                <p className="muted">
                  Weight {safeNumber(selectedOrder.weight)} kg · Distance{" "}
                  {safeNumber(selectedOrder.distance)} km
                </p>
              </div>
              <div className="surface">
                <strong>DSS recommendation</strong>
                <p className="muted">{selectedOrder.reason}</p>
                <p className="muted">
                  Risk score:{" "}
                  {selectedOrder.risk_score !== null
                    ? safeNumber(selectedOrder.risk_score, 2)
                    : "-"}
                </p>
              </div>
            </div>
          ) : (
            <div className="empty-state">
              Select an order to inspect the DSS output.
            </div>
          )}
        </div>

        <div className="card">
          <div className="row-between">
            <h2>Audit log</h2>
            <Badge status="active">system events</Badge>
          </div>
          <div className="stack" style={{ marginTop: 14 }}>
            {(auditLogs || []).slice(0, 6).map((log) => (
              <div key={log.id} className="surface">
                <div className="row-between">
                  <strong>{log.action}</strong>
                  <span className="muted">{formatDate(log.at)}</span>
                </div>
                <p className="muted">
                  {log.actor} · {log.detail}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid" style={{ gap: 18 }}>
        <div className="card">
          <div className="row-between">
            <h2>Orders</h2>
            <Badge status="pending">queue</Badge>
          </div>
          <div className="stack" style={{ marginTop: 14 }}>
            {(orders || []).map((order) => (
              <button
                key={order.id}
                className={`surface ${Number(selectedOrderId) === Number(order.id) ? "active-surface" : ""}`}
                type="button"
                onClick={() => setSelectedOrderId(order.id)}
                style={{ textAlign: "left" }}
              >
                <div className="row-between">
                  <strong>
                    #{order.id} · {order.client_name}
                  </strong>
                  <Badge status={order.status}>{order.status}</Badge>
                </div>
                <p className="muted">{order.destination}</p>
              </button>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="row-between">
            <h2>Drones</h2>
            <Badge status="active">fleet</Badge>
          </div>
          <div className="stack" style={{ marginTop: 14 }}>
            {(drones || []).map((drone) => (
              <button
                key={drone.drone_id}
                className={`surface ${Number(selectedDroneId) === Number(drone.drone_id) ? "active-surface" : ""}`}
                type="button"
                onClick={() => setSelectedDroneId(drone.drone_id)}
                style={{ textAlign: "left" }}
              >
                <div className="row-between">
                  <strong>{drone.name}</strong>
                  <Badge status={drone.status}>{drone.status}</Badge>
                </div>
                <p className="muted">
                  Battery {safeNumber(drone.battery)}% · Payload{" "}
                  {drone.current_payload ?? "none"} · {drone.location}
                </p>
              </button>
            ))}
          </div>
          <p className="muted" style={{ marginTop: 12 }}>
            Selected order: {selectedOrder ? `#${selectedOrder.id}` : "none"} ·
            Selected drone: {selectedDrone ? selectedDrone.name : "none"}
          </p>
        </div>
      </div>
    </section>
  );
}

export function DronePage({ drones, selectedDroneId, setSelectedDroneId }) {
  const selected =
    drones.find((drone) => drone.drone_id === Number(selectedDroneId)) ||
    drones[0] ||
    null;
  return (
    <section className="grid two-col" style={{ marginTop: 18 }}>
      <div className="card">
        <div className="row-between">
          <h2>Drone monitoring</h2>
          <Badge status="active">fleet view</Badge>
        </div>
        <div className="stack" style={{ marginTop: 14 }}>
          {(drones || []).map((item) => (
            <button
              key={item.drone_id}
              className="surface"
              type="button"
              onClick={() => setSelectedDroneId(item.drone_id)}
              style={{ textAlign: "left" }}
            >
              <div className="row-between">
                <strong>{item.name}</strong>
                <Badge status={item.status}>{item.status}</Badge>
              </div>
              <p className="muted">
                Battery {safeNumber(item.battery)}% · Payload{" "}
                {item.current_payload ?? "none"} · {item.location}
              </p>
            </button>
          ))}
        </div>
      </div>
      <div className="card">
        <div className="row-between">
          <h2>Drone detail</h2>
          <Badge status={selected?.status || "pending"}>
            {selected?.status || "n/a"}
          </Badge>
        </div>
        {selected ? (
          <div className="grid" style={{ marginTop: 14 }}>
            <div className="surface">
              <p>
                <strong>{selected.name}</strong>
              </p>
              <p className="muted">Location: {selected.location}</p>
              <p className="muted">Battery: {safeNumber(selected.battery)}%</p>
              <p className="muted">Max payload: {selected.max_payload} kg</p>
            </div>
            <div className="surface">
              <p>
                <strong>Warnings</strong>
              </p>
              <p className="muted">
                {selected.battery < 30 ? "Low battery warning" : "Operational"}
              </p>
            </div>
          </div>
        ) : (
          <div className="empty-state">Select a drone for details.</div>
        )}
      </div>
    </section>
  );
}

export function AdminPage({ admin, busyDay, onBusyDayChange, onSave }) {
  const [status, setStatus] = useState(admin.system_status || "active");

  useEffect(() => {
    setStatus(admin.system_status || "active");
  }, [admin.system_status]);

  return (
    <section className="grid two-col" style={{ marginTop: 18 }}>
      <div className="card">
        <div className="row-between">
          <h2>System settings</h2>
          <Badge status="active">admin</Badge>
        </div>
        <div className="form-grid" style={{ marginTop: 16 }}>
          <label className="field">
            <span>Busy day mode</span>
            <select
              value={busyDay ? "on" : "off"}
              onChange={(e) => onBusyDayChange(e.target.value === "on")}
            >
              <option value="off">Off</option>
              <option value="on">On</option>
            </select>
          </label>
          <label className="field">
            <span>System status</span>
            <select value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="active">Active</option>
              <option value="maintenance">Maintenance</option>
              <option value="paused">Paused</option>
            </select>
          </label>
          <button className="btn" onClick={onSave}>
            Save settings
          </button>
        </div>
      </div>
      <div className="card">
        <h2>Configuration notes</h2>
        <p className="muted">
          Busy day mode tightens DSS thresholds during peak hours.
        </p>
        <p className="muted">
          This prototype keeps a local fallback state and syncs to backend APIs
          when available.
        </p>
      </div>
    </section>
  );
}

export function AuditPage({ state }) {
  return (
    <section className="card" style={{ marginTop: 18 }}>
      <div className="row-between">
        <h2>Audit log</h2>
        <Badge status="active">system events</Badge>
      </div>
      <div className="timeline" style={{ marginTop: 16 }}>
        {(state.auditLogs || []).map((log) => (
          <div className="timeline-item" key={log.id}>
            <div className="timeline-dot" />
            <div className="timeline-content">
              <strong>{log.action}</strong>
              <p className="muted">
                {log.actor} · {log.detail}
              </p>
              <p className="muted">{formatDate(log.at)}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
