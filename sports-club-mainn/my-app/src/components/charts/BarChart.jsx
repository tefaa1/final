"use client";
import React from "react";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

const COLORS = [
  "#10b981", // emerald
  "#06b6d4", // cyan
  "#8b5cf6", // violet
  "#f59e0b", // amber
  "#ef4444", // red
  "#3b82f6", // blue
];

const BarChart = ({ data, label = "Count" }) => {
  // data shape: [{ name: string, value: number }, ...]
  const safe = Array.isArray(data) ? data : [];

  if (safe.length === 0) {
    return (
      <div className="h-48 flex items-center justify-center text-slate-500 text-xs uppercase tracking-[0.2em] font-bold">
        No data yet
      </div>
    );
  }

  const chartData = {
    labels: safe.map((d) => d.name),
    datasets: [
      {
        label,
        data: safe.map((d) => Number(d.value) || 0),
        backgroundColor: safe.map((_, i) => COLORS[i % COLORS.length]),
        borderRadius: 6,
        borderSkipped: false,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
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
        grid: { display: false },
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
          precision: 0,
        },
        beginAtZero: true,
      },
    },
  };

  return (
    <div className="h-48">
      <Bar data={chartData} options={options} />
    </div>
  );
};

export default BarChart;
