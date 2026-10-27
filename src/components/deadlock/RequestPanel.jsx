/**
 * Resource Request Algorithm Simulation Panel.
 * Evaluates Pi requests through Banker's verification checks and safety run.
 * Provides step-by-step playback with PlaybackControls and StepLog.
 */

import { useState } from 'react';
import { requestResources } from '../../algorithms/deadlock/bankers.js';
import { PlaybackControls } from '../common/PlaybackControls.jsx';
import { StepLog } from '../common/StepLog.jsx';
import { usePlayback } from '../../hooks/usePlayback.js';

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

  const playback = usePlayback(result?.steps?.length || 0, { initialSpeedMs: 700 });

  const handleVectorChange = (idx, val) => {
    const num = Math.max(0, parseInt(val, 10) || 0);
    setRequestVector((prev) => prev.map((v, i) => (i === idx ? num : v)));
  };

  const handleEvaluate = (e) => {
    e.preventDefault();
    const res = requestResources(selectedPidIdx, requestVector, allocation, max, available, processNames);
    setResult(res);
    playback.reset();
  };

  const activeStep = result?.steps?.[playback.step];

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

          <button type="submit" className="btn btn-primary" style={{ minHeight: '38px' }}>
            <span>⚡ Evaluate Request</span>
          </button>
        </div>
      </form>

      {result && (
        <div className="request-result-container" style={{ marginTop: '1.25rem' }}>
          <div className="request-decision-banner" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
            <span className="decision-title" style={{ fontWeight: 700 }}>Decision:</span>
            <span
              className={`status-pill ${
                result.granted ? 'pill-safe' : result.reason === 'exceeds-need' ? 'pill-unsafe' : 'pill-warn'
              }`}
              style={{ fontSize: '0.9rem', fontWeight: 800 }}
            >
              {result.granted ? '✓ REQUEST GRANTED' : result.reason === 'exceeds-need' ? '✗ ERROR: EXCEEDS CLAIM' : '⏳ MUST WAIT (UNSAFE)'}
            </span>
          </div>

          {/* Stepping controls for request evaluation */}
          {result.steps?.length > 0 && (
            <div style={{ marginBottom: '1rem' }}>
              <PlaybackControls playback={playback} totalSteps={result.steps.length} stepFormat="step" />
              {activeStep && (
                <div style={{ padding: '0.6rem 0.85rem', background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', marginTop: '0.5rem' }}>
                  <div style={{ fontWeight: 700, color: 'var(--accent-cyan)', fontSize: '0.85rem' }}>{activeStep.title}</div>
                  <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>{activeStep.explanation}</div>
                </div>
              )}
              <StepLog steps={result.steps} currentStep={playback.step} onJumpTo={playback.jumpTo} title="Request Evaluation Steps" maxHeight="180px" />
            </div>
          )}

          {result.granted && onApplyState && (
            <div style={{ marginTop: '0.75rem' }}>
              <button type="button" className="btn btn-secondary" onClick={() => onApplyState(result.newState)}>
                📥 Apply Granted State to Simulator
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
