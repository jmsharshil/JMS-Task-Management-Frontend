import React, { useState, useEffect } from "react";
import { Plus, Pencil, Trash2, CheckCircle2, AlertTriangle, Clock, Target, Layers, X, Copy, Check } from "lucide-react";
import { api } from "./api";

const STATUS_ORDER = ["COMPLETED", "ON_TRACK", "AT_RISK", "DELAYED"];

const STATUS_COLORS = {
  ON_TRACK:  "bg-green-100 text-green-800 border-green-200",
  AT_RISK:   "bg-red-100 text-red-800 border-red-200",
  DELAYED:   "bg-yellow-100 text-yellow-800 border-yellow-200",
  COMPLETED: "bg-blue-100 text-blue-800 border-blue-200",
};
const STATUS_LABELS = {
  ON_TRACK: "On Track", AT_RISK: "At Risk",
  DELAYED: "Delayed",   COMPLETED: "Completed",
};
const STATUS_ICONS = {
  ON_TRACK:  <CheckCircle2 size={12} className="mr-1" />,
  AT_RISK:   <AlertTriangle size={12} className="mr-1" />,
  DELAYED:   <Clock size={12} className="mr-1" />,
  COMPLETED: <Target size={12} className="mr-1" />,
};

const emptyRow = (projectId) => ({
  _id: Math.random().toString(36).slice(2),
  project: projectId,
  title: "", status: "ON_TRACK", work_completed: "",
  stakeholder_dependency: "", next_milestone_desc: "",
  committed_date: "", final_completion_date: "",
  blocker: "", owner: "", recovery_action: "",
});

/* ══════════════════════════════════════════════════════════════
   INLINE EDIT ROW
══════════════════════════════════════════════════════════════ */
function InlineEditRow({ m, onSave, onDelete }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState({ ...m });
  const [saving, setSaving] = useState(false);

  const startEdit = () => { setDraft({ ...m }); setEditing(true); };
  const cancelEdit = () => setEditing(false);

  const save = async () => {
    setSaving(true);
    const payload = { ...draft };
    if (!payload.committed_date) payload.committed_date = null;
    if (!payload.final_completion_date) payload.final_completion_date = null;
    await onSave(m.id, payload);
    setEditing(false);
    setSaving(false);
  };

  const f = (field) => (e) => setDraft(d => ({ ...d, [field]: e.target.value }));

  const cellCls = "px-2 py-1.5 border border-gray-300 rounded text-xs w-full focus:ring-2 focus:ring-indigo-200 outline-none";

  if (editing) {
    return (
      <tr className="bg-indigo-50 border-l-4 border-indigo-400">
        {/* Open Item */}
        <td className="px-3 py-2">
          <input value={draft.title} onChange={f("title")} className={cellCls} placeholder="Open item *" />
          <textarea value={draft.work_completed} onChange={f("work_completed")} className={`${cellCls} mt-1`} rows={2} placeholder="Work completed..." />
        </td>
        {/* Status */}
        <td className="px-3 py-2">
          <select value={draft.status} onChange={f("status")} className={cellCls}>
            <option value="ON_TRACK">On Track</option>
            <option value="AT_RISK">At Risk</option>
            <option value="DELAYED">Delayed</option>
            <option value="COMPLETED">Completed</option>
          </select>
        </td>
        {/* Owner — plain text */}
        <td className="px-3 py-2">
          <input value={draft.owner || ""} onChange={f("owner")} className={cellCls} placeholder="Owner name" />
        </td>
        {/* Dependency */}
        <td className="px-3 py-2">
          <input value={draft.stakeholder_dependency} onChange={f("stakeholder_dependency")} className={cellCls} placeholder="Dependency" />
        </td>
        {/* Next milestone */}
        <td className="px-3 py-2">
          <input value={draft.next_milestone_desc} onChange={f("next_milestone_desc")} className={cellCls} placeholder="Next milestone" />
        </td>
        {/* Committed date */}
        <td className="px-3 py-2">
          <input type="date" value={draft.committed_date || ""} onChange={f("committed_date")} className={cellCls} />
        </td>
        {/* Final closure */}
        <td className="px-3 py-2">
          <input type="date" value={draft.final_completion_date || ""} onChange={f("final_completion_date")} className={cellCls} />
        </td>
        {/* Blocker & action */}
        <td className="px-3 py-2">
          <input value={draft.blocker} onChange={f("blocker")} className={cellCls} placeholder="Risk / Blocker" />
          <input value={draft.recovery_action} onChange={f("recovery_action")} className={`${cellCls} mt-1`} placeholder="Recovery action" />
        </td>
        {/* Actions */}
        <td className="px-3 py-2">
          <div className="flex flex-col gap-1">
            <button onClick={save} disabled={saving}
              className="px-2 py-1 text-[10px] font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded flex items-center gap-1 disabled:opacity-50">
              <Check size={11} /> {saving ? "Saving..." : "Save"}
            </button>
            <button onClick={cancelEdit}
              className="px-2 py-1 text-[10px] font-semibold text-gray-600 hover:bg-gray-200 rounded flex items-center gap-1">
              <X size={11} /> Cancel
            </button>
          </div>
        </td>
      </tr>
    );
  }

  /* Read-only row */
  return (
    <tr className="hover:bg-gray-50 transition-colors group">
      <td className="px-4 py-3">
        <div className="font-semibold text-gray-900">{m.title}</div>
        {m.work_completed && <div className="text-xs text-gray-500 mt-0.5">{m.work_completed}</div>}
      </td>
      <td className="px-4 py-3">
        <span className={`inline-flex items-center px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider border ${STATUS_COLORS[m.status]}`}>
          {STATUS_ICONS[m.status]} {STATUS_LABELS[m.status]}
        </span>
      </td>
      <td className="px-4 py-3 text-xs font-medium text-gray-700">{m.owner || "-"}</td>
      <td className="px-4 py-3 text-xs text-gray-600">{m.stakeholder_dependency || "-"}</td>
      <td className="px-4 py-3 text-xs font-medium text-indigo-700">{m.next_milestone_desc || "-"}</td>
      <td className="px-4 py-3 text-xs font-mono text-gray-600 whitespace-nowrap">{m.committed_date || "-"}</td>
      <td className="px-4 py-3 text-xs font-mono text-gray-600 whitespace-nowrap">{m.final_completion_date || "-"}</td>
      <td className="px-4 py-3 text-xs">
        {m.blocker && <div className="text-red-600 mb-1"><strong>Blocker:</strong> {m.blocker}</div>}
        {m.recovery_action && <div className="text-indigo-600"><strong>Action:</strong> {m.recovery_action}</div>}
        {!m.blocker && !m.recovery_action && "-"}
      </td>
      <td className="px-3 py-3 text-right">
        <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={startEdit}
            className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded" title="Edit">
            <Pencil size={14} />
          </button>
          <button onClick={() => onDelete(m.id)}
            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded" title="Delete">
            <Trash2 size={14} />
          </button>
        </div>
      </td>
    </tr>
  );
}

/* ══════════════════════════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════════════════════════ */
export default function MilestonesView({ projectId, project }) {
  const [milestones, setMilestones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null); // 'single' | 'bulk'

  const load = async () => {
    setLoading(true);
    try {
      const data = await api.getMilestones(projectId);
      const sorted = [...(data || [])].sort(
        (a, b) => STATUS_ORDER.indexOf(a.status) - STATUS_ORDER.indexOf(b.status)
      );
      setMilestones(sorted);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { load(); }, [projectId]);

  const handleSaveEdit = async (id, payload) => {
    await api.updateMilestone(id, payload);
    load();
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this milestone?")) return;
    try { await api.deleteMilestone(id); load(); }
    catch (e) { alert(e.message); }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200">
      {/* Header */}
      <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <Target size={20} className="text-indigo-600" />
            Project Milestones
          </h2>
          <p className="text-xs text-gray-500 mt-1">
            Track deliverables, blockers, and completion dates. Hover any row to edit.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setModal("bulk")}
            className="border border-indigo-300 text-indigo-700 hover:bg-indigo-50 px-3 py-1.5 rounded-lg text-sm font-semibold flex items-center gap-1.5 transition-colors">
            <Layers size={14} /> Add Multiple
          </button>
          <button onClick={() => setModal("single")}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-lg text-sm font-semibold flex items-center gap-1.5 transition-colors">
            <Plus size={14} /> Add Milestone
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-gray-600">
          <thead className="bg-gray-50 text-gray-700 text-xs uppercase font-bold border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 min-w-[200px]">Open Item / Deliverable</th>
              <th className="px-4 py-3 min-w-[110px]">Status</th>
              <th className="px-4 py-3 min-w-[120px]">Owner</th>
              <th className="px-4 py-3 min-w-[150px]">Dependency</th>
              <th className="px-4 py-3 min-w-[150px]">Next Milestone</th>
              <th className="px-4 py-3 min-w-[130px]">Committed Date</th>
              <th className="px-4 py-3 min-w-[130px]">Final Closure</th>
              <th className="px-4 py-3 min-w-[200px]">Risk / Blocker &amp; Action</th>
              <th className="px-4 py-3 w-20"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr><td colSpan="9" className="px-4 py-8 text-center text-gray-400">Loading...</td></tr>
            ) : milestones.length === 0 ? (
              <tr><td colSpan="9" className="px-4 py-10 text-center text-gray-400">
                No milestones yet. Click "Add Milestone" to get started.
              </td></tr>
            ) : (
              milestones.map(m => (
                <InlineEditRow
                  key={m.id}
                  m={m}
                  onSave={handleSaveEdit}
                  onDelete={handleDelete}
                />
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Single milestone modal */}
      {modal === "single" && (
        <MilestoneModal
          projectId={projectId}
          onClose={() => setModal(null)}
          onSaved={() => { setModal(null); load(); }}
        />
      )}

      {/* Bulk add modal */}
      {modal === "bulk" && (
        <BulkMilestoneModal
          projectId={projectId}
          onClose={() => setModal(null)}
          onSaved={() => { setModal(null); load(); }}
        />
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   SINGLE MILESTONE MODAL
══════════════════════════════════════════════════════════════ */
function MilestoneModal({ projectId, onClose, onSaved }) {
  const [form, setForm] = useState({
    project: projectId, title: "", status: "ON_TRACK",
    work_completed: "", stakeholder_dependency: "",
    next_milestone_desc: "", committed_date: "",
    final_completion_date: "", blocker: "", owner: "", recovery_action: "",
  });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const f = (e) => setForm(p => ({ ...p, [e.target.name]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault(); setBusy(true); setErr("");
    try {
      const payload = { ...form };
      if (!payload.committed_date) payload.committed_date = null;
      if (!payload.final_completion_date) payload.final_completion_date = null;
      await api.createMilestone(payload);
      onSaved();
    } catch (e) { setErr(e.message); setBusy(false); }
  };

  const inp = "w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-200 outline-none";

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50">
          <h3 className="font-bold text-gray-900">Add Milestone</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
        </div>
        <form onSubmit={submit} className="flex-1 overflow-y-auto p-5 space-y-4">
          {err && <div className="text-sm text-red-600 bg-red-50 p-3 rounded-lg border border-red-200">{err}</div>}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Open Item / Scope Remaining *</label>
            <input required type="text" name="title" value={form.title} onChange={f} className={inp} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Status</label>
              <select name="status" value={form.status} onChange={f} className={inp}>
                <option value="ON_TRACK">On Track</option>
                <option value="AT_RISK">At Risk</option>
                <option value="DELAYED">Delayed</option>
                <option value="COMPLETED">Completed</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Owner (Client Contact / Responsible Party)</label>
              <input type="text" name="owner" value={form.owner || ""} onChange={f} placeholder="e.g. John Smith" className={inp} />
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Work Completed to Date</label>
            <textarea name="work_completed" value={form.work_completed} onChange={f} rows={2} className={inp} />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Stakeholder / Dependency</label>
            <input type="text" name="stakeholder_dependency" value={form.stakeholder_dependency} onChange={f} className={inp} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Next Milestone</label>
              <input type="text" name="next_milestone_desc" value={form.next_milestone_desc} onChange={f} className={inp} />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Committed Date</label>
              <input type="date" name="committed_date" value={form.committed_date} onChange={f} className={inp} />
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Final Closure Date</label>
            <input type="date" name="final_completion_date" value={form.final_completion_date} onChange={f} className={inp} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Risk / Blocker</label>
              <textarea name="blocker" value={form.blocker} onChange={f} rows={2} className={inp} />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Recovery Action</label>
              <textarea name="recovery_action" value={form.recovery_action} onChange={f} rows={2} className={inp} />
            </div>
          </div>
        </form>
        <div className="px-5 py-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-200 rounded-lg">Cancel</button>
          <button onClick={submit} disabled={busy}
            className="px-4 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg disabled:opacity-50">
            {busy ? "Saving..." : "Save Milestone"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   BULK ADD MODAL
══════════════════════════════════════════════════════════════ */
function BulkMilestoneModal({ projectId, onClose, onSaved }) {
  const [rows, setRows] = useState([emptyRow(projectId), emptyRow(projectId)]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const addRow = () => setRows(r => [...r, emptyRow(projectId)]);
  const duplicateRow = (idx) => setRows(r => {
    const copy = { ...r[idx], _id: Math.random().toString(36).slice(2) };
    const next = [...r]; next.splice(idx + 1, 0, copy); return next;
  });
  const removeRow = (idx) => setRows(r => r.filter((_, i) => i !== idx));
  const updateRow = (idx, field, value) =>
    setRows(r => r.map((row, i) => i === idx ? { ...row, [field]: value } : row));

  const handleSaveAll = async () => {
    const valid = rows.filter(r => r.title.trim());
    if (!valid.length) { setErr("Enter at least one milestone title."); return; }
    setBusy(true); setErr("");
    const errors = [];
    for (const row of valid) {
      try {
        const payload = { ...row };
        delete payload._id;
        if (!payload.committed_date) payload.committed_date = null;
        if (!payload.final_completion_date) payload.final_completion_date = null;
        await api.createMilestone(payload);
      } catch (e) { errors.push(`"${row.title}": ${e.message}`); }
    }
    if (errors.length) { setErr(errors.join("; ")); setBusy(false); }
    else onSaved();
  };

  const inp = "border border-gray-300 rounded-md px-2 py-1.5 text-xs focus:ring-2 focus:ring-indigo-200 outline-none w-full";

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl max-h-[95vh] flex flex-col overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between bg-indigo-50">
          <div>
            <h3 className="font-bold text-indigo-900 flex items-center gap-2"><Layers size={16} /> Bulk Add Milestones</h3>
            <p className="text-xs text-indigo-600 mt-0.5">Fill rows and save all at once. Rows without a title are skipped.</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-3">
          {err && <div className="text-sm text-red-600 bg-red-50 p-3 rounded-lg border border-red-200">{err}</div>}
          <div className="grid gap-2 text-[10px] font-bold uppercase tracking-widest text-gray-400 px-1"
            style={{ gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr 1fr 1fr 80px" }}>
            <span>Open Item *</span><span>Status</span><span>Owner</span>
            <span>Committed Date</span><span>Final Closure</span>
            <span>Next Milestone</span><span>Dependency / Blocker</span><span></span>
          </div>

          {rows.map((row, idx) => (
            <div key={row._id} className="grid gap-2 items-start bg-gray-50 border border-gray-200 rounded-lg p-3"
              style={{ gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr 1fr 1fr 80px" }}>
              <input type="text" placeholder="Open item *" value={row.title}
                onChange={e => updateRow(idx, "title", e.target.value)} className={inp} />
              <select value={row.status} onChange={e => updateRow(idx, "status", e.target.value)} className={inp}>
                <option value="ON_TRACK">On Track</option>
                <option value="AT_RISK">At Risk</option>
                <option value="DELAYED">Delayed</option>
                <option value="COMPLETED">Completed</option>
              </select>
              <input type="text" placeholder="Owner name" value={row.owner || ""}
                onChange={e => updateRow(idx, "owner", e.target.value)} className={inp} />
              <input type="date" value={row.committed_date}
                onChange={e => updateRow(idx, "committed_date", e.target.value)} className={inp} />
              <input type="date" value={row.final_completion_date}
                onChange={e => updateRow(idx, "final_completion_date", e.target.value)} className={inp} />
              <input type="text" placeholder="Next milestone" value={row.next_milestone_desc}
                onChange={e => updateRow(idx, "next_milestone_desc", e.target.value)} className={inp} />
              <input type="text" placeholder="Dependency or blocker" value={row.stakeholder_dependency}
                onChange={e => updateRow(idx, "stakeholder_dependency", e.target.value)} className={inp} />
              <div className="flex gap-1 items-center justify-end">
                <button onClick={() => duplicateRow(idx)} title="Duplicate"
                  className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded">
                  <Copy size={13} />
                </button>
                <button onClick={() => removeRow(idx)} disabled={rows.length === 1} title="Remove"
                  className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded disabled:opacity-30">
                  <X size={13} />
                </button>
              </div>
            </div>
          ))}

          <button onClick={addRow}
            className="w-full border-2 border-dashed border-indigo-200 hover:border-indigo-400 text-indigo-400 hover:text-indigo-600 py-3 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 transition-colors">
            <Plus size={14} /> Add Another Row
          </button>
        </div>

        <div className="px-5 py-4 border-t border-gray-100 bg-gray-50 flex items-center justify-between">
          <span className="text-xs text-gray-400">{rows.filter(r => r.title.trim()).length} of {rows.length} rows ready to save</span>
          <div className="flex gap-2">
            <button onClick={onClose} className="px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-200 rounded-lg">Cancel</button>
            <button onClick={handleSaveAll} disabled={busy}
              className="px-5 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg disabled:opacity-50 flex items-center gap-2">
              {busy ? "Saving..." : <><Layers size={14} /> Save All Milestones</>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
