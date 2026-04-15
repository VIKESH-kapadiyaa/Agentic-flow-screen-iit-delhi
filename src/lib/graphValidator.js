import { UX_CATEGORIES, WORKFLOW_PHASES, EDGES, TOOL_REGISTRY, createNodeId } from '../data/schema';

class GraphValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = 'GraphValidationError';
  }
}

export const validateGraph = () => {
  const nodeIds = new Set();
  const graph = {};

  // 1. Validate Phases & Categories (Check for existence and ID construction)
  WORKFLOW_PHASES.forEach((phase) => {
    phase.categories.forEach((catId) => {
      if (!UX_CATEGORIES[catId]) {
        throw new GraphValidationError(`Phase ${phase.id} references undefined category ${catId}`);
      }
      const nodeId = createNodeId(phase.id, catId);
      if (nodeIds.has(nodeId)) {
        throw new GraphValidationError(`Duplicate Node ID detected: ${nodeId}`);
      }
      nodeIds.add(nodeId);
      graph[nodeId] = []; // Initialize adjacency list

      // Validate tools exist
      UX_CATEGORIES[catId].tools.forEach((toolId) => {
        if (!TOOL_REGISTRY[toolId]) {
          throw new GraphValidationError(`Category ${catId} references undefined tool: ${toolId}`);
        }
      });
    });
  });

  // 2. Validate Edges (Check for orphaned or invalid references)
  EDGES.forEach((edge) => {
    if (!nodeIds.has(edge.from)) {
      throw new GraphValidationError(`Edge originates from unknown node: ${edge.from}`);
    }
    if (!nodeIds.has(edge.to)) {
      throw new GraphValidationError(`Edge targets unknown node: ${edge.to}`);
    }
    
    // Add to adjacency list for DAG cycle check
    graph[edge.from].push(edge.to);
  });

  // 3. Cycle Detection (Enforce DAG)
  const visited = new Set();
  const recStack = new Set();

  const isCyclic = (node) => {
    if (!visited.has(node)) {
      visited.add(node);
      recStack.add(node);

      for (const neighbor of graph[node]) {
        if (!visited.has(neighbor) && isCyclic(neighbor)) {
          return true;
        } else if (recStack.has(neighbor)) {
          console.error(`Cycle detected involving node ${neighbor}`);
          return true;
        }
      }
    }
    recStack.delete(node);
    return false;
  };

  for (const node of nodeIds) {
    if (!visited.has(node) && isCyclic(node)) {
      throw new GraphValidationError('Cycle detected! Graph must be a Directed Acyclic Graph (DAG).');
    }
  }

  // If we reach here, the graph is structurally sound.
  return true;
};
