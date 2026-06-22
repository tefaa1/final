// /** @type {import('tailwindcss').Config} */
// const { fontFamily } = require("tailwindcss/defaults");
// module.exports = {
//   // darkMode: "class", // IMPORTANT
//   content: [
//     "./app/**/*.{js,ts,jsx,tsx}",
//     "./components/**/*.{js,ts,jsx,tsx}",
//   ],
//   theme: {
//     extend: {
//        fontFamily: {
//         dm: ['"DM Serif Display"', 'serif'],
//         outfit: ['Outfit', 'sans-serif'],
//         roboto: ['Roboto', 'sans-serif'],
//         zen: ['"Zen Old Mincho"', 'serif'],
//       },
//     },
//   },
//   plugins: [],
// }


import { useState, useEffect, useCallback } from "react";

const theme = {
  bg: "#0d2018",
  bgCard: "#112a20",
  bgHover: "#1a3d2e",
  border: "#1e4535",
  borderLight: "#2a5c45",
  accent: "#10b981",
  accentHover: "#059669",
  accentGlow: "rgba(16,185,129,0.15)",
  success: "#34d399",
  warning: "#f59e0b",
  danger: "#ef4444",
  purple: "#5eead4",
  cyan: "#38bdf8",
  text: "#f0fdf4",
  textMuted: "#6b9e85",
  textSub: "#a7c4b5",
};

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --bg: ${theme.bg};
    --bg-card: ${theme.bgCard};
    --bg-hover: ${theme.bgHover};
    --border: ${theme.border};
    --border-light: ${theme.borderLight};
    --accent: ${theme.accent};
    --accent-hover: ${theme.accentHover};
    --accent-glow: ${theme.accentGlow};
    --success: ${theme.success};
    --warning: ${theme.warning};
    --danger: ${theme.danger};
    --purple: ${theme.purple};
    --cyan: ${theme.cyan};
    --text: ${theme.text};
    --text-muted: ${theme.textMuted};
    --text-sub: ${theme.textSub};
  }

  body {
    font-family: 'Outfit', sans-serif;
    background: linear-gradient(160deg, #0d2018 0%, #0f2d22 40%, #0c1f35 100%);
    color: var(--text);
    min-height: 100vh;
    overflow-x: hidden;
  }

  ::-webkit-scrollbar { width: 6px; height: 6px; }
  ::-webkit-scrollbar-track { background: var(--bg); }
  ::-webkit-scrollbar-thumb { background: var(--border-light); border-radius: 3px; }

  input, select, textarea {
    font-family: 'Outfit', sans-serif;
    font-size: 14px;
    background: rgba(16,185,129,0.06);
    border: 1px solid var(--border);
    color: var(--text);
    border-radius: 8px;
    padding: 10px 14px;
    width: 100%;
    outline: none;
    transition: all 0.2s;
  }
  input:focus, select:focus, textarea:focus {
    border-color: var(--accent);
    background: rgba(16,185,129,0.1);
    box-shadow: 0 0 0 3px var(--accent-glow);
  }
  select option { background: #1a3d2e; color: var(--text); }
  label { font-size: 13px; font-weight: 500; color: var(--text-sub); margin-bottom: 6px; display: block; }

  .btn {
    display: inline-flex; align-items: center; gap: 7px;
    padding: 9px 18px; border-radius: 8px; border: none;
    font-family: 'Outfit', sans-serif; font-size: 14px; font-weight: 600;
    cursor: pointer; transition: all 0.2s; white-space: nowrap;
  }
  .btn-primary { background: linear-gradient(135deg, #10b981, #0891b2); color: #fff; }
  .btn-primary:hover { background: linear-gradient(135deg, #059669, #0e7490); transform: translateY(-1px); box-shadow: 0 4px 20px rgba(16,185,129,0.4); }
  .btn-ghost { background: rgba(16,185,129,0.08); color: var(--text-sub); border: 1px solid var(--border); }
  .btn-ghost:hover { background: rgba(16,185,129,0.15); color: var(--text); border-color: var(--border-light); }
  .btn-danger { background: rgba(239,68,68,0.15); color: #f87171; border: 1px solid rgba(239,68,68,0.3); }
  .btn-danger:hover { background: rgba(239,68,68,0.25); }
  .btn-success { background: rgba(52,211,153,0.15); color: #34d399; border: 1px solid rgba(52,211,153,0.3); }
  .btn-success:hover { background: rgba(52,211,153,0.25); }
  .btn-sm { padding: 6px 12px; font-size: 13px; }
  .btn-icon { padding: 8px; width: 36px; height: 36px; justify-content: center; }

  .card {
    background: linear-gradient(145deg, rgba(17,42,32,0.95), rgba(12,31,53,0.85));
    border: 1px solid var(--border);
    border-radius: 14px;
    padding: 20px;
    backdrop-filter: blur(8px);
  }
  .card-hover { transition: all 0.2s; cursor: pointer; }
  .card-hover:hover { border-color: var(--accent); background: linear-gradient(145deg, rgba(26,61,46,0.95), rgba(15,40,70,0.85)); transform: translateY(-2px); box-shadow: 0 8px 24px rgba(16,185,129,0.15); }

  .badge {
    display: inline-flex; align-items: center; gap: 4px;
    padding: 3px 10px; border-radius: 20px; font-size: 11px; font-weight: 600;
    text-transform: uppercase; letter-spacing: 0.5px;
  }
  .badge-blue   { background: rgba(56,189,248,0.15);  color: #38bdf8; border: 1px solid rgba(56,189,248,0.3); }
  .badge-green  { background: rgba(52,211,153,0.15);  color: #34d399; border: 1px solid rgba(52,211,153,0.3); }
  .badge-red    { background: rgba(239,68,68,0.15);   color: #f87171; border: 1px solid rgba(239,68,68,0.3); }
  .badge-yellow { background: rgba(245,158,11,0.15);  color: #fbbf24; border: 1px solid rgba(245,158,11,0.3); }
  .badge-purple { background: rgba(94,234,212,0.15);  color: #5eead4; border: 1px solid rgba(94,234,212,0.3); }
  .badge-cyan   { background: rgba(56,189,248,0.15);  color: #7dd3fc; border: 1px solid rgba(56,189,248,0.3); }
  .badge-gray   { background: rgba(107,158,133,0.15); color: #a7c4b5; border: 1px solid rgba(107,158,133,0.3); }

  .table-wrap { overflow-x: auto; }
  table { width: 100%; border-collapse: collapse; }
  th { font-size: 11px; font-weight: 600; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.7px; padding: 10px 16px; border-bottom: 1px solid var(--border); text-align: left; }
  td { padding: 14px 16px; border-bottom: 1px solid var(--border); font-size: 14px; vertical-align: middle; }
  tr:last-child td { border-bottom: none; }
  tr:hover td { background: rgba(16,185,129,0.05); }

  .stat-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 14px; }
  .stat-card {
    background: linear-gradient(145deg, rgba(17,42,32,0.9), rgba(12,31,53,0.8));
    border: 1px solid var(--border); border-radius: 12px; padding: 18px 20px;
  }
  .stat-label { font-size: 12px; color: var(--text-muted); font-weight: 500; margin-bottom: 8px; }
  .stat-value { font-size: 28px; font-weight: 800; line-height: 1; }
  .stat-sub   { font-size: 12px; color: var(--text-muted); margin-top: 4px; }

  .form-grid   { display: grid; gap: 16px; }
  .form-grid-2 { grid-template-columns: 1fr 1fr; }
  .form-grid-3 { grid-template-columns: 1fr 1fr 1fr; }
  .form-group  { display: flex; flex-direction: column; gap: 6px; }

  .modal-overlay {
    position: fixed; inset: 0; background: rgba(0,0,0,0.75); backdrop-filter: blur(8px);
    display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 20px;
  }
  .modal {
    background: linear-gradient(145deg, #112a20, #0c1f35);
    border: 1px solid var(--border-light);
    border-radius: 18px; width: 100%; max-width: 640px; max-height: 90vh;
    overflow-y: auto; box-shadow: 0 25px 80px rgba(0,0,0,0.6), 0 0 40px rgba(16,185,129,0.1);
  }
  .modal-header { padding: 24px 28px 0; display: flex; align-items: center; justify-content: space-between; margin-bottom: 24px; }
  .modal-body   { padding: 0 28px 28px; }
  .modal-title  { font-size: 20px; font-weight: 700; }

  .page-header   { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 28px; flex-wrap: wrap; gap: 12px; }
  .page-title    { font-size: 28px; font-weight: 800; }
  .page-subtitle { font-size: 14px; color: var(--text-muted); margin-top: 4px; }

  .search-bar { display: flex; align-items: center; gap: 10px; background: rgba(16,185,129,0.06); border: 1px solid var(--border); border-radius: 10px; padding: 8px 14px; flex: 1; min-width: 200px; }
  .search-bar input { background: none; border: none; padding: 0; font-size: 14px; }
  .search-bar input:focus { box-shadow: none; }

  .filter-tabs { display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 20px; }
  .filter-tab { padding: 6px 16px; border-radius: 20px; font-size: 13px; font-weight: 500; cursor: pointer; border: 1px solid var(--border); color: var(--text-muted); background: transparent; transition: all 0.2s; }
  .filter-tab:hover { border-color: var(--accent); color: var(--text); }
  .filter-tab.active { background: linear-gradient(135deg, #10b981, #0891b2); color: #fff; border-color: transparent; }

  .pipeline-steps { display: flex; align-items: center; gap: 0; margin-bottom: 24px; }
  .pipeline-step { flex: 1; text-align: center; padding: 8px 4px; font-size: 12px; font-weight: 600; border-top: 3px solid var(--border); color: var(--text-muted); cursor: pointer; }
  .pipeline-step.active { border-color: var(--accent); color: var(--accent); }
  .pipeline-step.done   { border-color: var(--success); color: var(--success); }

  .empty-state  { text-align: center; padding: 60px 20px; color: var(--text-muted); }
  .empty-icon   { font-size: 48px; margin-bottom: 16px; opacity: 0.4; }
  .empty-title  { font-size: 18px; font-weight: 600; color: var(--text-sub); margin-bottom: 8px; }

  .alert-banner   { display: flex; align-items: center; gap: 12px; padding: 12px 16px; border-radius: 10px; margin-bottom: 16px; }
  .alert-info     { background: rgba(56,189,248,0.1);  border: 1px solid rgba(56,189,248,0.2); }
  .alert-warning  { background: rgba(245,158,11,0.1);  border: 1px solid rgba(245,158,11,0.2); }
  .alert-danger   { background: rgba(239,68,68,0.1);   border: 1px solid rgba(239,68,68,0.2); }
  .alert-success  { background: rgba(52,211,153,0.1);  border: 1px solid rgba(52,211,153,0.2); }

  .progress-bar  { background: var(--border); border-radius: 4px; height: 6px; overflow: hidden; }
  .progress-fill { height: 100%; border-radius: 4px; background: linear-gradient(90deg, #10b981, #0891b2); transition: width 0.5s ease; }

  .avatar { border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 700; flex-shrink: 0; }

  .sidebar-nav-item { display: flex; align-items: center; gap: 12px; padding: 10px 16px; border-radius: 10px; cursor: pointer; transition: all 0.2s; font-size: 14px; font-weight: 500; color: var(--text-muted); }
  .sidebar-nav-item:hover  { background: rgba(16,185,129,0.1); color: var(--text); }
  .sidebar-nav-item.active { background: rgba(16,185,129,0.15); color: var(--accent); border: 1px solid rgba(16,185,129,0.3); }
  .sidebar-section-title { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px; color: var(--text-muted); padding: 6px 16px; margin-top: 8px; }

  @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
  .fade-in { animation: fadeIn 0.3s ease; }

  @keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.5; } }
  .pulse { animation: pulse 2s infinite; }

  .tag  { display: inline-flex; align-items: center; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: 600; background: rgba(16,185,129,0.1); color: var(--text-sub); margin: 2px; }
  .chip { display: inline-flex; align-items: center; gap: 4px; padding: 4px 10px; border-radius: 6px; font-size: 12px; font-weight: 500; }
  .divider { border: none; border-top: 1px solid var(--border); margin: 20px 0; }
  .notification-dot { width: 8px; height: 8px; border-radius: 50%; background: var(--danger); }

  .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
  .grid-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 20px; }
  .grid-4 { display: grid; grid-template-columns: 1fr 1fr 1fr 1fr; gap: 16px; }

  @media (max-width: 768px) {
    .form-grid-2, .form-grid-3 { grid-template-columns: 1fr; }
    .grid-2, .grid-3, .grid-4  { grid-template-columns: 1fr; }
    .stat-grid  { grid-template-columns: 1fr 1fr; }
    .page-title { font-size: 22px; }
  }
`;
