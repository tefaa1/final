import React from 'react'
import { filterOptions } from '../../data/matchesData';

const Filters = ({ filters, updateFilter }) => {
    return (
        <div className="rounded-2xl w-full p-2 mb-2">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                <div className="flex flex-wrap gap-2.5">
                    {filterOptions.sports.map(sport => (
                        <button
                            key={sport}
                            onClick={() => updateFilter('sport', sport)}
                            className={`px-6 py-2 rounded-xl transition-all duration-300 cursor-pointer text-[10px] font-black uppercase tracking-widest border-2 
                                ${filters.sport === sport
                                    ? "bg-emerald-600 border-emerald-600 text-white shadow-lg shadow-emerald-500/20"
                                    : "bg-slate-900/50 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200"
                                }`}
                        >
                            {sport === 'All' ? 'All Sports' : sport}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}

export default Filters