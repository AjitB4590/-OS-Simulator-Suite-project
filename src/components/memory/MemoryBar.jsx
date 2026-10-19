/**
 * Proportional Memory Partition Visualizer Bar.
 * Renders contiguous blocks scaled by capacity, nested process partitions colored by PID,
 * hatched free space holes, hover tooltips, and candidate highlighting during step playback.
 */

import { getProcessColor } from '../../utils/colors.js';

/**
 * @param {{
 *   blocks: Array<{ index: number, originalSize: number, remaining: number, allocatedTo: Array<{ pid: string, size: number }> }>,
 *   currentStep?: number,
 *   steps?: Array<{ pid: string, size: number, chosenBlock: number|null, candidates: Array<{ index: number, remaining: number, fits: boolean }>, note: string }>
 * }} props
 */
export function MemoryBar({ blocks, currentStep, steps }) {
  if (!blocks || blocks.length === 0) return null;

  const isStepMode = typeof currentStep === 'number' && steps && steps.length > 0;
  const activeStep = isStepMode ? steps[currentStep] : null;

  // Compute progressive block state up to currentStep
  let renderedBlocks = blocks;
  if (isStepMode) {
    renderedBlocks = blocks.map((b) => ({
      ...b,
      remaining: b.originalSize,
      allocatedTo: [],
    }));
    for (let s = 0; s <= currentStep && s < steps.length; s++) {
      const step = steps[s];
      if (step.chosenBlock !== null && renderedBlocks[step.chosenBlock]) {
        renderedBlocks[step.chosenBlock].allocatedTo.push({ pid: step.pid, size: step.size });
        renderedBlocks[step.chosenBlock].remaining -= step.size;
      }
    }
  }

  // Extract unique active processes for legend
  const uniquePids = Array.from(
    new Set(renderedBlocks.flatMap((b) => b.allocatedTo.map((p) => p.pid)))
  );

  return (
    <div className="memory-bar-container" id="memory-bar-root" aria-label="Proportional Memory Allocation Bar">
      {/* Active Step Annotation */}
      {activeStep && (
        <div className="memory-step-callout">
          <span className="step-badge">Target: {activeStep.pid} ({activeStep.size} KB)</span>
          <span className="step-note-text">{activeStep.note}</span>
        </div>
      )}

      {/* Proportional Memory Block Segments */}
      <div className="memory-bar-scroll-wrapper" style={{ overflowX: 'auto', paddingBottom: '0.5rem' }}>
        <div className="memory-blocks-track" style={{ display: 'flex', gap: '0.6rem', minWidth: '600px' }}>
          {renderedBlocks.map((b) => {
            const isCandidate = activeStep?.candidates?.find((c) => c.index === b.index);
            const isChosen = activeStep?.chosenBlock === b.index;
            const borderStyle = isChosen
              ? '2px solid var(--accent-green)'
              : isCandidate?.fits
              ? '2px dashed var(--accent-cyan)'
              : isCandidate && !isCandidate.fits
              ? '2px dashed var(--accent-rose)'
              : '1px solid var(--border-subtle)';

            return (
              <div
                key={b.index}
                className="memory-block-slot"
                style={{ flexGrow: b.originalSize, flexBasis: 0, border: borderStyle, minWidth: '90px' }}
                title={`Block #${b.index}: Total ${b.originalSize} KB | Used: ${b.originalSize - b.remaining} KB | Free: ${b.remaining} KB`}
              >
                <div className="block-slot-header">
                  <span>B{b.index}</span>
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
