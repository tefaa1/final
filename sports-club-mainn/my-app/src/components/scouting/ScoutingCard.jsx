"use client";
import React from "react";
import { FiCheckCircle, FiXCircle, FiEdit2 } from "react-icons/fi";
import UserChip from "@/src/components/shared/UserChip";

const prettyPosition = (pos) =>
  pos ? String(pos).replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase()) : "";

// 1–10 rating shown as a labelled progress bar. Colour tracks the value.
const RatingBar = ({ label, value }) => {
  const v = Number(value) || 0;
  const pct = Math.max(0, Math.min(100, v * 10));
  const tone =
    v >= 8 ? "bg-emerald-500" : v >= 5 ? "bg-amber-500" : "bg-red-500";
  const txt =
    v >= 8 ? "text-emerald-400" : v >= 5 ? "text-amber-400" : "text-red-400";
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between">
        <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">{label}</span>
        <span className={`text-[11px] font-black ${txt}`}>{v}/10</span>
      </div>
      <div className="h-1.5 w-full rounded-full bg-slate-800 overflow-hidden">
        <div className={`h-full rounded-full ${tone} transition-all`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
};

/**
 * Renders one scout report.
 *
 * Props:
 *   report      — the /scout-reports row (scoutKeycloakId, outerPlayerId, ratings…)
 *   playerLabel — resolved "Nationality · Position" string for outerPlayerId
 *                 (outer players have NO name field, so we never show a raw id)
 *   onEdit      — optional callback to open the edit modal
 */
export default function ScoutingCard({ report, playerLabel, onEdit }) {
  const ratings = [
    Number(report.technicalRating) || 0,
    Number(report.physicalRating) || 0,
    Number(report.tacticalRating) || 0,
    Number(report.mentalityRating) || 0,
  ];
  const avg = ratings.length ? (ratings.reduce((a, b) => a + b, 0) / ratings.length) : 0;
  const avgTone = avg >= 8 ? "text-emerald-400" : avg >= 5 ? "text-amber-400" : "text-red-400";

  const splitTags = (s) =>
    String(s || "")
      .split(/[,;.]/)
      .map((t) => t.trim())
      .filter(Boolean)
      .slice(0, 4);

  return (
    <div className="bg-slate-900/50 backdrop-blur-sm rounded-2xl border border-slate-800 p-6 hover:border-purple-500/50 transition-all group relative overflow-hidden">
      <div className="absolute -right-4 -top-4 w-24 h-24 bg-purple-500/5 rounded-full blur-3xl group-hover:bg-purple-500/10 transition-all duration-700" />

      {/* Header: player descriptors + recommendation badge */}
      <div className="flex justify-between items-start relative z-10">
        <div className="min-w-0">
          <p className="text-[9px] font-black uppercase tracking-widest text-purple-300/70 mb-1">
            {report.playerPosition ? prettyPosition(report.playerPosition) : "Tracked Player"}
          </p>
          <h3 className="font-black text-slate-100 tracking-tight uppercase text-sm truncate">
            {report.playerCountry || playerLabel || `Player #${report.outerPlayerId ?? "—"}`}
          </h3>
          <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
            {report.sportType && <span className="text-[8px] font-black uppercase tracking-widest text-slate-400 bg-slate-800/60 border border-slate-700 rounded px-1.5 py-0.5">{prettyPosition(report.sportType)}</span>}
            {report.playerClub && <span className="text-[9px] text-slate-500 truncate">📍 {report.playerClub}</span>}
          </div>
        </div>

        {report.recommendSigning ? (
          <span className="flex items-center gap-1 text-[9px] font-black uppercase tracking-widest bg-emerald-500/10 text-emerald-400 px-3 py-1 rounded-full border border-emerald-500/20 shrink-0">
            <FiCheckCircle size={11} /> Sign
          </span>
        ) : (
          <span className="flex items-center gap-1 text-[9px] font-black uppercase tracking-widest bg-red-500/10 text-red-400 px-3 py-1 rounded-full border border-red-500/20 shrink-0">
            <FiXCircle size={11} /> Pass
          </span>
        )}
      </div>

      {/* Scout + overall average */}
      <div className="flex items-center justify-between gap-3 mt-4 relative z-10">
        <UserChip keycloakId={report.scoutKeycloakId} fallback="Scout" showRole />
        <div className="text-right shrink-0">
          <p className="text-[8px] font-black uppercase tracking-widest text-slate-600">Overall</p>
          <p className={`text-lg font-black leading-none ${avgTone}`}>{avg.toFixed(1)}</p>
        </div>
      </div>

      {/* Rating bars */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-3 mt-5 border-y border-slate-800/50 py-4 relative z-10">
        <RatingBar label="Technical" value={report.technicalRating} />
        <RatingBar label="Physical" value={report.physicalRating} />
        <RatingBar label="Tactical" value={report.tacticalRating} />
        <RatingBar label="Mentality" value={report.mentalityRating} />
      </div>

      {/* Strengths */}
      {splitTags(report.strengths).length > 0 && (
        <div className="mt-5 relative z-10">
          <p className="text-[9px] font-black uppercase tracking-widest text-slate-600 mb-2">Key Strengths</p>
          <div className="flex flex-wrap gap-2">
            {splitTags(report.strengths).map((skill, i) => (
              <span
                key={i}
                className="text-[9px] font-black uppercase tracking-widest bg-emerald-500/5 text-emerald-300/90 px-3 py-1 rounded-full border border-emerald-500/15"
              >
                {skill}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Overall assessment */}
      {report.overallAssessment && (
        <p className="mt-4 text-xs text-slate-400 leading-relaxed line-clamp-3 relative z-10">
          “{report.overallAssessment}”
        </p>
      )}

      {onEdit && (
        <button
          onClick={() => onEdit(report)}
          className="mt-5 w-full flex items-center justify-center gap-2 py-2 rounded-xl border border-slate-800 text-slate-400 text-[10px] font-black uppercase tracking-widest hover:border-purple-500/40 hover:text-purple-300 transition-all relative z-10"
        >
          <FiEdit2 size={12} /> Edit Report
        </button>
      )}
    </div>
  );
}
