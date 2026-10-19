/**
 * Custom React hook for running CPU scheduling simulations.
 * Coordinates input validation, registry lookup, and execution,
 * returning either the simulation result or an array of validation errors.
 */

import { useState } from 'react';
import { getAlgorithm } from '../algorithms/scheduling/index.js';
import { validateProcesses } from '../algorithms/scheduling/shared/validate.js';

/**
 * Hook to manage simulation state and trigger algorithm runs.
 *
 * @param {Array<{ pid: string, at: number, bt: number, priority?: number }>} processes
 * @param {string} algoId - Algorithm identifier (fcfs, sjf, priority, rr)
 * @param {object} [options] - Options such as { quantum: number }
 * @returns {{
 *   result: object | null,
 *   errors: string[],
 *   runSimulation: () => boolean,
 *   clearSimulation: () => void
 * }}
 */
export function useSimulation(processes, algoId, options = {}) {
  const [result, setResult] = useState(null);
  const [errors, setErrors] = useState([]);

  const runSimulation = () => {
    const validationErrors = validateProcesses(processes, options);

    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      setResult(null);
      return false;
    }

    setErrors([]);
    const algo = getAlgorithm(algoId);
    const simulationResult = algo.simulate(processes, options);
    setResult(simulationResult);
    return true;
  };

  const clearSimulation = () => {
    setResult(null);
    setErrors([]);
  };

  return {
    result,
    errors,
    runSimulation,
    clearSimulation,
  };
}
