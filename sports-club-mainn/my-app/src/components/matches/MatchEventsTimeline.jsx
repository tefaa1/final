"use client";

import React from "react";
import PlayerFace from "@/src/components/matches/PlayerFace";
import { resolveSport } from "@/src/lib/playerSport";

// ─────────────────────────────────────────────────────────────────────────────
// EVENTS TIMELINE — a first-class, prominent section of the Match Details page.
// Renders the chronological match events (goals, cards, subs, …) with real
// player names + photos resolved from playerKeycloakId. Sport-agnostic: the same
// timeline works for football goals/cards, basketball points/fouls, etc.
//
// Props:
//   events:   raw match-event rows for THIS match
//   players:  full squad (to resolve playerKeycloakId → name/photo)
//   sport:    title-case sport for the avatar fallback gradient
// ─────────────────────────────────────────────────────────────────────────────

// Icon + tone per event type. Unknown types fall back to a neutral dot.
const EVENT_STYLE = {
  GOAL:            { icon: "⚽", tone: "emerald", label: "Goal" },
  OWN_GOAL:        { icon: "🥅", tone: "rose",    label: "Own Goal" },
  PENALTY_SCORED:  { icon: "🎯", tone: "emerald", label: "Penalty" },
  PENALTY_MISSED:  { icon: "❌", tone: "rose",    label: "Penalty Missed" },
  ASSIST:          { icon: "🅰️", tone: "sky",     label: "Assist" },
  YELLOW_CARD:     { icon: "🟨", tone: "amber",   label: "Yellow Card" },
  RED_CARD:        { icon: "🟥", tone: "rose",    label: "Red Card" },
  SUBSTITUTION:    { icon: "🔁", tone: "slate",   label: "Substitution" },
  CORNER_KICK:     { icon: "🚩", tone: "slate",   label: "Corner" },
  FREE_KICK:       { icon: "⚡", tone: "slate",   label: "Free Kick" },
  OFFSIDE:         { icon: "🚫", tone: "slate",   label: "Offside" },
  VAR_REVIEW:      { icon: "📺", tone: "violet",  label: "VAR Review" },
  // Other sports
  POINT:           { icon: "🏀", tone: "emerald", label: "Points" },
  TWO_POINTER:     { icon: "2️⃣", tone: "emerald", label: "2 Points" },
  THREE_POINTER:   { icon: "3️⃣", tone: "emerald", label: "3 Points" },
  FREE_THROW:      { icon: "🆓", tone: "sky",     label: "Free Throw" },
  FOUL:            { icon: "✋", tone: "amber",   label: "Foul" },
  TIMEOUT:         { icon: "⏱️", tone: "slate",   label: "Timeout" },
  ACE:             { icon: "🎾", tone: "emerald", label: "Ace" },
  SET_WON:         { icon: "🏆", tone: "emerald", label: "Set Won" },
};

const TONE = {
  emerald: "border-emerald-500/40 bg-emerald-500/10 text-emerald-300",
  rose:    "border-rose-500/40 bg-rose-500/10 text-rose-300",
  amber:   "border-amber-500/40 bg-amber-500/10 text-amber-300",
  sky:     "border-sky-500/40 bg-sky-500/10 text-sky-300",
  violet:  "border-violet-500/40 bg-violet-500/10 text-violet-300",
  slate:   "border-slate-600/40 bg-slate-700/20 text-slate-300",
};

export default function MatchEventsTimeline({ events = [], players = [], sport = "Football" }) {
  const byKc = (kc) => players.find((p) => p.keycloakId === kc);

  const sorted = [...events].sort(
    (a, b) => (Number(a.minute) || 0) - (Number(b.minute) || 0) || (Number(a.extraTime) || 0) - (Number(b.extraTime) || 0)
  );

  if (sorted.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-8 text-center">
        <div className="text-3xl mb-2">⏱️</div>
        <p className="text-slate-300 font-black uppercase tracking-widest text-xs">No events recorded</p>
        <p className="text-[12px] text-slate-500 mt-1.5">This match has no timeline events yet.</p>
      </div>
    );
  }

  return (
    <ol className="relative ml-3 border-l-2 border-slate-800 space-y-4 py-1">
      {sorted.map((e) => {
        const style = EVENT_STYLE[e.eventType] || { icon: "•", tone: "slate", label: String(e.eventType || "Event").replace(/_/g, " ") };
        const tone = TONE[style.tone] || TONE.slate;
        const player = byKc(e.playerKeycloakId);
        const playerName = player ? `${player.firstName} ${player.lastName}` : (e.playerKeycloakId ? "Squad player" : null);
        const minute = e.minute != null ? `${e.minute}'${e.extraTime ? `+${e.extraTime}` : ""}` : "";
        return (
          <li key={e.id} className="relative pl-7">
            {/* timeline node */}
            <span className={`absolute -left-[11px] top-1 grid place-items-center w-5 h-5 rounded-full border ${tone} text-[10px]`}>
              {style.icon}
            </span>
            <div className="flex items-start gap-3 rounded-xl border border-slate-800 bg-slate-950/40 px-3.5 py-2.5 hover:border-slate-700 transition-colors">
              {minute && (
                <span className="shrink-0 mt-0.5 text-[11px] font-black tabular-nums text-emerald-400 w-9 text-right">{minute}</span>
              )}
              {player && (
                <PlayerFace photoUrl={player.photoUrl} name={playerName} sport={resolveSport(player.preferredPosition) || sport} size={28} rounded="rounded-lg" className="shrink-0" />
              )}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`text-[10px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded border ${tone}`}>{style.label}</span>
                  {playerName && <span className="text-[13px] font-bold text-slate-100 truncate">{playerName}</span>}
                </div>
                {e.description && <p className="text-[12px] text-slate-400 leading-snug mt-1">{e.description}</p>}
              </div>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
