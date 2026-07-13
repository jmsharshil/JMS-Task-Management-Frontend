// Thin API client with JWT handling.
const BASE = (import.meta.env.VITE_API_BASE_URL || "/api").replace(/\/+$/, "");

export { BASE };
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
  team: async () => {
    const users = await request("/auth/users/");
    return users.filter(u => u.role === "DEVELOPER");
  },
  addUser: (u) => request("/auth/users/", { method: "POST", body: u }),
  delUser: (id) => request(`/auth/users/${id}/`, { method: "DELETE" }),
  resetPassword: (id, password) => request(`/auth/users/${id}/reset-password/`, { method: "POST", body: { password } }),
  changePassword: (old_password, new_password) => request("/auth/change-password/", { method: "POST", body: { old_password, new_password } }),

  clients: () => request("/clients/"),
  addClient: (c) => request("/clients/", { method: "POST", body: c }),
  delClient: (id) => request(`/clients/${id}/`, { method: "DELETE" }),

  dashboard: () => request("/dashboard/"),

  projects: () => request("/projects/"),
  project: (id) => request(`/projects/${id}/`),
  generatePlan: (formData) => request("/projects/generate-plan/", { method: "POST", body: formData, form: true }),
  createProject: (formData) => request("/projects/", { method: "POST", body: formData, form: true }),
  deleteProject: (id) => request(`/projects/${id}/`, { method: "DELETE" }),
  adjust: (id, formData) => request(`/projects/${id}/adjust/`, { method: "POST", body: formData, form: true }),
  report: (id, week) => request(`/projects/${id}/report/?week=${week}`),
  emailReport: (id, week) => request(`/projects/${id}/report/email/`, { method: "POST", body: { week } }),
  summary: (id) => request(`/projects/${id}/summary/`),
  gantt: (id) => request(`/projects/${id}/gantt/`),
  ganttPdf: async (id, projectName = "project") => {
  const token = getToken();
  const res = await fetch(`${BASE}/projects/${id}/gantt-pdf/`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    let message = `Couldn't generate the PDF (${res.status}).`;
    const contentType = res.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      const data = await res.json().catch(() => null);
      if (data?.detail) message = data.detail;
    }
    throw new Error(message);
  }
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${projectName.toLowerCase().replace(/\s+/g, "_")}_gantt_chart.pdf`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  },
  updates: (id) => request(`/projects/${id}/updates/`),
  postUpdate: (id, text) => request(`/projects/${id}/updates/`, { method: "POST", body: { text } }),

  tasks: (params = "") => request(`/tasks/${params}`),
  patchTask: (id, body) => request(`/tasks/${id}/`, { method: "PATCH", body }),

  docs: (projectId) => request(`/projects/${projectId}/documents/`),
  uploadDoc: (projectId, formData) =>
    request(`/projects/${projectId}/documents/`, { method: "POST", body: formData, form: true }),
  deleteDoc: (projectId, docId) =>
    request(`/projects/${projectId}/documents/${docId}/`, { method: "DELETE" }),

  // Report PDFs
  reportPdf: async (id, week, projectName = "project") => {
    const token = getToken();
    const res = await fetch(`${BASE}/projects/${id}/report-pdf/?week=${week}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error(`PDF generation failed (${res.status})`);
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${projectName.toLowerCase().replace(/\s+/g, "_")}_W${week}_report.pdf`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    URL.revokeObjectURL(url);
  },
  dailyReport: (id, date) => request(`/projects/${id}/daily-report/?date=${date}`),
  dailyReportPdf: async (id, date, projectName = "project") => {
    const token = getToken();
    const res = await fetch(`${BASE}/projects/${id}/daily-report-pdf/?date=${date}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error(`PDF generation failed (${res.status})`);
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${projectName.toLowerCase().replace(/\s+/g, "_")}_${date}_daily_report.pdf`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    URL.revokeObjectURL(url);
  },

  // Ad-hoc tasks
  adhocTasks: (params = "") => request(`/adhoc-tasks/${params}`),
  createAdhocTask: (formData) => request(`/adhoc-tasks/`, { method: "POST", body: formData, form: true }),
  patchAdhocTask: (id, body) => request(`/adhoc-tasks/${id}/`, { method: "PATCH", body }),
  deleteAdhocTask: (id) => request(`/adhoc-tasks/${id}/`, { method: "DELETE" }),
  adhocAttachments: (taskId) => request(`/adhoc-tasks/${taskId}/attachments/`),
  uploadAdhocAttachment: (taskId, formData) =>
    request(`/adhoc-tasks/${taskId}/attachments/`, { method: "POST", body: formData, form: true }),
  deleteAdhocAttachment: (taskId, attId) =>
    request(`/adhoc-tasks/${taskId}/attachments/?attachment_id=${attId}`, { method: "DELETE" }),
};
