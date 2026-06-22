"use client";

import { useState } from "react";
import { formations } from "../data/formations";
import { players } from "../data/players";
import { motion } from "framer-motion";
import { IoIosPerson } from "react-icons/io";
import useRole from "@/src/lib/useRole";

// Detect the sport of a match. Covers `sportType` and `sport` fields and
// normalises Catalan / Spanish variants ("Bàsquet", "Handbol", …).
const detectSport = (match) => {
  const raw = String(match?.sportType || match?.sport || "")
    .toLowerCase()
    .trim();
  if (!raw) return "";
  if (raw.includes("foot") || raw.includes("soccer")) return "football";
  if (raw.includes("basket") || raw.includes("basquet") || raw.includes("bàsquet")) return "basketball";
  if (raw.includes("hand")) return "handball";
  if (raw.includes("volley") || raw.includes("voleibol")) return "volleyball";
  if (raw.includes("tennis") || raw.includes("tenis")) return "tennis";
  return raw;
};

export default function FormationBoard({ match, lineup }) {
  const [formation, setFormation] = useState("4-3-3");
  const positions = formations[formation] || [];
  // Use the match's real lineup when available; fall back to the sample squad.
  const squad = (Array.isArray(lineup) && lineup.length) ? lineup : players;
  const { role } = useRole();
  const isAdmin = role === "admin";

  const sport = detectSport(match);
  // Treat unknown / missing sport as football so legacy matches still get
  // the rich tactical view they had before.
  const isFootball = sport === "" || sport === "football";

  const sportLabel = sport
    ? sport.charAt(0).toUpperCase() + sport.slice(1)
    : "Football";

  return (
    <div className="min-h-screen bg-slate-900 text-white p-6">
      {/* Formation selector — only meaningful for football */}
      {isFootball && (
        <select
          value={formation}
          onChange={(e) => setFormation(e.target.value)}
          className="bg-slate-950 border border-slate-800 text-slate-100 px-4 py-2.5 rounded-xl mb-8 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all font-bold text-sm uppercase tracking-widest cursor-pointer shadow-lg shadow-emerald-950/20"
        >
          <option value="4-3-3">Formation 4-3-3</option>
          <option value="4-4-2">Formation 4-4-2</option>
          <option value="3-5-2">Formation 3-5-2</option>
        </select>
      )}

      <div
        className={`grid gap-6 ${
          isAdmin ? "lg:grid-cols-[1fr_280px]" : "grid-cols-1"
        }`}
      >
        {/* Pitch — football only. Other sports show a neutral panel so
            View Details remains useful without a misleading football
            pitch. */}
        {isFootball ? (
          <div
            className="
              relative
              w-full
              max-w-[420px]
              h-[650px]
              mx-auto
              rounded-xl
              overflow-hidden
              border border-slate-600
              bg-cover bg-center
            "
            style={{ backgroundImage: "url('/pitch.png')" }}
          >
            {positions.map((pos, index) => (
              <motion.div
                key={squad[index]?.id ?? index}
                drag
                dragMomentum={false}
                layout
                initial={{ scale: 0 }}
                animate={{ scale: 1, top: pos.top, left: pos.left }}
                transition={{ duration: 0.5 }}
                style={{ position: "absolute" }}
                className="
                  w-[55px]
                  h-[65px]
                  rounded-lg
                  flex flex-col items-center justify-center
                  cursor-grab
                  -translate-x-1/2 -translate-y-1/2
                  hover:scale-110
                  transition
                "
              >
                <div className="w-12 h-12 rounded-full bg-slate-950/90 border border-emerald-500/40 shadow-lg flex items-center justify-center">
                  <IoIosPerson className="text-emerald-400" size={32} />
                </div>

                <p className="text-[10px] text-white font-black text-center leading-tight bg-slate-950/80 px-2 py-1 rounded border border-slate-800 backdrop-blur-sm mt-1">
                  {squad[index]?.name ?? "—"}
                </p>

                <span className="text-[8px] text-emerald-400 font-black uppercase tracking-widest mt-0.5 bg-slate-950/80 px-1 rounded">
                  {squad[index]?.position ?? pos.label ?? ""}
                </span>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="w-full max-w-[640px] mx-auto rounded-xl border border-slate-700/60 bg-slate-950/60 p-10 flex flex-col items-center justify-center text-center min-h-[420px]">
            <IoIosPerson className="text-slate-600" size={72} />
            <h3 className="mt-4 text-lg font-black text-slate-200 uppercase tracking-widest">
              Tactical pitch is football-only
            </h3>
            <p className="mt-2 text-xs text-slate-500 max-w-md leading-relaxed">
              The tactical board is designed for the football pitch layout.
              For {sportLabel} matches we show the lineup overview instead —
              {" "}
              {isAdmin
                ? "the roster panel on the right lists each squad member."
                : "ask an admin to enable the roster view."}
            </p>
          </div>
        )}

        {/* Roster list — admin only, regardless of sport */}
        {isAdmin && (
          <aside className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 h-fit sticky top-6">
            <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.25em] mb-3">
              Squad numbers
            </h4>
            <ul className="space-y-1.5">
              {squad.map((p) => (
                <li
                  key={p.id}
                  className="flex items-center gap-3 px-3 py-2 rounded-lg bg-slate-900/60 border border-slate-800/60"
                >
                  <span className="w-8 h-8 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center">
                    <IoIosPerson className="text-emerald-400" size={18} />
                  </span>
                  <span className="text-[10px] font-mono text-slate-500 w-6">
                    {p.number ?? p.kitNumber ?? ""}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-slate-200 truncate">
                      {p.name}
                    </p>
                    <p className="text-[9px] font-black uppercase tracking-widest text-emerald-400">
                      {p.position}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </aside>
        )}
      </div>
    </div>
  );
}
