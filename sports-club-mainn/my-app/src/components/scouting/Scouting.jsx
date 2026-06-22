"use client";
import { useState, useEffect, useMemo } from "react";
import { api } from "@/src/lib/api";
import { AddButton, Toast, EmptyState, StatCard } from "@/src/components/shared/SharedComponents";
import ScoutingCard from "@/src/components/scouting/ScoutingCard";
import ScoutingModal from "@/src/components/scouting/ScoutingModal";

const prettyPosition = (pos) =>
  pos ? String(pos).replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase()) : "Unknown";

// Outer players carry NO name — label them by nationality + position.
const outerPlayerLabel = (p) =>
  p ? `${p.nationality || "Unknown"} · ${prettyPosition(p.preferredPosition)}` : null;

export default function Scouting() {
  const [reports, setReports] = useState([]);
  const [outerPlayers, setOuterPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editData, setEditData] = useState(null);
  const [filter, setFilter] = useState("all"); // all | sign | pass
  const [toast, setToast] = useState(null);

  const unwrapList = (res) => (Array.isArray(res) ? res : (res?.content || res?.data || []));

  const fetchData = async () => {
    setLoading(true);
    try {
      const [reportsRes, playersRes] = await Promise.all([
        api.getScoutReports(),
        api.getOuterPlayers().catch(() => []),
      ]);
      setReports(unwrapList(reportsRes));
      setOuterPlayers(unwrapList(playersRes));
    } catch (err) {
      console.error("Scout reports fetch failed:", err);
      setToast({ msg: "Server connection failed", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  // outerPlayerId → resolved player object, for "Nationality · Position" labels.
  const playerById = useMemo(() => {
    const m = new Map();
    outerPlayers.forEach((p) => m.set(Number(p.id), p));
    return m;
  }, [outerPlayers]);

  const visible = useMemo(() => {
    if (filter === "sign") return reports.filter((r) => r.recommendSigning);
    if (filter === "pass") return reports.filter((r) => !r.recommendSigning);
    return reports;
  }, [reports, filter]);

  const stats = useMemo(() => {
    const total = reports.length;
    const recommended = reports.filter((r) => r.recommendSigning).length;
    const avg =
      total === 0
        ? 0
        : reports.reduce((sum, r) => {
            const vals = [r.technicalRating, r.physicalRating, r.tacticalRating, r.mentalityRating]
              .map((n) => Number(n) || 0);
            return sum + vals.reduce((a, b) => a + b, 0) / vals.length;
          }, 0) / total;
    return { total, recommended, avg };
  }, [reports]);

  const openNew = () => { setEditData(null); setModalOpen(true); };
  const openEdit = (report) => { setEditData(report); setModalOpen(true); };

  const onSaved = () => {
    setToast({ msg: editData ? "Report updated" : "Scout report submitted" });
    fetchData();
  };

  const TABS = [
    ["all", "All Reports"],
    ["sign", "✓ Recommended"],
    ["pass", "Not Recommended"],
  ];

  return (
    <div className="w-full h-full bg-slate-950 p-6 overflow-y-auto fade-in">
      {/* Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-slate-800 bg-gradient-to-br from-[#2a0a3f] via-slate-900 to-[#3b0a2a] p-6 mb-6">
        <div className="absolute -right-8 -top-10 w-56 h-56 rounded-full bg-purple-500/10 blur-3xl" />
        <div className="relative flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-3xl shadow-xl">🔍</div>
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.3em] text-purple-300/80">FC Barcelona</p>
              <h1 className="text-4xl sm:text-5xl font-black text-white uppercase tracking-tight leading-none">Scout Reports</h1>
              <p className="text-[11px] text-slate-400 mt-1.5">Player evaluations from the scouting network</p>
            </div>
          </div>
          <AddButton label="+ New Report" onClick={openNew} />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <StatCard label="Total Reports" value={stats.total} color="text-purple-400" />
        <StatCard label="Recommended to Sign" value={stats.recommended} color="text-emerald-400" />
        <StatCard label="Avg Rating" value={stats.avg ? stats.avg.toFixed(1) : "—"} color="text-amber-400" sub="across all four attributes" />
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {TABS.map(([key, label]) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest border transition-all ${
              filter === key
                ? "bg-purple-500/15 text-purple-300 border-purple-500/40"
                : "bg-slate-900/40 text-slate-500 border-slate-800 hover:text-slate-300"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Body */}
      {loading ? (
        <div className="p-20 text-center text-slate-500 font-bold animate-pulse">Loading scout reports…</div>
      ) : visible.length === 0 ? (
        <EmptyState icon="🔍" title="No scout reports yet" />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {visible.map((r) => (
            <ScoutingCard
              key={r.id}
              report={r}
              playerLabel={outerPlayerLabel(playerById.get(Number(r.outerPlayerId)))}
              onEdit={openEdit}
            />
          ))}
        </div>
      )}

      <ScoutingModal
        open={modalOpen}
        editData={editData}
        onClose={() => setModalOpen(false)}
        onSaved={onSaved}
      />

      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
