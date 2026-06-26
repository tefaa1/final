"use client";
import React, { useMemo, useState } from "react";
import { api } from "@/src/lib/api";
import PlayerAvatar from "@/src/components/shared/PlayerAvatar";
import { isFitnessPass, clearInjuredPlayer, stageFromInjury, normStatus, ensureRehabilitation } from "@/src/lib/injuryActions";
import { canDiagnose, canTreat, canRehab, canRecover, canFitnessTest } from "@/src/lib/permissions";
import useRole from "@/src/lib/useRole";
import { readTemplates } from "./medCatalog";
import { FiX, FiCheck, FiLock, FiArrowRight } from "react-icons/fi";

// Per-stage action policy: which role may CREATE/EDIT/COMPLETE each clinical
// stage. The journey/stepper is viewable by every allowed role; only the action
// controls (picker + create-form + complete button) for a stage are gated here.
//   diagnosis, treatment → canDiagnose/canTreat (team_doctor + admin)
//   rehab, recovery      → canRehab/canRecover  (physiotherapist + admin)
//   fitness              → canFitnessTest       (fitness_coach + admin)
const STAGE_CAN = {
  diagnosis: canDiagnose,
  treatment: canTreat,
  rehab: canRehab,
  recovery: canRecover,
  fitness: canFitnessTest,
};

// Journey stage key → catalog type (api.medical key / localStorage namespace).
// Lets the stage picker also surface the general localStorage catalog templates.
const STAGE_CATALOG_TYPE = {
  diagnosis: "Diagnoses",
  treatment: "Treatments",
  rehab: "Rehabilitation",
  recovery: "Recovery",
  fitness: "Fitness",
};

// ─── Shared helpers ──────────────────────────────────────────────────────────
const DEFAULT_DOCTOR_ID = 6;
const DEFAULT_DOCTOR_KEYCLOAK = "00000000-0000-0000-0000-000000000030";
const pretty = (v) => (v ? String(v).replace(/_/g, " ") : "—");
const fmtDate = (d) => (d ? String(d).split("T")[0] : "—");
const today = () => new Date().toISOString().split("T")[0];
const nowIso = () => new Date().toISOString();

// Severity → accent colour
const SEV = {
  MINOR: { ring: "ring-emerald-500/40", text: "text-emerald-300", bg: "bg-emerald-500/10", bar: "from-emerald-500 to-teal-500" },
  MODERATE: { ring: "ring-amber-500/40", text: "text-amber-300", bg: "bg-amber-500/10", bar: "from-amber-500 to-orange-500" },
  SEVERE: { ring: "ring-orange-500/40", text: "text-orange-300", bg: "bg-orange-500/10", bar: "from-orange-500 to-rose-500" },
  CRITICAL: { ring: "ring-rose-500/40", text: "text-rose-300", bg: "bg-rose-500/10", bar: "from-rose-500 to-red-600" },
};
const sevTone = (s) => SEV[String(s || "").toUpperCase()] || SEV.MODERATE;

// Premium face: real photo, falls back to the shared initials avatar.
function Face({ player, size = 56, className = "" }) {
  const [broken, setBroken] = useState(false);
  const name = `${player?.firstName || ""} ${player?.lastName || ""}`.trim();
  const usePhoto = player?.photoUrl && !broken;
  return (
    <div className={`relative overflow-hidden rounded-2xl shrink-0 ${className}`} style={{ width: size, height: size }}>
      <PlayerAvatar name={name} sport="General" className="absolute inset-0 w-full h-full" />
      {usePhoto && (
        <img src={player.photoUrl} alt={name} loading="lazy" onError={() => setBroken(true)}
          className="absolute inset-0 w-full h-full object-cover object-top" />
      )}
    </div>
  );
}

const clip = (s, n = 60) => {
  const t = String(s ?? "").trim();
  return t.length > n ? `${t.slice(0, n - 1)}…` : t;
};

// ─── Stage template config ───────────────────────────────────────────────────
// For each stage with a picker we declare:
//   list   → which system-wide list (from props.templates) holds reusable records
//   label  → a short, content-derived label so the user recognises a template
//   prefill→ maps a chosen record's content onto the stage form fields (so picking
//            PRE-FILLS the create-form; the user can then tweak before confirming).
// On confirm the existing submit[stage] handler always POSTs a NEW record for the
// CURRENT injury/player using these form values — so a template's content is COPIED
// into a fresh record, never re-linked.
const STAGE_TEMPLATES = {
  diagnosis: {
    list: "diagnoses",
    label: (d) => clip(d.diagnosis) || clip(d.recommendations) || `Diagnosis #${d.id}`,
    sub: (d) => clip(d.recommendations, 70),
    prefill: (d) => ({
      diagnosis: d.diagnosis || "",
      medicalNotes: d.medicalNotes || "",
      recommendations: d.recommendations || "",
      testResults: d.testResults || "",
    }),
    dedupeKey: (d) => `${d.diagnosis}|${d.recommendations}`,
  },
  treatment: {
    list: "treatments",
    label: (t) => clip(t.medication ? `${t.treatmentType} · ${t.medication}` : t.treatmentType) || `Treatment #${t.id}`,
    sub: (t) => clip(t.description, 70),
    prefill: (t) => ({
      treatmentType: t.treatmentType || "",
      medication: t.medication || "",
      dosage: t.dosage || "",
      description: t.description || "",
    }),
    dedupeKey: (t) => `${t.treatmentType}|${t.medication}|${t.description}`,
  },
  rehab: {
    list: "rehabilitations",
    label: (r) => clip(r.rehabPlan) || `Rehabilitation #${r.id}`,
    sub: (r) => clip(r.exercises, 70),
    prefill: (r) => ({
      rehabPlan: r.rehabPlan || "",
      exercises: r.exercises || "",
      durationWeeks: r.durationWeeks ?? 3,
      restrictions: r.restrictions || "",
    }),
    dedupeKey: (r) => `${r.rehabPlan}|${r.exercises}`,
  },
  recovery: {
    list: "recoveries",
    label: (r) => clip(r.programName) || `Recovery #${r.id}`,
    sub: (r) => clip(r.activities, 70),
    prefill: (r) => ({
      programName: r.programName || "",
      sessionsPerWeek: r.sessionsPerWeek ?? 5,
      activities: r.activities || "",
      nutritionPlan: r.nutritionPlan || "",
    }),
    dedupeKey: (r) => `${r.programName}|${r.activities}`,
  },
  fitness: {
    list: "fitness",
    label: (f) => clip(f.testName) || pretty(f.testType) || `Fitness test #${f.id}`,
    sub: (f) => `${pretty(f.testType)} · ${f.result ?? "—"} ${f.unit || ""}`.trim(),
    prefill: (f) => ({
      testName: f.testName || "",
      testType: f.testType || "ENDURANCE_TEST",
      result: f.result ?? 95,
      unit: f.unit || "%",
      // Keep the clearing outcome as PASS by default — a template's own FAIL/POOR
      // shouldn't silently block clearance; the user can still change it.
    }),
    dedupeKey: (f) => `${f.testName}|${f.testType}`,
  },
};

// Build a most-recent-first, content-deduped option list for a stage, merging
// BOTH sources the catalog exposes:
//   • the de-duplicated REAL DB records (templates[cfg.list]), and
//   • the general localStorage CATALOG templates for the matching type.
// localStorage templates are listed first (freshly authored, unassigned) and a
// real record is dropped if its content key already came from a template — so a
// catalog entry the user just created shows up here ready to be ASSIGNED.
function buildTemplateOptions(stageKey, templates) {
  const cfg = STAGE_TEMPLATES[stageKey];
  if (!cfg) return [];
  const catalogType = STAGE_CATALOG_TYPE[stageKey];
  const stored = catalogType
    ? readTemplates(catalogType).map((t) => ({ ...t, __template: true }))
    : [];
  const real = (templates?.[cfg.list] || []).filter(Boolean);
  const sorted = [
    ...stored, // keep templates pinned first regardless of date
    ...real.slice().sort((a, b) => {
      const da = a.diagnosedAt || a.createdAt || a.testDate || a.startDate || "";
      const db = b.diagnosedAt || b.createdAt || b.testDate || b.startDate || "";
      return String(db).localeCompare(String(da));
    }),
  ];
  const seen = new Set();
  const out = [];
  for (const r of sorted) {
    const key = cfg.dedupeKey(r);
    if (!key || !key.replace(/\|/g, "").trim()) continue;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(r);
  }
  return out;
}

// ─── Stage model ──────────────────────────────────────────────────────────────
// Index 0..5. The "current" stage is the first one that is not yet complete.
const STAGES = [
  { key: "injury", n: 1, label: "Injury", icon: "report_problem" },
  { key: "diagnosis", n: 2, label: "Diagnosis", icon: "stethoscope" },
  { key: "treatment", n: 3, label: "Treatment", icon: "medication" },
  { key: "rehab", n: 4, label: "Rehabilitation", icon: "healing" },
  { key: "recovery", n: 5, label: "Recovery", icon: "self_improvement" },
  { key: "fitness", n: 6, label: "Fitness Test", icon: "fitness_center" },
];

// Determine which stages are complete.
//
// SINGLE SOURCE OF TRUTH: completion is decided by injury.status via
// stageFromInjury() — exactly what the landing card uses — so the stepper and the
// card can never disagree. We do NOT infer a later stage just because a stray
// sub-record (a leftover diagnosis/treatment/fitness from another injury or a
// previous test run) happens to exist.
//
// The sub-records (diag/treat/rehab/recov/passedTest) are looked up STRICTLY by
// THIS injury's id, only for displaying the details of stages the status already
// marks complete. No "[0]" fallback — a record belonging to a different injury
// must never surface here.
function computeProgress(injury, rec) {
  const injId = injury?.id;
  const matchInj = (x) => x && String(x.injuryId) === String(injId);

  const diag = (rec.diagnoses || []).find(matchInj) || null;
  const treat = (rec.treatments || []).find(matchInj) || null;
  const rehab = (rec.rehabilitations || []).find(matchInj) || null;
  const recov = rehab
    ? (rec.recoveries || []).find((rp) => String(rp.rehabilitationId) === String(rehab.id)) || null
    : null;
  // A passing fitness test only counts toward THIS injury once the lifecycle has
  // reached RECOVERED (status is the source of truth); pick the most recent pass
  // for display.
  const passedTest =
    [...(rec.fitness || [])].filter(isFitnessPass).sort((a, b) => String(b.testDate || "").localeCompare(String(a.testDate || "")))[0] || null;
  const injStatus = normStatus(injury);

  // stagesDone: 0..6 derived purely from status (REPORTED=1 … RECOVERED=6).
  // The lifecycle has 5 distinct statuses but 6 journey stages — "recovery" has
  // no status of its own (it sits between RECOVERING and the final RECOVERED).
  // So recovery completion is the one step keyed off its (strictly-matched) record,
  // and only once the status has reached RECOVERING. Everything else follows status.
  const stagesDone = stageFromInjury(injury);
  const recoveryDone = injStatus === "RECOVERED" || (stagesDone >= 4 && !!recov);
  const done = {
    injury: stagesDone >= 1,
    diagnosis: stagesDone >= 2,
    treatment: stagesDone >= 3,
    rehab: stagesDone >= 4,
    recovery: recoveryDone,
    fitness: stagesDone >= 6,
  };
  return { done, diag, treat, rehab, recov, passedTest, injStatus };
}

// ─── Inline stage form ──────────────────────────────────────────────────────
function Field({ label, value, onChange, type = "text", options, full }) {
  return (
    <div className={`flex flex-col gap-1.5 ${full ? "sm:col-span-2" : ""}`}>
      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{label}</label>
      {type === "select" ? (
        <select value={value ?? ""} onChange={(e) => onChange(e.target.value)}
          className="w-full px-3 py-2.5 rounded-xl border border-slate-800 bg-slate-900/60 text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500">
          {(options || []).map((o) => <option key={o} value={o} className="bg-slate-900">{pretty(o)}</option>)}
        </select>
      ) : type === "textarea" ? (
        <textarea value={value ?? ""} onChange={(e) => onChange(e.target.value)} rows={2}
          className="w-full px-3 py-2.5 rounded-xl border border-slate-800 bg-slate-900/60 text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500" />
      ) : (
        <input type={type} value={value ?? ""} onChange={(e) => onChange(e.target.value)}
          className="w-full px-3 py-2.5 rounded-xl border border-slate-800 bg-slate-900/60 text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500" />
      )}
    </div>
  );
}

// ─── A single stage row ───────────────────────────────────────────────────────
function StageRow({ stage, state, isLast, children }) {
  // state: "done" | "current" | "locked"
  const tone =
    state === "done" ? { dot: "bg-emerald-500 text-white", line: "bg-emerald-500/40", text: "text-emerald-300", chip: "bg-emerald-500/10 border-emerald-500/30 text-emerald-300" }
      : state === "current" ? { dot: "bg-teal-500 text-white ring-4 ring-teal-500/20", line: "bg-slate-800", text: "text-white", chip: "bg-teal-500/10 border-teal-500/40 text-teal-200" }
        : { dot: "bg-slate-800 text-slate-600", line: "bg-slate-800", text: "text-slate-600", chip: "bg-slate-800/60 border-slate-800 text-slate-600" };

  return (
    <div className="flex gap-4">
      {/* rail */}
      <div className="flex flex-col items-center">
        <div className={`w-10 h-10 rounded-full grid place-items-center shrink-0 font-black text-sm transition-all ${tone.dot}`}>
          {state === "done" ? <FiCheck className="text-lg" /> : state === "locked" ? <FiLock className="text-xs" /> : stage.n}
        </div>
        {!isLast && <div className={`w-0.5 flex-1 min-h-[20px] my-1 rounded ${tone.line}`} />}
      </div>
      {/* body */}
      <div className="flex-1 pb-7 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <h4 className={`text-sm font-black uppercase tracking-wide ${tone.text}`}>{stage.label}</h4>
          <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${tone.chip}`}>
            {state === "done" ? "Completed" : state === "current" ? "Action needed" : "Locked"}
          </span>
        </div>
        <div className="mt-2.5">{children}</div>
      </div>
    </div>
  );
}

// Small read-only data line used inside completed stages.
const DL = ({ items }) => (
  <div className="rounded-2xl border border-slate-800 bg-slate-950/50 p-4 space-y-2">
    {items.filter((i) => i && i[1] != null && i[1] !== "").map(([k, v], i) => (
      <div key={i} className="flex justify-between gap-4 text-[12px]">
        <span className="text-slate-500 font-bold uppercase tracking-wider text-[10px] shrink-0 pt-0.5">{k}</span>
        <span className="text-slate-200 text-right">{v}</span>
      </div>
    ))}
  </div>
);

// Stable identity for an option: localStorage templates carry __catalogId,
// real DB records carry id.
const optId = (r) => r.__catalogId ?? r.id;

export default function MedicalJourney({ player, rec, injury, templates, catalogVersion, onClose, onChanged, pushToast }) {
  const { role } = useRole();
  // Whether the current viewer may action a given stage (see STAGE_CAN above).
  const canActStage = (key) => {
    const fn = STAGE_CAN[key];
    return fn ? fn(role) : false;
  };
  const [form, setForm] = useState({});
  const [busy, setBusy] = useState(false);
  // Per-stage picker mode: undefined = nothing chosen yet (show selector),
  // "new" = blank create-form, or a template id = that template is selected.
  const [picked, setPicked] = useState({});
  const sev = sevTone(injury?.severity);
  const prog = useMemo(() => computeProgress(injury, rec), [injury, rec]);

  // current stage index = first not-done
  const currentIdx = useMemo(() => {
    const i = STAGES.findIndex((s) => !prog.done[s.key]);
    return i === -1 ? STAGES.length : i; // length == fully complete
  }, [prog]);

  const completedCount = Object.values(prog.done).filter(Boolean).length;
  const pct = Math.round((completedCount / STAGES.length) * 100);
  const fullyFit = currentIdx >= STAGES.length;

  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));
  const toast = (msg, type = "success") => pushToast?.({ msg, type });

  // Template options per stage: the de-duplicated REAL records merged with the
  // general localStorage CATALOG templates. catalogVersion forces a re-read so a
  // template just added on a catalog tab appears here immediately.
  const stageOptions = useMemo(() => {
    const o = {};
    for (const key of Object.keys(STAGE_TEMPLATES)) o[key] = buildTemplateOptions(key, templates);
    return o;
  }, [templates, catalogVersion]);

  // Pick an existing record → PRE-FILL the form with its content (copied, not linked).
  const pickTemplate = (stageKey, record) => {
    const cfg = STAGE_TEMPLATES[stageKey];
    setForm(cfg ? cfg.prefill(record) : {});
    setPicked((p) => ({ ...p, [stageKey]: optId(record) }));
  };
  // Start a fresh, blank record for this stage.
  const pickCreateNew = (stageKey) => {
    setForm({});
    setPicked((p) => ({ ...p, [stageKey]: "new" }));
  };
  // Back to the selector (un-choose).
  const resetPick = (stageKey) => {
    setForm({});
    setPicked((p) => ({ ...p, [stageKey]: undefined }));
  };

  // Advance the injury record to a new status (sends full record back — verified
  // PUT /injuries/{id} round-trips with the whole body).
  const setInjuryStatus = async (status) => {
    if (!injury?.id) return;
    await api.medical.Injuries.put(injury.id, { ...injury, status });
  };

  // ── Stage submit handlers (each: POST the record, then advance injury status)
  const submit = {
    diagnosis: async () => {
      await api.medical.Diagnoses.post({
        injuryId: injury.id,
        playerKeycloakId: player.keycloakId,
        doctorKeycloakId: DEFAULT_DOCTOR_KEYCLOAK,
        diagnosis: form.diagnosis || `Clinical assessment of ${pretty(injury.injuryType)} — ${injury.bodyPart}`,
        medicalNotes: form.medicalNotes || "Examined; imaging reviewed. No complications noted.",
        recommendations: form.recommendations || "Begin guided treatment; reassess weekly.",
        diagnosedAt: nowIso(),
        testResults: form.testResults || "Within expected range",
        attachments: "None",
      });
      await setInjuryStatus("DIAGNOSED");
      toast(`Diagnosis recorded · injury advanced to DIAGNOSED`);
    },
    treatment: async () => {
      await api.medical.Treatments.post({
        injuryId: injury.id,
        playerId: player.id,
        doctorId: DEFAULT_DOCTOR_ID,
        treatmentType: form.treatmentType || "Physiotherapy",
        description: form.description || "Progressive loading, manual therapy and controlled mobilisation.",
        medication: form.medication || null,
        dosage: form.dosage || null,
        status: "IN_PROGRESS",
        startDate: form.startDate || today(),
        endDate: null,
        createdAt: nowIso(),
        notes: form.notes || "Treatment plan initiated.",
        response: "Pending",
      });
      await setInjuryStatus("TREATING");
      toast(`Treatment started · injury advanced to TREATING`);
    },
    rehab: async () => {
      await api.medical.Rehabilitation.post({
        injuryId: injury.id,
        playerId: player.id,
        physiotherapistId: DEFAULT_DOCTOR_ID,
        status: "COMPLETED",
        rehabPlan: form.rehabPlan || "Phased return-to-play: pain mgmt → strength → sport-specific → match fit.",
        exercises: form.exercises || "Mobility, progressive strength, balance and sport-specific drills.",
        durationWeeks: Number(form.durationWeeks || 3),
        startDate: form.startDate || today(),
        expectedEndDate: form.expectedEndDate || null,
        actualEndDate: today(),
        createdAt: nowIso(),
        progressNotes: form.progressNotes || "Rehabilitation completed; player tolerating full loading.",
        restrictions: form.restrictions || "Cleared for non-contact; build contact load gradually.",
      });
      await setInjuryStatus("RECOVERING");
      toast(`Rehabilitation finished · injury advanced to RECOVERING`);
    },
    recovery: async () => {
      // Recovery links to the rehab record (rehabilitationId), per backend shape.
      // POST /recovery-programs REQUIRES a non-null rehabilitationId — an injury
      // that reached RECOVERING without a rehab (e.g. Ansu Fati / injury 7) would
      // otherwise 500. Self-heal by reusing this injury's rehab or creating one.
      let rehabId = prog.rehab?.id;
      if (rehabId == null) rehabId = await ensureRehabilitation(injury, player);
      if (rehabId == null) throw new Error("Could not create or find a rehabilitation for this injury — recovery program needs one.");
      await api.medical.Recovery.post({
        rehabilitationId: Number(rehabId),
        playerId: player.id,
        createdByDoctorId: DEFAULT_DOCTOR_ID,
        status: "COMPLETED",
        programName: form.programName || `Return-to-fitness — ${player.lastName}`,
        description: form.description || "Active recovery and conditioning ahead of fitness testing.",
        activities: form.activities || "Pool sessions, bike intervals, strength maintenance.",
        nutritionPlan: form.nutritionPlan || "High-protein, anti-inflammatory nutrition plan.",
        startDate: form.startDate || today(),
        endDate: today(),
        createdAt: nowIso(),
        sessionsPerWeek: Number(form.sessionsPerWeek || 5),
        durationMinutes: Number(form.durationMinutes || 60),
        progressNotes: "Workload tolerated well; ready for fitness assessment.",
        goals: form.goals || "Restore full match fitness.",
      });
      toast(`Recovery programme completed · ready for fitness test`);
    },
    fitness: async () => {
      const category = form.resultCategory || "PASS";
      await api.medical.Fitness.post({
        playerKeycloakId: player.keycloakId,
        teamId: injury.teamId ? Number(injury.teamId) : null,
        testType: form.testType || "ENDURANCE_TEST",
        sportType: form.sportType || "FOOTBALL",
        testDate: nowIso(),
        conductedByDoctorKeycloakId: DEFAULT_DOCTOR_KEYCLOAK,
        testName: form.testName || "Return-to-play fitness assessment",
        result: form.result ? Number(form.result) : 95,
        unit: form.unit || "%",
        resultCategory: category,
        notes: "Return-to-play clearance assessment.",
        recommendations: "Cleared for full participation.",
        attachments: "None",
      });
      // A passing test = injury RECOVERED + player back to AVAILABLE.
      if (isFitnessPass({ resultCategory: category })) {
        await setInjuryStatus("RECOVERED");
        await clearInjuredPlayer(player);
        toast(`Fitness test PASSED · ${player.firstName} ${player.lastName} cleared & marked RECOVERED`);
      } else {
        toast(`Fitness test logged as ${category} — player remains in recovery`, "info");
      }
    },
  };

  const advance = async (key) => {
    if (busy) return;
    setBusy(true);
    try {
      await submit[key]();
      setForm({});
      setPicked((p) => ({ ...p, [key]: undefined }));
      await onChanged?.(); // re-fetch everything so the stepper reflects persisted state
    } catch (e) {
      console.error("stage advance failed", e);
      toast(e.message || "Could not save this stage", "error");
    } finally {
      setBusy(false);
    }
  };

  // ── Stage selector: pick an existing template OR create new ───────────────
  // Shown before the create-form. Picking a template PRE-FILLS the form (content
  // copied); on confirm the submit handler POSTs a brand-new record for THIS
  // injury/player carrying that content — it never re-links another injury's row.
  const renderPicker = (key) => {
    const opts = stageOptions[key] || [];
    const sel = picked[key];
    return (
      <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-4">
        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2.5">
          Reuse an existing {STAGES.find((s) => s.key === key)?.label.toLowerCase()} template
          {opts.length ? ` · ${opts.length} available` : ""}
        </p>
        {opts.length === 0 ? (
          <p className="text-[12px] text-slate-600 italic mb-3">No existing records yet — create a new one below.</p>
        ) : (
          <div className="flex flex-col gap-2 max-h-52 overflow-y-auto pr-1 mb-3">
            {opts.map((r) => {
              const cfg = STAGE_TEMPLATES[key];
              const id = optId(r);
              const isSel = String(sel) === String(id);
              return (
                <button key={id} type="button" onClick={() => pickTemplate(key, r)}
                  className={`text-left rounded-xl border px-3.5 py-2.5 transition-all ${isSel
                    ? "border-teal-500/60 bg-teal-500/10 ring-1 ring-teal-500/30"
                    : "border-slate-800 bg-slate-900/50 hover:border-teal-500/40 hover:bg-slate-900"}`}>
                  <div className="flex items-center gap-2">
                    {isSel && <FiCheck className="text-teal-300 shrink-0" />}
                    <span className={`text-[12px] font-bold truncate ${isSel ? "text-teal-200" : "text-slate-200"}`}>{cfg.label(r)}</span>
                    {r.__template && (
                      <span className="ml-auto px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest bg-teal-500/10 text-teal-300 border border-teal-500/30 shrink-0">Library</span>
                    )}
                  </div>
                  {cfg.sub(r) && <p className="text-[10.5px] text-slate-500 mt-0.5 truncate">{cfg.sub(r)}</p>}
                </button>
              );
            })}
          </div>
        )}
        <button type="button" onClick={() => pickCreateNew(key)}
          className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border text-[10px] font-black uppercase tracking-widest transition-all ${sel === "new"
            ? "border-teal-500/60 bg-teal-500/10 text-teal-200"
            : "border-slate-700 text-slate-300 hover:border-teal-500/40 hover:text-white"}`}>
          <span className="material-icons text-sm">add</span> Create new
        </button>
      </div>
    );
  };

  // Read-only notice shown to roles who may VIEW this stage but not action it.
  // Names the responsible role per the per-stage policy so the viewer knows who
  // can advance it (e.g. a physiotherapist viewing the diagnosis stage).
  const STAGE_OWNER = {
    diagnosis: "the team doctor",
    treatment: "the team doctor",
    rehab: "the physiotherapist",
    recovery: "the physiotherapist",
    fitness: "the fitness coach",
  };
  const renderLockedForRole = (key) => (
    <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-4 flex items-center gap-3">
      <FiLock className="text-slate-500 shrink-0" />
      <p className="text-[12px] text-slate-500">
        Awaiting action from {STAGE_OWNER[key] || "the responsible specialist"}. You can view progress but cannot edit this stage.
      </p>
    </div>
  );

  // ── Render the action body for the CURRENT stage ──────────────────────────
  const renderCurrentForm = (key) => {
    // Role gate: only the responsible role (or admin) may action this stage.
    // The stepper still renders; non-owners just see a read-only notice.
    if (!canActStage(key)) return renderLockedForRole(key);
    const sel = picked[key];
    // Stage 1) nothing chosen → show the selector (existing templates + Create new).
    if (sel === undefined || sel === null) return renderPicker(key);

    const ActionBtn = ({ label }) => (
      <button onClick={() => advance(key)} disabled={busy}
        className="mt-3 inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-white text-[11px] font-black uppercase tracking-widest shadow-lg shadow-teal-900/30 transition-all active:scale-95">
        {busy ? "Saving…" : <>{label} <FiArrowRight /></>}
      </button>
    );
    const fromTemplate = sel !== "new";
    const banner = (
      <div className="sm:col-span-2 flex items-center justify-between gap-2 -mt-0.5 mb-0.5">
        <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${fromTemplate
          ? "bg-teal-500/10 border-teal-500/40 text-teal-200" : "bg-slate-800/60 border-slate-700 text-slate-300"}`}>
          {fromTemplate ? "Pre-filled from template · edit & confirm to save as new" : "New record"}
        </span>
        <button type="button" onClick={() => resetPick(key)}
          className="text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-teal-300 transition-colors">
          Change
        </button>
      </div>
    );
    const wrap = (children) => (
      <div className="rounded-2xl border border-teal-500/30 bg-teal-500/[0.04] p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">{banner}{children}</div>
      </div>
    );

    if (key === "diagnosis") return wrap(<>
      <Field label="Diagnosis" full value={form.diagnosis} onChange={(v) => set("diagnosis", v)} type="textarea" />
      <Field label="Medical Notes" full value={form.medicalNotes} onChange={(v) => set("medicalNotes", v)} type="textarea" />
      <Field label="Recommendations" full value={form.recommendations} onChange={(v) => set("recommendations", v)} type="textarea" />
      <Field label="Test Results" value={form.testResults} onChange={(v) => set("testResults", v)} />
      <div className="sm:col-span-2"><ActionBtn label="Complete diagnosis" /></div>
    </>);

    if (key === "treatment") return wrap(<>
      <Field label="Treatment Type" value={form.treatmentType} onChange={(v) => set("treatmentType", v)} />
      <Field label="Medication (optional)" value={form.medication} onChange={(v) => set("medication", v)} />
      <Field label="Dosage (optional)" value={form.dosage} onChange={(v) => set("dosage", v)} />
      <Field label="Start Date" type="date" value={form.startDate || today()} onChange={(v) => set("startDate", v)} />
      <Field label="Description" full value={form.description} onChange={(v) => set("description", v)} type="textarea" />
      <div className="sm:col-span-2"><ActionBtn label="Complete treatment" /></div>
    </>);

    if (key === "rehab") return wrap(<>
      <Field label="Rehab Plan" full value={form.rehabPlan} onChange={(v) => set("rehabPlan", v)} type="textarea" />
      <Field label="Exercises" full value={form.exercises} onChange={(v) => set("exercises", v)} type="textarea" />
      <Field label="Duration (weeks)" type="number" value={form.durationWeeks ?? 3} onChange={(v) => set("durationWeeks", v)} />
      <Field label="Restrictions" value={form.restrictions} onChange={(v) => set("restrictions", v)} />
      <div className="sm:col-span-2"><ActionBtn label="Finished rehabilitation" /></div>
    </>);

    if (key === "recovery") return wrap(<>
      <Field label="Program Name" value={form.programName} onChange={(v) => set("programName", v)} />
      <Field label="Sessions / Week" type="number" value={form.sessionsPerWeek ?? 5} onChange={(v) => set("sessionsPerWeek", v)} />
      <Field label="Activities" full value={form.activities} onChange={(v) => set("activities", v)} type="textarea" />
      <Field label="Nutrition Plan" full value={form.nutritionPlan} onChange={(v) => set("nutritionPlan", v)} type="textarea" />
      <div className="sm:col-span-2"><ActionBtn label="Finished recovery" /></div>
    </>);

    if (key === "fitness") return wrap(<>
      <Field label="Test Name" value={form.testName || "Return-to-play fitness assessment"} onChange={(v) => set("testName", v)} />
      <Field label="Test Type" type="select" options={["ENDURANCE_TEST", "VO2_MAX", "SPEED_TEST", "AGILITY_TEST", "STRENGTH_TEST", "FLEXIBILITY_TEST"]} value={form.testType || "ENDURANCE_TEST"} onChange={(v) => set("testType", v)} />
      <Field label="Result" type="number" value={form.result ?? 95} onChange={(v) => set("result", v)} />
      <Field label="Unit" value={form.unit || "%"} onChange={(v) => set("unit", v)} />
      <Field label="Outcome (PASS clears the player)" type="select" options={["PASS", "EXCELLENT", "GOOD", "AVERAGE", "FAIL", "POOR"]} value={form.resultCategory || "PASS"} onChange={(v) => set("resultCategory", v)} />
      <div className="sm:col-span-2"><ActionBtn label="Record fitness test" /></div>
    </>);

    return null;
  };

  // ── Render completed-stage data ──────────────────────────────────────────
  const renderDoneData = (key) => {
    if (key === "injury") return <DL items={[
      ["Type", pretty(injury.injuryType)], ["Body part", injury.bodyPart], ["Severity", pretty(injury.severity)],
      ["Reported", fmtDate(injury.injuryDate)], ["Notes", injury.description],
    ]} />;
    if (key === "diagnosis" && prog.diag) return <DL items={[
      ["Diagnosis", prog.diag.diagnosis], ["Notes", prog.diag.medicalNotes],
      ["Recommendations", prog.diag.recommendations], ["Date", fmtDate(prog.diag.diagnosedAt)],
    ]} />;
    if (key === "treatment" && prog.treat) return <DL items={[
      ["Type", prog.treat.treatmentType], ["Status", pretty(prog.treat.status)],
      ["Medication", prog.treat.medication], ["Started", fmtDate(prog.treat.startDate)],
      ["Details", prog.treat.description],
    ]} />;
    if (key === "rehab" && prog.rehab) return <DL items={[
      ["Plan", prog.rehab.rehabPlan], ["Status", pretty(prog.rehab.status)],
      ["Duration", `${prog.rehab.durationWeeks || "?"} weeks`], ["Exercises", prog.rehab.exercises],
      ["Restrictions", prog.rehab.restrictions],
    ]} />;
    if (key === "recovery" && prog.recov) return <DL items={[
      ["Program", prog.recov.programName], ["Status", pretty(prog.recov.status)],
      ["Sessions/wk", prog.recov.sessionsPerWeek], ["Activities", prog.recov.activities],
    ]} />;
    if (key === "fitness" && prog.passedTest) return <DL items={[
      ["Test", prog.passedTest.testName || pretty(prog.passedTest.testType)],
      ["Result", `${prog.passedTest.result ?? "—"} ${prog.passedTest.unit || ""}`.trim()],
      ["Outcome", `${prog.passedTest.resultCategory} (PASS)`], ["Date", fmtDate(prog.passedTest.testDate)],
    ]} />;
    return <p className="text-[12px] text-emerald-300/70 italic">Stage marked complete.</p>;
  };

  return (
    <div className="fixed inset-0 z-[120] bg-black/75 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="w-full max-w-3xl max-h-[92vh] flex flex-col overflow-hidden rounded-3xl border border-slate-800 bg-slate-950 shadow-2xl">

        {/* Header */}
        <div className={`relative shrink-0 px-6 py-5 border-b border-slate-800 bg-gradient-to-br from-[#062b2b] via-slate-900 to-[#0a2a3f]`}>
          <div className="absolute -right-8 -top-10 w-52 h-52 rounded-full bg-teal-500/10 blur-3xl" />
          <div className="relative flex items-start justify-between gap-4">
            <div className="flex items-center gap-4 min-w-0">
              <Face player={player} size={60} className={`ring-2 ${fullyFit ? "ring-emerald-500/50" : sev.ring}`} />
              <div className="min-w-0">
                <h3 className="text-xl font-black text-white leading-tight truncate">{player.firstName} {player.lastName}</h3>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${fullyFit ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300" : `${sev.bg} ${sev.ring} ${sev.text} ring-1`}`}>
                    {fullyFit ? "✓ Fit · Returned" : `${pretty(injury?.severity)} · ${pretty(injury?.injuryType)}`}
                  </span>
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{injury?.bodyPart}</span>
                </div>
              </div>
            </div>
            <button onClick={onClose} className="w-9 h-9 rounded-xl border border-slate-700 text-slate-400 hover:text-white hover:bg-slate-800 grid place-items-center transition-all"><FiX /></button>
          </div>

          {/* Progress tracker */}
          <div className="relative mt-5">
            <div className="flex justify-between items-center mb-1.5">
              <p className="text-[10px] font-black uppercase tracking-[0.25em] text-teal-300/80">Recovery progress</p>
              <p className="text-[10px] font-black text-white">{completedCount}/{STAGES.length} stages · {pct}%</p>
            </div>
            <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
              <div className={`h-full rounded-full bg-gradient-to-r ${fullyFit ? "from-emerald-500 to-teal-400" : "from-teal-500 to-cyan-400"} transition-all duration-500`} style={{ width: `${pct}%` }} />
            </div>
          </div>
        </div>

        {/* Stepper */}
        <div className="p-6 overflow-y-auto">
          {fullyFit && (
            <div className="mb-6 rounded-2xl border border-emerald-500/30 bg-emerald-500/[0.06] px-5 py-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-emerald-500 grid place-items-center text-white"><FiCheck className="text-xl" /></div>
              <div>
                <p className="text-emerald-300 font-black text-sm uppercase tracking-wide">Completed · Player is Fit</p>
                <p className="text-[12px] text-slate-400">{player.firstName} passed the return-to-play assessment and is available for selection.</p>
              </div>
            </div>
          )}

          {STAGES.map((stage, i) => {
            const state = i < currentIdx ? "done" : i === currentIdx ? "current" : "locked";
            return (
              <StageRow key={stage.key} stage={stage} state={state} isLast={i === STAGES.length - 1}>
                {state === "done" && renderDoneData(stage.key)}
                {state === "current" && (stage.key === "injury"
                  ? renderDoneData("injury") /* injury is always already reported */
                  : renderCurrentForm(stage.key))}
                {state === "locked" && (
                  <p className="text-[12px] text-slate-600 italic">Unlocks after the previous stage is completed.</p>
                )}
              </StageRow>
            );
          })}
        </div>
      </div>
    </div>
  );
}
