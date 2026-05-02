import { create } from 'zustand';
import { WORKFLOW_PHASES } from '../data/schema';

export const useWorkflowStore = create<any>((set, get) => ({
  // Core Graph State
  graphStatus: 'idle', // idle, loading, ready, error
  setGraphStatus: (status: any) => set({ graphStatus: status }),

  // Animation State Machine
  animationState: {
    phase: 'idle', // idle | entering | exiting | transitioning
    activeNodes: [],
    queuedTransitions: []
  },
  setAnimationState: (newState: any) => set((state: any) => ({ 
    animationState: { ...state.animationState, ...newState } 
  })),
  // Master Project Input
  projectPrompt: '',
  setProjectPrompt: (prompt: any) => set({ projectPrompt: prompt }),
  flowTitle: '',
  setFlowTitle: (title: string) => set({ flowTitle: title }),
  projectAttachment: null, // { name, content, type }
  setProjectAttachment: (attachment: any) => set({ projectAttachment: attachment }),

  // Execution State
  currentPhaseIndex: 0,
  setCurrentPhaseIndex: (idx: any) => set({ currentPhaseIndex: idx }),
  nodeStates: {}, // Record<nodeId, 'idle' | 'running' | 'completed'>
  nodeResults: {}, // Record<nodeId, { content, ui }>
  setNodeState: (nodeId: any, state: any) => set((s: any) => ({
    nodeStates: { ...s.nodeStates, [nodeId]: state }
  })),
  setNodeResult: (nodeId: any, result: any) => set((s: any) => ({
    nodeResults: { ...s.nodeResults, [nodeId]: result }
  })),
  resetExecution: (nodes: any) => {
    const freshStates: Record<string, any> = {};
    nodes.forEach((n: any) => { freshStates[n] = 'idle'; });
    set({ nodeStates: freshStates, nodeResults: {}, currentPhaseIndex: 0, revealedPhases: [], graphStatus: 'ready', flowStatus: 'idle', animationState: { phase: 'idle', activeNodes: [], queuedTransitions: [] } });
  },

  // Layout Constraints
  layoutMode: 'desktop', // desktop | tablet | mobile
  setLayoutMode: (mode: any) => set({ layoutMode: mode }),

  // Explorer vs Advisor modes
  activeMode: 'explorer',
  setActiveMode: (mode: any) => set({ activeMode: mode }),

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
  selectNode: (nodeId: any, _source: any = 'manualSelection') => {
    // Determine priority resolution if needed here
    // Manual selection overrides Advisor automated selections
    set({ selectedNodeId: nodeId, selectedToolId: null });
  },

  selectTool: (toolId: any) => {
    set({ selectedToolId: toolId });
  },

  // Progressive unrolling array (just simple phase tracking for animation)
  revealedPhases: [WORKFLOW_PHASES[0]!.id],
  revealNextPhase: () => {
    const current = get().revealedPhases;
    const all = WORKFLOW_PHASES.map(p => p.id);
    if (current.length < all.length) {
      set({ revealedPhases: [...current, all[current.length]] });
    }
  }
}));

// Selectors for specific Memoized updates in React
export const selectActiveNodeId = (state: any) => state.selectedNodeId;
export const selectActiveToolId = (state: any) => state.selectedToolId;
export const selectRevealedPhases = (state: any) => state.revealedPhases;
export const selectLayoutMode = (state: any) => state.layoutMode;
