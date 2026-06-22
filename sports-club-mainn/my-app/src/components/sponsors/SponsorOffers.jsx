"use client";
import React, { useCallback, useState, useEffect } from "react";
import { Euro, Calendar, CheckCircle2, Handshake } from "lucide-react";
import { api } from "../../lib/api";
import { FormModal, PageHeader, AddButton, FilterTabs, Toast, EmptyState } from "@/src/components/shared/SharedComponents";
import UserChip from "@/src/components/shared/UserChip";
import TeamChip from "@/src/components/shared/TeamChip";

// Whole days elapsed since `dateStr` (an ISO timestamp like offeredAt).
// Returns null when the date is missing or unparseable.
function daysSince(dateStr) {
    if (!dateStr) return null;
    const then = new Date(dateStr);
    if (isNaN(then.getTime())) return null;
    const diff = Math.floor((Date.now() - then.getTime()) / 86400000);
    return diff < 0 ? 0 : diff;
}

// A pending offer is "stale" once it has sat unanswered past this many days.
const STALE_AFTER_DAYS = 14;

// Age pill for a pending offer: "PENDING 7D", turning rose + "STALE" once it
// crosses the staleness threshold. Renders nothing if we can't date the offer.
function PendingAgeBadge({ offer }) {
    if ((offer.status || "").toUpperCase() !== "PENDING") return null;
    const age = daysSince(offer.offeredAt);
    if (age === null) return null;
    const stale = age >= STALE_AFTER_DAYS;
    return (
        <span
            title={stale ? `Awaiting response for ${age} days — follow up` : `Pending for ${age} day${age === 1 ? "" : "s"}`}
            className={`inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full border ${
                stale
                    ? "bg-rose-500/10 text-rose-400 border-rose-500/30"
                    : "bg-slate-500/10 text-slate-400 border-slate-500/30"
            }`}
        >
            {stale ? "⚠ Stale" : "Pending"} · {age}d
        </span>
    );
}

export default function SponsorOffers() {
    const [search, setSearch] = useState("");
    const [activeTab, setActiveTab] = useState("all");
    const [offers, setOffers] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [editItem, setEditItem] = useState(null);
    const [toast, setToast] = useState(null);
    const [loading, setLoading] = useState(true);
    const [teams, setTeams] = useState([]);

    useEffect(() => {
        (async () => {
            try { const r = await api.getTeams(); setTeams(Array.isArray(r) ? r : (r?.data || r?.content || [])); } catch { /* ignore */ }
        })();
    }, []);

    const showToast = (msg, type = "success") => setToast({ msg, type });

    const loadOffers = useCallback(async () => {
        setLoading(true);
        try {
            const res = await api.getSponsorOffers();
            const actualData = Array.isArray(res) ? res : (res?.content || res?.data || []);
            setOffers(actualData);
        } catch (err) {
            console.error("Fetch Error:", err);
            showToast("Failed to load offers", "error");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { loadOffers(); }, [loadOffers]);

    const handleSave = async (form) => {
        try {
            let payload = { ...form };

            // ── Client-side validation ──────────────────────────────────────
            // A sponsorship offer must carry a real, positive figure. Block the
            // save and keep the modal open so the user can correct it.
            const amount = Number(payload.offerAmount);
            if (!Number.isFinite(amount) || amount <= 0) {
                showToast("Offer amount must be greater than 0.", "error");
                return;
            }

            if (!payload.sponsorKeycloakId) {
                payload.sponsorKeycloakId = "00000000-0000-0000-0000-000000000000";
            }

            // Explicit casting
            const numKeys = ["teamId", "offerAmount", "contractDurationMonths"];
            numKeys.forEach(k => {
                if (payload[k] !== undefined && payload[k] !== "" && payload[k] !== null) {
                    payload[k] = Number(payload[k]);
                } else {
                    delete payload[k];
                }
            });

            // Trim empty
            Object.keys(payload).forEach(k => {
                if (payload[k] === "") delete payload[k];
            });

            let response = editItem
                ? await api.updateSponsorOffer(editItem.id, payload)
                : await api.createSponsorOffer(payload);

            if (response && response.success === false) throw new Error(response.message);

            showToast(editItem ? "Offer Updated!" : "Offer Created!");
            setShowModal(false);
            setEditItem(null);
            loadOffers();
        } catch (err) {
            showToast(err.message || "Save failed", "error");
        }
    };

    const acceptOffer = async (offer) => {
        try {
            await api.updateSponsorOffer(offer.id, { ...offer, status: "ACCEPTED" });
            showToast("Offer Accepted!");
            loadOffers();
        } catch (err) {
            showToast("Failed to accept offer", "error");
        }
    };

    const handleDelete = async (id) => {
        if (!confirm("Delete this offer?")) return;
        try {
            await api.deleteSponsorOffer(id);
            showToast("Offer Deleted!");
            setOffers(prev => prev.filter(o => o.id !== id));
        } catch (err) {
            showToast("Delete failed", "error");
        }
    };

    const filteredOffers = offers.filter((offer) => {
        const matchSearch = (offer.sponsorKeycloakId || "").toLowerCase().includes(search.toLowerCase()) ||
            (offer.terms || "").toLowerCase().includes(search.toLowerCase());
        const matchTab = activeTab === "all" || (offer.status || "").toLowerCase() === activeTab.toLowerCase();
        return matchSearch && matchTab;
    });

    // Normalise status defensively — it can be null/lowercase/whitespace.
    const statusOf = (o) => String(o?.status || "").trim().toUpperCase();

    const pendingCount = offers.filter((o) => statusOf(o) === "PENDING").length;
    // Sum only accepted offers; coerce each amount through Number so a stray
    // string or null can never break the reduce (NaN is dropped to 0).
    const totalValue = offers
        .filter((o) => statusOf(o) === "ACCEPTED")
        .reduce((s, o) => {
            const amt = Number(o.offerAmount);
            return s + (Number.isFinite(amt) ? amt : 0);
        }, 0);

    const tabsConfig = [
        ["all", "All Offers"],
        ["pending", "Pending"],
        ["accepted", "Accepted"],
        ["rejected", "Rejected"]
    ];

    return (
        <div className="w-full h-full bg-slate-950 p-6 overflow-y-auto fade-in">
            <PageHeader
                icon={Handshake}
                title="Sponsor Offers"
                subtitle="Manage sponsorship contracts and commercial partnerships"
                action={<AddButton label="+ New Offer" onClick={() => { setEditItem(null); setShowModal(true); }} />}
            />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                <div className="bg-slate-900/50 rounded-2xl px-5 py-4 border border-slate-800 shadow-xl">
                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Total Offers</p>
                    <p className="text-xl font-black text-slate-100 tracking-tight">{offers.length}</p>
                </div>
                <div className="bg-slate-900/50 rounded-2xl px-5 py-4 border border-slate-800 shadow-xl">
                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Pending</p>
                    <p className="text-xl font-black text-amber-500 tracking-tight">{pendingCount}</p>
                </div>
                <div className="bg-slate-900/50 rounded-2xl px-5 py-4 border border-slate-800 shadow-xl">
                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Active Value</p>
                    <p className="text-xl font-black text-emerald-500 tracking-tight">€{totalValue.toLocaleString()}</p>
                </div>
            </div>

            <FilterTabs tabs={tabsConfig} active={activeTab} onSelect={setActiveTab} />

            {loading ? (
                <div className="text-center py-20 text-slate-500 font-black uppercase text-[10px] tracking-widest italic animate-pulse mt-8">LOADING OFFERS...</div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
                    {filteredOffers.map((offer) => (
                        <div key={offer.id} className="bg-slate-900/50 backdrop-blur-sm rounded-2xl border border-slate-800 p-6 flex flex-col justify-between group hover:border-emerald-500/30 transition-all relative overflow-hidden">
                            <div className="absolute -right-4 -top-4 w-24 h-24 bg-emerald-500/5 rounded-full blur-3xl group-hover:bg-emerald-500/10 transition-all duration-700" />

                            <div className="flex justify-between items-start mb-6 relative z-10 gap-3">
                                <div className="min-w-0 flex-1">
                                    <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-600 mb-2">Sponsor</p>
                                    <UserChip keycloakId={offer.sponsorKeycloakId} fallback="Sponsor" showRole />
                                </div>
                                <div className="shrink-0">
                                    <TeamChip teamId={offer.teamId} showSport />
                                </div>
                            </div>

                            <div className="flex items-center justify-between mb-6 relative z-10 bg-slate-950/50 p-4 rounded-xl border border-slate-800/50">
                                <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-widest text-slate-500">
                                    <Calendar size={14} className="text-emerald-500" />
                                    <span>{offer.contractDurationMonths} MONTHS</span>
                                </div>
                                <div className="flex items-center gap-2 text-[10px] font-black tracking-widest">
                                    <Euro size={16} className="text-emerald-500" />
                                    <span className="text-emerald-400">€{(offer.offerAmount || 0).toLocaleString()}</span>
                                </div>
                            </div>

                            <div className="flex justify-between items-center mt-auto relative z-10">
                                <div className="flex items-center gap-2 flex-wrap">
                                    <span className={`text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full border shadow-inner ${statusOf(offer) === "ACCEPTED" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" :
                                            statusOf(offer) === "PENDING" ? "bg-amber-500/10 text-amber-400 border-amber-500/20" :
                                                statusOf(offer) === "REJECTED" || statusOf(offer) === "DECLINED" ? "bg-rose-500/10 text-rose-400 border-rose-500/20" :
                                                    "bg-slate-500/10 text-slate-400 border-slate-500/20"
                                        }`}>
                                        {offer.status || "UNKNOWN"}
                                    </span>
                                    <PendingAgeBadge offer={offer} />
                                </div>

                                <div className="flex gap-2">
                                    {statusOf(offer) === "PENDING" && (
                                        <button onClick={() => acceptOffer(offer)} className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-xl bg-emerald-600/10 border border-emerald-500/20 text-emerald-500 hover:bg-emerald-600 hover:text-white transition-all">
                                            <CheckCircle2 size={14} /> Accept
                                        </button>
                                    )}
                                    <button onClick={() => { setEditItem(offer); setShowModal(true); }} className="text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-xl bg-slate-800 text-slate-400 hover:bg-emerald-500 hover:text-white transition-all">
                                        Edit
                                    </button>
                                    <button onClick={() => handleDelete(offer.id)} className="text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500 hover:text-white transition-all">
                                        Delete
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {!loading && filteredOffers.length === 0 && <EmptyState icon="🤝" title="No sponsor offers found" />}

            {showModal && (
                <FormModal
                    title={editItem ? "Edit Offer" : "New Sponsor Offer"}
                    fields={[
                        { key: "teamId", label: "Team", type: "select", options: teams.map(t => ({ value: String(t.id), label: t.name })), required: true },
                        { key: "offerAmount", label: "Offer Amount (€)", type: "number", required: true },
                        { key: "contractDurationMonths", label: "Duration (Months)", type: "number", required: true },
                        { key: "status", label: "Status", type: "select", options: ["PENDING", "ACCEPTED", "REJECTED"] },
                        { key: "terms", label: "Terms", full: true },
                        { key: "notes", label: "Notes", full: true },
                    ]}
                    onSubmit={handleSave}
                    onClose={() => { setShowModal(false); setEditItem(null); }}
                    initialData={editItem || { status: "PENDING" }}
                />
            )}

            {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
        </div>
    );
}
