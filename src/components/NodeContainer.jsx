import React from 'react';
import {
  Search, Eye, Users, BookOpen, User, Compass, Target, Lightbulb,
  Sparkles, Layers, Box, Palette, ShieldCheck, RefreshCw, FileText, Rocket,
} from 'lucide-react';
import StatusBadge from './StatusBadge';
import { NODE_WIDTH, NODE_HEIGHT } from '../lib/agents';

const ICON_MAP = {
  Search, Eye, Users, BookOpen, User, Compass, Target, Lightbulb,
  Sparkles, Layers, Box, Palette, ShieldCheck, RefreshCw, FileText, Rocket,
};

const PHASE_COLORS = {
  1: { accent: '#46B1FF', bg: 'rgba(70,177,255,0.06)' },  // Azure (Discover)
  2: { accent: '#CEA3FF', bg: 'rgba(206,163,255,0.06)' }, // Lavender (Define)
  3: { accent: '#A259FF', bg: 'rgba(162,89,255,0.06)' },  // Purple (Develop)
  4: { accent: '#DEF767', bg: 'rgba(222,247,103,0.06)' }, // Lime (Deliver)
};

const NodeContainer = ({ agent, state, onClick }) => {
  const IconComponent = ICON_MAP[agent.icon] || Box;
  const phaseColor = PHASE_COLORS[agent.phase] || PHASE_COLORS[1];

  const stateClass =
    state === 'running'
      ? 'node-running'
      : state === 'completed'
      ? 'node-completed'
      : 'node-idle';

  return (
    <div
      className={`absolute pointer-events-auto glass-node rounded-xl cursor-pointer
        transition-all duration-400 hover:scale-[1.02] ${stateClass}`}
      style={{
        left: agent.x,
        top: agent.y,
        width: NODE_WIDTH,
        height: NODE_HEIGHT,
      }}
      onClick={onClick}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 pt-3.5 pb-2"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div
            className="w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0"
            style={{ background: phaseColor.bg }}
          >
            <IconComponent size={13} style={{ color: phaseColor.accent }} />
          </div>
          <h3 className="text-[11px] font-bold text-slate-100 truncate tracking-wide font-display">
            {agent.name}
          </h3>
        </div>
        <StatusBadge state={state} />
      </div>

      {/* Body */}
      <div className="px-4 pt-2.5 pb-3.5">
        <p className="text-[10px] text-slate-500 leading-relaxed font-secondary">
          {agent.description}
        </p>
        <div className="mt-2.5 flex items-center justify-between">
          <span
            className="text-[8px] font-bold uppercase tracking-[0.2em] px-1.5 py-0.5 rounded"
            style={{
              color: phaseColor.accent,
              background: phaseColor.bg,
            }}
          >
            {agent.phaseName}
          </span>
          <span className="text-[8px] text-slate-600 font-mono tracking-tighter">
            ID: {agent.id.toUpperCase()}
          </span>
        </div>
      </div>

      {/* Connection Ports */}
      {/* Top Port */}
      {(agent.diamondPos === 'left' || agent.diamondPos === 'right' || agent.diamondPos === 'bottom') && (
        <div
          className="absolute w-3 h-3 rounded-full flex items-center justify-center"
          style={{
            left: NODE_WIDTH / 2 - 6,
            top: -6,
            background: '#000000',
            border: `1.5px solid ${state === 'running' ? '#A259FF' : state === 'completed' ? '#DEF767' : '#1e293b'}`,
          }}
        >
          <div
            className="w-1 h-1 rounded-full"
            style={{
              background: state === 'running' ? '#A259FF' : state === 'completed' ? '#DEF767' : '#334155',
            }}
          />
        </div>
      )}

      {/* Bottom Port */}
      {(agent.diamondPos === 'top' || agent.diamondPos === 'left' || agent.diamondPos === 'right') && (
        <div
          className="absolute w-3 h-3 rounded-full flex items-center justify-center"
          style={{
            left: NODE_WIDTH / 2 - 6,
            bottom: -6,
            background: '#000000',
            border: `1.5px solid ${state === 'completed' ? '#DEF767' : '#1e293b'}`,
          }}
        >
          <div
            className="w-1 h-1 rounded-full"
            style={{ background: state === 'completed' ? '#DEF767' : '#334155' }}
          />
        </div>
      )}

      {/* Left Port (for bridge connections) */}
      {agent.diamondPos === 'top' && agent.phase > 1 && (
        <div
          className="absolute w-3 h-3 rounded-full flex items-center justify-center"
          style={{
            left: -6,
            top: NODE_HEIGHT / 2 - 6,
            background: '#000000',
            border: `1.5px solid ${state === 'running' ? '#A259FF' : '#1e293b'}`,
          }}
        >
          <div className="w-1 h-1 rounded-full" style={{ background: '#334155' }} />
        </div>
      )}

      {/* Right Port (for bridge connections) */}
      {agent.diamondPos === 'bottom' && agent.phase < 4 && (
        <div
          className="absolute w-3 h-3 rounded-full flex items-center justify-center"
          style={{
            right: -6,
            top: NODE_HEIGHT / 2 - 6,
            background: '#000000',
            border: `1.5px solid ${state === 'completed' ? '#DEF767' : '#1e293b'}`,
          }}
        >
          <div className="w-1 h-1 rounded-full" style={{ background: '#334155' }} />
        </div>
      )}
    </div>
  );
};

export default React.memo(NodeContainer);
