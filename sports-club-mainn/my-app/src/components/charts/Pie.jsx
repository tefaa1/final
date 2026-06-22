"use client";
import React from "react";
import { Pie } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";

ChartJS.register(ArcElement, Tooltip, Legend);

const PALETTE = [
  "#10b981", // emerald
  "#06b6d4", // cyan
  "#8b5cf6", // violet
  "#f59e0b", // amber
  "#ef4444", // red
  "#3b82f6", // blue
];

const PieChart = ({ data }) => {
  const safe = Array.isArray(data) ? data : [];

  const counts = {};
  safe.forEach((item) => {
    const sport = item?.sportType || "Unknown";
    counts[sport] = (counts[sport] || 0) + 1;
  });

  const labels = Object.keys(counts);
  const values = Object.values(counts);

  if (labels.length === 0) {
    return (
      <div className="h-48 flex items-center justify-center text-slate-500 text-xs uppercase tracking-[0.2em] font-bold">
        No distribution data yet
      </div>
    );
  }

  const chartData = {
    labels,
    datasets: [
      {
        data: values,
        backgroundColor: labels.map((_, i) => PALETTE[i % PALETTE.length]),
        borderColor: "#0f172a",
        borderWidth: 2,
        hoverOffset: 10,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "right",
        labels: {
          color: "#cbd5e1",
          font: { family: "Barlow Condensed", weight: "600", size: 12 },
          padding: 14,
          usePointStyle: true,
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
  };

  return (
    <div className="h-48">
      <Pie data={chartData} options={options} />
    </div>
  );
};

export default PieChart;
