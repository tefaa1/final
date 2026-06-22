"use client";

import React, { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  FiEdit2,
  FiCheck,
  FiX,
  FiCalendar,
  FiFilter,
  FiCheckCircle,
  FiLock,
  FiPlayCircle,
  FiArrowRight,
} from "react-icons/fi";
import { TeamCrest } from "./TeamPicker";
import { isPlayed, KO_ROUND_LABEL, isKnockoutRound } from "./store";
import {
  fmtPlayedDateTime,
  toDateTimeLocal,
  defaultDateTimeLocal,
  toPlayedAtPayload,
} from "./matchDate";

// ── FC Barcelona detection ───────────────────────────────────────────────────
// A fixture INVOLVING FC Barcelona (home OR away) is NOT entered inline. Instead
// the admin is routed FORWARD into the real match-creation flow, pre-pointed at
// this fixture, so they play it like any other match and the result flows back
// to the competition table via the [FIXTURE comp=.. fix=..] notes tag.
const BARCA_NAMES = ["barcelona", "barça", "barca", "fc barcelona"];
const isBarcaName = (name) =>
  BARCA_NAMES.some((n) => String(name || "").toLowerCase().includes(n));

// Pull a usable crest URL off a resolved team object (the DB stores badge URLs
// on `crestUrl`; emoji-only crests have no URL and are simply omitted).
const crestOf = (team) => (team && team.crestUrl ? String(team.crestUrl) : "");

// Carry the fixture context FORWARD to /dashboard/matches/new using the shared
// DEEP-LINK CONTRACT. FC BARCELONA IS ALWAYS THE HOME SIDE in the created match,
// so if Barça is the AWAY team in this fixture we SWAP the two sides here. The
// matches flow reads:
//   fromComp=<competitionId>  fixId=<fixtureId>
//   homeName / homeCrest / awayName / awayCrest
//   kickoff=<iso>             ko=<0 league | 1 knockout tie>
// and stamps comp+fix back so the played score writes to THIS fixture.
function buildPlayMatchHref(compId, fixture, home, away) {
  // Decide which side is Barça → Barça must be home in the created match.
  const barcaIsHome = isBarcaName(home?.name);
  const homeSide = barcaIsHome ? home : away;
  const awaySide = barcaIsHome ? away : home;

  // Knockout tie? (CL knockout rounds) → ko=1, otherwise league/regular → ko=0.
  const ko = isKnockoutRound(fixture.round) ? "1" : "0";

  // Kickoff = the fixture's date, as a full ISO datetime ("…:00" seconds added).
  const kickoff = toPlayedAtPayload(toDateTimeLocal(fixture.playedAt));

  const params = new URLSearchParams();
  params.set("fromComp", String(compId));
  params.set("fixId", String(fixture.id));
  params.set("homeName", homeSide?.name || "");
  params.set("homeCrest", crestOf(homeSide));
  params.set("awayName", awaySide?.name || "");
  params.set("awayCrest", crestOf(awaySide));
  if (kickoff) params.set("kickoff", kickoff);
  params.set("ko", ko);
  return `/dashboard/matches/new?${params.toString()}`;
}

// ── grouping helpers ─────────────────────────────────────────────────────────
const KO_ORDER = ["PLAYOFFS", "LAST_16", "QUARTER_FINALS", "SEMI_FINALS", "FINAL"];

function groupLabel(f) {
  if (isKnockoutRound(f.round)) {
    const base = KO_ROUND_LABEL[f.round] || f.round;
    if (f.round !== "FINAL" && f.matchday != null) return `${base} · Leg ${f.matchday}`;
    return base;
  }
  return f.matchday != null ? `Matchday ${f.matchday}` : "Fixtures";
}

function sortKey(f) {
  if (isKnockoutRound(f.round)) {
    const ri = KO_ORDER.indexOf(f.round);
    return 1000 + ri * 10 + (f.matchday ?? 0);
  }
  return f.matchday ?? 0;
}

// ── one match row (read-only OR editable result entry with datetime) ─────────
function MatchRow({ fixture, teams, canEdit, onRecord, requireWinner, compId }) {
  const router = useRouter();
  const home = teams.find((t) => t.id === fixture.homeTeamId) || { name: fixture.homeName };
  const away = teams.find((t) => t.id === fixture.awayTeamId) || { name: fixture.awayName };
  const played = isPlayed(fixture);

  // A Barça fixture (home or away) is played through the real match-creation
  // flow, never inline. The "Play / Schedule" action only appears while the
  // fixture is UNPLAYED and editing is allowed (ongoing competition + admin).
  const barca = isBarcaName(home.name) || isBarcaName(away.name);
  const goPlayMatch = () =>
    router.push(buildPlayMatchHref(compId, fixture, home, away));

  const [editing, setEditing] = useState(false);
  const [hs, setHs] = useState(fixture.homeScore ?? "");
  const [as, setAs] = useState(fixture.awayScore ?? "");
  const [when, setWhen] = useState(toDateTimeLocal(fixture.playedAt) || defaultDateTimeLocal());
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState(false);
  const [errMsg, setErrMsg] = useState("");

  const homeWin = played && Number(fixture.homeScore) > Number(fixture.awayScore);
  const awayWin = played && Number(fixture.awayScore) > Number(fixture.homeScore);

  const startEdit = () => {
    setHs(fixture.homeScore ?? "");
    setAs(fixture.awayScore ?? "");
    setWhen(toDateTimeLocal(fixture.playedAt) || defaultDateTimeLocal());
    setErr(false);
    setErrMsg("");
    setEditing(true);
  };

  const save = async () => {
    if (hs === "" || as === "" || Number(hs) < 0 || Number(as) < 0) {
      setErr(true);
      setErrMsg("Enter two scores ≥ 0.");
      return;
    }
    if (!when) {
      setErr(true);
      setErrMsg("Pick the match date & time.");
      return;
    }
    if (requireWinner && Number(hs) === Number(as)) {
      setErr(true);
      setErrMsg("Knockout ties need a winner — no draws.");
      return;
    }
    setSaving(true);
    try {
      // Hand the result UP with the ISO datetime payload (seconds appended).
      await onRecord(fixture.id, Number(hs), Number(as), toPlayedAtPayload(when));
      setEditing(false);
      setErr(false);
      setErrMsg("");
    } catch {
      setErr(true);
      setErrMsg("Couldn't save — try again.");
    }
    setSaving(false);
  };

  // Barça rows get an on-brand emerald wash + left accent so they stand out as
  // "your club's matches you can go and play".
  const rowCls = barca
    ? "border-emerald-500/40 bg-gradient-to-r from-emerald-500/[0.08] to-transparent hover:border-emerald-500/60 ring-1 ring-emerald-500/10"
    : "border-slate-800/60 hover:border-slate-700";

  return (
    <div className={`flex items-center gap-2 bg-slate-950/40 border rounded-xl px-3 py-2.5 transition-colors ${rowCls}`}>
      {/* home */}
      <div className="flex items-center gap-2 min-w-0 flex-1 justify-end text-right">
        <span className={`text-xs truncate ${homeWin ? "font-black text-emerald-300" : isBarcaName(home.name) ? "font-black text-emerald-200" : "font-bold text-slate-200"}`}>
          {home.name}
        </span>
        <TeamCrest team={home} size={20} />
      </div>

      {/* centre: score / entry */}
      {editing ? (
        <div className="flex flex-col items-center gap-1.5 shrink-0">
          <div className="flex items-center gap-1">
            <input
              type="number"
              min="0"
              value={hs}
              onChange={(e) => setHs(e.target.value)}
              className={`w-11 text-center bg-slate-900 border rounded-lg px-1 py-1 text-xs text-slate-100 focus:outline-none ${err ? "border-rose-500/60" : "border-slate-700 focus:border-emerald-500/50"}`}
            />
            <span className="text-slate-600 font-black">–</span>
            <input
              type="number"
              min="0"
              value={as}
              onChange={(e) => setAs(e.target.value)}
              className={`w-11 text-center bg-slate-900 border rounded-lg px-1 py-1 text-xs text-slate-100 focus:outline-none ${err ? "border-rose-500/60" : "border-slate-700 focus:border-emerald-500/50"}`}
            />
            <button onClick={save} disabled={saving} className="text-emerald-400 hover:text-emerald-300 p-1 disabled:opacity-50" title="Save">
              <FiCheck size={15} />
            </button>
            <button onClick={() => { setEditing(false); setErr(false); setErrMsg(""); }} className="text-slate-500 hover:text-rose-400 p-1" title="Cancel">
              <FiX size={15} />
            </button>
          </div>
          {/* match date AND time — sent as ISO playedAt with the result */}
          <label className="flex items-center gap-1.5">
            <FiCalendar className="text-emerald-400/80 shrink-0" size={11} />
            <input
              type="datetime-local"
              value={when}
              onChange={(e) => setWhen(e.target.value)}
              className={`bg-slate-900 border rounded-lg px-2 py-1 text-[11px] text-slate-200 focus:outline-none [color-scheme:dark] ${err && !when ? "border-rose-500/60" : "border-slate-700 focus:border-emerald-500/50"}`}
            />
          </label>
          {err && errMsg && (
            <span className="text-[9px] font-bold text-rose-400 whitespace-nowrap">{errMsg}</span>
          )}
        </div>
      ) : played ? (
        <div className="flex flex-col items-center gap-0.5 shrink-0">
          <div className="flex items-center gap-1.5">
            <span className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-700 text-sm font-black tabular-nums text-slate-100">
              {fixture.homeScore}<span className="text-slate-600 mx-0.5">–</span>{fixture.awayScore}
            </span>
            {canEdit && (
              <button onClick={startEdit} className="text-slate-600 hover:text-emerald-300 p-1" title="Edit result">
                <FiEdit2 size={13} />
              </button>
            )}
          </div>
          {fixture.playedAt ? (
            <span className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider text-slate-500 whitespace-nowrap">
              <FiCalendar size={9} /> {fmtPlayedDateTime(fixture.playedAt)}
            </span>
          ) : (
            <span className="flex items-center gap-1 text-[8px] font-black uppercase tracking-[0.15em] text-amber-300/80">
              <FiCheckCircle size={8} /> Finished
            </span>
          )}
        </div>
      ) : (
        <div className="shrink-0">
          {canEdit && barca ? (
            // FC Barcelona fixture → DON'T enter inline. Route FORWARD into the
            // real match-creation flow, pre-pointed at this fixture. The score
            // written there flows back here via the [FIXTURE comp fix] tag.
            <button
              onClick={goPlayMatch}
              title="Play this match — opens the match scheduling flow pre-filled for this fixture"
              className="group flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-emerald-600 to-emerald-500 border border-emerald-400/50 text-white text-[10px] font-black uppercase tracking-wider hover:from-emerald-500 hover:to-emerald-400 shadow-lg shadow-emerald-500/20 transition-all active:scale-95"
            >
              <FiPlayCircle size={13} /> Play / Schedule
              <FiArrowRight size={11} className="opacity-70 group-hover:translate-x-0.5 transition-transform" />
            </button>
          ) : canEdit ? (
            <button
              onClick={startEdit}
              className="px-3 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-[10px] font-black uppercase tracking-wider hover:bg-emerald-500 hover:text-white transition-all"
            >
              Enter result
            </button>
          ) : (
            <span className="px-2.5 py-1 rounded-lg bg-slate-900/60 border border-slate-800 text-[10px] font-black uppercase tracking-wider text-slate-500">
              vs
            </span>
          )}
        </div>
      )}

      {/* away */}
      <div className="flex items-center gap-2 min-w-0 flex-1">
        <TeamCrest team={away} size={20} />
        <span className={`text-xs truncate ${awayWin ? "font-black text-emerald-300" : isBarcaName(away.name) ? "font-black text-emerald-200" : "font-bold text-slate-200"}`}>
          {away.name}
        </span>
      </div>
    </div>
  );
}

/**
 * Unified MATCH LIST with a per-team selector that filters EVERY match — played
 * results AND to-play fixtures alike — plus a status filter (All / To play /
 * Played). When `canEdit` + `onRecord` are supplied, unplayed (and played) rows
 * become editable with a datetime-local entry. One team selector, one list, used
 * by every competition section.
 */
export default function MatchList({
  teams = [],
  fixtures = [],
  canEdit = false,
  onRecord,
  requireWinner = false,
  showStatusFilter = true,
  // Competition id — carried FORWARD when routing a Barça fixture into the real
  // match-creation flow (so the played score writes back to the right fixture).
  compId,
  // When the competition is COMPLETE (every fixture played) results are locked
  // read-only: `canEdit` arrives false and we surface a clear "Completed" badge
  // instead of the "Results editable" affordance.
  finished = false,
}) {
  const [teamId, setTeamId] = useState("all");
  const [status, setStatus] = useState("all"); // all | todo | done

  const sortedTeams = useMemo(
    () => [...teams].sort((a, b) => String(a.name).localeCompare(String(b.name))),
    [teams]
  );

  const visible = useMemo(() => {
    let list = fixtures;
    if (teamId !== "all") {
      list = list.filter(
        (f) => `${f.homeTeamId}` === `${teamId}` || `${f.awayTeamId}` === `${teamId}`
      );
    }
    if (status !== "all") {
      list = list.filter((f) => (status === "done" ? isPlayed(f) : !isPlayed(f)));
    }
    return [...list].sort((a, b) => sortKey(a) - sortKey(b));
  }, [fixtures, teamId, status]);

  const grouped = useMemo(() => {
    const g = new Map();
    for (const f of visible) {
      const label = groupLabel(f);
      if (!g.has(label)) g.set(label, []);
      g.get(label).push(f);
    }
    return [...g.entries()].map(([label, items]) => ({ label, items }));
  }, [visible]);

  const selectedTeam = sortedTeams.find((t) => `${t.id}` === `${teamId}`);
  const total = fixtures.length;
  const doneAll = fixtures.filter(isPlayed).length;

  // Are there UNPLAYED Barça fixtures the admin can go and play? Used to surface
  // a small explainer so the green "Play / Schedule" buttons aren't a surprise.
  const teamName = (id, fb) => sortedTeams.find((t) => t.id === id)?.name || fb;
  const hasPlayableBarca =
    canEdit &&
    fixtures.some(
      (f) =>
        !isPlayed(f) &&
        (isBarcaName(teamName(f.homeTeamId, f.homeName)) ||
          isBarcaName(teamName(f.awayTeamId, f.awayName)))
    );

  if (total === 0) {
    return (
      <p className="text-xs text-slate-600 italic py-6 text-center">No fixtures generated yet.</p>
    );
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        {/* TEAM SELECTOR — present on every list, applies to all matches */}
        <div className="flex items-center gap-2">
          <FiFilter className="text-emerald-400 shrink-0" />
          <div className="relative">
            <select
              value={teamId}
              onChange={(e) => setTeamId(e.target.value)}
              className="appearance-none bg-slate-950/70 border border-slate-700 rounded-xl pl-3 pr-9 py-2 text-xs font-bold text-slate-200 focus:border-emerald-500/50 focus:outline-none cursor-pointer min-w-[200px]"
            >
              <option value="all">All teams ({teams.length})</option>
              {sortedTeams.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 text-xs">
              ▾
            </span>
          </div>
          {selectedTeam && (
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/30">
              <TeamCrest team={selectedTeam} size={16} />
              <span className="text-[11px] font-black text-emerald-200 truncate max-w-[140px]">{selectedTeam.name}</span>
            </span>
          )}
        </div>

        {/* STATUS filter (All / To play / Played) — applies on top of the team */}
        {showStatusFilter && (
          <div className="flex gap-1.5">
            {[
              { v: "all", t: "All" },
              { v: "todo", t: "To play" },
              { v: "done", t: "Played" },
            ].map((o) => (
              <button
                key={o.v}
                onClick={() => setStatus(o.v)}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider border transition-all ${
                  status === o.v
                    ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                    : "bg-slate-900/50 text-slate-400 border-slate-800 hover:border-slate-700"
                }`}
              >
                {o.t}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* FC Barcelona explainer — Barça fixtures aren't scored inline; they are
          played through the real match-scheduling flow and write the result back. */}
      {hasPlayableBarca && (
        <div className="mb-3 flex items-start gap-2 rounded-xl border border-emerald-500/30 bg-gradient-to-r from-emerald-500/[0.08] to-transparent px-3 py-2">
          <FiPlayCircle className="text-emerald-400 shrink-0 mt-0.5" size={14} />
          <p className="text-[11px] text-slate-300 leading-snug">
            <span className="font-black text-emerald-300">FC Barcelona</span> fixtures
            aren&apos;t scored here — hit{" "}
            <span className="font-black text-emerald-300">Play / Schedule</span> to set
            them up in the match flow (lineup &amp; live match). The final score writes
            back to this table automatically.
          </p>
        </div>
      )}

      <div className="flex items-center justify-between mb-3">
        <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">
          {visible.length} {visible.length === 1 ? "match" : "matches"}
          {selectedTeam ? "" : ` · ${doneAll}/${total} played`}
        </span>
        {/* ONGOING + admin → results are editable. COMPLETED → locked read-only,
            shown with an unmistakable "Completed · read-only" badge. */}
        {canEdit ? (
          <span className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/30 text-[9px] font-black uppercase tracking-wider text-emerald-300">
            <FiEdit2 size={9} /> Results editable
          </span>
        ) : finished ? (
          <span
            title="This competition is complete — final results are read-only."
            className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-500/10 border border-amber-500/40 text-[9px] font-black uppercase tracking-wider text-amber-300"
          >
            <FiLock size={9} /> Completed · read-only
          </span>
        ) : null}
      </div>

      {visible.length === 0 ? (
        <p className="text-xs text-slate-600 italic py-6 text-center">No matches for this selection.</p>
      ) : (
        <div className="space-y-5 max-h-[680px] overflow-y-auto pr-1">
          {grouped.map(({ label, items }, gi) => (
            <div key={label || gi}>
              {label && (
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-2 px-1">
                  {label}
                </p>
              )}
              <div className="space-y-1.5">
                {items.map((f) => (
                  <MatchRow
                    key={f.id}
                    fixture={f}
                    teams={teams}
                    canEdit={canEdit}
                    onRecord={onRecord}
                    requireWinner={requireWinner}
                    compId={compId}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
