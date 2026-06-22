"use client";

import React from "react";
import { TeamCrest } from "./TeamPicker";

// Full standings table computed from played fixtures (rows = computeStandings()).
// Premium dark-slate styling, crests, no raw ids. When `championTop` is set the
// leader is crowned (gold), otherwise the top spot just gets the rank accent.
export default function StandingsTable({ rows, championTop = false }) {
  if (!rows || rows.length === 0) {
    return (
      <p className="text-xs text-slate-600 italic py-6 text-center">
        No standings yet — record some results to build the table.
      </p>
    );
  }
  return (
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
            const isChamp = championTop && i === 0;
            // rank accent bar: top = emerald (leader), 2-3 amber, rest neutral
            const bar =
              i === 0 ? "bg-emerald-400" : i <= 2 ? "bg-amber-400/70" : "bg-slate-700";
            return (
              <tr
                key={r.teamId ?? r.name}
                className={`border-b border-slate-900/60 ${isChamp ? "bg-amber-500/10" : "hover:bg-slate-800/30"} transition-colors`}
              >
                <td className="py-2 px-2">
                  <span className="flex items-center gap-1.5">
                    <span className={`w-1 h-4 rounded-full ${bar}`} />
                    <span className="font-mono text-slate-500">{i + 1}</span>
                  </span>
                </td>
                <td className="py-2">
                  <span className={`flex items-center gap-2 font-bold ${isChamp ? "text-amber-200" : "text-slate-200"}`}>
                    {isChamp && <span title="Champion">🏆</span>}
                    <TeamCrest team={r} size={18} />
                    <span className="truncate max-w-[150px]">{r.name}</span>
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
  );
}
