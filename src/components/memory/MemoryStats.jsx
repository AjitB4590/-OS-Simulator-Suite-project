/**
 * Memory Performance KPI Summary Cards Component.
 * Displays overall RAM utilization %, internal/external fragmentation,
 * total vs used memory, and waiting unallocated process count.
 */

/**
 * @param {{
 *   stats?: {
 *     utilizationPercent?: number,
 *     totalMemory?: number,
 *     usedMemory?: number,
 *     internalFragmentation?: number,
 *     externalFragmentation?: number,
 *     unallocated?: string[]
 *   },
 *   mode?: 'dynamic'|'fixed'
 * }} props
 */
export function MemoryStats({ stats, mode = 'dynamic' }) {
  if (!stats) return null;

  const utilization = stats.utilizationPercent ?? 0;
  const used = stats.usedMemory ?? 0;
  const total = stats.totalMemory ?? 0;
  const internal = stats.internalFragmentation ?? 0;
  const external = stats.externalFragmentation ?? 0;
  const unallocated = Array.isArray(stats.unallocated) ? stats.unallocated : [];

  return (
    <div className="metrics-grid" style={{ marginTop: '0.5rem' }}>
      <div className="metric-card">
        <div className="metric-card-label">Memory Utilization</div>
        <div className="metric-card-value">{utilization.toFixed(1)}%</div>
        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          {used} KB / {total} KB
        </span>
      </div>

      <div className="metric-card">
        <div className="metric-card-label" title={mode === 'fixed' ? 'Wasted space within allocated blocks' : 'Zero in dynamic split partition mode'}>
          Internal Fragmentation
        </div>
        <div className="metric-card-value" style={{ color: internal > 0 ? 'var(--accent-amber)' : 'var(--accent-cyan)' }}>
          {internal} KB
        </div>
        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          {mode === 'fixed' ? 'Fixed partition waste' : '0 KB (Dynamic split)'}
        </span>
      </div>

      <div className="metric-card">
        <div className="metric-card-label" title="Scattered free holes unable to satisfy waiting requests">
          External Fragmentation
        </div>
        <div className="metric-card-value" style={{ color: external > 0 ? 'var(--accent-rose)' : 'var(--accent-cyan)' }}>
          {external} KB
        </div>
        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          {external > 0 ? 'Scattered free holes' : 'No hole starvation'}
        </span>
      </div>

      <div className="metric-card">
        <div className="metric-card-label">Unallocated Processes</div>
        <div className="metric-card-value" style={{ color: unallocated.length > 0 ? 'var(--accent-rose)' : 'var(--accent-green)' }}>
          {unallocated.length}
        </div>
        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          {unallocated.length > 0 ? unallocated.join(', ') : 'All processes placed'}
        </span>
      </div>
    </div>
  );
}
