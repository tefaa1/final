"use client";
import React, { useState, useEffect } from "react";
import { FiSearch } from "react-icons/fi";
import { api } from "@/src/lib/api";

// Sport manager who receives a mail/alert whenever a new report is filed.
const SPORT_MANAGER_KC = "00000000-0000-0000-0000-000000000010";

const SPORTS = ["FOOTBALL", "BASKETBALL", "HANDBALL", "TENNIS", "VOLLEYBALL", "SWIMMING"];
const POSITIONS_BY_SPORT = {
  FOOTBALL: ["GOALKEEPER", "RIGHT_BACK", "LEFT_BACK", "CENTER_BACK", "DEFENSIVE_MID", "CENTRAL_MID", "ATTACKING_MID", "RIGHT_WING", "LEFT_WING", "STRIKER"],
  BASKETBALL: ["POINT_GUARD", "SHOOTING_GUARD", "SMALL_FORWARD", "POWER_FORWARD", "CENTER"],
  HANDBALL: ["HB_GOALKEEPER", "HB_LEFT_WING", "HB_RIGHT_WING", "HB_LEFT_BACK", "HB_RIGHT_BACK", "HB_CENTRE_BACK", "HB_PIVOT"],
  TENNIS: ["SINGLES_PLAYER", "DOUBLES_PLAYER"],
  VOLLEYBALL: ["SETTER", "OUTSIDE_HITTER", "OPPOSITE_HITTER", "MIDDLE_BLOCKER", "LIBERO", "DEFENSIVE_SPECIALIST"],
  SWIMMING: ["FREESTYLE_SWIMMER", "BACKSTROKE_SWIMMER", "BREASTSTROKE_SWIMMER", "BUTTERFLY_SWIMMER", "MEDLEY_SWIMMER"],
};
const COUNTRIES = [
  "Spain", "France", "Germany", "England", "Portugal", "Italy", "Netherlands", "Belgium", "Croatia", "Brazil",
  "Argentina", "Uruguay", "Colombia", "Mexico", "USA", "Morocco", "Egypt", "Senegal", "Nigeria", "Ghana",
  "Denmark", "Norway", "Sweden", "Poland", "Serbia", "Slovenia", "Georgia", "Lithuania", "Czechia", "Austria",
  "Switzerland", "Japan", "South Korea", "Australia", "Canada", "Ireland", "Scotland", "Wales", "Turkey", "Greece", "Other",
];

const defaultForm = {
  scoutKeycloakId: "",
  outerPlayerId: "",
  sportType: "FOOTBALL",
  playerCountry: "",
  playerPosition: "",
  playerClub: "",
  technicalRating: 5,
  physicalRating: 5,
  tacticalRating: 5,
  mentalityRating: 5,
  strengths: "",
  weaknesses: "",
  overallAssessment: "",
  recommendSigning: false,
};

// Outer players have NO name field — present them as "Nationality · Position (#kit)"
const prettyPosition = (pos) =>
  pos ? String(pos).replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase()) : "Unknown";

const outerPlayerLabel = (p) =>
  `${p.nationality || "Unknown"} · ${prettyPosition(p.preferredPosition)}${p.kitNumber ? ` · #${p.kitNumber}` : ""}`;

const RatingSlider = ({ label, field, value, onChange }) => (
  <div className="flex flex-col gap-1.5">
    <div className="flex justify-between items-center">
      <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">{label}</label>
      <span className={`text-sm font-black w-8 text-center ${value >= 8 ? "text-emerald-400" : value >= 5 ? "text-amber-400" : "text-red-400"}`}>
        {value}
      </span>
    </div>
    <input
      type="range" min={1} max={10} step={1}
      value={value}
      onChange={(e) => onChange(field, Number(e.target.value))}
      className="w-full accent-emerald-500"
    />
  </div>
);

// editData = report object when editing, null when adding a new one.
export default function ScoutingModal({ open, onClose, onSaved, editData = null }) {
  const [form, setForm] = useState(defaultForm);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState(null);

  // Reference data for the dropdowns — no more raw UUID / id typing.
  const [scouts, setScouts] = useState([]);
  const [outerPlayers, setOuterPlayers] = useState([]);

  const isEditMode = !!editData;

  const unwrapList = (res) => (Array.isArray(res) ? res : (res?.content || res?.data || []));

  // Load scouts + outer-players once the modal opens so the pickers are populated.
  useEffect(() => {
    if (!open) return;
    let alive = true;
    (async () => {
      try {
        const [scoutsRes, playersRes] = await Promise.all([
          api.getScouts().catch(() => []),
          api.getOuterPlayers().catch(() => []),
        ]);
        if (!alive) return;
        setScouts(unwrapList(scoutsRes));
        setOuterPlayers(unwrapList(playersRes));
      } catch {
        /* pickers just stay empty; validation still guards submit */
      }
    })();
    return () => { alive = false; };
  }, [open]);

  // When opening in edit mode, hydrate the form with the existing report.
  useEffect(() => {
    if (open && isEditMode) {
      setForm({
        scoutKeycloakId: editData.scoutKeycloakId || "",
        outerPlayerId:   editData.outerPlayerId ?? "",
        sportType:       editData.sportType || "FOOTBALL",
        playerCountry:   editData.playerCountry || "",
        playerPosition:  editData.playerPosition || "",
        playerClub:      editData.playerClub || "",
        technicalRating: editData.technicalRating ?? 5,
        physicalRating:  editData.physicalRating ?? 5,
        tacticalRating:  editData.tacticalRating ?? 5,
        mentalityRating: editData.mentalityRating ?? 5,
        strengths:       editData.strengths || "",
        weaknesses:      editData.weaknesses || "",
        overallAssessment: editData.overallAssessment || "",
        recommendSigning:  editData.recommendSigning ?? false,
      });
    } else if (open && !isEditMode) {
      setForm(defaultForm);
    }
    setErrors({});
    setServerError(null);
  }, [open, editData]);

  if (!open) return null;

  const set = (key, val) => {
    setForm((prev) => ({ ...prev, [key]: val }));
    setErrors((prev) => ({ ...prev, [key]: "" }));
    setServerError(null);
  };

  const validate = () => {
    const e = {};
    if (!String(form.scoutKeycloakId).trim()) e.scoutKeycloakId = "Please select a scout";
    if (!form.sportType) e.sportType = "Select the player's sport";
    if (!form.playerCountry) e.playerCountry = "Select the player's country";
    if (!form.playerPosition) e.playerPosition = "Select the player's position";
    if (!form.overallAssessment.trim()) e.overallAssessment = "Overall assessment is required";
    return e;
  };

  const handleSubmit = async () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }

    setLoading(true);
    setServerError(null);
    try {
      const payload = {
        scoutKeycloakId:  String(form.scoutKeycloakId).trim(),
        outerPlayerId:    form.outerPlayerId === "" || isNaN(Number(form.outerPlayerId)) ? null : Number(form.outerPlayerId),
        sportType:        form.sportType,
        playerCountry:    form.playerCountry,
        playerPosition:   form.playerPosition,
        playerClub:       form.playerClub.trim() || null,
        technicalRating:  form.technicalRating,
        physicalRating:   form.physicalRating,
        tacticalRating:   form.tacticalRating,
        mentalityRating:  form.mentalityRating,
        strengths:        form.strengths.trim(),
        weaknesses:       form.weaknesses.trim(),
        overallAssessment: form.overallAssessment.trim(),
        recommendSigning: form.recommendSigning,
        createdAt:        editData?.createdAt || new Date().toISOString(),
      };

      if (isEditMode) {
        await api.updateScoutReport(editData.id, payload);
      } else {
        await api.createScoutReport(payload);
        // Notify the sport manager (in-app alert + email) about the new report.
        const pos = prettyPosition(form.playerPosition);
        const club = form.playerClub.trim() ? ` (${form.playerClub.trim()})` : "";
        const title = `New scout report · ${form.playerCountry} ${pos}`;
        const msg = `A ${form.sportType.toLowerCase()} ${pos} from ${form.playerCountry}${club} was scouted — ${form.recommendSigning ? "RECOMMENDED to sign" : "not recommended"}. ${form.overallAssessment.trim()}`;
        try { await api.createNotification({ recipientUserKeycloakId: SPORT_MANAGER_KC, notificationType: "BOTH", category: "REPORT_READY", status: "PENDING", title, message: msg, relatedEntityType: "SCOUT_REPORT", emailSubject: title, emailBody: msg, actionUrl: "/dashboard/scouting" }); } catch (err) { console.error("sport manager notify failed", err); }
        try { await api.createAlert({ targetUserKeycloakId: SPORT_MANAGER_KC, title, message: msg, description: msg, alertType: "SCOUT_REPORT_SUBMITTED", priority: "MEDIUM", relatedEntityType: "SCOUT_REPORT" }); } catch (err) { console.error("sport manager alert failed", err); }
      }

      onSaved?.();
      onClose();
    } catch (err) {
      setServerError(err?.message || "Failed to submit report. Check server connection.");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setForm(defaultForm);
    setErrors({});
    setServerError(null);
    onClose();
  };

  const inputCls = (key) =>
    `w-full bg-slate-800/50 border rounded-xl px-3 py-2.5 text-sm text-slate-200 outline-none transition-all placeholder:text-slate-600
     ${errors[key] ? "border-red-500/60 focus:ring-2 focus:ring-red-500/20" : "border-slate-700 focus:border-emerald-500/60 focus:ring-2 focus:ring-emerald-500/10"}`;

  const Field = ({ label, error, children, full }) => (
    <div className={`flex flex-col gap-1.5 ${full ? "col-span-2" : ""}`}>
      <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">{label}</label>
      {children}
      {error && <span className="text-red-400 text-xs">{error}</span>}
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-950 border border-slate-800 rounded-2xl shadow-2xl w-full max-w-lg">

        {/* Header */}
        <div className="flex items-center gap-3 px-6 pt-5 pb-4 border-b border-slate-800">
          <div className={`border rounded-xl p-2 ${isEditMode ? "bg-amber-500/20 border-amber-500/30" : "bg-purple-600/20 border-purple-500/30"}`}>
            <FiSearch className={isEditMode ? "text-amber-400" : "text-purple-400"} size={16} strokeWidth={2.4} />
          </div>
          <div>
            <h2 className="font-black text-slate-100 text-lg uppercase tracking-widest">
              {isEditMode ? "Edit Scout Report" : "New Scout Report"}
            </h2>
            <p className="text-slate-500 text-xs">
              {isEditMode ? `Editing report #${editData?.id}` : "Submit a player evaluation to the database"}
            </p>
          </div>
          <button onClick={handleClose} className="ml-auto text-slate-600 hover:text-slate-300 hover:bg-slate-800 rounded-lg p-1.5 transition-all">✕</button>
        </div>

        {/* Form */}
        <div className="px-6 py-5 grid grid-cols-2 gap-4 max-h-[62vh] overflow-y-auto">

          <Field label="Scout *" error={errors.scoutKeycloakId} full>
            <select
              className={inputCls("scoutKeycloakId")}
              value={form.scoutKeycloakId}
              onChange={(e) => set("scoutKeycloakId", e.target.value)}
            >
              <option value="">Select a scout…</option>
              {scouts.map((s) => (
                <option key={s.keycloakId} value={s.keycloakId} className="bg-slate-900">
                  {`${s.firstName || ""} ${s.lastName || ""}`.trim() || "Scout"}
                  {s.region ? ` — ${s.region}` : ""}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Sport *" error={errors.sportType}>
            <select className={inputCls("sportType")} value={form.sportType}
              onChange={(e) => { set("sportType", e.target.value); set("playerPosition", ""); }}>
              {SPORTS.map((s) => <option key={s} value={s} className="bg-slate-900">{prettyPosition(s)}</option>)}
            </select>
          </Field>

          <Field label="Country *" error={errors.playerCountry}>
            <select className={inputCls("playerCountry")} value={form.playerCountry} onChange={(e) => set("playerCountry", e.target.value)}>
              <option value="">Select country…</option>
              {COUNTRIES.map((c) => <option key={c} value={c} className="bg-slate-900">{c}</option>)}
            </select>
          </Field>

          <Field label="Position *" error={errors.playerPosition}>
            <select className={inputCls("playerPosition")} value={form.playerPosition} onChange={(e) => set("playerPosition", e.target.value)}>
              <option value="">Select position…</option>
              {(POSITIONS_BY_SPORT[form.sportType] || []).map((p) => <option key={p} value={p} className="bg-slate-900">{prettyPosition(p)}</option>)}
            </select>
          </Field>

          <Field label="Current Club (optional)">
            <input className={inputCls("playerClub")} placeholder="e.g. Real Madrid CF" value={form.playerClub} onChange={(e) => set("playerClub", e.target.value)} />
          </Field>

          <Field label="Tracked Player (optional)" error={errors.outerPlayerId} full>
            <select
              className={inputCls("outerPlayerId")}
              value={form.outerPlayerId}
              onChange={(e) => set("outerPlayerId", e.target.value)}
            >
              <option value="">— none / external prospect —</option>
              {outerPlayers.map((p) => (
                <option key={p.id} value={p.id} className="bg-slate-900">
                  {outerPlayerLabel(p)}
                </option>
              ))}
            </select>
          </Field>

          <div className="col-span-2 grid grid-cols-2 gap-4">
            <RatingSlider label="Technical Rating" field="technicalRating" value={form.technicalRating} onChange={set} />
            <RatingSlider label="Physical Rating"  field="physicalRating"  value={form.physicalRating}  onChange={set} />
            <RatingSlider label="Tactical Rating"  field="tacticalRating"  value={form.tacticalRating}  onChange={set} />
            <RatingSlider label="Mentality Rating" field="mentalityRating" value={form.mentalityRating} onChange={set} />
          </div>

          <Field label="Strengths" full>
            <input
              className={inputCls("strengths")}
              placeholder="e.g. Speed, Vision, Leadership"
              value={form.strengths}
              onChange={(e) => set("strengths", e.target.value)}
            />
          </Field>

          <Field label="Weaknesses" full>
            <input
              className={inputCls("weaknesses")}
              placeholder="e.g. Heading, Stamina"
              value={form.weaknesses}
              onChange={(e) => set("weaknesses", e.target.value)}
            />
          </Field>

          <Field label="Overall Assessment *" error={errors.overallAssessment} full>
            <textarea
              rows={3}
              className={`${inputCls("overallAssessment")} resize-none`}
              placeholder="Write your overall evaluation..."
              value={form.overallAssessment}
              onChange={(e) => set("overallAssessment", e.target.value)}
            />
          </Field>

          {/* Recommend Signing Toggle */}
          <div className="col-span-2 flex items-center gap-3">
            <button
              type="button"
              onClick={() => set("recommendSigning", !form.recommendSigning)}
              className={`relative w-12 h-6 rounded-full border-2 transition-all duration-300 ${
                form.recommendSigning ? "bg-emerald-500/30 border-emerald-500" : "bg-slate-800 border-slate-700"
              }`}
            >
              <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full transition-all duration-300 ${
                form.recommendSigning ? "translate-x-6 bg-emerald-400" : "bg-slate-500"
              }`} />
            </button>
            <span className={`text-xs font-black uppercase tracking-widest ${form.recommendSigning ? "text-emerald-400" : "text-slate-500"}`}>
              {form.recommendSigning ? "✓ Recommend Signing" : "Do Not Recommend"}
            </span>
          </div>

          {serverError && (
            <div className="col-span-2 bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-red-400 text-xs font-bold">
              ⚠ {serverError}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-3 px-6 py-4 border-t border-slate-800">
          <button onClick={handleClose}
            className="flex-1 py-2.5 rounded-xl border border-slate-700 text-slate-400 text-xs font-black uppercase tracking-widest hover:bg-slate-800 transition-all">
            Cancel
          </button>
          <button onClick={handleSubmit} disabled={loading}
            className={`flex-1 py-2.5 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-black uppercase tracking-widest active:scale-[0.98] transition-all flex items-center justify-center gap-2
              ${isEditMode ? "bg-amber-600 hover:bg-amber-700" : "bg-purple-600 hover:bg-purple-700"}`}>
            {loading ? (
              <><span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Saving...</>
            ) : isEditMode ? "Save Changes" : "Submit Report"}
          </button>
        </div>

      </div>
    </div>
  );
}
