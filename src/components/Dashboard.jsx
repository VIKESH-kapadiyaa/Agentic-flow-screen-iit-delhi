import React, { useState } from 'react';
import { Search, Plus, Star, LayoutGrid, Clock, Folder, Activity, Trash2 } from 'lucide-react';
// eslint-disable-next-line no-unused-vars
import { motion } from 'framer-motion';

// --- MOCK DATA ---
const INITIAL_MOCK_SEQUENCES = [
  {
    id: 'seq-1',
    title: 'Habit Tracker Architecture',
    status: 'Running Phase 3...',
    statusColor: '#8B5CF6',
    agentsActive: 12,
    totalAgents: 16,
    lastOrchestrated: '2 mins ago',
    isStarred: true,
    space: 'Personal Lab',
  },
  {
    id: 'seq-2',
    title: 'E-Commerce Funnel Optimization',
    status: 'Neural Bridge Optimized',
    statusColor: '#FACC15',
    agentsActive: 16,
    totalAgents: 16,
    lastOrchestrated: '1 hour ago',
    isStarred: false,
    space: 'Marketing Automations',
  },
  {
    id: 'seq-3',
    title: 'AI Micro-SaaS Landing Page',
    status: 'Completed',
    statusColor: '#DEF767',
    agentsActive: 16,
    totalAgents: 16,
    lastOrchestrated: 'Yesterday',
    isStarred: true,
    space: 'Dev Operations',
  },
  {
    id: 'seq-4',
    title: 'User Onboarding UX Flow',
    status: 'Idle',
    statusColor: '#46B1FF',
    agentsActive: 0,
    totalAgents: 16,
    lastOrchestrated: '3 days ago',
    isStarred: false,
    space: 'Dev Operations',
  }
];

export default function Dashboard() {
  const [searchQuery, setSearchQuery] = useState('');
  const [sequences, setSequences] = useState(() => {
    const saved = localStorage.getItem('agentic_sequences');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return INITIAL_MOCK_SEQUENCES;
      }
    }
    localStorage.setItem('agentic_sequences', JSON.stringify(INITIAL_MOCK_SEQUENCES));
    return INITIAL_MOCK_SEQUENCES;
  });

  const handleNewFlow = () => {
    const newSeq = {
      id: `seq-${Date.now()}`,
      title: 'New Neural Sequence',
      status: 'Idle',
      statusColor: '#46B1FF',
      agentsActive: 0,
      totalAgents: 16,
      lastOrchestrated: 'Just now',
      isStarred: false,
      space: 'Personal Lab',
    };
    const updated = [newSeq, ...sequences];
    setSequences(updated);
    localStorage.setItem('agentic_sequences', JSON.stringify(updated));
    window.location.href = '/'; 
  };
  
  const handleDelete = (id) => {
    const updated = sequences.filter(seq => seq.id !== id);
    setSequences(updated);
    localStorage.setItem('agentic_sequences', JSON.stringify(updated));
  };

  return (
    <div className="h-screen w-screen bg-[#050505] text-slate-200 flex font-secondary overflow-hidden">
      
      {/* ── SIDEBAR ── */}
      <aside className="w-64 shrink-0 border-r border-[#3B2B85]/30 bg-[#0a0a0f]/80 backdrop-blur-3xl flex flex-col z-20">
        <div className="p-6">
          <h1 className="text-lg font-bold text-white font-display tracking-wide mb-1 flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-gradient-to-br from-[#8B5CF6] to-[#A259FF] shadow-[0_0_10px_#8B5CF6] flex items-center justify-center">
              <img src="/logo.png" alt="Logo" className="w-4 h-4 object-contain" />
            </div>
            Agentic<span className="text-[#8B5CF6]">Flow</span>
          </h1>
          <p className="text-[10px] text-slate-500 uppercase tracking-[0.2em] mt-1">Mission Control</p>
        </div>

        <nav className="flex-1 px-4 space-y-8 mt-2">
          <div>
             <span className="text-[10px] uppercase tracking-widest text-[#A259FF] font-bold ml-2 mb-3 block">Quick Views</span>
             <SidebarItem icon={<LayoutGrid size={16} />} title="All Sequences" active />
             <SidebarItem icon={<Star size={16} className="text-[#FACC15]" />} title="Starred" />
             <SidebarItem icon={<Clock size={16} />} title="Recent" />
          </div>

          <div>
             <div className="flex items-center justify-between ml-2 mb-3">
               <span className="text-[10px] uppercase tracking-widest text-[#46B1FF] font-bold">Spaces</span>
               <button className="text-slate-400 hover:text-white transition-colors"><Plus size={14} /></button>
             </div>
             <SidebarItem icon={<Folder size={16} color="#8B5CF6" />} title="Marketing Automations" />
             <SidebarItem icon={<Folder size={16} color="#46B1FF" />} title="Dev Operations" />
             <SidebarItem icon={<Folder size={16} color="#DEF767" />} title="Personal Lab" />
          </div>
        </nav>
      </aside>

      {/* ── MAIN DASHBOARD AREA ── */}
      <main className="flex-1 flex flex-col relative h-screen">
        {/* Background Decorative Details */}
        <div className="absolute inset-0 pointer-events-none opacity-[0.15] z-0"
             style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(162, 89, 255, 0.4) 1px, transparent 0)', backgroundSize: '40px 40px' }} />

        {/* ── HEADER ── */}
        <header className="shrink-0 px-10 py-6 flex justify-between items-center z-10 border-b border-white/[0.04] bg-[#0a0a0f]/40 backdrop-blur-xl relative">
          <div className="relative w-96 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-[#8B5CF6] transition-colors" size={18} />
            <input 
              type="text" 
              placeholder="Search Neural Sequences..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#13131a] border border-white/5 rounded-2xl py-3 pl-12 pr-4 text-sm focus:border-[#8B5CF6]/50 outline-none text-white transition-all shadow-inner placeholder:text-slate-600"
            />
          </div>
          
          <button 
             onClick={handleNewFlow}
             className="bg-gradient-to-r from-[#8B5CF6] to-[#A259FF] text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 hover:shadow-[0_0_20px_rgba(139,92,246,0.4)] transition-all hover:-translate-y-0.5"
          >
            <Plus size={18} />
            Initialize New Flow
          </button>
        </header>

        {/* ── BENTO GRID ── */}
        <div className="flex-1 px-10 py-8 overflow-y-auto custom-scrollbar z-10 relative">
          <h2 className="text-xl font-display font-bold text-white mb-8 tracking-wide flex items-center gap-3">
             <div className="w-2 h-2 rounded-full bg-[#8B5CF6] shadow-[0_0_8px_#8B5CF6] animate-pulse" />
             Active Orchestrations
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 auto-rows-[240px]">
             {sequences.filter(seq => seq.title.toLowerCase().includes(searchQuery.toLowerCase())).map((seq, i) => (
               <SessionCard key={seq.id} sequence={seq} index={i} onDelete={handleDelete} />
             ))}
          </div>
        </div>
      </main>
    </div>
  );
}

// Simple Sidebar Item Component
function SidebarItem({ icon, title, active }) {
  return (
    <button className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${active ? 'bg-white/[0.08] text-white shadow-inner border border-white/5' : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'}`}>
      {icon}
      <span className="text-sm tracking-wide text-left">{title}</span>
    </button>
  );
}

// Session Card Component
function SessionCard({ sequence, index, onDelete }) {
  const isComplete = sequence.status === 'Completed';

  return (
    <motion.div 
      onClick={() => window.location.href = '/'}
      initial={{ opacity: 0, scale: 0.95, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.4, delay: Math.min(index * 0.1, 0.5), ease: 'easeOut' }}
      whileHover={{ y: -4, border: '1px solid rgba(139, 92, 246, 0.4)' }}
      className="bg-[#0f0f15]/80 backdrop-blur-xl rounded-3xl p-6 border border-white/[0.04] shadow-xl group cursor-pointer relative overflow-hidden flex flex-col h-full"
    >
      {/* Canvas Miniature Preview */}
      <div className="absolute -right-6 -top-6 w-48 h-48 opacity-[0.12] group-hover:opacity-[0.25] transition-opacity duration-500 pointer-events-none">
         <svg viewBox="0 0 100 100" className="w-full h-full">
            <circle cx="30" cy="50" r="4" fill={sequence.statusColor} />
            <circle cx="50" cy="30" r="4" fill={sequence.statusColor} />
            <circle cx="50" cy="70" r="4" fill={sequence.statusColor} />
            <circle cx="70" cy="50" r="4" fill={sequence.statusColor} />
            <path d="M34 50 L46 34 M34 50 L46 66 M54 30 L66 46 M54 70 L66 54" stroke={sequence.statusColor} strokeWidth="1" strokeDasharray="3,3" fill="none" />
         </svg>
         <div className="absolute inset-0 bg-gradient-to-bl from-transparent via-[#0f0f15]/40 to-[#0f0f15]" />
      </div>

      <div className="flex justify-between items-start z-10 relative">
        <h3 className="text-xl font-bold text-white font-display leading-tight max-w-[85%]">{sequence.title}</h3>
        <div className="flex items-center gap-2">
          <button 
             onClick={(e) => { e.stopPropagation(); onDelete(sequence.id); }}
             className="text-slate-600 hover:text-[#ff4b4b] transition-colors relative z-20"
             title="Delete Sequence"
          >
            <Trash2 size={18} />
          </button>
          <button 
             onClick={(e) => { e.stopPropagation(); /* would toggle star state here */ }}
             className={`transition-colors relative z-20 ${sequence.isStarred ? 'text-[#FACC15]' : 'text-slate-600 hover:text-white'}`}
          >
            <Star size={18} fill={sequence.isStarred ? 'currentColor' : 'none'} strokeWidth={sequence.isStarred ? 0 : 2} />
          </button>
        </div>
      </div>

      <div className="mt-auto z-10 relative">
        <div className="flex items-center gap-2 mb-5">
          <div className="relative flex h-2.5 w-2.5">
            {!isComplete && sequence.status !== 'Idle' && <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ backgroundColor: sequence.statusColor }}></span>}
            <span className="relative inline-flex rounded-full h-2.5 w-2.5" style={{ backgroundColor: sequence.statusColor }}></span>
          </div>
          <span className="text-[11px] uppercase tracking-widest font-bold" style={{ color: sequence.statusColor }}>
            {sequence.status}
          </span>
        </div>

        <div className="flex items-center justify-between text-[11px] text-slate-500 font-medium border-t border-white/[0.04] pt-4">
          <div className="flex items-center gap-1.5 bg-white/5 py-1 px-2.5 rounded-lg border border-white/5">
            <Activity size={13} style={{ color: sequence.statusColor }} />
            <span className="text-slate-300">{sequence.agentsActive}</span> / {sequence.totalAgents} Active
          </div>
          <span>Updated {sequence.lastOrchestrated}</span>
        </div>
      </div>
    </motion.div>
  );
}
