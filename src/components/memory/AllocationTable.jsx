/**
 * Process Memory Allocation Table Component.
 * Displays mapped process assignments, target block indices, remaining capacities,
 * or failure reasons with status badges.
 */

import { getProcessColor } from '../../utils/colors.js';

/**
 * @param {{
 *   allocations: Array<{ pid: string, size: number, blockIndex: number|null }>,
 *   blocks: Array<{ index: number, originalSize: number, remaining: number }>,
 *   currentStep?: number
 * }} props
 */
export function AllocationTable({ allocations, blocks, currentStep }) {
  if (!allocations || allocations.length === 0) return null;

  const isStepMode = typeof currentStep === 'number';
  const visibleAllocations = isStepMode
    ? allocations.slice(0, currentStep + 1)
    : allocations;

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
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {visibleAllocations.map((a) => {
            const isAllocated = a.blockIndex !== null;
            const block = isAllocated ? blocks[a.blockIndex] : null;

            return (
              <tr key={a.pid}>
                <td style={{ fontWeight: 700 }}>
                  <span
                    style={{
                      display: 'inline-block',
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      backgroundColor: getProcessColor(a.pid),
                      marginRight: '6px',
                    }}
                    aria-hidden="true"
                  />
                  {a.pid}
                </td>
                <td>{a.size} KB</td>
                <td style={{ fontWeight: 600 }}>{isAllocated ? `Block ${a.blockIndex}` : '—'}</td>
                <td>{isAllocated ? `${block?.originalSize} KB` : '—'}</td>
                <td>{isAllocated ? `${block?.remaining} KB` : '—'}</td>
                <td>
                  <span
                    className={`status-pill ${isAllocated ? 'pill-safe' : 'pill-unsafe'}`}
                    style={{ fontSize: '0.75rem' }}
                  >
                    {isAllocated ? 'Allocated' : 'Not Allocated (Waiting)'}
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
