"use client";
import React, { useState, useEffect } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import Link from "next/link";
import FeatureCard from "./FeatureCard";
import {
  UserGroupIcon,
  ChartBarIcon,
  ShieldCheckIcon,
  TrophyIcon,
} from "@heroicons/react/24/outline";
import { FiShield } from "react-icons/fi";


export default function Signup() {
  const router = useRouter();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [age, setAge] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [gender, setGender] = useState("");
  const [favoriteTeamId, setFavoriteTeamId] = useState("");

  // UI state
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [focused, setFocused] = useState({
    firstName: false, lastName: false, username: false,
    displayName: false, email: false, password: false,
    confirm: false, age: false, phone: false, address: false,
  });

  useEffect(() => {
    fetch("http://localhost:8080/teams")
      .then((r) => {
        if (!r.ok) throw new Error(`Teams API ${r.status}`);
        return r.json();
      })
      .then((data) => setTeams(Array.isArray(data) ? data : (data?.content || [])))
      .catch((err) => {
        console.error("Failed to load teams:", err);
        setError("Could not load team list — you can still sign up.");
      });
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!firstName || !lastName || !username || !email || !password) {
      setError("Please fill all required fields.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("http://localhost:8080/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username,
          email,
          password,
          firstName,
          lastName,
          age: age ? Number(age) : null,
          phone,
          address,
          gender,
          displayName: displayName || username,
          favoriteTeamId: 1,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || "Signup failed. Please try again.");
      }

      setSuccessMsg("Account created successfully. Redirecting to login...");
      setTimeout(() => {
        setSuccessMsg("");
        router.push("/login");
      }, 1500);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden flex">

      {/* Left: same as login */}
      <div className="hidden lg:flex lg:w-[55%] relative">

        <Image
          src="/sportify/yy.jpg"
          alt="athletes"
          fill
          className="object-cover"
          priority
          sizes="55vw"
        />

        <div className="absolute inset-0 bg-gradient-to-b from-emerald-900/80 via-teal-900/60 to-blue-900/80 z-10" />

        <div className="absolute inset-0 z-20 flex flex-col justify-between p-10 text-white">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex items-center gap-3"
          >
            <Image
              src="/sportify/logo2-removebg-preview.png"
              alt="Sportify"
              width={100}
              height={100}
              className="object-contain drop-shadow-lg bg-transparent"
              style={{ background: "none" }}
            />
            <span className="text-8xl font-black italic pb-2 text-center bg-gradient-to-r from-emerald-300 via-teal-500 to-cyan-400 bg-clip-text text-transparent">
              Sportify
            </span>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="space-y-4"
          >
            <h1 className="text-4xl sm:text-5xl font-extrabold leading-tight">
              Your sports hub <br />reimagined.
            </h1>
            <p className="text-white/85 text-lg max-w-sm">
              Manage teams, track performance, and bring your club to the next level.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
              <FeatureCard icon={<UserGroupIcon className="h-7 w-7 text-white" />} text="Active players & staff" />
              <FeatureCard icon={<ChartBarIcon className="h-7 w-7 text-white" />} text="Performance tracking" />
              <FeatureCard icon={<TrophyIcon className="h-7 w-7 text-white" />} text="Football, Basketball, Handball" />
              <FeatureCard icon={<ShieldCheckIcon className="h-7 w-7 text-white" />} text="Role-based permissions" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="flex gap-6 text-sm"
          >
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-300 animate-pulse" />
              <span>Multi-sport support</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-teal-300 animate-pulse" style={{ animationDelay: "0.3s" }} />
              <span>Real-time analytics</span>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Right: Signup form */}
      <motion.div
        initial={{ opacity: 0, x: -40 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6 }}
        className="flex-1 flex items-center justify-center p-6 sm:p-10 bg-slate-950"
      >
        <div className="w-full max-w-md space-y-6">

          {/* Mobile logo */}
          <div className="lg:hidden flex items-center justify-center gap-3 mb-8">
            <span className="text-4xl font-black italic bg-gradient-to-r text-center from-emerald-400 via-teal-300 to-cyan-300 bg-clip-text text-transparent">
              Sportify
            </span>
          </div>

          <div>
            <h2 className="text-3xl sm:text-4xl font-black bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-300 bg-clip-text text-transparent text-center">Create Account</h2>
            <p className="text-slate-500 mt-2 text-center font-medium tracking-wide">Sign up to get started with your dashboard</p>
          </div>

          <motion.form onSubmit={handleSubmit} className="space-y-4">

            {error && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-center gap-2"
              >
                <span className="text-red-500">!</span>
                {error}
              </motion.div>
            )}

            {successMsg && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm flex items-center gap-2"
              >
                <span>✓</span>
                {successMsg}
              </motion.div>
            )}

            {/* First Name + Last Name */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <label className="block text-xs font-black uppercase tracking-widest text-slate-500">First Name *</label>
                <div className={`rounded-2xl border bg-slate-900/50 transition-all duration-300 ${focused.firstName ? "border-emerald-500 ring-4 ring-emerald-500/10 shadow-lg shadow-emerald-500/20" : "border-slate-800"}`}>
                  <input
                    type="text"
                    placeholder="First name"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    onFocus={() => setFocused((f) => ({ ...f, firstName: true }))}
                    onBlur={() => setFocused((f) => ({ ...f, firstName: false }))}
                    className="w-full px-4 py-3.5 rounded-2xl outline-none bg-transparent text-slate-200 font-medium placeholder:text-slate-600"
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="block text-xs font-black uppercase tracking-widest text-slate-500">Last Name *</label>
                <div className={`rounded-2xl border bg-slate-900/50 transition-all duration-300 ${focused.lastName ? "border-emerald-500 ring-4 ring-emerald-500/10 shadow-lg shadow-emerald-500/20" : "border-slate-800"}`}>
                  <input
                    type="text"
                    placeholder="Last name"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    onFocus={() => setFocused((f) => ({ ...f, lastName: true }))}
                    onBlur={() => setFocused((f) => ({ ...f, lastName: false }))}
                    className="w-full px-4 py-3.5 rounded-2xl outline-none bg-transparent text-slate-200 font-medium placeholder:text-slate-600"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Username */}
            <div className="space-y-2">
              <label className="block text-xs font-black uppercase tracking-widest text-slate-500">Username *</label>
              <div className={`rounded-2xl border bg-slate-900/50 transition-all duration-300 ${focused.username ? "border-emerald-500 ring-4 ring-emerald-500/10 shadow-lg shadow-emerald-500/20" : "border-slate-800"}`}>
                <input
                  type="text"
                  placeholder="Choose a username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  onFocus={() => setFocused((f) => ({ ...f, username: true }))}
                  onBlur={() => setFocused((f) => ({ ...f, username: false }))}
                  className="w-full px-4 py-3.5 rounded-2xl outline-none bg-transparent text-slate-200 font-medium placeholder:text-slate-600"
                  required
                />
              </div>
            </div>

            {/* Display Name */}
            <div className="space-y-2">
              <label className="block text-xs font-black uppercase tracking-widest text-slate-500">Display Name</label>
              <div className={`rounded-2xl border bg-slate-900/50 transition-all duration-300 ${focused.displayName ? "border-emerald-500 ring-4 ring-emerald-500/10 shadow-lg shadow-emerald-500/20" : "border-slate-800"}`}>
                <input
                  type="text"
                  placeholder="How others see your name"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  onFocus={() => setFocused((f) => ({ ...f, displayName: true }))}
                  onBlur={() => setFocused((f) => ({ ...f, displayName: false }))}
                  className="w-full px-4 py-3.5 rounded-2xl outline-none bg-transparent text-slate-200 font-medium placeholder:text-slate-600"
                />
              </div>
            </div>

            {/* Email */}
            <div className="space-y-2">
              <label className="block text-xs font-black uppercase tracking-widest text-slate-500">Email Address *</label>
              <div className={`rounded-2xl border bg-slate-900/50 transition-all duration-300 ${focused.email ? "border-emerald-500 ring-4 ring-emerald-500/10 shadow-lg shadow-emerald-500/20" : "border-slate-800"}`}>
                <input
                  type="email"
                  placeholder="you@sportify.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onFocus={() => setFocused((f) => ({ ...f, email: true }))}
                  onBlur={() => setFocused((f) => ({ ...f, email: false }))}
                  className="w-full px-4 py-3.5 rounded-2xl outline-none bg-transparent text-slate-200 font-medium placeholder:text-slate-600"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-2">
              <label className="block text-xs font-black uppercase tracking-widest text-slate-500">Password *</label>
              <div className={`rounded-2xl border bg-slate-900/50 transition-all duration-300 ${focused.password ? "border-emerald-500 ring-4 ring-emerald-500/10 shadow-lg shadow-emerald-500/20" : "border-slate-800"}`}>
                <input
                  type="password"
                  placeholder="Create your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onFocus={() => setFocused((f) => ({ ...f, password: true }))}
                  onBlur={() => setFocused((f) => ({ ...f, password: false }))}
                  className="w-full px-4 py-3.5 rounded-2xl outline-none bg-transparent text-slate-200 font-medium placeholder:text-slate-600"
                  required
                />
              </div>
            </div>

            {/* Confirm Password */}
            <div className="space-y-2">
              <label className="block text-xs font-black uppercase tracking-widest text-slate-500">Confirm Password *</label>
              <div className={`rounded-2xl border bg-slate-900/50 transition-all duration-300 ${focused.confirm ? "border-emerald-500 ring-4 ring-emerald-500/10 shadow-lg shadow-emerald-500/20" : "border-slate-800"}`}>
                <input
                  type="password"
                  placeholder="Confirm your password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  onFocus={() => setFocused((f) => ({ ...f, confirm: true }))}
                  onBlur={() => setFocused((f) => ({ ...f, confirm: false }))}
                  className="w-full px-4 py-3.5 rounded-2xl outline-none bg-transparent text-slate-200 font-medium placeholder:text-slate-600"
                  required
                />
              </div>
            </div>

            {/* Age + Phone */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <label className="block text-xs font-black uppercase tracking-widest text-slate-500">Age</label>
                <div className={`rounded-2xl border bg-slate-900/50 transition-all duration-300 ${focused.age ? "border-emerald-500 ring-4 ring-emerald-500/10 shadow-lg shadow-emerald-500/20" : "border-slate-800"}`}>
                  <input
                    type="number"
                    placeholder="Your age"
                    value={age}
                    min={1} max={120}
                    onChange={(e) => setAge(e.target.value)}
                    onFocus={() => setFocused((f) => ({ ...f, age: true }))}
                    onBlur={() => setFocused((f) => ({ ...f, age: false }))}
                    className="w-full px-4 py-3.5 rounded-2xl outline-none bg-transparent text-slate-200 font-medium placeholder:text-slate-600"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="block text-xs font-black uppercase tracking-widest text-slate-500">Phone</label>
                <div className={`rounded-2xl border bg-slate-900/50 transition-all duration-300 ${focused.phone ? "border-emerald-500 ring-4 ring-emerald-500/10 shadow-lg shadow-emerald-500/20" : "border-slate-800"}`}>
                  <input
                    type="tel"
                    placeholder="Phone number"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    onFocus={() => setFocused((f) => ({ ...f, phone: true }))}
                    onBlur={() => setFocused((f) => ({ ...f, phone: false }))}
                    className="w-full px-4 py-3.5 rounded-2xl outline-none bg-transparent text-slate-200 font-medium placeholder:text-slate-600"
                  />
                </div>
              </div>
            </div>

            {/* Gender */}
            <div className="space-y-2">
              <label className="block text-xs font-black uppercase tracking-widest text-slate-500">Gender</label>
              <div className="rounded-2xl border border-slate-800 bg-slate-900/50">
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  className="w-full px-4 py-3.5 rounded-2xl outline-none bg-transparent text-slate-200 font-medium appearance-none cursor-pointer"
                >
                  <option value="" className="bg-slate-900 text-slate-400">Select gender</option>
                  <option value="male" className="bg-slate-900 text-slate-200">Male</option>
                  <option value="female" className="bg-slate-900 text-slate-200">Female</option>
                </select>
              </div>
            </div>

            {/* Address */}
            <div className="space-y-2">
              <label className="block text-xs font-black uppercase tracking-widest text-slate-500">Address</label>
              <div className={`rounded-2xl border bg-slate-900/50 transition-all duration-300 ${focused.address ? "border-emerald-500 ring-4 ring-emerald-500/10 shadow-lg shadow-emerald-500/20" : "border-slate-800"}`}>
                <input
                  type="text"
                  placeholder="Your address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  onFocus={() => setFocused((f) => ({ ...f, address: true }))}
                  onBlur={() => setFocused((f) => ({ ...f, address: false }))}
                  className="w-full px-4 py-3.5 rounded-2xl outline-none bg-transparent text-slate-200 font-medium placeholder:text-slate-600"
                />
              </div>
            </div>

            {/* Favorite Team */}
            <div className="space-y-2">
              <label className="block text-xs font-black uppercase tracking-widest text-slate-500">Favorite Team</label>
              <div className="rounded-2xl border border-slate-800 bg-slate-900/50">
                <select
                  value={favoriteTeamId}
                  onChange={(e) => setFavoriteTeamId(e.target.value)}
                  className="w-full px-4 py-3.5 rounded-2xl outline-none bg-transparent text-slate-200 font-medium appearance-none cursor-pointer"
                >
                  <option value="" className="bg-slate-900 text-slate-400">Select a team</option>
                  {teams.map((team) => (
                    <option key={team.id} value={team.id} className="bg-slate-900 text-slate-200">
                      {team.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Submit */}
            <motion.button
              type="submit"
              disabled={loading}
              whileHover={{ scale: loading ? 1 : 1.02 }}
              whileTap={{ scale: loading ? 1 : 0.98 }}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-700 text-white font-semibold shadow-lg shadow-emerald-700/30 hover:shadow-xl hover:shadow-emerald-700/40 disabled:opacity-70 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              {loading ? (
                <>
                  <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Signing Up...
                </>
              ) : (
                "Create An Account"
              )}
            </motion.button>

          </motion.form>
          <p className="text-center text-slate-500 text-sm font-medium tracking-wide">
            Have an account?{" "}
            <Link href="/login" className="text-emerald-400 hover:text-emerald-300 transition-colors font-bold ml-1 decoration-emerald-400/30 underline-offset-4 hover:underline">
              Sign in
            </Link>
          </p>

        </div>
      </motion.div>
    </div>
  );
}