/**
 * ReportEditor.jsx  –  Premium Editable Report Builder for JMS Delivery Hub
 *
 * Features:
 *  • Unified tab switcher: Weekly / Daily / Custom Date Range
 *  • Left panel  : Task selector (filter by week/date/developer/status + bulk select)
 *  • Right panel : Live HTML-rendered preview with editable text override
 *  • Report format/template controls (uses per-project saved format)
 *  • Actions: Download PDF · Copy text · Download TXT · Get shareable link · Email
 */

import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import {
  FileText, Download, Mail, Copy, Link2, Loader2, CheckCircle2, Circle,
  Eye, Pencil, RefreshCw, ChevronDown, ChevronRight, Filter, Search,
  Sparkles, X, CheckSquare, Square, Calendar, User, Tag, BarChart2,
  Send, ExternalLink, Save, RotateCcw, Layers, Clock, AlertCircle, Target,
  CheckCircle, AlertTriangle, Hourglass
} from "lucide-react";
import { api } from "./api";

/* ─── colours (mirrors App.jsx) ─────────────────────────────── */
const RED = "#D6222A";
const INK = "#1A1D23";
const GREEN = "#178A50";
const INDIGO = "#4F46E5";

/* ─── tiny shared primitives ─────────────────────────────────── */
const Pill = ({ children, color = "gray" }) => {
  const map = {
    red: "bg-red-100 text-red-700 border-red-200",
    green: "bg-green-100 text-green-700 border-green-200",
    yellow: "bg-yellow-100 text-yellow-700 border-yellow-200",
    indigo: "bg-indigo-100 text-indigo-700 border-indigo-200",
    gray: "bg-gray-100 text-gray-600 border-gray-200",
    purple: "bg-purple-100 text-purple-700 border-purple-200",
  };
  return (
    <span className={`inline-flex items-center text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border ${map[color]}`}>
      {children}
    </span>
  );
};

const RBtn = ({ children, onClick, variant = "primary", disabled, small, className = "", id }) => {
  const base = `inline-flex items-center gap-1.5 font-semibold rounded-lg transition-all ${small ? "px-3 py-1.5 text-xs" : "px-4 py-2 text-sm"} disabled:opacity-40 disabled:cursor-not-allowed ${className}`;
  const styles = {
    primary: { background: `linear-gradient(135deg, ${RED} 0%, #b91c1c 100%)`, color: "#fff", boxShadow: "0 2px 8px rgba(214,34,42,0.3)" },
    secondary: { background: "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)", color: "#fff", boxShadow: "0 2px 8px rgba(99,102,241,0.3)" },
    outline: { background: "#fff", color: INK, border: "1px solid #d1d5db" },
    ghost: { background: "#f3f4f6", color: "#374151" },
    danger: { background: "#fef2f2", color: "#dc2626", border: "1px solid #fecaca" },
    success: { background: "linear-gradient(135deg,#059669,#047857)", color: "#fff", boxShadow: "0 2px 8px rgba(5,150,105,0.3)" },
  };
  return (
    <button id={id} onClick={onClick} disabled={disabled} className={base} style={styles[variant]}>
      {children}
    </button>
  );
};

const SectionTitle = ({ icon: Icon, children }) => (
  <div className="flex items-center gap-2 mb-3">
    {Icon && <Icon size={14} className="text-gray-400" />}
    <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">{children}</span>
  </div>
);

/* ─── EmailTagInput (local copy so ReportEditor is self-contained) ─── */
function EmailTagInput({ tags, setTags, placeholder = "Add email & press Enter…" }) {
  const [val, setVal] = useState("");
  const add = (raw) => {
    const emails = raw.split(/[,\s]+/).map(e => e.trim()).filter(e => e.includes("@"));
    if (emails.length) setTags(prev => [...new Set([...prev, ...emails])]);
    setVal("");
  };
  const onKey = (e) => {
    if (["Enter", ",", " ", "Tab"].includes(e.key)) { e.preventDefault(); add(val); }
    else if (e.key === "Backspace" && !val && tags.length) setTags(p => p.slice(0, -1));
  };
  return (
    <div className="flex flex-wrap items-center gap-1.5 border border-gray-300 rounded-lg px-2 py-1.5 bg-white focus-within:ring-2 focus-within:ring-red-200 focus-within:border-red-400 min-h-[40px]">
      {tags.map(t => (
        <span key={t} className="inline-flex items-center gap-1 bg-indigo-50 text-indigo-700 text-xs font-medium px-2 py-0.5 rounded-full border border-indigo-200">
          {t}
          <button type="button" onClick={() => setTags(p => p.filter(x => x !== t))} className="text-indigo-400 hover:text-red-500 leading-none">x</button>
        </span>
      ))}
      <input value={val} onChange={e => setVal(e.target.value)} onKeyDown={onKey}
        onBlur={() => val && add(val)}
        placeholder={tags.length ? "" : placeholder}
        className="flex-1 min-w-[160px] text-xs outline-none bg-transparent py-0.5 text-gray-700"
      />
    </div>
  );
}

/* ─── Task checkbox row ─────────────────────────────────────── */
function TaskCheckRow({ task, checked, onToggle }) {
  const priorityColor = { URGENT: "red", HIGH: "yellow", MEDIUM: "indigo", LOW: "gray" }[task.priority] || "gray";

  return (
    <label className={`flex items-start gap-2.5 px-3 py-2.5 cursor-pointer rounded-lg transition-colors group ${checked ? "bg-indigo-50/60 border border-indigo-200" : "hover:bg-gray-50 border border-transparent"}`}>
      <div className="mt-0.5 shrink-0 text-indigo-600">
        {checked
          ? <CheckSquare size={16} className="text-indigo-600" />
          : <Square size={16} className="text-gray-300 group-hover:text-gray-400" />}
      </div>
      <input type="checkbox" checked={checked} onChange={onToggle} className="sr-only" />
      <div className="flex-1 min-w-0">
        <div className={`text-xs font-medium leading-snug ${task.status === "DONE" ? "line-through text-gray-400" : "text-gray-800"}`}>
          {task.title}
        </div>
        <div className="flex flex-wrap gap-1.5 mt-1">
          <span className="text-[10px] text-gray-400 font-mono">D{task.day_num}</span>
          <span className="text-[10px] text-gray-400">{task.module}</span>
          {task.developer_name && <span className="text-[10px] text-gray-400">- {task.developer_name}</span>}
          <Pill color={task.status === "DONE" ? "green" : "gray"}>{task.status}</Pill>
          {task.priority && task.priority !== "MEDIUM" && <Pill color={priorityColor}>{task.priority}</Pill>}
        </div>
      </div>
      <div className={`shrink-0 mt-0.5 ${task.status === "DONE" ? "text-green-600" : "text-gray-300"}`}>
        {task.status === "DONE" ? <CheckCircle2 size={14} /> : <Circle size={14} />}
      </div>
    </label>
  );
}

/* ─── Stat badge ────────────────────────────────────────────── */
function StatBadge({ label, value, color = "#6366f1" }) {
  return (
    <div className="flex flex-col items-center bg-white rounded-xl border border-gray-100 px-4 py-3 shadow-sm min-w-[80px]">
      <span className="text-xl font-black" style={{ color }}>{value}</span>
      <span className="text-[10px] text-gray-400 uppercase tracking-wide text-center mt-0.5">{label}</span>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   MAIN COMPONENT
════════════════════════════════════════════════════════════════ */
export default function ReportEditor({ projectId, project, tasks: projectTasks }) {
  /* ── Tab state ─────────────────────────────────────────────── */
  const [mode, setMode] = useState("weekly"); // weekly | daily | custom | milestones
  const today = new Date().toISOString().slice(0, 10);

  /* ── Weekly params ─────────────────────────────────────────── */
  const weekNums = useMemo(() => [...new Set(projectTasks.map(t => t.week))].sort((a, b) => a - b), [projectTasks]);
  const currentWeek = useMemo(() => {
    const w = weekNums.find(w => projectTasks.some(t => t.week === w && t.date >= today));
    return w || weekNums[weekNums.length - 1] || 1;
  }, [weekNums, projectTasks, today]);
  const [week, setWeek] = useState(currentWeek);

  /* ── Daily params ──────────────────────────────────────────── */
  const dates = useMemo(() => [...new Set(projectTasks.map(t => t.date))].sort(), [projectTasks]);
  const currentDate = useMemo(() => dates.includes(today) ? today : (dates[dates.length - 1] || today), [dates, today]);
  const [date, setDate] = useState(currentDate);

  /* ── Custom params ─────────────────────────────────────────── */
  const [fromDate, setFromDate] = useState(today);
  const [toDate, setToDate] = useState(today);

  /* ── Task selection ────────────────────────────────────────── */
  const [selectedTaskIds, setSelectedTaskIds] = useState(new Set());
  const [filterDev, setFilterDev] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterWeek, setFilterWeek] = useState("");
  const [taskSearch, setTaskSearch] = useState("");

  /* ── Report text + preview ─────────────────────────────────── */
  const [reportText, setReportText] = useState("");
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState("split"); // split | editor | preview

  /* ── Format template ───────────────────────────────────────── */
  const [formatTemplates, setFormatTemplates] = useState({ weekly_format: "", daily_format: "", custom_format: "" });
  const [editingFormat, setEditingFormat] = useState(false);
  const [localFormat, setLocalFormat] = useState({ weekly_format: "", daily_format: "", custom_format: "" });

  /* ── Actions state ─────────────────────────────────────────── */
  const [pdfBusy, setPdfBusy] = useState(false);
  const [emailTags, setEmailTags] = useState([]);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [copied, setCopied] = useState(false);
  const [sharedLink, setSharedLink] = useState(null);
  const [linkBusy, setLinkBusy] = useState(false);
  const [showEmailPanel, setShowEmailPanel] = useState(false);
  const [showSharePanel, setShowSharePanel] = useState(false);
  const [err, setErr] = useState("");

  /* ── Load format templates once ───────────────────────────── */
  useEffect(() => {
    api.getReportFormat(projectId).then(res => {
      const t = {
        weekly_format: res.weekly_format || "",
        daily_format: res.daily_format || "",
        custom_format: res.custom_format || "",
      };
      setFormatTemplates(t);
      setLocalFormat(t);
    }).catch(() => {});
  }, [projectId]);

  /* ── Load milestones ───────────────────────────────────────── */
  const [milestones, setMilestones] = useState([]);
  const [milestonesLoading, setMilestonesLoading] = useState(false);
  useEffect(() => {
    if (mode !== "milestones") return;
    setMilestonesLoading(true);
    api.getMilestones(projectId)
      .then(data => setMilestones(data || []))
      .catch(() => {})
      .finally(() => setMilestonesLoading(false));
  }, [projectId, mode]);

  /* ── Derive filtered tasks for the selector panel ──────────── */
  const selectorTasks = useMemo(() => {
    let list = [...projectTasks];
    if (mode === "weekly") {
      const w = filterWeek ? Number(filterWeek) : week;
      list = list.filter(t => t.week === w);
    } else if (mode === "daily") {
      list = list.filter(t => t.date === date);
    } else {
      list = list.filter(t => t.date >= fromDate && t.date <= toDate);
    }
    if (filterDev) list = list.filter(t => String(t.developer) === filterDev || t.developer_name === filterDev);
    if (filterStatus) list = list.filter(t => t.status === filterStatus);
    if (taskSearch.trim()) {
      const q = taskSearch.toLowerCase();
      list = list.filter(t => t.title.toLowerCase().includes(q) || (t.module || "").toLowerCase().includes(q));
    }
    return list;
  }, [projectTasks, mode, week, date, fromDate, toDate, filterDev, filterStatus, filterWeek, taskSearch]);

  /* ── Stats computed from all tasks matching current mode ───── */
  const modeStats = useMemo(() => {
    let list = [...projectTasks];
    if (mode === "weekly") list = list.filter(t => t.week === week);
    else if (mode === "daily") list = list.filter(t => t.date === date);
    else list = list.filter(t => t.date >= fromDate && t.date <= toDate);
    const done = list.filter(t => t.status === "DONE").length;
    const total = list.length;
    const pct = total ? Math.round(done / total * 100) : 0;
    return { done, total, pending: total - done, pct };
  }, [projectTasks, mode, week, date, fromDate, toDate]);

  /* ── Select all / clear ────────────────────────────────────── */
  const selectAll = () => setSelectedTaskIds(new Set(selectorTasks.map(t => t.id)));
  const clearAll = () => setSelectedTaskIds(new Set());
  const toggleTask = (id) => setSelectedTaskIds(prev => {
    const n = new Set(prev);
    n.has(id) ? n.delete(id) : n.add(id);
    return n;
  });

  /* ── Reset task selection when mode/week/date changes ──────── */
  useEffect(() => {
    setSelectedTaskIds(new Set(selectorTasks.map(t => t.id)));
  }, [mode, week, date, fromDate, toDate]);

  /* ── Fetch report text ─────────────────────────────────────── */
  const fetchReport = useCallback(async () => {
    setLoading(true); setErr(""); setReportText("");
    try {
      let data;
      if (mode === "weekly") data = await api.report(projectId, week);
      else if (mode === "daily") data = await api.dailyReport(projectId, date);
      else data = await api.customReport(projectId, fromDate, toDate);
      setReportText(data.text || "");
    } catch (e) { setErr(e.message || "Failed to generate report."); }
    setLoading(false);
  }, [mode, projectId, week, date, fromDate, toDate]);

  /* ── Auto-fetch when mode/params change ─────────────────────── */
  useEffect(() => { fetchReport(); }, [fetchReport]);

  /* ── Build live preview HTML from reportText + selected tasks ─ */
  const previewHtml = useMemo(() => {
    const selectedTasks = projectTasks.filter(t => selectedTaskIds.has(t.id));
    const done = selectedTasks.filter(t => t.status === "DONE");
    const pending = selectedTasks.filter(t => t.status !== "DONE");

    if (!reportText && !selectedTasks.length) return "<p style='color:#9ca3af;font-style:italic;'>Generate a report to see the preview...</p>";

    const doneByModule = {};
    done.forEach(t => {
      const m = t.module || "General";
      (doneByModule[m] = doneByModule[m] || []).push(t);
    });

    const completedSection = Object.entries(doneByModule).map(([mod, tks]) =>
      `<div style="margin-bottom:8px;">
        <div style="font-size:11px;font-weight:700;color:#4f46e5;text-transform:uppercase;letter-spacing:.05em;margin-bottom:4px;">${mod}</div>
        <ul style="margin:0;padding-left:16px;">
          ${tks.map(t => `<li style="margin-bottom:2px;color:#166534;">checkmark ${t.title}</li>`).join("")}
        </ul>
      </div>`
    ).join("");

    const pendingSection = pending.length
      ? `<ul style="margin:0;padding-left:16px;">${pending.map(t => `<li style="margin-bottom:2px;color:#9a3412;">- ${t.title} <span style="font-size:10px;color:#9ca3af;">(D${t.day_num} - ${t.module})</span></li>`).join("")}</ul>`
      : `<p style="color:#9ca3af;font-style:italic;font-size:12px;">All selected tasks completed.</p>`;

    const pct = selectedTasks.length ? Math.round(done.length / selectedTasks.length * 100) : 0;

    return `
      <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:13px;line-height:1.6;color:#1a1d23;">
        ${reportText ? `<div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:16px;margin-bottom:20px;font-size:12px;white-space:pre-wrap;font-family:'Courier New',monospace;color:#374151;">${reportText.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")}</div>` : ""}
        <div style="display:flex;gap:12px;margin-bottom:20px;flex-wrap:wrap;">
          <div style="background:linear-gradient(135deg,#f0fdf4,#dcfce7);border:1px solid #bbf7d0;border-radius:10px;padding:10px 18px;text-align:center;min-width:80px;">
            <div style="font-size:22px;font-weight:900;color:#15803d;">${done.length}</div>
            <div style="font-size:10px;color:#166534;text-transform:uppercase;letter-spacing:.05em;">Completed</div>
          </div>
          <div style="background:linear-gradient(135deg,#fff7ed,#ffedd5);border:1px solid #fed7aa;border-radius:10px;padding:10px 18px;text-align:center;min-width:80px;">
            <div style="font-size:22px;font-weight:900;color:#c2410c;">${pending.length}</div>
            <div style="font-size:10px;color:#9a3412;text-transform:uppercase;letter-spacing:.05em;">Pending</div>
          </div>
          <div style="background:linear-gradient(135deg,#eff6ff,#dbeafe);border:1px solid #bfdbfe;border-radius:10px;padding:10px 18px;text-align:center;min-width:80px;">
            <div style="font-size:22px;font-weight:900;color:#1d4ed8;">${pct}%</div>
            <div style="font-size:10px;color:#1e40af;text-transform:uppercase;letter-spacing:.05em;">Complete</div>
          </div>
          <div style="background:linear-gradient(135deg,#f5f3ff,#ede9fe);border:1px solid #ddd6fe;border-radius:10px;padding:10px 18px;text-align:center;min-width:80px;">
            <div style="font-size:22px;font-weight:900;color:#6d28d9;">${selectedTasks.length}</div>
            <div style="font-size:10px;color:#5b21b6;text-transform:uppercase;letter-spacing:.05em;">Total</div>
          </div>
        </div>
        ${done.length > 0 ? `
        <div style="margin-bottom:20px;">
          <div style="font-size:12px;font-weight:800;color:#166534;text-transform:uppercase;letter-spacing:.06em;border-bottom:2px solid #bbf7d0;padding-bottom:6px;margin-bottom:10px;">Completed Tasks</div>
          ${completedSection || "<p style='color:#9ca3af;font-style:italic;font-size:12px;'>None selected.</p>"}
        </div>` : ""}
        ${pending.length > 0 ? `
        <div>
          <div style="font-size:12px;font-weight:800;color:#9a3412;text-transform:uppercase;letter-spacing:.06em;border-bottom:2px solid #fed7aa;padding-bottom:6px;margin-bottom:10px;">Pending / In-Progress</div>
          ${pendingSection}
        </div>` : ""}
      </div>
    `;
  }, [reportText, selectedTaskIds, projectTasks]);

  /* ── Actions ─────────────────────────────────────────────────── */
  const handleCopy = async () => {
    try { await navigator.clipboard.writeText(reportText); setCopied(true); setTimeout(() => setCopied(false), 1800); } catch {}
  };

  const handleDownloadTxt = () => {
    const blob = new Blob([reportText], { type: "text/plain" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob);
    a.download = `${project.name.replace(/\s+/g, "_")}_${mode}_report.txt`;
    a.click();
  };

  const handlePdf = async () => {
    setPdfBusy(true); setErr("");
    try {
      if (mode === "weekly") await api.reportPdf(projectId, week, project.name, reportText);
      else if (mode === "daily") await api.dailyReportPdf(projectId, date, project.name, reportText);
      else await api.customReportPdf(projectId, fromDate, toDate, project.name, reportText);
    } catch (e) { setErr(e.message); }
    setPdfBusy(false);
  };

  const handleGetLink = async () => {
    setLinkBusy(true); setErr(""); setSharedLink(null);
    try {
      let params;
      if (mode === "weekly") params = { type: "weekly", week };
      else if (mode === "daily") params = { type: "daily", date };
      else params = { type: "custom", date_from: fromDate, date_to: toDate };
      const { link } = await api.shareLink(projectId, params);
      setSharedLink(link); setShowSharePanel(true);
    } catch (e) { setErr(e.message); }
    setLinkBusy(false);
  };

  const handleEmail = async () => {
    if (!emailTags.length) { setErr("Add at least one recipient email."); return; }
    setSending(true); setErr("");
    try {
      if (mode === "weekly") await api.emailReport(projectId, week, emailTags.join(","), reportText);
      else if (mode === "daily") await api.emailDailyReport(projectId, date, emailTags.join(","), reportText);
      else await api.emailCustomReport(projectId, fromDate, toDate, emailTags.join(","), reportText);
      setSent(true); setTimeout(() => setSent(false), 3000);
    } catch (e) { setErr(e.message); }
    setSending(false);
  };

  const handleSaveFormat = async () => {
    try {
      await api.saveReportFormat(projectId, localFormat);
      setFormatTemplates(localFormat);
      setEditingFormat(false);
    } catch (e) { setErr(e.message); }
  };

  /* ── Unique developers for filter ───────────────────────────── */
  const developers = useMemo(() => {
    const seen = new Map();
    projectTasks.forEach(t => { if (!seen.has(String(t.developer))) seen.set(String(t.developer), t.developer_name); });
    return [...seen.entries()].map(([id, name]) => ({ id, name }));
  }, [projectTasks]);

  /* ── Render ─────────────────────────────────────────────────── */
  return (
    <div className="flex flex-col gap-0" style={{ fontFamily: "'Inter', -apple-system, sans-serif" }}>

      {/* HEADER BAR */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm mb-4 overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-100 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${RED}, #b91c1c)` }}>
              <FileText size={18} className="text-white" />
            </div>
            <div>
              <h2 className="font-black text-gray-900 text-base leading-none">Report Editor</h2>
              <p className="text-[11px] text-gray-400 mt-0.5">{project.name} - Select tasks, edit, and export</p>
            </div>
          </div>

          {/* View toggle */}
          <div className="flex items-center bg-gray-100 rounded-lg p-0.5 gap-0.5">
            {[["split", Layers, "Split"], ["editor", Pencil, "Editor"], ["preview", Eye, "Preview"]].map(([v, Icon, label]) => (
              <button key={v} id={`re-view-${v}`} onClick={() => setViewMode(v)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${viewMode === v ? "bg-white shadow text-gray-900" : "text-gray-500 hover:text-gray-700"}`}>
                <Icon size={12} /> {label}
              </button>
            ))}
          </div>
        </div>

        {/* Mode tabs */}
        <div className="flex px-5 gap-1 py-2 border-b border-gray-100">
          {[["weekly", "Weekly Report"], ["daily", "Daily Report"], ["custom", "Custom Range"], ["milestones", "Milestone Report"]].map(([m, label]) => (
            <button key={m} id={`re-mode-${m}`}
              onClick={() => { setMode(m); setSharedLink(null); setShowEmailPanel(false); setShowSharePanel(false); }}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${mode === m ? "text-white shadow-md" : "text-gray-500 hover:bg-gray-100"}`}
              style={mode === m ? { background: `linear-gradient(135deg, ${INDIGO}, #4338ca)` } : {}}>
              {m === "milestones" && <Target size={13} />}
              {label}
            </button>
          ))}
        </div>

        {/* Params strip */}
        <div className="px-5 py-3 flex flex-wrap items-end gap-4 bg-gray-50/50">
          {mode === "weekly" && (
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1.5">Week</label>
              <select id="re-week-select" value={week} onChange={e => setWeek(Number(e.target.value))}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white font-semibold text-gray-800 focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 outline-none min-w-[120px]">
                {weekNums.map(w => <option key={w} value={w}>Week {w}</option>)}
              </select>
            </div>
          )}
          {mode === "daily" && (
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1.5">Date</label>
              <select id="re-date-select" value={date} onChange={e => setDate(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white font-semibold text-gray-800 focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 outline-none">
                {dates.map(d => <option key={d} value={d}>{new Date(d + "T00:00:00").toLocaleDateString("en-IN", { weekday: "short", day: "2-digit", month: "short" })}</option>)}
              </select>
            </div>
          )}
          {mode === "custom" && (
            <>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1.5">From Date</label>
                <input id="re-from-date" type="date" value={fromDate} onChange={e => setFromDate(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white font-semibold text-gray-800 focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 outline-none" />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1.5">To Date</label>
                <input id="re-to-date" type="date" value={toDate} onChange={e => setToDate(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white font-semibold text-gray-800 focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 outline-none" />
              </div>
            </>
          )}

          <RBtn onClick={fetchReport} disabled={loading} variant="primary" id="re-generate-btn">
            {loading ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
            {loading ? "Generating..." : "Regenerate Report"}
          </RBtn>

          <div className="flex gap-2 ml-auto flex-wrap">
            <StatBadge label="Done" value={modeStats.done} color={GREEN} />
            <StatBadge label="Pending" value={modeStats.pending} color={RED} />
            <StatBadge label="% Done" value={`${modeStats.pct}%`} color={INDIGO} />
          </div>
        </div>
      </div>

      {/* MAIN EDITOR AREA */}
      <div className={`grid gap-4 ${viewMode === "split" ? "lg:grid-cols-[320px_1fr]" : "grid-cols-1"}`}>

        {/* LEFT: Task Selector Panel */}
        {(viewMode === "split" || viewMode === "editor") && (
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm flex flex-col overflow-hidden"
            style={{ maxHeight: viewMode === "split" ? "78vh" : "auto" }}>
            {/* Selector header */}
            <div className="px-4 py-3 border-b border-gray-100 bg-gray-50/80">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
                  <CheckSquare size={13} className="text-indigo-500" /> Task Selection
                  <span className="bg-indigo-100 text-indigo-700 text-[10px] font-bold px-1.5 py-0.5 rounded-full ml-1">
                    {selectedTaskIds.size}/{selectorTasks.length}
                  </span>
                </span>
                <div className="flex gap-1">
                  <button id="re-select-all" onClick={selectAll} className="text-[10px] text-indigo-600 hover:text-indigo-800 font-semibold px-2 py-1 rounded hover:bg-indigo-50 transition-colors">Select All</button>
                  <button id="re-clear-all" onClick={clearAll} className="text-[10px] text-gray-500 hover:text-gray-800 font-semibold px-2 py-1 rounded hover:bg-gray-100 transition-colors">Clear</button>
                </div>
              </div>

              {/* Search */}
              <div className="relative mb-2">
                <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input id="re-task-search" value={taskSearch} onChange={e => setTaskSearch(e.target.value)}
                  placeholder="Search tasks..."
                  className="w-full border border-gray-200 rounded-lg pl-7 pr-3 py-1.5 text-xs bg-white focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 outline-none text-gray-700" />
              </div>

              {/* Filters */}
              <div className="flex gap-2 flex-wrap">
                {mode === "weekly" && (
                  <select id="re-filter-week" value={filterWeek} onChange={e => setFilterWeek(e.target.value)}
                    className="border border-gray-200 rounded-md px-2 py-1 text-[10px] bg-white text-gray-600 focus:outline-none">
                    <option value="">All weeks</option>
                    {weekNums.map(w => <option key={w} value={w}>Week {w}</option>)}
                  </select>
                )}
                <select id="re-filter-dev" value={filterDev} onChange={e => setFilterDev(e.target.value)}
                  className="border border-gray-200 rounded-md px-2 py-1 text-[10px] bg-white text-gray-600 focus:outline-none">
                  <option value="">All devs</option>
                  {developers.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
                <select id="re-filter-status" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
                  className="border border-gray-200 rounded-md px-2 py-1 text-[10px] bg-white text-gray-600 focus:outline-none">
                  <option value="">All status</option>
                  <option value="DONE">Done</option>
                  <option value="TODO">Pending</option>
                </select>
              </div>
            </div>

            {/* Task list */}
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              {selectorTasks.length === 0 ? (
                <div className="py-10 text-center text-gray-400">
                  <Filter size={28} className="mx-auto mb-2 opacity-40" />
                  <p className="text-xs">No tasks match current filters.</p>
                </div>
              ) : (
                selectorTasks.map(task => (
                  <TaskCheckRow
                    key={task.id}
                    task={task}
                    checked={selectedTaskIds.has(task.id)}
                    onToggle={() => toggleTask(task.id)}
                  />
                ))
              )}
            </div>
          </div>
        )}

        {/* RIGHT: Editor + Preview */}
        <div className="flex flex-col gap-4">

          {/* Editable Text (shown in split/editor) */}
          {viewMode !== "preview" && (
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
              <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-100 bg-gray-50/80">
                <span className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
                  <Pencil size={12} className="text-gray-400" /> Editable Report Text
                  <span className="text-[10px] text-gray-400 font-normal ml-1">- Edit before exporting</span>
                </span>
                <div className="flex gap-2">
                  <button onClick={handleCopy} className="text-[10px] text-gray-500 hover:text-gray-800 font-semibold px-2 py-1 rounded hover:bg-gray-100 transition-colors flex items-center gap-1">
                    <Copy size={10} /> {copied ? "Copied!" : "Copy"}
                  </button>
                  <button onClick={handleDownloadTxt} className="text-[10px] text-gray-500 hover:text-gray-800 font-semibold px-2 py-1 rounded hover:bg-gray-100 transition-colors flex items-center gap-1">
                    <Download size={10} /> TXT
                  </button>
                </div>
              </div>
              <div className="p-4">
                {loading ? (
                  <div className="py-12 text-center text-gray-400">
                    <Loader2 size={24} className="animate-spin mx-auto mb-2" style={{ color: RED }} />
                    <p className="text-xs">Building report from live plan data...</p>
                  </div>
                ) : (
                  <textarea
                    id="re-report-textarea"
                    value={reportText}
                    onChange={e => setReportText(e.target.value)}
                    placeholder="Your report will appear here. Click 'Regenerate Report' or edit freely..."
                    className="w-full text-xs text-gray-700 leading-relaxed font-mono bg-gray-50 p-4 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-200 resize-y"
                    rows={viewMode === "split" ? 18 : 14}
                    style={{ minHeight: "200px" }}
                  />
                )}
                <p className="text-[10px] text-gray-400 mt-1.5 flex items-center gap-1">
                  <AlertCircle size={9} /> Auto-generated from live plan data. Edit freely before sending or downloading.
                </p>
              </div>
            </div>
          )}

          {/* Live HTML Preview (shown in split/preview) */}
          {viewMode !== "editor" && (
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
              <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-100 bg-gradient-to-r from-indigo-50 to-purple-50">
                <span className="text-xs font-bold text-indigo-700 flex items-center gap-1.5">
                  <Eye size={12} className="text-indigo-500" /> Live Preview
                  <span className="text-[10px] text-indigo-400 font-normal">({selectedTaskIds.size} tasks selected)</span>
                </span>
                <span className="text-[10px] text-indigo-400">Updates as you select/deselect tasks</span>
              </div>
              <div className="p-5 overflow-auto" style={{ maxHeight: "480px" }}>
                <div dangerouslySetInnerHTML={{ __html: previewHtml }} />
              </div>
            </div>
          )}

          {/* Action Bar */}
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm px-5 py-4">
            <div className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-3 flex items-center gap-2">
              <Send size={12} />Export &amp; Share
            </div>
            <div className="flex flex-wrap gap-2 mb-4">
              <RBtn onClick={handlePdf} disabled={pdfBusy} variant="primary" id="re-pdf-btn">
                {pdfBusy ? <Loader2 size={13} className="animate-spin" /> : <FileText size={13} />}
                {pdfBusy ? "Building PDF..." : "Download PDF"}
              </RBtn>
              <RBtn onClick={() => { setShowEmailPanel(!showEmailPanel); setShowSharePanel(false); }} variant="secondary" id="re-email-btn">
                <Mail size={13} /> Email Report
              </RBtn>
              <RBtn onClick={handleGetLink} disabled={linkBusy} variant="outline" id="re-link-btn">
                {linkBusy ? <Loader2 size={13} className="animate-spin" /> : <Link2 size={13} />}
                {linkBusy ? "Generating..." : "Get Share Link"}
              </RBtn>
              <RBtn onClick={handleCopy} variant="ghost" id="re-copy-btn">
                <Copy size={13} /> {copied ? "Copied!" : "Copy Text"}
              </RBtn>
              <RBtn onClick={handleDownloadTxt} variant="ghost" id="re-txt-btn">
                <Download size={13} /> Download TXT
              </RBtn>
            </div>

            {/* Email panel */}
            {showEmailPanel && (
              <div className="border border-indigo-200 rounded-xl bg-indigo-50/40 p-4 mb-3">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-indigo-700 flex items-center gap-1.5">
                    <Mail size={12} /> Email Recipients
                  </label>
                  <button onClick={() => setShowEmailPanel(false)} className="text-gray-400 hover:text-gray-700">
                    <X size={14} />
                  </button>
                </div>
                <EmailTagInput tags={emailTags} setTags={setEmailTags} placeholder="Type email and press Enter or comma..." />
                <div className="flex justify-end mt-3">
                  <RBtn onClick={handleEmail} disabled={sending || !emailTags.length} variant="secondary" id="re-send-email-btn">
                    {sending ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
                    {sending ? "Sending..." : sent ? "Sent!" : "Send Now"}
                  </RBtn>
                </div>
              </div>
            )}

            {/* Share link panel */}
            {showSharePanel && sharedLink && (
              <div className="border border-green-200 rounded-xl bg-green-50/40 p-4 mb-3">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-green-700 flex items-center gap-1.5">
                    <Link2 size={12} /> Shareable PDF Link
                  </label>
                  <button onClick={() => setShowSharePanel(false)} className="text-gray-400 hover:text-gray-700">
                    <X size={14} />
                  </button>
                </div>
                <p className="text-[11px] text-gray-500 mb-2">Anyone with this link can view the report PDF directly.</p>
                <div className="flex gap-2">
                  <input readOnly value={sharedLink}
                    className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-xs font-mono bg-white text-gray-700 focus:outline-none" />
                  <RBtn small onClick={async () => { await navigator.clipboard.writeText(sharedLink); setCopied(true); setTimeout(() => setCopied(false), 1800); }} variant="success" id="re-copy-link-btn">
                    <Copy size={12} /> {copied ? "Copied!" : "Copy"}
                  </RBtn>
                  <a href={sharedLink} target="_blank" rel="noreferrer">
                    <RBtn small variant="outline" id="re-open-link-btn">
                      <ExternalLink size={12} /> Open
                    </RBtn>
                  </a>
                </div>
              </div>
            )}

            {/* Error */}
            {err && (
              <div className="flex items-center gap-2 text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mt-2">
                <AlertCircle size={13} className="shrink-0" /> {err}
                <button onClick={() => setErr("")} className="ml-auto text-red-400 hover:text-red-700"><X size={12} /></button>
              </div>
            )}
          </div>

          {/* Report Format Templates */}
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50/60">
              <span className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
                <Tag size={12} className="text-gray-400" /> Custom Format Templates
                <span className="text-[10px] text-gray-400 font-normal ml-1">- Controls auto-generation format</span>
              </span>
              <div className="flex gap-2">
                {editingFormat ? (
                  <>
                    <RBtn small onClick={handleSaveFormat} variant="success" id="re-save-format-btn">
                      <Save size={11} /> Save
                    </RBtn>
                    <RBtn small onClick={() => { setEditingFormat(false); setLocalFormat(formatTemplates); }} variant="ghost">
                      <RotateCcw size={11} /> Cancel
                    </RBtn>
                  </>
                ) : (
                  <RBtn small onClick={() => setEditingFormat(true)} variant="outline" id="re-edit-format-btn">
                    <Pencil size={11} /> Edit Templates
                  </RBtn>
                )}
              </div>
            </div>

            <div className="p-4">
              <p className="text-[11px] text-gray-500 mb-4 leading-relaxed">
                Define custom text layout for each report type using placeholders. Leave blank to use auto-generated format.
              </p>
              <div className="grid gap-4">
                {[
                  ["weekly_format", "Weekly Template", "{project}, {week}, {done}, {total}, {pct}, {completed}, {pending}"],
                  ["daily_format", "Daily Template", "{project}, {date}, {done_today}, {total_today}, {overall_pct}, {completed}, {pending}"],
                  ["custom_format", "Custom Range Template", "{project}, {date_from}, {date_to}, {done_range}, {total_range}, {pct}, {completed}, {pending}"],
                ].map(([key, label, ph]) => (
                  <div key={key}>
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-1.5">{label}</label>
                    <textarea
                      id={`re-format-${key}`}
                      value={localFormat[key]}
                      onChange={e => setLocalFormat(f => ({ ...f, [key]: e.target.value }))}
                      disabled={!editingFormat}
                      placeholder={`Available: ${ph}`}
                      rows={3}
                      className={`w-full border rounded-lg px-3 py-2 text-xs font-mono leading-relaxed resize-y focus:outline-none focus:ring-2 focus:ring-indigo-200 transition-colors ${editingFormat ? "bg-white border-indigo-300 text-gray-800" : "bg-gray-50 border-gray-200 text-gray-500 cursor-default"}`}
                    />
                    {!editingFormat && !localFormat[key] && (
                      <p className="text-[10px] text-gray-400 mt-0.5 italic">Using auto-generated format (no custom template set)</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* ── MILESTONE REPORT PANEL ─────────────────────────────── */}
      {mode === "milestones" && (
        <MilestoneReportPanel
          projectId={projectId}
          project={project}
          milestones={milestones}
          loading={milestonesLoading}
        />
      )}
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   MILESTONE REPORT PANEL
════════════════════════════════════════════════════════════════ */
const MS_STATUS = {
  ON_TRACK:  { label: "On Track",  bg: "#dcfce7", color: "#166534", border: "#bbf7d0" },
  AT_RISK:   { label: "At Risk",   bg: "#fee2e2", color: "#991b1b", border: "#fecaca" },
  DELAYED:   { label: "Delayed",   bg: "#fef9c3", color: "#854d0e", border: "#fef08a" },
  COMPLETED: { label: "Completed", bg: "#dbeafe", color: "#1e40af", border: "#bfdbfe" },
};

/* Sort: Completed first, then On Track, At Risk, Delayed */
const MS_SORT_ORDER = ["COMPLETED", "ON_TRACK", "AT_RISK", "DELAYED"];
const sortMilestones = (list) =>
  [...list].sort((a, b) => MS_SORT_ORDER.indexOf(a.status) - MS_SORT_ORDER.indexOf(b.status));

function MilestoneReportPanel({ projectId, project, milestones, loading }) {
  const today = new Date().toISOString().slice(0, 10);
  const [pdfBusy, setPdfBusy] = useState(false);
  const [err, setErr] = useState("");

  /* ── Date range filter ─────────────────────────────────────── */
  const [filterMode, setFilterMode] = useState("all");    // "all" | "range"
  const [filterField, setFilterField] = useState("committed_date"); // "committed_date" | "final_completion_date"
  const [fromDate, setFromDate] = useState(today);
  const [toDate, setToDate] = useState(today);
  const [filterStatus, setFilterStatus] = useState("");   // "" | ON_TRACK | AT_RISK | DELAYED | COMPLETED

  /* ── Filtered + sorted milestones ─────────────────────────── */
  const filteredMilestones = React.useMemo(() => {
    let list = [...milestones];

    // Date range filter
    if (filterMode === "range") {
      list = list.filter(m => {
        const d = m[filterField];
        if (!d) return false;
        return d >= fromDate && d <= toDate;
      });
    }

    // Status filter
    if (filterStatus) list = list.filter(m => m.status === filterStatus);

    // Sort: Completed → On Track → At Risk → Delayed
    return sortMilestones(list);
  }, [milestones, filterMode, filterField, fromDate, toDate, filterStatus]);

  const handlePrint = () => window.print();

  const handlePdf = async () => {
    setPdfBusy(true); setErr("");
    try {
      const html = buildMilestoneHtml(project, filteredMilestones, filterMode, filterField, fromDate, toDate);
      const token = localStorage.getItem("access") || "";
      const res = await fetch(`/api/milestone-report-pdf/`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ html, project_name: project.name }),
      });
      if (!res.ok) throw new Error(`PDF failed (${res.status})`);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = `${project.name.replace(/\s+/g,"_")}_milestones.pdf`;
      a.click(); URL.revokeObjectURL(url);
    } catch (e) {
      window.print(); // Fallback: browser print dialog
    }
    setPdfBusy(false);
  };

  const rangeLabel = filterMode === "range"
    ? ` · ${filterField === "committed_date" ? "Committed" : "Final Closure"}: ${fromDate} → ${toDate}`
    : " · All Milestones";

  return (
    <div className="flex flex-col gap-4">

      {/* ── Filter / Controls Bar ───────────────────────────── */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm px-5 py-4">
        <div className="flex flex-wrap items-end gap-4 justify-between">
          <div className="flex flex-wrap items-end gap-3">

            {/* Show mode */}
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1.5">Show</label>
              <div className="flex rounded-lg overflow-hidden border border-gray-300">
                {[["all","All Milestones"],["range","Date Range"]].map(([v,label]) => (
                  <button key={v} onClick={() => setFilterMode(v)}
                    className={`px-3 py-1.5 text-xs font-semibold transition-colors ${filterMode === v ? "bg-indigo-600 text-white" : "bg-white text-gray-600 hover:bg-gray-50"}`}>
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Date range controls */}
            {filterMode === "range" && (
              <>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1.5">Filter By</label>
                  <select value={filterField} onChange={e => setFilterField(e.target.value)}
                    className="border border-gray-300 rounded-lg px-3 py-2 text-xs bg-white font-semibold text-gray-700 focus:ring-2 focus:ring-indigo-200 outline-none">
                    <option value="committed_date">Committed Date</option>
                    <option value="final_completion_date">Final Closure Date</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1.5">From</label>
                  <input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)}
                    className="border border-gray-300 rounded-lg px-3 py-2 text-xs bg-white focus:ring-2 focus:ring-indigo-200 outline-none" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1.5">To</label>
                  <input type="date" value={toDate} onChange={e => setToDate(e.target.value)}
                    className="border border-gray-300 rounded-lg px-3 py-2 text-xs bg-white focus:ring-2 focus:ring-indigo-200 outline-none" />
                </div>
              </>
            )}

            {/* Status filter */}
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1.5">Status</label>
              <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-xs bg-white font-semibold text-gray-700 focus:ring-2 focus:ring-indigo-200 outline-none">
                <option value="">All Statuses</option>
                <option value="COMPLETED">Completed</option>
                <option value="ON_TRACK">On Track</option>
                <option value="AT_RISK">At Risk</option>
                <option value="DELAYED">Delayed</option>
              </select>
            </div>
          </div>

          {/* Export buttons */}
          <div className="flex gap-2 flex-wrap">
            <RBtn onClick={handlePdf} disabled={pdfBusy} variant="primary" id="ms-pdf-btn">
              {pdfBusy ? <Loader2 size={13} className="animate-spin" /> : <FileText size={13} />}
              {pdfBusy ? "Generating..." : "Download PDF"}
            </RBtn>
            <RBtn onClick={handlePrint} variant="outline" id="ms-print-btn">
              <Download size={13} /> Print / Save PDF
            </RBtn>
          </div>
        </div>
      </div>

      {/* ── Table ──────────────────────────────────────────────── */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden" id="ms-report-table">
        <div className="px-5 pt-5 pb-3 flex items-center justify-between border-b border-gray-100">
          <div>
            <div className="text-xs font-bold text-gray-900 flex items-center gap-2">
              <Target size={14} style={{ color: INDIGO }} /> {project.name} — Milestone Status Report
            </div>
            <div className="text-[10px] text-gray-400 mt-0.5">
              {new Date().toLocaleDateString("en-IN", { day:"2-digit", month:"short", year:"numeric" })}{rangeLabel}
              {" · "}<span className="font-semibold text-indigo-600">{filteredMilestones.length} milestones</span>
              {" · "}<span className="text-gray-400">sorted: Completed → On Track → At Risk → Delayed</span>
            </div>
          </div>
          <div className="text-xs text-gray-400 bg-gray-50 px-3 py-1 rounded-full border border-gray-200">
            {filteredMilestones.filter(m=>m.status==="COMPLETED").length} done ·{" "}
            {filteredMilestones.filter(m=>m.status==="AT_RISK").length} at risk ·{" "}
            {filteredMilestones.filter(m=>m.status==="DELAYED").length} delayed
          </div>
        </div>

        {loading ? (
          <div className="py-16 text-center text-gray-400">
            <Loader2 size={24} className="animate-spin mx-auto mb-2" style={{ color: INDIGO }} />
            <p className="text-xs">Loading milestones...</p>
          </div>
        ) : (
          <div className="overflow-x-auto pb-5">
            <table style={{ width:"100%", borderCollapse:"collapse", fontSize:"12px" }}>
              <thead>
                <tr style={{ background:"#f8fafc" }}>
                  {["Project","Open Item","Status","Owner","Dependency","Next Milestone","Committed Date","Final Closure Date","Risk / Blocker & Action"]
                    .map(h => (
                      <th key={h} style={{
                        padding:"10px 12px", border:"1px solid #d1d5db",
                        fontWeight:700, color:"#374151", fontSize:"11px",
                        textAlign:"left", whiteSpace:"nowrap", verticalAlign:"bottom",
                      }}>{h}</th>
                    ))}
                </tr>
              </thead>
              <tbody>
                {filteredMilestones.length === 0 ? (
                  <tr>
                    <td colSpan={9} style={{ padding:"32px", textAlign:"center", color:"#9ca3af", border:"1px solid #d1d5db" }}>
                      {filterMode === "range"
                        ? "No milestones match the selected date range and filters."
                        : "No milestones added yet. Add milestones from the Milestones tab."}
                    </td>
                  </tr>
                ) : (
                  filteredMilestones.map((m, i) => {
                    const s = MS_STATUS[m.status] || MS_STATUS.ON_TRACK;
                    return (
                      <tr key={m.id} style={{ background: i % 2 === 0 ? "#fff" : "#fafafa" }}>
                        <td style={{ padding:"10px 12px", border:"1px solid #e5e7eb", color:"#374151", fontWeight:500 }}>
                          {project.name}
                        </td>
                        <td style={{ padding:"10px 12px", border:"1px solid #e5e7eb", color:"#111827", fontWeight:600, maxWidth:200 }}>
                          {m.title}
                          {m.work_completed && <div style={{ fontSize:"10px", color:"#6b7280", marginTop:2 }}>{m.work_completed}</div>}
                        </td>
                        <td style={{ padding:"10px 12px", border:"1px solid #e5e7eb" }}>
                          <span style={{
                            display:"inline-block", padding:"2px 7px", borderRadius:4,
                            fontSize:"10px", fontWeight:700, letterSpacing:".04em",
                            textTransform:"uppercase", background:s.bg, color:s.color,
                            border:`1px solid ${s.border}`,
                          }}>{s.label}</span>
                        </td>
                        <td style={{ padding:"10px 12px", border:"1px solid #e5e7eb", color:"#374151" }}>{m.owner_name||"-"}</td>
                        <td style={{ padding:"10px 12px", border:"1px solid #e5e7eb", color:"#374151" }}>{m.stakeholder_dependency||"-"}</td>
                        <td style={{ padding:"10px 12px", border:"1px solid #e5e7eb", color:"#374151" }}>{m.next_milestone_desc||"-"}</td>
                        <td style={{ padding:"10px 12px", border:"1px solid #e5e7eb", color:"#374151", fontFamily:"monospace", whiteSpace:"nowrap" }}>
                          {m.committed_date||"-"}
                        </td>
                        <td style={{ padding:"10px 12px", border:"1px solid #e5e7eb", color:"#374151", fontFamily:"monospace", whiteSpace:"nowrap" }}>
                          {m.final_completion_date||"-"}
                        </td>
                        <td style={{ padding:"10px 12px", border:"1px solid #e5e7eb", color:"#374151", maxWidth:220 }}>
                          {m.blocker && <div><strong style={{ color:"#dc2626" }}>Blocker: </strong>{m.blocker}</div>}
                          {m.recovery_action && <div style={{ marginTop:2 }}><strong style={{ color:"#4f46e5" }}>Action: </strong>{m.recovery_action}</div>}
                          {!m.blocker && !m.recovery_action && "-"}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Legend */}
        <div className="flex flex-wrap gap-3 px-5 pb-5">
          {MS_SORT_ORDER.map(key => {
            const s = MS_STATUS[key];
            return (
              <span key={key} style={{ display:"inline-flex", alignItems:"center", gap:5, fontSize:11 }}>
                <span style={{ width:10, height:10, borderRadius:2, background:s.bg, border:`1px solid ${s.border}`, display:"inline-block" }} />
                <span style={{ color:s.color, fontWeight:600 }}>{s.label}</span>
              </span>
            );
          })}
        </div>
      </div>

      {err && (
        <div className="flex items-center gap-2 text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          <AlertCircle size={13} className="shrink-0" /> {err}
          <button onClick={() => setErr("")} className="ml-auto text-red-400 hover:text-red-700"><X size={12} /></button>
        </div>
      )}
    </div>
  );
}


function buildMilestoneHtml(project, milestones, filterMode, filterField, fromDate, toDate) {
  const rangeNote = filterMode === "range"
    ? ` · ${filterField === "committed_date" ? "Committed" : "Final Closure"}: ${fromDate} to ${toDate}`
    : " · All Milestones";

  const rows = milestones.map(m => {
    const s = MS_STATUS[m.status] || MS_STATUS.ON_TRACK;
    return `<tr>
      <td style="padding:9px;border:1px solid #ddd">${project.name}</td>
      <td style="padding:9px;border:1px solid #ddd;font-weight:600">${m.title}${m.work_completed ? `<br><small style="color:#666">${m.work_completed}</small>` : ""}</td>
      <td style="padding:9px;border:1px solid #ddd"><span style="background:${s.bg};color:${s.color};padding:2px 6px;border-radius:3px;font-size:10px;font-weight:700;border:1px solid ${s.border}">${s.label}</span></td>
      <td style="padding:9px;border:1px solid #ddd">${m.owner_name||"-"}</td>
      <td style="padding:9px;border:1px solid #ddd">${m.stakeholder_dependency||"-"}</td>
      <td style="padding:9px;border:1px solid #ddd">${m.next_milestone_desc||"-"}</td>
      <td style="padding:9px;border:1px solid #ddd;font-family:monospace">${m.committed_date||"-"}</td>
      <td style="padding:9px;border:1px solid #ddd;font-family:monospace">${m.final_completion_date||"-"}</td>
      <td style="padding:9px;border:1px solid #ddd">${m.blocker?`<b style="color:#dc2626">Blocker:</b> ${m.blocker}<br>`:""}${m.recovery_action?`<b style="color:#4f46e5">Action:</b> ${m.recovery_action}`:""}${!m.blocker&&!m.recovery_action?"-":""}</td>
    </tr>`;
  }).join("");

  return `<html><head><style>
    body{font-family:Arial,sans-serif;font-size:12px;margin:24px}
    h2{margin-bottom:4px;font-size:16px} p{color:#666;font-size:11px;margin-bottom:16px}
    table{width:100%;border-collapse:collapse}
    th{padding:9px;border:1px solid #ccc;font-weight:700;background:#f1f5f9;font-size:11px;text-align:left}
    @media print{body{margin:8px}}
  </style></head><body>
    <h2>${project.name} — Milestone Status Report</h2>
    <p>${new Date().toLocaleDateString()}${rangeNote} · Sorted: Completed → On Track → At Risk → Delayed</p>
    <table>
      <thead><tr>
        <th>Project</th><th>Open Item</th><th>Status</th><th>Owner</th>
        <th>Dependency</th><th>Next Milestone</th><th>Committed Date</th>
        <th>Final Closure Date</th><th>Risk / Blocker &amp; Action</th>
      </tr></thead>
      <tbody>${rows}</tbody>
    </table>
  </body></html>`;
}


