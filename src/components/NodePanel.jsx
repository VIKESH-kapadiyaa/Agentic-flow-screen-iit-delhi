import React from 'react';
import { X, Terminal, Cpu, Play, Loader2, CheckCircle2 } from 'lucide-react';
import {
  Search, Eye, Users, BookOpen, User, Compass, Target, Lightbulb,
  Sparkles, Layers, Box, Palette, ShieldCheck, RefreshCw, FileText, Rocket,
} from 'lucide-react';
import StatusBadge from './StatusBadge';

const ICON_MAP = {
  Search, Eye, Users, BookOpen, User, Compass, Target, Lightbulb,
  Sparkles, Layers, Box, Palette, ShieldCheck, RefreshCw, FileText, Rocket,
};

const NodePanel = ({
  agent,
  state,
  task,
  onTaskChange,
  onRunAgent,
  nodeResult,
  isFlowRunning,
  onClose,
}) => {
  if (!agent) return null;

  const IconComponent = ICON_MAP[agent.icon] || Box;
  const isExecuting = state === 'running';
  const canExecute = !isExecuting && !isFlowRunning;

  return (
    <div className="fixed inset-y-0 right-0 w-[420px] z-50 slide-in flex flex-col p-4 pointer-events-none">
      <div
        className="flex-1 glass-node rounded-2xl flex flex-col overflow-hidden pointer-events-auto shadow-2xl"
        style={{ 
          border: '1px solid rgba(255,255,255,0.08)',
          boxShadow: '0 24px 80px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,255,255,0.05)'
        }}
      >
        {/* ── Header ── */}
        <div
          className="flex items-center justify-between px-6 py-5"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
        >
          <div className="flex items-center gap-4">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center shadow-inner"
              style={{ background: 'rgba(162,89,255,0.1)', border: '1px solid rgba(162,89,255,0.15)' }}
            >
              <IconComponent size={18} className="text-[#A259FF]" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white font-display tracking-tight leading-none mb-1">
                {agent.name}
              </h2>
              <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-[#CEA3FF] block opacity-80">
                Phase {agent.phase} · {agent.phaseName}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2.5 rounded-xl hover:bg-white/5 transition-all text-slate-500 hover:text-white"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto no-scrollbar">
          {/* ── Status ── */}
          <div className="px-6 py-4 bg-white/[0.01]" style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-500 font-secondary">
                Control Status
              </span>
              <StatusBadge state={state} />
            </div>
          </div>

          {/* ── Agent Persona ── */}
          <div className="px-6 py-5" style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
            <div className="flex items-center gap-2 mb-3">
              <Cpu size={12} className="text-[#46B1FF]" />
              <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#46B1FF]/80 font-primary">
                Agent Intelligence
              </span>
            </div>
            <div
              className="p-4 rounded-xl text-[11px] text-slate-400 leading-relaxed font-secondary h-28 overflow-y-auto no-scrollbar"
              style={{
                background: 'rgba(0,0,0,0.2)',
                border: '1px solid rgba(255,255,255,0.04)',
              }}
            >
              {agent.systemPrompt}
            </div>
          </div>

          {/* ── Task Input ── */}
          <div className="px-6 py-5" style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
            <div className="flex items-center gap-2 mb-3">
              <Terminal size={12} className="text-[#CEA3FF]" />
              <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#CEA3FF]/80 font-primary">
                Instruction Input
              </span>
            </div>
            <textarea
              value={task}
              onChange={(e) => onTaskChange(e.target.value)}
              placeholder={`Describe the objective for ${agent.name}…`}
              className="w-full h-32 p-4 rounded-xl text-xs text-white resize-none placeholder:text-slate-600 font-secondary border-transparent bg-black/40"
              style={{
                border: '1px solid rgba(255,255,255,0.06)',
              }}
            />
          </div>

          {/* ── Execute Button ── */}
          <div className="px-6 py-5">
            <button
              onClick={() => onRunAgent(agent)}
              disabled={!canExecute}
              className="w-full btn-run px-4 py-4 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-3 transition-all"
            >
              {isExecuting ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Processing Agent Logic…
                </>
              ) : (
                <>
                  <Play size={16} fill="currentColor" />
                  Execute Sequence
                </>
              )}
            </button>
          </div>

          {/* ── Result Section ── */}
          {nodeResult && (
            <div className="px-6 py-5 bg-[#DEF767]/[0.02] mt-4" style={{ borderTop: '1px solid rgba(222,247,103,0.05)' }}>
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle2 size={12} className="text-[#DEF767]" />
                <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#DEF767] font-primary">
                  Synthesized Output
                </span>
              </div>
              <div
                className="p-4 rounded-xl text-[11px] text-slate-300 leading-relaxed font-secondary bg-black/40 border-slate-800/50 border"
              >
                {nodeResult.content?.substring(0, 600)}
                {nodeResult.content?.length > 600 && (
                  <span className="text-[#A259FF] font-bold ml-1 cursor-pointer hover:underline italic">
                    … View extended analysis in Visual Output
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* ── Footer ── */}
        <div
          className="px-6 py-4 flex items-center justify-between mt-auto flex-shrink-0 bg-black/40"
          style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}
        >
          <div className="flex items-center gap-3">
            <span className="text-[9px] text-[#46B1FF] font-mono tracking-wider bg-[#46B1FF]/10 px-2 py-0.5 rounded border border-[#46B1FF]/20 uppercase">
              {agent.id}
            </span>
          </div>
          <span className="text-[8px] font-bold uppercase tracking-[0.3em] text-slate-600 font-display">
            Agentic Core v1.0
          </span>
        </div>
      </div>
    </div>
  );
};

export default NodePanel;
