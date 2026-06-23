"use client";
import { useState, useEffect } from "react";
import { STAFF_ROLES } from "@/src/data/mockData";
import { api } from "@/src/lib/api";
import { FormModal, PageHeader, AddButton, FilterTabs, Toast, EmptyState, Avatar, StatCard } from "@/src/components/shared/SharedComponents";
import PlayerAvatar, { roleTone } from "@/src/components/shared/PlayerAvatar";
import { lookupTeam } from "@/src/lib/teamDirectory";
import { buildTeamIndex, SPORT_META } from "@/src/lib/clubTeams";
const SPORT_NAME = { 1: "Football", 2: "Basketball", 3: "Tennis", 6: "Handball" };
import { AiFillEdit } from "react-icons/ai";
import { RiDeleteBin6Line } from "react-icons/ri";
import { FiMail, FiPhone, FiUsers, FiSearch } from "react-icons/fi";
import { GiWhistle } from "react-icons/gi";

const ROLE_COLORS = {
  HEAD_COACH: "text-blue-400 bg-blue-500/10 border-blue-500/30",
  ASSISTANT_COACH: "text-sky-400 bg-sky-500/10 border-sky-500/30",
  SPECIFIC_COACH: "text-cyan-400 bg-cyan-500/10 border-cyan-500/30",
  FITNESS_COACH: "text-lime-400 bg-lime-500/10 border-lime-500/30",
  PERFORMANCE_ANALYST: "text-indigo-400 bg-indigo-500/10 border-indigo-500/30",
  TEAM_DOCTOR: "text-teal-400 bg-teal-500/10 border-teal-500/30",
  DOCTOR: "text-teal-400 bg-teal-500/10 border-teal-500/30",
  PHYSIOTHERAPIST: "text-emerald-300 bg-emerald-400/10 border-emerald-400/30",
};
const prettyRole = (r) => (!r ? "Staff" : String(r).replace(/_/g, " "));
const COACH_ROLES = ["HEAD_COACH", "ASSISTANT_COACH", "SPECIFIC_COACH", "FITNESS_COACH"];
const MEDICAL_ROLES = ["TEAM_DOCTOR", "DOCTOR", "PHYSIOTHERAPIST"];

const staffFields = [
  { key: "username", label: "Username", placeholder: "johndoe", required: true },
  { key: "email", label: "Email", type: "email", placeholder: "staff@club.com" },
  { key: "password", label: "Password", type: "password" },
  { key: "firstName", label: "First Name", placeholder: "John" },
  { key: "lastName", label: "Last Name", placeholder: "Doe" },
  { key: "age", label: "Age", type: "number" },
  { key: "gender", label: "Gender", type: "select", options: ["MALE", "FEMALE"] },
  { key: "phone", label: "Phone", placeholder: "01xxxxxxxxx" },
  { key: "address", label: "Address", placeholder: "City, Country", full: true },
  { key: "staffRole", label: "Staff Role", type: "select", options: STAFF_ROLES },
  { key: "sportId", label: "Sport ID", type: "number" },
  { key: "teamId", label: "Team ID", type: "number" },
  { key: "teamManagerId", label: "Team Manager ID", type: "number" },
  { key: "specialization", label: "Specialization", placeholder: "e.g. Tactical" },
  { key: "yearsExperience", label: "Years of Experience", type: "number" },
  { key: "coachingLicenseLevel", label: "License Level", placeholder: "UEFA Pro" },
];
const scoutFields = [
  { key: "region", label: "Region", placeholder: "North Africa" },
  { key: "organizationName", label: "Organization", placeholder: "Agency name" },
];
const managerFields = [
  { key: "username", label: "Username", placeholder: "manager_01", required: true },
  { key: "email", label: "Email", type: "email", placeholder: "manager@club.com" },
  { key: "password", label: "Password", type: "password" },
  { key: "firstName", label: "First Name", placeholder: "John" },
  { key: "lastName", label: "Last Name", placeholder: "Doe" },
  { key: "age", label: "Age", type: "number" },
  { key: "phone", label: "Phone", placeholder: "+34xxxxxxxxx" },
  { key: "address", label: "Address", placeholder: "City, Country", full: true },
  { key: "gender", label: "Gender", type: "select", options: ["MALE", "FEMALE"] },
  { key: "sportId", label: "Sport ID", type: "number" },
  { key: "canManageAllTeams", label: "Can Manage All Teams", type: "select", options: [{ value: "true", label: "Yes" }, { value: "false", label: "No" }] },
];

export default function StaffManagement() {
  const [tab, setTab] = useState("staff");
  const [staff, setStaff] = useState([]);
  const [scouts, setScouts] = useState([]);
  const [managers, setManagers] = useState([]);
  const [teamsRaw, setTeamsRaw] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [toast, setToast] = useState(null);
  const [search, setSearch] = useState("");

  const showToast = (msg, type = "success") => setToast({ msg, type });
  const unwrap = (r) => (Array.isArray(r) ? r : r?.data || r?.content || []);

  const teamIndex = buildTeamIndex(teamsRaw);
  // Resolve a staff member's team into { name, tier, sport } — works for the
  // reserve ("B") teams too, not just the hard-coded first teams.
  const staffTeam = (s) => {
    const t = teamIndex.byId[Number(s?.teamId)];
    if (t) return { name: t.name, tier: t.isFirstTeam ? "First Team" : "Reserve Team", sport: SPORT_META[t.sportType]?.label || t.sportType };
    return { name: lookupTeam(s?.teamId)?.name || "Club", tier: null, sport: SPORT_NAME[Number(s?.sportId)] || "" };
  };

  const loadData = async () => {
    setLoading(true);
    try {
      api.getTeams().then((r) => setTeamsRaw(r)).catch(() => {});
      if (tab === "staff") setStaff(unwrap(await api.getStaff()));
      else if (tab === "scouts") setScouts(unwrap(await api.getScouts()));
      else if (tab === "managers") setManagers(unwrap(await api.getSportManagers()));
    } catch (err) {
      console.error("Fetch Error:", err);
      showToast("Failed to load data", "error");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { loadData(); setSearch(""); }, [tab]);

  const handleSave = async (form) => {
    try {
      const username = (form.username || "").trim();
      if (tab !== "scouts" && !/^[a-zA-Z0-9._-]+$/.test(username)) {
        showToast("Username can only contain letters, numbers, . _ - (no spaces)", "error");
        return;
      }
      if (tab === "staff") {
        const spec = form.specialization || "General";
        const payload = {
          username, email: form.email.trim(), password: form.password || "Password123!",
          firstName: form.firstName, lastName: form.lastName, age: Number(form.age) || 20,
          phone: String(form.phone || ""), address: form.address || "Barcelona", gender: form.gender || "MALE",
          sportId: Number(form.sportId) || 1, teamId: Number(form.teamId) || 1,
          staffRole: form.staffRole || "HEAD_COACH", teamManagerId: Number(form.teamManagerId) || 1,
          skillType: form.skillType || "Technical", yearsExperience: Number(form.yearsExperience) || 1,
          toolsUsed: form.toolsUsed || "None", coachingLicenseLevel: form.coachingLicenseLevel || "None",
          preManagedTeams: Array.isArray(form.preManagedTeams) ? form.preManagedTeams : [],
          specialization: spec, specialty: spec,
        };
        editItem ? await api.updateStaff(editItem.id, payload) : await api.createStaff(payload);
        showToast(editItem ? "Staff updated" : "Staff added");
      } else if (tab === "scouts") {
        const payload = { region: form.region || "", organizationName: form.organizationName || "" };
        editItem ? await api.updateScout(editItem.id, payload) : await api.createScout(payload);
        showToast("Scout saved");
      } else if (tab === "managers") {
        const payload = {
          username: form.username.trim(), email: form.email.trim(), password: form.password,
          firstName: form.firstName, lastName: form.lastName, age: Number(form.age), phone: String(form.phone),
          address: form.address, gender: form.gender, sportId: Number(form.sportId),
          canManageAllTeams: form.canManageAllTeams === "true" || form.canManageAllTeams === true,
        };
        editItem ? await api.updateSportManager(editItem.id, payload) : await api.createSportManager(payload);
        showToast(editItem ? "Manager updated" : "Manager added");
      }
      setShowModal(false); setEditItem(null); loadData();
    } catch (err) {
      console.error("Save failed:", err);
      showToast(err.message || "Save failed", "error");
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure?")) return;
    try {
      if (tab === "staff") await api.deleteStaff(id);
      else if (tab === "scouts") await api.deleteScout(id);
      else if (tab === "managers") await api.deleteSportManager(id);
      showToast("Deleted successfully"); loadData();
    } catch (err) { showToast("Delete failed", "error"); }
  };

  const getModalConfig = () => {
    if (tab === "scouts") return { title: editItem ? "Edit Scout" : "Add Scout", fields: scoutFields };
    if (tab === "managers") return { title: editItem ? "Edit Manager" : "Add Manager", fields: managerFields };
    return { title: editItem ? "Edit Staff" : "Add Staff", fields: staffFields };
  };

  const tabs = [
    ["staff", <span className="inline-flex items-center gap-1.5"><GiWhistle size={13} /> Technical Staff</span>],
    ["scouts", "🔭 Scouts"],
    ["managers", "👔 Managers"],
  ];
  const match = (s) => `${s.firstName || ""} ${s.lastName || ""} ${s.email || ""} ${s.region || ""} ${s.organizationName || ""}`.toLowerCase().includes(search.toLowerCase());

  const ActionBtns = ({ item }) => (
    <div className="absolute top-3 right-3 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
      <button onClick={() => { setEditItem(item); setShowModal(true); }} className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:bg-emerald-600 hover:text-white transition-all"><AiFillEdit size={13} /></button>
      <button onClick={() => handleDelete(item.id)} className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:bg-red-600 hover:text-white transition-all"><RiDeleteBin6Line size={13} /></button>
    </div>
  );
  const Contact = ({ email, phone }) => (
    <div className="mt-4 pt-3 border-t border-slate-800/60 space-y-1.5">
      {email && <p className="flex items-center gap-2 text-[11px] text-slate-400 truncate"><FiMail size={12} className="text-slate-600 shrink-0" />{email}</p>}
      {phone && <p className="flex items-center gap-2 text-[11px] text-slate-400"><FiPhone size={12} className="text-slate-600 shrink-0" />{phone}</p>}
    </div>
  );

  const visibleStaff = staff.filter(match);
  const visibleScouts = scouts.filter(match);
  const visibleManagers = managers.filter(match);

  return (
    <div className="fade-in p-6 bg-slate-950 min-h-screen">
      {/* Header bar */}
      <PageHeader
        title="Staff"
        subtitle={`${staff.length + scouts.length + managers.length} members · coaching, medical, scouts & managers`}
        icon={GiWhistle}
        action={<AddButton label="+ Add Member" onClick={() => { setEditItem(null); setShowModal(true); }} />}
      />

      <FilterTabs tabs={tabs} active={tab} onSelect={setTab} />

      {/* Stat cards + search */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 my-5">
        {tab === "staff" && <>
          <StatCard label="Total Staff" value={staff.length} />
          <StatCard label="Coaching" value={staff.filter(s => COACH_ROLES.includes(s.staffRole)).length} />
          <StatCard label="Medical" value={staff.filter(s => MEDICAL_ROLES.includes(s.staffRole)).length} />
          <StatCard label="Analysts" value={staff.filter(s => s.staffRole === "PERFORMANCE_ANALYST").length} />
        </>}
        {tab === "scouts" && <StatCard label="Total Scouts" value={scouts.length} />}
        {tab === "managers" && <StatCard label="Total Managers" value={managers.length} />}
      </div>
      <div className="flex items-center rounded-xl px-4 py-3 bg-slate-900/60 border border-slate-800 mb-6 w-full focus-within:border-emerald-500/40 transition-colors">
        <FiSearch className="text-slate-500 mr-2.5 shrink-0" />
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search staff by name…" className="bg-transparent outline-none w-full text-sm text-slate-100 placeholder:text-slate-600" />
      </div>

      {loading ? (
        <div className="text-center py-20 text-slate-500 font-black uppercase text-[10px] tracking-widest italic animate-pulse">Loading personnel…</div>
      ) : (
        <>
          {/* Technical staff */}
          {tab === "staff" && (visibleStaff.length ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {visibleStaff.map((s) => {
                const tone = ROLE_COLORS[s.staffRole] || "text-slate-400 bg-slate-500/10 border-slate-500/30";
                return (
                  <div key={s.id} className="relative group bg-slate-900/40 rounded-2xl border border-slate-800/60 p-5 hover:border-emerald-500/40 hover:-translate-y-1 transition-all">
                    <ActionBtns item={s} />
                    <div className="flex items-center gap-4">
                      <PlayerAvatar name={`${s.firstName} ${s.lastName}`} sport={roleTone(s.staffRole)} size={52} className="border border-slate-800 shadow-lg" />
                      <div className="min-w-0">
                        <h3 className="text-base font-black text-slate-100 truncate">{s.firstName} {s.lastName}</h3>
                        <span className={`inline-block mt-1.5 px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border ${tone}`}>{prettyRole(s.staffRole)}</span>
                      </div>
                    </div>
                    {(() => { const st = staffTeam(s); return (
                    <div className="grid grid-cols-2 gap-3 mt-4">
                      <div className="bg-slate-950/40 rounded-xl border border-slate-800/40 p-2.5 text-center">
                        <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">Team</p>
                        <p className="text-[13px] font-bold text-slate-200 truncate" title={st.name}>{st.name}</p>
                        <div className="flex items-center justify-center gap-1 mt-1">
                          {st.sport && <span className="text-[8px] font-black uppercase tracking-widest text-slate-400">{st.sport}</span>}
                          {st.tier && <span className={`text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded ${st.tier === "First Team" ? "text-emerald-300 bg-emerald-500/10" : "text-sky-300 bg-sky-500/10"}`}>{st.tier === "First Team" ? "1st" : "B"}</span>}
                        </div>
                      </div>
                      <div className="bg-slate-950/40 rounded-xl border border-slate-800/40 p-2.5 text-center">
                        <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">Age</p>
                        <p className="text-sm font-bold text-slate-200">{s.age ?? "—"}</p>
                      </div>
                    </div>
                    ); })()}
                    <Contact email={s.email} phone={s.phone} />
                  </div>
                );
              })}
            </div>
          ) : <EmptyState icon="🧑‍🏫" title="No staff members found" />)}

          {/* Scouts */}
          {tab === "scouts" && (visibleScouts.length ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {visibleScouts.map((s) => (
                <div key={s.id} className="relative group bg-slate-900/40 rounded-2xl border border-slate-800/60 p-5 hover:border-purple-500/40 hover:-translate-y-1 transition-all">
                  <ActionBtns item={s} />
                  <div className="flex items-center gap-4">
                    <PlayerAvatar name={s.firstName ? `${s.firstName} ${s.lastName}` : s.region || "Scout"} sport="Scout" size={52} className="border border-slate-800 shadow-lg" />
                    <div className="min-w-0">
                      <h3 className="text-base font-black text-slate-100 truncate">{s.firstName ? `${s.firstName} ${s.lastName}` : "Scout"}</h3>
                      <span className="inline-block mt-1.5 px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border text-purple-400 bg-purple-500/10 border-purple-500/30">Scout</span>
                    </div>
                  </div>
                  <div className="mt-4 space-y-1.5 text-xs">
                    <p className="text-slate-400"><span className="text-slate-600 font-bold uppercase text-[10px] tracking-widest">Region:</span> {s.region || "—"}</p>
                    <p className="text-slate-400"><span className="text-slate-600 font-bold uppercase text-[10px] tracking-widest">Org:</span> {s.organizationName || "—"}</p>
                  </div>
                  <Contact email={s.email} phone={s.phone} />
                </div>
              ))}
            </div>
          ) : <EmptyState icon="🔭" title="No scouts found" />)}

          {/* Managers */}
          {tab === "managers" && (visibleManagers.length ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {visibleManagers.map((m, i) => (
                <div key={m.id || i} className="relative group bg-slate-900/40 rounded-2xl border border-slate-800/60 p-5 hover:border-amber-500/40 hover:-translate-y-1 transition-all">
                  <ActionBtns item={m} />
                  <div className="flex items-center gap-4">
                    <PlayerAvatar name={`${m.firstName} ${m.lastName}`} sport="Manager" size={52} className="border border-slate-800 shadow-lg" />
                    <div className="min-w-0">
                      <h3 className="text-base font-black text-slate-100 truncate">{m.firstName} {m.lastName}</h3>
                      <span className="inline-block mt-1.5 px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border text-amber-400 bg-amber-500/10 border-amber-500/30">Sport Manager</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3 mt-4">
                    <div className="bg-slate-950/40 rounded-xl border border-slate-800/40 p-2.5 text-center">
                      <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">Sport</p>
                      <p className="text-sm font-bold text-slate-200">{SPORT_NAME[m.sportId] || "—"}</p>
                    </div>
                    <div className="bg-slate-950/40 rounded-xl border border-slate-800/40 p-2.5 text-center">
                      <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">Access</p>
                      <p className={`text-[11px] font-black ${m.canManageAllTeams ? "text-emerald-400" : "text-slate-400"}`}>{m.canManageAllTeams ? "Full" : "Limited"}</p>
                    </div>
                  </div>
                  <Contact email={m.email} phone={m.phone} />
                </div>
              ))}
            </div>
          ) : <EmptyState icon="👔" title="No managers found" />)}
        </>
      )}

      {showModal && <FormModal {...getModalConfig()} onSubmit={handleSave} onClose={() => { setShowModal(false); setEditItem(null); }} initialData={editItem || {}} />}
      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
