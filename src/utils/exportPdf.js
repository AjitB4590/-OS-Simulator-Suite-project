/**
 * PDF Academic Report Generator for CPU Scheduling Simulation.
 * Utilizes jsPDF and jspdf-autotable to construct a structured, multi-page report
 * with metadata, Gantt timeline capture, process metrics, calculation logs, and benchmark comparisons.
 */

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { captureGanttPng } from './exportPng.js';

/**
 * Generates and downloads a multi-page PDF simulation report.
 * @param {{
 *   algorithmName: string,
 *   algorithmId: string,
 *   options?: { quantum?: number, contextSwitchOverhead?: number },
 *   processes: Array<{ pid: string, at: number, bt: number, priority?: number, ct: number, tat: number, wt: number, rt: number }>,
 *   metrics: { avgTat: number, avgWt: number, avgRt: number, cpuUtilization: number, throughput: number, contextSwitches: number, starvationWarnings?: string[] },
 *   log?: string[],
 *   comparisonResult?: { results: Array<{ id: string, name: string, metrics: any }> }
 * }} data
 * @returns {Promise<{ success: boolean, filename?: string, error?: string }>}
 */
export async function exportToPdf(data) {
  try {
    const { algorithmName, algorithmId, options = {}, processes, metrics, log = [], comparisonResult } = data;
    if (!processes || processes.length === 0) {
      return { success: false, error: 'No process metrics available to export.' };
    }

    const doc = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' });
    const today = new Date().toISOString().slice(0, 10);
    const cleanId = (algorithmId || 'scheduling').toUpperCase().replace(/[^A-Z0-9_-]/g, '');
    const filename = `cpu-scheduling-${cleanId}-${today}.pdf`;

    // 1. Title & Header
    doc.setFontSize(18);
    doc.setTextColor(30, 41, 59);
    doc.text('OS Simulator Suite — CPU Scheduling Report', 40, 40);

    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139);
    doc.text(`Generated on: ${today} | Algorithm: ${algorithmName || algorithmId}`, 40, 56);
    if (options.quantum) doc.text(`Time Quantum: ${options.quantum}`, 40, 70);
    if (options.contextSwitchOverhead) doc.text(`CS Overhead: ${options.contextSwitchOverhead}`, 180, 70);

    let startY = options.quantum || options.contextSwitchOverhead ? 85 : 75;

    // 2. Embedded Gantt Chart Image
    try {
      const ganttPng = await captureGanttPng('gantt-chart-root');
      if (ganttPng) {
        doc.setFontSize(12);
        doc.setTextColor(15, 23, 42);
        doc.text('Execution Gantt Chart', 40, startY + 10);
        doc.addImage(ganttPng, 'PNG', 40, startY + 16, 515, 60);
        startY += 88;
      }
    } catch {
      // Continue gracefully without image if element was missing
    }

    // 3. Process Metrics Table
    doc.setFontSize(12);
    doc.setTextColor(15, 23, 42);
    doc.text('Process Performance Metrics', 40, startY);

    autoTable(doc, {
      startY: startY + 6,
      head: [['PID', 'AT', 'BT', 'Priority', 'CT', 'TAT', 'WT', 'RT']],
      body: processes.map((p) => [p.pid, p.at, p.bt, p.priority ?? 'N/A', p.ct, p.tat, p.wt, p.rt]),
      theme: 'grid',
      headStyles: { fillColor: [79, 70, 229] },
      styles: { fontSize: 9 },
    });

    // 4. Summary KPIs & Starvation Warnings
    startY = doc.lastAutoTable.finalY + 16;
    doc.setFontSize(12);
    doc.text('Summary Performance KPIs', 40, startY);

    const kpiRows = [
      ['Average Turnaround Time (TAT)', `${metrics?.avgTat?.toFixed(2) ?? '0.00'} units`],
      ['Average Waiting Time (WT)', `${metrics?.avgWt?.toFixed(2) ?? '0.00'} units`],
      ['Average Response Time (RT)', `${metrics?.avgRt?.toFixed(2) ?? '0.00'} units`],
      ['CPU Utilization', `${metrics?.cpuUtilization?.toFixed(1) ?? '0.0'}%`],
      ['Throughput', `${metrics?.throughput?.toFixed(3) ?? '0.000'} proc/unit`],
      ['Context Switches', `${metrics?.contextSwitches ?? 0}`],
    ];

    if (metrics?.starvationWarnings?.length > 0) {
      kpiRows.push(['Starvation Warnings', metrics.starvationWarnings.join('; ')]);
    }

    autoTable(doc, {
      startY: startY + 6,
      head: [['Metric', 'Value']],
      body: kpiRows,
      theme: 'striped',
      headStyles: { fillColor: [51, 65, 85] },
      styles: { fontSize: 9 },
    });

    // 5. Calculation Log
    if (log && log.length > 0) {
      startY = doc.lastAutoTable.finalY + 16;
      if (startY > 700) {
        doc.addPage();
        startY = 40;
      }
      doc.setFontSize(12);
      doc.text('Step-by-Step Algorithmic Calculation Log', 40, startY);

      autoTable(doc, {
        startY: startY + 6,
        head: [['Step', 'Action / Decision']],
        body: log.map((entry, idx) => [idx + 1, entry]),
        theme: 'plain',
        headStyles: { fillColor: [241, 245, 249], textColor: [15, 23, 42] },
        styles: { fontSize: 8 },
      });
    }

    // 6. Comparative Benchmark Page (if present)
    if (comparisonResult?.results?.length > 0) {
      doc.addPage();
      doc.setFontSize(16);
      doc.setTextColor(15, 23, 42);
      doc.text('Comparative Benchmark (All Algorithms)', 40, 40);

      autoTable(doc, {
        startY: 55,
        head: [['Algorithm', 'Avg WT', 'Avg TAT', 'Avg RT', 'CPU Util', 'Throughput', 'CS']],
        body: comparisonResult.results.map((r) => [
          r.name,
          r.metrics?.avgWt?.toFixed(2) ?? '-',
          r.metrics?.avgTat?.toFixed(2) ?? '-',
          r.metrics?.avgRt?.toFixed(2) ?? '-',
          `${r.metrics?.cpuUtilization?.toFixed(1) ?? '-'}%`,
          r.metrics?.throughput?.toFixed(3) ?? '-',
          r.metrics?.contextSwitches ?? 0,
        ]),
        theme: 'grid',
        headStyles: { fillColor: [14, 165, 233] },
        styles: { fontSize: 9 },
      });
    }

    doc.save(filename);
    return { success: true, filename };
  } catch (err) {
    return { success: false, error: err.message || 'Failed to export PDF.' };
  }
}
