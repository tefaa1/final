"use client";

import React, { useMemo, useState } from "react";
import { FiFilter, FiCheckCircle, FiCalendar } from "react-icons/fi";
import { TeamCrest } from "./TeamPicker";
import { isPlayed, KO_ROUND_LABEL, isKnockoutRound, CL_LEAGUE_ROUND } from "./store";

// "2025-03-14"/ISO → "14 Mar 2025" for compact display on finished fixtures.
function fmtPlayedDate(value) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value).slice(0, 10);
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

// One read-only result line: "Home  X – Y  Away" with crests and a FINISHED tag.
function MatchLine({ fixture, teams }) {
  const home = teams.find((t) => t.id === fixture.homeTeamId) || { name: fixture.homeName };
  const away = teams.find((t) => t.id === fixture.awayTeamId) || { name: fixture.awayName };
  const played = isPlayed(fixture);
  const hs = Number(fixture.homeScore);
  const as = Number(fixture.awayScore);
  const homeWin = played && hs > as;
  const awayWin = played && as > hs;

  return (
    <div className="flex items-center gap-2 bg-slate-950/40 border border-slate-800/60 rounded-xl px-3 py-2.5 hover:border-slate-700 transition-colors">
      {/* home */}
      <div className="flex items-center gap-2 min-w-0 flex-1 justify-end text-right">
        <span className={`text-xs truncate ${homeWin ? "font-black text-emerald-300" : "font-bold text-slate-200"}`}>
          {home.name}
        </span>
        <TeamCrest team={home} size={20} />
      </div>

      {/* score */}
      <div className="flex flex-col items-center gap-1 shrink-0">
        {played ? (
          <span className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-700 text-sm font-black tabular-nums text-slate-100">
            {fixture.homeScore}
            <span className="text-slate-600 mx-0.5">–</span>
            {fixture.awayScore}
          </span>
        ) : (
          <span className="px-2.5 py-1 rounded-lg bg-slate-900/60 border border-slate-800 text-[10px] font-black uppercase tracking-wider text-slate-500">
            vs
          </span>
        )}
        {played && (
          <span className="flex items-center gap-1 text-[8px] font-black uppercase tracking-[0.15em] text-amber-300/80">
            <FiCheckCircle size={8} /> Finished
          </span>
        )}
        {played && fixture.playedAt && (
          <span className="flex items-center gap-1 text-[8px] font-bold uppercase tracking-wider text-slate-500 whitespace-nowrap">
            <FiCalendar size={8} /> {fmtPlayedDate(fixture.playedAt)}
          </span>
        )}
      </div>

      {/* away */}
      <div className="flex items-center gap-2 min-w-0 flex-1">
        <TeamCrest team={away} size={20} />
        <span className={`text-xs truncate ${awayWin ? "font-black text-emerald-300" : "font-bold text-slate-200"}`}>
          {away.name}
        </span>
      </div>
    </div>
  );
}

// Build a stable group label for a fixture (matchday for league rounds, round
// name for knockout rounds).
function groupLabel(f) {
  if (isKnockoutRound(f.round)) {
    const base = KO_ROUND_LABEL[f.round] || f.round;
    if (f.round !== "FINAL" && f.matchday != null) return `${base} · Leg ${f.matchday}`;
    return base;
  }
  return f.matchday != null ? `Matchday ${f.matchday}` : "Fixtures";
}

const KO_ORDER = ["PLAYOFFS", "LAST_16", "QUARTER_FINALS", "SEMI_FINALS", "FINAL"];

function sortKey(f) {
  if (isKnockoutRound(f.round)) {
    const ri = KO_ORDER.indexOf(f.round);
    return 1000 + ri * 10 + (f.matchday ?? 0);
  }
  return f.matchday ?? 0;
}

/**
 * MATCHES section with a per-team dropdown filter. Selecting a team shows only
 * that team's matches; "All teams" shows everything grouped by matchday/round.
 * Read-only — built for the already-finished imported competitions.
 */
export default function TeamMatchFilter({ teams = [], fixtures = [], defaultTeamId = "all" }) {
  const [teamId, setTeamId] = useState(defaultTeamId);

  // Sort the dropdown alphabetically for easy scanning.
  const sortedTeams = useMemo(
    () => [...teams].sort((a, b) => String(a.name).localeCompare(String(b.name))),
    [teams]
  );

  const visible = useMemo(() => {
    let list = fixtures;
    if (teamId !== "all") {
      const idNum = teamId;
      list = fixtures.filter(
        (f) => `${f.homeTeamId}` === `${idNum}` || `${f.awayTeamId}` === `${idNum}`
      );
    }
    return [...list].sort((a, b) => sortKey(a) - sortKey(b));
  }, [fixtures, teamId]);

  const grouped = useMemo(() => {
    const g = new Map();
    for (const f of visible) {
      const label = groupLabel(f);
      if (!g.has(label)) g.set(label, []);
      g.get(label).push(f);
    }
    return [...g.entries()].map(([label, items]) => ({ label, items }));
  }, [visible]);

  const selectedTeam = sortedTeams.find((t) => `${t.id}` === `${teamId}`);
  const playedCount = visible.filter(isPlayed).length;

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="relative flex items-center gap-2">
          <FiFilter className="text-emerald-400 shrink-0" />
          <div className="relative">
            <select
              value={teamId}
              onChange={(e) => setTeamId(e.target.value)}
              className="appearance-none bg-slate-950/70 border border-slate-700 rounded-xl pl-3 pr-9 py-2 text-xs font-bold text-slate-200 focus:border-emerald-500/50 focus:outline-none cursor-pointer min-w-[200px]"
            >
              <option value="all">All teams ({teams.length})</option>
              {sortedTeams.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 text-xs">
              ▾
            </span>
          </div>
          {selectedTeam && (
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/30">
              <TeamCrest team={selectedTeam} size={16} />
              <span className="text-[11px] font-black text-emerald-200">{selectedTeam.name}</span>
            </span>
          )}
        </div>
        <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">
          {visible.length} {visible.length === 1 ? "match" : "matches"}
          {playedCount === visible.length && visible.length > 0 ? " · all finished" : ""}
        </span>
      </div>

      {visible.length === 0 ? (
        <p className="text-xs text-slate-600 italic py-6 text-center">No matches for this selection.</p>
      ) : (
        <div className="space-y-5 max-h-[640px] overflow-y-auto pr-1">
          {grouped.map(({ label, items }, gi) => (
            <div key={label || gi}>
              {label && (
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-2 px-1">
                  {label}
                </p>
              )}
              <div className="space-y-1.5">
                {items.map((f) => (
                  <MatchLine key={f.id} fixture={f} teams={teams} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
