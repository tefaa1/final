"use client";
import { useState, useEffect, useMemo } from "react";
import { api } from "@/src/lib/api";
import {
  FormModal,
  StatusBadge,
  AddButton,
  FilterTabs,
  Toast,
  EmptyState,
} from "@/src/components/shared/SharedComponents";
import TeamChip from "@/src/components/shared/TeamChip";
import UserChip from "@/src/components/shared/UserChip";

// Position enum — mirrors player-management-service Position.java EXACTLY
// (football, basketball, tennis, swimming, volleyball, handball). A mismatched
// value (e.g. "FORWARD") makes the POST 400, so this list is load-bearing.
const POSITION_OPTIONS = [
  "GOALKEEPER", "RIGHT_BACK", "LEFT_BACK", "CENTER_BACK",
  "DEFENSIVE_MID", "CENTRAL_MID", "ATTACKING_MID",
  "RIGHT_WING", "LEFT_WING", "STRIKER",
  "POINT_GUARD", "SHOOTING_GUARD", "SMALL_FORWARD", "POWER_FORWARD", "CENTER",
  "SINGLES_PLAYER", "DOUBLES_PLAYER",
  "FREESTYLE_SWIMMER", "BACKSTROKE_SWIMMER", "BREASTSTROKE_SWIMMER",
  "BUTTERFLY_SWIMMER", "MEDLEY_SWIMMER",
  "SETTER", "OUTSIDE_HITTER", "OPPOSITE_HITTER",
  "MIDDLE_BLOCKER", "LIBERO", "DEFENSIVE_SPECIALIST",
  "HB_GOALKEEPER", "HB_LEFT_WING", "HB_RIGHT_WING",
  "HB_LEFT_BACK", "HB_RIGHT_BACK", "HB_CENTRE_BACK", "HB_PIVOT",
];

const prettyEnum = (v) =>
  v ? String(v).replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase()) : "";

const positionSelectOptions = POSITION_OPTIONS.map((p) => ({ value: p, label: prettyEnum(p) }));

const formatDate = (iso) => {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString();
  } catch {
    return String(iso);
  }
};

const unwrapList = (res) => (Array.isArray(res) ? res : (res?.content || res?.data || []));

export default function ScoutingOps() {
  const [tab, setTab] = useState("callups");
  const [data, setData] = useState({ callups: [], players: [], teams: [] });
  // Reference data shared by the "Add" dropdowns.
  const [refData, setRefData] = useState({ outerTeams: [], outerPlayers: [], roster: [], nationalTeams: [] });
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [toast, setToast] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (tab === "callups") {
        const callups = unwrapList(await api.getCallups());
        setData((prev) => ({ ...prev, callups }));
      } else if (tab === "outer-players") {
        const players = unwrapList(await api.getOuterPlayers());
        setData((prev) => ({ ...prev, players }));
      } else {
        // outer-teams: also pull outer-players so we can show "Players Tracked".
        const [teamsRes, playersRes] = await Promise.all([
          api.getOuterTeams(),
          api.getOuterPlayers().catch(() => []),
        ]);
        setData((prev) => ({
          ...prev,
          teams: unwrapList(teamsRes),
          players: unwrapList(playersRes),
        }));
      }
    } catch (err) {
      console.error("Scouting fetch failed:", err);
      setToast({ msg: "Server connection failed", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [tab]);

  // Load the reference lists the Add forms need: outer teams (for player team
  // picker), our roster players + national teams (for call-up pickers).
  const loadRefData = async () => {
    const [outerTeams, outerPlayers, roster, nationalTeams] = await Promise.all([
      api.getOuterTeams().then(unwrapList).catch(() => []),
      api.getOuterPlayers().then(unwrapList).catch(() => []),
      api.getPlayers("AVAILABLE").then(unwrapList).catch(() => []),
      api.getNationalTeams().then(unwrapList).catch(() => []),
    ]);
    setRefData({ outerTeams, outerPlayers, roster, nationalTeams });
  };

  const openModal = async () => {
    await loadRefData();
    setShowModal(true);
  };

  // Build the form field schemas with live dropdown options.
  const callupFields = useMemo(() => [
    {
      key: "playerKeycloakId", label: "Player", type: "select", full: true, required: true,
      options: refData.roster.map((p) => ({
        value: p.keycloakId,
        label: `${p.firstName || ""} ${p.lastName || ""}`.trim() + (p.preferredPosition ? ` — ${prettyEnum(p.preferredPosition)}` : ""),
      })),
    },
    {
      key: "nationalTeamKeycloakId", label: "National Team", type: "select", full: true, required: true,
      options: refData.nationalTeams.map((n) => ({
        value: n.keycloakId,
        label: n.federationName || n.firstName || n.country || "National Team",
      })),
    },
    { key: "requestDate", label: "Request Date", type: "date", required: true },
  ], [refData]);

  const outerPlayerFields = useMemo(() => [
    {
      key: "outerTeamId", label: "Outer Team", type: "select", full: true, required: true,
      options: refData.outerTeams.map((t) => ({ value: t.id, label: `${t.name}${t.country ? ` (${t.country})` : ""}` })),
    },
    { key: "dateOfBirth", label: "Date of Birth", type: "date", required: true },
    { key: "nationality", label: "Nationality", placeholder: "Spanish", required: true },
    { key: "preferredPosition", label: "Position", type: "select", options: positionSelectOptions, required: true },
    { key: "marketValue", label: "Market Value (€)", type: "number", required: true },
    { key: "kitNumber", label: "Kit Number (1-99)", type: "number", required: true },
  ], [refData]);

  const outerTeamFields = [
    { key: "name", label: "Team Name", placeholder: "FC Rival", required: true, full: true },
    { key: "email", label: "Contact Email", placeholder: "info@rival.com" },
    { key: "country", label: "Country", placeholder: "Spain" },
  ];

  const handleSave = async (form) => {
    try {
      const payload = { ...form };

      // Cast numeric fields so Spring doesn't reject strings.
      ["outerTeamId", "marketValue", "kitNumber"].forEach((k) => {
        if (payload[k] !== undefined && payload[k] !== "" && payload[k] !== null) {
          payload[k] = Number(payload[k]);
        } else {
          delete payload[k];
        }
      });

      if (tab === "callups") {
        // PlayerCallUpRequestCreate only accepts player/team/date — status is
        // assigned server-side (defaults PENDING). Never send it.
        delete payload.status;
        await api.createCallup(payload);
      } else if (tab === "outer-players") {
        await api.createOuterPlayer(payload);
      } else {
        await api.createOuterTeam(payload);
      }

      setToast({ msg: "Record added to scouting radar" });
      setShowModal(false);
      fetchData();
    } catch (err) {
      console.error("Scouting save failed:", err);
      setToast({ msg: err.message || "Failed to save record", type: "error" });
    }
  };

  const isEmpty =
    (tab === "callups" && data.callups.length === 0) ||
    (tab === "outer-players" && data.players.length === 0) ||
    (tab === "outer-teams" && data.teams.length === 0);

  const modalFields =
    tab === "callups" ? callupFields : tab === "outer-players" ? outerPlayerFields : outerTeamFields;

  return (
    <div className="w-full h-full bg-slate-950 p-6 overflow-y-auto fade-in">
      <div className="relative overflow-hidden rounded-3xl border border-slate-800 bg-gradient-to-br from-[#0a1a3f] via-slate-900 to-[#3b0a2a] p-6 mb-6">
        <div className="absolute -right-8 -top-10 w-56 h-56 rounded-full bg-purple-500/10 blur-3xl" />
        <div className="relative flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-3xl shadow-xl">🔭</div>
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.3em] text-purple-300/80">FC Barcelona</p>
              <h1 className="text-4xl sm:text-5xl font-black text-white uppercase tracking-tight leading-none">Scouting Ops</h1>
              <p className="text-[11px] text-slate-400 mt-1.5">Call-ups, tracked players &amp; opponent intelligence</p>
            </div>
          </div>
          <AddButton label="+ Add Record" onClick={openModal} />
        </div>
      </div>

      <FilterTabs
        tabs={[
          ["callups", "🌍 Call-Ups"],
          ["outer-players", "🔍 Tracked Players"],
          ["outer-teams", "🏟️ Opponent Teams"],
        ]}
        active={tab}
        onSelect={setTab}
      />

      <div className="bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-20 text-center text-slate-500 font-bold animate-pulse">Scanning Radar...</div>
        ) : isEmpty ? (
          <EmptyState icon="🔭" title="Radar is empty" />
        ) : (
          <div className="overflow-x-auto">
            {/* ── Call-Ups ── */}
            {tab === "callups" && (
              <table className="w-full">
                <thead className="bg-slate-900/20 border-b border-slate-800">
                  <tr>
                    {["Player", "National Team", "Request Date", "Status"].map((h) => (
                      <th key={h} className="px-6 py-4 text-left text-[10px] font-bold text-slate-500 uppercase tracking-widest">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.callups.map((c) => (
                    <tr key={c.id} className="border-b border-slate-900 hover:bg-purple-500/[0.02] transition-colors">
                      <td className="px-6 py-4"><UserChip keycloakId={c.playerKeycloakId} fallback="Player" /></td>
                      <td className="px-6 py-4"><UserChip keycloakId={c.nationalTeamKeycloakId} fallback="National Team" /></td>
                      <td className="px-6 py-4 text-sm text-slate-400 font-medium">{formatDate(c.requestDate)}</td>
                      <td className="px-6 py-4"><StatusBadge status={c.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {/* ── Tracked Players (outer players have no name → nationality + position) ── */}
            {tab === "outer-players" && (
              <table className="w-full">
                <thead className="bg-slate-900/20 border-b border-slate-800">
                  <tr>
                    {["Player", "Outer Team", "Nationality", "DOB", "Market Value", "Kit"].map((h) => (
                      <th key={h} className="px-6 py-4 text-left text-[10px] font-bold text-slate-500 uppercase tracking-widest">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.players.map((p) => (
                    <tr key={p.id} className="border-b border-slate-900 hover:bg-purple-500/[0.02] transition-colors">
                      <td className="px-6 py-4 text-sm font-bold text-slate-200">
                        {p.nationality || "Unknown"} <span className="text-purple-400">·</span> {prettyEnum(p.preferredPosition) || "—"}
                      </td>
                      <td className="px-6 py-4"><TeamChip teamId={p.outerTeamId} outer /></td>
                      <td className="px-6 py-4 text-sm text-slate-400">{p.nationality || "—"}</td>
                      <td className="px-6 py-4 text-sm text-slate-400">{formatDate(p.dateOfBirth)}</td>
                      <td className="px-6 py-4 text-sm text-slate-300 font-mono">
                        {p.marketValue ? `€${Number(p.marketValue).toLocaleString()}` : "—"}
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-[10px] font-mono text-slate-400 bg-slate-900 px-2 py-1 rounded-md border border-slate-800">#{p.kitNumber ?? "—"}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {/* ── Opponent Teams ── */}
            {tab === "outer-teams" && (
              <table className="w-full">
                <thead className="bg-slate-900/20 border-b border-slate-800">
                  <tr>
                    {["Team", "Country", "Contact", "Players Tracked"].map((h) => (
                      <th key={h} className="px-6 py-4 text-left text-[10px] font-bold text-slate-500 uppercase tracking-widest">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.teams.map((t) => (
                    <tr key={t.id} className="border-b border-slate-900 hover:bg-purple-500/[0.02] transition-colors">
                      <td className="px-6 py-4"><TeamChip teamId={t.id} outer /></td>
                      <td className="px-6 py-4 text-sm text-slate-400">{t.country || "—"}</td>
                      <td className="px-6 py-4 text-sm text-slate-400 font-mono text-xs">{t.email || "—"}</td>
                      <td className="px-6 py-4 text-purple-400 font-black">
                        {data.players.filter((p) => Number(p.outerTeamId) === Number(t.id)).length}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>

      {showModal && (
        <FormModal
          title={`Add ${tab === "callups" ? "Call-Up" : tab === "outer-players" ? "Tracked Player" : "Opponent Team"}`}
          fields={modalFields}
          onSubmit={handleSave}
          onClose={() => setShowModal(false)}
        />
      )}

      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
