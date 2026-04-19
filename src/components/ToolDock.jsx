import React from 'react';
import { MousePointer2, StickyNote, Highlighter, LayoutTemplate, Eraser, Camera, Lock, Unlock, Type, PlusSquare, Network } from 'lucide-react';
import { useBuilderStore } from '../lib/builderStore';

const ToolDock = ({ activeTool, setActiveTool, canvasLocked, setCanvasLocked, onScreenshot, onEraseAll }) => {
  const { viewMode, setViewMode, addBlock } = useBuilderStore();

  return (
    <div className="absolute left-[20px] top-1/2 -translate-y-1/2 z-50 flex flex-col gap-2 p-3 rounded-[20px] shadow-2xl"
         style={{
           background: 'rgba(15, 15, 20, 0.65)',
           backdropFilter: 'blur(20px)',
           border: '1px solid rgba(255,255,255,0.05)'
         }}>
      
      {viewMode === 'builder' && (
        <>
          <ToolButton onClick={() => addBlock()} icon={<PlusSquare size={18} />} title="Add Agent Block" />
          <ToolButton active={activeTool === 'connect'} onClick={() => setActiveTool('connect')} icon={<Network size={18} />} title="Connect Blocks" />
          <div className="w-full h-px bg-white/5 my-1" />
        </>
      )}

      <ToolButton active={activeTool === 'cursor'} onClick={() => setActiveTool('cursor')} icon={<MousePointer2 size={18} />} title="Cursor" />
      <ToolButton active={activeTool === 'sticky'} onClick={() => setActiveTool('sticky')} icon={<StickyNote size={18} />} title="Sticky Note" />
      <ToolButton active={activeTool === 'text'} onClick={() => setActiveTool('text')} icon={<Type size={18} />} title="Text Label" />
      <ToolButton active={activeTool === 'highlighter'} onClick={() => setActiveTool('highlighter')} icon={<Highlighter size={18} />} title="Highlighter" />
      <div className="w-full h-px bg-white/5 my-1" />
      <ToolButton onClick={onEraseAll} icon={<Eraser size={18} />} title="Clear Annotations" />
      <ToolButton onClick={onScreenshot} icon={<Camera size={18} />} title="Screenshot Canvas" />
      <ToolButton 
        active={canvasLocked} 
        onClick={() => setCanvasLocked?.(!canvasLocked)} 
        icon={canvasLocked ? <Lock size={18} /> : <Unlock size={18} />} 
        title={canvasLocked ? "Unlock Canvas" : "Lock Canvas"} 
      />
      <div className="w-full h-px bg-white/5 my-1" />
      <ToolButton active={viewMode === 'templates'} onClick={() => setViewMode(viewMode === 'templates' ? 'builder' : 'templates')} icon={<LayoutTemplate size={18} />} title="Templates" />
    </div>
  );
};

const ToolButton = ({ active, onClick, icon, title }) => (
  <button
    onClick={onClick}
    title={title}
    className={`p-3 rounded-xl transition-all ${active ? 'bg-[#A259FF]/20 text-[#A259FF] shadow-[0_0_12px_rgba(162,89,255,0.3)]' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
  >
    {icon}
  </button>
);

export default ToolDock;
