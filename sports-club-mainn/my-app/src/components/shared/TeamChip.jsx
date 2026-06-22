"use client";

import React from "react";
import {
  lookupTeam,
  lookupOuterTeam,
  displayTeamName,
  displayOuterTeamName,
} from "@/src/lib/teamDirectory";

const TONE = {
  emerald: { bg: "bg-emerald-500/10", text: "text-emerald-400", border: "border-emerald-500/30", swatch: "rgb(110,231,183)" },
  blue:    { bg: "bg-blue-500/10",    text: "text-blue-400",    border: "border-blue-500/30",    swatch: "rgb(147,197,253)" },
  violet:  { bg: "bg-violet-500/10",  text: "text-violet-400",  border: "border-violet-500/30",  swatch: "rgb(216,180,254)" },
  amber:   { bg: "bg-amber-500/10",   text: "text-amber-400",   border: "border-amber-500/30",   swatch: "rgb(252,211,77)"  },
  rose:    { bg: "bg-rose-500/10",    text: "text-rose-400",    border: "border-rose-500/30",    swatch: "rgb(253,164,175)" },
  slate:   { bg: "bg-slate-500/10",   text: "text-slate-300",   border: "border-slate-500/30",   swatch: "rgb(203,213,225)" },
};

/**
 * Renders a team ID as a labelled chip with crest, name, and sport hint.
 *
 * Props:
 *   teamId   number | string  — required
 *   outer    boolean          — set true for rival / scouted teams (uses
 *                                lookupOuterTeam instead of lookupTeam)
 *   variant  "compact" | "full" | "vs"
 *   showSport boolean         — show the sport line in compact variant
 *
 * "vs" is a stacked layout designed for the Matches card "HOME · VS · AWAY"
 * panel — see Matches.jsx / MatchesCard.jsx.
 */
export default function TeamChip({
  teamId,
  outer = false,
  variant = "compact",
  showSport = false,
}) {
  const known = outer ? lookupOuterTeam(teamId) : lookupTeam(teamId);
  const fallbackPrefix = outer ? "Outer Team" : "Team";
  const name = known ? known.name : (outer ? displayOuterTeamName(teamId) : displayTeamName(teamId, fallbackPrefix));
  const crest = known ? known.crest : (outer ? "🏟️" : "⚪");
  const sport = known ? known.sport : "";
  const tone = TONE[known?.tone] || TONE.slate;

  if (variant === "vs") {
    // Compact stacked layout for Matches card.
    return (
      <div className="flex flex-col items-center gap-1 min-w-0">
        <span className="text-3xl">{crest}</span>
        <span className="text-xs font-black text-slate-100 uppercase tracking-tight text-center leading-tight max-w-[140px] truncate">
          {name}
        </span>
        {sport && (
          <span className={`text-[8px] font-black uppercase tracking-widest ${tone.text}`}>
            {sport}
          </span>
        )}
      </div>
    );
  }

  if (variant === "full") {
    return (
      <div className="inline-flex items-center gap-3 bg-slate-900/40 border border-slate-800 rounded-xl px-3 py-2 max-w-full">
        <span className="text-2xl shrink-0">{crest}</span>
        <div className="min-w-0">
          <p className="text-sm font-bold text-slate-100 truncate">{name}</p>
          {sport && (
            <p className={`text-[10px] font-black uppercase tracking-widest ${tone.text} truncate`}>
              {sport}
            </p>
          )}
        </div>
      </div>
    );
  }

  // compact
  return (
    <span
      className={`inline-flex items-center gap-2 ${tone.bg} ${tone.text} border ${tone.border} rounded-full px-3 py-1 max-w-full`}
      title={`${name}${sport ? ` — ${sport}` : ""}`}
    >
      <span className="text-sm leading-none">{crest}</span>
      <span className="text-xs font-bold truncate">{name}</span>
      {showSport && sport && (
        <span className="text-[9px] font-black uppercase tracking-widest opacity-80">· {sport}</span>
      )}
    </span>
  );
}
