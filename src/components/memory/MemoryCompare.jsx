/**
 * Memory Allocation Cross-Algorithm Benchmark Comparison.
 * Executes First Fit, Best Fit, and Worst Fit across the same workload,
 * rendering a comparative performance table, Recharts bar chart, and best-fit recommendation.
 */

import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid } from 'recharts';
import { runAllMemoryAlgorithms } from '../../algorithms/memory/index.js';

/**
 * @param {{
 *   blockSizes?: number[],
 *   processSizes?: Array<{ pid: string, size: number }>,
 *   mode?: 'dynamic'|'fixed',
 *   isDark?: boolean
 * }} props
 */
export function MemoryCompare({
  blockSizes = [100, 500, 200, 300, 600],
  processSizes = [
    { pid: 'P1', size: 212 },
    { pid: 'P2', size: 417 },
    { pid: 'P3', size: 112 },
    { pid: 'P4', size: 426 },
  ],
  mode = 'dynamic',
  isDark = true,
}) {
  const safeBlocks = Array.isArray(blockSizes) && blockSizes.length > 0 ? blockSizes : [100, 500, 200, 300, 600];
  const safeProcesses = Array.isArray(processSizes) && processSizes.length > 0 ? processSizes : [{ pid: 'P1', size: 212 }];

  const comparisons = runAllMemoryAlgorithms(safeBlocks, safeProcesses, { mode });

  // Determine best algorithm (fewest unallocated, then highest utilization)
  let best = comparisons[0];
  for (const c of comparisons) {
    const cUnallocated = Array.isArray(c.stats?.unallocated) ? c.stats.unallocated.length : 0;
    const bestUnallocated = Array.isArray(best.stats?.unallocated) ? best.stats.unallocated.length : 0;
    if (cUnallocated < bestUnallocated) {
      best = c;
    } else if (
      cUnallocated === bestUnallocated &&
      (c.stats?.utilizationPercent ?? 0) > (best.stats?.utilizationPercent ?? 0)
    ) {
      best = c;
    }
  }

  const chartData = comparisons.map((c) => ({
    name: c.name,
    Utilization: Number((c.stats?.utilizationPercent ?? 0).toFixed(1)),
    'Unallocated Procs': Array.isArray(c.stats?.unallocated) ? c.stats.unallocated.length : 0,
    'External Frag (KB)': c.stats?.externalFragmentation ?? 0,
  }));

  const tickColor = isDark ? '#94a3b8' : '#475569';
  const gridColor = isDark ? '#334155' : '#e2e8f0';

  const bestUnallocatedCount = Array.isArray(best?.stats?.unallocated) ? best.stats.unallocated.length : 0;

  return (
    <div className="memory-compare-container">
      {/* 1. Best Algorithm Recommendation Card */}
      <div className="best-algorithm-callout" style={{ marginBottom: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <span style={{ fontSize: '1.3rem' }}>🏆</span>
          <div>
            <strong>Optimal Strategy: {best.name}</strong>
            <p style={{ margin: '0.2rem 0 0', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              Placed {safeProcesses.length - bestUnallocatedCount} of {safeProcesses.length} processes
              with {(best.stats?.utilizationPercent ?? 0).toFixed(1)}% RAM utilization and {best.stats?.externalFragmentation ?? 0} KB external fragmentation.
            </p>
          </div>
        </div>
      </div>

      {/* 2. Comparative Metrics Table */}
      <div className="table-responsive">
        <table className="data-table" aria-label="Memory Algorithms Comparative Table">
          <thead>
            <tr>
              <th>Algorithm</th>
              <th>Utilization (%)</th>
              <th>Used Memory</th>
              <th>Internal Frag</th>
              <th>External Frag</th>
              <th>Unallocated</th>
            </tr>
          </thead>
          <tbody>
            {comparisons.map((c) => {
              const unalloc = Array.isArray(c.stats?.unallocated) ? c.stats.unallocated : [];
              return (
                <tr key={c.id}>
                  <td style={{ fontWeight: 700 }}>
                    {c.name} {c.id === best.id && <span style={{ color: 'var(--accent-amber)' }}>★ Best</span>}
                  </td>
                  <td style={{ fontWeight: 600 }}>{(c.stats?.utilizationPercent ?? 0).toFixed(1)}%</td>
                  <td>{c.stats?.usedMemory ?? 0} KB</td>
                  <td>{c.stats?.internalFragmentation ?? 0} KB</td>
                  <td>{c.stats?.externalFragmentation ?? 0} KB</td>
                  <td style={{ color: unalloc.length > 0 ? 'var(--accent-rose)' : 'var(--accent-green)', fontWeight: 700 }}>
                    {unalloc.length} {unalloc.length > 0 && `(${unalloc.join(', ')})`}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* 3. Recharts Visual Benchmark */}
      <div style={{ width: '100%', height: '240px', marginTop: '1.5rem' }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
            <XAxis dataKey="name" stroke={tickColor} />
            <YAxis stroke={tickColor} />
            <Tooltip contentStyle={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)', borderRadius: '6px' }} />
            <Legend />
            <Bar dataKey="Utilization" fill="var(--accent-cyan)" radius={[4, 4, 0, 0]} />
            <Bar dataKey="Unallocated Procs" fill="var(--accent-rose)" radius={[4, 4, 0, 0]} />
            <Bar dataKey="External Frag (KB)" fill="var(--accent-amber)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
