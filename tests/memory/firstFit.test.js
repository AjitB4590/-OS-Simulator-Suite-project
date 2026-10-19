import { describe, it, expect } from 'vitest';
import { firstFit } from '../../src/algorithms/memory/firstFit.js';
import { validateMemoryInputs } from '../../src/algorithms/memory/shared.js';

describe('First Fit Memory Allocation', () => {
  const textbookBlocks = [100, 500, 200, 300, 600];
  const textbookProcesses = [212, 417, 112, 426];

  it('allocates classic textbook dataset in dynamic partition mode', () => {
    const res = firstFit(textbookBlocks, textbookProcesses, { mode: 'dynamic' });

    // P1 (212) -> Block 1 (500)
    // P2 (417) -> Block 4 (600)
    // P3 (112) -> Block 1 (288 remaining fits 112)
    // P4 (426) -> Cannot fit anywhere
    expect(res.allocations[0].blockIndex).toBe(1);
    expect(res.allocations[1].blockIndex).toBe(4);
    expect(res.allocations[2].blockIndex).toBe(1);
    expect(res.allocations[3].blockIndex).toBe(null);

    expect(res.stats.unallocated).toEqual(['P4']);
    expect(res.blocks[1].allocatedTo).toHaveLength(2);
    expect(res.blocks[1].remaining).toBe(500 - 212 - 112);
  });

  it('allocates classic textbook dataset in fixed partition mode (1 process per block)', () => {
    const res = firstFit(textbookBlocks, textbookProcesses, { mode: 'fixed' });

    // P1 (212) -> Block 1 (500)
    // P2 (417) -> Block 4 (600)
    // P3 (112) -> Block 2 (200, since block 1 is already taken)
    // P4 (426) -> Unallocated
    expect(res.allocations[0].blockIndex).toBe(1);
    expect(res.allocations[1].blockIndex).toBe(4);
    expect(res.allocations[2].blockIndex).toBe(2);
    expect(res.allocations[3].blockIndex).toBe(null);

    expect(res.stats.internalFragmentation).toBe((500 - 212) + (600 - 417) + (200 - 112));
  });

  it('handles case where all processes fit comfortably', () => {
    const res = firstFit([300, 300], [100, 100]);
    expect(res.stats.unallocated).toHaveLength(0);
    expect(res.stats.utilizationPercent).toBeCloseTo((200 / 600) * 100);
  });

  it('handles case where no process fits', () => {
    const res = firstFit([50, 50], [100, 200]);
    expect(res.allocations.every((a) => a.blockIndex === null)).toBe(true);
    expect(res.stats.unallocated).toEqual(['P1', 'P2']);
    expect(res.stats.usedMemory).toBe(0);
  });

  it('validates invalid inputs and catches non-positive or empty values', () => {
    expect(validateMemoryInputs([], [100])).toHaveLength(1);
    expect(validateMemoryInputs([100], [])).toHaveLength(1);
    expect(validateMemoryInputs([-50], [100]).some((e) => e.includes('positive'))).toBe(true);
    expect(validateMemoryInputs([100], [-20]).some((e) => e.includes('positive'))).toBe(true);
  });
});
