"use client";

import React, { useMemo, useState } from "react";

// ── FC Barcelona honours per SPORT — each trophy gets its own silhouette. ─────
// Curated historical facts (counts & years) presented as a museum cabinet.
// The cabinet is shown one sport at a time via the sport selector.
const HONOURS_BY_SPORT = {
  FOOTBALL: {
    label: "Football", emoji: "⚽",
    sections: [
      { label: "European Honours", accent: "amber", items: [
        { name: "European Cup / Champions League", count: 5, years: "1992 · 2006 · 2009 · 2011 · 2015", shape: "ucl" },
        { name: "UEFA Cup Winners' Cup", count: 4, years: "1979 · 1982 · 1989 · 1997", shape: "cupwinners" },
        { name: "UEFA Super Cup", count: 5, years: "1992 · 1997 · 2009 · 2011 · 2015", shape: "supercup" },
      ]},
      { label: "World Honours", accent: "sky", items: [
        { name: "FIFA Club World Cup", count: 3, years: "2009 · 2011 · 2015", shape: "globe" },
      ]},
      { label: "Domestic Honours", accent: "emerald", items: [
        { name: "La Liga", count: 27, years: "Record · most recent 2024–25", shape: "laliga" },
        { name: "Copa del Rey", count: 31, years: "All-time record holders", shape: "copa" },
        { name: "Supercopa de España", count: 14, years: "Record · most recent 2025", shape: "supercopa" },
      ]},
    ],
  },
  BASKETBALL: {
    label: "Basketball", emoji: "🏀",
    sections: [
      { label: "European Honours", accent: "amber", items: [
        { name: "EuroLeague", count: 2, years: "2003 · 2010", shape: "ucl" },
        { name: "Saporta Cup", count: 2, years: "1985 · 1986", shape: "cupwinners" },
        { name: "Korać Cup", count: 1, years: "1987", shape: "supercup" },
      ]},
      { label: "Domestic Honours", accent: "emerald", items: [
        { name: "Liga ACB", count: 19, years: "Record · most recent 2021", shape: "laliga" },
        { name: "Copa del Rey", count: 28, years: "Record holders", shape: "copa" },
        { name: "Supercopa de España", count: 6, years: "most recent 2024", shape: "supercopa" },
      ]},
    ],
  },
  HANDBALL: {
    label: "Handball", emoji: "🤾",
    sections: [
      { label: "European Honours", accent: "amber", items: [
        { name: "EHF Champions League", count: 11, years: "Record · most recent 2024", shape: "ucl" },
        { name: "EHF Cup Winners' Cup", count: 5, years: "1984 → 1995", shape: "cupwinners" },
        { name: "EHF Super Cup", count: 6, years: "most recent 2004", shape: "supercup" },
      ]},
      { label: "Domestic Honours", accent: "emerald", items: [
        { name: "Liga ASOBAL", count: 31, years: "Record · most recent 2025", shape: "laliga" },
        { name: "Copa del Rey", count: 26, years: "Record holders", shape: "copa" },
        { name: "Copa ASOBAL", count: 22, years: "Record holders", shape: "supercopa" },
      ]},
    ],
  },
  TENNIS: {
    label: "Tennis", emoji: "🎾",
    sections: [
      { label: "Academy Honours", accent: "sky", items: [
        { name: "ITF Junior Titles", count: 18, years: "Academy programme", shape: "globe" },
        { name: "National Team Titles", count: 7, years: "Catalan & Spanish series", shape: "supercup" },
        { name: "ATP/WTA Titles (members)", count: 12, years: "Affiliated professionals", shape: "laliga" },
      ]},
    ],
  },
};

// NOTE: full literal class strings only — Tailwind v4 cannot see interpolated names.
const ACCENTS = {
  amber: {
    text: "text-amber-300", soft: "text-amber-400/80", glow: "rgba(245,158,11,0.45)",
    chip: "bg-amber-400/10 text-amber-300 border-amber-400/20",
    lineL: "bg-gradient-to-r from-transparent to-amber-500/40",
    lineR: "bg-gradient-to-l from-transparent to-amber-500/40",
  },
  sky: {
    text: "text-sky-300", soft: "text-sky-400/80", glow: "rgba(56,189,248,0.40)",
    chip: "bg-sky-400/10 text-sky-300 border-sky-400/20",
    lineL: "bg-gradient-to-r from-transparent to-sky-500/40",
    lineR: "bg-gradient-to-l from-transparent to-sky-500/40",
  },
  emerald: {
    text: "text-emerald-300", soft: "text-emerald-400/80", glow: "rgba(16,185,129,0.40)",
    chip: "bg-emerald-400/10 text-emerald-300 border-emerald-400/20",
    lineL: "bg-gradient-to-r from-transparent to-emerald-500/40",
    lineR: "bg-gradient-to-l from-transparent to-emerald-500/40",
  },
};

const Gold = ({ id }) => (
  <defs>
    <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stopColor="#fef3c7" />
      <stop offset="0.45" stopColor="#f59e0b" />
      <stop offset="1" stopColor="#b45309" />
    </linearGradient>
  </defs>
);

// ── Seven distinct trophy silhouettes ───────────────────────────────────────
function Trophy({ shape, gid, className }) {
  const g = `url(#${gid})`;
  const D = "#7c2d12"; // dark base / engraving
  switch (shape) {
    case "ucl": // Champions League "Old Big Ears"
      return (
        <svg viewBox="0 0 90 100" className={className} xmlns="http://www.w3.org/2000/svg">
          <Gold id={gid} />
          <path d="M26 22 C-4 22 -2 70 34 62" stroke={g} strokeWidth="6" fill="none" strokeLinecap="round" />
          <path d="M64 22 C94 22 92 70 56 62" stroke={g} strokeWidth="6" fill="none" strokeLinecap="round" />
          <path d="M24 14 H66 V28 a21 17 0 0 1 -42 0 Z" fill={g} />
          <ellipse cx="45" cy="15" rx="21" ry="3.4" fill="#fde68a" />
          <rect x="40" y="44" width="10" height="16" fill={g} />
          <rect x="28" y="60" width="34" height="6" rx="2" fill={g} />
          <rect x="24" y="66" width="42" height="9" rx="2" fill={D} />
        </svg>
      );
    case "cupwinners": // tall cup, angular geometric handles, hexagonal base
      return (
        <svg viewBox="0 0 70 100" className={className} xmlns="http://www.w3.org/2000/svg">
          <Gold id={gid} />
          <path d="M16 18 L6 20 L9 40 L20 38 Z" fill={g} />
          <path d="M54 18 L64 20 L61 40 L50 38 Z" fill={g} />
          <path d="M20 14 H50 V36 a15 12 0 0 1 -30 0 Z" fill={g} />
          <ellipse cx="35" cy="15" rx="15" ry="2.8" fill="#fde68a" />
          <rect x="31" y="46" width="8" height="14" fill={g} />
          <polygon points="20,60 50,60 56,68 14,68" fill={g} />
          <rect x="18" y="68" width="34" height="8" rx="1" fill={D} />
        </svg>
      );
    case "supercup": // wide shallow goblet on a thin stem, no handles
      return (
        <svg viewBox="0 0 70 100" className={className} xmlns="http://www.w3.org/2000/svg">
          <Gold id={gid} />
          <path d="M10 16 Q35 44 60 16 Z" fill={g} />
          <ellipse cx="35" cy="16" rx="25" ry="3.5" fill="#fde68a" />
          <rect x="32" y="40" width="6" height="22" fill={g} />
          <path d="M20 70 Q35 60 50 70 L50 74 H20 Z" fill={g} />
          <rect x="22" y="74" width="26" height="6" rx="2" fill={D} />
        </svg>
      );
    case "globe": // FIFA Club World Cup — stylised globe on a stand
      return (
        <svg viewBox="0 0 64 100" className={className} xmlns="http://www.w3.org/2000/svg">
          <Gold id={gid} />
          <circle cx="32" cy="24" r="18" fill={g} />
          <ellipse cx="32" cy="24" rx="8" ry="18" stroke={D} strokeWidth="1.4" fill="none" />
          <line x1="14" y1="24" x2="50" y2="24" stroke={D} strokeWidth="1.4" />
          <line x1="18" y1="14" x2="46" y2="14" stroke={D} strokeWidth="1" />
          <line x1="18" y1="34" x2="46" y2="34" stroke={D} strokeWidth="1" />
          <circle cx="26" cy="18" r="3" fill="#fde68a" opacity="0.7" />
          <rect x="29" y="42" width="6" height="16" fill={g} />
          <rect x="22" y="58" width="20" height="5" rx="1.5" fill={g} />
          <rect x="25" y="63" width="14" height="8" rx="2" fill={D} />
        </svg>
      );
    case "laliga": // tall slender trophy with a ball finial
      return (
        <svg viewBox="0 0 54 104" className={className} xmlns="http://www.w3.org/2000/svg">
          <Gold id={gid} />
          <circle cx="27" cy="7" r="5" fill={g} />
          <rect x="25" y="12" width="4" height="6" fill={g} />
          <path d="M19 18 H35 L31 52 H23 Z" fill={g} />
          <ellipse cx="27" cy="19" rx="8" ry="2.2" fill="#fde68a" />
          <circle cx="27" cy="56" r="4" fill={g} />
          <rect x="25" y="60" width="4" height="16" fill={g} />
          <path d="M18 76 H36 L40 84 H14 Z" fill={g} />
          <rect x="17" y="84" width="20" height="7" rx="1.5" fill={D} />
        </svg>
      );
    case "copa": // large ornate cup with a DOMED LID + knob (distinct from UCL)
      return (
        <svg viewBox="0 0 64 106" className={className} xmlns="http://www.w3.org/2000/svg">
          <Gold id={gid} />
          <circle cx="32" cy="6" r="4" fill={g} />
          <path d="M15 15 Q32 -1 49 15 L47 19 H17 Z" fill={g} />
          <path d="M15 27 C2 29 4 48 19 46" stroke={g} strokeWidth="3.4" fill="none" strokeLinecap="round" />
          <path d="M49 27 C62 29 60 48 45 46" stroke={g} strokeWidth="3.4" fill="none" strokeLinecap="round" />
          <path d="M18 19 H46 V46 a14 16 0 0 1 -28 0 Z" fill={g} />
          <ellipse cx="32" cy="20" rx="14" ry="2.6" fill="#fde68a" />
          <rect x="29" y="60" width="6" height="14" fill={g} />
          <rect x="22" y="74" width="20" height="5" rx="1.5" fill={g} />
          <rect x="18" y="79" width="28" height="8" rx="2" fill={D} />
        </svg>
      );
    default: // supercopa — small two-handled cup with a domed lid + knob
      return (
        <svg viewBox="0 0 60 100" className={className} xmlns="http://www.w3.org/2000/svg">
          <Gold id={gid} />
          <circle cx="30" cy="10" r="3.5" fill={g} />
          <path d="M20 16 Q30 8 40 16 L39 20 H21 Z" fill={g} />
          <path d="M16 26 C7 26 7 40 18 42" stroke={g} strokeWidth="3" fill="none" strokeLinecap="round" />
          <path d="M44 26 C53 26 53 40 42 42" stroke={g} strokeWidth="3" fill="none" strokeLinecap="round" />
          <path d="M18 20 H42 V34 a12 13 0 0 1 -24 0 Z" fill={g} />
          <rect x="27" y="48" width="6" height="12" fill={g} />
          <rect x="20" y="60" width="20" height="5" rx="1.5" fill={g} />
          <rect x="23" y="65" width="14" height="8" rx="2" fill={D} />
        </svg>
      );
  }
}

// ── A single museum "display case" ──────────────────────────────────────────
function DisplayCase({ t, idx, accent }) {
  const a = ACCENTS[accent];
  const gid = "g" + t.name.replace(/\W/g, "");
  const [burst, setBurst] = useState(false);

  return (
    <div
      className="group relative"
      onMouseEnter={() => setBurst(true)}
      onAnimationEnd={() => setBurst(false)}
    >
      {/* glass display case */}
      <div className="relative flex h-full flex-col items-center overflow-hidden rounded-3xl border border-white/10
                      bg-gradient-to-b from-slate-800/60 via-slate-900/80 to-slate-950
                      px-5 pt-8 pb-6 shadow-[0_20px_50px_-20px_rgba(0,0,0,0.9)]
                      transition-all duration-500 hover:-translate-y-1.5 hover:border-white/25
                      hover:shadow-[0_30px_70px_-25px_rgba(0,0,0,0.95)]">
        {/* spotlight cone from the top of the case */}
        <div className="pointer-events-none absolute -top-10 left-1/2 h-44 w-44 -translate-x-1/2 rounded-full
                        bg-[radial-gradient(ellipse_at_top,_var(--c),_transparent_70%)] opacity-60
                        transition-opacity duration-500 group-hover:opacity-100"
             style={{ "--c": a.glow }} />
        {/* moving sheen on hover */}
        <div className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r
                        from-transparent via-white/10 to-transparent
                        transition-transform duration-700 ease-out group-hover:translate-x-full" />

        {/* count badge (top-right) */}
        <span className={`absolute right-3 top-3 rounded-full border px-2.5 py-0.5 text-[10px] font-black tabular-nums ${a.chip}`}>
          ×{t.count}
        </span>

        {/* confetti — fires on hover, tasteful */}
        {burst && (
          <div className="pointer-events-none absolute inset-x-0 top-0 h-full overflow-hidden">
            {CASE_CONFETTI.map((c, i) => (
              <span key={i} className="absolute top-2 rounded-[1px]"
                style={{ left: `${c.left}%`, width: c.size, height: c.size + 2, background: c.color,
                         animation: `caseFall ${c.dur}s ease-in ${c.delay}s forwards` }} />
            ))}
          </div>
        )}

        {/* the trophy, floating on a glass shelf */}
        <div className="relative z-10 flex flex-1 items-end">
          <div className="animate-[floatT_4.5s_ease-in-out_infinite] transition-transform duration-500 group-hover:scale-110"
               style={{ animationDelay: `${idx * 0.3}s` }}>
            <Trophy shape={t.shape} gid={gid}
              className="h-24 w-24 drop-shadow-[0_8px_18px_rgba(245,158,11,0.45)]"
            />
          </div>
        </div>

        {/* glass reflection shelf */}
        <div className="relative z-10 mt-2 w-full">
          <div className="mx-auto h-px w-2/3 bg-gradient-to-r from-transparent via-white/30 to-transparent" />
          <div className="mx-auto h-6 w-1/2 bg-gradient-to-b from-white/5 to-transparent blur-[2px]" />
        </div>

        {/* engraved plaque */}
        <div className="relative z-10 -mt-2 w-full text-center">
          <p className="text-[12px] font-black uppercase tracking-wide leading-tight text-slate-100">{t.name}</p>
          <div className="mx-auto my-2 h-px w-10 bg-amber-400/40" />
          <p className="text-[10px] leading-snug text-slate-400">{t.years}</p>
        </div>
      </div>

      {/* big translucent count behind the card name on hover */}
      <span className={`pointer-events-none absolute right-4 bottom-16 select-none text-6xl font-black tabular-nums opacity-0
                        transition-opacity duration-500 group-hover:opacity-10 ${a.text}`}>
        {t.count}
      </span>
    </div>
  );
}

function Section({ data }) {
  const a = ACCENTS[data.accent];
  const wins = data.items.reduce((s, t) => s + t.count, 0);
  return (
    <section className="mb-14">
      <div className="mb-7 flex items-center gap-4">
        <span className={`h-px flex-1 ${a.lineL}`} />
        <h2 className={`flex items-center gap-2.5 text-sm font-black uppercase tracking-[0.25em] ${a.soft}`}>
          {data.label}
          <span className={`rounded-full border px-2.5 py-0.5 text-[11px] tabular-nums ${a.chip}`}>{wins}</span>
        </h2>
        <span className={`h-px flex-1 ${a.lineR}`} />
      </div>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {data.items.map((t, i) => (
          <DisplayCase key={t.name} t={t} idx={i} accent={data.accent} />
        ))}
      </div>
    </section>
  );
}

// hero confetti
const CONFETTI = Array.from({ length: 26 }).map((_, i) => ({
  left: (i * 3.9 + (i % 3) * 7) % 100,
  delay: (i % 7) * 0.45,
  dur: 3 + (i % 5) * 0.5,
  color: ["#a50044", "#004d98", "#f59e0b", "#fcd34d", "#ffffff"][i % 5],
  size: 5 + (i % 3) * 2,
}));

// per-case confetti burst
const CASE_CONFETTI = Array.from({ length: 14 }).map((_, i) => ({
  left: 12 + (i * 6.1) % 76,
  delay: (i % 5) * 0.08,
  dur: 1.1 + (i % 4) * 0.25,
  color: ["#a50044", "#004d98", "#f59e0b", "#fcd34d", "#ffffff"][i % 5],
  size: 4 + (i % 3) * 2,
}));

const SPORT_ORDER = ["FOOTBALL", "BASKETBALL", "HANDBALL", "TENNIS"];

export default function TrophyRoom() {
  const [sport, setSport] = useState("FOOTBALL");
  const active = HONOURS_BY_SPORT[sport];
  const sections = active.sections;
  const { total, cabinets, european, domestic } = useMemo(() => {
    const all = sections.flatMap((s) => s.items);
    const sumWhere = (pred) => sections.filter(pred).flatMap((s) => s.items).reduce((s, t) => s + t.count, 0);
    return {
      total: all.reduce((s, t) => s + t.count, 0),
      cabinets: all.length,
      european: sumWhere((s) => /european|world|academy/i.test(s.label)),
      domestic: sumWhere((s) => /domestic/i.test(s.label)),
    };
  }, [sections]);

  return (
    <div className="fade-in min-h-screen bg-slate-950">
      <style>{`
        @keyframes floatT{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}
        @keyframes confettiFall{0%{transform:translateY(-20px) rotate(0);opacity:0}10%{opacity:1}100%{transform:translateY(260px) rotate(420deg);opacity:0}}
        @keyframes caseFall{0%{transform:translateY(-10px) rotate(0);opacity:0}15%{opacity:1}100%{transform:translateY(220px) rotate(360deg);opacity:0}}
        @keyframes shimmerText{0%,100%{background-position:0% 50%}50%{background-position:100% 50%}}
      `}</style>

      {/* ── Hero banner ────────────────────────────────────────────────────── */}
      <div className="relative mb-10 overflow-hidden rounded-3xl border border-amber-500/25
                      bg-gradient-to-br from-[#0a1a3f] via-slate-900 to-[#3b0a2a] p-8 sm:p-12 shadow-2xl">
        {/* ambient glows */}
        <div className="absolute -left-24 -top-24 h-72 w-72 rounded-full bg-[#004d98]/30 blur-3xl" />
        <div className="absolute -right-24 -bottom-24 h-72 w-72 rounded-full bg-[#a50044]/30 blur-3xl" />
        <div className="absolute left-1/2 top-0 h-64 w-64 -translate-x-1/2 rounded-full bg-amber-400/15 blur-3xl" />

        {/* spotlight cones */}
        <div className="absolute left-1/4 top-0 h-48 w-px rotate-12 bg-gradient-to-b from-amber-300/50 to-transparent" />
        <div className="absolute right-1/4 top-0 h-48 w-px -rotate-12 bg-gradient-to-b from-amber-300/50 to-transparent" />

        {/* confetti */}
        {CONFETTI.map((c, i) => (
          <span key={i} className="absolute top-0 rounded-[1px]"
            style={{ left: `${c.left}%`, width: c.size, height: c.size + 2, background: c.color,
                     animation: `confettiFall ${c.dur}s linear ${c.delay}s infinite` }} />
        ))}

        <div className="relative flex flex-col items-center text-center">
          {/* crest with glow */}
          <div className="relative mb-4">
            <div className="absolute inset-0 rounded-full bg-amber-400/40 blur-2xl" />
            <img src="https://crests.football-data.org/81.png" alt="FC Barcelona crest"
              className="relative h-20 w-20 drop-shadow-[0_4px_20px_rgba(245,158,11,0.5)] sm:h-24 sm:w-24" />
          </div>

          <p className="text-[11px] font-black uppercase tracking-[0.45em] text-amber-400/90">FC Barcelona</p>
          <h1 className="mt-2 bg-gradient-to-r from-amber-200 via-amber-400 to-amber-200 bg-[length:200%_auto] bg-clip-text
                         text-4xl font-black uppercase tracking-tight text-transparent drop-shadow-[0_2px_24px_rgba(245,158,11,0.35)]
                         sm:text-6xl"
              style={{ animation: "shimmerText 6s ease-in-out infinite" }}>
            Trophy Room
          </h1>
          <p className="mt-3 max-w-md text-sm text-slate-300">
            A century of glory — <span className="font-black text-amber-300">{total}</span> major honours,
            curated across {cabinets} historic competitions.
          </p>

          {/* headline stat strip */}
          <div className="mt-7 grid w-full max-w-2xl grid-cols-3 gap-3">
            {[
              { v: total, l: "Total Trophies", c: "text-amber-300" },
              { v: european, l: "European & World", c: "text-sky-300" },
              { v: domestic, l: "Domestic", c: "text-emerald-300" },
            ].map((s) => (
              <div key={s.l} className="rounded-2xl border border-white/10 bg-white/5 px-3 py-4 backdrop-blur-sm">
                <p className={`text-3xl font-black tabular-nums leading-none sm:text-4xl ${s.c}`}>{s.v}</p>
                <p className="mt-1.5 text-[9px] font-black uppercase tracking-widest text-slate-400 sm:text-[10px]">{s.l}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Sport selector ─────────────────────────────────────────────────── */}
      <div className="mb-8 flex flex-wrap justify-center gap-2.5">
        {SPORT_ORDER.map((s) => {
          const on = s === sport;
          const meta = HONOURS_BY_SPORT[s];
          return (
            <button key={s} onClick={() => setSport(s)}
              className={`flex items-center gap-2 rounded-2xl border px-5 py-2.5 text-[12px] font-black uppercase tracking-widest transition-all
                ${on ? "border-amber-400/50 bg-amber-400/10 text-amber-300 shadow-lg shadow-amber-500/10"
                     : "border-slate-800 bg-slate-900/40 text-slate-400 hover:border-slate-700 hover:text-slate-200"}`}>
              <span className="text-base">{meta.emoji}</span> {meta.label}
            </button>
          );
        })}
      </div>

      {/* ── Cabinets ───────────────────────────────────────────────────────── */}
      <div className="pb-12">
        {sections.map((s) => (
          <Section key={s.label} data={s} />
        ))}
      </div>
    </div>
  );
}
