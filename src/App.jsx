import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Sparkles, AlertTriangle, Play, RefreshCw } from 'lucide-react';
import confetti from 'canvas-confetti';

// Core Schema & Logic
import { WORKFLOW_PHASES, EDGES, TOOL_REGISTRY } from './data/schema';
import { validateGraph } from './lib/graphValidator';
import { computeLayout } from './lib/layoutEngine';
import { computeEdgePath, bundleEdges } from './lib/edgeRouter';
import { useWorkflowStore, selectActiveNodeId, selectRevealedPhases } from './lib/store';

// Components
import FlowHeader from './components/FlowHeader';
import FlowFooter from './components/FlowFooter';
import FlowControls from './components/FlowControls';
import NodeContainer from './components/NodeContainer';
import SettingsModal from './components/SettingsModal';

const App = () => {
  const [initError, setInitError] = useState(null);
  
  // Zustand State
  const graphStatus = useWorkflowStore(state => state.graphStatus);
  const setGraphStatus = useWorkflowStore(state => state.setGraphStatus);
  const selectedNodeId = useWorkflowStore(selectActiveNodeId);
  const selectNode = useWorkflowStore(state => state.selectNode);
  const revealedPhases = useWorkflowStore(selectRevealedPhases);
  const nodeStates = useWorkflowStore(state => state.nodeStates);
  
  const [phaseOverlay, setPhaseOverlay] = useState(null);

  // Canvas Viewport logic remains standard
  const [camera, setCamera] = useState({ x: 100, y: 60, zoom: 0.55 });
  const [isPanning, setIsPanning] = useState(false);
  const canvasRef = useRef(null);
  const lastMousePos = useRef({ x: 0, y: 0 });

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

  // Compute Layout (Memoized so it doesn't recalculate unless dimensions drop)
  const layout = useMemo(() => {
    if (graphStatus === 'error' || graphStatus === 'idle') return null;
    return computeLayout('desktop', 2000, 1000); // fixed virtual boundaries for initial
  }, [graphStatus]);

  // Bundle Edges (Memoized)
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
        setCamera((prev) => ({
          ...prev,
          zoom: Math.min(Math.max(prev.zoom - e.deltaY * 0.001, 0.15), 2),
        }));
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

  const handleMouseDown = useCallback((e) => {
    if (e.button === 1 || (e.button === 0 && e.altKey) || e.target.id === 'canvas-bg') {
      setIsPanning(true);
      lastMousePos.current = { x: e.clientX, y: e.clientY };
    }
  }, []);

  const handleMouseMove = useCallback(
    (e) => {
      if (canvasRef.current) {
        const rect = canvasRef.current.getBoundingClientRect();
        canvasRef.current.style.setProperty('--mouse-x', `${e.clientX - rect.left}px`);
        canvasRef.current.style.setProperty('--mouse-y', `${e.clientY - rect.top}px`);
      }
      if (!isPanning) return;
      const dx = e.clientX - lastMousePos.current.x;
      const dy = e.clientY - lastMousePos.current.y;
      setCamera((prev) => ({ ...prev, x: prev.x + dx, y: prev.y + dy }));
      lastMousePos.current = { x: e.clientX, y: e.clientY };
    },
    [isPanning]
  );

  const handleMouseUp = useCallback(() => setIsPanning(false), []);

  const runFlow = useCallback(async () => {
    if (!layout || graphStatus === 'running') return;

    const store = useWorkflowStore.getState();
    store.setGraphStatus('running');

    // Reset execution
    const nodes = Object.values(layout).map(n => n.id);
    store.resetExecution(nodes);
    store.setGraphStatus('running'); // keep it running post-reset
    
    for (let pIdx = 0; pIdx < WORKFLOW_PHASES.length; pIdx++) {
      const phase = WORKFLOW_PHASES[pIdx];
      const nextPhase = WORKFLOW_PHASES[pIdx + 1];
      
      const phaseNodes = phase.categories.map(c => `${phase.id}::${c}`);
      
      // Reveal the phase's nodes through animation state
      const currentActive = useWorkflowStore.getState().animationState.activeNodes;
      store.setAnimationState({ activeNodes: [...currentActive, ...phaseNodes] });
      
      // Simulate running them (fade appealing)
      for (const nId of phaseNodes) {
        store.setNodeState(nId, 'running');
        await new Promise(r => setTimeout(r, 600)); // Delay for scanning effect
        store.setNodeState(nId, 'completed');
      }
      
      if (nextPhase) {
        setPhaseOverlay({ phase: pIdx + 1, phaseName: phase.label, nextPhaseName: nextPhase.label });
        await new Promise(r => setTimeout(r, 2000));
        setPhaseOverlay(null);
      }
    }
    
    useWorkflowStore.getState().setGraphStatus('completed');

    // CONFETTI EXPLOSION!
    const duration = 2000;
    const end = Date.now() + duration;

    (function frame() {
      confetti({
        particleCount: 8,
        angle: 60,
        spread: 70,
        origin: { x: 0 },
        colors: ['#46B1FF', '#CEA3FF', '#DEF767']
      });
      confetti({
        particleCount: 8,
        angle: 120,
        spread: 70,
        origin: { x: 1 },
        colors: ['#A259FF', '#DEF767', '#ffffff']
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    }());

  }, [layout, graphStatus]);

  if (graphStatus === 'error') {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-[#0a0a10] text-[#ff6b6b]">
        <AlertTriangle size={64} className="mb-4" />
        <h1 className="text-2xl font-bold tracking-widest mb-2 font-display">GRAPH VALIDATION FAILED</h1>
        <p className="text-slate-400 font-mono text-sm">{initError}</p>
      </div>
    )
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

      {/* Floating Control specifically for running the flow */}
      <div className="absolute top-[180px] left-6 z-40 bg-[#0c0c14] border border-[#2e2e42] p-1.5 rounded-xl flex shadow-2xl">
         <button 
           onClick={runFlow}
           disabled={graphStatus === 'running'}
           className={`flex items-center gap-2 text-xs font-bold py-3 px-6 rounded-lg transition-colors border shadow-inner ${graphStatus === 'completed' ? 'bg-[#DEF767] hover:bg-[#DEF767]/80 text-black border-[#DEF767]/50' : 'bg-[#1a1a24] hover:bg-[#A259FF] text-white border-white/5'}`}
         >
           {graphStatus === 'completed' ? <><RefreshCw size={14} /> REBOOT SEQUENCE</> : <><Play size={14} /> EXECUTABLE: RUN</>}
         </button>
      </div>
      
      <FlowControls setCamera={setCamera} />

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
            {/* ── Background Phase Labels ── */}
            {WORKFLOW_PHASES.map((p, idx) => {
              // Find first node of phase to get X position. Hacky but effective for background string.
              const firstNodeId = `${p.id}::${p.categories[0]}`;
              const firstNodeLayout = layout[firstNodeId];
              if (!firstNodeLayout) return null;

              return (
                <div
                  key={idx}
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
              );
            })}

            {/* ── Edges / Wires ── */}
            <svg className="absolute inset-0 pointer-events-none w-full h-full overflow-visible">
              <defs>
                <marker id="arrow-lime" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="4" markerHeight="4" orient="auto-start-reverse">
                  <path d="M 0 0 L 10 5 L 0 10 z" fill="#DEF767" />
                </marker>
              </defs>

              {bundledEdges.map((edge, idx) => {
                const fromLayout = layout[edge.from];
                const toLayout = layout[edge.to];
                if (!fromLayout || !toLayout) return null;

                // Port Anchor Math based on standard NodeContainer sizes
                const fromAnchor = { x: fromLayout.x + 140, y: fromLayout.y + 70 }; // Right center
                const toAnchor = { x: toLayout.x, y: toLayout.y + 70 }; // Left center

                const pathString = computeEdgePath(fromAnchor, toAnchor, edge.routeConfig);
                
                // An edge is active if the node it originates from has RUN or COMPLETED.
                // This triggers the SVG drawing animation sequence.
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

            {/* ── Agent Nodes ── */}
            {Object.values(layout).map((node) => {
              const animState = useWorkflowStore.getState().animationState;
              const isVisible = animState.activeNodes.includes(node.id) || graphStatus === 'ready' || graphStatus === 'completed'; 
              return (
                <NodeContainer
                  key={node.id}
                  node={node}
                  state={nodeStates[node.id] || 'idle'}
                  onClick={() => selectNode(node.id)}
                  isVisible={isVisible}
                />
              )
            })}
          </div>
        </div>

        {/* ── Intelligence Layer Side Panel (Floating Glassmorphism) ── */}
        <div 
          className={`absolute right-0 top-0 h-full w-[360px] bg-[#0c0c14]/40 backdrop-blur-2xl border-l border-white/5 p-6 shadow-2xl transition-transform duration-500 z-50 ${selectedNodeId ? 'translate-x-0' : 'translate-x-full'}`}
        >
           <div className="flex justify-between items-center mb-6">
             <h2 className="font-bold text-xs uppercase tracking-widest text-slate-400">Intelligence Layer</h2>
             <button onClick={() => selectNode(null)} className="text-slate-500 hover:text-white transition-colors">✕</button>
           </div>
           
           {selectedNodeId ? (
              <div className="animate-fade-in">
                <h3 className="text-xl font-black tracking-wider text-slate-100 uppercase font-display">{layout[selectedNodeId]?.category.name}</h3>
                <p className="text-sm text-slate-400 mt-3 leading-relaxed">{layout[selectedNodeId]?.category.description}</p>
                
                <div className="mt-8">
                  <span className="text-[10px] text-[#A259FF] uppercase font-bold tracking-widest">Recommended Tools</span>
                  <div className="flex flex-col gap-3 mt-4">
                     {layout[selectedNodeId]?.category.tools.map(tid => {
                       const toolInfo = TOOL_REGISTRY[tid];
                       return (
                         <div key={tid} className="bg-white/[0.03] hover:bg-white/[0.05] transition-colors border border-white/[0.05] p-4 rounded-xl cursor-pointer">
                            <div className="flex justify-between items-start mb-1">
                              <strong className="text-slate-200 text-sm tracking-wide">{toolInfo?.name || tid.toUpperCase()}</strong>
                              {(toolInfo?.pricing === 'paid' || toolInfo?.pricing === 'freemium') && (
                                <span className="text-[9px] bg-white/10 text-slate-300 px-2 py-0.5 rounded-full uppercase tracking-wider">{toolInfo.pricing}</span>
                              )}
                            </div>
                            <p className="text-xs text-slate-500 line-clamp-2 mt-2">{toolInfo?.description}</p>
                         </div>
                       )
                     })}
                  </div>
                </div>
              </div>
           ) : null}
        </div>
      </div>
      <FlowFooter flowStatus={graphStatus === 'loading' ? 'running' : 'idle'} logs={[]} completedCount={0} totalCount={16} />
    </div>
  );

};

export default App;
