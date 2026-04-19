import { create } from 'zustand';

const generateId = () => `id_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

// eslint-disable-next-line no-unused-vars
export const useBuilderStore = create((set, _get) => ({
  viewMode: 'pipeline', // 'pipeline' | 'builder' | 'templates'
  setViewMode: (mode) => set({ viewMode: mode, selectedElementId: null }),

  blocks: [],
  connections: [],
  stickyNotes: [],
  templates: [],
  
  selectedElementId: null,
  setSelectedElementId: (id) => set({ selectedElementId: id }),

  // --- BLOCKS ---
  addBlock: (position) => {
    const newBlock = {
      id: generateId(),
      name: 'New Agent',
      description: 'Describe the agent objective...',
      apiKey: '',
      waitConfig: { type: 'none', delay: 0 },
      triggerConfig: { type: 'manual' },
      position: position || { x: 500, y: 500 },
    };
    set((state) => ({
      blocks: [...state.blocks, newBlock],
      selectedElementId: newBlock.id
    }));
  },
  
  updateBlock: (id, updates) => set((state) => ({
    blocks: state.blocks.map(b => b.id === id ? { ...b, ...updates } : b)
  })),

  deleteBlock: (id) => set((state) => ({
    blocks: state.blocks.filter(b => b.id !== id),
    connections: state.connections.filter(c => c.sourceBlockId !== id && c.targetBlockId !== id),
    selectedElementId: state.selectedElementId === id ? null : state.selectedElementId
  })),

  // --- CONNECTIONS ---
  connectBlocks: (sourceId, targetId) => set((state) => {
    // Prevent duplicate or self connections
    if (sourceId === targetId) return state;
    if (state.connections.find(c => c.sourceBlockId === sourceId && c.targetBlockId === targetId)) {
       return state;
    }
    return {
      connections: [...state.connections, { id: generateId(), sourceBlockId: sourceId, targetBlockId: targetId }]
    };
  }),

  deleteConnection: (id) => set((state) => ({
    connections: state.connections.filter(c => c.id !== id),
    selectedElementId: state.selectedElementId === id ? null : state.selectedElementId
  })),

  // --- STICKY NOTES ---
  addStickyNote: (position) => {
    const newNote = {
      id: generateId(),
      text: '',
      color: '#A259FF',
      position: position || { x: 500, y: 500 }
    };
    set((state) => ({
      stickyNotes: [...state.stickyNotes, newNote],
      selectedElementId: `sticky-${newNote.id}`
    }));
  },

  updateStickyNote: (id, updates) => set((state) => ({
    stickyNotes: state.stickyNotes.map(n => n.id === id ? { ...n, ...updates } : n)
  })),

  deleteStickyNote: (id) => set((state) => ({
    stickyNotes: state.stickyNotes.filter(n => n.id !== id),
    selectedElementId: state.selectedElementId === `sticky-${id}` ? null : state.selectedElementId
  })),

  clearAnnotations: () => set({ stickyNotes: [] }),

  // --- TEMPLATES ---
  saveAsTemplate: (name) => set((state) => {
    const template = {
      id: generateId(),
      name: name || 'Untitled Template',
      blocks: JSON.parse(JSON.stringify(state.blocks)),
      connections: JSON.parse(JSON.stringify(state.connections))
    };
    return { templates: [...state.templates, template] };
  }),

  applyTemplate: (templateId) => set((state) => {
    const template = state.templates.find(t => t.id === templateId);
    if (!template) return state;
    
    // We should regenerate IDs so we don't conflict. 
    // For simplicity, we just clone blocks with new IDs and update connections
    const idMap = {};
    const newBlocks = template.blocks.map(b => {
      const newId = generateId();
      idMap[b.id] = newId;
      return { ...b, id: newId };
    });
    
    const newConns = template.connections.map(c => ({
      id: generateId(),
      sourceBlockId: idMap[c.sourceBlockId] || c.sourceBlockId, 
      targetBlockId: idMap[c.targetBlockId] || c.targetBlockId
    }));

    return {
      blocks: newBlocks,
      connections: newConns,
      stickyNotes: [],
      selectedElementId: null,
      viewMode: 'builder' // switch to builder automatically
    };
  }),
  
  updateTemplate: (id, updates) => set((state) => ({
    templates: state.templates.map(t => t.id === id ? { ...t, ...updates } : t)
  })),

  deleteTemplate: (id) => set((state) => ({
    templates: state.templates.filter(t => t.id !== id)
  }))
}));
