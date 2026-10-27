import { describe, it, expect } from 'vitest';
import { firstFit } from '../../src/algorithms/memory/firstFit.js';
import { bestFit } from '../../src/algorithms/memory/bestFit.js';
import { worstFit } from '../../src/algorithms/memory/worstFit.js';

describe('Memory Block Scanning Playback (First, Best, Worst Fit)', () => {
  const blocks = [100, 500, 200, 300, 600];
  const procs = [212, 417];

  it('generates block-by-block scanning steps and decision steps for First Fit', () => {
    const res = firstFit(blocks, procs);

    expect(res.steps.length).toBeGreaterThan(procs.length);
    res.steps.forEach((step, idx) => {
      expect(step.index).toBe(idx);
      expect(step.title).toBeDefined();
      expect(step.explanation).toBeDefined();
      expect(step.snapshot.blocks).toBeDefined();
    });

    // P1 (212) scans Block B0 (100) -> too small (fits === false)
    const p1ScanB0 = res.steps[0];
    expect(p1ScanB0.checkingBlock).toBe(0);
    expect(p1ScanB0.highlight.fits).toBe(false);

    // P1 scans Block B1 (500) -> fits! First Fit picks B1 immediately
    const p1ScanB1 = res.steps[1];
    expect(p1ScanB1.checkingBlock).toBe(1);
    expect(p1ScanB1.highlight.fits).toBe(true);

    const p1Decision = res.steps[2];
    expect(p1Decision.chosenBlock).toBe(1);
    expect(p1Decision.title).toContain('First Fit Decision');

    // Final snapshot blocks match res.blocks
    const finalStep = res.steps[res.steps.length - 1];
    expect(finalStep.snapshot.blocks).toEqual(res.blocks);
  });

  it('scans all blocks and picks the smallest qualifying block in Best Fit', () => {
    const res = bestFit([100, 500, 200, 300, 600], [212]);

    // Should inspect all 5 blocks then emit decision
    const scanSteps = res.steps.filter((s) => s.checkingBlock !== undefined && s.checkingBlock !== null);
    expect(scanSteps).toHaveLength(5);

    const decisionStep = res.steps[res.steps.length - 1];
    expect(decisionStep.chosenBlock).toBe(3); // Block 3 is 300, smallest qualifying block for 212
    expect(decisionStep.title).toContain('Best Fit Decision');
    expect(decisionStep.explanation).toContain('smallest block');
  });

  it('scans all blocks and picks the largest qualifying block in Worst Fit', () => {
    const res = worstFit([100, 500, 200, 300, 600], [212]);

    const decisionStep = res.steps[res.steps.length - 1];
    expect(decisionStep.chosenBlock).toBe(4); // Block 4 is 600, largest block
    expect(decisionStep.title).toContain('Worst Fit Decision');
    expect(decisionStep.explanation).toContain('largest block');
  });
});
