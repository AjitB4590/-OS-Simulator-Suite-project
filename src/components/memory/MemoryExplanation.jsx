/**
 * Memory Allocation Theory & Algorithm Explanation Component.
 * Documents First Fit, Best Fit, and Worst Fit concepts, pros, cons,
 * and key OS fragmentation definitions.
 */

import { getMemoryAlgorithm, MEMORY_ALGORITHMS } from '../../algorithms/memory/index.js';

/**
 * @param {{ algoId: string }} props
 */
export function MemoryExplanation({ algoId }) {
  const current = getMemoryAlgorithm(algoId);

  return (
    <div className="memory-explanation-container" style={{ fontSize: '0.85rem' }}>
      {/* 1. Selected Algorithm Overview */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem', marginBottom: '1.25rem' }}>
        <div>
          <h4 style={{ color: 'var(--accent-cyan)', marginBottom: '0.35rem' }}>{current.name} Strategy</h4>
          <p>{current.description}</p>
          <div style={{ marginTop: '0.5rem' }}>
            <strong style={{ color: 'var(--accent-green)' }}>Advantages:</strong>
            <ul style={{ margin: '0.25rem 0', paddingLeft: '1.2rem' }}>
              {current.pros.map((p, i) => <li key={i}>{p}</li>)}
            </ul>
          </div>
        </div>

        <div>
          <strong style={{ color: 'var(--accent-rose)' }}>Disadvantages:</strong>
          <ul style={{ margin: '0.25rem 0', paddingLeft: '1.2rem' }}>
            {current.cons.map((c, i) => <li key={i}>{c}</li>)}
          </ul>
          <div style={{ marginTop: '0.5rem' }}>
            <strong>Best Use Case:</strong>
            <p style={{ margin: '0.25rem 0', color: 'var(--text-secondary)' }}>{current.bestUseCase}</p>
          </div>
        </div>
      </div>

      {/* 2. Educational Definitions Box */}
      <div className="card" style={{ background: 'var(--bg-surface)', padding: '0.85rem 1rem' }}>
        <h4 style={{ margin: '0 0 0.5rem', color: 'var(--text-primary)', fontSize: '0.85rem' }}>
          Key Memory Management Definitions
        </h4>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '0.75rem' }}>
          <div>
            <strong>Internal Fragmentation:</strong>
            <p style={{ margin: '0.2rem 0', color: 'var(--text-muted)' }}>
              Unused memory inside an allocated partition. Occurs in <em>Fixed Partitioning</em> when a process size is smaller than the assigned block.
            </p>
          </div>
          <div>
            <strong>External Fragmentation:</strong>
            <p style={{ margin: '0.2rem 0', color: 'var(--text-muted)' }}>
              Total free memory exists across separate holes to satisfy a request, but no single contiguous hole is large enough.
            </p>
          </div>
        </div>
      </div>

      {/* 3. Summary Algorithm Reference Table */}
      <div className="table-responsive" style={{ marginTop: '1rem' }}>
        <table className="data-table" aria-label="Algorithms Quick Reference">
          <thead>
            <tr><th>Strategy</th><th>Search Behavior</th><th>Leftover Hole Policy</th></tr>
          </thead>
          <tbody>
            {MEMORY_ALGORITHMS.map((a) => (
              <tr key={a.id} style={{ fontWeight: a.id === algoId ? 700 : 400 }}>
                <td>{a.name}</td>
                <td>{a.id === 'firstFit' ? 'First hole that fits' : a.id === 'bestFit' ? 'Smallest hole that fits' : 'Largest hole that fits'}</td>
                <td>{a.id === 'firstFit' ? 'Unordered remnants' : a.id === 'bestFit' ? 'Smallest hole (may create slivers)' : 'Largest hole (remains usable)'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
