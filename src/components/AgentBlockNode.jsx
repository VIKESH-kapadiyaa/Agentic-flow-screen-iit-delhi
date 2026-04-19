import React from 'react';
import { Settings, Play, Clock } from 'lucide-react';
import { useBuilderStore } from '../lib/builderStore';

const AgentBlockNode = ({ block, isSelected }) => {
  const { setSelectedElementId } = useBuilderStore();
  const blockW = block.size?.width || 260;
  const blockH = block.size?.height || 150;

  return (
    <div
      onClick={(e) => {
        e.stopPropagation();
        setSelectedElementId(block.id);
      }}
      className={`absolute border rounded-3xl p-5 transition-all n8n-node overflow-visible group cursor-pointer ${
        isSelected ? 'bg-[#181824] border-[#A259FF] shadow-[0_0_30px_rgba(162,89,255,0.4)] z-50' : 'bg-[#111118] border-white/[0.04] hover:border-white/20 shadow-xl z-10'
      }`}
      style={{
        left: block.position.x,
        top: block.position.y,
        width: blockW,
        minHeight: blockH,
      }}
    >
      {/* Port - Input */}
      <div 
        className="absolute w-4 h-4 bg-[#111118] border-2 border-[#A259FF] rounded-full left-1/2 -translate-x-1/2 -top-2 z-20 hover:scale-[2] hover:bg-[#A259FF] transition-all cursor-crosshair connection-port"
        data-port-id={block.id}
        data-port-type="target"
      />
      
      {/* Header */}
      <div className="flex items-start justify-between mb-4 pb-3">
        <div className="flex items-center gap-3">
          <div className="p-1.5 rounded-lg bg-gradient-to-br from-[#A259FF] to-[#6c39b3] text-white shadow-lg">
            <Settings size={14} />
          </div>
          <h3 className="text-[14px] font-bold text-white tracking-wide truncate max-w-[150px]">
            {block.name || 'Agent Block'}
          </h3>
        </div>
      </div>
      
      {/* Body */}
      <p className="text-[11px] text-slate-400 line-clamp-3 min-h-[48px] font-secondary mb-4 leading-relaxed">
        {block.description || 'No description provided.'}
      </p>

      {/* Footer Details */}
      <div className="flex items-center justify-between mt-auto pt-4 border-t border-white/[0.04] text-[10px] text-slate-300 font-bold uppercase tracking-widest">
        <div className="flex items-center gap-1.5 bg-white/5 hover:bg-white/10 transition-colors px-2.5 py-1.5 rounded-md">
          <Play size={10} className="text-[#46B1FF]" /> {block.triggerConfig.type.substring(0, 4)}
        </div>
        {(block.waitConfig.type !== 'none') && (
          <div className="flex items-center gap-1.5 bg-white/5 hover:bg-white/10 transition-colors px-2.5 py-1.5 rounded-md">
             <Clock size={10} className="text-[#DEF767]" /> {block.waitConfig.type.substring(0, 4)}
          </div>
        )}
      </div>

      {/* Port - Output */}
      <div 
        className="absolute w-4 h-4 bg-[#111118] border-2 border-[#A259FF] rounded-full left-1/2 -translate-x-1/2 -bottom-2 z-20 hover:scale-150 hover:bg-[#A259FF] transition-all cursor-crosshair connection-port"
        data-port-id={block.id}
        data-port-type="source"
      />

      {/* Resize Handle */}
      <div
        className="resize-handle absolute bottom-0 right-0 w-5 h-5 cursor-nwse-resize opacity-0 group-hover:opacity-100 transition-opacity z-30"
        style={{
          background: 'linear-gradient(135deg, transparent 50%, rgba(162,89,255,0.5) 50%)',
          borderRadius: '0 0 12px 0',
        }}
      />
    </div>
  );
};

export default AgentBlockNode;
