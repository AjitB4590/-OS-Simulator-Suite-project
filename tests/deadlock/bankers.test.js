import { describe, it, expect } from 'vitest';
import { computeNeed, validateState, isSafe, requestResources } from '../../src/algorithms/deadlock/bankers.js';
import { BANKERS_PRESETS } from '../../src/data/deadlockPresets.js';

describe("Banker's Algorithm", () => {
  const textbook = BANKERS_PRESETS[0];

  it('computes the Need matrix correctly (Need = Max - Allocation)', () => {
    const need = computeNeed(textbook.max, textbook.allocation);
    expect(need).toEqual([
      [7, 4, 3], // P0
      [1, 2, 2], // P1
      [6, 0, 0], // P2
      [0, 1, 1], // P3
      [4, 3, 1], // P4
    ]);
  });

  it('validates correct state and catches invalid inputs', () => {
    expect(validateState(textbook.allocation, textbook.max, textbook.available)).toHaveLength(0);

    // Allocation > Max error
    const invalidMax = [[1, 1, 1]];
    const invalidAlloc = [[2, 1, 1]];
    const errors = validateState(invalidAlloc, invalidMax, [1, 1, 1]);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0]).toContain('exceeds declared Max');

    // Negative numbers
    const negErrors = validateState([[-1, 0, 0]], [[1, 0, 0]], [1, 1, 1]);
    expect(negErrors.some((e) => e.includes('non-negative'))).toBe(true);

    // Dimension mismatch
    const dimErrors = validateState([[1, 0]], [[1, 0]], [1, 0, 0]);
    expect(dimErrors.some((e) => e.includes('dimension mismatch'))).toBe(true);
  });

  it('finds safe sequence in textbook safe state', () => {
    const res = isSafe(textbook.allocation, textbook.max, textbook.available, textbook.processNames);
    expect(res.safe).toBe(true);
    expect(res.sequence).toHaveLength(5);
    // P1 must be able to run first with available [3,3,2] since Need is [1,2,2]
    expect(res.sequence[0]).toBe('P1');
    expect(res.steps.length).toBeGreaterThanOrEqual(5);

    // Re-verify that the returned safe sequence can truly execute to completion
    let work = [...textbook.available];
    const need = computeNeed(textbook.max, textbook.allocation);
    for (const pid of res.sequence) {
      const idx = textbook.processNames.indexOf(pid);
      expect(need[idx].every((req, j) => req <= work[j])).toBe(true);
      work = work.map((w, j) => w + textbook.allocation[idx][j]);
    }
    // Final work must equal sum of all allocations + initial available
    expect(work).toEqual([10, 5, 7]);
  });

  it('identifies unsafe state correctly', () => {
    const unsafePreset = BANKERS_PRESETS[1];
    const res = isSafe(unsafePreset.allocation, unsafePreset.max, unsafePreset.available, unsafePreset.processNames);
    expect(res.safe).toBe(false);
    expect(res.sequence).toHaveLength(0);
  });

  it('grants a safe resource request (P1 requests [1, 0, 2])', () => {
    const req = [1, 0, 2];
    const res = requestResources(1, req, textbook.allocation, textbook.max, textbook.available, textbook.processNames);
    expect(res.granted).toBe(true);
    expect(res.reason).toBe('granted');
    expect(res.newState.available).toEqual([2, 3, 0]);
    expect(res.newState.allocation[1]).toEqual([3, 0, 2]);
    expect(res.newState.need[1]).toEqual([0, 2, 0]);
    expect(res.safetyResult.safe).toBe(true);
  });

  it('denies request when request exceeds Need (exceeds-need)', () => {
    // P1 Need is [1, 2, 2]. Requesting [2, 0, 0] exceeds claim
    const res = requestResources(1, [2, 0, 0], textbook.allocation, textbook.max, textbook.available, textbook.processNames);
    expect(res.granted).toBe(false);
    expect(res.reason).toBe('exceeds-need');
  });

  it('denies request when request exceeds Available (exceeds-available)', () => {
    // Available is [3, 3, 2]. P4 requests [4, 0, 0] (exceeds available 3)
    const res = requestResources(4, [4, 0, 0], textbook.allocation, textbook.max, textbook.available, textbook.processNames);
    expect(res.granted).toBe(false);
    expect(res.reason).toBe('exceeds-available');
  });

  it('denies request when granting leaves system in unsafe state (unsafe)', () => {
    // P0 requests [0, 3, 0] -> available becomes [3, 0, 2].
    // With available [3, 0, 2], no process (P0-P4) can satisfy its Need:
    // P3 needs [0, 1, 1] but available has 0 of B; P1 needs [1, 2, 2] but has 0 of B.
    const res = requestResources(0, [0, 3, 0], textbook.allocation, textbook.max, textbook.available, textbook.processNames);
    expect(res.granted).toBe(false);
    expect(res.reason).toBe('unsafe');
    expect(res.safetyResult.safe).toBe(false);
  });
});
