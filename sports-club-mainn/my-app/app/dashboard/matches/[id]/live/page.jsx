"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/src/lib/api";
import { lookupTeam } from "@/src/lib/teamDirectory";
import LiveMatch from "@/src/components/matches/LiveMatch";
import { FiArrowLeft, FiClipboard, FiAlertTriangle } from "react-icons/fi";

const unwrapArr = (r) => r?.data || r?.content || (Array.isArray(r) ? r : []);
const unwrapOne = (r) => r?.data || r;

export default function LiveMatchPage() {
  const { id } = useParams();
  const router = useRouter();
  const matchId = Number(id);

  const [match, setMatch] = useState(null);
  const [players, setPlayers] = useState([]);
  const [competitions, setCompetitions] = useState([]);
  const [lineup, setLineup] = useState([]);     // STARTING_11 rows for this match
  const [hasLineup, setHasLineup] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const m = unwrapOne(await api.getMatchById(matchId));
        setMatch(m);
        const lists = await Promise.all(["AVAILABLE", "INJURED", "SUSPENDED", "ABSENT"].map(s => api.getPlayers(s).catch(() => [])));
        const byId = new Map();
        lists.flatMap(unwrapArr).forEach(p => byId.set(p.id, p));
        setPlayers([...byId.values()]);
        try { setCompetitions(unwrapArr(await api.competitions.list())); } catch { /* ignore */ }

        // A match can only go live if it has a saved STARTING_11 lineup.
        if (m?.matchFormationId) {
          const rows = unwrapArr(await api.getMatchLineups())
            .filter(l => l.matchFormationId === m.matchFormationId && l.lineupStatus === "STARTING_11");
          setLineup(rows);
          setHasLineup(rows.length > 0);
        }
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    })();
  }, [matchId]);

  if (loading) return <div className="text-center py-32 text-slate-500 font-black uppercase text-[11px] tracking-widest animate-pulse">Loading live control…</div>;
  if (!match) return <div className="text-center py-32 text-slate-400">Match not found.</div>;

  const home = lookupTeam(match.homeTeamId);
  const homeName = home?.name || "FC Barcelona";
  const oppName = match.opponentName || "Opponent";

  return (
    <div className="w-full min-h-full bg-slate-950 fade-in py-8 px-4">
      <div className="max-w-3xl mx-auto mb-5">
        <button onClick={() => router.push("/dashboard/matches")}
          className="flex items-center gap-2 text-slate-400 hover:text-white text-[11px] font-bold uppercase tracking-widest transition-colors">
          <FiArrowLeft /> Back to Match Hub
        </button>
      </div>

      {!hasLineup ? (
        /* ── CANNOT GO LIVE WITHOUT A LINEUP ───────────────────────── */
        <div className="max-w-xl mx-auto mt-10 rounded-3xl border border-amber-500/30 bg-slate-900/40 p-8 text-center shadow-2xl">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-300 mb-5">
            <FiAlertTriangle size={26} />
          </div>
          <h2 className="text-xl font-black text-white uppercase tracking-tight">Set the lineup first</h2>
          <p className="text-[13px] text-slate-400 leading-relaxed mt-3 max-w-sm mx-auto">
            {homeName} vs {oppName} has no saved starting lineup yet. A match can't open the live view — or auto-go-live at kickoff — until its lineup is set.
          </p>
          <button onClick={() => router.push(`/dashboard/matches/${matchId}/lineup`)}
            className="mt-6 inline-flex items-center gap-2 px-7 py-3 rounded-xl bg-emerald-600 text-white font-black text-xs uppercase tracking-widest hover:bg-emerald-500 shadow-lg shadow-emerald-500/20 transition-all">
            <FiClipboard /> Build the lineup
          </button>
        </div>
      ) : (
        <LiveMatch match={match} players={players} competitions={competitions} lineup={lineup} embedded onFinished={() => router.push("/dashboard/matches")} />
      )}
    </div>
  );
}
