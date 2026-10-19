/**
 * Step-by-Step Safety Algorithm Execution Trace Table.
 * Uses the generic usePlayback hook to animate through safety verification steps,
 * highlighting the active decision row, Work vector evolutions, and Need checks.
 */

import { usePlayback } from '../../hooks/usePlayback.js';

/**
 * @param {{
 *   steps: Array<{
 *     pid: string,
 *     work: number[],
 *     need: number[],
 *     canRun: boolean,
 *     workAfter: number[],
 *     note: string
 *   }>
 * }} props
 */
export function SafetyTrace({ steps }) {
  const playback = usePlayback(steps?.length || 0, { initialSpeedMs: 700 });

  if (!steps || steps.length === 0) {
    return <p className="hint-text">Run &quot;Check System Safety&quot; to inspect step-by-step trace.</p>;
  }

  return (
    <div className="safety-trace-container">
      {/* 1. Playback Stepper Controls */}
      <div className="trace-playback-bar">
        <div className="trace-status">
          <span>Inspection Step: </span>
          <strong className="step-badge">{playback.step + 1} / {steps.length}</strong>
        </div>

        <div className="playback-btn-group">
          <button
            type="button"
            className="btn-sm btn-secondary"
            onClick={playback.reset}
            title="Reset to beginning"
          >
            ⏮ Reset
          </button>
          <button
            type="button"
            className="btn-sm btn-secondary"
            onClick={playback.prev}
            disabled={playback.step === 0}
            title="Previous step"
          >
            ◀ Prev
          </button>
          <button
            type="button"
            className={`btn-sm ${playback.isPlaying ? 'btn-danger' : 'btn-primary'}`}
            onClick={playback.isPlaying ? playback.pause : playback.play}
            title={playback.isPlaying ? 'Pause animation' : 'Auto-play trace'}
          >
            {playback.isPlaying ? '⏸ Pause' : '▶ Play'}
          </button>
          <button
            type="button"
            className="btn-sm btn-secondary"
            onClick={playback.next}
            disabled={playback.step >= steps.length - 1}
            title="Next step"
          >
            Next ▶
          </button>
        </div>
      </div>

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
                  <td style={{ fontWeight: 700, color: 'var(--accent-cyan)' }}>{st.pid}</td>
                  <td><code>[{st.work.join(', ')}]</code></td>
                  <td><code>[{st.need.join(', ')}]</code></td>
                  <td>
                    <span className={`status-pill ${st.canRun ? 'pill-safe' : 'pill-unsafe'}`} style={{ fontSize: '0.7rem' }}>
                      {st.canRun ? '✓ Yes' : '✗ No'}
                    </span>
                  </td>
                  <td><code>[{st.workAfter.join(', ')}]</code></td>
                  <td style={{ fontSize: '0.8rem', textAlign: 'left' }}>{st.note}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
