"use client";
import { useState, useEffect } from "react";
import { api } from "@/src/lib/api";
import { 
    FormModal, 
    StatusBadge, 
    StatCard, 
    PageHeader, 
    AddButton, 
    FilterTabs, 
    Toast, 
    EmptyState 
} from "@/src/components/shared/SharedComponents";
import { AiFillEdit } from "react-icons/ai";
import { RiDeleteBin6Line } from "react-icons/ri";
import TeamChip from "@/src/components/shared/TeamChip";
import UserChip from "@/src/components/shared/UserChip";

// ─── SCHEMAS MATCHING YOUR JSON ───────────────────────────────────────────────

const contractFields = [
    { key: "playerKeycloakId", label: "Player Keycloak ID", placeholder: "uuid...", required: true },
    { key: "startDate", label: "Start Date", type: "date", required: true },
    { key: "endDate", label: "End Date", type: "date", required: true },
    { key: "salary", label: "Salary", type: "number", required: true },
    { key: "releaseClause", label: "Release Clause", type: "number", required: true },
];

// Schemas match the backend Request DTOs (flat IDs, no status — the
// controller assigns the initial status on its side).
const incomingFields = [
    { key: "outerPlayerId",   label: "Outer Player ID",    type: "number", required: true },
    { key: "fromOuterTeamId", label: "From Outer Team ID", type: "number", required: true },
    { key: "toTeamId",        label: "To Our Team ID",     type: "number", required: true },
    { key: "requestDate",     label: "Request Date",       type: "date",   required: true },
];

const outgoingFields = [
    { key: "playerKeycloakId", label: "Player Keycloak ID", placeholder: "uuid...", required: true },
    { key: "fromTeamId",       label: "From Our Team ID",   type: "number", required: true },
    { key: "toOuterTeamId",    label: "To Outer Team ID",   type: "number", required: true },
    { key: "requestDate",      label: "Request Date",       type: "date",   required: true },
];

// Transfer lifecycle states the back office can move a request through.
const TRANSFER_STATUSES = ["PENDING", "ACCEPTED", "DECLINED"];

// ─── CONTRACT EXPIRY HELPERS ──────────────────────────────────────────────────
// Days from today until `endDate` (negative = already past). Returns null if the
// date is missing or unparseable so callers can skip the badge entirely.
function daysUntil(dateStr) {
    if (!dateStr) return null;
    const end = new Date(dateStr);
    if (isNaN(end.getTime())) return null;
    const today = new Date();
    // Compare at day granularity so "today" never reads as expired.
    end.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);
    return Math.round((end - today) / 86400000);
}

// Small lifecycle pill shown next to a contract's period: EXPIRED once the end
// date is in the past, "EXPIRING" within 60 days, otherwise nothing.
function ContractExpiryBadge({ endDate }) {
    const d = daysUntil(endDate);
    if (d === null) return null;
    if (d < 0) {
        return (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest bg-slate-500/10 text-slate-400 border border-slate-500/30">
                Expired
            </span>
        );
    }
    if (d <= 60) {
        return (
            <span
                title={`Expires in ${d} day${d === 1 ? "" : "s"}`}
                className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest bg-amber-500/10 text-amber-400 border border-amber-500/30"
            >
                Expiring · {d}d
            </span>
        );
    }
    return null;
}

export default function ContractsTransfers() {
    const [tab, setTab] = useState("contracts");
    const [data, setData] = useState({ 
        contracts: [], incoming: [], outgoing: [] 
    });
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editItem, setEditItem] = useState(null);
    const [toast, setToast] = useState(null);
    const [outerPlayers, setOuterPlayers] = useState([]);
    const [players, setPlayers] = useState([]);
    const [teams, setTeams] = useState([]);
    const [outerTeams, setOuterTeams] = useState([]);

    useEffect(() => {
        const unwrap = (r) => Array.isArray(r) ? r : (r?.data || r?.content || []);
        (async () => {
            try { setOuterPlayers(unwrap(await api.getOuterPlayers())); } catch { /* ignore */ }
            try { setOuterTeams(unwrap(await api.getOuterTeams())); } catch { /* ignore */ }
            try { setTeams(unwrap(await api.getTeams())); } catch { /* ignore */ }
            try {
                const lists = await Promise.all(["AVAILABLE", "INJURED", "SUSPENDED", "ABSENT"].map(s => api.getPlayers(s).catch(() => [])));
                const byId = new Map(); lists.flatMap(unwrap).forEach(p => byId.set(p.id, p));
                setPlayers([...byId.values()]);
            } catch { /* ignore */ }
        })();
    }, []);
    const outerPlayerLabel = (id) => {
        const p = outerPlayers.find(x => String(x.id) === String(id));
        // FK can't be resolved (directory not loaded yet, or the tracked player
        // was removed). Show a clean placeholder rather than a raw "Target #123".
        if (!p) return id ? "Unknown player" : "—";
        const pos = String(p.preferredPosition || "").replace(/_/g, " ");
        return `${p.nationality || ""} ${pos}`.trim() || "Tracked player";
    };
    // True when an outer-player FK has no matching row in the directory — used to
    // dim the placeholder so it reads as "unresolved", not a real name.
    const outerPlayerResolved = (id) =>
        outerPlayers.some(x => String(x.id) === String(id));

    const loadData = async () => {
        setLoading(true);
        try {
            let res;
            if (tab === "contracts") res = await api.getPlayerContracts();
            else if (tab === "incoming") res = await api.getIncomingTransfers();
            else if (tab === "outgoing") res = await api.getOutgoingTransfers();

            const finalData = Array.isArray(res) ? res : (res?.content || res?.data || res?.items || []);
            setData(prev => ({ ...prev, [tab]: finalData }));
        } catch (err) {
            console.error("API Error:", err);
            setToast({ msg: "Failed to load data", type: "error" });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, [tab]);

    const handleSave = async (form) => {
        try {
            const payload = { ...form };

            // Cast IDs / money to numbers (Spring rejects "" / strings here).
            ["salary", "releaseClause", "outerPlayerId", "fromOuterTeamId",
             "toTeamId", "fromTeamId", "toOuterTeamId"].forEach((k) => {
                if (payload[k] !== undefined && payload[k] !== "" && payload[k] !== null) {
                    payload[k] = Number(payload[k]);
                }
            });

            // ── Client-side cross-field validation ──────────────────────────
            // A release clause below the salary is nonsensical (you'd let a
            // player leave for less than one season's wage). Block the save and
            // keep the modal open so the user can fix it.
            if (tab === "contracts") {
                const salary = Number(payload.salary);
                const clause = Number(payload.releaseClause);
                if (!Number.isFinite(salary) || salary < 0) {
                    setToast({ msg: "Salary must be a positive number.", type: "error" });
                    return;
                }
                if (!Number.isFinite(clause) || clause < 0) {
                    setToast({ msg: "Release clause must be a positive number.", type: "error" });
                    return;
                }
                if (clause < salary) {
                    setToast({ msg: "Release clause must be greater than or equal to the salary.", type: "error" });
                    return;
                }
            }

            // Build the body matching the backend Request DTOs (flat IDs).
            //   PlayerTransferIncomingRequest: outerPlayerId / fromOuterTeamId / toTeamId / requestDate
            //   PlayerTransferOutgoingRequest: playerKeycloakId / fromTeamId / toOuterTeamId / requestDate
            // An earlier attempt nested these as { outerPlayer: { id } } based on the entity
            // shape — that returned 500 because the controller uses a DTO mapper, not the entity.
            let finalPayload;
            if (tab === "contracts") {
                finalPayload = {
                    playerKeycloakId: payload.playerKeycloakId,
                    startDate:        payload.startDate,
                    endDate:          payload.endDate,
                    salary:           payload.salary,
                    releaseClause:    payload.releaseClause,
                };
            } else if (tab === "incoming") {
                finalPayload = {
                    outerPlayerId:   payload.outerPlayerId,
                    fromOuterTeamId: payload.fromOuterTeamId,
                    toTeamId:        payload.toTeamId,
                    requestDate:     payload.requestDate,
                };
                // Only send a status when editing an existing request — on
                // create the controller assigns the initial PENDING itself.
                if (editItem && payload.status) finalPayload.status = payload.status;
            } else {
                finalPayload = {
                    playerKeycloakId: payload.playerKeycloakId,
                    fromTeamId:       payload.fromTeamId,
                    toOuterTeamId:    payload.toOuterTeamId,
                    requestDate:      payload.requestDate,
                };
                if (editItem && payload.status) finalPayload.status = payload.status;
            }

            let res;
            if (tab === "contracts") {
                res = editItem ? await api.updatePlayerContract(editItem.id, finalPayload) : await api.createPlayerContract(finalPayload);
            } else if (tab === "incoming") {
                res = editItem ? await api.updateIncomingTransfer(editItem.id, finalPayload) : await api.createIncomingTransfer(finalPayload);
            } else if (tab === "outgoing") {
                res = editItem ? await api.updateOutgoingTransfer(editItem.id, finalPayload) : await api.createOutgoingTransfer(finalPayload);
            }

            setToast({ msg: "Record saved successfully!" });
            setShowModal(false);
            setEditItem(null);
            loadData();
        } catch (err) {
            console.error("Save Error Details:", err);
            setToast({ 
                msg: err.message || "Error saving record", 
                type: "error" 
            });
        }
    };

    const handleDelete = async (id) => {
        if (!confirm("Are you sure?")) return;
        try {
            if (tab === "contracts") await api.deletePlayerContract(id);
            else if (tab === "incoming") await api.deleteIncomingTransfer(id);
            else if (tab === "outgoing") await api.deleteOutgoingTransfer(id);
            
            setToast({ msg: "Deleted successfully" });
            loadData();
        } catch (err) {
            setToast({ msg: "Delete failed", type: "error" });
        }
    };

    return (
        <div className="w-full h-full bg-slate-950 p-6 overflow-y-auto fade-in">
            <div className="relative overflow-hidden rounded-3xl border border-slate-800 bg-gradient-to-br from-[#0a1a3f] via-slate-900 to-[#3b0a2a] p-6 mb-6">
                <div className="absolute -right-8 -top-10 w-56 h-56 rounded-full bg-blue-500/10 blur-3xl" />
                <div className="relative flex items-center justify-between gap-4 flex-wrap">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-3xl shadow-xl">📄</div>
                        <div>
                            <p className="text-[11px] font-black uppercase tracking-[0.3em] text-blue-300/80">FC Barcelona</p>
                            <h1 className="text-4xl sm:text-5xl font-black text-white uppercase tracking-tight leading-none">Contracts &amp; Transfers</h1>
                            <p className="text-[11px] text-slate-400 mt-1.5">Market operations &amp; player agreements</p>
                        </div>
                    </div>
                    <AddButton label="+ New Request" onClick={() => { setEditItem(null); setShowModal(true); }} />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <StatCard label="Total Contracts" value={data.contracts.length} color="text-emerald-400" />
                <StatCard label="Incoming Requests" value={data.incoming.length} color="text-blue-400" />
                <StatCard label="Outgoing Requests" value={data.outgoing.length} color="text-rose-400" />
            </div>

            <FilterTabs
                tabs={[
                    ["contracts", "📝 Contracts"], 
                    ["incoming", "📥 Incoming Req"], 
                    ["outgoing", "📤 Outgoing Req"]
                ]}
                active={tab} 
                onSelect={setTab}
            />

            <div className="bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden min-h-[400px]">
                {loading ? (
                    <div className="flex items-center justify-center h-64 text-slate-500 font-bold animate-pulse">Loading Ledger...</div>
                ) : (
                    <div className="overflow-x-auto">
                        {/* Table for Contracts */}
                        {tab === "contracts" && (
                            <table className="w-full text-left">
                                <thead className="bg-slate-900/20">
                                    <tr className="border-b border-slate-800">
                                        {["Player ID", "Salary", "Release Clause", "Period", "Actions"].map(h => (
                                            <th key={h} className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {data.contracts.map(c => (
                                        <tr key={c.id} className="border-b border-slate-900 hover:bg-emerald-500/[0.02] transition-colors">
                                            <td className="px-6 py-4"><UserChip keycloakId={c.playerKeycloakId} fallback="Player" /></td>
                                            <td className="px-6 py-4 font-bold text-emerald-400 text-sm">${c.salary?.toLocaleString()}</td>
                                            <td className="px-6 py-4 text-sm text-slate-300">${c.releaseClause?.toLocaleString()}</td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <span className="text-[10px] font-bold text-slate-500 uppercase">{c.startDate} → {c.endDate}</span>
                                                    <ContractExpiryBadge endDate={c.endDate} />
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 flex gap-2">
                                                <button onClick={() => { setEditItem(c); setShowModal(true); }} className="p-2 text-slate-500 hover:text-emerald-400"><AiFillEdit size={14}/></button>
                                                <button onClick={() => handleDelete(c.id)} className="p-2 text-slate-500 hover:text-rose-400"><RiDeleteBin6Line size={14}/></button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}

                        {/* Table for Incoming — Response DTO is flat IDs */}
                        {tab === "incoming" && (
                            <table className="w-full text-left">
                                <thead className="bg-slate-900/20">
                                    <tr className="border-b border-slate-800">
                                        {["Outer Player", "From (Outer Team)", "To (Our Team)", "Request Date", "Status", "Actions"].map(h => (
                                            <th key={h} className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {data.incoming.map(t => (
                                        <tr key={t.id} className="border-b border-slate-900 hover:bg-blue-500/[0.02] transition-colors">
                                            <td className={`px-6 py-4 text-sm font-bold ${outerPlayerResolved(t.outerPlayerId) ? "text-slate-200" : "text-slate-500 italic"}`}>{outerPlayerLabel(t.outerPlayerId)}</td>
                                            <td className="px-6 py-4"><TeamChip teamId={t.fromOuterTeamId} outer /></td>
                                            <td className="px-6 py-4"><TeamChip teamId={t.toTeamId} /></td>
                                            <td className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase">{t.requestDate || "—"}</td>
                                            <td className="px-6 py-4"><StatusBadge status={t.status} /></td>
                                            <td className="px-6 py-4 flex gap-2">
                                                <button onClick={() => { setEditItem(t); setShowModal(true); }} className="p-2 text-slate-500 hover:text-blue-400"><AiFillEdit size={14}/></button>
                                                <button onClick={() => handleDelete(t.id)} className="p-2 text-slate-500 hover:text-rose-400"><RiDeleteBin6Line size={14}/></button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}

                        {/* Table for Outgoing — Response DTO is flat IDs */}
                        {tab === "outgoing" && (
                            <table className="w-full text-left">
                                <thead className="bg-slate-900/20">
                                    <tr className="border-b border-slate-800">
                                        {["Our Player", "From (Our Team)", "To (Outer Team)", "Request Date", "Status", "Actions"].map(h => (
                                            <th key={h} className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {data.outgoing.map(t => (
                                        <tr key={t.id} className="border-b border-slate-900 hover:bg-rose-500/[0.02] transition-colors">
                                            <td className="px-6 py-4"><UserChip keycloakId={t.playerKeycloakId} fallback="Player" /></td>
                                            <td className="px-6 py-4"><TeamChip teamId={t.fromTeamId} /></td>
                                            <td className="px-6 py-4"><TeamChip teamId={t.toOuterTeamId} outer /></td>
                                            <td className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase">{t.requestDate || "—"}</td>
                                            <td className="px-6 py-4"><StatusBadge status={t.status} /></td>
                                            <td className="px-6 py-4 flex gap-2">
                                                <button onClick={() => { setEditItem(t); setShowModal(true); }} className="p-2 text-slate-500 hover:text-rose-400"><AiFillEdit size={14}/></button>
                                                <button onClick={() => handleDelete(t.id)} className="p-2 text-slate-500 hover:text-rose-400"><RiDeleteBin6Line size={14}/></button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}

                        {data[tab].length === 0 && <EmptyState icon="🤝" title="No market requests found" />}
                    </div>
                )}
            </div>

            {showModal && (
                <FormModal
                    title={`${editItem ? "Edit" : "New"} ${tab === "contracts" ? "Contract" : "Transfer Request"}`}
                    fields={(() => {
                        const playerOpts = players.map(p => ({ value: p.keycloakId, label: `${p.firstName} ${p.lastName}` }));
                        const outerPlayerOpts = outerPlayers.map(p => ({ value: String(p.id), label: outerPlayerLabel(p.id) }));
                        const teamOpts = teams.map(t => ({ value: String(t.id), label: t.name }));
                        const outerTeamOpts = outerTeams.map(t => ({ value: String(t.id), label: t.name }));
                        if (tab === "contracts") return [
                            { key: "playerKeycloakId", label: "Player", type: "select", options: playerOpts, required: true },
                            { key: "startDate", label: "Start Date", type: "date", required: true },
                            { key: "endDate", label: "End Date", type: "date", required: true },
                            { key: "salary", label: "Salary (€)", type: "number", required: true },
                            { key: "releaseClause", label: "Release Clause (€)", type: "number", required: true },
                        ];
                        // The status field only makes sense when editing — the
                        // backend sets the initial status on create.
                        const statusField = { key: "status", label: "Status", type: "select", options: TRANSFER_STATUSES, required: true };
                        if (tab === "incoming") return [
                            { key: "outerPlayerId", label: "Tracked Player", type: "select", options: outerPlayerOpts, required: true },
                            { key: "fromOuterTeamId", label: "From (Outer Team)", type: "select", options: outerTeamOpts, required: true },
                            { key: "toTeamId", label: "To (Our Team)", type: "select", options: teamOpts, required: true },
                            { key: "requestDate", label: "Request Date", type: "date", required: true },
                            ...(editItem ? [statusField] : []),
                        ];
                        return [
                            { key: "playerKeycloakId", label: "Player", type: "select", options: playerOpts, required: true },
                            { key: "fromTeamId", label: "From (Our Team)", type: "select", options: teamOpts, required: true },
                            { key: "toOuterTeamId", label: "To (Outer Team)", type: "select", options: outerTeamOpts, required: true },
                            { key: "requestDate", label: "Request Date", type: "date", required: true },
                            ...(editItem ? [statusField] : []),
                        ];
                    })()}
                    initialData={editItem}
                    onSubmit={handleSave}
                    onClose={() => { setShowModal(false); setEditItem(null); }}
                />
            )}

            {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
        </div>
    );
}