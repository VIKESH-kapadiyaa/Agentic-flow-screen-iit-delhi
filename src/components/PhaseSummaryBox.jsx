import React, { useState, useEffect, useRef } from 'react';
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from 'framer-motion';
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
        {isOpen && (
          <motion.div
            ref={modalRef}
            initial={{ opacity: 0, scale: 0.8, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 10 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className="absolute top-full mt-4 w-[400px] rounded-2xl overflow-hidden shadow-[0_0_30px_rgba(139,92,246,0.15)] origin-top bg-[#0A0A10]/85 backdrop-blur-2xl border border-[#8B5CF6]/40 flex flex-col max-h-[400px]"
          >
            <div className="p-4 border-b border-[#A259FF]/20 flex justify-between items-center bg-[#0A0A10]/95 sticky top-0 z-10 backdrop-blur-md">
              <h3 className="text-xs font-bold text-white uppercase tracking-[0.2em] font-display">
                <span className="text-[#A259FF]">Synthesis //</span> {phase.label}
              </h3>
              <button 
                onClick={(e) => { e.stopPropagation(); setIsOpen(false); }}
                className="text-slate-400 hover:text-white transition-colors w-6 h-6 flex items-center justify-center rounded-full hover:bg-white/10"
              >
                ✕
              </button>
            </div>
            <div className="p-5 overflow-y-auto custom-scrollbar-neon flex-1">
              {phaseResults.length === 0 ? (
                <div className="text-xs text-slate-500 italic text-center py-8">
                  Sequence idle. Execute the {phase.label} phase to synthesize data.
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  {phaseResults.map((res, idx) => {
                    const cleanName = res.id.split('::')[1].replace('-', ' ');
                    return (
                      <div key={idx} className="bg-white/[0.02] p-4 rounded-xl border border-white/[0.05]">
                        <div className="text-[10px] text-[#46B1FF] uppercase font-bold tracking-widest mb-2">
                          AGENT: {cleanName}
                        </div>
                        <div className="text-xs text-slate-300 leading-relaxed font-secondary">
                           {res.content ? res.content.substring(0, 300) + (res.content.length > 300 ? '...' : '') : 'Awaiting output...'}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PhaseSummaryBox;
