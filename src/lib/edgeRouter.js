/**
 * Computes a smooth Bezier curve between two coordinates.
 * Includes support for edge bundling offsets to avoid overlapping SVG wires.
 */
export const computeEdgePath = (fromPos, toPos, routeConfig = { type: 'curve', offsetIndex: 0 }) => {
  const { x: x1, y: y1 } = fromPos;
  const { x: x2, y: y2 } = toPos;

  // The horizontal distance
  const deltaX = x2 - x1;

  // Base control point tension
  let tension = deltaX * 0.45;

  // Apply visual offset for bundles (pushing control points vertically)
  // This physically separates bezier curves that travel similar distances
  const bundleOffset = routeConfig.offsetIndex * 15; // 15px step per bundled edge
  const directedOffset = (routeConfig.offsetIndex % 2 === 0 ? 1 : -1) * bundleOffset;

  // Control points
  const cp1x = x1 + tension;
  const cp1y = y1 + directedOffset;
  
  const cp2x = x2 - tension;
  const cp2y = y2 + directedOffset;

  return `M ${x1},${y1} C ${cp1x},${cp1y} ${cp2x},${cp2y} ${x2},${y2}`;
};

/**
 * Pre-processes schema EDGES to assign offsetIndexes to parallel/bundled wires.
 */
export const bundleEdges = (edges) => {
  const bundles = {};
  
  const processedEdges = edges.map((edge) => {
    // A bundle is defined by the Phase transition: e.g. "discover->define"
    const fromPhase = edge.from.split('::')[0];
    const toPhase = edge.to.split('::')[0];
    const bundleId = `${fromPhase}->${toPhase}`;

    if (bundles[bundleId] === undefined) {
      bundles[bundleId] = 0;
    }

    const offsetIndex = bundles[bundleId]++;
    
    return {
      ...edge,
      routeConfig: {
        type: 'curve',
        offsetIndex
      }
    };
  });

  return processedEdges;
};
