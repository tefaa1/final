"use client";

import React, { useEffect, useMemo, useState } from "react";
import { api } from "@/src/lib/api";
import { resolveSport, resolveSportUpper } from "@/src/lib/playerSport";
import PlayerFace from "@/src/components/matches/PlayerFace";
import LineupPitch from "@/src/components/matches/LineupPitch";
import {
  FORMATION_LAYOUTS, FORMATION_NAMES, SPORT_PLAYERS_ON_PITCH, genericLayout,
} from "@/src/components/matches/formationLayouts";
import { FiCheck, FiEdit2, FiSave } from "react-icons/fi";

const unwrapArr = (r) => r?.data || r?.content || (Array.isArray(r) ? r : []);
const unwrapOne = (r) => r?.data || r;
const titleSport = (s) => { const x = String(s || "").toLowerCase(); return x ? x[0].toUpperCase() + x.slice(1) : "Football"; };

// ─────────────────────────────────────────────────────────────────────────────
// Premium "Match Details" lineup board. Loads the match's saved formation and its
// STARTING_11 rows, then renders the REAL players (names + photos + positions) on
// the same interactive pitch used by the builder. Admins can adjust the XI in
// place (drag / tap-to-swap, or swap a starter for a bench player) — every change
// persists to the backend via /match-lineups.
//
// Props:
//   match:    the match object (needs matchFormationId, sportType, homeTeamId)
//   players:  the full squad (resolved AVAILABLE/INJURED/… players, with photoUrl)
//   canEdit:  admin? → enables editing
//   readOnly: force strictly view-only (ended matches) — no drag, no swap, no edit
// ─────────────────────────────────────────────────────────────────────────────
export default function MatchDetailsBoard({ match, players = [], canEdit = false, readOnly = false }) {
  const sportUpper = String(match?.sportType || "FOOTBALL").toUpperCase();
  const isFootball = sportUpper === "FOOTBALL";
  const onPitch = SPORT_PLAYERS_ON_PITCH[sportUpper] || 11;
  // An ended match is locked: the lineup + formation are a historical record.
  const allowEdit = canEdit && !readOnly;

  const [rows, setRows] = useState([]);          // STARTING_11 lineup rows (with .id)
  const [formationName, setFormationName] = useState("4-3-3");
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [assignments, setAssignments] = useState({}); // slotIndex -> playerId
  const [rowByPlayer, setRowByPlayer] = useState({});  // playerId -> lineup row
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = "success") => { setToast({ msg, type }); setTimeout(() => setToast(null), 2400); };

  const slots = useMemo(() => {
    if (!isFootball) return genericLayout(onPitch);
    return FORMATION_LAYOUTS[formationName] || FORMATION_LAYOUTS["4-3-3"];
  }, [isFootball, formationName, onPitch]);

  // Load the formation + its lineup rows, then map players onto slots by position.
  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      try {
        if (!match?.matchFormationId) { if (alive) { setRows([]); setAssignments({}); } return; }
        let fname = "4-3-3";
        try {
          const f = unwrapOne(await api.getMatchFormationById(match.matchFormationId));
          if (f?.formation && FORMATION_LAYOUTS[f.formation]) fname = f.formation;
        } catch { /* ignore */ }

        const lr = unwrapArr(await api.getMatchLineups())
          .filter(l => l.matchFormationId === match.matchFormationId && l.lineupStatus === "STARTING_11");

        if (!alive) return;
        setFormationName(fname);
        setRows(lr);
        const rmap = {}; lr.forEach(r => { rmap[r.playerId] = r; });
        setRowByPlayer(rmap);
        setAssignments(mapRowsToSlots(lr, FORMATION_LAYOUTS[fname] || FORMATION_LAYOUTS["4-3-3"], isFootball, onPitch));
      } catch {
        if (alive) { setRows([]); setAssignments({}); }
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [match?.matchFormationId, isFootball, onPitch]);

  const playerById = (pid) => players.find(p => p.id === pid);
  const squad = players.filter(p => resolveSportUpper(p.preferredPosition) === sportUpper);
  const assignedIds = Object.values(assignments);
  const bench = squad.filter(p => !assignedIds.includes(p.id));

  // Rich pitch cards (with photos). Looks players up inline (no outer closure) so
  // the dependency list is honest and the React Compiler can optimize this freely.
  const pitchAssignments = useMemo(() => {
    const out = {};
    Object.entries(assignments).forEach(([slot, pid]) => {
      const p = players.find(x => x.id === pid);
      if (!p) return;
      out[slot] = { id: p.id, name: `${p.firstName} ${p.lastName}`, number: p.kitNumber, position: p.preferredPosition, photoUrl: p.photoUrl, sport: resolveSport(p.preferredPosition) };
    });
    return out;
  }, [assignments, players]);

  // ── Edit interactions (admin) ──────────────────────────────────────────
  const moveSlot = (from, to) => {
    setAssignments(prev => {
      const next = { ...prev };
      const a = next[from]; const b = next[to];
      if (b === undefined) delete next[from]; else next[from] = b;
      if (a === undefined) delete next[to]; else next[to] = a;
      return next;
    });
  };
  const onSlotTap = (slotIndex) => {
    if (!editing || !allowEdit) return;
    if (selectedSlot === null) { setSelectedSlot(slotIndex); return; }
    if (selectedSlot === slotIndex) { setSelectedSlot(null); return; }
    moveSlot(selectedSlot, slotIndex);
    setSelectedSlot(null);
  };
  const dropBenchPlayer = (pid, slotIndex) => {
    if (!editing || !allowEdit) return;
    setAssignments(prev => {
      const next = { ...prev };
      for (const k of Object.keys(next)) if (next[k] === pid) delete next[k];
      next[slotIndex] = pid;
      return next;
    });
  };

  // Persist: rewrite every starter row to (playerId, position, jersey) of its
  // current slot. We reuse the existing 11 row ids so we never create extras.
  const handleSave = async () => {
    setSaving(true);
    try {
      const placed = Object.entries(assignments).filter(([, pid]) => pid != null);
      const rowIds = rows.map(r => r.id);
      let i = 0;
      for (const [slot, pid] of placed) {
        const p = playerById(pid) || {};
        const sl = slots[slot] || {};
        const rowId = rowIds[i++];
        const body = {
          teamId: Number(match.homeTeamId) || 1,
          playerId: pid,
          matchFormationId: match.matchFormationId,
          lineupStatus: "STARTING_11",
          position: sl.pos || p.preferredPosition || undefined,
          jerseyNumber: p.kitNumber != null ? Number(p.kitNumber) : undefined,
        };
        if (rowId != null) {
          try { await api.updateMatchLineup(rowId, body); } catch (e) { console.error("update row failed", e); }
        }
      }
      // Reload to reflect the saved truth.
      const lr = unwrapArr(await api.getMatchLineups())
        .filter(l => l.matchFormationId === match.matchFormationId && l.lineupStatus === "STARTING_11");
      setRows(lr);
      const rmap = {}; lr.forEach(r => { rmap[r.playerId] = r; });
      setRowByPlayer(rmap);
      setAssignments(mapRowsToSlots(lr, slots, isFootball, onPitch));
      setEditing(false);
      setSelectedSlot(null);
      showToast("Lineup updated");
    } catch (e) {
      console.error(e); showToast("Save failed", "error");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="px-6 py-16 text-center text-slate-500 font-black uppercase text-[11px] tracking-widest animate-pulse">Loading lineup…</div>;
  }

  if (!match?.matchFormationId || rows.length === 0) {
    return (
      <div className="px-6 py-16 text-center">
        <p className="text-slate-300 font-black uppercase tracking-widest text-sm">No lineup recorded</p>
        <p className="text-[12px] text-slate-500 mt-2 max-w-sm mx-auto">This match has no saved starting XI yet.</p>
      </div>
    );
  }

  return (
    <div className="px-6 py-5">
      {/* header row: formation + edit controls */}
      <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Starting XI · {rows.length}</p>
          {isFootball && (
            <span className="text-[10px] font-black uppercase tracking-widest text-emerald-300 border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 rounded">{formationName}</span>
          )}
        </div>
        {readOnly && (
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 border border-slate-700 bg-slate-800/40 px-2.5 py-1 rounded">🔒 Final lineup · read-only</span>
        )}
        {allowEdit && (
          editing ? (
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-emerald-400 hidden sm:inline">Drag / tap two players to swap · drag from bench to replace</span>
              <button onClick={() => { setEditing(false); setSelectedSlot(null); setAssignments(mapRowsToSlots(rows, slots, isFootball, onPitch)); }}
                className="px-3 py-1.5 rounded-lg border border-slate-700 text-slate-400 text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all">Cancel</button>
              <button onClick={handleSave} disabled={saving}
                className="px-4 py-1.5 rounded-lg bg-emerald-600 text-white text-[10px] font-black uppercase tracking-widest hover:bg-emerald-500 transition-all disabled:opacity-50 flex items-center gap-1.5">
                <FiSave size={12} /> {saving ? "Saving…" : "Save"}
              </button>
            </div>
          ) : (
            <button onClick={() => setEditing(true)}
              className="px-4 py-1.5 rounded-lg border border-emerald-500/40 text-emerald-300 text-[10px] font-black uppercase tracking-widest hover:bg-emerald-600 hover:text-white transition-all flex items-center gap-1.5">
              <FiEdit2 size={12} /> Edit lineup
            </button>
          )
        )}
      </div>

      <div className={`grid gap-6 ${editing ? "lg:grid-cols-[1fr_300px]" : "grid-cols-1"}`}>
        <div>
          <LineupPitch
            slots={slots}
            assignments={pitchAssignments}
            onDropPlayer={allowEdit ? dropBenchPlayer : undefined}
            onMoveSlot={allowEdit ? moveSlot : undefined}
            onSlotTap={allowEdit ? onSlotTap : undefined}
            selectedSlot={selectedSlot}
            sport={titleSport(match.sportType)}
          />
          {/* readable roster list with photos */}
          <div className="mt-5 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
            {Object.entries(pitchAssignments).map(([slot, p]) => (
              <div key={slot} className="flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900/40 px-2.5 py-2">
                <PlayerFace photoUrl={p.photoUrl} name={p.name} sport={p.sport} size={28} rounded="rounded-lg" />
                <div className="min-w-0">
                  <p className="text-[11px] font-bold text-slate-200 truncate">{p.name}</p>
                  <p className="text-[9px] text-slate-500 truncate">{slots[slot]?.label || String(p.position || "").replace(/_/g, " ")} · #{p.number ?? "—"}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* bench (only while editing) */}
        {editing && (
          <aside className="h-fit">
            <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-3">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.25em]">Bench</h3>
                <span className="text-[10px] font-black text-slate-400">{bench.length}</span>
              </div>
              {bench.length === 0 ? (
                <p className="text-[11px] text-slate-600 italic">All squad players are on the pitch.</p>
              ) : (
                <ul className="space-y-1.5 max-h-[420px] overflow-y-auto pr-1">
                  {bench.map(p => (
                    <li key={p.id}>
                      <div draggable
                        onDragStart={(e) => { e.dataTransfer.setData("bench-player", String(p.id)); e.dataTransfer.effectAllowed = "copy"; }}
                        className="w-full flex items-center gap-3 px-3 py-2 rounded-xl bg-slate-950/50 border border-slate-800 hover:border-emerald-500/50 transition-all cursor-grab active:cursor-grabbing">
                        <PlayerFace photoUrl={p.photoUrl} name={`${p.firstName} ${p.lastName}`} sport={resolveSport(p.preferredPosition)} size={30} rounded="rounded-lg" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-slate-200 truncate">{p.firstName} {p.lastName}</p>
                          <p className="text-[9px] font-black uppercase tracking-widest text-emerald-400 truncate">{String(p.preferredPosition || "").replace(/_/g, " ")}</p>
                        </div>
                        <span className="text-[10px] font-mono text-slate-500">#{p.kitNumber ?? "—"}</span>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
              <p className="mt-2 text-[10px] text-slate-600 leading-snug">Drag a bench player onto a slot to swap him in.</p>
            </div>
          </aside>
        )}
      </div>

      {toast && (
        <div className={`fixed top-6 right-6 z-[140] px-5 py-3 rounded-xl font-bold text-sm shadow-2xl border ${toast.type === "error" ? "bg-red-500/15 border-red-500/40 text-red-200" : "bg-emerald-500/15 border-emerald-500/40 text-emerald-200"}`}>
          {toast.msg}
        </div>
      )}
    </div>
  );
}

// Map STARTING_11 rows onto pitch slot indices. Football: greedily match each row
// to the first free slot whose position enum matches; leftovers fill remaining
// slots in order. Non-football: simple positional order.
function mapRowsToSlots(rows, slots, isFootball, onPitch) {
  const out = {};
  if (!isFootball) {
    rows.slice(0, onPitch).forEach((r, i) => { out[i] = r.playerId; });
    return out;
  }
  const used = new Array(slots.length).fill(false);
  const leftovers = [];
  rows.forEach((r) => {
    let placed = false;
    for (let i = 0; i < slots.length; i++) {
      if (!used[i] && slots[i].pos && r.position && String(slots[i].pos) === String(r.position)) {
        out[i] = r.playerId; used[i] = true; placed = true; break;
      }
    }
    if (!placed) leftovers.push(r);
  });
  // place any unmatched rows into the next free slots, in order
  let li = 0;
  for (let i = 0; i < slots.length && li < leftovers.length; i++) {
    if (!used[i]) { out[i] = leftovers[li++].playerId; used[i] = true; }
  }
  return out;
}
