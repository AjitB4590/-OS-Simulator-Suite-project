import { describe, it, expect } from 'vitest';
import { validateGraph, detectCycle, analyzeDeadlock } from '../../src/algorithms/deadlock/rag.js';
import { RAG_PRESETS } from '../../src/data/deadlockPresets.js';

describe('Resource Allocation Graph (RAG) Algorithm', () => {
  const singleCyclePreset = RAG_PRESETS[0];
  const multiCyclePreset = RAG_PRESETS[1];
  const noCyclePreset = RAG_PRESETS[2];

  it('validates graph semantics and detects capacity over-allocation', () => {
    expect(validateGraph(singleCyclePreset)).toHaveLength(0);

    // Over-allocation: R1 has 1 instance but 2 outgoing assignments
    const overAllocated = {
      nodes: [
        { id: 'p1', type: 'process', label: 'P1' },
        { id: 'p2', type: 'process', label: 'P2' },
        { id: 'r1', type: 'resource', label: 'R1', instances: 1 },
      ],
      edges: [
        { from: 'r1', to: 'p1', type: 'assignment' },
        { from: 'r1', to: 'p2', type: 'assignment' },
      ],
    };
    const errors = validateGraph(overAllocated);
    expect(errors.some((e) => e.includes('exceeding its capacity'))).toBe(true);

    // Invalid edge direction: request starting from resource
    const badDirection = {
      nodes: [
        { id: 'p1', type: 'process', label: 'P1' },
        { id: 'r1', type: 'resource', label: 'R1', instances: 1 },
      ],
      edges: [{ from: 'r1', to: 'p1', type: 'request' }],
    };
    expect(validateGraph(badDirection).some((e) => e.includes('Invalid request edge'))).toBe(true);
  });

  it('detects a cycle in a single-instance graph and confirms DEADLOCK', () => {
    const cycleRes = detectCycle(singleCyclePreset);
    expect(cycleRes.hasCycle).toBe(true);
    expect(cycleRes.cycleNodes).toHaveLength(4);

    const analysis = analyzeDeadlock(singleCyclePreset);
    expect(analysis.status).toBe('deadlock');
    expect(analysis.cyclePath).toContain('P1');
    expect(analysis.cyclePath).toContain('R1');
  });

  it('detects a cycle in a multi-instance graph and reports POSSIBLE DEADLOCK', () => {
    const cycleRes = detectCycle(multiCyclePreset);
    expect(cycleRes.hasCycle).toBe(true);

    const analysis = analyzeDeadlock(multiCyclePreset);
    expect(analysis.status).toBe('possible-deadlock');
    expect(analysis.message).toContain('necessary but not sufficient');
  });

  it('identifies deadlock-free status for acyclic graphs', () => {
    const cycleRes = detectCycle(noCyclePreset);
    expect(cycleRes.hasCycle).toBe(false);

    const analysis = analyzeDeadlock(noCyclePreset);
    expect(analysis.status).toBe('no-cycle');
    expect(analysis.cycleNodes).toHaveLength(0);
  });
});
