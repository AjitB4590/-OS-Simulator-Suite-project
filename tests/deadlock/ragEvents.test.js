import { describe, it, expect } from 'vitest';
import { simulateRagEvents, RAG_EVENT_PRESETS } from '../../src/algorithms/deadlock/ragEvents.js';

describe('RAG Dynamic Event Simulation', () => {
  const deadlockPreset = RAG_EVENT_PRESETS.find((p) => p.id === 'deadlock-script');
  const safePreset = RAG_EVENT_PRESETS.find((p) => p.id === 'safe-script');

  it('runs deadlock preset and triggers DEADLOCK status at the circular wait step', () => {
    expect(deadlockPreset).toBeDefined();
    const sim = simulateRagEvents(deadlockPreset.initialGraph, deadlockPreset.events);

    expect(sim.steps).toHaveLength(deadlockPreset.events.length + 1);

    // Initial step has no deadlock
    expect(sim.steps[0].snapshot.analysis.status).toBe('no-cycle');

    // Final step must report DEADLOCK
    const finalStep = sim.steps[sim.steps.length - 1];
    expect(finalStep.snapshot.analysis.status).toBe('deadlock');
    expect(sim.hasCycle).toBe(true);
  });

  it('runs safe preset and maintains acyclic / non-deadlock state throughout', () => {
    expect(safePreset).toBeDefined();
    const sim = simulateRagEvents(safePreset.initialGraph, safePreset.events);

    expect(sim.steps).toHaveLength(safePreset.events.length + 1);
    const finalStep = sim.steps[sim.steps.length - 1];
    expect(finalStep.snapshot.analysis.hasCycle).toBe(false);
  });

  it('correctly handles request, grant, and release graph mutations', () => {
    const initGraph = {
      nodes: [
        { id: 'p1', type: 'process', label: 'P1' },
        { id: 'r1', type: 'resource', label: 'R1', instances: 1 },
      ],
      edges: [],
    };
    const events = [
      { type: 'request', from: 'p1', to: 'r1' },
      { type: 'grant', from: 'r1', to: 'p1' },
      { type: 'release', from: 'r1', to: 'p1' },
    ];

    const sim = simulateRagEvents(initGraph, events);
    // After step 1: 1 request edge
    expect(sim.steps[1].snapshot.graph.edges).toHaveLength(1);
    expect(sim.steps[1].snapshot.graph.edges[0].type).toBe('request');

    // After step 2: request turned into assignment
    expect(sim.steps[2].snapshot.graph.edges).toHaveLength(1);
    expect(sim.steps[2].snapshot.graph.edges[0].type).toBe('assignment');

    // After step 3: assignment released
    expect(sim.steps[3].snapshot.graph.edges).toHaveLength(0);
  });
});
