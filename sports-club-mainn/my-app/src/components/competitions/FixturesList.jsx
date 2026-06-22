"use client";

import React, { useMemo, useState } from "react";
import { FiEdit2, FiCheck, FiX, FiCalendar } from "react-icons/fi";
import { TeamCrest } from "./TeamPicker";

// "2025-03-14" → "14 Mar 2025" for compact display on completed fixtures.
function fmtPlayedDate(value) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value).slice(0, 10);
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

// Normalise a stored playedAt (may be an ISO datetime) to a YYYY-MM-DD value the
// <input type="date"> understands.
function toDateInput(value) {
  if (!value) return "";
  const s = String(value);
  return s.length >= 10 ? s.slice(0, 10) : s;
}

// Today's date as YYYY-MM-DD — the sensible default when entering a result.
function todayInput() {
  const d = new Date();
  const m = `${d.getMonth() + 1}`.padStart(2, "0");
  const day = `${d.getDate()}`.padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

// One fixture row with inline result entry. The user can ONLY enter / edit the
// score of an EXISTING generated fixture — there is no "add match" here, so the
// same pair can never be played more than the generated number of times.
function FixtureRow({ fixture, teams, canEdit, onRecord, requireWinner }) {
  const home = teams.find((t) => t.id === fixture.homeTeamId) || { name: fixture.homeName };
  const away = teams.find((t) => t.id === fixture.awayTeamId) || { name: fixture.awayName };
  const played = fixture.played === true || (fixture.homeScore != null && fixture.awayScore != null);

  const [editing, setEditing] = useState(false);
  const [hs, setHs] = useState(fixture.homeScore ?? "");
  const [as, setAs] = useState(fixture.awayScore ?? "");
  const [date, setDate] = useState(toDateInput(fixture.playedAt) || todayInput());
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState(false);
  const [errMsg, setErrMsg] = useState("");

  const homeWin = played && Number(fixture.homeScore) > Number(fixture.awayScore);
  const awayWin = played && Number(fixture.awayScore) > Number(fixture.homeScore);

  const startEdit = () => {
    setHs(fixture.homeScore ?? "");
    setAs(fixture.awayScore ?? "");
    setDate(toDateInput(fixture.playedAt) || todayInput());
    setErr(false);
    setEditing(true);
  };

  const save = async () => {
    if (hs === "" || as === "" || Number(hs) < 0 || Number(as) < 0) {
      setErr(true);
      setErrMsg("Enter two scores ≥ 0.");
      return;
    }
    if (!date) {
      setErr(true);
      setErrMsg("Pick the match date.");
      return;
    }
    // Single-elimination knockout cannot end in a draw — require a winner.
    if (requireWinner && Number(hs) === Number(as)) {
      setErr(true);
      setErrMsg("Knockout ties need a winner — no draws.");
      return;
    }
    setSaving(true);
    try {
      await onRecord(fixture.id, Number(hs), Number(as), date);
      setEditing(false);
      setErr(false);
      setErrMsg("");
    } catch {
      setErr(true);
      setErrMsg("Couldn't save — try again.");
    }
    setSaving(false);
  };

  return (
    <div className="flex items-center gap-2 bg-slate-950/40 border border-slate-800/60 rounded-xl px-3 py-2.5 hover:border-slate-700 transition-colors">
      {/* home */}
      <div className="flex items-center gap-2 min-w-0 flex-1 justify-end text-right">
        <span className={`text-xs truncate ${homeWin ? "font-black text-emerald-300" : "font-bold text-slate-200"}`}>
          {home.name}
        </span>
        <TeamCrest team={home} size={20} />
      </div>

      {/* score / entry */}
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
          {/* match date — sent as playedAt with the result */}
          <label className="flex items-center gap-1.5">
            <FiCalendar className="text-emerald-400/80 shrink-0" size={11} />
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className={`bg-slate-900 border rounded-lg px-2 py-1 text-[11px] text-slate-200 focus:outline-none [color-scheme:dark] ${err && !date ? "border-rose-500/60" : "border-slate-700 focus:border-emerald-500/50"}`}
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
          {fixture.playedAt && (
            <span className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider text-slate-500 whitespace-nowrap">
              <FiCalendar size={9} /> {fmtPlayedDate(fixture.playedAt)}
            </span>
          )}
        </div>
      ) : (
        <div className="shrink-0">
          {canEdit ? (
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
        <span className={`text-xs truncate ${awayWin ? "font-black text-emerald-300" : "font-bold text-slate-200"}`}>
          {away.name}
        </span>
      </div>
    </div>
  );
}

// The generated round-robin, grouped by matchday. `onRecord(fixtureId, hs, as)`.
// `requireWinner` forbids draws (single-elimination knockout fixtures).
export default function FixturesList({ fixtures, teams, canEdit, onRecord, requireWinner = false }) {
  const [filter, setFilter] = useState("all"); // all | todo | done

  const visible = useMemo(() => {
    return (fixtures || []).filter((f) => {
      const played = f.played === true || (f.homeScore != null && f.awayScore != null);
      if (filter === "todo") return !played;
      if (filter === "done") return played;
      return true;
    });
  }, [fixtures, filter]);

  // Knockout fixtures carry a `round` (QF/SF/FINAL/…); group + label by that.
  // League fixtures have no round → group by matchday instead.
  const isKnockout = useMemo(
    () => visible.some((f) => f.round && f.round !== "LEAGUE_PHASE"),
    [visible]
  );

  const ROUND_LABEL = {
    PLAYOFF: "Knockout play-off",
    R16: "Round of 16",
    QF: "Quarter-finals",
    SF: "Semi-finals",
    FINAL: "Final",
    LEAGUE_PHASE: "League phase",
  };
  const ROUND_ORDER = ["LEAGUE_PHASE", "PLAYOFF", "R16", "QF", "SF", "FINAL"];

  const grouped = useMemo(() => {
    const g = {};
    if (isKnockout) {
      visible.forEach((f) => {
        const key = f.round || "—";
        (g[key] ||= []).push(f);
      });
      return Object.keys(g)
        .sort((a, b) => (ROUND_ORDER.indexOf(a) - ROUND_ORDER.indexOf(b)) || a.localeCompare(b))
        .map((key) => ({ label: ROUND_LABEL[key] || key, items: g[key] }));
    }
    visible.forEach((f) => {
      const key = f.matchday != null ? f.matchday : 0;
      (g[key] ||= []).push(f);
    });
    return Object.keys(g)
      .map(Number)
      .sort((a, b) => a - b)
      .map((md) => ({ label: md > 0 ? `Matchday ${md}` : "", items: g[md] }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, isKnockout]);

  if (!fixtures || fixtures.length === 0) {
    return (
      <p className="text-xs text-slate-600 italic py-6 text-center">
        No fixtures generated yet.
      </p>
    );
  }

  const total = fixtures.length;
  const done = fixtures.filter((f) => f.played === true || (f.homeScore != null && f.awayScore != null)).length;

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
        <div className="flex gap-1.5">
          {[
            { v: "all", t: "All" },
            { v: "todo", t: "To play" },
            { v: "done", t: "Played" },
          ].map((o) => (
            <button
              key={o.v}
              onClick={() => setFilter(o.v)}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider border transition-all ${
                filter === o.v
                  ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                  : "bg-slate-900/50 text-slate-400 border-slate-800 hover:border-slate-700"
              }`}
            >
              {o.t}
            </button>
          ))}
        </div>
        <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">
          {done}/{total} played
        </span>
      </div>

      <div className="space-y-5">
        {grouped.map(({ label, items }, gi) => (
          <div key={label || gi}>
            {label && (
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-2 px-1">
                {label}
              </p>
            )}
            <div className="space-y-1.5">
              {items.map((f) => (
                <FixtureRow
                  key={f.id}
                  fixture={f}
                  teams={teams}
                  canEdit={canEdit}
                  onRecord={onRecord}
                  requireWinner={requireWinner}
                />
              ))}
            </div>
          </div>
        ))}
        {grouped.length === 0 && (
          <p className="text-xs text-slate-600 italic py-6 text-center">Nothing here.</p>
        )}
      </div>
    </div>
  );
}
