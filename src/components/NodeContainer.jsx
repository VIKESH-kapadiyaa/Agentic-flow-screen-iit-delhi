import React from 'react';
import {
  Search, Eye, Users, BookOpen, User, Compass, Target, Lightbulb,
  Sparkles, Layers, Box, Palette, ShieldCheck, RefreshCw, FileText, Rocket,
} from 'lucide-react';
import StatusBadge from './StatusBadge';

const ICON_MAP = {
  Search, Eye, Users, BookOpen, User, Compass, Target, Lightbulb,
  Sparkles, Layers, Box, Palette, ShieldCheck, RefreshCw, FileText, Rocket,
};

const PHASE_COLORS = {
  'discover': { accent: '#46B1FF', bg: 'rgba(70,177,255,0.1)' },
  'define': { accent: '#CEA3FF', bg: 'rgba(206,163,255,0.1)' },
  'develop': { accent: '#A259FF', bg: 'rgba(162,89,255,0.1)' },
  'deliver': { accent: '#DEF767', bg: 'rgba(222,247,103,0.1)' },
};

const NodeContainer = ({ node, state, onClick, isVisible = true }) => {
  const IconComponent = ICON_MAP[node.icon] || Box;
  const phaseColor = PHASE_COLORS[node.phase] || PHASE_COLORS['discover'];

  const stateClass =
    state === 'running'
      ? 'node-running'
      : state === 'completed'
      ? 'node-completed'
      : 'node-idle';

  return (
    <div
      className={`absolute pointer-events-auto n8n-node rounded-2xl cursor-pointer
        ${isVisible ? 'revealed' : 'hidden'} ${stateClass}`}
      style={{
        left: node.x,
        top: node.y,
        width: 140, // Match config
        height: 140,
        borderColor: state === 'running' ? phaseColor.accent : 'rgba(255,255,255,0.1)',
      }}
      onClick={onClick}
    >
      <div className="flex flex-col items-center justify-center h-full p-4 gap-3">
        {/* Icon Unit */}
        <div
          className="w-14 h-14 rounded-xl flex items-center justify-center shadow-lg"
          style={{ 
            background: phaseColor.bg,
            border: `1px solid ${phaseColor.accent}33`
          }}
        >
          <IconComponent size={24} style={{ color: phaseColor.accent }} />
        </div>

        {/* Info */}
        <div className="text-center">
          <h3 className="text-[11px] font-bold text-slate-100 uppercase tracking-wider font-display line-clamp-2">
            {node.category.name}
          </h3>
          <div className="mt-1 flex items-center justify-center">
             <StatusBadge state={state} mini />
          </div>
        </div>
      </div>

      {/* Input Port (Left Center) */}
      <div
        className="absolute w-3.5 h-3.5 rounded-full flex items-center justify-center bg-black"
        style={{
          left: -7,
          top: '50%',
          transform: 'translateY(-50%)',
          border: `1.5px solid ${state === 'running' ? phaseColor.accent : '#334155'}`,
          zIndex: 10,
        }}
      >
        <div className="w-1 h-1 rounded-full" style={{ background: '#334155' }} />
      </div>

      {/* Output Port (Right Center) */}
      <div
        className="absolute w-3.5 h-3.5 rounded-full flex items-center justify-center bg-black"
        style={{
          right: -7,
          top: '50%',
          transform: 'translateY(-50%)',
          border: `1.5px solid ${state === 'completed' ? '#DEF767' : '#334155'}`,
          zIndex: 10,
        }}
      >
        <div className="w-1 h-1 rounded-full" style={{ background: '#334155' }} />
      </div>
    </div>
  );
};

export default React.memo(NodeContainer);
