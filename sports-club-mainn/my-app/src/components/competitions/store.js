// ─────────────────────────────────────────────────────────────────────────────
// USER-CREATED COMPETITIONS — DATA LAYER (DB-backed via api.competitions.*)
// ─────────────────────────────────────────────────────────────────────────────
//
// This module is the ONLY place the competitions UI touches persistence. It now
// delegates entirely to the real backend through `api.competitions.*`. All the
// old localStorage code is gone. Standings remain a PURE client-side computation
// from the fixtures returned by the backend.
//
// BACKEND ENTITIES
//   Competition  { id, name, season, type ("LEAGUE"|"KNOCKOUT"), rounds, createdAt }
//   Team         { id, competitionId, name, shortName, crestUrl, crest, sport }
//   Fixture      { id, competitionId, homeTeamId, awayTeamId, homeName, awayName,
//                  homeScore, awayScore, played, round, groupName, matchday, playedAt }
//
// For type "LEAGUE" the backend AUTO-GENERATES the full round-robin (each pair
// meets `rounds` times, home & away). The UI never invents league fixtures.
// ─────────────────────────────────────────────────────────────────────────────

import { api } from "@/src/lib/api";
import { getPreset, generateClLeaguePhase } from "./presets";

// ── Thin pass-throughs to the DB-backed API ──────────────────────────────────

export async function listCompetitions() {
  const list = await api.competitions.list().catch(() => []);
  const arr = Array.isArray(list) ? list : list?.content || list?.data || [];
  return [...arr].sort(
    (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
  );
}

// Returns { competition, teams, fixtures } or null.
export async function getCompetition(id) {
  const d = await api.competitions.get(id).catch(() => null);
  if (!d || !d.competition) return null;
  return {
    competition: d.competition,
    teams: d.teams || [],
    fixtures: d.fixtures || [],
  };
}

// Create a competition. For LEAGUE the backend returns it WITH the generated
// round-robin fixtures. `teams` must already be in API shape:
//   { name, shortName, crestUrl, crest, sport }
export async function createCompetition({ name, season, type, rounds, teams }) {
  return api.competitions.create({
    name: String(name || "").trim() || "Untitled Competition",
    season: String(season || "").trim() || "—",
    type: type === "KNOCKOUT" ? "KNOCKOUT" : "LEAGUE",
    rounds: Number(rounds) > 0 ? Number(rounds) : 1,
    teams: (teams || []).map((t) => ({
      name: t.name,
      shortName: t.shortName || t.short || t.name?.slice(0, 3).toUpperCase() || "",
      crestUrl: t.crestUrl || "",
      crest: t.crest || "⚽",
      sport: t.sport || "Football",
    })),
  });
}

export async function deleteCompetition(id) {
  await api.competitions.remove(id);
  return true;
}

// Record / edit a result on an EXISTING fixture (league or knockout). The
// optional `playedAt` ("YYYY-MM-DD") is the match date the admin sets when
// entering the score; the backend persists it on the fixture.
export async function recordResult(compId, fixtureId, homeScore, awayScore, playedAt) {
  const body = {
    homeScore: Number(homeScore),
    awayScore: Number(awayScore),
  };
  if (playedAt) body.playedAt = playedAt;
  return api.competitions.recordResult(compId, fixtureId, body);
}

// Manual fixture — KNOCKOUT / cup only. Never used for leagues.
export async function addFixture(compId, { homeTeamId, awayTeamId, round, groupName, matchday }) {
  return api.competitions.addFixture(compId, {
    homeTeamId,
    awayTeamId,
    round: round || "",
    groupName: groupName || null,
    matchday: matchday || null,
  });
}

export async function deleteFixture(compId, fixtureId) {
  await api.competitions.deleteFixture(compId, fixtureId);
  return true;
}

// Bulk fixture create — used for the CL league phase and cup brackets.
export async function addFixturesBulk(compId, fixtures) {
  if (!fixtures || fixtures.length === 0) return [];
  return api.competitions.addFixturesBulk(compId, fixtures);
}

// ── Preset-aware creation ─────────────────────────────────────────────────────
//
// Creates the competition row from a preset, then generates the right fixtures
// for that format (round-robin is auto by the backend; CL + cup we POST in bulk).
// Returns { competition, teams, fixtures } as re-fetched after generation.
export async function createFromPreset({ presetId, name, season, teams }) {
  const preset = getPreset(presetId);
  if (!preset) throw new Error("Unknown preset");

  const apiTeams = (teams || []).map((t) => ({
    name: t.name,
    shortName: t.shortName || t.short || t.name?.slice(0, 3).toUpperCase() || "",
    crestUrl: t.crestUrl || "",
    crest: t.crest || "⚽",
    sport: t.sport || preset.sport || "Football",
  }));

  const created = await api.competitions.create({
    name: String(name || preset.name).trim(),
    season: String(season || "").trim() || "—",
    type: preset.type,
    rounds: preset.format.kind === "ROUND_ROBIN" ? preset.format.rounds : 1,
    teams: apiTeams,
  });

  const compId = created?.competition?.id;
  const createdTeams = created?.teams || [];

  // Generate format-specific fixtures for the Champions League league phase.
  if (preset.format.kind === "CL_LEAGUE") {
    const fx = generateClLeaguePhase(createdTeams, preset.format.matchesPerTeam);
    await addFixturesBulk(compId, fx);
  }
  // ROUND_ROBIN: backend already generated the full schedule.

  // Re-fetch so the caller gets the fixtures we just added.
  const full = await getCompetition(compId);
  return full || created;
}

// ── Derived: standings table — PURE client-side computation from fixtures ─────
//
// 3 points a win, 1 a draw, 0 a loss. Sorted Pts → GD → GF → name.
// `teams` seeds every registered team (so a team with no played fixtures shows).
// `fixtures` may include unplayed ones — those are ignored.
export function computeStandings(teams, fixtures) {
  const byId = {};
  const byName = {};
  const ensure = (id, name, fallback) => {
    const key = id != null ? `id:${id}` : `nm:${name}`;
    let row = byId[key];
    if (!row) {
      row = {
        teamId: id,
        name: name || fallback?.name || "—",
        shortName: fallback?.shortName || "",
        crestUrl: fallback?.crestUrl || "",
        crest: fallback?.crest || "⚽",
        played: 0,
        won: 0,
        drawn: 0,
        lost: 0,
        gf: 0,
        ga: 0,
        gd: 0,
        points: 0,
      };
      byId[key] = row;
      if (name) byName[name] = row;
    }
    return row;
  };

  // seed registered teams
  (teams || []).forEach((t) => ensure(t.id, t.name, t));

  const teamById = Object.fromEntries((teams || []).map((t) => [t.id, t]));

  (fixtures || []).forEach((m) => {
    const playedFlag = m.played === true || (m.homeScore != null && m.awayScore != null);
    if (!playedFlag) return;
    const hs = Number(m.homeScore);
    const as = Number(m.awayScore);
    if (Number.isNaN(hs) || Number.isNaN(as)) return;

    const h = ensure(m.homeTeamId, m.homeName, teamById[m.homeTeamId]);
    const a = ensure(m.awayTeamId, m.awayName, teamById[m.awayTeamId]);
    h.played++;
    a.played++;
    h.gf += hs;
    h.ga += as;
    a.gf += as;
    a.ga += hs;
    if (hs > as) {
      h.won++;
      a.lost++;
      h.points += 3;
    } else if (hs < as) {
      a.won++;
      h.lost++;
      a.points += 3;
    } else {
      h.drawn++;
      a.drawn++;
      h.points += 1;
      a.points += 1;
    }
  });

  return Object.values(byId)
    .map((r) => ({ ...r, gd: r.gf - r.ga }))
    .sort(
      (a, b) =>
        b.points - a.points ||
        b.gd - a.gd ||
        b.gf - a.gf ||
        String(a.name).localeCompare(String(b.name))
    );
}

// ── Real DB round identifiers ─────────────────────────────────────────────────
//
// The imported 2024/25 competitions carry these exact round strings:
//   La Liga → every fixture is "REGULAR_SEASON".
//   Champions League → "LEAGUE_STAGE" (the single league phase) plus a two-legged
//   knockout: "PLAYOFFS" → "LAST_16" → "QUARTER_FINALS" → "SEMI_FINALS" → "FINAL"
//   (the final is one match). Two-legged ties use matchday 1 / 2 for leg 1 / 2.
export const CL_LEAGUE_ROUND = "LEAGUE_STAGE";
export const CL_FINAL_ROUND = "FINAL";

// Round strings that mean "this is a league-phase / regular-season fixture" (NOT
// a knockout tie). We accept the imported real values ("LEAGUE_STAGE" for the
// Champions League, "REGULAR_SEASON" for La Liga) PLUS the legacy "LEAGUE_PHASE"
// some older generated data may carry — so the league phase never renders empty
// just because of a round-name mismatch.
export const LEAGUE_PHASE_ROUNDS = new Set([
  CL_LEAGUE_ROUND, // "LEAGUE_STAGE"
  "LEAGUE_PHASE", // legacy generated value
  "REGULAR_SEASON", // La Liga
]);

// Is a fixture part of the Champions League LEAGUE phase (its single big table)?
// Accepts every league-phase alias above.
export function isLeaguePhaseRound(round) {
  return LEAGUE_PHASE_ROUNDS.has(round);
}

// Knockout round metadata in display order (final last).
export const KO_ROUNDS = [
  { key: "PLAYOFFS", label: "Play-offs" },
  { key: "LAST_16", label: "Round of 16" },
  { key: "QUARTER_FINALS", label: "Quarter-finals" },
  { key: "SEMI_FINALS", label: "Semi-finals" },
  { key: "FINAL", label: "Final" },
];

export const KO_ROUND_KEYS = KO_ROUNDS.map((r) => r.key);
export const KO_ROUND_LABEL = Object.fromEntries(KO_ROUNDS.map((r) => [r.key, r.label]));

// Is a fixture part of the CL knockout phase (i.e. not the league stage)?
export function isKnockoutRound(round) {
  return !!round && !isLeaguePhaseRound(round);
}

// Group a round's fixtures into TIES (the two legs of a two-legged tie, keyed by
// the unordered team pair). Returns [{ key, legs:[fixture,…], teamA, teamB,
// aggA, aggB, winnerId }]. The FINAL is a single-leg "tie". Aggregate goals
// decide the winner; if level we fall back to the team that won the second leg
// (best-effort — imported data is already decided so this is rarely needed).
export function groupTies(fixtures = []) {
  const map = new Map();
  for (const f of fixtures) {
    const a = f.homeTeamId;
    const b = f.awayTeamId;
    const pair = [a, b].sort((x, y) => `${x}`.localeCompare(`${y}`)).join("~");
    if (!map.has(pair)) {
      map.set(pair, {
        key: pair,
        round: f.round,
        legs: [],
        teamAId: null,
        teamBId: null,
        teamAName: "",
        teamBName: "",
        aggA: 0,
        aggB: 0,
        winnerId: null,
      });
    }
    map.get(pair).legs.push(f);
  }

  const ties = [];
  for (const tie of map.values()) {
    // Order legs by matchday so leg 1 is first.
    tie.legs.sort((p, q) => (p.matchday ?? 0) - (q.matchday ?? 0));
    // Canonical A/B sides from the first leg.
    const first = tie.legs[0];
    tie.teamAId = first.homeTeamId;
    tie.teamBId = first.awayTeamId;
    tie.teamAName = first.homeName;
    tie.teamBName = first.awayName;
    let aggA = 0;
    let aggB = 0;
    let lastLegWinner = null;
    for (const leg of tie.legs) {
      if (!isPlayed(leg)) continue;
      const hs = Number(leg.homeScore);
      const as = Number(leg.awayScore);
      // Map this leg's home/away onto the canonical A/B sides.
      if (leg.homeTeamId === tie.teamAId) {
        aggA += hs;
        aggB += as;
      } else {
        aggA += as;
        aggB += hs;
      }
      const legWinner = hs > as ? leg.homeTeamId : as > hs ? leg.awayTeamId : null;
      if (legWinner != null) lastLegWinner = legWinner;
    }
    tie.aggA = aggA;
    tie.aggB = aggB;
    const allPlayed = tie.legs.every(isPlayed);
    if (allPlayed) {
      if (aggA > aggB) tie.winnerId = tie.teamAId;
      else if (aggB > aggA) tie.winnerId = tie.teamBId;
      else tie.winnerId = lastLegWinner; // level on aggregate → decider
    }
    ties.push(tie);
  }
  return ties;
}

// ── Format detection ──────────────────────────────────────────────────────────
//
// Competitions are football only, so there are exactly two formats. We can't
// store the preset id on the backend row, so we infer it from the shape: a
// LEAGUE row is the double round-robin (La Liga); any KNOCKOUT row is the
// Champions League (single league phase carrying LEAGUE_PHASE fixtures, then a
// two-legged knockout).
export function detectFormat(competition) {
  return competition?.type === "LEAGUE" ? "LEAGUE" : "CL";
}

export function isPlayed(f) {
  return f?.played === true || (f?.homeScore != null && f?.awayScore != null);
}

// All fixtures present AND every one played → the competition is finished.
export function isFinished(fixtures = []) {
  return fixtures.length > 0 && fixtures.every(isPlayed);
}

// Winner team-id of a decided fixture (null if drawn / not played).
export function fixtureWinnerId(f) {
  if (!isPlayed(f)) return null;
  const hs = Number(f.homeScore);
  const as = Number(f.awayScore);
  if (hs > as) return f.homeTeamId;
  if (as > hs) return f.awayTeamId;
  return null;
}

// Champion for a finished competition, as a team-like row, or null.
//   LEAGUE → top of the standings table
//   CL     → winner of the FINAL (single match)
export function getChampion({ competition, teams = [], fixtures = [] }) {
  const fmt = detectFormat(competition);
  if (fmt === "LEAGUE") {
    if (!isFinished(fixtures)) return null;
    const rows = computeStandings(teams, fixtures);
    return rows[0] || null;
  }
  const final = (fixtures || []).find((f) => f.round === "FINAL");
  if (!final || !isPlayed(final)) return null;
  const wid = fixtureWinnerId(final);
  if (wid == null) return null;
  return (
    teams.find((t) => t.id === wid) || {
      name: wid === final.homeTeamId ? final.homeName : final.awayName,
    }
  );
}

// ── Champions League qualification zones ──────────────────────────────────────
// Given the 36-row standings, classify each rank:
//   1–8   → "direct"  (Round of 16)
//   9–24  → "playoff" (knockout play-off)
//   25–36 → "out"
export function clZone(rankIndex0) {
  if (rankIndex0 < 8) return "direct";
  if (rankIndex0 < 24) return "playoff";
  return "out";
}

export const CL_ZONES = [
  { key: "direct", label: "Round of 16", color: "emerald", range: "1–8" },
  { key: "playoff", label: "Knockout play-off", color: "amber", range: "9–24" },
  { key: "out", label: "Eliminated", color: "slate", range: "25–36" },
];
