"use client";

import React from "react";

// Map a real DB competition to its football-data crest. We match by name/type so
// the imported La Liga + Champions League rows render their proper badge. The
// dark UEFA "star-ball" badge is illegible on the dark theme, so we always set
// it on a subtle light, rounded container with a ring (see <CompCrest>).
export function crestForCompetition(competition) {
  const name = (competition?.name || "").toLowerCase();
  if (name.includes("champions")) return "https://crests.football-data.org/CL.png";
  if (name.includes("liga") || name.includes("primera"))
    return "https://crests.football-data.org/PD.png";
  // Fallback by type: KNOCKOUT → CL badge, LEAGUE → La Liga badge.
  return competition?.type === "KNOCKOUT"
    ? "https://crests.football-data.org/CL.png"
    : "https://crests.football-data.org/PD.png";
}

/**
 * Competition logo on a clean light, rounded container so dark badges (the UEFA
 * star-ball) stay legible on the dark UI. `size` is the badge px; the container
 * adds padding + a subtle ring.
 */
export default function CompCrest({ competition, size = 40, className = "" }) {
  const src = crestForCompetition(competition);
  const box = size + 12; // padding around the badge
  return (
    <span
      className={`inline-flex items-center justify-center rounded-xl bg-white/90 ring-1 ring-white/30 shadow-sm shrink-0 ${className}`}
      style={{ width: box, height: box }}
    >
      <img
        src={src}
        alt=""
        style={{ width: size, height: size }}
        className="object-contain"
        onError={(e) => {
          e.currentTarget.style.display = "none";
        }}
      />
    </span>
  );
}
