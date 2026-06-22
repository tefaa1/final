"use client";

import React, { useState } from "react";
import PlayerAvatar from "@/src/components/shared/PlayerAvatar";

// A player face that prefers the real photoUrl and gracefully falls back to the
// premium initials PlayerAvatar when there's no photo (or it fails to load).
// Used everywhere a player appears in the matches experience.
//
// Props:
//   photoUrl  — the player's real photo (player.photoUrl)
//   name      — "First Last" (drives the avatar fallback + alt text)
//   sport     — title-case sport for the fallback gradient ("Football", …)
//   size      — pixel size (square)
//   className — extra classes (rings etc.)
//   rounded   — Tailwind rounding class for the photo (default rounded-2xl)
export default function PlayerFace({ photoUrl, name, sport = "Football", size = 40, className = "", rounded = "rounded-2xl" }) {
  const [broken, setBroken] = useState(false);
  const show = photoUrl && !broken;
  if (show) {
    return (
      <img
        src={photoUrl}
        alt={name || ""}
        width={size}
        height={size}
        onError={() => setBroken(true)}
        className={`object-cover ${rounded} ${className}`}
        style={{ width: size, height: size }}
      />
    );
  }
  return <PlayerAvatar name={name} sport={sport} size={size} className={className} />;
}
