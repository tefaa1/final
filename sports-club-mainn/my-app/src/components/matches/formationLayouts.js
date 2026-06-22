// Football formation layouts for the premium lineup builder.
// Each slot has a pitch coordinate (top/left as %) and a backend position enum.
// Coordinates are tuned for a vertical pitch where 100% top = our own goal line
// (goalkeeper) and 0% = the opponent's goal (strikers).
//
// `pos` values map onto the backend FB position enum so lineup rows persist with
// a sensible position. Backend also accepts coarse buckets (GOALKEEPER/DEFENDER/
// MIDFIELDER/FORWARD) — we send the specific one.

export const FORMATION_LAYOUTS = {
  "4-3-3": [
    { top: "88%", left: "50%", pos: "GOALKEEPER", label: "GK" },
    { top: "70%", left: "16%", pos: "LEFT_BACK", label: "LB" },
    { top: "72%", left: "38%", pos: "CENTER_BACK", label: "CB" },
    { top: "72%", left: "62%", pos: "CENTER_BACK", label: "CB" },
    { top: "70%", left: "84%", pos: "RIGHT_BACK", label: "RB" },
    { top: "50%", left: "28%", pos: "CENTRAL_MID", label: "CM" },
    { top: "52%", left: "50%", pos: "DEFENSIVE_MID", label: "CDM" },
    { top: "50%", left: "72%", pos: "CENTRAL_MID", label: "CM" },
    { top: "26%", left: "20%", pos: "LEFT_WING", label: "LW" },
    { top: "22%", left: "50%", pos: "STRIKER", label: "ST" },
    { top: "26%", left: "80%", pos: "RIGHT_WING", label: "RW" },
  ],
  "4-4-2": [
    { top: "88%", left: "50%", pos: "GOALKEEPER", label: "GK" },
    { top: "70%", left: "16%", pos: "LEFT_BACK", label: "LB" },
    { top: "72%", left: "38%", pos: "CENTER_BACK", label: "CB" },
    { top: "72%", left: "62%", pos: "CENTER_BACK", label: "CB" },
    { top: "70%", left: "84%", pos: "RIGHT_BACK", label: "RB" },
    { top: "48%", left: "16%", pos: "LEFT_WING", label: "LM" },
    { top: "50%", left: "40%", pos: "CENTRAL_MID", label: "CM" },
    { top: "50%", left: "60%", pos: "CENTRAL_MID", label: "CM" },
    { top: "48%", left: "84%", pos: "RIGHT_WING", label: "RM" },
    { top: "24%", left: "38%", pos: "STRIKER", label: "ST" },
    { top: "24%", left: "62%", pos: "STRIKER", label: "ST" },
  ],
  "3-5-2": [
    { top: "88%", left: "50%", pos: "GOALKEEPER", label: "GK" },
    { top: "72%", left: "28%", pos: "CENTER_BACK", label: "CB" },
    { top: "73%", left: "50%", pos: "CENTER_BACK", label: "CB" },
    { top: "72%", left: "72%", pos: "CENTER_BACK", label: "CB" },
    { top: "50%", left: "12%", pos: "LEFT_BACK", label: "LWB" },
    { top: "52%", left: "34%", pos: "CENTRAL_MID", label: "CM" },
    { top: "54%", left: "50%", pos: "DEFENSIVE_MID", label: "CDM" },
    { top: "52%", left: "66%", pos: "CENTRAL_MID", label: "CM" },
    { top: "50%", left: "88%", pos: "RIGHT_BACK", label: "RWB" },
    { top: "24%", left: "38%", pos: "STRIKER", label: "ST" },
    { top: "24%", left: "62%", pos: "STRIKER", label: "ST" },
  ],
  "4-2-3-1": [
    { top: "88%", left: "50%", pos: "GOALKEEPER", label: "GK" },
    { top: "70%", left: "16%", pos: "LEFT_BACK", label: "LB" },
    { top: "72%", left: "38%", pos: "CENTER_BACK", label: "CB" },
    { top: "72%", left: "62%", pos: "CENTER_BACK", label: "CB" },
    { top: "70%", left: "84%", pos: "RIGHT_BACK", label: "RB" },
    { top: "56%", left: "36%", pos: "DEFENSIVE_MID", label: "CDM" },
    { top: "56%", left: "64%", pos: "DEFENSIVE_MID", label: "CDM" },
    { top: "36%", left: "18%", pos: "LEFT_WING", label: "LW" },
    { top: "38%", left: "50%", pos: "ATTACKING_MID", label: "CAM" },
    { top: "36%", left: "82%", pos: "RIGHT_WING", label: "RW" },
    { top: "18%", left: "50%", pos: "STRIKER", label: "ST" },
  ],
  "4-1-2-3": [
    { top: "88%", left: "50%", pos: "GOALKEEPER", label: "GK" },
    { top: "70%", left: "16%", pos: "LEFT_BACK", label: "LB" },
    { top: "72%", left: "38%", pos: "CENTER_BACK", label: "CB" },
    { top: "72%", left: "62%", pos: "CENTER_BACK", label: "CB" },
    { top: "70%", left: "84%", pos: "RIGHT_BACK", label: "RB" },
    { top: "56%", left: "50%", pos: "DEFENSIVE_MID", label: "CDM" },
    { top: "44%", left: "32%", pos: "CENTRAL_MID", label: "CM" },
    { top: "44%", left: "68%", pos: "CENTRAL_MID", label: "CM" },
    { top: "24%", left: "20%", pos: "LEFT_WING", label: "LW" },
    { top: "20%", left: "50%", pos: "STRIKER", label: "ST" },
    { top: "24%", left: "80%", pos: "RIGHT_WING", label: "RW" },
  ],
  "5-3-2": [
    { top: "88%", left: "50%", pos: "GOALKEEPER", label: "GK" },
    { top: "68%", left: "12%", pos: "LEFT_BACK", label: "LWB" },
    { top: "72%", left: "32%", pos: "CENTER_BACK", label: "CB" },
    { top: "73%", left: "50%", pos: "CENTER_BACK", label: "CB" },
    { top: "72%", left: "68%", pos: "CENTER_BACK", label: "CB" },
    { top: "68%", left: "88%", pos: "RIGHT_BACK", label: "RWB" },
    { top: "46%", left: "30%", pos: "CENTRAL_MID", label: "CM" },
    { top: "48%", left: "50%", pos: "DEFENSIVE_MID", label: "CDM" },
    { top: "46%", left: "70%", pos: "CENTRAL_MID", label: "CM" },
    { top: "22%", left: "38%", pos: "STRIKER", label: "ST" },
    { top: "22%", left: "62%", pos: "STRIKER", label: "ST" },
  ],
  "3-4-3": [
    { top: "88%", left: "50%", pos: "GOALKEEPER", label: "GK" },
    { top: "72%", left: "28%", pos: "CENTER_BACK", label: "CB" },
    { top: "73%", left: "50%", pos: "CENTER_BACK", label: "CB" },
    { top: "72%", left: "72%", pos: "CENTER_BACK", label: "CB" },
    { top: "50%", left: "14%", pos: "LEFT_WING", label: "LM" },
    { top: "52%", left: "40%", pos: "CENTRAL_MID", label: "CM" },
    { top: "52%", left: "60%", pos: "CENTRAL_MID", label: "CM" },
    { top: "50%", left: "86%", pos: "RIGHT_WING", label: "RM" },
    { top: "24%", left: "22%", pos: "LEFT_WING", label: "LW" },
    { top: "20%", left: "50%", pos: "STRIKER", label: "ST" },
    { top: "24%", left: "78%", pos: "RIGHT_WING", label: "RW" },
  ],
  "4-5-1": [
    { top: "88%", left: "50%", pos: "GOALKEEPER", label: "GK" },
    { top: "70%", left: "16%", pos: "LEFT_BACK", label: "LB" },
    { top: "72%", left: "38%", pos: "CENTER_BACK", label: "CB" },
    { top: "72%", left: "62%", pos: "CENTER_BACK", label: "CB" },
    { top: "70%", left: "84%", pos: "RIGHT_BACK", label: "RB" },
    { top: "48%", left: "14%", pos: "LEFT_WING", label: "LM" },
    { top: "50%", left: "34%", pos: "CENTRAL_MID", label: "CM" },
    { top: "52%", left: "50%", pos: "DEFENSIVE_MID", label: "CDM" },
    { top: "50%", left: "66%", pos: "CENTRAL_MID", label: "CM" },
    { top: "48%", left: "86%", pos: "RIGHT_WING", label: "RM" },
    { top: "22%", left: "50%", pos: "STRIKER", label: "ST" },
  ],
};

// Canonical, de-duplicated list of the formations we offer in pickers. Object
// keys are already unique, but we run them through dedupeFormations so the same
// guarantee holds anywhere a list is built up from mixed sources (static names +
// DB-saved formation rows, which CAN contain repeats like several "4-3-3").
export const FORMATION_NAMES = dedupeFormations(Object.keys(FORMATION_LAYOUTS));

// Normalise a formation label for comparison: "4-3-3 ", "4 - 3 - 3" → "4-3-3".
export function normaliseFormation(name) {
  return String(name || "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "")
    .replace(/[–—]/g, "-"); // unify dash variants
}

// Return a list of UNIQUE formation labels, preserving first-seen order and the
// original (pretty) casing/spacing. Accepts plain strings or objects with a
// `.formation` / `.name` field (e.g. DB match-formation rows). Anything blank is
// dropped. Use this everywhere formations are offered so the picker never shows
// the same formation twice.
export function dedupeFormations(list) {
  const seen = new Set();
  const out = [];
  (Array.isArray(list) ? list : []).forEach((item) => {
    const label = typeof item === "string" ? item : (item?.formation ?? item?.name ?? "");
    const key = normaliseFormation(label);
    if (!key || seen.has(key)) return;
    seen.add(key);
    out.push(typeof item === "string" ? label : item);
  });
  return out;
}

// ─────────────────────────────────────────────────────────────────────────────
// AUTO-FILL A STARTING XI
//
// Given a formation's `slots` and the available `squad`, pick a sensible player
// for every slot: the GK slot gets a goalkeeper, defensive slots get defenders,
// etc., matched by each player's `preferredPosition`. We score every player
// against every slot (exact position match > same line/bucket > anything) and
// greedily fill the most-constrained slots first so scarce specialists (the GK)
// don't get used up by a looser slot. Returns { [slotIndex]: playerId }.
// ─────────────────────────────────────────────────────────────────────────────

// Coarse line bucket for a specific position enum.
const POS_BUCKET = {
  GOALKEEPER: "GK",
  LEFT_BACK: "DEF", RIGHT_BACK: "DEF", CENTER_BACK: "DEF",
  DEFENSIVE_MID: "MID", CENTRAL_MID: "MID", ATTACKING_MID: "MID",
  LEFT_WING: "ATT", RIGHT_WING: "ATT", STRIKER: "ATT",
};

function bucketOf(pos) { return POS_BUCKET[String(pos || "").toUpperCase().trim()] || "MID"; }

// Score how well a player fits a slot. Higher = better.
function fitScore(slotPos, playerPos) {
  const sp = String(slotPos || "").toUpperCase().trim();
  const pp = String(playerPos || "").toUpperCase().trim();
  if (!pp) return 0;
  if (sp && sp === pp) return 100;                 // exact position
  if (bucketOf(sp) === bucketOf(pp)) return 50;    // same line (DEF/MID/ATT/GK)
  // Keepers must never auto-fill an outfield slot (and vice-versa).
  if (bucketOf(sp) === "GK" || bucketOf(pp) === "GK") return -1000;
  return 10;                                       // outfield filler
}

export function autoFillLineup(slots = [], squad = []) {
  const assignments = {};
  const usedPlayers = new Set();
  // Order slots so the most constrained (GK, then by how few good fits exist)
  // get first pick. Simplest robust heuristic: GK first, then the rest in order.
  const order = slots
    .map((s, i) => ({ i, isGk: bucketOf(s.pos) === "GK" }))
    .sort((a, b) => (a.isGk === b.isGk ? a.i - b.i : a.isGk ? -1 : 1));

  for (const { i } of order) {
    const slot = slots[i];
    let best = null, bestScore = -Infinity;
    for (const p of squad) {
      if (usedPlayers.has(p.id)) continue;
      const score = fitScore(slot.pos, p.preferredPosition);
      if (score > bestScore) { bestScore = score; best = p; }
    }
    // Don't drop a keeper into an outfield slot (or an outfielder in goal) just
    // to fill it — leave it empty rather than make a nonsense pick.
    if (best && bestScore > -1000) { assignments[i] = best.id; usedPlayers.add(best.id); }
  }
  return assignments;
}

// Sport-specific defaults — non-football sports use a single generic layout so
// the builder still works (players sit in a row of slots).
export const SPORT_PLAYERS_ON_PITCH = { FOOTBALL: 11, BASKETBALL: 5, HANDBALL: 7, TENNIS: 2 };

// Generic (non-football) layouts: evenly spread slots, no real tactical pitch.
export function genericLayout(count) {
  const slots = [];
  const perRow = count <= 5 ? count : Math.ceil(count / 2);
  const rows = Math.ceil(count / perRow);
  for (let i = 0; i < count; i++) {
    const row = Math.floor(i / perRow);
    const col = i % perRow;
    const inRow = Math.min(perRow, count - row * perRow);
    const top = `${20 + (row * 60) / Math.max(1, rows - 1 || 1)}%`;
    const left = `${(100 / (inRow + 1)) * (col + 1)}%`;
    slots.push({ top, left, pos: undefined, label: `#${i + 1}` });
  }
  return slots;
}
