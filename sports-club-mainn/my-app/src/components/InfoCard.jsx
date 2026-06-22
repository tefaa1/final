import React from 'react'

function InfoCard({ icon, title, num, perc }) {
  return (
    <div className='relative bg-gradient-to-br from-slate-900/70 to-slate-900/30 rounded-2xl p-5 w-full border border-slate-800 hover:border-emerald-500/50 transition-all group backdrop-blur-sm overflow-hidden'>
      {/* subtle glow on hover */}
      <div className="absolute -top-10 -right-10 w-32 h-32 bg-emerald-500/0 group-hover:bg-emerald-500/10 rounded-full blur-2xl transition-all duration-500" />

      <div className="relative flex justify-between items-start mb-5">
        <h4 className='text-[11px] font-extrabold text-slate-400 uppercase tracking-[0.22em] group-hover:text-slate-300 transition-colors'>
          {title}
        </h4>
        <span className='text-emerald-400 bg-emerald-500/10 p-2.5 rounded-xl border border-emerald-500/25 group-hover:bg-emerald-500/20 group-hover:border-emerald-500/50 group-hover:scale-110 transition-all'>
          {icon}
        </span>
      </div>

      <div className='relative flex flex-col gap-1.5'>
        <span className='text-4xl font-extrabold text-slate-100 tracking-tight tabular leading-none'>{num}</span>
        <span className='text-[10px] font-extrabold uppercase tracking-[0.2em] text-emerald-400'>
          {perc}
        </span>
      </div>
    </div>
  )
}

export default InfoCard
