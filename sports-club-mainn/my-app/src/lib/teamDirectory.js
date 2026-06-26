// Maps numeric team IDs to friendly team names + sport + real crest logo.
// Every screen that used to render "Team #1" or "Outer Team #2" should
// use lookupTeam()/lookupOuterTeam() instead.
//
// crestUrl = real club badge (football-data.org CDN) for football clubs;
// non-football teams fall back to the `crest` emoji.

import { LA_LIGA_TEAMS, CHAMPIONS_LEAGUE_TEAMS } from "@/src/components/competitions/presets";

const FD = (id) => `https://crests.football-data.org/${id}.png`;

export const KNOWN_TEAMS = {
  1: { name: "FC Barcelona",            short: "FCB",      sport: "Football",   crest: "⚽", crestUrl: FD(81), tone: "emerald" },
  2: { name: "FC Barcelona Bàsquet",    short: "FCB BB",   sport: "Basketball", crest: "🏀", tone: "blue"    },
  3: { name: "Barça Tennis Academy",    short: "Tennis",   sport: "Tennis",     crest: "🎾", tone: "rose"    },
  4: { name: "CV Barcelona",            short: "CVB",      sport: "Volleyball", crest: "🏐", tone: "amber"   },
  5: { name: "FC Barcelona Handbol",    short: "FCB HB",   sport: "Handball",   crest: "🤾", tone: "violet"  },
};

export const KNOWN_OUTER_TEAMS = {
  1:  { name: "Real Madrid CF",         short: "RMA",  sport: "Football",   crest: "⚽", crestUrl: FD(86),  tone: "slate" },
  2:  { name: "Atlético de Madrid",     short: "ATM",  sport: "Football",   crest: "⚽", crestUrl: FD(78),  tone: "rose"  },
  3:  { name: "Sevilla FC",             short: "SEV",  sport: "Football",   crest: "⚽", crestUrl: FD(559), tone: "rose"  },
  4:  { name: "Real Madrid Baloncesto", short: "RMA BB", sport: "Basketball", crest: "🏀", tone: "slate" },
  5:  { name: "Girona FC",              short: "GIR",  sport: "Football",   crest: "⚽", crestUrl: FD(298), tone: "rose"  },
  6:  { name: "Athletic Club",          short: "ATH",  sport: "Football",   crest: "⚽", crestUrl: FD(77),  tone: "rose"  },
  7:  { name: "Villarreal CF",          short: "VIL",  sport: "Football",   crest: "⚽", crestUrl: FD(94),  tone: "amber" },
  8:  { name: "Real Betis",             short: "BET",  sport: "Football",   crest: "⚽", crestUrl: FD(90),  tone: "emerald" },
  9:  { name: "Valencia CF",            short: "VAL",  sport: "Football",   crest: "⚽", crestUrl: FD(95),  tone: "amber" },
  10: { name: "Real Sociedad",          short: "RSO",  sport: "Football",   crest: "⚽", crestUrl: FD(92),  tone: "blue"  },
  11: { name: "Celta de Vigo",          short: "CEL",  sport: "Football",   crest: "⚽", crestUrl: FD(558), tone: "blue"  },
  12: { name: "Getafe CF",              short: "GET",  sport: "Football",   crest: "⚽", crestUrl: FD(82),  tone: "blue"  },
  13: { name: "CA Osasuna",             short: "OSA",  sport: "Football",   crest: "⚽", crestUrl: FD(79),  tone: "rose"  },
  14: { name: "Rayo Vallecano",         short: "RAY",  sport: "Football",   crest: "⚽", crestUrl: FD(87),  tone: "rose"  },
  // Basketball (EuroLeague / ACB)
  15: { name: "Saski Baskonia",         short: "BAS",  sport: "Basketball", crest: "🏀", tone: "slate" },
  16: { name: "Valencia Basket",        short: "VBC",  sport: "Basketball", crest: "🏀", tone: "amber" },
  17: { name: "Olympiacos B.C.",        short: "OLY",  sport: "Basketball", crest: "🏀", tone: "rose"  },
  // Handball (EHF Champions League)
  18: { name: "THW Kiel",               short: "KIE",  sport: "Handball",   crest: "🤾", tone: "slate" },
  19: { name: "Paris SG Handball",      short: "PSG",  sport: "Handball",   crest: "🤾", tone: "blue"  },
  // Tennis
  20: { name: "Real Madrid Tennis",     short: "RMT",  sport: "Tennis",     crest: "🎾", tone: "slate" },
};

/**
 * Resolve a club team ID. Returns { name, short, sport, crest, crestUrl, tone }
 * or null if the ID isn't in the seeded directory.
 */
export function lookupTeam(id) {
  if (id == null) return null;
  return KNOWN_TEAMS[Number(id)] || null;
}

/**
 * Resolve a rival / scouted (outer) team ID.
 */
export function lookupOuterTeam(id) {
  if (id == null) return null;
  return KNOWN_OUTER_TEAMS[Number(id)] || null;
}

/**
 * Friendly display name for a club team — never returns raw "Team #N"
 * if the directory knows the ID. Otherwise falls back gracefully.
 */
export function displayTeamName(id, fallbackPrefix = "Team") {
  if (id == null || id === "") return "—";
  const t = lookupTeam(id);
  return t ? t.name : `${fallbackPrefix} #${id}`;
}

/**
 * Same for outer / opposing teams.
 */
export function displayOuterTeamName(id, fallbackPrefix = "Outer Team") {
  if (id == null || id === "") return "—";
  const t = lookupOuterTeam(id);
  return t ? t.name : `${fallbackPrefix} #${id}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// CREST RESOLUTION BY NAME
// ─────────────────────────────────────────────────────────────────────────────
//
// The standings API returns full official club names ("Club Atlético de Madrid",
// "Real Betis Balompié", "RC Celta de Vigo") and the outer-teams API returns
// crest-less rows ({id,name,country} only). To guarantee EVERY team renders a
// real badge we build a normalized name → crestUrl index from the curated
// La Liga + Champions League pools (and the seeded directory), then look up the
// crest by a normalized form of whatever name we have.
//
// Normalization: lowercase, strip accents, drop common club-type tokens
// ("fc","cf","ca","rc","rcd","cd","ud","sc","ac","as","club","de","del","la"),
// collapse known suffix noise ("balompie", "fútbol", "amsterdam", "munich"…),
// and squash to a compact alphanumeric key so variants collapse together
// (e.g. "Club Atlético de Madrid" and "Atlético de Madrid" → "atleticomadrid").

const STRIP_TOKENS = new Set([
  "fc", "cf", "ca", "rc", "rcd", "cd", "ud", "sc", "sd", "ac", "as", "afc",
  "bc", "ssc", "sl", "vfb", "bsc", "fk", "club", "balompie", "de", "del",
  "la", "el", "the",
]);

function normalizeTeamName(name) {
  if (!name) return "";
  const cleaned = String(name)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // strip accents: "atlético" → "atletico"
    .replace(/[^a-z0-9\s]/g, " ");   // punctuation → space
  const tokens = cleaned
    .split(/\s+/)
    .filter(Boolean)
    .filter((t) => !STRIP_TOKENS.has(t));
  return tokens.join("");
}

// Newly-promoted La Liga clubs not in the curated preset roster (the preset is
// the prior season's 20). The live standings API may list these, so index their
// real football-data crests too — keeps name-resolution complete for the table.
const EXTRA_FOOTBALL = [
  { name: "Elche CF", crestUrl: FD(285) },
  { name: "Levante UD", crestUrl: FD(88) },
  { name: "Real Oviedo", crestUrl: FD(1048) },
];

// Build the index once (module scope) from every curated source. Earlier sources
// win on collision; the order favors La Liga then the European pool then seeded.
const CREST_INDEX = (() => {
  const idx = {};
  const sources = [
    ...LA_LIGA_TEAMS,
    ...CHAMPIONS_LEAGUE_TEAMS,
    ...EXTRA_FOOTBALL,
    ...Object.values(KNOWN_TEAMS),
    ...Object.values(KNOWN_OUTER_TEAMS),
  ];
  for (const t of sources) {
    if (!t?.crestUrl) continue;
    const key = normalizeTeamName(t.name);
    if (key && !idx[key]) idx[key] = t.crestUrl;
    // also index the short code (e.g. "BAR", "RMA") as a secondary key
    const shortKey = normalizeTeamName(t.shortName || t.short);
    if (shortKey && !idx[shortKey]) idx[shortKey] = t.crestUrl;
  }
  // Hand-mapped aliases for official long-forms the normalizer can't collapse
  // to an existing key on its own (extra geographic/descriptor words).
  const ALIASES = {
    "celtavigo": "celta",            // "RC Celta de Vigo" → Celta de Vigo
    "realsociedadfutbol": "realsociedad",
    "espanyolbarcelona": "espanyol",
    "rayovallecanomadrid": "rayovallecano",
    "manchestercity": "manchestercity",
    "bayernmunich": "bayernmunchen", // API "Bayern Munich" → preset "Bayern München"
    "ajaxamsterdam": "ajax",         // API "Ajax Amsterdam" → preset "AFC Ajax"
    "intermilan": "intermilan",
  };
  for (const [from, to] of Object.entries(ALIASES)) {
    if (idx[to] && !idx[from]) idx[from] = idx[to];
  }
  return idx;
})();

/**
 * Resolve a club crest URL from a team NAME (any common variant). Returns the
 * football-data badge URL, or null when the name is unknown. Used to fill crests
 * the API omitted (outer teams) or to back up standings rows.
 */
export function resolveCrestByName(name) {
  if (!name) return null;
  const key = normalizeTeamName(name);
  return CREST_INDEX[key] || null;
}

/**
 * Best-effort crest for a team: prefer an explicit URL from the data, else
 * resolve by name. Returns null only when nothing matches (caller renders an
 * initials badge). `urls` may be one URL or several candidates (first wins).
 */
export function resolveCrest({ url, urls, name } = {}) {
  const candidates = [url, ...(Array.isArray(urls) ? urls : [])].filter(Boolean);
  // Ignore the unreliable emoji crest the backend mangles to "?".
  const realUrl = candidates.find((u) => /^https?:\/\//.test(String(u)));
  if (realUrl) return realUrl;
  return resolveCrestByName(name);
}
