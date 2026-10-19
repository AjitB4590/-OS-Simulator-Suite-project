/**
 * Comprehensive Algorithm Comparison Panel component.
 * Displays cross-algorithm metric tables highlighting optimal values with green badges,
 * an AI-reasoned best algorithm summary card, and a Recharts comparative bar chart.
 */

import { CompareChart } from './CompareChart.jsx';

/**
 * @param {{
 *   comparisonResult: {
 *     comparisons: Array<object>,
 *     bestAlgorithm: object | null,
 *     reason: string
 *   },
 *   isDark: boolean
 * }} props
 */
export function ComparePanel({ comparisonResult, isDark }) {
  if (!comparisonResult || !comparisonResult.comparisons.length) return null;

  const { comparisons, bestAlgorithm, reason } = comparisonResult;

  // Compute best values for badge highlighting
  const minWt = Math.min(...comparisons.map((c) => c.metrics.avgWt));
  const minTat = Math.min(...comparisons.map((c) => c.metrics.avgTat));
  const minRt = Math.min(...comparisons.map((c) => c.metrics.avgRt));
  const maxUtil = Math.max(...comparisons.map((c) => c.metrics.cpuUtilization));
  const maxThroughput = Math.max(...comparisons.map((c) => c.metrics.throughput));
  const minCS = Math.min(...comparisons.map((c) => c.metrics.contextSwitches));

  const renderBadge = (val, isBest, suffix = '') => (
    <span
      style={{
        padding: isBest ? '0.2rem 0.5rem' : undefined,
        borderRadius: isBest ? '4px' : undefined,
        backgroundColor: isBest ? 'rgba(52, 211, 153, 0.15)' : 'transparent',
        color: isBest ? 'var(--accent-emerald)' : 'inherit',
        fontWeight: isBest ? 700 : 'normal',
      }}
    >
      {val}
      {suffix}
      {isBest && ' ★'}
    </span>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* 1. Best Algorithm for Current Workload Card */}
      {bestAlgorithm && (
        <div style={{ background: 'rgba(56, 189, 248, 0.08)', border: '1px solid rgba(56, 189, 248, 0.25)', borderRadius: 'var(--radius-md)', padding: '0.85rem 1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, color: 'var(--accent-cyan)' }}>
            <span>🏆 Best Algorithm for This Input: {bestAlgorithm.name}</span>
          </div>
          <p style={{ margin: '0.35rem 0 0', fontSize: '0.85rem', color: 'var(--text-primary)' }}>
            {reason}
          </p>
        </div>
      )}

      {/* 2. Side-by-Side Comparison Table */}
      <div className="table-responsive">
        <table className="data-table" aria-label="Algorithms Comparative Metrics">
          <thead>
            <tr>
              <th>Algorithm</th>
              <th>Type</th>
              <th>Avg WT</th>
              <th>Avg TAT</th>
              <th>Avg RT</th>
              <th>CPU Util</th>
              <th>Throughput</th>
              <th>CS</th>
            </tr>
          </thead>
          <tbody>
            {comparisons.map((c) => (
              <tr key={c.algoId} style={c.algoId === bestAlgorithm?.algoId ? { background: 'rgba(56, 189, 248, 0.05)' } : undefined}>
                <td style={{ fontWeight: 600, textAlign: 'left' }}>{c.name}</td>
                <td>
                  <span style={{ fontSize: '0.75rem', color: c.preemptive ? 'var(--accent-cyan)' : 'var(--text-muted)' }}>
                    {c.preemptive ? 'Preemptive' : 'Non-Preemptive'}
                  </span>
                </td>
                <td>{renderBadge(c.metrics.avgWt.toFixed(2), c.metrics.avgWt === minWt)}</td>
                <td>{renderBadge(c.metrics.avgTat.toFixed(2), c.metrics.avgTat === minTat)}</td>
                <td>{renderBadge(c.metrics.avgRt.toFixed(2), c.metrics.avgRt === minRt)}</td>
                <td>{renderBadge(c.metrics.cpuUtilization.toFixed(1), c.metrics.cpuUtilization === maxUtil, '%')}</td>
                <td>{renderBadge(c.metrics.throughput.toFixed(3), c.metrics.throughput === maxThroughput, '/t')}</td>
                <td>{renderBadge(c.metrics.contextSwitches, c.metrics.contextSwitches === minCS)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 3. Recharts Grouped Comparison Chart */}
      <div style={{ background: 'var(--bg-surface)', padding: '1rem', borderRadius: 'var(--radius-md)' }}>
        <h4 style={{ fontSize: '0.95rem', margin: 0 }}>Visual Performance Benchmark (WT vs. TAT vs. RT)</h4>
        <CompareChart comparisons={comparisons} isDark={isDark} />
      </div>
    </div>
  );
}
