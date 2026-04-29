import React, { useState } from 'react';
import { useBuilderStore } from '../lib/builderStore';
import { Layers, Plus, Trash2, ArrowRight, Pencil, Check, X } from 'lucide-react';

const TemplatesView = () => {
  const { templates, saveAsTemplate, applyTemplate, deleteTemplate, updateTemplate, blocks } = useBuilderStore();
  const [newTemplateName, setNewTemplateName] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');

  const handleSave = () => {
    if (!newTemplateName.trim()) return;
    saveAsTemplate(newTemplateName);
    setNewTemplateName('');
  };

  const startEditing = (template) => {
    setEditingId(template.id);
    setEditName(template.name);
  };

  const confirmEdit = () => {
    if (editName.trim() && editingId) {
      updateTemplate(editingId, { name: editName.trim() });
    }
    setEditingId(null);
    setEditName('');
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditName('');
  };

  return (
    <div className="absolute inset-0 z-30 bg-[#07070a]/95 backdrop-blur-3xl flex flex-col p-8 overflow-y-auto custom-scrollbar pt-28 pb-32">
      <div className="max-w-5xl mx-auto w-full">
        <div className="flex items-center justify-between mb-12">
          <div className="flex items-center gap-6">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#A259FF] to-[#46B1FF] flex items-center justify-center shadow-[0_0_30px_rgba(162,89,255,0.2)]">
              <Layers size={28} className="text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-black text-white font-display tracking-tight">Templates</h1>
              <p className="text-slate-500 text-sm mt-1">Deploy proven agentic workflows in one click.</p>
            </div>
          </div>

          {/* New Template Action */}
          <div className="flex items-end gap-3 bg-white/[0.03] border border-white/5 p-3 rounded-2xl shadow-xl">
            <div className="flex-1">
              <input
                value={newTemplateName}
                onChange={(e) => setNewTemplateName(e.target.value)}
                placeholder="Name your canvas..."
                className="w-48 bg-black/40 border border-white/10 focus:border-[#DEF767]/50 rounded-xl px-4 py-2 text-xs text-white transition-colors outline-none"
              />
            </div>
            <button
              onClick={handleSave}
              disabled={!newTemplateName.trim() || blocks.length === 0}
              className={`px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 transition-all h-[38px] ${
                newTemplateName.trim() && blocks.length > 0
                  ? 'bg-[#DEF767] text-black shadow-lg hover:brightness-110'
                  : 'bg-white/5 text-slate-600 cursor-not-allowed'
              }`}
            >
              <Plus size={14} /> New
            </button>
          </div>
        </div>

        {/* Grid of Templates */}
        <div>
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Library Assets ({templates.length})</h2>
            <div className="h-px flex-1 bg-white/[0.05] ml-6" />
          </div>

          {templates.length === 0 ? (
            <div className="text-center py-20 border-2 border-dashed border-white/[0.03] rounded-[32px] bg-white/[0.01]">
              <div className="w-20 h-20 rounded-full bg-white/[0.03] flex items-center justify-center mx-auto mb-6">
                <Layers size={32} className="text-slate-800" />
              </div>
              <p className="text-slate-500 font-secondary text-sm">Your workflow library is currently empty.</p>
              <p className="text-slate-600 text-xs mt-2">Save a custom canvas to populate this view.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {templates.map(template => (
                <div key={template.id} className="bg-[#111118] border border-white/5 rounded-[24px] p-6 flex flex-col hover:border-white/20 transition-all hover:-translate-y-1 hover:shadow-2xl group">
                  <div className="flex justify-between items-start mb-6">
                    {editingId === template.id ? (
                      <div className="flex items-center gap-2 flex-1 mr-2 animate-fade-in">
                        <input
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="flex-1 bg-black/60 border border-[#A259FF]/40 rounded-xl px-3 py-1.5 text-sm text-white outline-none"
                          autoFocus
                          onKeyDown={(e) => { if (e.key === 'Enter') confirmEdit(); if (e.key === 'Escape') cancelEdit(); }}
                        />
                        <button onClick={confirmEdit} className="p-2 rounded-lg bg-[#A259FF]/20 text-[#A259FF] hover:bg-[#A259FF]">
                          <Check size={14} />
                        </button>
                      </div>
                    ) : (
                      <h3 className="text-[17px] font-bold text-white tracking-tight truncate pr-4 leading-tight">{template.name}</h3>
                    )}
                    
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => startEditing(template)}
                        className="p-2 text-slate-500 hover:text-[#46B1FF] transition-colors"
                        title="Rename"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={() => deleteTemplate(template.id)}
                        className="p-2 text-slate-500 hover:text-[#ff4b4b] transition-colors"
                        title="Delete"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3 mb-8">
                    <div className="bg-white/[0.03] border border-white/[0.05] rounded-xl p-3">
                      <div className="text-[10px] text-slate-600 uppercase font-black mb-1">Nodes</div>
                      <div className="text-lg font-display text-[#DEF767]">{template.blocks?.length || 0}</div>
                    </div>
                    <div className="bg-white/[0.03] border border-white/[0.05] rounded-xl p-3">
                      <div className="text-[10px] text-slate-600 uppercase font-black mb-1">Links</div>
                      <div className="text-lg font-display text-[#A259FF]">{template.connections?.length || 0}</div>
                    </div>
                  </div>

                  <button
                    onClick={() => applyTemplate(template.id)}
                    className="w-full py-3.5 rounded-2xl bg-white/5 border border-white/5 text-slate-300 text-[11px] font-bold uppercase tracking-[0.15em] hover:bg-[#A259FF] hover:text-white hover:border-[#A259FF] hover:shadow-[0_10px_20px_rgba(162,89,255,0.2)] transition-all flex items-center justify-center gap-2"
                  >
                    Load Canvas <ArrowRight size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TemplatesView;
