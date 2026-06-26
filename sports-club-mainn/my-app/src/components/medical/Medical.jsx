"use client";
import React, { useState, useEffect, useMemo } from 'react';
import { api } from "@/src/lib/api";
import { buildPlayerTeamMap } from "@/src/lib/clubTeams";
import { Toast } from "@/src/components/shared/SharedComponents";
import MedicalProfiles from './MedicalProfiles';
import MedicalCatalog from './MedicalCatalog';

const TAB_LABELS = {
  Profiles: "Treatment Room",
  Injuries: "Injuries",
  Diagnoses: "Diagnoses",
  Treatments: "Treatments",
  Rehabilitation: "Rehabilitation",
  Recovery: "Recovery",
  Fitness: "Fitness Tests",
};
const TABS = ["Profiles", "Injuries", "Diagnoses", "Treatments", "Rehabilitation", "Recovery", "Fitness"];

export default function Medical() {
  const [activeTab, setActiveTab] = useState("Profiles");
  const [data, setData] = useState([]);
  const [players, setPlayers] = useState([]);
  const [rostersRaw, setRostersRaw] = useState([]);
  const [allMedical, setAllMedical] = useState({ Injuries: [], Treatments: [], Rehabilitation: [], Recovery: [], Fitness: [], Diagnoses: [] });
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  // Bumped whenever a localStorage catalog template is added/removed, so the
  // Treatment Room stage picker re-reads the merged template options.
  const [catalogVersion, setCatalogVersion] = useState(0);

  const playerTeamMap = useMemo(() => buildPlayerTeamMap(rostersRaw), [rostersRaw]);

  // ── reference data: players (all statuses) + staff + rosters ───────────────
  const reloadPlayers = () => {
    const unwrap = (r) => r?.data || r?.content || (Array.isArray(r) ? r : []);
    return Promise.all(["AVAILABLE", "INJURED", "SUSPENDED", "ABSENT"].map(s => api.getPlayers(s).catch(() => [])))
      .then(lists => {
        const merged = []; const seen = new Set();
        lists.flatMap(unwrap).forEach(p => { if (p && !seen.has(p.id)) { seen.add(p.id); merged.push(p); } });
        setPlayers(merged);
      })
      .catch(() => setPlayers([]));
  };
  useEffect(() => {
    const unwrap = (r) => r?.data || r?.content || (Array.isArray(r) ? r : []);
    reloadPlayers();
    api.getRosters().then((r) => setRostersRaw(unwrap(r))).catch(() => {});
  }, []);

  const loadData = async () => {
    setLoading(true);
    const unwrap = (r) => r?.content || r?.data || (Array.isArray(r) ? r : []);
    try {
      if (activeTab === "Profiles") {
        const keys = ["Injuries", "Treatments", "Rehabilitation", "Recovery", "Fitness", "Diagnoses"];
        const res = await Promise.all(keys.map((k) => api.medical[k].get().catch(() => [])));
        const next = {}; keys.forEach((k, i) => { next[k] = unwrap(res[i]); });
        setAllMedical(next);
        await reloadPlayers();
      } else {
        const res = await api.medical[activeTab].get();
        setData(unwrap(res));
      }
    } catch (err) {
      console.error("Load Error:", err);
      setData([]);
      setToast({ msg: `No ${activeTab} data found yet`, type: "info" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, [activeTab]);

  // Re-fetch reference players + all medical data together. Used by the Treatment
  // Room journey so the stepper reflects freshly persisted records/status after a
  // stage is advanced.
  const reloadAll = async () => {
    await Promise.all([reloadPlayers(), loadData()]);
  };

  return (
    <div className="w-full h-full bg-[#020617] p-6 overflow-y-auto">
      {/* Gradient banner (teal medical tone) */}
      <div className="relative overflow-hidden rounded-3xl border border-slate-800 bg-gradient-to-br from-[#062b2b] via-slate-900 to-[#0a2a3f] p-6 mb-8">
        <div className="absolute -right-8 -top-10 w-56 h-56 rounded-full bg-teal-500/10 blur-3xl" />
        <div className="relative flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-teal-500/15 border border-teal-500/30 flex items-center justify-center text-3xl shadow-xl">🩺</div>
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.3em] text-teal-300/80">FC Barcelona</p>
            <h1 className="text-4xl sm:text-5xl font-black text-white uppercase tracking-tight leading-none">Medical Center</h1>
            <p className="text-[11px] text-slate-400 mt-1.5">Injuries, treatments &amp; high-performance health</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 mb-10 bg-slate-900/40 p-2 rounded-3xl border border-white/5 w-fit">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all
              ${activeTab === tab ? "bg-teal-500 text-white shadow-lg shadow-teal-500/20" : "text-slate-500 hover:text-white"}`}
          >
            {TAB_LABELS[tab]}
          </button>
        ))}
      </div>

      {activeTab === "Profiles" && (
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-white text-2xl font-black tracking-tighter uppercase">
              {TAB_LABELS[activeTab]}
            </h2>
            <p className="text-[11px] text-slate-500 mt-1 font-medium">Track every injured player through the recovery workflow — open a player to advance their stage.</p>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-20 animate-pulse text-teal-400 font-mono tracking-widest">
          LOADING_SECURE_DATA...
        </div>
      ) : activeTab === "Profiles" ? (
        <MedicalProfiles
          players={players}
          injuries={allMedical.Injuries}
          treatments={allMedical.Treatments}
          rehabilitations={allMedical.Rehabilitation}
          recoveries={allMedical.Recovery}
          fitness={allMedical.Fitness}
          diagnoses={allMedical.Diagnoses}
          playerTeamMap={playerTeamMap}
          catalogVersion={catalogVersion}
          onChanged={reloadAll}
          pushToast={setToast}
        />
      ) : (
        // The six type-tabs are GENERAL CATALOGS (content-deduped real records +
        // localStorage templates) — not per-player lists. Assignment to a player
        // happens only in the Treatment Room (Profiles → MedicalJourney picker).
        <MedicalCatalog
          type={activeTab}
          records={data}
          onCatalogChange={() => setCatalogVersion((v) => v + 1)}
          pushToast={setToast}
        />
      )}

      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
