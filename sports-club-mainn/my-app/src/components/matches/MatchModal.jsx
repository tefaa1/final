"use client";
import React from "react";
import { FiAward } from "react-icons/fi";
import { lookupTeam } from "@/src/lib/teamDirectory";
import PlayerAvatar from "@/src/components/shared/PlayerAvatar";
import { resolveSport, resolveSportUpper } from "@/src/lib/playerSport";
import { toLocalInputValue } from "@/src/components/matches/liveClock";

const SPORT_TYPES = ["FOOTBALL", "BASKETBALL", "HANDBALL", "TENNIS"];
const MATCH_TYPES = ["LEAGUE", "CUP", "FRIENDLY", "PLAYOFF"];
const SPORT_MAX = { FOOTBALL: 11, BASKETBALL: 5, HANDBALL: 7, TENNIS: 2 };
const titleSport = (s) => { const x = String(s || "").toLowerCase(); return x ? x[0].toUpperCase() + x.slice(1) : "General"; };
const prettyPos = (p) => String(p || "").replace(/_/g, " ");

const defaultForm = {
  homeTeamId: "",
  outerTeamId: "",
  matchType: "LEAGUE",
  sportType: "FOOTBALL",
  venue: "",
  competition: "",
  season: "",
  kickoffTime: "",
  finishTime: "",
  referee: "",
  attendance: "",
  matchSummary: "",
  notes: "",
  opponentName: "",
  opponentCrest: "",
  lineup: [],
};

// teams / opponents / stadiums / competitions / players all come from the DB
// (passed by Matches.jsx). Nothing here is hard-coded.
export default function MatchModal({ open, onClose, onAddMatch, initialData, teams = [], opponents = [], stadiums = [], competitions = [], players = [] }) {
  const [form, setForm] = React.useState(defaultForm);
  const [errors, setErrors] = React.useState({});

  React.useEffect(() => {
    if (initialData) {
      const formatted = { ...initialData };
      // Pre-fill datetime-local inputs from LOCAL parts (NOT toISOString, which
      // prints UTC and would shift the wall time by the local offset).
      if (formatted.kickoffTime) formatted.kickoffTime = toLocalInputValue(formatted.kickoffTime);
      if (formatted.finishTime) formatted.finishTime = toLocalInputValue(formatted.finishTime);
      setForm({ ...defaultForm, ...formatted, lineup: formatted.lineup || [] });
    } else {
      setForm(defaultForm);
    }
  }, [initialData, open]);

  if (!open) return null;

  const set = (key, val) => {
    setForm((prev) => ({ ...prev, [key]: val }));
    setErrors((prev) => ({ ...prev, [key]: "" }));
  };

  const max = SPORT_MAX[form.sportType] || 11;
  const toggleLineup = (pid) => {
    setForm((prev) => {
      if (prev.lineup.includes(pid)) return { ...prev, lineup: prev.lineup.filter((x) => x !== pid) };
      if (prev.lineup.length >= max) return prev;
      return { ...prev, lineup: [...prev.lineup, pid] };
    });
  };

  const validate = () => {
    const e = {};
    if (!form.homeTeamId) e.homeTeamId = "Required";
    if (!form.opponentName) e.opponentName = "Required";
    if (!form.kickoffTime) e.kickoffTime = "Required";
    if (!form.venue?.toString().trim()) e.venue = "Required";
    if (!form.competition?.toString().trim()) e.competition = "Required";
    return e;
  };

  const handleSubmit = () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    onAddMatch?.(form);
    setForm(defaultForm);
    setErrors({});
    onClose();
  };

  const handleClose = () => {
    setForm(defaultForm);
    setErrors({});
    onClose();
  };

  const Field = ({ label, error, children, full }) => (
    <div className={`flex flex-col gap-2 ${full ? "col-span-2" : ""}`}>
      <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">{label}</label>
      {children}
      {error && <span className="text-red-500 text-[10px] font-bold">{error}</span>}
    </div>
  );

  const inputCls = (key) =>
    `bg-slate-900/50 border rounded-xl px-4 py-3 text-sm text-slate-200 outline-none transition-all w-full placeholder:text-slate-600
        ${errors[key] ? "border-red-500/50 focus:border-red-500" : "border-slate-800 focus:border-emerald-500"}`;

  const visibleTeams = teams.filter(t => String(t.sportType).toUpperCase() === form.sportType);
  const visibleOpponents = opponents.filter(o => !o.sport || String(o.sport).toUpperCase() === form.sportType);
  const squad = players.filter(p => resolveSportUpper(p.preferredPosition) === form.sportType);

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-[120] p-4" onClick={e => e.target === e.currentTarget && handleClose()}>
      <style>{`@keyframes fmIn{0%{opacity:0;transform:translateY(12px) scale(.96)}100%{opacity:1;transform:none}}`}</style>
      <div className="relative bg-slate-950 rounded-3xl shadow-2xl w-full max-w-2xl border border-slate-800 overflow-hidden" style={{ animation: "fmIn .25s cubic-bezier(.2,.8,.2,1)" }}>

        {/* gradient header */}
        <div className="relative overflow-hidden border-b border-slate-800 bg-gradient-to-r from-[#0a1a3f] via-slate-900 to-[#3b0a2a] px-6 py-5">
          <div className="absolute -right-6 -top-8 w-40 h-40 rounded-full bg-emerald-500/10 blur-3xl" />
          <div className="relative flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-300 shadow-lg">
              <FiAward size={18} strokeWidth={2.4} />
            </div>
            <div>
              <h2 className="font-black text-white text-lg uppercase tracking-tight leading-none">{initialData ? "Edit Match" : "Schedule Match"}</h2>
              <p className="text-[10px] text-slate-400 uppercase tracking-[0.22em] mt-1.5">{initialData ? `Match #${initialData.id}` : "FC Barcelona · MSCMS"}</p>
            </div>
            <button onClick={handleClose} className="ml-auto w-8 h-8 rounded-lg border border-slate-700 text-slate-400 hover:text-white hover:bg-slate-800 text-sm leading-none transition-all">✕</button>
          </div>
        </div>

        {/* Form */}
        <div className="px-6 py-6 grid grid-cols-2 gap-5 max-h-[65vh] overflow-y-auto">

          {/* Sport FIRST — everything below is scoped to it */}
          <Field label="Sport *" error={errors.sportType} full>
            <select className={inputCls("sportType")} value={form.sportType}
              onChange={e => setForm(prev => ({ ...prev, sportType: e.target.value, homeTeamId: "", outerTeamId: "", opponentName: "", opponentCrest: "", lineup: [] }))}>
              {SPORT_TYPES.map(s => <option key={s} value={s} className="bg-slate-950">{s}</option>)}
            </select>
          </Field>

          {/* live logo preview */}
          {(form.homeTeamId || form.opponentName) && (() => {
            const h = lookupTeam(form.homeTeamId);
            const oCrest = form.opponentCrest;
            const HomeLogo = () => h?.crestUrl
              ? <img src={h.crestUrl} alt="" className="w-11 h-11 object-contain" />
              : <span className="text-3xl">{h?.crest || "🛡️"}</span>;
            const AwayLogo = () => (oCrest && String(oCrest).startsWith("http"))
              ? <img src={oCrest} alt="" className="w-11 h-11 object-contain" />
              : <span className="text-3xl">🛡️</span>;
            return (
              <div className="col-span-2 flex items-center justify-center gap-8 rounded-2xl border border-slate-800 bg-slate-900/40 py-4">
                <div className="flex flex-col items-center gap-1.5 w-36">
                  <HomeLogo />
                  <span className="text-[11px] font-bold text-slate-300 text-center truncate w-full">{h?.name || "Home"}</span>
                </div>
                <span className="text-slate-600 font-black text-sm">VS</span>
                <div className="flex flex-col items-center gap-1.5 w-36">
                  <AwayLogo />
                  <span className="text-[11px] font-bold text-slate-300 text-center truncate w-full">{form.opponentName || "Opponent"}</span>
                </div>
              </div>
            );
          })()}

          <Field label="Home Team *" error={errors.homeTeamId}>
            <select className={inputCls("homeTeamId")} value={form.homeTeamId}
              onChange={e => {
                const id = e.target.value;
                setForm(prev => ({ ...prev, homeTeamId: id }));
                setErrors(prev => ({ ...prev, homeTeamId: "" }));
              }}>
              <option value="" className="bg-slate-950">Select home team…</option>
              {visibleTeams.map(t => (
                <option key={t.id} value={t.id} className="bg-slate-950">{t.name}</option>
              ))}
            </select>
          </Field>

          <Field label="Opponent *" error={errors.opponentName}>
            <select className={inputCls("opponentName")} value={form.opponentName}
              onChange={e => {
                const name = e.target.value; const o = opponents.find(x => x.name === name);
                setForm(prev => ({ ...prev, opponentName: name, opponentCrest: o?.crest || "", outerTeamId: "" }));
                setErrors(prev => ({ ...prev, opponentName: "" }));
              }}>
              <option value="" className="bg-slate-950">Select opponent…</option>
              {visibleOpponents.map(o => (
                <option key={o.name} value={o.name} className="bg-slate-950">{o.name}</option>
              ))}
            </select>
          </Field>

          <Field label="Match Type" error={errors.matchType}>
            <select className={inputCls("matchType")} value={form.matchType} onChange={e => set("matchType", e.target.value)}>
              {MATCH_TYPES.map(s => <option key={s} value={s} className="bg-slate-950">{s}</option>)}
            </select>
            <span className="text-[9px] text-slate-600 normal-case tracking-normal ml-1">Nature of the fixture — league game, cup tie, friendly…</span>
          </Field>

          <Field label="Kickoff Time *" error={errors.kickoffTime}>
            <input type="datetime-local" style={{ colorScheme: "dark" }} className={inputCls("kickoffTime")} value={form.kickoffTime} onChange={e => set("kickoffTime", e.target.value)} />
          </Field>

          <Field label="Stadium / Venue *" error={errors.venue}>
            <select className={inputCls("venue")} value={form.venue} onChange={e => set("venue", e.target.value)}>
              <option value="" className="bg-slate-950">Select stadium…</option>
              {stadiums.map(s => <option key={s} value={s} className="bg-slate-950">{s}</option>)}
            </select>
          </Field>

          <Field label="Competition *" error={errors.competition}>
            <select className={inputCls("competition")} value={form.competition} onChange={e => set("competition", e.target.value)}>
              <option value="" className="bg-slate-950">Select competition…</option>
              {competitions.map(c => <option key={c} value={c} className="bg-slate-950">{c}</option>)}
            </select>
            <span className="text-[9px] text-slate-600 normal-case tracking-normal ml-1">The specific tournament it belongs to</span>
          </Field>

          <Field label="Season" error={errors.season}>
            <input className={inputCls("season")} placeholder="e.g. 2025/2026" value={form.season} onChange={e => set("season", e.target.value)} />
          </Field>

          <Field label="Referee" error={errors.referee}>
            <input className={inputCls("referee")} placeholder="Referee name" value={form.referee} onChange={e => set("referee", e.target.value)} />
          </Field>

          <Field label="Attendance" error={errors.attendance}>
            <input type="number" className={inputCls("attendance")} placeholder="e.g. 50000" value={form.attendance} onChange={e => set("attendance", e.target.value)} />
          </Field>

          <Field label="Match Summary" error={errors.matchSummary} full>
            <textarea className={`${inputCls("matchSummary")} resize-none h-16`} placeholder="Brief summary..." value={form.matchSummary} onChange={e => set("matchSummary", e.target.value)} />
          </Field>

          {/* Starting lineup — pick the squad players for this match */}
          <div className="col-span-2">
            <div className="flex items-center justify-between mb-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Starting Lineup</label>
              <span className="text-[10px] font-black text-emerald-400">{form.lineup.length}/{max}</span>
            </div>
            {squad.length === 0 ? (
              <p className="text-[11px] text-slate-600 italic">No {titleSport(form.sportType)} players available to pick.</p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-44 overflow-y-auto pr-1">
                {squad.map(p => {
                  const on = form.lineup.includes(p.id);
                  return (
                    <button key={p.id} type="button" onClick={() => toggleLineup(p.id)}
                      className={`flex items-center gap-2 rounded-xl border px-2.5 py-2 text-left transition-all ${on ? "border-emerald-500/60 bg-emerald-500/10" : "border-slate-800 bg-slate-900/40 hover:border-slate-700"}`}>
                      <PlayerAvatar name={`${p.firstName} ${p.lastName}`} sport={resolveSport(p.preferredPosition)} size={28} />
                      <div className="min-w-0 flex-1">
                        <p className="text-[11px] font-bold text-slate-200 truncate">{p.firstName} {p.lastName}</p>
                        <p className="text-[9px] text-slate-500 truncate">{prettyPos(p.preferredPosition)} · #{p.kitNumber ?? "—"}</p>
                      </div>
                      {on && <span className="text-emerald-400 text-xs">✓</span>}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-4 px-6 py-5 border-t border-slate-800">
          <button onClick={handleClose} className="flex-1 py-3 rounded-xl border border-slate-800 text-slate-400 text-xs font-bold uppercase tracking-widest hover:bg-slate-900 transition-all">Cancel</button>
          <button onClick={handleSubmit} className="flex-1 py-3 rounded-xl bg-emerald-600 text-white font-black text-xs uppercase tracking-widest hover:bg-emerald-500 shadow-lg shadow-emerald-500/20 transition-all">{initialData ? "Update Match" : "Create Match"}</button>
        </div>
      </div>
    </div>
  );
}
