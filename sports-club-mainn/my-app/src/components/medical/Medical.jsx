"use client";
import React, { useState, useEffect, useMemo } from 'react';
import { api } from "@/src/lib/api";
import { lookupTeam } from "@/src/lib/teamDirectory";
import { buildPlayerTeamMap } from "@/src/lib/clubTeams";
import { restrictInjuredPlayer, clearInjuredPlayer, isFitnessPass } from "@/src/lib/injuryActions";
import { FormModal, Toast } from "@/src/components/shared/SharedComponents";
import MedicalCard from './MedicalCard';
import MedicalProfiles from './MedicalProfiles';

// ─── BACKEND ENUMS (verified against medical-fitness-service *.java) ──────────
const INJURY_TYPES = ["MUSCLE_STRAIN", "LIGAMENT_SPRAIN", "FRACTURE", "CONTUSION", "TENDONITIS", "DISLOCATION", "CONCUSSION", "OTHER"];
const INJURY_SEVERITY = ["MINOR", "MODERATE", "SEVERE", "CRITICAL"];
const INJURY_STATUS = ["REPORTED", "DIAGNOSED", "TREATING", "RECOVERING", "RECOVERED", "CHRONIC"];
const FITNESS_TEST_TYPES = ["VO2_MAX", "SPEED_TEST", "AGILITY_TEST", "STRENGTH_TEST", "FLEXIBILITY_TEST", "ENDURANCE_TEST", "BODY_COMPOSITION", "OTHER"];
const SPORT_TYPES = ["FOOTBALL", "BASKETBALL", "TENNIS", "SWIMMING", "VOLLEYBALL", "HANDBALL"];
const TREATMENT_STATUS = ["PLANNED", "IN_PROGRESS", "COMPLETED", "CANCELLED"];
const REHAB_STATUS = ["NOT_STARTED", "IN_PROGRESS", "COMPLETED", "PAUSED"];
const RECOVERY_STATUS = ["ACTIVE", "COMPLETED", "PAUSED", "CANCELLED"];

// Teams that exist in the seeded directory (club teams only)
const TEAM_IDS = [1, 2, 3, 4, 5];

// Icons per tab
const TAB_ICONS = {
  Profiles: "contacts",
  Injuries: "local_hospital",
  Diagnoses: "description",
  Treatments: "medication",
  Rehabilitation: "healing",
  Recovery: "self_improvement",
  Fitness: "speed",
};
const TAB_LABELS = {
  Profiles: "Player Profiles",
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
  const [staff, setStaff] = useState([]);
  const [rostersRaw, setRostersRaw] = useState([]);
  const [allMedical, setAllMedical] = useState({ Injuries: [], Treatments: [], Rehabilitation: [], Recovery: [], Fitness: [], Diagnoses: [] });
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editData, setEditData] = useState({});
  const [toast, setToast] = useState(null);

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
    api.getStaff().then((r) => setStaff(unwrap(r))).catch(() => {});
    api.getRosters().then((r) => setRostersRaw(unwrap(r))).catch(() => {});
  }, []);

  // Resolve a numeric playerId → "First Last"
  const playerNameById = (id) => {
    if (id == null || id === "") return "—";
    const p = players.find(x => String(x.id) === String(id));
    return p ? `${p.firstName} ${p.lastName}` : `Player #${id}`;
  };
  // Resolve a keycloakId → "First Last"
  const playerNameByKeycloak = (kid) => {
    if (!kid) return "—";
    const p = players.find(x => x.keycloakId === kid);
    return p ? `${p.firstName} ${p.lastName}` : "Unknown Player";
  };
  const teamName = (id) => lookupTeam(id)?.name || (id ? `Team #${id}` : "—");

  // Options for dropdowns (value/label shape)
  const playerOptsById = useMemo(
    () => players.map(p => ({ value: String(p.id), label: `${p.firstName} ${p.lastName}` })),
    [players]
  );
  const playerOptsByKeycloak = useMemo(
    () => players.map(p => ({ value: p.keycloakId, label: `${p.firstName} ${p.lastName}` })),
    [players]
  );
  const teamOpts = useMemo(
    () => TEAM_IDS.map(id => ({ value: String(id), label: lookupTeam(id)?.name || `Team ${id}` })),
    []
  );

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

  // ── Form field definitions (dropdowns built from live reference data) ──────
  const fieldConfig = useMemo(() => ({
    Injuries: [
      { key: "playerId", label: "Player", type: "select", options: playerOptsById, required: true },
      { key: "teamId", label: "Team", type: "select", options: teamOpts, required: true },
      { key: "injuryType", label: "Injury Type", type: "select", options: INJURY_TYPES, required: true },
      { key: "severity", label: "Severity", type: "select", options: INJURY_SEVERITY, required: true },
      { key: "status", label: "Status", type: "select", options: INJURY_STATUS, required: true },
      { key: "bodyPart", label: "Body Part", required: true },
      { key: "description", label: "Description", type: "textarea", full: true, required: true },
      { key: "injuryDate", label: "Injury Date", type: "date", required: true },
    ],
    Diagnoses: [
      { key: "injuryId", label: "Injury ID", type: "number", placeholder: "Existing injury", required: true },
      { key: "playerKeycloakId", label: "Player", type: "select", options: playerOptsByKeycloak, required: true },
      { key: "doctorKeycloakId", label: "Doctor", type: "select", options: playerOptsByKeycloak },
      { key: "diagnosis", label: "Diagnosis", type: "textarea", full: true, required: true },
      { key: "medicalNotes", label: "Medical Notes", type: "textarea", full: true, required: true },
      { key: "recommendations", label: "Recommendations", type: "textarea", full: true, required: true },
      { key: "testResults", label: "Test Results", required: true },
    ],
    Treatments: [
      { key: "injuryId", label: "Injury ID", type: "number", placeholder: "Existing injury", required: true },
      { key: "playerId", label: "Player", type: "select", options: playerOptsById, required: true },
      { key: "treatmentType", label: "Treatment Type", required: true },
      { key: "status", label: "Status", type: "select", options: TREATMENT_STATUS, required: true },
      { key: "medication", label: "Medication", required: true },
      { key: "dosage", label: "Dosage", required: true },
      { key: "description", label: "Description", type: "textarea", full: true, required: true },
      { key: "notes", label: "Notes", type: "textarea", full: true, required: true },
      { key: "startDate", label: "Start Date", type: "date", required: true },
    ],
    Rehabilitation: [
      { key: "injuryId", label: "Injury ID", type: "number", placeholder: "Existing injury", required: true },
      { key: "playerId", label: "Player", type: "select", options: playerOptsById, required: true },
      { key: "status", label: "Status", type: "select", options: REHAB_STATUS, required: true },
      { key: "rehabPlan", label: "Rehab Plan", type: "textarea", full: true, required: true },
      { key: "exercises", label: "Exercises", type: "textarea", full: true, required: true },
      { key: "durationWeeks", label: "Duration (Weeks)", type: "number", required: true },
      { key: "progressNotes", label: "Progress Notes", type: "textarea", full: true, required: true },
      { key: "restrictions", label: "Restrictions", type: "textarea", full: true, required: true },
      { key: "startDate", label: "Start Date", type: "date", required: true },
      { key: "expectedEndDate", label: "Expected End Date", type: "date" },
    ],
    Recovery: [
      { key: "rehabilitationId", label: "Rehabilitation ID", type: "number", placeholder: "Existing rehab", required: true },
      { key: "playerId", label: "Player", type: "select", options: playerOptsById, required: true },
      { key: "status", label: "Status", type: "select", options: RECOVERY_STATUS, required: true },
      { key: "programName", label: "Program Name", required: true },
      { key: "description", label: "Description", type: "textarea", full: true, required: true },
      { key: "activities", label: "Activities", type: "textarea", full: true, required: true },
      { key: "nutritionPlan", label: "Nutrition Plan", type: "textarea", full: true, required: true },
      { key: "goals", label: "Goals", type: "textarea", full: true, required: true },
      { key: "sessionsPerWeek", label: "Sessions/Week", type: "number" },
      { key: "durationMinutes", label: "Duration (Min)", type: "number" },
      { key: "startDate", label: "Start Date", type: "date", required: true },
      { key: "endDate", label: "End Date", type: "date" },
    ],
    Fitness: [
      { key: "playerKeycloakId", label: "Player", type: "select", options: playerOptsByKeycloak, required: true },
      { key: "teamId", label: "Team", type: "select", options: teamOpts, required: true },
      { key: "testType", label: "Test Type", type: "select", options: FITNESS_TEST_TYPES, required: true },
      { key: "sportType", label: "Sport Type", type: "select", options: SPORT_TYPES, required: true },
      { key: "testName", label: "Test Name", required: true },
      { key: "result", label: "Result Value", type: "number" },
      { key: "unit", label: "Unit (e.g. ml/kg/min)", required: true },
      // PASS/EXCELLENT/GOOD/AVERAGE clear an injured player back to AVAILABLE;
      // FAIL/POOR keep them restricted (see injuryActions.isFitnessPass).
      { key: "resultCategory", label: "Result (clears injury if passed)", type: "select", options: ["PASS", "EXCELLENT", "GOOD", "AVERAGE", "FAIL", "POOR"], required: true },
      { key: "testDate", label: "Test Date", type: "date", required: true },
    ],
  }), [playerOptsById, playerOptsByKeycloak, teamOpts]);

  // Default doctor identifiers (no staff list exposed here — sensible defaults)
  const DEFAULT_DOCTOR_ID = 6;
  const DEFAULT_DOCTOR_KEYCLOAK = "00000000-0000-0000-0000-000000000030";

  const buildPayload = (f) => {
    const today = new Date().toISOString().split('T')[0];
    const nowIso = new Date().toISOString();
    const toDateTime = (d) => (d ? new Date(d).toISOString() : nowIso);

    if (activeTab === "Injuries") {
      return {
        playerId: Number(f.playerId),
        teamId: Number(f.teamId),
        injuryType: f.injuryType,
        severity: f.severity,
        status: f.status || "REPORTED",
        bodyPart: f.bodyPart,
        description: f.description,
        injuryDate: f.injuryDate || today,
        reportedAt: toDateTime(f.injuryDate),
        reportedByDoctorId: DEFAULT_DOCTOR_ID,
      };
    }
    if (activeTab === "Diagnoses") {
      return {
        injuryId: Number(f.injuryId),
        playerKeycloakId: f.playerKeycloakId,
        doctorKeycloakId: f.doctorKeycloakId || DEFAULT_DOCTOR_KEYCLOAK,
        diagnosis: f.diagnosis,
        medicalNotes: f.medicalNotes,
        recommendations: f.recommendations,
        diagnosedAt: nowIso,
        testResults: f.testResults || "N/A",
        attachments: f.attachments || "None",
      };
    }
    if (activeTab === "Treatments") {
      return {
        injuryId: Number(f.injuryId),
        playerId: Number(f.playerId),
        doctorId: DEFAULT_DOCTOR_ID,
        treatmentType: f.treatmentType,
        description: f.description,
        medication: f.medication,
        dosage: f.dosage,
        status: f.status || "PLANNED",
        startDate: f.startDate || today,
        endDate: f.endDate || null,
        createdAt: nowIso,
        notes: f.notes,
        response: f.response || "Pending",
      };
    }
    if (activeTab === "Rehabilitation") {
      return {
        injuryId: Number(f.injuryId),
        playerId: Number(f.playerId),
        physiotherapistId: DEFAULT_DOCTOR_ID,
        status: f.status || "NOT_STARTED",
        rehabPlan: f.rehabPlan,
        exercises: f.exercises,
        durationWeeks: Number(f.durationWeeks || 1),
        startDate: f.startDate || today,
        expectedEndDate: f.expectedEndDate || null,
        actualEndDate: f.actualEndDate || null,
        createdAt: nowIso,
        progressNotes: f.progressNotes,
        restrictions: f.restrictions,
      };
    }
    if (activeTab === "Recovery") {
      return {
        rehabilitationId: Number(f.rehabilitationId),
        playerId: Number(f.playerId),
        createdByDoctorId: DEFAULT_DOCTOR_ID,
        status: f.status || "ACTIVE",
        programName: f.programName,
        description: f.description,
        activities: f.activities,
        nutritionPlan: f.nutritionPlan,
        startDate: f.startDate || today,
        endDate: f.endDate || null,
        createdAt: nowIso,
        sessionsPerWeek: f.sessionsPerWeek ? Number(f.sessionsPerWeek) : null,
        durationMinutes: f.durationMinutes ? Number(f.durationMinutes) : null,
        progressNotes: f.progressNotes || "Starting program",
        goals: f.goals,
      };
    }
    if (activeTab === "Fitness") {
      return {
        playerKeycloakId: f.playerKeycloakId,
        teamId: Number(f.teamId),
        testType: f.testType,
        sportType: f.sportType,
        testDate: toDateTime(f.testDate),
        conductedByDoctorKeycloakId: DEFAULT_DOCTOR_KEYCLOAK,
        testName: f.testName,
        result: f.result ? Number(f.result) : null,
        unit: f.unit,
        resultCategory: f.resultCategory,
        notes: f.notes || "N/A",
        recommendations: f.recommendations || "Maintain program",
        attachments: f.attachments || "None",
      };
    }
    return f;
  };

  const handleSave = async (formData) => {
    try {
      const payload = buildPayload(formData);
      const isEditing = !!editData?.id;
      if (isEditing) {
        await api.medical[activeTab].put(editData.id, payload);
        setToast({ msg: `${activeTab} updated successfully!`, type: "success" });
      } else {
        await api.medical[activeTab].post(payload);
        setToast({ msg: `${activeTab} saved successfully!`, type: "success" });
      }
      // ── Injury lifecycle ──────────────────────────────────────────────
      // Logging a NEW injury flags the player INJURED (Restricted): pulls them
      // from lineups, training sessions & attendance, and emails the whole team.
      // The player stays restricted (even through treatment/rehab/recovery)
      // until a PASSING fitness test clears them — NOT when the injury is marked
      // "RECOVERED". Editing an injury just keeps them restricted.
      if (activeTab === "Injuries" && payload.playerId) {
        const pl = players.find((p) => String(p.id) === String(payload.playerId)) || { id: Number(payload.playerId) };
        if (!isEditing) {
          const r = await restrictInjuredPlayer(pl, { players, staff, playerTeamMap, teamId: payload.teamId });
          setToast({ msg: `Injury logged · player restricted · ${r.notified} team members emailed`, type: "success" });
        } else {
          try { await api.updatePlayerStatus(payload.playerId, "INJURED"); } catch (e) { console.error(e); }
        }
      }
      // Passing a fitness test clears the player back to AVAILABLE.
      if (activeTab === "Fitness" && payload.playerKeycloakId) {
        const pl = players.find((p) => p.keycloakId === payload.playerKeycloakId);
        if (pl && isFitnessPass(payload)) {
          await clearInjuredPlayer(pl);
          setToast({ msg: `Fitness test passed · ${pl.firstName} ${pl.lastName} cleared to return`, type: "success" });
        }
      }
      setShowModal(false);
      reloadPlayers();
      loadData();
    } catch (err) {
      console.error("Backend Error:", err);
      setToast({ msg: err.message || "Check required fields", type: "error" });
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this record?")) return;
    try {
      await api.medical[activeTab].delete(id);
      setToast({ msg: "Deleted!", type: "success" });
      loadData();
    } catch (err) {
      setToast({ msg: "Delete failed", type: "error" });
    }
  };

  const handleEdit = (item) => { setEditData(item); setShowModal(true); };
  const handleAddNew = () => { setEditData({}); setShowModal(true); };

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

      <div className="flex justify-between items-center mb-8">
        <h2 className="text-white text-2xl font-black tracking-tighter uppercase">
          {TAB_LABELS[activeTab]} <span className="text-teal-400">{activeTab === "Profiles" ? "" : "Log"}</span>
        </h2>
        {activeTab !== "Profiles" && (
          <button
            onClick={handleAddNew}
            className="bg-teal-600 hover:bg-teal-400 text-white px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] transition-all active:scale-95 shadow-xl shadow-teal-900/20 flex items-center gap-2"
          >
            <span className="material-icons">add</span> Add New Record
          </button>
        )}
      </div>

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
        />
      ) : data.length === 0 ? (
        <div className="text-center py-20 text-slate-500">
          <div className="text-6xl mb-6 opacity-20 grayscale">🗂️</div>
          <p className="text-lg font-bold text-slate-400">No {TAB_LABELS[activeTab]} records found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {data.map((item, idx) => (
            <MedicalCard
              key={item.id || idx}
              data={item}
              type={activeTab}
              icon={TAB_ICONS[activeTab]}
              playerNameById={playerNameById}
              playerNameByKeycloak={playerNameByKeycloak}
              teamName={teamName}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {showModal && (
        <FormModal
          title={editData?.id ? `Edit ${TAB_LABELS[activeTab]}` : `Add ${TAB_LABELS[activeTab]}`}
          fields={fieldConfig[activeTab]}
          initialData={editData}
          onSubmit={handleSave}
          onClose={() => setShowModal(false)}
        />
      )}

      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
