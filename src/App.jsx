import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Sparkles, AlertTriangle, Play, RefreshCw, Trash2, Paperclip, X, FileText } from 'lucide-react';
import confetti from 'canvas-confetti';
// eslint-disable-next-line no-unused-vars
import { motion } from 'framer-motion';

// Core Schema & Logic
import { WORKFLOW_PHASES, EDGES, TOOL_REGISTRY } from './data/schema';
import { validateGraph } from './lib/graphValidator';
import { computeLayout } from './lib/layoutEngine';
import { computeEdgePath, bundleEdges } from './lib/edgeRouter';
import { useWorkflowStore, selectActiveNodeId } from './lib/store';
import { callLLM } from './lib/llm';

// Components
import FlowHeader from './components/FlowHeader';
import FlowFooter from './components/FlowFooter';
import FlowControls from './components/FlowControls';
import NodeContainer from './components/NodeContainer';
import PhaseSummaryBox from './components/PhaseSummaryBox';
import ToolDock from './components/ToolDock';
import OutputScreen from './components/OutputScreen';
import BuilderCanvas from './components/BuilderCanvas';
import BuilderSidebar from './components/BuilderSidebar';
import TemplatesView from './components/TemplatesView';
import { useBuilderStore } from './lib/builderStore';

const App = () => {
  const [initError, setInitError] = useState(null);
  
  // Zustand State
  const graphStatus = useWorkflowStore(state => state.graphStatus);
  const setGraphStatus = useWorkflowStore(state => state.setGraphStatus);
  const selectedNodeId = useWorkflowStore(selectActiveNodeId);
  const selectNode = useWorkflowStore(state => state.selectNode);
  const nodeStates = useWorkflowStore(state => state.nodeStates);
  
  const viewMode = useBuilderStore(state => state.viewMode);
  const nodeResults = useWorkflowStore(state => state.nodeResults);
  const projectPrompt = useWorkflowStore(state => state.projectPrompt);
  const setProjectPrompt = useWorkflowStore(state => state.setProjectPrompt);
  const currentPhaseIndex = useWorkflowStore(state => state.currentPhaseIndex);
  const projectAttachment = useWorkflowStore(state => state.projectAttachment);
  const setProjectAttachment = useWorkflowStore(state => state.setProjectAttachment);
  const fileInputRef = useRef(null);

  const [phaseOverlay, setPhaseOverlay] = useState(null);
  const [showOutputScreen, setShowOutputScreen] = useState(false);


  // Canvas Viewport logic
  const [camera, setCamera] = useState({ x: 100, y: 60, zoom: 0.55 });
  const [isPanning, setIsPanning] = useState(false);
  const canvasRef = useRef(null);
  const lastMousePos = useRef({ x: 0, y: 0 });

  // Toolkit State
  const [activeTool, setActiveTool] = useState('cursor');
  const [stickyNotes, setStickyNotes] = useState([]);
  const [strokes, setStrokes] = useState([]);
  const [currentStroke, setCurrentStroke] = useState(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [canvasLocked, setCanvasLocked] = useState(false);
  const [textLabels, setTextLabels] = useState([]);
  const [draggingAppElement, setDraggingAppElement] = useState(null);
  const [resizingAppElement, setResizingAppElement] = useState(null);

  // Boot validation
  useEffect(() => {
    try {
      setGraphStatus('loading');
      validateGraph();
      setGraphStatus('ready');
    } catch (e) {
      console.error(e);
      setInitError(e.message);
      setGraphStatus('error');
    }
  }, [setGraphStatus]);

  // Compute Layout 
  const layout = useMemo(() => {
    if (graphStatus === 'error') return null;
    return computeLayout('desktop', 2000, 1000);
  }, [graphStatus]);

  // Bundle Edges 
  const bundledEdges = useMemo(() => {
    if (graphStatus === 'error' || graphStatus === 'idle') return [];
    return bundleEdges(EDGES);
  }, [graphStatus]);

  // Canvas Interactions
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const onWheel = (e) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        setCamera((prev) => {
          const newZoom = Math.min(Math.max(prev.zoom - e.deltaY * 0.001, 0.15), 2);
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
        setCamera((prev) => ({
          ...prev,
          x: prev.x - e.deltaX,
          y: prev.y - e.deltaY,
        }));
      }
    };

    canvas.addEventListener('wheel', onWheel, { passive: false });
    return () => canvas.removeEventListener('wheel', onWheel);
  }, []);

  const getCanvasCoords = useCallback((clientX, clientY) => {
    return {
      x: (clientX - camera.x) / camera.zoom,
      y: (clientY - camera.y) / camera.zoom
    };
  }, [camera]);

  const handleMouseDown = useCallback((e) => {
    if (e.target.closest('.n8n-node') || e.target.closest('.sticky-note')) return;

    if (activeTool === 'cursor') {
      if (!canvasLocked && (e.button === 1 || (e.button === 0 && e.altKey) || e.target.id === 'canvas-bg')) {
        setIsPanning(true);
        lastMousePos.current = { x: e.clientX, y: e.clientY };
      }
    } else if (activeTool === 'sticky') {
      const coords = getCanvasCoords(e.clientX, e.clientY);
      setStickyNotes(prev => [...prev, { id: Date.now(), x: coords.x, y: coords.y, text: '', color: '#A259FF' }]);
      setActiveTool('cursor');
    } else if (activeTool === 'text') {
      const coords = getCanvasCoords(e.clientX, e.clientY);
      setTextLabels(prev => [...prev, { id: Date.now(), x: coords.x, y: coords.y, text: '' }]);
      setActiveTool('cursor');
    } else if (activeTool === 'highlighter') {
      setIsDrawing(true);
      const coords = getCanvasCoords(e.clientX, e.clientY);
      setCurrentStroke([coords]);
    }
    if (activeTool === 'cursor') {
      e.stopPropagation();
      const coords = getCanvasCoords(e.clientX, e.clientY);
      if (note) {
        selectNode(`sticky-${note.id}`);
        setDraggingAppElement({ type: 'sticky', id: note.id, startX: note.x, startY: note.y, startMouseX: coords.x, startMouseY: coords.y });
      }
    }
  }, [activeTool, getCanvasCoords, selectNode]);

  const handleMouseMove = useCallback(
    (e) => {
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
          setStickyNotes(prev => prev.map(n => n.id === draggingAppElement.id ? { ...n, x: draggingAppElement.startX + dx, y: draggingAppElement.startY + dy } : n));
        }
      }

      if (resizingAppElement) {
        const coords = getCanvasCoords(e.clientX, e.clientY);
        const newWidth = Math.max(120, coords.x - resizingAppElement.elemX);
        const newHeight = Math.max(120, coords.y - resizingAppElement.elemY);
        if (resizingAppElement.type === 'sticky') {
           setStickyNotes(prev => prev.map(n => n.id === resizingAppElement.id ? { ...n, width: newWidth, height: newHeight } : n));
        }
      }

      if (isPanning) {
        const dx = e.clientX - lastMousePos.current.x;
        const dy = e.clientY - lastMousePos.current.y;
        setCamera((prev) => ({ ...prev, x: prev.x + dx, y: prev.y + dy }));
        lastMousePos.current = { x: e.clientX, y: e.clientY };
      } else if (isDrawing && activeTool === 'highlighter') {
        const coords = getCanvasCoords(e.clientX, e.clientY);
        setCurrentStroke(prev => [...prev, coords]);
      }
    },
    [isPanning, isDrawing, activeTool, getCanvasCoords]
  );

  const handleMouseUp = useCallback(() => {
    if (draggingAppElement) setDraggingAppElement(null);
    if (resizingAppElement) setResizingAppElement(null);
    if (isPanning) setIsPanning(false);
    if (isDrawing) {
      setIsDrawing(false);
      if (currentStroke && currentStroke.length > 0) {
        const strokeId = Date.now();
        setStrokes(prev => [...prev, { id: strokeId, points: currentStroke }]);
        setCurrentStroke(null);
        
        setTimeout(() => {
          setStrokes(prev => prev.filter(s => s.id !== strokeId));
        }, 2500);
      }
    }
  }, [isPanning, isDrawing, currentStroke]);

  const runCurrentPhase = useCallback(async () => {
    if (!layout || graphStatus === 'running') return;
    const store = useWorkflowStore.getState();
    
    // Check if prompt exists
    if (!projectPrompt || projectPrompt.trim() === '') {
      alert("Please enter a custom project directive in the top bar first!");
      return;
    }

    store.setGraphStatus('running');
    
    const phase = WORKFLOW_PHASES[currentPhaseIndex];
    if (!phase) {
      store.setGraphStatus('completed');
      return; // end of flow
    }

    const nextPhase = WORKFLOW_PHASES[currentPhaseIndex + 1];
    const phaseNodes = phase.categories.map(c => `${phase.id}::${c}`);
    
    // Reveal visually 
    const currentActive = store.animationState.activeNodes;
    store.setAnimationState({ activeNodes: [...currentActive, ...phaseNodes] });

    // NEURAL BRIDGE
    let neuralContext = '';
    if (currentPhaseIndex > 0) {
      const prevPhase = WORKFLOW_PHASES[currentPhaseIndex - 1];
      const prevPhaseNodes = prevPhase.categories.map(c => `${prevPhase.id}::${c}`);
      const currentResults = store.nodeResults || {};
      neuralContext = prevPhaseNodes
        .map(id => currentResults[id]?.content)
        .filter(Boolean)
        .join('\n\n---\n\n');
    }

    // Phase Execution
    for (const nId of phaseNodes) {
      store.setNodeState(nId, 'running');
      
      const nodeCategory = nId.split('::')[1];
      const agentData = {
        id: nId,
        phaseLabel: phase.label,
        categoryName: nodeCategory,
        name: layout[nId]?.category?.name || nodeCategory
      };

      try {
        const taskObj = `Project directive: ${store.projectPrompt}\n\nExecute agentic objective for ${agentData.name} within the ${agentData.phaseLabel} architecture phase. Provide deep expert analysis based on the project directive.`;
        const result = await callLLM(taskObj, agentData, neuralContext, store.projectAttachment);
        store.setNodeResult(nId, result);
      } catch (err) {
        console.error(`[${nId}] Error:`, err);
      }

      store.setNodeState(nId, 'completed');
    }
    
    store.setGraphStatus('ready'); // Wait for human logic

    if (nextPhase) {
      store.setCurrentPhaseIndex(currentPhaseIndex + 1);
      setPhaseOverlay({ phase: currentPhaseIndex + 1, phaseName: phase.label, nextPhaseName: nextPhase.label });
      await new Promise(r => setTimeout(r, 2000));
      setPhaseOverlay(null);
    } else {
      store.setGraphStatus('completed');
      // CONFETTI EXPLOSION!
      const duration = 2000;
      const end = Date.now() + duration;

      (function frame() {
        confetti({ particleCount: 8, angle: 60, spread: 70, origin: { x: 0 }, colors: ['#46B1FF', '#CEA3FF', '#DEF767'] });
        confetti({ particleCount: 8, angle: 120, spread: 70, origin: { x: 1 }, colors: ['#A259FF', '#DEF767', '#ffffff'] });
        if (Date.now() < end) requestAnimationFrame(frame);
      }());
      // Auto-open output screen after confetti
      setTimeout(() => setShowOutputScreen(true), 2500);
    }
  }, [layout, graphStatus, currentPhaseIndex, projectPrompt]);

  const rebootSequence = () => {
    const store = useWorkflowStore.getState();
    const nodes = Object.values(layout).map(n => n.id);
    store.resetExecution(nodes);
    store.setProjectPrompt('');
    setShowOutputScreen(false);
  };

  const renderPipelineSidebarContent = () => {
    if (!selectedNodeId) return null;

    // Sticky note branch
    if (selectedNodeId.startsWith('sticky-')) {
      const stickyNote = stickyNotes.find(n => `sticky-${n.id}` === selectedNodeId);
      const STICKY_COLORS = ['#A259FF', '#46B1FF', '#DEF767', '#FF6A6A', '#FACC15'];
      return (
        <div className="flex-1 mt-4 flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <span className="text-[9px] text-slate-500 uppercase tracking-widest font-bold mr-1">Accent</span>
            {STICKY_COLORS.map(color => (
              <button
                key={color}
                onClick={() => {
                  setStickyNotes(prev => prev.map(n => n.id === stickyNote?.id ? { ...n, color } : n));
                }}
                className="w-5 h-5 rounded-full border-2 transition-all hover:scale-125"
                style={{
                  background: color,
                  borderColor: stickyNote?.color === color ? '#fff' : 'transparent',
                  boxShadow: stickyNote?.color === color ? `0 0 10px ${color}` : 'none',
                }}
              />
            ))}
          </div>
          <textarea
            className="w-full min-h-[200px] bg-white/[0.02] border border-white/[0.05] rounded-xl p-4 text-sm text-slate-200 leading-relaxed font-secondary resize-none outline-none focus:border-[#A259FF]/40 transition-colors shadow-inner custom-scrollbar"
            placeholder="Write your insights here..."
            value={stickyNote?.text || ''}
            onChange={(e) => {
              setStickyNotes(prev => prev.map(n => n.id === stickyNote?.id ? { ...n, text: e.target.value } : n));
            }}
          />
          <button
            onClick={() => {
              setStickyNotes(prev => prev.filter(n => n.id !== stickyNote?.id));
              selectNode(null);
            }}
            className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-[#ff4b4b]/10 border border-[#ff4b4b]/20 text-[#ff4b4b] text-xs font-bold uppercase tracking-widest hover:bg-[#ff4b4b]/20 transition-colors"
          >
            <Trash2 size={14} /> Delete Sticky Note
          </button>
          <p className="text-[9px] text-slate-600 uppercase tracking-widest text-center">Changes sync to canvas in real-time</p>
        </div>
      );
    }

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
          <p className="text-sm text-slate-400 leading-relaxed font-light">{layout[selectedNodeId]?.category.description}</p>
        </div>
        <span className="text-[10px] text-[#A259FF] uppercase font-bold tracking-widest mb-4 block">Recommended External APIs</span>
        <div className="flex flex-col gap-3">
          {layout[selectedNodeId]?.category.tools.map(tid => {
            const toolInfo = TOOL_REGISTRY[tid];
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

      {/* ── Floating Command Center (Project Prompt) ── */}
      {viewMode === 'pipeline' && (
      <div className="absolute top-[80px] left-1/2 -translate-x-1/2 z-40 w-full max-w-4xl px-8 pointer-events-none">
        <div className="flex flex-col items-center gap-2 pointer-events-auto bg-[#0c0c14]/80 backdrop-blur-xl border border-white/10 rounded-2xl p-4 shadow-2xl">
          <div className="flex items-center gap-3 w-full">
             <input
               value={projectPrompt}
               onChange={(e) => setProjectPrompt(e.target.value)}
               placeholder="Enter your Project Directive... (e.g., A minimalist habit tracker app)"
               className="flex-1 bg-black/60 border border-transparent rounded-xl px-4 py-3 outline-none focus:border-[#46B1FF]/50 transition-colors text-white text-sm shadow-inner placeholder:text-slate-500 font-secondary"
               disabled={graphStatus === 'running'}
             />
             {/* Upload Button */}
             <input
               ref={fileInputRef}
               type="file"
               accept=".txt,.md,.json,.pdf"
               className="hidden"
               onChange={(e) => {
                 const file = e.target.files?.[0];
                 if (!file) return;
                 const reader = new FileReader();
                 reader.onload = (ev) => {
                   setProjectAttachment({ name: file.name, content: ev.target.result, type: file.type });
                 };
                 reader.readAsText(file);
                 e.target.value = '';
               }}
             />
             <button
               onClick={() => fileInputRef.current?.click()}
               disabled={graphStatus === 'running'}
               className="p-3 rounded-xl bg-white/5 border border-white/10 text-slate-400 hover:text-[#46B1FF] hover:border-[#46B1FF]/30 transition-all"
               title="Attach a file (.txt, .md, .json)"
             >
               <Paperclip size={16} />
             </button>
             <button 
               onClick={graphStatus === 'completed' ? rebootSequence : runCurrentPhase}
               disabled={graphStatus === 'running' || !projectPrompt}
               className={`px-6 py-3 rounded-xl font-bold flex items-center gap-3 transition-colors ${
                 graphStatus === 'completed' 
                   ? 'bg-[#DEF767] hover:bg-[#DEF767]/80 text-black' 
                   : projectPrompt && graphStatus !== 'running' 
                     ? 'bg-gradient-to-r from-[#46B1FF] to-[#A259FF] hover:opacity-80 text-white shadow-lg' 
                     : 'bg-white/5 text-slate-500 cursor-not-allowed'
               }`}
             >
               {graphStatus === 'completed' ? (
                 <><RefreshCw size={16} /> Reboot AI Pipeline</>
               ) : graphStatus === 'running' ? (
                 <><RefreshCw size={16} className="animate-spin" /> Running Phase {currentPhaseIndex + 1}...</>
               ) : (
                 <><Play size={16} fill="currentColor" /> Execute Phase {currentPhaseIndex + 1}</>
               )}
             </button>
          </div>
          {/* Attachment Chip */}
          {projectAttachment && (
            <div className="flex items-center gap-2 w-full">
              <div className="flex items-center gap-2 bg-[#46B1FF]/10 border border-[#46B1FF]/20 text-[#46B1FF] px-3 py-1.5 rounded-lg text-xs font-bold">
                <Paperclip size={12} />
                <span className="truncate max-w-[200px]">{projectAttachment.name}</span>
                <button
                  onClick={() => setProjectAttachment(null)}
                  className="ml-1 hover:text-white transition-colors"
                >
                  <X size={12} />
                </button>
              </div>
              <span className="text-[9px] text-slate-500 uppercase tracking-widest">Attached — will be included in AI context</span>
            </div>
          )}
        </div>
      </div>
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
        }}
        onScreenshot={async () => {
          const html2canvas = (await import('html2canvas')).default;
          const canvas = canvasRef.current;
          if (!canvas) return;
          const shot = await html2canvas(canvas, { backgroundColor: '#0a0a10', useCORS: true });
          const link = document.createElement('a');
          link.download = `agentic-flow-canvas-${Date.now()}.png`;
          link.href = shot.toDataURL();
          link.click();
        }}
      />

      {/* ── Infinite Node Canvas ── */}
      <div className="flex flex-1 overflow-hidden relative">
        <div
          ref={canvasRef}
          id="canvas-bg"
          className="flex-1 relative overflow-hidden canvas-grid"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          style={{ cursor: isPanning ? 'grabbing' : 'grab' }}
        >
          <div
            className="absolute origin-top-left flex pointer-events-none"
            style={{
              transform: `translate(${camera.x}px, ${camera.y}px) scale(${camera.zoom})`,
              width: 3000,
              height: 2000,
              willChange: 'transform',
            }}
          >
            {/* Background Phase Labels */}
            {viewMode === 'pipeline' && WORKFLOW_PHASES.map((p, idx) => {
              const firstNodeId = `${p.id}::${p.categories[0]}`;
              const firstNodeLayout = layout[firstNodeId];
              if (!firstNodeLayout) return null;

              return (
                <React.Fragment key={idx}>
                  <div
                    className="absolute pointer-events-none phase-label"
                    style={{
                      left: firstNodeLayout.x + 70, // center it
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
                  
                  <PhaseSummaryBox phase={p} x={firstNodeLayout.x + 70} y={firstNodeLayout.y + 360} />
                </React.Fragment>
              );
            })}

            {/* Edges / Wires */}
            {viewMode === 'pipeline' && (
              <svg className="absolute inset-0 pointer-events-none w-full h-full overflow-visible">
                <defs>
                <marker id="arrow-lime" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="4" markerHeight="4" orient="auto-start-reverse">
                  <path d="M 0 0 L 10 5 L 0 10 z" fill="#DEF767" />
                </marker>
              </defs>

              {strokes.map((stroke) => (
                <motion.polyline 
                  key={`stroke-${stroke.id}`} 
                  points={stroke.points.map(p => `${p.x},${p.y}`).join(' ')} 
                  stroke="#A259FF" strokeWidth="24" strokeLinecap="round" strokeLinejoin="round" 
                  fill="none" 
                  initial={{ opacity: 0.25 }}
                  animate={{ opacity: 0 }}
                  transition={{ duration: 0.5, delay: 2.0 }}
                  style={{ filter: 'blur(3px)' }} 
                />
              ))}
              {currentStroke && (
                <polyline 
                  points={currentStroke.map(p => `${p.x},${p.y}`).join(' ')} 
                  stroke="#A259FF" strokeWidth="24" strokeLinecap="round" strokeLinejoin="round" 
                  fill="none" opacity="0.25" style={{ filter: 'blur(3px)' }} 
                />
              )}

              {bundledEdges.map((edge, idx) => {
                const fromLayout = layout[edge.from];
                const toLayout = layout[edge.to];
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
            </svg>
            )}

            {/* Builder Canvas */}
            {viewMode === 'builder' && (
               <BuilderCanvas activeTool={activeTool} setActiveTool={setActiveTool} getCanvasCoords={getCanvasCoords} />
            )}

            {/* Agent Nodes */}
            {viewMode === 'pipeline' && Object.values(layout).map((node) => {
              const animState = useWorkflowStore.getState().animationState;
              const isVisible = animState.activeNodes.includes(node.id) || graphStatus === 'ready' || graphStatus === 'completed' || graphStatus === 'running'; 
              
              // Only slightly fade nodes that are further out in future phases
              const parsePhaseIdx = WORKFLOW_PHASES.findIndex(p => p.id === node.id.split('::')[0]);
              const isPendingPhase = parsePhaseIdx > currentPhaseIndex;
              
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
            {viewMode === 'pipeline' && stickyNotes.map(note => {
              const noteColor = note.color || '#A259FF';
              const noteW = note.width || 220;
              const noteH = note.height || 160;

              return (
              <div key={`sticky-${note.id}`} 
                className={`absolute sticky-note p-3 rounded-2xl z-20 transition-all font-secondary flex flex-col group shadow-2xl cursor-pointer ${
                  selectedNodeId === `sticky-${note.id}` ? 'border' : 'border border-transparent'
                }`}
                onMouseDown={(e) => {
                  if (e.target.classList.contains('resize-handle')) {
                    e.stopPropagation();
                    setResizingAppElement({ type: 'sticky', id: note.id, elemX: note.x, elemY: note.y });
                    return;
                  }
                  if (activeTool === 'cursor') {
                    e.stopPropagation();
                    selectNode(`sticky-${note.id}`);
                    const coords = getCanvasCoords(e.clientX, e.clientY);
                    setDraggingAppElement({ type: 'sticky', id: note.id, startX: note.x, startY: note.y, startMouseX: coords.x, startMouseY: coords.y });
                  }
                }}
                style={{
                  left: note.x, top: note.y, width: noteW, height: noteH,
                  background: 'rgba(26, 26, 46, 0.75)',
                  borderColor: selectedNodeId === `sticky-${note.id}` ? noteColor : `${noteColor}40`,
                  backdropFilter: 'blur(16px)',
                  pointerEvents: activeTool === 'cursor' ? 'auto' : 'none',
                  boxShadow: selectedNodeId === `sticky-${note.id}` ? `0 0 30px ${noteColor}40` : `0 10px 30px rgba(0,0,0,0.5)`,
                }}>
                <div className="w-full h-1.5 rounded-t-xl absolute top-0 left-0" style={{ background: `linear-gradient(to right, ${noteColor}, ${noteColor}80)` }} />
                
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setStickyNotes(prev => prev.filter(n => n.id !== note.id));
                    if (selectedNodeId === `sticky-${note.id}`) {
                      useWorkflowStore.getState().selectNode(null);
                    }
                  }}
                  className="absolute top-3 right-3 p-1.5 rounded-lg bg-black/60 text-slate-400 hover:text-white hover:bg-[#ff4b4b] transition-all opacity-0 group-hover:opacity-100 z-50 shadow-md"
                >
                  <Trash2 size={14} />
                </button>

                <textarea 
                  className="flex-1 w-full mt-3 bg-transparent outline-none resize-none text-slate-200 text-sm placeholder-slate-500 custom-scrollbar-neon"
                  placeholder="Note insights here..."
                  value={note.text}
                  onMouseDown={e => e.stopPropagation()}
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
            {viewMode === 'pipeline' && textLabels.map(label => (
              <div
                key={`label-${label.id}`}
                className="absolute z-20 pointer-events-auto group"
                style={{ left: label.x - 75, top: label.y - 15 }}
              >
                <input
                  className="bg-transparent outline-none text-white text-sm font-bold w-[150px] placeholder-slate-500 border-b border-dashed border-white/20 focus:border-[#46B1FF]/50 pb-1 transition-colors"
                  placeholder="Type label..."
                  value={label.text}
                  onMouseDown={e => e.stopPropagation()}
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
            ))}
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
      <FlowFooter flowStatus={graphStatus === 'loading' ? 'running' : 'idle'} logs={[]} completedCount={0} totalCount={16} />

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
    </div>
  );
};

export default App;
