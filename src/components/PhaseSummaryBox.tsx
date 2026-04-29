import React, { useState, useEffect, useRef } from 'react';
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';
import { useWorkflowStore } from '../lib/store';

function useOutsideClick(ref, handler) {
  useEffect(() => {
    const listener = (event) => {
      // Don't trigger if click is inside the modal or the toggle button
      if (!ref.current || ref.current.contains(event.target)) {
        return;
      }
      handler(event);
    };
    document.addEventListener('mousedown', listener);
    document.addEventListener('touchstart', listener);
    return () => {
      document.removeEventListener('mousedown', listener);
      document.removeEventListener('touchstart', listener);
    };
  }, [ref, handler]);
}

const PhaseSummaryBox = ({ phase, x, y }) => {
  const [isOpen, setIsOpen] = useState(false);
  const modalRef = useRef(null);
  
  useOutsideClick(modalRef, () => setIsOpen(false));
  const nodeResults = useWorkflowStore(state => state.nodeResults);
  
  // Aggregate output
  const phaseResults = Object.entries(nodeResults)
    .filter(([id]) => id.startsWith(phase.id + '::'))
    .map(([id, result]) => ({ id, ...result }));

  return (
    <div className="absolute z-50 flex flex-col items-center" style={{ left: x, top: y, transform: 'translate(-50%, 0)' }}>
      {/* Default State - Pulse Anchor */}
      <motion.button
        onClick={(e) => { e.stopPropagation(); setIsOpen(!isOpen); }}
        className="flex items-center gap-3 px-5 py-2.5 rounded-full cursor-pointer relative shadow-lg hover:shadow-xl transition-shadow"
        style={{
          background: 'rgba(13, 10, 25, 0.8)',
          backdropFilter: 'blur(24px)',
          border: '1px solid transparent',
          backgroundImage: 'linear-gradient(rgba(13, 10, 25, 0.9), rgba(13, 10, 25, 0.9)), linear-gradient(to right, #A259FF, #46B1FF)',
          backgroundOrigin: 'border-box',
          backgroundClip: 'padding-box, border-box',
        }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <div className="w-2 h-2 rounded-full bg-[#A259FF] shadow-[0_0_8px_#A259FF] animate-pulse" />
        <span className="text-xs font-bold tracking-widest text-[#e2e8f0] uppercase font-display">
          Phase Output: {phase.label}
        </span>
      </motion.button>

      {/* Modal State */}
      <AnimatePresence>
        {isOpen && typeof document !== 'undefined' && createPortal(
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-[#050505]/80 backdrop-blur-xl p-8"
          >
            <motion.div
              ref={modalRef}
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
              className="w-full max-w-4xl max-h-[85vh] rounded-3xl overflow-hidden shadow-[0_0_50px_rgba(162,89,255,0.15)] flex flex-col"
              style={{
                background: 'rgba(5, 5, 5, 0.9)',
                border: '0.5px solid rgba(255, 255, 255, 0.1)',
                backdropFilter: 'blur(30px)'
              }}
            >
              <div className="p-6 border-b border-white/[0.05] flex justify-between items-center bg-white/[0.02]">
                <h3 className="text-xl font-black text-white uppercase tracking-[0.2em] font-display">
                  <span className="text-[#A259FF]">Synthesis //</span> {phase.label}
                </h3>
                <button 
                  onClick={(e) => { e.stopPropagation(); setIsOpen(false); }}
                  className="text-slate-400 hover:text-white transition-colors w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10"
                >
                  ✕
                </button>
              </div>
              
              <div className="p-8 overflow-y-auto custom-scrollbar-neon flex-1 text-slate-300">
                {phaseResults.length === 0 ? (
                  <div className="text-sm text-slate-500 italic text-center py-16">
                    Sequence idle. Execute the {phase.label} phase to synthesize data.
                  </div>
                ) : (
                  <div className="flex flex-col gap-6">
                    {phaseResults.map((res, idx) => {
                      const cleanName = res.id.split('::')[1].replace('-', ' ');
                      return (
                        <div key={idx} className="bg-white/[0.03] p-6 rounded-2xl border border-white/[0.05] shadow-inner">
                          <div className="text-xs text-[#46B1FF] uppercase font-bold tracking-widest mb-3">
                            AGENT: {cleanName}
                          </div>
                          <div className="text-sm text-slate-300 font-secondary leading-relaxed space-y-4">
                             {res.content ? res.content : 'Awaiting output...'}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="p-6 border-t border-white/[0.05] bg-white/[0.02] flex justify-between items-center">
                <span className="text-[10px] text-slate-500 uppercase tracking-widest">Midnight Luxe Theme Active</span>
                <button 
                  className="px-6 py-3 rounded-xl border border-[#F6E27F]/50 text-[#F6E27F] font-bold uppercase tracking-widest hover:bg-[#F6E27F]/10 transition-colors text-xs flex items-center gap-2 shadow-[0_0_15px_rgba(246,226,127,0.1)]"
                >
                  Download Result
                </button>
              </div>
            </motion.div>
          </motion.div>,
          document.body
        )}
      </AnimatePresence>
    </div>
  );
};

export default PhaseSummaryBox;
