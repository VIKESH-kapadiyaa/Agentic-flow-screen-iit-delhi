import { Webhook, Link2 } from 'lucide-react';
import { useBuilderStore } from '../lib/builderStore';

interface BlockData {
  id: string;
  name?: string;
  description?: string;
  linkedSequenceId?: string | null;
  linkedSequenceName?: string;
  position: { x: number; y: number };
  size?: { width?: number; height?: number };
  triggerConfig: { type: string;[key: string]: any };
  waitConfig: { type: string;[key: string]: any };
  [key: string]: any;
}

interface WebhookBlockNodeProps {
  block: BlockData;
  isSelected: boolean;
}

const WebhookBlockNode = ({ block, isSelected }: WebhookBlockNodeProps) => {
  const { setSelectedElementId, nodeStatus } = useBuilderStore();
  const status = nodeStatus[block.id] || 'idle';
  const blockW = block.size?.width || 260;
  const blockH = block.size?.height || 150;

  let borderClasses = 'border-[#46B1FF]/20 bg-[#0d1520] hover:border-[#46B1FF]/50 shadow-xl z-10';
  let pulseClass = '';

  if (isSelected) {
    borderClasses = 'border-[#46B1FF] bg-[#111d2e] shadow-[0_0_30px_rgba(70,177,255,0.4)] z-50';
  } else if (status === 'running') {
    borderClasses = 'border-[#F6E27F] bg-[#181824] shadow-[0_0_30px_rgba(246,226,127,0.4)] z-40';
    pulseClass = 'animate-pulse';
  } else if (status === 'success') {
    borderClasses = 'border-[#DEF767] bg-[#0d1520] shadow-[0_0_20px_rgba(222,247,103,0.2)] z-30';
  } else if (status === 'error') {
    borderClasses = 'border-[#ff4b4b] bg-[#0d1520] shadow-[0_0_20px_rgba(255,75,75,0.2)] z-30';
  }

  return (
    // eslint-disable-next-line
    <div
      onClick={(e) => {
        e.stopPropagation();
        setSelectedElementId(block.id);
      }}
      className={`absolute border rounded-3xl p-5 transition-all n8n-node overflow-visible group cursor-pointer ${borderClasses} ${pulseClass}`}
      style={{
        left: block.position.x,
        top: block.position.y,
        width: blockW,
        minHeight: blockH,
      }}
    >
      {/* Port - Input */}
      <div
        className="absolute w-4 h-4 bg-[#0d1520] border-2 border-[#46B1FF] rounded-full left-1/2 -translate-x-1/2 -top-2 z-20 hover:scale-[2] hover:bg-[#46B1FF] transition-all cursor-crosshair connection-port"
        data-port-id={block.id}
        data-port-position="top"
      />

      {/* Header */}
      <div className="flex items-start justify-between mb-4 pb-3">
        <div className="flex items-center gap-3">
          <div className="p-1.5 rounded-lg bg-gradient-to-br from-[#46B1FF] to-[#1a6db0] text-white shadow-lg">
            <Webhook size={14} />
          </div>
          <h3 className="text-[14px] font-bold text-white tracking-wide truncate max-w-[150px]">
            {block.name || 'Webhook Bridge'}
          </h3>
        </div>
      </div>

      {/* Body */}
      <p className="text-[11px] text-slate-400 line-clamp-2 min-h-[32px] font-secondary mb-3 leading-relaxed">
        {block.description || 'Links to another workflow...'}
      </p>

      {/* Linked Sequence Badge */}
      <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[#46B1FF]/10 border border-[#46B1FF]/20 mb-3">
        <Link2 size={12} className="text-[#46B1FF]" />
        <span className="text-[10px] font-bold text-[#46B1FF] uppercase tracking-wider truncate">
          {block.linkedSequenceName || 'No workflow linked'}
        </span>
      </div>

      {/* Footer Details */}
      <div className="flex items-center justify-between mt-auto pt-3 border-t border-[#46B1FF]/10 text-[10px] text-slate-300 font-bold uppercase tracking-widest">
        <div className="flex items-center gap-1.5 bg-[#46B1FF]/10 px-2.5 py-1.5 rounded-md">
          <Webhook size={10} className="text-[#46B1FF]" /> Bridge
        </div>
      </div>

      {/* Port - Output (Bottom) */}
      <div
        className="absolute w-4 h-4 bg-[#0d1520] border-2 border-[#46B1FF] rounded-full left-1/2 -translate-x-1/2 -bottom-2 z-20 hover:scale-150 hover:bg-[#46B1FF] transition-all cursor-crosshair connection-port"
        data-port-id={block.id}
        data-port-position="bottom"
      />

      {/* Port - Left */}
      <div
        className="absolute w-4 h-4 bg-[#0d1520] border-2 border-[#46B1FF] rounded-full -left-2 top-1/2 -translate-y-1/2 z-20 hover:scale-150 hover:bg-[#46B1FF] transition-all cursor-crosshair connection-port"
        data-port-id={block.id}
        data-port-position="left"
      />

      {/* Port - Right */}
      <div
        className="absolute w-4 h-4 bg-[#0d1520] border-2 border-[#46B1FF] rounded-full -right-2 top-1/2 -translate-y-1/2 z-20 hover:scale-150 hover:bg-[#46B1FF] transition-all cursor-crosshair connection-port"
        data-port-id={block.id}
        data-port-position="right"
      />

      {/* Resize Handle */}
      {/* eslint-disable-next-line */}
      <div
        className="resize-handle absolute bottom-0 right-0 w-5 h-5 cursor-nwse-resize opacity-0 group-hover:opacity-100 transition-opacity z-30"
        style={{
          background: 'linear-gradient(135deg, transparent 50%, rgba(70,177,255,0.5) 50%)',
          borderRadius: '0 0 12px 0',
        }}
      />
    </div>
  );
};

export default WebhookBlockNode;
