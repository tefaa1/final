"use client";
import React from "react";

// Elegant, premium initials avatar — a rich sport-coloured gradient with a soft
// highlight and the player's initials. Not a cartoon, not a photo.
const SPORT_GRAD = {
  // sports
  Football:   "from-emerald-500 via-emerald-800 to-slate-950",
  Basketball: "from-blue-500 via-blue-900 to-slate-950",
  Handball:   "from-violet-500 via-violet-900 to-slate-950",
  Tennis:     "from-rose-500 via-rose-900 to-slate-950",
  General:    "from-slate-500 via-slate-800 to-slate-950",
  // role tones (for users / staff)
  Admin:      "from-red-500 via-red-900 to-slate-950",
  Coach:      "from-blue-500 via-blue-900 to-slate-950",
  Medical:    "from-teal-500 via-teal-900 to-slate-950",
  Analyst:    "from-indigo-500 via-indigo-900 to-slate-950",
  Manager:    "from-amber-500 via-amber-900 to-slate-950",
  Scout:      "from-purple-500 via-purple-900 to-slate-950",
  Sponsor:    "from-orange-500 via-orange-900 to-slate-950",
  Player:     "from-emerald-500 via-emerald-800 to-slate-950",
};

export const SPORT_EMOJI = {
  Football: "⚽", Basketball: "🏀", Handball: "🤾", Tennis: "🎾", General: "🏅",
};

// Map any role string to an avatar tone key.
export function roleTone(role) {
  const r = String(role || "").toUpperCase();
  if (r === "ADMIN") return "Admin";
  if (r.includes("COACH")) return "Coach";
  if (r.includes("DOCTOR") || r.includes("PHYSIO")) return "Medical";
  if (r.includes("ANALYST")) return "Analyst";
  if (r.includes("MANAGER") || r.includes("MANGER")) return "Manager";
  if (r === "SCOUT") return "Scout";
  if (r === "SPONSOR") return "Sponsor";
  if (r === "PLAYER") return "Player";
  return "General";
}

function initialsOf(name) {
  const parts = String(name || "").trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "?";
  return (parts[0][0] + (parts.length > 1 ? parts[parts.length - 1][0] : "")).toUpperCase();
}

export default function PlayerAvatar({ name, sport = "General", size, className = "", textClass = "" }) {
  const grad = SPORT_GRAD[sport] || SPORT_GRAD.General;
  const dims = size ? { width: size, height: size } : undefined;
  const fontStyle = size ? { fontSize: Math.round(size * 0.36) } : undefined;
  return (
    <div
      className={`relative flex items-center justify-center overflow-hidden ${size ? "rounded-2xl" : ""} ${className}`}
      style={dims}
    >
      <div className={`absolute inset-0 bg-gradient-to-br ${grad}`} />
      {/* premium sheen + subtle ring */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_22%,rgba(255,255,255,0.22),transparent_58%)]" />
      <div className="absolute inset-0 ring-1 ring-inset ring-white/10 rounded-[inherit]" />
      <span className={`relative font-black text-white/95 tracking-wider drop-shadow ${textClass}`} style={fontStyle}>
        {initialsOf(name)}
      </span>
    </div>
  );
}
