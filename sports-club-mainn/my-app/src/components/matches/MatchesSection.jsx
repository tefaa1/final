const MatchesSection = ({ title, data, matches }) => {
  if (!matches || matches.length === 0) return null;

  return (
    <div className="mb-10">
      <div className="flex items-center gap-3 mb-6 px-2">
        <div className="h-6 w-1 bg-emerald-500 rounded-full" />
        <h2 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">{title}</h2>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6 px-2">
        {data.map(match => (
          <MatchesCard key={match.id} match={match} />
        ))}
      </div>
    </div>
  );
};
export default MatchesSection;