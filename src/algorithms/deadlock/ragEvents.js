/**
 * Resource Allocation Graph (RAG) Dynamic Event Simulation Engine.
 * Pure algorithm simulator for discrete graph transitions (requests, grants, releases).
 * Evaluates live cycle detection and Holt's Theorem status after each discrete event.
 */

import { analyzeDeadlock } from './rag.js';

/**
 * Executes step-by-step event simulation on a RAG.
 *
 * @param {{ nodes: Array<{ id: string, type: string, label?: string, instances?: number, x?: number, y?: number }>, edges: Array<{ from: string, to: string, type: string }> }} initialGraph
 * @param {Array<{ type: 'request' | 'grant' | 'release', from: string, to: string, description?: string }>} events
 * @returns {{
 *   steps: Array<{
 *     index: number,
 *     title: string,
 *     explanation: string,
 *     highlight: any,
 *     snapshot: { graph: any, analysis: any, event: any }
 *   }>,
 *   finalGraph: any,
 *   finalAnalysis: any
 * }}
 */
export function simulateRagEvents(initialGraph, events = []) {
  const currentNodes = (initialGraph?.nodes || []).map((n) => ({ ...n }));
  let currentEdges = (initialGraph?.edges || []).map((e) => ({ ...e }));
  const nodeMap = new Map(currentNodes.map((n) => [n.id, n]));

  const label = (id) => nodeMap.get(id)?.label || id;

  const cloneGraph = () => ({
    nodes: currentNodes.map((n) => ({ ...n })),
    edges: currentEdges.map((e) => ({ ...e })),
  });

  const steps = [];

  // Step 0: Baseline State
  const initialAnalysis = analyzeDeadlock(cloneGraph());
  steps.push({
    index: 0,
    title: 'Initial Graph Baseline',
    explanation: `Graph loaded with ${currentNodes.length} nodes and ${currentEdges.length} edges. Initial status: ${initialAnalysis.status.toUpperCase()}.`,
    highlight: {
      affectedNodes: [],
      cycleNodes: initialAnalysis.cycleNodes,
      cycleEdges: initialAnalysis.cycleEdges,
      status: initialAnalysis.status,
    },
    snapshot: {
      graph: cloneGraph(),
      analysis: initialAnalysis,
      event: null,
    },
  });

  // Apply discrete events
  events.forEach((evt, idx) => {
    let explanationText = '';

    if (evt.type === 'request') {
      // Process -> Resource request edge
      const exists = currentEdges.some((e) => e.from === evt.from && e.to === evt.to && e.type === 'request');
      if (!exists) {
        currentEdges.push({ from: evt.from, to: evt.to, type: 'request' });
      }
      explanationText = `${label(evt.from)} issued a request for ${label(evt.to)}. Directed request edge ${label(evt.from)} ➔ ${label(evt.to)} added.`;
    } else if (evt.type === 'grant') {
      // Resource -> Process assignment edge (removes corresponding request edge)
      currentEdges = currentEdges.filter((e) => !(e.from === evt.to && e.to === evt.from && e.type === 'request'));
      const exists = currentEdges.some((e) => e.from === evt.from && e.to === evt.to && e.type === 'assignment');
      if (!exists) {
        currentEdges.push({ from: evt.from, to: evt.to, type: 'assignment' });
      }
      explanationText = `${label(evt.from)} allocated an available instance to ${label(evt.to)}. Assignment edge ${label(evt.from)} ➔ ${label(evt.to)} established.`;
    } else if (evt.type === 'release') {
      // Process releases held Resource instance
      currentEdges = currentEdges.filter(
        (e) => !((e.from === evt.to && e.to === evt.from) || (e.from === evt.from && e.to === evt.to))
      );
      explanationText = `${label(evt.from)} released ${label(evt.to)}. Resource instance returned to the available pool.`;
    }

    const currentGraphSnapshot = cloneGraph();
    const currentAnalysis = analyzeDeadlock(currentGraphSnapshot);

    steps.push({
      index: steps.length,
      title: evt.description || `Event #${idx + 1}: ${evt.type.toUpperCase()} (${label(evt.from)} ➔ ${label(evt.to)})`,
      explanation: `${explanationText} Live cycle check: ${currentAnalysis.message}`,
      highlight: {
        event: evt,
        affectedNodes: [evt.from, evt.to],
        cycleNodes: currentAnalysis.cycleNodes,
        cycleEdges: currentAnalysis.cycleEdges,
        status: currentAnalysis.status,
      },
      snapshot: {
        graph: currentGraphSnapshot,
        analysis: currentAnalysis,
        event: evt,
      },
    });
  });

  const finalAnalysis = analyzeDeadlock(cloneGraph());
  return {
    steps,
    hasCycle: finalAnalysis.hasCycle,
    finalGraph: cloneGraph(),
    finalAnalysis,
  };
}

/**
 * Standard RAG Event Presets (Deadlock & Safe Scripts).
 */
export const RAG_EVENT_PRESETS = [
  {
    id: 'deadlock-script',
    name: 'Circular Wait Deadlock Script',
    description: 'Classical 2-process 2-resource circular wait resulting in confirmed deadlock.',
    initialGraph: {
      nodes: [
        { id: 'p1', type: 'process', label: 'P1', x: 120, y: 150 },
        { id: 'p2', type: 'process', label: 'P2', x: 380, y: 150 },
        { id: 'r1', type: 'resource', label: 'R1', instances: 1, x: 250, y: 70 },
        { id: 'r2', type: 'resource', label: 'R2', instances: 1, x: 250, y: 230 },
      ],
      edges: [],
    },
    events: [
      { type: 'request', from: 'p1', to: 'r1', description: 'Step 1: P1 requests R1' },
      { type: 'grant', from: 'r1', to: 'p1', description: 'Step 2: R1 instance granted to P1' },
      { type: 'request', from: 'p2', to: 'r2', description: 'Step 3: P2 requests R2' },
      { type: 'grant', from: 'r2', to: 'p2', description: 'Step 4: R2 instance granted to P2' },
      { type: 'request', from: 'p1', to: 'r2', description: 'Step 5: P1 requests R2 (Held by P2)' },
      { type: 'request', from: 'p2', to: 'r1', description: 'Step 6: P2 requests R1 (Held by P1 ➔ DEADLOCK)' },
    ],
  },
  {
    id: 'safe-script',
    name: 'Orderly Acquisition & Release (No Deadlock)',
    description: 'P1 completes and releases resource before P2 acquires it, preventing cycle.',
    initialGraph: {
      nodes: [
        { id: 'p1', type: 'process', label: 'P1', x: 120, y: 150 },
        { id: 'p2', type: 'process', label: 'P2', x: 380, y: 150 },
        { id: 'r1', type: 'resource', label: 'R1', instances: 1, x: 250, y: 70 },
        { id: 'r2', type: 'resource', label: 'R2', instances: 1, x: 250, y: 230 },
      ],
      edges: [],
    },
    events: [
      { type: 'request', from: 'p1', to: 'r1', description: 'Step 1: P1 requests R1' },
      { type: 'grant', from: 'r1', to: 'p1', description: 'Step 2: R1 granted to P1' },
      { type: 'release', from: 'p1', to: 'r1', description: 'Step 3: P1 finishes and releases R1' },
      { type: 'request', from: 'p2', to: 'r1', description: 'Step 4: P2 requests R1' },
      { type: 'grant', from: 'r1', to: 'p2', description: 'Step 5: R1 granted to P2 safely' },
    ],
  },
];
