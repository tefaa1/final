"use client";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { api } from "@/src/lib/api";
import useRole from "@/src/lib/useRole";
import { lookupTeam } from "@/src/lib/teamDirectory";
import { buildPlayerTeamMap } from "@/src/lib/clubTeams";
import { resolveSportUpper } from "@/src/lib/playerSport";
import PlayerFace from "@/src/components/matches/PlayerFace";
import { resolveCompetitionKind, COMPETITION_KIND, classifyFixtureRound } from "@/src/components/matches/competitionTypes";
import { parseFixtureSource } from "@/src/components/matches/fixtureSource";
import { buildSubDescription, parseSubDescription } from "@/src/components/matches/matchSubs";
import {
  hasKickedOff, elapsedMinute, countdownLabel,
  PHASE_ORDER, phaseDef, phaseLabelOf, phaseIndex,
  autoPhaseForMinute, phaseClockLabel, phaseElapsed, phaseForStoredMinute,
  phaseMinuteRange,
} from "@/src/components/matches/liveClock";

const BARCA_CREST = "https://crests.football-data.org/81.png";

// Backend MatchEvent enum — wrong values 400. GOAL / penalties increment score.
// INJURY is a valid MatchEvent enum value (verified: POST /match-events accepts
// it, 201) and additionally drives the medical workflow (creates an /injuries
// record + flips the player to INJURED). `injury: true` marks it.
const EVENT_TYPES = [
  { v: "GOAL", icon: "⚽", label: "Goal", score: true },
  { v: "ASSIST", icon: "🅰️", label: "Assist" },
  { v: "PENALTY_SCORED", icon: "🥅", label: "Penalty Scored", score: true },
  { v: "PENALTY_MISSED", icon: "❌", label: "Penalty Missed" },
  { v: "OWN_GOAL", icon: "🔴", label: "Own Goal", score: true, away: true },
  { v: "YELLOW_CARD", icon: "🟨", label: "Yellow Card" },
  { v: "RED_CARD", icon: "🟥", label: "Red Card" },
  // SUBSTITUTION has its own dedicated control (out + in + minute), so it's kept
  // out of the generic single-player event picker (excludeFromPicker).
  { v: "SUBSTITUTION", icon: "🔁", label: "Substitution", excludeFromPicker: true },
  { v: "INJURY", icon: "🩹", label: "Injury", injury: true },
  { v: "CORNER_KICK", icon: "🚩", label: "Corner" },
  { v: "FREE_KICK", icon: "🎯", label: "Free Kick" },
  { v: "OFFSIDE", icon: "🚫", label: "Offside" },
  { v: "VAR_REVIEW", icon: "📺", label: "VAR Review" },
];
const SCORING = new Set(["GOAL", "PENALTY_SCORED", "OWN_GOAL"]);

// Real medical enums — mirror the Medical module (verified against the backend
// medical-fitness-service). Recording an INJURY event POSTs an /injuries record
// using exactly these option sets so it lands in the Medical module unchanged.
const INJURY_TYPES = ["MUSCLE_STRAIN", "LIGAMENT_SPRAIN", "FRACTURE", "CONTUSION", "TENDONITIS", "DISLOCATION", "CONCUSSION", "OTHER"];
const INJURY_SEVERITY = ["MINOR", "MODERATE", "SEVERE", "CRITICAL"];
const prettyEnum = (s) => String(s || "").replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
// The seeded reporting doctor used by the Medical module's injury form.
const DEFAULT_DOCTOR_ID = 6;

const SHOOTOUT_TAG = "[SHOOTOUT]";
const SUMMARY_PEN = "Won on penalties";

// matchType values that mean "a winner is required" — a true knockout TIE that
// must not end level (CUP / PLAYOFF / KNOCKOUT rounds).
const KNOCKOUT_MATCH_TYPES = new Set(["CUP", "PLAYOFF", "PLAY_OFF", "KNOCKOUT"]);
// matchType values treated as POINTS matches (a draw is a valid result) unless a
// knockout-ROUND fixture link says otherwise. TOURNAMENT lives here on purpose: a
// UEFA Champions League "league phase" points match is stored as matchType
// TOURNAMENT, yet a draw is a valid result for it (see the seeded CL 3-3 / 1-1
// draws). When such a match DID come from a real knockout-round fixture, the
// resolved fixtureRoundKind (checked first) overrides this back to knockout.
const POINTS_MATCH_TYPES = new Set(["LEAGUE", "FRIENDLY", "GROUP", "LEAGUE_STAGE", "LEAGUE_PHASE", "TOURNAMENT"]);

// Per-sport substitution allowance (normal subs). Football is the modern 5;
// roster sports with free interchange are effectively unlimited.
const SUBS_ALLOWED = { FOOTBALL: 5, HANDBALL: Infinity, BASKETBALL: Infinity, FUTSAL: Infinity };
const subsAllowedFor = (sportUpper) => SUBS_ALLOWED[sportUpper] ?? 5;

const unwrapArr = (r) => r?.data || r?.content || (Array.isArray(r) ? r : []);
const eventMeta = (v) => EVENT_TYPES.find(e => e.v === v) || { icon: "•", label: v };
const isShootout = (e) => String(e?.description || "").includes(SHOOTOUT_TAG);
const shootoutIsAway = (e, awayName) => String(e?.description || "").includes(`${SHOOTOUT_TAG} ${awayName}`);
const isSubEvent = (e) => e?.eventType === "SUBSTITUTION";

// Fire a real alert. The task asks for alertType "GOAL_SCORED", but the backend
// AlertType enum doesn't accept it (it 500s on an unknown enum), so we try the
// requested type and fall back to a valid match-scoped type so a REAL alert is
// always created. Never throws — alerts are best-effort.
async function fireAlert(payload, fallbackType) {
  try {
    return await api.createAlert(payload);
  } catch {
    if (fallbackType && fallbackType !== payload.alertType) {
      try { return await api.createAlert({ ...payload, alertType: fallbackType }); } catch { /* ignore */ }
    }
  }
  return null;
}

export default function LiveMatch({ match, players = [], competitions = [], lineup = [], onClose, onFinished, embedded = false }) {
  // READ-ONLY SPECTATORS (fan / player): they may OPEN and watch a live match —
  // scoreboard, status/clock and the live event feed — but get NO action surface
  // (no phase/clock controls, no substitutions, no event builder, no end-game)
  // and we never fire a mutating/forbidden request on their behalf. The full
  // admin/coach live-control experience is unchanged for non-read-only roles.
  const { readOnly } = useRole();

  const home = lookupTeam(match?.homeTeamId);
  const homeName = home?.name || "FC Barcelona";
  const homeCrest = home?.crestUrl || BARCA_CREST;
  const awayName = match?.opponentName || "Opponent";          // real opponent name, never "Opponent" when set
  const awayCrest = match?.opponentCrest;
  const teamId = Number(match?.homeTeamId) || 1;
  const sportUpper = String(match?.sportType || "FOOTBALL").toUpperCase();

  const compOption = useMemo(
    () => (Array.isArray(competitions) ? competitions : []).find(c => c?.name && c.name === match?.competition),
    [competitions, match?.competition]
  );
  const compKind = useMemo(() => resolveCompetitionKind(compOption, match?.competition), [compOption, match?.competition]);
  const matchTypeUpper = String(match?.matchType || "").toUpperCase();
  const compTypeUpper = String(match?.competitionType || "").toUpperCase();

  // ── FIXTURE-ROUND RESOLUTION (the authoritative league-vs-knockout signal) ──
  // A match created from a real competition fixture remembers its source via the
  // FIXTURE tag in `notes`. We fetch that fixture's ROUND and classify it: a
  // "LEAGUE_PHASE"/"LEAGUE_STAGE"/group round is a POINTS match (a draw is valid)
  // even inside a KNOCKOUT competition like the Champions League, while a
  // "LAST_16"/"QUARTER_FINALS"/"FINAL" round is a true knockout tie even if the
  // match was loosely stored as matchType TOURNAMENT.
  const [fixtureRoundKind, setFixtureRoundKind] = useState(null); // LEAGUE | KNOCKOUT | null
  useEffect(() => {
    let alive = true;
    (async () => {
      const src = parseFixtureSource(match?.notes);
      if (!src) { if (alive) setFixtureRoundKind(null); return; }
      try {
        const d = await api.competitions.get(src.compId);
        const detail = d?.competition ? d : (d?.data || d);
        const fixture = (detail?.fixtures || []).find((f) => String(f.id) === String(src.fixtureId));
        if (alive) setFixtureRoundKind(classifyFixtureRound(fixture?.round));
      } catch { if (alive) setFixtureRoundKind(null); }
    })();
    return () => { alive = false; };
  }, [match?.notes]);

  // Resolve to a single boolean. PRIORITY ORDER:
  //   1. The fixture round, when known, is authoritative (LEAGUE_PHASE → points,
  //      knockout round → winner required) — this is what fixes the CL bug.
  //   2. An explicit POINTS matchType (LEAGUE / FRIENDLY) → never knockout.
  //   3. An explicit KNOCKOUT matchType (CUP / PLAYOFF) or competitionType, or a
  //      knockout-kind competition → knockout.
  //   4. Otherwise default to a points match (a draw is the least-surprising,
  //      safe default — no spurious extra time).
  const isKnockout = useMemo(() => {
    if (fixtureRoundKind === COMPETITION_KIND.LEAGUE) return false;
    if (fixtureRoundKind === COMPETITION_KIND.KNOCKOUT) return true;
    if (POINTS_MATCH_TYPES.has(matchTypeUpper)) return false;
    if (KNOCKOUT_MATCH_TYPES.has(matchTypeUpper)) return true;
    if (compTypeUpper === "KNOCKOUT") return true;
    if (compTypeUpper === "LEAGUE") return false;
    return compKind === COMPETITION_KIND.KNOCKOUT;
  }, [fixtureRoundKind, matchTypeUpper, compTypeUpper, compKind]);

  // ── TEAM-SCOPED SQUAD ───────────────────────────────────────────────
  // The /players feed returns EVERY player of the sport — including the
  // reserve ("B") team that the backend now seeds for each sport. The
  // substitution/event pickers must only offer players who actually belong to
  // THIS match's team, so we resolve each player's team from the /rosters
  // mapping (playerId → teamId) and keep only those rostered to `teamId`.
  const [playerTeamMap, setPlayerTeamMap] = useState({});
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const rosters = await api.getRosters();
        if (alive) setPlayerTeamMap(buildPlayerTeamMap(rosters));
      } catch { if (alive) setPlayerTeamMap({}); }
    })();
    return () => { alive = false; };
  }, []);

  const squad = useMemo(() => {
    const bySport = players.filter(p => resolveSportUpper(p.preferredPosition) === sportUpper);
    // Once the roster map is known, restrict to players rostered to THIS team.
    // (If the map hasn't loaded yet, or no player of this sport is rostered,
    //  fall back to the sport squad so the picker is never spuriously empty.)
    const scoped = bySport.filter(p => playerTeamMap[Number(p.id)] === teamId);
    return scoped.length ? scoped : bySport;
  }, [players, sportUpper, playerTeamMap, teamId]);

  // Players that are actually in this match's starting lineup (for the event
  // picker we prefer the real lineup; fall back to the full squad).
  const lineupPlayers = useMemo(() => {
    if (!Array.isArray(lineup) || !lineup.length) return squad;
    const ids = new Set(lineup.map(l => l.playerId));
    const picked = squad.filter(p => ids.has(p.id));
    return picked.length ? picked : squad;
  }, [lineup, squad]);

  const [status, setStatus] = useState(String(match?.status || "SCHEDULED").toUpperCase());
  const [hs, setHs] = useState(match?.homeTeamScore ?? 0);
  const [as, setAs] = useState(match?.awayTeamScore ?? 0);
  const [events, setEvents] = useState([]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const [phase, setPhase] = useState("FIRST_HALF");
  const [pens, setPens] = useState({ home: 0, away: 0 });
  const [shootoutWinner, setShootoutWinner] = useState(null);

  // Admin-set stoppage (added) time per playing phase: { FIRST_HALF: 3, ... }.
  const [stoppage, setStoppage] = useState({ FIRST_HALF: 0, SECOND_HALF: 0, EXTRA_FIRST: 0, EXTRA_SECOND: 0 });
  // When the current playing phase started counting (ms). Drives the per-phase
  // clock. For the regulation halves we anchor to kickoff so the clock matches a
  // real match; subsequent phases anchor to the moment the admin started them.
  const [phaseStartedAt, setPhaseStartedAt] = useState(null);

  // ── LIVE CLOCK + AUTO GO-LIVE ───────────────────────────────────────
  const [now, setNow] = useState(Date.now());
  const [autoOpen, setAutoOpen] = useState(true); // auto-open/auto-live when kickoff arrives
  const autoTriggered = useRef(false);
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  const kickedOff = hasKickedOff(match?.kickoffTime, now);
  const matchMinute = elapsedMinute(match?.kickoffTime, now);
  const ended = status === "FINISHED";
  const isLive = status === "LIVE" || status === "HALFTIME";
  // GATING: the control panel + event entry are only operable once the match is
  // actually live (kicked off / LIVE / HALFTIME) or already finished. Before that
  // we show only the countdown + a locked card.
  const controlUnlocked = isLive || ended || (status === "SCHEDULED" && kickedOff);

  // ── SENT-OFF / YELLOW tracking (2 yellows = red) ────────────────────
  const [yellowCount, setYellowCount] = useState({});
  const [sentOff, setSentOff] = useState(new Set());
  const [reEnabled, setReEnabled] = useState(new Set());

  // event form
  const [side, setSide] = useState("HOME");
  const [eventType, setEventType] = useState("GOAL");
  const [minute, setMinute] = useState(1);
  const minuteTouched = useRef(false);
  const [extraTime, setExtraTime] = useState("");
  const [playerKc, setPlayerKc] = useState("");
  const [description, setDescription] = useState("");
  // INJURY event sub-form (only used when eventType === "INJURY").
  const [injuryType, setInjuryType] = useState(INJURY_TYPES[0]);
  const [bodyPart, setBodyPart] = useState("");
  const [injurySeverity, setInjurySeverity] = useState("MODERATE");
  // Players flagged injured during THIS live session — greyed/blocked in the
  // picker so they can't be hit twice (mirrors the sent-off handling).
  const [injuredKc, setInjuredKc] = useState(new Set());

  // ── SUBSTITUTIONS ───────────────────────────────────────────────────
  // `onPitchKc`: keycloak ids of HOME players currently ON the pitch. Seeded from
  //   the starting XI; a player who is subbed OFF (or injured-off) is removed and
  //   the player who comes ON is added — so the event/sub pickers always reflect
  //   the live state.
  // `subbedOffKc`: players who have left the pitch via substitution (can't be
  //   involved in further events). `subsUsed`: normal subs consumed this match
  //   (injury subs do NOT count against the limit).
  const [onPitchKc, setOnPitchKc] = useState(new Set());
  const [subbedOffKc, setSubbedOffKc] = useState(new Set());
  const [subsUsed, setSubsUsed] = useState(0);
  const subsAllowed = subsAllowedFor(sportUpper);
  const subsLimitReached = Number.isFinite(subsAllowed) && subsUsed >= subsAllowed;

  // Substitution sub-form (own pickers so an injury can force one inline).
  const [showSub, setShowSub] = useState(false);
  const [subOutKc, setSubOutKc] = useState("");
  const [subInKc, setSubInKc] = useState("");
  // When set, a substitution is FORCED for this freshly-injured player (always
  // allowed, even past the 5-sub limit) — the injured man must be replaced.
  const [forcedInjurySub, setForcedInjurySub] = useState(null); // { kc, name } | null

  // Seed the on-pitch set from the starting XI once the squad/lineup is known.
  const startingXiKc = useMemo(() => {
    if (!Array.isArray(lineup) || !lineup.length) return [];
    const byId = new Map(players.map(p => [String(p.id), p]));
    return lineup
      .map(l => byId.get(String(l.playerId))?.keycloakId)
      .filter(Boolean);
  }, [lineup, players]);

  // Load existing events; reconstruct phase, penalties, cards & sent-off state.
  useEffect(() => {
    (async () => {
      try {
        const all = unwrapArr(await api.getMatchEvents()).filter(e => String(e.matchId) === String(match.id));

        let ph = 0, pa = 0;
        const yc = {}; const off = new Set(); const hurt = new Set();
        // Substitution reconstruction: replay SUBSTITUTION events (sorted by
        // minute) so we know who's off, who came on, and how many NORMAL subs were
        // used. Injury subs are tagged and don't count toward the limit.
        const subbedOff = new Set(); const cameOn = new Set(); let normalSubs = 0;
        all.forEach(e => {
          if (isShootout(e) && e.eventType === "PENALTY_SCORED") { if (shootoutIsAway(e, awayName)) pa++; else ph++; }
          if (e.playerKeycloakId && e.eventType === "YELLOW_CARD") {
            yc[e.playerKeycloakId] = (yc[e.playerKeycloakId] || 0) + 1;
            if (yc[e.playerKeycloakId] >= 2) off.add(e.playerKeycloakId);
          }
          if (e.playerKeycloakId && e.eventType === "RED_CARD") off.add(e.playerKeycloakId);
          if (e.playerKeycloakId && e.eventType === "INJURY") hurt.add(e.playerKeycloakId);
          if (isSubEvent(e)) {
            const parsed = parseSubDescription(e.description);
            if (parsed) {
              if (parsed.outKc) subbedOff.add(parsed.outKc);
              if (parsed.inKc) cameOn.add(parsed.inKc);
              // An injury substitution is tagged with INJURY in its note; it does
              // NOT consume a normal slot.
              if (!/injury/i.test(String(e.description || ""))) normalSubs += 1;
            } else if (e.playerKeycloakId) {
              subbedOff.add(e.playerKeycloakId);
              normalSubs += 1;
            }
          }
        });
        setPens({ home: ph, away: pa });
        setYellowCount(yc);
        setSentOff(off);
        setInjuredKc(hurt);

        // Rebuild the on-pitch set: starting XI, minus those subbed/injured off,
        // plus the substitutes who entered.
        const onPitch = new Set(startingXiKc);
        subbedOff.forEach(kc => onPitch.delete(kc));
        cameOn.forEach(kc => onPitch.add(kc));
        setOnPitchKc(onPitch);
        setSubbedOffKc(subbedOff);
        setSubsUsed(normalSubs);

        const maxMin = all.reduce((m, e) => Math.max(m, Number(e.minute) || 0), 0);
        const hasShoot = all.some(isShootout);
        const st = String(match?.status || "SCHEDULED").toUpperCase();
        if (st === "FINISHED") setPhase(hasShoot ? "PENALTIES" : phaseForStoredMinute(maxMin));
        else if (hasShoot) setPhase("PENALTIES");
        else if (maxMin > 90) setPhase(phaseForStoredMinute(maxMin));
        else if (maxMin > 45 || st === "HALFTIME") setPhase(st === "HALFTIME" ? "HALF_TIME" : "SECOND_HALF");
        else setPhase("FIRST_HALF");

        all.sort((a, b) => (b.minute || 0) - (a.minute || 0));
        setEvents(all);
      } catch { /* ignore */ }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [match.id]);

  // RECONCILE the on-pitch set once the starting XI is known: every starting
  // player who has NOT been subbed off must be on the pitch. This guards the case
  // where the lineup prop arrives after the events load (so the seed above ran
  // against an empty XI). Never removes substitutes who came on.
  useEffect(() => {
    if (!startingXiKc.length) return;
    setOnPitchKc(prev => {
      const next = new Set(prev);
      startingXiKc.forEach(kc => { if (!subbedOffKc.has(kc)) next.add(kc); });
      return next;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startingXiKc, subbedOffKc]);

  // AUTO GO-LIVE: when kickoff arrives and the match is still SCHEDULED, flip it
  // to LIVE automatically (the user does NOT manually flip it). Runs once.
  useEffect(() => {
    if (autoTriggered.current) return;
    if (status === "SCHEDULED" && kickedOff && autoOpen) {
      autoTriggered.current = true;
      setStatus("LIVE");
      const auto = autoPhaseForMinute(matchMinute);
      setPhase(auto);
      // Anchor the running clock to kickoff so it reads like a real match.
      setPhaseStartedAt(new Date(match?.kickoffTime).getTime() || Date.now());
      setMinute(Math.max(1, matchMinute));
      // Read-only spectators only follow the match locally — they must NOT PUT a
      // status change (it 403s for a fan); staff persist the auto-go-live flip.
      if (!readOnly) api.updateMatch(match.id, { homeTeamScore: hs, awayTeamScore: as, status: "LIVE" }).catch(() => {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kickedOff, autoOpen, status]);

  // The live minute INSIDE the current playing phase (0-based within the phase).
  const def = phaseDef(phase);
  const phaseMin = useMemo(() => {
    if (!def.playing) return 0;
    if (phase === "FIRST_HALF" || phase === "SECOND_HALF") {
      // Regulation halves track the real match clock from kickoff.
      const m = matchMinute - def.base;
      return Math.max(0, m);
    }
    return phaseElapsed(phaseStartedAt, now);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, matchMinute, phaseStartedAt, now]);

  // Display minute for the scoreboard clock (absolute match minute).
  const liveClockText = def.playing
    ? phaseClockLabel(phase, phaseMin, stoppage[phase] || 0)
    : def.label;

  // Valid recordable-minute window for the CURRENT phase (null in non-playing
  // phases like HT/FT and in the penalty shootout). Drives the minute input's
  // min/max and rejects out-of-range values so you can't enter minute 400 or
  // score in the first half at minute 80.
  const minuteRange = phaseMinuteRange(phase, stoppage[phase] || 0);

  // Default the recording minute to the live clock while in a running half,
  // clamped into the current phase's valid window (so it's never 0' at kickoff
  // or past the phase's max).
  useEffect(() => {
    if (!minuteTouched.current && isLive && def.playing) {
      const live = def.base + Math.floor(phaseMin);
      const r = phaseMinuteRange(phase, stoppage[phase] || 0);
      setMinute(r ? Math.min(Math.max(live, r.min), r.max) : live);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phaseMin, isLive, phase]);

  const playerByKc = (kc) => squad.find(x => x.keycloakId === kc) || players.find(x => x.keycloakId === kc);
  const playerNameByKc = (kc) => { const p = playerByKc(kc); return p ? `${p.firstName} ${p.lastName}` : "Squad player"; };

  const persist = (patch) =>
    api.updateMatch(match.id, { homeTeamScore: hs, awayTeamScore: as, status, ...patch }).catch(() => {});

  const level = hs === as;
  const needsWinner = isKnockout && level && !shootoutWinner;

  const isUnavailable = (kc) => (sentOff.has(kc) && !reEnabled.has(kc)) || injuredKc.has(kc);
  const reEnablePlayer = (kc) => setReEnabled(prev => { const n = new Set(prev); n.add(kc); return n; });

  // ── SUBSTITUTION candidate lists ────────────────────────────────────
  // OUT: HOME players currently ON the pitch and not already subbed off (the
  // injured/forced player is offered first when a sub is being forced).
  const subOutCandidates = useMemo(
    () => lineupPlayers
      .concat(squad.filter(p => onPitchKc.has(p.keycloakId) && !lineupPlayers.some(l => l.id === p.id)))
      .filter(p => onPitchKc.has(p.keycloakId) && !subbedOffKc.has(p.keycloakId)),
    [lineupPlayers, squad, onPitchKc, subbedOffKc]
  );
  // IN: squad players NOT on the pitch, not already used, not injured, not sent
  // off — i.e. available bench players.
  const subInCandidates = useMemo(
    () => squad.filter(p =>
      !onPitchKc.has(p.keycloakId) &&
      !subbedOffKc.has(p.keycloakId) &&
      !injuredKc.has(p.keycloakId) &&
      !(sentOff.has(p.keycloakId) && !reEnabled.has(p.keycloakId)) &&
      String(p.status || "").toUpperCase() !== "INJURED"
    ),
    [squad, onPitchKc, subbedOffKc, injuredKc, sentOff, reEnabled]
  );

  // Players offered in the generic event picker (HOME): the lineup XI, plus any
  // substitute who has come ON the pitch (so a sub can score / be carded). Subbed
  // off players remain listed (disabled) so the dropdown shows match history.
  const eventPickerPlayers = useMemo(() => {
    const byId = new Map();
    lineupPlayers.forEach(p => byId.set(p.id, p));
    squad.forEach(p => { if (onPitchKc.has(p.keycloakId) || subbedOffKc.has(p.keycloakId)) byId.set(p.id, p); });
    return [...byId.values()];
  }, [lineupPlayers, squad, onPitchKc, subbedOffKc]);

  // Record a real SUBSTITUTION match-event (stored in the DB) and update live
  // state: the OUT player leaves the pitch, the IN player joins it. `injury`
  // subs are tagged + ALWAYS allowed and never consume a normal slot.
  const recordSubstitution = async (out, inn, m, { injury = false } = {}) => {
    const tag = `[${phaseLabelOf(phase)}]`;
    const note = injury ? " (injury)" : "";
    const description = `${tag} ${buildSubDescription(out, inn)}${note}`;
    const body = {
      matchId: Number(match.id),
      teamId,
      playerKeycloakId: out.keycloakId || undefined, // the player going OFF
      eventType: "SUBSTITUTION",
      minute: Number(m) || (def.base + Math.floor(phaseMin)) || 1,
      description,
    };
    const res = await api.createMatchEvent(body);
    const created = res?.data || res || body;

    // Live state: out leaves, in joins; track used slot (injury subs don't count).
    setOnPitchKc(prev => { const n = new Set(prev); if (out.keycloakId) n.delete(out.keycloakId); if (inn.keycloakId) n.add(inn.keycloakId); return n; });
    setSubbedOffKc(prev => { const n = new Set(prev); if (out.keycloakId) n.add(out.keycloakId); return n; });
    if (!injury) setSubsUsed(n => n + 1);

    setEvents(ev => [{ ...body, id: created.id || Math.random(), side: "HOME", phase }, ...ev].sort((a, b) => (b.minute || 0) - (a.minute || 0)));
    return created;
  };

  // Submit the substitution sub-form (the OUT/IN pickers). When `forcedInjurySub`
  // is set the OUT player is locked to the injured man and the limit is bypassed.
  const performSub = async () => {
    setErr("");
    if (!controlUnlocked) { setErr("Control opens at kickoff."); return; }
    const forcing = !!forcedInjurySub;
    const outKc = forcing ? forcedInjurySub.kc : subOutKc;
    if (!outKc) { setErr("Pick the player coming OFF."); return; }
    if (!subInKc) { setErr("Pick the player coming ON."); return; }
    if (outKc === subInKc) { setErr("A player can't be substituted for himself."); return; }
    if (!forcing && subsLimitReached) { setErr(`No substitutions left — ${subsUsed}/${subsAllowed} used.`); return; }
    const out = playerByKc(outKc);
    const inn = playerByKc(subInKc);
    if (!out?.id || !inn?.id) { setErr("Couldn't resolve those players — pick again."); return; }
    if (onPitchKc.has(inn.keycloakId)) { setErr("That player is already on the pitch."); return; }
    setBusy(true);
    try {
      const r = phaseMinuteRange(phase, stoppage[phase] || 0);
      const m = r ? Math.min(Math.max(Number(minute) || r.min, r.min), r.max) : (def.base + Math.floor(phaseMin)) || 1;
      await recordSubstitution(out, inn, m, { injury: forcing });
      setSubOutKc(""); setSubInKc(""); setShowSub(false); setForcedInjurySub(null);
    } catch (e) {
      setErr(e.message || "Failed to record substitution.");
    } finally {
      setBusy(false);
    }
  };

  // Backend status for a given phase: playing phases are LIVE, the interval
  // phases (HALF_TIME / ET-HT) are HALFTIME; FULL_TIME / PENALTIES stay LIVE
  // until the admin ends the game.
  const statusForPhase = (p) => {
    if (p === "HALF_TIME" || p === "EXTRA_HALFTIME") return "HALFTIME";
    if (p === "FULL_TIME") return "LIVE"; // remains live so league games can be ended; knockout offers ET
    return "LIVE";
  };

  // Advance to a specific phase (admin control). Anchors the clock for playing
  // phases and maps the backend status appropriately.
  const goToPhase = async (next) => {
    setErr("");
    setPhase(next);
    minuteTouched.current = false;
    const ndef = phaseDef(next);
    if (ndef.playing) {
      if (next === "FIRST_HALF" || next === "SECOND_HALF") {
        // Regulation halves anchor to kickoff (real-match clock).
        setPhaseStartedAt(new Date(match?.kickoffTime).getTime() || Date.now());
        setMinute(ndef.base + Math.max(0, matchMinute - ndef.base));
      } else {
        setPhaseStartedAt(Date.now());
        setMinute(ndef.base + 1);
      }
    } else {
      setMinute(ndef.base);
    }
    const st = statusForPhase(next);
    setStatus(st);
    await persist({ status: st });
  };

  const addStoppage = (amount) => {
    setStoppage(prev => ({ ...prev, [phase]: Math.max(0, (prev[phase] || 0) + amount) }));
  };

  const writeBackFixtureResult = async () => {
    const src = parseFixtureSource(match?.notes);
    if (!src) return;
    try {
      const d = await api.competitions.get(src.compId);
      const detail = d?.competition ? d : (d?.data || d);
      const fixtures = detail?.fixtures || [];
      const teamsArr = detail?.teams || [];
      const fixture = fixtures.find((f) => String(f.id) === String(src.fixtureId));
      if (!fixture) return;
      const nameOf = (tid, fallback) => teamsArr.find((t) => t.id === tid)?.name || fallback || "";
      const fxHomeName = String(nameOf(fixture.homeTeamId, fixture.homeName)).toLowerCase();
      const ourHome = String(homeName).toLowerCase();
      const homeIsBarca = fxHomeName.includes("barcelona") || fxHomeName.includes("barça") || fxHomeName.includes("barca") || (ourHome && fxHomeName.includes(ourHome));
      const fxHomeScore = homeIsBarca ? hs : as;
      const fxAwayScore = homeIsBarca ? as : hs;
      await api.competitions.recordResult(src.compId, src.fixtureId, { homeScore: fxHomeScore, awayScore: fxAwayScore });
    } catch (e) { console.error("Fixture write-back failed:", e); }
  };

  // FULL-TIME / END-GAME alert (real notification).
  const fireResultAlert = async () => {
    const pensStr = (isKnockout && level && shootoutWinner)
      ? ` (pens ${pens.home}-${pens.away})` : "";
    await fireAlert(
      {
        alertType: "MATCH_RESULT_AVAILABLE",
        priority: "LOW",
        title: "Full time",
        message: `${homeName} ${hs}-${as} ${awayName}${pensStr}`,
        relatedEntityId: Number(match.id),
        relatedEntityType: "MATCH",
      },
      "MATCH_RESULT_AVAILABLE"
    );
  };

  // END GAME — finalise FINISHED, persist score, write back to the source
  // competition fixture, fire the result alert, then exit.
  const finishMatch = async () => {
    if (needsWinner) {
      setErr("Knockout tie is level — play extra time then a penalty shootout to decide a winner.");
      return;
    }
    setBusy(true);
    setStatus("FINISHED");
    setPhase("FULL_TIME");
    const patch = { status: "FINISHED" };
    if (isKnockout && level && shootoutWinner) {
      const winnerName = shootoutWinner === "HOME" ? homeName : awayName;
      patch.matchSummary = `${SUMMARY_PEN}: ${winnerName} ${shootoutWinner === "HOME" ? pens.home : pens.away}-${shootoutWinner === "HOME" ? pens.away : pens.home} (after ${hs}-${as})`;
    }
    await persist(patch);
    await writeBackFixtureResult();
    await fireResultAlert();
    setBusy(false);
    onFinished?.();
  };

  // Fire a real GOAL alert (the task's exact payload; falls back to a valid
  // enum so it always lands).
  const fireGoalAlert = async (scorerName, nhs, nas) => {
    await fireAlert(
      {
        alertType: "GOAL_SCORED",
        priority: "MEDIUM",
        title: "⚽ GOAL!",
        message: `${scorerName} — ${homeName} ${nhs}-${nas} ${awayName}`,
        relatedEntityId: Number(match.id),
        relatedEntityType: "MATCH",
      },
      "MATCH_RESULT_AVAILABLE"
    );
  };

  // Persist an INJURY: POST a real /injuries record (status REPORTED, linked to
  // the player) AND flip the player to INJURED via the players API, so he's
  // pulled from upcoming lineups and shows in the Medical module. Best-effort on
  // the medical writes — the match event itself still records regardless.
  const reportInjuryFor = async (player, minuteText) => {
    if (!player?.id) return;
    const today = new Date().toISOString().split("T")[0];
    const note = `Injury during ${homeName} vs ${awayName} (${minuteText}). Body part: ${bodyPart || "n/a"}.`;
    // 1) /injuries — status REPORTED, numeric playerId (matches the injury body shape)
    try {
      await api.medical.Injuries.post({
        playerId: Number(player.id),
        teamId,
        injuryType,
        severity: injurySeverity,
        status: "REPORTED",
        bodyPart: bodyPart || "Unspecified",
        description: note,
        injuryDate: today,
        reportedAt: new Date().toISOString(),
        reportedByDoctorId: DEFAULT_DOCTOR_ID,
      });
    } catch (e) { console.error("injury POST failed", e); }
    // 2) flip the player's STATUS to INJURED (players API) so he's unselectable
    try { await api.updatePlayerStatus(Number(player.id), "INJURED"); } catch (e) { console.error("player status -> INJURED failed", e); }
  };

  const addEvent = async () => {
    setErr("");
    if (!controlUnlocked) { setErr("Control opens at kickoff."); return; }
    if (playerKc && injuredKc.has(playerKc)) { setErr("That player is already injured and off the pitch."); return; }
    if (playerKc && isUnavailable(playerKc)) { setErr("That player is sent off — re-enable him first."); return; }
    const isInjuryEvent = eventType === "INJURY";
    // An injury must name one of OUR players (only HOME-side, real squad players
    // can be flagged INJURED + sent to Medical).
    if (isInjuryEvent) {
      if (side !== "HOME" || !playerKc) { setErr("Pick the injured player (home squad) for an Injury event."); return; }
      const inj = playerByKc(playerKc);
      if (!inj?.id) { setErr("Couldn't resolve that player — pick another."); return; }
    }
    const m = Number(minute);
    if (!Number.isFinite(m) || m < 0) { setErr("Enter a valid minute"); return; }
    // BOUND THE MINUTE BY THE CURRENT PHASE — no "minute 400", and no scoring in
    // the first half at minute 80. Penalties are a shootout (use the shootout
    // controls), and HT/FT/ET-HT carry no recordable minute.
    if (!minuteRange) {
      setErr(phase === "PENALTIES"
        ? "The shootout has no minute — use the Scored / Missed buttons."
        : `No event minute during ${phaseLabelOf(phase)} — advance to a playing phase first.`);
      return;
    }
    if (m < minuteRange.min || m > minuteRange.max) {
      setErr(`Minute must be between ${minuteRange.min} and ${minuteRange.max} during ${phaseLabelOf(phase)}.`);
      return;
    }
    setBusy(true);
    try {
      const tag = `[${phaseLabelOf(phase)}]`;
      // For an injury, fold the injury detail into the event description so the
      // timeline reads e.g. "Muscle Strain · Right hamstring (Moderate)".
      const injuryDetail = isInjuryEvent
        ? `${prettyEnum(injuryType)}${bodyPart ? ` · ${bodyPart}` : ""} (${prettyEnum(injurySeverity)})`
        : "";
      const desc = [tag, injuryDetail || description].filter(Boolean).join(" ");
      const body = {
        matchId: Number(match.id),
        teamId,
        playerKeycloakId: playerKc || undefined,
        eventType,
        minute: m,
        extraTime: extraTime ? Number(extraTime) : undefined,
        description: desc || undefined,
      };
      const res = await api.createMatchEvent(body);
      const created = res?.data || res || body;

      // ── INJURY: create the medical record + flag the player INJURED ───
      if (isInjuryEvent) {
        const injured = playerByKc(playerKc);
        const minuteText = `${m}'${extraTime ? `+${extraTime}` : ""}`;
        await reportInjuryFor(injured, minuteText);
        setInjuredKc(prev => { const n = new Set(prev); n.add(playerKc); return n; });
        // INJURY FORCES A SUB: the injured man must go OFF and be replaced. If he
        // was on the pitch and there is an available bench player, open the FORCED
        // substitution prompt (locked to him; the 5-sub limit is bypassed). If no
        // replacement is available, he simply leaves the pitch (a team can't field
        // an injured player) — still removed from event eligibility.
        const wasOnPitch = onPitchKc.has(playerKc) || startingXiKc.includes(playerKc);
        setOnPitchKc(prev => { const n = new Set(prev); n.delete(playerKc); return n; });
        if (wasOnPitch && subInCandidates.length > 0) {
          setForcedInjurySub({ kc: playerKc, name: playerNameByKc(playerKc) });
          setSubInKc("");
          setShowSub(true);
        }
      }

      let nhs = hs, nas = as;
      const scored = SCORING.has(eventType);
      if (scored) {
        const meta = eventMeta(eventType);
        const toAway = meta.away ? side === "HOME" : side === "AWAY";
        if (toAway) { nas = as + 1; setAs(nas); } else { nhs = hs + 1; setHs(nhs); }
      }

      // ── CARD TRACKING: 2nd yellow → auto red / sent off ───────────────
      let autoRed = false;
      if (playerKc && eventType === "YELLOW_CARD") {
        const nextCount = (yellowCount[playerKc] || 0) + 1;
        setYellowCount(prev => ({ ...prev, [playerKc]: nextCount }));
        if (nextCount >= 2) {
          autoRed = true;
          setSentOff(prev => { const n = new Set(prev); n.add(playerKc); return n; });
          try {
            await api.createMatchEvent({
              matchId: Number(match.id), teamId, playerKeycloakId: playerKc,
              eventType: "RED_CARD", minute: m, extraTime: extraTime ? Number(extraTime) : undefined,
              description: `${tag} Second yellow — sent off`,
            });
          } catch { /* ignore */ }
        }
      }
      if (playerKc && eventType === "RED_CARD") {
        setSentOff(prev => { const n = new Set(prev); n.add(playerKc); return n; });
      }

      const nextStatus = status === "SCHEDULED" ? "LIVE" : status;
      setStatus(nextStatus);
      await api.updateMatch(match.id, { homeTeamScore: nhs, awayTeamScore: nas, status: nextStatus }).catch(() => {});

      // ── REAL ALERT on a goal ──────────────────────────────────────────
      if (scored) {
        const scorer = playerKc ? playerNameByKc(playerKc) : (side === "HOME" ? homeName : awayName);
        await fireGoalAlert(scorer, nhs, nas);
      }

      setEvents(ev => {
        const rows = [{ ...body, id: created.id || Math.random(), side, phase }, ...ev];
        if (autoRed) rows.unshift({ id: Math.random(), matchId: Number(match.id), teamId, playerKeycloakId: playerKc, eventType: "RED_CARD", minute: m, description: `${tag} Second yellow — sent off`, side, phase });
        return rows.sort((a, b) => (b.minute || 0) - (a.minute || 0));
      });
      if (autoRed) setErr("");
      setDescription("");
      setExtraTime("");
      setPlayerKc("");
      if (isInjuryEvent) { setBodyPart(""); setEventType("GOAL"); }
      minuteTouched.current = false;
    } catch (e) {
      setErr(e.message || "Failed to add event (check event type).");
    } finally {
      setBusy(false);
    }
  };

  const addPenaltyKick = async (kickSide, scored) => {
    setErr("");
    setBusy(true);
    try {
      const eType = scored ? "PENALTY_SCORED" : "PENALTY_MISSED";
      const body = {
        matchId: Number(match.id),
        teamId: kickSide === "HOME" ? teamId : (Number(match?.outerTeamId) || teamId),
        playerKeycloakId: kickSide === "HOME" && playerKc && !isUnavailable(playerKc) ? playerKc : undefined,
        eventType: eType,
        minute: 121,
        description: `${SHOOTOUT_TAG} ${kickSide === "HOME" ? homeName : awayName} penalty ${scored ? "scored" : "missed"}`,
      };
      const res = await api.createMatchEvent(body);
      const created = res?.data || res || body;
      const next = { ...pens };
      if (scored) next[kickSide === "HOME" ? "home" : "away"]++;
      setPens(next);
      setEvents(ev => [{ ...body, id: created.id || Math.random(), side: kickSide, phase: "PENALTIES" }, ...ev]);
      if (status === "SCHEDULED" || status === "HALFTIME") setStatus("LIVE");
    } catch (e) {
      setErr(e.message || "Failed to record penalty.");
    } finally {
      setBusy(false);
    }
  };

  const decideShootout = async (winner) => { setShootoutWinner(winner); setErr(""); };

  const Crest = ({ url, fallback }) => url
    ? <img src={url} alt="" className="w-16 h-16 object-contain drop-shadow-xl" onError={(e) => { e.currentTarget.style.display = "none"; }} />
    : <span className="text-5xl">{fallback}</span>;

  // Phases reachable in this match: league stops at FULL_TIME; knockout exposes
  // the extra-time + penalties chain.
  const reachablePhaseIds = isKnockout
    ? PHASE_ORDER
    : PHASE_ORDER.slice(0, PHASE_ORDER.indexOf("FULL_TIME") + 1);

  // Sent-off players (with names) for the suspension banner.
  const sentOffList = [...sentOff].map(kc => ({ kc, name: playerNameByKc(kc), reEnabled: reEnabled.has(kc) }));

  const panel = (
    <div className="relative w-full max-w-3xl mx-auto rounded-3xl border border-slate-800 bg-slate-950 shadow-2xl overflow-hidden">
      {/* header */}
      <div className="relative bg-gradient-to-r from-[#0a1a3f] via-slate-900 to-[#3b0a2a] px-6 py-4 flex items-center justify-between border-b border-slate-800">
        <div className="flex items-center gap-2 flex-wrap">
          {ended
            ? <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 border border-slate-600 px-2 py-1 rounded-md">Full Time</span>
            : isLive
              ? <span className="text-[10px] font-black uppercase tracking-widest text-red-400 border border-red-500/40 px-2 py-1 rounded-md bg-red-500/10 flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" /> LIVE</span>
              : <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400 border border-emerald-500/40 px-2 py-1 rounded-md bg-emerald-500/10">SCHEDULED</span>}
          <span className="text-[11px] text-slate-400 font-bold">{match?.competition}</span>
          <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md border ${isKnockout ? "text-amber-300 border-amber-500/40 bg-amber-500/10" : "text-sky-300 border-sky-500/40 bg-sky-500/10"}`}>
            {isKnockout ? "Knockout" : "League"}
          </span>
        </div>
        {onClose && <button onClick={onClose} className="w-8 h-8 rounded-lg border border-slate-700 text-slate-400 hover:text-white hover:bg-slate-800 text-sm leading-none transition-all">✕</button>}
      </div>

      {/* ── PRE-KICKOFF GATE: countdown + locked state ─────────────────── */}
      {status === "SCHEDULED" && !kickedOff && (
        <div className="px-6 pt-6 pb-4">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/50 px-6 py-6 text-center">
            <p className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-500">Kicks off in</p>
            <p className="text-5xl font-black text-white tabular-nums mt-2">{countdownLabel(match?.kickoffTime, now)}</p>
            <div className="mt-5 inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800/50 px-4 py-2.5">
              <span className="text-base">🔒</span>
              <span className="text-[11px] font-black uppercase tracking-widest text-slate-400">{readOnly ? "Match hasn't kicked off yet" : "Live control opens at kickoff"}</span>
            </div>
            {!readOnly && (
              <label className="mt-5 flex items-center justify-center gap-2 cursor-pointer select-none">
                <input type="checkbox" checked={autoOpen} onChange={e => setAutoOpen(e.target.checked)} className="w-4 h-4 accent-emerald-500" />
                <span className="text-[11px] font-bold text-slate-400">Auto-go-live when it starts</span>
              </label>
            )}
          </div>
        </div>
      )}

      {/* ── KICKED OFF but still SCHEDULED: prompt to open the control ──── */}
      {status === "SCHEDULED" && kickedOff && !readOnly && (
        <div className="px-6 pt-5">
          <div className="rounded-2xl border border-red-500/40 bg-red-500/[0.08] px-5 py-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
              <p className="text-sm font-black text-white uppercase tracking-tight">Match is starting</p>
            </div>
            <button onClick={() => goToPhase("FIRST_HALF")}
              className="px-6 py-2.5 rounded-xl bg-red-600 text-white font-black text-[11px] uppercase tracking-widest hover:bg-red-500 shadow-lg shadow-red-500/20 transition-all">
              ▶ Open Live
            </button>
          </div>
        </div>
      )}

      {/* Everything below (phase machine, scoreboard controls, event entry) is
          GATED behind the control being unlocked (kicked off / live / ended). */}
      {controlUnlocked && (
        <>
          {/* PHASE INDICATOR */}
          <div className="px-6 pt-5">
            <div className="flex items-center gap-1">
              {reachablePhaseIds.map((pid) => {
                const p = phaseDef(pid);
                const active = phase === pid;
                const done = phaseIndex(pid) < phaseIndex(phase);
                return (
                  <div key={pid} className="flex-1 flex flex-col items-center gap-1 min-w-0">
                    <div className={`w-full h-1.5 rounded-full transition-all ${active ? "bg-emerald-500" : done ? "bg-emerald-700" : "bg-slate-800"}`} />
                    <span className={`text-[8px] font-black uppercase tracking-wider truncate w-full text-center ${active ? "text-emerald-400" : done ? "text-emerald-600" : "text-slate-600"}`}>{p.short}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* scoreboard + LIVE CLOCK */}
          <div className="px-6 py-6">
            <div className="flex items-center justify-between gap-4">
              <div className="flex flex-col items-center gap-2 w-40">
                <Crest url={homeCrest} fallback={home?.crest || "🛡️"} />
                <span className="text-sm font-black text-slate-100 text-center leading-tight">{homeName}</span>
              </div>
              <div className="flex flex-col items-center">
                <div className="flex items-center gap-4 text-6xl font-black text-white tabular-nums">
                  <span>{hs}</span><span className="text-slate-600 text-3xl">:</span><span>{as}</span>
                </div>
                {isKnockout && (phase === "PENALTIES" || pens.home || pens.away) ? (
                  <div className="mt-1 text-[12px] font-black text-amber-300 tabular-nums">Pens {pens.home} : {pens.away}</div>
                ) : null}
                {/* Running match clock + phase label */}
                <div className={`mt-2 flex items-center gap-2 text-[11px] font-black uppercase tracking-widest ${ended ? "text-slate-500" : isLive ? "text-red-400" : "text-emerald-400"}`}>
                  {isLive && def.playing && (
                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-red-500/10 border border-red-500/30 tabular-nums">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" /> {liveClockText}
                    </span>
                  )}
                  <span>{ended ? "Full Time" : phaseLabelOf(phase)}</span>
                  {def.playing && (stoppage[phase] || 0) > 0 && (
                    <span className="text-amber-300">+{stoppage[phase]}'</span>
                  )}
                </div>
              </div>
              <div className="flex flex-col items-center gap-2 w-40">
                <Crest url={awayCrest} fallback="🛡️" />
                <span className="text-sm font-black text-slate-100 text-center leading-tight">{awayName}</span>
              </div>
            </div>

            {/* ── PHASE-MACHINE CONTROLS (staff only) ─────────────────── */}
            {!ended && !readOnly && (
              <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-900/40 p-4">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                    Phase · <span className="text-emerald-400">{phaseLabelOf(phase)}</span>
                  </p>
                  {/* Stoppage (added) time control — only for playing phases */}
                  {def.playing && (
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">Stoppage</span>
                      <button onClick={() => addStoppage(-1)} className="w-7 h-7 rounded-lg bg-slate-800 text-slate-300 font-black hover:bg-slate-700">−</button>
                      <span className="w-8 text-center text-sm font-black text-amber-300 tabular-nums">+{stoppage[phase] || 0}</span>
                      <button onClick={() => addStoppage(1)} className="w-7 h-7 rounded-lg bg-amber-500/20 border border-amber-500/40 text-amber-300 font-black hover:bg-amber-500/30">+</button>
                    </div>
                  )}
                </div>

                {/* Advance / phase-specific actions */}
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  {phase === "FIRST_HALF" && (
                    <button onClick={() => goToPhase("HALF_TIME")} className="px-4 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-200 text-[10px] font-black uppercase tracking-widest hover:border-slate-600">⏸ End 1st Half</button>
                  )}
                  {phase === "HALF_TIME" && (
                    <button onClick={() => goToPhase("SECOND_HALF")} className="px-4 py-2 rounded-lg bg-emerald-600 text-white text-[10px] font-black uppercase tracking-widest hover:bg-emerald-500">▶ Start 2nd Half</button>
                  )}
                  {phase === "SECOND_HALF" && (
                    <button onClick={() => goToPhase("FULL_TIME")} className="px-4 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-200 text-[10px] font-black uppercase tracking-widest hover:border-slate-600">⏹ End 2nd Half (Full Time)</button>
                  )}
                  {phase === "FULL_TIME" && isKnockout && level && (
                    <button onClick={() => goToPhase("EXTRA_FIRST")} className="px-4 py-2 rounded-lg bg-amber-500 text-slate-950 text-[10px] font-black uppercase tracking-widest hover:bg-amber-400">▶ Start Extra Time</button>
                  )}
                  {phase === "EXTRA_FIRST" && (
                    <button onClick={() => goToPhase("EXTRA_HALFTIME")} className="px-4 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-200 text-[10px] font-black uppercase tracking-widest hover:border-slate-600">⏸ End ET 1st Half</button>
                  )}
                  {phase === "EXTRA_HALFTIME" && (
                    <button onClick={() => goToPhase("EXTRA_SECOND")} className="px-4 py-2 rounded-lg bg-emerald-600 text-white text-[10px] font-black uppercase tracking-widest hover:bg-emerald-500">▶ Start ET 2nd Half</button>
                  )}
                  {phase === "EXTRA_SECOND" && isKnockout && level && (
                    <button onClick={() => goToPhase("PENALTIES")} className="px-4 py-2 rounded-lg bg-amber-500 text-slate-950 text-[10px] font-black uppercase tracking-widest hover:bg-amber-400">🥅 Go to Penalties</button>
                  )}

                  {/* END GAME — allowed at FULL_TIME (or whenever not needing a winner) */}
                  <button onClick={finishMatch} disabled={ended || needsWinner || busy}
                    className={`ml-auto px-5 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest border transition-all ${needsWinner ? "bg-slate-900/50 border-slate-800 text-slate-700 cursor-not-allowed" : "bg-rose-600 border-rose-600 text-white hover:bg-rose-500"}`}
                    title={needsWinner ? "Knockout is level — decide a winner first" : "End the match and save the result"}>
                    ⏹ End Game
                  </button>
                </div>

                {needsWinner && (phase === "FULL_TIME" || phase === "EXTRA_SECOND") && (
                  <p className="mt-2 text-[10px] font-bold text-amber-300/80">Scores are level in a knockout tie — extra time, then penalties, must decide a winner.</p>
                )}
              </div>
            )}
          </div>

          {/* SENT-OFF / SUSPENSION BANNER */}
          {sentOffList.length > 0 && (
            <div className="px-6 pb-2">
              <div className="rounded-2xl border border-rose-500/30 bg-rose-500/[0.06] px-4 py-3">
                <p className="text-[10px] font-black uppercase tracking-widest text-rose-300 flex items-center gap-2">🟥 Sent off · {sentOffList.length}</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {sentOffList.map(s => (
                    <div key={s.kc} className={`flex items-center gap-2 rounded-lg border px-2.5 py-1.5 ${s.reEnabled ? "border-slate-700 bg-slate-900/60" : "border-rose-500/40 bg-rose-500/10"}`}>
                      <PlayerFace photoUrl={playerByKc(s.kc)?.photoUrl} name={s.name} sport="Football" size={22} rounded="rounded-md" className={s.reEnabled ? "" : "grayscale"} />
                      <span className={`text-[11px] font-bold ${s.reEnabled ? "text-slate-300" : "text-rose-200 line-through"}`}>{s.name}</span>
                      {s.reEnabled
                        ? <span className="text-[8px] font-black uppercase tracking-widest text-emerald-400">re-enabled</span>
                        : !readOnly
                          ? <button onClick={() => reEnablePlayer(s.kc)} className="text-[8px] font-black uppercase tracking-widest text-rose-300 hover:text-white border border-rose-500/40 rounded px-1.5 py-0.5 hover:bg-rose-600 transition-all">Re-enable</button>
                          : null}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* KNOCKOUT PENALTY SHOOTOUT (staff only) */}
          {isKnockout && !ended && phase === "PENALTIES" && !readOnly && (
            <div className="px-6 pb-2">
              <div className="rounded-2xl border border-amber-500/30 bg-amber-500/[0.06] px-4 py-3.5">
                <p className="text-[11px] font-black uppercase tracking-widest text-amber-300 flex items-center gap-2">🥅 Penalty Shootout — alternate takers</p>
                <div className="mt-2 grid grid-cols-2 gap-3">
                  {["HOME", "AWAY"].map(s => (
                    <div key={s} className="rounded-xl border border-slate-800 bg-slate-950/60 p-3">
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-300 text-center truncate">{s === "HOME" ? homeName : awayName}</p>
                      <p className="text-center text-2xl font-black text-amber-300 tabular-nums my-1">{s === "HOME" ? pens.home : pens.away}</p>
                      <div className="flex gap-2">
                        <button onClick={() => addPenaltyKick(s, true)} disabled={busy} className="flex-1 py-1.5 rounded-lg bg-emerald-600 text-white text-[10px] font-black uppercase tracking-widest hover:bg-emerald-500 disabled:opacity-50">Scored</button>
                        <button onClick={() => addPenaltyKick(s, false)} disabled={busy} className="flex-1 py-1.5 rounded-lg bg-slate-800 text-slate-300 text-[10px] font-black uppercase tracking-widest hover:bg-rose-600 hover:text-white disabled:opacity-50">Missed</button>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-3 flex items-center justify-center gap-2 flex-wrap">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Shootout winner:</span>
                  {["HOME", "AWAY"].map(s => (
                    <button key={s} onClick={() => decideShootout(s)}
                      className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest border transition-all ${shootoutWinner === s ? "bg-amber-500 border-amber-500 text-slate-950" : "bg-slate-900/50 border-slate-800 text-slate-400 hover:border-amber-500/50"}`}>
                      {s === "HOME" ? homeName : awayName}
                    </button>
                  ))}
                </div>
                {shootoutWinner && (
                  <button onClick={finishMatch} className="mt-3 w-full py-2.5 rounded-lg bg-emerald-600 text-white text-[11px] font-black uppercase tracking-widest hover:bg-emerald-500 transition-all">⏹ Confirm Winner &amp; End Game</button>
                )}
              </div>
            </div>
          )}

          {/* ── SUBSTITUTIONS (staff only) ──────────────────────────── */}
          {!ended && phase !== "PENALTIES" && !readOnly && (
            <div className="px-6 pb-2 pt-3">
              <div className={`rounded-2xl border px-4 py-3.5 ${forcedInjurySub ? "border-rose-500/40 bg-rose-500/[0.07]" : "border-sky-500/30 bg-sky-500/[0.06]"}`}>
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <p className={`text-[11px] font-black uppercase tracking-widest flex items-center gap-2 ${forcedInjurySub ? "text-rose-300" : "text-sky-300"}`}>
                    🔁 Substitutions
                    {forcedInjurySub
                      ? <span className="text-[9px] font-black uppercase tracking-widest text-rose-300 border border-rose-500/40 rounded px-1.5 py-0.5 bg-rose-500/10">Forced · injury</span>
                      : <span className={`text-[9px] font-black tabular-nums px-1.5 py-0.5 rounded border ${subsLimitReached ? "text-rose-300 border-rose-500/40 bg-rose-500/10" : "text-sky-200 border-sky-500/40 bg-sky-500/10"}`}>
                          {Number.isFinite(subsAllowed) ? `${subsUsed}/${subsAllowed} used` : `${subsUsed} made · unlimited`}
                        </span>}
                  </p>
                  {!showSub && !forcedInjurySub && (
                    <button
                      onClick={() => { setShowSub(true); setErr(""); }}
                      disabled={subsLimitReached || subInCandidates.length === 0 || subOutCandidates.length === 0}
                      title={subsLimitReached ? `No substitutions left — ${subsUsed}/${subsAllowed} used` : subInCandidates.length === 0 ? "No bench players available" : "Make a substitution"}
                      className="px-3 py-1.5 rounded-lg bg-sky-600 text-white text-[10px] font-black uppercase tracking-widest hover:bg-sky-500 disabled:opacity-40 disabled:cursor-not-allowed transition-all">
                      + Make a sub
                    </button>
                  )}
                </div>

                {forcedInjurySub && (
                  <p className="mt-2 text-[11px] font-bold text-rose-200/90 leading-snug">
                    {forcedInjurySub.name} is injured and must come off — pick a replacement to bring on. (Injury subs are always allowed.)
                  </p>
                )}

                {(showSub || forcedInjurySub) && (
                  <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* ── COMING OFF · separate table of players ON the pitch ── */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[9px] font-black text-rose-400 uppercase tracking-widest">Coming off ▼ · on pitch</label>
                      {forcedInjurySub ? (
                        <div className="bg-slate-900/60 border border-rose-500/40 rounded-lg px-3 py-2 text-sm text-rose-200 font-bold truncate">🩹 {forcedInjurySub.name}</div>
                      ) : (
                        <div className="rounded-lg border border-slate-800 bg-slate-950/60 max-h-44 overflow-y-auto divide-y divide-slate-800/70">
                          {subOutCandidates.length === 0 ? (
                            <p className="text-[11px] text-slate-600 italic px-3 py-2.5">No players on the pitch.</p>
                          ) : subOutCandidates.map(p => {
                            const sel = subOutKc === p.keycloakId;
                            return (
                              <button key={p.id} type="button" onClick={() => setSubOutKc(p.keycloakId)}
                                className={`w-full flex items-center gap-2.5 px-3 py-2 text-left transition-all ${sel ? "bg-rose-500/15" : "hover:bg-slate-900/60"}`}>
                                <PlayerFace photoUrl={p.photoUrl} name={`${p.firstName} ${p.lastName}`} sport="Football" size={26} rounded="rounded-lg" />
                                <div className="min-w-0 flex-1">
                                  <p className={`text-[12px] font-bold truncate ${sel ? "text-rose-200" : "text-slate-200"}`}>{p.firstName} {p.lastName}</p>
                                  <p className="text-[9px] text-slate-500 truncate">#{p.kitNumber ?? "—"}</p>
                                </div>
                                {sel && <span className="text-rose-400 text-xs">▼</span>}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                    {/* ── COMING ON · separate table of available BENCH players ── */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[9px] font-black text-emerald-400 uppercase tracking-widest">Coming on ▲ · bench / available</label>
                      <div className="rounded-lg border border-slate-800 bg-slate-950/60 max-h-44 overflow-y-auto divide-y divide-slate-800/70">
                        {subInCandidates.length === 0 ? (
                          <p className="text-[11px] text-slate-600 italic px-3 py-2.5">No bench players available.</p>
                        ) : subInCandidates.map(p => {
                          const sel = subInKc === p.keycloakId;
                          return (
                            <button key={p.id} type="button" onClick={() => setSubInKc(p.keycloakId)}
                              className={`w-full flex items-center gap-2.5 px-3 py-2 text-left transition-all ${sel ? "bg-emerald-500/15" : "hover:bg-slate-900/60"}`}>
                              <PlayerFace photoUrl={p.photoUrl} name={`${p.firstName} ${p.lastName}`} sport="Football" size={26} rounded="rounded-lg" />
                              <div className="min-w-0 flex-1">
                                <p className={`text-[12px] font-bold truncate ${sel ? "text-emerald-200" : "text-slate-200"}`}>{p.firstName} {p.lastName}</p>
                                <p className="text-[9px] text-slate-500 truncate">#{p.kitNumber ?? "—"}</p>
                              </div>
                              {sel && <span className="text-emerald-400 text-xs">▲</span>}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                    <div className="sm:col-span-2 flex items-center gap-2">
                      <button onClick={performSub} disabled={busy}
                        className="flex-1 py-2.5 rounded-lg bg-sky-600 text-white text-[11px] font-black uppercase tracking-widest hover:bg-sky-500 shadow-lg shadow-sky-500/20 transition-all disabled:opacity-50">
                        {busy ? "Recording…" : forcedInjurySub ? "🩹 Bring on replacement" : "🔁 Confirm substitution"}
                      </button>
                      {!forcedInjurySub && (
                        <button onClick={() => { setShowSub(false); setSubOutKc(""); setSubInKc(""); setErr(""); }} disabled={busy}
                          className="px-4 py-2.5 rounded-lg border border-slate-700 text-slate-400 text-[11px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all disabled:opacity-50">
                          Cancel
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* MANUAL EVENT BUILDER — staff only, while live (not at FT/ended) */}
          {!ended && !readOnly && (
            <div className="px-6 pb-2 pt-3">
              <p className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.25em] mb-3">Add Match Event · <span className="text-slate-500">{phaseLabelOf(phase)}</span></p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Team</label>
                  <select value={side} onChange={e => { setSide(e.target.value); setPlayerKc(""); }} className="bg-slate-900/60 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 outline-none focus:border-emerald-500">
                    <option value="HOME" className="bg-slate-950">{homeName}</option>
                    <option value="AWAY" className="bg-slate-950">{awayName}</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Event</label>
                  <select value={eventType} onChange={e => setEventType(e.target.value)} className="bg-slate-900/60 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 outline-none focus:border-emerald-500">
                    {EVENT_TYPES.filter(e => !e.excludeFromPicker).map(e => <option key={e.v} value={e.v} className="bg-slate-950">{e.icon} {e.label}</option>)}
                  </select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">
                    Minute{minuteRange ? <span className="text-slate-600 normal-case tracking-normal"> · {minuteRange.min}–{minuteRange.max}</span> : ""}
                  </label>
                  <div className="flex gap-1">
                    <input type="number"
                      min={minuteRange ? minuteRange.min : 0}
                      max={minuteRange ? minuteRange.max : 130}
                      disabled={!minuteRange}
                      title={minuteRange ? `Allowed ${minuteRange.min}–${minuteRange.max}' during ${phaseLabelOf(phase)}` : "No minute in this phase"}
                      value={minute}
                      onChange={e => { minuteTouched.current = true; setMinute(e.target.value); }}
                      className="w-full bg-slate-900/60 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 outline-none focus:border-emerald-500 disabled:opacity-50" />
                    <input type="number" min={0} placeholder="+" title="Extra time" value={extraTime} onChange={e => setExtraTime(e.target.value)} className="w-12 bg-slate-900/60 border border-slate-800 rounded-lg px-2 py-2 text-sm text-slate-200 outline-none focus:border-emerald-500" />
                  </div>
                </div>
                <div className="flex flex-col gap-1.5 col-span-2 sm:col-span-2">
                  <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Player{eventType === "INJURY" ? <span className="text-rose-400"> · required</span> : ""}</label>
                  <select value={playerKc} onChange={e => setPlayerKc(e.target.value)} className="bg-slate-900/60 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 outline-none focus:border-emerald-500">
                    <option value="" className="bg-slate-950">{side === "AWAY" ? "Opponent player (optional)" : eventType === "INJURY" ? "Select injured player…" : "Select player…"}</option>
                    {side === "HOME" && eventPickerPlayers.map(p => {
                      const hurt = injuredKc.has(p.keycloakId);
                      const off = isUnavailable(p.keycloakId);
                      const subbed = subbedOffKc.has(p.keycloakId);
                      const yc = yellowCount[p.keycloakId] || 0;
                      const flag = hurt ? "🩹 " : off ? "🟥 " : subbed ? "🔁 " : yc === 1 ? "🟨 " : "";
                      const tail = hurt ? " (injured)" : off ? " (sent off)" : subbed ? " (subbed off)" : "";
                      return <option key={p.id} value={p.keycloakId} disabled={off || hurt || subbed} className="bg-slate-950">{flag}{p.firstName} {p.lastName} · #{p.kitNumber ?? "—"}{tail}</option>;
                    })}
                  </select>
                </div>
                {eventType !== "INJURY" && (
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Note</label>
                    <input value={description} onChange={e => setDescription(e.target.value)} placeholder="optional" className="bg-slate-900/60 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 outline-none focus:border-emerald-500" />
                  </div>
                )}
              </div>

              {/* ── INJURY SUB-FORM: real injury type + body part + severity ─── */}
              {eventType === "INJURY" && (
                <div className="mt-3 rounded-2xl border border-rose-500/30 bg-rose-500/[0.06] px-4 py-3.5">
                  <p className="text-[10px] font-black uppercase tracking-widest text-rose-300 flex items-center gap-2 mb-3">🩹 Injury details</p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Injury Type</label>
                      <select value={injuryType} onChange={e => setInjuryType(e.target.value)} className="bg-slate-900/60 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 outline-none focus:border-rose-500">
                        {INJURY_TYPES.map(t => <option key={t} value={t} className="bg-slate-950">{prettyEnum(t)}</option>)}
                      </select>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Severity</label>
                      <select value={injurySeverity} onChange={e => setInjurySeverity(e.target.value)} className="bg-slate-900/60 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 outline-none focus:border-rose-500">
                        {INJURY_SEVERITY.map(s => <option key={s} value={s} className="bg-slate-950">{prettyEnum(s)}</option>)}
                      </select>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Body Part</label>
                      <input value={bodyPart} onChange={e => setBodyPart(e.target.value)} placeholder="e.g. Right hamstring" className="bg-slate-900/60 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 outline-none focus:border-rose-500" />
                    </div>
                  </div>
                  <p className="mt-2.5 text-[10px] font-bold text-rose-300/70 leading-snug">Records an injury (status REPORTED), flips the player to INJURED so he can't be picked for upcoming matches, and shows him in Medical.</p>
                </div>
              )}
              {err && <p className="mt-2 text-[11px] font-bold text-red-400">{err}</p>}
              <button onClick={addEvent} disabled={busy || ended}
                className="mt-4 w-full py-3 rounded-xl bg-emerald-600 text-white font-black text-xs uppercase tracking-widest hover:bg-emerald-500 shadow-lg shadow-emerald-500/20 transition-all disabled:opacity-50">
                {busy ? "Recording…" : `+ Record ${eventMeta(eventType).label}`}
              </button>
            </div>
          )}

          {/* TIMELINE */}
          <div className="px-6 py-5">
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.25em] mb-3">Timeline · {events.length}</p>
            <div className="max-h-72 overflow-y-auto space-y-2 pr-1">
              {events.length === 0 ? (
                <p className="text-center text-[11px] text-slate-600 italic py-6">No events yet — record the first one above.</p>
              ) : events.map((e) => {
                const meta = eventMeta(e.eventType);
                const shoot = isShootout(e);
                const isHome = e.side ? e.side === "HOME" : shoot ? !shootoutIsAway(e, awayName) : true;
                const who = e.playerKeycloakId ? playerNameByKc(e.playerKeycloakId) : (isHome ? homeName : awayName);
                const note = String(e.description || "").replace(/\[[^\]]*\]/g, "").trim();
                const isRed = e.eventType === "RED_CARD";
                const isHurt = e.eventType === "INJURY";
                return (
                  <div key={e.id} className={`flex items-center gap-3 rounded-xl border px-3 py-2.5 ${shoot ? "border-amber-500/30 bg-amber-500/[0.06]" : (isRed || isHurt) ? "border-rose-500/30 bg-rose-500/[0.06]" : SCORING.has(e.eventType) ? "border-emerald-500/30 bg-emerald-500/[0.06]" : "border-slate-800 bg-slate-900/40"}`}>
                    <span className="text-[11px] font-black text-slate-400 tabular-nums w-12 text-center">
                      {shoot ? "PEN" : `${e.minute}'${e.extraTime ? `+${e.extraTime}` : ""}`}
                    </span>
                    <span className="text-lg">{meta.icon}</span>
                    {e.playerKeycloakId ? <PlayerFace photoUrl={playerByKc(e.playerKeycloakId)?.photoUrl} name={who} sport="Football" size={26} rounded="rounded-lg" /> : null}
                    <div className="min-w-0">
                      <p className={`text-sm font-bold truncate ${(isRed || isHurt) ? "text-rose-200" : "text-slate-200"}`}>{who}</p>
                      <p className="text-[10px] font-black uppercase tracking-wider text-slate-500">{shoot ? "Shootout · " : ""}{meta.label}{note ? ` · ${note}` : ""}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );

  if (embedded) return panel;

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center z-[120] p-4 overflow-y-auto" onClick={e => e.target === e.currentTarget && onClose?.()}>
      <div className="my-8 w-full max-w-3xl">{panel}</div>
    </div>
  );
}
