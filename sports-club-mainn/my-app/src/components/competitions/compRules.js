// ─────────────────────────────────────────────────────────────────────────────
// Format rules shown in the competition detail.
//   • Imported La Liga / Champions League → a short, correct summary.
//   • User-created comps → matched back to a preset by name when possible,
//     otherwise a generic but correct description from the detected format.
// ─────────────────────────────────────────────────────────────────────────────

import { PRESETS } from "./presets";
import { detectFormat } from "./store";

const LA_LIGA_RULES = [
  "Single league table — every club plays everyone home & away.",
  "3 pts for a win · 1 for a draw · 0 for a loss.",
  "Table sorted by Points, then Goal Difference, then Goals For.",
  "Champion = the club top of the final table.",
];

const CL_RULES = [
  "36 clubs in ONE league phase — each plays 8 different opponents.",
  "Top 8 advance straight to the Round of 16; 9th–24th enter a knockout play-off; 25th–36th are eliminated.",
  "Two-legged knockout ties decided on aggregate; the Final is a single match.",
  "3 pts for a win · 1 for a draw · 0 for a loss in the league phase.",
];

// Returns { title, rules: string[] } for a competition, or null if nothing useful.
export function getCompRules(competition) {
  if (!competition) return null;
  const name = (competition.name || "").toLowerCase();
  const fmt = detectFormat(competition);

  // Imported real competitions, matched by name.
  if (name.includes("champions") || (fmt === "CL" && name.includes("uefa"))) {
    return { title: "Champions League format", rules: CL_RULES };
  }
  if (name.includes("liga") || name.includes("primera")) {
    return { title: "La Liga format", rules: LA_LIGA_RULES };
  }

  // User-created: try to match a preset by name; fall back to format defaults.
  const preset = PRESETS.find(
    (p) => p.name.toLowerCase() === name || name.includes(p.name.toLowerCase())
  );
  if (preset?.rules?.length) {
    return { title: `${preset.name} format`, rules: preset.rules };
  }

  // Generic, correct description from the detected backend format.
  if (fmt === "CL") return { title: "Champions League format", rules: CL_RULES };

  const rounds = Number(competition.rounds) || 1;
  return {
    title: "League format",
    rules: [
      rounds >= 2
        ? "Double round-robin — every team plays everyone home & away."
        : "Single round-robin — every team plays everyone once.",
      "3 pts for a win · 1 for a draw · 0 for a loss.",
      "Table sorted by Points, then Goal Difference, then Goals For.",
      "Champion = the team top of the final table.",
    ],
  };
}
