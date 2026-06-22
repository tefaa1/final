// ─────────────────────────────────────────────────────────────────────────────
// SPORT CONFIG — single source of truth for how the Match Details page renders
// per sport. The details page is sport-aware: it derives the sport from a match's
// `sportType` and uses this table to decide which sections matter and how to label
// the score, the stats, the period breakdown, and the roster.
//
// Everything is graceful: if a sport isn't listed we fall back to a sensible
// generic shape so a handball / tennis / volleyball match still renders cleanly.
// ─────────────────────────────────────────────────────────────────────────────

export const SPORT_META = {
  FOOTBALL: {
    label: "Football",
    icon: "⚽",
    scoreUnit: "Goals",
    periodLabel: "Half",
    periods: ["1st Half", "2nd Half"],
    hasFormation: true,
    hasLineup: true,
    // Keys we try to surface out of match-analysis sportSpecificStats JSON.
    statKeys: [
      { key: "possession", label: "Possession", suffix: "%", bar: true },
      { key: "shotsOnTarget", label: "Shots on Target" },
      { key: "shots", label: "Total Shots" },
      { key: "corners", label: "Corners" },
      { key: "fouls", label: "Fouls" },
      { key: "offsides", label: "Offsides" },
      { key: "passes", label: "Passes" },
      { key: "passAccuracy", label: "Pass Accuracy", suffix: "%" },
    ],
    // Which event types are "scoring" events for this sport.
    scoringEvents: ["GOAL", "PENALTY_SCORED", "OWN_GOAL"],
  },
  BASKETBALL: {
    label: "Basketball",
    icon: "🏀",
    scoreUnit: "Points",
    periodLabel: "Quarter",
    periods: ["Q1", "Q2", "Q3", "Q4"],
    hasFormation: false,
    hasLineup: true,
    statKeys: [
      { key: "points", label: "Points" },
      { key: "fieldGoalPct", label: "Field Goal %", suffix: "%", bar: true },
      { key: "threePointPct", label: "3-Point %", suffix: "%", bar: true },
      { key: "freeThrowPct", label: "Free Throw %", suffix: "%", bar: true },
      { key: "rebounds", label: "Rebounds" },
      { key: "assists", label: "Assists" },
      { key: "steals", label: "Steals" },
      { key: "blocks", label: "Blocks" },
      { key: "turnovers", label: "Turnovers" },
      { key: "fouls", label: "Fouls" },
    ],
    scoringEvents: ["POINT", "TWO_POINTER", "THREE_POINTER", "FREE_THROW", "GOAL"],
  },
  HANDBALL: {
    label: "Handball",
    icon: "🤾",
    scoreUnit: "Goals",
    periodLabel: "Half",
    periods: ["1st Half", "2nd Half"],
    hasFormation: false,
    hasLineup: true,
    statKeys: [
      { key: "goals", label: "Goals" },
      { key: "shotEfficiency", label: "Shot Efficiency", suffix: "%", bar: true },
      { key: "saves", label: "Saves" },
      { key: "savePct", label: "Save %", suffix: "%", bar: true },
      { key: "assists", label: "Assists" },
      { key: "steals", label: "Steals" },
      { key: "turnovers", label: "Turnovers" },
      { key: "twoMinutes", label: "2-min Suspensions" },
    ],
    scoringEvents: ["GOAL", "PENALTY_SCORED"],
  },
  TENNIS: {
    label: "Tennis",
    icon: "🎾",
    scoreUnit: "Sets",
    periodLabel: "Set",
    periods: ["Set 1", "Set 2", "Set 3", "Set 4", "Set 5"],
    hasFormation: false,
    hasLineup: true,
    statKeys: [
      { key: "aces", label: "Aces" },
      { key: "doubleFaults", label: "Double Faults" },
      { key: "firstServePct", label: "1st Serve %", suffix: "%", bar: true },
      { key: "winners", label: "Winners" },
      { key: "unforcedErrors", label: "Unforced Errors" },
      { key: "breakPoints", label: "Break Points" },
    ],
    scoringEvents: ["SET_WON", "GAME_WON"],
  },
  VOLLEYBALL: {
    label: "Volleyball",
    icon: "🏐",
    scoreUnit: "Sets",
    periodLabel: "Set",
    periods: ["Set 1", "Set 2", "Set 3", "Set 4", "Set 5"],
    hasFormation: false,
    hasLineup: true,
    statKeys: [
      { key: "aces", label: "Aces" },
      { key: "blocks", label: "Blocks" },
      { key: "kills", label: "Kills" },
      { key: "digs", label: "Digs" },
      { key: "errors", label: "Errors" },
    ],
    scoringEvents: ["POINT", "ACE", "KILL"],
  },
};

export const GENERIC_SPORT = {
  label: "Match",
  icon: "🏟️",
  scoreUnit: "Score",
  periodLabel: "Period",
  periods: [],
  hasFormation: false,
  hasLineup: true,
  statKeys: [],
  scoringEvents: ["GOAL", "POINT"],
};

export function sportMeta(sportType) {
  const key = String(sportType || "").toUpperCase().trim();
  return SPORT_META[key] || GENERIC_SPORT;
}

// Parse a sportSpecificStats / playerRatings value that may be a JSON string,
// already-parsed object, or null. Always returns a plain object ({} on failure).
export function parseStatsJson(raw) {
  if (!raw) return {};
  if (typeof raw === "object") return raw;
  try {
    const v = JSON.parse(raw);
    return v && typeof v === "object" ? v : {};
  } catch {
    return {};
  }
}

// Pretty-print a possibly-camelCase stat key when we don't have a label for it.
export function humaniseKey(key) {
  return String(key || "")
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim();
}
