export const ROUTES = {
  home: "home",
  login: "login",
  register: "register",
  customer: "customer",
  orders: "orders",
  dispatcher: "dispatcher",
  drones: "drones",
  admin: "admin",
  audit: "audit",
};

export function currentRoute() {
  const raw = window.location.hash.replace(/^#\/?/, "").replace(/^\//, "");
  return raw || ROUTES.home;
}

export function navigate(route) {
  window.location.hash = `#/${route}`;
}
