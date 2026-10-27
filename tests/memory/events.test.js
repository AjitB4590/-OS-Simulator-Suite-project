import { describe, it, expect } from 'vitest';
import { simulateMemoryEvents, MEMORY_EVENT_PRESETS } from '../../src/algorithms/memory/memoryEvents.js';

describe('Memory Event Simulation (Allocate, Free, Merge Holes, Compaction)', () => {
  it('frees a process and merges adjacent free holes into a larger block', () => {
    const initialBlocks = [150, 150, 200];
    const events = [
      { type: 'allocate', pid: 'P1', size: 150 },
      { type: 'allocate', pid: 'P2', size: 150 },
      { type: 'allocate', pid: 'P4', size: 200 },
      { type: 'free', pid: 'P1' },
      { type: 'free', pid: 'P2' },
      { type: 'allocate', pid: 'P3', size: 280 }, // Only fits if adjacent holes (150+150=300) were merged
    ];

    const sim = simulateMemoryEvents(initialBlocks, events, 'firstFit');
    expect(sim.steps).toHaveLength(events.length + 1);

    // After step 5 (both P1 and P2 freed): Block 0 and Block 1 merged into 300 KB hole
    const stepAfterFree = sim.steps[5];
    expect(stepAfterFree.highlight.merged).toBe(true);
    expect(stepAfterFree.snapshot.blocks[0].originalSize).toBe(300);

    // Step 6: P3 (280 KB) should be successfully allocated to Block 0
    const stepP3 = sim.steps[6];
    expect(stepP3.highlight.status).toBe('allocated');
    expect(stepP3.highlight.chosenBlock).toBe(0);
  });

  it('compacts memory to eliminate external fragmentation and satisfy a large allocation', () => {
    const preset = MEMORY_EVENT_PRESETS.extFragCompaction;
    expect(preset).toBeDefined();

    const sim = simulateMemoryEvents(preset.initialBlocks, preset.events, 'firstFit');

    // Find the step where P5 failed due to external fragmentation
    const failedStep = sim.steps.find((s) => s.highlight?.isExtFrag === true);
    expect(failedStep).toBeDefined();
    expect(failedStep.snapshot.stats.externalFragmentation).toBeGreaterThan(0);
    expect(failedStep.explanation).toContain('EXTERNAL FRAGMENTATION');

    // Find the compaction step
    const compactStep = sim.steps.find((s) => s.highlight?.compacted === true);
    expect(compactStep).toBeDefined();
    expect(compactStep.snapshot.stats.externalFragmentation).toBe(0);

    // After compaction, the final step allocates P5 successfully
    const finalStep = sim.steps[sim.steps.length - 1];
    expect(finalStep.highlight.status).toBe('allocated');
    expect(finalStep.snapshot.stats.unallocated).toEqual([]);
  });

  it('validates all built-in memory presets run without error', () => {
    Object.values(MEMORY_EVENT_PRESETS).forEach((p) => {
      const res = simulateMemoryEvents(p.initialBlocks, p.events, 'firstFit');
      expect(res.steps.length).toBe(p.events.length + 1);
      expect(res.stats).toBeDefined();
    });
  });
});
