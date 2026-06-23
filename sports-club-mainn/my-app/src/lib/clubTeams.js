// Data-driven club/team model shared by Players, Staff, Teams & Sports and Club
// Hub. The backend now seeds a first AND a reserve ("B") team for every sport
// except Tennis. We derive everything from the live /teams + /rosters data so
// nothing is hard-coded:
//   • a team's sport comes from its sportId
//   • the FIRST team of a sport = the lowest team id for that sport; any other
//     team of the same sport is a SECOND / reserve team
//   • a player's team is resolved via the roster (playerId → teamId)

export const SPORT_BY_ID = { 1: "FOOTBALL", 2: "BASKETBALL", 3: "TENNIS", 4: "VOLLEYBALL", 6: "HANDBALL" };

// Sports we surface in the multi-sport UI (volleyball/swimming are hidden).
export const VISIBLE_SPORTS = ["FOOTBALL", "BASKETBALL", "HANDBALL", "TENNIS"];

export const SPORT_META = {
  FOOTBALL:   { label: "Football",   emoji: "⚽", tone: "emerald" },
  BASKETBALL: { label: "Basketball", emoji: "🏀", tone: "sky" },
  HANDBALL:   { label: "Handball",   emoji: "🤾", tone: "violet" },
  TENNIS:     { label: "Tennis",     emoji: "🎾", tone: "rose" },
};

const arr = (r) => r?.data || r?.content || (Array.isArray(r) ? r : []);
const sportOfTeam = (t) => SPORT_BY_ID[Number(t.sportId)] || String(t.sportType || "").toUpperCase() || "FOOTBALL";

// Build the team index from the raw /teams payload.
// Returns { byId, bySport, list } where each enriched team has
// { id, name, sportType, isFirstTeam, tier }.
export function buildTeamIndex(teamsRaw) {
  const teams = arr(teamsRaw).map((t) => ({
    id: Number(t.id),
    name: t.name,
    sportType: sportOfTeam(t),
    sportId: Number(t.sportId),
  }));

  const bySportTmp = {};
  for (const t of teams) (bySportTmp[t.sportType] ||= []).push(t);

  const byId = {};
  const bySport = {};
  for (const sport of Object.keys(bySportTmp)) {
    // lowest id = first team; the rest are reserve teams, in id order.
    const sorted = [...bySportTmp[sport]].sort((a, b) => a.id - b.id);
    bySport[sport] = sorted.map((t, i) => {
      const enriched = { ...t, isFirstTeam: i === 0, tier: i === 0 ? "First Team" : "Reserve Team" };
      byId[t.id] = enriched;
      return enriched;
    });
  }
  return { byId, bySport, list: Object.values(byId) };
}

// playerId (number) -> teamId (number), from the /rosters payload.
export function buildPlayerTeamMap(rostersRaw) {
  const map = {};
  for (const r of arr(rostersRaw)) {
    if (r.playerId != null && r.teamId != null) map[Number(r.playerId)] = Number(r.teamId);
  }
  return map;
}

// Resolve a player's enriched team object (or null) given the indexes above.
export function teamOfPlayer(player, playerTeamMap, teamIndex) {
  const teamId = playerTeamMap[Number(player?.id)];
  return teamId != null ? teamIndex.byId[teamId] || null : null;
}
