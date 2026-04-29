import React from 'react';
import { Check, Zap } from 'lucide-react';

const PricingCard = ({ title, price, description, features, isPremium, buttonText, onAction }) => (
  <div className={`relative p-8 rounded-3xl bg-[#0A0A0A] border ${isPremium ? 'border-zinc-400 shadow-[0_0_30px_rgba(255,255,255,0.05)] mt-4 md:mt-0' : 'border-white/5'} flex flex-col h-full group hover:border-white/20 transition-colors duration-500`}>
    {isPremium && (
      <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-zinc-100 text-zinc-900 text-[0.65rem] font-bold px-4 py-1.5 rounded-full uppercase tracking-widest shadow-lg z-10 whitespace-nowrap">
        Enterprise Standard
      </div>
    )}
    <div className="mb-8 mt-2">
      <h3 className="text-xl font-medium text-zinc-100 mb-2">{title}</h3>
      <p className="text-zinc-500 text-sm font-light h-10">{description}</p>
    </div>
    <div className="mb-8 flex items-baseline gap-2">
      <span className="text-4xl font-bold text-zinc-100 tracking-tight">{price}</span>
      {price !== 'Free' && <span className="text-zinc-500 text-sm">/ month</span>}
    </div>
    <ul className="space-y-4 mb-10 flex-1">
      {features.map((feature, i) => (
        <li key={i} className="flex items-start gap-3">
          <div className="mt-0.5 w-5 h-5 rounded-full bg-white/5 border border-white/10 flex items-center justify-center flex-shrink-0 group-hover:bg-zinc-800 transition-colors">
            <Check className="w-3 h-3 text-zinc-300" />
          </div>
          <span className="text-zinc-400 text-sm font-light leading-relaxed">{feature}</span>
        </li>
      ))}
    </ul>
    <div className="mt-auto">
      <button onClick={onAction} className={`w-full py-3.5 rounded-xl text-sm font-bold tracking-wide transition-all ${isPremium ? 'bg-zinc-100 text-zinc-900 hover:bg-white hover:scale-[1.02]' : 'bg-white/5 text-zinc-100 border border-white/10 hover:bg-white/10'}`}>
        {buttonText}
      </button>
    </div>
  </div>
);

export const Pricing = ({ onInit }) => (
  <section id="pricing" className="pt-48 pb-48 px-6 bg-[#030303] relative z-20 border-t border-white/5 w-full flex flex-col">
    <div className="max-w-7xl mx-auto w-full">
      <div className="text-center mb-24">
        <h2 className="text-3xl font-medium text-zinc-100 mb-5 tracking-tight">Scale your neural infrastructure</h2>
        <p className="text-zinc-500 max-w-2xl mx-auto font-light text-lg">Predictable pricing designed for ambitious engineering teams. No hidden compute fees.</p>
      </div>

      {/* Trial Banner */}
      <div className="max-w-4xl mx-auto mb-32 bg-gradient-to-r from-zinc-900/50 to-[#0A0A0A] border border-white/10 rounded-2xl p-10 flex flex-col md:flex-row items-center justify-between shadow-2xl relative overflow-hidden group hover:border-white/20 transition-all duration-500">
        <div className="absolute top-0 right-0 w-64 h-64 bg-zinc-400/5 rounded-full blur-[60px] pointer-events-none"></div>
        <div className="flex flex-col md:flex-row items-center gap-6 mb-8 md:mb-0 relative z-10 w-full text-center md:text-left">
          <div className="w-12 h-12 rounded-full bg-zinc-100/10 border border-zinc-100/20 flex items-center justify-center flex-shrink-0">
            <Zap className="w-5 h-5 text-zinc-100 fill-zinc-100/20" />
          </div>
          <div className="flex-1">
            <h3 className="text-xl font-bold text-zinc-100 mb-1 tracking-tight">Be a Trial User</h3>
            <p className="text-zinc-400 font-light text-sm max-w-md mx-auto md:mx-0">Get full premium access completely free for two months. Just register your account and start orchestrating immediately.</p>
          </div>
          <div className="mt-8 md:mt-0 flex-shrink-0">
            <button onClick={onInit} className="whitespace-nowrap bg-zinc-100 hover:bg-white text-zinc-950 font-bold px-6 py-3 rounded-xl transition-all shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:scale-105">
              Start 2-Month Free Trial
            </button>
          </div>
        </div>
      </div>

      {/* Pricing Grid */}
      <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto mt-12 items-stretch">
        <PricingCard 
          title="Free"
          price="Free"
          description="For individuals exploring neural orchestration."
          features={[
            "5 new workflows per month",
            "1 week of agent memory persistence",
            "Standard execution speed",
            "Community Discord support",
            "Basic analytics dashboard"
          ]}
          isPremium={false}
          buttonText="Start for Free"
          onAction={onInit}
        />
        <PricingCard 
          title="Basic"
          price="299/-"
          description="For small teams deploying active agents."
          features={[
            "20 workflows per month",
            "7 weeks of memory per workflow",
            "Priority node processing",
            "Custom system prompts",
            "Email support (24h SLA)"
          ]}
          isPremium={false}
          buttonText="Choose Basic"
          onAction={onInit}
        />
        <PricingCard 
          title="Premium"
          price="599/-"
          description="For enterprise-scale autonomous pipelines."
          features={[
            "Unlimited workflows & executions",
            "Persistent, all-time memory storage",
            "Dedicated compute clusters",
            "Advanced multi-agent routing",
            "24/7 Priority engineering support"
          ]}
          isPremium={true}
          buttonText="Upgrade to Premium"
          onAction={onInit}
        />
      </div>
    </div>
  </section>
);
