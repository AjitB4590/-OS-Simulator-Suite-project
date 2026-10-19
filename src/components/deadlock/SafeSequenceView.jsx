/**
 * Safe Sequence & State Status Indicator Component.
 * Displays high-visibility SAFE / UNSAFE badge and renders the sequence as an arrow chain.
 */

/**
 * @param {{
 *   safe: boolean,
 *   sequence: string[]
 * }} props
 */
export function SafeSequenceView({ safe, sequence }) {
  return (
    <div className={`safety-status-card ${safe ? 'status-safe' : 'status-unsafe'}`}>
      <div className="safety-badge-header">
        <span className={`status-pill ${safe ? 'pill-safe' : 'pill-unsafe'}`}>
          {safe ? '✓ SYSTEM IS IN SAFE STATE' : '⚠️ SYSTEM IS IN UNSAFE STATE'}
        </span>
      </div>

      {safe ? (
        <div className="safe-sequence-flow">
          <span className="sequence-label">Safe Execution Sequence:</span>
          <div className="sequence-chain" role="list" aria-label="Safe Process Execution Sequence">
            {sequence.map((pid, idx) => (
              <div key={pid} className="sequence-node" role="listitem">
                <span className="sequence-chip">{pid}</span>
                {idx < sequence.length - 1 && <span className="sequence-arrow" aria-hidden="true">➔</span>}
              </div>
            ))}
          </div>
        </div>
      ) : (
        <p className="unsafe-explanation">
          No sequence exists that guarantees all processes can finish with available resources.
          The system is at risk of deadlock if processes claim their declared maximum allocations.
        </p>
      )}
    </div>
  );
}
