import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useBuilderStore } from '../lib/builderStore';
import { Settings, Play, Clock, Key, Trash2, Download, Loader2, Webhook, Link2 } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

const BuilderSidebar = () => {
  const { blocks, connections, selectedElementId, setSelectedElementId, updateBlock, deleteBlock, deleteConnection } = useBuilderStore();
  
  const [showResultOverlay, setShowResultOverlay] = useState(false);
  const [globalContextLog] = useState("");
  const [availableSequences, setAvailableSequences] = useState<any[]>([]);

  const selectedBlock = blocks.find(b => b.id === selectedElementId);
  const selectedConnection = connections.find(c => c.id === selectedElementId);

  // Fetch available sequences for webhook linking
  useEffect(() => {
    if (selectedBlock?.type === 'webhook') {
      const fetchSequences = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;
        const { data } = await supabase
          .from('sequences')
          .select('id, title')
          .eq('user_id', session.user.id)
          .order('updated_at', { ascending: false });
        if (data) setAvailableSequences(data);
      };
      fetchSequences();
    }
  }, [selectedBlock?.id, selectedBlock?.type]);

  const isWebhook = selectedBlock?.type === 'webhook';

  return (
    <div className={`absolute right-0 top-0 h-full w-[460px] bg-[#0c0c14]/60 backdrop-blur-2xl border-l border-white/5 p-0 shadow-2xl transition-transform duration-500 z-50 flex flex-col ${selectedElementId ? 'translate-x-0' : 'translate-x-full'}`}>
      {selectedElementId && (
        <>
          <div className="flex justify-between items-center p-6 border-b border-white/[0.04] bg-black/40">
            <div>
              <h2 className="font-bold text-[10px] uppercase tracking-widest mb-1" style={{ color: isWebhook ? '#46B1FF' : '#A259FF' }}>
                {selectedBlock ? (isWebhook ? 'Webhook Configuration' : 'Block Configuration') : 'Connection Configuration'}
              </h2>
              <span className="text-white font-black tracking-wide font-display text-lg">
                {selectedBlock ? selectedBlock.name : 'Wire Options'}
              </span>
            </div>
            <button onClick={() => setSelectedElementId(null)} className="p-2 bg-white/5 rounded-full text-slate-500 hover:text-white hover:bg-white/10 transition-colors">✕</button>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
            {selectedBlock ? (
              <div className="animate-fade-in flex flex-col h-full gap-6">
                {/* Core Settings */}
                <div className="space-y-4">
                  <div>
                    <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2 block">
                      {isWebhook ? 'Bridge Name' : 'Agent Name'}
                    </label>
                    <input
                      value={selectedBlock.name}
                      onChange={(e) => updateBlock(selectedBlock.id, { name: e.target.value })}
                      className="w-full bg-black/40 border border-white/5 focus:border-[#A259FF]/50 rounded-xl px-4 py-3 text-sm text-white transition-colors outline-none"
                      placeholder={isWebhook ? 'E.g., Data Pipeline Bridge' : 'E.g., User Researcher'}
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2 block">
                      {isWebhook ? 'Bridge Description' : 'Objective / Description'}
                    </label>
                    <textarea
                      value={selectedBlock.description}
                      onChange={(e) => updateBlock(selectedBlock.id, { description: e.target.value })}
                      className="w-full bg-black/40 border border-white/5 focus:border-[#A259FF]/50 rounded-xl px-4 py-3 text-sm text-slate-300 min-h-[100px] transition-colors outline-none resize-none custom-scrollbar"
                      placeholder={isWebhook ? 'Describe what data this bridge passes...' : 'Describe what this agent does...'}
                    />
                  </div>
                </div>

                {/* Webhook-specific: Linked Sequence Picker */}
                {isWebhook && (
                  <div className="space-y-4 pt-4 border-t border-[#46B1FF]/10">
                    <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                      <Link2 size={14} className="text-[#46B1FF]" /> Linked Workflow
                    </h3>
                    <select
                      title="Select linked workflow"
                      value={selectedBlock.linkedSequenceId || ''}
                      onChange={(e) => {
                        const seq = availableSequences.find((s: any) => s.id === e.target.value);
                        updateBlock(selectedBlock.id, {
                          linkedSequenceId: e.target.value || null,
                          linkedSequenceName: seq?.title || ''
                        });
                      }}
                      className="w-full bg-black/40 border border-[#46B1FF]/20 focus:border-[#46B1FF]/50 rounded-xl px-4 py-3 text-sm text-white transition-colors outline-none appearance-none"
                    >
                      <option value="">— Select a workflow —</option>
                      {availableSequences
                        .filter((s: any) => s.id !== localStorage.getItem('active_sequence_id'))
                        .map((s: any) => (
                          <option key={s.id} value={s.id}>{s.title}</option>
                        ))
                      }
                    </select>
                    {selectedBlock.linkedSequenceId && (
                      <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-[#46B1FF]/10 border border-[#46B1FF]/20">
                        <Webhook size={14} className="text-[#46B1FF]" />
                        <span className="text-xs text-[#46B1FF] font-bold">Bridge active → {selectedBlock.linkedSequenceName}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Agent-specific: Triggers and Waits */}
                {!isWebhook && (
                  <>
                    <div className="space-y-4 pt-4 border-t border-white/[0.04]">
                      <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2"><Play size={14} className="text-[#46B1FF]" /> Trigger Config</h3>
                      <select 
                        title="Select trigger type"
                        value={selectedBlock.triggerConfig.type}
                        onChange={(e) => updateBlock(selectedBlock.id, { triggerConfig: { ...selectedBlock.triggerConfig, type: e.target.value } })}
                        className="w-full bg-black/40 border border-white/5 focus:border-[#46B1FF]/50 rounded-xl px-4 py-3 text-sm text-white transition-colors outline-none appearance-none"
                      >
                        <option value="manual">Manual Trigger</option>
                        <option value="scheduled">Scheduled (Cron)</option>
                        <option value="event">Event-driven (Webhook)</option>
                      </select>
                    </div>

                    <div className="space-y-4 pt-4 border-t border-white/5">
                      <h3 className="text-xs font-bold uppercase tracking-widest text-white flex items-center gap-2"><Clock size={14} className="text-[#DEF767]" /> wait config</h3>
                      <select 
                        title="Select wait type"
                        value={selectedBlock.waitConfig.type}
                        onChange={(e) => updateBlock(selectedBlock.id, { waitConfig: { ...selectedBlock.waitConfig, type: e.target.value } })}
                        className="w-full bg-black/40 border border-white/5 focus:border-[#DEF767]/50 rounded-xl px-4 py-3 text-sm text-white transition-colors outline-none appearance-none"
                      >
                        <option value="none">No Delay</option>
                        <option value="delay">Fixed Time Delay</option>
                        <option value="condition">Wait for Condition</option>
                        <option value="event">Wait for Event</option>
                      </select>
                    </div>
                  </>
                )}

                <div className="mt-auto">
                  <button
                    onClick={() => deleteBlock(selectedBlock.id)}
                    className="w-full py-3 rounded-xl bg-[#ff4b4b]/10 border border-[#ff4b4b]/20 text-[#ff4b4b] text-xs font-bold uppercase tracking-widest hover:bg-[#ff4b4b]/20 transition-colors flex items-center justify-center gap-2"
                  >
                    <Trash2 size={14} /> Delete {isWebhook ? 'Webhook' : 'Agent'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="animate-fade-in flex flex-col h-full gap-6">
                <p className="text-sm text-slate-400">Manage the data flow connection between two agents.</p>
                <button
                    onClick={() => deleteConnection(selectedConnection!.id)}
                    className="w-full py-3 rounded-xl bg-[#ff4b4b]/10 border border-[#ff4b4b]/20 text-[#ff4b4b] text-xs font-bold uppercase tracking-widest hover:bg-[#ff4b4b]/20 transition-colors flex items-center justify-center gap-2"
                  >
                    <Trash2 size={14} /> Delete Connection
                </button>
              </div>
            )}
          </div>
        </>
      )}
      {showResultOverlay && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#050505]/90 backdrop-blur-xl">
           <div className="bg-[#0c0c14] border border-white/10 rounded-3xl p-8 max-w-3xl w-full max-h-[80vh] flex flex-col shadow-[0_0_100px_rgba(0,0,0,1)]">
             <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-3xl font-display font-black text-white tracking-wide">Builder Compilation</h2>
                  <p className="text-sm text-slate-400 font-secondary mt-1">Global Context Output Sequence</p>
                </div>
                <button onClick={() => setShowResultOverlay(false)} className="p-3 bg-white/5 hover:bg-white/10 rounded-full transition-colors text-white">✕</button>
             </div>
             
             <div className="flex-1 overflow-y-auto custom-scrollbar bg-black/40 rounded-xl p-6 border border-white/5 font-mono text-xs leading-loose text-slate-300">
               {globalContextLog.split('\n').map((line, i) => <div key={i} className="mb-2">{line}</div>) || "No compilation sequence occurred."}
             </div>

             <div className="mt-6 flex justify-end gap-4">
                 <button className="flex items-center gap-2 px-6 py-3 rounded-xl border border-[#F6E27F] text-[#F6E27F] hover:bg-[#F6E27F]/10 font-bold uppercase tracking-widest text-xs transition-colors">
                   <Download size={16} /> Download Result
                 </button>
             </div>
           </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default BuilderSidebar;
