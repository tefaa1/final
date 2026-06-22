"use client";

import React, { useMemo, useState } from "react";
import { KNOWN_TEAMS, KNOWN_OUTER_TEAMS } from "@/src/lib/teamDirectory";
import { crestForSport } from "./presets";
import { FiPlus, FiSearch, FiCheck } from "react-icons/fi";

// Flatten both directories into a single de-duped pool of pickable teams.
function buildPool() {
  const all = [
    ...Object.values(KNOWN_TEAMS),
    ...Object.values(KNOWN_OUTER_TEAMS),
  ];
  const seen = new Set();
  const pool = [];
  for (const t of all) {
    if (seen.has(t.name)) continue;
    seen.add(t.name);
    pool.push(t);
  }
  return pool;
}

export function TeamCrest({ team, size = 20, className = "" }) {
  const px = `${size}px`;
  if (team?.crestUrl) {
    return (
      <img
        src={team.crestUrl}
        alt=""
        style={{ width: px, height: px }}
        className={`object-contain ${className}`}
        onError={(e) => {
          e.currentTarget.style.display = "none";
        }}
      />
    );
  }
  // The DB round-trips emoji crests to "?" — when there's no badge URL we
  // re-derive a clean sport emoji instead of rendering the mangled value.
  const emoji =
    !team?.crest || team.crest === "?" ? crestForSport(team?.sport) : team.crest;
  return (
    <span style={{ fontSize: px }} className={className} aria-hidden>
      {emoji}
    </span>
  );
}

/**
 * Grid of all pool teams. Teams already in the competition show as added.
 * onAdd(team) is called with {name, short, sport, crest, crestUrl}.
 */
export default function TeamPicker({ existingNames = [], onAdd }) {
  const [q, setQ] = useState("");
  const pool = useMemo(buildPool, []);
  const taken = useMemo(() => new Set(existingNames), [existingNames]);

  const filtered = pool.filter((t) =>
    t.name.toLowerCase().includes(q.trim().toLowerCase())
  );

  return (
    <div>
      <div className="relative mb-4">
        <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search teams to add…"
          className="w-full bg-slate-950/60 border border-slate-800 rounded-xl pl-9 pr-3 py-2.5 text-sm text-slate-200 placeholder:text-slate-600 focus:border-emerald-500/50 focus:outline-none"
        />
      </div>
      <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-2 max-h-80 overflow-y-auto pr-1">
        {filtered.map((t) => {
          const added = taken.has(t.name);
          return (
            <button
              key={t.name}
              disabled={added}
              onClick={() => !added && onAdd(t)}
              className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl border text-left transition-all ${
                added
                  ? "bg-emerald-500/10 border-emerald-500/30 cursor-default"
                  : "bg-slate-950/40 border-slate-800 hover:border-emerald-500/40 hover:bg-slate-900/60"
              }`}
            >
              <TeamCrest team={t} size={22} />
              <span className="min-w-0 flex-1">
                <span className="block text-xs font-bold text-slate-200 truncate">
                  {t.name}
                </span>
                <span className="block text-[10px] text-slate-500 uppercase tracking-wider">
                  {t.sport}
                </span>
              </span>
              {added ? (
                <FiCheck className="text-emerald-400 shrink-0" />
              ) : (
                <FiPlus className="text-slate-500 shrink-0" />
              )}
            </button>
          );
        })}
        {filtered.length === 0 && (
          <p className="col-span-full text-xs text-slate-600 italic py-4 text-center">
            No teams match “{q}”.
          </p>
        )}
      </div>
    </div>
  );
}
