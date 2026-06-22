"use client";
import { useState, useEffect } from "react";
import { SPORTS, SPORT_ICONS } from "@/src/data/mockData";
import { api } from "@/src/lib/api";
import { FormModal, SportBadge, PageHeader, AddButton, FilterTabs, Toast } from "@/src/components/shared/SharedComponents";
import useRole from "@/src/lib/useRole";
import { AiFillEdit } from "react-icons/ai";
import { RiDeleteBin6Line, RiTeamFill } from "react-icons/ri";
import { MdSportsSoccer } from "react-icons/md";

const BARCA_CREST = "https://crests.football-data.org/81.png";
const FLAGS = { Spain: "🇪🇸", Uruguay: "🇺🇾", France: "🇫🇷", Brazil: "🇧🇷", Argentina: "🇦🇷", Germany: "🇩🇪", England: "🏴", Portugal: "🇵🇹", Italy: "🇮🇹", Netherlands: "🇳🇱", Morocco: "🇲🇦", Egypt: "🇪🇬" };
const flagOf = (c) => FLAGS[c] || "🌍";
// Each Barça team shares the crest, so we differentiate by sport: a coloured
// ring + a sport badge.
const SPORT_RING = {
  FOOTBALL: "ring-emerald-500/50", BASKETBALL: "ring-blue-500/50",
  HANDBALL: "ring-violet-500/50", TENNIS: "ring-rose-500/50",
  VOLLEYBALL: "ring-amber-500/50", SWIMMING: "ring-cyan-500/50",
};
const SPORT_EMOJI2 = { FOOTBALL: "⚽", BASKETBALL: "🏀", HANDBALL: "🤾", TENNIS: "🎾", VOLLEYBALL: "🏐", SWIMMING: "🏊" };

export default function TeamsSports() {
    const [tab, setTab] = useState("teams");
    const [teams, setTeams] = useState([]);
    const [sports, setSports] = useState([]);
    const [nationalTeams, setNational] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editItem, setEditItem] = useState(null);
    const [toast, setToast] = useState(null);
    const { canEdit } = useRole();

 
    const teamFields = [
        { key: "name", label: "Team Name", placeholder: "e.g. Under-21 Stars" },
        { key: "country", label: "Country", placeholder: "Algeria" },
        {
            key: "sportId",
            label: "Sport",
            type: "select",
            options: sports.map(s => ({ value: s.id, label: s.name }))
        }
    ];

    const sportFields = [
        { key: "name", label: "League Name", placeholder: "e.g. First Division" },
        { key: "sportType", label: "Category", type: "select", options: SPORTS }
    ];

    const ntFields = [
        { key: "username", label: "Username", required: true },
        { key: "email", label: "Email", required: true, type: "email" },
        { key: "password", label: "Password", type: "password", required: !editItem },
        { key: "firstName", label: "First Name", required: true },
        { key: "lastName", label: "Last Name", required: true },
        { key: "federationName", label: "Federation Name", required: true },
        { key: "contactPerson", label: "Contact Person" },
        { key: "country", label: "Country", required: true },
        { key: "age", label: "Age", type: "number" },
        { key: "gender", label: "Gender", type: "select", options: ["MALE", "FEMALE"] },
        { key: "phone", label: "Phone" },
        { key: "address", label: "Address", full: true }
    ];
  
    const loadAllData = async () => {
        setLoading(true);
        try {
            const [teamsRes, sportsRes, ntRes] = await Promise.all([
                api.getTeams(),
                api.getSports(),
                api.getNationalTeams()
            ]);
            const unwrap = (r) => (Array.isArray(r) ? r : r?.content || r?.data || []);
            const HIDDEN = ["VOLLEYBALL", "SWIMMING"];
            const allSports = unwrap(sportsRes);
            // ids of the sports we don't expose, so we can hide their teams too
            const hiddenIds = new Set(allSports.filter(s => HIDDEN.includes(String(s.sportType).toUpperCase())).map(s => s.id));
            setSports(allSports.filter(s => !HIDDEN.includes(String(s.sportType).toUpperCase())));
            setTeams(unwrap(teamsRes).filter(t => !hiddenIds.has(t.sportId)));
            setNational(unwrap(ntRes));
        } catch (err) {
            setToast({ msg: "Error loading data", type: "error" });
        } finally {
            setLoading(false);
        }
    };
    const loadSportsByType = async (type) => {
        setLoading(true);
        try {
            const res = await api.getSportsByType(type);
            setSports(Array.isArray(res) ? res : res?.content || []);
        } catch (err) {
            setToast({ msg: "Failed to filter sports", type: "error" });
        } finally {
            setLoading(false);
        }
    };
    useEffect(() => { loadAllData(); }, []);

 
    const handleSave = async (form) => {
        try {
            let payload = { ...form };

            
            if (tab === "teams") {
                const rawSportId = typeof form.sportId === 'object' && form.sportId !== null
                    ? form.sportId.value
                    : form.sportId;
                payload.sportId = Number(rawSportId);

                editItem
                    ? await api.updateTeam(editItem.id, payload)
                    : await api.createTeam(payload);
            }

          
            else if (tab === "sports") {
                editItem
                    ? await api.updateSport(editItem.id, payload)
                    : await api.createSport(payload);
            }

         
            else if (tab === "national") {
                if (payload.age) payload.age = Number(payload.age);
                editItem
                    ? await api.updateNationalTeam(editItem.id, payload)
                    : await api.createNationalTeam(payload);
            }

            
            setToast({ msg: "Successfully Saved!", type: "success" });
            setShowModal(false);
            setEditItem(null);
            loadAllData(); 

        } catch (err) {
            console.error("Save Error:", err);
            setToast({
                msg: err.response?.data?.message || err.message || "Save failed",
                type: "error"
            });
        }
    };

    const handleDelete = async (id) => {
        if (!id) {
            console.error("No ID provided to handleDelete");
            return;
        }

        if (!window.confirm("Are you sure?")) return;

        try {
            console.log("1. Starting Delete Process for ID:", id);

            
            if (!api.deleteTeam) {
                throw new Error("api.deleteTeam is not defined in your api.js file!");
            }

            const response = await api.deleteTeam(id);
            console.log("2. Server Response:", response);

            setToast({ msg: "Deleted successfully", type: "success" });
            loadAllData();
        } catch (err) {
            
            console.error("3. Critical Error:", err);
            setToast({ msg: err.message || "Failed to delete item", type: "error" });
        }
    };

    if (loading) return <div className="p-10 text-emerald-500 font-black text-center animate-pulse tracking-[0.3em]">LOADING SYSTEM...</div>;



    return (
        <div className="w-full h-full bg-slate-950 p-8 overflow-y-auto">
            {/* Banner */}
            <div className="relative overflow-hidden rounded-3xl border border-slate-800 bg-gradient-to-br from-[#0a1a3f] via-slate-900 to-[#3b0a2a] p-6 mb-6">
                <div className="absolute -right-8 -top-10 w-56 h-56 rounded-full bg-emerald-500/10 blur-3xl" />
                <div className="relative flex items-center justify-between gap-4 flex-wrap">
                    <div className="flex items-center gap-4">
                        <img src={BARCA_CREST} alt="" className="w-14 h-14 object-contain drop-shadow-xl" onError={(e) => { e.currentTarget.style.display = "none"; }} />
                        <div>
                            <p className="text-[11px] font-black uppercase tracking-[0.3em] text-emerald-300/80">FC Barcelona</p>
                            <h1 className="text-4xl sm:text-5xl font-black text-white uppercase tracking-tight leading-none">Teams &amp; Sports</h1>
                            <p className="text-[11px] text-slate-400 mt-1.5">{teams.length} teams · {sports.length} sports across the club</p>
                        </div>
                    </div>
                    {canEdit && <AddButton label="Add New Unit" onClick={() => { setEditItem(null); setShowModal(true); }} />}
                </div>
            </div>

            <FilterTabs
                tabs={[
                    ["teams", <span className="inline-flex items-center gap-1.5"><RiTeamFill size={14} /> Club Teams</span>],
                    ["sports", <span className="inline-flex items-center gap-1.5"><MdSportsSoccer size={14} /> Sports</span>],
                ]}
                active={tab} onSelect={setTab}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8 mt-4">

          
                {tab === "teams" && teams.map(t => {
                    const sp = sports.find(s => s.id === Number(t.sportId));
                    return (
                        <div key={t.id} className="group relative bg-slate-900/40 border border-slate-800 p-7 rounded-[2rem] hover:border-emerald-500/50 transition-all duration-500 flex flex-col gap-6 min-h-[260px]">

                            {/* الصف العلوي */}
                            <div className="flex justify-between items-start">
                                <div className={`relative w-16 h-16 bg-slate-950 rounded-2xl border border-white/5 ring-2 ${SPORT_RING[sp?.sportType] || "ring-slate-700/50"} flex items-center justify-center shadow-2xl group-hover:scale-110 transition-all`}>
                                    <img src={BARCA_CREST} alt="" className="w-11 h-11 object-contain" onError={(e) => { e.currentTarget.style.display = "none"; e.currentTarget.nextSibling.style.display = "block"; }} />
                                    <span className="text-3xl hidden">{sp ? SPORT_ICONS[sp.sportType] : "🛡️"}</span>
                                    <span className="absolute -bottom-1.5 -right-1.5 w-6 h-6 rounded-full bg-slate-950 border border-slate-700 flex items-center justify-center text-xs shadow-lg">{SPORT_EMOJI2[sp?.sportType] || "🏟️"}</span>
                                </div>
                                <div className="flex flex-col items-end gap-2">
                                    <SportBadge sport={sp?.sportType || "N/A"} />
                                </div>
                            </div>

                            {/* الاسم والدولة — يأخذ كل المساحة المتاحة */}
                            <div className="flex-1 space-y-1.5">
                                <h3 className="text-xl font-black text-white leading-tight group-hover:text-emerald-400 transition-colors">{t.name}</h3>
                                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-[0.2em] flex items-center gap-1.5">📍 {t.country || "Club Base"}</p>
                            </div>

                            {canEdit && (
                              <div className="flex gap-2 pt-4 border-t border-white/5">
                                <button
                                    onClick={() => { setEditItem(t); setShowModal(true); }}
                                    className="flex-1 py-2.5 bg-slate-950 hover:bg-emerald-600 border border-slate-800 hover:border-emerald-500 rounded-xl text-[11px] font-black uppercase tracking-widest text-slate-400 hover:text-white transition-all flex items-center justify-center gap-2"
                                >
                                    <AiFillEdit size={14} /> Edit
                                </button>
                                <button
                                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleDelete(t.id); }}
                                    className="px-4 py-2.5 bg-slate-950 hover:bg-red-600 border border-slate-800 hover:border-red-500 rounded-xl text-[11px] font-black text-slate-500 hover:text-white transition-all flex items-center justify-center"
                                >
                                    <RiDeleteBin6Line size={14} />
                                </button>
                              </div>
                            )}
                        </div>
                    );
                })}
                {/* 2. تاب الرياضات (Sports) - تظهر مرة واحدة فقط */}
                {tab === "sports" && sports.map(s => (
                    <div key={s.id} className="group relative bg-slate-900/40 border border-slate-800 p-7 rounded-[2rem] hover:border-sky-500/50 transition-all duration-500 flex flex-col justify-between min-h-[280px]">
                        <div className="relative z-10">
                            <div className="flex justify-between items-start mb-8">
                                <div className="w-16 h-16 bg-slate-950 rounded-2xl border border-white/5 flex items-center justify-center text-4xl shadow-2xl group-hover:rotate-12 transition-transform">
                                    {SPORT_ICONS[s.sportType] || <MdSportsSoccer className="text-sky-500" size={32} />}
                                </div>
                                <SportBadge sport={s.sportType} />
                            </div>
                            <div className="space-y-2 mb-5">
                                <h3 className="text-xl font-black text-white group-hover:text-sky-400 transition-colors">{s.name}</h3>
                            </div>
                            {canEdit && (
                              <div className="flex items-center gap-2">
                                <button onClick={() => { setEditItem(s); setShowModal(true); }} className="px-3 py-1.5 bg-sky-500/10 text-sky-400 rounded-xl text-[11px] font-bold inline-flex items-center gap-1.5"><AiFillEdit size={12} /> Edit</button>
                                <button onClick={() => handleDelete(s.id)} className="px-3 py-1.5 bg-red-500/10 text-red-400 rounded-xl text-[11px] font-bold inline-flex items-center gap-1.5"><RiDeleteBin6Line size={12} /> Delete</button>
                              </div>
                            )}
                        </div>
                        <button onClick={() => loadSportsByType(s.sportType)} className="mt-6 text-[10px] font-bold text-sky-500 uppercase tracking-widest hover:text-sky-300 transition-colors text-left">
                            Show similar leagues →
                        </button>
                    </div>
                ))}

                {/* 3. تاب المنتخبات (National) */}
                {tab === "national" && nationalTeams.map(nt => (
                    <div key={nt.id} className="group relative bg-slate-900/40 border border-slate-800 p-0 rounded-[2rem] overflow-hidden hover:border-amber-500/50 transition-all duration-500 flex flex-col min-h-[380px] shadow-2xl shadow-black/50">
                        {/* Header Background Pattern */}
                        <div className="h-24 bg-gradient-to-r from-amber-600/20 to-amber-900/20 relative overflow-hidden border-b border-slate-800">
                            <div className="absolute -right-4 -top-4 text-9xl text-amber-500/5 font-black select-none uppercase tracking-tighter">NATIONAL</div>
                            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-amber-500/5 via-transparent to-transparent"></div>
                            <div className="absolute top-4 left-6 w-16 h-16 bg-slate-950 rounded-2xl border border-amber-500/20 flex items-center justify-center text-4xl shadow-2xl z-10">{flagOf(nt.country)}</div>
                            {nt.sportType && (
                                <div className="absolute top-4 right-6">
                                    <SportBadge sport={nt.sportType} />
                                </div>
                            )}
                        </div>

                        <div className="p-7 pt-5 flex-1 flex flex-col">
                            <div className="mb-6">
                                <h3 className="text-xl font-black text-white group-hover:text-amber-400 transition-colors leading-tight mb-1">{nt.federationName || nt.name}</h3>
                                <p className="text-[10px] font-black text-amber-500/60 uppercase tracking-[0.3em] flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                                    {nt.country || "Global Federation"}
                                </p>
                            </div>

                            <div className="grid grid-cols-1 gap-3 mb-6 bg-slate-950/40 p-4 rounded-2xl border border-white/5">
                                <div className="flex items-center gap-3">
                                    <div className="w-7 h-7 rounded-lg bg-slate-900 border border-white/5 flex items-center justify-center text-xs">👤</div>
                                    <div className="flex flex-col">
                                        <span className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">Contact Person</span>
                                        <span className="text-xs text-slate-300 font-bold">{nt.contactPerson || "Not Assigned"}</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="w-7 h-7 rounded-lg bg-slate-900 border border-white/5 flex items-center justify-center text-xs">📧</div>
                                    <div className="flex flex-col">
                                        <span className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">Official Email</span>
                                        <span className="text-xs text-slate-400 font-mono truncate max-w-[180px]">{nt.email || "—"}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-auto space-y-4">
                                <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest">
                                    <span className="text-slate-600">ID: <span className="text-slate-400 font-mono">#{nt.username || nt.id}</span></span>
                                    <span className="text-slate-600">Gender: <span className="text-amber-500/80">{nt.gender || "MALE"}</span></span>
                                </div>

                                {canEdit && (
                                  <div className="flex gap-2">
                                    <button onClick={() => { setEditItem(nt); setShowModal(true); }} className="flex-1 py-3 bg-amber-600/10 hover:bg-amber-600 border border-amber-500/20 hover:border-amber-500 rounded-xl text-[10px] font-black uppercase tracking-widest text-amber-500 hover:text-white transition-all shadow-lg shadow-amber-950/20 flex items-center justify-center gap-2">
                                        <AiFillEdit size={14} /> Edit Details
                                    </button>
                                    <button onClick={() => handleDelete(nt.id)} className="px-4 py-3 bg-slate-900 hover:bg-rose-600 border border-slate-800 hover:border-rose-500 rounded-xl text-[10px] font-black text-slate-500 hover:text-white transition-all flex items-center justify-center">
                                        <RiDeleteBin6Line size={14} />
                                    </button>
                                  </div>
                                )}
                            </div>
                        </div>
                    </div>
                ))}

                {/* زر الإضافة الثابت */}
                {canEdit && (
                  <button onClick={() => { setEditItem(null); setShowModal(true); }} className="group border-2 border-dashed border-slate-800 rounded-[2.5rem] p-8 flex flex-col items-center justify-center gap-4 text-slate-600 hover:border-emerald-500/50 hover:bg-emerald-500/5 transition-all duration-500 min-h-[300px]">
                    <div className="w-16 h-16 rounded-full bg-slate-900 flex items-center justify-center text-3xl group-hover:bg-emerald-500 group-hover:text-white transition-all">+</div>
                    <span className="text-xs font-black uppercase tracking-[0.3em]">Add New {tab}</span>
                  </button>
                )}
            </div>

            {/* Modal التعديل والإضافة الناقص */}
            {showModal && (
                <FormModal
                    title={editItem ? `Edit ${tab}` : `Add New ${tab}`}
                    fields={tab === "teams" ? teamFields : tab === "sports" ? sportFields : ntFields}
                    initialData={editItem}
                    onSubmit={handleSave}
                    onClose={() => { setShowModal(false); setEditItem(null); }}
                />
            )}

            {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
        </div>
    );
}