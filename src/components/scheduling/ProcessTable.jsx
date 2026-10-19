/**
 * Interactive Process Configuration Table component.
 * Allows adding, editing, deleting processes, loading sample scenarios,
 * and generating randomized workloads.
 */

import { getProcessColor } from '../../utils/colors.js';
import { SAMPLE_SCENARIOS } from '../../data/sampleScenarios.js';

/**
 * @param {{
 *   processes: Array<{ id: string, pid: string, at: number | string, bt: number | string, priority: number | string }>,
 *   onAdd: () => void,
 *   onUpdate: (id: string, field: string, val: string | number) => void,
 *   onDelete: (id: string) => void,
 *   onLoadScenario: (scenarioId: string) => void,
 *   onGenerateRandom: () => void,
 *   showPriorityHint?: boolean
 * }} props
 */
export function ProcessTable({
  processes, onAdd, onUpdate, onDelete,
  onLoadScenario, onGenerateRandom, showPriorityHint,
}) {
  return (
    <div>
      <div className="controls-bar" style={{ justifyContent: 'space-between', marginBottom: '0.75rem' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'center' }}>
          <button type="button" className="btn btn-secondary" onClick={onAdd} id="add-process-btn">
            + Add Process
          </button>
          <button type="button" className="btn btn-secondary" onClick={onGenerateRandom} id="random-btn" title="Generate 3 to 8 random processes">
            🎲 Random Workload
          </button>
          <div className="inline-field">
            <label htmlFor="scenario-select" style={{ fontSize: '0.85rem' }}>Preset:</label>
            <select
              id="scenario-select"
              className="select-input"
              defaultValue=""
              onChange={(e) => {
                if (e.target.value) {
                  onLoadScenario(e.target.value);
                  e.target.value = '';
                }
              }}
              style={{ fontSize: '0.85rem', padding: '0.35rem 0.6rem' }}
            >
              <option value="" disabled>Load Preset Scenario...</option>
              {SAMPLE_SCENARIOS.map((sc) => (
                <option key={sc.id} value={sc.id}>{sc.name}</option>
              ))}
            </select>
          </div>
        </div>

        {showPriorityHint && (
          <span className="hint-text">💡 Lower number = Higher priority (1 is highest)</span>
        )}
      </div>

      <div className="table-responsive">
        <table className="data-table" aria-label="Process Input Table">
          <thead>
            <tr>
              <th>Color</th>
              <th>Process ID</th>
              <th>Arrival (AT)</th>
              <th>Burst (BT)</th>
              <th>Priority</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {processes.map((p) => {
              const color = getProcessColor(p.pid);
              return (
                <tr key={p.id}>
                  <td>
                    <span
                      style={{
                        display: 'inline-block', width: '12px', height: '12px',
                        borderRadius: '50%', backgroundColor: color, verticalAlign: 'middle',
                      }}
                      title={`Assigned color for ${p.pid}`}
                    />
                  </td>
                  <td>
                    <input type="text" className="table-input" value={p.pid} onChange={(e) => onUpdate(p.id, 'pid', e.target.value)} style={{ fontWeight: 600, width: '60px' }} />
                  </td>
                  <td>
                    <input type="number" className="table-input" min="0" value={p.at} onChange={(e) => onUpdate(p.id, 'at', e.target.value === '' ? '' : Number(e.target.value))} />
                  </td>
                  <td>
                    <input type="number" className="table-input" min="1" value={p.bt} onChange={(e) => onUpdate(p.id, 'bt', e.target.value === '' ? '' : Number(e.target.value))} />
                  </td>
                  <td>
                    <input type="number" className="table-input" min="1" value={p.priority} onChange={(e) => onUpdate(p.id, 'priority', e.target.value === '' ? '' : Number(e.target.value))} />
                  </td>
                  <td>
                    <button type="button" className="btn btn-danger" onClick={() => onDelete(p.id)} disabled={processes.length <= 1} title={`Delete process ${p.pid}`}>
                      ✕
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
