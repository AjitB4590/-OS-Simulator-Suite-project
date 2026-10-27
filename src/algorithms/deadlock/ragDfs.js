/**
 * 3-Color DFS Cycle Detection Simulation for Resource Allocation Graphs.
 * Provides discrete step-by-step playback tracing active nodes, outgoing edges,
 * DFS stack evolution, node coloring (white/gray/black), and cycle identification.
 */

import { analyzeDeadlock, validateGraph } from './rag.js';

/**
 * Executes step-by-step DFS cycle detection on a Resource Allocation Graph.
 *
 * @param {{ nodes: Array<{ id: string, type: string, label?: string, instances?: number }>, edges: Array<{ from: string, to: string }> }} graph
 * @returns {{
 *   steps: Array<{
 *     index: number,
 *     title: string,
 *     explanation: string,
 *     highlight: {
 *       activeNode: string | null,
 *       activeEdge: { from: string, to: string } | null,
 *       stack: string[],
 *       colorMap: Record<string, 'white' | 'gray' | 'black'>,
 *       cycleNodes: string[],
 *       cycleEdges: Array<{ from: string, to: string }>
 *     },
 *     snapshot: any
 *   }>,
 *   hasCycle: boolean,
 *   cycleNodes: string[],
 *   cycleEdges: Array<{ from: string, to: string }>,
 *   analysis: any
 * }}
 */
export function simulateRagDfs(graph) {
  const errors = validateGraph(graph);
  if (errors.length > 0) {
    return {
      steps: [
        {
          index: 0,
          title: 'Graph Validation Error',
          explanation: errors.join('; '),
          highlight: { activeNode: null, activeEdge: null, stack: [], colorMap: {}, cycleNodes: [], cycleEdges: [] },
          snapshot: { graph, status: 'error' },
        },
      ],
      hasCycle: false,
      cycleNodes: [],
      cycleEdges: [],
      analysis: { status: 'error', message: errors.join('; ') },
    };
  }

  const nodes = graph?.nodes || [];
  const edges = graph?.edges || [];
  const nodeMap = new Map(nodes.map((n) => [n.id, n]));
  const label = (id) => nodeMap.get(id)?.label || id;

  const adj = new Map();
  nodes.forEach((n) => adj.set(n.id, []));
  edges.forEach((e) => {
    if (adj.has(e.from)) adj.get(e.from).push(e.to);
  });

  const colorMap = {};
  nodes.forEach((n) => {
    colorMap[n.id] = 'white';
  });

  const stack = [];
  const steps = [];
  let foundCycle = null;

  // Step 0: Initialization
  steps.push({
    index: 0,
    title: 'DFS Initialization',
    explanation: '3-Color Depth-First Search initialized. All nodes colored WHITE (unvisited). DFS stack is empty.',
    highlight: {
      activeNode: null,
      activeEdge: null,
      stack: [],
      colorMap: { ...colorMap },
      cycleNodes: [],
      cycleEdges: [],
    },
    snapshot: { stack: [], colorMap: { ...colorMap } },
  });

  function dfs(u) {
    colorMap[u] = 'gray';
    stack.push(u);

    steps.push({
      index: steps.length,
      title: `Visit Node ${label(u)} (Pushed to Stack)`,
      explanation: `Node ${label(u)} colored GRAY (currently in active DFS path). DFS stack: [${stack.map(label).join(', ')}].`,
      highlight: {
        activeNode: u,
        activeEdge: null,
        stack: [...stack],
        colorMap: { ...colorMap },
        cycleNodes: [],
        cycleEdges: [],
      },
      snapshot: { stack: [...stack], colorMap: { ...colorMap } },
    });

    for (const v of adj.get(u) || []) {
      steps.push({
        index: steps.length,
        title: `Explore Edge ${label(u)} ➔ ${label(v)}`,
        explanation: `Checking edge from ${label(u)} to ${label(v)}. Target node ${label(v)} is currently ${colorMap[v].toUpperCase()}.`,
        highlight: {
          activeNode: u,
          activeEdge: { from: u, to: v },
          stack: [...stack],
          colorMap: { ...colorMap },
          cycleNodes: [],
          cycleEdges: [],
        },
        snapshot: { stack: [...stack], colorMap: { ...colorMap } },
      });

      if (colorMap[v] === 'gray') {
        const cycleStartIndex = stack.indexOf(v);
        foundCycle = stack.slice(cycleStartIndex);
        const cycleEdges = [];
        for (let i = 0; i < foundCycle.length; i++) {
          cycleEdges.push({ from: foundCycle[i], to: foundCycle[(i + 1) % foundCycle.length] });
        }

        steps.push({
          index: steps.length,
          title: `Back Edge Discovered: ${label(u)} ➔ ${label(v)}`,
          explanation: `Back edge points to ancestor ${label(v)} currently in DFS stack. Circular wait detected: ${foundCycle.map(label).join(' ➔ ')} ➔ ${label(v)}!`,
          highlight: {
            activeNode: u,
            activeEdge: { from: u, to: v },
            stack: [...stack],
            colorMap: { ...colorMap },
            cycleNodes: foundCycle,
            cycleEdges,
          },
          snapshot: { stack: [...stack], colorMap: { ...colorMap } },
        });

        return true;
      }

      if (colorMap[v] === 'white') {
        if (dfs(v)) return true;
      }
    }

    stack.pop();
    colorMap[u] = 'black';

    steps.push({
      index: steps.length,
      title: `Finish Node ${label(u)} (Popped from Stack)`,
      explanation: `All outgoing edges from ${label(u)} fully explored. Node colored BLACK (done). Popped from stack.`,
      highlight: {
        activeNode: u,
        activeEdge: null,
        stack: [...stack],
        colorMap: { ...colorMap },
        cycleNodes: [],
        cycleEdges: [],
      },
      snapshot: { stack: [...stack], colorMap: { ...colorMap } },
    });

    return false;
  }

  for (const node of nodes) {
    if (colorMap[node.id] === 'white') {
      if (dfs(node.id)) break;
    }
  }

  const analysis = analyzeDeadlock(graph);
  const cycleNodes = foundCycle || [];
  const cycleEdges = [];
  if (foundCycle) {
    for (let i = 0; i < foundCycle.length; i++) {
      cycleEdges.push({ from: foundCycle[i], to: foundCycle[(i + 1) % foundCycle.length] });
    }
  }

  // Final Conclusion Step
  steps.push({
    index: steps.length,
    title: analysis.hasCycle || foundCycle ? `Cycle Result: ${analysis.status.toUpperCase()}` : 'Cycle Detection Complete: No Deadlock',
    explanation: analysis.message,
    highlight: {
      activeNode: null,
      activeEdge: null,
      stack: [],
      colorMap: { ...colorMap },
      cycleNodes,
      cycleEdges,
      status: analysis.status,
    },
    snapshot: { stack: [], colorMap: { ...colorMap }, analysis },
  });

  return {
    steps,
    hasCycle: Boolean(foundCycle),
    cycleNodes,
    cycleEdges,
    analysis,
  };
}
