/**
 * Algorithm Selector and Execution Controls component.
 * Supports dynamic configuration for quantum, MLFQ queues/slices,
 * context switch overhead, starvation factor, and comparison triggers.
 */

import { ALGORITHM_OPTIONS, getAlgorithm } from '../../algorithms/scheduling/index.js';

/**
 * @param {{
 *   selectedAlgo: string,
 *   onChangeAlgo: (algoId: string) => void,
 *   quantum: number,
 *   onChangeQuantum: (val: number) => void,
 *   mlfqQueues: number,
 *   onChangeMlfqQueues: (val: number) => void,
 *   mlfqQuantums: string,
 *   onChangeMlfqQuantums: (val: string) => void,
 *   csOverhead: number,
 *   onChangeCsOverhead: (val: number) => void,
 *   starvationFactor: number,
 *   onChangeStarvationFactor: (val: number) => void,
 *   onSimulate: () => void,
 *   onCompareAll: () => void
 * }} props
 */
export function AlgorithmSelector({
  selectedAlgo, onChangeAlgo,
  quantum, onChangeQuantum,
  mlfqQueues, onChangeMlfqQueues,
  mlfqQuantums, onChangeMlfqQuantums,
  csOverhead, onChangeCsOverhead,
  starvationFactor, onChangeStarvationFactor,
  onSimulate, onCompareAll,
}) {
  const currentAlgo = getAlgorithm(selectedAlgo);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1rem' }}>
      {/* 1. Main Controls Bar */}
      <div className="controls-bar" style={{ justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'center' }}>
          <div className="inline-field">
            <label htmlFor="algo-select" style={{ fontWeight: 600, fontSize: '0.9rem' }}>Algorithm:</label>
            <select id="algo-select" className="select-input" value={selectedAlgo} onChange={(e) => onChangeAlgo(e.target.value)}>
              {ALGORITHM_OPTIONS.map((algo) => (
                <option key={algo.id} value={algo.id}>
                  {algo.name} {algo.preemptive ? '(Preemptive)' : '(Non-Preemptive)'}
                </option>
              ))}
            </select>
          </div>

          {currentAlgo.needsQuantum && (
            <div className="inline-field">
              <label htmlFor="time-quantum" style={{ fontWeight: 600, fontSize: '0.9rem' }}>Time Quantum:</label>
              <input type="number" id="time-quantum" className="text-input" style={{ width: '65px', textAlign: 'center' }} min="1" value={quantum} onChange={(e) => onChangeQuantum(Number(e.target.value))} />
            </div>
          )}

          {currentAlgo.needsMlfqConfig && (
            <>
              <div className="inline-field">
                <label htmlFor="mlfq-queues" style={{ fontWeight: 600, fontSize: '0.9rem' }}>Queues:</label>
                <input type="number" id="mlfq-queues" className="text-input" style={{ width: '55px', textAlign: 'center' }} min="2" max="5" value={mlfqQueues} onChange={(e) => onChangeMlfqQueues(Number(e.target.value))} />
              </div>
              <div className="inline-field">
                <label htmlFor="mlfq-quantums" style={{ fontWeight: 600, fontSize: '0.9rem' }}>Quantums (CSV):</label>
                <input type="text" id="mlfq-quantums" className="text-input" style={{ width: '90px', textAlign: 'center' }} value={mlfqQuantums} onChange={(e) => onChangeMlfqQuantums(e.target.value)} title="Comma-separated quantums (e.g. 2, 4, 8)" />
              </div>
            </>
          )}
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button type="button" className="btn btn-primary" onClick={onSimulate} id="simulate-btn">
            <span>⚡ Simulate Execution</span>
          </button>
          <button type="button" className="btn btn-secondary" onClick={onCompareAll} id="compare-btn" title="Benchmark all 8 algorithms on this input">
            <span>📊 Compare All</span>
          </button>
        </div>
      </div>

      {/* 2. Secondary System Simulation Settings */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.25rem', alignItems: 'center', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
        <div className="inline-field">
          <label htmlFor="cs-overhead">Context Switch Overhead (CS):</label>
          <input type="number" id="cs-overhead" className="text-input" style={{ width: '55px', textAlign: 'center' }} min="0" value={csOverhead} onChange={(e) => onChangeCsOverhead(Math.max(0, Number(e.target.value)))} />
          <span>units</span>
        </div>
        <div className="inline-field">
          <label htmlFor="starvation-factor">Starvation Factor:</label>
          <input type="number" id="starvation-factor" className="text-input" style={{ width: '55px', textAlign: 'center' }} min="1" step="0.5" value={starvationFactor} onChange={(e) => onChangeStarvationFactor(Math.max(1, Number(e.target.value)))} />
          <span>× avg WT</span>
        </div>
      </div>
    </div>
  );
}
