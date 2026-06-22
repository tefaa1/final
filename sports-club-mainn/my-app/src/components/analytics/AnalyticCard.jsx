import React from 'react'

function AnalyticCard({ icon, title, num, doub }) {
  return (
    <div className="bg-slate-900/50 backdrop-blur-sm rounded-2xl p-6 border border-slate-800 hover:border-emerald-500/30 transition-all group relative overflow-hidden flex flex-col justify-between h-32">
      <div className="absolute -right-2 -bottom-2 w-16 h-16 bg-emerald-500/5 rounded-full blur-2xl group-hover:bg-emerald-500/10 transition-all duration-500" />

      <div className="flex justify-between items-start relative z-10">
        <div>
          <p className="text-[10px] font-black font-outfit text-slate-500 uppercase tracking-widest mb-1">
            {title}
          </p>
          <h3 className="text-2xl font-black font-outfit text-slate-100 tracking-tight">
            {num}
          </h3>
        </div>
        <div className="relative">
          {icon}
        </div>
      </div>

      <div className="relative z-10">
        <p className="text-[10px] font-black font-outfit text-emerald-400 uppercase tracking-widest">
          {doub} <span className="text-slate-600 ml-1">vs last month</span>
        </p>
      </div>
    </div>
  )
}

export default AnalyticCard