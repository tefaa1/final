"use client";

import React, { useMemo } from "react";
import { FiAward } from "react-icons/fi";
import { computeStandings, clZone, CL_ZONES, isLeaguePhaseRound } from "./store";
import { TeamCrest } from "./TeamPicker";

// Single 36-row league-phase table with the three qualification zones colour-coded:
//   1–8   green  → Round of 16
//   9–24  amber  → knockout play-off
//   25–36 grey   → eliminated
export default function ClLeaguePhase({ teams, fixtures }) {
  const phaseFixtures = useMemo(
    () => (fixtures || []).filter((f) => isLeaguePhaseRound(f.round)),
    [fixtures]
  );
  const rows = useMemo(
    () => computeStandings(teams, phaseFixtures),
    [teams, phaseFixtures]
  );

  const ZONE_BAR = {
    direct: "bg-emerald-400",
    playoff: "bg-amber-400",
    out: "bg-slate-700",
  };
  const ZONE_ROW = {
    direct: "border-l-2 border-emerald-500/40",
    playoff: "border-l-2 border-amber-500/30",
    out: "border-l-2 border-transparent",
  };

  return (
    <section className="bg-slate-900/50 rounded-2xl border border-slate-800 p-5">
      <h2 className="text-sm font-black uppercase tracking-widest text-slate-300 mb-4 flex items-center gap-2">
        <FiAward className="text-blue-400" /> League phase · single table of {rows.length}
      </h2>

      {/* zone legend */}
      <div className="flex flex-wrap gap-2 mb-4">
        {CL_ZONES.map((z) => (
          <span
            key={z.key}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider border ${
              z.color === "emerald"
                ? "bg-emerald-500/10 text-emerald-300 border-emerald-500/30"
                : z.color === "amber"
                ? "bg-amber-500/10 text-amber-300 border-amber-500/30"
                : "bg-slate-800/50 text-slate-400 border-slate-700"
            }`}
          >
            <span className="text-slate-500">{z.range}</span> {z.label}
          </span>
        ))}
      </div>

      {rows.length === 0 ? (
        <p className="text-xs text-slate-600 italic py-6 text-center">No standings yet.</p>
      ) : (
        <div className="overflow-x-auto -mx-1">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-slate-500 border-b border-slate-800">
                <th className="text-left font-black py-2 px-2 w-8">#</th>
                <th className="text-left font-black py-2">Team</th>
                <th className="font-black py-2 px-1.5 text-center">P</th>
                <th className="font-black py-2 px-1.5 text-center hidden sm:table-cell">W</th>
                <th className="font-black py-2 px-1.5 text-center hidden sm:table-cell">D</th>
                <th className="font-black py-2 px-1.5 text-center hidden sm:table-cell">L</th>
                <th className="font-black py-2 px-1.5 text-center hidden md:table-cell">GF</th>
                <th className="font-black py-2 px-1.5 text-center hidden md:table-cell">GA</th>
                <th className="font-black py-2 px-1.5 text-center">GD</th>
                <th className="font-black py-2 px-2 text-center">Pts</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => {
                const zone = clZone(i);
                return (
                  <tr
                    key={r.teamId ?? r.name}
                    className={`border-b border-slate-900/60 hover:bg-slate-800/30 transition-colors ${ZONE_ROW[zone]}`}
                  >
                    <td className="py-2 px-2">
                      <span className="flex items-center gap-1.5">
                        <span className={`w-1 h-4 rounded-full ${ZONE_BAR[zone]}`} />
                        <span className="font-mono text-slate-500">{i + 1}</span>
                      </span>
                    </td>
                    <td className="py-2">
                      <span className="flex items-center gap-2 font-bold text-slate-200">
                        <TeamCrest team={r} size={18} />
                        <span className="truncate max-w-[170px]">{r.name}</span>
                      </span>
                    </td>
                    <td className="text-center py-2 px-1.5 text-slate-400">{r.played}</td>
                    <td className="text-center py-2 px-1.5 text-slate-400 hidden sm:table-cell">{r.won}</td>
                    <td className="text-center py-2 px-1.5 text-slate-400 hidden sm:table-cell">{r.drawn}</td>
                    <td className="text-center py-2 px-1.5 text-slate-400 hidden sm:table-cell">{r.lost}</td>
                    <td className="text-center py-2 px-1.5 text-slate-400 hidden md:table-cell">{r.gf}</td>
                    <td className="text-center py-2 px-1.5 text-slate-400 hidden md:table-cell">{r.ga}</td>
                    <td className="text-center py-2 px-1.5 text-slate-300">{r.gd > 0 ? `+${r.gd}` : r.gd}</td>
                    <td className="text-center py-2 px-2 font-black text-slate-100">{r.points}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
