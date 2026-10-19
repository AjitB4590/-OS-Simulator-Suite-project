/**
 * Educational Explanation and Calculation Log component.
 * Displays algorithmic characteristics (preemption, pros, cons, use cases, formulas),
 * alongside step-by-step execution traces and worked mathematical breakdowns.
 */

import { useState } from 'react';

/**
 * @param {{
 *   algo: object,
 *   result?: object | null
 * }} props
 */
export function ExplanationPanel({ algo, result }) {
  const [showLog, setShowLog] = useState(false);

  if (!algo) return null;

  return (
    <div className="explanation-panel" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {/* 1. Header with Preemption Badge */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
        <div>
          <h3 style={{ fontSize: '1.05rem', margin: 0 }}>{algo.name} Overview</h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: '0.2rem 0 0' }}>{algo.description}</p>
        </div>
        <span
          style={{
            padding: '0.25rem 0.65rem',
            borderRadius: '12px',
            fontSize: '0.75rem',
            fontWeight: 700,
            background: algo.preemptive ? 'rgba(56, 189, 248, 0.15)' : 'rgba(148, 163, 184, 0.15)',
            color: algo.preemptive ? 'var(--accent-cyan)' : 'var(--text-muted)',
            border: `1px solid ${algo.preemptive ? 'var(--accent-cyan)' : 'var(--border-subtle)'}`,
          }}
        >
          {algo.preemptive ? '⚡ Preemptive' : '🔒 Non-Preemptive'}
        </span>
      </div>

      {/* 2. Educational Pros, Cons, and Use Cases Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
        <div style={{ background: 'var(--bg-surface)', padding: '0.75rem 1rem', borderRadius: 'var(--radius-sm)' }}>
          <strong style={{ color: 'var(--accent-emerald)', fontSize: '0.85rem' }}>✓ Advantages</strong>
          <ul style={{ paddingLeft: '1.1rem', marginTop: '0.35rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            {algo.pros?.map((pro, i) => <li key={i}>{pro}</li>)}
          </ul>
        </div>

        <div style={{ background: 'var(--bg-surface)', padding: '0.75rem 1rem', borderRadius: 'var(--radius-sm)' }}>
          <strong style={{ color: 'var(--accent-rose)', fontSize: '0.85rem' }}>✗ Disadvantages</strong>
          <ul style={{ paddingLeft: '1.1rem', marginTop: '0.35rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            {algo.cons?.map((con, i) => <li key={i}>{con}</li>)}
          </ul>
        </div>

        <div style={{ background: 'var(--bg-surface)', padding: '0.75rem 1rem', borderRadius: 'var(--radius-sm)' }}>
          <strong style={{ color: 'var(--accent-cyan)', fontSize: '0.85rem' }}>🎯 Best Use Case</strong>
          <p style={{ margin: '0.35rem 0 0', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{algo.bestUseCase}</p>
          <div style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: 'var(--accent-amber)' }}>
            <em>{algo.formulaNotes}</em>
          </div>
        </div>
      </div>

      {/* 3. Standard OS Formulas Reference */}
      <div style={{ background: 'var(--bg-surface)', padding: '0.6rem 0.85rem', borderRadius: 'var(--radius-sm)', fontSize: '0.8rem', fontFamily: 'var(--font-mono)', display: 'flex', flexWrap: 'wrap', gap: '1rem', justifyContent: 'space-between' }}>
        <span>TAT = CT - AT</span>
        <span>WT = TAT - BT</span>
        <span>RT = First CPU - AT</span>
        <span>CPU Util = (Busy / Total) × 100</span>
        <span>Throughput = N / Total</span>
      </div>

      {/* 4. Collapsible Calculation Log & Worked Numbers */}
      {result && (
        <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '0.75rem' }}>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => setShowLog((prev) => !prev)}
            style={{ width: '100%', justifyContent: 'space-between', fontSize: '0.85rem' }}
          >
            <span>📝 Detailed Mathematical Calculations & Execution Steps</span>
            <span>{showLog ? '▲ Collapse' : '▼ Expand'}</span>
          </button>

          {showLog && (
            <div style={{ marginTop: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {/* Worked per-process values */}
              <div style={{ background: 'var(--bg-input)', padding: '0.75rem', borderRadius: 'var(--radius-sm)', fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>
                <strong style={{ display: 'block', marginBottom: '0.35rem', color: 'var(--accent-cyan)' }}>
                  Per-Process Step-by-Step Breakdown:
                </strong>
                {result.processes.map((p) => {
                  const firstCpu = p.at + p.rt;
                  return (
                    <div key={p.pid} style={{ margin: '0.2rem 0' }}>
                      <strong>{p.pid}</strong>: TAT = {p.ct} - {p.at} = {p.tat}, WT = {p.tat} - {p.bt} = {p.wt}, RT = {firstCpu} - {p.at} = {p.rt}
                    </div>
                  );
                })}
              </div>

              {/* Step-by-step event log */}
              <div style={{ background: 'var(--bg-input)', padding: '0.75rem', borderRadius: 'var(--radius-sm)', maxHeight: '200px', overflowY: 'auto', fontSize: '0.8rem', fontFamily: 'var(--font-mono)' }}>
                <strong style={{ display: 'block', marginBottom: '0.35rem', color: 'var(--accent-emerald)' }}>
                  Simulator Event Log:
                </strong>
                {result.log?.map((entry, idx) => (
                  <div key={idx} style={{ color: 'var(--text-secondary)', padding: '0.1rem 0' }}>{entry}</div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
