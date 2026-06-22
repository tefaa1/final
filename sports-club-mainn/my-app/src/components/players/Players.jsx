"use client";
import React, { useState, useEffect, useCallback } from "react";
import { api } from "@/src/lib/api";
import PlayerCard from "./PlayerCard";
import PlayerDetailModal from "./PlayerDetailModal";
import PlayerFilter from "./PlayerFilter";
import Modal from "./Modal";
import { FiUser, FiSearch } from "react-icons/fi";
import Card from "./Card";
import Header from "../Header";
import { FormModal, Toast, EmptyState } from "@/src/components/shared/SharedComponents";

const SPORT_MAP = {
  football: ["GOALKEEPER","RIGHT_BACK","LEFT_BACK","CENTER_BACK","DEFENSIVE_MID","CENTRAL_MID","ATTACKING_MID","RIGHT_WING","LEFT_WING","STRIKER"],
  basketball: ["POINT_GUARD","SHOOTING_GUARD","SMALL_FORWARD","POWER_FORWARD","CENTER"],
  handball: ["HB_GOALKEEPER","HB_LEFT_WING","HB_RIGHT_WING","HB_LEFT_BACK","HB_RIGHT_BACK","HB_CENTRE_BACK","HB_PIVOT"],
  volleyball: ["SETTER","OUTSIDE_HITTER","OPPOSITE_HITTER","MIDDLE_BLOCKER","LIBERO","DEFENSIVE_SPECIALIST"],
  tennis: ["SINGLES_PLAYER","DOUBLES_PLAYER"],
  swimming: ["FREESTYLE_SWIMMER","BACKSTROKE_SWIMMER","BREASTSTROKE_SWIMMER","BUTTERFLY_SWIMMER","MEDLEY_SWIMMER"],
};

const normaliseSport = (raw) => {
  const s = String(raw || "").toLowerCase().trim();
  if (!s) return "";
  if (s.includes("foot") || s.includes("soccer")) return "football";
  if (s.includes("basket") || s.includes("basquet") || s.includes("bàsquet")) return "basketball";
  if (s.includes("hand")) return "handball";
  if (s.includes("volley") || s.includes("voleibol")) return "volleyball";
  if (s.includes("tennis") || s.includes("tenis")) return "tennis";
  if (s.includes("swim") || s.includes("natac")) return "swimming";
  return "";
};

const getSportFromPlayer = (player) => {
  if (!player) return "";
  const explicit = player.sportName || player.team?.sport?.name || (typeof player.sport === "string" ? player.sport : "");
  const fromExplicit = normaliseSport(explicit);
  if (fromExplicit) return fromExplicit;
  const posRaw = player.preferredPosition || player.position;
  if (!posRaw) return "";
  const p = String(typeof posRaw === "object" ? (posRaw.name || posRaw.value || "") : posRaw).toUpperCase().trim();
  if (p.startsWith("HB_")) return "handball";
  if (p.endsWith("_SWIMMER")) return "swimming";
  if (SPORT_MAP.basketball.includes(p)) return "basketball";
  if (SPORT_MAP.volleyball.includes(p)) return "volleyball";
  if (SPORT_MAP.tennis.includes(p)) return "tennis";
  if (SPORT_MAP.football.includes(p)) return "football";
  return "";
};

const playerFields = [
  { key: "firstName", label: "First Name", required: true },
  { key: "lastName", label: "Last Name", required: true },
  { key: "nationality", label: "Nationality" },
  { key: "dateOfBirth", label: "Date of Birth", type: "date" },
  {
    key: "preferredPosition", label: "Position", type: "select",
    options: [
      "GOALKEEPER","RIGHT_BACK","LEFT_BACK","CENTER_BACK","DEFENSIVE_MID","CENTRAL_MID","ATTACKING_MID","RIGHT_WING","LEFT_WING","STRIKER",
      "POINT_GUARD","SHOOTING_GUARD","SMALL_FORWARD","POWER_FORWARD","CENTER",
      "HB_GOALKEEPER","HB_LEFT_WING","HB_RIGHT_WING","HB_LEFT_BACK","HB_RIGHT_BACK","HB_CENTRE_BACK","HB_PIVOT",
      "SINGLES_PLAYER","DOUBLES_PLAYER",
    ],
  },
  { key: "marketValue", label: "Market Value (€)", type: "number" },
  { key: "kitNumber", label: "Kit Number", type: "number" },
  { key: "photoUrl", label: "Photo URL", full: true },
  { key: "status", label: "Status", type: "select", options: ["AVAILABLE", "INJURED", "ABSENT", "SUSPENDED"] },
];

function Players() {
  const [userRole, setUserRole] = useState("");
  const sports = ["All Sports", "Football", "Basketball", "Handball"];
  const [selectedSport, setSelectedSport] = useState("All Sports");
  const [search, setSearch] = useState("");

  const [players, setPlayers] = useState([]);
  const [stats, setStats] = useState([]);
  const [assessments, setAssessments] = useState([]);
  const [loading, setLoading] = useState(true);

  const [openPlayerModal, setOpenPlayerModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [detailPlayer, setDetailPlayer] = useState(null);
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = "success") => setToast({ msg, type });

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const unwrap = (r) => (Array.isArray(r) ? r : r?.content || r?.data || []);
      // The /players endpoint filters by status, so fetch every status and
      // merge to get the WHOLE squad (available + injured + suspended …).
      const STATUSES = ["AVAILABLE", "INJURED", "ABSENT", "SUSPENDED"];
      const [statusResults, s, a] = await Promise.all([
        Promise.all(STATUSES.map((st) => api.getPlayers(st).catch(() => []))),
        api.getPlayerMatchStatistics().catch(() => []),
        api.getPlayerTrainingAssessments().catch(() => []),
      ]);
      // De-dupe by id in case a player appears under multiple queries.
      const byId = new Map();
      statusResults.flatMap(unwrap).forEach((p) => byId.set(p.id, p));
      setPlayers([...byId.values()]);
      setStats(unwrap(s));
      setAssessments(unwrap(a));
    } catch (err) {
      console.error("Fetch Error:", err);
      showToast("Failed to load squad", "error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const savedRole = localStorage.getItem("user_role");
    setUserRole(savedRole ? savedRole.toLowerCase() : "fan");
    loadData();
  }, [loadData]);

  const isAdmin = userRole === "admin";

  // FIX: search now matches the FULL name (first + last), so typing a surname
  // like "lew" correctly finds "Robert Lewandowski".
  const filteredPlayers = (players || []).filter((p) => {
    const fullName = `${p.firstName || ""} ${p.lastName || ""} ${p.name || ""}`.toLowerCase();
    const sportOk = selectedSport === "All Sports" || getSportFromPlayer(p) === selectedSport.toLowerCase();
    return sportOk && fullName.includes(search.toLowerCase());
  });

  const statsFor = (p) => stats.filter((s) => s.playerId === p.id || s.playerKeycloakId === p.keycloakId);
  const assessmentsFor = (p) => assessments.filter((a) => a.playerId === p.id || a.playerKeycloakId === p.keycloakId);

  const handleSavePlayer = async (form) => {
    try {
      const payload = { ...form };
      ["marketValue", "kitNumber"].forEach((k) => {
        if (payload[k] === "" || payload[k] == null) delete payload[k];
        else payload[k] = Number(payload[k]);
      });
      if (editItem) await api.updatePlayer(editItem.id, payload);
      showToast(editItem ? "Player updated" : "Saved");
      setEditItem(null);
      loadData();
    } catch (err) {
      showToast(err.message || "Failed to save", "error");
    }
  };

  const injuredCount = players.filter((p) => p.status === "INJURED").length;

  return (
    <div className="w-full h-full bg-slate-950 p-6 overflow-y-auto fade-in">
      {/* Squad banner */}
      <div className="relative overflow-hidden rounded-3xl border border-slate-800 bg-gradient-to-br from-[#0a1a3f] via-slate-900 to-[#3b0a2a] p-6 mb-2">
        <div className="absolute -right-8 -top-10 w-56 h-56 rounded-full bg-emerald-500/10 blur-3xl" />
        <div className="relative flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-4">
            <img src="https://crests.football-data.org/81.png" alt="" className="w-14 h-14 object-contain drop-shadow-xl" onError={(e) => { e.currentTarget.style.display = "none"; }} />
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.3em] text-emerald-300/80">FC Barcelona</p>
              <h1 className="text-4xl sm:text-5xl font-black text-white uppercase tracking-tight leading-none">Squad</h1>
              <p className="text-[11px] text-slate-400 mt-1.5">{players.length} players · click anyone for their full profile &amp; stats</p>
            </div>
          </div>
          {isAdmin && (
            <button onClick={() => setOpenPlayerModal(true)}
              className="px-5 py-2.5 bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 rounded-xl text-xs font-black uppercase tracking-wider hover:bg-emerald-500 hover:text-white transition-all flex items-center gap-2">
              <FiUser /> Add Player
            </button>
          )}
        </div>
      </div>

      {isAdmin && (
        <Modal open={openPlayerModal} onClose={() => setOpenPlayerModal(false)} onAddPlayer={loadData} />
      )}

      {loading ? (
        <div className="text-center py-20 text-slate-500 font-black italic mt-8 animate-pulse">LOADING SQUAD...</div>
      ) : (
        <div className="mt-6">
          {/* Search + sport filter */}
          <div className="bg-slate-900/50 backdrop-blur-sm px-6 py-4 rounded-2xl flex flex-col lg:flex-row justify-between items-center gap-6 border border-slate-800">
            <div className="flex items-center rounded-xl px-4 py-3 w-full lg:w-1/3 bg-slate-950 border border-slate-800">
              <FiSearch className="text-slate-500 mr-3" strokeWidth={2.2} />
              <input
                type="search"
                placeholder="Search by name (e.g. Lewandowski)…"
                className="bg-transparent outline-none w-full text-xs text-slate-100"
                onChange={(e) => setSearch(e.target.value)}
                value={search}
              />
            </div>
            <PlayerFilter sports={sports} selectedSport={selectedSport} setSelectedSport={setSelectedSport} />
          </div>

          {/* Squad overview — one consistent tile per sport */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 my-8">
            {[
              { icon: "👥", label: isAdmin ? "Total Squad" : "Club Stars", value: players.length, ring: "ring-emerald-500/30" },
              { icon: "⚽", label: "Football", value: players.filter((p) => getSportFromPlayer(p) === "football").length, ring: "ring-emerald-500/20" },
              { icon: "🏀", label: "Basketball", value: players.filter((p) => getSportFromPlayer(p) === "basketball").length, ring: "ring-blue-500/20" },
              { icon: "🤾", label: "Handball", value: players.filter((p) => getSportFromPlayer(p) === "handball").length, ring: "ring-violet-500/20" },
              { icon: "🎾", label: "Tennis", value: players.filter((p) => getSportFromPlayer(p) === "tennis").length, ring: "ring-rose-500/20" },
              { icon: "🩹", label: "Injured", value: injuredCount, ring: "ring-rose-500/30" },
            ].map((t) => (
              <div key={t.label} className={`rounded-2xl border border-slate-800 bg-slate-900/40 p-4 ring-1 ${t.ring} hover:-translate-y-0.5 transition-transform`}>
                <div className="flex items-center justify-between">
                  <span className="text-2xl">{t.icon}</span>
                  <span className="text-2xl font-black text-slate-100">{t.value}</span>
                </div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mt-2 truncate">{t.label}</p>
              </div>
            ))}
          </div>

          {filteredPlayers.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pb-10">
              {filteredPlayers.map((player) => (
                <PlayerCard
                  key={player.id}
                  player={player}
                  isAdmin={isAdmin}
                  onOpen={() => setDetailPlayer(player)}
                  onEdit={(p) => { if (isAdmin) setEditItem(p); }}
                />
              ))}
            </div>
          ) : (
            <EmptyState icon="👥" title="No players found" />
          )}
        </div>
      )}

      {/* Click-to-expand player profile (folds in match stats + assessments) */}
      {detailPlayer && (
        <PlayerDetailModal
          player={detailPlayer}
          matchStats={statsFor(detailPlayer)}
          assessments={assessmentsFor(detailPlayer)}
          onClose={() => setDetailPlayer(null)}
        />
      )}

      {/* Admin edit form */}
      {editItem && isAdmin && (
        <FormModal
          title={"Update Player"}
          fields={playerFields}
          onSubmit={handleSavePlayer}
          onClose={() => setEditItem(null)}
          initialData={editItem || {}}
        />
      )}

      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}

export default Players;
