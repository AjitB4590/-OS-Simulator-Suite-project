/**
 * Proportional Gantt Chart and Interactive Time Ruler component.
 * Supports instant mode and step-by-step playback with partial block revelation,
 * current time cursor line, clickable time ruler, and process color legend.
 */

import { getProcessColor } from '../../utils/colors.js';

/**
 * @param {{
 *   gantt: Array<{ pid: string, start: number, end: number, isIdle: boolean, isContextSwitch?: boolean }>,
 *   upToTime?: number,
 *   onJumpToTime?: (time: number) => void
 * }} props
 */
export function GanttChart({ gantt, upToTime, onJumpToTime }) {
  if (!gantt || gantt.length === 0) {
    return (
      <div style={{ padding: '2rem 1rem', textAlign: 'center', color: 'var(--text-muted)' }}>
        <p>No execution timeline available. Configure processes and click Simulate.</p>
      </div>
    );
  }

  const totalTime = Math.max(...gantt.map((b) => b.end), 0);
  const isStepMode = typeof upToTime === 'number';

  // Compute revealed blocks up to upToTime
  let displayBlocks = [];
  if (!isStepMode) {
    displayBlocks = gantt;
  } else {
    for (const block of gantt) {
      if (block.start >= upToTime) continue;
      if (block.end <= upToTime) {
        displayBlocks.push(block);
      } else {
        displayBlocks.push({ ...block, end: upToTime, isPartial: true });
        break;
      }
    }
  }

  const revealedDuration = isStepMode ? Math.min(upToTime, totalTime) : totalTime;
  const remainingDuration = totalTime - revealedDuration;

  const handleRulerClick = (e) => {
    if (!onJumpToTime || totalTime === 0) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    onJumpToTime(Math.round(ratio * totalTime));
  };

  const uniquePids = Array.from(
    new Set(gantt.filter((b) => !b.isIdle && !b.isContextSwitch && b.pid !== 'CS' && b.pid !== 'Idle').map((b) => b.pid))
  );

  return (
    <div id="gantt-chart-root" className="gantt-chart-container" aria-label="Gantt Timeline Chart">
      <div className="gantt-scroll-wrapper" style={{ overflowX: 'auto', paddingBottom: '0.5rem' }}>
        <div style={{ minWidth: '550px', position: 'relative' }}>
          {/* 1. Proportional Execution Bar */}
          <div className="gantt-bar">
            {displayBlocks.map((block, idx) => {
              const duration = block.end - block.start;
              const isCS = block.isContextSwitch || block.pid === 'CS';
              const isIdle = !isCS && (block.isIdle || block.pid === 'Idle');
              const bgColor = isCS ? 'var(--accent-amber)' : isIdle ? undefined : getProcessColor(block.pid);
              const blockClass = isCS ? 'gantt-block gantt-cs' : isIdle ? 'gantt-block gantt-idle' : 'gantt-block';

              return (
                <div
                  key={`${block.pid}-${block.start}-${idx}`}
                  className={blockClass}
                  style={{ flexGrow: duration, flexBasis: 0, backgroundColor: bgColor }}
                  title={`[${block.pid}] t=${block.start} to ${block.end} (${duration}u)`}
                >
                  <span>{isCS ? 'CS' : isIdle ? 'Idle' : block.pid}</span>
                </div>
              );
            })}
            {isStepMode && remainingDuration > 0 && (
              <div
                className="gantt-block gantt-future"
                style={{ flexGrow: remainingDuration, flexBasis: 0, opacity: 0.2 }}
                title={`Unrevealed: t=${revealedDuration} to ${totalTime}`}
              />
            )}
          </div>

          {/* Time Marker Line in Step Mode */}
          {isStepMode && (
            <div
              className="gantt-time-marker"
              style={{
                position: 'absolute',
                left: `${totalTime > 0 ? (revealedDuration / totalTime) * 100 : 0}%`,
                top: 0,
                bottom: 0,
                width: '2px',
                backgroundColor: 'var(--accent-red, #ef4444)',
                boxShadow: '0 0 6px rgba(239, 68, 68, 0.8)',
                zIndex: 4,
                pointerEvents: 'none',
              }}
              aria-hidden="true"
            />
          )}

          {/* 2. Interactive Boundary Time Ruler */}
          <div
            className="gantt-ruler"
            onClick={handleRulerClick}
            style={{ cursor: onJumpToTime ? 'pointer' : 'default' }}
            title={onJumpToTime ? 'Click along ruler to jump playback' : undefined}
          >
            {gantt.map((block, idx) => (
              <div
                key={`ruler-${idx}`}
                className="ruler-segment"
                style={{ flexGrow: block.end - block.start, flexBasis: 0, height: '22px' }}
              >
                {idx === 0 && (
                  <span style={{ position: 'absolute', left: 0, top: '2px', fontSize: '0.75rem' }}>
                    {block.start}
                  </span>
                )}
                <span
                  style={{
                    position: 'absolute',
                    right: idx === gantt.length - 1 ? 0 : '-6px',
                    top: '2px',
                    fontSize: '0.75rem',
                  }}
                >
                  {block.end}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 3. Gantt Color Legend */}
      <div className="gantt-legend" style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', marginTop: '0.75rem', fontSize: '0.8rem' }}>
        {uniquePids.map((pid) => (
          <div key={pid} style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: getProcessColor(pid) }} />
            <span>{pid}</span>
          </div>
        ))}
        {gantt.some((b) => b.isIdle && !b.isContextSwitch) && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <span style={{ width: '14px', height: '10px', borderRadius: '2px', background: 'var(--idle-block-bg)' }} />
            <span style={{ color: 'var(--text-muted)' }}>Idle</span>
          </div>
        )}
        {gantt.some((b) => b.isContextSwitch || b.pid === 'CS') && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <span style={{ width: '14px', height: '10px', borderRadius: '2px', background: 'var(--accent-amber)' }} />
            <span style={{ color: 'var(--accent-amber)' }}>CS Overhead</span>
          </div>
        )}
      </div>
    </div>
  );
}
