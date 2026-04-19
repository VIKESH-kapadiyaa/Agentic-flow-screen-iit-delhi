import { UX_CATEGORIES } from '../data/schema';

// Explicit literal mapping for the 16 nodes to geometrically form Two Diamonds.
// Diamond 1 (0 -> 800)
// Diamond 2 (1000 -> 1800)
const DIAMOND_COORDS = {
  // --- DIAMOND 1: DISCOVER (Diverging) ---
  "discover::reviews": { x: 0, y: 0, colIndex: 0 },
  "discover::observations": { x: 250, y: -180, colIndex: 1 },
  "discover::primary-research": { x: 250, y: 180, colIndex: 1 },
  "discover::secondary-research": { x: 500, y: -360, colIndex: 2 },
  "discover::technology-channels": { x: 500, y: 360, colIndex: 2 },
  
  // --- DIAMOND 1: DEFINE (Converging) ---
  "define::architecture": { x: 750, y: -180, colIndex: 3 },
  "define::persuasion": { x: 750, y: 180, colIndex: 3 },
  "define::ux-flow": { x: 1000, y: 0, colIndex: 4 }, // Hub Node

  // --- DIAMOND 2: DEVELOP (Diverging) ---
  "develop::screens": { x: 1250, y: -180, colIndex: 5 },
  "develop::images-text": { x: 1250, y: 180, colIndex: 5 },
  "develop::interactions": { x: 1500, y: -360, colIndex: 6 },
  "develop::navigations": { x: 1500, y: 360, colIndex: 6 },

  // --- DIAMOND 2: DELIVER (Converging) ---
  "deliver::expert-review": { x: 1750, y: -180, colIndex: 7 },
  "deliver::usability-test": { x: 1750, y: 180, colIndex: 7 },
  "deliver::brand-test": { x: 2000, y: -360, colIndex: 8 }, // Tapered off angle
  "deliver::ux-test": { x: 2000, y: 0, colIndex: 8 }, // Final Convergence point
};

// eslint-disable-next-line no-unused-vars
export const computeLayout = (_mode = 'desktop', _containerWidth, containerHeight) => {
  const nodeRegistry = {};
  
  const h = containerHeight || 800;
  const centerY = h / 2;

  // Render exactly the hardcoded visual diamond.
  Object.keys(DIAMOND_COORDS).forEach((nodeId) => {
    const coords = DIAMOND_COORDS[nodeId];
    const catId = nodeId.split('::')[1];
    const phaseId = nodeId.split('::')[0];

    nodeRegistry[nodeId] = {
      id: nodeId,
      x: coords.x + 300, // global X shift
      y: centerY + coords.y,
      phase: phaseId,
      category: UX_CATEGORIES[catId],
      colIndex: coords.colIndex
    };
  });

  return nodeRegistry;
};
