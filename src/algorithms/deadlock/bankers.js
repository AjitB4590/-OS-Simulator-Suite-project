/**
 * Dijkstra's Banker's Deadlock Avoidance Algorithm (1965).
 * Pure algorithm engine for safety verification and resource-request simulation.
 * Returns discrete step traces capturing Work vectors, Need tests, and state snapshots.
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
      if (!Number.isInteger(a) || a < 0) errors.push(`P${i} Allocation[${j}] must be non-negative.`);
      if (!Number.isInteger(mx) || mx < 0) errors.push(`P${i} Max[${j}] must be non-negative.`);
      if (a > mx) errors.push(`P${i} Allocation (${a}) exceeds declared Max (${mx}) for resource R${j}.`);
    }
  }
  for (let j = 0; j < m; j++) {
    if (!Number.isInteger(available[j]) || available[j] < 0) errors.push(`Available[${j}] must be non-negative.`);
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

  // Step 0: Initialization
  steps.push({
    index: 0,
    title: 'Safety Check Initialization',
    explanation: `Work initialized to Available [${available.join(', ')}]. All ${n} processes marked as unfinished (Finish = false). Safe sequence is empty.`,
    pid: null,
    procIndex: -1,
    work: [...work],
    need: [],
    canRun: null,
    workAfter: [...work],
    finish: [...finish],
    sequence: [],
    highlight: { procIndex: -1, pid: null, canRun: null, stuck: [], stuckProcesses: [] },
    snapshot: { work: [...work], allocation, max, need, finish: [...finish], sequence: [], safeSequence: [], safe: null },
    note: `Work = [${work.join(', ')}], Finish all false.`,
  });

  let count = 0;
  while (count < n) {
    let found = false;
    for (let i = 0; i < n; i++) {
      if (finish[i]) continue;
      const pid = names[i];
      const canRun = need[i].every((req, j) => req <= work[j]);

      if (canRun) {
        const workAfter = work.map((w, j) => w + allocation[i][j]);
        const nextFinish = [...finish];
        nextFinish[i] = true;
        const nextSequence = [...sequence, pid];

        steps.push({
          index: steps.length,
          title: `Examine ${pid}: Can Complete (Need ≤ Work)`,
          explanation: `Need [${need[i].join(', ')}] ≤ Work [${work.join(', ')}]. ${pid} completes and releases [${allocation[i].join(', ')}]. Work becomes [${workAfter.join(', ')}].`,
          pid,
          procIndex: i,
          work: [...work],
          need: [...need[i]],
          canRun: true,
          workAfter: [...workAfter],
          finish: nextFinish,
          sequence: nextSequence,
          highlight: { procIndex: i, processIndex: i, pid, canRun: true, status: 'finished', stuck: [], stuckProcesses: [] },
          snapshot: { work: [...workAfter], allocation, max, need, finish: nextFinish, sequence: nextSequence, safeSequence: nextSequence, safe: null },
          note: `Need [${need[i].join(',')}] ≤ Work [${work.join(',')}]. Process finishes and releases [${allocation[i].join(',')}].`,
        });

        for (let j = 0; j < m; j++) work[j] = workAfter[j];
        finish[i] = true;
        sequence.push(pid);
        found = true;
        count++;
        break;
      } else {
        steps.push({
          index: steps.length,
          title: `Examine ${pid}: Must Wait (Need > Work)`,
          explanation: `Need [${need[i].join(', ')}] > Work [${work.join(', ')}]. Insufficient resources available for ${pid} to finish right now.`,
          pid,
          procIndex: i,
          work: [...work],
          need: [...need[i]],
          canRun: false,
          workAfter: [...work],
          finish: [...finish],
          sequence: [...sequence],
          highlight: { procIndex: i, processIndex: i, pid, canRun: false, status: 'waiting', stuck: [], stuckProcesses: [] },
          snapshot: { work: [...work], allocation, max, need, finish: [...finish], sequence: [...sequence], safeSequence: [...sequence], safe: null },
          note: `Need [${need[i].join(',')}] > Work [${work.join(',')}]. Insufficient available resources to guarantee completion.`,
        });
      }
    }
    if (!found) break;
  }

  const safe = finish.every(Boolean);

  if (safe) {
    steps.push({
      index: steps.length,
      title: 'Safe State Confirmed',
      explanation: `All ${n} processes finished successfully. Safe execution sequence found: ${sequence.join(' → ')}. System is provably deadlock-free.`,
      pid: null,
      procIndex: -1,
      work: [...work],
      need: [],
      canRun: true,
      workAfter: [...work],
      finish: [...finish],
      sequence: [...sequence],
      highlight: { procIndex: -1, pid: null, canRun: true, stuck: [], stuckProcesses: [] },
      snapshot: { work: [...work], allocation, max, need, finish: [...finish], sequence: [...sequence], safeSequence: [...sequence], safe: true },
      note: `Safe sequence: ${sequence.join(' → ')}.`,
    });
  } else {
    const stuckIndices = finish.map((f, idx) => (!f ? idx : -1)).filter((idx) => idx !== -1);
    const stuckNames = stuckIndices.map((idx) => names[idx]);
    steps.push({
      index: steps.length,
      title: 'No process can proceed: UNSAFE state',
      explanation: `No process can proceed: UNSAFE state. No remaining unfinished process has Need ≤ Work [${work.join(', ')}]. Stuck processes: ${stuckNames.join(', ')}.`,
      pid: null,
      procIndex: -1,
      work: [...work],
      need: [],
      canRun: false,
      workAfter: [...work],
      finish: [...finish],
      sequence: [...sequence],
      highlight: { procIndex: -1, pid: null, canRun: false, stuck: stuckIndices, stuckPids: stuckNames, stuckProcesses: stuckNames },
      snapshot: { work: [...work], allocation, max, need, finish: [...finish], sequence: [...sequence], safeSequence: [...sequence], safe: false },
      note: `No process can proceed: UNSAFE state. Stuck: ${stuckNames.join(', ')}.`,
    });
  }

  return { safe, sequence: safe ? sequence : [], steps };
}

/**
 * Resource-Request Algorithm for process Pi requesting resources.
 * Returns full verification checks and step-by-step simulation trace.
 * @param {number} pidIndex - Index of requesting process
 * @param {number[]} request - Requested resource units vector
 * @param {number[][]} allocation
 * @param {number[][]} max
 * @param {number[]} available
 * @param {string[]} [processNames]
 */
export function requestResources(pidIndex, request, allocation, max, available, processNames = []) {
  const n = allocation.length;
  const names = Array.from({ length: n }, (_, i) => processNames[i] || `P${i}`);
  const requestingPid = names[pidIndex] || `P${pidIndex}`;
  const need = computeNeed(max, allocation);
  const reqStr = `[${request.join(', ')}]`;
  const checks = [];
  const steps = [];

  // Check 1: Request <= Need
  const withinNeed = request.every((r, j) => r <= need[pidIndex][j]);
  checks.push({
    name: 'Claim Check (Request ≤ Need)',
    passed: withinNeed,
    text: withinNeed ? `Request ${reqStr} ≤ declared Need [${need[pidIndex].join(', ')}].` : `Error: Request ${reqStr} exceeds maximum declared Need [${need[pidIndex].join(', ')}].`,
  });
  steps.push({
    index: 0,
    title: `Check 1: Claim Check (${requestingPid} Request ≤ Need)`,
    explanation: withinNeed
      ? `Process ${requestingPid} requested ${reqStr}, within its declared maximum Need [${need[pidIndex].join(', ')}]. Check passed.`
      : `Process ${requestingPid} requested ${reqStr}, exceeding its declared maximum Need [${need[pidIndex].join(', ')}]. Denied.`,
    highlight: { stepType: 'check1', passed: withinNeed, claimCheck: withinNeed, pidIndex },
    snapshot: { request, need: need[pidIndex], available, allocation },
  });
  if (!withinNeed) {
    steps.push({
      index: 1,
      title: 'Final Decision: MUST WAIT / REJECTED (Exceeds Claim)',
      explanation: `Request denied: ${requestingPid} requested ${reqStr}, which exceeds its declared maximum Need [${need[pidIndex].join(', ')}]. System state unchanged.`,
      highlight: { stepType: 'decision', granted: false, reason: 'exceeds-need' },
      snapshot: { request, available, allocation },
    });
    return { granted: false, reason: 'exceeds-need', checks, steps };
  }

  // Check 2: Request <= Available
  const withinAvailable = request.every((r, j) => r <= available[j]);
  checks.push({
    name: 'Availability Check (Request ≤ Available)',
    passed: withinAvailable,
    text: withinAvailable ? `Request ${reqStr} ≤ Available [${available.join(', ')}].` : `Wait: Request ${reqStr} exceeds Available [${available.join(', ')}].`,
  });
  steps.push({
    index: steps.length,
    title: `Check 2: Availability Check (Request ≤ Available)`,
    explanation: withinAvailable
      ? `Requested resources ${reqStr} are available in the system Available vector [${available.join(', ')}].`
      : `Requested resources ${reqStr} exceed currently available units [${available.join(', ')}]. ${requestingPid} must wait.`,
    highlight: { stepType: 'check2', passed: withinAvailable, availCheck: withinAvailable, pidIndex },
    snapshot: { request, available, allocation },
  });
  if (!withinAvailable) {
    steps.push({
      index: steps.length,
      title: 'Final Decision: MUST WAIT',
      explanation: `System has insufficient available resources. ${requestingPid} must wait. No allocation made.`,
      highlight: { stepType: 'decision', granted: false, reason: 'exceeds-available' },
      snapshot: { request, available, allocation },
    });
    return { granted: false, reason: 'exceeds-available', checks, steps };
  }

  // Check 3: Pretend allocation and check safety
  const newAvailable = available.map((a, j) => a - request[j]);
  const newAllocation = allocation.map((row, i) => (i === pidIndex ? row.map((a, j) => a + request[j]) : [...row]));
  const newNeed = computeNeed(max, newAllocation);

  steps.push({
    index: steps.length,
    title: `Check 3: Pretend Allocation for ${requestingPid}`,
    explanation: `Temporarily allocating ${reqStr} to ${requestingPid}. Available becomes [${newAvailable.join(', ')}], Allocation becomes [${newAllocation[pidIndex].join(', ')}]. Executing safety check...`,
    highlight: { stepType: 'pretend', pidIndex },
    snapshot: { available: newAvailable, allocation: newAllocation, need: newNeed },
  });

  const safetyResult = isSafe(newAllocation, max, newAvailable, processNames);
  for (const s of safetyResult.steps) {
    steps.push({ ...s, index: steps.length, title: `Safety Test: ${s.title}` });
  }

  checks.push({
    name: 'Safety Check (Pretend Allocation)',
    passed: safetyResult.safe,
    text: safetyResult.safe ? `Safe: Granting request maintains safe state with sequence: ${safetyResult.sequence.join(' → ')}.` : 'Unsafe: Granting request leads to an unsafe state. Process must wait.',
  });

  steps.push({
    index: steps.length,
    title: safetyResult.safe ? 'Final Decision: REQUEST GRANTED' : 'Final Decision: MUST WAIT (Unsafe State)',
    explanation: safetyResult.safe
      ? `Pretend allocation leaves system in a SAFE state (${safetyResult.sequence.join(' → ')}). Request granted.`
      : `Pretend allocation leads to an UNSAFE state. Deadlock could occur; ${requestingPid} must wait.`,
    highlight: { stepType: 'decision', granted: safetyResult.safe, reason: safetyResult.safe ? 'granted' : 'unsafe' },
    snapshot: { available: newAvailable, allocation: newAllocation, need: newNeed },
  });

  if (!safetyResult.safe) return { granted: false, reason: 'unsafe', checks, safetyResult, steps };

  return {
    granted: true,
    reason: 'granted',
    checks,
    newState: { allocation: newAllocation, max, available: newAvailable, need: newNeed },
    safetyResult,
    steps,
  };
}
