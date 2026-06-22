"use client";

import React from "react";
import { sportMeta, parseStatsJson, humaniseKey } from "@/src/components/matches/sportConfig";

// ─────────────────────────────────────────────────────────────────────────────
// MATCH STATS — sport-aware statistics block driven by the match-analysis row's
// `sportSpecificStats` JSON. The stat KEYS surfaced depend on the sport (football
// → possession/shots/corners; basketball → FG%/rebounds/assists; etc.), but any
// extra keys present in the data are still shown (humanised) so nothing is hidden.
//
// Props:
//   analysis: a single match-analysis row (or null) for this match
//   sport:    UPPERCASE sportType
// ─────────────────────────────────────────────────────────────────────────────
export default function MatchStatsPanel({ analysis, sport = "FOOTBALL" }) {
  const meta = sportMeta(sport);
  const stats = parseStatsJson(analysis?.sportSpecificStats);
  const statEntries = Object.entries(stats);

  if (!analysis || statEntries.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-8 text-center">
        <div className="text-3xl mb-2">📊</div>
        <p className="text-slate-300 font-black uppercase tracking-widest text-xs">No statistics recorded</p>
        <p className="text-[12px] text-slate-500 mt-1.5">Match statistics for this {meta.label.toLowerCase()} fixture haven't been logged.</p>
      </div>
    );
  }

  // Build the ordered list: known sport stats first (in config order), then any
  // remaining keys present in the data.
  const used = new Set();
  const ordered = [];
  meta.statKeys.forEach(({ key, label, suffix, bar }) => {
    if (stats[key] != null) {
      ordered.push({ key, label, suffix: suffix || "", bar, value: stats[key] });
      used.add(key);
    }
  });
  statEntries.forEach(([key, value]) => {
    if (used.has(key)) return;
    const isPct = /pct|percent|accuracy|efficiency|possession/i.test(key);
    ordered.push({ key, label: humaniseKey(key), suffix: isPct ? "%" : "", bar: isPct, value });
  });

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {ordered.map(({ key, label, suffix, bar, value }) => {
          const num = Number(value);
          const showBar = bar && !Number.isNaN(num) && num >= 0 && num <= 100;
          return (
            <div key={key} className="rounded-xl border border-slate-800 bg-slate-950/40 px-3.5 py-2.5">
              <div className="flex items-baseline justify-between gap-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 truncate">{label}</span>
                <span className="text-base font-black text-slate-100 tabular-nums">{value}{suffix}</span>
              </div>
              {showBar && (
                <div className="mt-1.5 h-1.5 w-full rounded-full bg-slate-800 overflow-hidden">
                  <div className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-emerald-400" style={{ width: `${num}%` }} />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {analysis?.tacticalAnalysis && (
        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/[0.04] px-4 py-3">
          <p className="text-[9px] font-black uppercase tracking-widest text-emerald-400 mb-1.5">Tactical Analysis</p>
          <p className="text-[13px] text-slate-300 leading-relaxed">{analysis.tacticalAnalysis}</p>
        </div>
      )}
      {analysis?.notes && (
        <div className="rounded-xl border border-slate-800 bg-slate-950/40 px-4 py-3">
          <p className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-1.5">Coach Notes</p>
          <p className="text-[13px] text-slate-400 leading-relaxed italic">"{analysis.notes}"</p>
        </div>
      )}
    </div>
  );
}
