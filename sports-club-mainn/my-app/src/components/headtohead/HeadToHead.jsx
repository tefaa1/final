"use client";

import React, { useEffect, useMemo, useState } from "react";
import { api } from "@/src/lib/api";
import { PageHeader } from "@/src/components/shared/SharedComponents";
import { FiSearch } from "react-icons/fi";
import { GiCrossedSwords } from "react-icons/gi";

const BARCA_CREST = "https://crests.football-data.org/81.png";
const isFinished = (s) => ["FINISHED", "FT", "AWARDED"].includes(String(s).toUpperCase());
const fmtDate = (d) => (d ? new Date(d).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" }) : "");

function Crest({ url, size = 24 }) {
  return url
    ? <img src={url} alt="" width={size} height={size} className="object-contain shrink-0" onError={(e) => { e.currentTarget.style.visibility = "hidden"; }} />
    : <span className="inline-block bg-slate-700 rounded-full shrink-0" style={{ width: size, height: size }} />;
}

export default function HeadToHead() {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [q, setQ] = useState("");

  useEffect(() => {
    (async () => {
      const r = await api.getMatches().catch(() => []);
      setMatches(Array.isArray(r) ? r : r?.content || r?.data || []);
      setLoading(false);
    })();
  }, []);

  // Build Barça's record vs each opponent from finished matches.
  const opponents = useMemo(() => {
    const byOpp = {};
    matches.filter((m) => isFinished(m.status) && m.opponentName).forEach((m) => {
      const k = m.opponentName;
      const g = (byOpp[k] ||= { name: k, crest: m.opponentCrest, P: 0, W: 0, D: 0, L: 0, GF: 0, GA: 0, matches: [] });
      const gf = m.homeTeamScore ?? 0, ga = m.awayTeamScore ?? 0;
      g.P++; g.GF += gf; g.GA += ga;
      if (gf > ga) g.W++; else if (gf < ga) g.L++; else g.D++;
      g.matches.push(m);
    });
    return Object.values(byOpp).sort((a, b) => b.P - a.P);
  }, [matches]);

  useEffect(() => {
    if (!selected && opponents.length) setSelected(opponents[0].name);
  }, [opponents, selected]);

  const filtered = opponents.filter((o) => o.name.toLowerCase().includes(q.toLowerCase()));
  const active = opponents.find((o) => o.name === selected) || null;
  const winRate = active && active.P ? Math.round((active.W / active.P) * 100) : 0;

  const totalPlayed = opponents.reduce((s, o) => s + o.P, 0);
  const totalWins = opponents.reduce((s, o) => s + o.W, 0);
  const overallWinRate = totalPlayed ? Math.round((totalWins / totalPlayed) * 100) : 0;

  return (
    <div className="h-full bg-slate-950 overflow-y-auto w-full">
      <div className="p-5 sm:p-6 max-w-[1400px] mx-auto fade-in">
        <PageHeader
          title="Head-to-Head"
          subtitle="FC Barcelona's all-time record vs each opponent"
          icon={GiCrossedSwords}
          action={
            !loading && opponents.length > 0 ? (
              <div className="flex items-center gap-5 text-right">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Rivals</p>
                  <p className="text-2xl font-black text-white leading-none mt-0.5">{opponents.length}</p>
                </div>
                <div className="h-9 w-px bg-white/10" />
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Win Rate</p>
                  <p className="text-2xl font-black text-emerald-400 leading-none mt-0.5">{overallWinRate}%</p>
                </div>
              </div>
            ) : null
          }
        />

      {loading ? (
        <div className="text-center py-20 text-slate-500 font-black italic animate-pulse">LOADING…</div>
      ) : opponents.length === 0 ? (
        <div className="text-center py-20 text-slate-600 italic">No match data yet.</div>
      ) : (
        <div className="grid lg:grid-cols-[320px_1fr] gap-6">
          {/* Opponent list */}
          <div className="bg-slate-900/50 rounded-2xl border border-slate-800 p-4">
            <div className="flex items-center rounded-xl px-3 py-2 bg-slate-950 border border-slate-800 mb-3">
              <FiSearch className="text-slate-500 mr-2" />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search opponent…" className="bg-transparent outline-none w-full text-xs text-slate-100" />
            </div>
            <div className="space-y-1 max-h-[70vh] overflow-y-auto sidebar-scrollbar">
              {filtered.map((o) => (
                <button key={o.name} onClick={() => setSelected(o.name)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border transition-all text-left ${
                    selected === o.name ? "bg-emerald-500/15 border-emerald-500/40" : "bg-slate-950/40 border-slate-800/60 hover:border-slate-700"}`}>
                  <Crest url={o.crest} size={26} />
                  <span className="flex-1 min-w-0 text-sm font-bold text-slate-200 truncate">{o.name}</span>
                  <span className="text-[10px] font-black text-slate-500">{o.P}P</span>
                </button>
              ))}
            </div>
          </div>

          {/* H2H detail */}
          {active && (
            <div className="space-y-6">
              {/* Versus banner */}
              <div className="relative overflow-hidden bg-gradient-to-br from-[#0a1a3f] via-slate-900 to-[#3b0a2a] rounded-2xl border border-slate-800 p-6 shadow-lg">
                <div className="absolute -left-10 -top-12 w-44 h-44 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />
                <div className="absolute -right-10 -bottom-12 w-44 h-44 rounded-full bg-fuchsia-500/10 blur-3xl pointer-events-none" />
                <div className="relative flex items-center justify-center gap-6 sm:gap-10">
                  <div className="flex flex-col items-center gap-2"><Crest url={BARCA_CREST} size={64} /><span className="text-sm font-bold text-slate-200">Barcelona</span></div>
                  <div className="flex flex-col items-center gap-1.5">
                    <span className="text-3xl font-black tracking-tight text-white tabular-nums leading-none">{active.W}<span className="text-slate-600 mx-1.5">-</span>{active.D}<span className="text-slate-600 mx-1.5">-</span>{active.L}</span>
                    <span className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-500">W · D · L</span>
                  </div>
                  <div className="flex flex-col items-center gap-2"><Crest url={active.crest} size={64} /><span className="text-sm font-bold text-slate-200 text-center max-w-[140px] truncate">{active.name}</span></div>
                </div>
              </div>

              {/* Record */}
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                <Stat label="Played" value={active.P} />
                <Stat label="Wins" value={active.W} accent="text-emerald-400" />
                <Stat label="Draws" value={active.D} />
                <Stat label="Losses" value={active.L} accent="text-rose-400" />
                <Stat label="Goals For" value={active.GF} accent="text-emerald-400" />
                <Stat label="Goals Ag." value={active.GA} accent="text-rose-400" />
              </div>

              {/* Win-rate bar */}
              <div className="bg-slate-900/50 rounded-2xl border border-slate-800 p-5">
                <div className="flex justify-between text-[11px] font-black uppercase tracking-widest text-slate-500 mb-2">
                  <span>Win rate</span><span className="text-emerald-400">{winRate}%</span>
                </div>
                <div className="flex h-3 rounded-full overflow-hidden bg-slate-950 border border-slate-800">
                  <div className="bg-emerald-500" style={{ width: `${(active.W / active.P) * 100}%` }} />
                  <div className="bg-slate-600" style={{ width: `${(active.D / active.P) * 100}%` }} />
                  <div className="bg-rose-500" style={{ width: `${(active.L / active.P) * 100}%` }} />
                </div>
                <div className="flex gap-4 mt-2 text-[10px] font-bold text-slate-500">
                  <span><span className="text-emerald-400">●</span> {active.W} W</span>
                  <span><span className="text-slate-400">●</span> {active.D} D</span>
                  <span><span className="text-rose-400">●</span> {active.L} L</span>
                </div>
              </div>

              {/* Match list */}
              <div className="bg-slate-900/50 rounded-2xl border border-slate-800 p-5">
                <h3 className="text-sm font-black uppercase tracking-widest text-slate-300 mb-4">Meetings ({active.matches.length})</h3>
                <div className="space-y-2">
                  {active.matches.sort((a, b) => new Date(b.kickoffTime || 0) - new Date(a.kickoffTime || 0)).map((m) => {
                    const gf = m.homeTeamScore ?? 0, ga = m.awayTeamScore ?? 0;
                    const res = gf > ga ? "W" : gf < ga ? "L" : "D";
                    const tone = res === "W" ? "bg-emerald-500/20 text-emerald-400" : res === "L" ? "bg-rose-500/20 text-rose-400" : "bg-slate-500/20 text-slate-300";
                    return (
                      <div key={m.id} className="flex items-center justify-between bg-slate-950/40 rounded-xl border border-slate-800/60 px-4 py-2.5">
                        <div className="flex items-center gap-3 min-w-0">
                          <span className={`w-6 h-6 rounded-md flex items-center justify-center text-[11px] font-black shrink-0 ${tone}`}>{res}</span>
                          <span className="text-xs text-slate-500 w-20 shrink-0">{fmtDate(m.kickoffTime)}</span>
                          <span className="text-[10px] text-slate-600 uppercase tracking-widest truncate">{m.competition}</span>
                        </div>
                        <span className="text-sm font-black text-slate-100 shrink-0 ml-3">{gf}–{ga}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
      </div>
    </div>
  );
}

function Stat({ label, value, accent = "text-slate-100" }) {
  return (
    <div className="bg-slate-900/50 rounded-2xl border border-slate-800 p-4 text-center">
      <p className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-1">{label}</p>
      <p className={`text-2xl font-black ${accent}`}>{value}</p>
    </div>
  );
}
