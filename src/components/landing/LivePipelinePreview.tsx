import React from 'react';
import { Search, Eye, Star, BarChart, Layout, Target, Satellite, Map, Smartphone, Image as ImageIcon, Link, Compass, FlaskConical, CheckSquare, Microscope, ClipboardList } from 'lucide-react';

// eslint-disable-next-line no-unused-vars
const PipelineCard = ({ title, icon: Icon, iconColor, isHighlighted }) => (
  <div className="bg-[#111116]/80 border border-white/[0.03] rounded-xl p-3.5 flex items-center gap-4 hover:bg-white/[0.05] hover:border-white/10 transition-all duration-300 group cursor-default">
    <div className={`relative w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 bg-[#1A1A24] border border-white/5 shadow-inner`}>
      {isHighlighted && (
        <div className="absolute inset-0 bg-indigo-500/30 rounded-lg blur-md animate-pulse"></div>
      )}
      <Icon className={`w-4 h-4 relative z-10 ${iconColor}`} />
    </div>
    <div>
      <h4 className="text-[0.65rem] font-bold text-zinc-200 tracking-widest uppercase mb-1">{title}</h4>
      <div className="flex items-center gap-1.5">
        <div className="w-1.5 h-1.5 rounded-full bg-zinc-600"></div>
        <span className="text-[0.6rem] font-mono text-zinc-500 uppercase tracking-widest">Standby</span>
      </div>
    </div>
  </div>
);

export const LivePipelinePreview = () => (
  <div className="w-full max-w-5xl mx-auto mt-12 relative z-10">
    <div className="absolute -top-6 left-2 text-[0.65rem] font-bold tracking-[0.3em] text-indigo-400 uppercase">
      Live Pipeline Preview
    </div>
    
    <div className="bg-[#08080B]/90 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden relative">
      <div className="flex items-center justify-between px-6 py-4 bg-[#050507] border-b border-white/5">
        <div className="flex items-center gap-6">
          <div className="flex gap-2">
            <div className="w-3 h-3 rounded-full bg-[#FF5F56]"></div>
            <div className="w-3 h-3 rounded-full bg-[#FFBD2E]"></div>
            <div className="w-3 h-3 rounded-full bg-[#27C93F]"></div>
          </div>
          <div className="hidden sm:block text-[0.65rem] font-mono text-zinc-500 tracking-widest uppercase">
            Pipeline • Discover → Define → Develop → Deliver
          </div>
        </div>
        <div className="flex items-center gap-2 bg-green-500/10 px-3 py-1 rounded-full border border-green-500/20">
          <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
          <div className="text-[0.6rem] font-mono font-bold text-green-400 tracking-widest uppercase">
            Sync: 0/16 Agents Active
          </div>
        </div>
      </div>

      <div className="p-8 overflow-x-auto">
        <div className="min-w-[800px] grid grid-cols-4 gap-6">
          <div className="space-y-4">
            <h3 className="text-[0.7rem] font-bold text-zinc-400 tracking-[0.2em] uppercase mb-6 pb-3 border-b border-white/5">Discover</h3>
            <PipelineCard title="Secondary Research" icon={Search} iconColor="text-blue-400" />
            <PipelineCard title="Observations" icon={Eye} iconColor="text-purple-400" />
            <PipelineCard title="Reviews" icon={Star} iconColor="text-yellow-400" />
            <PipelineCard title="Primary Research" icon={BarChart} iconColor="text-pink-400" />
          </div>

          <div className="space-y-4">
            <h3 className="text-[0.7rem] font-bold text-zinc-400 tracking-[0.2em] uppercase mb-6 pb-3 border-b border-white/5">Define</h3>
            <PipelineCard title="Architecture" icon={Layout} iconColor="text-slate-300" />
            <PipelineCard title="Persuasion Tools" icon={Target} iconColor="text-rose-400" />
            <PipelineCard title="Tech & Channels" icon={Satellite} iconColor="text-indigo-400" />
            <PipelineCard title="UX Flow Mapping" icon={Map} iconColor="text-cyan-400" />
          </div>

          <div className="space-y-4">
            <h3 className="text-[0.7rem] font-bold text-zinc-400 tracking-[0.2em] uppercase mb-6 pb-3 border-b border-white/5">Develop</h3>
            <PipelineCard title="Screens" icon={Smartphone} iconColor="text-slate-400" />
            <PipelineCard title="Images & Texts" icon={ImageIcon} iconColor="text-purple-300" />
            <PipelineCard title="Interactions" icon={Link} iconColor="text-zinc-400" />
            <PipelineCard title="Navigations" icon={Compass} iconColor="text-amber-400" />
          </div>

          <div className="space-y-4">
            <h3 className="text-[0.7rem] font-bold text-zinc-400 tracking-[0.2em] uppercase mb-6 pb-3 border-b border-white/5">Deliver</h3>
            <PipelineCard title="Brand Test" icon={FlaskConical} iconColor="text-indigo-400" isHighlighted={true} />
            <PipelineCard title="Expert Review" icon={CheckSquare} iconColor="text-emerald-400" />
            <PipelineCard title="UX Test" icon={Microscope} iconColor="text-violet-400" />
            <PipelineCard title="Usability Test" icon={ClipboardList} iconColor="text-blue-500" />
          </div>
        </div>
      </div>
    </div>
  </div>
);
