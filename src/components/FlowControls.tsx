import React, { useState } from 'react';
import { Maximize, Plus, Minus, Download, Camera } from 'lucide-react';
import html2canvas from 'html2canvas';
import html2pdf from 'html2pdf.js';

const FlowControls = ({ setCamera, camera }) => {
  const [showScaleInput, setShowScaleInput] = useState(false);
  const [scaleValue, setScaleValue] = useState('');

  const handleScaleSubmit = (e) => {
    e.preventDefault();
    const val = parseInt(scaleValue, 10);
    if (!isNaN(val) && val >= 15 && val <= 200) {
      setCamera((prev) => ({ ...prev, zoom: val / 100 }));
    }
    setShowScaleInput(false);
    setScaleValue('');
  };

  const handleExportPNG = async () => {
    const canvasElement = document.getElementById('canvas-bg') || document.body;
    try {
      const shot = await html2canvas(canvasElement, { backgroundColor: '#0a0a10', useCORS: true });
      const link = document.createElement('a');
      link.download = `agentic-flow-canvas-${Date.now()}.png`;
      link.href = shot.toDataURL();
      link.click();
    } catch (e) {
      console.error('PNG export failed', e);
    }
  };

  const handleExportPDF = async () => {
    const canvasElement = document.getElementById('canvas-bg') || document.body;
    try {
      const opt = {
        margin:       10,
        filename:     `agentic-flow-${Date.now()}.pdf`,
        image:        { type: 'jpeg', quality: 0.98 },
        html2canvas:  { scale: 2, useCORS: true, backgroundColor: '#0a0a10' },
        jsPDF:        { unit: 'mm', format: 'a4', orientation: 'landscape' }
      };
      await html2pdf().set(opt).from(canvasElement).save();
    } catch (e) {
      console.error('PDF export failed', e);
    }
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

      {/* Export Controls */}
      <button
        onClick={handleExportPNG}
        className="p-3 rounded-xl btn-glass border border-white/5 shadow-lg group mt-2"
        title="Export as PNG"
      >
        <Camera size={16} className="text-slate-500 group-hover:text-[#46B1FF] transition-colors" />
      </button>
      <button
        onClick={handleExportPDF}
        className="p-3 rounded-xl btn-glass border border-white/5 shadow-lg group"
        title="Export as PDF"
      >
        <Download size={16} className="text-slate-500 group-hover:text-[#A259FF] transition-colors" />
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
