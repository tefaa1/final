"use client";
import React from "react";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  Filler
);

const COLORS = [
  { border: "#10b981", bg: "rgba(16,185,129,0.12)" },
  { border: "#06b6d4", bg: "rgba(6,182,212,0.12)" },
  { border: "#8b5cf6", bg: "rgba(139,92,246,0.12)" },
  { border: "#f59e0b", bg: "rgba(245,158,11,0.12)" },
  { border: "#ef4444", bg: "rgba(239,68,68,0.12)" },
];

const LineChart = ({ data }) => {
  const safe = Array.isArray(data) ? data : [];

  // Group ratings by sportType (preserves insertion order).
  const grouped = {};
  safe.forEach((item) => {
    const sport = item?.sportType || "Unknown";
    if (!grouped[sport]) grouped[sport] = [];
    grouped[sport].push(Number(item?.averageRating) || 0);
  });

  const sports = Object.keys(grouped);
  const maxLen = sports.reduce((m, s) => Math.max(m, grouped[s].length), 0);

  if (sports.length === 0 || maxLen === 0) {
    return (
      <div className="h-48 flex items-center justify-center text-slate-500 text-xs uppercase tracking-[0.2em] font-bold">
        No analytics data yet
      </div>
    );
  }

  const labels = Array.from({ length: maxLen }, (_, i) => `M${i + 1}`);

  const datasets = sports.map((sport, i) => {
    const c = COLORS[i % COLORS.length];
    return {
      label: sport,
      data: grouped[sport],
      borderColor: c.border,
      backgroundColor: c.bg,
      fill: true,
      tension: 0.4,
      borderWidth: 2,
      pointRadius: 3,
      pointBackgroundColor: c.border,
      pointHoverRadius: 5,
    };
  });

  const chartData = { labels, datasets };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: "index", intersect: false },
    plugins: {
      legend: {
        position: "top",
        labels: {
          color: "#cbd5e1",
          font: { family: "Barlow Condensed", weight: "600", size: 12 },
          usePointStyle: true,
          padding: 16,
        },
      },
      tooltip: {
        backgroundColor: "#0f172a",
        titleColor: "#e2e8f0",
        bodyColor: "#cbd5e1",
        borderColor: "#1e293b",
        borderWidth: 1,
        padding: 10,
        titleFont: { family: "Barlow Condensed", weight: "700" },
        bodyFont: { family: "Barlow Condensed" },
      },
    },
    scales: {
      x: {
        grid: { color: "rgba(255,255,255,0.04)" },
        ticks: {
          color: "#64748b",
          font: { family: "Barlow Condensed", weight: "600", size: 11 },
        },
      },
      y: {
        grid: { color: "rgba(255,255,255,0.04)" },
        ticks: {
          color: "#64748b",
          font: { family: "Barlow Condensed", weight: "600", size: 11 },
        },
      },
    },
  };

  return (
    <div className="h-48">
      <Line data={chartData} options={options} />
    </div>
  );
};

export default LineChart;
