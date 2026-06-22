"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { FiChevronDown, FiCheck, FiSearch } from "react-icons/fi";

// A reliable, premium dark combobox that REPLACES the buggy native <datalist>.
// - Opens every time (no "opens once" bug).
// - Full-width, clean dark styling, readable options.
// - Optional crest image per option.
// - Searchable; allows a CUSTOM free-text value (allowCustom) so you can type a
//   club/venue that isn't in the list.
//
// Props:
//   value:        current text value (controlled)
//   onChange(val, option?):  called with the chosen/typed value (and the option if picked)
//   options:      [{ value, label?, crest? }]   (label defaults to value)
//   placeholder:  input placeholder
//   allowCustom:  keep typed text even if it doesn't match an option (default true)
//   icon:         optional leading node
//   emptyHint:    text shown when no options match
//   fallbackIcon: emoji/text shown in the icon slot when an option has no crest
//                 (default "🛡️"); venue pickers pass "🏟️" so stadiums never wear
//                 a club shield.
export default function Combobox({
  value = "",
  onChange,
  options = [],
  placeholder = "Select…",
  allowCustom = true,
  emptyHint = "No matches — your typed value will be used.",
  className = "",
  fallbackIcon = "🛡️",
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIdx, setActiveIdx] = useState(-1);
  const rootRef = useRef(null);
  const listRef = useRef(null);

  // Close on outside click.
  useEffect(() => {
    const onDoc = (e) => { if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  // When opening, seed the search with nothing (show all) but keep current value visible.
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter(o => String(o.label ?? o.value).toLowerCase().includes(q));
  }, [query, options]);

  const choose = (opt) => {
    onChange?.(opt.value, opt);
    setOpen(false);
    setQuery("");
    setActiveIdx(-1);
  };

  const onKeyDown = (e) => {
    if (!open && (e.key === "ArrowDown" || e.key === "Enter")) { setOpen(true); return; }
    if (e.key === "ArrowDown") { e.preventDefault(); setActiveIdx(i => Math.min(i + 1, filtered.length - 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setActiveIdx(i => Math.max(i - 1, 0)); }
    else if (e.key === "Enter") {
      e.preventDefault();
      if (activeIdx >= 0 && filtered[activeIdx]) choose(filtered[activeIdx]);
      else if (allowCustom && query.trim()) { onChange?.(query.trim()); setOpen(false); setQuery(""); }
    } else if (e.key === "Escape") { setOpen(false); }
  };

  const selectedOption = options.find(o => String(o.value) === String(value));
  const display = value || "";

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      {/* trigger / display */}
      <button
        type="button"
        onClick={() => { setOpen(o => !o); setQuery(""); setActiveIdx(-1); }}
        className="w-full flex items-center gap-2.5 bg-slate-900/60 border border-slate-800 hover:border-slate-700 focus:border-emerald-500 rounded-xl px-3.5 py-3 text-sm text-left outline-none transition-all"
      >
        {selectedOption?.crest
          ? <img src={selectedOption.crest} alt="" className="w-6 h-6 object-contain shrink-0" onError={(e) => { e.currentTarget.style.display = "none"; }} />
          : null}
        <span className={`flex-1 truncate ${display ? "text-slate-200" : "text-slate-600"}`}>{display || placeholder}</span>
        <FiChevronDown className={`text-slate-500 shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute z-50 mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 shadow-2xl shadow-black/50 overflow-hidden">
          {/* search */}
          <div className="flex items-center gap-2 px-3 py-2.5 border-b border-slate-800 bg-slate-900/60">
            <FiSearch className="text-slate-500 shrink-0" size={14} />
            <input
              autoFocus
              value={query}
              onChange={(e) => { setQuery(e.target.value); setActiveIdx(0); }}
              onKeyDown={onKeyDown}
              placeholder="Type to search or add…"
              className="flex-1 bg-transparent text-sm text-slate-200 placeholder:text-slate-600 outline-none"
            />
          </div>
          {/* options */}
          <ul ref={listRef} className="max-h-64 overflow-y-auto custom-scrollbar py-1">
            {filtered.length === 0 ? (
              <li className="px-3.5 py-3 text-[12px] text-slate-500">{emptyHint}</li>
            ) : (
              filtered.map((o, i) => {
                const label = o.label ?? o.value;
                const isSel = String(o.value) === String(value);
                const isActive = i === activeIdx;
                return (
                  <li key={`${o.value}-${i}`}>
                    <button
                      type="button"
                      onMouseEnter={() => setActiveIdx(i)}
                      onClick={() => choose(o)}
                      className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 text-left text-sm transition-colors ${isActive ? "bg-emerald-500/10" : ""} ${isSel ? "text-emerald-300" : "text-slate-200"} hover:bg-emerald-500/10`}
                    >
                      {o.crest
                        ? <img src={o.crest} alt="" className="w-6 h-6 object-contain shrink-0" onError={(e) => { e.currentTarget.style.display = "none"; }} />
                        : <span className="w-6 h-6 shrink-0 flex items-center justify-center text-base">{fallbackIcon}</span>}
                      <span className="flex-1 truncate">{label}</span>
                      {isSel && <FiCheck className="text-emerald-400 shrink-0" size={15} />}
                    </button>
                  </li>
                );
              })
            )}
            {/* explicit "use my typed text" affordance */}
            {allowCustom && query.trim() && !filtered.some(o => String(o.label ?? o.value).toLowerCase() === query.trim().toLowerCase()) && (
              <li className="border-t border-slate-800">
                <button type="button" onClick={() => { onChange?.(query.trim()); setOpen(false); setQuery(""); }}
                  className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-left text-sm text-sky-300 hover:bg-sky-500/10 transition-colors">
                  <span className="w-6 h-6 shrink-0 flex items-center justify-center">＋</span>
                  <span className="flex-1 truncate">Use “{query.trim()}”</span>
                </button>
              </li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}

// A generous list of real European stadiums for the venue picker. The combobox
// still allows a custom entry, so any other venue can be typed.
export const EUROPEAN_STADIUMS = [
  "Spotify Camp Nou",
  "Estadi Olímpic Lluís Companys",
  "Johan Cruyff Stadium",
  "Santiago Bernabéu",
  "Cívitas Metropolitano",
  "Mestalla",
  "San Mamés",
  "Reale Arena (Anoeta)",
  "Benito Villamarín",
  "Ramón Sánchez-Pizjuán",
  "Estadio de la Cerámica",
  "Coliseum (Getafe)",
  "El Sadar",
  "Estadio de Vallecas",
  "Estadi Montilivi",
  "RCDE Stadium",
  "Abanca-Balaídos",
  "Estadio Martínez Valero",
  "Estadio Nuevo Mirandilla",
  "Riazor",
  "Old Trafford",
  "Anfield",
  "Emirates Stadium",
  "Etihad Stadium",
  "Stamford Bridge",
  "Tottenham Hotspur Stadium",
  "St James' Park",
  "Villa Park",
  "Goodison Park",
  "London Stadium",
  "Allianz Arena",
  "Signal Iduna Park",
  "Veltins-Arena",
  "Red Bull Arena (Leipzig)",
  "Deutsche Bank Park",
  "BayArena",
  "Mercedes-Benz Arena (Stuttgart)",
  "Volksparkstadion",
  "San Siro (Giuseppe Meazza)",
  "Allianz Stadium (Juventus)",
  "Stadio Olimpico",
  "Stadio Diego Armando Maradona",
  "Stadio Artemio Franchi",
  "Gewiss Stadium",
  "Parc des Princes",
  "Groupama Stadium",
  "Orange Vélodrome",
  "Stade Louis II",
  "Estádio da Luz",
  "Estádio do Dragão",
  "Estádio José Alvalade",
  "Johan Cruyff Arena",
  "Philips Stadion",
  "De Kuip",
  "Jan Breydel Stadium",
  "King Power at Den Dreef",
  "Celtic Park",
  "Ibrox Stadium",
  "Aviva Stadium",
  "Wembley Stadium",
  "Puskás Aréna",
  "Atatürk Olympic Stadium",
  "Türk Telekom Stadium",
  "Krestovsky Stadium",
  "Stade de France",
  "Estádio do Sport Lisboa e Benfica",
];

// ── Per-stadium crests ───────────────────────────────────────────────────────
// Previously the venue picker showed the SAME shield for every stadium. We now
// give each well-known ground a DISTINCT badge — the resident club's real crest
// (football-data.org CDN). Stadiums we can't map reliably get no image and fall
// back to a neutral stadium icon (🏟️) — never a repeated club logo.
const FD = (id) => `https://crests.football-data.org/${id}.png`;
export const STADIUM_CRESTS = {
  "Spotify Camp Nou": FD(81),
  "Estadi Olímpic Lluís Companys": FD(81),
  "Johan Cruyff Stadium": FD(81),
  "Santiago Bernabéu": FD(86),
  "Cívitas Metropolitano": FD(78),
  "Mestalla": FD(95),
  "San Mamés": FD(77),
  "Reale Arena (Anoeta)": FD(92),
  "Benito Villamarín": FD(90),
  "Ramón Sánchez-Pizjuán": FD(559),
  "Estadio de la Cerámica": FD(94),
  "Coliseum (Getafe)": FD(82),
  "El Sadar": FD(79),
  "Estadio de Vallecas": FD(87),
  "Estadi Montilivi": FD(298),
  "RCDE Stadium": FD(80),
  "Abanca-Balaídos": FD(558),
  "Estadio Martínez Valero": FD(285),
  "Estadio Nuevo Mirandilla": FD(264),
  "Riazor": FD(560),
  "Old Trafford": FD(66),
  "Anfield": FD(64),
  "Emirates Stadium": FD(57),
  "Etihad Stadium": FD(65),
  "Stamford Bridge": FD(61),
  "Tottenham Hotspur Stadium": FD(73),
  "St James' Park": FD(67),
  "Villa Park": FD(58),
  "Goodison Park": FD(62),
  "London Stadium": FD(563),
  "Allianz Arena": FD(5),
  "Signal Iduna Park": FD(4),
  "Veltins-Arena": FD(6),
  "Red Bull Arena (Leipzig)": FD(721),
  "Deutsche Bank Park": FD(19),
  "BayArena": FD(3),
  "Mercedes-Benz Arena (Stuttgart)": FD(10),
  "Volksparkstadion": FD(7),
  "San Siro (Giuseppe Meazza)": FD(98),
  "Allianz Stadium (Juventus)": FD(109),
  "Stadio Olimpico": FD(100),
  "Stadio Diego Armando Maradona": FD(113),
  "Stadio Artemio Franchi": FD(99),
  "Gewiss Stadium": FD(102),
  "Parc des Princes": FD(524),
  "Groupama Stadium": FD(523),
  "Orange Vélodrome": FD(516),
  "Stade Louis II": FD(548),
  "Estádio da Luz": FD(1903),
  "Estádio do Dragão": FD(503),
  "Estádio José Alvalade": FD(498),
  "Johan Cruyff Arena": FD(678),
  "Philips Stadion": FD(674),
  "De Kuip": FD(675),
  "Estádio do Sport Lisboa e Benfica": FD(1903),
};

// Build venue options for the Combobox: attaches a DISTINCT crest where we know
// the resident club, otherwise leaves it blank (neutral stadium icon). Pass any
// extra venue names (e.g. venues already on existing matches) to merge in.
export function buildVenueOptions(extra = []) {
  const set = new Set([...EUROPEAN_STADIUMS, ...extra.filter(Boolean)]);
  return [...set]
    .sort((a, b) => a.localeCompare(b))
    .map((v) => ({ value: v, label: v, crest: STADIUM_CRESTS[v] || "" }));
}
