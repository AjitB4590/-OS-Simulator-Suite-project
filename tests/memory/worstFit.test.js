import { describe, it, expect } from 'vitest';
import { worstFit } from '../../src/algorithms/memory/worstFit.js';

describe('Worst Fit Memory Allocation', () => {
  const textbookBlocks = [100, 500, 200, 300, 600];
  const textbookProcesses = [212, 417, 112, 426];

  it('allocates classic textbook dataset in dynamic partition mode', () => {
    const res = worstFit(textbookBlocks, textbookProcesses, { mode: 'dynamic' });

    // P1 (212) -> Block 4 (600, largest block)
    // P2 (417) -> Block 1 (500, largest remaining)
    // P3 (112) -> Block 4 (388 remaining is largest available)
    // P4 (426) -> Unallocated (largest remaining is Block 3 at 300 < 426)
    expect(res.allocations[0].blockIndex).toBe(4);
    expect(res.allocations[1].blockIndex).toBe(1);
    expect(res.allocations[2].blockIndex).toBe(4);
    expect(res.allocations[3].blockIndex).toBe(null);

    expect(res.stats.unallocated).toEqual(['P4']);
    expect(res.blocks[4].allocatedTo).toHaveLength(2);
    expect(res.blocks[4].remaining).toBe(600 - 212 - 112);
  });

  it('breaks ties using lower block index when blocks have equal maximum space', () => {
    const blocks = [500, 500, 200];
    const proc = [100];
    const res = worstFit(blocks, proc);

    // Both Block 0 and Block 1 have 500. Tie-breaker must pick Block 0
    expect(res.allocations[0].blockIndex).toBe(0);
  });

  it('allocates in fixed mode (each block can host only one process)', () => {
    const res = worstFit(textbookBlocks, textbookProcesses, { mode: 'fixed' });

    // P1 (212) -> Block 4 (600)
    // P2 (417) -> Block 1 (500)
    // P3 (112) -> Block 3 (300, since blocks 4 and 1 are occupied)
    // P4 (426) -> Unallocated
    expect(res.allocations[0].blockIndex).toBe(4);
    expect(res.allocations[1].blockIndex).toBe(1);
    expect(res.allocations[2].blockIndex).toBe(3);
    expect(res.allocations[3].blockIndex).toBe(null);

    const expectedInternalFrag = (600 - 212) + (500 - 417) + (300 - 112);
    expect(res.stats.internalFragmentation).toBe(expectedInternalFrag);
  });
});
