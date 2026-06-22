"use client";

import React from "react";
import { FiBookOpen, FiCheck } from "react-icons/fi";
import { getCompRules } from "./compRules";

// Compact "format rules" card for the competition detail. Pulls the right rule
// set from getCompRules() (preset rules for user comps, a correct summary for the
// imported La Liga / Champions League).
export default function RulesCard({ competition }) {
  const info = getCompRules(competition);
  if (!info) return null;
  return (
    <section className="bg-slate-900/50 rounded-2xl border border-slate-800 p-5">
      <h2 className="text-sm font-black uppercase tracking-widest text-slate-300 mb-3 flex items-center gap-2">
        <FiBookOpen className="text-emerald-400" /> {info.title}
      </h2>
      <ul className="space-y-1.5">
        {info.rules.map((r, i) => (
          <li key={i} className="flex items-start gap-2 text-xs text-slate-400 leading-relaxed">
            <FiCheck className="text-emerald-400/80 shrink-0 mt-0.5" size={13} />
            <span>{r}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
