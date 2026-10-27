/**
 * Reusable Step-by-Step Simulation Log Component.
 * Displays an interactive list of discrete algorithm steps with titles,
 * plain-English explanations of what happened and why, active step highlight,
 * and click-to-jump timeline seeking.
 */

import { useEffect, useRef } from 'react';

/**
 * @param {{
 *   steps: Array<{
 *     index?: number,
 *     title?: string,
 *     explanation?: string,
 *     note?: string,
 *     status?: string
 *   }>,
 *   currentStep: number,
 *   onJumpTo: (index: number) => void,
 *   maxHeight?: string,
 *   title?: string
 * }} props
 */
export function StepLog({ steps, currentStep, onJumpTo, maxHeight = '260px', title = 'Simulation Step Log' }) {
  const activeItemRef = useRef(null);

  useEffect(() => {
    if (activeItemRef.current) {
      activeItemRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [currentStep]);

  if (!steps || steps.length === 0) {
    return (
      <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
        No simulation steps recorded. Click Simulate or step forward.
      </div>
    );
  }

  return (
    <div className="step-log-panel" style={{ marginTop: '0.75rem' }} role="region" aria-label={title}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem', fontSize: '0.85rem' }}>
        <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>{title}</span>
        <span style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>
          Showing step {Math.min(currentStep + 1, steps.length)} of {steps.length}
        </span>
      </div>

      <div
        className="step-log-list"
        style={{
          maxHeight,
          overflowY: 'auto',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-md)',
          background: 'var(--bg-surface)',
          padding: '0.35rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.35rem',
        }}
      >
        {steps.map((st, idx) => {
          const isActive = idx === currentStep;
          const displayIdx = typeof st.index === 'number' ? st.index + 1 : idx + 1;
          const text = st.explanation || st.note || '';

          return (
            <div
              key={idx}
              ref={isActive ? activeItemRef : null}
              onClick={() => onJumpTo?.(idx)}
              style={{
                display: 'flex',
                gap: '0.6rem',
                alignItems: 'flex-start',
                padding: '0.5rem 0.65rem',
                borderRadius: 'var(--radius-sm)',
                background: isActive ? 'var(--bg-active, rgba(56, 189, 248, 0.12))' : 'transparent',
                borderLeft: isActive ? '3px solid var(--accent-cyan)' : '3px solid transparent',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
              title="Click to seek to this step"
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && onJumpTo?.(idx)}
            >
              <span
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  padding: '0.15rem 0.35rem',
                  borderRadius: '4px',
                  background: isActive ? 'var(--accent-cyan)' : 'var(--border-color)',
                  color: isActive ? '#000' : 'var(--text-muted)',
                  marginTop: '0.1rem',
                  flexShrink: 0,
                }}
              >
                #{displayIdx}
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                {st.title && (
                  <div style={{ fontWeight: 600, fontSize: '0.82rem', color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
                    {st.title}
                  </div>
                )}
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.4, marginTop: '0.1rem' }}>
                  {text}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
