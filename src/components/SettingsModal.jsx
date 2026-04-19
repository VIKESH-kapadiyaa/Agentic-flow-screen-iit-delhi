import React, { useState } from 'react';
import { X, Key, CheckCircle2, AlertCircle, Save } from 'lucide-react';
import { saveKeys, getSavedKeys, getKeyStatus } from '../lib/llm';

const SettingsModal = ({ isOpen, onClose }) => {
  const initialKeys = isOpen ? getSavedKeys() : { openrouterKey: '', groqKey: '' };
  const [openrouterKey, setOpenrouterKey] = useState(initialKeys.openrouterKey);
  const [groqKey, setGroqKey] = useState(initialKeys.groqKey);
  const [saved, setSaved] = useState(false);

  if (!isOpen) return null;

  const status = getKeyStatus();

  const handleSave = () => {
    saveKeys({ openrouterKey, groqKey });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center modal-overlay p-4"
      style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(12px)' }}
      onClick={onClose}
    >
      <div
        className="glass-node rounded-3xl w-full max-w-md modal-content overflow-hidden"
        style={{
          border: '1px solid rgba(255,255,255,0.08)',
          boxShadow: '0 32px 100px rgba(0,0,0,0.9), 0 0 0 1px rgba(255,255,255,0.05)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-7 py-6"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
        >
          <div className="flex items-center gap-4">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center bg-[#A259FF]/10 border border-[#A259FF]/20"
            >
              <Key size={18} className="text-[#A259FF]" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white font-display">Neural Gateways</h2>
              <p className="text-[10px] text-slate-500 font-secondary mt-0.5 tracking-wide">
                Secure local storage for API credentials
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2.5 rounded-xl hover:bg-white/5 transition-all text-slate-500 hover:text-white"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="px-7 py-6 space-y-6">
          {/* OpenRouter Key */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#CEA3FF] font-primary">
                OpenRouter Protocol
              </label>
              {status.openrouter ? (
                <span className="flex items-center gap-1.5 text-[9px] font-bold text-[#DEF767] uppercase tracking-wider">
                  <div className="w-1 h-1 rounded-full bg-[#DEF767] shadow-[0_0_8px_#DEF767]" />
                  Active
                </span>
              ) : (
                <span className="flex items-center gap-1.5 text-[9px] font-bold text-slate-600 uppercase tracking-wider">
                  <div className="w-1 h-1 rounded-full bg-slate-600" />
                  Inactive
                </span>
              )}
            </div>
            <input
              type="password"
              value={openrouterKey}
              onChange={(e) => setOpenrouterKey(e.target.value)}
              placeholder="sk-or-v1-..."
              className="w-full px-4 py-3 rounded-xl text-xs text-white placeholder:text-slate-700 font-mono bg-black/40 border border-white/5 focus:border-[#A259FF]/40 transition-all"
            />
            <p className="text-[9px] text-slate-600 font-secondary leading-relaxed">
              Required for synthesis through GPT-4o and Claude systems.
            </p>
          </div>

          {/* Groq Key */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#46B1FF] font-primary">
                Groq Accelerator
              </label>
              {status.groq ? (
                <span className="flex items-center gap-1.5 text-[9px] font-bold text-[#DEF767] uppercase tracking-wider">
                  <div className="w-1 h-1 rounded-full bg-[#DEF767] shadow-[0_0_8px_#DEF767]" />
                  Active
                </span>
              ) : (
                <span className="flex items-center gap-1.5 text-[9px] font-bold text-slate-600 uppercase tracking-wider">
                  <div className="w-1 h-1 rounded-full bg-slate-600" />
                  Inactive
                </span>
              )}
            </div>
            <input
              type="password"
              value={groqKey}
              onChange={(e) => setGroqKey(e.target.value)}
              placeholder="gsk_..."
              className="w-full px-4 py-3 rounded-xl text-xs text-white placeholder:text-slate-700 font-mono bg-black/40 border border-white/5 focus:border-[#A259FF]/40 transition-all"
            />
            <p className="text-[9px] text-slate-600 font-secondary leading-relaxed">
              Provides near-instant inference via Llama 3.1 70B clusters.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div
          className="flex items-center justify-between px-7 py-5 bg-black/40"
          style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}
        >
          <div className="flex items-center gap-2 max-w-[180px]">
            <AlertCircle size={10} className="text-slate-600 flex-shrink-0" />
            <span className="text-[8px] text-slate-600 leading-tight font-secondary uppercase tracking-tight">
              Credentials remain client-side and encrypted via local browser cache.
            </span>
          </div>
          <button
            onClick={handleSave}
            className="btn-run px-6 py-3 rounded-xl text-xs font-bold text-white flex items-center gap-2.5 shadow-xl shadow-[#A259FF]/20"
          >
            {saved ? (
              <>
                <CheckCircle2 size={15} className="text-[#DEF767]" />
                Committed
              </>
            ) : (
              <>
                <Save size={15} />
                Sync Keys
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;
