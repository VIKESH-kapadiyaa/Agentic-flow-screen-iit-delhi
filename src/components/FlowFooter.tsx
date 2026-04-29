import React, { useRef, useEffect } from 'react';
import { Terminal } from 'lucide-react';

const FlowFooter = ({ flowStatus, logs, completedCount, totalCount }) => {
  const logRef = useRef(null);

  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollLeft = logRef.current.scrollWidth;
    }
  }, [logs]);

  const statusText = {
    idle: 'Neural Bridge Optimized',
    running: 'Sequence Execution Active…',
    completed: 'Sequence Sync Complete',
  };

  const statusColor = {
    idle: '#46B1FF',
    running: '#A259FF',
    completed: '#DEF767',
  };

  return (
    <footer
      className="bg-black/90 backdrop-blur-2xl flex items-center justify-between px-6 py-2.5 z-40 relative border-t border-white/[0.04]"
    >
      {/* Left: Status */}
      <div className="flex items-center gap-4 flex-shrink-0">
        <div className="flex items-center gap-2.5">
          <div
            className={`w-1.5 h-1.5 rounded-full ${flowStatus === 'running' ? 'status-running' : ''}`}
            style={{ 
              background: statusColor[flowStatus] || '#46B1FF',
              boxShadow: flowStatus !== 'idle' ? `0 0 12px ${statusColor[flowStatus]}` : 'none'
            }}
          />
          <span
            className="text-[10px] font-bold tracking-wider uppercase font-secondary"
            style={{ color: statusColor[flowStatus] }}
          >
            {statusText[flowStatus] || 'Standby'}
          </span>
        </div>
        <div className="h-3 w-px bg-white/10" />
        <span className="text-[9px] font-mono text-slate-500 tracking-tighter">
          SYNC: {completedCount}/{totalCount} AGENTS ACTIVE
        </span>
      </div>

      {/* Center: Inline Logs */}
      <div
        ref={logRef}
        className="flex-1 mx-8 overflow-x-auto no-scrollbar flex items-center gap-4 py-1"
      >
        {logs.slice(-4).map((log, i) => (
          <div
            key={log.id || i}
            className="flex items-center gap-2 flex-shrink-0 log-enter bg-white/[0.02] px-2 py-1 rounded-md border border-white/[0.03]"
          >
            <span
              className="text-[9px] font-mono whitespace-nowrap opacity-80"
              style={{
                color:
                  log.type === 'success'
                    ? '#DEF767'
                    : log.type === 'error'
                    ? '#FF6A6A'
                    : log.type === 'info'
                    ? '#46B1FF'
                    : '#CEA3FF',
              }}
            >
              [{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}] {log.text}
            </span>
          </div>
        ))}
      </div>

      {/* Right: Empty spacer for layout balance */}
      <div className="flex-shrink-0 w-[180px]" />
    </footer>
  );
};

export default FlowFooter;
