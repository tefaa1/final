"use client";

import React, { useState, useEffect } from "react";
import {
  FiShield, FiUser, FiLogOut, FiGrid, FiUsers, FiBriefcase, FiActivity, FiCalendar,
  FiHeart, FiSearch, FiFileText, FiTrendingUp, FiBarChart2, FiPieChart, FiGift,
  FiMail, FiBell, FiSettings, FiCpu, FiStar, FiAward, FiGlobe,
} from "react-icons/fi";
import { MdOutlineSportsVolleyball, MdOutlineEmojiEvents, MdCompareArrows } from "react-icons/md";
import { useRouter, usePathname } from "next/navigation";
import Cookies from 'js-cookie';
import NotificationBell from "./NotificationBell";

// A segment is "raw" (an id we must never show) when it is purely numeric or
// looks like a uuid / long hex / opaque token.
const isRawSegment = (seg) =>
  /^\d+$/.test(seg) ||
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(seg) ||
  /^[0-9a-f]{16,}$/i.test(seg);

const titleCase = (slug) =>
  slug
    .replace(/-/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());

// Derive a friendly page key + label from the URL, never exposing a raw id.
// Walks segments after "dashboard"; ignores trailing raw-id/action segments
// and falls back to the nearest named section (e.g. /competitions/17 -> the
// "competitions" section). /dashboard alone -> dashboard.
function derivePage(pathname) {
  const parts = (pathname || "").split("/").filter(Boolean);
  const dashIdx = parts.indexOf("dashboard");
  const tail = dashIdx >= 0 ? parts.slice(dashIdx + 1) : parts;

  if (tail.length === 0) return { key: "dashboard", label: "Dashboard" };

  // The section is the first named segment under /dashboard — this is the
  // stable label and icon key for any detail/sub route.
  const section = tail.find((s) => !isRawSegment(s)) || "dashboard";
  return { key: section, label: titleCase(section) };
}

// Icon for the page shown in the top bar (matches the sidebar). Keyed by the
// last URL segment.
const PAGE_ICONS = {
  dashboard: FiGrid, club: FiShield, trophies: MdOutlineEmojiEvents, "world-cup": FiGlobe, players: FiUsers,
  users: FiShield, staff: FiBriefcase, teams: MdOutlineSportsVolleyball, training: FiActivity,
  matches: FiCalendar, competitions: FiAward, "head-to-head": MdCompareArrows, medical: FiHeart, scouting: FiSearch,
  "scouting-ops": FiSearch, contracts: FiFileText, analytics: FiTrendingUp,
  "analytics-detail": FiTrendingUp, "training-analytics": FiBarChart2, reports: FiPieChart,
  sponsors: FiGift, messages: FiMail, alerts: FiBell, settings: FiSettings,
  "ml-predict": FiCpu, "ml-rating": FiStar,
};

const ROLE_LABELS = {
  admin:               "Admin",
  sport_manager:       "Sport Manager",
  team_manager:        "Team Manager",
  head_coach:          "Head Coach",
  assistant_coach:     "Assistant Coach",
  specific_coach:      "Specific Coach",
  fitness_coach:       "Fitness Coach",
  performance_analyst: "Performance Analyst",
  team_doctor:         "Team Doctor",
  doctor:              "Doctor",
  physiotherapist:     "Physiotherapist",
  scout:               "Scout",
  sponsor:             "Sponsor",
  fan:                 "Fan",
  player:              "Player",
  national_team:       "National Team",
  staff:               "Staff",
};

const Navbar = ({ isSidebarOpen, currentPage, user }) => {
  const router = useRouter();
  const pathname = usePathname();
  const [roleLabel, setRoleLabel] = useState("");
  const [displayName, setDisplayName] = useState("User");

  useEffect(() => {
    const role = localStorage.getItem("user_role")?.toLowerCase() || "";
    setRoleLabel(ROLE_LABELS[role] || role.replace(/_/g, " ") || "Guest");

    // Pull a display name from the decoded JWT or fall back to the username.
    try {
      const info = JSON.parse(localStorage.getItem("user_info") || "{}");
      if (info.username) setDisplayName(info.username);
    } catch {
      // ignore
    }
  }, []);

  const handleLogout = () => {
    Cookies.remove('user_role', { path: '/' });
    Cookies.remove('token', { path: '/' });

    localStorage.removeItem("user_role");
    localStorage.removeItem("user_info");
    localStorage.removeItem("token");

    window.location.href = "/login";
  };

  // Derive the page label from the live pathname so a raw id route segment
  // (e.g. /competitions/17 or /matches/54/live) never shows in the top bar.
  // Falls back to the passed-in prop if pathname is unavailable (SSR safety).
  const { key: pageKey, label: prettyPage } = derivePage(
    pathname || (currentPage ? `/dashboard/${currentPage}` : "/dashboard")
  );

  return (
    <div className="bg-[var(--bg-card)]/95 backdrop-blur-md border-b border-[var(--border)] px-6 py-4 transition-all duration-300 ease-in-out sticky top-0 z-100">
      <div className="flex justify-between items-center">

        {/* Left */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500/20 to-cyan-500/10 border border-emerald-500/25 flex items-center justify-center">
            {(() => { const PageIcon = PAGE_ICONS[pageKey] || FiGrid; return <PageIcon className="text-[var(--accent)] text-lg" strokeWidth={2.5} />; })()}
          </div>
          <div className="flex flex-col leading-tight">
            <h3 className="uppercase text-lg text-[var(--text)] font-extrabold tracking-wide">
              {prettyPage}
            </h3>
            <span className="text-[var(--text-muted)] text-[11px] uppercase tracking-[0.18em] font-semibold">
              {roleLabel || "—"}
            </span>
          </div>
        </div>

        {/* Right */}
        <div className="flex items-center gap-3">

          {/* Notification bell */}
          <NotificationBell />

          {/* Logout button */}
          <button
            type="button"
            onClick={handleLogout}
            className="flex items-center gap-2 text-sm  font-semibold text-red-400 hover:text-red-300 hover:bg-red-500/10  px-4 py-2 rounded-lg transition-all cursor-pointer"
            title="Logout"
          >
            <FiLogOut strokeWidth={2.5} />
            <span className="hidden sm:block">Logout</span>
          </button>

          {/* User Profile */}
          <div className="flex items-center gap-2.5 cursor-pointer hover:bg-slate-800/60 border border-transparent hover:border-[var(--border)] px-3 py-1.5 rounded-lg transition">
            {user?.image ? (
              <img
                src={user.image}
                alt="profile"
                className="w-9 h-9 rounded-full object-cover border border-[var(--border)]"
              />
            ) : (
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-emerald-500/25 to-cyan-500/15 border border-emerald-500/30 flex items-center justify-center">
                <FiUser className="text-emerald-300 text-base" strokeWidth={2.5} />
              </div>
            )}
            <span className="text-sm font-semibold text-[var(--text)] hidden sm:block tracking-wide">
              {user?.name || displayName}
            </span>
          </div>

        </div>
      </div>

      {/* Gradient line */}
      <div className="h-[2px] w-full bg-gradient-to-r from-emerald-500 via-cyan-500 to-transparent mt-3 opacity-50" />
    </div>
  );
};

export default Navbar;
