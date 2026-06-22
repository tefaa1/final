import React from "react";

function PlayerFilter({ sports, selectedSport, setSelectedSport }) {
  return (
    <div className="flex bg-slate-950 rounded-xl p-1 gap-1 border border-slate-800">
      {sports.map((sport) => (
        <button
          key={sport}
          onClick={() => setSelectedSport(sport)}
          className={`px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all cursor-pointer
            ${selectedSport === sport
              ? "bg-emerald-600 text-white shadow-lg shadow-emerald-500/20"
              : "text-slate-500 hover:text-slate-300 hover:bg-slate-900"}
          `}
        >
          {sport}
        </button>
      ))}
    </div>
  );
}

export default PlayerFilter;
