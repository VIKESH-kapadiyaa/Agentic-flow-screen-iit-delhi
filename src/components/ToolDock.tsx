import React from 'react';
import { MousePointer2, StickyNote, Highlighter, LayoutTemplate, Eraser, Camera, Lock, Unlock, Type, PlusSquare, Network } from 'lucide-react';
import { useBuilderStore } from '../lib/builderStore';

const ToolDock = ({ activeTool, setActiveTool, canvasLocked, setCanvasLocked, onScreenshot, onEraseAll }) => {
  const { viewMode, setViewMode, addBlock } = useBuilderStore();

  return (
    <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-50 flex items-end gap-4 p-3 px-6 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] transition-all bg-[#0f0f14]/60 backdrop-blur-2xl border border-white/5 group/dock">
      
      {viewMode === 'builder' && (
        <>
          <ToolButton onClick={() => addBlock()} icon={<PlusSquare size={20} />} title="Add Agent Block" />
          <ToolButton active={activeTool === 'connect'} onClick={() => setActiveTool('connect')} icon={<Network size={20} />} title="Connect Blocks" />
          <div className="w-px h-8 bg-white/10 mx-1 self-center" />
        </>
      )}

      <ToolButton active={activeTool === 'cursor'} onClick={() => setActiveTool('cursor')} icon={<MousePointer2 size={20} />} title="Cursor" />
      <ToolButton active={activeTool === 'sticky'} onClick={() => setActiveTool('sticky')} icon={<StickyNote size={20} />} title="Sticky Note" />
      <ToolButton active={activeTool === 'text'} onClick={() => setActiveTool('text')} icon={<Type size={20} />} title="Text Label" />
      <ToolButton active={activeTool === 'highlighter'} onClick={() => setActiveTool('highlighter')} icon={<Highlighter size={20} />} title="Highlighter" />
      
      <div className="w-px h-8 bg-white/10 mx-1 self-center" />
      
      <ToolButton onClick={onEraseAll} icon={<Eraser size={20} />} title="Clear Annotations" />
      <ToolButton onClick={onScreenshot} icon={<Camera size={20} />} title="Screenshot Canvas" />
      <ToolButton 
        active={canvasLocked} 
        onClick={() => setCanvasLocked?.(!canvasLocked)} 
        icon={canvasLocked ? <Lock size={20} /> : <Unlock size={20} />} 
        title={canvasLocked ? "Unlock Canvas" : "Lock Canvas"} 
      />
      
      <div className="w-px h-8 bg-white/10 mx-1 self-center" />
      
      <ToolButton 
        active={viewMode === 'templates'} 
        onClick={() => setViewMode(viewMode === 'templates' ? 'builder' : 'templates')} 
        icon={<LayoutTemplate size={20} />} 
        title="Templates Library" 
      />
    </div>
  );
};

const ToolButton = ({ active, onClick, icon, title }) => (
  <div className="relative group/btn h-12 flex items-center">
    <button
      onClick={onClick}
      className={`p-3 rounded-2xl transition-all duration-300 origin-bottom group-hover/btn:scale-[1.2] group-hover/btn:-translate-y-2 active:scale-95 ${
        active 
          ? 'bg-[#A259FF] text-white shadow-[0_0_20px_rgba(162,89,255,0.4)]' 
          : 'text-slate-400 group-hover/btn:text-white group-hover/btn:bg-white/10'
      }`}
    >
      {icon}
    </button>
    <div className="absolute -top-12 left-1/2 -translate-x-1/2 px-3 py-1.5 rounded-lg bg-black/80 backdrop-blur-md border border-white/10 text-[10px] font-bold text-white opacity-0 group-hover/btn:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
      {title}
    </div>
    {active && <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-[#A259FF]" />}
  </div>
);

export default ToolDock;
