"use client";

import { Calendar, Clock, MapPin } from "lucide-react";
import { AiFillEdit } from "react-icons/ai";
import { RiDeleteBin6Line } from "react-icons/ri";
import { useRouter } from "next/navigation";
import { api } from "@/src/lib/api";
import { useState, useEffect, useRef } from "react";
import {
  lookupTeam,
  lookupOuterTeam,
  displayTeamName,
  displayOuterTeamName,
} from "@/src/lib/teamDirectory";
import { hasKickedOff, countdownLabel, msUntilKickoff } from "@/src/components/matches/liveClock";
import { parseFixtureSource } from "@/src/components/matches/fixtureSource";

const MatchesCard = ({ match, onRefresh, onViewDetails, onPlanLineup, onEdit, onGoLive }) => {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);
  // Tick so a scheduled match flips to "starting" when its time arrives, and so
  // the live countdown updates. We tick every second while a countdown is
  // visible (kickoff within the hour), otherwise every 30s to stay light.
  const [now, setNow] = useState(Date.now());
  const isScheduled = String(match.status || "").toUpperCase() === "SCHEDULED";
  const msLeft = isScheduled ? msUntilKickoff(match.kickoffTime, now) : 0;
  const showCountdown = isScheduled && msLeft > 0;
  const fastTick = showCountdown && msLeft <= 60 * 60 * 1000; // < 1h → second-by-second
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), fastTick ? 1000 : 30000);
    return () => clearInterval(t);
  }, [fastTick]);

  // ── AUTO GO-LIVE (the card flips the match BY ITSELF) ────────────────────
  // The instant a SCHEDULED match's kickoff arrives while the hub is open, we
  // persist status=LIVE once (PUT) and refresh the list so the card turns into a
  // live "Watch Live" card — no manual click required. Guarded so it fires once.
  const wentLive = useRef(false);
  useEffect(() => {
    if (wentLive.current) return;
    if (!isScheduled) return;
    if (!hasKickedOff(match.kickoffTime, now)) return;
    wentLive.current = true;
    (async () => {
      try {
        await api.updateMatch(match.id, {
          homeTeamScore: match.homeTeamScore ?? 0,
          awayTeamScore: match.awayTeamScore ?? 0,
          status: "LIVE",
        });
        onRefresh?.();
      } catch (e) {
        console.error("Auto go-live failed for match", match.id, e);
        wentLive.current = false; // allow a retry on the next tick
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isScheduled, now, match.id, match.kickoffTime]);

  const handleDelete = async (e) => {
    e.stopPropagation();
    if (!confirm("Delete this match?")) return;
    try {
      setDeleting(true);
      // If this is an OFFICIAL match created from a competition fixture, its
      // notes carry a "[FIXTURE comp=<id> fix=<fid>]" tag linking it back to a
      // La Liga / Champions League fixture (a played match wrote its result
      // into that fixture). Deleting the match must REVERT that fixture to
      // UNPLAYED so it returns to the competition's "to play" list and the
      // standings recompute (they exclude unplayed fixtures). The backend sets
      // played = (homeScore != null && awayScore != null), so sending NULL
      // scores clears it. Friendly / non-linked matches just delete as before.
      const src = parseFixtureSource(match.notes);
      if (src) {
        try {
          await api.competitions.recordResult(src.compId, src.fixtureId, {
            homeScore: null,
            awayScore: null,
            playedAt: null,
          });
        } catch (revertErr) {
          // Don't block the delete if the revert fails — just log it.
          console.error("Fixture revert failed for match", match.id, revertErr);
        }
      }
      await api.deleteMatch(match.id);
      onRefresh?.();
    } catch (err) {
      console.error("Delete failed:", err);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="relative border-l-4 w-full border-emerald-500 rounded-xl p-5 bg-slate-900/50 border border-slate-800 shadow-sm hover:border-emerald-500/50 hover:bg-emerald-500/[0.02] transition-all group">

      {/* Edit & Delete buttons */}
      <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={(e) => { e.stopPropagation(); onEdit?.(match); }}
          className="p-1.5 bg-slate-800 hover:bg-emerald-600 text-slate-400 hover:text-white rounded-lg transition-all"
          title="Edit"
        >
          <AiFillEdit size={12} />
        </button>
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="p-1.5 bg-slate-800 hover:bg-red-600 text-slate-400 hover:text-white rounded-lg transition-all disabled:opacity-50"
          title="Delete"
        >
          <RiDeleteBin6Line size={12} />
        </button>
      </div>

      {/* Sport & Status */}
      <div className="flex items-center justify-between mb-6">
        <span className="text-[10px] font-black uppercase tracking-widest text-emerald-500 border border-emerald-500/30 px-2.5 py-1 rounded-md bg-emerald-500/5">
          {match.sportType || match.sport}
        </span>
        <span className={`text-[10px] px-2.5 py-1 rounded-md font-black uppercase tracking-widest border ${match.status === "LIVE"
            ? "bg-red-500/10 text-red-500 border-red-500/20 animate-pulse"
            : (match.status === "COMPLETED" || match.status === "FINISHED")
              ? "bg-slate-700 text-slate-400 border-slate-600"
              : "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
          }`}>
          {match.status}
        </span>
      </div>

      {/* Teams & Score — synced matches carry opponentName/opponentCrest */}
      {(() => {
        const home = lookupTeam(match.homeTeamId);
        const away = lookupOuterTeam(match.outerTeamId);
        const synced = !!match.externalId;
        const BARCA_CREST = "https://crests.football-data.org/81.png";
        const homeName = synced ? "FC Barcelona" : (home ? home.name : displayTeamName(match.homeTeamId));
        const awayName = match.opponentName || (away ? away.name : displayOuterTeamName(match.outerTeamId));
        const homeCrestUrl = synced ? BARCA_CREST : (home?.crestUrl || null);
        const awayCrestUrl = match.opponentCrest || away?.crestUrl || null;
        const Crest = ({ url, fallback }) => url
          ? <img src={url} alt="" className="w-7 h-7 object-contain shrink-0" onError={(e) => { e.currentTarget.style.display = "none"; }} />
          : <span className="text-2xl shrink-0">{fallback}</span>;
        return (
          <div className="space-y-4 mb-6">
            <div className="flex justify-between items-center gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <Crest url={homeCrestUrl} fallback={home ? home.crest : "⚪"} />
                <span className="text-sm font-bold text-slate-100 truncate" title={homeName}>{homeName}</span>
              </div>
              <span className="text-xl font-black text-slate-100 shrink-0">{match.homeTeamScore ?? "-"}</span>
            </div>
            <div className="text-center text-xs text-slate-500 font-black tracking-widest">VS</div>
            <div className="flex justify-between items-center gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <Crest url={awayCrestUrl} fallback={away ? away.crest : "🏟️"} />
                <span className="text-sm font-bold text-slate-100 truncate" title={awayName}>{awayName}</span>
              </div>
              <span className="text-xl font-black text-slate-100 shrink-0">{match.awayTeamScore ?? "-"}</span>
            </div>
          </div>
        );
      })()}

      {/* Match Info */}
      <div className="text-xs text-slate-400 mb-6 space-y-1.5">
        <div className="flex items-center gap-2">
          <Calendar size={13} className="text-slate-500" />
          {match.kickoffTime ? new Date(match.kickoffTime).toLocaleDateString() : "TBD"}
        </div>
        <div className="flex items-center gap-2">
          <Clock size={13} className="text-slate-500" />
          {match.kickoffTime ? new Date(match.kickoffTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "TBD"}
        </div>
        <div className="flex items-center gap-2">
          <MapPin size={13} className="text-slate-500" />
          {match.venue || "TBD"}
        </div>
      </div>

      {/* Live countdown to kickoff (scheduled, not yet started) */}
      {showCountdown && (
        <div className="mb-4 flex items-center justify-between gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/[0.06] px-3 py-2">
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-400/80 flex items-center gap-1.5">
            <Clock size={12} className="text-emerald-400" /> Starts in
          </span>
          <span className="text-sm font-black text-emerald-300 tabular-nums">{countdownLabel(match.kickoffTime, now)}</span>
        </div>
      )}

      {/* Extra Info */}
      {match.competition && (
        <div className="mb-4 text-[10px] text-slate-500 uppercase tracking-widest font-bold border-t border-slate-800 pt-3">
          🏆 {match.competition} — {match.season}
        </div>
      )}

      {(() => {
        const st = String(match.status || "").toUpperCase();
        const finished = st === "FINISHED" || st === "COMPLETED";
        const live = st === "LIVE" || st === "HALFTIME";
        // A scheduled match whose kickoff time has arrived clearly invites
        // opening it live (it auto-goes-live in the live view).
        const arrived = st === "SCHEDULED" && hasKickedOff(match.kickoffTime, now);
        return (
          <div className="flex gap-2">
            {live ? (
              <button onClick={() => onGoLive?.(match)} className="flex-1 py-2.5 bg-red-600 hover:bg-red-500 text-white font-black text-[10px] uppercase tracking-widest rounded-lg transition-all flex items-center justify-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" /> Watch Live
              </button>
            ) : arrived ? (
              <button onClick={() => onGoLive?.(match)} className="flex-1 py-2.5 bg-red-600 hover:bg-red-500 text-white font-black text-[10px] uppercase tracking-widest rounded-lg transition-all flex items-center justify-center gap-1.5 animate-pulse">
                <span className="w-1.5 h-1.5 rounded-full bg-white" /> Match Starting — Open Live
              </button>
            ) : finished ? (
              <button
                onClick={() => router.push(`/dashboard/matches/${match.id}`)}
                className="flex-1 py-2.5 bg-slate-700 hover:bg-slate-600 text-white font-black text-[10px] uppercase tracking-widest rounded-lg transition-all"
              >
                📊 Match Details
              </button>
            ) : (
              // SCHEDULED, pre-kickoff: a SINGLE full-width button into the
              // match live/control page. That page stays LOCKED behind a
              // countdown until kickoff, so this is NOT a "Live" action — it's
              // the match center entry point. The old "View Lineup" button was
              // removed: the lineup is set once at creation and is read-only.
              <button
                onClick={() => onGoLive?.(match)}
                title="Open the match center (locked with a countdown until kickoff)"
                className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-[10px] uppercase tracking-widest rounded-lg transition-all flex items-center justify-center gap-1.5"
              >
                Open Match Center
              </button>
            )}
          </div>
        );
      })()}
    </div>
  );
};

export { MatchesCard };
export default MatchesCard;