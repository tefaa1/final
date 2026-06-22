"use client";
import React, { useState, useEffect } from "react";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from "recharts";
import {
  Euro, CreditCard, TrendingUp, Clock,
  ArrowUpRight, ArrowDownRight, Search, FileDown, PlugZap
} from "lucide-react";
import { api } from "@/src/lib/api"; // استيراد الربط الموحد

const pieColors = ["#10b981", "#3b82f6", "#f59e0b", "#6366f1"];

export default function Finance() {
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("All Time");
  const [transactions, setTransactions] = useState([]);
  const [financeStats, setFinanceStats] = useState(null);
  const [loading, setLoading] = useState(true);
  // The Finance microservice (/transactions, /finance/summary) is not
  // deployed yet. We track that so the page can degrade to a friendly
  // "not connected" empty state instead of rendering broken charts.
  const [connected, setConnected] = useState(true);

  // 1. جلب البيانات المالية
  const fetchFinanceData = async () => {
    try {
      setLoading(true);
      const [transData, summaryData] = await Promise.all([
        api.getTransactions(),
        api.getFinanceSummary()
      ]);
      setTransactions(Array.isArray(transData) ? transData : transData?.content || []);
      setFinanceStats(summaryData);
      setConnected(true);
    } catch (err) {
      console.error("Finance Fetch Error:", err);
      // Backend missing → flip to empty state, don't crash.
      setConnected(false);
      setTransactions([]);
      setFinanceStats(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFinanceData();
  }, []);

  // فلترة المعاملات بناءً على البحث والتبويب
  const filteredTransactions = transactions.filter(t => {
    const matchesSearch = t.title?.toLowerCase().includes(search.toLowerCase());
    const matchesTab = activeTab === "All Time" ||
                       (activeTab === "Income" && t.type === "income") ||
                       (activeTab === "Expenses" && t.type === "expense");
    return matchesSearch && matchesTab;
  });

  return (
    <div className="bg-slate-950 min-h-screen p-6 overflow-y-auto w-full">
      <div className="max-w-7xl mx-auto space-y-10">

        {/* Gradient Banner */}
        <div className="relative overflow-hidden rounded-3xl border border-slate-800 bg-gradient-to-r from-[#0a1a3f] via-slate-900 to-[#3b0a2a] p-8 shadow-2xl">
          <div className="absolute -right-10 -top-10 w-56 h-56 rounded-full bg-emerald-500/10 blur-3xl" />
          <div className="absolute -left-10 -bottom-16 w-56 h-56 rounded-full bg-blue-500/10 blur-3xl" />
          <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
            <div>
              <h1 className="text-4xl font-black text-slate-100 tracking-tight mb-2">Financial Management</h1>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">FC Barcelona · Budget & Cashflow tracking</p>
            </div>
            <button className="px-6 py-3 bg-emerald-600/10 border border-emerald-500/20 text-emerald-400 rounded-xl hover:bg-emerald-600 hover:text-white transition-all font-black text-[10px] uppercase tracking-widest flex items-center gap-2 shadow-lg shadow-emerald-500/10 disabled:opacity-40 disabled:cursor-not-allowed" disabled={!connected}>
              <FileDown size={14} /> Export Report
            </button>
          </div>
        </div>

        {loading ? (
          <LoadingPanel label="Processing Ledgers..." />
        ) : !connected ? (
          <NotConnected />
        ) : (
          <>
            {/* Dynamic Stats Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { title: "Total Revenue", value: `€${financeStats?.totalRevenue || 0}K`, icon: Euro, color: "text-emerald-500" },
                { title: "Total Expenses", value: `€${financeStats?.totalExpenses || 0}K`, icon: CreditCard, color: "text-rose-500" },
                { title: "Net Income", value: `€${(financeStats?.totalRevenue - financeStats?.totalExpenses) || 0}K`, icon: TrendingUp, color: "text-blue-500" },
                { title: "Active Budget", value: financeStats?.budgetUtilization || "0%", icon: Clock, color: "text-amber-500" },
              ].map((s, i) => (
                <div key={i} className="bg-slate-900/50 p-6 rounded-2xl border border-slate-800 hover:border-slate-700 transition-all group">
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">{s.title}</p>
                  <div className="flex justify-between items-end">
                    <h3 className="text-2xl font-black text-slate-100">{s.value}</h3>
                    <div className={`p-3 rounded-xl bg-slate-950 border border-slate-800 ${s.color}`}>
                      <s.icon size={20} />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Revenue Line Chart */}
              <div className="bg-slate-900/50 p-8 rounded-2xl border border-slate-800 shadow-2xl">
                <h2 className="text-xs font-black uppercase tracking-[0.2em] text-slate-500 mb-6">Cashflow Trend</h2>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={financeStats?.monthlyData || []}>
                      <XAxis dataKey="month" stroke="#475569" fontSize={10} axisLine={false} tickLine={false} />
                      <YAxis stroke="#475569" fontSize={10} axisLine={false} tickLine={false} tickFormatter={(v) => `€${v}k`} />
                      <Tooltip contentStyle={{ backgroundColor: '#020617', border: '1px solid #1e293b', borderRadius: '12px' }} />
                      <Line type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={4} dot={false} />
                      <Line type="monotone" dataKey="expenses" stroke="#ef4444" strokeWidth={4} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Expense Allocation */}
              <div className="bg-slate-900/50 p-8 rounded-2xl border border-slate-800 shadow-2xl">
                <h2 className="text-xs font-black uppercase tracking-[0.2em] text-slate-500 mb-6">Expense Breakdown</h2>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={financeStats?.breakdown || []} dataKey="value" innerRadius={70} outerRadius={90} paddingAngle={5}>
                        {financeStats?.breakdown?.map((entry, index) => (
                          <Cell key={index} fill={pieColors[index % pieColors.length]} stroke="transparent" />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Transactions Table */}
            <div className="bg-slate-900/50 p-8 rounded-2xl border border-slate-800">
              <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
                <h2 className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">Recent Transactions</h2>
                <div className="relative w-full md:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={14} />
                  <input
                    type="text"
                    placeholder="Search..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 pl-10 pr-4 text-[10px] text-white uppercase font-black"
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
              </div>

              {filteredTransactions.length === 0 ? (
                <p className="text-center py-10 text-slate-600 font-black uppercase text-[10px] tracking-widest">No transactions to display</p>
              ) : (
                <div className="space-y-3">
                  {filteredTransactions.map((t, i) => (
                    <div key={i} className="flex items-center justify-between bg-slate-950/40 p-4 rounded-xl border border-slate-900 hover:border-emerald-500/30 transition-all group">
                      <div className="flex items-center gap-4">
                        <div className={`p-2 rounded-lg ${t.type === 'income' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
                          {t.type === 'income' ? <ArrowUpRight size={16}/> : <ArrowDownRight size={16}/>}
                        </div>
                        <div>
                          <p className="text-sm font-black text-slate-100 uppercase">{t.title}</p>
                          <p className="text-[9px] font-bold text-slate-600 uppercase">{t.date}</p>
                        </div>
                      </div>
                      <p className={`text-sm font-black ${t.type === 'income' ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {t.type === 'income' ? '+' : '-'}€{t.amount?.toLocaleString()}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function LoadingPanel({ label }) {
  return (
    <div className="text-center py-24 text-slate-500 font-black uppercase text-[10px] tracking-[0.3em] animate-pulse">
      {label}
    </div>
  );
}

// Friendly empty state shown when the Finance microservice isn't reachable.
function NotConnected() {
  return (
    <div className="relative overflow-hidden rounded-3xl border border-slate-800 bg-slate-900/40 px-8 py-20 text-center">
      <div className="absolute -right-10 -top-10 w-56 h-56 rounded-full bg-emerald-500/5 blur-3xl" />
      <div className="relative max-w-md mx-auto flex flex-col items-center">
        <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-6">
          <PlugZap size={30} />
        </div>
        <h3 className="text-xl font-black text-slate-100 mb-3">Finance service not connected</h3>
        <p className="text-sm text-slate-400 leading-relaxed mb-6">
          The financial ledger microservice isn&apos;t available yet. Once the
          Finance backend is deployed, revenue, expenses and transactions will
          appear here automatically — no further setup required.
        </p>
        <span className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
          Awaiting backend
        </span>
      </div>
    </div>
  );
}
