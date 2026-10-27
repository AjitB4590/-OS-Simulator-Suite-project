/**
 * CPU Ready Queue and Execution State View.
 * Displays the instantaneous CPU status at current playback time:
 * currently running process (big chip), ready queue as ordered chips, and discrete events.
 */

import { getProcessColor } from '../../utils/colors.js';

/**
 * @param {{
 *   currentTime: number,
 *   entry?: { time: number, running: string, readyQueue: string[], event: string },
 *   totalTime: number
 * }} props
 */
export function ReadyQueueView({ currentTime, entry, totalTime }) {
  const isComplete = currentTime >= totalTime && totalTime > 0;
  const running = isComplete ? 'Complete' : entry?.running || 'Idle';
  const isCS = running === 'CS';
  const isIdle = running === 'Idle';
  const isFinished = running === 'Complete';

  const runningBg = isFinished
    ? 'var(--accent-green)'
    : isCS
    ? 'var(--accent-amber)'
    : isIdle
    ? 'var(--idle-block-bg)'
    : getProcessColor(running);

  const readyQueue = isComplete ? [] : entry?.readyQueue || [];
  const eventText = isComplete
    ? 'All processes completed execution.'
    : entry?.event || (totalTime === 0 ? 'Simulation not started. Click "Simulate Execution" to generate timeline.' : 'Process running in time slice.');

  return (
    <div className="ready-queue-panel" aria-label="CPU State and Ready Queue">
      <div className="cpu-state-header">
        <span className="time-badge">
          Time: <strong>t = {currentTime}</strong> / {totalTime}
        </span>
        <span className="event-badge" title={eventText}>
          {eventText}
        </span>
      </div>

      <div className="cpu-state-body">
        {/* Active CPU Core */}
        <div className="cpu-core-slot">
          <span className="slot-label">CPU RUNNING</span>
          <div
            className="running-chip"
            style={{ backgroundColor: runningBg }}
            aria-label={`CPU Running: ${running}`}
          >
            <span className="running-pid">{running}</span>
            <span className="running-sub">
              {isFinished ? 'Done' : isCS ? 'Overhead' : isIdle ? 'Waiting' : 'Executing'}
            </span>
          </div>
        </div>

        {/* Ready Queue */}
        <div className="ready-queue-slot">
          <span className="slot-label">READY QUEUE (FIFO ORDER)</span>
          <div className="queue-chips" role="list" aria-label="Ready Queue Processes">
            {readyQueue.length === 0 ? (
              <span className="queue-empty-text">(Ready queue empty)</span>
            ) : (
              readyQueue.map((pid, idx) => (
                <div
                  key={`${pid}-${idx}`}
                  role="listitem"
                  className="queue-chip"
                  style={{ borderLeftColor: getProcessColor(pid) }}
                  title={`Position ${idx + 1}: ${pid}`}
                >
                  <span className="queue-idx">{idx + 1}</span>
                  <span className="queue-pid">{pid}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
