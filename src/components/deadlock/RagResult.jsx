/**
 * Resource Allocation Graph Analysis Result Display Component.
 * Presents status badges (No deadlock / DEADLOCK / Possible deadlock),
 * Holt's theorem explanation, and cycle traversal path.
 */

/**
 * @param {{
 *   analysis: {
 *     status: 'no-cycle'|'deadlock'|'possible-deadlock'|'error',
 *     message: string,
 *     cyclePath?: string,
 *     cycleNodes?: string[]
 *   }
 * }} props
 */
export function RagResult({ analysis }) {
  if (!analysis) return null;

  const isDeadlock = analysis.status === 'deadlock';
  const isPossible = analysis.status === 'possible-deadlock';
  const isNoCycle = analysis.status === 'no-cycle';

  return (
    <div className={`rag-result-panel ${isDeadlock ? 'panel-deadlock' : isPossible ? 'panel-possible' : 'panel-safe'}`}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
        <span className="rag-result-label">System Deadlock State:</span>
        <span
          className={`status-pill ${
            isDeadlock ? 'pill-unsafe' : isPossible ? 'pill-warn' : isNoCycle ? 'pill-safe' : 'pill-unsafe'
          }`}
          style={{ fontSize: '0.9rem', fontWeight: 800 }}
        >
          {isDeadlock
            ? '⚠️ CONFIRMED DEADLOCK'
            : isPossible
            ? '⏳ POSSIBLE DEADLOCK'
            : isNoCycle
            ? '✓ NO DEADLOCK (ACYCLIC)'
            : '✗ GRAPH VALIDATION ERROR'}
        </span>
      </div>

      <p style={{ margin: '0.6rem 0 0', fontSize: '0.85rem', lineHeight: 1.5 }}>
        {analysis.message}
      </p>

      {analysis.cyclePath && (
        <div className="rag-cycle-box" style={{ marginTop: '0.75rem' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--accent-rose)' }}>
            Detected Circular Wait Path:
          </span>
          <div className="cycle-path-text" style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, marginTop: '0.25rem' }}>
            {analysis.cyclePath}
          </div>
        </div>
      )}
    </div>
  );
}
