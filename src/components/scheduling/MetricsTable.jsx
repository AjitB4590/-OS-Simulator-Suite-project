/**
 * Process Completion Metrics Table component.
 * Displays per-process statistics (CT, TAT, WT, RT) sorted by PID.
 * Supports progressive filling in step mode (reveals rows as p.ct <= currentStep).
 */

import { getProcessColor } from '../../utils/colors.js';

/**
 * @param {{
 *   processes: Array<{ pid: string, at: number, bt: number, priority?: number, ct: number, tat: number, wt: number, rt: number }>,
 *   currentStep?: number
 * }} props
 */
export function MetricsTable({ processes, currentStep }) {
  if (!processes || processes.length === 0) {
    return null;
  }

  const isStepMode = typeof currentStep === 'number';
  const visibleProcesses = isStepMode
    ? processes.filter((p) => p.ct <= currentStep)
    : processes;

  return (
    <div className="table-responsive">
      <table className="data-table" aria-label="Process Performance Metrics">
        <thead>
          <tr>
            <th>PID</th>
            <th>Arrival (AT)</th>
            <th>Burst (BT)</th>
            <th>Priority</th>
            <th>Completion (CT)</th>
            <th>Turnaround (TAT)</th>
            <th>Waiting (WT)</th>
            <th>Response (RT)</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {visibleProcesses.length === 0 ? (
            <tr>
              <td colSpan={9} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '1.5rem' }}>
                No processes completed yet (current time t = {currentStep}).
              </td>
            </tr>
          ) : (
            visibleProcesses.map((p) => {
              const color = getProcessColor(p.pid);
              return (
                <tr key={p.pid}>
                  <td style={{ fontWeight: 600 }}>
                    <span
                      style={{
                        display: 'inline-block',
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        backgroundColor: color,
                        marginRight: '6px',
                      }}
                      aria-hidden="true"
                    />
                    {p.pid}
                  </td>
                  <td>{p.at}</td>
                  <td>{p.bt}</td>
                  <td>{p.priority ?? '-'}</td>
                  <td style={{ fontWeight: 700 }}>{p.ct}</td>
                  <td>{p.tat}</td>
                  <td>{p.wt}</td>
                  <td>{p.rt}</td>
                  <td>
                    <span
                      style={{
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        color: 'var(--accent-green)',
                        backgroundColor: 'rgba(34, 197, 94, 0.12)',
                        padding: '2px 8px',
                        borderRadius: '12px',
                      }}
                    >
                      Completed
                    </span>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}

/**
 * Starvation Alert Warning Component.
 * @param {{ warnings: string[] }} props
 */
export function StarvationAlert({ warnings }) {
  if (!warnings || warnings.length === 0) return null;

  return (
    <div className="error-banner" role="alert" style={{ marginTop: '0.5rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700 }}>
        <span aria-hidden="true">⚠️</span>
        <span>Starvation Warning Detected</span>
      </div>
      <p style={{ fontSize: '0.85rem', marginTop: '0.25rem', color: 'inherit' }}>
        The following process(es) waited disproportionately longer than average. Mitigate with <strong>aging</strong> or HRRN/RR:
      </p>
      <ul style={{ marginTop: '0.5rem', paddingLeft: '1.25rem' }}>
        {warnings.map((warn, i) => (
          <li key={i}>{warn}</li>
        ))}
      </ul>
    </div>
  );
}
