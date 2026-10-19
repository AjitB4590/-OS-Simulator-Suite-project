/**
 * Educational Presets for Deadlock Simulations.
 * Contains standard textbook benchmarks for Banker's Safety Algorithm
 * and Resource Allocation Graphs (single-instance vs multi-instance cycles).
 */

export const BANKERS_PRESETS = [
  {
    id: 'textbook_safe',
    name: 'Textbook Safe State (Silberschatz)',
    description: 'Classic 5 processes (P0-P4) & 3 resources (A,B,C) with valid safe sequence.',
    processNames: ['P0', 'P1', 'P2', 'P3', 'P4'],
    resourceNames: ['A', 'B', 'C'],
    allocation: [
      [0, 1, 0],
      [2, 0, 0],
      [3, 0, 2],
      [2, 1, 1],
      [0, 0, 2],
    ],
    max: [
      [7, 5, 3],
      [3, 2, 2],
      [9, 0, 2],
      [2, 2, 2],
      [4, 3, 3],
    ],
    available: [3, 3, 2],
  },
  {
    id: 'unsafe_state',
    name: 'Unsafe State (Insufficient Available)',
    description: 'Resources are exhausted such that no process can satisfy its remaining Need.',
    processNames: ['P0', 'P1', 'P2'],
    resourceNames: ['A', 'B', 'C'],
    allocation: [
      [2, 1, 0],
      [1, 1, 3],
      [3, 0, 1],
    ],
    max: [
      [4, 3, 3],
      [3, 2, 4],
      [5, 2, 2],
    ],
    available: [0, 0, 0],
  },
  {
    id: 'edge_case_single_resource',
    name: 'Single Resource Type (Bank Loan)',
    description: 'Original Dijkstra bank loan analogy with a single cash resource type.',
    processNames: ['P0', 'P1', 'P2', 'P3'],
    resourceNames: ['A'],
    allocation: [[1], [4], [5], [2]],
    max: [[6], [5], [7], [4]],
    available: [3],
  },
];

export const RAG_PRESETS = [
  {
    id: 'rag_deadlock_single',
    name: 'Deadlock (Cycle, Single-Instance)',
    description: 'Circular wait with single-instance resources guarantees deadlock.',
    nodes: [
      { id: 'p1', type: 'process', label: 'P1', x: 120, y: 100 },
      { id: 'p2', type: 'process', label: 'P2', x: 380, y: 100 },
      { id: 'r1', type: 'resource', label: 'R1', instances: 1, x: 250, y: 40 },
      { id: 'r2', type: 'resource', label: 'R2', instances: 1, x: 250, y: 180 },
    ],
    edges: [
      { id: 'e1', from: 'r1', to: 'p1', type: 'assignment' },
      { id: 'e2', from: 'p1', to: 'r2', type: 'request' },
      { id: 'e3', from: 'r2', to: 'p2', type: 'assignment' },
      { id: 'e4', from: 'p2', to: 'r1', type: 'request' },
    ],
  },
  {
    id: 'rag_cycle_multi_instance',
    name: 'Cycle with Multi-Instance (No Guaranteed Deadlock)',
    description: 'A cycle exists (P1 → R1 → P3 → R2 → P1), but unblocked processes (P2, P4) can release instances.',
    nodes: [
      { id: 'p1', type: 'process', label: 'P1', x: 100, y: 80 },
      { id: 'p2', type: 'process', label: 'P2', x: 250, y: 30 },
      { id: 'p3', type: 'process', label: 'P3', x: 400, y: 80 },
      { id: 'p4', type: 'process', label: 'P4', x: 250, y: 220 },
      { id: 'r1', type: 'resource', label: 'R1', instances: 2, x: 250, y: 100 },
      { id: 'r2', type: 'resource', label: 'R2', instances: 2, x: 250, y: 160 },
    ],
    edges: [
      { id: 'e1', from: 'p1', to: 'r1', type: 'request' },
      { id: 'e2', from: 'r1', to: 'p2', type: 'assignment' },
      { id: 'e3', from: 'r1', to: 'p3', type: 'assignment' },
      { id: 'e4', from: 'p3', to: 'r2', type: 'request' },
      { id: 'e5', from: 'r2', to: 'p1', type: 'assignment' },
      { id: 'e6', from: 'r2', to: 'p4', type: 'assignment' },
    ],
  },
  {
    id: 'rag_no_cycle',
    name: 'Deadlock-Free (Acyclic Graph)',
    description: 'Independent resource assignments with no circular dependency.',
    nodes: [
      { id: 'p1', type: 'process', label: 'P1', x: 120, y: 100 },
      { id: 'p2', type: 'process', label: 'P2', x: 380, y: 100 },
      { id: 'r1', type: 'resource', label: 'R1', instances: 2, x: 250, y: 100 },
    ],
    edges: [
      { id: 'e1', from: 'r1', to: 'p1', type: 'assignment' },
      { id: 'e2', from: 'r1', to: 'p2', type: 'assignment' },
    ],
  },
];
