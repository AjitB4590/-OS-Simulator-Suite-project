/**
 * Resource Request Algorithm Simulation Panel.
 * Evaluates Pi requests through the three classical Banker's verification checks
 * and displays decision badges (GRANTED / MUST WAIT / ERROR) with resulting state preview.
 */

import { useState } from 'react';
import { requestResources } from '../../algorithms/deadlock/bankers.js';

/**
 * @param {{
 *   processNames: string[],
 *   resourceNames: string[],
 *   allocation: number[][],
 *   max: number[][],
 *   available: number[],
 *   onApplyState?: (newState: any) => void
 * }} props
 */
export function RequestPanel({
  processNames,
  resourceNames,
  allocation,
  max,
  available,
  onApplyState,
}) {
  const [selectedPidIdx, setSelectedPidIdx] = useState(0);
  const [requestVector, setRequestVector] = useState(() => Array(resourceNames.length).fill(0));
  const [result, setResult] = useState(null);

  const handleVectorChange = (idx, val) => {
    const num = Math.max(0, parseInt(val, 10) || 0);
    setRequestVector((prev) => prev.map((v, i) => (i === idx ? num : v)));
  };

  const handleEvaluate = (e) => {
    e.preventDefault();
    const res = requestResources(
      selectedPidIdx,
      requestVector,
      allocation,
      max,
      available,
      processNames
    );
    setResult(res);
  };

  return (
    <div className="request-panel">
      <form onSubmit={handleEvaluate} className="request-form">
        <div className="request-input-row" style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center' }}>
          <div className="inline-field">
            <label htmlFor="req-pid-select" style={{ fontWeight: 600 }}>Requesting Process:</label>
            <select
              id="req-pid-select"
              className="select-input"
              value={selectedPidIdx}
              onChange={(e) => {
                setSelectedPidIdx(Number(e.target.value));
                setResult(null);
              }}
            >
              {processNames.map((name, i) => (
                <option key={name} value={i}>{name}</option>
              ))}
            </select>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>Request Vector:</span>
            {resourceNames.map((resName, rIdx) => (
              <div key={resName} className="inline-field" style={{ gap: '0.25rem' }}>
                <label htmlFor={`req-res-${rIdx}`} style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{resName}:</label>
                <input
                  id={`req-res-${rIdx}`}
                  type="number"
                  className="table-input"
                  min="0"
                  value={requestVector[rIdx] ?? 0}
                  onChange={(e) => handleVectorChange(rIdx, e.target.value)}
                />
              </div>
            ))}
          </div>

          <button type="submit" className="btn btn-primary" style={{ minHeight: '40px' }}>
            <span>⚡ Evaluate Request</span>
          </button>
        </div>
      </form>

      {/* 3-Step Verification Checklist & Decision */}
      {result && (
        <div className="request-result-container" style={{ marginTop: '1.25rem' }}>
          <div className="request-decision-banner" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
            <span className="decision-title">Final Decision:</span>
            <span
              className={`status-pill ${
                result.granted ? 'pill-safe' : result.reason === 'exceeds-need' ? 'pill-unsafe' : 'pill-warn'
              }`}
              style={{ fontSize: '0.9rem', fontWeight: 800 }}
            >
              {result.granted ? '✓ REQUEST GRANTED' : result.reason === 'exceeds-need' ? '✗ ERROR: EXCEEDS CLAIM' : '⏳ MUST WAIT'}
            </span>
          </div>

          <div className="request-checks-list" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {result.checks.map((chk, i) => (
              <div key={i} className={`check-item ${chk.passed ? 'check-pass' : 'check-fail'}`}>
                <span className="check-icon">{chk.passed ? '✓' : '✗'}</span>
                <div>
                  <strong>{chk.name}</strong>
                  <p style={{ margin: '0.15rem 0 0', fontSize: '0.85rem' }}>{chk.text}</p>
                </div>
              </div>
            ))}
          </div>

          {result.granted && onApplyState && (
            <div style={{ marginTop: '1rem' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => onApplyState(result.newState)}
              >
                📥 Apply Granted State to Simulator
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
