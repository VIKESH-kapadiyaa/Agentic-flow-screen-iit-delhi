import React, { useState } from 'react';
import { Maximize, Plus, Minus } from 'lucide-react';

interface CameraState {
  x: number;
  y: number;
  zoom: number;
}

interface FlowControlsProps {
  setCamera: React.Dispatch<React.SetStateAction<CameraState>>;
  camera: CameraState;
}

const FlowControls = ({ setCamera, camera }: FlowControlsProps) => {
  const [showScaleInput, setShowScaleInput] = useState(false);
  const [scaleValue, setScaleValue] = useState('');

  const handleScaleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseInt(scaleValue, 10);
    if (!isNaN(val) && val >= 15 && val <= 200) {
      setCamera((prev) => ({ ...prev, zoom: val / 100 }));
    }
    setShowScaleInput(false);
    setScaleValue('');
  };


  const currentPercent = camera ? Math.round(camera.zoom * 100) : 55;

  return (
    <div className="absolute top-24 left-6 flex flex-col gap-2 z-30">
      <button
        onClick={() => setCamera({ x: 100, y: 60, zoom: 0.55 })}
        className="p-3 rounded-xl btn-glass border border-white/5 shadow-lg group"
        title="Fit View"
      >
        <Maximize size={16} className="text-slate-500 group-hover:text-white transition-colors" />
      </button>
      <button
        onClick={() => setCamera((prev) => ({ ...prev, zoom: Math.min(prev.zoom + 0.1, 2) }))}
        className="p-3 rounded-xl btn-glass border border-white/5 shadow-lg group"
        title="Zoom In"
      >
        <Plus size={16} className="text-slate-500 group-hover:text-white transition-colors" />
      </button>
      <button
        onClick={() => setCamera((prev) => ({ ...prev, zoom: Math.max(prev.zoom - 0.1, 0.15) }))}
        className="p-3 rounded-xl btn-glass border border-white/5 shadow-lg group"
        title="Zoom Out"
      >
        <Minus size={16} className="text-slate-500 group-hover:text-white transition-colors" />
      </button>

      {/* Scale Percentage Display / Input */}
      {showScaleInput ? (
        <form onSubmit={handleScaleSubmit} className="flex">
          <input
            type="number"
            min="15"
            max="200"
            autoFocus
            value={scaleValue}
            onChange={(e) => setScaleValue(e.target.value)}
            onBlur={() => { setShowScaleInput(false); setScaleValue(''); }}
            placeholder={`${currentPercent}`}
            className="w-[56px] px-2 py-2 rounded-xl bg-black/60 border border-[#A259FF]/30 text-white text-[11px] text-center font-bold outline-none focus:border-[#A259FF]"
          />
        </form>
      ) : (
        <button
          onClick={() => { setShowScaleInput(true); setScaleValue(String(currentPercent)); }}
          className="px-2 py-2 rounded-xl btn-glass border border-white/5 shadow-lg text-[11px] text-slate-400 font-bold hover:text-white hover:border-[#A259FF]/30 transition-all"
          title="Set specific scale"
        >
          {currentPercent}%
        </button>
      )}
    </div>
  );
};

export default FlowControls;
