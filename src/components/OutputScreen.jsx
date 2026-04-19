import React, { useRef } from 'react';
import { X, Download, Copy, FileText, CheckCircle2 } from 'lucide-react';
import { useWorkflowStore } from '../lib/store';
import { WORKFLOW_PHASES } from '../data/schema';

const OutputScreen = ({ isOpen, onClose }) => {
  const contentRef = useRef(null);
  const nodeResults = useWorkflowStore(state => state.nodeResults);
  const projectPrompt = useWorkflowStore(state => state.projectPrompt);
  const [copied, setCopied] = React.useState(false);

  if (!isOpen) return null;

  const handleDownloadPDF = async () => {
    const html2pdf = (await import('html2pdf.js')).default;
    const element = contentRef.current;
    if (!element) return;

    const opt = {
      margin: [10, 10, 10, 10],
      filename: `agentic-flow-output-${Date.now()}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, backgroundColor: '#0a0a10' },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
    };

    html2pdf().set(opt).from(element).save();
  };

  const handleCopyAll = () => {
    const allContent = WORKFLOW_PHASES.map(phase => {
      const phaseNodes = phase.categories.map(c => `${phase.id}::${c}`);
      const nodeOutputs = phaseNodes
        .map(nId => nodeResults[nId]?.content)
        .filter(Boolean)
        .join('\n\n');
      return `## ${phase.label}\n${nodeOutputs}`;
    }).join('\n\n---\n\n');

    navigator.clipboard.writeText(allContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const totalResults = Object.keys(nodeResults).length;

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center modal-overlay"
      style={{ background: 'rgba(0,0,0,0.92)', backdropFilter: 'blur(16px)' }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-5xl h-[90vh] rounded-3xl overflow-hidden flex flex-col modal-content"
        style={{
          background: 'linear-gradient(180deg, #0c0c14 0%, #050508 100%)',
          border: '1px solid rgba(162, 89, 255, 0.2)',
          boxShadow: '0 32px 100px rgba(0,0,0,0.9), 0 0 80px rgba(162,89,255,0.1)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-8 py-5 border-b border-white/[0.06] bg-black/40 shrink-0">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-[#DEF767]/10 border border-[#DEF767]/20">
              <FileText size={18} className="text-[#DEF767]" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white font-display">Pipeline Output Manifest</h2>
              <p className="text-[10px] text-slate-500 font-secondary mt-0.5 tracking-wide uppercase">
                {totalResults} agent{totalResults !== 1 ? 's' : ''} completed • {projectPrompt?.substring(0, 50)}{projectPrompt?.length > 50 ? '...' : ''}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleCopyAll}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-slate-300 text-xs font-bold uppercase tracking-wider hover:bg-white/10 transition-colors"
            >
              {copied ? <><CheckCircle2 size={14} className="text-[#DEF767]" /> Copied</> : <><Copy size={14} /> Copy All</>}
            </button>
            <button
              onClick={handleDownloadPDF}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#A259FF] to-[#46B1FF] text-white text-xs font-bold uppercase tracking-wider hover:opacity-80 transition-opacity shadow-lg shadow-[#A259FF]/20"
            >
              <Download size={14} /> Download PDF
            </button>
            <button
              onClick={onClose}
              className="p-2.5 rounded-xl hover:bg-white/5 transition-all text-slate-500 hover:text-white"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <div ref={contentRef} className="p-8 space-y-10" style={{ background: '#0a0a10', color: '#e2e8f0' }}>
            {/* Title Section for PDF */}
            <div className="text-center pb-6 border-b border-white/[0.04]">
              <h1 className="text-3xl font-black text-white font-display tracking-tight mb-2">Agentic Flow — Output Report</h1>
              <p className="text-sm text-slate-400 font-secondary">{projectPrompt}</p>
              <p className="text-[10px] text-slate-600 mt-2 font-mono">{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
            </div>

            {/* Phase by Phase Results */}
            {WORKFLOW_PHASES.map((phase, pIdx) => {
              const phaseNodes = phase.categories.map(c => `${phase.id}::${c}`);
              const phaseResults = phaseNodes
                .map(nId => ({ id: nId, result: nodeResults[nId] }))
                .filter(({ result }) => result);

              if (phaseResults.length === 0) return null;

              const PHASE_ACCENT = {
                discover: '#46B1FF',
                define: '#CEA3FF',
                develop: '#A259FF',
                deliver: '#DEF767',
              };
              const accent = PHASE_ACCENT[phase.id] || '#A259FF';

              return (
                <div key={phase.id} className="space-y-6">
                  {/* Phase Header */}
                  <div className="flex items-center gap-4">
                    <div className="flex items-center justify-center w-8 h-8 rounded-lg text-xs font-black text-black" style={{ background: accent }}>
                      {pIdx + 1}
                    </div>
                    <div>
                      <h2 className="text-xl font-black text-white uppercase tracking-[0.15em] font-display">{phase.label}</h2>
                      <p className="text-[10px] uppercase tracking-widest font-bold" style={{ color: accent }}>{phase.subtitle}</p>
                    </div>
                    <div className="flex-1 h-px ml-4" style={{ background: `linear-gradient(to right, ${accent}40, transparent)` }} />
                  </div>

                  {/* Agent Results */}
                  <div className="grid gap-4">
                    {phaseResults.map(({ id, result }) => {
                      const agentName = id.split('::')[1]?.replace(/-/g, ' ');
                      return (
                        <div
                          key={id}
                          className="rounded-2xl overflow-hidden"
                          style={{
                            background: 'rgba(255,255,255,0.02)',
                            border: '1px solid rgba(255,255,255,0.05)',
                          }}
                        >
                          <div className="px-5 py-3 flex items-center gap-3 border-b border-white/[0.04]" style={{ background: 'rgba(0,0,0,0.3)' }}>
                            <div className="w-2 h-2 rounded-full" style={{ background: accent, boxShadow: `0 0 8px ${accent}` }} />
                            <span className="text-[11px] font-bold uppercase tracking-widest text-slate-300">{agentName}</span>
                          </div>

                          {/* Content Output */}
                          {result.content && (
                            <div className="px-5 py-4">
                              <pre className="text-xs text-slate-300 leading-relaxed font-secondary whitespace-pre-wrap break-words">{result.content}</pre>
                            </div>
                          )}

                          {/* UI Output */}
                          {result.ui && (
                            <div className="px-5 py-4 border-t border-white/[0.03]">
                              <div className="text-[9px] text-[#A259FF] uppercase font-bold tracking-widest mb-3">Rendered UI Asset</div>
                              <div dangerouslySetInnerHTML={{ __html: result.ui }} />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}

            {/* Footer for PDF */}
            <div className="text-center pt-8 border-t border-white/[0.04]">
              <p className="text-[9px] text-slate-600 uppercase tracking-[0.3em]">Generated by Agentic Flow • Neuro-Agentic Systems</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OutputScreen;
