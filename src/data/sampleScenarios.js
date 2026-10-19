/**
 * Educational Pre-configured Workload Scenarios.
 * Curated datasets illustrating classical OS scheduling phenomena including the Convoy Effect,
 * starvation under priority schemes, and textbook scheduling benchmarks.
 */

export const SAMPLE_SCENARIOS = [
  {
    id: 'textbook',
    name: 'Textbook Example',
    description: 'Balanced 4-process workload demonstrating general turnaround and waiting behaviors.',
    processes: [
      { id: 'sc-1', pid: 'P1', at: 0, bt: 6, priority: 2 },
      { id: 'sc-2', pid: 'P2', at: 1, bt: 4, priority: 1 },
      { id: 'sc-3', pid: 'P3', at: 2, bt: 8, priority: 3 },
      { id: 'sc-4', pid: 'P4', at: 3, bt: 3, priority: 2 },
    ],
  },
  {
    id: 'convoy',
    name: 'Convoy Effect',
    description: 'Long CPU-bound task arrives first, causing short interactive tasks to queue up (FCFS bottleneck).',
    processes: [
      { id: 'sc-1', pid: 'P1', at: 0, bt: 24, priority: 3 },
      { id: 'sc-2', pid: 'P2', at: 1, bt: 2, priority: 2 },
      { id: 'sc-3', pid: 'P3', at: 2, bt: 3, priority: 1 },
      { id: 'sc-4', pid: 'P4', at: 3, bt: 1, priority: 2 },
    ],
  },
  {
    id: 'starvation',
    name: 'Starvation Case',
    description: 'Long/low-priority process is starved by frequent short/urgent arrivals in SJF/Priority.',
    processes: [
      { id: 'sc-1', pid: 'P1', at: 0, bt: 16, priority: 5 },
      { id: 'sc-2', pid: 'P2', at: 1, bt: 2, priority: 1 },
      { id: 'sc-3', pid: 'P3', at: 3, bt: 2, priority: 1 },
      { id: 'sc-4', pid: 'P4', at: 5, bt: 2, priority: 1 },
      { id: 'sc-5', pid: 'P5', at: 7, bt: 1, priority: 2 },
    ],
  },
];
