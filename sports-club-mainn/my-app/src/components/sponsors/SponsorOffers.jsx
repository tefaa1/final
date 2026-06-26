"use client";
import React, { useCallback, useState, useEffect } from "react";
import { Euro, Calendar, CheckCircle2, Handshake, XCircle, Lock, EyeOff } from "lucide-react";
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

// Normalise status defensively — it can be null/lowercase/whitespace.
const statusOf = (o) => String(o?.status || "").trim().toUpperCase();
const turnOf = (o) => String(o?.currentTurn || "").trim().toUpperCase();

// Derive the *display* status. An ACCEPTED offer becomes "ENDED" once its
// endDate has passed — the backend keeps it ACCEPTED, we just label it.
function displayStatus(o) {
    const s = statusOf(o);
    if (s === "ACCEPTED" && o?.endDate) {
        const end = new Date(o.endDate);
        if (!isNaN(end.getTime()) && end.getTime() < Date.now()) return "ENDED";
    }
    return s || "UNKNOWN";
}

// Age pill for a pending offer: "PENDING 7D", turning rose + "STALE" once it
// crosses the staleness threshold. Renders nothing if we can't date the offer.
function PendingAgeBadge({ offer }) {
    if (statusOf(offer) !== "PENDING") return null;
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

    // ── Caller identity (mirrors backend visibility rules) ───────────────────
    const [me, setMe] = useState({ role: "", kid: "" });
    useEffect(() => {
        try {
            const role = (localStorage.getItem("user_role") || "").toUpperCase();
            const kid = localStorage.getItem("keycloakId") || "";
            setMe({ role, kid });
        } catch { /* ignore */ }
    }, []);
    const isAdmin = me.role === "ADMIN";
    const isSponsor = me.role === "SPONSOR";
    const isOwner = (o) => !!me.kid && o?.sponsorKeycloakId === me.kid;
    // Money is visible to admin and the owning sponsor only. We also treat a
    // nulled amount from the backend as "hidden" so the two stay in sync.
    const canSeeMoney = (o) => isAdmin || isOwner(o);

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

    // Create a new offer (sponsor or admin). Owner is stamped server-side from
    // the JWT, so we no longer send a sponsorKeycloakId.
    const handleSave = async (form) => {
        try {
            let payload = { ...form };

            // A sponsorship offer must carry a real, positive figure.
            const amount = Number(payload.offerAmount);
            if (!Number.isFinite(amount) || amount <= 0) {
                showToast("Offer amount must be greater than 0.", "error");
                return;
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

            await api.createSponsorOffer(payload);

            showToast("Offer Created!");
            setShowModal(false);
            setEditItem(null);
            loadOffers();
        } catch (err) {
            showToast(err.message || "Save failed", "error");
        }
    };

    // ── Lifecycle actions (turn-based, enforced by the backend) ──────────────
    const acceptOffer = async (offer) => {
        try {
            await api.acceptSponsorOffer(offer.id);
            showToast("Offer accepted");
            loadOffers();
        } catch (err) {
            showToast(err.message || "Failed to accept offer", "error");
        }
    };

    const rejectOffer = async (offer) => {
        if (!confirm("Reject this offer? This is final.")) return;
        try {
            await api.rejectSponsorOffer(offer.id);
            showToast("Offer rejected");
            loadOffers();
        } catch (err) {
            showToast(err.message || "Failed to reject offer", "error");
        }
    };

    // ── Negotiation modal ────────────────────────────────────────────────────
    const [negotiate, setNegotiate] = useState(null); // offer under negotiation
    const [negAmount, setNegAmount] = useState("");
    const [negMsg, setNegMsg] = useState("");
    const openNegotiate = (offer) => { setNegotiate(offer); setNegAmount(offer.negotiatedAmount || offer.offerAmount || ""); setNegMsg(""); };

    // Notify the *other* party that a counter/offer is waiting (best-effort).
    const notifyCounterpart = async (offer, kid, title, msg) => {
        if (!kid) return;
        try { await api.createNotification({ recipientUserKeycloakId: kid, notificationType: "BOTH", category: "OTHER", status: "PENDING", title, message: msg, relatedEntityType: "SPONSOR_OFFER", relatedEntityId: offer.id, emailSubject: title, emailBody: msg, actionUrl: "/dashboard/sponsors" }); } catch (e) { console.error(e); }
        try { await api.createAlert({ targetUserKeycloakId: kid, title, message: msg, description: msg, alertType: "SPONSOR_OFFER_RECEIVED", priority: "MEDIUM", relatedEntityType: "SPONSOR_OFFER", relatedEntityId: offer.id }); } catch (e) { console.error(e); }
    };

    // Counter with a new amount → backend flips status to NEGOTIATING and hands
    // the turn to the other party.
    const submitNegotiation = async () => {
        const amt = Number(negAmount);
        if (!Number.isFinite(amt) || amt <= 0) { showToast("Enter a valid counter amount.", "error"); return; }
        const offer = negotiate;
        try {
            await api.negotiateSponsorOffer(offer.id, { amount: amt, message: negMsg || undefined });
            // Admin counters the sponsor; sponsor counters the admin (notify admins
            // is best-effort — we at least always notify the owning sponsor side).
            if (isAdmin) {
                await notifyCounterpart(offer, offer.sponsorKeycloakId, "Counter-offer on your sponsorship", `The club proposes €${amt.toLocaleString()}.${negMsg ? " " + negMsg : ""} It is now your turn — review & respond on the platform.`);
            }
            showToast("Counter-offer sent");
            setNegotiate(null); loadOffers();
        } catch (err) { showToast(err.message || "Failed to send counter-offer", "error"); }
    };

    const handleDelete = async (id) => {
        if (!confirm("Delete this offer?")) return;
        try {
            await api.deleteSponsorOffer(id);
            showToast("Offer Deleted!");
            setOffers(prev => prev.filter(o => o.id !== id));
        } catch (err) {
            showToast(err.message || "Delete failed", "error");
        }
    };

    const filteredOffers = offers.filter((offer) => {
        const matchSearch = (offer.sponsorKeycloakId || "").toLowerCase().includes(search.toLowerCase()) ||
            (offer.terms || "").toLowerCase().includes(search.toLowerCase());
        const ds = displayStatus(offer).toLowerCase();
        const matchTab = activeTab === "all" || ds === activeTab.toLowerCase();
        return matchSearch && matchTab;
    });

    const pendingCount = offers.filter((o) => statusOf(o) === "PENDING").length;
    // Sum only accepted-and-still-active offers; coerce each amount through Number
    // so a stray string/null can never break the reduce, and skip offers whose
    // amount the backend hid from us.
    const totalValue = offers
        .filter((o) => displayStatus(o) === "ACCEPTED" && canSeeMoney(o))
        .reduce((s, o) => {
            const amt = Number(o.offerAmount);
            return s + (Number.isFinite(amt) ? amt : 0);
        }, 0);

    const tabsConfig = [
        ["all", "All Offers"],
        ["pending", "Pending"],
        ["negotiating", "Negotiating"],
        ["accepted", "Accepted"],
        ["ended", "Ended"],
        ["rejected", "Rejected"]
    ];

    // Whose turn is it, and can the current caller act right now?
    const canAct = (o) => {
        const st = statusOf(o);
        if (st === "ACCEPTED" || st === "REJECTED") return false;
        const turn = turnOf(o);
        if (isAdmin) return turn === "ADMIN";
        if (isSponsor && isOwner(o)) return turn === "SPONSOR";
        return false;
    };

    // Only admin and the owning sponsor can ever create/act. Everyone else is
    // strictly read-only.
    const canCreate = isAdmin || isSponsor;

    return (
        <div className="w-full h-full bg-slate-950 p-6 overflow-y-auto fade-in">
            <PageHeader
                icon={Handshake}
                title="Sponsor Offers"
                subtitle="Manage sponsorship contracts and commercial partnerships"
                action={canCreate ? <AddButton label="+ New Offer" onClick={() => { setEditItem(null); setShowModal(true); }} /> : null}
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
                    <p className="text-xl font-black text-emerald-500 tracking-tight">{(isAdmin || isSponsor) ? `€${totalValue.toLocaleString()}` : "—"}</p>
                </div>
            </div>

            <FilterTabs tabs={tabsConfig} active={activeTab} onSelect={setActiveTab} />

            {loading ? (
                <div className="text-center py-20 text-slate-500 font-black uppercase text-[10px] tracking-widest italic animate-pulse mt-8">LOADING OFFERS...</div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
                    {filteredOffers.map((offer) => {
                        const ds = displayStatus(offer);
                        const money = canSeeMoney(offer);
                        const acting = canAct(offer);
                        const myTurnLabel = turnOf(offer) === "ADMIN" ? "Admin's turn" : turnOf(offer) === "SPONSOR" ? "Sponsor's turn" : null;
                        return (
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
                                {money ? (
                                    <div className="flex items-center gap-2 text-[10px] font-black tracking-widest">
                                        <Euro size={16} className="text-emerald-500" />
                                        {offer.negotiatedAmount ? (
                                            <span className="flex items-center gap-1.5">
                                                <span className="text-slate-500 line-through">€{(offer.offerAmount || 0).toLocaleString()}</span>
                                                <span className="text-amber-400">€{Number(offer.negotiatedAmount).toLocaleString()}</span>
                                                <span className="text-[8px] text-amber-500/70 uppercase">counter</span>
                                            </span>
                                        ) : (
                                            <span className="text-emerald-400">€{(offer.offerAmount || 0).toLocaleString()}</span>
                                        )}
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-1.5 text-[10px] font-black tracking-widest text-slate-600" title="Amount visible only to the admin and the owning sponsor">
                                        <EyeOff size={14} /> <span className="uppercase">Amount hidden</span>
                                    </div>
                                )}
                            </div>

                            <div className="flex justify-between items-center mt-auto relative z-10 gap-3 flex-wrap">
                                <div className="flex items-center gap-2 flex-wrap">
                                    <span className={`text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full border shadow-inner ${
                                            ds === "ACCEPTED" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" :
                                            ds === "PENDING" ? "bg-amber-500/10 text-amber-400 border-amber-500/20" :
                                            ds === "NEGOTIATING" ? "bg-sky-500/10 text-sky-400 border-sky-500/20" :
                                            ds === "ENDED" ? "bg-slate-600/10 text-slate-300 border-slate-500/30" :
                                            ds === "REJECTED" || ds === "DECLINED" ? "bg-rose-500/10 text-rose-400 border-rose-500/20" :
                                            "bg-slate-500/10 text-slate-400 border-slate-500/20"
                                        }`}>
                                        {ds}
                                    </span>
                                    <PendingAgeBadge offer={offer} />
                                    {/* Turn indicator while live */}
                                    {(ds === "PENDING" || ds === "NEGOTIATING") && myTurnLabel && (
                                        <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full border bg-indigo-500/10 text-indigo-300 border-indigo-500/30">
                                            {myTurnLabel}
                                        </span>
                                    )}
                                </div>

                                <div className="flex gap-2 flex-wrap">
                                    {acting && (
                                        <>
                                            <button onClick={() => acceptOffer(offer)} className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-xl bg-emerald-600/10 border border-emerald-500/20 text-emerald-500 hover:bg-emerald-600 hover:text-white transition-all">
                                                <CheckCircle2 size={14} /> Accept
                                            </button>
                                            <button onClick={() => openNegotiate(offer)} className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-xl bg-sky-600/10 border border-sky-500/20 text-sky-400 hover:bg-sky-600 hover:text-white transition-all">
                                                <Handshake size={14} /> Negotiate
                                            </button>
                                            <button onClick={() => rejectOffer(offer)} className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 hover:bg-rose-500 hover:text-white transition-all">
                                                <XCircle size={14} /> Reject
                                            </button>
                                        </>
                                    )}
                                    {/* Sponsor waiting on the admin: explicit "waiting" hint, no actions. */}
                                    {!acting && isSponsor && isOwner(offer) && (ds === "PENDING" || ds === "NEGOTIATING") && (
                                        <span className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-xl bg-slate-800/60 text-slate-500">
                                            <Lock size={14} /> Awaiting club
                                        </span>
                                    )}
                                    {/* Admin can always delete; sponsors/others cannot. */}
                                    {isAdmin && (
                                        <button onClick={() => handleDelete(offer.id)} className="text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500 hover:text-white transition-all">
                                            Delete
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                        );
                    })}
                </div>
            )}

            {!loading && filteredOffers.length === 0 && <EmptyState icon="🤝" title="No sponsor offers found" />}

            {showModal && (
                <FormModal
                    title="New Sponsor Offer"
                    fields={[
                        { key: "teamId", label: "Team", type: "select", options: teams.map(t => ({ value: String(t.id), label: t.name })), required: true },
                        { key: "offerAmount", label: "Offer Amount (€)", type: "number", required: true },
                        { key: "contractDurationMonths", label: "Duration (Months)", type: "number", required: true },
                        { key: "terms", label: "Terms", full: true },
                        { key: "notes", label: "Notes", full: true },
                    ]}
                    onSubmit={handleSave}
                    onClose={() => { setShowModal(false); setEditItem(null); }}
                    initialData={{}}
                />
            )}

            {negotiate && (
                <div className="fixed inset-0 z-[120] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4" onClick={(e) => e.target === e.currentTarget && setNegotiate(null)}>
                    <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-950 shadow-2xl">
                        <div className="px-6 py-4 border-b border-slate-800 flex items-center gap-3">
                            <Handshake size={18} className="text-sky-400" />
                            <h3 className="font-black text-white text-lg">Counter Offer</h3>
                        </div>
                        <div className="p-6 space-y-4">
                            <p className="text-[12px] text-slate-400">Current amount: <b className="text-slate-200">€{(negotiate.negotiatedAmount || negotiate.offerAmount || 0).toLocaleString()}</b> · {negotiate.contractDurationMonths} months. Propose a counter and pass the turn back.</p>
                            <div className="flex flex-col gap-1.5">
                                <label className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">Counter Amount (€)</label>
                                <input type="number" min={1} value={negAmount} onChange={(e) => setNegAmount(e.target.value)} className="bg-slate-900/60 border border-slate-800 focus:border-sky-500 rounded-xl px-3 py-2.5 text-sm text-slate-200 outline-none w-full" />
                            </div>
                            <div className="flex flex-col gap-1.5">
                                <label className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">Message (optional)</label>
                                <textarea rows={3} value={negMsg} onChange={(e) => setNegMsg(e.target.value)} placeholder="e.g. We can meet you at this figure with a 3-year term." className="bg-slate-900/60 border border-slate-800 focus:border-sky-500 rounded-xl px-3 py-2.5 text-sm text-slate-200 outline-none w-full resize-none" />
                            </div>
                        </div>
                        <div className="px-6 py-4 border-t border-slate-800 flex gap-3 justify-end">
                            <button onClick={() => setNegotiate(null)} className="px-5 py-2.5 rounded-xl border border-slate-800 text-slate-400 text-xs font-black uppercase tracking-widest hover:bg-slate-900">Cancel</button>
                            <button onClick={submitNegotiation} className="px-6 py-2.5 rounded-xl bg-sky-600 text-white text-xs font-black uppercase tracking-widest hover:bg-sky-500">Send Counter</button>
                        </div>
                    </div>
                </div>
            )}

            {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
        </div>
    );
}
