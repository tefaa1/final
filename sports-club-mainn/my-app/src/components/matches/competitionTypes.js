// ─────────────────────────────────────────────────────────────────────────────
// COMPETITION TYPES — single source of truth for "what kind of competition is
// this match in, and what rules does that imply?"
//
// A competition is either:
//   • LEAGUE   → a draw is a valid final result. No extra time / penalties.
//   • KNOCKOUT → a winner is required. If level at full time the match goes to
//                EXTRA TIME and then a PENALTY SHOOTOUT.
//
// User-created competitions come from api.competitions.list() and carry an
// explicit `type` (LEAGUE | KNOCKOUT) plus a name/season/sport. Alongside those
// we offer the well-known STANDARD competitions every Barça season includes
// (La Liga, Champions League, Copa del Rey, …) so a match can always be filed
// even before any custom competition has been created. Each standard name has a
// known type, so the live flow adapts the same way for both.
// ─────────────────────────────────────────────────────────────────────────────

export const COMPETITION_KIND = { LEAGUE: "LEAGUE", KNOCKOUT: "KNOCKOUT" };

// Standard, real competitions grouped by sport. `type` mirrors how the
// Competitions module classifies them (see competitions/presets.js).
export const STANDARD_COMPETITIONS = {
  FOOTBALL: [
    { name: "La Liga", type: "LEAGUE" },
    { name: "UEFA Champions League", type: "KNOCKOUT" },
    { name: "UEFA Europa League", type: "KNOCKOUT" },
    { name: "Supercopa de España", type: "KNOCKOUT" },
    { name: "FIFA Club World Cup", type: "KNOCKOUT" },
    { name: "Friendly Match", type: "LEAGUE" },
  ],
  BASKETBALL: [
    { name: "Liga ACB", type: "LEAGUE" },
    { name: "EuroLeague", type: "KNOCKOUT" },
    { name: "Friendly Match", type: "LEAGUE" },
  ],
  HANDBALL: [
    { name: "Liga ASOBAL", type: "LEAGUE" },
    { name: "EHF Champions League", type: "KNOCKOUT" },
    { name: "Friendly Match", type: "LEAGUE" },
  ],
  TENNIS: [
    { name: "ATP Tour", type: "KNOCKOUT" },
    { name: "Grand Slam", type: "KNOCKOUT" },
    { name: "Exhibition Match", type: "LEAGUE" },
  ],
};

// Word/phrase fallbacks: classify a free-text competition name when we have no
// explicit type for it (e.g. a legacy match whose competition isn't in either
// list). Cup/knockout-flavoured words → KNOCKOUT; everything else → LEAGUE.
const KNOCKOUT_HINTS = [
  "cup", "copa", "coupe", "pokal", "knockout", "knock-out", "playoff",
  "play-off", "final", "champions league", "europa", "euroleague",
  "supercopa", "super cup", "supercup", "grand slam", "trophy", "trofeo",
];

const norm = (s) => String(s || "").trim().toLowerCase();

// Flatten the standard table into a name→type lookup (last sport wins on dupes,
// which is fine because dupes like "Friendly Match" share the same intent).
const STANDARD_BY_NAME = (() => {
  const map = new Map();
  Object.values(STANDARD_COMPETITIONS).flat().forEach((c) => map.set(norm(c.name), c.type));
  return map;
})();

// Normalise an arbitrary `type` value to one of the two kinds.
export function normaliseKind(type) {
  const t = norm(type);
  if (t === "knockout" || t === "cup" || t === "playoff" || t === "elimination") return COMPETITION_KIND.KNOCKOUT;
  if (t === "league" || t === "round_robin" || t === "round-robin") return COMPETITION_KIND.LEAGUE;
  return null;
}

// The standard competitions for a given sport (FOOTBALL default).
export function standardCompetitionsForSport(sportType) {
  const key = String(sportType || "FOOTBALL").toUpperCase();
  return STANDARD_COMPETITIONS[key] || STANDARD_COMPETITIONS.FOOTBALL;
}

// Resolve a competition's kind from, in priority order:
//   1. an explicit option object { type } (custom or standard)
//   2. the standard table (matched by name)
//   3. word hints in the free-text name
//   4. default LEAGUE (draws allowed) — the safe, least-surprising default.
export function resolveCompetitionKind(option, name) {
  const explicit = normaliseKind(option?.type);
  if (explicit) return explicit;

  const n = norm(name ?? option?.name);
  if (STANDARD_BY_NAME.has(n)) return STANDARD_BY_NAME.get(n);

  if (KNOCKOUT_HINTS.some((h) => n.includes(h))) return COMPETITION_KIND.KNOCKOUT;
  return COMPETITION_KIND.LEAGUE;
}

export const isKnockout = (kind) => normaliseKind(kind) === COMPETITION_KIND.KNOCKOUT;

// Pull the sport out of a custom competition row (the API is inconsistent about
// the field name and may omit it entirely).
export function competitionSport(c) {
  const raw = c?.sportType || c?.sport || "";
  return raw ? String(raw).toUpperCase() : null;
}

// Build a unified, de-duplicated competition option list for a sport:
//   • user-created competitions for that sport (carry id + type), then
//   • standard competitions for that sport that aren't already covered.
// Each option: { value, name, type, kind, custom, id?, season? }.
export function buildCompetitionOptions(customList, sportType) {
  const sport = String(sportType || "FOOTBALL").toUpperCase();
  const seen = new Set();
  const out = [];

  (Array.isArray(customList) ? customList : []).forEach((c) => {
    const cs = competitionSport(c);
    // Keep competitions whose sport matches, or that have no sport recorded.
    if (cs && cs !== sport) return;
    const name = c?.name;
    if (!name || seen.has(norm(name))) return;
    seen.add(norm(name));
    const kind = resolveCompetitionKind(c, name);
    out.push({ value: name, name, type: kind, kind, custom: true, id: c.id, season: c.season });
  });

  standardCompetitionsForSport(sport).forEach((c) => {
    if (seen.has(norm(c.name))) return;
    seen.add(norm(c.name));
    out.push({ value: c.name, name: c.name, type: c.type, kind: c.type, custom: false });
  });

  return out;
}
