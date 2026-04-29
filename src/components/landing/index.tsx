import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Activity, ChevronRight, Lock, Database, Network } from 'lucide-react';
import { Navbar } from './Navbar';
import { HeroPrompt } from './HeroPrompt';
import { Features } from './Features';
import { Pricing } from './Pricing';
import { LivePipelinePreview } from './LivePipelinePreview';
import { RegisterView } from './RegisterView';
import { ProfileView } from './ProfileView';
import { useAuth } from '../../lib/auth';

// Helper icon
const StarIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-zinc-600 hover:text-zinc-300 cursor-pointer transition-colors">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
  </svg>
);

export default function LandingPage() {
  const navigate = useNavigate();
  const [view, setView] = useState('landing');
  
  // Get user state directly from Context
  const { user, signOut } = useAuth();

  const handleInit = () => {
    if (user) {
      navigate('/dashboard');
    } else {
      setView('register');
    }
  };

  const handleRegister = () => {
    navigate('/dashboard'); // Go to dashboard directly after register
  };

  const handleLogout = async () => {
    await signOut();
    setView('landing');
  };

  return (
    <div className="h-screen w-full bg-[#030303] text-zinc-300 font-sans selection:bg-zinc-800 selection:text-white overflow-y-auto overflow-x-hidden relative">
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }
        @keyframes dash {
          to { stroke-dashoffset: -1000; }
        }
      `}} />
      
      <Navbar user={user} setView={setView} onInit={handleInit} />

      {view === 'landing' && (
        <div className="flex flex-col w-full">
          <section className="pt-48 pb-32 px-6 relative overflow-hidden flex flex-col justify-center min-h-screen w-full">
            <div className="absolute inset-0 z-0 opacity-[0.12] pointer-events-none mix-blend-screen">
              <img src="https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=2000&q=80" alt="Neural Network Background" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-b from-[#030303] via-transparent to-[#030303]"></div>
            </div>

            <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-zinc-800/20 rounded-full blur-[150px] pointer-events-none z-0"></div>

            <div className="max-w-7xl mx-auto text-center relative z-10 flex flex-col items-center mt-12 w-full">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.03] border border-white/[0.08] text-zinc-400 text-xs font-mono mb-12 backdrop-blur-sm mt-8">
                <Activity className="w-3.5 h-3.5" />
                <span>ENTERPRISE NEURAL ENGINE 2.4</span>
              </div>
              
              <h1 className="text-5xl md:text-7xl font-bold text-transparent bg-clip-text bg-gradient-to-b from-white via-zinc-200 to-zinc-500 tracking-tight mb-8 leading-[1.1]">
                Design Multi-Agent <br />
                Pipelines Visually.
              </h1>
              
              <p className="text-lg md:text-xl text-zinc-500 max-w-2xl mx-auto leading-relaxed font-light mb-12">
                The premium neuro-orchestration platform. Connect, configure, and execute complex autonomous agent architectures with unprecedented control.
              </p>

              <div className="w-full mb-20 z-20">
                <HeroPrompt onInit={handleInit} />
              </div>

              <div className="w-full mt-12 mb-10 z-10">
                <LivePipelinePreview />
              </div>
            </div>
          </section>

          <div className="w-full py-12">
            <Features />
          </div>

          {/* UI Showcase / Details */}
          <section id="builder" className="py-40 px-6 relative overflow-hidden bg-[#050505] w-full flex flex-col">
            <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-20">
              <div className="lg:w-1/2">
                <div className="inline-flex items-center gap-2 text-zinc-500 text-xs font-mono font-medium mb-6 tracking-widest uppercase">
                  <Lock className="w-3.5 h-3.5" />
                  <span>Secure State Management</span>
                </div>
                <h2 className="text-4xl md:text-5xl font-medium text-zinc-100 mb-8 leading-tight tracking-tight">
                  Maintain absolute context <br /> across workflows.
                </h2>
                <p className="text-zinc-400 text-lg mb-10 leading-relaxed font-light">
                  Observe active orchestrations in real-time. AgenticFlow meticulously logs system states, computes resource allocation, and tracks synthesis outputs securely in-memory.
                </p>
                
                <ul className="space-y-5">
                  {['Real-time telemetry and compute metrics', 'Cryptographically secure in-memory key storage', 'Immutable activity and artifact logging'].map((item, i) => (
                    <li key={i} className="flex items-center text-zinc-300 font-light">
                      <div className="w-5 h-5 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mr-4">
                        <ChevronRight className="w-3 h-3 text-zinc-400" />
                      </div>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
              
              <div className="lg:w-1/2 w-full relative group">
                <div className="absolute -inset-6 bg-gradient-to-tr from-zinc-800/30 to-zinc-600/30 rounded-[2.5rem] blur-xl opacity-50 group-hover:opacity-70 transition-opacity duration-700"></div>
                <img 
                  src="https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=1200&q=80" 
                  alt="Data Streams" 
                  className="absolute -inset-4 w-[calc(100%+2rem)] h-[calc(100%+2rem)] object-cover rounded-[2rem] opacity-20 grayscale mix-blend-overlay group-hover:opacity-40 transition-opacity duration-700"
                />
                
                <div className="bg-[#0A0A0A]/80 backdrop-blur-2xl border border-white/10 rounded-2xl p-2 shadow-2xl relative overflow-hidden z-10">
                  <div className="flex items-center px-4 py-3 border-b border-white/5 mb-2 gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-zinc-800 border border-zinc-700"></div>
                    <div className="w-2.5 h-2.5 rounded-full bg-zinc-800 border border-zinc-700"></div>
                    <div className="w-2.5 h-2.5 rounded-full bg-zinc-800 border border-zinc-700"></div>
                  </div>

                  <div className="flex gap-6 p-4">
                    <div className="w-1/3 border-r border-white/5 pr-4 hidden sm:block">
                      <div className="text-[0.6rem] text-zinc-600 font-bold tracking-widest mb-6 uppercase">Spaces</div>
                      <div className="space-y-1">
                        {['Marketing Pipeline', 'Dev-Ops Automation', 'Neural Sandbox'].map((space, i) => (
                          <div key={i} className={`text-[0.8rem] px-3 py-2 rounded-lg flex items-center gap-3 transition-colors ${i === 2 ? 'bg-white/5 text-zinc-200 font-medium' : 'text-zinc-500 hover:text-zinc-300'}`}>
                            <Database className="w-3.5 h-3.5" />
                            {space}
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-6">
                        <div className="text-sm font-medium text-zinc-200">Active Sequences</div>
                        <div className="text-xs text-zinc-500 font-mono">2 RUNNING</div>
                      </div>
                      <div className="grid gap-3">
                        {[1, 2].map((card) => (
                          <div key={card} className="bg-[#111] border border-white/[0.05] rounded-xl p-5 hover:bg-[#141414] transition-colors group">
                            <div className="flex justify-between items-start mb-5">
                              <h4 className="text-zinc-200 font-medium text-sm tracking-tight">Algorithmic Trade <br/> Analysis v2</h4>
                              <StarIcon />
                            </div>
                            <div className="flex justify-between items-center text-[0.65rem] font-mono text-zinc-500">
                              <span className="text-zinc-300 flex items-center gap-1.5 bg-white/5 px-2 py-1 rounded-md">
                                <div className="w-1.5 h-1.5 rounded-full bg-zinc-300 shadow-[0_0_5px_rgba(255,255,255,0.8)] animate-pulse"></div> 
                                EXECUTING
                              </span>
                              <span>T - 12 SEC</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <div className="w-full">
            <Pricing onInit={handleInit} />
          </div>

          {/* CTA Section */}
          <section className="py-48 px-6 relative bg-[#030303] border-t border-white/5 flex flex-col items-center w-full">
            <div className="max-w-7xl mx-auto w-full relative z-10">
              <div className="bg-[#0A0A0A] border border-white/10 rounded-[2.5rem] p-10 lg:p-24 overflow-hidden relative flex flex-col lg:flex-row items-center justify-between gap-16 lg:gap-24 shadow-2xl w-full">
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-zinc-500/10 rounded-full blur-[120px] pointer-events-none"></div>
                <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-zinc-700/10 rounded-full blur-[100px] pointer-events-none"></div>

                <div className="lg:w-1/2 relative z-10 text-center lg:text-left flex flex-col">
                  <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-zinc-100 mb-8 tracking-tight leading-tight">Ready to <br/>deploy?</h2>
                  <p className="text-zinc-400 mb-12 text-lg font-light max-w-xl mx-auto lg:mx-0 leading-relaxed">
                    Elevate your operational capacity. Architect intelligent, autonomous systems with AgenticFlow today.
                  </p>
                  <div>
                    <button onClick={handleInit} className="bg-zinc-100 hover:bg-white text-zinc-950 font-bold px-8 py-4 rounded-full transition-all inline-flex items-center gap-2 shadow-[0_0_30px_rgba(255,255,255,0.1)] hover:shadow-[0_0_40px_rgba(255,255,255,0.2)] hover:scale-105">
                      Initialize Workspace
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                <div className="lg:w-1/2 relative z-10 w-full group mt-16 lg:mt-0">
                  <div className="absolute -inset-4 bg-gradient-to-tr from-zinc-600/20 to-zinc-400/20 rounded-[2rem] blur-xl opacity-50 group-hover:opacity-80 transition-opacity duration-700"></div>
                  <div className="relative rounded-2xl overflow-hidden border border-white/10 shadow-2xl transform lg:rotate-2 group-hover:rotate-0 transition-transform duration-700 bg-[#111]">
                     <img 
                       src="https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1200&q=80" 
                       alt="Abstract Deployment Visualization" 
                       className="w-full h-[300px] lg:h-[400px] object-cover opacity-100 group-hover:scale-105 transition-transform duration-700" 
                     />
                     <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A] via-[#0A0A0A]/40 to-transparent opacity-90"></div>
                     
                     <div className="absolute bottom-6 left-6 right-6 flex items-center justify-between">
                        <div className="flex items-center gap-3 bg-black/80 backdrop-blur-md border border-white/20 px-4 py-2.5 rounded-lg shadow-lg">
                          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse shadow-[0_0_10px_rgba(34,197,94,0.6)]"></div>
                          <span className="text-[0.65rem] font-mono text-zinc-100 tracking-widest font-bold">SYSTEM READY</span>
                        </div>
                        <div className="bg-black/80 backdrop-blur-md border border-white/20 p-2.5 rounded-lg shadow-lg">
                          <Activity className="w-4 h-4 text-zinc-300" />
                        </div>
                     </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Footer */}
          <footer className="border-t border-white/5 pt-20 pb-32 px-6 bg-[#030303] relative z-20 mt-20 w-full">
            <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-white/10 flex items-center justify-center">
                  <Network className="w-5 h-5 text-zinc-400" />
                </div>
                <span className="text-lg font-medium text-zinc-200 tracking-tight">Agentic<span className="text-zinc-600">Flow</span></span>
              </div>
              <div className="flex flex-wrap justify-center gap-10 text-sm text-zinc-500 font-light">
                <a href="#" className="hover:text-zinc-200 transition-colors">Platform</a>
                <a href="#" className="hover:text-zinc-200 transition-colors">Enterprise</a>
                <a href="#" className="hover:text-zinc-200 transition-colors">Documentation</a>
                <a href="#" className="hover:text-zinc-200 transition-colors">Legal</a>
              </div>
            </div>
          </footer>
        </div>
      )}

      {view === 'register' && <RegisterView onRegister={handleRegister} />}
      {view === 'profile' && <ProfileView user={user} onLogout={handleLogout} />}
    </div>
  );
}
