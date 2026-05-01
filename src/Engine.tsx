import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Sparkles, AlertTriangle, Play, RefreshCw, Trash2, Paperclip, X, FileText, Activity, Folder } from 'lucide-react';
import confetti from 'canvas-confetti';
import { motion, AnimatePresence } from 'framer-motion';

// Core Schema & Logic
import { WORKFLOW_PHASES, EDGES, TOOL_REGISTRY } from './data/schema';
import { validateGraph } from './lib/graphValidator';
import { computeLayout } from './lib/layoutEngine';
import { computeEdgePath, bundleEdges } from './lib/edgeRouter';
import { useWorkflowStore, selectActiveNodeId } from './lib/store';
import { callLLM, checkKeyAvailability, getProjectKeyStatus, getKeyStatus } from './lib/llm';
import { supabase } from './lib/supabaseClient';
import { useToastStore } from './lib/toastStore';
import { ToastContainer } from './components/ToastContainer';
import { Key, ShieldCheck, Globe, Info as InfoIcon, Eye, EyeOff } from 'lucide-react';
import html2canvas from 'html2canvas';

// Components
import FlowHeader from './components/FlowHeader';

import FlowControls from './components/FlowControls';
import NodeContainer from './components/NodeContainer';
import PhaseSummaryBox from './components/PhaseSummaryBox';
import ToolDock from './components/ToolDock';
import OutputScreen from './components/OutputScreen';
import BuilderCanvas from './components/BuilderCanvas';
import BuilderSidebar from './components/BuilderSidebar';
import TemplatesView from './components/TemplatesView';
import { useBuilderStore } from './lib/builderStore';

const Engine = () => {
  const [initError, setInitError] = useState<string | null>(null);
  
  // Zustand State
  const graphStatus = useWorkflowStore((state: any) => state.graphStatus);
  const setGraphStatus = useWorkflowStore((state: any) => state.setGraphStatus);
  const selectedNodeId = useWorkflowStore(selectActiveNodeId);
  const selectNode = useWorkflowStore((state: any) => state.selectNode);
  const nodeStates = useWorkflowStore((state: any) => state.nodeStates);
  
  const viewMode = useBuilderStore((state: any) => state.viewMode);
  const nodeResults = useWorkflowStore((state: any) => state.nodeResults);
  const projectPrompt = useWorkflowStore((state: any) => state.projectPrompt);
  const setProjectPrompt = useWorkflowStore((state: any) => state.setProjectPrompt);
  const currentPhaseIndex = useWorkflowStore((state: any) => state.currentPhaseIndex);
  const projectAttachment = useWorkflowStore((state: any) => state.projectAttachment);
  const setProjectAttachment = useWorkflowStore((state: any) => state.setProjectAttachment);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [phaseOverlay, setPhaseOverlay] = useState<any>(null);
  const [showOutputScreen, setShowOutputScreen] = useState(false);


  // Canvas Viewport logic
  const [camera, setCamera] = useState({ x: 100, y: 60, zoom: 0.55 });
  const [isPanning, setIsPanning] = useState(false);
  const canvasRef = useRef<HTMLDivElement>(null);
  const lastMousePos = useRef({ x: 0, y: 0 });

  // Toolkit State
  const [activeTool, setActiveTool] = useState('cursor');
  const [stickyNotes, setStickyNotes] = useState<any[]>([]);
  const [strokes, setStrokes] = useState<any[]>([]);
  const [currentStroke, setCurrentStroke] = useState<any>(null);
  const currentStrokeRef = useRef<any[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const isDrawingRef = useRef(false);
  const [canvasLocked, setCanvasLocked] = useState(false);
  const [textLabels, setTextLabels] = useState<any[]>([]);
  const [draggingAppElement, setDraggingAppElement] = useState<any>(null);
  const [resizingAppElement, setResizingAppElement] = useState<any>(null);

  // Zoom-edit state for sticky notes & text labels
  const [editingStickyId, setEditingStickyId] = useState<number | null>(null);
  const [editingLabelId, setEditingLabelId] = useState<number | null>(null);
  const preFocusCamera = useRef<{ x: number; y: number; zoom: number } | null>(null);

  // Key Management State
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [keyModalType, setKeyModalType] = useState<'NO_KEY' | 'INVALID_KEY' | 'RATE_LIMIT'>('NO_KEY');
  const [keyInfo, setKeyInfo] = useState<any>({ activeSource: 'none', project: { hasKey: false }, global: { any: false } });
  const addToast = useToastStore((state) => state.addToast);

  // Boot validation
  useEffect(() => {
    const loadCanvasData = async () => {
      try {
        setGraphStatus('loading');
        const seqId = localStorage.getItem('active_sequence_id');
        if (seqId) {
          const { data } = await supabase.from('sequences').select('canvas_state, title').eq('id', seqId).single();
          if (data?.canvas_state) {
             const state = data.canvas_state;
             useBuilderStore.setState({
               blocks: state.blocks || [],
               connections: state.connections || [],
               stickyNotes: state.stickyNotes || [],
               textLabels: state.textLabels || [],
             });
             
             // Restore the agent outputs and progress!
             if (state.execution) {
               useWorkflowStore.setState({
                 nodeStates: state.execution.nodeStates || {},
                 nodeResults: state.execution.nodeResults || {},
                 currentPhaseIndex: state.execution.currentPhaseIndex || 0,
                 projectPrompt: state.execution.projectPrompt || (data.title !== 'New Neural Sequence' ? data.title : '')
               });
             } else if (data.title && data.title !== 'New Neural Sequence') {
               useWorkflowStore.setState({ projectPrompt: data.title });
             }
          }
          
          // Fetch templates for the user
          const { data: { session } } = await supabase.auth.getSession();
          if (session) {
             const { data: templates } = await supabase.from('templates').select('*').eq('user_id', session.user.id).order('created_at', { ascending: false });
             if (templates) {
                 useBuilderStore.setState({ templates });
             }
          }
        }
        validateGraph();
        setGraphStatus('ready');
      } catch (e: any) {
        console.error(e);
        setInitError(e.message);
        setGraphStatus('error');
      }
    };
    loadCanvasData();

    // Listen for key errors
    const handleKeyError = (e: any) => {
      const { type, message } = e.detail;
      if (type === 'RATE_LIMIT') {
        addToast('warning', 'Rate limited. Please wait or switch keys.');
      } else {
        setKeyModalType(type);
        setShowKeyModal(true);
      }
    };

    window.addEventListener('agentic:key-error', handleKeyError);

    // Initial key check
    const seqId = localStorage.getItem('active_sequence_id');
    if (seqId) {
      checkKeyAvailability(seqId).then(setKeyInfo);
    }

    return () => window.removeEventListener('agentic:key-error', handleKeyError);
  }, [setGraphStatus, addToast]);

  // --- AUTO-SAVE BACKGROUND ENGINE ---
  const lastSavedHashRef = useRef<string>('');

  useEffect(() => {
    const seqId = localStorage.getItem('active_sequence_id');
    if (!seqId) return;

    const buildSavePayload = () => {
      const state = useBuilderStore.getState();
      const workflowState = useWorkflowStore.getState();
      
      const getSessionName = (prompt: string) => {
        const trimmed = prompt?.trim().replace(/\s+/g, ' ') || '';
        if (!trimmed || trimmed === 'New Neural Sequence') return 'Untitled Sequence';
        return trimmed.substring(0, 50) + (trimmed.length > 50 ? '...' : '');
      };

      const canvas_state = {
        blocks: state.blocks,
        connections: state.connections,
        stickyNotes: state.stickyNotes,
        textLabels: state.textLabels,
        execution: {
          nodeStates: workflowState.nodeStates,
          nodeResults: workflowState.nodeResults,
          currentPhaseIndex: workflowState.currentPhaseIndex,
          projectPrompt: workflowState.projectPrompt
        }
      };

      return {
        canvas_state,
        title: getSessionName(workflowState.projectPrompt),
        updated_at: new Date().toISOString()
      };
    };

    const interval = setInterval(async () => {
      if (useWorkflowStore.getState().graphStatus === 'loading') return;
      try {
        const payload = buildSavePayload();
        const currentHash = JSON.stringify({ canvas_state: payload.canvas_state, title: payload.title });
        
        if (currentHash === lastSavedHashRef.current) return;

        await supabase.from('sequences').update(payload).eq('id', seqId);
        lastSavedHashRef.current = currentHash;
        console.log("[Engine] Auto-save synchronized");
      } catch (err: any) {
        console.error("Auto-save failed", err);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, []);


  const deployedTemplateId = useBuilderStore((state: any) => state.deployedTemplateId);
  const templates = useBuilderStore((state: any) => state.templates);

  // Compute Layout 
  const layout = useMemo(() => {
    if (graphStatus === 'error') return null;
    if (deployedTemplateId && viewMode === 'pipeline') {
       const activeTemplate = templates.find((t: any) => t.id === deployedTemplateId);
       if (activeTemplate) {
           const depths: Record<string, number> = {};
           const adj: Record<string, any[]> = {};
           const inDegree: Record<string, number> = {};
           
           activeTemplate.blocks.forEach((b: any) => {
             adj[b.id] = [];
             inDegree[b.id] = 0;
             depths[b.id] = 0;
           });
           
           activeTemplate.connections.forEach((c: any) => {
             if(adj[c.sourceBlockId] && inDegree[c.targetBlockId] !== undefined) {
               adj[c.sourceBlockId]!.push(c.targetBlockId);
               inDegree[c.targetBlockId]!++;
             }
           });
           
           let queue: any[] = [];
           Object.keys(inDegree).forEach(id => {
             if (inDegree[id] === 0) queue.push(id);
           });
           
           while(queue.length > 0) {
             const curr = queue.shift();
             adj[curr]!.forEach(neighbor => {
                depths[neighbor] = Math.max(depths[neighbor]!, depths[curr]! + 1);
                inDegree[neighbor]!--;
                if(inDegree[neighbor] === 0) queue.push(neighbor);
             });
           }
           
           const phaseIds = WORKFLOW_PHASES.map(p => p.id);
           const depthGroups: Record<number, any[]> = {};
           
           activeTemplate.blocks.forEach((block: any) => {
              const d = depths[block.id] || 0;
              const phaseIndex = Math.min(d, phaseIds.length - 1);
              block.dynamicPhase = phaseIds[phaseIndex];
              if(!depthGroups[d]) depthGroups[d] = [];
              depthGroups[d]!.push(block);
           });
           
           const newLayout: Record<string, any> = {};
           const maxDepth = Math.max(0, ...Object.keys(depthGroups).map(Number));
           
           for (let d = 0; d <= maxDepth; d++) {
             const blocksInCol = depthGroups[d] || [];
             const x = 350 + (d * 500);
             const startY = 400 - ((blocksInCol.length - 1) * 200) / 2;
             
             blocksInCol.forEach((block: any, bIdx: any) => {
                 const phaseIndex = Math.min(d, phaseIds.length - 1);
                 newLayout[block.id] = {
                     id: block.id,
                     x: x + (bIdx % 2 !== 0 ? 60 : 0), 
                     y: startY + (bIdx * 200),
                     category: { name: block.name, description: block.description },
                     phase: phaseIds[phaseIndex],
                     tools: [],
                     blockRef: block 
                 };
             });
           }
           return newLayout;
       }
    }
    return computeLayout('desktop', 2000, 1000);
  }, [graphStatus, deployedTemplateId, viewMode, templates]);

  // Bundle Edges 
  const bundledEdges = useMemo(() => {
    if (graphStatus === 'error' || graphStatus === 'idle') return [];
    if (deployedTemplateId && viewMode === 'pipeline') return []; // Use custom logic below
    return bundleEdges(EDGES);
  }, [graphStatus, deployedTemplateId, viewMode]);

  const customEdges = useMemo(() => {
    if (!deployedTemplateId || viewMode !== 'pipeline') return [];
    const activeTemplate = templates.find((t: any) => t.id === deployedTemplateId);
    if (!activeTemplate || !layout) return [];
    return activeTemplate.connections.map((c: any) => {
        const s = layout[c.sourceBlockId];
        const t = layout[c.targetBlockId];
        if (!s || !t) return null;
        const p1 = {x: s.x + 140, y: s.y + 70}; 
        const p2 = {x: t.x, y: t.y + 70}; 
        const offset = Math.abs(p2.x - p1.x) * 0.5;
        return {
           _coreId: c.id,
           id: c.id,
           from: c.sourceBlockId,
           to: c.targetBlockId,
           d: `M ${p1.x} ${p1.y} C ${p1.x + offset} ${p1.y}, ${p2.x - offset} ${p2.y}, ${p2.x} ${p2.y}`
        };
    }).filter(Boolean);
  }, [deployedTemplateId, viewMode, templates, layout]);

  // Canvas Interactions
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const onWheel = (e: any) => {
      if (canvasLocked) { e.preventDefault(); return; }
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        setCamera((prev) => {
          const newZoom = Math.min(Math.max(prev.zoom - e.deltaY * 0.0004, 0.15), 2);
          const zoomRatio = newZoom / prev.zoom;

          const rect = canvas.getBoundingClientRect();
          const mouseX = e.clientX - rect.left;
          const mouseY = e.clientY - rect.top;

          return {
            zoom: newZoom,
            x: mouseX - (mouseX - prev.x) * zoomRatio,
            y: mouseY - (mouseY - prev.y) * zoomRatio,
          };
        });
      } else {
        setCamera((prev: any) => ({
          ...prev,
          x: prev.x - e.deltaX,
          y: prev.y - e.deltaY,
        }));
      }
    };

    canvas.addEventListener('wheel', onWheel, { passive: false });
    return () => canvas.removeEventListener('wheel', onWheel);
  }, [canvasLocked]);

  const getCanvasCoords = useCallback((clientX: any, clientY: any) => {
    return {
      x: (clientX - camera.x) / camera.zoom,
      y: (clientY - camera.y) / camera.zoom
    };
  }, [camera]);

  const handleMouseDown = useCallback((e: any) => {
    if (canvasLocked) return;
    if (e.target.closest('.n8n-node') || e.target.closest('.sticky-note')) return;

    if (activeTool === 'cursor') {
      if (e.button === 1 || (e.button === 0 && e.altKey) || e.target.id === 'canvas-bg') {
        setIsPanning(true);
        lastMousePos.current = { x: e.clientX, y: e.clientY };
      }
    } else if (activeTool === 'sticky') {
      const coords = getCanvasCoords(e.clientX, e.clientY);
      const newId = Date.now();
      setStickyNotes((prev: any) => [...prev, { id: newId, x: coords.x - 120, y: coords.y - 90, text: '', color: '#A259FF', width: 240, height: 180 }]);
      setActiveTool('cursor');
    } else if (activeTool === 'text') {
      const coords = getCanvasCoords(e.clientX, e.clientY);
      setTextLabels(prev => [...prev, { id: Date.now(), x: coords.x, y: coords.y, text: '' }]);
      setActiveTool('cursor');
    } else if (activeTool === 'highlighter') {
      isDrawingRef.current = true;
      setIsDrawing(true);
      const coords = getCanvasCoords(e.clientX, e.clientY);
      currentStrokeRef.current = [coords];
      setCurrentStroke([coords]);
    }
  }, [activeTool, canvasLocked, getCanvasCoords]);

  const handleMouseMove = useCallback(
    (e: any) => {
      if (canvasRef.current) {
        const rect = canvasRef.current.getBoundingClientRect();
        canvasRef.current.style.setProperty('--mouse-x', `${e.clientX - rect.left}px`);
        canvasRef.current.style.setProperty('--mouse-y', `${e.clientY - rect.top}px`);
      }
      
      if (draggingAppElement) {
        const coords = getCanvasCoords(e.clientX, e.clientY);
        const dx = coords.x - draggingAppElement.startMouseX;
        const dy = coords.y - draggingAppElement.startMouseY;
        if (draggingAppElement.type === 'sticky') {
          setStickyNotes((prev: any) => prev.map((n: any) => n.id === draggingAppElement.id ? { ...n, x: draggingAppElement.startX + dx, y: draggingAppElement.startY + dy } : n));
        } else if (draggingAppElement.type === 'label') {
          setTextLabels((prev: any) => prev.map((l: any) => l.id === draggingAppElement.id ? { ...l, x: draggingAppElement.startX + dx, y: draggingAppElement.startY + dy } : l));
        }
      }

      if (resizingAppElement) {
        const coords = getCanvasCoords(e.clientX, e.clientY);
        const newWidth = Math.max(120, coords.x - resizingAppElement.elemX);
        const newHeight = Math.max(120, coords.y - resizingAppElement.elemY);
        if (resizingAppElement.type === 'sticky') {
           setStickyNotes((prev: any) => prev.map((n: any) => n.id === resizingAppElement.id ? { ...n, width: newWidth, height: newHeight } : n));
        }
      }

      if (isPanning) {
        const dx = e.clientX - lastMousePos.current.x;
        const dy = e.clientY - lastMousePos.current.y;
        setCamera((prev: any) => ({ ...prev, x: prev.x + dx, y: prev.y + dy }));
        lastMousePos.current = { x: e.clientX, y: e.clientY };
      } else if (isDrawingRef.current && activeTool === 'highlighter') {
        const coords = getCanvasCoords(e.clientX, e.clientY);
        currentStrokeRef.current.push(coords);
        // Throttled state update for rendering
        if (currentStrokeRef.current.length % 2 === 0) {
          setCurrentStroke([...currentStrokeRef.current]);
        }
      }
    },
    [isPanning, activeTool, getCanvasCoords, draggingAppElement, resizingAppElement]
  );

  const handleMouseUp = useCallback(() => {
    if (draggingAppElement) setDraggingAppElement(null);
    if (resizingAppElement) setResizingAppElement(null);
    if (isPanning) setIsPanning(false);
    if (isDrawingRef.current) {
      isDrawingRef.current = false;
      setIsDrawing(false);
      if (currentStrokeRef.current.length > 1) {
        setStrokes((prev: any) => [...prev, { id: Date.now(), points: [...currentStrokeRef.current] }]);
      }
      currentStrokeRef.current = [];
      setCurrentStroke(null);
    }
  }, [isPanning, draggingAppElement, resizingAppElement]);

  const runFullPipeline = useCallback(async () => {
    if (!layout || graphStatus === 'running') return;
    const store = useWorkflowStore.getState();
    
    if (!projectPrompt || projectPrompt.trim() === '') {
      addToast('info', 'Please enter a project directive in the top bar.');
      return;
    }

    // --- PRE-CHECK API KEY ---
    const seqId = localStorage.getItem('active_sequence_id');
    if (seqId) {
      const status = await checkKeyAvailability(seqId);
      setKeyInfo(status);
      if (!status.any) {
        setKeyModalType('NO_KEY');
        setShowKeyModal(true);
        return;
      }
    }

    // Update sequence title in Supabase to match the prompt (handled by autosave)
    // No explicit call needed here anymore to avoid redundant writes
    
    store.setGraphStatus('running');
    store.resetExecution(Object.keys(layout)); 

    // Check if we're running a deployed template or default schema
    const activeTemplate = deployedTemplateId ? templates.find((t: any) => t.id === deployedTemplateId) : null;

    if (activeTemplate) {
      // --- DEPLOYED TEMPLATE EXECUTION (topological order) ---
      const depths: Record<string, number> = {};
      const adj: Record<string, any[]> = {};
      const inDegree: Record<string, number> = {};
      
      activeTemplate.blocks.forEach((b: any) => {
        adj[b.id] = [];
        inDegree[b.id] = 0;
        depths[b.id] = 0;
      });
      
      activeTemplate.connections.forEach((c: any) => {
        if (adj[c.sourceBlockId] && inDegree[c.targetBlockId] !== undefined) {
          adj[c.sourceBlockId]!.push(c.targetBlockId);
          inDegree[c.targetBlockId]!++;
        }
      });
      
      let queue: any[] = [];
      Object.keys(inDegree).forEach(id => {
        if (inDegree[id] === 0) queue.push(id);
      });
      
      while (queue.length > 0) {
        const curr = queue.shift();
        (adj[curr] || []).forEach((neighbor: any) => {
          depths[neighbor] = Math.max(depths[neighbor]!, depths[curr]! + 1);
          inDegree[neighbor]!--;
          if (inDegree[neighbor] === 0) queue.push(neighbor);
        });
      }
      
      const maxDepth = Math.max(0, ...Object.values(depths));
      const phaseLabels = WORKFLOW_PHASES.map(p => p.label);
      
      for (let d = 0; d <= maxDepth; d++) {
        const phaseIndex = Math.min(d, WORKFLOW_PHASES.length - 1);
        store.setCurrentPhaseIndex(phaseIndex);
        
        const nodesAtDepth = activeTemplate.blocks.filter((b: any) => (depths[b.id] || 0) === d).map((b: any) => b.id);
        const currentActive = store.animationState.activeNodes;
        store.setAnimationState({ activeNodes: [...currentActive, ...nodesAtDepth] });
        
        let neuralContext = '';
        if (d > 0) {
          const prevNodes = activeTemplate.blocks.filter((b: any) => (depths[b.id] || 0) === d - 1).map((b: any) => b.id);
          const currentResults = store.nodeResults || {};
          neuralContext = prevNodes
            .map((id: any) => currentResults[id]?.content)
            .filter(Boolean)
            .join('\n\n---\n\n');
        }
        
        await Promise.all(nodesAtDepth.map(async (nId: any) => {
          store.setNodeState(nId, 'running');
          const nodeInfo = (layout as any)[nId];
          const agentData = {
            id: nId,
            phaseLabel: phaseLabels[phaseIndex] || `Phase ${d + 1}`,
            categoryName: nodeInfo?.category?.name || 'Agent',
            name: nodeInfo?.category?.name || 'Agent'
          };

          try {
            const taskObj = `Project directive: ${store.projectPrompt}\n\nExecute agentic objective for ${agentData.name} within the ${agentData.phaseLabel} architecture phase. Provide deep expert analysis based on the project directive.`;
            const result = await callLLM(taskObj, agentData, neuralContext, store.projectAttachment);
            store.setNodeResult(nId, result);
          } catch (err: any) {
            console.error(`[${nId}] Error:`, err);
          }
          store.setNodeState(nId, 'completed');
        }));

        if (d < maxDepth) {
          const nextPhaseIndex = Math.min(d + 1, WORKFLOW_PHASES.length - 1);
          setPhaseOverlay({ 
            phase: d + 1, 
            phaseName: phaseLabels[phaseIndex] || `Phase ${d + 1}`, 
            nextPhaseName: phaseLabels[nextPhaseIndex] || `Phase ${d + 2}` 
          });
          await new Promise(r => setTimeout(r, 2000));
          setPhaseOverlay(null);
        }
      }
    } else {
      // --- DEFAULT SCHEMA EXECUTION (original logic) ---
      for (let i = 0; i < WORKFLOW_PHASES.length; i++) {
        const phase = WORKFLOW_PHASES[i]!;
        store.setCurrentPhaseIndex(i);
        
        const phaseNodes = phase.categories.map((c: any) => `${phase.id}::${c}`);
        const currentActive = store.animationState.activeNodes;
        store.setAnimationState({ activeNodes: [...currentActive, ...phaseNodes] });

        let neuralContext = '';
        if (i > 0) {
          const prevPhase = WORKFLOW_PHASES[i - 1]!;
          const prevPhaseNodes = prevPhase.categories.map((c: any) => `${prevPhase.id}::${c}`);
          const currentResults = store.nodeResults || {};
          neuralContext = prevPhaseNodes
            .map((id: any) => currentResults[id]?.content)
            .filter(Boolean)
            .join('\n\n---\n\n');
        }

        await Promise.all(phaseNodes.map(async (nId: any) => {
          store.setNodeState(nId, 'running');
          const nodeCategory = nId.split('::')[1];
          const agentData = {
            id: nId,
            phaseLabel: phase.label,
            categoryName: nodeCategory,
            name: (layout as any)[nId]?.category?.name || nodeCategory
          };

          try {
            const taskObj = `Project directive: ${store.projectPrompt}\n\nExecute agentic objective for ${agentData.name} within the ${agentData.phaseLabel} architecture phase. Provide deep expert analysis based on the project directive.`;
            const result = await callLLM(taskObj, agentData, neuralContext, store.projectAttachment);
            store.setNodeResult(nId, result);
          } catch (err: any) {
            console.error(`[${nId}] Error:`, err);
          }
          store.setNodeState(nId, 'completed');
        }));

        if (i < WORKFLOW_PHASES.length - 1) {
          setPhaseOverlay({ 
            phase: i + 1, 
            phaseName: phase.label, 
            nextPhaseName: WORKFLOW_PHASES[i + 1]!.label 
          });
          await new Promise(r => setTimeout(r, 2000));
          setPhaseOverlay(null);
        }
      }
    }

    store.setGraphStatus('completed');
    const duration = 2000;
    const end = Date.now() + duration;

    (function frame() {
      confetti({ particleCount: 8, angle: 60, spread: 70, origin: { x: 0 }, colors: ['#46B1FF', '#CEA3FF', '#DEF767'] });
      confetti({ particleCount: 8, angle: 120, spread: 70, origin: { x: 1 }, colors: ['#A259FF', '#DEF767', '#ffffff'] });
      if (Date.now() < end) requestAnimationFrame(frame);
    }());
    
    setTimeout(() => setShowOutputScreen(true), 2500);
  }, [layout, graphStatus, projectPrompt, deployedTemplateId, templates]);

  const rebootSequence = () => {
    const store = useWorkflowStore.getState();
    const nodes = Object.values(layout as any).map((n: any) => n.id);
    store.resetExecution(nodes);
    store.setProjectPrompt('');
    setShowOutputScreen(false);
  };

  const renderPipelineSidebarContent = () => {
    if (!selectedNodeId) return null;

    // Node with AI results
    if (nodeResults && nodeResults[selectedNodeId]?.ui) {
      return (
        <div className="flex-1 w-full relative">
          <div dangerouslySetInnerHTML={{ __html: nodeResults[selectedNodeId].ui }} />
        </div>
      );
    }

    // Default: node details + tool list
    return (
      <div className="flex-1 mt-4">
        <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.05] mb-8 shadow-inner">
          <p className="text-sm text-slate-400 leading-relaxed font-light">{(layout as any)[selectedNodeId]?.category.description}</p>
        </div>
        <span className="text-[10px] text-[#A259FF] uppercase font-bold tracking-widest mb-4 block">Recommended External APIs</span>
        <div className="flex flex-col gap-3">
          {(layout as any)[selectedNodeId]?.category.tools.map((tid: any) => {
            const toolInfo = (TOOL_REGISTRY as any)[tid];
            return (
              <div key={tid} className="bg-gradient-to-r from-white/[0.03] to-transparent border border-white/[0.05] p-4 rounded-xl cursor-default transition-all group">
                <div className="flex justify-between items-start mb-1">
                  <strong className="text-slate-200 text-sm tracking-wide group-hover:text-[#46B1FF] transition-colors">{toolInfo?.name || tid.toUpperCase()}</strong>
                  {toolInfo?.pricing && (
                    <span className="text-[9px] bg-black/40 border border-white/10 text-slate-400 px-2.5 py-0.5 rounded-md uppercase tracking-wider">{toolInfo.pricing}</span>
                  )}
                </div>
                <p className="text-xs text-slate-500 line-clamp-2 mt-2 leading-relaxed">{toolInfo?.description}</p>
              </div>
            );
          })}
        </div>
        <div className="mt-12 flex justify-center pb-8 border-b border-white/[0.02]">
          <p className="text-[9px] text-slate-600 uppercase tracking-widest text-center px-4">Execute AI Pipeline Phase to generate dynamic output for this node.</p>
        </div>
      </div>
    );
  };

  if (graphStatus === 'error') {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-[#0a0a10] text-[#ff6b6b]">
        <AlertTriangle size={64} className="mb-4" />
        <h1 className="text-2xl font-bold tracking-widest mb-2 font-display">GRAPH VALIDATION FAILED</h1>
        <p className="text-slate-400 font-mono text-sm">{initError}</p>
      </div>
    );
  }

  if (!layout) {
    return <div className="h-screen w-screen bg-[#0a0a10]" />;
  }

  return (
    <div className="flex flex-col h-screen w-full overflow-hidden select-none bg-[#0a0a10] text-slate-200 relative">
      <FlowHeader />

      {/* ── Phase Transition Overlay ── */}
      {phaseOverlay && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-[#0a0a10]/80 backdrop-blur-sm">
          <div className="flex flex-col items-center bg-[#13131a] p-8 pb-10 rounded-2xl border border-white/10 shadow-2xl animate-fade-in-up">
            <Sparkles className="text-[#DEF767] mb-4" size={32} />
            <div className="text-[#DEF767] font-bold tracking-widest text-xs mb-2">
              PHASE {phaseOverlay.phase} COMPLETE
            </div>
            <h2 className="text-3xl font-black text-white px-8 uppercase tracking-[0.2em] font-display">
              {phaseOverlay.phaseName}
            </h2>
            <div className="w-16 h-px bg-white/20 my-6" />
            <div className="text-slate-400 text-sm tracking-widest uppercase">
              Initializing {phaseOverlay.nextPhaseName}
            </div>
          </div>
        </div>
      )}
      
      {viewMode === 'templates' && <TemplatesView />}

      {/* ── Floating Neuro-Command (Project Prompt) ── */}
      {viewMode === 'pipeline' && (
      <motion.div 
        initial={{ y: -10, opacity: 0 }} 
        animate={{ y: [0, -6, 0], opacity: 1 }} 
        transition={{ y: { duration: 4, repeat: Infinity, ease: 'easeInOut' }, opacity: { duration: 0.8 } }}
        className="absolute top-[80px] left-1/2 -translate-x-1/2 z-40 w-full max-w-5xl px-8 pointer-events-none"
      >
        <div className="flex flex-col items-center gap-2 pointer-events-auto bg-[#0a0a0f]/60 backdrop-blur-3xl border border-white/5 rounded-3xl p-5 shadow-[0_30px_60px_rgba(0,0,0,0.6)]">
          <div className="flex items-center gap-4 w-full">
             <div className="flex-1 relative group">
                <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-slate-500 group-focus-within:text-[#46B1FF] transition-colors">
                  <Activity size={18} />
                </div>
                <input
                  value={projectPrompt}
                  onChange={(e) => setProjectPrompt(e.target.value)}
                  placeholder="Orchestrate your objective... (e.g. Design a technical whitepaper for a DeFi protocol)"
                  className="w-full bg-black/60 border border-white/5 rounded-[18px] py-4 pl-12 pr-6 outline-none focus:border-[#46B1FF]/40 transition-all text-white text-sm shadow-inner placeholder:text-slate-600 font-secondary"
                  disabled={graphStatus === 'running'}
                />
             </div>
             
             {/* Action Buttons */}
             <div className="flex items-center gap-2">
               <input
                 ref={fileInputRef}
                 type="file"
                 accept=".txt,.md,.json,.pdf"
                 className="hidden"
                 title="Upload attachment"
                 aria-label="Upload attachment"
                 onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const reader = new FileReader();
                    reader.onload = (ev: any) => {
                      const content = ev.target.result as string;
                      setProjectAttachment({ name: file.name, content, type: file.type });

                      // Auto-fill the prompt bar from file content
                      let extractedPrompt = '';
                      if (file.type === 'application/json' || file.name.endsWith('.json')) {
                        try {
                          const json = JSON.parse(content);
                          extractedPrompt = json.title || json.description || json.prompt || json.name || '';
                          if (!extractedPrompt && typeof json === 'object') {
                            extractedPrompt = JSON.stringify(json).substring(0, 200);
                          }
                        } catch {
                          extractedPrompt = content.split('\n').find((l: string) => l.trim().length > 0) || '';
                        }
                      } else {
                        // For .txt, .md — use the first non-empty line as prompt
                        const lines = content.split('\n').map((l: string) => l.replace(/^#+\s*/, '').trim()).filter((l: string) => l.length > 0);
                        extractedPrompt = lines[0] || '';
                      }

                      if (extractedPrompt) {
                        setProjectPrompt(extractedPrompt.substring(0, 200));
                      }

                      addToast('success', `File "${file.name}" loaded — prompt auto-filled from content`);
                    };
                    reader.readAsText(file);
                    e.target.value = '';
                  }}
               />
               <button
                 onClick={() => fileInputRef.current?.click()}
                 disabled={graphStatus === 'running'}
                 className="w-14 h-14 rounded-2xl bg-white/[0.03] border border-white/5 text-slate-400 hover:text-[#46B1FF] hover:border-[#46B1FF]/30 transition-all flex items-center justify-center group"
                 title="Attach context (.txt, .md, .pdf)"
                 aria-label="Attach context file"
               >
                 <Paperclip size={20} className="group-hover:rotate-12 transition-transform" />
               </button>

               <button 
                 onClick={runFullPipeline}
                 disabled={graphStatus === 'running' || !projectPrompt}
                 className={`h-14 px-8 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-3 transition-all ${
                   projectPrompt && graphStatus !== 'running' 
                     ? 'bg-white text-black hover:bg-[#A259FF] hover:text-white shadow-2xl active:scale-95' 
                     : 'bg-white/5 text-slate-600 cursor-not-allowed'
                 }`}
               >
                 {graphStatus === 'running' ? (
                   <><div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" /> Orchestrating...</>
                 ) : (
                   <><Play size={18} fill="currentColor" /> Initialize Engine</>
                 )}
               </button>
             </div>
          </div>

          {/* Key Source Indicator */}
           <div className="flex items-center gap-4 w-full mt-3 px-1">
             <div 
               className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-[10px] font-bold uppercase tracking-wider cursor-pointer transition-all ${
                 keyInfo.activeSource === 'project' 
                   ? 'bg-[#A259FF]/10 border-[#A259FF]/30 text-[#A259FF] shadow-[0_0_15px_rgba(162,89,255,0.1)]' 
                   : keyInfo.activeSource === 'global'
                     ? 'bg-[#46B1FF]/10 border-[#46B1FF]/30 text-[#46B1FF]'
                     : 'bg-white/5 border-white/10 text-slate-500'
               }`}
               onClick={() => {
                 setKeyModalType('NO_KEY');
                 setShowKeyModal(true);
               }}
             >
               <Key size={12} />
               {keyInfo.activeSource === 'project' 
                 ? `Project Key (••••${keyInfo.project.lastFour})` 
                 : keyInfo.activeSource === 'global'
                   ? `Global Key (••••${keyInfo.global.lastFour})`
                   : 'No API Key Configured'}
             </div>
             
             <div className="text-[10px] text-slate-600 font-medium">
               Priority: Project Key &gt; Global Key
             </div>
           </div>

           {/* Attachment Chip */}
          {projectAttachment && (
            <div className="flex items-center gap-2 w-full mt-3 animate-fade-in">
              <div className="flex items-center gap-3 bg-[#46B1FF]/10 border-[#46B1FF]/20 text-[#46B1FF] px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider">
                <Folder size={14} />
                {projectAttachment.name}
                <button 
                  onClick={() => setProjectAttachment(null)}
                  className="ml-2 hover:text-white transition-colors"
                  title="Remove attachment"
                  aria-label="Remove attachment"
                >
                  <X size={12} />
                </button>
              </div>
              <span className="text-[9px] text-slate-500 uppercase tracking-widest">Attached — will be included in AI context</span>
            </div>
          )}
        </div>
      </motion.div>
      )}
      
      {viewMode === 'pipeline' && <FlowControls setCamera={setCamera} camera={camera} />}
      <ToolDock
        activeTool={activeTool}
        setActiveTool={setActiveTool}
        canvasLocked={canvasLocked}
        setCanvasLocked={setCanvasLocked}
        onEraseAll={() => {
          setStickyNotes([]);
          setStrokes([]);
          setTextLabels([]);
          setCurrentStroke(null);
          setProjectAttachment(null);
          // Also reboot the pipeline state
          rebootSequence();
          addToast('info', 'Canvas and pipeline state cleared');
        }}
        onScreenshot={async () => {
          try {
            // Use html2canvas on the entire document body for reliable capture
            const shot = await html2canvas(document.body, { 
              backgroundColor: '#0a0a10', 
              useCORS: true,
              scale: window.devicePixelRatio || 1,
              logging: false,
              allowTaint: true,
              foreignObjectRendering: true,
            });
            const link = document.createElement('a');
            link.download = `agentic-flow-canvas-${Date.now()}.png`;
            link.href = shot.toDataURL('image/png');
            link.click();
            addToast('success', 'Screenshot saved!');
          } catch (err) {
            console.error('Screenshot failed:', err);
            addToast('error', 'Screenshot failed — try again');
          }
        }}
        onLockToggle={(locked) => {
          addToast(locked ? 'warning' : 'success', locked ? 'Canvas locked — interactions disabled' : 'Canvas unlocked');
        }}
      />

      {/* ── Infinite Node Canvas ── */}
      <div className="flex flex-1 overflow-hidden relative">
        <div
          ref={canvasRef}
          id="canvas-bg"
          className={`flex-1 relative overflow-hidden canvas-grid ${isPanning ? 'is-panning' : ''}`}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          <div
            className="absolute origin-top-left flex pointer-events-none canvas-content"
            style={{
              '--canvas-x': `${camera.x}px`,
              '--canvas-y': `${camera.y}px`,
              '--canvas-zoom': camera.zoom,
            } as React.CSSProperties}
          >
            {/* Background Phase Labels */}
            {viewMode === 'pipeline' && WORKFLOW_PHASES.map((p, idx) => {
              const phaseNodes = Object.values(layout).filter(n => n.phase === p.id);
              if (phaseNodes.length === 0) return null;
              
              const minX = Math.min(...phaseNodes.map(n => n.x));
              const maxX = Math.max(...phaseNodes.map(n => n.x));
              const centerX = minX + (maxX - minX) / 2;

              return (
                <React.Fragment key={idx}>
                  <div
                    className="absolute pointer-events-none phase-label"
                    style={{
                      left: centerX,
                      top: 100, // Top of canvas
                      transform: 'translate(-50%, -50%)',
                    }}
                  >
                    <div className="text-2xl font-black tracking-[0.4em] mb-1 text-center" style={{ opacity: 0.6 }}>
                      {p.label}
                    </div>
                    <div className="text-[9px] font-bold tracking-[0.6em] uppercase text-center mx-auto" style={{ opacity: 0.4, paddingLeft: '0.6em' }}>
                      {p.subtitle}
                    </div>
                  </div>
                  
                  <PhaseSummaryBox phase={p} x={centerX} y={800} />
                </React.Fragment>
              );
            })}

            {/* Annotations & Edges */}
            <svg className="absolute inset-0 pointer-events-none w-full h-full overflow-visible z-10">
              <defs>
                <marker id="arrow-lime" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="4" markerHeight="4" orient="auto-start-reverse">
                  <path d="M 0 0 L 10 5 L 0 10 z" fill="#DEF767" />
                </marker>
              </defs>

              {strokes.map((stroke: any) => (
                <polyline 
                  key={`stroke-${stroke.id}`} 
                  points={stroke.points.map((p: any) => `${p.x},${p.y}`).join(' ')} 
                  stroke="#A259FF" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" 
                  fill="none" 
                  opacity="0.6"
                />
              ))}
              {currentStroke && (
                <polyline 
                  points={currentStroke.map((p: any) => `${p.x},${p.y}`).join(' ')} 
                  stroke="#A259FF" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" 
                  fill="none" opacity="0.6"
                />
              )}

              {viewMode === 'pipeline' && bundledEdges.map((edge: any, idx: any) => {
                const fromLayout = (layout as any)[edge.from];
                const toLayout = (layout as any)[edge.to];
                if (!fromLayout || !toLayout) return null;

                const fromAnchor = { x: fromLayout.x + 140, y: fromLayout.y + 70 };
                const toAnchor = { x: toLayout.x, y: toLayout.y + 70 };

                const pathString = computeEdgePath(fromAnchor, toAnchor, edge.routeConfig);
                const isActive = nodeStates[edge.from] === 'running' || nodeStates[edge.from] === 'completed';

                return (
                  <path
                    key={idx}
                    d={pathString}
                    strokeWidth="2"
                    fill="none"
                    className={`thread-wire ${isActive ? 'thread-active' : 'thread-idle'}`}
                  />
                );
              })}
              {viewMode === 'pipeline' && customEdges.map((edge: any, idx: any) => {
                const isActive = nodeStates[edge.from] === 'running' || nodeStates[edge.from] === 'completed';
                return (
                  <path
                    key={`custom-${idx}`}
                    d={edge.d}
                    strokeWidth="2"
                    fill="none"
                    className={`thread-wire ${isActive ? 'thread-active' : 'thread-idle'}`}
                  />
                );
              })}
            </svg>

            {/* Builder Canvas */}
            {viewMode === 'builder' && (
               <BuilderCanvas activeTool={activeTool} setActiveTool={setActiveTool} getCanvasCoords={getCanvasCoords} />
            )}

            {/* Agent Nodes */}
            {viewMode === 'pipeline' && Object.values(layout as any).map((node: any) => {
              const animState = useWorkflowStore.getState().animationState;
              const isVisible = animState.activeNodes.includes(node.id) || graphStatus === 'ready' || graphStatus === 'completed' || graphStatus === 'running'; 
              
              // Determine phase index for opacity - works for both schema and builder nodes
              let parsePhaseIdx = -1;
              if (node.phase) {
                parsePhaseIdx = WORKFLOW_PHASES.findIndex(p => p.id === node.phase);
              } else if (node.id.includes('::')) {
                parsePhaseIdx = WORKFLOW_PHASES.findIndex(p => p.id === node.id.split('::')[0]);
              }
              const isPendingPhase = parsePhaseIdx >= 0 && parsePhaseIdx > currentPhaseIndex;
              
              return (
                <div key={node.id} style={{ opacity: isPendingPhase ? 0.5 : 1 }} className="transition-opacity duration-700">
                  <NodeContainer
                    node={node}
                    state={nodeStates[node.id] || 'idle'}
                    onClick={() => selectNode(node.id)}
                    isVisible={isVisible}
                  />
                </div>
              )
            })}
            {/* Sticky Notes */}
            {stickyNotes.map((note: any) => {
              const noteColor = note.color || '#A259FF';
              const noteW = note.width || 240;
              const noteH = note.height || 180;
              const isEditing = editingStickyId === note.id;

              return (
              <div key={`sticky-${note.id}`} 
                className={`absolute sticky-note p-3 rounded-2xl z-30 transition-shadow font-secondary flex flex-col group shadow-2xl cursor-grab active:cursor-grabbing ${
                  isEditing ? 'ring-2 ring-offset-2 ring-offset-transparent' : 'border border-transparent hover:border-white/10'
                }`}
                onMouseDown={(e: any) => {
                  if (isEditing) return; // Don't drag while editing
                  if ((e.target as any).classList.contains('resize-handle')) {
                    e.stopPropagation();
                    setResizingAppElement({ type: 'sticky', id: note.id, elemX: note.x, elemY: note.y });
                    return;
                  }
                  if (activeTool === 'cursor') {
                    e.stopPropagation();
                    const coords = getCanvasCoords(e.clientX, e.clientY);
                    setDraggingAppElement({ type: 'sticky', id: note.id, startX: note.x, startY: note.y, startMouseX: coords.x, startMouseY: coords.y });
                  }
                }}
                style={{
                  left: note.x, top: note.y, width: noteW, height: noteH,
                  background: 'rgba(26, 26, 46, 0.85)',
                  borderColor: isEditing ? noteColor : `${noteColor}40`,
                  backdropFilter: 'blur(16px)',
                  pointerEvents: 'auto',
                  boxShadow: isEditing ? `0 0 40px ${noteColor}50` : `0 10px 30px rgba(0,0,0,0.5)`,
                }}>
                <div className="w-full h-1.5 rounded-t-xl absolute top-0 left-0" style={{ background: `linear-gradient(to right, ${noteColor}, ${noteColor}80)` }} />
                
                <button
                  title="Delete sticky note"
                  aria-label="Delete sticky note"
                  onClick={(e: React.MouseEvent) => {
                    e.stopPropagation();
                    setStickyNotes(prev => prev.filter(n => n.id !== note.id));
                    if (editingStickyId === note.id) setEditingStickyId(null);
                  }}
                  className="absolute top-3 right-3 p-1.5 rounded-lg bg-black/60 text-slate-400 hover:text-white hover:bg-[#ff4b4b] transition-all opacity-0 group-hover:opacity-100 z-50 shadow-md"
                >
                  <X size={16} />
                </button>

                <textarea 
                  className="flex-1 w-full mt-3 bg-transparent outline-none resize-none text-slate-200 text-sm placeholder-slate-500 custom-scrollbar-neon"
                  placeholder="Note insights here..."
                  value={note.text}
                  onMouseDown={e => e.stopPropagation()}
                  onFocus={() => {
                    // Auto-zoom to this sticky note
                    preFocusCamera.current = { ...camera };
                    setEditingStickyId(note.id);
                    const canvasEl = canvasRef.current;
                    if (canvasEl) {
                      const rect = canvasEl.getBoundingClientRect();
                      const targetZoom = 1.0;
                      const centerX = rect.width / 2 - (note.x + noteW / 2) * targetZoom;
                      const centerY = rect.height / 2 - (note.y + noteH / 2) * targetZoom;
                      setCamera({ x: centerX, y: centerY, zoom: targetZoom });
                    }
                  }}
                  onBlur={() => {
                    if (preFocusCamera.current) {
                      setCamera(preFocusCamera.current);
                      preFocusCamera.current = null;
                    }
                    setEditingStickyId(null);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Escape') {
                      (e.target as HTMLTextAreaElement).blur();
                    }
                  }}
                  onChange={(e) => {
                    setStickyNotes(prev => prev.map(n => n.id === note.id ? { ...n, text: e.target.value } : n));
                  }}
                />

                {/* Resize Handle */}
                <div
                  className="resize-handle absolute bottom-0 right-0 w-6 h-6 cursor-nwse-resize opacity-0 group-hover:opacity-100 transition-opacity z-30"
                  style={{
                    background: `linear-gradient(135deg, transparent 50%, ${noteColor}80 50%)`,
                    borderRadius: '0 0 16px 0',
                  }}
                />
              </div>
              );
            })}

            {/* Text Labels */}
            {textLabels.map(label => {
              const isEditing = editingLabelId === label.id;
              return (
              <div
                key={`label-${label.id}`}
                className="absolute z-20 pointer-events-auto group cursor-grab active:cursor-grabbing"
                style={{ left: label.x - 75, top: label.y - 15 }}
                onMouseDown={(e: any) => {
                  if (isEditing) return;
                  if (e.target.tagName === 'INPUT') return;
                  e.stopPropagation();
                  const coords = getCanvasCoords(e.clientX, e.clientY);
                  setDraggingAppElement({ type: 'label', id: label.id, startX: label.x, startY: label.y, startMouseX: coords.x, startMouseY: coords.y });
                }}
              >
                <input
                  className={`bg-transparent outline-none text-white font-bold w-[150px] placeholder-slate-500 border-b border-dashed pb-1 transition-all ${
                    isEditing ? 'text-lg border-[#46B1FF]/80' : 'text-sm border-white/20 focus:border-[#46B1FF]/50'
                  }`}
                  placeholder="Type label..."
                  value={label.text}
                  onMouseDown={e => e.stopPropagation()}
                  onFocus={() => {
                    preFocusCamera.current = { ...camera };
                    setEditingLabelId(label.id);
                    const canvasEl = canvasRef.current;
                    if (canvasEl) {
                      const rect = canvasEl.getBoundingClientRect();
                      const targetZoom = 1.0;
                      const centerX = rect.width / 2 - label.x * targetZoom;
                      const centerY = rect.height / 2 - label.y * targetZoom;
                      setCamera({ x: centerX, y: centerY, zoom: targetZoom });
                    }
                  }}
                  onBlur={() => {
                    if (preFocusCamera.current) {
                      setCamera(preFocusCamera.current);
                      preFocusCamera.current = null;
                    }
                    setEditingLabelId(null);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === 'Escape') {
                      (e.target as HTMLInputElement).blur();
                    }
                  }}
                  onChange={(e) => {
                    setTextLabels(prev => prev.map(l => l.id === label.id ? { ...l, text: e.target.value } : l));
                  }}
                />
                <button
                  onClick={() => setTextLabels(prev => prev.filter(l => l.id !== label.id))}
                  className="absolute -top-2 -right-2 w-4 h-4 rounded-full bg-[#ff4b4b] text-white text-[8px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  ✕
                </button>
              </div>
              );
            })}
          </div>
        </div>

        {/* ── Intelligence Layer Output Sidebar ── */}
        {viewMode === 'builder' ? (
           <BuilderSidebar />
        ) : (
        <div 
          className={`absolute right-0 top-0 h-full w-[460px] bg-[#0c0c14]/60 backdrop-blur-2xl border-l border-white/5 p-0 shadow-2xl transition-transform duration-500 z-50 flex flex-col ${selectedNodeId ? 'translate-x-0' : 'translate-x-full'}`}
        >
           <div className="flex justify-between items-center p-6 border-b border-white/[0.04] bg-black/40">
             <div>
               <h2 className="font-bold text-[10px] uppercase tracking-widest text-[#46B1FF] mb-1">Delivered Asset Output</h2>
               <span className="text-white font-black tracking-wide font-display text-lg">
                 {selectedNodeId?.startsWith('sticky-') ? 'Sticky Note insight' : layout[selectedNodeId]?.category.name}
               </span>
             </div>
             <button onClick={() => selectNode(null)} className="p-2 bg-white/5 rounded-full text-slate-500 hover:text-white hover:bg-white/10 transition-colors">✕</button>
           </div>
           
           <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
           {selectedNodeId ? (
                <div className="animate-fade-in flex flex-col h-full">
                  {renderPipelineSidebarContent()}
              </div>
           ) : null}
           </div>
        </div>
        )}
      </div>

      {/* View Results Button - appears when completed */}
      {graphStatus === 'completed' && (
        <button
          onClick={() => setShowOutputScreen(true)}
          className="fixed bottom-6 right-6 z-[60] flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-[#DEF767] to-[#A3E636] text-black text-xs font-black uppercase tracking-widest shadow-xl shadow-[#DEF767]/20 hover:scale-105 transition-transform animate-bounce"
          style={{ animationIterationCount: 3 }}
        >
          <FileText size={16} /> View Results & Download PDF
        </button>
      )}

      <OutputScreen isOpen={showOutputScreen} onClose={() => setShowOutputScreen(false)} />
      {/* Toast System */}
      <ToastContainer />

      {/* API Key Modal */}
      <AnimatePresence>
        {showKeyModal && (
          <ApiKeyModal 
            type={keyModalType} 
            onClose={() => setShowKeyModal(false)} 
            onSaved={() => {
              const seqId = localStorage.getItem('active_sequence_id');
              if (seqId) checkKeyAvailability(seqId).then(setKeyInfo);
              setShowKeyModal(false);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

// ── API Key Modal Component ──────────────────────────────────────
const ApiKeyModal = ({ type, onClose, onSaved }: { type: string, onClose: () => void, onSaved: () => void }) => {
  const [key, setKey] = useState('');
  const [scope, setScope] = useState<'project' | 'global'>('project');
  const [showKey, setShowKey] = useState(false);
  const [saving, setSaving] = useState(false);
  const addToast = useToastStore(s => s.addToast);

  const handleSave = async () => {
    if (!key.trim()) return;
    setSaving(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const seqId = localStorage.getItem('active_sequence_id');
      const endpoint = scope === 'project' ? '/api/keys/save-project' : '/api/keys/save';
      const payload = scope === 'project' 
        ? { userId: session.user.id, sequenceId: seqId, apiKey: key.trim() }
        : { userId: session.user.id, apiKey: key.trim() };

      const res = await fetch(`http://localhost:3001${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) throw new Error('Failed to save key');

      addToast('success', `API Key saved ${scope === 'project' ? 'for this project' : 'globally'}`);
      onSaved();
    } catch (err: any) {
      addToast('error', err.message);
    } finally {
      setSaving(false);
    }
  };

  const titles: Record<string, string> = {
    NO_KEY: 'API Key Required',
    INVALID_KEY: 'Invalid API Key',
    RATE_LIMIT: 'Rate Limit Reached'
  };

  const descriptions: Record<string, string> = {
    NO_KEY: 'An API key is required to orchestrate this neural sequence. Choose how you want to store it.',
    INVALID_KEY: 'The provided key was rejected by the provider. Please enter a valid OpenRouter or LLM API key.',
    RATE_LIMIT: 'The current key is being rate limited. You can wait or provide a new key for this project.'
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
      <motion.div 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
      />
      
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="relative w-full max-w-md bg-[#0a0a0f] border border-white/10 rounded-[32px] p-8 shadow-[0_40px_100px_rgba(0,0,0,0.8)] overflow-hidden"
      >
        {/* Glow decoration */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-[#A259FF]/20 blur-[60px] rounded-full" />
        
        <div className="relative z-10">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#A259FF] to-[#46B1FF] flex items-center justify-center text-white shadow-lg">
              <Key size={24} />
            </div>
            <div>
              <h3 className="text-xl font-black text-white font-display tracking-tight">{titles[type]}</h3>
              <p className="text-xs text-slate-500 font-medium">Neural Conductor Authentication</p>
            </div>
          </div>

          <p className="text-sm text-slate-400 leading-relaxed mb-8">
            {descriptions[type]}
          </p>

          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">API Key</label>
              <div className="relative group">
                <input
                  type={showKey ? 'text' : 'password'}
                  value={key}
                  onChange={(e) => setKey(e.target.value)}
                  placeholder="sk-or-v1-..."
                  className="w-full bg-white/[0.03] border border-white/10 rounded-2xl py-4 pl-5 pr-12 text-sm text-white focus:border-[#A259FF]/50 outline-none transition-all placeholder:text-slate-700"
                />
                <button
                  onClick={() => setShowKey(!showKey)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-600 hover:text-white transition-colors"
                  title={showKey ? "Hide key" : "Show key"}
                  aria-label={showKey ? "Hide key" : "Show key"}
                >
                  {showKey ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setScope('project')}
                className={`flex flex-col items-center gap-2 p-4 rounded-2xl border transition-all ${
                  scope === 'project' 
                    ? 'bg-[#A259FF]/10 border-[#A259FF]/40 text-white' 
                    : 'bg-white/[0.02] border-white/5 text-slate-500 hover:border-white/10'
                }`}
              >
                <ShieldCheck size={20} className={scope === 'project' ? 'text-[#A259FF]' : ''} />
                <span className="text-[10px] font-black uppercase tracking-wider">Project Only</span>
              </button>
              <button
                onClick={() => setScope('global')}
                className={`flex flex-col items-center gap-2 p-4 rounded-2xl border transition-all ${
                  scope === 'global' 
                    ? 'bg-[#46B1FF]/10 border-[#46B1FF]/40 text-white' 
                    : 'bg-white/[0.02] border-white/5 text-slate-500 hover:border-white/10'
                }`}
              >
                <Globe size={20} className={scope === 'global' ? 'text-[#46B1FF]' : ''} />
                <span className="text-[10px] font-black uppercase tracking-wider">Global Use</span>
              </button>
            </div>

            <div className="flex items-center gap-3 bg-white/[0.02] p-4 rounded-2xl border border-white/5">
              <InfoIcon size={16} className="text-slate-600 shrink-0" />
              <p className="text-[10px] text-slate-500 leading-normal">
                {scope === 'project' 
                  ? 'Project keys are encrypted and stored specifically for this neural sequence.' 
                  : 'Global keys are saved to your profile and used as a fallback for all your sequences.'}
              </p>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={onClose}
                className="flex-1 py-4 rounded-2xl border border-white/10 text-xs font-black uppercase tracking-widest text-slate-400 hover:bg-white/5 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !key.trim()}
                className="flex-[2] py-4 rounded-2xl bg-white text-black text-xs font-black uppercase tracking-widest hover:bg-[#DEF767] transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-xl active:scale-95 flex items-center justify-center gap-2"
              >
                {saving ? (
                  <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                ) : (
                  'Authorize Access'
                )}
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Engine;
