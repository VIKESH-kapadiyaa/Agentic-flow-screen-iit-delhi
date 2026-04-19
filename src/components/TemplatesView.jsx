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
    <div className="absolute inset-0 z-30 bg-[#0a0a10] flex flex-col p-12 overflow-y-auto custom-scrollbar pt-24">
      <div className="max-w-4xl mx-auto w-full">
        <div className="flex items-center gap-4 mb-8 border-b border-white/10 pb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#DEF767] to-[#A259FF] flex items-center justify-center shadow-[0_0_40px_rgba(222,247,103,0.3)]">
            <Layers size={32} className="text-black" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-white font-display tracking-tight">Template Library</h1>
            <p className="text-slate-400 mt-1">Manage, reuse, and extend agentic workflows.</p>
          </div>
        </div>

        {/* Save Current as Template */}
        <div className="bg-[#111118] border border-white/10 rounded-2xl p-6 mb-12 shadow-xl flex items-end gap-4">
          <div className="flex-1">
            <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#DEF767] mb-2 block">Save Current Canvas</label>
            <input
              value={newTemplateName}
              onChange={(e) => setNewTemplateName(e.target.value)}
              placeholder="e.g. Content Research Pipeline"
              className="w-full bg-black/40 border border-white/5 focus:border-[#DEF767]/50 rounded-xl px-4 py-3 text-sm text-white transition-colors outline-none"
            />
          </div>
          <button
            onClick={handleSave}
            disabled={!newTemplateName.trim() || blocks.length === 0}
            className={`px-6 py-3 rounded-xl text-sm font-bold uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${
              newTemplateName.trim() && blocks.length > 0
                ? 'bg-gradient-to-r from-[#DEF767] to-[#A259FF] text-black shadow-lg hover:opacity-90'
                : 'bg-white/5 text-slate-500 cursor-not-allowed'
            }`}
          >
            <Plus size={16} /> Save Template
          </button>
        </div>

        {/* List of Templates */}
        <div>
          <h2 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-6">Available Templates ({templates.length})</h2>
          {templates.length === 0 ? (
            <div className="text-center py-12 border border-dashed border-white/10 rounded-2xl bg-white/[0.02]">
              <Layers size={48} className="mx-auto text-slate-700 mb-4" />
              <p className="text-slate-400">No templates saved yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {templates.map(template => (
                <div key={template.id} className="bg-[#111118] border border-white/5 rounded-2xl p-6 flex flex-col hover:border-[#46B1FF]/50 transition-colors group">
                  <div className="flex justify-between items-start mb-4">
                    {editingId === template.id ? (
                      <div className="flex items-center gap-2 flex-1 mr-2">
                        <input
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="flex-1 bg-black/60 border border-[#46B1FF]/30 rounded-lg px-3 py-1.5 text-sm text-white outline-none focus:border-[#46B1FF]"
                          autoFocus
                          onKeyDown={(e) => { if (e.key === 'Enter') confirmEdit(); if (e.key === 'Escape') cancelEdit(); }}
                        />
                        <button onClick={confirmEdit} className="p-1.5 rounded-lg bg-[#DEF767]/20 text-[#DEF767] hover:bg-[#DEF767]/30 transition-colors">
                          <Check size={14} />
                        </button>
                        <button onClick={cancelEdit} className="p-1.5 rounded-lg bg-white/5 text-slate-400 hover:text-white transition-colors">
                          <X size={14} />
                        </button>
                      </div>
                    ) : (
                      <h3 className="text-lg font-bold text-white tracking-wide">{template.name}</h3>
                    )}
                    <div className="flex items-center gap-1">
                      {editingId !== template.id && (
                        <button
                          onClick={() => startEditing(template)}
                          className="p-2 bg-black/40 text-slate-500 rounded-lg hover:text-[#46B1FF] hover:bg-[#46B1FF]/10 transition-colors"
                          title="Rename Template"
                        >
                          <Pencil size={16} />
                        </button>
                      )}
                      <button
                        onClick={() => deleteTemplate(template.id)}
                        className="p-2 bg-black/40 text-slate-500 rounded-lg hover:text-[#ff4b4b] hover:bg-[#ff4b4b]/10 transition-colors"
                        title="Delete Template"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4 text-xs text-slate-400 font-secondary mt-auto mb-6">
                    <span className="bg-white/5 px-2 py-1 rounded">{template.blocks?.length || 0} Blocks</span>
                    <span className="bg-white/5 px-2 py-1 rounded">{template.connections?.length || 0} Connections</span>
                  </div>

                  <button
                    onClick={() => applyTemplate(template.id)}
                    className="w-full py-3 rounded-xl bg-[#46B1FF]/10 text-[#46B1FF] text-xs font-bold uppercase tracking-widest hover:bg-[#46B1FF]/20 transition-all flex items-center justify-center gap-2 group-hover:bg-[#46B1FF] group-hover:text-black"
                  >
                    Apply to Canvas <ArrowRight size={14} />
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
