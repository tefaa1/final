"use client";
import React, { useState } from "react";
import PlayerAvatar from "@/src/components/shared/PlayerAvatar";

/**
 * Premium player face: shows the real photoUrl when present (and it loads),
 * otherwise falls back to the shared sport-tinted initials avatar.
 * Never shows a broken image.
 */
export default function PlayerFace({ name, sport = "General", photoUrl, className = "", textClass = "" }) {
  const [broken, setBroken] = useState(false);
  const usePhoto = photoUrl && !broken;

  return (
    <div className={`relative overflow-hidden ${className}`}>
      <PlayerAvatar name={name} sport={sport} className="absolute inset-0 w-full h-full" textClass={textClass} />
      {usePhoto && (
        <img
          src={photoUrl}
          alt={name}
          loading="lazy"
          onError={() => setBroken(true)}
          className="absolute inset-0 w-full h-full object-cover object-top"
        />
      )}
    </div>
  );
}
