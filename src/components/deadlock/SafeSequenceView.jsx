/**
 * Safe Sequence & State Status Indicator Component.
 * Displays high-visibility SAFE / UNSAFE badge, renders progressive safe sequence
 * as an arrow chain, and highlights stuck processes in an unsafe state.
 */

/**
 * @param {{
 *   safe: boolean,
 *   sequence: string[],
 *   currentSequence?: string[],
 *   stuckProcesses?: string[],
 *   explanation?: string
 * }} props
 */
export function SafeSequenceView({
  safe,
  sequence = [],
  currentSequence = null,
  stuckProcesses = [],
  explanation = '',
}) {
  const displaySequence = currentSequence !== null ? currentSequence : sequence;
  const isBuilding = currentSequence !== null && currentSequence.length < sequence.length && safe;

  return (
    <div className={`safety-status-card ${safe ? 'status-safe' : 'status-unsafe'}`}>
      <div className="safety-badge-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
        <span className={`status-pill ${safe ? 'pill-safe' : 'pill-unsafe'}`}>
          {safe ? '✓ SYSTEM IS IN SAFE STATE' : '⚠️ SYSTEM IS IN UNSAFE STATE'}
        </span>
        {isBuilding && (
          <span style={{ fontSize: '0.75rem', color: 'var(--accent-cyan)' }}>
            Building sequence ({currentSequence.length} / {sequence.length} finished)...
          </span>
        )}
      </div>

      {safe ? (
        <div className="safe-sequence-flow" style={{ marginTop: '0.5rem' }}>
          <span className="sequence-label">
            {isBuilding ? 'Safe Sequence So Far:' : 'Safe Execution Sequence:'}
          </span>
          {displaySequence.length === 0 ? (
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              (Initializing first process...)
            </span>
          ) : (
            <div className="sequence-chain" role="list" aria-label="Safe Process Execution Sequence">
              {displaySequence.map((pid, idx) => (
                <div key={pid} className="sequence-node" role="listitem">
                  <span className="sequence-chip" style={{ background: 'var(--bg-card)', borderColor: 'var(--accent-green)', color: 'var(--accent-green)' }}>
                    {pid}
                  </span>
                  {idx < displaySequence.length - 1 && <span className="sequence-arrow" aria-hidden="true">➔</span>}
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="unsafe-explanation" style={{ marginTop: '0.5rem' }}>
          <p style={{ margin: '0 0 0.5rem 0', fontWeight: 600, color: 'var(--accent-rose)' }}>
            No process can proceed: UNSAFE state
          </p>
          <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.85rem' }}>
            {explanation || 'No process has Need ≤ Available Work. The system is at risk of deadlock.'}
          </p>
          {stuckProcesses.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>Stuck Processes:</span>
              {stuckProcesses.map((p) => (
                <span key={p} className="sequence-chip" style={{ borderColor: 'var(--accent-rose)', color: 'var(--accent-rose)', fontSize: '0.75rem' }}>
                  ✗ {p}
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
