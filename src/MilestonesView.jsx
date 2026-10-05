import React, { useState, useEffect } from "react";
import { Plus, Pencil, Trash2, CheckCircle2, AlertTriangle, Clock, Target, Layers, X, Copy } from "lucide-react";
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

/* ── Empty row template ─────────────────────────────────────── */
const emptyRow = (projectId) => ({
  _id: Math.random().toString(36).slice(2),
  project: projectId,
  title: "",
  status: "ON_TRACK",
  work_completed: "",
  stakeholder_dependency: "",
  next_milestone_desc: "",
  committed_date: "",
  final_completion_date: "",
  blocker: "",
  owner: "",
  recovery_action: "",
});

/* ══════════════════════════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════════════════════════ */
export default function MilestonesView({ projectId, project }) {
  const [milestones, setMilestones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null); // 'single' | 'bulk'
  const [editingMilestone, setEditingMilestone] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const data = await api.getMilestones(projectId);
      // Sort: Completed → On Track → At Risk → Delayed
      const sorted = [...(data || [])].sort(
        (a, b) => STATUS_ORDER.indexOf(a.status) - STATUS_ORDER.indexOf(b.status)
      );
      setMilestones(sorted);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { load(); }, [projectId]);

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
          <p className="text-xs text-gray-500 mt-1">Track deliverables, blockers, and completion dates.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setModal("bulk")}
            className="border border-indigo-300 text-indigo-700 hover:bg-indigo-50 px-3 py-1.5 rounded-lg text-sm font-semibold flex items-center gap-1.5 transition-colors">
            <Layers size={14} /> Add Multiple
          </button>
          <button
            onClick={() => { setEditingMilestone(null); setModal("single"); }}
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
              <th className="px-4 py-3 min-w-[120px]">Status</th>
              <th className="px-4 py-3 min-w-[120px]">Owner</th>
              <th className="px-4 py-3 min-w-[160px]">Dependency</th>
              <th className="px-4 py-3 min-w-[160px]">Next Milestone</th>
              <th className="px-4 py-3 min-w-[120px]">Committed Date</th>
              <th className="px-4 py-3 min-w-[120px]">Final Closure</th>
              <th className="px-4 py-3 min-w-[200px]">Risk / Blocker &amp; Action</th>
              <th className="px-4 py-3 min-w-[80px]"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr><td colSpan="9" className="px-4 py-8 text-center text-gray-400">Loading...</td></tr>
            ) : milestones.length === 0 ? (
              <tr><td colSpan="9" className="px-4 py-8 text-center text-gray-400">No milestones yet. Click "Add Milestone" to get started.</td></tr>
            ) : (
              milestones.map(m => (
                <tr key={m.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="font-semibold text-gray-900">{m.title}</div>
                    {m.work_completed && <div className="text-xs text-gray-500 mt-1">{m.work_completed}</div>}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider border ${STATUS_COLORS[m.status]}`}>
                      {STATUS_ICONS[m.status]} {STATUS_LABELS[m.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs font-medium">{m.owner_name || "-"}</td>
                  <td className="px-4 py-3 text-xs">{m.stakeholder_dependency || "-"}</td>
                  <td className="px-4 py-3 text-xs font-medium text-indigo-700">{m.next_milestone_desc || "-"}</td>
                  <td className="px-4 py-3 text-xs font-mono">{m.committed_date || "-"}</td>
                  <td className="px-4 py-3 text-xs font-mono">{m.final_completion_date || "-"}</td>
                  <td className="px-4 py-3 text-xs">
                    {m.blocker && <div className="text-red-600 mb-1"><strong>Blocker:</strong> {m.blocker}</div>}
                    {m.recovery_action && <div className="text-indigo-600"><strong>Action:</strong> {m.recovery_action}</div>}
                    {!m.blocker && !m.recovery_action && "-"}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-1">
                      <button onClick={() => { setEditingMilestone(m); setModal("single"); }}
                        className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded">
                        <Pencil size={14} />
                      </button>
                      <button onClick={() => handleDelete(m.id)}
                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Single milestone modal */}
      {modal === "single" && (
        <MilestoneModal
          projectId={projectId}
          project={project}
          initialData={editingMilestone}
          onClose={() => setModal(null)}
          onSaved={() => { setModal(null); load(); }}
        />
      )}

      {/* Bulk add modal */}
      {modal === "bulk" && (
        <BulkMilestoneModal
          projectId={projectId}
          project={project}
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
function MilestoneModal({ projectId, project, initialData, onClose, onSaved }) {
  const [formData, setFormData] = useState(initialData || {
    project: projectId, title: "", status: "ON_TRACK",
    work_completed: "", stakeholder_dependency: "",
    next_milestone_desc: "", committed_date: "",
    final_completion_date: "", blocker: "", owner: "", recovery_action: "",
  });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setBusy(true); setErr("");
    try {
      const payload = { ...formData };
      if (!payload.owner) payload.owner = null;
      if (!payload.committed_date) payload.committed_date = null;
      if (!payload.final_completion_date) payload.final_completion_date = null;
      if (initialData) await api.updateMilestone(initialData.id, payload);
      else await api.createMilestone(payload);
      onSaved();
    } catch (e) { setErr(e.message); setBusy(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50">
          <h3 className="font-bold text-gray-900">{initialData ? "Edit Milestone" : "Add Milestone"}</h3>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4">
          {err && <div className="text-sm text-red-600 bg-red-50 p-3 rounded-lg border border-red-200">{err}</div>}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Open Item / Scope Remaining *</label>
            <input required type="text" name="title" value={formData.title} onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-200 outline-none" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Status</label>
              <select name="status" value={formData.status} onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-200 outline-none">
                <option value="ON_TRACK">On Track</option>
                <option value="AT_RISK">At Risk</option>
                <option value="DELAYED">Delayed</option>
                <option value="COMPLETED">Completed</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Owner</label>
              <select name="owner" value={formData.owner || ""} onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-200 outline-none">
                <option value="">-- Select Owner --</option>
                {project.team_detail?.map(u => (
                  <option key={u.id} value={u.id}>{u.name || u.username}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Work Completed to Date</label>
            <textarea name="work_completed" value={formData.work_completed} onChange={handleChange} rows="2"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-200 outline-none" />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Stakeholder / Dependency</label>
            <input type="text" name="stakeholder_dependency" value={formData.stakeholder_dependency} onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-200 outline-none" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Next Milestone</label>
              <input type="text" name="next_milestone_desc" value={formData.next_milestone_desc} onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-200 outline-none" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Committed Date</label>
              <input type="date" name="committed_date" value={formData.committed_date} onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-200 outline-none" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Final Closure Date</label>
            <input type="date" name="final_completion_date" value={formData.final_completion_date} onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-200 outline-none" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Risk / Blocker</label>
              <textarea name="blocker" value={formData.blocker} onChange={handleChange} rows="2"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-200 outline-none" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Recovery Action</label>
              <textarea name="recovery_action" value={formData.recovery_action} onChange={handleChange} rows="2"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-200 outline-none" />
            </div>
          </div>
        </form>
        <div className="px-5 py-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-2">
          <button type="button" onClick={onClose}
            className="px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-200 rounded-lg transition-colors">Cancel</button>
          <button type="button" onClick={handleSubmit} disabled={busy}
            className="px-4 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors shadow-sm disabled:opacity-50">
            {busy ? "Saving..." : "Save Milestone"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   BULK ADD MODAL  — multiple rows, save all at once
══════════════════════════════════════════════════════════════ */
function BulkMilestoneModal({ projectId, project, onClose, onSaved }) {
  const [rows, setRows] = useState([emptyRow(projectId), emptyRow(projectId)]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [saved, setSaved] = useState(0);

  const addRow = () => setRows(r => [...r, emptyRow(projectId)]);
  const duplicateRow = (idx) => setRows(r => {
    const copy = { ...r[idx], _id: Math.random().toString(36).slice(2) };
    const next = [...r];
    next.splice(idx + 1, 0, copy);
    return next;
  });
  const removeRow = (idx) => setRows(r => r.filter((_, i) => i !== idx));
  const updateRow = (idx, field, value) => setRows(r =>
    r.map((row, i) => i === idx ? { ...row, [field]: value } : row)
  );

  const handleSaveAll = async () => {
    const valid = rows.filter(r => r.title.trim());
    if (!valid.length) { setErr("Enter at least one milestone title."); return; }
    setBusy(true); setErr("");
    let count = 0;
    const errors = [];
    for (const row of valid) {
      try {
        const payload = { ...row };
        delete payload._id;
        if (!payload.owner) payload.owner = null;
        if (!payload.committed_date) payload.committed_date = null;
        if (!payload.final_completion_date) payload.final_completion_date = null;
        await api.createMilestone(payload);
        count++;
      } catch (e) {
        errors.push(`"${row.title}": ${e.message}`);
      }
    }
    setSaved(count);
    if (errors.length) setErr(`${count} saved. Errors: ${errors.join("; ")}`);
    else onSaved();
    setBusy(false);
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl max-h-[95vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between bg-indigo-50">
          <div>
            <h3 className="font-bold text-indigo-900 flex items-center gap-2">
              <Layers size={16} /> Bulk Add Milestones
            </h3>
            <p className="text-xs text-indigo-600 mt-0.5">Fill in all rows, then save all at once. Rows without a title are skipped.</p>
          </div>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
        </div>

        {/* Rows */}
        <div className="flex-1 overflow-y-auto p-5 space-y-3">
          {err && <div className="text-sm text-red-600 bg-red-50 p-3 rounded-lg border border-red-200">{err}</div>}

          {/* Column labels */}
          <div className="grid gap-2 text-[10px] font-bold uppercase tracking-widest text-gray-400 px-1"
            style={{ gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr 1fr 1fr 80px" }}>
            <span>Open Item *</span>
            <span>Status</span>
            <span>Owner</span>
            <span>Committed Date</span>
            <span>Final Closure</span>
            <span>Next Milestone</span>
            <span>Dependency / Blocker</span>
            <span></span>
          </div>

          {rows.map((row, idx) => (
            <div key={row._id}
              className="grid gap-2 items-start bg-gray-50 border border-gray-200 rounded-lg p-3"
              style={{ gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr 1fr 1fr 80px" }}>
              {/* Title */}
              <input
                type="text"
                placeholder="Open item / deliverable *"
                value={row.title}
                onChange={e => updateRow(idx, "title", e.target.value)}
                className="border border-gray-300 rounded-md px-2 py-1.5 text-xs focus:ring-2 focus:ring-indigo-200 outline-none w-full"
              />
              {/* Status */}
              <select
                value={row.status}
                onChange={e => updateRow(idx, "status", e.target.value)}
                className="border border-gray-300 rounded-md px-2 py-1.5 text-xs focus:ring-2 focus:ring-indigo-200 outline-none w-full">
                <option value="ON_TRACK">On Track</option>
                <option value="AT_RISK">At Risk</option>
                <option value="DELAYED">Delayed</option>
                <option value="COMPLETED">Completed</option>
              </select>
              {/* Owner */}
              <select
                value={row.owner || ""}
                onChange={e => updateRow(idx, "owner", e.target.value)}
                className="border border-gray-300 rounded-md px-2 py-1.5 text-xs focus:ring-2 focus:ring-indigo-200 outline-none w-full">
                <option value="">Owner</option>
                {project.team_detail?.map(u => (
                  <option key={u.id} value={u.id}>{u.name || u.username}</option>
                ))}
              </select>
              {/* Committed Date */}
              <input
                type="date"
                value={row.committed_date}
                onChange={e => updateRow(idx, "committed_date", e.target.value)}
                className="border border-gray-300 rounded-md px-2 py-1.5 text-xs focus:ring-2 focus:ring-indigo-200 outline-none w-full"
              />
              {/* Final Closure */}
              <input
                type="date"
                value={row.final_completion_date}
                onChange={e => updateRow(idx, "final_completion_date", e.target.value)}
                className="border border-gray-300 rounded-md px-2 py-1.5 text-xs focus:ring-2 focus:ring-indigo-200 outline-none w-full"
              />
              {/* Next Milestone */}
              <input
                type="text"
                placeholder="Next milestone"
                value={row.next_milestone_desc}
                onChange={e => updateRow(idx, "next_milestone_desc", e.target.value)}
                className="border border-gray-300 rounded-md px-2 py-1.5 text-xs focus:ring-2 focus:ring-indigo-200 outline-none w-full"
              />
              {/* Dependency / Blocker combined */}
              <input
                type="text"
                placeholder="Dependency or blocker"
                value={row.stakeholder_dependency}
                onChange={e => updateRow(idx, "stakeholder_dependency", e.target.value)}
                className="border border-gray-300 rounded-md px-2 py-1.5 text-xs focus:ring-2 focus:ring-indigo-200 outline-none w-full"
              />
              {/* Actions */}
              <div className="flex gap-1 items-center justify-end">
                <button type="button" onClick={() => duplicateRow(idx)} title="Duplicate row"
                  className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded text-xs">
                  <Copy size={13} />
                </button>
                <button type="button" onClick={() => removeRow(idx)} title="Remove row"
                  disabled={rows.length === 1}
                  className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded disabled:opacity-30">
                  <X size={13} />
                </button>
              </div>
            </div>
          ))}

          {/* Add row button */}
          <button
            type="button"
            onClick={addRow}
            className="w-full border-2 border-dashed border-indigo-200 hover:border-indigo-400 text-indigo-400 hover:text-indigo-600 py-3 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 transition-colors">
            <Plus size={14} /> Add Another Row
          </button>
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-gray-100 bg-gray-50 flex items-center justify-between">
          <span className="text-xs text-gray-400">
            {rows.filter(r => r.title.trim()).length} of {rows.length} rows ready to save
          </span>
          <div className="flex gap-2">
            <button type="button" onClick={onClose}
              className="px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-200 rounded-lg transition-colors">
              Cancel
            </button>
            <button type="button" onClick={handleSaveAll} disabled={busy}
              className="px-5 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors shadow-sm disabled:opacity-50 flex items-center gap-2">
              {busy ? <>Saving...</> : <><Layers size={14} /> Save All Milestones</>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
