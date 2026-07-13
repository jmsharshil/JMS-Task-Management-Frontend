import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  Users, Briefcase, FolderKanban, LayoutDashboard, Plus, Trash2, ChevronRight, ChevronDown,
  CheckCircle2, Circle, FileText, Loader2, Mail, Copy, Download, ArrowLeft,
  RefreshCw, LogOut, X, AlertTriangle, Sparkles, BarChart3, Megaphone,
  SlidersHorizontal, Bot, MessageSquare, Paperclip, UploadCloud, Eye
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  PieChart, Pie, Cell, Legend
} from "recharts";
import { api, getToken, setToken } from "./api";

const RED = "#D6222A", INK = "#1A1D23", GREEN = "#178A50";
const MODULE_COLORS = ["#D6222A", "#1D6FB8", "#178A50", "#B8860B", "#7A3FB8", "#C25A1E", "#0F8A8A", "#8A0F55", "#5A6B1E", "#3F51B5", "#996633", "#607D8B"];

const fmt = (iso) => new Date(iso + "T00:00:00").toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
const fmtLong = (iso) => new Date(iso + "T00:00:00").toLocaleDateString("en-IN", { weekday: "short", day: "2-digit", month: "short", year: "numeric" });
const todayISO = () => new Date().toISOString().slice(0, 10);

/* ---------- shared UI ---------- */
const Btn = ({ children, onClick, kind = "primary", disabled, className = "", small, type = "button" }) => {
  const base = `f-disp font-semibold rounded-md transition-colors inline-flex items-center gap-2 ${small ? "px-3 py-1.5 text-xs" : "px-4 py-2.5 text-sm"} disabled:opacity-40 disabled:cursor-not-allowed `;
  const kinds = {
    primary: "text-white", ghost: "text-gray-700 bg-gray-100 hover:bg-gray-200",
    danger: "text-red-700 bg-red-50 hover:bg-red-100", outline: "border border-gray-300 text-gray-800 hover:bg-gray-50",
  };
  return (
    <button type={type} onClick={onClick} disabled={disabled} className={base + kinds[kind] + " " + className}
      style={kind === "primary" ? { background: RED } : {}}>{children}</button>
  );
};
const Input = (props) => (
  <input {...props} className={"f-body w-full border border-gray-300 rounded-md px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-200 focus:border-red-400 bg-white " + (props.className || "")} />
);
const Label = ({ children }) => <label className="f-disp block text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1.5">{children}</label>;
const Card = ({ children, className = "", onClick }) => <div onClick={onClick} className={"bg-white border border-gray-200 rounded-lg " + className}>{children}</div>;
const ProgressBar = ({ pct }) => (
  <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
    <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: pct === 100 ? GREEN : RED }} />
  </div>
);
const Modal = ({ title, onClose, children, wide }) => (
  <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={onClose}>
    <div className={`bg-white rounded-lg shadow-xl w-full ${wide ? "max-w-3xl" : "max-w-lg"} max-h-[85vh] overflow-y-auto`} onClick={e => e.stopPropagation()}>
      <div className="rail flex items-center justify-between px-5 py-3.5 border-b border-gray-200 sticky top-0 bg-white rounded-t-lg">
        <h3 className="f-disp font-bold">{title}</h3>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-700"><X size={18} /></button>
      </div>
      <div className="p-5">{children}</div>
    </div>
  </div>
);
const Spinner = ({ text }) => (
  <div className="py-8 text-center text-gray-400 text-sm">
    <Loader2 className="animate-spin mx-auto mb-2" size={20} style={{ color: RED }} /> {text}
  </div>
);

/* ================= ROOT ================= */
export default function App() {
  const [me, setMe] = useState(null);
  const [booting, setBooting] = useState(true);

  useEffect(() => {
    (async () => {
      if (getToken()) {
        try { setMe(await api.me()); } catch { setToken(null); }
      }
      setBooting(false);
    })();
  }, []);

  const signOut = () => { setToken(null); setMe(null); };

  if (booting) return <div className="f-body min-h-screen bg-gray-50 flex items-center justify-center text-gray-400"><Loader2 className="animate-spin mr-2" size={18} /> Loading…</div>;
  if (!me) return <Login onLogin={setMe} />;
  return (
    <div className="f-body min-h-screen bg-gray-50 text-gray-900">
      {me.role === "ADMIN" ? <AdminShell me={me} signOut={signOut} /> : <DevShell me={me} signOut={signOut} />}
    </div>
  );
}

/* ================= LOGIN ================= */
function Login({ onLogin }) {
  const [email, setEmail] = useState(""); const [password, setPassword] = useState("");
  const [err, setErr] = useState(""); const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault(); setErr(""); setBusy(true);
    try {
      const t = await api.login(email, password);
      setToken(t.access);
      onLogin(await api.me());
    } catch { setErr("Incorrect email or password."); }
    setBusy(false);
  };

  return (
    <div className="f-body min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <form onSubmit={submit} className="rail bg-white border border-gray-200 rounded-lg p-8 w-full max-w-md">
        <div className="f-disp text-xs font-bold tracking-widest uppercase" style={{ color: RED }}>JMS Tech</div>
        <h1 className="f-disp text-3xl font-bold mt-1 mb-1" style={{ color: INK }}>Delivery Hub</h1>
        <p className="text-sm text-gray-500 mb-6">Projects · daily tasks · Gantt · weekly reports</p>
        <div className="space-y-3">
          <div><Label>Email</Label><Input type="email" value={email} onChange={e => setEmail(e.target.value)} autoFocus /></div>
          <div><Label>Password</Label><Input type="password" value={password} onChange={e => setPassword(e.target.value)} /></div>
          {err && <p className="text-xs text-red-600">{err}</p>}
          <Btn type="submit" disabled={busy}>{busy ? <Loader2 className="animate-spin" size={15} /> : null} Sign in</Btn>
        </div>
      </form>
    </div>
  );
}

/* ================= AD-HOC TASKS ================= */
function AdHocTasksTab({ me, isAdmin }) {
  const [data, setData] = useState(null);
  const [team, setTeam] = useState([]);
  const [filterUser, setFilterUser] = useState("");
  const [showModal, setShowModal] = useState(false);

  const load = async (url = "") => {
    let q = url;
    if (!url && isAdmin && filterUser) q = `?assignee=${filterUser}`;
    const [t, tm] = await Promise.all([
      api.adhocTasks(q),
      isAdmin && !team.length ? api.team() : Promise.resolve(team)
    ]);
    setData(t);
    if (isAdmin && !team.length) setTeam(tm);
  };
  useEffect(() => { load(); }, [isAdmin, filterUser]);
  const tasks = data ? (data.results || data) : null;
  const toggle = async (task) => {
    const next = task.status === "DONE" ? "TODO" : "DONE";
    const updatedTasks = tasks.map(t => t.id === task.id ? { ...t, status: next } : t);
    if (data.results) setData({ ...data, results: updatedTasks });
    else setData(updatedTasks);
    await api.patchAdhocTask(task.id, { status: next });
  };
  const saveComment = async (taskId, comment) => {
    const updatedTasks = tasks.map(t => t.id === taskId ? { ...t, comment } : t);
    if (data.results) setData({ ...data, results: updatedTasks });
    else setData(updatedTasks);
    await api.patchAdhocTask(taskId, { comment });
  };
  const removeTask = async (id) => {
    if (!confirm("Delete this task?")) return;
    await api.deleteAdhocTask(id);
    load();
  };

  if (!tasks) return <Spinner text="Loading tasks…" />;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="f-disp font-bold text-lg">Ad-Hoc Tasks</h2>
        {isAdmin && (
          <div className="flex gap-2">
            <select value={filterUser} onChange={e => setFilterUser(e.target.value)} className="f-body text-xs border border-gray-300 rounded-md px-2 bg-white">
              <option value="">All team members</option>
              {team.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
            <Btn small onClick={() => setShowModal(true)}><Plus size={13} /> Assign Task</Btn>
          </div>
        )}
      </div>
      <div className="space-y-3">
        {tasks.map(t => (
          <AdHocTaskRow key={t.id} t={t} isAdmin={isAdmin} onToggle={toggle} onComment={saveComment} onDelete={() => removeTask(t.id)} />
        ))}
        {tasks.length === 0 && <Card className="p-8 text-center text-gray-400 text-sm">No ad-hoc tasks found.</Card>}
      </div>
      {(data.next || data.previous) && (
        <div className="flex items-center justify-between mt-4">
          <Btn kind="outline" small disabled={!data.previous} onClick={() => load(data.previous)}>Previous</Btn>
          <Btn kind="outline" small disabled={!data.next} onClick={() => load(data.next)}>Next</Btn>
        </div>
      )}

      {showModal && <NewAdHocTaskModal team={team} onClose={() => setShowModal(false)} onSaved={() => { setShowModal(false); load(); }} />}
    </div>
  );
}

function AdHocTaskRow({ t, isAdmin, onToggle, onComment, onDelete }) {
  const [expanded, setExpanded] = useState(false);
  const [commentText, setCommentText] = useState(t.comment || "");

  const handleSave = () => {
    if (t.comment !== commentText) onComment(t.id, commentText);
    setExpanded(false);
  };

  return (
    <Card className="overflow-hidden">
      <div className="flex items-start gap-3 px-4 py-3 hover:bg-gray-50 group">
        <button onClick={() => onToggle(t)} className="mt-0.5 shrink-0">
          {t.status === "DONE" ? <CheckCircle2 size={18} className="text-green-600" /> : <Circle size={18} className="text-gray-300 hover:text-gray-500" />}
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className={`f-disp font-semibold text-sm ${t.status === "DONE" ? "line-through text-gray-400" : ""}`}>{t.title}</span>
            {t.priority === 'URGENT' && <span className="text-[10px] bg-red-100 text-red-700 px-1.5 py-0.5 rounded font-bold">URGENT</span>}
            {t.priority === 'HIGH' && <span className="text-[10px] bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded font-bold">HIGH</span>}
          </div>
          {t.description && <p className="text-xs text-gray-600 mb-2">{t.description}</p>}

          <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-gray-500">
            {isAdmin ? (
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="mr-0.5">Assignees:</span>
                {t.assignees_detail?.map(u => (
                  <span key={u.id} className="bg-indigo-50 text-indigo-700 border border-indigo-100 px-2 py-0.5 rounded-full text-[10px] font-semibold tracking-wide">
                    {u.name}
                  </span>
                ))}
              </div>
            ) : <span>From: <b>{t.created_by_name}</b></span>}
            <span className="flex items-center">Due: {t.due_date ? new Date(t.due_date).toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }) : "—"}</span>
            {t.attachments?.length > 0 && (
              <div className="flex items-center gap-1">
                <Paperclip size={10} />
                {t.attachments.map(a => (
                  <a key={a.id} href={a.file_url} target="_blank" rel="noreferrer" className="text-indigo-600 hover:underline">{a.title}</a>
                ))}
              </div>
            )}
          </div>

          {t.comment && !expanded && (
            <div className="text-[11px] text-gray-500 mt-2 p-2 bg-gray-50 rounded border border-gray-100 flex items-start gap-1.5">
              <MessageSquare size={12} className="shrink-0 mt-0.5 text-gray-400" />
              <span className="whitespace-pre-wrap">{t.comment}</span>
            </div>
          )}
        </div>
        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={() => { setCommentText(t.comment || ""); setExpanded(!expanded); }} className="text-gray-400 hover:text-indigo-600" title="Comment"><MessageSquare size={15} /></button>
          {isAdmin && <button onClick={onDelete} className="text-gray-400 hover:text-red-600" title="Delete"><Trash2 size={15} /></button>}
        </div>
      </div>

      {expanded && (
        <div className="bg-indigo-50/30 border-t border-gray-100 px-4 py-3">
          <div className="flex gap-2">
            <textarea
              value={commentText}
              onChange={e => setCommentText(e.target.value)}
              placeholder="Add a comment, status update, or blockers..."
              className="f-body flex-1 text-sm bg-white border border-gray-300 rounded-md p-2 focus:outline-none focus:border-indigo-400"
              rows={2}
              autoFocus
            />
            <div className="flex flex-col gap-2 shrink-0 justify-end">
              <Btn small onClick={handleSave}>Save note</Btn>
              <Btn small kind="ghost" onClick={() => setExpanded(false)}>Cancel</Btn>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}

function MultiSelectDropdown({ options, selected, onChange }) {
  const [open, setOpen] = useState(false);
  const selectedNames = options.filter(o => selected.includes(String(o.id))).map(o => o.name);
  const containerRef = useRef(null);

  useEffect(() => {
    const handleClick = (e) => { if (containerRef.current && !containerRef.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div className="relative" ref={containerRef}>
      <div 
        className="f-body w-full border border-gray-300 rounded-md px-3 py-2 text-sm bg-white cursor-pointer flex justify-between items-center"
        onClick={() => setOpen(!open)}
      >
        <div className="truncate text-gray-700 pr-2">
          {selectedNames.length > 0 ? selectedNames.join(", ") : <span className="text-gray-400">Select assignees...</span>}
        </div>
        <ChevronDown size={14} className="text-gray-400 shrink-0" />
      </div>
      {open && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-48 overflow-y-auto">
          {options.map(t => (
            <label key={t.id} className="flex items-center gap-2 px-3 py-2 hover:bg-gray-50 cursor-pointer border-b border-gray-50 last:border-0">
              <input type="checkbox" checked={selected.includes(String(t.id))} onChange={e => {
                const checked = e.target.checked;
                const idStr = String(t.id);
                onChange(checked ? [...selected, idStr] : selected.filter(id => id !== idStr));
              }} className="text-red-600 focus:ring-red-500 rounded border-gray-300" />
              <span className="text-sm text-gray-800">{t.name}</span>
            </label>
          ))}
        </div>
      )}
    </div>
  );
}

function NewAdHocTaskModal({ team, onClose, onSaved }) {
  const nowLocal = () => { const d = new Date(); d.setHours(18, 0, 0, 0); return d.toISOString().slice(0, 16); };
  const [form, setForm] = useState({ title: "", description: "", assignees: [String(team[0]?.id || "")], priority: "MEDIUM", due_date: nowLocal() });
  const [files, setFiles] = useState([]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const fileRef = useRef(null);

  const save = async () => {
    setErr("");
    if (!form.title.trim()) return setErr("Title is required.");
    if (!form.assignees || form.assignees.length === 0 || !form.assignees[0]) return setErr("At least one assignee is required.");
    setBusy(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => {
        if (k === "assignees") {
          v.forEach(id => {
            if (id) fd.append("assignees", id);
          });
        } else {
          fd.append(k, v);
        }
      });
      Array.from(files).forEach(f => fd.append("files", f));
      await api.createAdhocTask(fd);
      onSaved();
    } catch (e) { setErr(e.message); setBusy(false); }
  };

  return (
    <Modal title="Assign new ad-hoc task" onClose={onClose}>
      <div className="space-y-3">
        <div><Label>Title *</Label><Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} autoFocus /></div>
        <div><Label>Description</Label><textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={2} className="f-body w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-200" /></div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>Assignees *</Label>
            <MultiSelectDropdown 
              options={team} 
              selected={form.assignees} 
              onChange={assignees => setForm({ ...form, assignees })} 
            />
          </div>
          <div>
            <Label>Priority</Label>
            <select value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })} className="f-body w-full border border-gray-300 rounded-md px-3 py-2.5 text-sm bg-white">
              <option value="LOW">Low</option><option value="MEDIUM">Medium</option><option value="HIGH">High</option><option value="URGENT">Urgent</option>
            </select>
          </div>
        </div>
        <div><Label>Due Date & Time *</Label><Input type="datetime-local" value={form.due_date} onChange={e => setForm({ ...form, due_date: e.target.value })} /></div>
        <div>
          <Label>Attachments</Label>
          <input ref={fileRef} type="file" multiple className="hidden" onChange={e => setFiles(e.target.files)} />
          <div className="flex items-center gap-2">
            <Btn kind="outline" small onClick={() => fileRef.current?.click()}><Paperclip size={13} /> Select files</Btn>
            {files.length > 0 && <span className="text-xs text-gray-500">{files.length} file(s) selected</span>}
          </div>
        </div>
        {err && <p className="text-xs text-red-600">{err}</p>}
        <div className="flex gap-2 pt-2">
          <Btn onClick={save} disabled={busy}>{busy ? <Loader2 size={13} className="animate-spin" /> : "Assign Task"}</Btn>
          <Btn kind="ghost" onClick={onClose}>Cancel</Btn>
        </div>
      </div>
    </Modal>
  );
}

/* ================= CHANGE PASSWORD ================= */
function ChangePasswordModal({ onClose }) {
  const [form, setForm] = useState({ old_password: "", new_password: "", confirm: "" });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [done, setDone] = useState(false);

  const submit = async () => {
    setErr("");
    if (form.new_password.length < 6) return setErr("New password must be at least 6 characters.");
    if (form.new_password !== form.confirm) return setErr("Passwords do not match.");
    setBusy(true);
    try {
      await api.changePassword(form.old_password, form.new_password);
      setDone(true);
    } catch (e) { setErr(e.message); }
    setBusy(false);
  };

  return (
    <Modal title="Change Password" onClose={onClose}>
      {done ? (
        <div className="text-center py-4">
          <CheckCircle2 size={36} className="mx-auto mb-3 text-green-500" />
          <p className="f-disp font-semibold">Password changed successfully!</p>
          <p className="text-xs text-gray-500 mt-1">Use your new password the next time you sign in.</p>
          <Btn className="mt-4" onClick={onClose}>Close</Btn>
        </div>
      ) : (
        <div className="space-y-4">
          <div>
            <Label>Current password</Label>
            <Input type="password" value={form.old_password} onChange={e => setForm({ ...form, old_password: e.target.value })} autoFocus />
          </div>
          <div>
            <Label>New password</Label>
            <Input type="password" value={form.new_password} onChange={e => setForm({ ...form, new_password: e.target.value })} placeholder="Min. 6 characters" />
          </div>
          <div>
            <Label>Confirm new password</Label>
            <Input type="password" value={form.confirm} onChange={e => setForm({ ...form, confirm: e.target.value })} />
          </div>
          {err && <p className="text-xs text-red-600">{err}</p>}
          <div className="flex gap-2 pt-1">
            <Btn onClick={submit} disabled={busy}>
              {busy ? <Loader2 size={13} className="animate-spin" /> : "Change Password"}
            </Btn>
            <Btn kind="ghost" onClick={onClose}>Cancel</Btn>
          </div>
        </div>
      )}
    </Modal>
  );
}

/* ================= ADMIN ================= */
function AdminShell({ me, signOut }) {
  const [tab, setTab] = useState("dashboard");
  const [openId, setOpenId] = useState(null);
  const tabs = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "projects", label: "Projects", icon: FolderKanban },
    { id: "tasks", label: "Tasks", icon: CheckCircle2 },
    { id: "team", label: "Team", icon: Users },
    { id: "clients", label: "Clients", icon: Briefcase },
  ];
  const [showChangePwd, setShowChangePwd] = useState(false);
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
      <header className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2.5">
          <img src="https://hrmsknowcraftstorage.blob.core.windows.net/media/JMS.png" alt="JMS" style={{ height: 36, width: "auto", objectFit: "contain" }} />
          <div>
            <h1 className="f-disp text-xl font-bold leading-tight" style={{ color: INK }}>Delivery Hub</h1>
            <div className="f-disp text-[10px] font-bold tracking-widest uppercase leading-none" style={{ color: RED }}>JMS Tech</div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => setShowChangePwd(true)} className="text-xs text-gray-500 hover:text-gray-800 inline-flex items-center gap-1" title="Change password">
            <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="16" r="1"/><rect x="3" y="10" width="18" height="12" rx="2"/><path d="M7 10V7a5 5 0 0 1 10 0v3"/></svg>
            Change Password
          </button>
          <button onClick={signOut} className="text-xs text-gray-500 hover:text-gray-800 inline-flex items-center gap-1"><LogOut size={13} /> Sign out</button>
        </div>
      </header>
      {showChangePwd && <ChangePasswordModal onClose={() => setShowChangePwd(false)} />}
      <nav className="flex gap-1 mb-6 border-b border-gray-200">
        {tabs.map(t => (
          <button key={t.id} onClick={() => { setTab(t.id); setOpenId(null); }}
            className={`f-disp text-sm font-semibold px-4 py-2.5 -mb-px border-b-2 inline-flex items-center gap-2 whitespace-nowrap ${tab === t.id ? "" : "border-transparent text-gray-500 hover:text-gray-800"}`}
            style={tab === t.id ? { color: RED, borderColor: RED } : {}}>
            <t.icon size={15} /> {t.label}
          </button>
        ))}
      </nav>
      {tab === "dashboard" && <Dashboard onOpen={(id) => { setTab("projects"); setOpenId(id); }} />}
      {tab === "tasks" && <AdHocTasksTab me={me} isAdmin={true} />}
      {tab === "team" && <TeamTab />}
      {tab === "clients" && <ClientsTab />}
      {tab === "projects" && (openId
        ? <ProjectDetail projectId={openId} onBack={() => setOpenId(null)} />
        : <ProjectsTab onOpen={setOpenId} />)}
    </div>
  );
}

/* ---------- Dashboard ---------- */
function Dashboard({ onOpen }) {
  const [data, setData] = useState(null);
  useEffect(() => { api.dashboard().then(setData); }, []);
  if (!data) return <Spinner text="Loading dashboard…" />;

  const { totals, projects, developers } = data;
  const grand = totals.done + totals.pending + totals.overdue;
  const pieData = [
    { name: "Done", value: totals.done, color: GREEN },
    { name: "Pending", value: totals.pending, color: "#D1D5DB" },
    { name: "Overdue", value: totals.overdue, color: RED },
  ].filter(d => d.value > 0);

  return (
    <div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          { n: projects.length, l: "Active projects" },
          { n: `${grand ? Math.round(totals.done / grand * 100) : 0}%`, l: "Overall completion" },
          { n: totals.overdue, l: "Overdue tasks", red: totals.overdue > 0 },
          { n: developers.length, l: "Developers on plans" },
        ].map((s, i) => (
          <Card key={i} className="p-4 rail">
            <div className="f-disp text-3xl font-bold" style={{ color: s.red ? RED : INK }}>{s.n}</div>
            <div className="text-xs text-gray-500 uppercase tracking-wide">{s.l}</div>
          </Card>
        ))}
      </div>

      {grand > 0 && (
        <div className="grid md:grid-cols-3 gap-4 mb-6">
          <Card className="p-4 md:col-span-2">
            <h3 className="f-disp font-bold text-sm mb-3">Completion by project</h3>
            <ResponsiveContainer width="100%" height={Math.max(160, projects.length * 52)}>
              <BarChart data={projects} layout="vertical" margin={{ left: 8, right: 24 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11 }} allowDecimals={false} />
                <YAxis type="category" dataKey="name" width={120} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="done" stackId="a" fill={GREEN} name="Done" />
                <Bar dataKey="pending" stackId="a" fill="#E5E7EB" name="Pending" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>
          <Card className="p-4">
            <h3 className="f-disp font-bold text-sm mb-3">All work status</h3>
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie data={pieData} dataKey="value" innerRadius={45} outerRadius={70} paddingAngle={2}>
                  {pieData.map((d, i) => <Cell key={i} fill={d.color} />)}
                </Pie>
                <Legend iconSize={9} wrapperStyle={{ fontSize: 11 }} />
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </Card>
        </div>
      )}

      {developers.length > 0 && (
        <Card className="p-4 mb-6">
          <h3 className="f-disp font-bold text-sm mb-3">Team workload (all projects)</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={developers} margin={{ right: 16 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
              <Tooltip />
              <Legend iconSize={9} wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="done" stackId="a" fill={GREEN} name="Done" />
              <Bar dataKey="pending" stackId="a" fill="#D1D5DB" name="Pending" />
              <Bar dataKey="overdue" stackId="a" fill={RED} name="Overdue" />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      )}

      <h2 className="f-disp font-bold text-lg mb-3">Project health</h2>
      {projects.length === 0 && <Card className="p-8 text-center text-gray-400 text-sm">No projects yet — create one from the Projects tab.</Card>}
      <div className="space-y-3">
        {projects.map(p => (
          <Card key={p.id} className="p-4 hover:border-red-300 cursor-pointer transition-colors" onClick={() => onOpen(p.id)}>
            <div className="flex items-center justify-between mb-2">
              <span className="f-disp font-bold">{p.name}</span>
              <span className="f-disp text-sm font-bold" style={{ color: p.pct === 100 ? GREEN : RED }}>{p.pct}%</span>
            </div>
            <ProgressBar pct={p.pct} />
            <div className="text-xs text-gray-400 mt-1.5">{p.done} of {p.total} tasks done</div>
          </Card>
        ))}
      </div>
    </div>
  );
}

/* ---------- Team ---------- */
function ResetPasswordModal({ user, onClose }) {
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [done, setDone] = useState(false);

  const submit = async () => {
    setErr("");
    if (password.length < 6) return setErr("Password must be at least 6 characters.");
    setBusy(true);
    try {
      await api.resetPassword(user.id, password);
      setDone(true);
    } catch (e) { setErr(e.message); }
    setBusy(false);
  };

  return (
    <Modal title={`Reset password — ${user.name}`} onClose={onClose}>
      {done ? (
        <div className="text-center py-4">
          <CheckCircle2 size={36} className="mx-auto mb-3 text-green-500" />
          <p className="f-disp font-semibold">Password reset successfully.</p>
          <p className="text-xs text-gray-500 mt-1">{user.name} will receive an email with the new credentials.</p>
          <Btn className="mt-4" onClick={onClose}>Close</Btn>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-sm text-gray-600">Enter a new password for <strong>{user.name}</strong>. They will receive an email notification with the new credentials.</p>
          <div>
            <Label>New password</Label>
            <Input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Min. 6 characters"
              autoFocus
            />
          </div>
          {err && <p className="text-xs text-red-600">{err}</p>}
          <div className="flex gap-2 pt-1">
            <Btn onClick={submit} disabled={busy}>
              {busy ? <Loader2 size={13} className="animate-spin" /> : "Reset Password"}
            </Btn>
            <Btn kind="ghost" onClick={onClose}>Cancel</Btn>
          </div>
        </div>
      )}
    </Modal>
  );
}

function TeamTab() {
  const [team, setTeam] = useState(null);
  const [form, setForm] = useState({ name: "", designation: "", email: "", phone: "", password: "" });
  const [err, setErr] = useState("");
  const [resetTarget, setResetTarget] = useState(null);
  const load = () => api.users().then(setTeam);
  useEffect(() => { load(); }, []);

  const add = async () => {
    setErr("");
    if (!form.name || !form.email || !form.password) { setErr("Name, email and a temporary password are required."); return; }
    try { await api.addUser({ ...form, role: "DEVELOPER" }); setForm({ name: "", designation: "", email: "", phone: "", password: "" }); load(); }
    catch (e) { setErr(e.message); }
  };

  if (!team) return <Spinner text="Loading team…" />;
  return (
    <div className="grid md:grid-cols-2 gap-6">
      <Card className="p-5">
        <h2 className="f-disp font-bold mb-1">Add developer</h2>
        <p className="text-xs text-gray-500 mb-4">They receive a welcome email with their login and can change the password later.</p>
        <div className="space-y-3">
          <div><Label>Name</Label><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. Hemish" /></div>
          <div><Label>Designation</Label><Input value={form.designation} onChange={e => setForm({ ...form, designation: e.target.value })} placeholder="e.g. Backend Lead" /></div>
          <div><Label>Email</Label><Input value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="name@jmstech.co" /></div>
          <div><Label>WhatsApp number (optional)</Label><Input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="+91XXXXXXXXXX" /></div>
          <div><Label>Temporary password</Label><Input value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} /></div>
          {err && <p className="text-xs text-red-600">{err}</p>}
          <Btn onClick={add}><Plus size={15} /> Add to team</Btn>
        </div>
      </Card>
      <div>
        <h2 className="f-disp font-bold mb-3">Team ({team.filter(t => t.role !== "ADMIN").length})</h2>
        <div className="space-y-2">
          {team.map(t => (
            <Card key={t.id} className="p-3.5 flex items-center justify-between">
              <div>
                <div className="f-disp font-semibold text-sm">{t.name} {t.role === "ADMIN" && <span className="text-[10px] text-white px-1.5 py-0.5 rounded ml-1" style={{ background: RED }}>ADMIN</span>}</div>
                <div className="text-xs text-gray-500">{t.designation || t.role} · {t.email}</div>
              </div>
              {t.role !== "ADMIN" && (
                <div className="flex gap-2">
                  <button onClick={() => setResetTarget(t)} className="text-gray-300 hover:text-indigo-500" title="Reset password">
                    <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="16" r="1"/><rect x="3" y="10" width="18" height="12" rx="2"/><path d="M7 10V7a5 5 0 0 1 10 0v3"/></svg>
                  </button>
                  <button onClick={async () => { if (confirm(`Remove ${t.name}?`)) { await api.delUser(t.id); load(); } }}
                    className="text-gray-300 hover:text-red-500"><Trash2 size={15} /></button>
                </div>
              )}
            </Card>
          ))}
        </div>
      </div>
      {resetTarget && <ResetPasswordModal user={resetTarget} onClose={() => setResetTarget(null)} />}
    </div>
  );
}

/* ---------- Clients ---------- */
function ClientsTab() {
  const [clients, setClients] = useState(null);
  const [form, setForm] = useState({ name: "", contact: "" });
  const load = () => api.clients().then(setClients);
  useEffect(() => { load(); }, []);

  if (!clients) return <Spinner text="Loading clients…" />;
  return (
    <div className="grid md:grid-cols-2 gap-6">
      <Card className="p-5">
        <h2 className="f-disp font-bold mb-4">Add client</h2>
        <div className="space-y-3">
          <div><Label>Company name</Label><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. Knowcraft Analytics" /></div>
          <div><Label>Contact (optional)</Label><Input value={form.contact} onChange={e => setForm({ ...form, contact: e.target.value })} placeholder="Name / email / phone" /></div>
          <Btn onClick={async () => { if (form.name) { await api.addClient(form); setForm({ name: "", contact: "" }); load(); } }}><Plus size={15} /> Add client</Btn>
        </div>
      </Card>
      <div>
        <h2 className="f-disp font-bold mb-3">Clients ({clients.length})</h2>
        <div className="space-y-2">
          {clients.map(c => (
            <Card key={c.id} className="p-3.5 flex items-center justify-between">
              <div>
                <div className="f-disp font-semibold text-sm">{c.name}</div>
                {c.contact && <div className="text-xs text-gray-500">{c.contact}</div>}
              </div>
              <button onClick={async () => { await api.delClient(c.id); load(); }} className="text-gray-300 hover:text-red-500"><Trash2 size={15} /></button>
            </Card>
          ))}
          {clients.length === 0 && <p className="text-sm text-gray-400">No clients yet.</p>}
        </div>
      </div>
    </div>
  );
}

/* ---------- Projects list + New ---------- */
function ProjectsTab({ onOpen }) {
  const [data, setData] = useState(null);
  const [creating, setCreating] = useState(false);
  const load = (url = "") => api.projects(url).then(setData);
  useEffect(() => { load(); }, []);

  if (creating) return <NewProject onDone={(p) => { setCreating(false); load(); if (p) onOpen(p.id); }} />;
  if (!data) return <Spinner text="Loading projects…" />;
  
  const projects = data.results || data;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="f-disp font-bold text-lg">Projects</h2>
        <Btn onClick={() => setCreating(true)}><Plus size={15} /> New project</Btn>
      </div>
      <div className="space-y-2">
        {projects.map(p => (
          <Card key={p.id} className="p-4 flex items-center justify-between hover:border-red-300 cursor-pointer" onClick={() => onOpen(p.id)}>
            <div>
              <div className="f-disp font-bold">{p.name}</div>
              <div className="text-xs text-gray-500 mt-0.5">
                {p.client_name || "—"} · {p.weeks} weeks · starts {fmt(p.start_date)} · Team: {p.team_detail.map(t => t.name).join(", ")} · {p.stats.pct}% done
              </div>
            </div>
            <ChevronRight size={16} className="text-gray-400" />
          </Card>
        ))}
        {projects.length === 0 && <Card className="p-8 text-center text-gray-400 text-sm">No projects yet. Click "New project" to create your first one.</Card>}
      </div>
      {(data.next || data.previous) && (
        <div className="flex items-center justify-between mt-4">
          <Btn kind="outline" small disabled={!data.previous} onClick={() => load(data.previous)}>Previous</Btn>
          <Btn kind="outline" small disabled={!data.next} onClick={() => load(data.next)}>Next</Btn>
        </div>
      )}
    </div>
  );
}

function NewProject({ onDone }) {
  const [team, setTeam] = useState([]); const [clients, setClients] = useState([]);
  const [form, setForm] = useState({ name: "", client: "", ref: "", start_date: todayISO(), weeks: 8, current_week: 1 });
  const [teamIds, setTeamIds] = useState([]);
  const [docText, setDocText] = useState(""); const [pdf, setPdf] = useState(null);
  const [phase, setPhase] = useState("form"); const [err, setErr] = useState("");
  const [draft, setDraft] = useState(null);
  const [newClient, setNewClient] = useState({ show: false, name: "", contact: "", saving: false });
  const fileRef = useRef(null);

  useEffect(() => {
    api.users().then(u => setTeam(u.filter(x => x.role !== "ADMIN")));
    api.clients().then(setClients);
  }, []);

  const saveNewClient = async () => {
    if (!newClient.name.trim()) return;
    setNewClient(s => ({ ...s, saving: true }));
    try {
      const c = await api.addClient({ name: newClient.name.trim(), contact: newClient.contact.trim() });
      setClients(prev => [...prev, c]);
      setForm(f => ({ ...f, client: c.id }));
      setNewClient({ show: false, name: "", contact: "", saving: false });
    } catch (e) {
      setNewClient(s => ({ ...s, saving: false }));
      setErr(e.message);
    }
  };

  const generate = async () => {
    setErr("");
    if (!form.name.trim()) return setErr("Give the project a name.");
    if (!teamIds.length) return setErr("Select at least one developer.");
    if (!docText.trim() && !pdf) return setErr("Upload the SOW/FDD (PDF, DOC or DOCX) or paste its scope text.");
    setPhase("generating");
    try {
      const fd = new FormData();
      fd.append("name", form.name); fd.append("start_date", form.start_date);
      fd.append("weeks", form.weeks); fd.append("team", teamIds.join(","));
      if (docText.trim()) fd.append("doc_text", docText);
      if (pdf) fd.append("sow_pdf", pdf);
      setDraft(await api.generatePlan(fd));
      setPhase("review");
    } catch (e) { setErr(e.message); setPhase("form"); }
  };

  const save = async () => {
    try {
      const fd = new FormData();
      fd.append("name", form.name);
      if (form.client) fd.append("client", form.client);
      fd.append("start_date", form.start_date);
      fd.append("weeks", form.weeks);
      fd.append("current_week", form.current_week);
      fd.append("team", teamIds.join(","));
      fd.append("brief", JSON.stringify(draft.brief));
      fd.append("rows", JSON.stringify(draft.rows));
      if (pdf) fd.append("sow_pdf", pdf);

      const p = await api.createProject(fd);
      onDone(p);
    } catch (e) { setErr(e.message); }
  };

  if (phase === "generating") return (
    <Card className="p-10 text-center">
      <Loader2 className="animate-spin mx-auto mb-4" size={28} style={{ color: RED }} />
      <div className="f-disp font-bold text-lg mb-1">Building your plan</div>
      <p className="text-sm text-gray-500">Reading the document and allocating one task per developer per working day. This can take a minute or two.</p>
    </Card>
  );
  if (phase === "review") return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div>
          <h2 className="f-disp font-bold text-lg">Review the generated plan</h2>
          <p className="text-xs text-gray-500">{draft.rows.length} tasks · edit any task or reassign it before publishing. Team is emailed on save.</p>
        </div>
        <div className="flex gap-2">
          <Btn kind="ghost" onClick={generate}><RefreshCw size={14} /> Regenerate</Btn>
          <Btn onClick={save}><CheckCircle2 size={15} /> Save & publish to team</Btn>
        </div>
      </div>
      {err && <p className="text-sm text-red-600 mb-3">{err}</p>}
      <DraftTable rows={draft.rows} team={team.filter(t => teamIds.includes(t.id))}
        onChange={(rows) => setDraft({ ...draft, rows })} />
    </div>
  );
  return (
    <Card className="p-6 max-w-2xl">
      <h2 className="f-disp font-bold text-lg mb-1">New project</h2>
      <p className="text-xs text-gray-500 mb-5">Upload the SOW / FDD, pick the team and timeline — the day-wise plan is generated for you.</p>
      <div className="space-y-4">
        <div><Label>Project name</Label><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. Knowcraft LMS" /></div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>Client</Label>
            {newClient.show ? (
              <div className="border border-gray-300 rounded-md p-3 bg-gray-50 space-y-2">
                <Input
                  placeholder="Client name *"
                  value={newClient.name}
                  onChange={e => setNewClient(s => ({ ...s, name: e.target.value }))}
                  autoFocus
                />
                <Input
                  placeholder="Contact (optional)"
                  value={newClient.contact}
                  onChange={e => setNewClient(s => ({ ...s, contact: e.target.value }))}
                />
                <div className="flex gap-2">
                  <Btn small onClick={saveNewClient} disabled={newClient.saving || !newClient.name.trim()}>
                    {newClient.saving ? <Loader2 size={12} className="animate-spin" /> : <Plus size={12} />} Save client
                  </Btn>
                  <Btn kind="ghost" small onClick={() => setNewClient({ show: false, name: "", contact: "", saving: false })}>
                    Cancel
                  </Btn>
                </div>
              </div>
            ) : (
              <div className="flex gap-2">
                <select value={form.client} onChange={e => setForm({ ...form, client: e.target.value })}
                  className="f-body flex-1 border border-gray-300 rounded-md px-3 py-2.5 text-sm bg-white">
                  <option value="">— none —</option>
                  {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                <button type="button"
                  onClick={() => setNewClient(s => ({ ...s, show: true }))}
                  className="shrink-0 text-xs f-disp font-semibold px-3 py-2 rounded-md border border-dashed border-gray-400 text-gray-600 hover:border-red-400 hover:text-red-600 transition-colors inline-flex items-center gap-1">
                  <Plus size={12} /> New
                </button>
              </div>
            )}
          </div>
          <div><Label>SOW ref (optional)</Label><Input value={form.ref} onChange={e => setForm({ ...form, ref: e.target.value })} placeholder="JMS-AGR-2026-0xx" /></div>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div><Label>Start date</Label><Input type="date" value={form.start_date} onChange={e => setForm({ ...form, start_date: e.target.value })} /></div>
          <div><Label>Duration (weeks)</Label><Input type="number" min={1} max={16} value={form.weeks} onChange={e => setForm({ ...form, weeks: parseInt(e.target.value) || 1, current_week: Math.min(form.current_week, parseInt(e.target.value) || 1) })} /></div>
          <div><Label>Current Week</Label><Input type="number" min={1} max={form.weeks} value={form.current_week} onChange={e => setForm({ ...form, current_week: parseInt(e.target.value) || 1 })} title="Tasks from previous weeks will be auto-completed" /></div>
        </div>
        <div>
          <Label>Team on this project</Label>
          <div className="flex flex-wrap gap-2">
            {team.map(t => (
              <button key={t.id} onClick={() => setTeamIds(ids => ids.includes(t.id) ? ids.filter(x => x !== t.id) : [...ids, t.id])}
                className={`f-disp text-xs font-semibold px-3 py-2 rounded-md border transition-colors ${teamIds.includes(t.id) ? "text-white border-transparent" : "border-gray-300 text-gray-600 hover:border-gray-400"}`}
                style={teamIds.includes(t.id) ? { background: RED } : {}}>
                {t.name} · {t.designation || "Developer"}
              </button>
            ))}
            {team.length === 0 && <p className="text-xs text-gray-400">Add developers in the Team tab first.</p>}
          </div>
        </div>
        <div>
          <Label>SOW / FDD document</Label>
          <input ref={fileRef} type="file" accept=".pdf,.doc,.docx" className="hidden"
            onChange={e => setPdf(e.target.files?.[0] || null)} />
          <div className="flex items-center gap-2 mb-2">
            <Btn kind="outline" onClick={() => fileRef.current?.click()}><FileText size={14} /> Upload Document</Btn>
            {pdf && <span className="text-xs text-gray-600 inline-flex items-center gap-1">{pdf.name} <button onClick={() => setPdf(null)}><X size={12} className="text-gray-400 hover:text-red-500" /></button></span>}
          </div>
          <textarea value={docText} onChange={e => setDocText(e.target.value)} rows={4}
            placeholder="…or paste the scope / module list from the SOW here"
            className="f-body w-full border border-gray-300 rounded-md px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-200" />
        </div>
        {err && <p className="text-sm text-red-600 flex items-center gap-1.5"><AlertTriangle size={14} /> {err}</p>}
        <div className="flex gap-2">
          <Btn onClick={generate}><Sparkles size={15} /> Generate day-wise plan</Btn>
          <Btn kind="ghost" onClick={() => onDone(null)}>Cancel</Btn>
        </div>
      </div>
    </Card>
  );
}

/* Draft table (pre-save, rows not yet in DB) */
function DraftTable({ rows, team, onChange }) {
  const weeks = useMemo(() => {
    const m = {};
    rows.forEach((r, i) => { (m[r.week] = m[r.week] || []).push({ ...r, _i: i }); });
    return Object.entries(m).sort((a, b) => a[0] - b[0]);
  }, [rows]);
  const devName = (id) => team.find(t => t.id === id)?.name || "—";
  const edit = (i, field, val) => onChange(rows.map((r, x) => x === i ? { ...r, [field]: val } : r));

  return (
    <div className="space-y-5">
      {weeks.map(([wk, list]) => (
        <Card key={wk} className="overflow-hidden">
          <div className="rail px-4 py-2.5 bg-gray-50 border-b border-gray-200">
            <span className="f-disp font-bold text-sm">W{wk} <span className="font-normal text-gray-500 text-xs ml-2">{fmt(list[0].date)} – {fmt(list[list.length - 1].date)}</span></span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[560px]">
              <tbody>
                {list.map(r => (
                  <tr key={r._i} className="border-b border-gray-100 last:border-0 hover:bg-gray-50">
                    <td className="px-4 py-2.5 w-14 f-disp font-bold text-xs" style={{ color: RED }}>D{r.day_num}</td>
                    <td className="py-2.5 w-20 text-xs text-gray-500 whitespace-nowrap">{fmt(r.date)}</td>
                    <td className="py-2.5 w-32">
                      <select value={r.developer_id} onChange={e => edit(r._i, "developer_id", Number(e.target.value))}
                        className="f-disp font-semibold text-xs bg-transparent border border-transparent hover:border-gray-300 rounded px-1 py-0.5 cursor-pointer">
                        {team.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                      </select>
                    </td>
                    <td className="py-2.5 w-28 text-xs text-gray-500">{r.module}</td>
                    <td className="py-2.5 pr-3">
                      <input value={r.title} onChange={e => edit(r._i, "title", e.target.value)}
                        className="w-full text-sm bg-transparent focus:outline-none focus:bg-white border border-transparent focus:border-gray-300 rounded px-1.5 py-0.5" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      ))}
    </div>
  );
}

/* ---------- Project detail ---------- */
function ProjectDetail({ projectId, onBack }) {
  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState(null);
  const [updates, setUpdates] = useState([]);
  const [view, setView] = useState("plan");
  const [filterDev, setFilterDev] = useState("");
  const [modal, setModal] = useState(null); // summary | adjust | update

  const load = async () => {
    const [p, t, u] = await Promise.all([api.project(projectId), api.tasks(`?project=${projectId}`), api.updates(projectId)]);
    setProject(p); setTasks(t.results || t); setUpdates(u);
  };
  useEffect(() => { load(); }, [projectId]);

  if (!project || !tasks) return <Spinner text="Loading project…" />;
  const { stats } = project;

  const toggle = async (task) => {
    const next = task.status === "DONE" ? "TODO" : "DONE";
    setTasks(tasks.map(t => t.id === task.id ? { ...t, status: next } : t));
    await api.patchTask(task.id, { status: next });
    api.project(projectId).then(setProject);
  };
  const reassign = async (taskId, devId) => {
    await api.patchTask(taskId, { developer: devId });
    load();
  };
  const saveComment = async (taskId, comment) => {
    setTasks(tasks.map(t => t.id === taskId ? { ...t, comment } : t));
    await api.patchTask(taskId, { comment });
  };
  const removeProject = async () => {
    if (!confirm(`Delete project "${project.name}" and its plan?`)) return;
    await api.deleteProject(projectId); onBack();
  };

  return (
    <div>
      <button onClick={onBack} className="text-xs text-gray-500 hover:text-gray-800 inline-flex items-center gap-1 mb-3"><ArrowLeft size={13} /> All projects</button>
      <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
        <div className="rail pl-4">
          <h2 className="f-disp font-bold text-xl">{project.name}</h2>
          <p className="text-xs text-gray-500">{project.client_name || "—"} {project.ref ? `· ${project.ref}` : ""} · {fmtLong(project.start_date)} · {project.weeks} weeks</p>
          <div className="w-48 mt-2"><ProgressBar pct={stats.pct} /></div>
          <p className="text-xs text-gray-400 mt-1">{stats.done}/{stats.total} tasks · {stats.pct}% complete</p>
        </div>
        <div className="flex flex-wrap gap-2 justify-end">
          <Btn kind="outline" small onClick={() => setModal("summary")}><Bot size={13} /> AI summary</Btn>
          <Btn kind="outline" small onClick={() => setModal("adjust")}><SlidersHorizontal size={13} /> Adjust plan (FDD change)</Btn>
          <Btn kind="outline" small onClick={() => setModal("update")}><Megaphone size={13} /> Post update</Btn>
          <Btn kind="danger" small onClick={removeProject}><Trash2 size={13} /></Btn>
        </div>
      </div>

      {updates.length > 0 && (
        <Card className="p-3.5 mb-4 bg-amber-50 border-amber-200">
          <div className="f-disp text-[10px] font-bold uppercase tracking-widest text-amber-700 mb-1 flex items-center gap-1"><Megaphone size={11} /> Latest update · {new Date(updates[0].created_at).toLocaleDateString("en-IN")}</div>
          <p className="text-sm text-amber-900">{updates[0].text}</p>
        </Card>
      )}

      <div className="flex gap-2 mb-4 flex-wrap">
        <Btn kind={view === "plan" ? "primary" : "ghost"} small onClick={() => setView("plan")}>Plan</Btn>
        <Btn kind={view === "gantt" ? "primary" : "ghost"} small onClick={() => setView("gantt")}><BarChart3 size={13} /> Gantt</Btn>
        <Btn kind={view === "report" ? "primary" : "ghost"} small onClick={() => setView("report")}><Mail size={13} /> Weekly report</Btn>
        <Btn kind={view === "daily_report" ? "primary" : "ghost"} small onClick={() => setView("daily_report")}><Mail size={13} /> Daily report</Btn>
        <Btn kind={view === "docs" ? "primary" : "ghost"} small onClick={() => setView("docs")}><Paperclip size={13} /> Documents</Btn>
      </div>

      {view === "plan" && (
        <>
          <div className="flex flex-wrap gap-2 mb-4">
            <button onClick={() => setFilterDev("")} className={`text-xs f-disp font-semibold px-3 py-1.5 rounded-full border ${!filterDev ? "text-white border-transparent" : "border-gray-300 text-gray-600"}`} style={!filterDev ? { background: INK } : {}}>All</button>
            {project.team_detail.map(t => (
              <button key={t.id} onClick={() => setFilterDev(t.id)} className={`text-xs f-disp font-semibold px-3 py-1.5 rounded-full border ${filterDev === t.id ? "text-white border-transparent" : "border-gray-300 text-gray-600"}`} style={filterDev === t.id ? { background: RED } : {}}>{t.name}</button>
            ))}
          </div>
          <p className="text-[11px] text-gray-400 mb-3">Change the developer in any row to re-share that task — they're notified and it moves to their list.</p>
          <TaskTable tasks={tasks} filterDev={filterDev} onToggle={toggle}
            reassignOptions={project.team_detail} onReassign={reassign} onComment={saveComment} />
        </>
      )}
      {view === "gantt" && <GanttView projectId={projectId} project={project} />}
      {view === "report" && <WeeklyReport projectId={projectId} project={project} tasks={tasks} />}
      {view === "daily_report" && <DailyReport projectId={projectId} project={project} tasks={tasks} />}
      {view === "docs" && <DocumentsView projectId={projectId} project={project} />}

      {modal === "summary" && <SummaryModal projectId={projectId} name={project.name} onClose={() => setModal(null)} />}
      {modal === "adjust" && <AdjustModal projectId={projectId} onClose={() => setModal(null)} onApplied={() => { setModal(null); load(); }} />}
      {modal === "update" && <UpdateModal onClose={() => setModal(null)} onPost={async (text) => { await api.postUpdate(projectId, text); setModal(null); load(); }} />}
    </div>
  );
}

/* ---------- Task table (saved tasks) ---------- */
function TaskTable({ tasks, filterDev, onToggle, reassignOptions, onReassign, onComment }) {
  const [expanded, setExpanded] = useState(null);
  const [commentText, setCommentText] = useState("");

  const toggleExpand = (t) => {
    if (expanded === t.id) {
      setExpanded(null);
    } else {
      setExpanded(t.id);
      setCommentText(t.comment || "");
    }
  };

  const handleSaveComment = (t) => {
    if (t.comment !== commentText) {
      onComment(t.id, commentText);
    }
    setExpanded(null);
  };
  const weeks = useMemo(() => {
    const m = {};
    tasks.forEach(t => { (m[t.week] = m[t.week] || []).push(t); });
    return Object.entries(m).sort((a, b) => a[0] - b[0]);
  }, [tasks]);

  return (
    <div className="space-y-5">
      {weeks.map(([wk, rows]) => {
        const visible = rows.filter(r => !filterDev || r.developer === filterDev);
        if (!visible.length) return null;
        return (
          <Card key={wk} className="overflow-hidden">
            <div className="rail px-4 py-2.5 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
              <span className="f-disp font-bold text-sm">W{wk} <span className="font-normal text-gray-500 text-xs ml-2">{fmt(rows[0].date)} – {fmt(rows[rows.length - 1].date)}</span></span>
              <span className="text-xs text-gray-500">{rows.filter(r => r.status === "DONE").length}/{rows.length} done</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[560px]">
                <tbody>
                  {visible.map(r => (
                    <React.Fragment key={r.id}>
                      <tr className={`border-b border-gray-100 last:border-0 hover:bg-gray-50 ${expanded === r.id ? "bg-gray-50" : ""}`}>
                        <td className="px-4 py-2.5 w-14 f-disp font-bold text-xs" style={{ color: RED }}>D{r.day_num}</td>
                        <td className="py-2.5 w-20 text-xs text-gray-500 whitespace-nowrap">{fmt(r.date)}</td>
                        <td className="py-2.5 w-32">
                          {reassignOptions ? (
                            <select value={r.developer} onChange={e => onReassign(r.id, Number(e.target.value))}
                              className="f-disp font-semibold text-xs bg-transparent border border-transparent hover:border-gray-300 rounded px-1 py-0.5 cursor-pointer">
                              {reassignOptions.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                            </select>
                          ) : <span className="f-disp font-semibold text-xs">{r.developer_name}</span>}
                        </td>
                        <td className="py-2.5 w-28 text-xs text-gray-500">{r.module}</td>
                        <td className="py-2.5 pr-3">
                          <span className={r.status === "DONE" ? "line-through text-gray-400" : ""}>{r.title}</span>
                          {r.comment && (
                            <div className="text-[11px] text-gray-500 mt-1 flex items-start gap-1 max-w-sm truncate" title={r.comment}>
                              <MessageSquare size={10} className="shrink-0 mt-0.5" />
                              <span className="truncate">{r.comment}</span>
                            </div>
                          )}
                        </td>
                        <td className="px-3 py-2.5 text-right w-24">
                          <div className="flex justify-end gap-3 items-center">
                            <button onClick={() => toggleExpand(r)} title="Comments">
                              <MessageSquare size={16} className={r.comment ? "text-indigo-500 fill-indigo-100" : "text-gray-300 hover:text-gray-500"} />
                            </button>
                            <button onClick={() => onToggle(r)}>
                              {r.status === "DONE" ? <CheckCircle2 size={18} className="text-green-600" /> : <Circle size={18} className="text-gray-300 hover:text-gray-500" />}
                            </button>
                          </div>
                        </td>
                      </tr>
                      {expanded === r.id && (
                        <tr className="bg-indigo-50/30 border-b border-gray-100">
                          <td colSpan={6} className="px-4 py-3">
                            <div className="flex gap-2">
                              <textarea
                                value={commentText}
                                onChange={e => setCommentText(e.target.value)}
                                placeholder="Add a comment or note about this task..."
                                className="f-body flex-1 text-sm bg-white border border-gray-300 rounded-md p-2 focus:outline-none focus:border-indigo-400"
                                rows={2}
                                autoFocus
                              />
                              <div className="flex flex-col gap-2 shrink-0 justify-end">
                                <Btn small onClick={() => handleSaveComment(r)}>Save note</Btn>
                                <Btn small kind="ghost" onClick={() => setExpanded(null)}>Cancel</Btn>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        );
      })}
    </div>
  );
}

/* ---------- Gantt ---------- */
/* ---------- Gantt ---------- */
function GanttView({ projectId, project }) {
  const [data, setData] = useState(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => { api.gantt(projectId).then(setData); }, [projectId]);

  const download = async () => {
    setErr(""); setBusy(true);
    try {
      await api.ganttPdf(projectId, project?.name || "project");
    } catch (serverErr) {
      setErr(serverErr.message || "Couldn't generate the PDF.");
    }
    setBusy(false);
  };

  if (!data) return <Spinner text="Building Gantt…" />;

  const { n_days, rows } = data;
  const modules = [...new Set(rows.flatMap(r => r.segments.map(s => s.module)))];
  const color = {}; modules.forEach((m, i) => { color[m] = MODULE_COLORS[i % MODULE_COLORS.length]; });
  const nWeeks = Math.ceil(n_days / 5);

  return (
    <Card className="p-4 overflow-x-auto">
      <div className="flex items-center justify-between gap-3 mb-3">
        <p className="text-[11px] text-gray-400">Solid fill inside a bar = portion of that workstream already completed.</p>
        <Btn kind="outline" small onClick={download} disabled={busy}>
          {busy ? <Loader2 className="animate-spin" size={13} /> : <Download size={13} />}
          {busy ? "Preparing…" : "Download PDF"}
        </Btn>
      </div>
      {err && <p className="text-xs text-red-600 mb-3 flex items-center gap-1.5"><AlertTriangle size={13} /> {err}</p>}

      <div style={{ minWidth: Math.max(700, n_days * 26 + 130) }}>
        <div className="flex mb-1">
          <div className="w-28 shrink-0" />
          <div className="flex-1 grid" style={{ gridTemplateColumns: `repeat(${nWeeks}, 1fr)` }}>
            {Array.from({ length: nWeeks }, (_, i) => (
              <div key={i} className="text-center border-l border-gray-200 f-disp font-bold text-xs">W{i + 1}</div>
            ))}
          </div>
        </div>
        {rows.map(r => (
          <div key={r.developer} className="flex items-center h-11 border-t border-gray-100">
            <div className="w-28 shrink-0 pr-2">
              <div className="f-disp font-semibold text-xs truncate">{r.developer}</div>
              <div className="text-[10px] text-gray-400 truncate">{r.designation}</div>
            </div>
            <div className="flex-1 relative h-6 bg-gray-50 rounded">
              {r.segments.map((s, i) => {
                const donePct = Math.round(s.done / s.len * 100);
                return (
                  <div key={i} title={`${s.module} · D${s.start}–D${s.start + s.len - 1} · ${s.done}/${s.len} done`}
                    className="absolute top-0 h-6 rounded flex items-center overflow-hidden"
                    style={{ left: `${(s.start - 1) / n_days * 100}%`, width: `${s.len / n_days * 100}%`, background: color[s.module] + "33", border: `1px solid ${color[s.module]}` }}>
                    <div className="absolute inset-y-0 left-0" style={{ width: `${donePct}%`, background: color[s.module] + "AA" }} />
                    <span className="relative f-disp text-[9px] font-bold px-1 truncate" style={{ color: color[s.module] }}>{s.module}</span>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
        <div className="flex flex-wrap gap-3 mt-4 pt-3 border-t border-gray-100">
          {modules.map(m => (
            <span key={m} className="inline-flex items-center gap-1.5 text-[11px] text-gray-600">
              <span className="w-3 h-3 rounded-sm" style={{ background: color[m] }} /> {m}
            </span>
          ))}
        </div>
      </div>
    </Card>
  );
}

/* ---------- Weekly report ---------- */
function WeeklyReport({ projectId, project, tasks }) {
  const weekNums = [...new Set(tasks.map(t => t.week))].sort((a, b) => a - b);
  const today = todayISO();
  const current = weekNums.find(w => tasks.some(t => t.week === w && t.date >= today)) || weekNums[weekNums.length - 1] || 1;
  const [week, setWeek] = useState(current);
  const [text, setText] = useState("");
  const [copied, setCopied] = useState(false);
  const [sent, setSent] = useState(false);
  const [pdfBusy, setPdfBusy] = useState(false);

  useEffect(() => { api.report(projectId, week).then(r => setText(r.text)); }, [projectId, week]);

  const copy = async () => { try { await navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 1500); } catch { } };
  const downloadTxt = () => {
    const blob = new Blob([text], { type: "text/plain" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${project.name.replace(/\s+/g, "_")}_W${week}_report.txt`;
    a.click();
  };
  const downloadPdf = async () => {
    setPdfBusy(true);
    try { await api.reportPdf(projectId, week, project.name); } catch (e) { alert(e.message); }
    setPdfBusy(false);
  };
  const send = async () => { await api.emailReport(projectId, week); setSent(true); setTimeout(() => setSent(false), 2500); };

  return (
    <Card className="p-5">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <Label>Week</Label>
          <select value={week} onChange={e => setWeek(Number(e.target.value))} className="f-body border border-gray-300 rounded-md px-3 py-2 text-sm bg-white">
            {weekNums.map(w => <option key={w} value={w}>W{w}</option>)}
          </select>
        </div>
        <div className="flex flex-wrap gap-2">
          <Btn kind="outline" small onClick={copy}><Copy size={13} /> {copied ? "Copied!" : "Copy"}</Btn>
          <Btn kind="outline" small onClick={downloadTxt}><Download size={13} /> TXT</Btn>
          <Btn kind="outline" small onClick={downloadPdf} disabled={pdfBusy}>
            {pdfBusy ? <Loader2 size={13} className="animate-spin" /> : <FileText size={13} />} PDF
          </Btn>
          <Btn small onClick={send}><Mail size={13} /> {sent ? "Sent!" : "Email me now"}</Btn>
        </div>
      </div>
      <p className="text-[11px] text-gray-400 mb-3">This report is auto-saved as a PDF to Documents every Friday at 18:30.</p>
      <pre className="text-xs bg-gray-50 border border-gray-200 rounded-md p-4 overflow-x-auto whitespace-pre-wrap leading-relaxed">{text || "Loading…"}</pre>
    </Card>
  );
}

/* ---------- Daily report ---------- */
function DailyReport({ projectId, project, tasks }) {
  const dates = [...new Set(tasks.map(t => t.date))].sort();
  const today = todayISO();
  const current = dates.includes(today) ? today : (dates[dates.length - 1] || today);
  const [date, setDate] = useState(current);
  const [text, setText] = useState("");
  const [copied, setCopied] = useState(false);
  const [pdfBusy, setPdfBusy] = useState(false);

  useEffect(() => { api.dailyReport(projectId, date).then(r => setText(r.text)); }, [projectId, date]);

  const copy = async () => { try { await navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 1500); } catch { } };
  const downloadTxt = () => {
    const blob = new Blob([text], { type: "text/plain" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${project.name.replace(/\s+/g, "_")}_${date}_daily.txt`;
    a.click();
  };
  const downloadPdf = async () => {
    setPdfBusy(true);
    try { await api.dailyReportPdf(projectId, date, project.name); } catch (e) { alert(e.message); }
    setPdfBusy(false);
  };

  return (
    <Card className="p-5">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <Label>Date</Label>
          <select value={date} onChange={e => setDate(e.target.value)} className="f-body border border-gray-300 rounded-md px-3 py-2 text-sm bg-white">
            {dates.map(d => <option key={d} value={d}>{fmt(d)}</option>)}
          </select>
        </div>
        <div className="flex flex-wrap gap-2">
          <Btn kind="outline" small onClick={copy}><Copy size={13} /> {copied ? "Copied!" : "Copy"}</Btn>
          <Btn kind="outline" small onClick={downloadTxt}><Download size={13} /> TXT</Btn>
          <Btn kind="outline" small onClick={downloadPdf} disabled={pdfBusy}>
            {pdfBusy ? <Loader2 size={13} className="animate-spin" /> : <FileText size={13} />} PDF
          </Btn>
        </div>
      </div>
      <p className="text-[11px] text-gray-400 mb-3">Daily reports are auto-saved as PDFs to Documents every Mon-Fri at 18:30.</p>
      <pre className="text-xs bg-gray-50 border border-gray-200 rounded-md p-4 overflow-x-auto whitespace-pre-wrap leading-relaxed">{text || "Loading…"}</pre>
    </Card>
  );
}

/* ---------- Modals ---------- */
function SummaryModal({ projectId, name, onClose }) {
  const [text, setText] = useState(""); const [err, setErr] = useState(""); const [copied, setCopied] = useState(false);
  useEffect(() => { api.summary(projectId).then(r => setText(r.text)).catch(e => setErr(e.message)); }, [projectId]);
  return (
    <Modal title={`AI status summary — ${name}`} onClose={onClose}>
      {err ? <p className="text-sm text-red-600">{err}</p>
        : !text ? <Spinner text="Analysing the live plan…" />
          : (
            <>
              <p className="text-sm leading-relaxed whitespace-pre-wrap bg-gray-50 border border-gray-200 rounded-md p-4">{text}</p>
              <Btn kind="outline" small className="mt-3" onClick={async () => { await navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 1500); }}>
                <Copy size={13} /> {copied ? "Copied!" : "Copy"}
              </Btn>
            </>
          )}
    </Modal>
  );
}

function AdjustModal({ projectId, onClose, onApplied }) {
  const [note, setNote] = useState(""); const [pdf, setPdf] = useState(null);
  const [busy, setBusy] = useState(false); const [err, setErr] = useState("");
  const [preview, setPreview] = useState(null);
  const fileRef = useRef(null);

  const run = async (apply) => {
    setErr("");
    if (!note.trim() && !pdf) return setErr("Describe the change, or upload the revised FDD.");
    setBusy(true);
    try {
      const fd = new FormData();
      fd.append("change_note", note); fd.append("apply", apply ? "true" : "false");
      if (pdf) fd.append("sow_pdf", pdf);
      const res = await api.adjust(projectId, fd);
      if (apply) onApplied(); else setPreview(res);
    } catch (e) { setErr(e.message); }
    setBusy(false);
  };

  return (
    <Modal title="Adjust plan — scope / FDD change" onClose={onClose} wide>
      {busy ? <Spinner text="Re-planning remaining weeks… this can take a minute." />
        : preview ? (
          <>
            <p className="text-sm text-gray-600 mb-3">Completed work is preserved. Pending tasks from <b>W{preview.week_from}</b> onwards were re-planned ({preview.rows.length} new tasks). Apply to publish — the team is emailed automatically.</p>
            <div className="max-h-[40vh] overflow-y-auto mb-4 border border-gray-200 rounded-md">
              <table className="w-full text-xs">
                <tbody>
                  {preview.rows.map((r, i) => (
                    <tr key={i} className="border-b border-gray-100 last:border-0">
                      <td className="px-3 py-2 f-disp font-bold" style={{ color: RED }}>D{r.day_num}</td>
                      <td className="py-2 text-gray-500">{fmt(r.date)}</td>
                      <td className="py-2 text-gray-500">W{r.week}</td>
                      <td className="py-2 text-gray-500">{r.module}</td>
                      <td className="py-2 pr-3">{r.title}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex gap-2">
              <Btn onClick={() => run(true)}><CheckCircle2 size={15} /> Apply & notify team</Btn>
              <Btn kind="ghost" onClick={() => setPreview(null)}>Back</Btn>
            </div>
          </>
        ) : (
          <>
            <p className="text-sm text-gray-600 mb-4">Mid-project change? Describe it and/or upload the revised FDD. Everything already marked <b>Done</b> stays untouched; only pending work from the current week onwards is re-planned around the new goals.</p>
            <Label>What changed?</Label>
            <textarea value={note} onChange={e => setNote(e.target.value)} rows={3}
              placeholder="e.g. Client dropped the proctoring module and added a WhatsApp certificate flow."
              className="f-body w-full border border-gray-300 rounded-md px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-200 mb-3" />
            <input ref={fileRef} type="file" accept=".pdf" className="hidden" onChange={e => setPdf(e.target.files?.[0] || null)} />
            <div className="flex items-center gap-2 mb-4">
              <Btn kind="outline" small onClick={() => fileRef.current?.click()}><FileText size={13} /> Upload revised FDD (optional)</Btn>
              {pdf && <span className="text-xs text-gray-600">{pdf.name}</span>}
            </div>
            {err && <p className="text-sm text-red-600 mb-3 flex items-center gap-1.5"><AlertTriangle size={14} /> {err}</p>}
            <Btn onClick={() => run(false)}><Sparkles size={15} /> Re-plan remaining weeks</Btn>
          </>
        )}
    </Modal>
  );
}

function UpdateModal({ onClose, onPost }) {
  const [text, setText] = useState("");
  return (
    <Modal title="Post an update to the team" onClose={onClose}>
      <p className="text-xs text-gray-500 mb-3">Shown at the top of every team member's view for this project, and emailed (+WhatsApp if configured).</p>
      <textarea value={text} onChange={e => setText(e.target.value)} rows={4} autoFocus
        placeholder="e.g. Client demo moved to Friday — prioritise the assessment module this week."
        className="f-body w-full border border-gray-300 rounded-md px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-200 mb-3" />
      <Btn onClick={() => text.trim() && onPost(text.trim())} disabled={!text.trim()}><Megaphone size={14} /> Post & notify</Btn>
    </Modal>
  );
}

/* ================= DEVELOPER ================= */
function DevShell({ me, signOut }) {
  const [tasks, setTasks] = useState(null);
  const [projects, setProjects] = useState([]);
  const [tab, setTab] = useState("today");

  const [viewDocs, setViewDocs] = useState(null);
  const [viewHistory, setViewHistory] = useState(null);

  const load = async () => {
    const [t, p] = await Promise.all([api.tasks("?mine=1&no_page=1"), api.projects("?no_page=1")]);
    setTasks(t.results || t); setProjects(p.results || p);
  };
  useEffect(() => { load(); }, []);

  const toggle = async (task) => {
    const next = task.status === "DONE" ? "TODO" : "DONE";
    setTasks(tasks.map(t => t.id === task.id ? { ...t, status: next } : t));
    await api.patchTask(task.id, { status: next });
  };

  if (!tasks) return <div className="f-body min-h-screen bg-gray-50"><Spinner text="Loading your tasks…" /></div>;

  const today = todayISO();
  const todayTasks = tasks.filter(t => t.date === today);
  const overdue = tasks.filter(t => t.date < today && t.status !== "DONE");
  const upcoming = tasks.filter(t => t.date > today).slice(0, 15);

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <header className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2.5">
          <img src="https://hrmsknowcraftstorage.blob.core.windows.net/media/JMS.png" alt="JMS" style={{ height: 36, width: "auto", objectFit: "contain" }} />
          <div>
            <h1 className="f-disp text-lg font-bold leading-tight" style={{ color: INK }}>{me.name}</h1>
            <p className="text-xs text-gray-500 leading-none mt-0.5">{me.designation || "Developer"} · {fmtLong(today)}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={load} className="text-gray-400 hover:text-gray-700" title="Refresh"><RefreshCw size={15} /></button>
          <button onClick={signOut} className="text-xs text-gray-500 hover:text-gray-800 inline-flex items-center gap-1"><LogOut size={13} /> Sign out</button>
        </div>
      </header>

      <h2 className="f-disp text-sm font-bold mb-2 text-gray-700">My Projects</h2>
      <div className="space-y-3 mb-6">
        {projects.map(p => (
          <Card key={p.id} className="p-3.5 bg-gray-50 border-gray-200 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="f-disp font-bold flex items-center gap-1"><FolderKanban size={13} className="text-gray-400" /> {p.name}</span>
              <div className="flex gap-2">
                <Btn small kind="outline" onClick={() => setViewDocs(p)}><FileText size={12} /> Docs</Btn>
                <Btn small kind="outline" onClick={() => setViewHistory(p)}><Megaphone size={12} /> Updates</Btn>
              </div>
            </div>
            {p.latest_update && (
              <div className="bg-amber-50 p-2 rounded text-sm text-amber-900 border border-amber-100">
                <div className="text-[10px] font-bold uppercase tracking-widest text-amber-700 mb-1 flex items-center gap-1"><Megaphone size={10}/> Latest Update</div>
                {p.latest_update.text}
              </div>
            )}
          </Card>
        ))}
        {projects.length === 0 && <p className="text-xs text-gray-500 italic">No active projects yet.</p>}
      </div>

      <nav className="flex gap-1 mb-4 border-b border-gray-200">
        {[["today", `Today (${todayTasks.length})`], ["overdue", `Overdue (${overdue.length})`], ["upcoming", "Upcoming"], ["all", "Full plan"], ["adhoc", "My Tasks"]].map(([id, label]) => (
          <button key={id} onClick={() => setTab(id)}
            className={`f-disp text-sm font-semibold px-3 py-2 -mb-px border-b-2 whitespace-nowrap ${tab === id ? "" : "border-transparent text-gray-500"}`}
            style={tab === id ? { color: RED, borderColor: RED } : {}}>{label}</button>
        ))}
      </nav>

      {tab === "today" && <Card>{todayTasks.length ? todayTasks.map(t => <DevRow key={t.id} t={t} onToggle={toggle} setTasks={setTasks} tasks={tasks} />) : <div className="p-8 text-center text-sm text-gray-400">No tasks scheduled for today. Check Upcoming.</div>}</Card>}
      {tab === "overdue" && <Card>{overdue.length ? overdue.map(t => <DevRow key={t.id} t={t} showDate onToggle={toggle} setTasks={setTasks} tasks={tasks} />) : <div className="p-8 text-center text-sm text-gray-400">Nothing overdue. Well done.</div>}</Card>}
      {tab === "upcoming" && <Card>{upcoming.length ? upcoming.map(t => <DevRow key={t.id} t={t} showDate onToggle={toggle} setTasks={setTasks} tasks={tasks} />) : <div className="p-8 text-center text-sm text-gray-400">Nothing coming up yet.</div>}</Card>}
      {tab === "all" && <Card>{tasks.map(t => <DevRow key={t.id} t={t} showDate onToggle={toggle} setTasks={setTasks} tasks={tasks} />)}</Card>}
      {tab === "adhoc" && <AdHocTasksTab me={me} isAdmin={false} />}

      {viewDocs && (
        <Modal title={`Documents: ${viewDocs.name}`} onClose={() => setViewDocs(null)}>
          <DocumentsView projectId={viewDocs.id} project={viewDocs} readOnly={true} />
        </Modal>
      )}
      {viewHistory && (
        <UpdateHistoryModal project={viewHistory} onClose={() => setViewHistory(null)} />
      )}
    </div>
  );
}

function DevRow({ t, showDate, onToggle, setTasks, tasks }) {
  const [expanded, setExpanded] = useState(false);
  const [commentText, setCommentText] = useState(t.comment || "");

  const handleSave = async () => {
    if (t.comment !== commentText) {
      setTasks(tasks.map(x => x.id === t.id ? { ...x, comment: commentText } : x));
      await api.patchTask(t.id, { comment: commentText });
    }
    setExpanded(false);
  };

  return (
    <div className="border-b border-gray-100 last:border-0">
      <div className="flex items-start gap-3 px-4 py-3 hover:bg-gray-50 group">
        <button onClick={() => onToggle(t)} className="mt-0.5 shrink-0">
          {t.status === "DONE" ? <CheckCircle2 size={20} className="text-green-600" /> : <Circle size={20} className="text-gray-300 hover:text-gray-500" />}
        </button>
        <div className="min-w-0 flex-1">
          <div className={`text-sm ${t.status === "DONE" ? "line-through text-gray-400" : "text-gray-900"}`}>{t.title}</div>
          <div className="text-xs text-gray-500 mt-0.5">
            <span className="f-disp font-bold" style={{ color: RED }}>D{t.day_num}</span> · {t.project_name} · {t.module}{showDate ? ` · ${fmt(t.date)}` : ""}
          </div>
          {t.comment && (
            <div className="text-[11px] text-gray-500 mt-1 flex items-start gap-1 max-w-sm truncate" title={t.comment}>
              <MessageSquare size={10} className="shrink-0 mt-0.5" />
              <span className="truncate">{t.comment}</span>
            </div>
          )}
        </div>
        <button onClick={() => { setExpanded(!expanded); setCommentText(t.comment || ""); }} className="shrink-0 pt-1" title="Comments">
          <MessageSquare size={16} className={t.comment ? "text-indigo-500 fill-indigo-100" : "text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity hover:text-gray-500"} />
        </button>
      </div>
      {expanded && (
        <div className="px-4 pb-3 pt-1 bg-indigo-50/30">
          <div className="flex gap-2">
            <textarea
              value={commentText}
              onChange={e => setCommentText(e.target.value)}
              placeholder="Add a comment or note about this task..."
              className="f-body flex-1 text-sm bg-white border border-gray-300 rounded-md p-2 focus:outline-none focus:border-indigo-400"
              rows={2}
              autoFocus
            />
            <div className="flex flex-col gap-2 shrink-0 justify-end">
              <Btn small onClick={handleSave}>Save note</Btn>
              <Btn small kind="ghost" onClick={() => setExpanded(false)}>Cancel</Btn>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function UpdateHistoryModal({ project, onClose }) {
  const [updates, setUpdates] = useState(null);
  useEffect(() => { api.updates(project.id).then(setUpdates); }, [project.id]);
  return (
    <Modal title={`Updates: ${project.name}`} onClose={onClose}>
      {!updates ? <Spinner /> : (
        <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
          {updates.map(u => (
            <div key={u.id} className="border-l-2 border-amber-400 pl-3 py-1">
              <div className="text-xs text-gray-500 mb-1">{fmtLong(u.created_at)}</div>
              <p className="text-sm">{u.text}</p>
            </div>
          ))}
          {updates.length === 0 && <p className="text-sm text-gray-400">No updates yet.</p>}
        </div>
      )}
    </Modal>
  );
}

/* ---------- Documents ---------- */
function DocumentsView({ projectId, project, readOnly }) {
  const [docs, setDocs] = useState(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const fileRef = useRef(null);

  const load = () => api.docs(projectId).then(setDocs);
  useEffect(() => { load(); }, [projectId]);

  const upload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true); setErr("");
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("title", file.name);
      await api.uploadDoc(projectId, fd);
      load();
    } catch (e) { setErr(e.message); }
    setBusy(false);
    if (fileRef.current) fileRef.current.value = "";
  };

  const removeDoc = async (id, title) => {
    if (!confirm(`Delete document "${title}"?`)) return;
    await api.deleteDoc(projectId, id);
    load();
  };

  if (!docs) return <Spinner text="Loading documents…" />;

  const allDocs = [];
  if (project?.sow_pdf) {
    allDocs.push({
      id: 'sow',
      title: "Original SOW Document",
      file_url: project.sow_pdf,
      uploaded_by_name: "System",
      uploaded_at: project.created_at,
      isSow: true
    });
  }
  allDocs.push(...docs);

  return (
    <Card className="p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="f-disp font-bold text-lg">Project Documents</h2>
        {!readOnly && (
          <div>
            <input ref={fileRef} type="file" className="hidden" onChange={upload} />
            <Btn small onClick={() => fileRef.current?.click()} disabled={busy}>
              {busy ? <Loader2 size={13} className="animate-spin" /> : <UploadCloud size={13} />} Upload Document
            </Btn>
          </div>
        )}
      </div>
      {err && <p className="text-xs text-red-600 mb-3">{err}</p>}

      {allDocs.length === 0 ? (
        <div className="text-center text-sm text-gray-400 py-6 border-2 border-dashed border-gray-200 rounded-lg">
          No documents uploaded yet.
        </div>
      ) : (
        <div className="space-y-2">
          {allDocs.map(d => (
            <div key={d.id} className="flex items-center justify-between p-3 border border-gray-100 rounded-md hover:bg-gray-50">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded bg-red-50 text-red-600 flex items-center justify-center shrink-0">
                  <FileText size={16} />
                </div>
                <div>
                  <div className="f-disp font-semibold text-sm">
                    {d.title} {d.isSow && <span className="ml-2 text-[10px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded font-bold uppercase tracking-wide">SOW</span>}
                  </div>
                  <div className="text-[11px] text-gray-500 mt-0.5">
                    Uploaded by {d.uploaded_by_name || "Unknown"} on {new Date(d.uploaded_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <a href={d.file_url} target="_blank" rel="noreferrer" className="text-gray-400 hover:text-indigo-600 transition-colors p-2" title="View Document">
                  <Eye size={15} />
                </a>
                <a href={d.file_url} download target="_blank" rel="noreferrer" className="text-gray-400 hover:text-indigo-600 transition-colors p-2" title="Download">
                  <Download size={15} />
                </a>
                {!readOnly && !d.isSow && (
                  <button onClick={() => removeDoc(d.id, d.title)} className="text-gray-400 hover:text-red-600 transition-colors p-2" title="Delete">
                    <Trash2 size={15} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
