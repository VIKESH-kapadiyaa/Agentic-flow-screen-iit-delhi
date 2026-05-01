import React, { useState, useEffect } from 'react';
import { useBuilderStore } from '../lib/builderStore';
import AgentBlockNode from './AgentBlockNode';
import WebhookBlockNode from './WebhookBlockNode';
import { Trash2 } from 'lucide-react';

interface Coords { x: number; y: number; }

interface DraggingElement {
  type: 'block' | 'sticky';
  id: string;
  startX: number;
  startY: number;
  startMouseX: number;
  startMouseY: number;
}

interface WiringState {
  sourceId: string;
  sourcePort: string | null;
  startPos: Coords;
  currentMousePos: Coords;
}

interface ResizingElement {
  type: 'block' | 'sticky';
  id: string;
  elemX: number;
  elemY: number;
}

interface BuilderCanvasProps {
  activeTool: string;
  setActiveTool: (tool: string) => void;
  getCanvasCoords: (clientX: number, clientY: number) => Coords;
}

const BuilderCanvas = ({ activeTool, setActiveTool, getCanvasCoords }: BuilderCanvasProps) => {
  const { 
    blocks, connections, updateBlock, selectedElementId, 
    setSelectedElementId, connectBlocks,
    stickyNotes, addStickyNote, updateStickyNote, deleteStickyNote,
    textLabels, addTextLabel, updateTextLabel, deleteTextLabel,
    nodeStatus
  } = useBuilderStore();

  const [draggingElement, setDraggingElement] = useState<DraggingElement | null>(null);
  const [wiringState, setWiringState] = useState<WiringState | null>(null);
  const [resizingElement, setResizingElement] = useState<ResizingElement | null>(null);

  // Dragging + wiring + resizing logic
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (draggingElement) {
        const coords = getCanvasCoords(e.clientX, e.clientY);
        const dx = coords.x - draggingElement.startMouseX;
        const dy = coords.y - draggingElement.startMouseY;
        const newPos = { x: draggingElement.startX + dx, y: draggingElement.startY + dy };
        
        if (draggingElement.type === 'block') {
          updateBlock(draggingElement.id, { position: newPos });
        } else if (draggingElement.type === 'sticky') {
          updateStickyNote(draggingElement.id, { position: newPos });
        }
      }

      if (wiringState) {
        const coords = getCanvasCoords(e.clientX, e.clientY);
        setWiringState(prev => prev ? { ...prev, currentMousePos: coords } : null);
      }

      if (resizingElement) {
        const coords = getCanvasCoords(e.clientX, e.clientY);
        const newWidth = Math.max(120, coords.x - resizingElement.elemX);
        const newHeight = Math.max(120, coords.y - resizingElement.elemY);
        
        if (resizingElement.type === 'block') {
          updateBlock(resizingElement.id, { size: { width: Math.max(180, newWidth), height: newHeight } });
        } else if (resizingElement.type === 'sticky') {
          updateStickyNote(resizingElement.id, { size: { width: newWidth, height: newHeight } });
        }
      }
    };

    const handleMouseUp = (e: MouseEvent) => {
      if (draggingElement) setDraggingElement(null);
      if (resizingElement) setResizingElement(null);
      
      if (wiringState) {
        const target = document.elementFromPoint(e.clientX, e.clientY);
        if (target && target.classList.contains('connection-port')) {
          const targetId = target.getAttribute('data-port-id');
          const targetPort = target.getAttribute('data-port-position');
          
          if (targetId && targetId !== wiringState.sourceId && wiringState.sourcePort && targetPort) {
            connectBlocks(wiringState.sourceId, targetId, wiringState.sourcePort, targetPort);
          }
        }
        setWiringState(null);
      }
    };

    if (draggingElement || wiringState || resizingElement) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [draggingElement, wiringState, resizingElement, getCanvasCoords, updateBlock, connectBlocks, updateStickyNote]);

  const handleBlockMouseDown = (e: React.MouseEvent, block: any) => {
    const target = e.target as HTMLElement;
    if (target.classList.contains('resize-handle')) {
      e.stopPropagation();
      setResizingElement({
        type: 'block',
        id: block.id,
        elemX: block.position.x,
        elemY: block.position.y
      });
      return;
    }

    // Check if clicked port
    if (target.classList.contains('connection-port')) {
       e.stopPropagation();
       const portPosition = target.getAttribute('data-port-position');
       const blockRect = target.getBoundingClientRect();
       const portCenterX = blockRect.left + blockRect.width / 2;
       const portCenterY = blockRect.top + blockRect.height / 2;
       const canvasStartCoords = getCanvasCoords(portCenterX, portCenterY);
       const coords = getCanvasCoords(e.clientX, e.clientY);
       
       setWiringState({
         sourceId: block.id,
         sourcePort: portPosition,
         startPos: canvasStartCoords,
         currentMousePos: coords
       });
       return;
    }

    if (activeTool === 'cursor') {
      e.stopPropagation();
      setSelectedElementId(block.id);
      const coords = getCanvasCoords(e.clientX, e.clientY);
      setDraggingElement({
        type: 'block',
        id: block.id,
        startX: block.position.x,
        startY: block.position.y,
        startMouseX: coords.x,
        startMouseY: coords.y
      });
    }
  };

  const handleStickyMouseDown = (e: React.MouseEvent, note: any) => {
    const target = e.target as HTMLElement;
    if (target.classList.contains('resize-handle')) {
      e.stopPropagation();
      setResizingElement({
        type: 'sticky',
        id: note.id,
        elemX: note.position.x,
        elemY: note.position.y
      });
      return;
    }

    if (activeTool === 'cursor') {
      e.stopPropagation();
      setSelectedElementId(`sticky-${note.id}`);
      const coords = getCanvasCoords(e.clientX, e.clientY);
      setDraggingElement({
        type: 'sticky',
        id: note.id,
        startX: note.position.x,
        startY: note.position.y,
        startMouseX: coords.x,
        startMouseY: coords.y
      });
    }
  };

  // Handle canvas click for adding tools
  const handleCanvasClick = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).id === 'builder-canvas-area') {
      if (activeTool === 'sticky') {
        const coords = getCanvasCoords(e.clientX, e.clientY);
        addStickyNote(coords);
        setActiveTool('cursor');
      } else if (activeTool === 'text') {
        const coords = getCanvasCoords(e.clientX, e.clientY);
        addTextLabel(coords);
        setActiveTool('cursor');
      }
    }
  };

  const renderConnections = () => {
    const paths = connections.map((conn: any) => {
      const srcBlock = blocks.find((b: any) => b.id === conn.sourceBlockId);
      const tgtBlock = blocks.find((b: any) => b.id === conn.targetBlockId);
      if (!srcBlock || !tgtBlock) return null;

      const srcW = srcBlock.size?.width || 260;
      const srcH = srcBlock.size?.height || 150;
      const tgtW = tgtBlock.size?.width || 260;
      const tgtH = tgtBlock.size?.height || 150;

      const isSrcAbove = srcBlock.position.y + srcH / 2 <= tgtBlock.position.y + tgtH / 2;

      const sPort = conn.sourcePort || (isSrcAbove ? 'bottom' : 'top');
      const tPort = conn.targetPort || (isSrcAbove ? 'top' : 'bottom');

      const getAnchor = (block: any, port: string, width: number, height: number) => {
        if (port === 'top') return { x: block.position.x + width / 2, y: block.position.y - 12 };
        if (port === 'bottom') return { x: block.position.x + width / 2, y: block.position.y + height };
        if (port === 'left') return { x: block.position.x - 12, y: block.position.y + height / 2 };
        if (port === 'right') return { x: block.position.x + width, y: block.position.y + height / 2 };
        return { x: block.position.x + width / 2, y: block.position.y - 12 };
      };

      const p1 = getAnchor(srcBlock, sPort, srcW, srcH);
      const p2 = getAnchor(tgtBlock, tPort, tgtW, tgtH);

      const dist = Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
      const offset = dist * 0.4 + 40; 
      
      const cp1 = { ...p1 };
      if (sPort === 'top') cp1.y -= offset;
      if (sPort === 'bottom') cp1.y += offset;
      if (sPort === 'left') cp1.x -= offset;
      if (sPort === 'right') cp1.x += offset;

      const cp2 = { ...p2 };
      if (tPort === 'top') cp2.y -= offset;
      if (tPort === 'bottom') cp2.y += offset;
      if (tPort === 'left') cp2.x -= offset;
      if (tPort === 'right') cp2.x += offset;

      const pathData = `M ${p1.x} ${p1.y} C ${cp1.x} ${cp1.y}, ${cp2.x} ${cp2.y}, ${p2.x} ${p2.y}`;
      const isSelected = selectedElementId === conn.id;

      const srcStatus = nodeStatus[conn.sourceBlockId];
      const tgtStatus = nodeStatus[conn.targetBlockId];
      const isAnimating = srcStatus === 'success' && tgtStatus === 'running';

      return (
        <g key={conn.id} onClick={(e) => { e.stopPropagation(); setSelectedElementId(conn.id); }}>
          <path d={pathData} stroke="transparent" strokeWidth="20" fill="none" className="cursor-pointer" />
          <path
            d={pathData}
            stroke={isSelected ? "#DEF767" : "#A259FF"}
            strokeWidth={isSelected ? "4" : "2"}
            fill="none"
            strokeDasharray="8 6"
            className={`transition-all cursor-pointer thread-wire ${isAnimating ? 'thread-active' : 'hover:stroke-[#DEF767]'}`}
            style={{ opacity: isSelected || isAnimating ? 1 : 0.6 }}
          />
        </g>
      );
    });

    if (wiringState) {
      const p1 = wiringState.startPos;
      const p2 = wiringState.currentMousePos;
      const sPort = wiringState.sourcePort;

      const dist = Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
      const offset = dist * 0.4 + 40; 
      
      const cp1 = { ...p1 };
      if (sPort === 'top') cp1.y -= offset;
      if (sPort === 'bottom') cp1.y += offset;
      if (sPort === 'left') cp1.x -= offset;
      if (sPort === 'right') cp1.x += offset;

      const cp2 = { ...p2 };
      if (sPort === 'top' || sPort === 'bottom') {
         cp2.y += (p1.y < p2.y ? -offset : offset);
      } else {
         cp2.x += (p1.x < p2.x ? -offset : offset);
      }
      
      const actPath = `M ${p1.x} ${p1.y} C ${cp1.x} ${cp1.y}, ${cp2.x} ${cp2.y}, ${p2.x} ${p2.y}`;
      paths.push(
        <path key="active-wire" d={actPath} stroke="#A259FF" strokeWidth="2" fill="none" strokeDasharray="8 6" opacity="0.8" />
      );
    }

    return paths;
  };

  return (
    <div id="builder-canvas-area" className="pointer-events-auto w-full h-full z-40 absolute inset-0" onClick={handleCanvasClick}>
      <svg className="absolute inset-0 pointer-events-none w-full h-full overflow-visible z-0">
         <g style={{ pointerEvents: 'all' }}>
           {renderConnections()}
         </g>
      </svg>
      
      {/* Agent & Webhook Blocks */}
      {blocks.map((block: any) => (
        <div key={block.id} className="pointer-events-auto absolute" onMouseDown={(e) => handleBlockMouseDown(e, block)}>
          {block.type === 'webhook' ? (
            <WebhookBlockNode
              block={block}
              isSelected={selectedElementId === block.id}
            />
          ) : (
            <AgentBlockNode
              block={block}
              isSelected={selectedElementId === block.id}
            />
          )}
        </div>
      ))}

      {/* Builder Sticky Notes */}
      {stickyNotes.map((note: any) => {
        const noteColor = note.color || '#A259FF';
        const noteW = note.size?.width || 220;
        const noteH = note.size?.height || 160;

        return (
          <div
            key={`builder-sticky-${note.id}`}
            className={`absolute sticky-note p-3 rounded-2xl z-20 transition-all font-secondary flex flex-col group shadow-2xl cursor-pointer ${
              selectedElementId === `sticky-${note.id}` ? 'border' : 'border border-transparent'
            }`}
            onMouseDown={(e) => handleStickyMouseDown(e, note)}
            style={{
              left: note.position.x,
              top: note.position.y,
              width: noteW,
              height: noteH,
              background: 'rgba(26, 26, 46, 0.75)',
              borderColor: selectedElementId === `sticky-${note.id}` ? noteColor : `${noteColor}40`,
              backdropFilter: 'blur(16px)',
              pointerEvents: 'auto',
              boxShadow: selectedElementId === `sticky-${note.id}` ? `0 0 30px ${noteColor}40` : `0 10px 30px rgba(0,0,0,0.5)`,
            }}
          >
            <div className="w-full h-1.5 rounded-t-xl absolute top-0 left-0" style={{ background: `linear-gradient(to right, ${noteColor}, ${noteColor}80)` }} />
            
            <button
              aria-label="Delete Sticky Note"
              title="Delete Sticky Note"
              onClick={(e) => {
                e.stopPropagation();
                deleteStickyNote(note.id);
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
              onChange={(e) => updateStickyNote(note.id, { text: e.target.value })}
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

      {/* Builder Text Labels */}
      {textLabels.map((label: any) => (
        // eslint-disable-next-line
        <div
          key={`builder-label-${label.id}`}
          className="absolute z-20 pointer-events-auto group"
          style={{ left: label.x - 75, top: label.y - 15 }}
        >
          <input
            className="bg-transparent outline-none text-white text-sm font-bold w-[150px] placeholder-slate-500 border-b border-dashed border-white/20 focus:border-[#46B1FF]/50 pb-1 transition-colors"
            placeholder="Type label..."
            value={label.text}
            onMouseDown={e => e.stopPropagation()}
            onChange={(e) => updateTextLabel(label.id, e.target.value)}
          />
          <button
            aria-label="Delete Label"
            title="Delete Label"
            onClick={() => deleteTextLabel(label.id)}
            className="absolute -top-2 -right-2 w-5 h-5 rounded-md bg-[#ff4b4b]/20 hover:bg-[#ff4b4b]/80 border border-[#ff4b4b]/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all shadow-lg"
          >
            <Trash2 size={10} />
          </button>
        </div>
      ))}
    </div>
  );
};

export default BuilderCanvas;
