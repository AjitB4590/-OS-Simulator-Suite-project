/**
 * CSV Exporter for CPU Scheduling Simulation Results.
 * Serializes process performance metrics, algorithm parameters, and summary KPIs
 * with standard RFC 4180 escaping and initiates client-side download.
 */

/**
 * Escapes a cell value for CSV format.
 * @param {string|number|null|undefined} value
 * @returns {string}
 */
function escapeCsv(value) {
  if (value === null || value === undefined) return '';
  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * Exports simulation result to a CSV file.
 * @param {{
 *   algorithmName: string,
 *   algorithmId: string,
 *   processes: Array<{ pid: string, at: number, bt: number, priority?: number, ct: number, tat: number, wt: number, rt: number }>,
 *   metrics: { avgTat: number, avgWt: number, avgRt: number, cpuUtilization: number, throughput: number, contextSwitches: number, starvationWarnings?: string[] },
 *   options?: { quantum?: number, contextSwitchOverhead?: number }
 * }} data
 * @returns {{ success: boolean, filename?: string, error?: string }}
 */
export function exportToCsv({ algorithmName, algorithmId, processes, metrics, options = {} }) {
  try {
    if (!processes || processes.length === 0) {
      return { success: false, error: 'No process data available to export.' };
    }

    const today = new Date().toISOString().slice(0, 10);
    const cleanName = (algorithmId || algorithmName || 'scheduling').toUpperCase().replace(/[^A-Z0-9_-]/g, '');
    const filename = `cpu-scheduling-${cleanName}-${today}.csv`;

    const lines = [];

    // 1. Metadata Section
    lines.push(['# CPU Scheduling Simulation Report'].map(escapeCsv).join(','));
    lines.push(['Algorithm', algorithmName || algorithmId].map(escapeCsv).join(','));
    lines.push(['Date', today].map(escapeCsv).join(','));
    if (options.quantum) lines.push(['Time Quantum', options.quantum].map(escapeCsv).join(','));
    if (options.contextSwitchOverhead) lines.push(['Context Switch Overhead', options.contextSwitchOverhead].map(escapeCsv).join(','));
    lines.push('');

    // 2. Process Performance Table
    lines.push(['PID', 'Arrival Time (AT)', 'Burst Time (BT)', 'Priority', 'Completion Time (CT)', 'Turnaround Time (TAT)', 'Waiting Time (WT)', 'Response Time (RT)'].map(escapeCsv).join(','));
    for (const p of processes) {
      lines.push([
        p.pid,
        p.at,
        p.bt,
        p.priority ?? 'N/A',
        p.ct,
        p.tat,
        p.wt,
        p.rt,
      ].map(escapeCsv).join(','));
    }
    lines.push('');

    // 3. Summary Performance Metrics
    lines.push(['# Summary Performance Metrics'].map(escapeCsv).join(','));
    lines.push(['Metric', 'Value'].map(escapeCsv).join(','));
    lines.push(['Average Turnaround Time (TAT)', metrics?.avgTat?.toFixed(2) ?? '0.00'].map(escapeCsv).join(','));
    lines.push(['Average Waiting Time (WT)', metrics?.avgWt?.toFixed(2) ?? '0.00'].map(escapeCsv).join(','));
    lines.push(['Average Response Time (RT)', metrics?.avgRt?.toFixed(2) ?? '0.00'].map(escapeCsv).join(','));
    lines.push(['CPU Utilization (%)', `${metrics?.cpuUtilization?.toFixed(1) ?? '0.0'}%`].map(escapeCsv).join(','));
    lines.push(['Throughput (proc/unit)', metrics?.throughput?.toFixed(3) ?? '0.000'].map(escapeCsv).join(','));
    lines.push(['Total Context Switches', metrics?.contextSwitches ?? 0].map(escapeCsv).join(','));

    if (metrics?.starvationWarnings?.length > 0) {
      lines.push('');
      lines.push(['# Starvation Warnings'].map(escapeCsv).join(','));
      for (const warn of metrics.starvationWarnings) {
        lines.push(['Warning', warn].map(escapeCsv).join(','));
      }
    }

    const csvContent = lines.join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    return { success: true, filename };
  } catch (err) {
    return { success: false, error: err.message || 'Failed to export CSV.' };
  }
}
