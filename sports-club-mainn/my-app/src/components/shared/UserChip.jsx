"use client";

import React, { useEffect, useState } from "react";
import { lookupUser, displayUserName, initialsFromName, shortenId, ensureLiveUsers } from "@/src/lib/userDirectory";
import { api } from "@/src/lib/api";

/**
 * Renders a Keycloak UUID as a human-friendly chip: avatar (initials)
 * + display name + small role line. Replaces every place that used to
 * dump a raw "00000000-0000-0000-0000-000000000101" string at the user.
 *
 * Variants:
 *   compact (default) — inline pill, fits inside a table cell
 *   full              — bigger card-style block with role + ID line
 *   avatar            — just the round avatar (for tight grid views)
 *
 * Props:
 *   keycloakId   string  — required
 *   fallback     string  — label prefix if the id isn't in the directory
 *                          (e.g. "Player a1b2c3…")
 *   variant      "compact" | "full" | "avatar"
 *   showRole     boolean — show the role line in the compact variant too
 */
export default function UserChip({
  keycloakId,
  fallback = "User",
  variant = "compact",
  showRole = false,
}) {
  // Load the live /users directory once (shared across all chips), then re-render.
  const [, setTick] = useState(0);
  useEffect(() => {
    let alive = true;
    ensureLiveUsers(() => api.getUsers()).then(() => alive && setTick((t) => t + 1));
    return () => { alive = false; };
  }, []);

  const known   = lookupUser(keycloakId);
  const name    = known ? known.name : displayUserName(keycloakId, fallback);
  const role    = known ? known.role : "";
  const initials = initialsFromName(name);

  // Stable colour per name so the same user always gets the same swatch.
  const swatch = pickSwatch(name);

  if (variant === "avatar") {
    return (
      <span
        title={`${name}${role ? ` — ${role}` : ""}`}
        className="inline-flex w-8 h-8 rounded-full items-center justify-center font-black text-[10px] border"
        style={{ background: swatch.bg, color: swatch.fg, borderColor: swatch.border }}
      >
        {initials}
      </span>
    );
  }

  if (variant === "full") {
    return (
      <div className="inline-flex items-center gap-3 bg-slate-900/40 border border-slate-800 rounded-xl px-3 py-2">
        <span
          className="inline-flex w-10 h-10 rounded-xl items-center justify-center font-black text-xs border shrink-0"
          style={{ background: swatch.bg, color: swatch.fg, borderColor: swatch.border }}
        >
          {initials}
        </span>
        <div className="min-w-0">
          <p className="text-sm font-bold text-slate-100 truncate">{name}</p>
          {role && (
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 truncate">
              {role}
            </p>
          )}
          {keycloakId && (
            <p className="text-[9px] font-mono text-slate-600 truncate">{shortenId(keycloakId)}</p>
          )}
        </div>
      </div>
    );
  }

  // compact (default)
  return (
    <span
      className="inline-flex items-center gap-2 bg-slate-900/60 border border-slate-800 rounded-full pl-1 pr-3 py-1 max-w-full"
      title={keycloakId || ""}
    >
      <span
        className="inline-flex w-6 h-6 rounded-full items-center justify-center font-black text-[9px] border shrink-0"
        style={{ background: swatch.bg, color: swatch.fg, borderColor: swatch.border }}
      >
        {initials}
      </span>
      <span className="text-xs font-bold text-slate-200 truncate">{name}</span>
      {showRole && role && (
        <span className="text-[9px] font-black uppercase tracking-widest text-slate-500 truncate">
          · {role}
        </span>
      )}
    </span>
  );
}

// ── Deterministic colour selection ───────────────────────────────────
// A tiny hash → palette index so the same name always renders the same
// colour. No external state, no flicker on re-render.
const PALETTE = [
  { bg: "rgba(16,185,129,0.10)", fg: "rgb(110,231,183)", border: "rgba(16,185,129,0.35)" }, // emerald
  { bg: "rgba(59,130,246,0.10)", fg: "rgb(147,197,253)", border: "rgba(59,130,246,0.35)" }, // blue
  { bg: "rgba(168,85,247,0.10)", fg: "rgb(216,180,254)", border: "rgba(168,85,247,0.35)" }, // violet
  { bg: "rgba(245,158,11,0.10)", fg: "rgb(252,211,77)",  border: "rgba(245,158,11,0.35)" }, // amber
  { bg: "rgba(244,63,94,0.10)",  fg: "rgb(253,164,175)", border: "rgba(244,63,94,0.35)" },  // rose
  { bg: "rgba(14,165,233,0.10)", fg: "rgb(125,211,252)", border: "rgba(14,165,233,0.35)" }, // sky
];

function pickSwatch(text) {
  if (!text) return PALETTE[0];
  let hash = 0;
  for (let i = 0; i < text.length; i++) hash = (hash * 31 + text.charCodeAt(i)) >>> 0;
  return PALETTE[hash % PALETTE.length];
}
