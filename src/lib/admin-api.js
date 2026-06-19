const BASE_URL_KEY = "admin.baseUrl";
const TOKEN_KEY = "admin.token";
const DEFAULT_BASE_URL = "https://api.lemonbalmtrading.in/api/v1";
const ASSETS_BASE_URL = "https://assets.lemonbalmtrading.in/public/image";
const PDF_BASE_URL = "https://assets.lemonbalmtrading.in/public/pdfs";

export function getBaseUrl() {
  return localStorage.getItem(BASE_URL_KEY) || DEFAULT_BASE_URL;
}

export function setBaseUrl(url) {
  localStorage.setItem(BASE_URL_KEY, url.replace(/\/+$/, ""));
}

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

export function isAuthed() {
  return !!getToken();
}

export class ApiError extends Error {
  constructor(message, status, details) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

async function request(path, options = {}) {
  const { auth = true, query, headers, ...init } = options;
  const base = getBaseUrl().replace(/\/+$/, "");
  const url = new URL(base + path, window.location.origin);
  if (query) {
    Object.entries(query).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== "") url.searchParams.set(k, String(v));
    });
  }

  const finalHeaders = { Accept: "application/json", ...headers };
  if (auth) {
    const t = getToken();
    if (t) finalHeaders.Authorization = `Bearer ${t}`;
  }
  if (init.body && !(init.body instanceof FormData) && !finalHeaders["Content-Type"]) {
    finalHeaders["Content-Type"] = "application/json";
  }

  let res;
  try {
    res = await fetch(url.toString(), { ...init, headers: finalHeaders });
  } catch (e) {
    throw new ApiError(
      `Network error reaching ${base}. Check the API base URL in Settings.`,
      0,
    );
  }

  const text = await res.text();
  let json = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    /* non-json */
  }

  if (!res.ok) {
    const msg = json?.error?.explaination?.[0] ?? json?.message ?? "Something went wrong";
    if (res.status === 401) clearToken();
    throw new ApiError(msg, res.status, json?.error?.explaination);
  }

  if (json && typeof json === "object" && "data" in json) {
    return json.data;
  }
  return json;
}

export function imageUrl(path) {
  if (!path) return null;
  return `${ASSETS_BASE_URL}/${path.replace(/^\//, "")}`;
}

export function pdfUrl(path) {
  if (!path) return null;
  return `${PDF_BASE_URL}/${path.replace(/^\//, "")}`;
}

export const api = {
  // Auth
  login: (email, password) =>
    request("/admin/login", {
      method: "POST",
      auth: false,
      body: JSON.stringify({ email, password }),
    }),

  ping: async () => {
    const t = getToken();
    if (!t) return false;
    try {
      const res = await fetch("https://api.lemonbalmtrading.in/admin/ping", {
        headers: { Authorization: `Bearer ${t}` },
      });
      const json = await res.json();
      if (json.success === true) return true;
      if (json.success === false) return false;
      return null;
    } catch {
      return null;
    }
  },

  // Products
  listProducts: (params = {}) =>
    request("/products/admin", { method: "GET", query: params }),

  getProduct: (id) =>
    request(`/products/particular/${id}`, { method: "GET", auth: false }),

  createProduct: (form) =>
    request("/products", { method: "POST", body: form }),

  updateProduct: (id, form) =>
    request(`/products/${id}`, { method: "PUT", body: form }),

  deleteProduct: (id) =>
    request(`/products/${id}`, { method: "DELETE" }),

  // Orders
  listOrders: (params = {}) =>
    request("/orders/admin", { method: "GET", query: params }),

  getOrder: (id) =>
    request(`/orders/admin/${id}`, { method: "GET" }),

  updateOrderStatus: (id, status) =>
    request(`/orders/${id}/status`, {
      method: "PUT",
      body: JSON.stringify({ status }),
    }),

  generateInvoice: (id) =>
    request(`/orders/${id}/invoice`, { method: "PUT" }),

  // Users
  listUsers: (params = {}) =>
    request("/users/admin", { method: "GET", query: params }),

  getUser: (id) =>
    request(`/users/admin/${id}`, { method: "GET" }),

  updateUserStatus: (id, status) =>
    request(`/users/${id}/status`, {
      method: "PUT",
      body: JSON.stringify({ status }),
    }),

  // Admins
  listAdmins: (params = {}) =>
    request("/admin/list", { method: "GET", query: params }),

  updateAdmin: (id, body) =>
    request(`/admin/${id}`, { method: "PUT", body: JSON.stringify(body) }),

  updateAdminType: (id, type) =>
    request(`/admin/${id}/type`, {
      method: "PUT",
      body: JSON.stringify({ type }),
    }),

  updateAdminStatus: (id, status) =>
    request(`/admin/${id}/status`, {
      method: "PUT",
      body: JSON.stringify({ status }),
    }),

  // Leads
  listLeads: (params = {}) =>
    request("/leads/admin", { method: "GET", query: params }),

  // Settings
  getSettings: () =>
    request("/settings", { method: "GET" }),

  updateSettings: (form) =>
    request("/settings", { method: "PUT", body: form }),

  // Dashboard
  getDashboard: () =>
    request("/dashboard", { method: "GET" }),
};
