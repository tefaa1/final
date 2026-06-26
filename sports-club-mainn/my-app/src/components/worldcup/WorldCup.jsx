"use client";

import React, { useEffect, useMemo, useState } from "react";
import { api } from "@/src/lib/api";
import { FiAward } from "react-icons/fi";

const fmtDate = (d) => (d ? new Date(d).toLocaleDateString(undefined, { day: "numeric", month: "short" }) : "TBD");
const isLive = (s) => ["IN_PLAY", "PAUSED", "LIVE"].includes(String(s).toUpperCase());

function Crest({ url, size = 18 }) {
  return url
    ? <img src={url} alt="" width={size} height={size} className="object-contain shrink-0" onError={(e) => { e.currentTarget.style.visibility = "hidden"; }} />
    : <span className="inline-block rounded-full bg-slate-700/70 shrink-0" style={{ width: size, height: size }} />;
}

// Stylised FIFA World Cup trophy (gold globe on a twisting body + base).
function WCTrophy({ className = "" }) {
  return (
    <svg viewBox="0 0 64 104" className={className} xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="wcGold" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fff3c4" /><stop offset="0.5" stopColor="#f0b429" /><stop offset="1" stopColor="#8a5a00" />
        </linearGradient>
      </defs>
      {/* globe */}
      <circle cx="32" cy="17" r="12" fill="url(#wcGold)" />
      <ellipse cx="32" cy="17" rx="5" ry="12" fill="none" stroke="#8a5a00" strokeWidth="1" opacity="0.6" />
      <line x1="20" y1="17" x2="44" y2="17" stroke="#8a5a00" strokeWidth="1" opacity="0.6" />
      {/* twisting body (two figures holding the globe) */}
      <path d="M23 28 C17 44 28 54 26 74 L38 74 C36 54 47 44 41 28 C38 33 33 35 32 35 C31 35 26 33 23 28 Z" fill="url(#wcGold)" />
      {/* base */}
      <rect x="20" y="74" width="24" height="7" rx="2" fill="url(#wcGold)" />
      <rect x="16" y="81" width="32" height="9" rx="2" fill="#6b4500" />
      <rect x="13" y="90" width="38" height="6" rx="2" fill="#4a2f00" />
    </svg>
  );
}

function Side({ name, crest, score, win }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="flex items-center gap-1.5 min-w-0">
        <Crest url={crest} size={16} />
        <span className={`text-[11px] truncate ${win ? "font-black text-white" : "font-semibold text-slate-300"}`}>{name || "TBD"}</span>
      </span>
      <span className={`text-[11px] font-black ${win ? "text-emerald-400" : "text-slate-500"}`}>{score ?? ""}</span>
    </div>
  );
}
function MatchCard({ m, highlight }) {
  return (
    <div className={`rounded-lg border p-2 w-40 ${highlight ? "bg-slate-900 border-amber-500/30" : "bg-slate-900/60 border-slate-800"}`}>
      <div className="flex items-center justify-between mb-1">
        <span className="text-[7px] font-black uppercase tracking-widest text-slate-600">{fmtDate(m?.utcDate)}</span>
        {isLive(m?.status) && <span className="text-[7px] font-black text-rose-400 animate-pulse">● LIVE</span>}
      </div>
      <div className="space-y-1">
        <Side name={m?.homeTeam} crest={m?.homeCrest} score={m?.homeScore} win={m?.winner === "HOME_TEAM"} />
        <Side name={m?.awayTeam} crest={m?.awayCrest} score={m?.awayScore} win={m?.winner === "AWAY_TEAM"} />
      </div>
    </div>
  );
}
function Col({ label, matches }) {
  if (!matches.length) return null;
  return (
    <div className="flex flex-col shrink-0">
      <h4 className="text-[10px] font-black uppercase tracking-widest text-emerald-400/70 mb-3 text-center">{label}</h4>
      <div className="flex flex-col justify-around gap-3 flex-1">
        {matches.map((m, i) => <MatchCard key={m?.id ?? `tbd-${label}-${i}`} m={m} />)}
      </div>
    </div>
  );
}

// Winners' podium: 2nd (left), 1st (centre, tallest, with trophy), 3rd (right).
function Podium({ champion, runnerUp, third }) {
  const Spot = ({ team, place }) => {
    const cfg = {
      1: { h: "h-28", grad: "from-amber-300 to-amber-600", ring: "ring-amber-400", medal: "🥇", label: "Champion", glow: "shadow-[0_0_30px_rgba(245,158,11,0.5)]" },
      2: { h: "h-20", grad: "from-slate-300 to-slate-500", ring: "ring-slate-300", medal: "🥈", label: "Runner-up", glow: "" },
      3: { h: "h-14", grad: "from-orange-400 to-orange-700", ring: "ring-orange-400", medal: "🥉", label: "Third", glow: "" },
    }[place];
    return (
      <div className="flex flex-col items-center justify-end flex-1 max-w-[150px]">
        {place === 1 && <WCTrophy className="w-12 h-20 mb-1 animate-[wcFloat_3s_ease-in-out_infinite] drop-shadow-[0_0_18px_rgba(245,158,11,0.6)]" />}
        <div className={`w-14 h-14 rounded-2xl bg-slate-950 border border-white/10 flex items-center justify-center ring-2 ${cfg.ring} ${cfg.glow} mb-2`}>
          {team?.crest ? <Crest url={team.crest} size={36} /> : <span className="text-2xl">{cfg.medal}</span>}
        </div>
        <span className="text-xs font-black text-slate-100 text-center truncate max-w-full">{team?.name || "TBD"}</span>
        <div className={`w-full ${cfg.h} rounded-t-xl bg-gradient-to-b ${cfg.grad} mt-2 flex flex-col items-center pt-2 shadow-xl`}>
          <span className="text-2xl">{cfg.medal}</span>
          <span className="text-[9px] font-black uppercase tracking-widest text-slate-950/80 mt-1">{cfg.label}</span>
        </div>
      </div>
    );
  };
  return (
    <div className="bg-[radial-gradient(ellipse_at_bottom,_rgba(245,158,11,0.14),_transparent_65%)] bg-slate-950 rounded-3xl border border-slate-800 p-6 mb-6">
      <h3 className="text-center text-[11px] font-black uppercase tracking-[0.3em] text-amber-400/80 mb-6">🏆 The Podium</h3>
      <div className="flex items-end justify-center gap-3 sm:gap-6 max-w-2xl mx-auto">
        <Spot team={runnerUp} place={2} />
        <Spot team={champion} place={1} />
        <Spot team={third} place={3} />
      </div>
    </div>
  );
}

// FIFA 2026 intro — animated globe + "2026" + host nations.
function Intro({ onDone }) {
  useEffect(() => { const t = setTimeout(onDone, 2600); return () => clearTimeout(t); }, [onDone]);
  return (
    <div onClick={onDone} className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-950 cursor-pointer"
      style={{ animation: "wcIntroFade 2.6s ease forwards" }}>
      <div className="text-center px-6">
        <div className="text-7xl mb-2" style={{ animation: "wcPop 0.7s cubic-bezier(.2,1.4,.4,1) both" }}>🌎</div>
        <p className="text-[12px] font-black uppercase tracking-[0.5em] text-emerald-400/80" style={{ animation: "wcRise 0.6s ease 0.3s both" }}>FIFA World Cup</p>
        <h1 className="text-7xl sm:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-b from-emerald-200 to-emerald-500 tracking-tighter" style={{ animation: "wcPop 0.7s cubic-bezier(.2,1.4,.4,1) 0.5s both" }}>2026</h1>
        <div className="flex items-center justify-center gap-4 mt-4 text-2xl" style={{ animation: "wcRise 0.6s ease 0.9s both" }}>
          <span>🇨🇦 <span className="text-xs font-bold text-slate-400 align-middle">Canada</span></span>
          <span>🇺🇸 <span className="text-xs font-bold text-slate-400 align-middle">USA</span></span>
          <span>🇲🇽 <span className="text-xs font-bold text-slate-400 align-middle">Mexico</span></span>
        </div>
        <p className="text-[10px] text-slate-600 mt-6 uppercase tracking-widest" style={{ animation: "wcRise 0.6s ease 1.3s both" }}>tap to skip</p>
      </div>
    </div>
  );
}

export default function WorldCup() {
  const [groups, setGroups] = useState([]);
  const [matches, setMatches] = useState([]);
  const [tab, setTab] = useState("groups");
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [intro, setIntro] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [g, m] = await Promise.all([
          api.getCompetitionGroups("WC").catch(() => []),
          api.getCompetitionMatches("WC").catch(() => []),
        ]);
        setGroups(Array.isArray(g) ? g : []);
        setMatches(Array.isArray(m) ? m : []);
        if ((!g || !g.length) && (!m || !m.length)) setErr("World Cup data unavailable (check API key / permissions).");
      } catch (e) { setErr(e.message || "Failed to load."); }
      setLoading(false);
    })();
  }, []);

  const ko = useMemo(() => {
    const by = {};
    matches.forEach((m) => { (by[m.stage] ||= []).push(m); });
    Object.values(by).forEach((arr) => arr.sort((a, b) => new Date(a.utcDate || 0) - new Date(b.utcDate || 0)));
    return by;
  }, [matches]);

  // The knockout bracket is rendered straight from the real football-data.org
  // fixtures. Teams fill in as the official draw is made after the group stage,
  // so a slot reads "TBD" until its match is actually drawn — no fabricated data.
  const apiKoHasTeams = (matches || []).some((m) => m.stage && m.stage !== "GROUP_STAGE" && (m.homeTeam || m.awayTeam));
  const half = (arr = []) => { const mid = Math.ceil(arr.length / 2); return [arr.slice(0, mid), arr.slice(mid)]; };
  const [r32L, r32R] = half(ko.LAST_32);
  const [r16L, r16R] = half(ko.LAST_16);
  const [qfL, qfR] = half(ko.QUARTER_FINALS);
  const [sfL, sfR] = half(ko.SEMI_FINALS);
  const final = (ko.FINAL || [])[0] || null;
  const third = (ko.THIRD_PLACE || [])[0] || null;
  const hasKnockout = (matches || []).some((m) => m.stage && m.stage !== "GROUP_STAGE");

  // Podium winners (TBD until decided).
  const winnerOf = (m) => !m ? null : m.winner === "HOME_TEAM" ? { name: m.homeTeam, crest: m.homeCrest } : m.winner === "AWAY_TEAM" ? { name: m.awayTeam, crest: m.awayCrest } : null;
  const loserOf = (m) => !m ? null : m.winner === "HOME_TEAM" ? { name: m.awayTeam, crest: m.awayCrest } : m.winner === "AWAY_TEAM" ? { name: m.homeTeam, crest: m.homeCrest } : null;
  const champion = winnerOf(final), runnerUp = loserOf(final), thirdTeam = winnerOf(third);

  return (
    <div className="fade-in">
      <style>{`
        @keyframes wcFloat{0%,100%{transform:translateY(0)}50%{transform:translateY(-6px)}}
        @keyframes wcPop{0%{transform:scale(.3);opacity:0}100%{transform:scale(1);opacity:1}}
        @keyframes wcRise{0%{transform:translateY(16px);opacity:0}100%{transform:translateY(0);opacity:1}}
        @keyframes wcIntroFade{0%,80%{opacity:1}100%{opacity:0;visibility:hidden}}
      `}</style>

      {intro && <Intro onDone={() => setIntro(false)} />}

      {/* Hero with host branding */}
      <div className="relative overflow-hidden rounded-3xl border border-emerald-500/20 p-8 mb-6
                      bg-[radial-gradient(ellipse_at_top,_rgba(16,185,129,0.18),_transparent_60%)] bg-slate-950">
        <div className="absolute -right-10 -top-10 w-64 h-64 rounded-full bg-emerald-500/10 blur-3xl" />
        <div className="relative text-center">
          <p className="text-[11px] font-black uppercase tracking-[0.4em] text-emerald-400/80 flex items-center justify-center gap-2"><FiAward /> FIFA · 🌎</p>
          <h1 className="text-4xl sm:text-6xl font-black text-white tracking-tight uppercase mt-2">World Cup 2026</h1>
          <div className="flex items-center justify-center gap-3 mt-3 flex-wrap">
            {[["🇨🇦", "Canada"], ["🇺🇸", "USA"], ["🇲🇽", "Mexico"]].map(([f, n]) => (
              <span key={n} className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800/60 border border-slate-700 text-xs font-bold text-slate-300">{f} {n}</span>
            ))}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-20 text-slate-500 font-black italic animate-pulse">LOADING WORLD CUP…</div>
      ) : err ? (
        <div className="text-center py-20 text-rose-400/80 italic">{err}</div>
      ) : (
        <>
          {/* Podium — the winners */}
          <Podium champion={champion} runnerUp={runnerUp} third={thirdTeam} />

          {/* Tabs */}
          <div className="flex gap-2 mb-6">
            {[["groups", "Group Stage"], ["bracket", "Knockout Bracket"]].map(([k, label]) => (
              <button key={k} onClick={() => setTab(k)}
                className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider border transition-all ${
                  tab === k ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40" : "bg-slate-900/50 text-slate-400 border-slate-800 hover:border-slate-700"}`}>
                {label}
              </button>
            ))}
          </div>

          {tab === "groups" ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {groups.map((g, gi) => (
                <div key={g.group || `g-${gi}`} className="bg-slate-900/50 rounded-2xl border border-slate-800 p-4 overflow-hidden">
                  <h3 className="text-sm font-black uppercase tracking-widest text-emerald-400/80 mb-3">{g.group || `Group ${gi + 1}`}</h3>
                  <div className="flex items-center gap-2 px-1 pb-1.5 mb-1 border-b border-slate-800 text-[9px] font-black uppercase tracking-widest text-slate-600">
                    <span className="w-4 text-center">#</span><span className="flex-1">Team</span>
                    <span className="w-5 text-center">P</span><span className="w-8 text-center">GD</span><span className="w-6 text-center">Pts</span>
                  </div>
                  {(g.table || []).map((r, ri) => (
                    <div key={`${gi}-${ri}`} className={`flex items-center gap-2 px-1 py-1.5 rounded-lg ${r.position <= 2 ? "bg-emerald-500/5" : ""}`}>
                      <span className="w-4 text-center font-mono text-slate-500 text-xs">{r.position}</span>
                      <Crest url={r.crest} size={16} />
                      <span className="flex-1 min-w-0 truncate text-xs font-bold text-slate-200">{r.team}</span>
                      <span className="w-5 text-center text-xs text-slate-400">{r.played}</span>
                      <span className="w-8 text-center text-xs text-slate-400">{r.goalDifference > 0 ? `+${r.goalDifference}` : r.goalDifference}</span>
                      <span className="w-6 text-center text-xs font-black text-slate-100">{r.points}</span>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          ) : !hasKnockout ? (
            <p className="text-center text-slate-600 italic py-16">Knockout fixtures appear once the group stage concludes — teams fill in automatically.</p>
          ) : (
            <>
              <p className="text-center text-[11px] text-slate-500 mb-5">
                {apiKoHasTeams
                  ? "Live from football-data.org — teams & scores update automatically as the draw is made and ties are played."
                  : "Knockout fixtures are drawn after the group stage — each slot shows TBD until its tie is officially set."}
              </p>
              <div className="overflow-x-auto pb-4">
                <div className="flex gap-5 min-w-max items-stretch justify-center">
                  <Col label="R32" matches={r32L} />
                  <Col label="R16" matches={r16L} />
                  <Col label="QF" matches={qfL} />
                  <Col label="SF" matches={sfL} />
                  <div className="flex flex-col shrink-0 justify-center items-center px-2">
                    <div className="text-2xl mb-1">🏆</div>
                    <h4 className="text-[11px] font-black uppercase tracking-[0.25em] text-amber-400 mb-3 text-center">Final</h4>
                    <MatchCard m={final} highlight />
                    {third && (
                      <div className="mt-8 flex flex-col items-center">
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-orange-400/80 mb-2 text-center">🥉 3rd Place</h4>
                        <MatchCard m={third} />
                      </div>
                    )}
                  </div>
                  <Col label="SF" matches={sfR} />
                  <Col label="QF" matches={qfR} />
                  <Col label="R16" matches={r16R} />
                  <Col label="R32" matches={r32R} />
                </div>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
