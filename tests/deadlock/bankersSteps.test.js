import { describe, it, expect } from 'vitest';
import { isSafe, requestResources } from '../../src/algorithms/deadlock/bankers.js';
import { BANKERS_PRESETS } from '../../src/data/deadlockPresets.js';

describe("Banker's Algorithm Step Playback", () => {
  const safePreset = BANKERS_PRESETS[0];
  const unsafePreset = BANKERS_PRESETS[1];

  it('generates well-formed safety steps with monotonic indices and snapshot parity', () => {
    const res = isSafe(safePreset.allocation, safePreset.max, safePreset.available, safePreset.processNames);

    expect(res.steps.length).toBeGreaterThan(safePreset.processNames.length);

    res.steps.forEach((step, idx) => {
      expect(step.index).toBe(idx);
      expect(step.title).toBeDefined();
      expect(typeof step.title).toBe('string');
      expect(step.explanation).toBeDefined();
      expect(typeof step.explanation).toBe('string');
      expect(step.highlight).toBeDefined();
      expect(step.snapshot).toBeDefined();
    });

    // Final step snapshot must match overall return result
    const finalStep = res.steps[res.steps.length - 1];
    expect(finalStep.snapshot.safe).toBe(res.safe);
    expect(finalStep.snapshot.safeSequence).toEqual(res.sequence);
    expect(res.safe).toBe(true);
    expect(res.sequence).toEqual(['P1', 'P3', 'P0', 'P2', 'P4']);
  });

  it('accurately tracks Work vector evolution and progressive safe sequence', () => {
    const res = isSafe(safePreset.allocation, safePreset.max, safePreset.available, safePreset.processNames);
    const initStep = res.steps[0];
    expect(initStep.snapshot.work).toEqual(safePreset.available);
    expect(initStep.snapshot.safeSequence).toEqual([]);

    // Check intermediate process execution steps
    const finishSteps = res.steps.filter((s) => s.highlight?.status === 'finished');
    expect(finishSteps).toHaveLength(5);

    // Each finish step appends a process to the safe sequence
    finishSteps.forEach((s, idx) => {
      expect(s.snapshot.safeSequence).toHaveLength(idx + 1);
    });

    // Final work vector equals initial available + all allocations
    const finalStep = res.steps[res.steps.length - 1];
    expect(finalStep.snapshot.work).toEqual([10, 5, 7]);
  });

  it('clearly identifies UNSAFE state and highlights stuck processes', () => {
    const res = isSafe(unsafePreset.allocation, unsafePreset.max, unsafePreset.available, unsafePreset.processNames);
    expect(res.safe).toBe(false);
    expect(res.sequence).toEqual([]);

    const lastStep = res.steps[res.steps.length - 1];
    expect(lastStep.title).toContain('UNSAFE');
    expect(lastStep.explanation).toContain('No process can proceed');
    expect(lastStep.highlight.stuckProcesses.length).toBeGreaterThan(0);
  });

  it('simulates resource request step playback with Claim, Available, and Safety checks', () => {
    // P1 requests [1, 0, 2] - safe and granted
    const reqRes = requestResources(1, [1, 0, 2], safePreset.allocation, safePreset.max, safePreset.available, safePreset.processNames);
    expect(reqRes.steps.length).toBeGreaterThan(3);

    const step0 = reqRes.steps[0];
    expect(step0.title).toContain('Check 1');
    expect(step0.highlight.claimCheck).toBe(true);

    const step1 = reqRes.steps[1];
    expect(step1.title).toContain('Check 2');
    expect(step1.highlight.availCheck).toBe(true);

    const step2 = reqRes.steps[2];
    expect(step2.title).toContain('Pretend Allocation');
    expect(step2.snapshot.available).toEqual([2, 3, 0]);

    const finalStep = reqRes.steps[reqRes.steps.length - 1];
    expect(finalStep.title).toContain('GRANTED');
    expect(reqRes.granted).toBe(true);
  });

  it('generates rejection step when request exceeds Need claim', () => {
    // P1 requests [2, 0, 0] when Need is [1, 2, 2]
    const reqRes = requestResources(1, [2, 0, 0], safePreset.allocation, safePreset.max, safePreset.available, safePreset.processNames);
    expect(reqRes.granted).toBe(false);
    expect(reqRes.reason).toBe('exceeds-need');

    const lastStep = reqRes.steps[reqRes.steps.length - 1];
    expect(lastStep.title).toContain('MUST WAIT');
    expect(lastStep.explanation).toContain('exceeds its declared maximum Need');
  });
});
