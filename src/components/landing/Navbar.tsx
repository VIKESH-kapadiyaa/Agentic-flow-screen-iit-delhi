import React from 'react';
import { Network, User, ChevronRight } from 'lucide-react';

interface NavbarProps {
  user: any;
  setView: (view: string) => void;
  onInit: () => void;
}

export const Navbar = ({ user, setView, onInit }: NavbarProps) => (
  <nav className="fixed w-full top-0 z-50 bg-[#030303]/70 backdrop-blur-xl border-b border-white/[0.05]">
    <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <div className="flex items-center justify-center">
          <img src="/logo.png" alt="AgenticFlow Logo" className="w-10 h-10 object-contain" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-100 cursor-pointer" onClick={() => setView('landing')}>Agentic<span className="text-zinc-500 font-medium">Flow</span></h1>
        </div>
      </div>
      
      <div className="hidden md:flex items-center gap-8 text-sm font-medium text-zinc-400">
        <button onClick={() => setView('landing')} className="hover:text-zinc-100 transition-colors">Platform</button>
        <button onClick={() => setView('landing')} className="hover:text-zinc-100 transition-colors">Architecture</button>
        <button onClick={() => setView('landing')} className="hover:text-zinc-100 transition-colors">Pricing</button>
      </div>

      <div className="flex items-center gap-6">
        <button className="hidden md:block text-sm font-medium text-zinc-400 hover:text-zinc-100 transition-colors">
          Documentation
        </button>
        {user ? (
          <button onClick={() => setView('profile')} aria-label="User Profile" title="User Profile" className="w-10 h-10 rounded-full bg-zinc-800 border border-white/10 flex items-center justify-center hover:bg-zinc-700 transition-colors shadow-lg group">
            <User className="w-5 h-5 text-zinc-300 group-hover:text-white transition-colors" />
          </button>
        ) : (
          <button onClick={onInit} className="group flex items-center gap-2 bg-zinc-100 hover:bg-white text-zinc-950 rounded-full px-6 py-2.5 transition-all duration-300 shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:shadow-[0_0_25px_rgba(255,255,255,0.2)]">
            <span className="text-sm font-bold tracking-wide">Initialize Engine</span>
            <ChevronRight className="w-4 h-4 text-zinc-600 group-hover:text-zinc-900 transition-colors" />
          </button>
        )}
      </div>
    </div>
  </nav>
);
