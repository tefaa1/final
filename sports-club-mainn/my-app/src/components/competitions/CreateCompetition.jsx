"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  FiArrowLeft,
  FiArrowRight,
  FiCheck,
  FiCheckCircle,
  FiAlertTriangle,
  FiAward,
  FiLock,
  FiPlus,
  FiCalendar,
} from "react-icons/fi";
import { PRESETS, getSeasonOptions } from "./presets";
import { createFromPreset, listCompetitions } from "./store";
import { TeamCrest } from "./TeamPicker";
import CompCrest from "./CompCrest";

// NOTE: every Tailwind class used for hover/glow MUST appear here as a COMPLETE
// literal string. Tailwind statically scans source for class names, so a
// composed class like `hover:${a.ring}` is never generated and the hover effect
// silently does nothing — that was the bug where only one preset card glowed.
const ACCENT = {
  emerald: {
    grad: "from-emerald-600/30 via-slate-900 to-slate-950",
    ring: "border-emerald-500/50",
    // full literal hover treatment (border + ring + lift + shadow)
    hover:
      "hover:border-emerald-500/60 hover:ring-2 hover:ring-emerald-500/40 hover:-translate-y-1 hover:shadow-xl hover:shadow-emerald-500/10",
    text: "text-emerald-300",
    chip: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
    btn: "bg-emerald-500/15 border-emerald-500/40 text-emerald-300 hover:bg-emerald-500 hover:text-white",
    sel: "bg-emerald-500/15 border-emerald-500/60 text-emerald-200",
  },
  blue: {
    grad: "from-blue-600/30 via-slate-900 to-slate-950",
    ring: "border-blue-500/50",
    hover:
      "hover:border-blue-500/60 hover:ring-2 hover:ring-blue-500/40 hover:-translate-y-1 hover:shadow-xl hover:shadow-blue-500/10",
    text: "text-blue-300",
    chip: "bg-blue-500/20 text-blue-300 border-blue-500/30",
    btn: "bg-blue-500/15 border-blue-500/40 text-blue-300 hover:bg-blue-500 hover:text-white",
    sel: "bg-blue-500/15 border-blue-500/60 text-blue-200",
  },
  amber: {
    grad: "from-amber-600/30 via-slate-900 to-slate-950",
    ring: "border-amber-500/50",
    hover:
      "hover:border-amber-500/60 hover:ring-2 hover:ring-amber-500/40 hover:-translate-y-1 hover:shadow-xl hover:shadow-amber-500/10",
    text: "text-amber-300",
    chip: "bg-amber-500/20 text-amber-300 border-amber-500/30",
    btn: "bg-amber-500/15 border-amber-500/40 text-amber-300 hover:bg-amber-500 hover:text-white",
    sel: "bg-amber-500/15 border-amber-500/60 text-amber-200",
  },
  rose: {
    grad: "from-rose-600/30 via-slate-900 to-slate-950",
    ring: "border-rose-500/50",
    hover:
      "hover:border-rose-500/60 hover:ring-2 hover:ring-rose-500/40 hover:-translate-y-1 hover:shadow-xl hover:shadow-rose-500/10",
    text: "text-rose-300",
    chip: "bg-rose-500/20 text-rose-300 border-rose-500/30",
    btn: "bg-rose-500/15 border-rose-500/40 text-rose-300 hover:bg-rose-500 hover:text-white",
    sel: "bg-rose-500/15 border-rose-500/60 text-rose-200",
  },
};

function StepDots({ step }) {
  return (
    <div className="flex gap-1.5">
      {[1, 2, 3].map((s) => (
        <span
          key={s}
          className={`h-1 rounded-full transition-all ${
            s === step ? "w-8 bg-emerald-400" : s < step ? "w-4 bg-emerald-600/60" : "w-4 bg-slate-700"
          }`}
        />
      ))}
    </div>
  );
}

// Premium gradient banner reused across the create flow.
function CreateBanner({ stepLabel }) {
  return (
    <div className="relative overflow-hidden rounded-3xl border border-slate-800 mb-7">
      <div className="absolute inset-0 bg-gradient-to-br from-[#0a1a3f] via-slate-900 to-[#3b0a2a]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,0.22),transparent_55%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(244,63,94,0.18),transparent_50%)]" />
      <img
        src="https://crests.football-data.org/81.png"
        alt=""
        aria-hidden
        className="absolute -right-6 -bottom-10 w-44 h-44 object-contain opacity-[0.06] pointer-events-none select-none"
      />
      <div className="relative px-6 py-7 md:px-8 flex items-center gap-4 md:gap-5">
        <span className="relative shrink-0">
          <span className="absolute inset-0 rounded-2xl bg-emerald-400/30 blur-xl" />
          <span className="relative inline-flex items-center justify-center w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-gradient-to-br from-amber-300 to-amber-500 ring-1 ring-amber-200/50 shadow-lg shadow-amber-500/30">
            <FiAward className="text-slate-900 text-2xl md:text-3xl" />
          </span>
        </span>
        <div className="min-w-0">
          <p className="text-[11px] font-bold text-emerald-300/80 uppercase tracking-[0.3em] mb-1.5">
            {stepLabel}
          </p>
          <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight leading-none">
            New competition
          </h1>
          <p className="mt-2 text-sm text-slate-300/90 font-medium">
            Pick a format, choose the season, then confirm the teams.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function CreateCompetition() {
  const router = useRouter();
  const [role, setRole] = useState("");
  const [step, setStep] = useState(1);
  const [presetId, setPresetId] = useState(null);
  const [season, setSeason] = useState("");
  const [customSeason, setCustomSeason] = useState(""); // optional free-text entry
  const [customOpen, setCustomOpen] = useState(false);
  const [picked, setPicked] = useState({}); // name -> team
  const [existing, setExisting] = useState([]); // existing competitions (for uniqueness)
  const [err, setErr] = useState("");
  const [saving, setSaving] = useState(false);

  const seasonOptions = useMemo(() => getSeasonOptions(10), []);

  useEffect(() => {
    setRole((localStorage.getItem("user_role") || "").toLowerCase());
    setSeason(getSeasonOptions(10)[0] || "2025/2026"); // default to upcoming season
    listCompetitions().then(setExisting).catch(() => setExisting([]));
  }, []);

  const isAdmin = role === "admin";
  const preset = useMemo(() => PRESETS.find((p) => p.id === presetId) || null, [presetId]);
  const accent = ACCENT[preset?.accent] || ACCENT.emerald;
  const pickedList = Object.values(picked);

  // Pre-select the whole eligible roster when a fixed-size preset is chosen.
  const choosePreset = (p) => {
    setErr("");
    setPresetId(p.id);
    if (p.fixedRoster) {
      const all = {};
      p.eligible.forEach((t) => (all[t.name] = t));
      setPicked(all);
    } else {
      setPicked({});
    }
    setStep(2);
  };

  const togglePick = (t) => {
    if (preset?.fixedRoster) return; // locked roster — no removals
    setPicked((cur) => {
      const next = { ...cur };
      if (next[t.name]) delete next[t.name];
      else next[t.name] = t;
      return next;
    });
  };

  // Uniqueness: block if name + season already exists.
  const duplicate = useMemo(() => {
    if (!preset) return false;
    const nm = preset.name.trim().toLowerCase();
    const sn = (season || "").trim().toLowerCase();
    return existing.some(
      (c) => (c.name || "").trim().toLowerCase() === nm && (c.season || "").trim().toLowerCase() === sn
    );
  }, [preset, season, existing]);

  const pickSeason = (s) => {
    setSeason(s);
    setCustomOpen(false);
    setErr("");
  };

  const applyCustomSeason = () => {
    const v = customSeason.trim();
    if (v) {
      setSeason(v);
      setErr("");
    }
  };

  const goToTeams = () => {
    setErr("");
    if (!season.trim()) return setErr("Pick a season / year.");
    if (duplicate)
      return setErr(`"${preset.name} · ${season}" already exists. Choose a different season.`);
    setStep(3);
  };

  const create = async () => {
    setErr("");
    if (duplicate)
      return setErr(`"${preset.name} · ${season}" already exists. Choose a different season.`);
    if (pickedList.length !== preset.teamCount)
      return setErr(`This competition needs exactly ${preset.teamCount} teams (you have ${pickedList.length}).`);
    setSaving(true);
    try {
      const full = await createFromPreset({
        presetId: preset.id,
        name: preset.name,
        season,
        teams: pickedList,
      });
      const id = full?.competition?.id;
      router.push(id != null ? `/dashboard/competitions/${id}` : "/dashboard/competitions");
    } catch (e) {
      setSaving(false);
      setErr("Couldn't create the competition. Check the backend connection and try again.");
    }
  };

  if (!isAdmin) {
    return (
      <div className="fade-in">
        <CreateBanner stepLabel="Admins only" />
        <div className="text-center py-20 bg-slate-900/40 border border-dashed border-slate-800 rounded-2xl">
          <FiLock className="mx-auto text-4xl text-slate-700 mb-3" />
          <p className="text-slate-400 font-bold">Only admins can create competitions.</p>
          <button
            onClick={() => router.push("/dashboard/competitions")}
            className="mt-4 text-emerald-400 text-xs font-black uppercase tracking-wider"
          >
            ← Back to competitions
          </button>
        </div>
      </div>
    );
  }

  const stepLabel =
    step === 1 ? "Step 1 · Choose a format" : step === 2 ? "Step 2 · Season & setup" : "Step 3 · Confirm teams";

  return (
    <div className="fade-in">
      <CreateBanner stepLabel={stepLabel} />

      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => (step === 1 ? router.push("/dashboard/competitions") : setStep((s) => s - 1))}
          className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-slate-400 hover:text-emerald-300 transition-colors"
        >
          <FiArrowLeft /> {step === 1 ? "All competitions" : "Back"}
        </button>
        <StepDots step={step} />
      </div>

      {/* ─────────── STEP 1 — preset cards ─────────── */}
      {step === 1 && (
        <div className="grid sm:grid-cols-2 gap-5">
          {PRESETS.map((p) => {
            const a = ACCENT[p.accent] || ACCENT.emerald;
            return (
              <button
                key={p.id}
                onClick={() => choosePreset(p)}
                className={`group relative text-left overflow-hidden rounded-3xl border border-slate-800 bg-slate-900/50 transition-all duration-300 ${a.hover}`}
              >
                <div className={`absolute inset-0 opacity-70 bg-gradient-to-br ${a.grad}`} />
                <div className="relative p-6">
                  <div className="flex items-center gap-4 mb-4">
                    {/* CLEAR competition logo on a light, ringed container */}
                    <CompCrest
                      competition={{ name: p.name, type: p.type }}
                      size={44}
                      className="group-hover:scale-105 transition-transform"
                    />
                    <div className="flex flex-col gap-1.5">
                      <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-[0.2em] border w-fit ${a.chip}`}>
                        {p.type === "LEAGUE" ? "League" : "Knockout"}
                      </span>
                      <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-[0.2em] bg-slate-800/70 text-slate-300 border border-slate-700 w-fit">
                        {p.sport}
                      </span>
                    </div>
                  </div>
                  <h3 className="text-2xl font-black text-white tracking-tight">{p.name}</h3>
                  <p className="text-xs text-slate-400 mt-1 mb-4">{p.subtitle}</p>
                  <ul className="space-y-1.5">
                    {p.rules.map((r, i) => (
                      <li key={i} className="flex items-start gap-2 text-[11px] text-slate-400">
                        <FiCheck className={`mt-0.5 shrink-0 ${a.text}`} size={12} /> {r}
                      </li>
                    ))}
                  </ul>
                  <div className={`flex items-center gap-1.5 mt-5 text-xs font-black uppercase tracking-wider ${a.text}`}>
                    {p.fixedRoster ? `${p.teamCount} fixed clubs` : `Pick ${p.teamCount} clubs`} · use this
                    <FiArrowRight className="group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* ─────────── STEP 2 — season & setup ─────────── */}
      {step === 2 && preset && (
        <div className="max-w-3xl">
          <div className={`relative overflow-hidden rounded-2xl border ${accent.ring} mb-6`}>
            <div className={`absolute inset-0 opacity-70 bg-gradient-to-br ${accent.grad}`} />
            <div className="relative p-5 flex items-center gap-4">
              <CompCrest competition={{ name: preset.name, type: preset.type }} size={40} />
              <div>
                <h2 className="text-xl font-black text-white tracking-tight">{preset.name}</h2>
                <p className="text-[11px] text-slate-300/80 font-bold uppercase tracking-[0.18em] mt-0.5">
                  {preset.format.label}
                </p>
              </div>
            </div>
          </div>

          {/* SELECTABLE season grid */}
          <div className="flex items-center justify-between mb-2">
            <label className="block text-[11px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <FiCalendar className="text-emerald-400" size={12} /> Season / Year
              <span className="text-emerald-400/70 normal-case tracking-normal font-bold">· pick one — must be unique</span>
            </label>
            <button
              onClick={() => setCustomOpen((v) => !v)}
              className="text-[10px] font-black uppercase tracking-wider text-slate-400 hover:text-emerald-300 flex items-center gap-1 transition-colors"
            >
              <FiPlus size={11} /> Custom
            </button>
          </div>

          <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
            {seasonOptions.map((s) => {
              const on = season === s;
              return (
                <button
                  key={s}
                  onClick={() => pickSeason(s)}
                  className={`px-2 py-3 rounded-xl border text-center transition-all ${
                    on ? accent.sel : "bg-slate-950/40 border-slate-800 text-slate-300 hover:border-emerald-500/40 hover:bg-slate-900/60"
                  }`}
                >
                  <span className="block text-sm font-black tabular-nums">{s}</span>
                  {on && <FiCheckCircle className="mx-auto mt-1 text-emerald-400" size={13} />}
                </button>
              );
            })}
          </div>

          {/* a chosen custom season that isn't in the list */}
          {season && !seasonOptions.includes(season) && (
            <p className="mt-2 flex items-center gap-1.5 text-[11px] text-emerald-300 font-bold">
              <FiCheckCircle size={12} /> Custom season selected: {season}
            </p>
          )}

          {customOpen && (
            <div className="mt-3 flex gap-2">
              <input
                autoFocus
                value={customSeason}
                onChange={(e) => setCustomSeason(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && applyCustomSeason()}
                placeholder="e.g. 2030/2031"
                className="flex-1 bg-slate-950/60 border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-emerald-500/50"
              />
              <button
                onClick={applyCustomSeason}
                className={`px-4 py-2.5 rounded-xl border text-xs font-black uppercase tracking-wider transition-all ${accent.btn}`}
              >
                Use
              </button>
            </div>
          )}

          {duplicate && (
            <p className="mt-3 flex items-center gap-1.5 text-[11px] text-rose-400 font-bold">
              <FiAlertTriangle size={12} /> A "{preset.name}" already exists for {season}. Pick another season.
            </p>
          )}

          <div className="grid grid-cols-3 gap-3 mt-6">
            <div className="rounded-xl bg-slate-900/50 border border-slate-800 px-3 py-3 text-center">
              <p className="text-2xl font-black text-white">{preset.teamCount}</p>
              <p className="text-[9px] uppercase tracking-[0.2em] text-slate-500 font-black mt-0.5">Teams</p>
            </div>
            <div className="rounded-xl bg-slate-900/50 border border-slate-800 px-3 py-3 text-center">
              <p className="text-2xl font-black text-white">{preset.format.matchesPerTeam || "KO"}</p>
              <p className="text-[9px] uppercase tracking-[0.2em] text-slate-500 font-black mt-0.5">Per team</p>
            </div>
            <div className="rounded-xl bg-slate-900/50 border border-slate-800 px-3 py-3 text-center">
              <p className="text-2xl font-black text-white">{preset.points || "—"}</p>
              <p className="text-[9px] uppercase tracking-[0.2em] text-slate-500 font-black mt-0.5">Points</p>
            </div>
          </div>

          {err && <p className="mt-4 text-[11px] text-rose-400 font-bold">{err}</p>}

          <div className="flex gap-2 mt-6">
            <button
              onClick={() => setStep(1)}
              className="px-4 py-2.5 bg-slate-950/60 border border-slate-800 text-slate-300 rounded-xl text-xs font-black uppercase tracking-wider hover:border-slate-700 transition-all flex items-center gap-2"
            >
              <FiArrowLeft /> Back
            </button>
            <div className="flex-1" />
            <button
              onClick={goToTeams}
              disabled={duplicate}
              className={`px-5 py-2.5 rounded-xl border text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 disabled:opacity-50 ${accent.btn}`}
            >
              {preset.fixedRoster ? "Review teams" : "Choose teams"} <FiArrowRight />
            </button>
          </div>
        </div>
      )}

      {/* ─────────── STEP 3 — teams ─────────── */}
      {step === 3 && preset && (
        <div>
          {/* Fixed-roster note (La Liga) */}
          {preset.fixedRoster && (
            <div className="mb-4 flex items-start gap-3 rounded-2xl border border-emerald-500/30 bg-emerald-500/5 px-4 py-3">
              <FiLock className="text-emerald-400 mt-0.5 shrink-0" />
              <p className="text-[12px] text-emerald-200/90 leading-relaxed">
                <span className="font-black">Fixed roster.</span> These are the {preset.teamCount} real{" "}
                {preset.name} clubs — the line-up is locked and can't be changed, because these <em>are</em> the{" "}
                {preset.name} teams.
              </p>
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <div>
              <p className="text-sm font-black text-white">
                {pickedList.length}/{preset.teamCount} selected
                {preset.fixedRoster ? (
                  <span className="ml-2 text-[10px] font-black text-emerald-400 uppercase tracking-wider inline-flex items-center gap-1">
                    <FiLock size={10} /> locked
                  </span>
                ) : (
                  <span className="ml-2 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    pick exactly {preset.teamCount}
                  </span>
                )}
              </p>
              <p className="text-[11px] text-slate-500">
                {preset.fixedRoster
                  ? `The official ${preset.name} clubs.`
                  : `Pick from the European pool (${preset.eligible.length} clubs).`}
              </p>
            </div>
            {!preset.fixedRoster && (
              <div className="flex gap-2">
                <button
                  onClick={() => setPicked({})}
                  className="px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider bg-slate-900/50 border border-slate-800 text-slate-400 hover:text-rose-400 hover:border-rose-500/30"
                >
                  Clear
                </button>
              </div>
            )}
          </div>

          <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
            {preset.eligible.map((t) => {
              const on = !!picked[t.name];
              const locked = preset.fixedRoster;
              return (
                <button
                  key={t.name}
                  onClick={() => togglePick(t)}
                  disabled={locked}
                  className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl border text-left transition-all ${
                    on
                      ? locked
                        ? "bg-emerald-500/10 border-emerald-500/40 cursor-default"
                        : `bg-emerald-500/10 ${accent.ring}`
                      : "bg-slate-950/40 border-slate-800 hover:border-emerald-500/40 hover:bg-slate-900/60"
                  }`}
                >
                  {/* Light, rounded backing so dark badges (e.g. Juventus) stay
                      clearly visible on the dark card — same idea as CompCrest. */}
                  <span className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-white/90 ring-1 ring-white/30 shrink-0">
                    <TeamCrest team={t} size={24} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-xs font-bold text-slate-200 truncate">{t.name}</span>
                    <span className="block text-[10px] text-slate-500 uppercase tracking-wider">{t.shortName}</span>
                  </span>
                  {on && (locked ? <FiLock className="text-emerald-400/80 shrink-0" size={13} /> : <FiCheckCircle className="text-emerald-400 shrink-0" />)}
                </button>
              );
            })}
          </div>

          {err && <p className="mt-4 text-[11px] text-rose-400 font-bold">{err}</p>}

          <div className="flex gap-2 mt-6 sticky bottom-0 py-3 bg-gradient-to-t from-slate-950 to-transparent">
            <button
              onClick={() => setStep(2)}
              className="px-4 py-2.5 bg-slate-950/60 border border-slate-800 text-slate-300 rounded-xl text-xs font-black uppercase tracking-wider hover:border-slate-700 transition-all flex items-center gap-2"
            >
              <FiArrowLeft /> Back
            </button>
            <div className="flex-1" />
            <button
              onClick={create}
              disabled={saving || pickedList.length !== preset.teamCount}
              className={`px-6 py-2.5 rounded-xl border text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 disabled:opacity-50 ${accent.btn}`}
            >
              {saving ? (
                "Creating…"
              ) : (
                <>
                  <FiAward /> Create {preset.name}
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
