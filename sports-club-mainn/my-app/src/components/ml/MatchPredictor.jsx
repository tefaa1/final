"use client";
import React, { useState } from "react";
import { api } from "@/src/lib/api";
import { FiCpu, FiPlay, FiAlertTriangle } from "react-icons/fi";
import { PageHeader } from "@/src/components/shared/SharedComponents";

// La Liga clubs the model was trained on (free-text typing led to "unknown
// team" mispredictions — a fixed list keeps inputs valid).
const LA_LIGA_TEAMS = [
  "Barcelona", "Real Madrid", "Atletico Madrid", "Sevilla", "Valencia",
  "Villarreal", "Athletic Bilbao", "Real Sociedad", "Real Betis", "Getafe",
  "Celta Vigo", "Osasuna", "Rayo Vallecano", "Mallorca", "Girona",
  "Alaves", "Las Palmas", "Espanyol", "Leganes", "Valladolid",
];
const REFEREES = [
  "Other", "Mateu Lahoz", "Jesus Gil Manzano", "Antonio Mateu Lahoz",
  "Carlos del Cerro Grande", "Jose Maria Sanchez Martinez",
  "Juan Martinez Munuera", "Cesar Soto Grado", "Ricardo de Burgos Bengoetxea",
];

export default function MatchPredictor() {
  const [form, setForm] = useState({
    home_team: "",
    away_team: "",
    referee_name: "Other",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setResult(null);

    const home = form.home_team.trim();
    const away = form.away_team.trim();

    if (!home || !away) {
      setError("Both team names are required");
      return;
    }
    if (home.toLowerCase() === away.toLowerCase()) {
      setError("Home and away team must differ");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        home_team: home,
        away_team: away,
        referee_name: form.referee_name.trim() || "Other",
      };
      const res = await api.ml.predictMatch(payload);
      setResult(res);
    } catch (err) {
      setError(err.message || "Prediction failed");
    } finally {
      setLoading(false);
    }
  };

  // FastAPI response shape:
  //   { match, referee, prediction: "W"|"L"|"D", probabilities: { W, L, D } }
  // Probabilities are already percentages (0-100).
  const probs = result?.probabilities || null;
  const predictionCode = result?.prediction || null;
  const matchLabel = result?.match || null;
  const refereeEcho = result?.referee || null;

  const OUTCOME_LABELS = {
    W: { label: "Home Win", color: "text-emerald-300" },
    L: { label: "Away Win", color: "text-rose-300" },
    D: { label: "Draw",     color: "text-amber-300" },
  };
  const outcome = predictionCode ? OUTCOME_LABELS[predictionCode] : null;
  const confidencePct = predictionCode && probs ? Number(probs[predictionCode]) : null;

  // For display order in the breakdown.
  const PROB_ORDER = [
    { key: "W", label: `Home Win${form.home_team ? ` · ${form.home_team}` : ""}`, color: "from-emerald-500 to-emerald-400" },
    { key: "D", label: "Draw",                                                     color: "from-amber-500 to-amber-400" },
    { key: "L", label: `Away Win${form.away_team ? ` · ${form.away_team}` : ""}`, color: "from-rose-500 to-rose-400" },
  ];

  return (
    <div className="w-full h-full bg-slate-950 p-6 overflow-y-auto fade-in">
      <PageHeader
        icon={FiCpu}
        title="Match Predictor"
        subtitle="AI forecast engine — projected outcome and win/draw/loss probabilities for any La Liga fixture"
      />

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Input form */}
        <form onSubmit={handleSubmit} className="lg:col-span-2 card space-y-5">
          <h3 className="text-[11px] font-extrabold uppercase text-emerald-400 tracking-[0.24em]">
            Match Inputs
          </h3>

          <div className="form-group">
            <label>Home Team</label>
            <select value={form.home_team} onChange={(e) => set("home_team", e.target.value)}>
              <option value="">Select home team…</option>
              {LA_LIGA_TEAMS.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>

          <div className="form-group">
            <label>Away Team</label>
            <select value={form.away_team} onChange={(e) => set("away_team", e.target.value)}>
              <option value="">Select away team…</option>
              {LA_LIGA_TEAMS.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>

          <div className="form-group">
            <label>Referee</label>
            <select value={form.referee_name} onChange={(e) => set("referee_name", e.target.value)}>
              {REFEREES.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>

          {error && (
            <div className="alert-banner alert-danger text-sm">
              <FiAlertTriangle /> {error}
            </div>
          )}

          <button type="submit" className="btn btn-primary w-full" disabled={loading}>
            <FiPlay strokeWidth={2.5} />
            {loading ? "Predicting..." : "Run Prediction"}
          </button>
        </form>

        {/* Result panel */}
        <div className="lg:col-span-3 card min-h-[300px]">
          <h3 className="text-[11px] font-extrabold uppercase text-emerald-400 tracking-[0.24em] mb-5">
            Prediction Result
          </h3>

          {!result && !loading && (
            <div className="empty-state">
              <FiCpu className="empty-icon mx-auto" />
              <p className="empty-title">Awaiting Input</p>
              <p className="text-sm">Fill the form and press <em>Run Prediction</em>.</p>
            </div>
          )}

          {loading && (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <div className="w-10 h-10 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
              <p className="text-[10px] font-extrabold uppercase tracking-[0.3em] text-emerald-400 animate-pulse">
                Crunching the numbers...
              </p>
            </div>
          )}

          {result && !loading && (
            <div className="space-y-5">
              {/* Match label */}
              {matchLabel && (
                <div className="text-center text-[11px] font-bold uppercase tracking-[0.28em] text-slate-400">
                  {matchLabel}
                  {refereeEcho && (
                    <span className="block text-[10px] text-slate-600 mt-1 tracking-[0.22em]">
                      Ref: {refereeEcho}
                    </span>
                  )}
                </div>
              )}

              {/* Outcome */}
              {outcome && (
                <div className="text-center py-5 px-3 bg-gradient-to-r from-emerald-500/10 to-cyan-500/5 rounded-xl border border-emerald-500/25">
                  <div className="text-[10px] font-extrabold uppercase tracking-[0.28em] text-emerald-400/80 mb-2">
                    Predicted Outcome
                  </div>
                  <div className={`text-4xl font-extrabold uppercase tracking-wide ${outcome.color}`}>
                    {outcome.label}
                  </div>
                  {confidencePct != null && !isNaN(confidencePct) && (
                    <div className="mt-3 text-sm text-slate-400 tracking-wide">
                      Confidence: <span className="text-emerald-300 font-bold tabular">{confidencePct.toFixed(1)}%</span>
                    </div>
                  )}
                </div>
              )}

              {/* Probabilities */}
              {probs && typeof probs === "object" && (
                <div className="space-y-3">
                  <h4 className="text-[10px] font-extrabold uppercase text-slate-400 tracking-[0.24em]">
                    Probability Breakdown
                  </h4>
                  {PROB_ORDER.map(({ key, label, color }) => {
                    const raw = probs[key];
                    if (raw == null) return null;
                    const pct = Math.max(0, Math.min(100, Number(raw)));
                    return (
                      <div key={key}>
                        <div className="flex justify-between items-center mb-1.5">
                          <span className="text-sm font-semibold text-slate-100 tracking-wide">
                            {label}
                          </span>
                          <span className="text-xs font-extrabold text-emerald-300 tabular tracking-wider">
                            {pct.toFixed(0)}%
                          </span>
                        </div>
                        <div className="progress-bar">
                          <div className={`h-full rounded-full bg-gradient-to-r ${color} transition-all duration-500`} style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Raw response */}
              <details className="text-xs">
                <summary className="cursor-pointer text-slate-500 hover:text-emerald-300 uppercase tracking-[0.2em] font-bold">
                  Raw response
                </summary>
                <pre className="mt-3 p-4 bg-slate-950/70 border border-slate-800 rounded-lg text-slate-300 overflow-x-auto text-[12px] leading-relaxed">
{JSON.stringify(result, null, 2)}
                </pre>
              </details>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
