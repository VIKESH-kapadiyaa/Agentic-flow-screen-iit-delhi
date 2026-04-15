// ── Double Diamond Agent Framework ──────────────────────────────────
// 16 agents across 4 phases: Discover → Define → Develop → Deliver
// Each phase forms a diamond shape on the infinite canvas.

export const NODE_WIDTH = 140;
export const NODE_HEIGHT = 140;

export const AGENTS = [
  // ═══════════════════════════════════════════════
  // PHASE 1: DISCOVER (Diverge)
  // ═══════════════════════════════════════════════
  {
    id: 'reviews',
    name: 'Reviews',
    phase: 1,
    phaseName: 'Discover',
    icon: 'Search',
    diamondPos: 'left',
    x: 40, y: 310,
    description: 'Analyze existing feedback & ratings',
    systemPrompt: 'Analyzes reviews...',
  },
  {
    id: 'observations',
    name: 'Observations',
    phase: 1,
    phaseName: 'Discover',
    icon: 'Eye',
    diamondPos: 'top',
    x: 300, y: 80,
    description: 'Study user behavior patterns',
    systemPrompt: 'Studies behavior...',
  },
  {
    id: 'primaryResearch',
    name: 'Primary Research',
    phase: 1,
    phaseName: 'Discover',
    icon: 'Users',
    diamondPos: 'bottom',
    x: 300, y: 540,
    description: 'Conduct interviews & surveys',
    systemPrompt: 'Conducts research...',
  },
  {
    id: 'deskResearch',
    name: 'Desk Research',
    phase: 1,
    phaseName: 'Discover',
    icon: 'BookOpen',
    diamondPos: 'right',
    x: 560, y: 310,
    description: 'Analyze market & competitor data',
    systemPrompt: 'Market analysis...',
  },

  // ═══════════════════════════════════════════════
  // PHASE 2: DEFINE (Converge)
  // ═══════════════════════════════════════════════
  {
    id: 'personas',
    name: 'Personas',
    phase: 2,
    phaseName: 'Define',
    icon: 'User',
    diamondPos: 'left',
    x: 820, y: 310,
    description: 'Build detailed user archetypes',
    systemPrompt: 'Creates personas...',
  },
  {
    id: 'userJourney',
    name: 'User Journey',
    phase: 2,
    phaseName: 'Define',
    icon: 'Compass',
    diamondPos: 'top',
    x: 1080, y: 80,
    description: 'Map touchpoints & emotions',
    systemPrompt: 'Maps journeys...',
  },
  {
    id: 'problemStatement',
    name: 'Problem Statement',
    phase: 2,
    phaseName: 'Define',
    icon: 'Target',
    diamondPos: 'bottom',
    x: 1080, y: 540,
    description: 'Define core HMW challenges',
    systemPrompt: 'Defines problems...',
  },
  {
    id: 'insights',
    name: 'Insights',
    phase: 2,
    phaseName: 'Define',
    icon: 'Lightbulb',
    diamondPos: 'right',
    x: 1340, y: 310,
    description: 'Distill actionable patterns',
    systemPrompt: 'Distills insights...',
  },

  // ═══════════════════════════════════════════════
  // PHASE 3: DEVELOP (Diverge)
  // ═══════════════════════════════════════════════
  {
    id: 'ideation',
    name: 'Ideation',
    phase: 3,
    phaseName: 'Develop',
    icon: 'Sparkles',
    diamondPos: 'left',
    x: 1600, y: 310,
    description: 'Generate creative solutions',
    systemPrompt: 'Generates ideas...',
  },
  {
    id: 'architecture',
    name: 'Architecture',
    phase: 3,
    phaseName: 'Develop',
    icon: 'Layers',
    diamondPos: 'top',
    x: 1860, y: 80,
    description: 'Design info hierarchy & nav',
    systemPrompt: 'Designs IA...',
  },
  {
    id: 'prototyping',
    name: 'Prototyping',
    phase: 3,
    phaseName: 'Develop',
    icon: 'Box',
    diamondPos: 'bottom',
    x: 1860, y: 540,
    description: 'Build rapid interactive demos',
    systemPrompt: 'Creates prototypes...',
  },
  {
    id: 'visualDesign',
    name: 'Visual Design',
    phase: 3,
    phaseName: 'Develop',
    icon: 'Palette',
    diamondPos: 'right',
    x: 2120, y: 310,
    description: 'Create the visual system',
    systemPrompt: 'Creates visual design...',
  },

  // ═══════════════════════════════════════════════
  // PHASE 4: DELIVER (Converge)
  // ═══════════════════════════════════════════════
  {
    id: 'testing',
    name: 'Testing',
    phase: 4,
    phaseName: 'Deliver',
    icon: 'ShieldCheck',
    diamondPos: 'left',
    x: 2380, y: 310,
    description: 'Validate with real users',
    systemPrompt: 'Performs testing...',
  },
  {
    id: 'iteration',
    name: 'Iteration',
    phase: 4,
    phaseName: 'Deliver',
    icon: 'RefreshCw',
    diamondPos: 'top',
    x: 2640, y: 80,
    description: 'Refine based on feedback',
    systemPrompt: 'Iterates design...',
  },
  {
    id: 'documentation',
    name: 'Documentation',
    phase: 4,
    phaseName: 'Deliver',
    icon: 'FileText',
    diamondPos: 'bottom',
    x: 2640, y: 540,
    description: 'Create specs & handoff docs',
    systemPrompt: 'Creates documentation...',
  },
  {
    id: 'deployment',
    name: 'Deployment',
    phase: 4,
    phaseName: 'Deliver',
    icon: 'Rocket',
    diamondPos: 'right',
    x: 2900, y: 310,
    description: 'Ship to production edge',
    systemPrompt: 'Deploys product...',
  },
];

// ── Wire Connections ────────────────────────────────────────────────
// Each diamond: top → left, top → right, left → bottom, right → bottom
// Between diamonds: bottom.right → next-top.left
export const WIRE_CONNECTIONS = [
  // Diamond 1: Discover
  { from: 'reviews', to: 'observations', fromPort: 'top', toPort: 'bottom' },
  { from: 'reviews', to: 'primaryResearch', fromPort: 'bottom', toPort: 'top' },
  { from: 'observations', to: 'deskResearch', fromPort: 'bottom', toPort: 'top' },
  { from: 'primaryResearch', to: 'deskResearch', fromPort: 'top', toPort: 'bottom' },

  // Bridge: Phase 1 → 2
  { from: 'deskResearch', to: 'personas', fromPort: 'right', toPort: 'left' },

  // Diamond 2: Define
  { from: 'personas', to: 'userJourney', fromPort: 'top', toPort: 'bottom' },
  { from: 'personas', to: 'problemStatement', fromPort: 'bottom', toPort: 'top' },
  { from: 'userJourney', to: 'insights', fromPort: 'bottom', toPort: 'top' },
  { from: 'problemStatement', to: 'insights', fromPort: 'top', toPort: 'bottom' },

  // Bridge: Phase 2 → 3
  { from: 'insights', to: 'ideation', fromPort: 'right', toPort: 'left' },

  // Diamond 3: Develop
  { from: 'ideation', to: 'architecture', fromPort: 'top', toPort: 'bottom' },
  { from: 'ideation', to: 'prototyping', fromPort: 'bottom', toPort: 'top' },
  { from: 'architecture', to: 'visualDesign', fromPort: 'bottom', toPort: 'top' },
  { from: 'prototyping', to: 'visualDesign', fromPort: 'top', toPort: 'bottom' },

  // Bridge: Phase 3 → 4
  { from: 'visualDesign', to: 'testing', fromPort: 'right', toPort: 'left' },

  // Diamond 4: Deliver
  { from: 'testing', to: 'iteration', fromPort: 'top', toPort: 'bottom' },
  { from: 'testing', to: 'documentation', fromPort: 'bottom', toPort: 'top' },
  { from: 'iteration', to: 'deployment', fromPort: 'bottom', toPort: 'top' },
  { from: 'documentation', to: 'deployment', fromPort: 'top', toPort: 'bottom' },
];

// ── Execution Order ─────────────────────────────────────────────────
// Each sub-array runs in parallel, then the next sub-array starts.
// The LLM call happens at the 'visualDesign' step.
export const EXECUTION_ORDER = [
  // Phase 1: Discover
  ['reviews'],
  ['observations', 'primaryResearch'],
  ['deskResearch'],
  // Phase 2: Define
  ['personas'],
  ['userJourney', 'problemStatement'],
  ['insights'],
  // Phase 3: Develop (LLM call at visualDesign)
  ['ideation'],
  ['architecture', 'prototyping'],
  ['visualDesign'],
  // Phase 4: Deliver
  ['testing'],
  ['iteration', 'documentation'],
  ['deployment'],
];

// ── Phase Labels ────────────────────────────────────────────────────
export const PHASE_LABELS = [
  { name: 'DISCOVER', x: 300, y: 310, phase: 1, subtitle: 'Diverge' },
  { name: 'DEFINE', x: 1080, y: 310, phase: 2, subtitle: 'Converge' },
  { name: 'DEVELOP', x: 1860, y: 310, phase: 3, subtitle: 'Diverge' },
  { name: 'DELIVER', x: 2640, y: 310, phase: 4, subtitle: 'Converge' },
];

// ── Geometry Helpers ────────────────────────────────────────────────
export function getPortPosition(agent, port) {
  switch (port) {
    case 'top':
      return { x: agent.x + NODE_WIDTH / 2, y: agent.y };
    case 'bottom':
      return { x: agent.x + NODE_WIDTH / 2, y: agent.y + NODE_HEIGHT };
    case 'left':
      return { x: agent.x, y: agent.y + NODE_HEIGHT / 2 };
    case 'right':
      return { x: agent.x + NODE_WIDTH, y: agent.y + NODE_HEIGHT / 2 };
    default:
      return { x: agent.x + NODE_WIDTH / 2, y: agent.y + NODE_HEIGHT / 2 };
  }
}

export function getWirePath(fromPos, toPos, fromPort, toPort) {
  if (fromPort === 'bottom' && toPort === 'top') {
    const dy = Math.abs(toPos.y - fromPos.y);
    const cp = dy * 0.5;
    return `M ${fromPos.x},${fromPos.y} C ${fromPos.x},${fromPos.y + cp} ${toPos.x},${toPos.y - cp} ${toPos.x},${toPos.y}`;
  }
  if (fromPort === 'right' && toPort === 'left') {
    const dx = Math.abs(toPos.x - fromPos.x);
    const cp = dx * 0.4;
    return `M ${fromPos.x},${fromPos.y} C ${fromPos.x + cp},${fromPos.y} ${toPos.x - cp},${toPos.y} ${toPos.x},${toPos.y}`;
  }
  return `M ${fromPos.x},${fromPos.y} L ${toPos.x},${toPos.y}`;
}
