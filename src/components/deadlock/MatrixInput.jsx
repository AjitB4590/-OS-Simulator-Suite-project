/**
 * Reusable Numerical Matrix / Vector Input Component.
 * Supports editable or read-only tabular numerical input with column and row headers.
 */

/**
 * @param {{
 *   matrix: number[][],
 *   rowHeaders: string[],
 *   colHeaders: string[],
 *   onChange?: (updated: number[][]) => void,
 *   readOnly?: boolean,
 *   title?: string,
 *   ariaLabel?: string
 * }} props
 */
export function MatrixInput({
  matrix,
  rowHeaders,
  colHeaders,
  onChange,
  readOnly = false,
  title,
  ariaLabel,
}) {
  const handleCellChange = (rIdx, cIdx, val) => {
    if (readOnly || !onChange) return;
    const num = Math.max(0, parseInt(val, 10) || 0);
    const next = matrix.map((row, r) =>
      r === rIdx ? row.map((cell, c) => (c === cIdx ? num : cell)) : [...row]
    );
    onChange(next);
  };

  return (
    <div className="matrix-input-container">
      {title && <h4 className="matrix-title">{title}</h4>}
      <div className="table-responsive">
        <table className="data-table matrix-table" aria-label={ariaLabel || title || 'Matrix Table'}>
          <thead>
            <tr>
              <th style={{ width: '60px' }}>PID</th>
              {colHeaders.map((col, idx) => (
                <th key={col || idx}>{col}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {matrix.map((row, rIdx) => (
              <tr key={rowHeaders[rIdx] || rIdx}>
                <td className="row-header-cell">{rowHeaders[rIdx] || `P${rIdx}`}</td>
                {row.map((cell, cIdx) => (
                  <td key={cIdx} style={{ padding: '0.35rem' }}>
                    {readOnly ? (
                      <span className="matrix-cell-readonly">{cell}</span>
                    ) : (
                      <input
                        type="number"
                        className="table-input"
                        min="0"
                        value={cell}
                        onChange={(e) => handleCellChange(rIdx, cIdx, e.target.value)}
                        aria-label={`${rowHeaders[rIdx]} ${colHeaders[cIdx]}`}
                      />
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
