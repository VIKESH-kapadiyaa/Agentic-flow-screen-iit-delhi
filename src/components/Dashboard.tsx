import React, { useState, useEffect } from 'react';
import { Search, Plus, Star, LayoutGrid, Clock, Folder, Activity, Trash2, User } from 'lucide-react';
// eslint-disable-next-line no-unused-vars
import { motion } from 'framer-motion';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../lib/auth';

export default function Dashboard() {
  const [searchQuery, setSearchQuery] = useState('');
  const [sequences, setSequences] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchSequences = async () => {
    setLoading(true);
    const { data, error: _error } = await supabase
      .from('sequences')
      .select('*, spaces(name)')
      .order('updated_at', { ascending: false });
    
    if (data) setSequences(data);
    setLoading(false);
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchSequences();
  }, []);

  const handleNewFlow = async () => {
    if (!user) return;
    
    const newSeq = {
      user_id: user.id,
      title: 'New Neural Sequence',
      status: 'Idle',
      status_color: '#46B1FF',
      agents_active: 0,
      total_agents: 16,
      is_starred: false,
    };
    
    const { data, error: _insertError } = await supabase
      .from('sequences')
      .insert([newSeq])
      .select()
      .single();
      
    if (data) {
      setSequences([data, ...sequences]);
      localStorage.setItem('active_sequence_id', data.id);
      window.location.href = '/canvas'; 
    }
  };
  
  const handleDelete = async (id) => {
    setSequences(sequences.filter(seq => seq.id !== id));
    await supabase.from('sequences').delete().eq('id', id);
  };

  return (
    <div className="h-screen w-screen bg-[#050507] text-slate-200 flex font-secondary overflow-hidden">
      
      {/* ── SIDEBAR ── */}
      <aside className="w-72 shrink-0 border-r border-white/[0.03] bg-[#0c0c12]/60 backdrop-blur-3xl flex flex-col z-20">
        <div className="p-8">
          <div className="flex items-center gap-4 mb-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#A259FF] to-[#46B1FF] shadow-[0_8px_24px_rgba(162,89,255,0.2)] flex items-center justify-center">
              <img src="/logo.png" alt="Logo" className="w-6 h-6 object-contain" />
            </div>
            <div>
              <h1 className="text-xl font-black text-white font-display tracking-tight">
                Agentic<span className="text-[#A259FF]">Flow</span>
              </h1>
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-[#DEF767]" />
                <span className="text-[9px] text-slate-500 uppercase tracking-widest font-black">Systems Active</span>
              </div>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-4 space-y-10 mt-6">
          <div className="space-y-1">
             <span className="text-[10px] uppercase tracking-[0.25em] text-slate-600 font-black ml-4 mb-4 block">Navigation</span>
             <SidebarItem icon={<LayoutGrid size={18} />} title="All Sequences" active />
             <SidebarItem icon={<Star size={18} />} title="Starred Assets" />
             <SidebarItem icon={<Clock size={18} />} title="Recent Activity" />
          </div>

          <div className="space-y-1">
             <div className="flex items-center justify-between ml-4 mb-4">
               <span className="text-[10px] uppercase tracking-[0.25em] text-slate-600 font-black">Project Spaces</span>
               <button className="text-slate-500 hover:text-white transition-colors p-1"><Plus size={14} /></button>
             </div>
             <SidebarItem icon={<Folder size={18} className="text-[#A259FF]" />} title="Marketing Workflows" />
             <SidebarItem icon={<Folder size={18} className="text-[#46B1FF]" />} title="Dev-Ops Pipelines" />
             <SidebarItem icon={<Folder size={18} className="text-[#DEF767]" />} title="Neural R&D" />
          </div>
        </nav>

        <div className="p-6 border-t border-white/[0.03]">
          <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-black uppercase text-slate-500">Compute usage</span>
              <span className="text-[10px] font-bold text-[#A259FF]">74%</span>
            </div>
            <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-[#A259FF] to-[#46B1FF] w-[74%]" />
            </div>
          </div>
        </div>
      </aside>

      {/* ── MAIN DASHBOARD AREA ── */}
      <main className="flex-1 flex flex-col relative h-screen bg-black">
        {/* Background Mesh */}
        <div className="absolute inset-0 pointer-events-none opacity-[0.4] z-0 overflow-hidden">
          <div className="absolute -top-[20%] -left-[10%] w-[60%] h-[60%] bg-[#A259FF]/10 blur-[120px] rounded-full" />
          <div className="absolute -bottom-[20%] -right-[10%] w-[50%] h-[50%] bg-[#46B1FF]/10 blur-[120px] rounded-full" />
        </div>

        {/* ── HEADER ── */}
        <header className="shrink-0 px-12 py-8 flex justify-between items-center z-10 border-b border-white/[0.03] bg-black/40 backdrop-blur-xl">
          <div className="relative w-[450px] group">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-[#A259FF] transition-colors" size={20} />
            <input 
              type="text" 
              placeholder="Search via sequence fingerprint..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white/[0.03] border border-white/10 rounded-2xl py-4 pl-14 pr-6 text-sm focus:border-[#A259FF]/50 outline-none text-white transition-all shadow-2xl placeholder:text-slate-600 font-secondary"
            />
          </div>
          
          <div className="flex items-center gap-4">
            <button 
              onClick={() => window.location.href = '/profile'}
              className="w-12 h-12 flex items-center justify-center rounded-2xl bg-white/[0.03] border border-white/10 text-slate-400 hover:text-white hover:bg-white/10 transition-all shadow-lg hover:shadow-[0_0_20px_rgba(255,255,255,0.05)] active:scale-95"
              title="User Profile"
            >
              <User size={20} />
            </button>
            <button 
               onClick={handleNewFlow}
               className="bg-white text-black px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-3 hover:bg-[#DEF767] transition-all hover:-translate-y-1 shadow-[0_10px_30px_rgba(255,255,255,0.1)] active:scale-95"
            >
              <Plus size={18} strokeWidth={3} />
              Initialize Sequence
            </button>
          </div>
        </header>

        {/* ── BENTO GRID ── */}
        <div className="flex-1 px-12 py-10 overflow-y-auto custom-scrollbar z-10 relative">
          <div className="flex items-center justify-between mb-10">
            <h2 className="text-2xl font-display font-black text-white tracking-tight flex items-center gap-4">
               Active Orchestrations
               <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] font-black text-slate-500 uppercase tracking-widest">{sequences.length}</span>
            </h2>
            <div className="flex items-center gap-3">
               <button className="p-2.5 rounded-xl bg-white/5 text-slate-500 hover:text-white transition-colors border border-white/5"><Activity size={18} /></button>
            </div>
          </div>
          
          {loading ? (
            <div className="flex justify-center items-center h-40">
              <div className="w-8 h-8 border-4 border-[#A259FF] border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-8">
               {sequences.filter(seq => seq.title.toLowerCase().includes(searchQuery.toLowerCase())).map((seq, i) => (
                 <SessionCard key={seq.id} sequence={seq} index={i} onDelete={handleDelete} />
               ))}
            </div>
          )}
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
  const statusColor = sequence.status_color || sequence.statusColor;
  const isStarred = sequence.is_starred || sequence.isStarred;
  const agentsActive = sequence.agents_active || sequence.agentsActive || 0;
  const totalAgents = sequence.total_agents || sequence.totalAgents || 16;
  const spaceName = sequence.spaces?.name || sequence.space || 'Personal Lab';

  const formatDate = (dateString) => {
    if (!dateString) return 'Just now';
    if (dateString.includes('ago') || dateString === 'Yesterday') return dateString;
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  return (
    <motion.div 
      onClick={() => {
        localStorage.setItem('active_sequence_id', sequence.id);
        window.location.href = '/canvas';
      }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.05 }}
      whileHover={{ y: -8, transition: { duration: 0.2 } }}
      className="bg-[#0f0f15]/40 backdrop-blur-2xl rounded-[32px] p-8 border border-white/[0.04] shadow-2xl group cursor-pointer relative overflow-hidden flex flex-col h-full hover:border-[#A259FF]/30 transition-all"
    >
      {/* Visual Accent */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-[#A259FF]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

      <div className="flex justify-between items-start z-10 relative mb-6">
        <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/[0.05]">
           <Activity size={20} style={{ color: statusColor }} />
        </div>
        <div className="flex items-center gap-2">
          <button 
             onClick={(e) => { e.stopPropagation(); onDelete(sequence.id); }}
             className="w-10 h-10 flex items-center justify-center rounded-xl text-slate-600 hover:text-[#ff4b4b] hover:bg-[#ff4b4b]/10 transition-all relative z-20"
             title="Delete Sequence"
          >
            <Trash2 size={18} />
          </button>
          <button 
             onClick={(e) => { e.stopPropagation(); }}
             className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all relative z-20 ${isStarred ? 'text-[#FACC15] bg-[#FACC15]/10' : 'text-slate-600 hover:text-white hover:bg-white/5'}`}
          >
            <Star size={18} fill={isStarred ? 'currentColor' : 'none'} strokeWidth={2} />
          </button>
        </div>
      </div>

      <div className="z-10 relative">
        <h3 className="text-[20px] font-black text-white font-display leading-[1.2] mb-3 group-hover:text-[#A259FF] transition-colors">{sequence.title}</h3>
        <p className="text-[11px] text-slate-500 font-secondary font-bold uppercase tracking-widest">{spaceName}</p>
      </div>

      <div className="mt-auto z-10 relative pt-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="relative flex h-2 w-2">
              {!isComplete && sequence.status !== 'Idle' && <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ backgroundColor: statusColor }}></span>}
              <span className="relative inline-flex rounded-full h-2 w-2" style={{ backgroundColor: statusColor }}></span>
            </div>
            <span className="text-[10px] uppercase tracking-widest font-black" style={{ color: statusColor }}>
              {sequence.status}
            </span>
          </div>
          <span className="text-[10px] text-slate-600 font-black uppercase tracking-tighter">Updated {formatDate(sequence.updated_at || sequence.lastOrchestrated)}</span>
        </div>

        <div className="w-full h-1 bg-white/[0.03] rounded-full overflow-hidden">
          <div 
            className="h-full transition-all duration-1000 ease-out" 
            style={{ 
              width: `${(agentsActive / totalAgents) * 100}%`,
              backgroundColor: statusColor,
              boxShadow: `0 0 10px ${statusColor}`
            }} 
          />
        </div>
      </div>
    </motion.div>
  );
}
