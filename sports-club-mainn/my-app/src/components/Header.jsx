import React from 'react';

const Header = ({ title, desc, icon, buttonTitle, onClick }) => {
  return (
    <div className="mb-10 fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="md:text-5xl text-4xl font-extrabold text-slate-100 tracking-tight mb-2 uppercase leading-none">
            {title}
          </h1>
          <p className="text-[11px] font-bold text-emerald-400/70 uppercase tracking-[0.28em] leading-none">
            {desc}
          </p>
        </div>

        {buttonTitle && (
          <button
            onClick={onClick}
            className="px-6 py-3 bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 rounded-xl hover:bg-emerald-500 hover:text-white hover:border-emerald-400 transition-all duration-300 font-bold text-xs uppercase tracking-[0.22em] flex items-center gap-2 shadow-lg shadow-emerald-500/10 active:scale-95"
          >
            {icon}
            {buttonTitle}
          </button>
        )}
      </div>
    </div>
  );
};

export default Header;