export const STORAGE_KEYS = {
  auth: "dss.auth",
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
