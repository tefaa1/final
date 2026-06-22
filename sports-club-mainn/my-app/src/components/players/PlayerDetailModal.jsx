"use client";

import React, { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { IoIosPerson } from "react-icons/io";
import { FiX } from "react-icons/fi";
import PlayerAvatar from "@/src/components/shared/PlayerAvatar";

const SPORT_BY_POSITION = {
  GOALKEEPER: "Football", RIGHT_BACK: "Football", LEFT_BACK: "Football",
  CENTER_BACK: "Football", DEFENSIVE_MID: "Football", CENTRAL_MID: "Football",
  ATTACKING_MID: "Football", RIGHT_WING: "Football", LEFT_WING: "Football", STRIKER: "Football",
  POINT_GUARD: "Basketball", SHOOTING_GUARD: "Basketball", SMALL_FORWARD: "Basketball",
  POWER_FORWARD: "Basketball", CENTER: "Basketball",
  HB_GOALKEEPER: "Handball", HB_LEFT_WING: "Handball", HB_RIGHT_WING: "Handball",
  HB_LEFT_BACK: "Handball", HB_RIGHT_BACK: "Handball", HB_CENTRE_BACK: "Handball", HB_PIVOT: "Handball",
  SINGLES_PLAYER: "Tennis", DOUBLES_PLAYER: "Tennis",
};

const STATUS_TONE = {
  AVAILABLE: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30",
  INJURED: "text-rose-400 bg-rose-500/10 border-rose-500/30",
  SUSPENDED: "text-amber-400 bg-amber-500/10 border-amber-500/30",
  ABSENT: "text-slate-400 bg-slate-500/10 border-slate-500/30",
};

const fmtMoney = (v) => (v ? `€${Number(v).toLocaleString()}` : "—");
const calcAge = (dob) =>
  dob ? Math.max(0, new Date().getFullYear() - new Date(dob).getFullYear()) : "—";

function Stat({ label, value, accent = "text-slate-100" }) {
  return (
    <div className="bg-slate-950/40 rounded-xl border border-slate-800/60 p-3 text-center">
      <p className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-1">{label}</p>
      <p className={`text-lg font-black ${accent}`}>{value}</p>
    </div>
  );
}

function Info({ label, value }) {
  return (
    <div className="border-b border-slate-800/40 py-2.5 flex justify-between items-center gap-4">
      <span className="text-[11px] font-bold uppercase tracking-widest text-slate-500">{label}</span>
      <span className="text-sm font-bold text-slate-200 text-right truncate">{value ?? "—"}</span>
    </div>
  );
}

export default function PlayerDetailModal({ player, matchStats = [], assessments = [], onClose }) {
  // Lock body scroll while open.
  useEffect(() => {
    document.body.style.overflow = "hidden";
    const onEsc = (e) => e.key === "Escape" && onClose?.();
    window.addEventListener("keydown", onEsc);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onEsc);
    };
  }, [onClose]);

  if (!player) return null;

  const name = [player.firstName, player.lastName].filter(Boolean).join(" ") || player.name || "Unknown Player";
  const position = (player.preferredPosition || player.position || "—").replace(/_/g, " ");
  const sport = SPORT_BY_POSITION[String(player.preferredPosition || player.position).toUpperCase()] || "General";
  const status = player.status || "AVAILABLE";

  // Aggregate this player's match statistics.
  const games = matchStats.length;
  const goals = matchStats.reduce((s, m) => s + (Number(m.goals) || 0), 0);
  const assists = matchStats.reduce((s, m) => s + (Number(m.assists) || 0), 0);
  const ratings = matchStats.map((m) => Number(m.performanceRating)).filter((n) => !isNaN(n) && n > 0);
  const avgRating = ratings.length ? (ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1) : "—";
  const minutes = matchStats.reduce((s, m) => s + (Number(m.minutesPlayed) || 0), 0);
  const cards = matchStats.reduce((s, m) => s + (Number(m.yellowCards) || 0), 0);

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-3xl border border-slate-700/60 bg-slate-900 shadow-2xl sidebar-scrollbar"
          initial={{ scale: 0.9, y: 30, opacity: 0 }}
          animate={{ scale: 1, y: 0, opacity: 1 }}
          exit={{ scale: 0.92, y: 20, opacity: 0 }}
          transition={{ type: "spring", stiffness: 260, damping: 24 }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-30 p-2 rounded-xl bg-slate-950/70 border border-slate-700 text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
          >
            <FiX size={18} />
          </button>

          {/* Hero */}
          <div className="relative flex flex-col sm:flex-row gap-6 p-6 bg-gradient-to-br from-emerald-950/40 via-slate-900 to-slate-900 border-b border-slate-800">
            <PlayerAvatar name={name} sport={sport} size={140} className="border border-emerald-500/30 shrink-0 mx-auto sm:mx-0 shadow-lg" textClass="text-5xl" />

            <div className="flex-1 min-w-0 text-center sm:text-left">
              <div className="flex items-center justify-center sm:justify-start gap-3">
                <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">{name}</h2>
                {player.kitNumber != null && (
                  <span className="text-xl font-black text-emerald-400">#{player.kitNumber}</span>
                )}
              </div>
              <p className="text-xs font-black uppercase tracking-[0.25em] text-emerald-400/80 mt-1">{position}</p>
              <div className="flex items-center justify-center sm:justify-start gap-2 mt-3 flex-wrap">
                <span className="text-[10px] font-black uppercase px-3 py-1 rounded-full bg-slate-800/60 text-slate-300 border border-slate-700">{sport}</span>
                <span className={`text-[10px] font-black uppercase px-3 py-1 rounded-full border ${STATUS_TONE[status] || STATUS_TONE.AVAILABLE}`}>{status}</span>
              </div>
            </div>
          </div>

          {/* Body */}
          <div className="grid md:grid-cols-2 gap-6 p-6">
            {/* Profile */}
            <div>
              <h3 className="text-[11px] font-black uppercase tracking-[0.25em] text-slate-500 mb-2">Profile</h3>
              <Info label="Age" value={calcAge(player.dateOfBirth) + (player.dateOfBirth ? " yrs" : "")} />
              <Info label="Nationality" value={player.nationality && player.nationality !== "string" ? player.nationality : "—"} />
              <Info label="Date of Birth" value={player.dateOfBirth || "—"} />
              <Info label="Market Value" value={fmtMoney(player.marketValue)} />
              <Info label="Gender" value={player.gender || "—"} />
              <Info label="Email" value={player.email || "—"} />
            </div>

            {/* Performance */}
            <div>
              <h3 className="text-[11px] font-black uppercase tracking-[0.25em] text-slate-500 mb-2">Season Performance</h3>
              <div className="grid grid-cols-3 gap-3">
                <Stat label="Matches" value={games || 0} />
                <Stat label="Goals" value={goals} accent="text-emerald-400" />
                <Stat label="Assists" value={assists} />
                <Stat label="Avg Rating" value={avgRating} accent="text-emerald-400" />
                <Stat label="Minutes" value={minutes ? minutes.toLocaleString() : 0} />
                <Stat label="Yellow Cards" value={cards} accent="text-amber-400" />
              </div>

              <h3 className="text-[11px] font-black uppercase tracking-[0.25em] text-slate-500 mt-5 mb-2">Training Assessments</h3>
              {assessments.length ? (
                <div className="space-y-2">
                  {assessments.slice(0, 4).map((a) => (
                    <div key={a.id} className="bg-slate-950/40 rounded-xl border border-slate-800/60 p-3">
                      <div className="flex justify-between items-center">
                        <span className="text-[11px] font-bold uppercase tracking-widest text-slate-400">{a.condition || "Session"}</span>
                        <span className="text-sm font-black text-emerald-400">{a.performanceRating ?? "—"}<span className="text-[10px] text-slate-600">/10</span></span>
                      </div>
                      {a.coachComments && <p className="text-xs text-slate-500 mt-1 italic line-clamp-2">{a.coachComments}</p>}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-600 italic py-3">No training assessments recorded yet.</p>
              )}
            </div>
          </div>

          {/* a football rolling across the bottom bar — plays once, fast */}
          <style>{`
            @keyframes pdmRoll{0%{left:-8%}100%{left:104%}}
            @keyframes pdmSpin{from{transform:rotate(0)}to{transform:rotate(540deg)}}
          `}</style>
          <div className="sticky bottom-0 h-10 w-full bg-slate-950/90 border-t border-slate-800">
            <div className="relative h-full w-full overflow-hidden">
              <div className="absolute bottom-3 h-px w-full bg-gradient-to-r from-transparent via-emerald-500/30 to-transparent" />
              <div className="absolute bottom-1.5 text-xl" style={{ animation: "pdmRoll 1.4s cubic-bezier(.18,.7,.3,1) 1 forwards" }}>
                <span className="absolute top-1/2 -translate-y-1/2 -left-9 w-10 h-1.5 rounded-full bg-emerald-400/40 blur-md" />
                <span className="relative inline-block drop-shadow-[0_0_6px_rgba(16,185,129,0.5)]" style={{ animation: "pdmSpin 1.4s linear 1 forwards" }}>⚽</span>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
