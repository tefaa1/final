"use client";
import React, { useEffect, useMemo, useState } from "react";
import { BarChart3, Activity, Clock } from "lucide-react";
import { MdInsights } from "react-icons/md";
import { api } from "@/src/lib/api";
import { PageHeader } from "@/src/components/shared/SharedComponents";
import { lookupTeam, displayTeamName } from "@/src/lib/teamDirectory";

const unwrap = (r) => (Array.isArray(r) ? r : r?.data || r?.content || []);

export default function TrainingAnalytics() {
  const [sessions, setSessions] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [drills, setDrills] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [s, a, d] = await Promise.allSettled([
          api.getTrainingSessions(),
          api.getAttendance(),
          api.getTrainingDrills(),
        ]);
        setSessions(s.status === "fulfilled" ? unwrap(s.value) : []);
        setAttendance(a.status === "fulfilled" ? unwrap(a.value) : []);
        setDrills(d.status === "fulfilled" ? unwrap(d.value) : []);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Build per-team KPI rows from real sessions + attendance.
  const analytics = useMemo(() => {
    // attendance grouped by session id
    const attBySession = attendance.reduce((m, a) => {
      const k = String(a.trainingSessionId);
      (m[k] ||= []).push(a);
      return m;
    }, {});
    const drillBySession = drills.reduce((m, d) => {
      const k = String(d.trainingSessionId);
      (m[k] ||= []).push(d);
      return m;
    }, {});

    const byTeam = {};
    sessions.forEach((s) => {
      const teamId = s.teamId ?? 0;
      const g = (byTeam[teamId] ||= {
        teamId,
        sessions: 0,
        minutes: 0,
        present: 0,
        attTotal: 0,
        injuries: 0,
        intensitySum: 0,
        intensityN: 0,
      });
      g.sessions += 1;
      g.minutes += Number(s.durationMinutes) || 0;

      const att = attBySession[String(s.id)] || [];
      att.forEach((a) => {
        g.attTotal += 1;
        const st = String(a.status).toUpperCase();
        if (["PRESENT", "LATE"].includes(st)) g.present += 1;
        // Injuries logged during the period (attendance marked INJURED).
        if (st === "INJURED") g.injuries += 1;
      });
      (drillBySession[String(s.id)] || []).forEach((d) => {
        if (d.intensity != null) { g.intensitySum += Number(d.intensity); g.intensityN += 1; }
      });
    });

    return Object.values(byTeam)
      .map((g) => {
        const team = lookupTeam(g.teamId);
        const attendancePct = g.attTotal ? Math.round((g.present / g.attTotal) * 100) : 0;
        // Performance = avg real drill intensity (1-10). No fabricated fallback:
        // when no drill carries intensity, performance is null and renders "—".
        const performance = g.intensityN
          ? Number((g.intensitySum / g.intensityN).toFixed(1))
          : null;
        return {
          id: g.teamId,
          team: displayTeamName(g.teamId, "Club"),
          sport: team?.sport || "Football",
          sessions: g.sessions,
          attendance: attendancePct,
          performance,
          injuries: g.injuries,
          hours: Math.round(g.minutes / 60),
          hasAttendance: g.attTotal > 0,
          hasPerformance: performance != null,
        };
      })
      .sort((a, b) => b.sessions - a.sessions);
  }, [sessions, attendance, drills]);

  const totalSessions = analytics.reduce((s, a) => s + a.sessions, 0);
  const teamsWithAtt = analytics.filter((a) => a.hasAttendance);
  const avgAttendance = teamsWithAtt.length
    ? Math.round(teamsWithAtt.reduce((s, a) => s + a.attendance, 0) / teamsWithAtt.length)
    : 0;
  const teamsWithPerf = analytics.filter((a) => a.hasPerformance);
  const avgPerformance = teamsWithPerf.length
    ? teamsWithPerf.reduce((s, a) => s + a.performance, 0) / teamsWithPerf.length
    : null;
  const totalHours = analytics.reduce((s, a) => s + a.hours, 0);
  const totalInjuries = analytics.reduce((s, a) => s + a.injuries, 0);

  return (
    <div className="w-full h-full bg-slate-950 p-6 overflow-y-auto">
      <div className="max-w-6xl mx-auto space-y-8">
        <PageHeader
          title="Training Analytics"
          subtitle="Performance metrics and training-load analysis"
          icon={MdInsights}
          action={
            !loading && analytics.length > 0 ? (
              <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-950/40 border border-white/10 text-[10px] font-black uppercase tracking-[0.18em] text-slate-300">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                {analytics.length} {analytics.length === 1 ? "Team" : "Teams"} tracked
              </span>
            ) : null
          }
        />

        {loading ? (
          <div className="text-center py-20 text-slate-500 font-black uppercase text-[10px] tracking-widest italic animate-pulse">
            Loading analytics…
          </div>
        ) : analytics.length === 0 ? (
          <div className="text-center py-20">
            <BarChart3 size={42} className="mx-auto mb-4 text-slate-700" />
            <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">No training data to analyse yet</p>
          </div>
        ) : (
          <>
            {/* Top stats */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
              <div className="bg-slate-900/50 rounded-2xl p-6 border border-slate-800 shadow-sm hover:border-emerald-500/30 transition-all group">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 group-hover:text-slate-400">Total sessions</p>
                <p className="text-3xl font-black text-slate-100">{totalSessions}</p>
              </div>
              <div className="bg-slate-900/50 rounded-2xl p-6 border border-slate-800 shadow-sm hover:border-emerald-500/30 transition-all group">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 group-hover:text-slate-400">Avg attendance</p>
                <p className="text-3xl font-black text-emerald-500">{avgAttendance}%</p>
              </div>
              <div className="bg-slate-900/50 rounded-2xl p-6 border border-slate-800 shadow-sm hover:border-emerald-500/30 transition-all group">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 group-hover:text-slate-400">Avg performance</p>
                <p className="text-3xl font-black text-sky-500">
                  {avgPerformance != null
                    ? <>{avgPerformance.toFixed(1)}<span className="text-sm font-medium text-slate-600">/10</span></>
                    : <span className="text-slate-600">—</span>}
                </p>
              </div>
              <div className="bg-slate-900/50 rounded-2xl p-6 border border-slate-800 shadow-sm hover:border-rose-500/30 transition-all group">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 group-hover:text-slate-400">Injuries (period)</p>
                <p className={`text-3xl font-black ${totalInjuries > 0 ? "text-rose-500" : "text-slate-400"}`}>{totalInjuries}</p>
              </div>
              <div className="bg-slate-900/50 rounded-2xl p-6 border border-slate-800 shadow-sm hover:border-emerald-500/30 transition-all group">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 group-hover:text-slate-400">Total hours</p>
                <p className="text-3xl font-black text-violet-500">{totalHours}<span className="text-sm font-medium text-slate-600">h</span></p>
              </div>
            </div>

            {/* Per-team cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {analytics.map((a) => {
                const team = lookupTeam(a.id);
                return (
                  <div
                    key={a.id}
                    className="bg-slate-900/30 rounded-2xl p-6 border border-slate-800 shadow-sm hover:border-emerald-500/30 transition-all group"
                  >
                    <div className="flex justify-between items-start mb-6">
                      <div className="flex items-center gap-3 min-w-0">
                        {team?.crestUrl
                          ? <img src={team.crestUrl} alt="" className="w-10 h-10 object-contain shrink-0" />
                          : <span className="text-2xl shrink-0">{team?.crest || "🏟️"}</span>}
                        <div className="min-w-0">
                          <p className="text-[10px] font-black uppercase tracking-widest text-emerald-500/70 mb-0.5">{a.sport}</p>
                          <h3 className="text-xl font-bold text-slate-100 truncate">{a.team}</h3>
                        </div>
                      </div>
                      <span className="rounded-lg bg-emerald-500/10 text-emerald-500 text-[10px] font-black uppercase tracking-widest px-3 py-1.5 flex items-center gap-2 border border-emerald-500/20 shrink-0">
                        <BarChart3 size={14} /> Training KPI
                      </span>
                    </div>

                    <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
                      <div className="bg-slate-950/50 p-3 rounded-xl border border-slate-800/50">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">Sessions</p>
                        <p className="text-lg font-black text-slate-200">{a.sessions}</p>
                      </div>
                      <div className="bg-slate-950/50 p-3 rounded-xl border border-slate-800/50">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">Attendance</p>
                        <p className="text-lg font-black text-emerald-500">{a.hasAttendance ? `${a.attendance}%` : "—"}</p>
                      </div>
                      <div className="bg-slate-950/50 p-3 rounded-xl border border-slate-800/50">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">Rating</p>
                        <p className="text-lg font-black text-sky-500">{a.hasPerformance ? `${a.performance}/10` : <span className="text-slate-600">—</span>}</p>
                      </div>
                      <div className="bg-slate-950/50 p-3 rounded-xl border border-slate-800/50">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">Injuries</p>
                        <p className={`text-lg font-black ${a.injuries > 0 ? "text-rose-500" : "text-slate-400"}`}>{a.injuries}</p>
                      </div>
                      <div className="bg-slate-950/50 p-3 rounded-xl border border-slate-800/50">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">Hours</p>
                        <p className="text-lg font-black text-violet-500">{a.hours}h</p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="space-y-2">
                        <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-slate-500">
                          <span className="flex items-center gap-2">
                            <Activity size={14} className="text-emerald-500" /> Relative Load
                          </span>
                          <span className="text-slate-300">{Math.round((a.sessions * Math.max(a.attendance, 50)) / 2)} <span className="text-slate-600">AU</span></span>
                        </div>
                        <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"
                            style={{ width: `${Math.max(a.attendance, 8)}%` }}
                          />
                        </div>
                      </div>

                      <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-slate-500">
                        <span className="flex items-center gap-2">
                          <Clock size={14} className="text-sky-500" /> Time on pitch
                        </span>
                        <span className="text-slate-300">{a.hours * 60} <span className="text-slate-600">min</span></span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
