/**
 * Need Matrix Read-Only Display Component.
 * Automatically displays Need[i][j] = Max[i][j] - Allocation[i][j]
 * with visual distinction and formula annotation.
 */

import { MatrixInput } from './MatrixInput.jsx';

/**
 * @param {{
 *   need: number[][],
 *   rowHeaders: string[],
 *   colHeaders: string[]
 * }} props
 */
export function NeedMatrix({ need, rowHeaders, colHeaders }) {
  return (
    <div className="need-matrix-panel">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
        <h4 className="matrix-title" style={{ margin: 0 }}>Remaining Need Matrix</h4>
        <span className="formula-badge" style={{ fontSize: '0.75rem', color: 'var(--accent-cyan)' }}>
          Need = Max − Allocation
        </span>
      </div>
      <MatrixInput
        matrix={need}
        rowHeaders={rowHeaders}
        colHeaders={colHeaders}
        readOnly={true}
        ariaLabel="Calculated Need Matrix"
      />
    </div>
  );
}
