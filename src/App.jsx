import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Sparkles } from 'lucide-react';

// Components
import FlowHeader from './components/FlowHeader';
import FlowFooter from './components/FlowFooter';
import FlowControls from './components/FlowControls';
import NodeContainer from './components/NodeContainer';
import NodePanel from './components/NodePanel';
import SettingsModal from './components/SettingsModal';

// Data & Logic
import {
  AGENTS,
  WIRE_CONNECTIONS,
  EXECUTION_ORDER,
  PHASE_LABELS,
  NODE_WIDTH,
  NODE_HEIGHT,
  getPortPosition,
  getWirePath,
} from './lib/agents';
import { callLLM } from './lib/llm';

// ── Wire rendering helper ───────────────────────────────────────────
function getWireStyle(fromId, toId, nodeStates) {
  const from = nodeStates[fromId];
  const to = nodeStates[toId];

  if (to === 'running') {
    return { stroke: '#A259FF', opacity: 1, glow: true, animate: true };
  }
  if (from === 'completed' && to === 'completed') {
    return { stroke: '#DEF767', opacity: 0.4, glow: false, animate: false };
  }
  if (from === 'completed' || from === 'running') {
    return { stroke: '#A259FF', opacity: 0.25, glow: false, animate: false };
  }
  // idle — visible thin grey border
  return { stroke: '#46B1FF', opacity: 0.35, glow: false, animate: false };
}

// ── Initial node state factory ──────────────────────────────────────
const initStates = () => Object.fromEntries(AGENTS.map((a) => [a.id, 'idle']));

// ═════════════════════════════════════════════════════════════════════
//  APP COMPONENT
// ═════════════════════════════════════════════════════════════════════
const App = () => {
  // ── Canvas state ────────────────────────────────────────────────
  const [camera, setCamera] = useState({ x: 100, y: 60, zoom: 0.55 });
  const [isPanning, setIsPanning] = useState(false);
  const canvasRef = useRef(null);
  const lastMousePos = useRef({ x: 0, y: 0 });

  // ── Flow state ──────────────────────────────────────────────────
  const [nodeStates, setNodeStates] = useState(initStates);
  const [flowStatus, setFlowStatus] = useState('idle'); // idle | running | completed
  const [prompt, setPrompt] = useState('');
  const [nodeTasks, setNodeTasks] = useState({}); // per-node task text
  const [nodeResults, setNodeResults] = useState({}); // per-node { content, ui }
  const [workflowResult, setWorkflowResult] = useState(null); // active preview result
  const [resultSource, setResultSource] = useState(''); // which agent produced it
  const [logs, setLogs] = useState([
    { id: 1, text: 'System standing by…', type: 'info' },
  ]);

  // ── UI state ────────────────────────────────────────────────────
  const [selectedNode, setSelectedNode] = useState(null);
  const [showSettings, setShowSettings] = useState(false);

  // ── Canvas: Wheel zoom + scroll pan ─────────────────────────────
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

  // ── Canvas: Mouse panning ───────────────────────────────────────
  const handleMouseDown = useCallback((e) => {
    if (e.button === 1 || (e.button === 0 && e.altKey) || e.target.id === 'canvas-bg') {
      setIsPanning(true);
      lastMousePos.current = { x: e.clientX, y: e.clientY };
    }
  }, []);

  const handleMouseMove = useCallback(
    (e) => {
      // Glow logic: Track absolute mouse position on the container
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

  // ═════════════════════════════════════════════════════════════════
  //  AGENT EXECUTION
  // ═════════════════════════════════════════════════════════════════

  /** Build a combined prompt with global task + all node-specific tasks + previous results */
  const buildSynthesisPrompt = useCallback(() => {
    let p = prompt || 'Create a modern, premium SaaS product landing page';

    // Append node-specific tasks
    const taskEntries = Object.entries(nodeTasks).filter(([, v]) => v?.trim());
    if (taskEntries.length > 0) {
      p += '\n\n--- Agent-specific context ---\n';
      taskEntries.forEach(([nodeId, task]) => {
        const agent = AGENTS.find((a) => a.id === nodeId);
        if (agent) p += `[${agent.phaseName}/${agent.name}]: ${task}\n`;
      });
    }

    // Append any prior agent results (summaries)
    const resultEntries = Object.entries(nodeResults).filter(([, v]) => v?.content);
    if (resultEntries.length > 0) {
      p += '\n\n--- Previous agent outputs ---\n';
      resultEntries.forEach(([nodeId, result]) => {
        const agent = AGENTS.find((a) => a.id === nodeId);
        if (agent) p += `[${agent.name}]: ${result.content.substring(0, 300)}\n`;
      });
    }

    return p;
  }, [prompt, nodeTasks, nodeResults]);

  /** Execute a single agent — used by NodePanel "Execute Agent" button */
  const runSingleAgent = useCallback(
    async (agent) => {
      const task = nodeTasks[agent.id]?.trim() || prompt || 'Create a premium SaaS landing page';

      // Set running
      setNodeStates((prev) => ({ ...prev, [agent.id]: 'running' }));
      setLogs((prev) => [
        ...prev,
        { id: Date.now(), text: `[${agent.name}] Sending to LLM…`, type: 'info' },
      ]);

      try {
        const result = await callLLM(task, agent.systemPrompt, agent.name);

        // Store per-node result
        setNodeResults((prev) => ({ ...prev, [agent.id]: result }));

        // Also set as active preview
        setWorkflowResult(result);
        setResultSource(agent.name);

        setNodeStates((prev) => ({ ...prev, [agent.id]: 'completed' }));
        setLogs((prev) => [
          ...prev,
          { id: Date.now(), text: `[${agent.name}] ✓ Output rendered`, type: 'success' },
        ]);
      } catch (err) {
        console.error(err);
        setNodeStates((prev) => ({ ...prev, [agent.id]: 'completed' }));
        setLogs((prev) => [
          ...prev,
          { id: Date.now(), text: `[${agent.name}] ✗ ${err.message}`, type: 'error' },
        ]);
      }
    },
    [nodeTasks, prompt]
  );

  /** Sequential full-flow execution through all 16 agents */
  const runFlow = useCallback(async () => {
    if (flowStatus === 'running') return;

    setFlowStatus('running');
    setWorkflowResult(null);
    setResultSource('');
    setNodeStates(initStates());
    setNodeResults({});
    setLogs([
      { id: Date.now(), text: 'Initializing Mandelbrot Double Diamond workflow…', type: 'info' },
    ]);

    for (let i = 0; i < EXECUTION_ORDER.length; i++) {
      const step = EXECUTION_ORDER[i];
      const stepAgents = step
        .map((id) => AGENTS.find((a) => a.id === id))
        .filter(Boolean);

      // ── Set nodes to RUNNING ──
      setNodeStates((prev) => {
        const next = { ...prev };
        step.forEach((id) => (next[id] = 'running'));
        return next;
      });

      stepAgents.forEach((agent) => {
        setLogs((prev) => [
          ...prev,
          {
            id: Date.now() + Math.random(),
            text: `[${agent.phaseName}] ${agent.name} activated`,
            type: 'process',
          },
        ]);
      });

      // ── Simulate processing for non-synthesis nodes ──
      await new Promise((r) => setTimeout(r, 600 + Math.random() * 500));

      // ── LLM CALL at the visualDesign step ──
      if (step.includes('visualDesign')) {
        try {
          setLogs((prev) => [
            ...prev,
            { id: Date.now(), text: 'Connecting to LLM for synthesis…', type: 'info' },
          ]);

          const vdAgent = AGENTS.find((a) => a.id === 'visualDesign');
          const synthPrompt = buildSynthesisPrompt();
          const result = await callLLM(synthPrompt, vdAgent.systemPrompt, vdAgent.name);

          setNodeResults((prev) => ({ ...prev, visualDesign: result }));
          setWorkflowResult(result);
          setResultSource(vdAgent.name);

          setLogs((prev) => [
            ...prev,
            { id: Date.now(), text: `Synthesis complete — rendering output`, type: 'success' },
          ]);
        } catch (err) {
          console.error(err);
          setLogs((prev) => [
            ...prev,
            { id: Date.now(), text: `Synthesis failed: ${err.message}`, type: 'error' },
          ]);
        }
      }

      // ── Set nodes to COMPLETED ──
      setNodeStates((prev) => {
        const next = { ...prev };
        step.forEach((id) => (next[id] = 'completed'));
        return next;
      });

      stepAgents.forEach((agent) => {
        setLogs((prev) => [
          ...prev,
          {
            id: Date.now() + Math.random(),
            text: `[${agent.phaseName}] ${agent.name} ✓`,
            type: 'success',
          },
        ]);
      });
    }

    setFlowStatus('completed');
    setLogs((prev) => [
      ...prev,
      { id: Date.now(), text: '🚀 Mandelbrot workflow complete — System LIVE', type: 'success' },
    ]);
  }, [flowStatus, buildSynthesisPrompt]);

  // ── Computed values ─────────────────────────────────────────────
  const completedCount = Object.values(nodeStates).filter((s) => s === 'completed').length;

  // ═════════════════════════════════════════════════════════════════
  //  RENDER
  // ═════════════════════════════════════════════════════════════════
  return (
    <div className="flex flex-col h-screen w-full overflow-hidden select-none bg-black text-slate-200">
      <FlowHeader
        prompt={prompt}
        setPrompt={setPrompt}
        runFlow={runFlow}
        flowStatus={flowStatus}
        onOpenSettings={() => setShowSettings(true)}
      />

      {/* ═══ Infinite Canvas ═══ */}
      <div
        ref={canvasRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        className="flex-1 relative overflow-hidden"
        style={{ cursor: isPanning ? 'grabbing' : 'grab' }}
      >
        {/* Dot Grid */}
        <div
          id="canvas-bg"
          className="absolute inset-0 canvas-grid"
          style={{
            backgroundSize: `${40 * camera.zoom}px ${40 * camera.zoom}px`,
            backgroundPosition: `${camera.x}px ${camera.y}px`,
          }}
        />

        {/* Transformed Layer */}
        <div
          style={{
            transform: `translate(${camera.x}px, ${camera.y}px) scale(${camera.zoom})`,
            transformOrigin: '0 0',
          }}
          className="absolute pointer-events-none w-0 h-0"
        >
          {/* ── SVG Wires ── */}
          <svg
            className="absolute pointer-events-none"
            style={{ left: -200, top: -200, width: 3400, height: 1200, overflow: 'visible' }}
          >
            <defs>
              <filter id="wire-glow">
                <feGaussianBlur stdDeviation="4" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
              <marker
                id="arrow-purple"
                viewBox="0 0 10 10"
                refX="5"
                refY="5"
                markerWidth="4"
                markerHeight="4"
                orient="auto-start-reverse"
              >
                <path d="M 0 0 L 10 5 L 0 10 z" fill="#A259FF" />
              </marker>
              <marker
                id="arrow-lime"
                viewBox="0 0 10 10"
                refX="5"
                refY="5"
                markerWidth="4"
                markerHeight="4"
                orient="auto-start-reverse"
              >
                <path d="M 0 0 L 10 5 L 0 10 z" fill="#DEF767" />
              </marker>
              <marker
                id="arrow-blue"
                viewBox="0 0 10 10"
                refX="5"
                refY="5"
                markerWidth="4"
                markerHeight="4"
                orient="auto-start-reverse"
              >
                <path d="M 0 0 L 10 5 L 0 10 z" fill="#46B1FF" />
              </marker>
            </defs>

            {WIRE_CONNECTIONS.map((wire, idx) => {
              const fromAgent = AGENTS.find((a) => a.id === wire.from);
              const toAgent = AGENTS.find((a) => a.id === wire.to);
              if (!fromAgent || !toAgent) return null;

              const fromPos = getPortPosition(fromAgent, wire.fromPort);
              const toPos = getPortPosition(toAgent, wire.toPort);
              const path = getWirePath(fromPos, toPos, wire.fromPort, wire.toPort);
              const style = getWireStyle(wire.from, wire.to, nodeStates);

              return (
                <React.Fragment key={idx}>
                  {/* Glow layer */}
                  {style.glow && (
                    <path
                      d={path}
                      stroke="#A259FF"
                      strokeWidth="8"
                      fill="none"
                      opacity={0.12}
                      filter="url(#wire-glow)"
                    />
                  )}
                  {/* Main wire */}
                  <path
                    d={path}
                    stroke={style.stroke}
                    strokeWidth="1.5"
                    fill="none"
                    opacity={style.opacity}
                    className={style.animate ? 'wire-flow' : ''}
                    markerEnd={
                      style.stroke === '#DEF767'
                        ? 'url(#arrow-lime)'
                        : style.stroke === '#A259FF'
                        ? 'url(#arrow-purple)'
                        : 'url(#arrow-blue)'
                    }
                  />
                  {/* Animated particle along active wires */}
                  {style.animate && (
                    <circle r="3.5" fill="#A259FF" filter="url(#wire-glow)">
                      <animateMotion dur="1s" repeatCount="indefinite" path={path} />
                    </circle>
                  )}
                </React.Fragment>
              );
            })}

            {/* Bridge wire to preview panel */}
            {workflowResult && (() => {
              const bridgePath = `M ${2090 + NODE_WIDTH},${540 + NODE_HEIGHT / 2} C ${2090 + NODE_WIDTH + 120},${540 + NODE_HEIGHT / 2} ${2520},${320} ${2550},${320}`;
              return (
                <path
                  d={bridgePath}
                  stroke="#DEF767"
                  strokeWidth="1.5"
                  fill="none"
                  opacity="0.3"
                  markerEnd="url(#arrow-lime)"
                />
              );
            })()}
          </svg>

          {/* ── Phase Labels ── */}
          {PHASE_LABELS.map((label) => {
            const phaseNodes = AGENTS.filter((a) => a.phase === label.phase);
            const anyRunning = phaseNodes.some((a) => nodeStates[a.id] === 'running');
            const allCompleted = phaseNodes.every((a) => nodeStates[a.id] === 'completed');

            return (
              <div
                key={label.name}
                className="absolute pointer-events-none text-center"
                style={{ left: label.x, top: label.y, transform: 'translateX(-50%)' }}
              >
                <div
                  className={`text-[11px] font-bold tracking-[0.4em] phase-label ${
                    allCompleted
                      ? 'text-[#DEF767]/60'
                      : anyRunning
                      ? 'text-[#A259FF]'
                      : 'text-slate-600/50'
                  }`}
                >
                  {label.name}
                </div>
                <div className="text-[8px] tracking-[0.2em] text-slate-700/40 mt-0.5 uppercase">
                  {label.subtitle}
                </div>
              </div>
            );
          })}

          {/* ── Agent Nodes ── */}
          {AGENTS.map((agent) => (
            <NodeContainer
              key={agent.id}
              agent={agent}
              state={nodeStates[agent.id]}
              onClick={() => setSelectedNode(agent)}
            />
          ))}

          {/* ═══════════════════════════════════════════════════════ */}
          {/*  VISUAL OUTPUT PREVIEW PANEL (on canvas)               */}
          {/* ═══════════════════════════════════════════════════════ */}
          <div
            className="absolute pointer-events-auto glass-node rounded-xl"
            style={{
              left: 2550,
              top: 80,
              width: 420,
              height: 520,
              border: workflowResult
                ? '1px solid rgba(162,89,255,0.2)'
                : '1px solid rgba(255,255,255,0.04)',
              boxShadow: workflowResult
                ? '0 0 60px rgba(162,89,255,0.08), 0 8px 40px rgba(0,0,0,0.8)'
                : '0 8px 32px rgba(0,0,0,0.6)',
            }}
          >
            {/* Preview Header */}
            <div
              className="flex items-center justify-between px-4 py-3"
              style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}
            >
              <div className="flex items-center gap-2">
                <Sparkles size={13} className="text-[#A259FF]" />
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#CEA3FF] font-display">
                  Visual Output
                </span>
              </div>
              {workflowResult && (
                <div className="flex items-center gap-2">
                  <span className="text-[8px] font-mono text-slate-500">
                    via {resultSource}
                  </span>
                  <div className="flex gap-1">
                    <div className="w-2 h-2 rounded-full bg-[#FF6A6A]/50" />
                    <div className="w-2 h-2 rounded-full bg-[#DEF767]/50" />
                    <div className="w-2 h-2 rounded-full bg-[#46B1FF]/50" />
                  </div>
                </div>
              )}
            </div>

            {/* Preview Body — dangerouslySetInnerHTML for LLM-generated UI */}
            {workflowResult ? (
              <div className="flex flex-col" style={{ height: 'calc(100% - 44px)' }}>
                <div className="flex-1 overflow-y-auto p-4 preview-frame">
                  <div dangerouslySetInnerHTML={{ __html: workflowResult.ui }} />
                </div>

                {/* Content Summary Footer */}
                <div
                  className="px-4 py-3 overflow-y-auto"
                  style={{
                    borderTop: '1px solid rgba(255,255,255,0.04)',
                    maxHeight: 100,
                  }}
                >
                  <span className="text-[8px] font-bold uppercase tracking-widest text-slate-600 block mb-1">
                    Content
                  </span>
                  <p className="text-[10px] text-slate-500 leading-relaxed">
                    {workflowResult.content?.substring(0, 250)}
                    {workflowResult.content?.length > 250 && '…'}
                  </p>
                </div>
              </div>
            ) : (
              <div
                className="flex flex-col items-center justify-center gap-3 opacity-20"
                style={{ height: 'calc(100% - 44px)' }}
              >
                <Sparkles size={28} className="animate-pulse" />
                <span className="text-[10px] uppercase font-bold tracking-[0.2em]">
                  Awaiting Synthesis
                </span>
                <span className="text-[8px] text-slate-600 max-w-[200px] text-center">
                  Click "Run Flow" or execute an individual agent
                </span>
              </div>
            )}

            {/* Left connection port */}
            <div
              className="absolute w-3 h-3 rounded-full flex items-center justify-center"
              style={{
                left: -6,
                top: '50%',
                transform: 'translateY(-50%)',
                background: '#000000',
                border: `1.5px solid ${workflowResult ? '#DEF767' : '#1e293b'}`,
              }}
            >
              <div
                className="w-1 h-1 rounded-full"
                style={{ background: workflowResult ? '#DEF767' : '#334155' }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* ═══ Footer ═══ */}
      <FlowFooter
        flowStatus={flowStatus}
        logs={logs}
        completedCount={completedCount}
        totalCount={AGENTS.length}
      />

      {/* ═══ Overlays ═══ */}
      <FlowControls setCamera={setCamera} />

      {/* Node Panel — opens when a node is clicked */}
      {selectedNode && (
        <NodePanel
          agent={selectedNode}
          state={nodeStates[selectedNode.id]}
          task={nodeTasks[selectedNode.id] || ''}
          onTaskChange={(val) =>
            setNodeTasks((prev) => ({ ...prev, [selectedNode.id]: val }))
          }
          onRunAgent={runSingleAgent}
          nodeResult={nodeResults[selectedNode.id] || null}
          isFlowRunning={flowStatus === 'running'}
          onClose={() => setSelectedNode(null)}
        />
      )}

      <SettingsModal isOpen={showSettings} onClose={() => setShowSettings(false)} />
    </div>
  );
};

export default App;
