// src/components/medical/MedicalCatalog.jsx
// ─────────────────────────────────────────────────────────────────────────────
// Renders ONE medical type-tab as a GENERAL CATALOG / LIBRARY (not a per-player
// list). It merges:
//   • localStorage TEMPLATES authored via "+ New" (unassigned, reusable), and
//   • content-DE-DUPLICATED real DB records (identical protocols logged for many
//     players collapse into a single reference entry).
// Entries are presented content-first — the medical detail is the headline; a
// player is NEVER shown as the owner here. Assignment to a player happens only in
// the Treatment Room (MedicalJourney).
// ─────────────────────────────────────────────────────────────────────────────
"use client";
import React, { useMemo, useState } from "react";
import { CATALOG_CONFIG, buildCatalog, addTemplate, removeTemplate } from "./medCatalog";
import { canDiagnose, canTreat, canRehab, canRecover, canFitnessTest } from "@/src/lib/permissions";
import useRole from "@/src/lib/useRole";

const pretty = (v) => (v ? String(v).replace(/_/g, " ") : "");

// Catalog tab → per-stage action policy. Authoring/removing a stage's reusable
// templates is a stage action, so it follows the same per-role rules as the
// journey: only the responsible role (+ admin) may add/remove library entries
// for that stage. Tabs without a stage owner (e.g. Injuries) are left ungated.
const CATALOG_CAN = {
  Diagnoses: canDiagnose,
  Treatments: canTreat,
  Rehabilitation: canRehab,
  Recovery: canRecover,
  Fitness: canFitnessTest,
};

// ─── "+ New template" inline form ────────────────────────────────────────────
function TemplateForm({ fields, onSubmit, onCancel }) {
  const [form, setForm] = useState({});
  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));
  const missing = fields.filter((f) => f.required && !String(form[f.key] ?? "").trim());

  return (
    <div className="fixed inset-0 z-[120] bg-black/75 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={(e) => e.target === e.currentTarget && onCancel()}>
      <div className="w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden rounded-3xl border border-slate-800 bg-slate-950 shadow-2xl">
        <div className="shrink-0 px-6 py-5 border-b border-slate-800 bg-gradient-to-br from-[#062b2b] via-slate-900 to-[#0a2a3f]">
          <h3 className="text-lg font-black text-white uppercase tracking-tight">New library entry</h3>
          <p className="text-[11px] text-slate-400 mt-1">A reusable template — assign it to a player later in the Treatment Room.</p>
        </div>
        <div className="p-6 overflow-y-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {fields.map((f) => (
              <div key={f.key} className={`flex flex-col gap-1.5 ${f.full ? "sm:col-span-2" : ""}`}>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                  {f.label}{f.required && <span className="text-teal-400"> *</span>}
                </label>
                {f.type === "select" ? (
                  <select value={form[f.key] ?? ""} onChange={(e) => set(f.key, e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-800 bg-slate-900/60 text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500">
                    <option value="" className="bg-slate-900">Select…</option>
                    {(f.options || []).map((o) => <option key={o} value={o} className="bg-slate-900">{pretty(o)}</option>)}
                  </select>
                ) : f.type === "textarea" ? (
                  <textarea value={form[f.key] ?? ""} onChange={(e) => set(f.key, e.target.value)} rows={2}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-800 bg-slate-900/60 text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500" />
                ) : (
                  <input type={f.type || "text"} value={form[f.key] ?? ""} placeholder={f.placeholder} onChange={(e) => set(f.key, e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-800 bg-slate-900/60 text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500" />
                )}
              </div>
            ))}
          </div>
        </div>
        <div className="shrink-0 px-6 py-4 border-t border-slate-800 flex justify-end gap-3">
          <button onClick={onCancel}
            className="px-5 py-3 rounded-xl border border-slate-700 text-slate-300 text-[10px] font-black uppercase tracking-widest hover:text-white hover:border-slate-500 transition-all">
            Cancel
          </button>
          <button disabled={missing.length > 0} onClick={() => onSubmit(form)}
            className="px-6 py-3 rounded-xl bg-teal-600 hover:bg-teal-500 disabled:opacity-40 text-white text-[10px] font-black uppercase tracking-widest shadow-lg shadow-teal-900/30 transition-all active:scale-95">
            Add to library
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── One catalog entry card (content-first) ──────────────────────────────────
function CatalogCard({ type, entry, onRemove, canEdit }) {
  const cfg = CATALOG_CONFIG[type];
  const title = cfg.title(entry);
  const subtitle = cfg.subtitle(entry);
  const tags = (cfg.tags(entry) || []).filter(([, v]) => v != null && String(v).trim() !== "");
  const isTemplate = entry.__template;

  return (
    <div className="bg-[#0a0f1d] border border-white/5 rounded-[2rem] p-6 hover:border-teal-500/30 transition-all shadow-2xl group relative overflow-hidden">
      <div className="flex justify-between items-start mb-5">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-12 h-12 bg-slate-950 rounded-2xl flex items-center justify-center text-teal-400 border border-white/5 shadow-inner group-hover:scale-105 transition-all duration-300 shrink-0">
            <span className="material-icons text-xl">{cfg.icon}</span>
          </div>
          <div className="min-w-0">
            <p className="text-[9px] font-black tracking-[0.2em] uppercase text-slate-500">{cfg.label}</p>
            <h3 className="text-white font-black text-base uppercase tracking-tight leading-tight truncate">{title}</h3>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {isTemplate ? (
            <span className="px-2.5 py-1 rounded-full text-[8px] font-black uppercase tracking-widest bg-teal-500/10 text-teal-300 border border-teal-500/30">Template</span>
          ) : (
            <span className="px-2.5 py-1 rounded-full text-[8px] font-black uppercase tracking-widest bg-slate-500/10 text-slate-300 border border-slate-500/20">
              In use · {entry.__count}
            </span>
          )}
          {isTemplate && canEdit && (
            <button onClick={() => onRemove(entry.__catalogId)} title="Remove template"
              className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center text-red-500 hover:bg-red-500 hover:text-white transition-all">
              <span className="material-icons text-sm">delete</span>
            </button>
          )}
        </div>
      </div>

      {subtitle && (
        <p className="text-teal-400/80 text-[11px] font-bold leading-relaxed mb-4 line-clamp-3">{subtitle}</p>
      )}

      {tags.length > 0 && (
        <div className="bg-slate-950/40 p-4 rounded-2xl border border-white/5 space-y-3">
          {tags.map(([k, v], i) => (
            <div key={i} className="flex justify-between items-center gap-3 text-[10px] font-black tracking-widest">
              <span className="uppercase text-slate-500 shrink-0">{k}</span>
              <span className="text-slate-200 text-right truncate">{v}</span>
            </div>
          ))}
        </div>
      )}

      <div className="absolute -bottom-4 -right-4 text-white/[0.02] pointer-events-none group-hover:text-teal-500/[0.05] transition-colors">
        <span className="material-icons text-8xl">{cfg.icon}</span>
      </div>
    </div>
  );
}

// ─── The catalog tab ─────────────────────────────────────────────────────────
export default function MedicalCatalog({ type, records, onCatalogChange, pushToast }) {
  const cfg = CATALOG_CONFIG[type];
  const { role } = useRole();
  // Whether this viewer may author/remove templates for this stage's library.
  // Tabs without a stage owner stay editable (no per-stage policy applies).
  const canEditCatalog = CATALOG_CAN[type] ? CATALOG_CAN[type](role) : true;
  const [showForm, setShowForm] = useState(false);
  // version bump forces a re-read of localStorage templates after add/remove
  const [version, setVersion] = useState(0);

  const entries = useMemo(() => buildCatalog(type, records), [type, records, version]);

  if (!cfg) return null;

  const handleAdd = (form) => {
    addTemplate(type, form);
    setShowForm(false);
    setVersion((v) => v + 1);
    onCatalogChange?.();
    pushToast?.({ msg: `${cfg.label.replace(/s$/, "")} template added to library`, type: "success" });
  };
  const handleRemove = (catalogId) => {
    if (!window.confirm("Remove this library template?")) return;
    removeTemplate(type, catalogId);
    setVersion((v) => v + 1);
    onCatalogChange?.();
    pushToast?.({ msg: "Template removed", type: "info" });
  };

  return (
    <div>
      <div className="flex justify-between items-start mb-8 gap-4">
        <div>
          <h2 className="text-white text-2xl font-black tracking-tighter uppercase">
            {cfg.label} <span className="text-teal-400">Library</span>
          </h2>
          <p className="text-[11px] text-slate-500 mt-1 font-medium max-w-xl">{cfg.blurb} Assign an entry to a player in the Treatment Room.</p>
        </div>
        {canEditCatalog && (
          <button onClick={() => setShowForm(true)}
            className="bg-teal-600 hover:bg-teal-400 text-white px-7 py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] transition-all active:scale-95 shadow-xl shadow-teal-900/20 flex items-center gap-2 shrink-0">
            <span className="material-icons">add</span> New
          </button>
        )}
      </div>

      {entries.length === 0 ? (
        <div className="text-center py-20 text-slate-500">
          <div className="text-6xl mb-6 opacity-20 grayscale">📚</div>
          <p className="text-lg font-bold text-slate-400">No {cfg.label.toLowerCase()} in the library yet</p>
          <p className="text-[12px] text-slate-600 mt-1">Use “+ New” to add a reusable template.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {entries.map((entry) => (
            <CatalogCard key={entry.__catalogId} type={type} entry={entry} onRemove={handleRemove} canEdit={canEditCatalog} />
          ))}
        </div>
      )}

      {showForm && canEditCatalog && (
        <TemplateForm fields={cfg.fields} onSubmit={handleAdd} onCancel={() => setShowForm(false)} />
      )}
    </div>
  );
}
