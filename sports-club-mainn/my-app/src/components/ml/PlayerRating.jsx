"use client";
import React, { useState } from "react";
import { api } from "@/src/lib/api";
import { FiStar, FiSearch, FiAlertTriangle, FiUser } from "react-icons/fi";
import { PageHeader } from "@/src/components/shared/SharedComponents";

// FC Barcelona squad — names match exactly the rows in
// sportify-main/Evaluate Players/Football_Players_Data.csv so the ML
// service finds them. If you add more players to the CSV, add their
// names here too.
const KNOWN_PLAYERS = [
  "Marc-André ter Stegen",
  "Iñaki Peña",
  "Robert Lewandowski",
  "Raphinha",
  "Lamine Yamal",
  "Ferran Torres",
  "Pedri",
  "Gavi",
  "Frenkie de Jong",
  "Ilkay Gündogan",
  "Fermín López",
  "Marc Casadó",
  "Pau Cubarsí",
  "Ronald Araújo",
  "Iñigo Martínez",
  "Andreas Christensen",
  "Jules Koundé",
  "Alejandro Balde",
  "João Cancelo",
  "Héctor Fort",
];

// ─── Circular gauge ─────────────────────────────────────────────────
// SVG donut that fills proportional to the rating (0–100). Uses
// stroke-dashoffset to animate the arc. The colour is passed in as
// a Tailwind stroke-* utility (e.g. "stroke-emerald-400").
function RatingGauge({ value, size = 110, stroke = 9, color = "stroke-emerald-400" }) {
  const radius = (size - stroke) / 2;
  const circ   = 2 * Math.PI * radius;
  const safe   = Math.max(0, Math.min(100, Number(value) || 0));
  const offset = circ - (safe / 100) * circ;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        {/* Track */}
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none" strokeWidth={stroke}
          className="stroke-slate-800"
        />
        {/* Progress */}
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none" strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          className={`${color} transition-all duration-1000`}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-black text-slate-100 leading-none tabular-nums">
          {safe.toFixed(0)}
        </span>
        <span className="text-[9px] font-black uppercase tracking-widest text-slate-500 mt-0.5">
          / 100
        </span>
      </div>
    </div>
  );
}

export default function PlayerRating() {
  const [playerName, setPlayerName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setResult(null);

    const name = playerName.trim();
    if (!name) {
      setError("Player name is required");
      return;
    }

    setLoading(true);
    try {
      const res = await api.ml.ratePlayer(name);
      setResult(res);
    } catch (err) {
      // FastAPI 404 returns { detail: "Player 'X' not found." }
      const isNotFound = err.message?.includes("404") || /not found/i.test(err.message || "");
      const msg = isNotFound
        ? `Player "${name}" not found. Try one of the suggested names (Robert Lewandowski, Pedri, Gavi, ...).`
        : (err.message || "Rating request failed");
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  // The FastAPI service returns: { Name, Position, Predicted_Rating, Real_Rating_in_Data }
  // We also fall back to alternate keys so the UI keeps working if the
  // backend renames fields later.
  const predictedRaw =
    result?.Predicted_Rating ?? result?.predicted_rating ?? result?.rating ?? result?.score ?? null;
  const realRaw =
    result?.Real_Rating_in_Data ?? result?.real_rating ?? result?.actual_rating ?? null;

  const predicted = predictedRaw != null ? Number(predictedRaw) : null;
  const real      = realRaw != null && realRaw !== "N/A" ? Number(realRaw) : null;
  const hasReal   = real != null && !isNaN(real);
  const delta     = hasReal && predicted != null ? predicted - real : null;

  // Predicted ratings are on a 0–100 scale in this dataset.
  const predictedPct = predicted != null && !isNaN(predicted)
    ? Math.max(0, Math.min(100, predicted))
    : 0;

  // Tone the headline by rating bracket — red below 70, amber 70–80,
  // emerald 80+.
  const tier = predicted == null ? "neutral"
    : predicted >= 85 ? "elite"
    : predicted >= 80 ? "strong"
    : predicted >= 70 ? "solid"
    : "weak";
  // Each tier carries explicit Tailwind class strings — written out in
  // full so the JIT compiler can statically find them (dynamic
  // concatenation like `bg-${x}-500` would be purged from the bundle).
  const TIER_TONE = {
    elite:   { ring: "ring-emerald-500/40", text: "text-emerald-400", bar: "bg-emerald-500", stroke: "stroke-emerald-500", label: "Elite",      sub: "Top-tier performer" },
    strong:  { ring: "ring-emerald-400/30", text: "text-emerald-300", bar: "bg-emerald-400", stroke: "stroke-emerald-400", label: "Strong",     sub: "Above league average" },
    solid:   { ring: "ring-amber-400/30",   text: "text-amber-300",   bar: "bg-amber-400",   stroke: "stroke-amber-400",   label: "Solid",      sub: "Reliable contributor" },
    weak:    { ring: "ring-rose-400/30",    text: "text-rose-300",    bar: "bg-rose-400",    stroke: "stroke-rose-400",    label: "Developing", sub: "Below league average" },
    neutral: { ring: "ring-slate-700",      text: "text-slate-300",   bar: "bg-slate-500",   stroke: "stroke-slate-500",   label: "—",          sub: "" },
  };
  const tone = TIER_TONE[tier];

  const displayName = result?.Name || result?.player_name || result?.name || playerName;
  const playerPosition = result?.Position || result?.position || null;

  return (
    <div className="w-full h-full bg-slate-950 p-6 overflow-y-auto fade-in">
      <PageHeader
        icon={FiStar}
        title="Player Rating"
        subtitle="AI evaluation engine — predicted overall rating with model-vs-dataset accuracy check"
      />

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Input form */}
        <form onSubmit={handleSubmit} className="lg:col-span-2 card space-y-5">
          <h3 className="text-[11px] font-extrabold uppercase text-emerald-400 tracking-[0.24em]">
            Player Lookup
          </h3>

          <div className="form-group">
            <label>Player Name</label>
            <input
              type="text"
              placeholder="Start typing... e.g. Messi"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              autoFocus
              list="ml-known-players"
            />
            <datalist id="ml-known-players">
              {KNOWN_PLAYERS.map((n) => (
                <option key={n} value={n} />
              ))}
            </datalist>
            <p className="text-[10px] text-slate-500 mt-1 tracking-wide">
              Use the exact name from the FIFA training dataset. Suggestions appear as you type.
            </p>
          </div>

          {/* Quick-pick chips */}
          <div className="flex flex-wrap gap-2 -mt-2">
            {["Robert Lewandowski", "Pedri", "Gavi", "Lamine Yamal", "Ronald Araújo", "Marc-André ter Stegen"].map((name) => (
              <button
                key={name}
                type="button"
                onClick={() => setPlayerName(name)}
                className="text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/25 hover:bg-emerald-500/20 hover:border-emerald-400 transition-all"
              >
                {name}
              </button>
            ))}
          </div>

          {error && (
            <div className="alert-banner alert-danger text-sm">
              <FiAlertTriangle /> {error}
            </div>
          )}

          <button type="submit" className="btn btn-primary w-full" disabled={loading}>
            <FiSearch strokeWidth={2.5} />
            {loading ? "Evaluating..." : "Evaluate Player"}
          </button>
        </form>

        {/* Result panel */}
        <div className="lg:col-span-3 card min-h-[300px]">
          <h3 className="text-[11px] font-extrabold uppercase text-emerald-400 tracking-[0.24em] mb-5">
            Evaluation Result
          </h3>

          {!result && !loading && (
            <div className="empty-state">
              <FiUser className="empty-icon mx-auto" />
              <p className="empty-title">Awaiting Input</p>
              <p className="text-sm">Enter a player name and press <em>Evaluate Player</em>.</p>
            </div>
          )}

          {loading && (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <div className="w-10 h-10 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
              <p className="text-[10px] font-extrabold uppercase tracking-[0.3em] text-emerald-400 animate-pulse">
                Scoring player...
              </p>
            </div>
          )}

          {result && !loading && predicted != null && !isNaN(predicted) && (
            <div className="space-y-6">
              {/* ── Player header ─────────────────────────────────────── */}
              <div className="flex items-center justify-between gap-4 pb-5 border-b border-slate-800">
                <div className="min-w-0">
                  <p className="text-[10px] font-black uppercase tracking-[0.24em] text-slate-500 mb-1">
                    Player
                  </p>
                  <h3 className="text-xl font-black text-slate-100 truncate">{displayName}</h3>
                  {playerPosition && (
                    <span className="inline-block mt-2 text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full bg-slate-900 text-slate-300 border border-slate-800">
                      {playerPosition}
                    </span>
                  )}
                </div>
                <span className={`text-[10px] font-black uppercase tracking-[0.24em] px-3 py-1.5 rounded-full ring-1 ${tone.ring} ${tone.text} bg-slate-900/60`}>
                  {tone.label}
                </span>
              </div>

              {/* ── Predicted-rating gauge ─────────────────────────────── */}
              <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6">
                <div className="grid grid-cols-[auto_1fr] gap-6 items-center">
                  {/* Circular gauge */}
                  <RatingGauge value={predicted} color={tone.stroke} />

                  <div className="min-w-0">
                    <p className="text-[10px] font-black uppercase tracking-[0.24em] text-slate-500 mb-1">
                      Predicted Rating
                    </p>
                    <div className="flex items-baseline gap-2 mb-2">
                      <FiStar className="text-amber-400" size={20} strokeWidth={2.4} />
                      <span className={`text-4xl font-black tracking-tight ${tone.text}`}>
                        {predicted.toFixed(1)}
                      </span>
                      <span className="text-sm text-slate-500 font-bold">/ 100</span>
                    </div>
                    <p className="text-xs text-slate-400 mb-3">{tone.sub}</p>

                    {/* Horizontal progress */}
                    <div className="h-2 bg-slate-800/80 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${tone.bar} rounded-full transition-all duration-1000`}
                        style={{ width: `${predictedPct}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-[9px] font-bold text-slate-600 uppercase tracking-widest mt-1.5">
                      <span>0</span>
                      <span>50</span>
                      <span>100</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* ── Predicted vs Actual comparison ───────────────────── */}
              {hasReal && (
                <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-5">
                  <p className="text-[10px] font-black uppercase tracking-[0.24em] text-slate-500 mb-4">
                    Model accuracy on this player
                  </p>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center bg-slate-950/50 rounded-xl py-4 border border-slate-800/60">
                      <p className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-1">Predicted</p>
                      <p className={`text-2xl font-black ${tone.text}`}>{predicted.toFixed(1)}</p>
                    </div>
                    <div className="text-center bg-slate-950/50 rounded-xl py-4 border border-slate-800/60">
                      <p className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-1">Actual</p>
                      <p className="text-2xl font-black text-slate-200">{real.toFixed(1)}</p>
                    </div>
                    <div className="text-center bg-slate-950/50 rounded-xl py-4 border border-slate-800/60">
                      <p className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-1">Delta</p>
                      <p className={`text-2xl font-black ${
                        Math.abs(delta) < 1 ? "text-emerald-400"
                        : Math.abs(delta) < 3 ? "text-amber-400"
                        : "text-rose-400"
                      }`}>
                        {delta > 0 ? "+" : ""}{delta.toFixed(1)}
                      </p>
                    </div>
                  </div>
                  <p className="text-[10px] font-bold text-slate-500 text-center mt-3 italic">
                    {Math.abs(delta) < 1
                      ? "✓ Excellent — model prediction matches the dataset rating closely."
                      : Math.abs(delta) < 3
                        ? "Within tolerance — minor deviation from the reference value."
                        : "Noticeable gap — model under/over-rates this player versus the dataset."}
                  </p>
                </div>
              )}

              {/* Raw response (debug, collapsed by default) */}
              <details className="text-xs">
                <summary className="cursor-pointer text-slate-600 hover:text-emerald-300 uppercase tracking-[0.2em] font-bold">
                  Raw response
                </summary>
                <pre className="mt-3 p-4 bg-slate-950/70 border border-slate-800 rounded-lg text-slate-300 overflow-x-auto text-[11px] leading-relaxed">
{JSON.stringify(result, null, 2)}
                </pre>
              </details>
            </div>
          )}

          {/* Fallback when the response doesn't have a numeric rating at all */}
          {result && !loading && (predicted == null || isNaN(predicted)) && (
            <div className="space-y-4">
              <div className="text-center py-4 px-4 bg-slate-900/40 border border-slate-800 rounded-xl">
                <p className="text-sm text-slate-300">
                  Response received but no <code className="text-emerald-400">Predicted_Rating</code> field was found.
                </p>
              </div>
              <pre className="p-4 bg-slate-950/70 border border-slate-800 rounded-lg text-slate-300 overflow-x-auto text-[12px] leading-relaxed">
{JSON.stringify(result, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
