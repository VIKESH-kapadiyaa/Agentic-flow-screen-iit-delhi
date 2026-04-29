import React from 'react';
import { Workflow, Layers, Terminal } from 'lucide-react';

// eslint-disable-next-line no-unused-vars
const FeatureCard = ({ icon: Icon, title, description, image }) => (
  <div className="bg-[#0A0A0A] border border-white/5 rounded-3xl hover:bg-zinc-900/50 hover:border-white/10 transition-all duration-500 group relative overflow-hidden flex flex-col">
    {image && (
      <div className="w-full h-48 overflow-hidden border-b border-white/5 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#0A0A0A] z-10"></div>
        <img src={image} alt={title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 opacity-60 group-hover:opacity-100 mix-blend-luminosity" />
      </div>
    )}
    <div className="p-8 flex-1 relative z-20">
      <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-[50px] opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
      <div className="w-12 h-12 rounded-xl bg-zinc-800/50 border border-white/10 flex items-center justify-center mb-8 group-hover:scale-105 transition-transform duration-500 shadow-lg">
        <Icon className="w-5 h-5 text-zinc-300" />
      </div>
      <h3 className="text-xl font-medium text-zinc-100 mb-3 tracking-tight">{title}</h3>
      <p className="text-zinc-500 text-sm leading-relaxed font-light">{description}</p>
    </div>
  </div>
);

export const Features = () => (
  <section id="features" className="pt-40 pb-40 px-6 bg-[#030303] border-y border-white/5 relative z-20 w-full flex flex-col">
    <div className="max-w-7xl mx-auto w-full">
      <div className="text-center mb-24">
        <h2 className="text-3xl font-medium text-zinc-100 mb-5 tracking-tight">Precision at every node</h2>
        <p className="text-zinc-500 max-w-2xl mx-auto font-light text-lg">Build sophisticated reasoning structures from Discovery to Delivery without the overhead of scaffolding code.</p>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <FeatureCard 
          icon={Workflow}
          title="Visual Node Architecture"
          description="Construct logic flows via an elegant canvas. Map inputs, outputs, and intricate dependencies without visual clutter."
          image="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80"
        />
        <FeatureCard 
          icon={Layers}
          title="Isolated Project Spaces"
          description="Segment your orchestrations into secure, dedicated environments optimized for Marketing, Engineering, or R&D."
          image="https://images.unsplash.com/photo-1614729939124-032f0b56c9ce?auto=format&fit=crop&w=800&q=80"
        />
        <FeatureCard 
          icon={Terminal}
          title="Granular Configuration"
          description="Absolute control over every agent. Parameterize API keys, precise delays, and foundational system prompts seamlessly."
          image="https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=800&q=80"
        />
      </div>
    </div>
  </section>
);
