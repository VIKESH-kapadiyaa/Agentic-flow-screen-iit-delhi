// Helper to enforce canonical node IDs
export const createNodeId = (phaseId, categoryId) => `${phaseId}::${categoryId}`;

export const TOOL_REGISTRY = {
  // Phase 1: Discover
  "perplexity": {
    id: "perplexity",
    name: "Perplexity",
    description: "Market research, competitive research, refined web search.",
    pricing: "freemium",
    audience: ["researcher", "strategist", "designer"],
    tags: ["search", "market analysis"]
  },
  "notebooklm": {
    id: "notebooklm",
    name: "NotebookLM",
    description: "Search across research papers, PDFs, and surveys.",
    pricing: "free",
    audience: ["researcher"],
    tags: ["data synthesis"]
  },
  "microsoft-clarity": {
    id: "microsoft-clarity",
    name: "Microsoft Clarity",
    description: "Generates heatmaps, session recordings and behavioral insights.",
    pricing: "free",
    audience: ["designer", "developer", "pm"],
    tags: ["analytics", "behavior"]
  },
  "hotjar": {
    id: "hotjar",
    name: "Hotjar",
    description: "Behavior analytics tool with heatmaps, recordings, and feedback.",
    pricing: "paid",
    audience: ["designer", "developer"],
    tags: ["analytics", "behavior", "feedback"]
  },
  "mixpanel": {
    id: "mixpanel",
    name: "Mixpanel",
    description: "Product analytics to track user interactions.",
    pricing: "paid",
    audience: ["pm", "developer"],
    tags: ["analytics", "product"]
  },
  "google-forms": {
    id: "google-forms",
    name: "Google Forms with Gemini",
    description: "Survey creation and analysis powered by AI.",
    pricing: "free",
    audience: ["researcher", "pm"],
    tags: ["surveys", "feedback"]
  },
  "grok": {
    id: "grok",
    name: "Grok",
    description: "Deep learning and realtime topic research.",
    pricing: "paid",
    audience: ["researcher", "strategist"],
    tags: ["search", "realtime"]
  },
  "notion-ai": {
    id: "notion-ai",
    name: "Notion AI",
    description: "Transforms research into structured knowledge (personas, JTBD, problem statements).",
    pricing: "paid",
    audience: ["pm", "researcher", "designer"],
    tags: ["documentation", "knowledge"]
  },
  "miro-ai": {
    id: "miro-ai",
    name: "Miro AI",
    description: "Collaborative whiteboard for mapping user journeys and navigation flows.",
    pricing: "paid",
    audience: ["designer", "pm", "team"],
    tags: ["whiteboard", "mapping", "collaboration"]
  },

  // Phase 2: Define
  "flowmapp": {
    id: "flowmapp",
    name: "FlowMapp",
    description: "Creates user flows, sitemaps, and navigation structures.",
    pricing: "paid",
    audience: ["designer", "architect"],
    tags: ["sitemap", "user flow"]
  },
  "ux-pilot": {
    id: "ux-pilot",
    name: "UX Pilot",
    description: "Supports ideation, wireframing, high-fidelity designs, and code. Heatmaps.",
    pricing: "paid",
    audience: ["designer"],
    tags: ["wireframing", "ideation", "ai"]
  },
  "relume-ai": {
    id: "relume-ai",
    name: "Relume AI",
    description: "Fast start components, Figma and Webflow compatibility.",
    pricing: "paid",
    audience: ["designer", "developer"],
    tags: ["components", "webflow", "figma"]
  },

  // Phase 3: Develop
  "uizard": {
    id: "uizard",
    name: "Uizard",
    description: "Converts text, sketches, or screenshots into editable UI flows.",
    pricing: "freemium",
    audience: ["designer", "pm", "beginner"],
    tags: ["ui", "prototyping", "wireframing"]
  },
  "claude": {
    id: "claude",
    name: "Claude",
    description: "Advanced reasoning, long-context understanding, and structured writing.",
    pricing: "freemium",
    audience: ["designer", "developer", "researcher"],
    tags: ["text", "reasoning", "writing"]
  },
  "flux-2-pro": {
    id: "flux-2-pro",
    name: "FLUX.2 Pro",
    description: "Photorealistic image generation with strong lighting and visual depth.",
    pricing: "paid",
    audience: ["designer", "artist"],
    tags: ["image generation", "art"]
  },
  "nano-banana": {
    id: "nano-banana",
    name: "Nano Banana",
    description: "AI image model focused on logical accuracy, object placement, and consistency.",
    pricing: "freemium",
    audience: ["designer"],
    tags: ["image generation", "consistency"]
  },
  "framer-ai": {
    id: "framer-ai",
    name: "Framer AI",
    description: "Generates interactive UI with animations, transitions, and behaviors.",
    pricing: "freemium",
    audience: ["designer", "developer"],
    tags: ["ui", "animation", "prototyping"]
  },

  // Phase 4: Deliver
  "chatgpt": {
    id: "chatgpt",
    name: "ChatGPT",
    description: "Instant feedback on usability, design structure, and UX principles.",
    pricing: "freemium",
    audience: ["everyone"],
    tags: ["feedback", "review", "text"]
  },
  "maze": {
    id: "maze",
    name: "Maze",
    description: "Prototype testing with real users, behavioral data collection.",
    pricing: "paid",
    audience: ["designer", "researcher"],
    tags: ["testing", "analytics", "users"]
  },
  "adobe-firefly": {
    id: "adobe-firefly",
    name: "Adobe Firefly",
    description: "Generates and maintains consistent visual styles aligned with brand identity.",
    pricing: "paid",
    audience: ["designer", "marketing"],
    tags: ["branding", "image generation"]
  },
  "usertesting": {
    id: "usertesting",
    name: "UserTesting",
    description: "Professional UX platform testing with real users globally.",
    pricing: "paid",
    audience: ["researcher", "designer"],
    tags: ["testing", "users", "video"]
  }
};

export const UX_CATEGORIES = {
  // Phase 1 (5 nodes)
  "reviews": { id: "reviews", name: "Reviews", description: "Extracts reviews from websites and Reddit", tools: ["perplexity"], order: 0 },
  "observations": { id: "observations", name: "Observations", description: "Search across research papers, PDFs", tools: ["notebooklm", "microsoft-clarity"], order: 1 },
  "primary-research": { id: "primary-research", name: "Primary Research", description: "Heatmaps, analytics, and user sessions", tools: ["hotjar", "mixpanel", "google-forms"], order: 2 },
  "secondary-research": { id: "secondary-research", name: "Secondary Research", description: "Market research and competitive analysis", tools: ["grok", "perplexity"], order: 3 },
  "technology-channels": { id: "technology-channels", name: "Tech & Channels", description: "Transforms research into structured knowledge", tools: ["notion-ai", "miro-ai"], order: 4 },

  // Phase 2 (3 nodes)
  "ux-flow": { id: "ux-flow", name: "UX Flow Mapping", description: "Sitemaps and user journey planning", tools: ["flowmapp", "ux-pilot", "miro-ai"], order: 0 },
  "persuasion": { id: "persuasion", name: "Persuasion Tools", description: "Brainstorming and structuring insights", tools: ["ux-pilot"], order: 1 },
  "architecture": { id: "architecture", name: "Architecture", description: "Information architecture and components", tools: ["flowmapp", "relume-ai"], order: 2 },

  // Phase 3 (4 nodes)
  "screens": { id: "screens", name: "Screens", description: "Wireframing and UI generation flows", tools: ["uizard"], order: 0 },
  "images-text": { id: "images-text", name: "Images & Texts", description: "Generating cohesive visual and textual assets", tools: ["claude", "flux-2-pro", "nano-banana"], order: 1 },
  "interactions": { id: "interactions", name: "Interactions", description: "Interactive UI with animations/transitions", tools: ["framer-ai"], order: 2 },
  "navigations": { id: "navigations", name: "Navigations", description: "Sitemaps and navigation structures", tools: ["flowmapp", "miro-ai"], order: 3 },

  // Phase 4 (4 nodes)
  "expert-review": { id: "expert-review", name: "Expert Review", description: "Feedback on usability and structure", tools: ["chatgpt", "claude"], order: 0 },
  "usability-test": { id: "usability-test", name: "Usability Test", description: "Prototype testing with behavioral data", tools: ["maze", "hotjar", "microsoft-clarity"], order: 1 },
  "brand-test": { id: "brand-test", name: "Brand Test", description: "Visual style consistency and identity", tools: ["adobe-firefly"], order: 2 },
  "ux-test": { id: "ux-test", name: "UX Test", description: "Predictive heatmaps and human testing", tools: ["usertesting", "ux-pilot", "microsoft-clarity"], order: 3 },
};

export const WORKFLOW_PHASES = [
  {
    id: "discover",
    label: "DISCOVER",
    subtitle: "DIVERGE",
    type: "diverge",
    order: 0,
    categories: ["reviews", "observations", "primary-research", "secondary-research", "technology-channels"]
  },
  {
    id: "define",
    label: "DEFINE",
    subtitle: "CONVERGE",
    type: "converge",
    order: 1,
    categories: ["ux-flow", "persuasion", "architecture"]
  },
  {
    id: "develop",
    label: "DEVELOP",
    subtitle: "DIVERGE",
    type: "diverge",
    order: 2,
    categories: ["screens", "images-text", "interactions", "navigations"]
  },
  {
    id: "deliver",
    label: "DELIVER",
    subtitle: "CONVERGE",
    type: "converge",
    order: 3,
    categories: ["expert-review", "usability-test", "brand-test", "ux-test"]
  }
];

// Explicit Edges defining the paths through the graph to form the Double Diamond
export const EDGES = [
  // Discover -> Define Integrations
  { from: "discover::reviews", to: "define::ux-flow" },
  { from: "discover::observations", to: "define::ux-flow" },
  { from: "discover::primary-research", to: "define::persuasion" },
  { from: "discover::secondary-research", to: "define::architecture" },
  { from: "discover::technology-channels", to: "define::architecture" },
  { from: "discover::primary-research", to: "define::ux-flow" },

  // Define -> Develop Integrations (Bridge)
  { from: "define::ux-flow", to: "develop::navigations" },
  { from: "define::ux-flow", to: "develop::screens" },
  { from: "define::persuasion", to: "develop::images-text" },
  { from: "define::architecture", to: "develop::screens" },
  { from: "define::architecture", to: "develop::interactions" },

  // Develop -> Deliver Integrations
  { from: "develop::navigations", to: "deliver::ux-test" },
  { from: "develop::screens", to: "deliver::usability-test" },
  { from: "develop::images-text", to: "deliver::brand-test" },
  { from: "develop::interactions", to: "deliver::usability-test" },
  { from: "develop::screens", to: "deliver::expert-review" },
];
