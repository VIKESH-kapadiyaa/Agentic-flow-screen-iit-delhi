import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation } from 'react-router-dom';
import { 
  Sparkles, LayoutDashboard, PlusSquare, FolderOpen, 
  Layers, Play, Webhook, Save, ArrowRight, X, Rocket
} from 'lucide-react';

const ONBOARDING_KEY = 'agentic_onboarding_completed';
const ONBOARDING_STEP_KEY = 'agentic_onboarding_step';

// ── Color Class Maps to Avoid Inline Styles ──
const ACCENT_COLORS = {
  purple: '#A259FF',
  blue: '#46B1FF',
  green: '#DEF767',
};

const TEXT_CLASSES: Record<string, string> = {
  [ACCENT_COLORS.purple]: 'text-[#A259FF]',
  [ACCENT_COLORS.blue]: 'text-[#46B1FF]',
  [ACCENT_COLORS.green]: 'text-[#DEF767]',
};

const PROGRESS_CLASSES: Record<string, string> = {
  [ACCENT_COLORS.purple]: 'from-[#A259FF] to-[#A259FF]',
  [ACCENT_COLORS.blue]: 'from-[#46B1FF] to-[#A259FF]',
  [ACCENT_COLORS.green]: 'from-[#DEF767] to-[#A259FF]',
};

const TOPBAR_CLASSES: Record<string, string> = {
  [ACCENT_COLORS.purple]: 'from-[#A259FF] to-[#A259FF]/60',
  [ACCENT_COLORS.blue]: 'from-[#46B1FF] to-[#46B1FF]/60',
  [ACCENT_COLORS.green]: 'from-[#DEF767] to-[#DEF767]/60',
};

const ICON_WRAPPER_CLASSES: Record<string, string> = {
  [ACCENT_COLORS.purple]: 'from-[#A259FF]/30 to-[#A259FF]/10 border-[#A259FF]/30',
  [ACCENT_COLORS.blue]: 'from-[#46B1FF]/30 to-[#46B1FF]/10 border-[#46B1FF]/30',
  [ACCENT_COLORS.green]: 'from-[#DEF767]/30 to-[#DEF767]/10 border-[#DEF767]/30',
};

const BUTTON_CLASSES: Record<string, string> = {
  [ACCENT_COLORS.purple]: 'from-[#A259FF] to-[#A259FF]/80 text-white shadow-[#A259FF]/40',
  [ACCENT_COLORS.blue]: 'from-[#46B1FF] to-[#46B1FF]/80 text-white shadow-[#46B1FF]/40',
  [ACCENT_COLORS.green]: 'from-[#DEF767] to-[#DEF767]/80 text-black shadow-[#DEF767]/40',
};

// ── Tour Step Definitions ──
const TOUR_STEPS = [
  {
    id: 'welcome',
    icon: <Sparkles size={24} />,
    title: 'Welcome to AgenticFlow',
    subtitle: 'Your AI Workflow Command Center',
    description: 'Let\'s take a quick tour to get you up and running. We\'ll show you how to build, connect, and deploy AI agent workflows — all from one powerful interface.',
    accentColor: ACCENT_COLORS.purple,
    route: '/dashboard',
    target: null,
  },
  {
    id: 'dashboard',
    icon: <LayoutDashboard size={24} />,
    title: 'The Dashboard',
    subtitle: 'Your Mission Control',
    description: 'This is your home base. Every workflow you create appears here as a session card. You can search, star, organize into folders, and pick up right where you left off.',
    accentColor: ACCENT_COLORS.blue,
    route: '/dashboard',
    target: null,
  },
  {
    id: 'folders',
    icon: <FolderOpen size={24} />,
    title: 'Organize with Folders',
    subtitle: 'Keep things tidy',
    description: 'Create Project Spaces in the sidebar to organize your workflows. Long-press any session card and drag it into a folder. Simple, clean, and scalable.',
    accentColor: ACCENT_COLORS.blue,
    route: '/dashboard',
    target: '[data-tour="folders-sidebar"]',
    placement: 'right'
  },
  {
    id: 'create-flow',
    icon: <PlusSquare size={24} />,
    title: 'Create a Flow',
    subtitle: 'Start building in one click',
    description: 'Hit the "Create Flow" button to create a fresh canvas and enter the Builder — where the magic happens.',
    accentColor: ACCENT_COLORS.green,
    route: '/dashboard',
    target: '[data-tour="create-flow-btn"]',
    placement: 'bottom-start',
    onNext: () => { 
      const btn = document.querySelector('[data-tour="create-flow-btn"]') as HTMLButtonElement;
      if (btn) btn.click();
      else window.location.href = '/canvas';
    }
  },
  {
    id: 'builder',
    icon: <Layers size={24} />,
    title: 'The Builder Canvas',
    subtitle: 'Drag, Drop, Connect',
    description: 'On the canvas, use the bottom toolbar to add Agent Blocks. Each block represents an AI worker. Drag them around, resize them, and wire them together.',
    accentColor: ACCENT_COLORS.purple,
    route: '/canvas',
    target: null,
  },
  {
    id: 'add-agent',
    icon: <PlusSquare size={24} />,
    title: 'Add Agents',
    subtitle: 'Deploy AI workers',
    description: 'Click here to spawn a new Agent block onto the canvas. You can configure its prompt, model, and triggers in the sidebar.',
    accentColor: ACCENT_COLORS.purple,
    route: '/canvas',
    target: '[data-tour="add-agent-btn"]',
    placement: 'top'
  },
  {
    id: 'webhook',
    icon: <Webhook size={24} />,
    title: 'Webhook Bridges',
    subtitle: 'Connect different workflows',
    description: 'Use Webhook Bridge blocks to link separate workflows together. Select which workflow to connect to, and data flows seamlessly between them — just like n8n.',
    accentColor: ACCENT_COLORS.blue,
    route: '/canvas',
    target: '[data-tour="add-webhook-btn"]',
    placement: 'top'
  },
  {
    id: 'pipeline',
    icon: <Play size={24} />,
    title: 'Run the Pipeline',
    subtitle: 'Execute your flow',
    description: 'Switch to Pipeline view to type your project goal and hit Execute. Each agent processes your task in sequence.',
    accentColor: ACCENT_COLORS.green,
    route: '/canvas',
    target: '[data-tour="pipeline-toggle"]',
    placement: 'bottom'
  },
  {
    id: 'ready',
    icon: <Rocket size={24} />,
    title: 'You\'re All Set!',
    subtitle: 'Go build something extraordinary',
    description: 'That\'s everything you need to know. The future of automation is in your hands.',
    accentColor: ACCENT_COLORS.green,
    route: '/canvas',
    target: null,
  },
];

function useTargetRect(selector: string | null) {
  const [rect, setRect] = useState<DOMRect | null>(null);

  useEffect(() => {
    if (!selector) {
      setRect(null);
      return;
    }
    
    let lastRectStr = '';

    const updateRect = () => {
      const el = document.querySelector(selector);
      if (el) {
        const newRect = el.getBoundingClientRect();
        // Round values to prevent micro-fluctuation loops
        const roundedRect = {
          x: Math.round(newRect.x),
          y: Math.round(newRect.y),
          width: Math.round(newRect.width),
          height: Math.round(newRect.height),
          top: Math.round(newRect.top),
          right: Math.round(newRect.right),
          bottom: Math.round(newRect.bottom),
          left: Math.round(newRect.left)
        };
        const currentRectStr = JSON.stringify(roundedRect);
        
        if (currentRectStr !== lastRectStr) {
          lastRectStr = currentRectStr;
          // Return a mock DOMRect object with the properties
          setRect(roundedRect as any);
        }
      } else {
        if (lastRectStr !== 'null') {
          lastRectStr = 'null';
          setRect(null);
        }
      }
    };
    
    updateRect();
    window.addEventListener('resize', updateRect);
    window.addEventListener('scroll', updateRect, true);
    const observer = new MutationObserver(updateRect);
    observer.observe(document.body, { childList: true, subtree: true, attributes: true });

    return () => {
      window.removeEventListener('resize', updateRect);
      window.removeEventListener('scroll', updateRect, true);
      observer.disconnect();
    };
  }, [selector]);

  return rect;
}

function getModalPosition(rect: DOMRect | null, placement: string = 'center') {
  if (!rect || placement === 'center') {
    return { top: '50%', left: '50%', x: '-50%', y: '-50%' };
  }

  const padding = 24;
  const modalWidth = 380; // approximate width

  switch (placement) {
    case 'right':
      return { top: rect.top + rect.height / 2, left: rect.right + padding, y: '-50%', x: 0 };
    case 'left':
      return { top: rect.top + rect.height / 2, left: rect.left - padding - modalWidth, y: '-50%', x: 0 };
    case 'bottom-start':
      // Align right edge to target's right edge
      return { top: rect.bottom + padding, left: Math.max(20, rect.right - modalWidth), y: 0, x: 0 };
    case 'bottom':
      return { top: rect.bottom + padding, left: rect.left + rect.width / 2, y: 0, x: '-50%' };
    case 'top':
      return { top: rect.top - padding, left: rect.left + rect.width / 2, y: '-100%', x: '-50%' };
    default:
      return { top: '50%', left: '50%', x: '-50%', y: '-50%' };
  }
}

interface OnboardingTourProps {
  onComplete: () => void;
  user?: any;
}

export default function OnboardingTour({ onComplete, user }: OnboardingTourProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const location = useLocation(); // Hook to force re-render on route change

  useEffect(() => {
    if (!user) return;
    const userStepKey = `${ONBOARDING_STEP_KEY}_${user.id}`;
    const savedStep = localStorage.getItem(userStepKey);
    if (savedStep) {
      setCurrentStep(parseInt(savedStep, 10));
    }
  }, [user]);

  const stepIndex = Math.min(Math.max(0, currentStep), TOUR_STEPS.length - 1);
  const step = TOUR_STEPS[stepIndex]!;
  const isLast = stepIndex >= TOUR_STEPS.length - 1;
  const progress = ((stepIndex + 1) / TOUR_STEPS.length) * 100;

  const targetRect = useTargetRect(step.target);

  // Auto-advance or sync step if route changes unexpectedly
  useEffect(() => {
    const currentRoute = window.location.pathname;
    if (step.route !== currentRoute) {
      // Find the first step that matches the new route
      const matchingStepIndex = TOUR_STEPS.findIndex(s => s.route === currentRoute);
      if (matchingStepIndex !== -1 && matchingStepIndex !== stepIndex) {
        setCurrentStep(matchingStepIndex);
        if (user) {
          const userStepKey = `${ONBOARDING_STEP_KEY}_${user.id}`;
          localStorage.setItem(userStepKey, matchingStepIndex.toString());
        }
      }
    }
  }, [step.route, stepIndex]);

  // If the step belongs to a different route, don't render the tour card right now.
  // The effect above will sync it shortly.
  if (window.location.pathname !== step.route) {
    return null;
  }

  const handleNext = () => {
    if (isLast) {
      handleComplete();
    } else {
      const nextStep = stepIndex + 1;
      setCurrentStep(nextStep);
      if (user) {
        const userStepKey = `${ONBOARDING_STEP_KEY}_${user.id}`;
        localStorage.setItem(userStepKey, nextStep.toString());
      }
      if (step.onNext) step.onNext();
    }
  };

  const handleSkip = () => {
    handleComplete();
  };

  const handleComplete = () => {
    localStorage.setItem(ONBOARDING_KEY, 'true');
    localStorage.removeItem(ONBOARDING_STEP_KEY);
    onComplete();
  };

  const modalPos = getModalPosition(targetRect, step.placement);

  return (
    <>
      {/* Dynamic SVG Mask Overlay */}
      <svg className="fixed inset-0 z-[190] w-full h-full pointer-events-auto">
        <defs>
          <mask id="tour-mask">
            <rect x="0" y="0" width="100%" height="100%" fill="white" />
            {targetRect && (
              <motion.rect
                fill="black"
                rx={12}
                initial={false}
                animate={{
                  x: targetRect.left - 8,
                  y: targetRect.top - 8,
                  width: targetRect.width + 16,
                  height: targetRect.height + 16,
                }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              />
            )}
          </mask>
        </defs>
        {/* Background layer */}
        <motion.rect 
          x="0" y="0" width="100%" height="100%" 
          fill="rgba(5,5,7,0.9)" 
          mask="url(#tour-mask)" 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        />
        
        {/* Optional glowing outline around the cutout */}
        {targetRect && (
           <motion.rect
             fill="none"
             stroke={step.accentColor}
             strokeWidth={2}
             rx={12}
             initial={false}
             animate={{
               x: targetRect.left - 8,
               y: targetRect.top - 8,
               width: targetRect.width + 16,
               height: targetRect.height + 16,
               opacity: 0.8
             }}
             transition={{ type: 'spring', stiffness: 300, damping: 30 }}
           />
        )}
      </svg>

      {/* Main Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9, ...modalPos }}
        animate={{ opacity: 1, scale: 1, ...modalPos }}
        exit={{ opacity: 0, scale: 0.9 }}
        transition={{ type: 'spring', stiffness: 350, damping: 35 }}
        className="fixed z-[200] max-w-[380px] w-full mx-auto"
      >
        {/* Progress Bar */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-500">
              {stepIndex + 1} of {TOUR_STEPS.length}
            </span>
            <button
              onClick={handleSkip}
              className="text-[9px] font-bold uppercase tracking-wider text-slate-500 hover:text-white transition-colors flex items-center gap-1.5"
            >
              <X size={10} /> Skip Tour
            </button>
          </div>
          <div className="h-1 bg-white/[0.06] rounded-full overflow-hidden">
            <motion.div
              className={`h-full rounded-full bg-gradient-to-r ${PROGRESS_CLASSES[step.accentColor]}`}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
            />
          </div>
        </div>

        {/* Step Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={step.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="bg-[#0c0c14]/90 backdrop-blur-3xl border border-white/[0.06] rounded-[24px] p-6 shadow-[0_30px_80px_rgba(0,0,0,0.8)] relative overflow-hidden"
          >
            {/* Gradient accent top bar */}
            <div 
              className={`absolute top-0 left-0 right-0 h-1 rounded-t-[24px] bg-gradient-to-r ${TOPBAR_CLASSES[step.accentColor]}`}
            />

            {/* Header: Icon + Titles */}
            <div className="flex gap-4 mb-4">
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.1 }}
                className={`w-12 h-12 shrink-0 rounded-xl flex items-center justify-center shadow-2xl bg-gradient-to-br border border-solid ${ICON_WRAPPER_CLASSES[step.accentColor]}`}
              >
                <div className={TEXT_CLASSES[step.accentColor]}>
                  {step.icon}
                </div>
              </motion.div>
              
              <div className="pt-1">
                <h2 className="text-xl font-black text-white font-display tracking-tight leading-none mb-1">
                  {step.title}
                </h2>
                <p className={`text-[10px] font-bold uppercase tracking-[0.15em] ${TEXT_CLASSES[step.accentColor]}`}>
                  {step.subtitle}
                </p>
              </div>
            </div>

            {/* Description */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-[13px] text-slate-300 leading-relaxed font-secondary mb-6"
            >
              {step.description}
            </motion.p>

            {/* Action Buttons */}
            <div className="flex items-center justify-between">
              <div className="flex gap-1.5">
                 {TOUR_STEPS.map((_, i) => (
                    <motion.div
                      key={i}
                      className="rounded-full transition-all"
                      animate={{
                        width: i === stepIndex ? 16 : 4,
                        height: 4,
                        backgroundColor: i === stepIndex ? step.accentColor : 'rgba(255,255,255,0.08)',
                      }}
                      transition={{ duration: 0.3 }}
                    />
                  ))}
              </div>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleNext}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-black text-[11px] uppercase tracking-widest transition-all shadow-xl bg-gradient-to-br ${
                  isLast 
                    ? 'from-[#DEF767] to-[#A259FF] text-black shadow-[#DEF767]/40' 
                    : BUTTON_CLASSES[step.accentColor]
                }`}
              >
                {isLast ? (
                  <>
                    <Rocket size={14} /> Start
                  </>
                ) : (
                  <>
                    Next <ArrowRight size={14} />
                  </>
                )}
              </motion.button>
            </div>
          </motion.div>
        </AnimatePresence>
      </motion.div>
    </>
  );
}

import { useAuth } from '../lib/auth';

export function useOnboardingStatus() {
  const [showOnboarding, setShowOnboarding] = useState(false);
  const location = useLocation();
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return; // Don't show tour if no user is logged in
    
    const userOnboardingKey = `${ONBOARDING_KEY}_${user.id}`;
    const completed = localStorage.getItem(userOnboardingKey);
    
    if (!completed) {
      // Small delay so elements mount before querying rects
      const timer = setTimeout(() => setShowOnboarding(true), 500);
      return () => clearTimeout(timer);
    } else {
      setShowOnboarding(false);
    }
  }, [location.pathname, user]);

  const completeOnboarding = () => {
    if (!user) return;
    const userOnboardingKey = `${ONBOARDING_KEY}_${user.id}`;
    const userStepKey = `${ONBOARDING_STEP_KEY}_${user.id}`;
    
    setShowOnboarding(false);
    localStorage.setItem(userOnboardingKey, 'true');
    localStorage.removeItem(userStepKey);
  };

  return { showOnboarding, completeOnboarding, user };
}
