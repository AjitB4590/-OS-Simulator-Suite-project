/**
 * Memory Allocation Configuration Form.
 * Allows adding/removing variable blocks and process requests,
 * selecting partition mode (Dynamic vs Fixed), loading presets, and triggering execution.
 */

import { MEMORY_ALGORITHMS } from '../../algorithms/memory/index.js';
import { MEMORY_PRESETS } from '../../data/memoryPresets.js';

/**
 * @param {{
 *   blockSizes?: number[],
 *   processSizes?: Array<{ pid: string, size: number }>,
 *   algoId?: string,
 *   mode?: 'dynamic'|'fixed',
 *   onChangeBlocks: (b: number[]) => void,
 *   onChangeProcesses: (p: Array<{ pid: string, size: number }>) => void,
 *   onChangeAlgoId: (id: string) => void,
 *   onChangeMode: (m: 'dynamic'|'fixed') => void,
 *   onRandomize: () => void,
 *   onSimulate: () => void
 * }} props
 */
export function MemoryForm({
  blockSizes = [100, 500, 200, 300, 600],
  processSizes = [
    { pid: 'P1', size: 212 },
    { pid: 'P2', size: 417 },
    { pid: 'P3', size: 112 },
    { pid: 'P4', size: 426 },
  ],
  algoId = 'firstFit',
  mode = 'dynamic',
  onChangeBlocks,
  onChangeProcesses,
  onChangeAlgoId,
  onChangeMode,
  onRandomize,
  onSimulate,
}) {
  const safeBlocks = Array.isArray(blockSizes) ? blockSizes : [];
  const safeProcesses = Array.isArray(processSizes) ? processSizes : [];

  const handleBlockChange = (idx, val) => {
    const num = Math.max(1, parseInt(val, 10) || 1);
    onChangeBlocks(safeBlocks.map((b, i) => (i === idx ? num : b)));
  };

  const handleProcessChange = (idx, val) => {
    const num = Math.max(1, parseInt(val, 10) || 1);
    onChangeProcesses(safeProcesses.map((p, i) => (i === idx ? { ...p, size: num } : p)));
  };

  const addBlock = () => onChangeBlocks([...safeBlocks, 200]);
  const removeBlock = (idx) => onChangeBlocks(safeBlocks.filter((_, i) => i !== idx));

  const addProcess = () => {
    const nextPid = `P${safeProcesses.length + 1}`;
    onChangeProcesses([...safeProcesses, { pid: nextPid, size: 150 }]);
  };
  const removeProcess = (idx) => onChangeProcesses(safeProcesses.filter((_, i) => i !== idx));

  return (
    <div className="memory-form-container">
      {/* 1. Global Controls & Presets Bar */}
      <div className="controls-bar" style={{ justifyContent: 'space-between', marginBottom: '1.25rem' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'center' }}>
          <div className="inline-field">
            <label htmlFor="algo-select" style={{ fontWeight: 600 }}>Algorithm:</label>
            <select id="algo-select" className="select-input" value={algoId} onChange={(e) => onChangeAlgoId(e.target.value)}>
              {MEMORY_ALGORITHMS.map((algo) => (
                <option key={algo.id} value={algo.id}>{algo.name}</option>
              ))}
            </select>
          </div>

          <div className="inline-field">
            <label htmlFor="partition-mode" style={{ fontWeight: 600 }}>Partition Mode:</label>
            <select id="partition-mode" className="select-input" value={mode} onChange={(e) => onChangeMode(e.target.value)}>
              <option value="dynamic">Dynamic (Split Block, Multi-Process)</option>
              <option value="fixed">Fixed (Single Process per Block)</option>
            </select>
          </div>

          <div className="inline-field">
            <label htmlFor="preset-select">Presets:</label>
            <select
              id="preset-select"
              className="select-input"
              onChange={(e) => {
                const found = MEMORY_PRESETS.find((p) => p.id === e.target.value);
                if (found) {
                  const blocks = found.blockSizes || [];
                  const procs = (found.processes || found.processSizes || []).map((p, i) =>
                    typeof p === 'number' ? { pid: `P${i + 1}`, size: p } : { ...p }
                  );
                  onChangeBlocks([...blocks]);
                  onChangeProcesses(procs);
                }
              }}
            >
              <option value="">Load Preset...</option>
              {MEMORY_PRESETS.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button type="button" className="btn btn-secondary" onClick={onRandomize} title="Generate random blocks and process workload">
            🎲 Random
          </button>
          <button type="button" className="btn btn-primary" onClick={onSimulate}>
            <span>⚡ Run Allocation</span>
          </button>
        </div>
      </div>

      {/* 2. Sizing Tables Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
        {/* Block Sizes */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
            <h4 style={{ margin: 0, fontSize: '0.85rem', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>
              Memory Blocks ({safeBlocks.length})
            </h4>
            <button type="button" className="btn-sm btn-secondary" onClick={addBlock}>➕ Add Block</button>
          </div>
          <div className="table-responsive">
            <table className="data-table" aria-label="Memory Blocks Configuration">
              <thead><tr><th>Block #</th><th>Size (KB)</th><th>Action</th></tr></thead>
              <tbody>
                {safeBlocks.map((size, idx) => (
                  <tr key={idx}>
                    <td style={{ fontWeight: 600 }}>Block {idx}</td>
                    <td>
                      <input type="number" className="table-input" min="1" value={size} onChange={(e) => handleBlockChange(idx, e.target.value)} />
                    </td>
                    <td>
                      <button type="button" className="btn-sm btn-danger" onClick={() => removeBlock(idx)} disabled={safeBlocks.length <= 1}>
                        🗑️
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Process Sizes */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
            <h4 style={{ margin: 0, fontSize: '0.85rem', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>
              Processes ({safeProcesses.length})
            </h4>
            <button type="button" className="btn-sm btn-secondary" onClick={addProcess}>➕ Add Process</button>
          </div>
          <div className="table-responsive">
            <table className="data-table" aria-label="Process Size Configuration">
              <thead><tr><th>PID</th><th>Size (KB)</th><th>Action</th></tr></thead>
              <tbody>
                {safeProcesses.map((proc, idx) => (
                  <tr key={idx}>
                    <td style={{ fontWeight: 700, color: 'var(--accent-cyan)' }}>{proc.pid}</td>
                    <td>
                      <input type="number" className="table-input" min="1" value={proc.size} onChange={(e) => handleProcessChange(idx, e.target.value)} />
                    </td>
                    <td>
                      <button type="button" className="btn-sm btn-danger" onClick={() => removeProcess(idx)} disabled={safeProcesses.length <= 1}>
                        🗑️
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
