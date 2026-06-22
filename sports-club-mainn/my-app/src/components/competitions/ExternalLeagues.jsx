"use client";

import React, { useEffect, useMemo, useState } from "react";
import { api } from "@/src/lib/api";
import { FiAward } from "react-icons/fi";

// EXTERNAL football-data.org leagues (La Liga etc.) — historical / live tables.
// Extracted unchanged from the original Competitions view, now a tab.
const COMP_CODE = {
  "Primera Division": "PD",
  "La Liga": "PD",
  LaLiga: "PD",
  "UEFA Champions League": "CL",
  "Champions League": "CL",
};

const isLive = (s) => ["LIVE", "HALFTIME", "IN_PLAY", "PAUSED"].includes(String(s).toUpperCase());
const isFinished = (s) => ["FINISHED", "FT", "AWARDED"].includes(String(s).toUpperCase());
const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" }) : "TBD";

export default function ExternalLeagues({ matches, loading }) {
  const [active, setActive] = useState(null);
  const [standings, setStandings] = useState([]);
  const [standingsState, setStandingsState] = useState("idle");

  const groups = useMemo(() => {
    const g = {};
    matches.forEach((m) => {
      const key = m.competition || "Other";
      (g[key] ||= []).push(m);
    });
    return g;
  }, [matches]);

  const competitionNames = Object.keys(groups).sort((a, b) => groups[b].length - groups[a].length);

  useEffect(() => {
    if (!active && competitionNames.length) setActive(competitionNames[0]);
  }, [competitionNames, active]);

  useEffect(() => {
    const code = COMP_CODE[active];
    if (!code) {
      setStandings([]);
      setStandingsState("empty");
      return;
    }
    let cancelled = false;
    setStandingsState("loading");
    api
      .getStandings(code)
      .then((rows) => {
        if (cancelled) return;
        const list = Array.isArray(rows) ? rows : [];
        setStandings(list);
        setStandingsState(list.length ? "idle" : "empty");
      })
      .catch(() => !cancelled && setStandingsState("error"));
    return () => {
      cancelled = true;
    };
  }, [active]);

  const activeMatches = groups[active] || [];
  const finished = activeMatches
    .filter((m) => isFinished(m.status))
    .sort((a, b) => new Date(b.kickoffTime || 0) - new Date(a.kickoffTime || 0));
  const fixtures = activeMatches
    .filter((m) => !isFinished(m.status))
    .sort((a, b) => new Date(a.kickoffTime || 0) - new Date(b.kickoffTime || 0));
  const oppOf = (m) => m.opponentName || "Opponent";

  if (loading) {
    return (
      <div className="text-center py-20 text-slate-500 font-black italic animate-pulse">
        LOADING COMPETITIONS…
      </div>
    );
  }
  if (competitionNames.length === 0) {
    return (
      <div className="text-center py-20 text-slate-600 italic">
        No external matches yet. Use “Sync matches” to pull real fixtures.
      </div>
    );
  }

  return (
    <>
      {/* Historical season banner — this external feed is OLD (read-only) data */}
      <div className="relative overflow-hidden rounded-2xl border border-slate-800 mb-6">
        <div className="absolute inset-0 bg-gradient-to-br from-[#0a1a3f] via-slate-900 to-[#3b0a2a]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(59,130,246,0.18),transparent_55%)]" />
        <div className="relative px-5 py-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-[0.2em] bg-blue-500/20 text-blue-300 border border-blue-500/30">
                2025 / 2026 Season
              </span>
              <span className="px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-[0.2em] bg-slate-800/70 text-slate-300 border border-slate-700">
                Historical · Read-only
              </span>
            </div>
            <h2 className="text-xl font-black text-white tracking-tight">Live Leagues archive</h2>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Real fixtures &amp; tables from football-data.org — last synced season.
            </p>
          </div>
          <FiAward className="text-3xl text-blue-300/50 shrink-0" />
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        {competitionNames.map((name) => (
          <button
            key={name}
            onClick={() => setActive(name)}
            className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider border transition-all ${
              active === name
                ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                : "bg-slate-900/50 text-slate-400 border-slate-800 hover:border-slate-700"
            }`}
          >
            {name} <span className="text-slate-500">({groups[name].length})</span>
          </button>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {fixtures.length > 0 && (
            <Section title="Upcoming Fixtures">
              {fixtures.slice(0, 12).map((m) => (
                <Row key={m.id} m={m} opp={oppOf(m)} live={isLive(m.status)} finished={false} />
              ))}
            </Section>
          )}
          <Section title="Results">
            {finished.length ? (
              finished.slice(0, 20).map((m) => <Row key={m.id} m={m} opp={oppOf(m)} live={false} finished />)
            ) : (
              <p className="text-xs text-slate-600 italic py-2">No results yet.</p>
            )}
          </Section>
        </div>

        <div>
          <Section
            title={
              <span className="flex items-center gap-2">
                <FiAward className="text-amber-400" /> League Table
              </span>
            }
          >
            {standingsState === "loading" && (
              <p className="text-xs text-slate-500 italic py-2 animate-pulse">Loading table…</p>
            )}
            {standingsState === "empty" && (
              <p className="text-xs text-slate-600 italic py-2">No table for this competition.</p>
            )}
            {standingsState === "error" && (
              <p className="text-xs text-rose-400/80 italic py-2">
                Couldn’t load the table (check API key / permissions).
              </p>
            )}
            {standingsState === "idle" && (
              <div className="overflow-x-auto -mx-2">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-slate-500 border-b border-slate-800">
                      <th className="text-left font-black py-2 px-2">#</th>
                      <th className="text-left font-black py-2">Team</th>
                      <th className="font-black py-2 px-1">P</th>
                      <th className="font-black py-2 px-1">GD</th>
                      <th className="font-black py-2 px-2">Pts</th>
                    </tr>
                  </thead>
                  <tbody>
                    {standings.map((r) => {
                      const barca = String(r.team).toLowerCase().includes("barcelona");
                      return (
                        <tr
                          key={r.position}
                          className={`border-b border-slate-900/60 ${barca ? "bg-emerald-500/10" : ""}`}
                        >
                          <td className="py-2 px-2 font-mono text-slate-500">{r.position}</td>
                          <td className="py-2">
                            <span
                              className={`flex items-center gap-2 font-bold ${
                                barca ? "text-emerald-300" : "text-slate-200"
                              }`}
                            >
                              {r.crest && <img src={r.crest} alt="" className="w-4 h-4 object-contain" />}
                              <span className="truncate max-w-[120px]">{r.team}</span>
                            </span>
                          </td>
                          <td className="text-center py-2 px-1 text-slate-400">{r.played}</td>
                          <td className="text-center py-2 px-1 text-slate-400">
                            {r.goalDifference > 0 ? `+${r.goalDifference}` : r.goalDifference}
                          </td>
                          <td className="text-center py-2 px-2 font-black text-slate-100">{r.points}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </Section>
        </div>
      </div>
    </>
  );
}

function Section({ title, children }) {
  return (
    <section className="bg-slate-900/50 rounded-2xl border border-slate-800 p-5">
      <h2 className="text-sm font-black uppercase tracking-widest text-slate-300 mb-4">{title}</h2>
      <div className="space-y-2">{children}</div>
    </section>
  );
}

function Row({ m, opp, live, finished }) {
  const hs = m.homeTeamScore,
    as = m.awayTeamScore;
  let res = null,
    tone = "";
  if (finished && hs != null && as != null) {
    res = hs > as ? "W" : hs < as ? "L" : "D";
    tone =
      res === "W"
        ? "bg-emerald-500/20 text-emerald-400"
        : res === "L"
        ? "bg-rose-500/20 text-rose-400"
        : "bg-slate-500/20 text-slate-300";
  }
  return (
    <div className="flex items-center justify-between bg-slate-950/40 rounded-xl border border-slate-800/60 px-4 py-3">
      <div className="flex items-center gap-3 min-w-0">
        {res && (
          <span className={`w-6 h-6 rounded-md flex items-center justify-center text-[11px] font-black ${tone}`}>
            {res}
          </span>
        )}
        {m.opponentCrest && <img src={m.opponentCrest} alt="" className="w-5 h-5 object-contain" />}
        <span className="text-sm font-bold text-slate-100 truncate">FC Barcelona</span>
        <span className="text-slate-600 text-xs">vs</span>
        <span className="text-sm font-bold text-slate-300 truncate">{opp}</span>
      </div>
      <div className="text-right shrink-0 ml-3">
        {live ? (
          <span className="px-2 py-0.5 rounded-md bg-rose-500/20 text-rose-400 text-[10px] font-black uppercase animate-pulse">
            ● Live {hs ?? 0}–{as ?? 0}
          </span>
        ) : finished ? (
          <span className="text-base font-black text-slate-100">
            {hs}–{as}
          </span>
        ) : (
          <span className="text-[11px] font-bold text-slate-400">{fmtDate(m.kickoffTime)}</span>
        )}
      </div>
    </div>
  );
}
