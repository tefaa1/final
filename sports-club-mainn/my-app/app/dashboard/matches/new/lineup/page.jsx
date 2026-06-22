"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/src/lib/api";
import { resolveSport, resolveSportUpper } from "@/src/lib/playerSport";
import PlayerFace from "@/src/components/matches/PlayerFace";
import LineupPitch from "@/src/components/matches/LineupPitch";
import { FORMATION_LAYOUTS, FORMATION_NAMES, SPORT_PLAYERS_ON_PITCH, genericLayout, autoFillLineup } from "@/src/components/matches/formationLayouts";
import { setPlayerDragImage } from "@/src/components/matches/dragGhost";
import { formatKickoff } from "@/src/components/matches/liveClock";
import { loadDraftMatch, clearDraftMatch } from "@/src/components/matches/draftMatch";
import { FiArrowLeft, FiCheck, FiAlertTriangle, FiGrid, FiZap } from "react-icons/fi";

const unwrapArr = (r) => r?.data || r?.content || (Array.isArray(r) ? r : []);
const prettyPos = (p) => String(p || "").replace(/_/g, " ");
const titleSport = (s) => { const x = String(s || "").toLowerCase(); return x ? x[0].toUpperCase() + x.slice(1) : "Football"; };
const BARCA_CREST = "https://crests.football-data.org/81.png";

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

// DRAFT lineup builder. The match does NOT exist in the backend yet — it lives
// only as a draft payload in sessionStorage. We create the formation, the match
// and the starting-XI lineup rows TOGETHER, only when the user saves a complete
// lineup. If they leave, nothing is ever persisted (no lineup-less match).
export default function DraftLineupBuilderPage() {
  const router = useRouter();

  const [draft, setDraft] = useState(undefined); // undefined = loading, null = none
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);

  const [formation, setFormation] = useState(null);      // null = not chosen yet
  const [draftFormation, setDraftFormation] = useState("4-3-3");
  const [assignments, setAssignments] = useState({});    // slotIndex -> playerId
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [leavePrompt, setLeavePrompt] = useState(null);

  const payload = draft?.payload || null;
  const sportUpper = String(payload?.sportType || "FOOTBALL").toUpperCase();
  const isFootball = sportUpper === "FOOTBALL";
  const onPitch = SPORT_PLAYERS_ON_PITCH[sportUpper] || 11;

  const slots = useMemo(() => {
    if (!isFootball) return genericLayout(onPitch);
    return FORMATION_LAYOUTS[formation || draftFormation] || FORMATION_LAYOUTS["4-3-3"];
  }, [isFootball, formation, draftFormation, onPitch]);

  const showToast = (msg, type = "success") => { setToast({ msg, type }); setTimeout(() => setToast(null), 2600); };

  useEffect(() => {
    const d = loadDraftMatch();
    setDraft(d || null);
    if (d?.formation && FORMATION_LAYOUTS[d.formation]) setDraftFormation(d.formation);
    (async () => {
      try {
        const lists = await Promise.all(["AVAILABLE", "INJURED", "SUSPENDED", "ABSENT"].map(s => api.getPlayers(s).catch(() => [])));
        const byId = new Map();
        lists.flatMap(unwrapArr).forEach(p => byId.set(p.id, p));
        setPlayers([...byId.values()]);
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    })();
  }, []);

  // A draft lineup is always "unsaved work" — warn on hard navigation away.
  useEffect(() => {
    const handler = (e) => { if (draft) { e.preventDefault(); e.returnValue = ""; return ""; } };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [draft]);

  const squad = players.filter(p => resolveSportUpper(p.preferredPosition) === sportUpper);
  const playerById = (pid) => players.find(p => p.id === pid);
  const assignedIds = Object.values(assignments);
  const bench = squad.filter(p => !assignedIds.includes(p.id));
  const placedCount = Object.keys(assignments).length;
  const lineupComplete = placedCount === slots.length;

  const pitchAssignments = useMemo(() => {
    const out = {};
    Object.entries(assignments).forEach(([slot, pid]) => {
      const p = playerById(pid);
      if (!p) return;
      out[slot] = { id: p.id, name: `${p.firstName} ${p.lastName}`, number: p.kitNumber, position: p.preferredPosition, photoUrl: p.photoUrl, sport: resolveSport(p.preferredPosition) };
    });
    return out;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assignments, players]);

  const dropBenchPlayer = (pid, slotIndex) => {
    setAssignments(prev => {
      const next = { ...prev };
      for (const k of Object.keys(next)) if (next[k] === pid) delete next[k];
      next[slotIndex] = pid;
      return next;
    });
  };
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
    if (selectedSlot === null) { setSelectedSlot(slotIndex); return; }
    if (selectedSlot === slotIndex) { setSelectedSlot(null); return; }
    moveSlot(selectedSlot, slotIndex);
    setSelectedSlot(null);
  };
  const assignToFirstFree = (pid) => {
    setAssignments(prev => { for (let i = 0; i < slots.length; i++) if (prev[i] === undefined) return { ...prev, [i]: pid }; return prev; });
  };
  const removeFromPitch = (slotIndex) => { setAssignments(prev => { const next = { ...prev }; delete next[slotIndex]; return next; }); };

  // Auto-fill the slots of a given formation with sensible players from the
  // squad (GK in goal, defenders in defence, …), so the user starts from a full
  // XI and can then drag/swap. Football only — generic sports just keep the
  // first-N order.
  const fillFor = (formationName) => {
    if (!isFootball) {
      const layout = genericLayout(onPitch);
      const next = {};
      squad.slice(0, layout.length).forEach((p, i) => { next[i] = p.id; });
      setAssignments(next);
      return;
    }
    const layout = FORMATION_LAYOUTS[formationName] || FORMATION_LAYOUTS["4-3-3"];
    setAssignments(autoFillLineup(layout, squad));
  };

  const confirmFormation = () => { setFormation(draftFormation); fillFor(draftFormation); };
  const changeFormation = (f) => { setDraftFormation(f); setFormation(f); fillFor(f); };
  const refillLineup = () => { fillFor(formation || draftFormation); setSelectedSlot(null); };

  // Create formation → match → lineup rows TOGETHER. Only here is anything
  // persisted, and only with a complete starting XI.
  const handleSaveAndFinish = async () => {
    if (!payload) return;
    if (!lineupComplete) { showToast(`Fill all ${slots.length} positions before saving`, "error"); return; }
    setSaving(true);
    try {
      const teamId = Number(payload.homeTeamId) || 1;
      const useFormation = isFootball ? (formation || draftFormation) : "Lineup";
      const placed = Object.entries(assignments).filter(([, pid]) => pid != null);

      const formationDetails = placed.map(([slot, pid]) => {
        const p = playerById(pid); const sl = slots[slot];
        return `${sl?.label || ""} ${p ? p.firstName + " " + p.lastName : ""}`.trim();
      }).join("; ");

      // 1) Formation
      const fres = await api.createMatchFormation({ teamId, formation: useFormation, tacticalApproach: "Balanced", formationDetails });
      const formationId = fres?.data?.id || fres?.id;
      if (!formationId) throw new Error("Could not create the formation.");

      // 2) Match (now that we have a real lineup to attach)
      const mres = await api.createMatch({ ...payload, matchFormationId: formationId });
      const matchId = mres?.data?.id || mres?.id;
      if (!matchId) throw new Error("Match was created but no id came back.");

      // 3) Lineup rows
      for (const [slot, pid] of placed) {
        const p = playerById(pid) || {};
        const sl = slots[slot] || {};
        try {
          await api.createMatchLineup({
            teamId, playerId: pid, matchFormationId: formationId,
            lineupStatus: "STARTING_11",
            position: sl.pos || p.preferredPosition || undefined,
            jerseyNumber: p.kitNumber ? Number(p.kitNumber) : undefined,
          });
        } catch (e) { console.error("lineup row failed", e); }
      }

      clearDraftMatch();
      router.push("/dashboard/matches");
    } catch (e) {
      console.error(e); showToast(e.message || "Save failed", "error");
      setSaving(false);
    }
  };

  const guardedLeave = (target) => { setLeavePrompt(target); };
  const doLeave = (target) => { clearDraftMatch(); router.push(target); };

  if (loading || draft === undefined) return <div className="text-center py-32 text-slate-500 font-black uppercase text-[11px] tracking-widest animate-pulse">Loading lineup builder…</div>;

  // No draft (refresh / direct hit) — nothing pending, send them back to start.
  if (!draft || !payload) {
    return (
      <div className="max-w-xl mx-auto mt-20 rounded-3xl border border-amber-500/30 bg-slate-900/40 p-8 text-center shadow-2xl">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-300 mb-5"><FiAlertTriangle size={26} /></div>
        <h2 className="text-xl font-black text-white uppercase tracking-tight">No match in progress</h2>
        <p className="text-[13px] text-slate-400 leading-relaxed mt-3 max-w-sm mx-auto">There's no draft match to build a lineup for. Start by choosing a match type — the match is only saved once you've set its starting lineup.</p>
        <button onClick={() => router.push("/dashboard/matches/new")} className="mt-6 inline-flex items-center gap-2 px-7 py-3 rounded-xl bg-emerald-600 text-white font-black text-xs uppercase tracking-widest hover:bg-emerald-500 shadow-lg shadow-emerald-500/20 transition-all">Schedule a match</button>
      </div>
    );
  }

  const oppName = payload.opponentName || "Opponent";
  const formationChosen = !isFootball || formation != null;

  return (
    <div className="w-full min-h-full bg-slate-950 fade-in">
      {/* header */}
      <div className="relative overflow-hidden border-b border-slate-800 bg-gradient-to-r from-[#0a1a3f] via-slate-900 to-[#3b0a2a]">
        <div className="absolute -right-10 -top-16 w-72 h-72 rounded-full bg-emerald-500/10 blur-3xl" />
        <div className="relative max-w-6xl mx-auto px-6 md:px-10 py-7">
          <button onClick={() => guardedLeave("/dashboard/matches/new")}
            className="flex items-center gap-2 text-slate-400 hover:text-white text-[11px] font-bold uppercase tracking-widest mb-4 transition-colors">
            <FiArrowLeft /> Back
          </button>
          <div className="flex items-center gap-3">
            <img src={BARCA_CREST} alt="" className="w-9 h-9 object-contain" />
            <div>
              <h1 className="font-black text-white text-2xl md:text-3xl uppercase tracking-tight leading-none">Lineup &amp; Formation</h1>
              <p className="text-[11px] text-slate-400 uppercase tracking-[0.22em] mt-2">FC Barcelona vs {oppName} · {titleSport(payload.sportType)} · {formatKickoff(payload.kickoffTime)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* MANDATORY banner */}
      <div className="max-w-6xl mx-auto px-6 md:px-10 pt-6">
        <div className="flex items-start gap-3 rounded-2xl border border-amber-500/40 bg-amber-500/[0.07] px-4 py-3.5">
          <FiAlertTriangle className="text-amber-400 mt-0.5 shrink-0" />
          <p className="text-[12px] text-amber-200/90 leading-snug">
            <span className="font-black">The match isn't saved yet.</span> It's only created once a full starting {slots.length} is set — so it can auto-go-live at kickoff. Fill every position, then <span className="font-bold">Save &amp; Create Match</span>. Leaving now discards it.
          </p>
        </div>
      </div>

      {!formationChosen ? (
        /* STEP 1: choose formation */
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
        /* STEP 2: build the lineup */
        <div className="max-w-6xl mx-auto px-6 md:px-10 py-8 pb-28">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8">
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
              <LineupPitch slots={slots} assignments={pitchAssignments} onDropPlayer={dropBenchPlayer} onMoveSlot={moveSlot} onSlotTap={onSlotTap} selectedSlot={selectedSlot} sport={titleSport(payload.sportType)} />

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

            {/* BENCH */}
            <aside className="lg:sticky lg:top-6 h-fit">
              <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.25em]">Bench / Squad</h3>
                  <span className="text-[10px] font-black text-slate-400">{bench.length}</span>
                </div>
                {squad.length === 0 ? (
                  <p className="text-[11px] text-slate-600 italic">No {titleSport(payload.sportType)} players available.</p>
                ) : bench.length === 0 ? (
                  <p className="text-[11px] text-slate-600 italic">All squad players are on the pitch.</p>
                ) : (
                  <ul className="space-y-1.5 max-h-[560px] overflow-y-auto pr-1">
                    {bench.map(p => (
                      <li key={p.id}>
                        <div draggable
                          onDragStart={(e) => {
                            e.dataTransfer.setData("bench-player", String(p.id));
                            e.dataTransfer.effectAllowed = "copy";
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

      {/* sticky save bar */}
      {formationChosen && (
        <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-slate-800 bg-slate-950/95 backdrop-blur-md">
          <div className="max-w-6xl mx-auto px-6 md:px-10 py-4 flex items-center gap-4">
            <p className="text-[11px] hidden sm:block">
              <span className={lineupComplete ? "text-emerald-400 font-black" : "text-slate-500"}>{placedCount}/{slots.length} placed</span>
              <span className="text-slate-600"> · {bench.length} on bench</span>
            </p>
            <button onClick={() => guardedLeave("/dashboard/matches")} disabled={saving}
              className="ml-auto px-6 py-3 rounded-xl border border-slate-800 text-slate-400 text-xs font-bold uppercase tracking-widest hover:bg-slate-900 transition-all disabled:opacity-50">Cancel</button>
            <button onClick={handleSaveAndFinish} disabled={saving || !lineupComplete}
              title={lineupComplete ? "Save the lineup and create the match" : `Fill all ${slots.length} positions to finish`}
              className="px-8 py-3 rounded-xl bg-emerald-600 text-white font-black text-xs uppercase tracking-widest hover:bg-emerald-500 shadow-lg shadow-emerald-500/20 transition-all disabled:opacity-40 flex items-center gap-2">
              <FiCheck /> {saving ? "Creating…" : "Save & Create Match"}
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
              <h3 className="font-black text-white uppercase tracking-tight">Discard this match?</h3>
            </div>
            <div className="px-6 py-5">
              <p className="text-[13px] text-slate-400 leading-relaxed">This match hasn't been saved — it's only created once its lineup is set. If you leave now, nothing is saved and you'll start over.</p>
            </div>
            <div className="px-6 py-4 border-t border-slate-800 flex gap-3">
              <button onClick={() => setLeavePrompt(null)}
                className="flex-1 py-2.5 rounded-xl border border-slate-800 text-slate-300 text-[11px] font-black uppercase tracking-widest hover:bg-slate-900 transition-all">Stay &amp; build lineup</button>
              <button onClick={() => { const t = leavePrompt; setLeavePrompt(null); doLeave(t); }}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 text-white text-[11px] font-black uppercase tracking-widest hover:bg-rose-500 transition-all">Discard &amp; leave</button>
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
