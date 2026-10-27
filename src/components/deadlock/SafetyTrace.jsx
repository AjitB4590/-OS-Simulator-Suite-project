/**
 * Step-by-Step Safety Algorithm Execution Trace Table.
 * Uses shared PlaybackControls and StepLog components to animate through
 * safety verification steps, highlighting the active decision row, Work vector evolutions,
 * and Need checks.
 */

import { PlaybackControls } from '../common/PlaybackControls.jsx';
import { StepLog } from '../common/StepLog.jsx';
import { usePlayback } from '../../hooks/usePlayback.js';

/**
 * @param {{
 *   steps: Array<{
 *     pid?: string,
 *     work?: number[],
 *     need?: number[],
 *     canRun?: boolean,
 *     workAfter?: number[],
 *     note?: string,
 *     title?: string,
 *     explanation?: string
 *   }>,
 *   playback?: any
 * }} props
 */
export function SafetyTrace({ steps = [], playback: externalPlayback }) {
  const internalPlayback = usePlayback(steps.length, { initialSpeedMs: 700 });
  const playback = externalPlayback || internalPlayback;

  if (!steps || steps.length === 0) {
    return <p className="hint-text">Run &quot;Check System Safety&quot; to inspect step-by-step trace.</p>;
  }

  return (
    <div className="safety-trace-container">
      {/* 1. Shared Playback Stepper Controls */}
      <PlaybackControls
        playback={playback}
        totalSteps={steps.length}
        stepFormat="step"
      />

      {/* 2. Stepping Trace Table */}
      <div className="table-responsive" style={{ marginTop: '0.75rem' }}>
        <table className="data-table" aria-label="Banker's Algorithm Safety Trace Steps">
          <thead>
            <tr>
              <th style={{ width: '45px' }}>#</th>
              <th>PID</th>
              <th>Work</th>
              <th>Need</th>
              <th>Need ≤ Work</th>
              <th>Work After Release</th>
              <th>Decision Note</th>
            </tr>
          </thead>
          <tbody>
            {steps.map((st, idx) => {
              const isActive = idx === playback.step;
              return (
                <tr
                  key={idx}
                  className={isActive ? 'active-trace-row' : undefined}
                  onClick={() => playback.jumpTo(idx)}
                  style={{ cursor: 'pointer' }}
                  title="Click to jump playback to this step"
                >
                  <td style={{ fontWeight: 600 }}>{idx + 1}</td>
                  <td style={{ fontWeight: 700, color: 'var(--accent-cyan)' }}>{st.pid || '—'}</td>
                  <td><code>[{st.work ? st.work.join(', ') : '—'}]</code></td>
                  <td><code>[{st.need?.length ? st.need.join(', ') : '—'}]</code></td>
                  <td>
                    {st.canRun !== undefined && st.canRun !== null ? (
                      <span className={`status-pill ${st.canRun ? 'pill-safe' : 'pill-unsafe'}`} style={{ fontSize: '0.7rem' }}>
                        {st.canRun ? '✓ Yes' : '✗ No'}
                      </span>
                    ) : (
                      '—'
                    )}
                  </td>
                  <td><code>[{st.workAfter ? st.workAfter.join(', ') : '—'}]</code></td>
                  <td style={{ fontSize: '0.8rem', textAlign: 'left' }}>{st.explanation || st.note || ''}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* 3. Reusable Step Log */}
      <StepLog
        steps={steps}
        currentStep={playback.step}
        onJumpTo={playback.jumpTo}
        title="Safety Verification Step Log"
      />
    </div>
  );
}
