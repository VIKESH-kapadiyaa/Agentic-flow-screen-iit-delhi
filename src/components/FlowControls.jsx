import React from 'react';
import { Maximize, Plus, Minus } from 'lucide-react';

const FlowControls = ({ setCamera }) => {
  return (
    <div className="absolute top-24 left-6 flex flex-col gap-2 z-30">
      <button
        onClick={() => setCamera({ x: 100, y: 60, zoom: 0.55 })}
        className="p-3 rounded-xl btn-glass border border-white/5 shadow-lg group"
        title="Recenter Neural Grid"
      >
        <Maximize size={16} className="text-slate-500 group-hover:text-white transition-colors" />
      </button>
      <button
        onClick={() => setCamera((prev) => ({ ...prev, zoom: Math.min(prev.zoom + 0.1, 2) }))}
        className="p-3 rounded-xl btn-glass border border-white/5 shadow-lg group"
        title="Magnify Signal"
      >
        <Plus size={16} className="text-slate-500 group-hover:text-white transition-colors" />
      </button>
      <button
        onClick={() => setCamera((prev) => ({ ...prev, zoom: Math.max(prev.zoom - 0.1, 0.15) }))}
        className="p-3 rounded-xl btn-glass border border-white/5 shadow-lg group"
        title="Distill View"
      >
        <Minus size={16} className="text-slate-500 group-hover:text-white transition-colors" />
      </button>
    </div>
  );
};

export default FlowControls;
