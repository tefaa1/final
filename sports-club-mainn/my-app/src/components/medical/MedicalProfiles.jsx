"use client";
import React, { useMemo, useState } from "react";
import PlayerAvatar from "@/src/components/shared/PlayerAvatar";
import { isInjured, statusOf } from "@/src/lib/playerStatus";
import { isFitnessPass } from "@/src/lib/injuryActions";
import { FiX } from "react-icons/fi";

const OPEN_INJURY = ["REPORTED", "DIAGNOSED", "TREATING", "RECOVERING", "CHRONIC"];

// Consolidated medical profile per player: injuries, treatments, rehab, recovery,
// fitness tests + diagnoses, plus the live "Injured (Restricted)" flag and where
// the player sits in the recovery pipeline.
export default function MedicalProfiles({ players, injuries, treatments, rehabilitations, recoveries, fitness, diagnoses, playerTeamMap }) {
    const [active, setActive] = useState(null);

    const byPlayer = useMemo(() => {
        const idx = {};
        const ensure = (id) => (idx[id] ||= { injuries: [], treatments: [], rehabilitations: [], recoveries: [], fitness: [], diagnoses: [] });
        const kc = {}; players.forEach((p) => { if (p.keycloakId) kc[p.keycloakId] = p.id; });
        (injuries || []).forEach((x) => x.playerId != null && ensure(x.playerId).injuries.push(x));
        (treatments || []).forEach((x) => x.playerId != null && ensure(x.playerId).treatments.push(x));
        (rehabilitations || []).forEach((x) => x.playerId != null && ensure(x.playerId).rehabilitations.push(x));
        (recoveries || []).forEach((x) => x.playerId != null && ensure(x.playerId).recoveries.push(x));
        (fitness || []).forEach((x) => { const id = kc[x.playerKeycloakId]; if (id != null) ensure(id).fitness.push(x); });
        (diagnoses || []).forEach((x) => { const id = kc[x.playerKeycloakId]; if (id != null) ensure(id).diagnoses.push(x); });
        return idx;
    }, [players, injuries, treatments, rehabilitations, recoveries, fitness, diagnoses]);

    // Players to show: injured OR with any medical record.
    const profiles = useMemo(() => {
        const list = players.filter((p) => isInjured(p) || byPlayer[p.id]);
        const score = (p) => (isInjured(p) ? 0 : 1);
        return list.sort((a, b) => score(a) - score(b) || `${a.firstName}`.localeCompare(`${b.firstName}`));
    }, [players, byPlayer]);

    const stageOf = (rec) => ({
        injury: (rec?.injuries || []).some((i) => OPEN_INJURY.includes(String(i.status).toUpperCase())) || (rec?.injuries || []).length > 0,
        treatment: (rec?.treatments || []).length > 0,
        rehab: (rec?.rehabilitations || []).length > 0,
        recovery: (rec?.recoveries || []).length > 0,
        fitnessPassed: (rec?.fitness || []).some(isFitnessPass),
    });

    const PIPE = [["injury", "Injury"], ["treatment", "Treatment"], ["rehab", "Rehab"], ["recovery", "Recovery"], ["fitnessPassed", "Fitness ✓"]];

    if (profiles.length === 0) {
        return <div className="text-center py-20 text-slate-500"><div className="text-6xl mb-4 opacity-20">🩺</div><p className="font-bold text-slate-400">No medical profiles yet</p></div>;
    }

    return (
        <>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                {profiles.map((p) => {
                    const rec = byPlayer[p.id] || {};
                    const injured = isInjured(p);
                    const st = stageOf(rec);
                    const counts = [
                        ["Injuries", (rec.injuries || []).length], ["Treatments", (rec.treatments || []).length],
                        ["Rehab", (rec.rehabilitations || []).length], ["Recovery", (rec.recoveries || []).length],
                        ["Fitness", (rec.fitness || []).length],
                    ];
                    return (
                        <button key={p.id} onClick={() => setActive(p)} type="button"
                            className={`text-left rounded-2xl border p-5 transition-all hover:-translate-y-0.5 ${injured ? "border-rose-500/40 bg-rose-500/[0.05] hover:border-rose-500/60" : "border-slate-800 bg-slate-900/40 hover:border-teal-500/40"}`}>
                            <div className="flex items-center gap-3">
                                <PlayerAvatar name={`${p.firstName} ${p.lastName}`} sport="General" size={48} />
                                <div className="min-w-0 flex-1">
                                    <h3 className="text-base font-black text-slate-100 truncate">{p.firstName} {p.lastName}</h3>
                                    <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${injured ? "text-rose-300 bg-rose-500/15 border-rose-500/40" : "text-emerald-300 bg-emerald-500/10 border-emerald-500/30"}`}>
                                        {injured ? "🩹 Injured · Restricted" : `✓ ${statusOf(p) === "AVAILABLE" ? "Available" : statusOf(p)}`}
                                    </span>
                                </div>
                            </div>

                            {/* recovery pipeline */}
                            <div className="flex items-center gap-1 mt-4">
                                {PIPE.map(([k, label], i) => {
                                    const on = st[k];
                                    const isFit = k === "fitnessPassed";
                                    return (
                                        <React.Fragment key={k}>
                                            <span className={`flex-1 text-center text-[8px] font-black uppercase tracking-wider py-1 rounded ${on ? (isFit ? "bg-emerald-500/20 text-emerald-300" : "bg-teal-500/20 text-teal-300") : "bg-slate-800 text-slate-600"}`}>{label}</span>
                                            {i < PIPE.length - 1 && <span className="text-slate-700 text-[8px]">›</span>}
                                        </React.Fragment>
                                    );
                                })}
                            </div>

                            <div className="flex flex-wrap gap-1.5 mt-3">
                                {counts.filter(([, n]) => n > 0).map(([l, n]) => (
                                    <span key={l} className="text-[9px] font-bold text-slate-400 bg-slate-950/40 border border-slate-800 rounded px-1.5 py-0.5">{n} {l}</span>
                                ))}
                            </div>
                        </button>
                    );
                })}
            </div>

            {active && (
                <ProfileModal player={active} rec={byPlayer[active.id] || {}} onClose={() => setActive(null)} />
            )}
        </>
    );
}

function Section({ title, items, render, tone = "teal" }) {
    if (!items || items.length === 0) return null;
    return (
        <div>
            <p className={`text-[10px] font-black uppercase tracking-[0.25em] mb-2 text-${tone}-400/80`}>{title} ({items.length})</p>
            <div className="space-y-1.5">{items.map((it, i) => <div key={it.id || i} className="rounded-xl border border-slate-800 bg-slate-950/40 px-3 py-2 text-[12px] text-slate-300">{render(it)}</div>)}</div>
        </div>
    );
}

function ProfileModal({ player, rec, onClose }) {
    const injured = isInjured(player);
    const d = (v) => (v ? String(v).slice(0, 10) : "—");
    return (
        <div className="fixed inset-0 z-[120] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4" onClick={(e) => e.target === e.currentTarget && onClose()}>
            <div className="w-full max-w-2xl max-h-[88vh] overflow-y-auto rounded-2xl border border-slate-800 bg-slate-950 shadow-2xl">
                <div className="sticky top-0 z-10 bg-slate-950/95 backdrop-blur px-6 py-4 border-b border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <PlayerAvatar name={`${player.firstName} ${player.lastName}`} sport="General" size={42} />
                        <div>
                            <h3 className="font-black text-white text-lg leading-none">{player.firstName} {player.lastName}</h3>
                            <span className={`text-[10px] font-black uppercase tracking-widest ${injured ? "text-rose-300" : "text-emerald-300"}`}>{injured ? "Injured · Restricted" : "Available"}</span>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-slate-500 hover:text-white p-1"><FiX /></button>
                </div>
                <div className="p-6 space-y-5">
                    <Section title="Injuries" tone="rose" items={rec.injuries} render={(i) => <><b className="text-slate-100">{i.injuryType?.replace(/_/g, " ")}</b> · {i.severity} · {i.bodyPart} · <span className="text-rose-300">{i.status}</span> · {d(i.injuryDate)}<div className="text-slate-500">{i.description}</div></>} />
                    <Section title="Diagnoses" tone="sky" items={rec.diagnoses} render={(x) => <><b className="text-slate-100">{x.diagnosis}</b><div className="text-slate-500">{x.recommendations}</div></>} />
                    <Section title="Treatments" tone="teal" items={rec.treatments} render={(x) => <><b className="text-slate-100">{x.treatmentType}</b> · {x.status} · {x.medication || "—"}<div className="text-slate-500">{x.description}</div></>} />
                    <Section title="Rehabilitation" tone="teal" items={rec.rehabilitations} render={(x) => <><b className="text-slate-100">{x.rehabPlan || "Rehab"}</b> · {x.status} · {x.durationWeeks || "?"}w<div className="text-slate-500">{x.exercises}</div></>} />
                    <Section title="Recovery" tone="teal" items={rec.recoveries} render={(x) => <><b className="text-slate-100">{x.programName}</b> · {x.status}<div className="text-slate-500">{x.activities}</div></>} />
                    <Section title="Fitness Tests" tone="emerald" items={rec.fitness} render={(x) => <><b className="text-slate-100">{x.testName || x.testType}</b> · {x.result ?? "—"} {x.unit} · <span className={isFitnessPass(x) ? "text-emerald-300" : "text-rose-300"}>{x.resultCategory}{isFitnessPass(x) ? " (PASS)" : ""}</span> · {d(x.testDate)}</>} />
                    {!rec.injuries?.length && !rec.treatments?.length && !rec.rehabilitations?.length && !rec.recoveries?.length && !rec.fitness?.length && (
                        <p className="text-[12px] text-slate-600 italic">This player is flagged {injured ? "injured" : "—"} but has no detailed medical logs yet.</p>
                    )}
                </div>
            </div>
        </div>
    );
}
