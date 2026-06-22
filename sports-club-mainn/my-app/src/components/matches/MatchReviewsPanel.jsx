"use client";

import React from "react";
import PlayerFace from "@/src/components/matches/PlayerFace";
import { resolveSport } from "@/src/lib/playerSport";
import { FiStar } from "react-icons/fi";

// ─────────────────────────────────────────────────────────────────────────────
// REVIEWS SIDE PANEL — coach performance reviews for a single match, rendered as
// a sticky sidebar inside the Match Details page. Resolves playerId → real name
// + photo (never raw ids) and shows the reviewer (coach) by name.
//
// Props:
//   reviews:    match-performance-review rows for THIS match (with content)
//   players:    full squad (resolve playerId → name/photo)
//   coachName:  (id) => string  — resolve reviewedByCoachId → coach name
//   sport:      title-case sport for the avatar fallback
// ─────────────────────────────────────────────────────────────────────────────
export default function MatchReviewsPanel({ reviews = [], players = [], coachName, sport = "Football" }) {
  const byId = (id) => players.find((p) => String(p.id) === String(id));

  return (
    <aside className="rounded-2xl border border-slate-800 bg-slate-900/40 overflow-hidden shadow-xl lg:sticky lg:top-4 h-fit">
      <div className="flex items-center gap-2.5 px-4 py-3.5 border-b border-slate-800 bg-gradient-to-r from-amber-500/10 to-transparent">
        <span className="grid place-items-center w-8 h-8 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-300">
          <FiStar size={15} />
        </span>
        <div>
          <h3 className="text-sm font-black text-slate-100 tracking-tight">Performance Reviews</h3>
          <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">{reviews.length} player{reviews.length === 1 ? "" : "s"} reviewed</p>
        </div>
      </div>

      <div className="p-3 space-y-3 max-h-[80vh] overflow-y-auto custom-scrollbar">
        {reviews.length === 0 ? (
          <div className="px-3 py-10 text-center">
            <div className="text-2xl mb-2">⭐</div>
            <p className="text-slate-300 font-black uppercase tracking-widest text-[11px]">No reviews yet</p>
            <p className="text-[11px] text-slate-500 mt-1.5 leading-snug">Coach performance reviews for this match will appear here.</p>
          </div>
        ) : (
          reviews.map((r) => {
            const player = byId(r.playerId);
            const name = player ? `${player.firstName} ${player.lastName}` : `Player #${r.playerId}`;
            const rating = Number(r.overallPerformanceRating) || 0;
            const tone = rating >= 8 ? "text-emerald-400" : rating >= 6 ? "text-amber-400" : "text-rose-400";
            const ring = rating >= 8 ? "border-emerald-500/40 bg-emerald-500/10" : rating >= 6 ? "border-amber-500/40 bg-amber-500/10" : "border-rose-500/40 bg-rose-500/10";
            const reviewer = coachName ? coachName(r.reviewedByCoachId) : null;
            return (
              <div key={r.id} className="rounded-xl border border-slate-800 bg-slate-950/40 p-3.5">
                <div className="flex items-center gap-3 mb-2.5">
                  <PlayerFace photoUrl={player?.photoUrl} name={name} sport={resolveSport(player?.preferredPosition) || sport} size={38} rounded="rounded-xl" />
                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] font-black text-slate-100 truncate">{name}</p>
                    {player?.preferredPosition && (
                      <p className="text-[9px] font-black uppercase tracking-widest text-emerald-400 truncate">{String(player.preferredPosition).replace(/_/g, " ")}</p>
                    )}
                  </div>
                  {rating > 0 && (
                    <div className={`shrink-0 w-11 h-11 rounded-xl border flex flex-col items-center justify-center ${ring}`}>
                      <span className={`text-base font-black leading-none ${tone}`}>{rating}</span>
                      <span className="text-[7px] text-slate-500 font-bold tracking-widest">/ 10</span>
                    </div>
                  )}
                </div>
                {r.tacticalAnalysis && (
                  <p className="text-[11.5px] text-slate-300 italic leading-relaxed mb-2 border-l-2 border-emerald-500/40 pl-2.5">"{r.tacticalAnalysis}"</p>
                )}
                {r.strengths && (
                  <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/[0.05] px-2.5 py-1.5 mb-1.5">
                    <p className="text-[8px] font-black uppercase tracking-widest text-emerald-400 mb-0.5">✓ Strengths</p>
                    <p className="text-[11px] text-slate-300 leading-snug">{r.strengths}</p>
                  </div>
                )}
                {r.weaknesses && (
                  <div className="rounded-lg border border-rose-500/20 bg-rose-500/[0.05] px-2.5 py-1.5 mb-1.5">
                    <p className="text-[8px] font-black uppercase tracking-widest text-rose-400 mb-0.5">▼ Weaknesses</p>
                    <p className="text-[11px] text-slate-300 leading-snug">{r.weaknesses}</p>
                  </div>
                )}
                {r.areasForImprovement && (
                  <div className="rounded-lg border border-sky-500/20 bg-sky-500/[0.05] px-2.5 py-1.5">
                    <p className="text-[8px] font-black uppercase tracking-widest text-sky-400 mb-0.5">→ To Improve</p>
                    <p className="text-[11px] text-slate-300 leading-snug">{r.areasForImprovement}</p>
                  </div>
                )}
                <p className="mt-2.5 text-[9px] text-slate-600 font-bold uppercase tracking-widest">Reviewed by {reviewer || "Head Coach"}</p>
              </div>
            );
          })
        )}
      </div>
    </aside>
  );
}
