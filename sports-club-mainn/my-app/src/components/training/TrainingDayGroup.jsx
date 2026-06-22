import React from 'react';
import TrainingCard from './TrainingCard';
import { CalendarDays } from 'lucide-react';

const TrainingDayGroup = ({ date, sessions }) => {
  return (
    <div className="rounded-xl overflow-hidden">

      <div className="px-2 py-3 border-b border-slate-800/50 mb-4 mx-2">
        <div className="flex items-center gap-2">
          <CalendarDays size={18} className="text-emerald-500" />
          <h2 className="text-xs font-black text-slate-100 uppercase tracking-widest">{date}</h2>
        </div>
      </div>

      <div className="p-2 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
        {sessions.map(session => (
          <TrainingCard key={session.id} session={session} />
        ))}
      </div>
    </div>
  );
};

export default TrainingDayGroup;