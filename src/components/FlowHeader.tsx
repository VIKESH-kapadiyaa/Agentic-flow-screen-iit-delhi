import React, { useState } from 'react';
import { ChevronLeft, GitMerge, LayoutGrid, Play, Loader2, LayoutDashboard } from 'lucide-react';
import { useBuilderStore } from '../lib/builderStore';
import { useWorkflowStore } from '../lib/store';
import { supabase } from '../lib/supabaseClient';

const FlowHeader = () => {
  const { viewMode, setViewMode, blocks } = useBuilderStore();
  const [isDeploying, setIsDeploying] = useState(false);

  const handleInitializeEngine = async () => {
    setIsDeploying(true);
    
    // Zoom out canvas elements visually
    const canvasRef = document.getElementById('builder-canvas-area');
    if (canvasRef) canvasRef.classList.add('scale-75', 'opacity-0', 'transition-all', 'duration-1000');
    
    // Gradient Pulse transition effect portal hook
    const transitionOverlay = document.createElement('div');
    transitionOverlay.className = "fixed inset-0 z-[150] bg-gradient-to-r from-cyan-500/0 via-purple-500/20 to-cyan-500/0 backdrop-blur-3xl animate-fade-in pointer-events-none flex flex-col items-center justify-center";
    transitionOverlay.innerHTML = `<h1 class="text-4xl font-display font-black text-white mix-blend-overlay tracking-widest uppercase shadow-black drop-shadow-xl animate-pulse">Compiling Neural Path...</h1>`;
    document.body.appendChild(transitionOverlay);

    // Save configuration
    const templateName = blocks.length > 0 ? blocks[0].name : "Custom Builder Flow";
    useBuilderStore.getState().deployProject(templateName);

    // Simulate compilation network propagation
    await new Promise(r => setTimeout(r, 2500));
    
    // Remove Overlay
    document.body.removeChild(transitionOverlay);
    setIsDeploying(false);
    
    // Clear styles
    if (canvasRef) canvasRef.classList.remove('scale-75', 'opacity-0');
    
    // Redirect to pipeline natively
    setViewMode('pipeline');
  };

  return (
    <header
      className="bg-black/40 backdrop-blur-3xl flex items-center justify-between px-8 py-5 z-40 relative border-b border-white/[0.03] shadow-2xl"
    >
      {/* Left: Navigation & Logo */}
      <div className="flex items-center gap-6 flex-shrink-0">
        
        {/* Return to Hub */}
        <a 
          href="/dashboard"
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/[0.03] backdrop-blur-md border border-white/10 text-gray-400 transition-all duration-300 hover:border-[#A259FF]/50 hover:text-white hover:bg-white/10 shadow-lg text-[11px] font-black uppercase tracking-wider group"
          title="Return to Dashboard"
          aria-label="Return to Dashboard"
        >
          <LayoutDashboard size={16} className="group-hover:scale-110 transition-transform" />
          <span>Dashboard</span>
        </a>

        {/* Logo and Title */}
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-4 border-r border-white/10 pr-6">
            <div className="w-10 h-10 rounded-[14px] flex items-center justify-center shadow-lg logo-gradient-box">
              <img src="/logo.png" alt="Logo" className="w-7 h-7 object-contain" />
            </div>
            <div>
              <h1 className="text-[18px] font-black tracking-tight text-white font-display leading-tight">
                Agentic<span className="text-[#A259FF]">Flow</span>
              </h1>
            </div>
          </div>
          
          <div className="flex items-center group">
            <input 
              type="text"
              value={useWorkflowStore(state => state.flowTitle) || ''}
              onChange={(e) => useWorkflowStore.getState().setFlowTitle(e.target.value)}
              placeholder="Untitled Flow"
              className="bg-transparent border-none outline-none text-sm font-medium text-zinc-300 placeholder-zinc-600 focus:text-white transition-colors w-48 focus:w-64"
            />
          </div>
        </div>
      </div>

      {/* Center: View Toggles */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center gap-[4rem] bg-white/[0.02] border border-white/[0.05] py-2 px-8 rounded-3xl shadow-xl backdrop-blur-xl">
        <button
          data-tour="pipeline-toggle"
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
      </div>

      {/* Right: Action */}
      <div className="flex items-center gap-4 flex-shrink-0">
        {viewMode === 'builder' && (
          <button 
            onClick={handleInitializeEngine}
            disabled={isDeploying || blocks.length === 0}
            className={`bg-gradient-to-r from-[#A259FF] to-[#6c39b3] text-white px-6 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-transform flex items-center gap-2 shadow-[0_0_20px_rgba(162,89,255,0.4)] ${isDeploying ? 'opacity-80 scale-95 cursor-wait' : 'hover:scale-105'}`}
          >
            {isDeploying ? <Loader2 size={14} className="animate-spin" /> : <Play size={14} />}
            {isDeploying ? 'Deploying...' : 'Initialize Engine'}
          </button>
        )}
      </div>
    </header>
  );
};

export default FlowHeader;
