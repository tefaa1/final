import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { filterOptions } from '../../data/trainingData';

const PaginationStats = ({ filteredCount, totalCount, currentWeek, updateWeek }) => {
  return (
    <div className="mt-8 bg-slate-900/50 rounded-2xl border border-slate-800/50 p-6 backdrop-blur-sm">
      <div className="flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="text-center md:text-left">
          <p className="text-slate-400 text-sm font-medium">
            Showing <span className="font-black text-emerald-500">{filteredCount}</span> of <span className="font-black text-slate-200">{totalCount}</span> sessions
          </p>
        </div>

        <div className="flex items-center gap-6">
          <button className="p-2.5 rounded-xl border border-slate-800 hover:border-emerald-500/50 hover:bg-emerald-500/10 text-slate-400 hover:text-emerald-500 transition-all cursor-pointer">
            <ChevronLeft size={20} />
          </button>
          <div className="flex gap-2.5">
            {filterOptions.weeks.map(week => (
              <button
                key={week}
                onClick={() => updateWeek(week)}
                className={`w-10 h-10 rounded-xl transition-all duration-300 font-bold text-xs uppercase tracking-tighter border-2 cursor-pointer ${currentWeek === week
                  ? 'bg-emerald-600 border-emerald-600 text-white shadow-lg shadow-emerald-500/20'
                  : 'bg-slate-900 border-slate-800 text-slate-500 hover:border-slate-700 hover:text-slate-300'
                  }`}
              >
                {week.split(' ')[1]}
              </button>
            ))}
          </div>
          <button className="p-2.5 rounded-xl border border-slate-800 hover:border-emerald-500/50 hover:bg-emerald-500/10 text-slate-400 hover:text-emerald-500 transition-all cursor-pointer">
            <ChevronRight size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaginationStats;