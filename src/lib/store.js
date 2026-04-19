import { create } from 'zustand';
import { WORKFLOW_PHASES } from '../data/schema';

export const useWorkflowStore = create((set, get) => ({
  // Core Graph State
  graphStatus: 'idle', // idle, loading, ready, error
  setGraphStatus: (status) => set({ graphStatus: status }),

  // Animation State Machine
  animationState: {
    phase: 'idle', // idle | entering | exiting | transitioning
    activeNodes: [],
    queuedTransitions: []
  },
  setAnimationState: (newState) => set((state) => ({ 
    animationState: { ...state.animationState, ...newState } 
  })),
  // Master Project Input
  projectPrompt: '',
  setProjectPrompt: (prompt) => set({ projectPrompt: prompt }),
  projectAttachment: null, // { name, content, type }
  setProjectAttachment: (attachment) => set({ projectAttachment: attachment }),

  // Execution State
  currentPhaseIndex: 0,
  setCurrentPhaseIndex: (idx) => set({ currentPhaseIndex: idx }),
  nodeStates: {}, // Record<nodeId, 'idle' | 'running' | 'completed'>
  nodeResults: {}, // Record<nodeId, { content, ui }>
  setNodeState: (nodeId, state) => set((s) => ({
    nodeStates: { ...s.nodeStates, [nodeId]: state }
  })),
  setNodeResult: (nodeId, result) => set((s) => ({
    nodeResults: { ...s.nodeResults, [nodeId]: result }
  })),
  resetExecution: (nodes) => {
    const freshStates = {};
    nodes.forEach(n => { freshStates[n] = 'idle'; });
    set({ nodeStates: freshStates, nodeResults: {}, currentPhaseIndex: 0, revealedPhases: [], graphStatus: 'ready', flowStatus: 'idle', animationState: { phase: 'idle', activeNodes: [], queuedTransitions: [] } });
  },

  // Layout Constraints
  layoutMode: 'desktop', // desktop | tablet | mobile
  setLayoutMode: (mode) => set({ layoutMode: mode }),

  // Explorer vs Advisor modes
  activeMode: 'explorer',
  setActiveMode: (mode) => set({ activeMode: mode }),

  // Interaction & Selection
  selectedNodeId: null,
  selectedToolId: null,
  
  // User Context (Scoring Weights for Intelligence Layer)
  userContext: {
    role: 'designer',
    budget: 'paid', // free, freemium, paid
    weights: {
      audience: 2,
      pricing: 1,
      tags: 3
    }
  },

  // State Updates with built-in Priority Resolution Logic
  // eslint-disable-next-line no-unused-vars
  selectNode: (nodeId, _source = 'manualSelection') => {
    // Determine priority resolution if needed here
    // Manual selection overrides Advisor automated selections
    set({ selectedNodeId: nodeId, selectedToolId: null });
  },

  selectTool: (toolId) => {
    set({ selectedToolId: toolId });
  },

  // Progressive unrolling array (just simple phase tracking for animation)
  revealedPhases: [WORKFLOW_PHASES[0].id],
  revealNextPhase: () => {
    const current = get().revealedPhases;
    const all = WORKFLOW_PHASES.map(p => p.id);
    if (current.length < all.length) {
      set({ revealedPhases: [...current, all[current.length]] });
    }
  }
}));

// Selectors for specific Memoized updates in React
export const selectActiveNodeId = (state) => state.selectedNodeId;
export const selectActiveToolId = (state) => state.selectedToolId;
export const selectRevealedPhases = (state) => state.revealedPhases;
export const selectLayoutMode = (state) => state.layoutMode;
