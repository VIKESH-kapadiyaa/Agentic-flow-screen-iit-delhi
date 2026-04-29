import React from 'react';
import { Sparkles, Play } from 'lucide-react';

export const HeroPrompt = ({ onInit }) => (
  <div className="w-full max-w-3xl mx-auto mb-16 relative group z-20">
    <div className="absolute -inset-0.5 bg-gradient-to-r from-zinc-500/20 via-zinc-300/20 to-zinc-500/20 rounded-2xl blur opacity-30 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
    <div className="relative flex items-center bg-[#0A0A0A]/80 backdrop-blur-md border border-white/10 rounded-2xl px-6 py-5 shadow-2xl transition-all duration-300 hover:border-white/20">
      <Sparkles className="w-5 h-5 text-zinc-400 mr-4 flex-shrink-0" />
      <input 
        type="text" 
        placeholder="Orchestrate your objective... (e.g. Design a technical whitepaper for a DeFi protocol)"
        className="w-full bg-transparent border-none outline-none text-zinc-200 placeholder-zinc-600 text-sm md:text-base font-mono font-light tracking-wide"
      />
      <div className="ml-4 flex items-center gap-2 flex-shrink-0">
         <span className="text-xs font-mono text-zinc-500 hidden sm:inline-block border border-white/10 px-2 py-1 rounded bg-white/5">⌘ + K</span>
         <button onClick={onInit} className="bg-white/10 hover:bg-white/20 text-zinc-100 rounded-lg p-2 transition-colors">
           <Play className="w-4 h-4 fill-current" />
         </button>
      </div>
    </div>
  </div>
);
