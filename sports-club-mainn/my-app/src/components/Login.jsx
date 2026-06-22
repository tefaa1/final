"use client";
import React, { useState } from "react";
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
import { setToken } from "@/src/lib/auth"; 
import { jwtDecode } from "jwt-decode";
import Cookies from "js-cookie";

export default function Login() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [focused, setFocused] = useState({ username: false, password: false });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("http://localhost:8080/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "Invalid username or password");
        setLoading(false);
        return;
      }

      if (data.access_token) {
      
        setToken(data.access_token);

       
        const decoded = jwtDecode(data.access_token);
        console.log("Decoded Content:", decoded);

        const rawRole = decoded.realm_access?.roles?.[0] || "fan";
        const userRole = rawRole.toLowerCase();

        // Persist Keycloak user id (JWT "sub") so other pages
        // (Messages, ProfileTab, ...) can use it for filtering.
        if (decoded.sub) {
          localStorage.setItem("keycloakId", decoded.sub);
        }

        localStorage.setItem("user_role", userRole);
        Cookies.set("user_role", userRole, { expires: 7, path: "/" });

        localStorage.setItem(
          "user_info",
          JSON.stringify({
            username: username,
            keycloakId: decoded.sub,
            email: decoded.email,
            name: decoded.name,
            loginTime: new Date().toISOString(),
          }),
        );

        console.log("Login success! Redirecting...");

      
        window.location.href = "/dashboard";
      } else {
        setError("Token not received from server");
      }
    } catch (err) {
      setError(
        "Cannot connect to server. Make sure Docker services are running.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden flex">
 
      <div className="hidden lg:flex lg:w-[55%] relative">
        <Image
          src="/sportify/yy.jpg"
          alt="volleyball"
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
            className="flex items-center gap-3"
          >
            <Image
              src="/sportify/logo2-removebg-preview.png"
              alt="Sportify"
              width={100}
              height={100}
              className="object-contain"
            />
            <span className="text-7xl font-black italic bg-gradient-to-r from-emerald-500 via-teal-300 to-cyan-300 bg-clip-text text-transparent w-100">
              Sportify 
            </span>
          </motion.div>

          <motion.div className="space-y-4">
            <h1 className="text-5xl font-extrabold leading-tight">
              Your sports hub <br />
              reimagined.
            </h1>
            <p className="text-white/85 text-lg max-w-sm">
              Manage teams, track performance, and bring your club to the next
              level.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
              <FeatureCard
                icon={<UserGroupIcon className="h-7 w-7 text-white" />}
                text="Active players & staff"
              />
              <FeatureCard
                icon={<ChartBarIcon className="h-7 w-7 text-white" />}
                text="Performance tracking"
              />
              <FeatureCard
                icon={<TrophyIcon className="h-7 w-7 text-white" />}
                text="Multi-sport support"
              />
              <FeatureCard
                icon={<ShieldCheckIcon className="h-7 w-7 text-white" />}
                text="Role-based access"
              />
            </div>
          </motion.div>

          <div className="flex gap-6 text-sm">
            <span className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-300 animate-pulse" />
              Secure System
            </span>
          </div>
        </div>
      </div>

    
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className="flex-1 flex items-center justify-center p-6 bg-slate-950"
      >
        <div className="w-full max-w-md space-y-8">
          <div className="text-center">
            <h2 className="text-4xl font-black bg-gradient-to-r from-emerald-400 to-cyan-300 bg-clip-text text-transparent">
              Welcome back
            </h2>
            <p className="text-slate-500 mt-2 font-medium">
              Sign in to continue to your dashboard
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center gap-2"
              >
                <span>⚠️</span> {error}
              </motion.div>
            )}

            <div className="space-y-2">
              <label className="block text-xs font-black uppercase text-slate-500 tracking-widest">
                Username
              </label>
              <div
                className={`relative rounded-2xl border bg-slate-900/50 transition-all ${focused.username ? "border-emerald-500 ring-4 ring-emerald-500/10" : "border-slate-800"}`}
              >
                <input
                  type="text"
                  placeholder="admin"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  onFocus={() => setFocused((f) => ({ ...f, username: true }))}
                  onBlur={() => setFocused((f) => ({ ...f, username: false }))}
                  className="w-full px-4 py-3.5 rounded-2xl outline-none bg-transparent text-slate-200" // تم تغيير اللون لـ slate-200
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-black uppercase text-slate-500 tracking-widest">
                Password
              </label>
              <div
                className={`relative rounded-2xl border bg-slate-900/50 transition-all ${focused.password ? "border-emerald-500 ring-4 ring-emerald-500/10" : "border-slate-800"}`}
              >
                <input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onFocus={() => setFocused((f) => ({ ...f, password: true }))}
                  onBlur={() => setFocused((f) => ({ ...f, password: false }))}
                  className="w-full px-4 py-3.5 rounded-2xl outline-none bg-transparent text-slate-200"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-700 text-white font-bold shadow-lg shadow-emerald-900/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 text-xl"
            >
              {loading ? "Connecting..." : "Sign In"}
            </button>
          </form>

          <p className="text-center text-slate-500 text-sm">
            Don't have an account?{" "}
            <Link
              href="/signup"
              className="text-emerald-400 font-bold hover:underline"
            >
              Create One
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
