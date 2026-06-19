export const safeNumber = (value, fractionDigits = 1) =>
  Number(value ?? 0).toFixed(fractionDigits);

export function formatDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return String(value || "-");
  }
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export function tone(status) {
  const normalized = String(status || "").toLowerCase();
  if (["approved", "idle", "completed", "active"].includes(normalized))
    return "approved";
  if (["busy", "assigned", "charging"].includes(normalized)) return "busy";
  if (normalized === "pending") return "pending";
  if (["rejected", "offline", "maintenance", "failed"].includes(normalized))
    return "rejected";
  if (["warning", "low"].includes(normalized)) return "warning";
  return normalized || "active";
}

export function randomTelemetry(weight, distance, payloadType) {
  return {
    wind_speed: Number((4 + Math.random() * 9).toFixed(1)),
    battery_remaining: Math.round(70 + Math.random() * 28),
    actual_carry_weight: weight,
    payload_type: payloadType,
    altitude: 120,
    distance_flown: distance,
    gps_accuracy: Number((1 + Math.random() * 2).toFixed(1)),
    obstacles_encountered: Math.floor(Math.random() * 3),
  };
}
