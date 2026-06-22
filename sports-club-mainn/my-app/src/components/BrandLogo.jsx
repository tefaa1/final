"use client";
import React from "react";

/**
 * MSCMS brand mark — a Barça-flavoured blaugrana crest rendered as a crisp,
 * self-contained inline SVG so it scales perfectly and is never clipped, in
 * both the expanded sidebar and the collapsed icon rail. No raster asset, no
 * network request, no fixed pixel art.
 *
 *   <BrandLogo />            -> crest only (square, fits any box via the parent)
 *   <BrandLogo withWordmark/> -> crest + "MSCMS" wordmark
 */

export function CrestMark({ className = "", title = "MSCMS" }) {
  // viewBox is a clean square so object-contain in a square box never clips.
  return (
    <svg
      viewBox="0 0 64 64"
      role="img"
      aria-label={title}
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="mscms-shield" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#1e3a8a" />
          <stop offset="55%" stopColor="#152a63" />
          <stop offset="100%" stopColor="#3b0a2a" />
        </linearGradient>
        <linearGradient id="mscms-stripe" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#a50044" />
          <stop offset="100%" stopColor="#c81d57" />
        </linearGradient>
        <linearGradient id="mscms-rim" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#fbbf24" />
          <stop offset="100%" stopColor="#f59e0b" />
        </linearGradient>
      </defs>

      {/* Shield body */}
      <path
        d="M32 3 L57 11 V31 C57 47 46 56 32 61 C18 56 7 47 7 31 V11 Z"
        fill="url(#mscms-shield)"
        stroke="url(#mscms-rim)"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />

      {/* Blaugrana vertical bars (top band) */}
      <g clipPath="url(#mscms-clip)">
        <rect x="14" y="9" width="6.4" height="20" fill="#a50044" opacity="0.92" />
        <rect x="26.8" y="9" width="6.4" height="20" fill="#a50044" opacity="0.92" />
        <rect x="39.6" y="9" width="6.4" height="20" fill="#a50044" opacity="0.92" />
      </g>
      <clipPath id="mscms-clip">
        <path d="M32 3 L57 11 V31 C57 47 46 56 32 61 C18 56 7 47 7 31 V11 Z" />
      </clipPath>

      {/* Diagonal accent stripe */}
      <path
        d="M9 30 L55 30 L55 36 L9 36 Z"
        fill="url(#mscms-stripe)"
        opacity="0.95"
      />

      {/* Centred monogram */}
      <text
        x="32"
        y="50"
        textAnchor="middle"
        fontFamily="ui-sans-serif, system-ui, sans-serif"
        fontWeight="800"
        fontSize="15"
        letterSpacing="-0.5"
        fill="#ffffff"
      >
        M
      </text>
      {/* Small star — Barça flourish */}
      <path
        d="M32 6.5 l1.3 2.7 3 .4 -2.2 2.1 .6 3 -2.7-1.5 -2.7 1.5 .6-3 -2.2-2.1 3-.4 Z"
        fill="#fbbf24"
      />
    </svg>
  );
}

export default function BrandLogo({ withWordmark = false, crestClassName = "" }) {
  return (
    <span className="flex items-center gap-2.5">
      <CrestMark className={crestClassName || "h-9 w-9"} />
      {withWordmark && (
        <span className="flex flex-col leading-none">
          <span className="text-xl font-extrabold tracking-[0.18em] text-white">
            MSCMS
          </span>
          <span className="text-[8px] font-bold uppercase tracking-[0.32em] text-amber-400/80">
            Més que un club
          </span>
        </span>
      )}
    </span>
  );
}
