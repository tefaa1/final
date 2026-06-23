"use client"
import React, { useState, useEffect, useCallback } from "react";
import { FileText, Calendar, Download, TrendingUp, Eye, Users, Activity, DollarSign } from "lucide-react";
import { AiFillEdit } from "react-icons/ai";
import { RiDeleteBin6Line } from "react-icons/ri";
import { api } from "@/src/lib/api";
import { PageHeader, FormModal, Toast } from "@/src/components/shared/SharedComponents";
import { HiOutlineDocumentReport } from "react-icons/hi";
import ScoutingModal from "@/src/components/scouting/ScoutingModal";
import useRole from "@/src/lib/useRole";
import { displayTeamName } from "@/src/lib/teamDirectory";
import { displayUserName } from "@/src/lib/userDirectory";

const iconMap = {
  Performance: TrendingUp,
  Development: Users,
  Medical:     Activity,
  Financial:   DollarSign,
  Scouting:    Eye,
  Analytics:   TrendingUp,
};

const safeArray = (data) => Array.isArray(data) ? data : (data?.content || []);

// Some match-analysis fields (sportSpecificStats, playerRatings) arrive from the
// API as JSON *strings*. Parse defensively: an object is returned as-is, a valid
// JSON string is parsed, and anything malformed/empty falls back to null so callers
// never crash on nested access.
const parseMaybeJson = (val) => {
  if (val == null) return null;
  if (typeof val === "object") return val;
  if (typeof val === "string") {
    const trimmed = val.trim();
    if (!trimmed) return null;
    try {
      return JSON.parse(trimmed);
    } catch {
      // Not JSON — surface the raw string so we don't lose the content.
      return trimmed;
    }
  }
  return val;
};

// Renders a parsed stats/ratings object as small key→value chips. Falls back to a
// plain string when the source wasn't a JSON object, and renders nothing for null.
function StatChips({ data, accent = "emerald" }) {
  const parsed = parseMaybeJson(data);
  if (parsed == null) return null;
  if (typeof parsed !== "object") {
    return <p className="text-xs text-slate-400 leading-relaxed break-words">{String(parsed)}</p>;
  }
  const entries = Object.entries(parsed).filter(([, v]) => v != null && typeof v !== "object");
  if (entries.length === 0) return null;
  const tone = accent === "amber"
    ? "bg-amber-500/10 border-amber-500/20 text-amber-300"
    : "bg-emerald-500/10 border-emerald-500/20 text-emerald-300";
  return (
    <div className="flex flex-wrap gap-1.5">
      {entries.map(([k, v]) => (
        <span key={k} className={`inline-flex items-center gap-1.5 text-[10px] font-bold px-2 py-1 rounded-lg border ${tone}`}>
          <span className="uppercase tracking-wider text-slate-400">{k}</span>
          <span className="tabular-nums text-slate-100">{String(v)}</span>
        </span>
      ))}
    </div>
  );
}

// ── Helper: بيحدد الـ API calls الصح بناءً على نوع الريبورت ──────────────
const getApiActions = (category) => {
  switch (category) {
    case "Scouting":  return { update: api.updateScoutReport,   del: api.deleteScoutReport };
    case "Analytics": return { update: api.updateTeamAnalytics, del: api.deleteTeamAnalytics };
    case "Match":     return { update: api.updateMatchAnalysis,  del: api.deleteMatchAnalysis };
    default:          return { update: api.updateTeamAnalytics, del: api.deleteTeamAnalytics };
  }
};

export default function ReportsPage() {
  const [search, setSearch]         = useState("");
  const [activeTab, setActiveTab]   = useState("All");
  const [reports, setReports]       = useState([]);
  const [loading, setLoading]       = useState(true);
  const [showScoutModal, setShowScoutModal] = useState(false);
  const [editReport, setEditReport] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [typeMenu, setTypeMenu] = useState(false);      // "New report" type chooser
  const [newKind, setNewKind] = useState(null);          // "Analytics" | "Match"
  const [viewReport, setViewReport] = useState(null);    // report detail modal
  const [teams, setTeams] = useState([]);
  const [matches, setMatches] = useState([]);
  const [toast, setToast] = useState(null);
  const { canEdit } = useRole();
  const SPORT_TYPES = ["FOOTBALL", "BASKETBALL", "HANDBALL", "TENNIS", "VOLLEYBALL", "SWIMMING"];
  const ADMIN_KC = "00000000-0000-0000-0000-000000000001";
  const arr = (r) => (Array.isArray(r) ? r : (r?.content || r?.data || []));
  useEffect(() => {
    api.getTeams().then((r) => setTeams(arr(r))).catch(() => {});
    api.getMatches().then((r) => setMatches(arr(r))).catch(() => {});
  }, []);

  // ── Fetch ──────────────────────────────────────────────────────────────────
  const fetchReports = useCallback(async () => {
    setLoading(true);
    try {
      const [teamData, matchData, scoutData, matchList] = await Promise.all([
        api.getTeamAnalytics().catch(() => []),
        api.getMatchAnalyses().catch(() => []),
        api.getScoutReports().catch(() => []),
        api.getMatches().catch(() => []),
      ]);

      // Build a matchId → "FC Barcelona vs <opponent>" lookup so match
      // reports never fall back to a raw "#id" title.
      const matchById = {};
      safeArray(matchList).forEach(m => { matchById[Number(m.id)] = m; });
      const matchTitle = (id) => {
        const m = matchById[Number(id)];
        if (!m) return null;
        const home = displayTeamName(m.homeTeamId, "FC Barcelona");
        const opp = m.opponentName
          || (m.outerTeamId != null ? displayTeamName(m.outerTeamId, "Opponent") : null)
          || "Opponent";
        return `${home} vs ${opp}`;
      };

      const mappedTeam = safeArray(teamData).map(t => ({
        ...t, _raw: t, _source: "team",
        category: "Analytics",
        title: t.title || t.analysisTitle || t.teamName
          || `${displayTeamName(t.teamId, "Team")} — Performance Report`,
        desc:  t.description || t.notes || t.summary || "Team performance analytics report.",
        createdAt: t.createdAt || t.calculatedAt || null,
      }));

      const mappedMatch = safeArray(matchData).map(m => ({
        ...m, _raw: m, _source: "match",
        category: "Match",
        title: m.title || m.analysisTitle || m.matchTitle
          || (matchTitle(m.matchId) ? `${matchTitle(m.matchId)} — Match Analysis` : "Match Analysis"),
        desc:  m.description || m.notes || m.tacticalAnalysis || m.summary || "Match performance analysis report.",
        // analyzedAt is the real timestamp for a match analysis — prefer it.
        createdAt: m.analyzedAt || m.createdAt || null,
        // sportSpecificStats / playerRatings arrive as JSON strings — parse safely
        // up front so rendering never has to touch a raw string.
        sportSpecificStats: parseMaybeJson(m.sportSpecificStats),
        playerRatings: parseMaybeJson(m.playerRatings),
        keyMoments: m.keyMoments || null,
        tacticalAnalysis: m.tacticalAnalysis || null,
      }));

      const mappedScout = safeArray(scoutData).map(s => ({
        ...s, _raw: s, _source: "scout",
        category: "Scouting",
        title: s.title || s.playerName
          || (s.playerKeycloakId ? `Scout Report — ${displayUserName(s.playerKeycloakId, "Player")}` : "Scout Report"),
        desc:  s.overallAssessment || s.notes || "Detailed scouting analysis.",
        createdAt: s.reportDate || s.createdAt || null,
      }));

      const combined = [...mappedTeam, ...mappedMatch, ...mappedScout].map(item => {
        const ts = item.createdAt ? new Date(item.createdAt) : null;
        const validTs = ts && !isNaN(ts.getTime());
        return {
          ...item,
          icon: iconMap[item.category] || FileText,
          // Real timestamp only — never default to "now". Unknown dates read "—".
          date: validTs ? ts.toLocaleDateString() : "—",
          // Only show a file size the backend actually reported. No fake "1.5 MB".
          size: item.fileSize || null,
        };
      });

      setReports(combined);
    } catch (err) {
      console.error("Reports Fetch Error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchReports(); }, [fetchReports]);

  // ── Delete ─────────────────────────────────────────────────────────────────
  const handleDelete = async (report) => {
    if (!confirm(`Delete "${report.title}"?`)) return;
    setDeletingId(report.id);
    try {
      const { del } = getApiActions(report.category);
      await del(report.id);
      await fetchReports();
    } catch (err) {
      alert("Failed to delete: " + (err?.message || "Server error"));
    } finally {
      setDeletingId(null);
    }
  };

  // ── Edit ───────────────────────────────────────────────────────────────────
  const handleEdit = (report) => {
    // بس Scouting عنده مودال مخصص، الباقي مش عندنا مودال edit ليهم دلوقتي
    if (report.category === "Scouting") {
      setEditReport(report._raw || report);
      setShowScoutModal(true);
    }
  };

  // ── Download ───────────────────────────────────────────────────────────────
  // Builds a plain-text dump of the report and triggers a browser download.
  // No PDF dependency — keeps the bundle slim. The .txt opens in any reader.
  const handleDownload = (report) => {
    const raw = report._raw || {};
    const lines = [
      `===========================================`,
      `  ${report.title}`,
      `  Category: ${report.category}`,
      `  Generated: ${report.date}`,
      `===========================================`,
      ``,
      `Description:`,
      report.desc || "—",
      ``,
    ];

    // Append any non-trivial raw fields so the export carries the full record.
    // Humanise id-bearing fields so the export never leaks a bare UUID/teamId.
    const humanise = (key, val) => {
      if (key === "teamId") return displayTeamName(val, "Team");
      if (/keycloakid$/i.test(key)) return displayUserName(String(val), "User");
      return val;
    };
    // JSON-string fields (sportSpecificStats, playerRatings) should expand into
    // readable key: value lines rather than dumping a raw "{...}" blob.
    const JSON_FIELDS = new Set(["sportSpecificStats", "playerRatings"]);
    Object.entries(raw).forEach(([k, v]) => {
      if (v == null || v === "" || k.startsWith("_")) return;
      if (JSON_FIELDS.has(k)) {
        const parsed = parseMaybeJson(v);
        if (parsed && typeof parsed === "object") {
          lines.push(`${k}:`);
          Object.entries(parsed).forEach(([pk, pv]) => lines.push(`  - ${pk}: ${pv}`));
          return;
        }
        if (parsed != null) lines.push(`${k}: ${parsed}`);
        return;
      }
      if (typeof v === "object") return; // skip other nested objects to keep it readable
      lines.push(`${k}: ${humanise(k, v)}`);
    });

    const blob = new Blob([lines.join("\n")], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const safeName = (report.title || "report").replace(/[^a-z0-9_-]+/gi, "_").toLowerCase();
    const a = document.createElement("a");
    a.href = url;
    a.download = `${safeName}_${report.category || "report"}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // ── Create non-scouting reports ──────────────────────────────────────────
  const submitNewReport = async (form) => {
    try {
      if (newKind === "Analytics") {
        await api.createTeamAnalytics({
          teamId: Number(form.teamId), sportType: form.sportType,
          periodStart: form.periodStart, periodEnd: form.periodEnd,
          totalMatches: form.totalMatches ? Number(form.totalMatches) : null,
          wins: form.wins ? Number(form.wins) : null, draws: form.draws ? Number(form.draws) : null, losses: form.losses ? Number(form.losses) : null,
          calculatedAt: new Date().toISOString(), notes: form.notes || null,
        });
      } else if (newKind === "Match") {
        await api.createMatchAnalysis({
          matchId: Number(form.matchId), teamId: Number(form.teamId), sportType: form.sportType,
          tacticalAnalysis: form.tacticalAnalysis || null, keyMoments: form.keyMoments || null,
          analyzedByUserKeycloakId: ADMIN_KC, analyzedAt: new Date().toISOString(), notes: form.notes || null,
        });
      }
      setToast({ msg: "Report created", type: "success" });
      setNewKind(null);
      fetchReports();
    } catch (err) {
      setToast({ msg: err?.message || "Failed to create report", type: "error" });
    }
  };

  const analyticsFields = [
    { key: "teamId", label: "Team", type: "select", options: teams.map((t) => ({ value: String(t.id), label: t.name })), required: true },
    { key: "sportType", label: "Sport", type: "select", options: SPORT_TYPES, required: true },
    { key: "periodStart", label: "Period Start", type: "date", required: true },
    { key: "periodEnd", label: "Period End", type: "date", required: true },
    { key: "totalMatches", label: "Total Matches", type: "number" },
    { key: "wins", label: "Wins", type: "number" },
    { key: "draws", label: "Draws", type: "number" },
    { key: "losses", label: "Losses", type: "number" },
    { key: "notes", label: "Notes", full: true },
  ];
  const matchFields = [
    { key: "matchId", label: "Match", type: "select", options: matches.map((m) => ({ value: String(m.id), label: `#${m.id} ${displayTeamName(m.homeTeamId, "FCB")} vs ${m.opponentName || (m.outerTeamId != null ? displayTeamName(m.outerTeamId, "Opp") : "Opponent")}` })), required: true },
    { key: "teamId", label: "Team", type: "select", options: teams.map((t) => ({ value: String(t.id), label: t.name })), required: true },
    { key: "sportType", label: "Sport", type: "select", options: SPORT_TYPES, required: true },
    { key: "tacticalAnalysis", label: "Tactical Analysis", full: true },
    { key: "keyMoments", label: "Key Moments", full: true },
    { key: "notes", label: "Notes", full: true },
  ];

  // ── Filters ────────────────────────────────────────────────────────────────
  const filteredReports = reports.filter(r => {
    const matchesSearch = r.title?.toLowerCase().includes(search.toLowerCase());
    const matchesTab    = activeTab === "All" || r.category === activeTab;
    return matchesSearch && matchesTab;
  });

  const categories = ["All", ...new Set(reports.map(r => r.category))];

  return (
    <div className="bg-[#030712] min-h-screen p-6 lg:p-10 overflow-y-auto w-full fade-in">
      <div className="max-w-7xl mx-auto space-y-10">

        {/* ── Header ───────────────────────────────────────────────────────── */}
        <PageHeader
          title="Reports & Analytics"
          subtitle="Official insights and statistics across the club"
          icon={HiOutlineDocumentReport}
          action={
            canEdit ? (
              <button
                onClick={() => setTypeMenu(true)}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold shadow-lg shadow-emerald-950 transition-all active:scale-95">
                + New Report
              </button>
            ) : null
          }
        />

        {/* ── Stats Grid ───────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { title: "Total Reports",    value: reports.length,                                          icon: FileText,   color: "text-white" },
            { title: "Team Analytics",   value: reports.filter(r => r.category === "Analytics").length,  icon: TrendingUp, color: "text-emerald-400" },
            { title: "Match Analyses",   value: reports.filter(r => r.category === "Match").length,      icon: Activity,   color: "text-rose-400" },
            { title: "Scouting Reports", value: reports.filter(r => r.category === "Scouting").length,   icon: Eye,        color: "text-amber-400" },
          ].map((stat, i) => (
            <div key={i} className="bg-[#0a0f1d] rounded-[2rem] px-6 py-6 border border-white/5 shadow-2xl relative overflow-hidden group">
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1 relative z-10">{stat.title}</p>
              <p className={`text-3xl font-black tracking-tight relative z-10 ${stat.color}`}>{stat.value}</p>
              <div className="absolute -right-4 -bottom-4 text-white/[0.02] group-hover:text-emerald-500/10 transition-colors duration-500">
                <stat.icon size={80} />
              </div>
            </div>
          ))}
        </div>

        {/* ── Search + Filters ─────────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search reports..."
            className="bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-300 placeholder:text-slate-600 outline-none focus:border-emerald-500/50 transition-all w-full sm:w-72"
          />
          <div className="flex gap-2 p-1.5 bg-slate-950/50 border border-slate-800 rounded-xl ">
            {categories.map(cat => (
              <button key={cat} onClick={() => setActiveTab(cat)}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                  activeTab === cat
                    ? "bg-emerald-600 text-white shadow-lg shadow-emerald-950"
                    : "text-slate-500 hover:text-slate-300 hover:bg-slate-900"
                }`}>
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* ── Cards ────────────────────────────────────────────────────────── */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 text-slate-600 gap-4">
            <div className="w-12 h-12 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
            <p className="text-[10px] font-black uppercase tracking-[0.3em] animate-pulse">Compiling Reports...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8 mt-4">
            {filteredReports.map((report, index) => {
              const IconComponent = report.icon || FileText;
              const isDeleting    = deletingId === report.id;
              const isScout       = report.category === "Scouting";
              const uniqueKey     = `${report.category ?? "report"}-${report.id ?? "x"}-${index}`;

              return (
                <div key={uniqueKey}
                  className="bg-[#0a0f1d] border border-white/5 rounded-[2.5rem] p-6 hover:border-emerald-500/30 transition-all shadow-2xl group relative overflow-hidden flex flex-col h-full">

                  {/* ── Badge + Actions ── */}
                  <div className="flex justify-between items-start mb-6">
                    <div className="text-[10px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full border shadow-lg bg-emerald-500/10 text-emerald-400 border-emerald-500/20 z-10">
                      {report.category}
                    </div>

                    <div className="flex items-center gap-2 z-10">
                      <button
                        onClick={() => setViewReport(report)}
                        title="View Report"
                        className="w-9 h-9 bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-center text-slate-500 hover:text-emerald-400 hover:border-emerald-500/40 transition-all">
                        <Eye size={14} />
                      </button>
                      {canEdit && isScout && (
                        <button
                          onClick={() => handleEdit(report)}
                          title="Edit Report"
                          className="w-9 h-9 bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-center text-slate-500 hover:text-amber-400 hover:border-amber-500/40 transition-all">
                          <AiFillEdit size={14} />
                        </button>
                      )}

                      {canEdit && (
                      <button
                        onClick={() => handleDelete(report)}
                        disabled={isDeleting}
                        title="Delete Report"
                        className="w-9 h-9 bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-center text-slate-500 hover:text-red-400 hover:border-red-500/40 transition-all disabled:opacity-40">
                        {isDeleting
                          ? <span className="w-3 h-3 border-2 border-red-400/30 border-t-red-400 rounded-full animate-spin" />
                          : <RiDeleteBin6Line size={14} />}
                      </button>
                      )}

                      {/* Icon */}
                      <div className="w-10 h-10 bg-slate-950 rounded-2xl flex items-center justify-center text-slate-500 border border-white/5 shadow-inner group-hover:text-emerald-400 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
                        <IconComponent size={18} />
                      </div>
                    </div>
                  </div>

                  {/* ── Content ── */}
                  <div className="flex-1 mb-6 z-10">
                    <h3 className="text-white font-black text-lg uppercase tracking-tight mb-2 group-hover:text-emerald-400 transition-colors line-clamp-2">
                      {report.title}
                    </h3>
                    <p className="text-xs text-slate-400 line-clamp-3 leading-relaxed">{report.desc}</p>

                    {/* Structured match-analysis stats (parsed from JSON strings) */}
                    {report.category === "Match" && (report.sportSpecificStats || report.playerRatings) && (
                      <div className="mt-4 space-y-3">
                        {parseMaybeJson(report.sportSpecificStats) && (
                          <div>
                            <p className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-1.5">Match Stats</p>
                            <StatChips data={report.sportSpecificStats} accent="emerald" />
                          </div>
                        )}
                        {parseMaybeJson(report.playerRatings) && (
                          <div>
                            <p className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-1.5">Player Ratings</p>
                            <StatChips data={report.playerRatings} accent="amber" />
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* ── Meta ── */}
                  <div className="bg-slate-950/40 p-4 rounded-[1.8rem] border border-white/5 space-y-3 mb-6 z-10">
                    <div className="flex justify-between items-center text-[10px] font-black tracking-widest text-slate-500">
                      <span className="flex items-center gap-2 uppercase">
                        <Calendar size={14} className="text-emerald-500" /> Generated On
                      </span>
                      <span className="text-slate-200">{report.date}</span>
                    </div>
                    {report.size && (
                      <div className="flex justify-between items-center text-[10px] font-black tracking-widest text-slate-500 border-t border-white/5 pt-3">
                        <span className="flex items-center gap-2 uppercase">
                          <Download size={14} className="text-emerald-500" /> File Size
                        </span>
                        <span className="text-slate-200">{report.size}</span>
                      </div>
                    )}
                  </div>

                  {/* ── Action ── */}
                  <button
                    onClick={() => handleDownload(report)}
                    className="w-full mt-auto inline-flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest px-4 py-3.5 rounded-2xl bg-emerald-600/10 border border-emerald-500/20 text-emerald-500 hover:bg-emerald-600 hover:text-white transition-all shadow-lg z-10">
                    <Download size={16} /> Download Report
                  </button>

                  {/* Decor */}
                  <div className="absolute -bottom-6 -right-6 text-white/[0.02] pointer-events-none group-hover:text-emerald-500/[0.05] transition-colors duration-700">
                    <IconComponent size={140} />
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {!loading && filteredReports.length === 0 && (
          <div className="text-center py-24">
            <div className="text-6xl mb-6 opacity-20 grayscale">📭</div>
            <p className="text-lg font-bold text-slate-400 uppercase tracking-widest">No reports found</p>
          </div>
        )}
      </div>

      {/* ── New report TYPE CHOOSER ───────────────────────────────────────── */}
      {typeMenu && (
        <div className="fixed inset-0 z-[120] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4" onClick={(e) => e.target === e.currentTarget && setTypeMenu(false)}>
          <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-950 shadow-2xl p-6">
            <h3 className="font-black text-white text-lg mb-4">New Report</h3>
            <div className="space-y-2.5">
              {[
                ["Scouting", "Player scouting evaluation", Eye, () => { setTypeMenu(false); setEditReport(null); setShowScoutModal(true); }],
                ["Team Analytics", "Team performance over a period", TrendingUp, () => { setTypeMenu(false); setNewKind("Analytics"); }],
                ["Match Analysis", "Post-match tactical analysis", Activity, () => { setTypeMenu(false); setNewKind("Match"); }],
              ].map(([label, desc, Icon, onClick]) => (
                <button key={label} onClick={onClick} className="w-full flex items-center gap-3 text-left rounded-xl border border-slate-800 bg-slate-900/40 px-4 py-3 hover:border-emerald-500/40 transition-all">
                  <Icon size={18} className="text-emerald-400 shrink-0" />
                  <div><p className="text-sm font-black text-slate-100">{label}</p><p className="text-[11px] text-slate-500">{desc}</p></div>
                </button>
              ))}
            </div>
            <button onClick={() => setTypeMenu(false)} className="mt-4 w-full py-2.5 rounded-xl border border-slate-800 text-slate-400 text-xs font-black uppercase tracking-widest hover:bg-slate-900">Cancel</button>
          </div>
        </div>
      )}

      {/* ── Team Analytics / Match Analysis create forms ──────────────────── */}
      {newKind === "Analytics" && (
        <FormModal title="New Team Analytics Report" fields={analyticsFields} initialData={{ sportType: "FOOTBALL" }}
          onSubmit={submitNewReport} onClose={() => setNewKind(null)} />
      )}
      {newKind === "Match" && (
        <FormModal title="New Match Analysis Report" fields={matchFields} initialData={{ sportType: "FOOTBALL" }}
          onSubmit={submitNewReport} onClose={() => setNewKind(null)} />
      )}

      {/* ── View report modal (with download) ─────────────────────────────── */}
      {viewReport && (
        <div className="fixed inset-0 z-[120] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4" onClick={(e) => e.target === e.currentTarget && setViewReport(null)}>
          <div className="w-full max-w-2xl max-h-[88vh] overflow-y-auto rounded-2xl border border-slate-800 bg-slate-950 shadow-2xl">
            <div className="sticky top-0 bg-slate-950/95 backdrop-blur px-6 py-4 border-b border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400">{viewReport.category}</span>
                <h3 className="font-black text-white text-lg leading-tight">{viewReport.title}</h3>
                <p className="text-[11px] text-slate-500">Generated {viewReport.date}</p>
              </div>
              <button onClick={() => setViewReport(null)} className="text-slate-500 hover:text-white p-1 text-lg">✕</button>
            </div>
            <div className="p-6 space-y-2">
              <p className="text-sm text-slate-300 leading-relaxed mb-3">{viewReport.desc}</p>
              {Object.entries(viewReport._raw || {}).filter(([k, v]) => v != null && v !== "" && !k.startsWith("_") && typeof v !== "object").map(([k, v]) => (
                <div key={k} className="flex items-start justify-between gap-4 border-b border-slate-900 py-1.5">
                  <span className="text-[11px] font-black uppercase tracking-widest text-slate-500">{k}</span>
                  <span className="text-[13px] text-slate-200 text-right break-all">{String(v)}</span>
                </div>
              ))}
            </div>
            <div className="px-6 py-4 border-t border-slate-800 flex justify-end gap-3">
              <button onClick={() => setViewReport(null)} className="px-5 py-2.5 rounded-xl border border-slate-800 text-slate-400 text-xs font-black uppercase tracking-widest hover:bg-slate-900">Close</button>
              <button onClick={() => handleDownload(viewReport)} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 text-white text-xs font-black uppercase tracking-widest hover:bg-emerald-500"><Download size={14} /> Download</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Scout Report Modal ────────────────────────────────────────────── */}
      <ScoutingModal
        open={showScoutModal}
        onClose={() => { setShowScoutModal(false); setEditReport(null); }}
        onSaved={() => { setShowScoutModal(false); setEditReport(null); fetchReports(); }}
        editData={editReport}
      />

      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}