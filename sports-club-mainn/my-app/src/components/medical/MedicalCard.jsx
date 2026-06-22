// src/components/medical/MedicalCard.jsx
// Renders one medical record. Resolves player/team IDs to names via the
// resolver callbacks passed from Medical.jsx — never shows a raw UUID or #id.

const SEVERITY_TONE = {
  MINOR: "bg-emerald-500/10 text-emerald-400",
  MODERATE: "bg-amber-500/10 text-amber-400",
  SEVERE: "bg-orange-500/10 text-orange-400",
  CRITICAL: "bg-red-500/10 text-red-400",
};
const STATUS_TONE = {
  RECOVERED: "bg-emerald-500/10 text-emerald-400",
  COMPLETED: "bg-emerald-500/10 text-emerald-400",
  ACTIVE: "bg-emerald-500/10 text-emerald-400",
  IN_PROGRESS: "bg-blue-500/10 text-blue-400",
  RECOVERING: "bg-amber-500/10 text-amber-400",
  TREATING: "bg-amber-500/10 text-amber-400",
  PLANNED: "bg-slate-500/10 text-slate-400",
  NOT_STARTED: "bg-slate-500/10 text-slate-400",
  REPORTED: "bg-red-500/10 text-red-400",
  DIAGNOSED: "bg-purple-500/10 text-purple-400",
  CHRONIC: "bg-red-500/10 text-red-400",
  PAUSED: "bg-slate-500/10 text-slate-400",
  CANCELLED: "bg-red-500/10 text-red-400",
};

const pretty = (v) => (v ? String(v).replace(/_/g, " ") : null);
const fmtDate = (d) => {
  if (!d) return null;
  const s = String(d).split("T")[0];
  return s;
};

export default function MedicalCard({
  data,
  type,
  icon = "medical_services",
  playerNameById,
  playerNameByKeycloak,
  teamName,
  onEdit,
  onDelete,
}) {
  // Resolve the player name from whichever field this record type carries.
  const player =
    data.playerKeycloakId != null
      ? playerNameByKeycloak(data.playerKeycloakId)
      : playerNameById(data.playerId);

  // Per-type title, subtitle, status, date, and key facts.
  let title = "Medical Record";
  let subtitle = null;
  let status = null;
  let statusTone = "bg-slate-500/10 text-slate-400";
  let dateLabel = "Date";
  let dateValue = null;
  const facts = []; // [{ label, value }]

  if (type === "Injuries") {
    title = pretty(data.injuryType) || "Injury";
    subtitle = data.bodyPart;
    status = data.severity;
    statusTone = SEVERITY_TONE[data.severity] || statusTone;
    dateLabel = "Injury Date";
    dateValue = fmtDate(data.injuryDate);
    facts.push({ label: "Stage", value: pretty(data.status) });
    facts.push({ label: "Team", value: teamName(data.teamId) });
  } else if (type === "Diagnoses") {
    title = data.diagnosis || "Diagnosis";
    subtitle = "Linked to Injury";
    status = "DIAGNOSED";
    statusTone = STATUS_TONE.DIAGNOSED;
    dateLabel = "Diagnosed";
    dateValue = fmtDate(data.diagnosedAt);
    facts.push({ label: "Notes", value: data.medicalNotes });
  } else if (type === "Treatments") {
    title = data.treatmentType || "Treatment";
    subtitle = data.medication ? `Medication: ${data.medication}` : data.description;
    status = data.status;
    statusTone = STATUS_TONE[data.status] || statusTone;
    dateLabel = "Start Date";
    dateValue = fmtDate(data.startDate);
    if (data.dosage) facts.push({ label: "Dosage", value: data.dosage });
  } else if (type === "Rehabilitation") {
    title = data.rehabPlan || "Rehabilitation";
    subtitle = data.durationWeeks ? `${data.durationWeeks} week programme` : "Rehab plan";
    status = data.status;
    statusTone = STATUS_TONE[data.status] || statusTone;
    dateLabel = "Start Date";
    dateValue = fmtDate(data.startDate);
    if (data.expectedEndDate) facts.push({ label: "Expected End", value: fmtDate(data.expectedEndDate) });
  } else if (type === "Recovery") {
    title = data.programName || "Recovery Program";
    subtitle = data.description;
    status = data.status;
    statusTone = STATUS_TONE[data.status] || statusTone;
    dateLabel = "Start Date";
    dateValue = fmtDate(data.startDate);
    if (data.sessionsPerWeek) facts.push({ label: "Sessions/Wk", value: data.sessionsPerWeek });
  } else if (type === "Fitness") {
    title = data.testName || pretty(data.testType) || "Fitness Test";
    subtitle = pretty(data.testType);
    status = data.resultCategory;
    statusTone = "bg-teal-500/10 text-teal-400";
    dateLabel = "Test Date";
    dateValue = fmtDate(data.testDate);
    if (data.result != null) facts.push({ label: "Result", value: `${data.result} ${data.unit || ""}`.trim() });
    facts.push({ label: "Team", value: teamName(data.teamId) });
  }

  return (
    <div className="bg-[#0a0f1d] border border-white/5 rounded-[2.5rem] p-6 hover:border-teal-500/30 transition-all shadow-2xl group relative overflow-hidden">

      {/* Top row: player + actions */}
      <div className="flex justify-between items-start mb-6">
        <div className="flex items-center gap-3">
          <div className="w-14 h-14 bg-slate-950 rounded-[1.4rem] flex items-center justify-center text-teal-400 border border-white/5 shadow-inner group-hover:scale-105 transition-all duration-300">
            <span className="material-icons text-2xl">{icon}</span>
          </div>
          <div>
            <p className="text-[9px] font-black tracking-[0.2em] uppercase text-slate-500">Patient</p>
            <p className="text-white font-bold text-sm leading-tight">{player}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => onEdit(data)}
            className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center text-slate-400 hover:bg-teal-500 hover:text-white transition-all"
          >
            <span className="material-icons text-sm">edit</span>
          </button>
          <button
            onClick={() => onDelete(data.id)}
            className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center text-red-500 hover:bg-red-500 hover:text-white transition-all"
          >
            <span className="material-icons text-sm">delete</span>
          </button>
        </div>
      </div>

      {/* Title + subtitle */}
      <div className="space-y-1 mb-5">
        <h3 className="text-white font-black text-lg uppercase tracking-tight truncate">{title}</h3>
        {subtitle && (
          <p className="text-teal-400 text-[10px] font-black tracking-[0.15em] uppercase opacity-70 flex items-center gap-1 truncate">
            <span className="material-icons text-[12px]">medical_services</span>
            <span className="truncate">{subtitle}</span>
          </p>
        )}
      </div>

      {/* Data grid */}
      <div className="bg-slate-950/40 p-5 rounded-[1.8rem] border border-white/5 space-y-4">
        {status && (
          <div className="flex justify-between items-center text-[10px] font-black tracking-widest">
            <span className="text-slate-500 uppercase">Status</span>
            <span className={`px-3 py-1 rounded-full text-[9px] ${statusTone}`}>{pretty(status)}</span>
          </div>
        )}

        {facts.filter(f => f.value).map((f, i) => (
          <div key={i} className="flex justify-between items-center gap-3 text-[10px] font-black tracking-widest text-slate-500 border-t border-white/5 pt-4">
            <span className="uppercase shrink-0">{f.label}</span>
            <span className="text-slate-200 text-right truncate">{f.value}</span>
          </div>
        ))}

        <div className="flex justify-between items-center text-[10px] font-black tracking-widest text-slate-500 border-t border-white/5 pt-4">
          <span className="flex items-center gap-1 uppercase">
            <span className="material-icons text-[14px]">calendar_today</span>
            {dateLabel}
          </span>
          <span className="text-slate-200">{dateValue || "N/A"}</span>
        </div>
      </div>

      {/* Background decor */}
      <div className="absolute -bottom-4 -right-4 text-white/[0.02] pointer-events-none group-hover:text-teal-500/[0.05] transition-colors">
        <span className="material-icons text-8xl">{icon}</span>
      </div>
    </div>
  );
}
