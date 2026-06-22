"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import React, { useState, useEffect } from "react";
import {
  FiGrid, FiUsers, FiShield, FiBriefcase,
  FiActivity, FiCalendar, FiHeart, FiClipboard, FiSearch,
  FiFileText, FiTrendingUp, FiBarChart2, FiPieChart,
  FiDollarSign, FiGift, FiImage, FiMail, FiBell, FiSettings,
  FiX, FiMenu, FiCpu, FiStar, FiAward, FiGlobe,
} from "react-icons/fi";
import { MdOutlineSportsVolleyball, MdOutlineEmojiEvents, MdCompareArrows } from "react-icons/md";
import { SIDEBAR_SECTIONS, canAccess } from "@/src/lib/permissions";

// Maps each route to its Feather icon. Kept here (UI concern) so the
// permissions module stays icon-library-agnostic.
const ICONS = {
  "/dashboard":                    FiGrid,
  "/dashboard/club":               FiShield,
  "/dashboard/trophies":           MdOutlineEmojiEvents,
  "/dashboard/world-cup":          FiGlobe,
  "/dashboard/players":            FiUsers,
  "/dashboard/users":              FiShield,
  "/dashboard/staff":              FiBriefcase,
  "/dashboard/teams":              MdOutlineSportsVolleyball,
  "/dashboard/training":           FiActivity,
  "/dashboard/matches":            FiCalendar,
  "/dashboard/competitions":       FiAward,
  "/dashboard/head-to-head":       MdCompareArrows,
  "/dashboard/medical":            FiHeart,
  "/dashboard/scouting":           FiSearch,
  "/dashboard/contracts":          FiFileText,
  "/dashboard/analytics":          FiTrendingUp,
  "/dashboard/training-analytics": FiBarChart2,
  "/dashboard/reports":            FiPieChart,
  "/dashboard/finance":            FiDollarSign,
  "/dashboard/sponsors":           FiGift,
  "/dashboard/media":              FiImage,
  "/dashboard/messages":           FiMail,
  "/dashboard/alerts":             FiBell,
  "/dashboard/settings":           FiSettings,
  "/dashboard/ml-predict":         FiCpu,
  "/dashboard/ml-rating":          FiStar,
};

const Sidebar = ({ onSidebarToggle }) => {
  const pathname = usePathname();
  // Static sidebar: open by default, collapse to an icon rail with the button.
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [userRole, setUserRole] = useState("");

  const expanded = isSidebarOpen;

  useEffect(() => {
    const savedRole = localStorage.getItem("user_role");
    setUserRole(savedRole ? savedRole.toLowerCase() : "fan");
  }, []);

  const handleToggle = () => {
    const newState = !isSidebarOpen;
    setIsSidebarOpen(newState);
    if (onSidebarToggle) onSidebarToggle(newState);
  };

  return (
    <aside
      className={`
        fixed left-0 top-0 h-screen z-50 transition-all duration-300 ease-in-out
        bg-gradient-to-b from-slate-950 via-slate-900 to-emerald-950/40
        overflow-y-auto sidebar-scrollbar border-r border-emerald-500/10
        ${expanded ? "w-64" : "w-20"}
      `}
    >
      {/* Header Section */}
      <div className="px-4 py-5 border-b border-emerald-500/15 mb-4 sticky top-0 bg-slate-950/85 backdrop-blur-md z-10">
        <div className={`flex items-center ${expanded ? "justify-between" : "justify-center"}`}>
          {/* Logo doubles as the toggle (so you can expand from the icon rail) */}
          <button onClick={handleToggle} aria-label="Toggle sidebar" className="flex items-center gap-3 group min-w-0">
            {/* Bare logo — no square/box around it, just the mark. */}
            <span className="grid place-items-center w-11 h-11 shrink-0 group-hover:scale-105 transition-transform">
              <img src="/sportify/logo2-removebg-preview.png" alt="MSCMS" className="w-11 h-11 object-contain" />
            </span>
            {expanded && (
              <span className="flex flex-col leading-none min-w-0">
                <span className="text-2xl font-extrabold text-white tracking-[0.18em] uppercase truncate">
                  MSCMS
                </span>
                <span className="text-[8px] font-bold uppercase tracking-[0.3em] text-amber-400/80 truncate">
                  Més que un club
                </span>
              </span>
            )}
          </button>
          {expanded && (
            <button
              onClick={handleToggle}
              aria-label="Collapse sidebar"
              className="text-slate-300 hover:text-white hover:bg-emerald-500/15 p-2 rounded-lg transition-all"
            >
              <FiX className="text-lg" strokeWidth={2.5} />
            </button>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="px-2 pb-10">
        {SIDEBAR_SECTIONS.map((section) => {
          const visibleItems = section.items.filter((item) =>
            userRole ? canAccess(item.href, userRole) : false
          );

          if (visibleItems.length === 0) return null;

          return (
            <div key={section.title} className="mb-6">
              {expanded && (
                <h3 className="px-4 mb-2 text-[11px] font-extrabold uppercase text-emerald-400/70 tracking-[0.22em]">
                  {section.title}
                </h3>
              )}
              <div className="space-y-1">
                {visibleItems.map((item) => {
                  const isActive = pathname === item.href;
                  const Icon = ICONS[item.href] || FiGrid;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`
                        relative flex items-center transition-all duration-200 group
                        ${isActive
                          ? "bg-gradient-to-r from-emerald-500/25 to-emerald-500/5 text-white"
                          : "text-slate-400 hover:bg-slate-800/60 hover:text-emerald-200"}
                        ${expanded ? "px-4 py-2.5 gap-3 rounded-lg mx-2" : "justify-center py-3 mx-2 rounded-lg"}
                      `}
                      title={!expanded ? item.name : ""}
                    >
                      {isActive && (
                        <span className="absolute left-0 top-1/2 -translate-y-1/2 h-7 w-[3px] rounded-r-full bg-gradient-to-b from-emerald-300 to-cyan-400 shadow-[0_0_10px_rgba(16,185,129,0.7)]" />
                      )}
                      <Icon
                        className={`text-lg shrink-0 transition-transform group-hover:scale-110 ${isActive ? "text-emerald-300" : "group-hover:text-emerald-300"}`}
                        strokeWidth={isActive ? 2.4 : 2}
                      />
                      {expanded && (
                        <span className={`text-[15px] tracking-wide ${isActive ? "font-semibold" : "font-medium"}`}>
                          {item.name}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}
      </nav>
    </aside>
  );
};

export default Sidebar;
