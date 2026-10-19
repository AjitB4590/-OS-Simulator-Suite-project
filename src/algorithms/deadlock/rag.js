/**
 * Resource Allocation Graph (RAG) Analysis and Cycle Detection.
 *
 * IDEA:
 * Models processes and resources as a directed bipartite graph.
 * - Request edge (Pi -> Rj): Process Pi is waiting for resource Rj.
 * - Assignment edge (Rj -> Pi): An instance of Rj is allocated to Pi.
 *
 * THEOREM (Holt 1972):
 * - If graph has NO cycle => NO deadlock.
 * - If graph has a cycle AND all resources in cycle have 1 instance => DEADLOCK.
 * - If graph has a cycle AND some resources have >1 instance => POSSIBLE DEADLOCK.
 *
 * TIME COMPLEXITY: O(V + E) using Depth-First Search (DFS).
 */

/**
 * Validates RAG structure and semantic consistency.
 * @param {{ nodes: Array<{ id: string, type: string, instances?: number }>, edges: Array<{ from: string, to: string, type: string }> }} graph
 * @returns {string[]} Validation errors
 */
export function validateGraph(graph) {
  const errors = [];
  if (!graph?.nodes || !Array.isArray(graph.nodes)) return ['Graph must contain a nodes array.'];

  const nodeMap = new Map(graph.nodes.map((n) => [n.id, n]));

  // Check instance counts
  for (const node of graph.nodes) {
    if (node.type === 'resource') {
      const inst = node.instances ?? 1;
      if (!Number.isInteger(inst) || inst < 1) {
        errors.push(`Resource ${node.label || node.id} instances must be a positive integer.`);
      }
    }
  }

  const assignmentCounts = new Map();

  for (const edge of graph.edges || []) {
    const fromNode = nodeMap.get(edge.from);
    const toNode = nodeMap.get(edge.to);

    if (!fromNode || !toNode) {
      errors.push(`Edge connects unknown node ID: ${edge.from} -> ${edge.to}`);
      continue;
    }

    if (edge.type === 'request') {
      if (fromNode.type !== 'process' || toNode.type !== 'resource') {
        errors.push(`Invalid request edge ${fromNode.label} -> ${toNode.label}: must be Process -> Resource.`);
      }
    } else if (edge.type === 'assignment') {
      if (fromNode.type !== 'resource' || toNode.type !== 'process') {
        errors.push(`Invalid assignment edge ${fromNode.label} -> ${toNode.label}: must be Resource -> Process.`);
      }
      assignmentCounts.set(edge.from, (assignmentCounts.get(edge.from) || 0) + 1);
    }
  }

  // Check resource assignment limits
  for (const [resId, count] of assignmentCounts.entries()) {
    const res = nodeMap.get(resId);
    if (res && count > (res.instances ?? 1)) {
      errors.push(`Resource ${res.label || resId} has ${count} assignments exceeding its capacity (${res.instances ?? 1}).`);
    }
  }

  return errors;
}

/**
 * Detects directed cycles in the graph using 3-color DFS.
 * @param {{ nodes: Array<{ id: string }>, edges: Array<{ from: string, to: string }> }} graph
 * @returns {{ hasCycle: boolean, cycleNodes: string[], cycleEdges: Array<{ from: string, to: string }> }}
 */
export function detectCycle(graph) {
  const adj = new Map();
  for (const node of graph.nodes || []) adj.set(node.id, []);
  for (const edge of graph.edges || []) {
    if (adj.has(edge.from)) adj.get(edge.from).push(edge.to);
  }

  const state = new Map(); // 0 = unvisited, 1 = visiting, 2 = visited
  for (const node of graph.nodes || []) state.set(node.id, 0);

  const stack = [];
  let foundCycle = null;

  function dfs(u) {
    state.set(u, 1);
    stack.push(u);

    for (const v of adj.get(u) || []) {
      if (state.get(v) === 1) {
        // Back edge found => cycle identified
        const cycleStartIndex = stack.indexOf(v);
        foundCycle = stack.slice(cycleStartIndex);
        return true;
      }
      if (state.get(v) === 0) {
        if (dfs(v)) return true;
      }
    }

    stack.pop();
    state.set(u, 2);
    return false;
  }

  for (const node of graph.nodes || []) {
    if (state.get(node.id) === 0) {
      if (dfs(node.id)) break;
    }
  }

  if (!foundCycle) return { hasCycle: false, cycleNodes: [], cycleEdges: [] };

  const cycleNodes = foundCycle;
  const cycleEdges = [];
  for (let i = 0; i < cycleNodes.length; i++) {
    const from = cycleNodes[i];
    const to = cycleNodes[(i + 1) % cycleNodes.length];
    cycleEdges.push({ from, to });
  }

  return { hasCycle: true, cycleNodes, cycleEdges };
}

/**
 * Evaluates deadlock status based on graph topology and resource instance counts.
 * @param {{ nodes: any[], edges: any[] }} graph
 */
export function analyzeDeadlock(graph) {
  const validationErrors = validateGraph(graph);
  if (validationErrors.length > 0) {
    return { status: 'error', message: validationErrors.join('; '), cycleNodes: [], cycleEdges: [] };
  }

  const { hasCycle, cycleNodes, cycleEdges } = detectCycle(graph);
  if (!hasCycle) {
    return {
      status: 'no-cycle',
      message: 'No circular wait (cycle) detected. The system is provably free of deadlock.',
      cycleNodes: [],
      cycleEdges: [],
    };
  }

  const nodeMap = new Map(graph.nodes.map((n) => [n.id, n]));
  const cycleResources = cycleNodes.map((id) => nodeMap.get(id)).filter((n) => n?.type === 'resource');
  const allSingleInstance = cycleResources.every((r) => (r.instances ?? 1) === 1);

  const cyclePath = cycleNodes.map((id) => nodeMap.get(id)?.label || id).join(' → ') +
    ' → ' + (nodeMap.get(cycleNodes[0])?.label || cycleNodes[0]);

  if (allSingleInstance) {
    return {
      status: 'deadlock',
      message: 'Deadlock confirmed: A directed cycle was found where all involved resources are single-instance.',
      cycleNodes,
      cycleEdges,
      cyclePath,
    };
  }

  return {
    status: 'possible-deadlock',
    message: 'Possible deadlock: Cycle detected involving multi-instance resource(s). Cycle is a necessary but not sufficient condition.',
    cycleNodes,
    cycleEdges,
    cyclePath,
  };
}
