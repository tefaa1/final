"use client";

import React from "react";
import { IoIosPerson } from "react-icons/io";
import {
  lookupUser,
  initialsFromName,
} from "@/src/lib/userDirectory";
import PlayerAvatar, { SPORT_EMOJI } from "@/src/components/shared/PlayerAvatar";

// Sport keyed by the backend Position enum (handball is HB_ prefixed —
// see the backend Position.java). Anything we don't recognise falls
// through to "General".
const SPORT_BY_POSITION = {
  GOALKEEPER: "Football", RIGHT_BACK: "Football", LEFT_BACK: "Football",
  CENTER_BACK: "Football", DEFENSIVE_MID: "Football", CENTRAL_MID: "Football",
  ATTACKING_MID: "Football", RIGHT_WING: "Football", LEFT_WING: "Football", STRIKER: "Football",
  POINT_GUARD: "Basketball", SHOOTING_GUARD: "Basketball", SMALL_FORWARD: "Basketball",
  POWER_FORWARD: "Basketball", CENTER: "Basketball",
  HB_GOALKEEPER: "Handball", HB_LEFT_WING: "Handball", HB_RIGHT_WING: "Handball",
  HB_LEFT_BACK: "Handball", HB_RIGHT_BACK: "Handball", HB_CENTRE_BACK: "Handball",
  HB_PIVOT: "Handball",
  SINGLES_PLAYER: "Tennis", DOUBLES_PLAYER: "Tennis",
  SETTER: "Volleyball", OUTSIDE_HITTER: "Volleyball", OPPOSITE_HITTER: "Volleyball",
  MIDDLE_BLOCKER: "Volleyball", LIBERO: "Volleyball", DEFENSIVE_SPECIALIST: "Volleyball",
  FREESTYLE_SWIMMER: "Swimming", BACKSTROKE_SWIMMER: "Swimming",
  BREASTSTROKE_SWIMMER: "Swimming", BUTTERFLY_SWIMMER: "Swimming", MEDLEY_SWIMMER: "Swimming",
};

const SPORT_TONE = {
  Football:   { bg: "bg-emerald-500/10",  text: "text-emerald-400",  border: "border-emerald-500/30" },
  Basketball: { bg: "bg-blue-500/10",     text: "text-blue-400",     border: "border-blue-500/30" },
  Handball:   { bg: "bg-violet-500/10",   text: "text-violet-400",   border: "border-violet-500/30" },
  Volleyball: { bg: "bg-amber-500/10",    text: "text-amber-400",    border: "border-amber-500/30" },
  Tennis:     { bg: "bg-rose-500/10",     text: "text-rose-400",     border: "border-rose-500/30" },
  Swimming:   { bg: "bg-cyan-500/10",     text: "text-cyan-400",     border: "border-cyan-500/30" },
  General:    { bg: "bg-slate-500/10",    text: "text-slate-400",    border: "border-slate-500/30" },
};

// Resolve a display name for the card. Prefer fields the backend
// actually returns (firstName + lastName / name / username), and fall
// back to the seeded-user directory keyed by keycloakId.
function resolveName(player) {
  if (!player) return "Unknown Player";
  const fromBackend =
    [player.firstName, player.lastName].filter(Boolean).join(" ").trim() ||
    player.name ||
    player.username;
  if (fromBackend) return fromBackend;
  const fromDir = lookupUser(player.keycloakId);
  return fromDir ? fromDir.name : "Unknown Player";
}

function resolveSport(position) {
  if (!position) return "General";
  const p = String(position).toUpperCase().trim();
  return SPORT_BY_POSITION[p] || "General";
}

function PlayerCard({ player, onEdit, onOpen, isAdmin }) {
  const name = resolveName(player);
  const initials = initialsFromName(name);

  const positionName = (player?.preferredPosition || player?.position || "—").replace(/_/g, " ");
  const sport = resolveSport(player?.preferredPosition || player?.position);
  const tone = SPORT_TONE[sport] || SPORT_TONE.General;

  const age = player?.dateOfBirth
    ? Math.max(0, new Date().getFullYear() - new Date(player.dateOfBirth).getFullYear())
    : "—";

  const nationality =
    player?.nationality && player.nationality !== "string"
      ? player.nationality
      : "International";

  return (
    <div
      onClick={() => onOpen?.(player)}
      className="bg-slate-900/40 backdrop-blur-md rounded-3xl p-6 border border-slate-800/50 transition-all duration-300 hover:border-emerald-500/40 hover:translate-y-[-4px] group overflow-hidden shadow-lg relative cursor-pointer"
    >
      {/* Click hint */}
      <span className="absolute bottom-3 right-4 text-[9px] font-bold uppercase tracking-widest text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity">
        View profile →
      </span>

      {/* Edit (admins only) */}
      {isAdmin && onEdit && (
        <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity z-10">
          <button
            onClick={(e) => { e.stopPropagation(); onEdit(player); }}
            className="bg-emerald-500/20 hover:bg-emerald-500 text-emerald-500 hover:text-white p-2 rounded-xl border border-emerald-500/20 transition-all"
            title="Edit Player"
          >
            <span className="material-symbols-outlined text-sm">edit</span>
          </button>
        </div>
      )}

      {/* ── Header: avatar + name + position ───────────────────────────── */}
      <div className="flex items-center gap-4 mb-5">
        {/* Premium initials avatar (colour-coded by sport) + sport badge */}
        <div className="relative shrink-0">
          <PlayerAvatar name={name} sport={sport} size={64} className="border border-slate-800 shadow-lg" />
          <span className="absolute -bottom-1.5 -right-1.5 w-6 h-6 rounded-full bg-slate-950 border border-slate-700 flex items-center justify-center text-xs shadow-lg">
            {SPORT_EMOJI[sport] || "🏅"}
          </span>
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-black text-slate-100 leading-tight truncate group-hover:text-emerald-400 transition-colors">
            {name}
          </h3>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mt-1 truncate">
            {positionName}
          </p>
        </div>
      </div>

      {/* Sport badge */}
      <div className="mb-5">
        <span className={`text-[10px] font-black uppercase px-3 py-1.5 rounded-full ${tone.bg} ${tone.text} border ${tone.border}`}>
          {sport}
        </span>
      </div>

      {/* Age + Nationality */}
      <div className="grid grid-cols-2 gap-4 border-y border-slate-800/40 py-4 mb-4">
        <div className="border-r border-slate-800/40">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Age</p>
          <p className="text-base font-bold text-slate-100">
            {age} {typeof age === "number" && <span className="text-[10px] text-slate-500 font-normal">YRS</span>}
          </p>
        </div>
        <div className="pl-2">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Nationality</p>
          <p className="text-base font-bold text-slate-100 truncate">{nationality}</p>
        </div>
      </div>

      {/* Kit / Market value / Rating strip */}
      <div className="flex justify-between items-center bg-slate-950/30 rounded-2xl p-3 border border-slate-800/30">
        <div className="text-center flex-1">
          <p className="text-[9px] font-black text-slate-500 uppercase mb-0.5">Kit</p>
          <p className="text-base font-black text-slate-100">#{player?.kitNumber ?? "—"}</p>
        </div>
        <div className="w-[1px] h-5 bg-slate-800" />
        <div className="text-center flex-1">
          <p className="text-[9px] font-black text-slate-500 uppercase mb-0.5">Market</p>
          <p className="text-base font-black text-emerald-500">
            {player?.marketValue ? `€${Number(player.marketValue).toLocaleString()}` : "—"}
          </p>
        </div>
        <div className="w-[1px] h-5 bg-slate-800" />
        <div className="text-center flex-1">
          <p className="text-[9px] font-black text-slate-500 uppercase mb-0.5">Status</p>
          <p className="text-[11px] font-black text-sky-400 uppercase">
            {player?.status || "—"}
          </p>
        </div>
      </div>
    </div>
  );
}

export default PlayerCard;
