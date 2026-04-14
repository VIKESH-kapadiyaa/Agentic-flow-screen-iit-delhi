import React from 'react';
import { Cpu, Play, Settings, Loader2 } from 'lucide-react';

const FlowHeader = ({ prompt, setPrompt, runFlow, flowStatus, onOpenSettings }) => {
  const isRunning = flowStatus === 'running';

  return (
    <header
      className="bg-black/90 backdrop-blur-2xl flex items-center justify-between px-6 py-4 z-40 relative border-b border-white/[0.04]"
    >
      {/* Left: Logo */}
      <div className="flex items-center gap-3.5 flex-shrink-0">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg"
          style={{
            background: 'linear-gradient(135deg, var(--accent-purple) 0%, #8b5cf6 100%)',
            boxShadow: '0 4px 18px rgba(162, 89, 255, 0.35)',
          }}
        >
          <img 
            src="/logo.png" 
            alt="Logo" 
            className="w-8 h-8 object-contain" 
          />
        </div>
        <div>
          <h1 className="text-[17px] font-bold tracking-tight text-white font-display leading-tight">
           Agentic Flow
          </h1>
          <p className="text-[9px] font-bold uppercase tracking-[0.3em] text-[#CEA3FF] opacity-60">
            Neuro-Agentic Systems
          </p>
        </div>
      </div>

      {/* Center: Prompt Input */}
      <div className="flex-1 max-w-2xl mx-10 relative">
        <input
          type="text"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Enter objective for the neural sequence…"
          className="w-full px-5 py-2.5 rounded-xl text-xs text-white placeholder:text-slate-600 transition-all font-secondary"
          style={{
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.06)',
          }}
        />
        <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-1.5 pointer-events-none opacity-20">
          <kbd className="text-[9px] font-mono border border-white/20 px-1 rounded">⌘</kbd>
          <kbd className="text-[9px] font-mono border border-white/20 px-1 rounded">K</kbd>
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-3 flex-shrink-0">
        <button
          onClick={onOpenSettings}
          className="p-3 rounded-xl btn-glass text-slate-400 hover:text-white group border border-white/5"
          title="System Settings"
        >
          <Settings size={17} className="group-hover:rotate-45 transition-transform" />
        </button>

        <button
          onClick={runFlow}
          disabled={isRunning}
          className="btn-run px-6 py-3 rounded-xl text-xs font-bold text-white flex items-center gap-2.5"
        >
          {isRunning ? (
            <>
              <Loader2 size={15} className="animate-spin" />
              Processing Sequence
            </>
          ) : (
            <>
              <Play size={15} fill="currentColor" />
              Initialize Flow
            </>
          )}
        </button>
      </div>
    </header>
  );
};

export default FlowHeader;
