/**
 * Process Memory Allocation Table Component.
 * Displays mapped process assignments, target block indices, remaining capacities,
 * and live scanning status during step-by-step simulation playback.
 */

import { getProcessColor } from '../../utils/colors.js';

/**
 * @param {{
 *   allocations?: Array<{ pid: string, size: number, blockIndex: number|null }>,
 *   blocks?: Array<{ index: number, originalSize: number, remaining: number }>,
 *   processes?: Array<{ pid: string, size: number }>,
 *   activeStep?: { pid?: string, checkingBlock?: number|null, chosenBlock?: number|null } | null,
 *   isFinished?: boolean,
 *   finalAllocations?: Array<{ pid: string, size: number, blockIndex: number|null }>
 * }} props
 */
export function AllocationTable({
  allocations = [],
  blocks = [],
  processes = [],
  activeStep = null,
  isFinished = false,
  finalAllocations = [],
}) {
  const processList = processes.length > 0
    ? processes
    : (allocations.length > 0 ? allocations : finalAllocations);

  if (!processList || processList.length === 0) return null;

  const effectiveAllocs = isFinished ? (finalAllocations.length > 0 ? finalAllocations : allocations) : allocations;

  return (
    <div className="table-responsive">
      <table className="data-table" aria-label="Process Memory Allocation Table">
        <thead>
          <tr>
            <th>PID</th>
            <th>Requested (KB)</th>
            <th>Allocated Block</th>
            <th>Block Capacity</th>
            <th>Remaining in Block</th>
            <th>Simulation Status</th>
          </tr>
        </thead>
        <tbody>
          {processList.map((proc) => {
            const allocEntry = effectiveAllocs.find((a) => a.pid === proc.pid);
            const isAllocated = allocEntry && allocEntry.blockIndex !== null;
            const isFailed = allocEntry && allocEntry.blockIndex === null;
            const isScanning = !allocEntry && activeStep?.pid === proc.pid;
            const block = isAllocated ? blocks[allocEntry.blockIndex] : null;

            let statusPillClass = 'status-pill';
            let statusText = '⏳ Queued';
            let blockText = '—';
            let capacityText = '—';
            let remainingText = '—';

            if (isAllocated) {
              statusPillClass = 'status-pill pill-safe';
              statusText = 'Allocated';
              blockText = `Block B${allocEntry.blockIndex}`;
              capacityText = block ? `${block.originalSize} KB` : '—';
              remainingText = block ? `${block.remaining} KB` : '—';
            } else if (isFailed) {
              statusPillClass = 'status-pill pill-unsafe';
              statusText = 'Not Allocated (Waiting)';
            } else if (isScanning) {
              statusPillClass = 'status-pill';
              const targetB = activeStep.checkingBlock !== null && activeStep.checkingBlock !== undefined
                ? `B${activeStep.checkingBlock}`
                : (activeStep.chosenBlock !== null && activeStep.chosenBlock !== undefined ? `B${activeStep.chosenBlock}` : '');
              statusText = `🔍 Inspecting ${targetB}...`;
              blockText = targetB ? `Scanning ${targetB}` : '—';
            }

            return (
              <tr key={proc.pid} style={{ backgroundColor: isScanning ? 'rgba(6, 182, 212, 0.08)' : undefined }}>
                <td style={{ fontWeight: 700 }}>
                  <span
                    style={{
                      display: 'inline-block',
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      backgroundColor: getProcessColor(proc.pid),
                      marginRight: '6px',
                    }}
                    aria-hidden="true"
                  />
                  {proc.pid}
                </td>
                <td>{proc.size} KB</td>
                <td style={{ fontWeight: 600 }}>{blockText}</td>
                <td>{capacityText}</td>
                <td>{remainingText}</td>
                <td>
                  <span
                    className={statusPillClass}
                    style={{
                      fontSize: '0.75rem',
                      ...(isScanning ? { borderColor: 'var(--accent-cyan)', color: 'var(--accent-cyan)' } : {}),
                    }}
                  >
                    {statusText}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
