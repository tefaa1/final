function FeatureCard({ icon, text }) {
  return (
    <div className="bg-slate-900/50 border border-slate-800 px-4 py-3 rounded-xl flex items-center gap-3 backdrop-blur-sm hover:border-emerald-500/50 hover:bg-slate-900/70 hover:translate-y-[-2px] transition-all cursor-pointer group">
      <div className="text-emerald-400 transition-transform group-hover:scale-110">{icon}</div>
      <h5 className="font-semibold text-slate-100 text-base tracking-wide uppercase">{text}</h5>
    </div>
  );
}

export default FeatureCard;
