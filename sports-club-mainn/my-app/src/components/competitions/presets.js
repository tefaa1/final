// ─────────────────────────────────────────────────────────────────────────────
// COMPETITION PRESETS — the 2 real FOOTBALL formats the competitions module models.
// ─────────────────────────────────────────────────────────────────────────────
//
// Competitions are FOOTBALL ONLY. There are exactly TWO presets:
//   • Primera División (La Liga) — 20-club double round-robin league
//   • UEFA Champions League      — 36-club single league phase, then knockout
//
// Each preset is a self-contained description of a REAL competition: its backend
// `type` (LEAGUE | KNOCKOUT), the exact team count, the eligible team pool (real
// clubs, real crests), and a `format` descriptor the create flow uses to generate
// the right fixtures after the competition row is created.
//
// football-data crest CDN: https://crests.football-data.org/{ID}.png
//
// IMPORTANT — the backend mangles non-ASCII `crest` emoji to "?" on the way in,
// so we NEVER trust the stored `crest`. For football we always render `crestUrl`
// (the real badge) and fall back to a ⚽ emoji only when a badge fails to load.
// ─────────────────────────────────────────────────────────────────────────────

const FD = (id) => `https://crests.football-data.org/${id}.png`;

// Build a football eligible-team entry in API shape.
const fb = (name, short, fdId) => ({
  name,
  shortName: short,
  crestUrl: FD(fdId),
  crest: "⚽",
  sport: "Football",
});

// ── Eligible pools ───────────────────────────────────────────────────────────

// La Liga / Primera División — the 20 real clubs.
export const LA_LIGA_TEAMS = [
  fb("FC Barcelona", "BAR", 81),
  fb("Real Madrid", "RMA", 86),
  fb("Atlético de Madrid", "ATM", 78),
  fb("Athletic Club", "ATH", 77),
  fb("Villarreal CF", "VIL", 94),
  fb("Real Betis", "BET", 90),
  fb("Celta de Vigo", "CEL", 558),
  fb("Real Sociedad", "RSO", 92),
  fb("Sevilla FC", "SEV", 559),
  fb("Valencia CF", "VAL", 95),
  fb("CA Osasuna", "OSA", 79),
  fb("Getafe CF", "GET", 82),
  fb("Girona FC", "GIR", 298),
  fb("Rayo Vallecano", "RAY", 87),
  fb("RCD Espanyol", "ESP", 80),
  fb("RCD Mallorca", "MLL", 89),
  fb("UD Las Palmas", "LPA", 275),
  fb("CD Leganés", "LEG", 745),
  fb("Real Valladolid", "VLD", 250),
  fb("Deportivo Alavés", "ALA", 263),
];

// UEFA Champions League pool — a COMPREHENSIVE pool of real European clubs from
// across the continent (~45). The create flow picks 36 of these for a season.
// EVERY entry carries a verified football-data crest id so no badge is missing.
export const CHAMPIONS_LEAGUE_TEAMS = [
  // ── Spain ──
  fb("Real Madrid", "RMA", 86),
  fb("FC Barcelona", "BAR", 81),
  fb("Atlético de Madrid", "ATM", 78),
  fb("Athletic Club", "ATH", 77),
  fb("Girona FC", "GIR", 298),
  // ── England ──
  fb("Manchester City", "MCI", 65),
  fb("Liverpool FC", "LIV", 64),
  fb("Arsenal FC", "ARS", 57),
  fb("Aston Villa", "AVL", 58),
  fb("Chelsea FC", "CHE", 61),
  fb("Tottenham Hotspur", "TOT", 73),
  fb("Newcastle United", "NEW", 67),
  // ── Germany ──
  fb("Bayern München", "BAY", 5),
  fb("Borussia Dortmund", "DOR", 4),
  fb("RB Leipzig", "RBL", 721),
  fb("Bayer Leverkusen", "B04", 3),
  fb("VfB Stuttgart", "STU", 10),
  fb("Eintracht Frankfurt", "SGE", 19),
  // ── France ──
  fb("Paris Saint-Germain", "PSG", 524),
  fb("AS Monaco", "MON", 548),
  fb("Olympique de Marseille", "OM", 516),
  fb("Stade Brestois 29", "BRE", 512),
  fb("LOSC Lille", "LIL", 521),
  // ── Italy ──
  fb("Inter Milan", "INT", 108),
  fb("AC Milan", "MIL", 98),
  fb("Juventus FC", "JUV", 109),
  fb("Atalanta BC", "ATA", 102),
  fb("SSC Napoli", "NAP", 113),
  fb("AS Roma", "ROM", 100),
  fb("Bologna FC", "BOL", 103),
  // ── Portugal ──
  fb("SL Benfica", "BEN", 1903),
  fb("Sporting CP", "SPO", 498),
  fb("FC Porto", "POR", 503),
  // ── Netherlands ──
  fb("Feyenoord", "FEY", 675),
  fb("PSV Eindhoven", "PSV", 674),
  fb("AFC Ajax", "AJA", 678),
  // ── Belgium ──
  fb("Club Brugge", "CLB", 851),
  fb("Royale Union SG", "USG", 1393),
  // ── Scotland ──
  fb("Celtic FC", "CEL", 732),
  // ── Rest of Europe ──
  fb("Shakhtar Donetsk", "SHK", 8004),
  fb("FK Crvena Zvezda", "CZV", 7283),
  fb("BSC Young Boys", "YB", 1871),
  fb("Sparta Praha", "SPP", 907),
  fb("Sturm Graz", "STG", 2021),
  fb("Slovan Bratislava", "SLB", 7321),
  fb("Dinamo Zagreb", "DZG", 755),
  fb("PAOK", "PAO", 7268),
];

// ── Preset definitions ───────────────────────────────────────────────────────
//
// format.kind drives fixture generation in the create flow:
//   "ROUND_ROBIN"  → backend auto-generates (we just pass type:LEAGUE + rounds)
//   "CL_LEAGUE"    → we generate the 8-match-per-team league phase, POST in bulk

export const PRESETS = [
  {
    id: "laliga",
    name: "La Liga",
    subtitle: "Spanish top flight (Primera División)",
    sport: "Football",
    type: "LEAGUE",
    accent: "emerald",
    crestUrl: "https://crests.football-data.org/PD.png",
    teamCount: 20,
    fixedRoster: true, // must use all eligible teams
    eligible: LA_LIGA_TEAMS,
    points: "3 / 1 / 0",
    format: {
      kind: "ROUND_ROBIN",
      rounds: 2, // double round-robin → 38 games each
      label: "Double round-robin · 38 matchdays",
      matchesPerTeam: 38,
    },
    rules: [
      "20 clubs, everyone plays everyone home & away (38 games)",
      "3 pts win · 1 draw · 0 loss — table sorted Pts → GD → GF",
      "Champion = top of the final table",
    ],
  },
  {
    id: "ucl",
    name: "UEFA Champions League",
    subtitle: "New format · single league phase",
    sport: "Football",
    type: "KNOCKOUT",
    accent: "blue",
    crestUrl: "https://crests.football-data.org/CL.png",
    teamCount: 36,
    fixedRoster: false, // user picks the 36 participants from the European pool
    eligible: CHAMPIONS_LEAGUE_TEAMS,
    points: "3 / 1 / 0",
    format: {
      kind: "CL_LEAGUE",
      matchesPerTeam: 8,
      label: "League phase · 8 games each, then knockout",
    },
    rules: [
      "36 clubs in ONE league, each plays 8 different opponents",
      "Top 8 → Round of 16 · 9–24 → knockout play-off · 25–36 out",
      "Two-legged knockout from the play-offs; the Final is one match",
    ],
  },
];

export function getPreset(id) {
  return PRESETS.find((p) => p.id === id) || null;
}

// Selectable season list for the create flow. Renders a window of European
// football seasons (e.g. 2018/19 … 2027/28) the admin picks from. Newest first
// (one upcoming season at the top) so the current campaign is the easy default.
export function getSeasonOptions(span = 10) {
  // Anchor on a sensible "current" season. The season rolls over in July.
  const now = new Date();
  const startYear = now.getMonth() >= 6 ? now.getFullYear() : now.getFullYear() - 1;
  const newest = startYear + 1; // one season into the future
  const out = [];
  for (let i = 0; i < span; i++) out.push(seasonLabel(newest - i));
  return out;
}

// "2024/2025" — the canonical season label used as the unique key (matches the
// format the imported real competitions already use).
export function seasonLabel(startYear) {
  return `${startYear}/${startYear + 1}`;
}

// Football crest fallback emoji (the DB crest is unreliable — emoji → "?").
export function crestForSport() {
  return "⚽";
}

// ── Knockout round metadata (shared by bracket + advance logic) ──────────────
export const KO_ROUND_LABELS = {
  PLAYOFF: "Knockout play-off",
  R16: "Round of 16",
  QF: "Quarter-finals",
  SF: "Semi-finals",
  FINAL: "Final",
};

// Champions League knockout scaffold order.
export const CL_KO_ORDER = ["PLAYOFF", "R16", "QF", "SF", "FINAL"];

// ── CL league-phase fixture generator ────────────────────────────────────────
//
// Produces a fixture list where EVERY team plays exactly `perTeam` (=8) DISTINCT
// opponents, ~ (36*8)/2 = 144 fixtures, none repeated, no self-pairings. We use a
// deterministic circle/rotation pairing so the result is reproducible and every
// team hits its degree exactly. `teams` are the created teams (with real ids).
export function generateClLeaguePhase(teams, perTeam = 8) {
  const n = teams.length;
  if (n < perTeam + 1) return [];
  const ids = teams.map((t) => t.id);
  const degree = new Array(n).fill(0);
  const used = new Set(); // "min-max" pair keys
  const fixtures = [];
  const key = (a, b) => (a < b ? `${a}-${b}` : `${b}-${a}`);

  // Greedy over rotational offsets keeps the graph regular and well-spread.
  for (let off = 1; off <= n && fixtures.length < (n * perTeam) / 2; off++) {
    for (let i = 0; i < n; i++) {
      const j = (i + off) % n;
      if (i === j) continue;
      if (degree[i] >= perTeam || degree[j] >= perTeam) continue;
      const k = key(i, j);
      if (used.has(k)) continue;
      used.add(k);
      degree[i]++;
      degree[j]++;
      // Alternate home/away by parity so home counts stay balanced.
      const homeIdx = (i + j + off) % 2 === 0 ? i : j;
      const awayIdx = homeIdx === i ? j : i;
      fixtures.push({
        homeTeamId: ids[homeIdx],
        awayTeamId: ids[awayIdx],
        // MUST match the round string the detail page filters on (and the value
        // the imported real Champions League uses) — otherwise a freshly created
        // CL competition renders an empty "League phase". Kept identical to
        // CL_LEAGUE_ROUND in store.js. (Literal here avoids a circular import,
        // since store.js already imports from this module.)
        round: "LEAGUE_STAGE",
        matchday: null,
      });
    }
  }
  // Assign matchday buckets purely for display grouping (8 buckets).
  fixtures.forEach((f, idx) => {
    f.matchday = (idx % perTeam) + 1;
  });
  return fixtures;
}
