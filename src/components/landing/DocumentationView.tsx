import React, { useState } from 'react';
import { BookOpen, Code, Terminal, Network, Shield, ChevronRight, Zap, Play } from 'lucide-react';

interface DocSectionProps {
  id: string;
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}

const DocSection = ({ id, title, icon, children }: DocSectionProps) => (
  <section id={id} className="mb-20 scroll-mt-28">
    <div className="flex items-center gap-3 mb-6">
      <div className="w-10 h-10 rounded-xl bg-zinc-800/50 border border-white/10 flex items-center justify-center text-zinc-300 shadow-inner">
        {icon}
      </div>
      <h2 className="text-3xl font-medium text-zinc-100 tracking-tight">{title}</h2>
    </div>
    <div className="space-y-6 text-zinc-400 font-light leading-relaxed">
      {children}
    </div>
  </section>
);

interface DocumentationViewProps {
  onInit: () => void;
}

export const DocumentationView = ({ onInit }: DocumentationViewProps) => {
  const [activeTab, setActiveTab] = useState('getting-started');

  const scrollToTab = (id: string) => {
    setActiveTab(id);
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="pt-20 min-h-screen bg-[#030303] flex flex-col md:flex-row relative">
      {/* Sidebar Navigation */}
      <aside className="w-full md:w-64 lg:w-80 flex-shrink-0 border-r border-white/5 bg-[#050505]/80 backdrop-blur-xl md:sticky md:top-20 md:h-[calc(100vh-5rem)] overflow-y-auto p-6 z-10 hidden md:block">
        <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-6 px-3">Documentation</h3>
        <nav className="space-y-1">
          {[
            { id: 'getting-started', label: 'Getting Started', icon: <Play className="w-4 h-4" /> },
            { id: 'architecture', label: 'Architecture', icon: <Network className="w-4 h-4" /> },
            { id: 'nodes', label: 'Node Types', icon: <Code className="w-4 h-4" /> },
            { id: 'security', label: 'State & Security', icon: <Shield className="w-4 h-4" /> },
            { id: 'api', label: 'API Reference', icon: <Terminal className="w-4 h-4" /> }
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => scrollToTab(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 text-left ${
                activeTab === item.id 
                  ? 'bg-zinc-800/50 text-white shadow-inner border border-white/5' 
                  : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.02]'
              }`}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </nav>
        
        <div className="mt-12 px-3">
          <div className="bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border border-indigo-500/20 rounded-xl p-4">
            <h4 className="text-white text-sm font-medium mb-2 flex items-center gap-2">
              <Zap className="w-4 h-4 text-indigo-400" />
              Ready to build?
            </h4>
            <p className="text-zinc-400 text-xs mb-4">Start orchestrating autonomous agents in minutes.</p>
            <button onClick={onInit} className="w-full bg-white text-black text-xs font-bold py-2 rounded-lg hover:bg-zinc-200 transition-colors">
              Initialize Engine
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 max-w-4xl px-6 md:px-12 lg:px-20 py-12">
        <div className="mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-white tracking-tight mb-6">AgenticFlow Platform Docs</h1>
          <p className="text-xl text-zinc-500 font-light">The comprehensive guide to building, deploying, and managing multi-agent neuro-orchestration pipelines.</p>
        </div>

        <DocSection id="getting-started" title="Getting Started" icon={<BookOpen />}>
          <p>
            AgenticFlow is a visual orchestration engine that allows you to connect multiple large language models, APIs, and functional nodes into a single, cohesive reasoning pipeline. 
            Unlike traditional monolithic agent frameworks, AgenticFlow utilizes the <strong className="text-zinc-200">Double Diamond Architecture</strong>, dividing work into distinct phases:
          </p>
          <ul className="list-disc pl-6 space-y-2 mt-4 text-zinc-400">
            <li><strong className="text-zinc-200">Discovery Phase:</strong> Information gathering, search agents, and context retrieval.</li>
            <li><strong className="text-zinc-200">Synthesis Phase:</strong> Structuring data, extracting schemas, and normalizing context.</li>
            <li><strong className="text-zinc-200">Generation Phase:</strong> Creative task execution, code generation, or heavy reasoning.</li>
            <li><strong className="text-zinc-200">Delivery Phase:</strong> Final formatting, API dispatches, or webhook executions.</li>
          </ul>
          <div className="bg-zinc-900 border border-white/10 rounded-xl p-6 mt-6">
            <h4 className="text-zinc-200 font-medium mb-2">Quick Start Guide</h4>
            <ol className="list-decimal pl-5 space-y-2 text-sm text-zinc-400">
              <li>Click <strong>Initialize Engine</strong> in the top right to access the Dashboard.</li>
              <li>Create a new <strong>Project Space</strong> to organize your workflows.</li>
              <li>Click <strong>Create Flow</strong> to open the Visual Builder Canvas.</li>
              <li>Type a prompt into the pipeline bar, or drag and drop nodes from the sidebar.</li>
            </ol>
          </div>
        </DocSection>

        <DocSection id="architecture" title="Architecture" icon={<Network />}>
          <p>
            The AgenticFlow Engine is designed around a reactive, event-driven node graph. Every action you take on the visual canvas is cryptographically mapped to an internal JSON state object.
          </p>
          <p>
            When a pipeline is executed, the backend <code>DoubleDiamondExecutor</code> computes a Directed Acyclic Graph (DAG) to determine the optimal parallelization strategy. Nodes that do not depend on each other are executed concurrently, significantly reducing total sequence time.
          </p>
          <div className="mt-4 overflow-hidden rounded-xl border border-white/5 bg-[#0A0A0A] p-1">
            <img src="https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=1200&q=80" alt="Architecture Graph" className="w-full h-64 object-cover rounded-lg opacity-60 mix-blend-luminosity hover:opacity-80 transition-opacity" />
          </div>
        </DocSection>

        <DocSection id="nodes" title="Node Types" icon={<Code />}>
          <p>The canvas supports a variety of specialized nodes designed for distinct agentic tasks.</p>
          <div className="grid sm:grid-cols-2 gap-4 mt-6">
            {[
              { name: 'LLM Reasoning Node', desc: 'Core reasoning engine. Configure temperature, system prompts, and model selection (GPT-4o, Claude 3.5).' },
              { name: 'Web Search Node', desc: 'Performs semantic searches across the internet to gather real-time context before synthesis.' },
              { name: 'Tool Execution Node', desc: 'Executes Python or JavaScript functions safely in an isolated sandbox environment.' },
              { name: 'Condition Node', desc: 'Branches the pipeline based on regex matching or intelligent LLM evaluation.' }
            ].map((node, i) => (
              <div key={i} className="p-5 rounded-xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.04] transition-colors">
                <h4 className="text-zinc-200 font-medium mb-1 tracking-tight">{node.name}</h4>
                <p className="text-xs text-zinc-500 leading-relaxed">{node.desc}</p>
              </div>
            ))}
          </div>
        </DocSection>

        <DocSection id="security" title="State & Security" icon={<Shield />}>
          <p>
            Security is a first-class citizen in AgenticFlow. All pipeline states, API keys, and execution telemetry are stored securely.
          </p>
          <ul className="list-disc pl-6 space-y-3 mt-4">
            <li>
              <strong className="text-zinc-200 block mb-1">In-Memory State Compute</strong>
              During execution, agent states and memory buffers are kept purely in-memory. They are only persisted to the database upon explicit completion or checkpointing.
            </li>
            <li>
              <strong className="text-zinc-200 block mb-1">Encrypted Key Management</strong>
              User API keys (OpenAI, Anthropic, etc.) are encrypted at rest using AES-256-GCM. They are injected into the execution context just-in-time and are never exposed to the client interface.
            </li>
          </ul>
        </DocSection>

        <DocSection id="api" title="API Reference (Beta)" icon={<Terminal />}>
          <p>
            AgenticFlow provides a RESTful API to trigger your visual pipelines programmatically.
          </p>
          <div className="bg-black border border-white/10 rounded-xl overflow-hidden mt-6">
            <div className="flex items-center gap-2 px-4 py-3 border-b border-white/10 bg-zinc-900/50">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-500/80"></div>
                <div className="w-3 h-3 rounded-full bg-green-500/80"></div>
              </div>
              <span className="text-xs font-mono text-zinc-500 ml-2">POST /api/v1/execute</span>
            </div>
            <div className="p-4 overflow-x-auto text-sm font-mono text-zinc-300">
              <pre className="text-emerald-400">curl <span className="text-zinc-300">-X POST https://api.agenticflow.com/v1/execute \</span></pre>
              <pre className="text-zinc-300">  -H <span className="text-amber-300">"Authorization: Bearer YOUR_API_KEY"</span> \</pre>
              <pre className="text-zinc-300">  -H <span className="text-amber-300">"Content-Type: application/json"</span> \</pre>
              <pre className="text-zinc-300">  -d <span className="text-amber-300">'{'{'}"sequence_id": "seq_123456", "inputs": {'{'} "query": "Optimize my supply chain" {'}'}{'}'}'</span></pre>
            </div>
          </div>
        </DocSection>
      </main>
    </div>
  );
};
