import { describe, it, expect } from 'vitest';
import { simulateRagDfs } from '../../src/algorithms/deadlock/ragDfs.js';
import { RAG_PRESETS } from '../../src/data/deadlockPresets.js';

describe('3-Color DFS Cycle Detection Algorithm Playback', () => {
  const singleCyclePreset = RAG_PRESETS[0];
  const noCyclePreset = RAG_PRESETS[2];

  it('generates sequential steps with white/gray/black color transitions and DFS stack', () => {
    const sim = simulateRagDfs(singleCyclePreset);
    expect(sim.steps.length).toBeGreaterThan(4);

    sim.steps.forEach((step, idx) => {
      expect(step.index).toBe(idx);
      expect(step.title).toBeDefined();
      expect(step.explanation).toBeDefined();
      expect(step.highlight.colorMap).toBeDefined();
    });

    // Step 0 must have all nodes white and empty stack
    expect(sim.steps[0].highlight.stack).toEqual([]);
    expect(Object.values(sim.steps[0].highlight.colorMap).every((c) => c === 'white')).toBe(true);

    // Some steps must have nodes colored gray (in stack)
    const graySteps = sim.steps.filter((s) => Object.values(s.highlight.colorMap).includes('gray'));
    expect(graySteps.length).toBeGreaterThan(0);
  });

  it('discovers back edge, records cycle path, and concludes DEADLOCK for single instance', () => {
    const sim = simulateRagDfs(singleCyclePreset);
    expect(sim.hasCycle).toBe(true);
    expect(sim.cycleNodes.length).toBeGreaterThanOrEqual(3);

    const backEdgeStep = sim.steps.find((s) => s.title.includes('Back Edge Discovered'));
    expect(backEdgeStep).toBeDefined();
    expect(backEdgeStep.highlight.cycleNodes.length).toBeGreaterThan(0);
    expect(backEdgeStep.highlight.cycleEdges.length).toBeGreaterThan(0);

    const finalStep = sim.steps[sim.steps.length - 1];
    expect(finalStep.highlight.status).toBe('deadlock');
  });

  it('completes acyclic graph with no cycle found and nodes finishing black', () => {
    const sim = simulateRagDfs(noCyclePreset);
    expect(sim.hasCycle).toBe(false);
    expect(sim.cycleNodes).toEqual([]);

    const finalStep = sim.steps[sim.steps.length - 1];
    expect(finalStep.highlight.status).toBe('no-cycle');
    // All reachable nodes should be black (done) by completion
    expect(Object.values(finalStep.highlight.colorMap).some((c) => c === 'black')).toBe(true);
  });
});
