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
  const url = path.startsWith("http") ? path : BASE + path;
  const res = await fetch(url, {
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

  dashboard: (category, naavyaType) => {
    let url = `/dashboard/?category=${category || "JMS"}`;
    if (category === "NAAVYA") url += `&project_type=${naavyaType || "VOICE"}`;
    return request(url);
  },

  projects: (params = "") => request(params.startsWith("http") ? params : `/projects/${params}`),
  project: (id) => request(`/projects/${id}/`),
  generatePlan: (formData) => request("/projects/generate-plan/", { method: "POST", body: formData, form: true }),
  createProject: (formData) => request("/projects/", { method: "POST", body: formData, form: true }),
  deleteProject: (id) => request(`/projects/${id}/`, { method: "DELETE" }),
  updateProject: (id, formData) => request(`/projects/${id}/`, { method: "PATCH", body: formData, form: true }),
  adjust: (id, formData) => request(`/projects/${id}/adjust/`, { method: "POST", body: formData, form: true }),
  generateArchitecture: (formData) => request("/projects/generate-architecture/", { method: "POST", body: formData, form: true }),
  approveArchitecture: (formData) => request("/projects/approve-architecture/", { method: "POST", body: formData, form: true }),
  shareLink: (id, params, body = null) => {
    if (body !== null) {
      return request(`/projects/${id}/share-link/`, { method: "POST", body });
    }
    return request(`/projects/${id}/share-link/?${new URLSearchParams(params).toString()}`);
  },
  report: (id, week) => request(`/projects/${id}/report/?week=${week}`),
  emailReport: (id, week, recipients = "", text = "") =>
    request(`/projects/${id}/report/email/`, { method: "POST", body: { week, email: recipients, text } }),
  reportPdf: async (id, week, projectName = "project", text = "") => {
    const token = getToken();
    const res = await fetch(`${BASE}/projects/${id}/report-pdf/?week=${week}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });
    if (!res.ok) throw new Error(`PDF generation failed (${res.status})`);
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${projectName.toLowerCase().replace(/\s+/g, "_")}_week${week}_report.pdf`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    URL.revokeObjectURL(url);
  },
  dailyReport: (id, date) => request(`/projects/${id}/daily-report/?date=${date}`),
  emailDailyReport: (id, date, recipients = "", text = "") =>
    request(`/projects/${id}/daily-report-email/`, { method: "POST", body: { date, email: recipients, text } }),
  dailyReportPdf: async (id, date, projectName = "project", text = "") => {
    const token = getToken();
    const res = await fetch(`${BASE}/projects/${id}/daily-report-pdf/?date=${date}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
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
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    URL.revokeObjectURL(url);
  },
  updates: (id) => request(`/projects/${id}/updates/`),
  postUpdate: (id, text) => request(`/projects/${id}/updates/`, { method: "POST", body: { text } }),

  tasks: (params = "") => request(params.startsWith("http") ? params : `/tasks/${params}`),
  patchTask: (id, body) => request(`/tasks/${id}/`, { method: "PATCH", body }),
  deleteTask: (id) => request(`/tasks/${id}/`, { method: "DELETE" }),

  docs: (projectId) => request(`/projects/${projectId}/documents/`),
  uploadDoc: (projectId, formData) =>
    request(`/projects/${projectId}/documents/`, { method: "POST", body: formData, form: true }),
  deleteDoc: (projectId, docId) =>
    request(`/projects/${projectId}/documents/${docId}/`, { method: "DELETE" }),

  // Ad-hoc tasks
  adhocTasks: (params = "") => request(params.startsWith("http") ? params : `/adhoc-tasks/${params}`),
  createAdhocTask: (formData) => request(`/adhoc-tasks/`, { method: "POST", body: formData, form: true }),
  patchAdhocTask: (id, body) => request(`/adhoc-tasks/${id}/`, { method: "PATCH", body }),
  deleteAdhocTask: (id) => request(`/adhoc-tasks/${id}/`, { method: "DELETE" }),
  adhocAttachments: (taskId) => request(`/adhoc-tasks/${taskId}/attachments/`),
  uploadAdhocAttachment: (taskId, formData) =>
    request(`/adhoc-tasks/${taskId}/attachments/`, { method: "POST", body: formData, form: true }),
  deleteAdhocAttachment: (taskId, attId) =>
    request(`/adhoc-tasks/${taskId}/attachments/?attachment_id=${attId}`, { method: "DELETE" }),

  // Custom Reports
  customReport: (id, fromDate, toDate) => request(`/projects/${id}/custom-report/?date_from=${fromDate}&date_to=${toDate}`),
  emailCustomReport: (id, fromDate, toDate, email, text) => request(`/projects/${id}/custom-report-email/`, { method: "POST", body: { date_from: fromDate, date_to: toDate, email, text } }),
  customReportPdf: async (id, fromDate, toDate, projectName = "project", text) => {
    const token = getToken();
    const res = await fetch(`${BASE}/projects/${id}/custom-report-pdf/?date_from=${fromDate}&date_to=${toDate}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });
    if (!res.ok) throw new Error(`PDF generation failed (${res.status})`);
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${projectName.toLowerCase().replace(/\s+/g, "_")}_${fromDate}_to_${toDate}_report.pdf`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    URL.revokeObjectURL(url);
  },

  // Milestones
  getMilestones: (projectId) => request(`/milestones/?project_id=${projectId}`),
  createMilestone: (data) => request("/milestones/", { method: "POST", body: data }),
  updateMilestone: (id, data) => request(`/milestones/${id}/`, { method: "PATCH", body: data }),
  deleteMilestone: (id) => request(`/milestones/${id}/`, { method: "DELETE" }),
  milestoneReportPdf: async (projectName, html) => {
    const token = getToken() || "";
    const res = await fetch(`${BASE}/milestone-report-pdf/`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ html, project_name: projectName }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.detail || `PDF generation failed (${res.status})`);
    }
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${projectName.replace(/\s+/g, "_")}_milestones.pdf`;
    a.click();
    URL.revokeObjectURL(url);
  },

  // MOMs
  moms: (projectId) => request(`/projects/${projectId}/moms/`),
  createMom: (projectId, body) => request(`/projects/${projectId}/moms/`, { method: "POST", body }),
  patchMom: (projectId, momId, body) => request(`/projects/${projectId}/moms/${momId}/`, { method: "PATCH", body }),
  deleteMom: (projectId, momId) => request(`/projects/${projectId}/moms/${momId}/`, { method: "DELETE" }),
  emailMom: (projectId, momId, email) => request(`/projects/${projectId}/moms/${momId}/email/`, { method: "POST", body: { email } }),
  momPdf: async (projectId, momId, title = "mom") => {
    const token = getToken();
    const res = await fetch(`${BASE}/projects/${projectId}/moms/${momId}/pdf/`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error(`PDF generation failed (${res.status})`);
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${title.toLowerCase().replace(/\s+/g, "_")}_mom.pdf`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    URL.revokeObjectURL(url);
  },

  // Additional Project Tasks
  extraTasks: (projectId) => request(`/projects/${projectId}/extra-tasks/`),
  createExtraTask: (projectId, body) => request(`/projects/${projectId}/extra-tasks/`, { method: "POST", body }),
  patchExtraTask: (projectId, taskId, body) => request(`/projects/${projectId}/extra-tasks/${taskId}/`, { method: "PATCH", body }),
  deleteExtraTask: (projectId, taskId) => request(`/projects/${projectId}/extra-tasks/${taskId}/`, { method: "DELETE" }),

  // Report Format Templates (per-project)
  getReportFormat: (projectId) => request(`/projects/${projectId}/report-format/`),
  saveReportFormat: (projectId, body) => request(`/projects/${projectId}/report-format/`, { method: "PATCH", body }),

  // Organization Settings
  getOrgSettings: () => request(`/org-settings/`),
  saveOrgSettings: (body) => request(`/org-settings/`, { method: "PATCH", body }),
};

