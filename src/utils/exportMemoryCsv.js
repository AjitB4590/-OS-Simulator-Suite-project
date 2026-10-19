/**
 * CSV Exporter for Memory Allocation Simulation Results.
 * Serializes block utilization, process allocation table, and fragmentation KPIs
 * conforming to RFC 4180 standard escaping.
 */

function escapeCsv(val) {
  if (val === null || val === undefined) return '';
  const s = String(val);
  if (s.includes(',') || s.includes('"') || s.includes('\n') || s.includes('\r')) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

/**
 * Exports memory allocation results to a CSV file.
 * @param {{
 *   algorithmId: string,
 *   partitionMode: 'dynamic' | 'fixed',
 *   allocations: Array<{ pid: string, size: number, blockIndex: number | null }>,
 *   blocks: Array<{ index: number, originalSize: number, remaining: number, allocatedTo: Array<{ pid: string, size: number }> }>,
 *   stats: { internalFragmentation: number, externalFragmentation: number, unallocated: string[], utilizationPercent: number, totalMemory: number, usedMemory: number }
 * }} data
 */
export function exportMemoryToCsv({ algorithmId, partitionMode, allocations, blocks, stats }) {
  try {
    const today = new Date().toISOString().slice(0, 10);
    const filename = `memory-${algorithmId}-${partitionMode}-${today}.csv`;
    const lines = [];

    // 1. Header
    lines.push(['# OS Simulator Suite - Memory Allocation Report'].map(escapeCsv).join(','));
    lines.push(['Algorithm', algorithmId.toUpperCase()].map(escapeCsv).join(','));
    lines.push(['Partition Mode', partitionMode === 'dynamic' ? 'Dynamic (Split Block)' : 'Fixed (Single Process)'].map(escapeCsv).join(','));
    lines.push(['Date', today].map(escapeCsv).join(','));
    lines.push('');

    // 2. Summary Statistics
    lines.push(['# Memory Metrics Summary'].map(escapeCsv).join(','));
    lines.push(['Total Memory (KB)', stats.totalMemory].map(escapeCsv).join(','));
    lines.push(['Allocated Memory (KB)', stats.usedMemory].map(escapeCsv).join(','));
    lines.push(['Free Memory (KB)', stats.totalMemory - stats.usedMemory].map(escapeCsv).join(','));
    lines.push(['Memory Utilization (%)', `${stats.utilizationPercent.toFixed(1)}%`].map(escapeCsv).join(','));
    lines.push(['Internal Fragmentation (KB)', stats.internalFragmentation].map(escapeCsv).join(','));
    lines.push(['External Fragmentation (KB)', stats.externalFragmentation].map(escapeCsv).join(','));
    lines.push(['Unallocated Processes Count', stats.unallocated.length].map(escapeCsv).join(','));
    if (stats.unallocated.length > 0) {
      lines.push(['Unallocated PIDs', stats.unallocated.join('; ')].map(escapeCsv).join(','));
    }
    lines.push('');

    // 3. Process Allocation Table
    lines.push(['# Process Allocations'].map(escapeCsv).join(','));
    lines.push(['Process ID', 'Requested Size (KB)', 'Status', 'Allocated Block Index', 'Remaining In Block (KB)'].map(escapeCsv).join(','));
    for (const alloc of allocations) {
      const isAllocated = alloc.blockIndex !== null;
      const blk = isAllocated ? blocks[alloc.blockIndex] : null;
      lines.push([
        alloc.pid,
        alloc.size,
        isAllocated ? 'Allocated' : 'Unallocated',
        isAllocated ? `Block ${alloc.blockIndex}` : 'None',
        blk ? blk.remaining : 'N/A'
      ].map(escapeCsv).join(','));
    }
    lines.push('');

    // 4. Blocks Table
    lines.push(['# Block Status'].map(escapeCsv).join(','));
    lines.push(['Block Index', 'Original Capacity (KB)', 'Remaining Free (KB)', 'Hosted Processes'].map(escapeCsv).join(','));
    for (const b of blocks) {
      const procs = b.allocatedTo.map((p) => `${p.pid} (${p.size} KB)`).join('; ') || 'None (Empty)';
      lines.push([`Block ${b.index}`, b.originalSize, b.remaining, procs].map(escapeCsv).join(','));
    }

    const content = lines.join('\r\n');
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
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
    return { success: false, error: err.message || 'Failed to export memory CSV.' };
  }
}
