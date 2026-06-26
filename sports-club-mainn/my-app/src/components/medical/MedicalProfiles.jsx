"use client";
import React, { useMemo, useState } from "react";
import PlayerAvatar from "@/src/components/shared/PlayerAvatar";
import { isActiveInjury, normStatus, stageFromInjury } from "@/src/lib/injuryActions";
import MedicalJourney from "./MedicalJourney";

// Stage order used to render the mini progress bar on each card. The bar's filled
// length is derived from stageFromInjury() — the SAME single source of truth the
// journey stepper uses — so the card label and the journey can never disagree.
const STAGE_ORDER = ["REPORTED", "DIAGNOSED", "TREATING", "RECOVERING", "RECOVERED"];
const STAGE_LABEL = { REPORTED: "Reported", DIAGNOSED: "Diagnosed", TREATING: "Treatment", RECOVERING: "Recovery", RECOVERED: "Fit again" };

const SEV = {
  MINOR: { text: "text-emerald-300", ring: "ring-emerald-500/30", bg: "bg-emerald-500/10", bar: "from-emerald-500 to-teal-500", dot: "bg-emerald-400" },
  MODERATE: { text: "text-amber-300", ring: "ring-amber-500/30", bg: "bg-amber-500/10", bar: "from-amber-500 to-orange-500", dot: "bg-amber-400" },
  SEVERE: { text: "text-orange-300", ring: "ring-orange-500/30", bg: "bg-orange-500/10", bar: "from-orange-500 to-rose-500", dot: "bg-orange-400" },
  CRITICAL: { text: "text-rose-300", ring: "ring-rose-500/40", bg: "bg-rose-500/10", bar: "from-rose-500 to-red-600", dot: "bg-rose-400" },
};
const sevTone = (s) => SEV[String(s || "").toUpperCase()] || SEV.MODERATE;
const pretty = (v) => (v ? String(v).replace(/_/g, " ") : "—");

// Premium face: real photo with the shared initials avatar as a fallback.
function Face({ player, size = 52, className = "" }) {
  const [broken, setBroken] = useState(false);
  const name = `${player?.firstName || ""} ${player?.lastName || ""}`.trim();
  const usePhoto = player?.photoUrl && !broken;
  return (
    <div className={`relative overflow-hidden rounded-2xl shrink-0 ${className}`} style={{ width: size, height: size }}>
      <PlayerAvatar name={name} sport="General" className="absolute inset-0 w-full h-full" />
      {usePhoto && (
        <img src={player.photoUrl} alt={name} loading="lazy" onError={() => setBroken(true)}
          className="absolute inset-0 w-full h-full object-cover object-top" />
      )}
    </div>
  );
}

// Pick the injury that should drive a player's card: the most recent ACTIVE one,
// otherwise the most recent injury overall.
function pickInjury(injuries) {
  if (!injuries?.length) return null;
  const byDate = [...injuries].sort((a, b) => String(b.injuryDate || "").localeCompare(String(a.injuryDate || "")));
  return byDate.find((i) => isActiveInjury(i)) || byDate[0];
}

export default function MedicalProfiles({ players, injuries, treatments, rehabilitations, recoveries, fitness, diagnoses, playerTeamMap, catalogVersion, onChanged, pushToast }) {
  const [active, setActive] = useState(null); // { player, rec, injury }

  // Group every medical record under its player id (resolving keycloak → id).
  const byPlayer = useMemo(() => {
    const idx = {};
    const ensure = (id) => (idx[id] ||= { injuries: [], treatments: [], rehabilitations: [], recoveries: [], fitness: [], diagnoses: [] });
    const kcToId = {};
    players.forEach((p) => { if (p.keycloakId) kcToId[p.keycloakId] = p.id; });
    (injuries || []).forEach((x) => x.playerId != null && ensure(x.playerId).injuries.push(x));
    (treatments || []).forEach((x) => x.playerId != null && ensure(x.playerId).treatments.push(x));
    (rehabilitations || []).forEach((x) => x.playerId != null && ensure(x.playerId).rehabilitations.push(x));
    (recoveries || []).forEach((x) => x.playerId != null && ensure(x.playerId).recoveries.push(x));
    (fitness || []).forEach((x) => { const id = kcToId[x.playerKeycloakId]; if (id != null) ensure(id).fitness.push(x); });
    (diagnoses || []).forEach((x) => { const id = kcToId[x.playerKeycloakId]; if (id != null) ensure(id).diagnoses.push(x); });
    return idx;
  }, [players, injuries, treatments, rehabilitations, recoveries, fitness, diagnoses]);

  const playerById = useMemo(() => Object.fromEntries(players.map((p) => [p.id, p])), [players]);

  // Build the two groups straight from the injury records (the real workflow
  // state) — this stays correct even if a player's status flag lags behind.
  const { injuredList, recoveredList, stats } = useMemo(() => {
    const injured = [];
    const recovered = [];
    let inRehab = 0;
    Object.entries(byPlayer).forEach(([pid, rec]) => {
      const player = playerById[pid];
      if (!player || !rec.injuries.length) return;
      const drive = pickInjury(rec.injuries);
      const st = normStatus(drive);
      const isActive = isActiveInjury(drive);
      if (st === "RECOVERING") inRehab++;
      const entry = { player, rec, injury: drive };
      if (isActive) injured.push(entry); else recovered.push(entry);
    });
    const sevRank = { CRITICAL: 0, SEVERE: 1, MODERATE: 2, MINOR: 3 };
    injured.sort((a, b) => (sevRank[String(a.injury?.severity).toUpperCase()] ?? 9) - (sevRank[String(b.injury?.severity).toUpperCase()] ?? 9));
    recovered.sort((a, b) => String(b.injury?.injuryDate || "").localeCompare(String(a.injury?.injuryDate || "")));
    return {
      injuredList: injured,
      recoveredList: recovered,
      stats: { injured: injured.length, inRehab, recovered: recovered.length, total: injured.length + recovered.length },
    };
  }, [byPlayer, playerById]);

  // Card progress is derived from the SAME source of truth as the journey stepper:
  // stageFromInjury() returns 1..6 completed lifecycle steps from injury.status.
  // The 5-step card bar highlights up to (stagesDone-1), clamped to the last step.
  const cardStageIndex = (injury) => {
    const done = stageFromInjury(injury); // 1..6
    return Math.min(Math.max(done - 1, 0), STAGE_ORDER.length - 1);
  };

  const openJourney = (entry) => setActive(entry);
  const closeJourney = () => setActive(null);

  // Re-fetch upstream, then refresh the open journey from the new data.
  const handleChanged = async () => {
    await onChanged?.();
  };

  // When data refreshes while a journey is open, re-derive its rec/injury so the
  // stepper reflects the freshly persisted records.
  const liveActive = useMemo(() => {
    if (!active) return null;
    const rec = byPlayer[active.player.id] || active.rec;
    const injury = rec?.injuries?.length ? (rec.injuries.find((i) => String(i.id) === String(active.injury?.id)) || pickInjury(rec.injuries)) : active.injury;
    return { player: playerById[active.player.id] || active.player, rec, injury };
  }, [active, byPlayer, playerById]);

  return (
    <div className="space-y-10">
      {/* ── Stats strip ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Currently Injured", value: stats.injured, icon: "personal_injury", tone: "text-rose-300", ring: "border-rose-500/20", glow: "bg-rose-500/10" },
          { label: "In Rehab / Recovery", value: stats.inRehab, icon: "healing", tone: "text-amber-300", ring: "border-amber-500/20", glow: "bg-amber-500/10" },
          { label: "Recovered / Returned", value: stats.recovered, icon: "verified", tone: "text-emerald-300", ring: "border-emerald-500/20", glow: "bg-emerald-500/10" },
          { label: "Total Cases", value: stats.total, icon: "monitor_heart", tone: "text-teal-300", ring: "border-teal-500/20", glow: "bg-teal-500/10" },
        ].map((s) => (
          <div key={s.label} className={`relative overflow-hidden rounded-3xl border ${s.ring} bg-slate-900/40 p-5`}>
            <div className={`absolute -right-6 -top-8 w-28 h-28 rounded-full blur-2xl ${s.glow}`} />
            <div className="relative">
              <span className={`material-icons text-2xl ${s.tone}`}>{s.icon}</span>
              <p className={`text-4xl font-black mt-2 ${s.tone}`}>{s.value}</p>
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500 mt-1">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Currently Injured ───────────────────────────────────────────── */}
      <section>
        <div className="flex items-center gap-3 mb-5">
          <span className="material-icons text-rose-400">personal_injury</span>
          <h2 className="text-white text-xl font-black uppercase tracking-tight">Currently Injured</h2>
          <span className="px-2.5 py-0.5 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-300 text-[10px] font-black">{injuredList.length}</span>
        </div>
        {injuredList.length === 0 ? (
          <div className="rounded-3xl border border-slate-800 bg-slate-900/30 py-12 text-center">
            <span className="material-icons text-5xl text-emerald-500/40">verified</span>
            <p className="text-slate-400 font-bold mt-3">No active injuries — full squad available.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {injuredList.map(({ player, rec, injury }) => {
              const tone = sevTone(injury.severity);
              const idx = cardStageIndex(injury);
              const pct = Math.round(((idx + 1) / STAGE_ORDER.length) * 100);
              return (
                <button key={player.id} type="button" onClick={() => openJourney({ player, rec, injury })}
                  className={`group text-left rounded-3xl border border-slate-800 bg-[#0a0f1d] p-5 transition-all hover:-translate-y-1 hover:border-rose-500/40 hover:shadow-2xl hover:shadow-rose-950/30`}>
                  <div className="flex items-start gap-3">
                    <Face player={player} size={56} className={`ring-2 ${tone.ring}`} />
                    <div className="min-w-0 flex-1">
                      <h3 className="text-base font-black text-white truncate">{player.firstName} {player.lastName}</h3>
                      <div className="flex items-center gap-1.5 mt-1">
                        <span className={`w-1.5 h-1.5 rounded-full ${tone.dot}`} />
                        <span className={`text-[11px] font-bold ${tone.text}`}>{pretty(injury.injuryType)}</span>
                        <span className="text-slate-600 text-[11px]">·</span>
                        <span className="text-[11px] text-slate-400">{injury.bodyPart}</span>
                      </div>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest ring-1 ${tone.ring} ${tone.bg} ${tone.text}`}>{pretty(injury.severity)}</span>
                  </div>

                  {/* current stage + progress */}
                  <div className="mt-4">
                    <div className="flex justify-between items-center mb-1.5">
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Stage</span>
                      <span className="text-[10px] font-black uppercase tracking-widest text-white">{STAGE_LABEL[String(injury.status).toUpperCase()] || pretty(injury.status)}</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                      <div className={`h-full rounded-full bg-gradient-to-r ${tone.bar} transition-all duration-500`} style={{ width: `${pct}%` }} />
                    </div>
                    <div className="flex justify-between mt-1.5">
                      {STAGE_ORDER.slice(0, 5).map((s, i) => (
                        <span key={s} className={`text-[8px] font-black uppercase tracking-tight ${i <= idx ? tone.text : "text-slate-700"}`}>{STAGE_LABEL[s].split(" ")[0]}</span>
                      ))}
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-between">
                    <span className="text-[10px] text-slate-500 font-bold">{(rec.diagnoses.length + rec.treatments.length + rec.rehabilitations.length + rec.recoveries.length)} records</span>
                    <span className="text-[10px] font-black uppercase tracking-widest text-teal-400 group-hover:text-teal-300 flex items-center gap-1">Open journey <span className="material-icons text-sm">arrow_forward</span></span>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </section>

      {/* ── Recovered / Returned ────────────────────────────────────────── */}
      <section>
        <div className="flex items-center gap-3 mb-5">
          <span className="material-icons text-emerald-400">verified</span>
          <h2 className="text-white text-xl font-black uppercase tracking-tight">Recovered / Returned</h2>
          <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-[10px] font-black">{recoveredList.length}</span>
        </div>
        {recoveredList.length === 0 ? (
          <div className="rounded-3xl border border-slate-800 bg-slate-900/30 py-12 text-center">
            <span className="material-icons text-5xl text-slate-700">history</span>
            <p className="text-slate-500 font-bold mt-3">No returned players yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {recoveredList.map(({ player, rec, injury }) => (
              <button key={player.id} type="button" onClick={() => openJourney({ player, rec, injury })}
                className="group text-left rounded-3xl border border-emerald-500/15 bg-emerald-500/[0.03] p-5 transition-all hover:-translate-y-1 hover:border-emerald-500/40">
                <div className="flex items-start gap-3">
                  <Face player={player} size={52} className="ring-2 ring-emerald-500/30" />
                  <div className="min-w-0 flex-1">
                    <h3 className="text-base font-black text-white truncate">{player.firstName} {player.lastName}</h3>
                    <span className="inline-flex items-center gap-1 mt-1 text-[11px] font-bold text-emerald-300">
                      <span className="material-icons text-sm">check_circle</span> Returned to play
                    </span>
                  </div>
                </div>
                <div className="mt-4 rounded-2xl border border-slate-800 bg-slate-950/40 px-4 py-3">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Recovered from</p>
                  <p className="text-sm font-bold text-slate-200 mt-0.5">{pretty(injury.injuryType)} · {injury.bodyPart}</p>
                  <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden mt-3">
                    <div className="h-full w-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400" />
                  </div>
                </div>
                <div className="mt-3 text-right">
                  <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400 group-hover:text-emerald-300 inline-flex items-center gap-1">View case history <span className="material-icons text-sm">arrow_forward</span></span>
                </div>
              </button>
            ))}
          </div>
        )}
      </section>

      {liveActive && liveActive.injury && (
        <MedicalJourney
          player={liveActive.player}
          rec={liveActive.rec}
          injury={liveActive.injury}
          templates={{ diagnoses, treatments, rehabilitations, recoveries, fitness }}
          catalogVersion={catalogVersion}
          onClose={closeJourney}
          onChanged={handleChanged}
          pushToast={pushToast}
        />
      )}
    </div>
  );
}
