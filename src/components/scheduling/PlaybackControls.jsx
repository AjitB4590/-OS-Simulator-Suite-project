/**
 * Interactive Timeline Playback Controls component.
 * Provides controls for play, pause, step forward/backward, reset,
 * and speed throttling, with accessible live status indicators.
 */

/**
 * @param {{
 *   playback: {
 *     step: number,
 *     isPlaying: boolean,
 *     play: () => void,
 *     pause: () => void,
 *     next: () => void,
 *     prev: () => void,
 *     reset: () => void,
 *     speed: number,
 *     setSpeed: (ms: number) => void
 *   },
 *   totalSteps: number
 * }} props
 */
export function PlaybackControls({ playback, totalSteps }) {
  const { step, isPlaying, play, pause, next, prev, reset, speed, setSpeed } = playback;
  const maxStep = Math.max(0, totalSteps - 1);

  return (
    <div
      className="playback-controls"
      style={{
        background: 'var(--bg-surface)',
        padding: '0.85rem 1rem',
        borderRadius: 'var(--radius-md)',
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '0.75rem',
      }}
      role="region"
      aria-label="Timeline Animation Controls"
    >
      {/* 1. Step Buttons */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
        <button
          type="button"
          className="btn btn-secondary"
          onClick={reset}
          title="Reset to t=0"
          aria-label="Reset simulation to beginning"
          style={{ padding: '0.4rem 0.65rem' }}
        >
          ⏮️
        </button>
        <button
          type="button"
          className="btn btn-secondary"
          onClick={prev}
          disabled={step === 0}
          title="Previous Step"
          aria-label="Step backward one time unit"
          style={{ padding: '0.4rem 0.65rem' }}
        >
          ◀
        </button>
        <button
          type="button"
          className={`btn ${isPlaying ? 'btn-secondary' : 'btn-primary'}`}
          onClick={isPlaying ? pause : play}
          title={isPlaying ? 'Pause' : 'Play Simulation'}
          aria-label={isPlaying ? 'Pause simulation animation' : 'Start playing simulation animation'}
          style={{ padding: '0.4rem 0.85rem', fontWeight: 700 }}
        >
          {isPlaying ? '⏸️ Pause' : '▶ Play'}
        </button>
        <button
          type="button"
          className="btn btn-secondary"
          onClick={next}
          disabled={step >= maxStep}
          title="Next Step"
          aria-label="Step forward one time unit"
          style={{ padding: '0.4rem 0.65rem' }}
        >
          ▶
        </button>
      </div>

      {/* 2. Step Counter & Time Indicator */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontFamily: 'var(--font-mono)', fontSize: '0.9rem' }}>
        <span style={{ fontWeight: 700, color: 'var(--accent-cyan)' }}>Time t={step}</span>
        <span style={{ color: 'var(--text-muted)' }}>/ {maxStep}</span>
      </div>

      {/* 3. Speed Throttling Slider */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
        <label htmlFor="playback-speed">Speed ({speed}ms):</label>
        <input
          type="range"
          id="playback-speed"
          min="100"
          max="1500"
          step="50"
          value={speed}
          onChange={(e) => setSpeed(Number(e.target.value))}
          style={{ width: '100px', cursor: 'pointer' }}
          aria-label="Animation step duration in milliseconds"
        />
      </div>

      {/* 4. Screen-reader status announcement */}
      <div className="sr-only" aria-live="polite" style={{ position: 'absolute', width: '1px', height: '1px', overflow: 'hidden' }}>
        {isPlaying ? `Playing animation at time ${step}` : `Paused at time ${step} of ${maxStep}`}
      </div>
    </div>
  );
}
