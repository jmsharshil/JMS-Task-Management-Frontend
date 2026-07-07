// Thin API client with JWT handling.
const BASE = "/api";

export function getToken() { return localStorage.getItem("jms_token"); }
export function setToken(t) { t ? localStorage.setItem("jms_token", t) : localStorage.removeItem("jms_token"); }

async function request(path, { method = "GET", body, form } = {}) {
  const headers = {};
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body && !form) headers["Content-Type"] = "application/json";
  const res = await fetch(BASE + path, {
    method, headers,
    body: form ? body : body ? JSON.stringify(body) : undefined,
  });
  if (res.status === 401) { setToken(null); window.location.reload(); return; }
  const data = res.status === 204 ? null : await res.json().catch(() => null);
  if (!res.ok) throw new Error(data?.detail || `Request failed (${res.status})`);
  return data;
}

export const api = {
  login: (email, password) => request("/auth/login/", { method: "POST", body: { email, password } }),
  me: () => request("/auth/me/"),

  users: () => request("/auth/users/"),
  addUser: (u) => request("/auth/users/", { method: "POST", body: u }),
  delUser: (id) => request(`/auth/users/${id}/`, { method: "DELETE" }),

  clients: () => request("/clients/"),
  addClient: (c) => request("/clients/", { method: "POST", body: c }),
  delClient: (id) => request(`/clients/${id}/`, { method: "DELETE" }),

  dashboard: () => request("/dashboard/"),

  projects: () => request("/projects/"),
  project: (id) => request(`/projects/${id}/`),
  generatePlan: (formData) => request("/projects/generate-plan/", { method: "POST", body: formData, form: true }),
  createProject: (payload) => request("/projects/", { method: "POST", body: payload }),
  deleteProject: (id) => request(`/projects/${id}/`, { method: "DELETE" }),
  adjust: (id, formData) => request(`/projects/${id}/adjust/`, { method: "POST", body: formData, form: true }),
  report: (id, week) => request(`/projects/${id}/report/?week=${week}`),
  emailReport: (id, week) => request(`/projects/${id}/report/email/`, { method: "POST", body: { week } }),
  summary: (id) => request(`/projects/${id}/summary/`),
  gantt: (id) => request(`/projects/${id}/gantt/`),
  updates: (id) => request(`/projects/${id}/updates/`),
  postUpdate: (id, text) => request(`/projects/${id}/updates/`, { method: "POST", body: { text } }),

  tasks: (params = "") => request(`/tasks/${params}`),
  patchTask: (id, body) => request(`/tasks/${id}/`, { method: "PATCH", body }),
};
