/**
 * Performance Metric Summary Cards component.
 * Displays high-level scheduling KPIs: Avg WT, Avg TAT, Avg RT,
 * CPU Utilization, Throughput, and Context Switch counts.
 */

/**
 * @param {{
 *   metrics: {
 *     avgTat: number,
 *     avgWt: number,
 *     avgRt: number,
 *     cpuUtilization: number,
 *     throughput: number,
 *     contextSwitches: number
 *   }
 * }} props
 */
export function MetricsCards({ metrics }) {
  if (!metrics) return null;

  return (
    <div className="metrics-grid">
      <div className="metric-card">
        <div className="metric-card-label">Average Waiting (WT)</div>
        <div className="metric-card-value">{metrics.avgWt.toFixed(2)}</div>
      </div>

      <div className="metric-card">
        <div className="metric-card-label">Average Turnaround (TAT)</div>
        <div className="metric-card-value">{metrics.avgTat.toFixed(2)}</div>
      </div>

      <div className="metric-card">
        <div className="metric-card-label">Average Response (RT)</div>
        <div className="metric-card-value">{metrics.avgRt.toFixed(2)}</div>
      </div>

      <div className="metric-card">
        <div className="metric-card-label">CPU Utilization</div>
        <div className="metric-card-value">{metrics.cpuUtilization.toFixed(1)}%</div>
      </div>

      <div className="metric-card">
        <div className="metric-card-label">Throughput</div>
        <div className="metric-card-value">{metrics.throughput.toFixed(3)}/t</div>
      </div>

      <div className="metric-card">
        <div className="metric-card-label">Context Switches</div>
        <div className="metric-card-value">{metrics.contextSwitches}</div>
      </div>
    </div>
  );
}
