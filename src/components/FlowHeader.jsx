import React from 'react';
import { ChevronLeft, GitMerge, LayoutGrid, Layers } from 'lucide-react';
import { useBuilderStore } from '../lib/builderStore';

const FlowHeader = () => {
  const { viewMode, setViewMode } = useBuilderStore();

  return (
    <header
      className="bg-black/40 backdrop-blur-3xl flex items-center justify-between px-8 py-5 z-40 relative border-b border-white/[0.03] shadow-2xl"
    >
      {/* Left: Navigation & Logo */}
      <div className="flex items-center gap-6 flex-shrink-0">
        
        {/* Return to Hub */}
        <a 
          href="/dashboard"
          className="flex items-center justify-center w-10 h-10 rounded-2xl bg-white/[0.03] backdrop-blur-md border border-white/10 text-gray-400 transition-all duration-300 hover:border-[#A259FF]/50 hover:text-white hover:bg-white/10 group shadow-lg"
          title="Return to Hub"
        >
          <ChevronLeft size={20} className="group-hover:-translate-x-0.5 transition-transform" />
        </a>

        {/* Logo */}
        <div className="flex items-center gap-4">
          <div
            className="w-10 h-10 rounded-[14px] flex items-center justify-center shadow-lg"
            style={{
              background: 'linear-gradient(135deg, #A259FF 0%, #46B1FF 100%)',
              boxShadow: '0 8px 24px rgba(162, 89, 255, 0.3)',
            }}
          >
            <img 
              src="/logo.png" 
              alt="Logo" 
              className="w-7 h-7 object-contain" 
            />
          </div>
          <div>
            <h1 className="text-[18px] font-black tracking-tight text-white font-display leading-tight">
              Agentic<span className="text-[#A259FF]">Flow</span>
            </h1>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-[8px] font-black uppercase tracking-[0.3em] text-slate-500">
                Neuro-Orchestration
              </span>
              <div className="w-1 h-1 rounded-full bg-[#A259FF] animate-pulse" />
            </div>
          </div>
        </div>
      </div>

      {/* Center: View Toggles */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center bg-white/[0.02] border border-white/[0.05] p-1.5 rounded-2xl shadow-xl backdrop-blur-xl">
        <button
          onClick={() => setViewMode('pipeline')}
          className={`flex items-center gap-2.5 px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all duration-300 ${
            viewMode === 'pipeline' 
              ? 'bg-[#46B1FF] text-white shadow-[0_5px_20px_rgba(70,177,255,0.3)]' 
              : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'
          }`}
        >
          <GitMerge size={14} className={viewMode === 'pipeline' ? 'animate-pulse' : ''} /> Pipeline
        </button>
        <button
          onClick={() => setViewMode('builder')}
          className={`flex items-center gap-2.5 px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all duration-300 ${
            viewMode === 'builder' 
              ? 'bg-[#A259FF] text-white shadow-[0_5px_20px_rgba(162,89,255,0.3)]' 
              : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'
          }`}
        >
          <LayoutGrid size={14} /> Builder
        </button>
        <button
          onClick={() => setViewMode('templates')}
          className={`flex items-center gap-2.5 px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all duration-300 ${
            viewMode === 'templates' 
              ? 'bg-[#DEF767] text-black shadow-[0_5px_20px_rgba(222,247,103,0.3)]' 
              : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'
          }`}
        >
          <Layers size={14} /> Templates
        </button>
      </div>

      {/* Right side spacer for flex-between balance */}
      <div className="w-10 flex-shrink-0" />
    </header>
  );
};

export default FlowHeader;
