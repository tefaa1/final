"use client";

import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import Cookies from "js-cookie";
import { Shield, LogOut, KeyRound, User, Mail, Fingerprint, Clock, Eye, EyeOff } from "lucide-react";
import { getClaims, getEmail, getRoleLabel, getKeycloakId } from "./settingsStore";

const API_BASE = "http://localhost:8080";

// Backend constraint (PasswordUpdateRequest): @Size(min = 6).
const MIN_LEN = 6;

export default function SecurityTab() {
  const [form, setForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [show, setShow] = useState(false);
  const [showCurrent, setShowCurrent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [account, setAccount] = useState({ name: "", username: "", email: "", role: "", keycloakId: "", loginTime: "" });

  useEffect(() => {
    const claims = getClaims();
    let info = {};
    try { info = JSON.parse(localStorage.getItem("user_info") || "{}"); } catch { /* ignore */ }
    setAccount({
      name: claims.name || info.name || claims.preferred_username || info.username || "—",
      username: info.username || claims.preferred_username || "—",
      email: getEmail() || "—",
      role: getRoleLabel() || "—",
      keycloakId: getKeycloakId() || "—",
      loginTime: info.loginTime || "",
    });
  }, []);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const getStrength = (pw) => {
    let s = 0;
    if (pw.length >= 8) s++;
    if (/[A-Z]/.test(pw)) s++;
    if (/[0-9]/.test(pw)) s++;
    if (/[^A-Za-z0-9]/.test(pw)) s++;
    return s;
  };
  const strength = getStrength(form.newPassword);
  const strengthLabel = ["Very Weak", "Weak", "Medium", "Strong", "Very Strong"];
  const strengthColors = ["bg-rose-500", "bg-orange-500", "bg-yellow-500", "bg-sky-500", "bg-emerald-500"];

  // Resolve the numeric DB id for the current user (the password endpoint is
  // keyed on it), then PUT the new password. Both endpoints authorize the
  // current user, so this works for any logged-in role — not just admins.
  const handleUpdatePassword = async () => {
    if (!form.currentPassword) {
      toast.error("Enter your current password.");
      return;
    }
    if (form.newPassword.length < MIN_LEN) {
      toast.error(`Password must be at least ${MIN_LEN} characters.`);
      return;
    }
    if (form.newPassword !== form.confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }
    if (form.currentPassword === form.newPassword) {
      toast.error("New password must be different from your current password.");
      return;
    }

    const token = localStorage.getItem("token");
    const kcId = getKeycloakId();
    if (!token || !kcId) {
      toast.error("Your session has expired — please log in again.");
      return;
    }

    setBusy(true);
    try {
      const auth = { Authorization: `Bearer ${token}` };
      const lookup = await fetch(`${API_BASE}/users/keycloak/${encodeURIComponent(kcId)}`, { headers: auth });
      if (!lookup.ok) throw new Error(`Could not resolve your account (${lookup.status}).`);
      const body = await lookup.json();
      const userId = body?.data?.id ?? body?.id;
      if (!userId) throw new Error("Account id not found.");

      const res = await fetch(`${API_BASE}/users/${userId}/password`, {
        method: "PUT",
        headers: { ...auth, "Content-Type": "application/json" },
        // Send both naming conventions so a backend that adds old-password
        // verification can pick up either field. (Current DTO only reads
        // `newPassword`; see the report note on backend verification.)
        body: JSON.stringify({
          oldPassword: form.currentPassword,
          currentPassword: form.currentPassword,
          newPassword: form.newPassword,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || `Update failed (${res.status}).`);
      }
      toast.success("Password updated successfully.");
      setForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (e) {
      toast.error(e.message || "Failed to update password.");
    } finally {
      setBusy(false);
    }
  };

  // Clears the same session keys the app's Navbar logout clears.
  const logout = () => {
    try {
      Cookies.remove("user_role", { path: "/" });
      Cookies.remove("token", { path: "/" });
      ["user_role", "user_info", "token", "loggedIn", "keycloakId"].forEach((k) => localStorage.removeItem(k));
    } catch { /* ignore */ }
    toast.success("Logged out of this device.");
    window.location.href = "/login";
  };

  const fmtLogin = (iso) => {
    if (!iso) return "—";
    const d = new Date(iso);
    return isNaN(d) ? "—" : d.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
  };

  const infoRows = [
    { icon: User, label: "Name", value: account.name },
    { icon: User, label: "Username", value: account.username },
    { icon: Mail, label: "Email", value: account.email },
    { icon: Shield, label: "Role", value: account.role },
    { icon: Fingerprint, label: "Account ID", value: account.keycloakId, mono: true },
    { icon: Clock, label: "Signed in", value: fmtLogin(account.loginTime) },
  ];

  return (
    <div className="space-y-8 settings-density">
      {/* Account / session info — real values from your JWT session */}
      <div className="bg-slate-900/50 backdrop-blur-sm rounded-2xl border border-slate-800 p-8 shadow-2xl relative overflow-hidden">
        <div className="absolute -right-20 -top-20 w-80 h-80 bg-emerald-500/5 rounded-full blur-[100px]" />
        <div className="relative z-10">
          <h2 className="text-xl font-black text-slate-100 uppercase tracking-tight">Account & Session</h2>
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-2">Your signed-in identity on this device</p>

          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-3">
            {infoRows.map(({ icon: Icon, label, value, mono }) => (
              <div key={label} className="settings-row flex items-center gap-4 bg-slate-950/50 border border-slate-800 rounded-xl px-5 py-4">
                <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400"><Icon size={15} /></div>
                <div className="min-w-0">
                  <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em]">{label}</p>
                  <p className={`text-sm text-slate-200 font-semibold truncate ${mono ? "font-mono text-xs" : ""}`} title={String(value)}>{value || "—"}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 flex items-center gap-4 flex-wrap">
            <button
              type="button"
              onClick={logout}
              className="inline-flex items-center gap-2 bg-rose-500/10 border border-rose-500/25 text-rose-400 px-8 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-rose-500 hover:text-white transition-all shadow-lg shadow-rose-500/10 active:scale-95"
            >
              <LogOut size={14} /> Log out of this device
            </button>
            <p className="text-[10px] text-slate-600 font-medium">Clears your saved session and returns you to the login screen.</p>
          </div>
        </div>
      </div>

      {/* Change password — real PUT /users/{id}/password */}
      <div className="bg-slate-900/50 backdrop-blur-sm rounded-2xl border border-slate-800 p-8 shadow-2xl relative overflow-hidden">
        <div className="absolute -right-20 -top-20 w-80 h-80 bg-rose-500/5 rounded-full blur-[100px]" />
        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400"><KeyRound size={16} /></div>
            <div>
              <h2 className="text-xl font-black text-slate-100 uppercase tracking-tight">Change Password</h2>
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1">Set a new password for your account</p>
            </div>
          </div>

          <div className="mt-8 space-y-7 max-w-xl">
            <div className="space-y-2">
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Current Password</label>
              <div className="relative">
                <input
                  type={showCurrent ? "text" : "password"}
                  name="currentPassword"
                  value={form.currentPassword}
                  onChange={handleChange}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-5 py-3 pr-12 text-slate-100 text-sm font-medium focus:border-emerald-500/50 focus:ring-4 focus:ring-emerald-500/5 outline-none transition-all placeholder:text-slate-800"
                />
                <button type="button" onClick={() => setShowCurrent((s) => !s)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300" aria-label={showCurrent ? "Hide current password" : "Show current password"}>
                  {showCurrent ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              <p className="text-[10px] text-slate-600 font-medium ml-1">Required — confirm it's really you before changing your password.</p>
            </div>

            <div className="space-y-2">
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">New Password</label>
              <div className="relative">
                <input
                  type={show ? "text" : "password"}
                  name="newPassword"
                  value={form.newPassword}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-5 py-3 pr-12 text-slate-100 text-sm font-medium focus:border-emerald-500/50 focus:ring-4 focus:ring-emerald-500/5 outline-none transition-all placeholder:text-slate-800"
                />
                <button type="button" onClick={() => setShow((s) => !s)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300" aria-label={show ? "Hide password" : "Show password"}>
                  {show ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>

              {form.newPassword && (
                <div className="mt-4 bg-slate-950/50 p-4 rounded-xl border border-slate-800/50">
                  <div className="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden">
                    <div className={`h-full transition-all duration-700 ease-out ${strengthColors[strength]}`} style={{ width: `${(strength / 4) * 100}%` }} />
                  </div>
                  <p className="text-[10px] font-black uppercase tracking-widest mt-3 text-slate-500">
                    Strength: <span className={strength > 2 ? "text-emerald-500" : "text-rose-500"}>{strengthLabel[strength]}</span>
                    {form.newPassword.length < MIN_LEN && <span className="text-rose-500"> · min {MIN_LEN} characters</span>}
                  </p>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Confirm New Password</label>
              <input
                type={show ? "text" : "password"}
                name="confirmPassword"
                value={form.confirmPassword}
                onChange={handleChange}
                placeholder="••••••••"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-5 py-3 text-slate-100 text-sm font-medium focus:border-emerald-500/50 focus:ring-4 focus:ring-emerald-500/5 outline-none transition-all placeholder:text-slate-800"
              />
              {form.confirmPassword && form.confirmPassword !== form.newPassword && (
                <p className="text-[10px] font-black text-rose-400 uppercase tracking-widest ml-1">Passwords do not match.</p>
              )}
            </div>

            <button
              type="button"
              onClick={handleUpdatePassword}
              disabled={busy || !form.currentPassword || !form.newPassword || !form.confirmPassword}
              className="bg-emerald-600/10 border border-emerald-500/20 text-emerald-500 px-10 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-emerald-600 hover:text-white transition-all shadow-lg shadow-emerald-500/10 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {busy ? "Updating..." : "Update Password"}
            </button>
            <p className="text-[10px] text-slate-600 font-medium">
              Updates your password through the account service. After changing it, use the new password on your next sign-in.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
