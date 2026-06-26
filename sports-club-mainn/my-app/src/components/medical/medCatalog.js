// src/components/medical/medCatalog.js
// ─────────────────────────────────────────────────────────────────────────────
// GENERAL MEDICAL CATALOG (libraries, not per-player lists)
//
// The six medical type-tabs (Injuries → Fitness Tests) are presented as reusable
// reference LIBRARIES of content templates — an injury-type catalog, diagnosis
// templates, treatment protocols, rehab plans, recovery programs and fitness
// tests. They are NOT framed as "player X's record".
//
// Two sources feed each catalog tab and the Treatment Room stage picker:
//   1) REAL DB records (GET the type endpoint) — de-duplicated by CONTENT so the
//      same protocol logged for many players collapses into one library entry.
//   2) localStorage TEMPLATES — general/reusable entries the user defines with
//      "+ New" on a catalog tab. The backend cannot persist a record without a
//      player/injury link, so these unassigned templates live in a namespaced
//      localStorage catalog: `mscms:medcatalog:<type>`.
//
// Per-player ASSIGNMENT happens only in the Treatment Room (MedicalJourney),
// where picking a catalog entry COPIES its content into a brand-new per-injury
// DB record. This file owns the catalog data model + the content-dedupe logic.
// ─────────────────────────────────────────────────────────────────────────────

const NS = "mscms:medcatalog:";
const pretty = (v) => (v ? String(v).replace(/_/g, " ") : "");
const clip = (s, n = 90) => {
  const t = String(s ?? "").trim();
  return t.length > n ? `${t.slice(0, n - 1)}…` : t;
};

// The six catalog types, keyed by the api.medical key used everywhere else.
export const CATALOG_TYPES = ["Injuries", "Diagnoses", "Treatments", "Rehabilitation", "Recovery", "Fitness"];

// ─── Per-type catalog descriptor ─────────────────────────────────────────────
// title    → the content headline of a library entry (NEVER a player name)
// subtitle → a secondary content line
// tags     → small key/value chips of reusable content facts
// dedupeKey→ collapses identical-content DB rows from different players into one
// stageKey → which MedicalJourney stage this catalog maps to (for assignment)
// fields   → the "+ New" template form fields (content only, no player/team/IDs)
// blurb    → one-line description of what this library holds
export const CATALOG_CONFIG = {
  Injuries: {
    icon: "local_hospital",
    label: "Injury Types",
    blurb: "Reference catalog of injury types, body parts & severity profiles.",
    stageKey: null, // injuries seed the workflow; assigned by logging, not the picker
    title: (r) => pretty(r.injuryType) || "Injury",
    subtitle: (r) => r.bodyPart || pretty(r.severity),
    tags: (r) => [
      ["Severity", pretty(r.severity)],
      ["Body part", r.bodyPart],
    ],
    dedupeKey: (r) => `${r.injuryType}|${r.bodyPart}|${r.severity}`,
    fields: [
      { key: "injuryType", label: "Injury Type", type: "select", options: ["MUSCLE_STRAIN", "LIGAMENT_SPRAIN", "FRACTURE", "CONTUSION", "TENDONITIS", "DISLOCATION", "CONCUSSION", "OTHER"], required: true },
      { key: "severity", label: "Typical Severity", type: "select", options: ["MINOR", "MODERATE", "SEVERE", "CRITICAL"], required: true },
      { key: "bodyPart", label: "Body Part", required: true },
      { key: "description", label: "Description", type: "textarea", full: true },
    ],
  },
  Diagnoses: {
    icon: "description",
    label: "Diagnosis Templates",
    blurb: "Reusable diagnosis write-ups, clinical notes & recommendation sets.",
    stageKey: "diagnosis",
    title: (r) => clip(r.diagnosis, 80) || "Diagnosis template",
    subtitle: (r) => clip(r.recommendations, 90),
    tags: (r) => [
      ["Test results", clip(r.testResults, 30)],
    ],
    dedupeKey: (r) => `${r.diagnosis}|${r.recommendations}`,
    fields: [
      { key: "diagnosis", label: "Diagnosis", type: "textarea", full: true, required: true },
      { key: "medicalNotes", label: "Medical Notes", type: "textarea", full: true },
      { key: "recommendations", label: "Recommendations", type: "textarea", full: true, required: true },
      { key: "testResults", label: "Typical Test Results", },
    ],
  },
  Treatments: {
    icon: "medication",
    label: "Treatment Protocols",
    blurb: "Reusable treatment protocols, medications & dosage guidance.",
    stageKey: "treatment",
    title: (r) => clip(r.treatmentType, 60) || "Treatment protocol",
    subtitle: (r) => (r.medication ? `Medication: ${r.medication}` : clip(r.description, 90)),
    tags: (r) => [
      ["Medication", r.medication],
      ["Dosage", r.dosage],
    ],
    dedupeKey: (r) => `${r.treatmentType}|${r.medication}|${r.description}`,
    fields: [
      { key: "treatmentType", label: "Treatment Type", required: true },
      { key: "medication", label: "Medication" },
      { key: "dosage", label: "Dosage" },
      { key: "description", label: "Description", type: "textarea", full: true, required: true },
    ],
  },
  Rehabilitation: {
    icon: "healing",
    label: "Rehab Plans",
    blurb: "Reusable phased rehabilitation plans, exercises & restrictions.",
    stageKey: "rehab",
    title: (r) => clip(r.rehabPlan, 80) || "Rehab plan",
    subtitle: (r) => clip(r.exercises, 90),
    tags: (r) => [
      ["Duration", r.durationWeeks ? `${r.durationWeeks} wks` : null],
      ["Restrictions", clip(r.restrictions, 30)],
    ],
    dedupeKey: (r) => `${r.rehabPlan}|${r.exercises}`,
    fields: [
      { key: "rehabPlan", label: "Rehab Plan", type: "textarea", full: true, required: true },
      { key: "exercises", label: "Exercises", type: "textarea", full: true, required: true },
      { key: "durationWeeks", label: "Duration (Weeks)", type: "number" },
      { key: "restrictions", label: "Restrictions", type: "textarea", full: true },
    ],
  },
  Recovery: {
    icon: "self_improvement",
    label: "Recovery Programs",
    blurb: "Reusable return-to-fitness programs, activities & nutrition plans.",
    stageKey: "recovery",
    title: (r) => clip(r.programName, 70) || "Recovery program",
    subtitle: (r) => clip(r.activities, 90) || clip(r.description, 90),
    tags: (r) => [
      ["Sessions/wk", r.sessionsPerWeek],
      ["Duration", r.durationMinutes ? `${r.durationMinutes} min` : null],
    ],
    dedupeKey: (r) => `${r.programName}|${r.activities}`,
    fields: [
      { key: "programName", label: "Program Name", required: true },
      { key: "activities", label: "Activities", type: "textarea", full: true, required: true },
      { key: "nutritionPlan", label: "Nutrition Plan", type: "textarea", full: true },
      { key: "sessionsPerWeek", label: "Sessions / Week", type: "number" },
      { key: "durationMinutes", label: "Duration (Min)", type: "number" },
    ],
  },
  Fitness: {
    icon: "speed",
    label: "Fitness Tests",
    blurb: "Reusable fitness-test definitions, units & target results.",
    stageKey: "fitness",
    title: (r) => clip(r.testName, 60) || pretty(r.testType) || "Fitness test",
    subtitle: (r) => pretty(r.testType),
    tags: (r) => [
      ["Target", r.result != null ? `${r.result} ${r.unit || ""}`.trim() : null],
      ["Type", pretty(r.testType)],
    ],
    dedupeKey: (r) => `${r.testName}|${r.testType}`,
    fields: [
      { key: "testName", label: "Test Name", required: true },
      { key: "testType", label: "Test Type", type: "select", options: ["VO2_MAX", "SPEED_TEST", "AGILITY_TEST", "STRENGTH_TEST", "FLEXIBILITY_TEST", "ENDURANCE_TEST", "BODY_COMPOSITION", "OTHER"], required: true },
      { key: "result", label: "Target Result", type: "number" },
      { key: "unit", label: "Unit (e.g. ml/kg/min)", required: true },
    ],
  },
};

// ─── localStorage template catalog ───────────────────────────────────────────
const storageKey = (type) => `${NS}${type}`;

export function readTemplates(type) {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(storageKey(type));
    const arr = JSON.parse(raw || "[]");
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

function writeTemplates(type, list) {
  if (typeof window === "undefined") return;
  try { window.localStorage.setItem(storageKey(type), JSON.stringify(list)); } catch { }
}

// Add a new general/template entry to a type's localStorage catalog.
export function addTemplate(type, content) {
  const list = readTemplates(type);
  const entry = {
    ...content,
    __catalogId: `tpl_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    __template: true,
    __createdAt: new Date().toISOString(),
  };
  list.unshift(entry);
  writeTemplates(type, list);
  return entry;
}

export function removeTemplate(type, catalogId) {
  const list = readTemplates(type).filter((e) => e.__catalogId !== catalogId);
  writeTemplates(type, list);
  return list;
}

// ─── De-duplicate real DB records by CONTENT ─────────────────────────────────
// Collapses identical-content rows logged for different players into a single
// library entry, most-recent-first. The returned entries are tagged __template:
// false and carry __count (how many real rows collapsed into this entry).
export function dedupeRecords(type, records) {
  const cfg = CATALOG_CONFIG[type];
  if (!cfg) return [];
  const raw = (records || []).filter(Boolean);
  const sorted = [...raw].sort((a, b) => {
    const da = a.diagnosedAt || a.createdAt || a.testDate || a.startDate || a.injuryDate || "";
    const db = b.diagnosedAt || b.createdAt || b.testDate || b.startDate || b.injuryDate || "";
    return String(db).localeCompare(String(da));
  });
  const map = new Map();
  for (const r of sorted) {
    const key = cfg.dedupeKey(r);
    // skip rows whose content is entirely empty (the key is just separators)
    if (!key || !key.replace(/\|/g, "").trim()) continue;
    if (map.has(key)) { map.get(key).__count += 1; continue; }
    map.set(key, { ...r, __template: false, __count: 1, __catalogId: `db_${r.id ?? key}` });
  }
  return [...map.values()];
}

// ─── Build the full catalog (templates + de-duped real records) for a type ───
// Templates are listed first (freshly authored, unassigned), then the
// de-duplicated real protocols already in the database. Both are content-first.
export function buildCatalog(type, records) {
  const templates = readTemplates(type).map((t) => ({ ...t, __template: true, __count: 0 }));
  const real = dedupeRecords(type, records);
  return [...templates, ...real];
}
