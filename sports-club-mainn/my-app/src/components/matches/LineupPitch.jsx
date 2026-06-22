"use client";

import React, { useState } from "react";
import PlayerFace from "@/src/components/matches/PlayerFace";
import { setPlayerDragImage } from "@/src/components/matches/dragGhost";

// A premium, interactive football pitch with EMPTY position slots for the chosen
// formation. Players are placed by drag-and-drop:
//   • drag a BENCH player onto an empty slot → assigns him there
//   • drag a pitch player onto ANOTHER pitch player → SWAPS them
//   • drag a pitch player onto an EMPTY slot → moves him there
//   • drop somewhere invalid → nothing happens (snaps back)
// It uses native HTML5 drag-and-drop so the bench list and the pitch share one
// drag space. Tapping a slot is also supported (onSlotTap) for touch/click flows.
//
// Props:
//   slots:       [{ top, left, label, pos }]      — pitch coordinates per slot
//   assignments: { [slotIndex]: player }          — player = { id, name, photoUrl, position, number, sport }
//   onDropPlayer(playerId, slotIndex):  a bench player (id) dropped onto a slot
//   onMoveSlot(fromSlot, toSlot):       a pitch player dragged onto another slot (move/swap)
//   onSlotTap(slotIndex):               click/tap a slot (select for swap or remove)
//   selectedSlot:                        currently selected slot index (for tap-swap highlight)
//   sport: title-case sport for avatar colour
export default function LineupPitch({
  slots = [], assignments = {}, onDropPlayer, onMoveSlot, onSlotTap,
  selectedSlot = null, sport = "Football",
}) {
  const [overSlot, setOverSlot] = useState(null);

  const handleDrop = (e, toSlot) => {
    e.preventDefault();
    setOverSlot(null);
    const fromSlotRaw = e.dataTransfer.getData("from-slot");
    const benchId = e.dataTransfer.getData("bench-player");
    if (fromSlotRaw !== "") {
      const fromSlot = Number(fromSlotRaw);
      if (fromSlot !== toSlot) onMoveSlot?.(fromSlot, toSlot);
    } else if (benchId !== "") {
      onDropPlayer?.(Number(benchId), toSlot);
    }
  };

  return (
    <div
      className="relative w-full max-w-[460px] aspect-[2/3] mx-auto rounded-2xl overflow-hidden border border-emerald-900/60 shadow-2xl"
      style={{
        background:
          "repeating-linear-gradient(180deg, #14532d 0px, #14532d 56px, #166534 56px, #166534 112px)",
      }}
    >
      {/* pitch markings */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 100 150" preserveAspectRatio="none">
        <g stroke="rgba(255,255,255,0.32)" strokeWidth="0.4" fill="none">
          <rect x="2" y="2" width="96" height="146" rx="1" />
          <line x1="2" y1="75" x2="98" y2="75" />
          <circle cx="50" cy="75" r="11" />
          <circle cx="50" cy="75" r="0.8" fill="rgba(255,255,255,0.4)" />
          <rect x="32" y="2" width="36" height="16" />
          <rect x="42" y="2" width="16" height="6" />
          <rect x="32" y="132" width="36" height="16" />
          <rect x="42" y="142" width="16" height="6" />
        </g>
      </svg>

      {slots.map((slot, i) => {
        const player = assignments[i];
        const isOver = overSlot === i;
        const isSelected = selectedSlot === i;
        return (
          <div
            key={i}
            className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center"
            style={{ top: slot.top, left: slot.left, width: 80, height: 90 }}
            onDragOver={(e) => { e.preventDefault(); setOverSlot(i); }}
            onDragLeave={() => setOverSlot((cur) => (cur === i ? null : cur))}
            onDrop={(e) => handleDrop(e, i)}
          >
            {/* empty-slot ghost (drop target) */}
            {!player && (
              <button
                type="button"
                onClick={() => onSlotTap?.(i)}
                className={`w-12 h-12 rounded-full border-2 border-dashed flex items-center justify-center transition-all ${isOver ? "border-emerald-300 bg-emerald-400/30 scale-110" : "border-white/25 hover:border-emerald-300/60"}`}
              >
                <span className="text-[9px] font-black text-white/60 uppercase">{slot.label}</span>
              </button>
            )}

            {player && (
              <div
                draggable
                onDragStart={(e) => {
                  e.dataTransfer.setData("from-slot", String(i));
                  e.dataTransfer.effectAllowed = "move";
                  // Show ONLY this one player as the drag ghost (not the board).
                  setPlayerDragImage(e, { photoUrl: player.photoUrl, name: player.name });
                }}
                onClick={() => onSlotTap?.(i)}
                className={`flex flex-col items-center cursor-grab active:cursor-grabbing transition-transform ${isOver ? "scale-110" : ""} ${isSelected ? "scale-110" : ""}`}
              >
                <div className="relative">
                  <PlayerFace
                    photoUrl={player.photoUrl}
                    name={player.name}
                    sport={player.sport || sport}
                    size={46}
                    rounded="rounded-full"
                    className={`ring-2 shadow-lg ${isSelected ? "ring-emerald-400" : "ring-white/70"}`}
                  />
                  {player.number != null && player.number !== "" && (
                    <span className="absolute -bottom-1 -right-1 min-w-5 h-5 px-1 rounded-full bg-slate-950 border border-white/40 text-[10px] font-black text-white flex items-center justify-center shadow">
                      {player.number}
                    </span>
                  )}
                </div>
                <p className="mt-1 max-w-[80px] truncate text-[10px] font-black text-white text-center leading-tight bg-slate-950/80 px-1.5 py-0.5 rounded backdrop-blur-sm">
                  {String(player.name || "").split(" ").slice(-1)[0]}
                </p>
                <span className="text-[8px] text-emerald-300 font-black uppercase tracking-wider">{slot.label}</span>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
