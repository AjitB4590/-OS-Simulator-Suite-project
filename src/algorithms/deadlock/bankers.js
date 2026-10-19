/**
 * Dijkstra's Banker's Deadlock Avoidance Algorithm (1965).
 *
 * IDEA:
 * Before granting resource requests, test if granting them leaves the system in a "Safe State"
 * where at least one execution sequence exists allowing all processes to finish without deadlock.
 *
 * TIME COMPLEXITY: O(m * n^2) where n = processes, m = resource types.
 * SPACE COMPLEXITY: O(m * n) for Work, Finish, and Need matrices.
 */

/**
 * Computes Need matrix: Need[i][j] = Max[i][j] - Allocation[i][j]
 * @param {number[][]} max
 * @param {number[][]} allocation
 * @returns {number[][]}
 */
export function computeNeed(max, allocation) {
  return max.map((row, i) => row.map((val, j) => val - (allocation[i]?.[j] ?? 0)));
}

/**
 * Validates consistency of system allocation state.
 * @param {number[][]} allocation
 * @param {number[][]} max
 * @param {number[]} available
 * @returns {string[]} Validation error messages
 */
export function validateState(allocation, max, available) {
  const errors = [];
  if (!allocation?.length || !max?.length || !available?.length) {
    return ['Allocation, Max matrices, and Available vector must not be empty.'];
  }
  const n = allocation.length;
  const m = available.length;

  if (max.length !== n) errors.push(`Max matrix row count (${max.length}) does not match Allocation (${n}).`);

  for (let i = 0; i < n; i++) {
    if (allocation[i]?.length !== m) errors.push(`Process P${i} Allocation dimension mismatch (expected ${m}).`);
    if (max[i]?.length !== m) errors.push(`Process P${i} Max dimension mismatch (expected ${m}).`);

    for (let j = 0; j < m; j++) {
      const a = allocation[i]?.[j] ?? 0;
      const mx = max[i]?.[j] ?? 0;
      if (!Number.isInteger(a) || a < 0) errors.push(`P${i} Allocation[${j}] must be a non-negative integer.`);
      if (!Number.isInteger(mx) || mx < 0) errors.push(`P${i} Max[${j}] must be a non-negative integer.`);
      if (a > mx) errors.push(`P${i} Allocation (${a}) exceeds declared Max (${mx}) for resource R${j}.`);
    }
  }

  for (let j = 0; j < m; j++) {
    const av = available[j];
    if (!Number.isInteger(av) || av < 0) errors.push(`Available[${j}] must be a non-negative integer.`);
  }

  return errors;
}

/**
 * Safety Algorithm: Determines if the system is in a safe state and returns execution steps.
 * @param {number[][]} allocation
 * @param {number[][]} max
 * @param {number[]} available
 * @param {string[]} [processNames]
 */
export function isSafe(allocation, max, available, processNames = []) {
  const n = allocation.length;
  const m = available.length;
  const names = Array.from({ length: n }, (_, i) => processNames[i] || `P${i}`);
  const need = computeNeed(max, allocation);
  const work = [...available];
  const finish = Array(n).fill(false);
  const sequence = [];
  const steps = [];

  let count = 0;
  while (count < n) {
    let found = false;
    for (let i = 0; i < n; i++) {
      if (finish[i]) continue;
      const pid = names[i];
      const canRun = need[i].every((req, j) => req <= work[j]);

      if (canRun) {
        const workAfter = work.map((w, j) => w + allocation[i][j]);
        steps.push({
          pid,
          work: [...work],
          need: [...need[i]],
          canRun: true,
          workAfter: [...workAfter],
          note: `Need [${need[i].join(',')}] ≤ Work [${work.join(',')}]. Process finishes and releases [${allocation[i].join(',')}].`,
        });
        for (let j = 0; j < m; j++) work[j] = workAfter[j];
        finish[i] = true;
        sequence.push(pid);
        found = true;
        count++;
        break; // Restart scan from first unfinished process
      } else {
        steps.push({
          pid,
          work: [...work],
          need: [...need[i]],
          canRun: false,
          workAfter: [...work],
          note: `Need [${need[i].join(',')}] > Work [${work.join(',')}]. Insufficient available resources to guarantee completion.`,
        });
      }
    }
    if (!found) break; // Deadlock or unsafe state detected
  }

  const safe = finish.every(Boolean);
  return { safe, sequence: safe ? sequence : [], steps };
}

/**
 * Resource-Request Algorithm for process Pi requesting resources.
 * @param {number} pidIndex - Index of requesting process
 * @param {number[]} request - Requested resource units vector
 * @param {number[][]} allocation
 * @param {number[][]} max
 * @param {number[]} available
 * @param {string[]} [processNames]
 */
export function requestResources(pidIndex, request, allocation, max, available, processNames = []) {
  const need = computeNeed(max, allocation);
  const reqStr = `[${request.join(',')}]`;
  const checks = [];

  // Check 1: Request <= Need
  const withinNeed = request.every((r, j) => r <= need[pidIndex][j]);
  checks.push({
    name: 'Claim Check (Request ≤ Need)',
    passed: withinNeed,
    text: withinNeed ? `Request ${reqStr} ≤ declared Need [${need[pidIndex].join(',')}].` : `Error: Request ${reqStr} exceeds maximum declared Need [${need[pidIndex].join(',')}].`,
  });
  if (!withinNeed) return { granted: false, reason: 'exceeds-need', checks };

  // Check 2: Request <= Available
  const withinAvailable = request.every((r, j) => r <= available[j]);
  checks.push({
    name: 'Availability Check (Request ≤ Available)',
    passed: withinAvailable,
    text: withinAvailable ? `Request ${reqStr} ≤ Available [${available.join(',')}].` : `Wait: Request ${reqStr} exceeds Available [${available.join(',')}].`,
  });
  if (!withinAvailable) return { granted: false, reason: 'exceeds-available', checks };

  // Check 3: Pretend allocation and check safety
  const newAvailable = available.map((a, j) => a - request[j]);
  const newAllocation = allocation.map((row, i) => (i === pidIndex ? row.map((a, j) => a + request[j]) : [...row]));
  const safetyResult = isSafe(newAllocation, max, newAvailable, processNames);

  checks.push({
    name: 'Safety Check (Pretend Allocation)',
    passed: safetyResult.safe,
    text: safetyResult.safe ? `Safe: Granting request maintains safe state with sequence: ${safetyResult.sequence.join(' → ')}.` : 'Unsafe: Granting request leads to an unsafe state. Process must wait.',
  });

  if (!safetyResult.safe) return { granted: false, reason: 'unsafe', checks, safetyResult };

  return {
    granted: true,
    reason: 'granted',
    checks,
    newState: { allocation: newAllocation, max, available: newAvailable, need: computeNeed(max, newAllocation) },
    safetyResult,
  };
}
