// Maps numeric team IDs to friendly team names + sport + real crest logo.
// Every screen that used to render "Team #1" or "Outer Team #2" should
// use lookupTeam()/lookupOuterTeam() instead.
//
// crestUrl = real club badge (football-data.org CDN) for football clubs;
// non-football teams fall back to the `crest` emoji.

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
