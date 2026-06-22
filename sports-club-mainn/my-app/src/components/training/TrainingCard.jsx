"use client";
import React, { useState, useEffect } from "react";
import { lookupTeam } from "@/src/lib/teamDirectory";

const TYPE_TONE = {
  TACTICAL: "text-blue-400 bg-blue-500/10 border-blue-500/30",
  TECHNICAL: "text-purple-400 bg-purple-500/10 border-purple-500/30",
  FITNESS: "text-amber-400 bg-amber-500/10 border-amber-500/30",
  RECOVERY: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30",
  VIDEO_ANALYSIS: "text-cyan-400 bg-cyan-500/10 border-cyan-500/30",
  FRIENDLY_MATCH: "text-rose-400 bg-rose-500/10 border-rose-500/30",
};
const fmtTime = (dt) => dt ? new Date(dt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "TBD";

const Info = ({ icon, label }) => (
  <div className="flex items-center gap-2 text-slate-400"><span className="opacity-60">{icon}</span><span className="truncate">{label}</span></div>
);
const Row = ({ label, value, italic }) => (
  <div><p className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-1">{label}</p><p className={`text-slate-300 leading-relaxed ${italic ? "italic" : ""}`}>{value}</p></div>
);

// Format a millisecond gap into a compact "2d 4h" / "3h 12m" / "8m" countdown.
const fmtCountdown = (ms) => {
  if (ms <= 0) return "now";
  const m = Math.floor(ms / 60000);
  const d = Math.floor(m / 1440);
  const h = Math.floor((m % 1440) / 60);
  const min = m % 60;
  if (d > 0) return `${d}d ${h}h`;
  if (h > 0) return `${h}h ${min}m`;
  return `${min}m`;
};

// Derive a live/upcoming/past status for a session from its schedule + duration.
// State is computed PURELY from time so a stale stored status can't lie:
//   now < start                     -> upcoming (countdown to start)
//   start <= now <= start+duration   -> live    (elapsed/remaining)
//   now > start + duration           -> ended   (past/completed)
// CANCELLED is the only status we honour explicitly; a stored ONGOING does NOT
// force a live state once the scheduled window has elapsed.
const useLiveStatus = (session) => {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const start = session?.scheduledDateTime ? new Date(session.scheduledDateTime).getTime() : null;
  const dur = (Number(session?.durationMinutes) || 90) * 60000;
  const end = start != null ? start + dur : null;
  const cancelled = String(session?.status || "").toUpperCase() === "CANCELLED";

  let phase = cancelled ? "cancelled" : "past"; // cancelled | past | upcoming | live
  let countdown = null;   // time until start (upcoming)
  let remaining = null;   // time until end (live)
  let elapsedPct = 0;

  if (!cancelled && start != null) {
    if (now >= start && now <= end) {
      phase = "live";
      elapsedPct = Math.min(100, Math.max(0, Math.round(((now - start) / dur) * 100)));
      remaining = fmtCountdown(end - now);
    } else if (now < start) {
      phase = "upcoming";
      countdown = fmtCountdown(start - now);
    }
  }

  return { phase, countdown, remaining, elapsedPct };
};

const TrainingCard = ({ session }) => {
  const [expanded, setExpanded] = useState(false);
  const team = lookupTeam(session?.teamId);
  const type = session?.trainingType || session?.type || "SESSION";
  const title = session?.objectives || session?.title || "Training Session";
  const tone = TYPE_TONE[type] || "text-slate-400 bg-slate-500/10 border-slate-500/30";
  const { phase, countdown, remaining, elapsedPct } = useLiveStatus(session);
  const live = phase === "live";
  const upcoming = phase === "upcoming";
  // Ended / cancelled sessions read as "past": muted left rail + slight fade.
  const accent = live
    ? "border-rose-500/60 border-l-rose-500 ring-1 ring-rose-500/40 shadow-lg shadow-rose-950/40"
    : upcoming
      ? `border-slate-800 border-l-emerald-500 hover:border-emerald-500/50 ${expanded ? "ring-1 ring-emerald-500/30" : ""}`
      : `border-slate-800/70 border-l-slate-600 opacity-75 hover:opacity-100 ${expanded ? "ring-1 ring-slate-600/30" : ""}`;

  return (
    <button onClick={() => setExpanded(v => !v)}
      className={`relative overflow-hidden text-left border-l-4 w-full rounded-2xl p-5 bg-slate-900/50 border shadow-sm hover:-translate-y-0.5 transition-all group ${accent}`}>

      {live && (
        <span className="absolute inset-0 pointer-events-none bg-gradient-to-br from-rose-500/[0.07] to-transparent" />
      )}

      <div className="relative flex justify-between items-start gap-3 mb-4">
        <div className="flex items-center gap-3 min-w-0">
          {team?.crestUrl
            ? <img src={team.crestUrl} alt="" className="w-9 h-9 object-contain shrink-0" />
            : <span className="text-2xl shrink-0">{team?.crest || "🏟️"}</span>}
          <h3 className="font-black text-base text-slate-100 group-hover:text-emerald-400 transition-colors leading-tight">{title}</h3>
        </div>
        <div className="flex flex-col items-end gap-1.5 shrink-0">
          {live ? (
            <span className="inline-flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md bg-rose-500 text-white shadow-lg shadow-rose-950/50">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full rounded-full bg-white/80 opacity-75 animate-ping" />
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-white" />
              </span>
              Live Now
            </span>
          ) : phase === "upcoming" ? (
            <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
              ⏳ In {countdown}
            </span>
          ) : phase === "cancelled" ? (
            <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md bg-rose-500/10 text-rose-300 border border-rose-500/30">
              ✕ Cancelled
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md bg-slate-500/10 text-slate-400 border border-slate-600/40">
              ✓ Ended
            </span>
          )}
          <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md border ${tone}`}>{String(type).replace(/_/g, " ")}</span>
        </div>
      </div>

      <div className="relative grid grid-cols-2 gap-2 text-xs">
        <Info icon="📅" label={session?.scheduledDateTime ? new Date(session.scheduledDateTime).toLocaleDateString() : "TBD"} />
        <Info icon="🕒" label={fmtTime(session?.scheduledDateTime)} />
        <Info icon="⏱️" label={`${session?.durationMinutes || "—"} min`} />
        <Info icon="📍" label={session?.location || "TBD"} />
      </div>

      {live && (
        <div className="relative mt-4">
          <div className="flex justify-between text-[9px] font-black uppercase tracking-widest text-rose-300 mb-1">
            <span>In progress · {remaining} left</span><span>{elapsedPct}%</span>
          </div>
          <div className="w-full h-1.5 rounded-full bg-slate-950 overflow-hidden border border-rose-500/20">
            <div className="h-full rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.6)] transition-all duration-1000" style={{ width: `${elapsedPct}%` }} />
          </div>
        </div>
      )}

      {expanded && (
        <div className="relative mt-4 pt-4 border-t border-slate-800 space-y-3 text-xs">
          <Row
            label="State"
            value={
              live ? "Live now"
              : phase === "upcoming" ? `Upcoming · starts in ${countdown}`
              : phase === "cancelled" ? "Cancelled"
              : "Ended"
            }
          />
          {session?.status && phase !== "cancelled" && (
            <Row label="Recorded status" value={session.status} italic />
          )}
          {team && <Row label="Team" value={team.name} />}
          {session?.description && <Row label="Description" value={session.description} />}
          {session?.notes && <Row label="Coach Notes" value={session.notes} italic />}
        </div>
      )}
      <p className="relative mt-3 text-[9px] font-black uppercase tracking-widest text-slate-600">{expanded ? "▲ Click to collapse" : "▾ Click for details"}</p>
    </button>
  );
};

export default TrainingCard;
