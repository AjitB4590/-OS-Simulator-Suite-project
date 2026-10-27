/**
 * Banker's Algorithm Configuration & Matrix Management Panel.
 * Manages dimensions (1-10 processes, 1-6 resources), Allocation, Max,
 * Available vector, presets, JSON import/export, and safety calculation triggers.
 */

import { useRef } from 'react';
import { MatrixInput } from './MatrixInput.jsx';
import { NeedMatrix } from './NeedMatrix.jsx';
import { BANKERS_PRESETS } from '../../data/deadlockPresets.js';

/**
 * @param {{
 *   state: {
 *     processNames: string[],
 *     resourceNames: string[],
 *     allocation: number[][],
 *     max: number[][],
 *     available: number[],
 *     need: number[][]
 *   },
 *   onChangeState: (next: any) => void,
 *   onCheckSafety: () => void,
 *   onRandomize: () => void
 * }} props
 */
export function BankersForm({
  state,
  onChangeState,
  onCheckSafety,
  onRandomize,
  highlightRowIndex = -1,
  finishedRows = [],
  stuckRows = [],
  workVector = null,
  activeStep = null,
}) {
  const fileInputRef = useRef(null);

  const handleProcessCountChange = (count) => {
    const n = Math.max(1, Math.min(10, count));
    const m = state.resourceNames.length;
    const processNames = Array.from({ length: n }, (_, i) => `P${i}`);
    const allocation = Array.from({ length: n }, (_, i) => state.allocation[i]?.slice(0, m) || Array(m).fill(0));
    const max = Array.from({ length: n }, (_, i) => state.max[i]?.slice(0, m) || Array(m).fill(1));
    onChangeState({ ...state, processNames, allocation, max });
  };

  const handleResourceCountChange = (count) => {
    const m = Math.max(1, Math.min(6, count));
    const letters = ['A', 'B', 'C', 'D', 'E', 'F'];
    const resourceNames = letters.slice(0, m);
    const available = Array.from({ length: m }, (_, j) => state.available[j] ?? 3);
    const allocation = state.allocation.map((row) => Array.from({ length: m }, (_, j) => row[j] ?? 0));
    const max = state.max.map((row) => Array.from({ length: m }, (_, j) => row[j] ?? 1));
    onChangeState({ ...state, resourceNames, available, allocation, max });
  };

  const handleExportJson = () => {
    const payload = JSON.stringify({ version: '1.0', type: 'bankers-state', ...state }, null, 2);
    const blob = new Blob([payload], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bankers-state-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportJson = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result);
        if (parsed.allocation && parsed.max && parsed.available) {
          onChangeState({
            processNames: parsed.processNames || parsed.allocation.map((_, i) => `P${i}`),
            resourceNames: parsed.resourceNames || parsed.available.map((_, j) => String.fromCharCode(65 + j)),
            allocation: parsed.allocation,
            max: parsed.max,
            available: parsed.available,
          });
        }
      } catch {
        // Handled silently
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="bankers-form-container">
      {/* 1. Dimension & Preset Action Bar */}
      <div className="controls-bar" style={{ justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'center' }}>
          <div className="inline-field">
            <label htmlFor="p-count">Processes:</label>
            <input id="p-count" type="number" className="table-input" min="1" max="10" value={state.processNames.length} onChange={(e) => handleProcessCountChange(Number(e.target.value))} />
          </div>
          <div className="inline-field">
            <label htmlFor="r-count">Resources:</label>
            <input id="r-count" type="number" className="table-input" min="1" max="6" value={state.resourceNames.length} onChange={(e) => handleResourceCountChange(Number(e.target.value))} />
          </div>
          <div className="inline-field">
            <label htmlFor="preset-select">Presets:</label>
            <select id="preset-select" className="select-input" onChange={(e) => { const f = BANKERS_PRESETS.find((p) => p.id === e.target.value); if (f) onChangeState(f); }}>
              <option value="">Load Preset...</option>
              {BANKERS_PRESETS.map((p) => (<option key={p.id} value={p.id}>{p.name}</option>))}
            </select>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button type="button" className="btn btn-secondary" onClick={onRandomize} title="Generate random valid state">🎲 Random</button>
          <button type="button" className="btn btn-secondary" onClick={handleExportJson} title="Export state as JSON">💾 Export</button>
          <input ref={fileInputRef} type="file" accept=".json" style={{ display: 'none' }} onChange={handleImportJson} />
          <button type="button" className="btn btn-secondary" onClick={() => fileInputRef.current?.click()} title="Import JSON file">📂 Import</button>
          <button type="button" className="btn btn-primary" onClick={onCheckSafety}><span>⚡ Check Safety</span></button>
        </div>
      </div>

      {/* 2. Available & Live Work Vectors */}
      <div className="available-vector-bar" style={{ margin: '0.75rem 0 1.25rem', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>Available:</span>
          {state.resourceNames.map((rName, j) => (
            <div key={rName} className="inline-field" style={{ gap: '0.25rem' }}>
              <label htmlFor={`avail-${j}`} style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{rName}:</label>
              <input
                id={`avail-${j}`}
                type="number"
                className="table-input"
                min="0"
                value={state.available[j] ?? 0}
                onChange={(e) => {
                  const num = Math.max(0, parseInt(e.target.value, 10) || 0);
                  onChangeState({ ...state, available: state.available.map((val, idx) => (idx === j ? num : val)) });
                }}
              />
            </div>
          ))}
        </div>

        {workVector && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--bg-card-solid)', padding: '0.3rem 0.6rem', borderRadius: '4px', border: '1px solid var(--accent-cyan)' }}>
            <span style={{ fontWeight: 700, fontSize: '0.82rem', color: 'var(--accent-cyan)' }}>Live Work Vector:</span>
            <code style={{ fontSize: '0.85rem', color: 'var(--text-primary)' }}>[{workVector.join(', ')}]</code>
            {activeStep?.canRun !== undefined && activeStep?.canRun !== null && (
              <span className={`status-pill ${activeStep.canRun ? 'pill-safe' : 'pill-unsafe'}`} style={{ fontSize: '0.7rem' }}>
                Need ≤ Work: {activeStep.canRun ? '✓ YES' : '✗ NO'}
              </span>
            )}
          </div>
        )}
      </div>

      {/* 3. Matrices Grid */}
      <div className="bankers-matrices-grid">
        <MatrixInput
          title="Allocation Matrix"
          matrix={state.allocation}
          rowHeaders={state.processNames}
          colHeaders={state.resourceNames}
          onChange={(alloc) => onChangeState({ ...state, allocation: alloc })}
          highlightRowIndex={highlightRowIndex}
          finishedRows={finishedRows}
          stuckRows={stuckRows}
        />
        <MatrixInput
          title="Max Claim Matrix"
          matrix={state.max}
          rowHeaders={state.processNames}
          colHeaders={state.resourceNames}
          onChange={(max) => onChangeState({ ...state, max })}
          highlightRowIndex={highlightRowIndex}
          finishedRows={finishedRows}
          stuckRows={stuckRows}
        />
        <NeedMatrix
          need={state.need}
          rowHeaders={state.processNames}
          colHeaders={state.resourceNames}
          highlightRowIndex={highlightRowIndex}
          finishedRows={finishedRows}
          stuckRows={stuckRows}
        />
      </div>
    </div>
  );
}
