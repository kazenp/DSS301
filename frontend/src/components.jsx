import React from "react";
import { tone, formatDate } from "./utils";

export function Badge({ status, children }) {
  return (
    <span className={`status-pill ${tone(status)}`}>{children ?? status}</span>
  );
}

export function Kpi({ label, value }) {
  return (
    <div className="kpi">
      <span className="label">{label}</span>
      <span className="value">{value}</span>
    </div>
  );
}

export function NavButton({ children, active, onClick }) {
  return (
    <button
      type="button"
      className={`nav-link ${active ? "active" : ""}`}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

export function Toast({ toast }) {
  return (
    <div className="toast-container">
      <div className={`toast ${toast.type}`}>{toast.message}</div>
    </div>
  );
}

export function CenteredShell({ message }) {
  return (
    <div className="shell">
      <div className="card" style={{ marginTop: 18, textAlign: "center" }}>
        <h2>{message}</h2>
      </div>
    </div>
  );
}

export function OrderDetail({ order }) {
  return (
    <div className="stack">
      <div className="surface">
        <div className="row-between">
          <strong>Order #{order.id}</strong>
          <Badge status={order.status}>{order.status}</Badge>
        </div>
        <p className="muted">
          {order.client_name} · {order.destination}
        </p>
        <p className="muted">
          Weight {Number(order.weight ?? 0).toFixed(1)} kg · Distance{" "}
          {Number(order.distance ?? 0).toFixed(1)} km
        </p>
        <p className="muted">
          ETA: {order.eta_minutes ? `${order.eta_minutes} min` : "n/a"}
        </p>
      </div>
      <div className="surface">
        <strong>DSS summary</strong>
        <p className="muted">
          Risk score:{" "}
          {order.risk_score !== null && order.risk_score !== undefined
            ? Number(order.risk_score).toFixed(2)
            : "-"}
        </p>
        <p className="muted">{order.reason}</p>
      </div>
      <div className="timeline">
        {(order.timeline || []).map((step, index) => (
          <div className="timeline-item" key={index}>
            <div className="timeline-dot" />
            <div className="timeline-content">
              <strong>{step.label}</strong>
              <p className="muted">{formatDate(step.at)}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
