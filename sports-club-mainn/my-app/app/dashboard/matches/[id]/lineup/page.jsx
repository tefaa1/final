"use client";

import React, { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { FiLock, FiArrowLeft, FiUsers } from "react-icons/fi";

// ── POST-CREATION LINEUP IS LOCKED ──────────────────────────────────────────
// A match's lineup/formation is set ONCE, at creation time, in the draft flow
// (app/dashboard/matches/new/lineup). Once the match exists it can NEVER be
// edited again. This route used to be an editable lineup builder; it is now a
// blocked, read-only notice that sends the user to the match details page,
// where the saved starting XI is shown read-only (MatchDetailsBoard).
export default function LineupLockedPage() {
  const { id } = useParams();
  const router = useRouter();
  const matchId = Number(id);
  const detailsHref = `/dashboard/matches/${matchId}`;

  // Auto-redirect to the read-only match details (which shows the saved XI in
  // its Lineup tab) shortly after showing the notice, so any old links / the
  // browser back button never land on an editable lineup.
  useEffect(() => {
    const t = setTimeout(() => router.replace(detailsHref), 2200);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matchId]);

  return (
    <div className="w-full min-h-full bg-slate-950 fade-in">
      <div className="relative overflow-hidden border-b border-slate-800 bg-gradient-to-r from-[#0a1a3f] via-slate-900 to-[#3b0a2a]">
        <div className="absolute -right-10 -top-16 w-72 h-72 rounded-full bg-emerald-500/10 blur-3xl" />
        <div className="relative max-w-6xl mx-auto px-6 md:px-10 py-7">
          <button onClick={() => router.push("/dashboard/matches")}
            className="flex items-center gap-2 text-slate-400 hover:text-white text-[11px] font-bold uppercase tracking-widest mb-4 transition-colors">
            <FiArrowLeft /> Back to Match Hub
          </button>
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-300">
              <FiLock size={20} />
            </div>
            <div>
              <h1 className="font-black text-white text-2xl md:text-3xl uppercase tracking-tight leading-none">Lineup &amp; Formation</h1>
              <p className="text-[11px] text-slate-400 uppercase tracking-[0.22em] mt-2">Locked · set at match creation</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-xl mx-auto mt-20 rounded-3xl border border-amber-500/30 bg-slate-900/40 p-8 text-center shadow-2xl">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-300 mb-5">
          <FiLock size={26} />
        </div>
        <h2 className="text-xl font-black text-white uppercase tracking-tight">The lineup can't be edited</h2>
        <p className="text-[13px] text-slate-400 leading-relaxed mt-3 max-w-sm mx-auto">
          The lineup is set at match creation and can't be edited. It's fixed when the match is created, so the
          starting XI stays a faithful record. Taking you to the match details, where you can view the saved lineup…
        </p>
        <button onClick={() => router.replace(detailsHref)}
          className="mt-6 inline-flex items-center gap-2 px-7 py-3 rounded-xl bg-emerald-600 text-white font-black text-xs uppercase tracking-widest hover:bg-emerald-500 shadow-lg shadow-emerald-500/20 transition-all">
          <FiUsers size={14} /> View match &amp; lineup
        </button>
      </div>
    </div>
  );
}
