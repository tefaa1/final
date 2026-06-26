"use client";

import React, { useEffect, useMemo, useState } from "react";
import { api } from "@/src/lib/api";
import PlayerFace from "@/src/components/matches/PlayerFace";
import { resolveSport } from "@/src/lib/playerSport";
import { parseSubDescription } from "@/src/components/matches/matchSubs";
import { FiPlus, FiStar, FiX } from "react-icons/fi";

const unwrapArr = (r) => r?.data || r?.content || (Array.isArray(r) ? r : []);

// ─────────────────────────────────────────────────────────────────────────────
// ADD PLAYER PERFORMANCE REVIEW — a coach review composer for a single match.
// Pick a player WHO ACTUALLY PLAYED (starting XI + any substitute who came on),
// give an overall rating (1–10), then write the tactical analysis + strengths +
// weaknesses + areas to improve.
// Persists via api.createMatchPerformanceReview (POST /match-performance-reviews).
//
// SCOPING WHO PLAYED: a review may only be written for a player who actually took
// the pitch. That is:
//   • the starting XI — GET /match-lineups, rows whose matchFormationId equals the
//     match's matchFormationId AND lineupStatus === "STARTING_11"; PLUS
//   • substitutes who CAME ON — GET /match-events, the SUBSTITUTION events for
//     this match, parsed (parseSubDescription) for the "in" player db id.
// A bench player who never came on is still NOT rateable. Resolved playerIds are
// matched against the squad (`players` prop) for names/photos. If the match has
// no formation/lineup AND no subs, the picker shows a clear "no lineup" state.
//
// The backend (MatchPerformanceReviewRequest) requires matchId, reviewedByCoachId,
// playerId, a positive rating, and NON-BLANK tacticalAnalysis / strengths /
// weaknesses / areasForImprovement (min length 2) — the form enforces all of that
// before it lets you submit, so a POST never bounces on validation.
//
// Props:
//   match:          the match (needs id + matchFormationId to scope the XI)
//   players:        full squad (resolve XI playerId → name/photo)
//   coachId:        reviewedByCoachId to attribute the review to (head coach id)
//   alreadyReviewed: Set/array of playerIds already reviewed for this match
//   onCreated:      (review) => void — called with the created row to update UI
// ─────────────────────────────────────────────────────────────────────────────
export default function AddPlayerReviewForm({ match, players = [], coachId, alreadyReviewed = [], onCreated }) {
  const reviewedSet = useMemo(() => new Set([...alreadyReviewed].map(String)), [alreadyReviewed]);

  // STARTING_11 lineup rows for THIS match (resolved against the squad below).
  const [lineupRows, setLineupRows] = useState([]);
  // DB player ids of substitutes who CAME ON in this match (from SUBSTITUTION
  // events). Combined with the starting XI to form the rateable set.
  const [subInIds, setSubInIds] = useState([]);
  const [lineupLoading, setLineupLoading] = useState(true);
  const formationId = match?.matchFormationId;
  const matchId = match?.id;

  useEffect(() => {
    let alive = true;
    (async () => {
      setLineupLoading(true);
      try {
        // Starting XI.
        if (formationId) {
          const rows = unwrapArr(await api.getMatchLineups())
            .filter((l) => l.matchFormationId === formationId && l.lineupStatus === "STARTING_11");
          if (alive) setLineupRows(rows);
        } else if (alive) {
          setLineupRows([]);
        }
        // Substitutes who came on — read this match's SUBSTITUTION events and
        // collect each parsed "in" player db id.
        try {
          const ins = unwrapArr(await api.getMatchEvents())
            .filter((e) => String(e.matchId) === String(matchId) && e.eventType === "SUBSTITUTION")
            .map((e) => parseSubDescription(e.description)?.inId)
            .filter((id) => Number.isFinite(id));
          if (alive) setSubInIds([...new Set(ins)]);
        } catch {
          if (alive) setSubInIds([]);
        }
      } catch {
        if (alive) { setLineupRows([]); setSubInIds([]); }
      } finally {
        if (alive) setLineupLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [formationId, matchId]);

  // Resolve the rateable set → squad players (name/photo): the starting XI PLUS
  // substitutes who came on. De-duped (a sub id can't double the XI), ordered by
  // name. Only players we can resolve are offered.
  const squad = useMemo(() => {
    const byId = new Map(players.map((p) => [String(p.id), p]));
    const ids = new Set([
      ...lineupRows.map((r) => String(r.playerId)),
      ...subInIds.map((id) => String(id)),
    ]);
    return [...ids]
      .map((id) => byId.get(id))
      .filter(Boolean)
      .sort((a, b) => `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`));
  }, [players, lineupRows, subInIds]);

  // Set of starting-XI ids so the picker can tag substitutes who came on.
  const starterIds = useMemo(() => new Set(lineupRows.map((r) => String(r.playerId))), [lineupRows]);

  const hasLineup = squad.length > 0;

  const [open, setOpen] = useState(false);
  const [playerId, setPlayerId] = useState("");
  const [rating, setRating] = useState(7);
  const [tacticalAnalysis, setTacticalAnalysis] = useState("");
  const [strengths, setStrengths] = useState("");
  const [weaknesses, setWeaknesses] = useState("");
  const [areasForImprovement, setAreasForImprovement] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const selected = squad.find((p) => String(p.id) === String(playerId));

  const reset = () => {
    setPlayerId(""); setRating(7);
    setTacticalAnalysis(""); setStrengths(""); setWeaknesses(""); setAreasForImprovement("");
    setErr("");
  };

  const submit = async () => {
    setErr("");
    if (!playerId) { setErr("Pick a player to review."); return; }
    const fields = { tacticalAnalysis, strengths, weaknesses, areasForImprovement };
    for (const [k, v] of Object.entries(fields)) {
      if (!v || v.trim().length < 2) { setErr("Fill in the tactical analysis, strengths, weaknesses and areas to improve (min 2 characters each)."); return; }
    }
    const r = Number(rating);
    if (!Number.isFinite(r) || r < 1 || r > 10) { setErr("Rating must be between 1 and 10."); return; }

    setBusy(true);
    try {
      const body = {
        matchId: Number(match.id),
        reviewedByCoachId: Number(coachId) || 4, // default head coach
        playerId: Number(playerId),
        overallPerformanceRating: r,
        tacticalAnalysis: tacticalAnalysis.trim(),
        strengths: strengths.trim(),
        weaknesses: weaknesses.trim(),
        areasForImprovement: areasForImprovement.trim(),
      };
      const res = await api.createMatchPerformanceReview(body);
      const created = res?.data || res || body;
      onCreated?.({ ...body, ...created, id: created.id });
      reset();
      setOpen(false);
    } catch (e) {
      setErr(e.message || "Failed to save the review.");
    } finally {
      setBusy(false);
    }
  };

  const ratingTone = rating >= 8 ? "text-emerald-400" : rating >= 6 ? "text-amber-400" : "text-rose-400";

  if (!open) {
    // No starting XI on this match → rating is impossible; show a clear,
    // non-actionable state instead of an empty picker. (While the lineup is
    // still loading we keep the button enabled to avoid a flash.)
    if (!lineupLoading && !hasLineup) {
      return (
        <div className="w-full rounded-xl border border-slate-800 bg-slate-950/40 px-4 py-3 text-center">
          <p className="text-[11px] font-black uppercase tracking-widest text-slate-400">No lineup set for this match</p>
          <p className="text-[11px] text-slate-500 mt-1 leading-snug">A starting XI must be recorded before players can be rated.</p>
        </div>
      );
    }
    return (
      <button
        onClick={() => setOpen(true)}
        disabled={lineupLoading}
        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-amber-500/40 bg-amber-500/10 text-amber-300 font-black text-[11px] uppercase tracking-widest hover:bg-amber-600 hover:text-white transition-all disabled:opacity-50"
      >
        <FiPlus size={14} /> {lineupLoading ? "Loading lineup…" : "Add player review"}
      </button>
    );
  }

  return (
    <div className="rounded-2xl border border-amber-500/30 bg-slate-950/50 p-4">
      <div className="flex items-center justify-between mb-3">
        <p className="text-[11px] font-black uppercase tracking-[0.2em] text-amber-300 flex items-center gap-1.5">
          <FiStar size={13} /> New performance review
        </p>
        <button onClick={() => { reset(); setOpen(false); }} className="text-slate-500 hover:text-white transition-colors" title="Cancel">
          <FiX size={16} />
        </button>
      </div>

      {/* Player picker — players who actually played (starting XI + subs who came on) */}
      <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Player · Played (XI + subs)</label>
      <div className="flex items-center gap-2.5 mb-3">
        {selected && (
          <PlayerFace photoUrl={selected.photoUrl} name={`${selected.firstName} ${selected.lastName}`} sport={resolveSport(selected.preferredPosition)} size={38} rounded="rounded-xl" />
        )}
        <select
          value={playerId}
          onChange={(e) => setPlayerId(e.target.value)}
          className="flex-1 bg-slate-900/60 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 outline-none focus:border-amber-500"
        >
          <option value="" className="bg-slate-950">Select a player who played…</option>
          {squad.map((p) => {
            const done = reviewedSet.has(String(p.id));
            const cameOn = !starterIds.has(String(p.id));
            return (
              <option key={p.id} value={p.id} className="bg-slate-950">
                {done ? "✓ " : cameOn ? "🔁 " : ""}{p.firstName} {p.lastName} · #{p.kitNumber ?? "—"}{done ? " (reviewed)" : cameOn ? " (sub)" : ""}
              </option>
            );
          })}
        </select>
      </div>

      {/* Rating slider */}
      <div className="mb-3">
        <div className="flex items-center justify-between mb-1.5">
          <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Overall rating</label>
          <span className={`text-lg font-black tabular-nums ${ratingTone}`}>{rating}<span className="text-[10px] text-slate-600 font-bold"> / 10</span></span>
        </div>
        <input
          type="range" min={1} max={10} step={1}
          value={rating}
          onChange={(e) => setRating(Number(e.target.value))}
          className="w-full accent-amber-500"
        />
      </div>

      {/* Text fields */}
      <div className="space-y-2.5">
        <Field label="Tactical analysis" value={tacticalAnalysis} onChange={setTacticalAnalysis} placeholder="How did the player function within the system?" rows={2} />
        <Field label="Strengths" value={strengths} onChange={setStrengths} placeholder="What did the player do well?" />
        <Field label="Weaknesses" value={weaknesses} onChange={setWeaknesses} placeholder="Where did the player struggle?" />
        <Field label="Areas for improvement" value={areasForImprovement} onChange={setAreasForImprovement} placeholder="What to work on next?" />
      </div>

      {err && <p className="mt-2.5 text-[11px] font-bold text-rose-400">{err}</p>}

      <button
        onClick={submit}
        disabled={busy}
        className="mt-3.5 w-full py-2.5 rounded-xl bg-amber-600 text-white font-black text-[11px] uppercase tracking-widest hover:bg-amber-500 shadow-lg shadow-amber-500/20 transition-all disabled:opacity-50"
      >
        {busy ? "Saving…" : "Save review"}
      </button>
    </div>
  );
}

function Field({ label, value, onChange, placeholder, rows = 2 }) {
  return (
    <div>
      <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">{label}</label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={rows}
        placeholder={placeholder}
        className="w-full resize-none bg-slate-900/60 border border-slate-800 rounded-lg px-3 py-2 text-[13px] text-slate-200 placeholder:text-slate-600 outline-none focus:border-amber-500 leading-snug"
      />
    </div>
  );
}
