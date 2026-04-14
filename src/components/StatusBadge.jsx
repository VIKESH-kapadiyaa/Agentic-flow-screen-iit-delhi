import React from 'react';
import { Loader2, CheckCircle2 } from 'lucide-react';

const StatusBadge = ({ state }) => {
  if (state === 'running') {
    return (
      <div className="flex items-center gap-1.5">
        <Loader2 className="animate-spin text-[#A259FF]" size={12} />
        <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-[#A259FF]">
          Running
        </span>
      </div>
    );
  }

  if (state === 'completed') {
    return (
      <div className="flex items-center gap-1.5">
        <CheckCircle2 className="text-[#DEF767]" size={12} />
        <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-[#DEF767]">
          Ready
        </span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1.5 opacity-60">
      <div className="w-1.5 h-1.5 rounded-full border border-[#46B1FF]" />
      <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-[#46B1FF]">
        Standby
      </span>
    </div>
  );
};

export default StatusBadge;
