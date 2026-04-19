import React, { useState, useEffect } from 'react';
import { useBuilderStore } from '../lib/builderStore';
import AgentBlockNode from './AgentBlockNode';
import { Trash2 } from 'lucide-react';

const BuilderCanvas = ({ activeTool, setActiveTool, getCanvasCoords }) => {
  const { 
    blocks, connections, updateBlock, selectedElementId, 
    setSelectedElementId, connectBlocks,
    stickyNotes, addStickyNote, updateStickyNote, deleteStickyNote
  } = useBuilderStore();

  const [draggingElement, setDraggingElement] = useState(null);
  const [wiringState, setWiringState] = useState(null);
  const [resizingElement, setResizingElement] = useState(null);

  // Dragging + wiring + resizing logic
  useEffect(() => {
    const handleMouseMove = (e) => {
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
        setWiringState(prev => ({ ...prev, currentMousePos: coords }));
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

    const handleMouseUp = (e) => {
      if (draggingElement) setDraggingElement(null);
      if (resizingElement) setResizingElement(null);
      
      if (wiringState) {
        const target = document.elementFromPoint(e.clientX, e.clientY);
        if (target && target.classList.contains('connection-port')) {
          const targetId = target.getAttribute('data-port-id');
          const targetType = target.getAttribute('data-port-type');
          
          if (targetType === 'target' && targetId !== wiringState.sourceId) {
            connectBlocks(wiringState.sourceId, targetId);
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

  const handleBlockMouseDown = (e, block) => {
    if (e.target.classList.contains('resize-handle')) {
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
    if (e.target.classList.contains('connection-port')) {
       e.stopPropagation();
       const portType = e.target.getAttribute('data-port-type');
       if (portType === 'source') {
         const blockRect = e.target.getBoundingClientRect();
         const portCenterX = blockRect.left + blockRect.width / 2;
         const portCenterY = blockRect.top + blockRect.height / 2;
         const canvasStartCoords = getCanvasCoords(portCenterX, portCenterY);
         const coords = getCanvasCoords(e.clientX, e.clientY);
         
         setWiringState({
           sourceId: block.id,
           startPos: canvasStartCoords,
           currentMousePos: coords
         });
       }
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

  const handleStickyMouseDown = (e, note) => {
    if (e.target.classList.contains('resize-handle')) {
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

  // Handle canvas click for adding sticky notes in builder mode
  const handleCanvasClick = (e) => {
    if (activeTool === 'sticky' && e.target.id === 'builder-canvas-area') {
      const coords = getCanvasCoords(e.clientX, e.clientY);
      addStickyNote(coords);
      setActiveTool('cursor');
    }
  };

  const renderConnections = () => {
    const paths = connections.map(conn => {
      const srcBlock = blocks.find(b => b.id === conn.sourceBlockId);
      const tgtBlock = blocks.find(b => b.id === conn.targetBlockId);
      if (!srcBlock || !tgtBlock) return null;

      const srcW = srcBlock.size?.width || 260;
      const srcH = srcBlock.size?.height || 150;
      const tgtW = tgtBlock.size?.width || 260;

      const p1 = { x: srcBlock.position.x + srcW / 2, y: srcBlock.position.y + srcH };
      const p2 = { x: tgtBlock.position.x + tgtW / 2, y: tgtBlock.position.y - 12 };

      const offset = Math.abs(p2.y - p1.y) * 0.5 + 40;
      const pathData = `M ${p1.x} ${p1.y} C ${p1.x} ${p1.y + offset}, ${p2.x} ${p2.y - offset}, ${p2.x} ${p2.y}`;
      const isSelected = selectedElementId === conn.id;

      return (
        <g key={conn.id} onClick={(e) => { e.stopPropagation(); setSelectedElementId(conn.id); }}>
          <path d={pathData} stroke="transparent" strokeWidth="20" fill="none" className="cursor-pointer" />
          <path
            d={pathData}
            stroke={isSelected ? "#DEF767" : "#A259FF"}
            strokeWidth={isSelected ? "4" : "2"}
            fill="none"
            strokeDasharray="8 6"
            className="transition-all cursor-pointer hover:stroke-[#DEF767]"
            style={{ opacity: isSelected ? 1 : 0.6 }}
          />
        </g>
      );
    });

    if (wiringState) {
      const p1 = wiringState.startPos;
      const p2 = wiringState.currentMousePos;
      const offset = Math.abs(p2.y - p1.y) * 0.5 + 40;
      const actPath = `M ${p1.x} ${p1.y} C ${p1.x} ${p1.y + offset}, ${p2.x} ${p2.y - offset}, ${p2.x} ${p2.y}`;
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
      
      {/* Agent Blocks */}
      {blocks.map(block => (
        <div key={block.id} className="pointer-events-auto absolute" onMouseDown={(e) => handleBlockMouseDown(e, block)}>
          <AgentBlockNode
            block={block}
            isSelected={selectedElementId === block.id}
          />
        </div>
      ))}

      {/* Builder Sticky Notes */}
      {stickyNotes.map(note => {
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
    </div>
  );
};

export default BuilderCanvas;
