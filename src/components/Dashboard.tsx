import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Search, Plus, Star, LayoutGrid, Clock, Folder, Trash2, User, X, GripVertical } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../lib/auth';

// ── Brand color palette for auto-assigning folder colors ──
const FOLDER_COLORS = ['#A259FF', '#46B1FF', '#DEF767', '#FF6A6A', '#FACC15'];

type ActiveView = 'all' | 'starred' | 'recent' | 'folder';

interface FolderType {
  id: string;
  name: string;
  color: string;
  user_id: string;
  created_at: string;
}

export default function Dashboard() {
  const [searchQuery, setSearchQuery] = useState('');
  const [sequences, setSequences] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState<ActiveView>('all');
  const [activeFolderId, setActiveFolderId] = useState<string | null>(null);
  const [folders, setFolders] = useState<FolderType[]>([]);
  const [showNewFolderInput, setShowNewFolderInput] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [draggedSequenceId, setDraggedSequenceId] = useState<string | null>(null);
  const [dragOverFolderId, setDragOverFolderId] = useState<string | null>(null);
  const { user } = useAuth();

  // ── Data Fetching ──
  const fetchSequences = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('sequences')
      .select('*')
      .order('updated_at', { ascending: false });
    
    if (data) setSequences(data);
    setLoading(false);
  };

  const fetchFolders = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('spaces')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true });
    
    if (data) setFolders(data);
  };

  useEffect(() => {
    fetchSequences();
    fetchFolders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // ── Actions ──
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
      space_id: activeFolderId || null,
    };
    
    const { data } = await supabase
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
  
  const handleDelete = async (id: string | number) => {
    setSequences(sequences.filter((seq: any) => seq.id !== id));
    await supabase.from('sequences').delete().eq('id', id);
  };

  const handleToggleStar = async (id: string | number) => {
    const seq = sequences.find((s: any) => s.id === id);
    if (!seq) return;
    
    const newStarred = !seq.is_starred;
    // Optimistic update
    setSequences(sequences.map((s: any) => s.id === id ? { ...s, is_starred: newStarred } : s));
    await supabase.from('sequences').update({ is_starred: newStarred }).eq('id', id);
  };

  // ── Folder CRUD ──
  const handleCreateFolder = async () => {
    if (!user || !newFolderName.trim()) return;
    
    const color = FOLDER_COLORS[folders.length % FOLDER_COLORS.length];
    const { data } = await supabase
      .from('spaces')
      .insert([{ name: newFolderName.trim(), user_id: user.id }])
      .select()
      .single();
    
    if (data) {
      setFolders([...folders, data]);
    }
    setNewFolderName('');
    setShowNewFolderInput(false);
  };

  const handleDeleteFolder = async (folderId: string) => {
    // Unlink all sequences in this folder first
    await supabase.from('sequences').update({ space_id: null }).eq('space_id', folderId);
    setSequences(sequences.map((s: any) => s.space_id === folderId ? { ...s, space_id: null } : s));
    
    // Delete the folder
    await supabase.from('spaces').delete().eq('id', folderId);
    setFolders(folders.filter((f: FolderType) => f.id !== folderId));
    
    // If viewing this folder, go back to all
    if (activeFolderId === folderId) {
      setActiveView('all');
      setActiveFolderId(null);
    }
  };

  // ── Drag & Drop (move workflow into folder) ──
  const handleDragStart = (seqId: string) => {
    setDraggedSequenceId(seqId);
  };

  const handleDragEnd = async () => {
    if (draggedSequenceId && dragOverFolderId) {
      // Move the sequence to the folder
      setSequences(sequences.map((s: any) => 
        s.id === draggedSequenceId ? { ...s, space_id: dragOverFolderId } : s
      ));
      await supabase.from('sequences').update({ space_id: dragOverFolderId }).eq('id', draggedSequenceId);
    }
    setDraggedSequenceId(null);
    setDragOverFolderId(null);
  };

  // ── View Filtering ──
  const getFilteredSequences = () => {
    let filtered = sequences;
    
    if (activeView === 'starred') {
      filtered = filtered.filter((s: any) => s.is_starred);
    } else if (activeView === 'recent') {
      filtered = filtered.slice(0, 10); // Already sorted by updated_at desc
    } else if (activeView === 'folder' && activeFolderId) {
      filtered = filtered.filter((s: any) => s.space_id === activeFolderId);
    }
    
    if (searchQuery) {
      filtered = filtered.filter((s: any) => 
        s.title?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    return filtered;
  };

  const getViewTitle = () => {
    if (activeView === 'starred') return 'Starred Assets';
    if (activeView === 'recent') return 'Recent Activity';
    if (activeView === 'folder') {
      const folder = folders.find((f: FolderType) => f.id === activeFolderId);
      return folder?.name || 'Folder';
    }
    return 'All Sequences';
  };

  const filteredSequences = getFilteredSequences();

  // ── Folder sequence counts ──
  const folderCounts: Record<string, number> = {};
  folders.forEach((f: FolderType) => {
    folderCounts[f.id] = sequences.filter((s: any) => s.space_id === f.id).length;
  });

  return (
    <div className="h-screen w-screen bg-[#050507] text-slate-200 flex font-secondary overflow-hidden">
      
      {/* ── SIDEBAR ── */}
      <aside className="w-72 shrink-0 border-r border-white/[0.03] bg-[#0c0c12]/60 backdrop-blur-3xl flex flex-col z-20">
        <div className="p-8 mb-4">
          <div className="flex items-center gap-6">
            <div className="w-11 h-11 rounded-xl shadow-lg flex items-center justify-center shrink-0 logo-gradient-box">
              <img src="/logo.png" alt="Logo" className="w-6 h-6 object-contain" />
            </div>
            <h1 className="text-2xl font-black text-white font-display tracking-tight">
              Agentic<span className="text-[#A259FF]">Flow</span>
            </h1>
          </div>
        </div>

        <nav className="flex-1 px-4 space-y-10 mt-6 overflow-y-auto custom-scrollbar">
          {/* Navigation Section */}
          <div className="space-y-1">
            <span className="text-[10px] uppercase tracking-[0.25em] text-slate-600 font-black ml-4 mb-4 block">Navigation</span>
            <SidebarItem 
              icon={<LayoutGrid size={18} />} 
              title="All Sequences" 
              active={activeView === 'all'} 
              onClick={() => { setActiveView('all'); setActiveFolderId(null); }} 
            />
            <SidebarItem 
              icon={<Star size={18} />} 
              title="Starred Assets" 
              active={activeView === 'starred'} 
              onClick={() => { setActiveView('starred'); setActiveFolderId(null); }} 
            />
            <SidebarItem 
              icon={<Clock size={18} />} 
              title="Recent Activity" 
              active={activeView === 'recent'} 
              onClick={() => { setActiveView('recent'); setActiveFolderId(null); }} 
            />
          </div>

          {/* Project Spaces Section */}
          <div className="space-y-1">
            <div className="flex items-center justify-between ml-4 mb-4">
              <span className="text-[10px] uppercase tracking-[0.25em] text-slate-600 font-black">Project Spaces</span>
              <button 
                aria-label="Add project space" 
                title="Add project space" 
                className="text-slate-500 hover:text-white transition-colors p-1"
                onClick={() => setShowNewFolderInput(true)}
              >
                <Plus size={14} />
              </button>
            </div>

            {/* New Folder Input */}
            <AnimatePresence>
              {showNewFolderInput && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }} 
                  animate={{ opacity: 1, height: 'auto' }} 
                  exit={{ opacity: 0, height: 0 }}
                  className="px-3 mb-2 overflow-hidden"
                >
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="Folder name..."
                      value={newFolderName}
                      onChange={(e: any) => setNewFolderName(e.target.value)}
                      onKeyDown={(e: any) => { if (e.key === 'Enter') handleCreateFolder(); if (e.key === 'Escape') setShowNewFolderInput(false); }}
                      autoFocus
                      className="flex-1 bg-white/[0.04] border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-[#A259FF]/50 placeholder:text-slate-600"
                      title="New folder name"
                      aria-label="New folder name"
                    />
                    <button 
                      onClick={handleCreateFolder}
                      className="p-1.5 rounded-lg bg-[#A259FF]/20 text-[#A259FF] hover:bg-[#A259FF]/30 transition-colors"
                      title="Create folder"
                      aria-label="Create folder"
                    >
                      <Plus size={14} />
                    </button>
                    <button 
                      onClick={() => { setShowNewFolderInput(false); setNewFolderName(''); }}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-white/5 transition-colors"
                      title="Cancel"
                      aria-label="Cancel"
                    >
                      <X size={14} />
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Dynamic Folder List */}
            {folders.map((folder: FolderType, i: number) => (
              <FolderItem
                key={folder.id}
                folder={{ ...folder, color: folder.color || FOLDER_COLORS[i % FOLDER_COLORS.length]! }}
                count={folderCounts[folder.id] || 0}
                active={activeView === 'folder' && activeFolderId === folder.id}
                isDragOver={dragOverFolderId === folder.id}
                onClick={() => { setActiveView('folder'); setActiveFolderId(folder.id); }}
                onDelete={() => handleDeleteFolder(folder.id)}
                onDragOver={() => setDragOverFolderId(folder.id)}
                onDragLeave={() => setDragOverFolderId(null)}
                onDrop={handleDragEnd}
              />
            ))}

            {folders.length === 0 && !showNewFolderInput && (
              <p className="text-[11px] text-slate-600 ml-4 italic">No folders yet. Click + to create one.</p>
            )}
          </div>
        </nav>
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
          <div className="flex-1"></div>
          <div className="relative w-[450px] group flex-none mx-auto">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-[#A259FF] transition-colors" size={20} />
            <input 
              type="text" 
              placeholder="Search via sequence fingerprint..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white/[0.03] border border-white/10 rounded-2xl py-4 pl-14 pr-6 text-sm focus:border-[#A259FF]/50 outline-none text-white transition-all shadow-2xl placeholder:text-slate-600 font-secondary"
            />
          </div>
          
          <div className="flex items-center gap-4 flex-1 justify-end">
            <button 
              onClick={() => window.location.href = '/profile'}
              className="w-12 h-12 flex items-center justify-center rounded-2xl bg-white/[0.03] border border-white/10 text-slate-400 hover:text-white hover:bg-white/10 transition-all shadow-lg hover:shadow-[0_0_20px_rgba(255,255,255,0.05)] active:scale-95"
              aria-label="User Profile"
              title="User Profile"
            >
              <User size={20} />
            </button>
            <button 
               onClick={handleNewFlow}
               className="bg-white text-black px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-3 hover:bg-[#DEF767] transition-all hover:-translate-y-1 shadow-[0_10px_30px_rgba(255,255,255,0.1)] active:scale-95"
            >
              <Plus size={18} strokeWidth={3} />
              Create Flow
            </button>
          </div>
        </header>

        {/* ── CONTENT ── */}
        <div className="flex-1 px-12 py-10 overflow-y-auto custom-scrollbar z-10 relative">
          <div className="flex items-center justify-between mb-10">
            <h2 className="text-2xl font-display font-black text-white tracking-tight flex items-center gap-4">
               {getViewTitle()}
            </h2>
          </div>
          
          {loading ? (
            <div className="flex justify-center items-center h-40">
              <div className="w-8 h-8 border-4 border-[#A259FF] border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : activeView === 'recent' ? (
            /* ── Recent Activity Timeline ── */
            <div className="space-y-3 max-w-3xl">
              {filteredSequences.length === 0 ? (
                <p className="text-slate-500 text-sm">No recent activity.</p>
              ) : (
                filteredSequences.map((seq: any, i: number) => (
                  <motion.div
                    key={seq.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: i * 0.04 }}
                    onClick={() => {
                      localStorage.setItem('active_sequence_id', seq.id);
                      window.location.href = '/canvas';
                    }}
                    className="flex items-center gap-4 px-6 py-4 rounded-2xl bg-white/[0.02] border border-white/[0.04] hover:border-[#A259FF]/30 hover:bg-white/[0.04] cursor-pointer transition-all group"
                  >
                    <div className="w-2 h-2 rounded-full bg-[#A259FF] shrink-0" />
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-bold text-white truncate group-hover:text-[#A259FF] transition-colors">{seq.title}</h4>
                    </div>
                    <span className="text-[10px] text-slate-600 font-bold uppercase tracking-wider shrink-0">
                      {formatDate(seq.updated_at)}
                    </span>
                    {seq.is_starred && <Star size={14} className="text-[#FACC15] shrink-0" fill="currentColor" />}
                  </motion.div>
                ))
              )}
            </div>
          ) : (
            /* ── Card Grid ── */
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-8">
               {filteredSequences.map((seq: any, i: number) => (
                 <SessionCard 
                   key={seq.id} 
                   sequence={seq} 
                   index={i} 
                   onDelete={handleDelete} 
                   onToggleStar={handleToggleStar}
                   onDragStart={handleDragStart}
                   isDragging={draggedSequenceId === seq.id}
                 />
               ))}
               {filteredSequences.length === 0 && (
                 <div className="col-span-full text-center py-20">
                   <p className="text-slate-500 text-sm">
                     {activeView === 'starred' ? 'No starred sequences yet. Star a workflow to see it here.' : 
                      activeView === 'folder' ? 'This folder is empty. Drag workflows here to organize them.' :
                      'No sequences found.'}
                   </p>
                 </div>
               )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

// ── Helper ──
function formatDate(dateString: string) {
  if (!dateString) return 'Just now';
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

// ── Sidebar Item ──
interface SidebarItemProps {
  icon: React.ReactNode;
  title: string;
  active?: boolean;
  onClick?: () => void;
}

function SidebarItem({ icon, title, active, onClick }: SidebarItemProps) {
  return (
    <button 
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${active ? 'bg-white/[0.08] text-white shadow-inner border border-white/5' : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'}`}
    >
      {icon}
      <span className="text-sm tracking-wide text-left">{title}</span>
    </button>
  );
}

// ── Folder Item (with drop target) ──
interface FolderItemProps {
  folder: FolderType;
  count: number;
  active: boolean;
  isDragOver: boolean;
  onClick: () => void;
  onDelete: () => void;
  onDragOver: () => void;
  onDragLeave: () => void;
  onDrop: () => void;
}

function FolderItem({ folder, count, active, isDragOver, onClick, onDelete, onDragOver, onDragLeave, onDrop }: FolderItemProps) {
  return (
    <div
      onDragOver={(e: any) => { e.preventDefault(); onDragOver(); }}
      onDragLeave={onDragLeave}
      onDrop={(e: any) => { e.preventDefault(); onDrop(); }}
      className={`group relative w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all cursor-pointer ${
        isDragOver 
          ? 'bg-[#A259FF]/20 border border-[#A259FF]/40 scale-[1.02]' 
          : active 
            ? 'bg-white/[0.08] text-white shadow-inner border border-white/5' 
            : 'text-slate-400 hover:text-white hover:bg-white/[0.04] border border-transparent'
      }`}
      onClick={onClick}
    >
      <Folder size={18} style={{ color: folder.color }} />
      <span className="text-sm tracking-wide text-left flex-1 truncate">{folder.name}</span>
      {count > 0 && (
        <span className="text-[9px] bg-white/5 border border-white/10 px-1.5 py-0.5 rounded-md text-slate-500 font-bold">{count}</span>
      )}
      <button
        onClick={(e: any) => { e.stopPropagation(); onDelete(); }}
        className="opacity-0 group-hover:opacity-100 p-1 rounded-lg text-slate-600 hover:text-[#ff4b4b] transition-all"
        title={`Delete ${folder.name}`}
        aria-label={`Delete ${folder.name}`}
      >
        <Trash2 size={14} />
      </button>
    </div>
  );
}

// ── Session Card (with long-press drag) ──
interface SessionCardProps {
  sequence: any;
  index: number;
  onDelete: (id: string | number) => void;
  onToggleStar: (id: string | number) => void;
  onDragStart: (id: string) => void;
  isDragging: boolean;
}

function SessionCard({ sequence, index, onDelete, onToggleStar, onDragStart, isDragging }: SessionCardProps) {
  const isStarred = sequence.is_starred;
  const longPressRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [isLongPressed, setIsLongPressed] = useState(false);

  const handlePointerDown = useCallback(() => {
    longPressRef.current = setTimeout(() => {
      setIsLongPressed(true);
    }, 400);
  }, []);

  const handlePointerUp = useCallback(() => {
    if (longPressRef.current) {
      clearTimeout(longPressRef.current);
      longPressRef.current = null;
    }
    setIsLongPressed(false);
  }, []);

  const handleDragStartInternal = useCallback(() => {
    if (isLongPressed) {
      onDragStart(sequence.id);
    }
  }, [isLongPressed, onDragStart, sequence.id]);

  return (
    <motion.div 
      draggable={isLongPressed}
      onDragStart={handleDragStartInternal}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
      onClick={() => {
        if (!isLongPressed) {
          localStorage.setItem('active_sequence_id', sequence.id);
          window.location.href = '/canvas';
        }
      }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: isDragging ? 0.4 : 1, y: 0, scale: isLongPressed ? 1.03 : 1 }}
      transition={{ duration: 0.5, delay: index * 0.05 }}
      whileHover={{ y: -8, transition: { duration: 0.2 } }}
      className={`bg-[#0f0f15]/40 backdrop-blur-2xl rounded-[32px] p-8 border border-white/[0.04] shadow-2xl group cursor-pointer relative overflow-hidden flex flex-col h-full hover:border-[#A259FF]/30 transition-all ${
        isLongPressed ? 'ring-2 ring-[#A259FF]/40 cursor-grab' : ''
      }`}
    >
      {/* Visual Accent */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-[#A259FF]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

      {/* Drag Handle Indicator */}
      {isLongPressed && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2">
          <GripVertical size={16} className="text-[#A259FF]/60" />
        </div>
      )}

      <div className="flex justify-between items-start z-10 relative mb-6">
        <div />
        <div className="flex items-center gap-2">
          <button 
             onClick={(e: any) => { e.stopPropagation(); onDelete(sequence.id); }}
             className="w-10 h-10 flex items-center justify-center rounded-xl text-slate-600 hover:text-[#ff4b4b] hover:bg-[#ff4b4b]/10 transition-all relative z-20"
             title="Delete Sequence"
             aria-label="Delete Sequence"
          >
            <Trash2 size={18} />
          </button>
          <button 
             onClick={(e: any) => { e.stopPropagation(); onToggleStar(sequence.id); }}
             aria-label={isStarred ? "Unstar sequence" : "Star sequence"}
             title={isStarred ? "Unstar sequence" : "Star sequence"}
             className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all relative z-20 ${isStarred ? 'text-[#FACC15] bg-[#FACC15]/10' : 'text-slate-600 hover:text-white hover:bg-white/5'}`}
          >
            <Star size={18} fill={isStarred ? 'currentColor' : 'none'} strokeWidth={2} />
          </button>
        </div>
      </div>

      <div className="z-10 relative flex-1">
        <h3 className="text-[20px] font-black text-white font-display leading-[1.2] mb-3 group-hover:text-[#A259FF] transition-colors">{sequence.title}</h3>
      </div>

      <div className="mt-auto z-10 relative pt-4">
        <span className="text-[10px] text-slate-600 font-bold uppercase tracking-tighter">Updated {formatDate(sequence.updated_at)}</span>
      </div>
    </motion.div>
  );
}
