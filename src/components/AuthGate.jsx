import React, { useState } from 'react';
import { User, Key, ArrowRight, Sparkles } from 'lucide-react';
import { saveKeys } from '../lib/llm';

const PROFILE_KEY = 'agentic_user_profile';

function getUserProfile() {
  try {
    const data = localStorage.getItem(PROFILE_KEY);
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
}

function saveUserProfile(profile) {
  localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
}

function clearUserProfile() {
  localStorage.removeItem(PROFILE_KEY);
}

const AuthGate = ({ children }) => {
  const [profile, setProfile] = useState(() => getUserProfile());
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [step, setStep] = useState(1);

  // If profile exists, render app
  if (profile) return children;

  const handleComplete = () => {
    const newProfile = { name, email, createdAt: Date.now() };
    saveUserProfile(newProfile);
    
    // Save API key if provided
    if (apiKey.trim()) {
      if (apiKey.startsWith('sk-or-')) {
        saveKeys({ openrouterKey: apiKey.trim() });
      } else if (apiKey.startsWith('gsk_')) {
        saveKeys({ groqKey: apiKey.trim() });
      } else {
        saveKeys({ openrouterKey: apiKey.trim() });
      }
    }
    
    setProfile(newProfile);
  };

  return (
    <div className="h-screen w-screen flex items-center justify-center bg-[#0a0a10] relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#A259FF]/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#46B1FF]/5 rounded-full blur-[120px]" />
      </div>

      <div
        className="w-full max-w-md rounded-3xl overflow-hidden relative z-10 modal-content"
        style={{
          background: 'linear-gradient(180deg, rgba(15,15,22,0.98) 0%, rgba(8,8,12,1) 100%)',
          border: '1px solid rgba(162, 89, 255, 0.15)',
          boxShadow: '0 32px 100px rgba(0,0,0,0.9), 0 0 60px rgba(162,89,255,0.08)',
        }}
      >
        {/* Header */}
        <div className="px-8 pt-10 pb-6 text-center">
          <div className="w-16 h-16 rounded-2xl mx-auto mb-5 flex items-center justify-center"
            style={{
              background: 'linear-gradient(135deg, #A259FF 0%, #46B1FF 100%)',
              boxShadow: '0 8px 32px rgba(162,89,255,0.4)',
            }}
          >
            <Sparkles size={28} className="text-white" />
          </div>
          <h1 className="text-2xl font-black text-white font-display tracking-tight mb-2">Welcome to Agentic Flow</h1>
          <p className="text-sm text-slate-500 font-secondary">Set up your workspace to begin</p>
          
          {/* Step Indicator */}
          <div className="flex items-center justify-center gap-2 mt-5">
            <div className={`w-8 h-1 rounded-full transition-colors ${step >= 1 ? 'bg-[#A259FF]' : 'bg-white/10'}`} />
            <div className={`w-8 h-1 rounded-full transition-colors ${step >= 2 ? 'bg-[#46B1FF]' : 'bg-white/10'}`} />
          </div>
        </div>

        {/* Body */}
        <div className="px-8 pb-8">
          {step === 1 ? (
            <div className="space-y-5 animate-fade-in">
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#CEA3FF]">Your Name</label>
                <div className="relative">
                  <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600" />
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter your name..."
                    className="w-full pl-11 pr-4 py-3.5 rounded-xl text-sm text-white placeholder:text-slate-700 font-secondary bg-black/40 border border-white/5 focus:border-[#A259FF]/40 transition-all"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">Email <span className="text-slate-700">(optional)</span></label>
                <input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  type="email"
                  className="w-full px-4 py-3.5 rounded-xl text-sm text-white placeholder:text-slate-700 font-secondary bg-black/40 border border-white/5 focus:border-[#A259FF]/40 transition-all"
                />
              </div>
              <button
                onClick={() => setStep(2)}
                disabled={!name.trim()}
                className={`w-full py-3.5 rounded-xl text-sm font-bold uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${
                  name.trim()
                    ? 'bg-gradient-to-r from-[#A259FF] to-[#8B5CF6] text-white shadow-lg shadow-[#A259FF]/20 hover:opacity-90'
                    : 'bg-white/5 text-slate-500 cursor-not-allowed'
                }`}
              >
                Continue <ArrowRight size={16} />
              </button>
            </div>
          ) : (
            <div className="space-y-5 animate-fade-in">
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#46B1FF]">API Key</label>
                <div className="relative">
                  <Key size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600" />
                  <input
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="sk-or-... or gsk_..."
                    type="password"
                    className="w-full pl-11 pr-4 py-3.5 rounded-xl text-sm text-white placeholder:text-slate-700 font-mono bg-black/40 border border-white/5 focus:border-[#46B1FF]/40 transition-all"
                  />
                </div>
                <p className="text-[9px] text-slate-600 font-secondary leading-relaxed">
                  Supports OpenRouter, Groq, and OpenAI keys. You can also add keys later in Settings.
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setStep(1)}
                  className="px-5 py-3.5 rounded-xl text-sm font-bold text-slate-400 bg-white/5 border border-white/5 hover:bg-white/10 transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={handleComplete}
                  className="flex-1 py-3.5 rounded-xl text-sm font-bold uppercase tracking-widest flex items-center justify-center gap-2 bg-gradient-to-r from-[#46B1FF] to-[#A259FF] text-white shadow-lg hover:opacity-90 transition-opacity"
                >
                  <Sparkles size={16} /> Launch Workspace
                </button>
              </div>
              
              <button
                onClick={() => { handleComplete(); }}
                className="w-full text-center text-[10px] text-slate-600 uppercase tracking-widest hover:text-slate-400 transition-colors py-2"
              >
                Skip — I'll add keys later
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuthGate;
