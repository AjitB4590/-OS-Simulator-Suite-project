/**
 * Proportional Memory Partition Visualizer Bar.
 * Renders contiguous blocks scaled by capacity, nested process partitions colored by PID,
 * free space holes, and candidate/decision highlighting directly from algorithm snapshots.
 */

import { getProcessColor } from '../../utils/colors.js';

/**
 * @param {{
 *   blocks: Array<{ index: number, originalSize: number, remaining: number, allocatedTo: Array<{ pid: string, size: number }> }>,
 *   currentStep?: number,
 *   steps?: Array<{
 *     pid?: string,
 *     size?: number,
 *     chosenBlock?: number|null,
 *     checkingBlock?: number|null,
 *     candidates?: Array<{ index: number, remaining: number, fits: boolean }>,
 *     note?: string,
 *     explanation?: string,
 *     highlight?: any,
 *     snapshot?: { blocks: any[], allocations: any[], stats: any }
 *   }>
 * }} props
 */
export function MemoryBar({ blocks, currentStep, steps }) {
  if (!blocks || blocks.length === 0) return null;

  const isStepMode = typeof currentStep === 'number' && steps && steps.length > 0;
  const activeStep = isStepMode ? steps[currentStep] : null;

  // Use pure algorithm snapshot directly without UI recomputation
  const renderedBlocks = activeStep?.snapshot?.blocks || blocks;

  const uniquePids = Array.from(
    new Set(renderedBlocks.flatMap((b) => b.allocatedTo.map((p) => p.pid)))
  );

  return (
    <div className="memory-bar-container" id="memory-bar-root" aria-label="Proportional Memory Allocation Bar">
      {/* Active Step Annotation */}
      {activeStep && (
        <div className="memory-step-callout">
          <span className="step-badge">
            {activeStep.pid ? `Process: ${activeStep.pid} (${activeStep.size} KB)` : activeStep.title}
          </span>
          <span className="step-note-text">{activeStep.explanation || activeStep.note}</span>
        </div>
      )}

      {/* Proportional Memory Block Segments */}
      <div className="memory-bar-scroll-wrapper" style={{ overflowX: 'auto', paddingBottom: '0.5rem' }}>
        <div className="memory-blocks-track" style={{ display: 'flex', gap: '0.6rem', minWidth: '600px' }}>
          {renderedBlocks.map((b) => {
            const isChosen = activeStep?.chosenBlock === b.index || activeStep?.highlight?.chosenBlock === b.index;
            const isChecking = activeStep?.checkingBlock === b.index || activeStep?.highlight?.checkingBlock === b.index;
            const candidate = activeStep?.candidates?.find((c) => c.index === b.index);

            let borderStyle = '1px solid var(--border-subtle)';
            if (isChosen) {
              borderStyle = '2px solid var(--accent-green)';
            } else if (isChecking) {
              borderStyle = activeStep?.highlight?.fits || candidate?.fits
                ? '2px dashed var(--accent-cyan)'
                : '2px dashed var(--accent-rose)';
            } else if (candidate?.fits) {
              borderStyle = '1px dashed rgba(6, 182, 212, 0.4)';
            }

            return (
              <div
                key={b.index}
                className="memory-block-slot"
                style={{ flexGrow: b.originalSize, flexBasis: 0, border: borderStyle, minWidth: '90px' }}
                title={`Block B${b.index}: Total ${b.originalSize} KB | Used: ${b.originalSize - b.remaining} KB | Free: ${b.remaining} KB`}
              >
                <div className="block-slot-header">
                  <span>B{b.index}</span>
                  {isChosen && (
                    <span
                      style={{
                        fontSize: '0.65rem',
                        padding: '1px 5px',
                        borderRadius: '3px',
                        fontWeight: 700,
                        backgroundColor: 'rgba(34, 197, 94, 0.25)',
                        color: 'var(--accent-green)',
                      }}
                    >
                      ★ Selected
                    </span>
                  )}
                  {!isChosen && isChecking && (
                    <span
                      style={{
                        fontSize: '0.65rem',
                        padding: '1px 5px',
                        borderRadius: '3px',
                        fontWeight: 700,
                        backgroundColor: activeStep?.highlight?.fits || candidate?.fits ? 'rgba(34, 197, 94, 0.25)' : 'rgba(239, 68, 68, 0.25)',
                        color: activeStep?.highlight?.fits || candidate?.fits ? 'var(--accent-green)' : 'var(--accent-rose)',
                      }}
                    >
                      {activeStep?.highlight?.fits || candidate?.fits ? '✓ Fits' : '✗ Too small'}
                    </span>
                  )}
                  <span>{b.originalSize}K</span>
                </div>

                <div className="block-sub-bar" style={{ display: 'flex', height: '48px', borderRadius: '4px', overflow: 'hidden' }}>
                  {b.allocatedTo.map((p, pIdx) => {
                    const widthPct = (p.size / b.originalSize) * 100;
                    return (
                      <div
                        key={pIdx}
                        className="memory-proc-slice"
                        style={{ width: `${widthPct}%`, backgroundColor: getProcessColor(p.pid) }}
                        title={`${p.pid}: ${p.size} KB`}
                      >
                        <span className="slice-label">{p.pid}</span>
                        <span className="slice-sub">{p.size}K</span>
                      </div>
                    );
                  })}
                  {b.remaining > 0 && (
                    <div
                      className="memory-free-slice"
                      style={{ width: `${(b.remaining / b.originalSize) * 100}%` }}
                      title={`Free hole: ${b.remaining} KB`}
                    >
                      <span className="free-label">{b.remaining}K Free</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Color Legend */}
      <div className="memory-legend" style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', marginTop: '0.75rem', fontSize: '0.8rem' }}>
        {uniquePids.map((pid) => (
          <div key={pid} style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: getProcessColor(pid) }} />
            <span>{pid}</span>
          </div>
        ))}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
          <span style={{ width: '14px', height: '10px', borderRadius: '2px', background: 'var(--idle-block-bg)' }} />
          <span style={{ color: 'var(--text-muted)' }}>Free Hole</span>
        </div>
      </div>
    </div>
  );
}
