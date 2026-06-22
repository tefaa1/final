"use client";
import { useState, useEffect } from "react";
import { ROLES } from "@/src/data/mockData";
import { api } from "@/src/lib/api";
import PlayerAvatar, { roleTone } from "@/src/components/shared/PlayerAvatar";
import {
    FormModal, StatusBadge, Avatar, StatCard, PageHeader, AddButton, Toast, EmptyState
} from "@/src/components/shared/SharedComponents";
import { AiFillEdit } from "react-icons/ai";
import { RiDeleteBin6Line } from "react-icons/ri";

const ROLE_COLORS = {
    ADMIN: "text-red-400 bg-red-500/10 border-red-500/20",
    PLAYER: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
    HEAD_COACH: "text-blue-400 bg-blue-500/10 border-blue-500/20",
    ASSISTANT_COACH: "text-sky-400 bg-sky-500/10 border-sky-500/20",
    SPECIFIC_COACH: "text-cyan-400 bg-cyan-500/10 border-cyan-500/20",
    FITNESS_COACH: "text-lime-400 bg-lime-500/10 border-lime-500/20",
    PERFORMANCE_ANALYST: "text-indigo-400 bg-indigo-500/10 border-indigo-500/20",
    TEAM_DOCTOR: "text-teal-400 bg-teal-500/10 border-teal-500/20",
    DOCTOR: "text-teal-400 bg-teal-500/10 border-teal-500/20",
    PHYSIOTHERAPIST: "text-emerald-300 bg-emerald-400/10 border-emerald-400/20",
    SCOUT: "text-purple-400 bg-purple-500/10 border-purple-500/20",
    SPONSOR: "text-amber-400 bg-amber-500/10 border-amber-500/20",
    SPORT_MANAGER: "text-orange-400 bg-orange-500/10 border-orange-500/20",
    TEAM_MANAGER: "text-yellow-400 bg-yellow-500/10 border-yellow-500/20",
    NATIONAL_TEAM: "text-pink-400 bg-pink-500/10 border-pink-500/20",
    FAN: "text-slate-400 bg-slate-500/10 border-slate-500/20",
};

// The /users endpoint reports every staff member with role "STAFF" — the
// real job title (HEAD_COACH, TEAM_DOCTOR, …) lives in /staff.staffRole.
// We merge the two so the table shows the meaningful role. We also fix the
// backend's "MANGER" enum typo for display.
const prettyRole = (r) =>
    !r ? "—" : String(r).replace("MANGER", "MANAGER").replace(/_/g, " ");

const COACH_ROLES = ["HEAD_COACH", "ASSISTANT_COACH", "SPECIFIC_COACH", "FITNESS_COACH"];
const MEDICAL_ROLES = ["TEAM_DOCTOR", "DOCTOR", "PHYSIOTHERAPIST"];

const fields = [
    { key: "username", label: "Username", placeholder: "johndoe123" },
    { key: "email", label: "Email", type: "email", placeholder: "john@club.com" },
    { key: "password", label: "Password", type: "password", placeholder: "********" }, // مهم جداً
    { key: "firstName", label: "First Name", placeholder: "John" },
    { key: "lastName", label: "Last Name", placeholder: "Doe" },
    { key: "displayName", label: "Display Name", placeholder: "Johnny" },
    { key: "age", label: "Age", type: "number", placeholder: "25" },
    { key: "phone", label: "Phone", placeholder: "+213..." },
    { key: "address", label: "Address", placeholder: "123 Main St" },
    { key: "gender", label: "Gender", type: "select", options: ["MALE", "FEMALE"] },
    { key: "role", label: "Role", type: "select", options: ROLES },
    { key: "specialization", label: "Specialization", placeholder: "Goalkeeper Coach" },
    { key: "experienceYears", label: "Experience Years", type: "number", placeholder: "5" },
    { key: "bloodType", label: "Blood Type", type: "select", options: ["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"] },
    { key: "favoriteTeamId", label: "Favorite Team ID", type: "number", placeholder: "1" },
];
export default function UserManagement() {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [roleFilter, setRoleFilter] = useState("ALL");
    const [showModal, setShowModal] = useState(false);
    const [editItem, setEditItem] = useState(null);
    const [toast, setToast] = useState(null);

    const showToast = (msg, type = "success") => setToast({ msg, type });



    const loadUsers = async () => {
        try {
            setLoading(true);
            // Fetch users + staff in parallel. /users reports staff as role
            // "STAFF"; /staff carries the real staffRole keyed by keycloakId.
            const [usersRes, staffRes] = await Promise.all([
                api.getUsers().catch(() => null),
                api.getStaff().catch(() => null),
            ]);

            const unwrap = (r) =>
                Array.isArray(r) ? r : (r?.data || r?.content || []);
            const serverUsers = unwrap(usersRes);
            const staff = unwrap(staffRes);

            // keycloakId -> staffRole
            const staffRoleByKc = {};
            staff.forEach((s) => {
                if (s.keycloakId && s.staffRole) staffRoleByKc[s.keycloakId] = s.staffRole;
            });

            // Attach an effective role used everywhere in the UI.
            const merged = serverUsers.map((u) => ({
                ...u,
                effRole:
                    u.role === "STAFF"
                        ? (staffRoleByKc[u.keycloakId] || "STAFF")
                        : (u.role || "—"),
            }));

            setData(merged);
        } catch (error) {
            console.error("Fetch error:", error);
        } finally {
            setLoading(false);
        }
    };

    
    useEffect(() => {
        loadUsers();
    }, [roleFilter]); 

   
    const filtered = (data || []).filter(u =>
        (roleFilter === "ALL" || u.effRole === roleFilter) &&
        `${u.firstName} ${u.lastName} ${u.email}`.toLowerCase().includes(search.toLowerCase())
    );

    // Build the role dropdown from the roles actually present.
    const roleOptions = [...new Set((data || []).map(u => u.effRole).filter(Boolean))].sort();




    const handleSave = async (form) => {
        try {
            const payload = {
                ...form,
                age: Number(form.age) || 0,
                experienceYears: Number(form.experienceYears) || 0,
                favoriteTeamId: Number(form.favoriteTeamId) || 0,
                role: form.role?.toUpperCase(),
            };
            const res = await api.adminCreateUser(payload);

            if (res.keycloakId) {
                showToast("User created! Syncing with server...");

                const newUser = {
                    id: res.id || Date.now(),
                    keycloakId: res.keycloakId,
                    firstName: form.firstName,
                    lastName: form.lastName,
                    email: form.email,
                    role: res.role || form.role,
                    effRole: (res.role || form.role || "").toUpperCase(),
                    phone: form.phone || "N/A",
                    phoneNumber: form.phone || "N/A"
                };

                setData(prev => [newUser, ...prev]);
                setTimeout(() => loadUsers(), 5000);
            }
            setShowModal(false);
        } catch (error) {
            console.error("User create error:", error);
            showToast(error.message || "Save failed", "error");
        }
    };
   
    const handleDelete = async (id) => {
        if (!confirm("Are you sure you want to delete this user?")) return;
        try {
            await api.deleteUser(id);
            showToast("User deleted from server", "error");
            loadUsers();
        } catch (error) {
            showToast("Error deleting user", "error");
        }
    };

    if (loading) return <div className="p-10 text-emerald-500 font-bold">Connecting to Services...</div>;

    return (
        <div className="fade-in">
            {/* Banner */}
            <div className="relative overflow-hidden rounded-3xl border border-slate-800 bg-gradient-to-br from-[#0a1a3f] via-slate-900 to-[#3b0a2a] p-6 mb-6">
                <div className="absolute -right-8 -top-10 w-56 h-56 rounded-full bg-red-500/10 blur-3xl" />
                <div className="relative flex items-center justify-between gap-4 flex-wrap">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-red-500/15 border border-red-500/30 flex items-center justify-center text-3xl shadow-xl">👥</div>
                        <div>
                            <p className="text-[11px] font-black uppercase tracking-[0.3em] text-red-300/80">FC Barcelona</p>
                            <h1 className="text-4xl sm:text-5xl font-black text-white uppercase tracking-tight leading-none">User Management</h1>
                            <p className="text-[11px] text-slate-400 mt-1.5">{data.length} accounts · roles &amp; access across the system</p>
                        </div>
                    </div>
                    <AddButton label="+ Add User" onClick={() => { setEditItem(null); setShowModal(true); }} />
                </div>
            </div>

            {/* Stats — counts by EFFECTIVE role (staff resolved to their job title) */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <StatCard label="Total Users" value={data.length} />
                <StatCard label="Players" value={data.filter(u => u.effRole === "PLAYER").length} />
                <StatCard label="Coaching Staff" value={data.filter(u => COACH_ROLES.includes(u.effRole)).length} />
                <StatCard label="Medical Staff" value={data.filter(u => MEDICAL_ROLES.includes(u.effRole)).length} />
            </div>

            {/* Table card */}
            <div className="bg-slate-950 rounded-2xl shadow-sm border border-slate-800 overflow-hidden">
                {/* Filters */}
                <div className="p-4 border-b border-slate-800 flex flex-wrap gap-4 items-center">
                    <div className="flex items-center gap-3 bg-slate-900/50 border border-slate-800 rounded-xl px-4 py-2 flex-1 min-w-48 group focus-within:border-emerald-500/50 transition-all">
                        <span className="text-slate-500 group-focus-within:text-emerald-500 transition-colors">🔍</span>
                        <input
                            placeholder="Search users..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="bg-transparent outline-none text-sm text-slate-200 w-full placeholder:text-slate-600"
                        />
                    </div>
                    <select
                        value={roleFilter}
                        onChange={e => setRoleFilter(e.target.value)}
                        className="px-4 py-2 rounded-xl border border-slate-800 bg-slate-900/50 text-sm text-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all cursor-pointer"
                    >
                        <option value="ALL" className="bg-slate-900">All Roles</option>
                        {roleOptions.map(r => <option key={r} value={r} className="bg-slate-900">{prettyRole(r)}</option>)}
                    </select>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-slate-800 bg-slate-900/20">
                                {["User", "Email", "Phone", "Role", "Actions"].map(h => (
                                    <th key={h} className="px-6 py-4 text-left text-[10px] font-bold text-slate-500 uppercase tracking-widest">{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map(u => (
                                <tr key={u.id} className="border-b border-slate-900 hover:bg-emerald-500/[0.02] transition-colors group">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-4">
                                            <PlayerAvatar name={`${u.firstName} ${u.lastName}`} sport={roleTone(u.effRole)} size={38} className="border border-slate-800" />
                                            <div>
                                                <p className="font-bold text-slate-200 text-sm group-hover:text-white transition-colors">{u.firstName} {u.lastName}</p>
                                                <p className="text-[10px] text-slate-500 mt-0.5">{u.email}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-slate-400 font-medium">{u.email}</td>
                                    <td className="px-6 py-4 text-sm text-slate-400 font-medium">{u.phone || u.phoneNumber || "—"}</td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wider ${ROLE_COLORS[u.effRole] || "text-slate-400 bg-slate-500/10 border-slate-500/20"}`}>
                                            {prettyRole(u.effRole)}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <button
                                                onClick={() => { setEditItem(u); setShowModal(true); }}
                                                className="cursor-pointerp-2 rounded-lg text-slate-500 hover:bg-emerald-500/10 hover:text-emerald-400 transition-all active:scale-90"
                                                title="Edit"
                                            ><AiFillEdit size={16} /></button>
                                            <button
                                                onClick={() => handleDelete(u.id)}
                                                className="cursor-pointer p-2 rounded-lg text-slate-500 hover:bg-red-500/10 hover:text-red-400 transition-all active:scale-90"
                                                title="Delete"
                                            ><RiDeleteBin6Line size={16} /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {filtered.length === 0 && <EmptyState icon="👥" title="No users found" />}
                </div>
            </div>

            {showModal && (
                <FormModal
                    title={editItem ? "Edit User" : "Create User"}
                    fields={fields}
                    onSubmit={handleSave}
                    onClose={() => { setShowModal(false); setEditItem(null); }}
                    initialData={editItem || {}}
                />
            )}
            {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
        </div>
    );
}