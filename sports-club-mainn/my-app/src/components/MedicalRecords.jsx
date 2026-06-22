"use client";
import { useState, useEffect, useMemo } from "react";
import { api } from "@/src/lib/api";
import { lookupTeam } from "@/src/lib/teamDirectory";
import { StatusBadge, Toast, EmptyState } from "@/src/components/shared/SharedComponents";

// Severity left-border accent colours (match backend InjurySeverity enum)
const SEV_BORDER = { MINOR: "#10b981", MODERATE: "#f59e0b", SEVERE: "#f97316", CRITICAL: "#ef4444" };
const SEV_PILL = {
    MINOR: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
    MODERATE: "text-amber-400 bg-amber-500/10 border-amber-500/20",
    SEVERE: "text-orange-400 bg-orange-500/10 border-orange-500/20",
    CRITICAL: "text-red-400 bg-red-500/10 border-red-500/20",
};

// Pipeline tabs → api.medical key
const STEPS = [
    ["Injuries", "Injuries"],
    ["Diagnoses", "Diagnoses"],
    ["Treatments", "Treatments"],
    ["Rehabilitation", "Rehab"],
    ["Fitness", "Fitness Test"],
];

const pretty = (v) => (v ? String(v).replace(/_/g, " ") : "—");
const fmtDate = (d) => (d ? String(d).split("T")[0] : "—");

export default function MedicalRecords() {
    const [tab, setTab] = useState("Injuries");
    const [data, setData] = useState([]);
    const [players, setPlayers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [toast, setToast] = useState(null);

    // Load players once for ID/keycloak → name resolution
    useEffect(() => {
        const unwrap = (r) => r?.data || r?.content || (Array.isArray(r) ? r : []);
        Promise.all(["AVAILABLE", "INJURED", "SUSPENDED", "ABSENT"].map(s => api.getPlayers(s).catch(() => [])))
            .then(lists => {
                const merged = [];
                const seen = new Set();
                lists.flatMap(unwrap).forEach(p => { if (p && !seen.has(p.id)) { seen.add(p.id); merged.push(p); } });
                setPlayers(merged);
            })
            .catch(() => setPlayers([]));
    }, []);

    const nameById = (id) => {
        const p = players.find(x => String(x.id) === String(id));
        return p ? `${p.firstName} ${p.lastName}` : (id ? `Player #${id}` : "—");
    };
    const nameByKeycloak = (kid) => {
        const p = players.find(x => x.keycloakId === kid);
        return p ? `${p.firstName} ${p.lastName}` : "Unknown Player";
    };
    const teamName = (id) => lookupTeam(id)?.name || (id ? `Team #${id}` : "—");

    const loadCurrentTab = async () => {
        setLoading(true);
        try {
            const res = await api.medical[tab].get();
            setData(res?.content || res?.data || (Array.isArray(res) ? res : []));
        } catch (err) {
            setData([]);
            setToast({ msg: "Failed to fetch records", type: "error" });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { loadCurrentTab(); }, [tab]);

    const stepLabel = useMemo(() => Object.fromEntries(STEPS), []);

    return (
        <div className="w-full h-full bg-slate-950 p-6 overflow-y-auto">
            {/* Gradient banner (teal medical tone) */}
            <div className="relative overflow-hidden rounded-3xl border border-slate-800 bg-gradient-to-br from-[#062b2b] via-slate-900 to-[#0a2a3f] p-6 mb-8">
                <div className="absolute -right-8 -top-10 w-56 h-56 rounded-full bg-teal-500/10 blur-3xl" />
                <div className="relative flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-teal-500/15 border border-teal-500/30 flex items-center justify-center text-3xl shadow-xl">🩺</div>
                    <div>
                        <p className="text-[11px] font-black uppercase tracking-[0.3em] text-teal-300/80">FC Barcelona</p>
                        <h1 className="text-3xl sm:text-4xl font-black text-white uppercase tracking-tight leading-none">Medical Records</h1>
                        <p className="text-[11px] text-slate-400 mt-1.5">Player health &amp; performance pipeline</p>
                    </div>
                </div>
            </div>

            {/* Pipeline navigation */}
            <div className="flex flex-wrap mb-8 bg-slate-900/50 p-1 rounded-xl border border-slate-800 shadow-inner">
                {STEPS.map(([k, l]) => (
                    <button key={k} onClick={() => setTab(k)}
                        className={`flex-1 min-w-[120px] text-center py-3 text-[10px] font-black uppercase tracking-[0.2em] transition-all rounded-lg ${tab === k ? "bg-teal-500 text-slate-950 shadow-lg" : "text-slate-500 hover:text-slate-300"}`}
                    >
                        {l}
                    </button>
                ))}
            </div>

            {loading ? (
                <div className="py-20 text-center animate-pulse text-slate-600 font-black text-xs tracking-widest uppercase">Fetching medical files...</div>
            ) : data.length === 0 ? (
                <EmptyState icon="📂" title={`No ${stepLabel[tab]} records found`} />
            ) : (
                <div className="space-y-4">
                    {/* INJURIES */}
                    {tab === "Injuries" && data.map(inj => (
                        <div key={inj.id} className="bg-slate-900/40 rounded-2xl p-6 border border-slate-800 border-l-4 hover:bg-slate-900/60 transition-all"
                            style={{ borderLeftColor: SEV_BORDER[inj.severity] || "#10b981" }}>
                            <div className="flex justify-between items-start gap-4">
                                <div>
                                    <div className="flex gap-2 mb-4 flex-wrap">
                                        <span className={`px-2 py-0.5 rounded text-[10px] font-black border ${SEV_PILL[inj.severity] || ""}`}>{inj.severity}</span>
                                        <StatusBadge status={inj.status} />
                                    </div>
                                    <h3 className="text-xl font-bold text-slate-100">{pretty(inj.injuryType)} · {inj.bodyPart}</h3>
                                    <p className="text-sm text-slate-400 mt-1">{inj.description}</p>
                                    <p className="text-xs text-slate-500 mt-2 font-mono uppercase tracking-tighter">
                                        📅 Reported: {fmtDate(inj.injuryDate)} · {teamName(inj.teamId)}
                                    </p>
                                </div>
                                <div className="text-right shrink-0">
                                    <p className="text-[10px] font-black text-slate-600 uppercase mb-1">Patient</p>
                                    <p className="text-sm text-slate-200 font-bold">{nameById(inj.playerId)}</p>
                                </div>
                            </div>
                        </div>
                    ))}

                    {/* DIAGNOSES */}
                    {tab === "Diagnoses" && data.map(d => (
                        <div key={d.id} className="bg-slate-900/40 rounded-2xl p-6 border border-slate-800 border-l-4 border-l-purple-500 hover:bg-slate-900/60 transition-all">
                            <div className="flex justify-between items-start gap-4">
                                <div>
                                    <h3 className="text-lg font-bold text-slate-100">{d.diagnosis}</h3>
                                    <p className="text-sm text-slate-400 mt-1">{d.medicalNotes}</p>
                                    <p className="text-xs text-slate-500 mt-2">Recommendations: {d.recommendations || "—"}</p>
                                    <p className="text-xs text-slate-500 mt-2 font-mono uppercase tracking-tighter">📅 {fmtDate(d.diagnosedAt)} · Injury #{d.injuryId}</p>
                                </div>
                                <div className="text-right shrink-0">
                                    <p className="text-[10px] font-black text-slate-600 uppercase mb-1">Patient</p>
                                    <p className="text-sm text-slate-200 font-bold">{nameByKeycloak(d.playerKeycloakId)}</p>
                                </div>
                            </div>
                        </div>
                    ))}

                    {/* TREATMENTS */}
                    {tab === "Treatments" && data.map(t => (
                        <div key={t.id} className="bg-slate-900/40 rounded-2xl p-6 border border-slate-800 border-l-4 border-l-amber-500 hover:bg-slate-900/60 transition-all">
                            <div className="flex justify-between items-start gap-4">
                                <div>
                                    <div className="mb-3"><StatusBadge status={t.status} /></div>
                                    <h3 className="text-lg font-bold text-slate-100">{t.treatmentType}</h3>
                                    <p className="text-sm text-slate-400 mt-1">{t.description}</p>
                                    {t.medication && <p className="text-xs text-slate-500 mt-2">💊 {t.medication}{t.dosage ? ` · ${t.dosage}` : ""}</p>}
                                    <p className="text-xs text-slate-500 mt-2 font-mono uppercase tracking-tighter">📅 {fmtDate(t.startDate)}{t.endDate ? ` → ${fmtDate(t.endDate)}` : ""}</p>
                                </div>
                                <div className="text-right shrink-0">
                                    <p className="text-[10px] font-black text-slate-600 uppercase mb-1">Patient</p>
                                    <p className="text-sm text-slate-200 font-bold">{nameById(t.playerId)}</p>
                                </div>
                            </div>
                        </div>
                    ))}

                    {/* REHABILITATION */}
                    {tab === "Rehabilitation" && data.map(r => (
                        <div key={r.id} className="bg-slate-900/40 rounded-2xl p-6 border border-slate-800 border-l-4 border-l-teal-500 hover:bg-slate-900/60 transition-all">
                            <div className="flex justify-between items-start gap-4">
                                <div>
                                    <div className="mb-3"><StatusBadge status={r.status} /></div>
                                    <h3 className="text-lg font-bold text-slate-100">{r.rehabPlan}</h3>
                                    <p className="text-sm text-slate-400 mt-1">{r.exercises}</p>
                                    <p className="text-xs text-slate-500 mt-2 font-mono uppercase tracking-tighter">
                                        ⏱ {r.durationWeeks} wks · 📅 {fmtDate(r.startDate)}{r.expectedEndDate ? ` → ${fmtDate(r.expectedEndDate)}` : ""}
                                    </p>
                                </div>
                                <div className="text-right shrink-0">
                                    <p className="text-[10px] font-black text-slate-600 uppercase mb-1">Patient</p>
                                    <p className="text-sm text-slate-200 font-bold">{nameById(r.playerId)}</p>
                                </div>
                            </div>
                        </div>
                    ))}

                    {/* FITNESS TESTS */}
                    {tab === "Fitness" && data.map(f => (
                        <div key={f.id} className="bg-slate-900/40 rounded-2xl p-6 border border-slate-800 border-l-4 border-l-cyan-500 hover:bg-slate-900/60 transition-all">
                            <div className="flex justify-between items-start gap-4">
                                <div>
                                    <h3 className="text-lg font-bold text-slate-100">{f.testName}</h3>
                                    <p className="text-sm text-slate-400 mt-1">{pretty(f.testType)} · {pretty(f.sportType)}</p>
                                    <p className="text-xs text-slate-500 mt-2">
                                        Result: <span className="text-teal-400 font-bold">{f.result ?? "—"} {f.unit}</span>
                                        {f.resultCategory ? ` · ${f.resultCategory}` : ""}
                                    </p>
                                    <p className="text-xs text-slate-500 mt-2 font-mono uppercase tracking-tighter">📅 {fmtDate(f.testDate)} · {teamName(f.teamId)}</p>
                                </div>
                                <div className="text-right shrink-0">
                                    <p className="text-[10px] font-black text-slate-600 uppercase mb-1">Athlete</p>
                                    <p className="text-sm text-slate-200 font-bold">{nameByKeycloak(f.playerKeycloakId)}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
        </div>
    );
}
