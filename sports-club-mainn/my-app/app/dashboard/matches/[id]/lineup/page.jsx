"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { api } from "@/src/lib/api";
import { lookupTeam } from "@/src/lib/teamDirectory";
import { resolveSport, resolveSportUpper } from "@/src/lib/playerSport";
import PlayerFace from "@/src/components/matches/PlayerFace";
import LineupPitch from "@/src/components/matches/LineupPitch";
import { FORMATION_LAYOUTS, FORMATION_NAMES, SPORT_PLAYERS_ON_PITCH, genericLayout, autoFillLineup } from "@/src/components/matches/formationLayouts";
import { setPlayerDragImage } from "@/src/components/matches/dragGhost";
import { formatKickoff } from "@/src/components/matches/liveClock";
import { FiArrowLeft, FiSave, FiCheck, FiAlertTriangle, FiGrid, FiZap } from "react-icons/fi";

const unwrapArr = (r) => r?.data || r?.content || (Array.isArray(r) ? r : []);
const unwrapOne = (r) => r?.data || r;
const prettyPos = (p) => String(p || "").replace(/_/g, " ");
const titleSport = (s) => { const x = String(s || "").toLowerCase(); return x ? x[0].toUpperCase() + x.slice(1) : "General"; };

// Short description of each formation for the chooser cards.
const FORMATION_BLURB = {
  "4-3-3": "Barça's classic — width from wingers, control in midfield.",
  "4-4-2": "Two banks of four, a strike partnership up top.",
  "3-5-2": "Three at the back, wing-backs push the flanks.",
  "4-2-3-1": "Double pivot shields the back four behind a 10.",
  "4-1-2-3": "A single pivot frees two 8s behind a front three.",
  "5-3-2": "Five defenders — compact and counter-ready.",
  "3-4-3": "Three at the back, a bold front three.",
  "4-5-1": "Packed midfield, a lone striker — solid & flexible.",
};

export default function LineupBuilderPage() {
  const { id } = useParams();
  const matchId = Number(id);
  const router = useRouter();
  const searchParams = useSearchParams();
  // When we arrive straight from match creation, a lineup is MANDATORY before
  // the user can finish — leaving without saving is blocked & warned.
  const isNew = searchParams.get("new") === "1";

  const [match, setMatch] = useState(null);
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);

  // Force the user to pick a formation FIRST. Until they confirm, the pitch
  // (empty slots) is not shown.
  const [formation, setFormation] = useState(null);     // null = not chosen yet
  const [draftFormation, setDraftFormation] = useState("4-3-3");
  // assignments: slotIndex -> playerId
  const [assignments, setAssignments] = useState({});
  // tap-to-swap selection
  const [selectedSlot, setSelectedSlot] = useState(null);
  // existing lineup rows keyed by playerId (so we can PUT updates on save)
  const [existingRows, setExistingRows] = useState({});
  const [existingFormationId, setExistingFormationId] = useState(null);
  // Has a complete lineup been persisted? Gates the live view + "Finish".
  const [savedLineup, setSavedLineup] = useState(false);
  // dirty = there are unsaved changes (blocks leaving when mandatory)
  const [dirty, setDirty] = useState(false);
  const [leavePrompt, setLeavePrompt] = useState(null); // a pending navigation target

  const sportUpper = String(match?.sportType || "FOOTBALL").toUpperCase();
  const isFootball = sportUpper === "FOOTBALL";
  const onPitch = SPORT_PLAYERS_ON_PITCH[sportUpper] || 11;

  const slots = useMemo(() => {
    if (!isFootball) return genericLayout(onPitch);
    return FORMATION_LAYOUTS[formation || draftFormation] || FORMATION_LAYOUTS["4-3-3"];
  }, [isFootball, formation, draftFormation, onPitch]);

  const showToast = (msg, type = "success") => { setToast({ msg, type }); setTimeout(() => setToast(null), 2600); };

  // Load match + squad + any existing lineup.
  useEffect(() => {
    (async () => {
      try {
        const m = unwrapOne(await api.getMatchById(matchId));
        setMatch(m);

        const lists = await Promise.all(["AVAILABLE", "INJURED", "SUSPENDED", "ABSENT"].map(s => api.getPlayers(s).catch(() => [])));
        const byId = new Map();
        lists.flatMap(unwrapArr).forEach(p => byId.set(p.id, p));
        setPlayers([...byId.values()]);

        if (m?.matchFormationId) {
          setExistingFormationId(m.matchFormationId);
          let chosen = null;
          try {
            const f = unwrapOne(await api.getMatchFormationById(m.matchFormationId));
            if (f?.formation && FORMATION_LAYOUTS[f.formation]) chosen = f.formation;
          } catch { /* ignore */ }
          const rows = unwrapArr(await api.getMatchLineups()).filter(l => l.matchFormationId === m.matchFormationId && l.lineupStatus === "STARTING_11");
          const rowMap = {}; rows.forEach(r => { rowMap[r.playerId] = r; });
          setExistingRows(rowMap);

          if (rows.length > 0) {
            // There's already a saved lineup → confirm the formation and place players.
            const useFormation = chosen || "4-3-3";
            setFormation(useFormation);
            setDraftFormation(useFormation);
            const isFoot = String(m?.sportType || "FOOTBALL").toUpperCase() === "FOOTBALL";
            const layout = FORMATION_LAYOUTS[useFormation] || FORMATION_LAYOUTS["4-3-3"];
            const cap = isFoot ? layout.length : (SPORT_PLAYERS_ON_PITCH[String(m?.sportType || "FOOTBALL").toUpperCase()] || 11);
            // Place each saved row on the slot whose position enum matches (so the
            // GK lands in the GK slot, etc.), then drop any leftovers into the next
            // free slots — robust even if rows aren't stored in slot order.
            const init = {};
            if (isFoot) {
              const used = new Array(layout.length).fill(false);
              const leftovers = [];
              rows.forEach((r) => {
                let placed = false;
                for (let i = 0; i < layout.length; i++) {
                  if (!used[i] && layout[i].pos && r.position && String(layout[i].pos) === String(r.position)) {
                    init[i] = r.playerId; used[i] = true; placed = true; break;
                  }
                }
                if (!placed) leftovers.push(r);
              });
              let li = 0;
              for (let i = 0; i < layout.length && li < leftovers.length; i++) {
                if (!used[i]) { init[i] = leftovers[li++].playerId; used[i] = true; }
              }
            } else {
              rows.slice(0, cap).forEach((r, i) => { init[i] = r.playerId; });
            }
            setAssignments(init);
            setSavedLineup(true);
          } else if (chosen) {
            setDraftFormation(chosen);
          }
        }
      } catch (e) {
        console.error(e); showToast("Failed to load match", "error");
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matchId]);

  // Warn on hard browser navigation while a mandatory lineup is unsaved.
  useEffect(() => {
    const handler = (e) => {
      if ((isNew && !savedLineup) || dirty) { e.preventDefault(); e.returnValue = ""; return ""; }
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [isNew, savedLineup, dirty]);

  const squad = players.filter(p => resolveSportUpper(p.preferredPosition) === sportUpper);
  const playerById = (pid) => players.find(p => p.id === pid);
  const assignedIds = Object.values(assignments);
  const bench = squad.filter(p => !assignedIds.includes(p.id));
  const placedCount = Object.keys(assignments).length;
  const lineupComplete = placedCount === slots.length;

  // Pitch assignment objects (rich player cards, with photos).
  const pitchAssignments = useMemo(() => {
    const out = {};
    Object.entries(assignments).forEach(([slot, pid]) => {
      const p = playerById(pid);
      if (!p) return;
      out[slot] = {
        id: p.id,
        name: `${p.firstName} ${p.lastName}`,
        number: p.kitNumber,
        position: p.preferredPosition,
        photoUrl: p.photoUrl,
        sport: resolveSport(p.preferredPosition),
      };
    });
    return out;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assignments, players]);

  const markDirty = () => { setDirty(true); setSavedLineup(false); };

  // Drag a BENCH player onto a slot (replaces whoever was there).
  const dropBenchPlayer = (pid, slotIndex) => {
    setAssignments(prev => {
      const next = { ...prev };
      // if the player is already on the pitch elsewhere, remove him from there first
      for (const k of Object.keys(next)) if (next[k] === pid) delete next[k];
      next[slotIndex] = pid;
      return next;
    });
    markDirty();
  };

  // Move/swap between two slots (drag a pitch player onto another slot).
  const moveSlot = (from, to) => {
    setAssignments(prev => {
      const next = { ...prev };
      const a = next[from]; const b = next[to];
      if (b === undefined) delete next[from]; else next[from] = b;
      if (a === undefined) delete next[to]; else next[to] = a;
      return next;
    });
    markDirty();
  };

  // Tap a slot: first tap selects, second tap swaps; tapping a filled slot twice removes.
  const onSlotTap = (slotIndex) => {
    if (selectedSlot === null) { setSelectedSlot(slotIndex); return; }
    if (selectedSlot === slotIndex) { setSelectedSlot(null); return; }
    moveSlot(selectedSlot, slotIndex);
    setSelectedSlot(null);
  };

  const assignToFirstFree = (pid) => {
    setAssignments(prev => {
      for (let i = 0; i < slots.length; i++) if (prev[i] === undefined) { markDirty(); return { ...prev, [i]: pid }; }
      return prev;
    });
  };

  const removeFromPitch = (slotIndex) => {
    setAssignments(prev => { const next = { ...prev }; delete next[slotIndex]; return next; });
    markDirty();
  };

  // Auto-fill a formation's slots with sensible players from the squad (GK in
  // goal, defenders in defence, …) so the user starts from a full XI.
  const fillFor = (formationName) => {
    if (!isFootball) {
      const layout = genericLayout(onPitch);
      const next = {};
      squad.slice(0, layout.length).forEach((p, i) => { next[i] = p.id; });
      setAssignments(next); markDirty();
      return;
    }
    const layout = FORMATION_LAYOUTS[formationName] || FORMATION_LAYOUTS["4-3-3"];
    setAssignments(autoFillLineup(layout, squad)); markDirty();
  };

  // Confirm the chosen formation → reveal the pitch slots, auto-filled with a
  // sensible starting XI the user can then drag/swap.
  const confirmFormation = () => { setFormation(draftFormation); fillFor(draftFormation); };
  // Change formation later (keeps existing assignments by slot index; use the
  // Re-fill button to repopulate from scratch for the new shape).
  const changeFormation = (f) => { setDraftFormation(f); setFormation(f); markDirty(); };
  const refillLineup = () => { fillFor(formation || draftFormation); setSelectedSlot(null); };

  // Persist the lineup. Requires a COMPLETE lineup (every slot filled) so the
  // match is ready to auto-go-live at kickoff.
  const handleSave = async (thenFinish = false) => {
    if (!match) return;
    const placed = Object.entries(assignments).filter(([, pid]) => pid != null);
    if (!lineupComplete) {
      showToast(`Fill all ${slots.length} positions before saving`, "error");
      return false;
    }
    setSaving(true);
    try {
      const teamId = Number(match.homeTeamId) || 1;
      const useFormation = isFootball ? (formation || draftFormation) : "Lineup";
      let formationId = existingFormationId;

      const formationDetails = placed.map(([slot, pid]) => {
        const p = playerById(pid); const sl = slots[slot];
        return `${sl?.label || ""} ${p ? p.firstName + " " + p.lastName : ""}`.trim();
      }).join("; ");

      if (formationId) {
        await api.updateMatchFormation(formationId, { teamId, formation: useFormation, tacticalApproach: "Balanced", formationDetails });
      } else {
        const fres = await api.createMatchFormation({ teamId, formation: useFormation, tacticalApproach: "Balanced", formationDetails });
        formationId = unwrapOne(fres)?.id || fres?.id;
      }

      for (const [slot, pid] of placed) {
        const p = playerById(pid) || {};
        const sl = slots[slot] || {};
        const body = {
          teamId, playerId: pid, matchFormationId: formationId,
          lineupStatus: "STARTING_11",
          position: sl.pos || p.preferredPosition || undefined,
          jerseyNumber: p.kitNumber ? Number(p.kitNumber) : undefined,
        };
        const existing = existingRows[pid];
        try {
          if (existing) await api.updateMatchLineup(existing.id, body);
          else await api.createMatchLineup(body);
        } catch (e) { console.error("lineup row failed", e); }
      }

      // Remove rows for players dropped from the lineup.
      for (const [pid, row] of Object.entries(existingRows)) {
        if (!assignedIds.includes(Number(pid))) {
          try { await api.deleteMatchLineup(row.id); } catch { /* ignore */ }
        }
      }

      await api.updateMatch(matchId, { matchFormationId: formationId });

      const rows = unwrapArr(await api.getMatchLineups()).filter(l => l.matchFormationId === formationId && l.lineupStatus === "STARTING_11");
      const rowMap = {}; rows.forEach(r => { rowMap[r.playerId] = r; });
      setExistingRows(rowMap);
      setExistingFormationId(formationId);
      setSavedLineup(true);
      setDirty(false);

      if (thenFinish) {
        router.push("/dashboard/matches");
      } else {
        showToast("Lineup saved");
      }
      return true;
    } catch (e) {
      console.error(e); showToast(e.message || "Save failed", "error");
      return false;
    } finally {
      setSaving(false);
    }
  };

  // Guarded navigation: if a mandatory lineup isn't saved (or there are unsaved
  // changes) ask before leaving.
  const guardedLeave = (target) => {
    if ((isNew && !savedLineup) || dirty) { setLeavePrompt(target); return; }
    router.push(target);
  };

  if (loading) return <div className="text-center py-32 text-slate-500 font-black uppercase text-[11px] tracking-widest animate-pulse">Loading lineup builder…</div>;
  if (!match) return <div className="text-center py-32 text-slate-400">Match not found.</div>;

  const home = lookupTeam(match.homeTeamId);
  const homeName = home?.name || "FC Barcelona";
  const oppName = match.opponentName || "Opponent";
  const formationChosen = !isFootball || formation != null;

  return (
    <div className="w-full min-h-full bg-slate-950 fade-in">
      {/* header */}
      <div className="relative overflow-hidden border-b border-slate-800 bg-gradient-to-r from-[#0a1a3f] via-slate-900 to-[#3b0a2a]">
        <div className="absolute -right-10 -top-16 w-72 h-72 rounded-full bg-emerald-500/10 blur-3xl" />
        <div className="relative max-w-6xl mx-auto px-6 md:px-10 py-7">
          <button onClick={() => guardedLeave("/dashboard/matches")}
            className="flex items-center gap-2 text-slate-400 hover:text-white text-[11px] font-bold uppercase tracking-widest mb-4 transition-colors">
            <FiArrowLeft /> Back to Match Hub
          </button>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <img src={home?.crestUrl || "https://crests.football-data.org/81.png"} alt="" className="w-9 h-9 object-contain" />
              <div>
                <h1 className="font-black text-white text-2xl md:text-3xl uppercase tracking-tight leading-none">Lineup &amp; Formation</h1>
                <p className="text-[11px] text-slate-400 uppercase tracking-[0.22em] mt-2">{homeName} vs {oppName} · {titleSport(match.sportType)} · {formatKickoff(match.kickoffTime)}</p>
              </div>
            </div>
            {savedLineup && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-emerald-500/40 bg-emerald-500/10 text-emerald-300 text-[10px] font-black uppercase tracking-widest">
                <FiCheck /> Lineup saved
              </span>
            )}
          </div>
        </div>
      </div>

      {/* MANDATORY banner when arriving from creation */}
      {isNew && !savedLineup && (
        <div className="max-w-6xl mx-auto px-6 md:px-10 pt-6">
          <div className="flex items-start gap-3 rounded-2xl border border-amber-500/40 bg-amber-500/[0.07] px-4 py-3.5">
            <FiAlertTriangle className="text-amber-400 mt-0.5 shrink-0" />
            <p className="text-[12px] text-amber-200/90 leading-snug">
              <span className="font-black">A lineup is required to finish creating this match.</span> The match auto-goes live when its kickoff time arrives, so it must already have a full starting {slots.length}. Fill every position, then <span className="font-bold">Save &amp; Finish</span>.
            </p>
          </div>
        </div>
      )}

      {!formationChosen ? (
        /* ── STEP 1: FORCE A FORMATION CHOICE FIRST ─────────────────── */
        <div className="max-w-4xl mx-auto px-6 md:px-10 py-10 pb-28">
          <div className="flex items-center gap-2 mb-2">
            <FiGrid className="text-emerald-400" />
            <h2 className="text-[11px] font-black text-emerald-400 uppercase tracking-[0.25em]">Choose a Formation First</h2>
          </div>
          <p className="text-[12px] text-slate-500 mb-7">Pick the shape — the pitch will show empty {onPitch} positions for it. You can change it later.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {FORMATION_NAMES.map(f => {
              const active = draftFormation === f;
              return (
                <button key={f} onClick={() => setDraftFormation(f)}
                  className={`text-left rounded-2xl border p-5 transition-all ${active ? "border-emerald-500/60 bg-emerald-500/10 ring-1 ring-emerald-500/30" : "border-slate-800 bg-slate-900/40 hover:border-slate-700"}`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-2xl font-black text-white tracking-tight">{f}</span>
                    {active && <FiCheck className="text-emerald-400" />}
                  </div>
                  <p className="text-[11px] text-slate-400 leading-snug">{FORMATION_BLURB[f] || "A balanced shape."}</p>
                </button>
              );
            })}
          </div>
          <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-slate-800 bg-slate-950/95 backdrop-blur-md">
            <div className="max-w-4xl mx-auto px-6 md:px-10 py-4 flex items-center gap-4">
              <p className="text-[11px] text-slate-500 hidden sm:block">Formation: <span className="font-black text-slate-300">{draftFormation}</span></p>
              <button onClick={() => guardedLeave("/dashboard/matches")} disabled={saving}
                className="ml-auto px-6 py-3 rounded-xl border border-slate-800 text-slate-400 text-xs font-bold uppercase tracking-widest hover:bg-slate-900 transition-all">Cancel</button>
              <button onClick={confirmFormation}
                className="px-8 py-3 rounded-xl bg-emerald-600 text-white font-black text-xs uppercase tracking-widest hover:bg-emerald-500 shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-2">
                <FiCheck /> Use {draftFormation}
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* ── STEP 2: BUILD THE LINEUP ───────────────────────────────── */
        <div className="max-w-6xl mx-auto px-6 md:px-10 py-8 pb-28">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8">
            {/* PITCH */}
            <div>
              {isFootball && (
                <div className="flex items-center gap-3 mb-5">
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.25em]">Formation</span>
                  <select value={formation} onChange={e => changeFormation(e.target.value)}
                    className="bg-slate-900 border border-slate-800 text-slate-100 px-4 py-2 rounded-xl focus:outline-none focus:border-emerald-500 font-black text-sm tracking-widest cursor-pointer">
                    {FORMATION_NAMES.map(f => <option key={f} value={f} className="bg-slate-950">{f}</option>)}
                  </select>
                  <button type="button" onClick={refillLineup} title="Auto-fill the XI from the squad"
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-emerald-500/40 text-emerald-300 text-[10px] font-black uppercase tracking-widest hover:bg-emerald-600 hover:text-white transition-all">
                    <FiZap /> Re-fill
                  </button>
                  <span className="text-[10px] font-bold text-slate-600 ml-auto hidden sm:block">Drag a player from the bench onto a slot · drag onto another to swap</span>
                </div>
              )}
              <LineupPitch
                slots={slots}
                assignments={pitchAssignments}
                onDropPlayer={dropBenchPlayer}
                onMoveSlot={moveSlot}
                onSlotTap={onSlotTap}
                selectedSlot={selectedSlot}
                sport={titleSport(match.sportType)}
              />

              <div className="mt-6">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.25em] mb-3">On the pitch · {placedCount}/{slots.length}</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {Object.entries(pitchAssignments).map(([slot, p]) => (
                    <div key={slot} className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/[0.06] px-2.5 py-2">
                      <PlayerFace photoUrl={p.photoUrl} name={p.name} sport={p.sport} size={28} rounded="rounded-lg" />
                      <div className="min-w-0 flex-1">
                        <p className="text-[11px] font-bold text-slate-200 truncate">{p.name}</p>
                        <p className="text-[9px] text-slate-500 truncate">{slots[slot]?.label} · #{p.number ?? "—"}</p>
                      </div>
                      <button onClick={() => removeFromPitch(slot)} className="text-slate-500 hover:text-rose-400 text-sm font-bold" title="Send to bench">✕</button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* BENCH (draggable) */}
            <aside className="lg:sticky lg:top-6 h-fit">
              <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.25em]">Bench / Squad</h3>
                  <span className="text-[10px] font-black text-slate-400">{bench.length}</span>
                </div>
                {squad.length === 0 ? (
                  <p className="text-[11px] text-slate-600 italic">No {titleSport(match.sportType)} players available.</p>
                ) : bench.length === 0 ? (
                  <p className="text-[11px] text-slate-600 italic">All squad players are on the pitch.</p>
                ) : (
                  <ul className="space-y-1.5 max-h-[560px] overflow-y-auto pr-1">
                    {bench.map(p => (
                      <li key={p.id}>
                        <div
                          draggable
                          onDragStart={(e) => {
                            e.dataTransfer.setData("bench-player", String(p.id));
                            e.dataTransfer.effectAllowed = "copy";
                            // Clean single-player drag ghost (not the whole list).
                            setPlayerDragImage(e, { photoUrl: p.photoUrl, name: `${p.firstName} ${p.lastName}` });
                          }}
                          onClick={() => assignToFirstFree(p.id)}
                          className="w-full flex items-center gap-3 px-3 py-2 rounded-xl bg-slate-950/50 border border-slate-800 hover:border-emerald-500/50 hover:bg-emerald-500/[0.04] transition-all text-left cursor-grab active:cursor-grabbing">
                          <PlayerFace photoUrl={p.photoUrl} name={`${p.firstName} ${p.lastName}`} sport={resolveSport(p.preferredPosition)} size={32} rounded="rounded-lg" />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold text-slate-200 truncate">{p.firstName} {p.lastName}</p>
                            <p className="text-[9px] font-black uppercase tracking-widest text-emerald-400 truncate">{prettyPos(p.preferredPosition)}</p>
                          </div>
                          <span className="text-[10px] font-mono text-slate-500">#{p.kitNumber ?? "—"}</span>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
                <p className="mt-3 text-[10px] text-slate-600 leading-snug">Drag onto a slot, or tap to fill the next free position.</p>
              </div>
            </aside>
          </div>
        </div>
      )}

      {/* sticky save bar (only on the build step) */}
      {formationChosen && (
        <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-slate-800 bg-slate-950/95 backdrop-blur-md">
          <div className="max-w-6xl mx-auto px-6 md:px-10 py-4 flex items-center gap-4">
            <p className="text-[11px] hidden sm:block">
              <span className={lineupComplete ? "text-emerald-400 font-black" : "text-slate-500"}>{placedCount}/{slots.length} placed</span>
              <span className="text-slate-600"> · {bench.length} on bench</span>
            </p>
            <button onClick={() => guardedLeave("/dashboard/matches")} disabled={saving}
              className="ml-auto px-6 py-3 rounded-xl border border-slate-800 text-slate-400 text-xs font-bold uppercase tracking-widest hover:bg-slate-900 transition-all disabled:opacity-50">Cancel</button>
            {!isNew && (
              <button onClick={() => handleSave(false)} disabled={saving || !lineupComplete}
                title={lineupComplete ? "Save lineup" : `Fill all ${slots.length} positions`}
                className="px-6 py-3 rounded-xl border border-emerald-500/40 text-emerald-300 font-black text-xs uppercase tracking-widest hover:bg-emerald-600 hover:text-white transition-all disabled:opacity-40 flex items-center gap-2">
                <FiSave /> {saving ? "Saving…" : "Save"}
              </button>
            )}
            <button onClick={() => handleSave(true)} disabled={saving || !lineupComplete}
              title={lineupComplete ? "Save the lineup and finish" : `Fill all ${slots.length} positions to finish`}
              className="px-8 py-3 rounded-xl bg-emerald-600 text-white font-black text-xs uppercase tracking-widest hover:bg-emerald-500 shadow-lg shadow-emerald-500/20 transition-all disabled:opacity-40 flex items-center gap-2">
              <FiCheck /> {saving ? "Saving…" : (isNew ? "Save & Finish" : "Save & Done")}
            </button>
          </div>
        </div>
      )}

      {/* leave-confirm dialog */}
      {leavePrompt && (
        <div className="fixed inset-0 z-[130] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4" onClick={(e) => e.target === e.currentTarget && setLeavePrompt(null)}>
          <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-950 shadow-2xl overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-800 flex items-center gap-3">
              <FiAlertTriangle className="text-amber-400" />
              <h3 className="font-black text-white uppercase tracking-tight">Leave without saving?</h3>
            </div>
            <div className="px-6 py-5">
              <p className="text-[13px] text-slate-400 leading-relaxed">
                {isNew && !savedLineup
                  ? "This match has no saved lineup yet. It can't go live at kickoff without one — if you leave now it stays without a lineup."
                  : "You have unsaved changes to the lineup. Leaving now discards them."}
              </p>
            </div>
            <div className="px-6 py-4 border-t border-slate-800 flex gap-3">
              <button onClick={() => setLeavePrompt(null)}
                className="flex-1 py-2.5 rounded-xl border border-slate-800 text-slate-300 text-[11px] font-black uppercase tracking-widest hover:bg-slate-900 transition-all">Stay &amp; build lineup</button>
              <button onClick={() => { const t = leavePrompt; setLeavePrompt(null); router.push(t); }}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 text-white text-[11px] font-black uppercase tracking-widest hover:bg-rose-500 transition-all">Leave anyway</button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className={`fixed top-6 right-6 z-50 px-5 py-3 rounded-xl font-bold text-sm shadow-2xl border ${toast.type === "error" ? "bg-red-500/15 border-red-500/40 text-red-200" : "bg-emerald-500/15 border-emerald-500/40 text-emerald-200"}`}>
          {toast.msg}
        </div>
      )}
    </div>
  );
}
