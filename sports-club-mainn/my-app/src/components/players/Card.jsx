import React from 'react'

function Card({ icon, title, num }) {
  return (
    <div className='bg-slate-900 rounded-2xl p-4 w-64 h-28 mb-4 shadow-sm border border-slate-800 relative hover:border-emerald-500/50 hover:bg-emerald-500/[0.02] transition-all group overflow-hidden'>
      <div className="flex flex-col h-full justify-between">
        <div className="flex items-center justify-between">
          <h4 className='text-xs font-bold text-slate-400 uppercase tracking-wider'>{title}</h4>
          <div className="p-2 bg-slate-800/50 rounded-lg text-slate-100 group-hover:text-emerald-500 transition-colors">
            {icon}
          </div>
        </div>
        <div className='flex items-end'>
          <span className='text-3xl font-black text-slate-100'>{num}</span>
        </div>
      </div>
      <div className="absolute -right-2 -bottom-2 w-16 h-16 bg-emerald-500/5 rounded-full blur-2xl group-hover:bg-emerald-500/10 transition-all duration-500" />
    </div>
  )
}

export default Card