"use client";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { api } from "@/src/lib/api";
import { lookupTeam } from "@/src/lib/teamDirectory";
import { resolveSportUpper } from "@/src/lib/playerSport";
import PlayerFace from "@/src/components/matches/PlayerFace";
import { resolveCompetitionKind, COMPETITION_KIND } from "@/src/components/matches/competitionTypes";
import { parseFixtureSource } from "@/src/components/matches/fixtureSource";
import {
  hasKickedOff, elapsedMinute, countdownLabel,
  PHASE_ORDER, phaseDef, phaseLabelOf, phaseIndex,
  autoPhaseForMinute, phaseClockLabel, phaseElapsed, phaseForStoredMinute,
} from "@/src/components/matches/liveClock";

const BARCA_CREST = "https://crests.football-data.org/81.png";

// Backend MatchEvent enum — wrong values 400. GOAL / penalties increment score.
const EVENT_TYPES = [
  { v: "GOAL", icon: "⚽", label: "Goal", score: true },
  { v: "ASSIST", icon: "🅰️", label: "Assist" },
  { v: "PENALTY_SCORED", icon: "🥅", label: "Penalty Scored", score: true },
  { v: "PENALTY_MISSED", icon: "❌", label: "Penalty Missed" },
  { v: "OWN_GOAL", icon: "🔴", label: "Own Goal", score: true, away: true },
  { v: "YELLOW_CARD", icon: "🟨", label: "Yellow Card" },
  { v: "RED_CARD", icon: "🟥", label: "Red Card" },
  { v: "SUBSTITUTION", icon: "🔁", label: "Substitution" },
  { v: "CORNER_KICK", icon: "🚩", label: "Corner" },
  { v: "FREE_KICK", icon: "🎯", label: "Free Kick" },
  { v: "OFFSIDE", icon: "🚫", label: "Offside" },
  { v: "VAR_REVIEW", icon: "📺", label: "VAR Review" },
];
const SCORING = new Set(["GOAL", "PENALTY_SCORED", "OWN_GOAL"]);

const SHOOTOUT_TAG = "[SHOOTOUT]";
const SUMMARY_PEN = "Won on penalties";

// matchType values that mean "a winner is required" even if the competition
// name doesn't classify as knockout (CUP / PLAYOFF / TOURNAMENT knockout rounds).
const KNOCKOUT_MATCH_TYPES = new Set(["CUP", "PLAYOFF", "PLAY_OFF", "TOURNAMENT", "KNOCKOUT"]);

const unwrapArr = (r) => r?.data || r?.content || (Array.isArray(r) ? r : []);
const eventMeta = (v) => EVENT_TYPES.find(e => e.v === v) || { icon: "•", label: v };
const isShootout = (e) => String(e?.description || "").includes(SHOOTOUT_TAG);
const shootoutIsAway = (e, awayName) => String(e?.description || "").includes(`${SHOOTOUT_TAG} ${awayName}`);

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
  // Knockout if: the competition resolves to knockout, OR matchType is a knockout
  // kind (CUP/PLAYOFF/TOURNAMENT), OR competitionType was stored as KNOCKOUT.
  const isKnockout =
    compKind === COMPETITION_KIND.KNOCKOUT ||
    KNOCKOUT_MATCH_TYPES.has(matchTypeUpper) ||
    compTypeUpper === "KNOCKOUT";

  const squad = useMemo(
    () => players.filter(p => resolveSportUpper(p.preferredPosition) === sportUpper),
    [players, sportUpper]
  );

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

  // Load existing events; reconstruct phase, penalties, cards & sent-off state.
  useEffect(() => {
    (async () => {
      try {
        const all = unwrapArr(await api.getMatchEvents()).filter(e => String(e.matchId) === String(match.id));

        let ph = 0, pa = 0;
        const yc = {}; const off = new Set();
        all.forEach(e => {
          if (isShootout(e) && e.eventType === "PENALTY_SCORED") { if (shootoutIsAway(e, awayName)) pa++; else ph++; }
          if (e.playerKeycloakId && e.eventType === "YELLOW_CARD") {
            yc[e.playerKeycloakId] = (yc[e.playerKeycloakId] || 0) + 1;
            if (yc[e.playerKeycloakId] >= 2) off.add(e.playerKeycloakId);
          }
          if (e.playerKeycloakId && e.eventType === "RED_CARD") off.add(e.playerKeycloakId);
        });
        setPens({ home: ph, away: pa });
        setYellowCount(yc);
        setSentOff(off);

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
      api.updateMatch(match.id, { homeTeamScore: hs, awayTeamScore: as, status: "LIVE" }).catch(() => {});
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

  // Default the recording minute to the live clock while in a running half.
  useEffect(() => {
    if (!minuteTouched.current && isLive && def.playing) {
      setMinute(def.base + Math.floor(phaseMin));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phaseMin, isLive, phase]);

  const playerByKc = (kc) => squad.find(x => x.keycloakId === kc) || players.find(x => x.keycloakId === kc);
  const playerNameByKc = (kc) => { const p = playerByKc(kc); return p ? `${p.firstName} ${p.lastName}` : "Squad player"; };

  const persist = (patch) =>
    api.updateMatch(match.id, { homeTeamScore: hs, awayTeamScore: as, status, ...patch }).catch(() => {});

  const level = hs === as;
  const needsWinner = isKnockout && level && !shootoutWinner;

  const isUnavailable = (kc) => sentOff.has(kc) && !reEnabled.has(kc);
  const reEnablePlayer = (kc) => setReEnabled(prev => { const n = new Set(prev); n.add(kc); return n; });

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

  const addEvent = async () => {
    setErr("");
    if (!controlUnlocked) { setErr("Control opens at kickoff."); return; }
    if (playerKc && isUnavailable(playerKc)) { setErr("That player is sent off — re-enable him first."); return; }
    const m = Number(minute);
    if (!Number.isFinite(m) || m < 0) { setErr("Enter a valid minute"); return; }
    setBusy(true);
    try {
      const tag = `[${phaseLabelOf(phase)}]`;
      const desc = [tag, description].filter(Boolean).join(" ");
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
              <span className="text-[11px] font-black uppercase tracking-widest text-slate-400">Live control opens at kickoff</span>
            </div>
            <label className="mt-5 flex items-center justify-center gap-2 cursor-pointer select-none">
              <input type="checkbox" checked={autoOpen} onChange={e => setAutoOpen(e.target.checked)} className="w-4 h-4 accent-emerald-500" />
              <span className="text-[11px] font-bold text-slate-400">Auto-go-live when it starts</span>
            </label>
          </div>
        </div>
      )}

      {/* ── KICKED OFF but still SCHEDULED: prompt to open the control ──── */}
      {status === "SCHEDULED" && kickedOff && (
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

            {/* ── PHASE-MACHINE CONTROLS ──────────────────────────────── */}
            {!ended && (
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
                        : <button onClick={() => reEnablePlayer(s.kc)} className="text-[8px] font-black uppercase tracking-widest text-rose-300 hover:text-white border border-rose-500/40 rounded px-1.5 py-0.5 hover:bg-rose-600 transition-all">Re-enable</button>}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* KNOCKOUT PENALTY SHOOTOUT */}
          {isKnockout && !ended && phase === "PENALTIES" && (
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

          {/* MANUAL EVENT BUILDER — only while live (not at FT/ended) */}
          {!ended && (
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
                    {EVENT_TYPES.map(e => <option key={e.v} value={e.v} className="bg-slate-950">{e.icon} {e.label}</option>)}
                  </select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Minute</label>
                  <div className="flex gap-1">
                    <input type="number" min={0} max={130} value={minute} onChange={e => { minuteTouched.current = true; setMinute(e.target.value); }} className="w-full bg-slate-900/60 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 outline-none focus:border-emerald-500" />
                    <input type="number" min={0} placeholder="+" title="Extra time" value={extraTime} onChange={e => setExtraTime(e.target.value)} className="w-12 bg-slate-900/60 border border-slate-800 rounded-lg px-2 py-2 text-sm text-slate-200 outline-none focus:border-emerald-500" />
                  </div>
                </div>
                <div className="flex flex-col gap-1.5 col-span-2 sm:col-span-2">
                  <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Player</label>
                  <select value={playerKc} onChange={e => setPlayerKc(e.target.value)} className="bg-slate-900/60 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 outline-none focus:border-emerald-500">
                    <option value="" className="bg-slate-950">{side === "AWAY" ? "Opponent player (optional)" : "Select player…"}</option>
                    {side === "HOME" && lineupPlayers.map(p => {
                      const off = isUnavailable(p.keycloakId);
                      const yc = yellowCount[p.keycloakId] || 0;
                      return <option key={p.id} value={p.keycloakId} disabled={off} className="bg-slate-950">{off ? "🟥 " : yc === 1 ? "🟨 " : ""}{p.firstName} {p.lastName} · #{p.kitNumber ?? "—"}{off ? " (sent off)" : ""}</option>;
                    })}
                  </select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Note</label>
                  <input value={description} onChange={e => setDescription(e.target.value)} placeholder="optional" className="bg-slate-900/60 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 outline-none focus:border-emerald-500" />
                </div>
              </div>
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
                return (
                  <div key={e.id} className={`flex items-center gap-3 rounded-xl border px-3 py-2.5 ${shoot ? "border-amber-500/30 bg-amber-500/[0.06]" : isRed ? "border-rose-500/30 bg-rose-500/[0.06]" : SCORING.has(e.eventType) ? "border-emerald-500/30 bg-emerald-500/[0.06]" : "border-slate-800 bg-slate-900/40"}`}>
                    <span className="text-[11px] font-black text-slate-400 tabular-nums w-12 text-center">
                      {shoot ? "PEN" : `${e.minute}'${e.extraTime ? `+${e.extraTime}` : ""}`}
                    </span>
                    <span className="text-lg">{meta.icon}</span>
                    {e.playerKeycloakId ? <PlayerFace photoUrl={playerByKc(e.playerKeycloakId)?.photoUrl} name={who} sport="Football" size={26} rounded="rounded-lg" /> : null}
                    <div className="min-w-0">
                      <p className={`text-sm font-bold truncate ${isRed ? "text-rose-200" : "text-slate-200"}`}>{who}</p>
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
