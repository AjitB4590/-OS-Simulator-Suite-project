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
export function PlaybackControls({
  playback,
  totalSteps = 0,
  step: propStep,
  isPlaying: propIsPlaying,
  onPlay,
  onPause,
  onNext,
  onPrev,
  onReset,
  speed: propSpeed,
  onSpeedChange,
  play: propPlay,
  pause: propPause,
  next: propNext,
  prev: propPrev,
  reset: propReset,
  setSpeed: propSetSpeed,
}) {
  const step = playback?.step ?? propStep ?? 0;
  const isPlaying = playback?.isPlaying ?? propIsPlaying ?? false;
  const play = playback?.play ?? onPlay ?? propPlay ?? (() => {});
  const pause = playback?.pause ?? onPause ?? propPause ?? (() => {});
  const next = playback?.next ?? onNext ?? propNext ?? (() => {});
  const prev = playback?.prev ?? onPrev ?? propPrev ?? (() => {});
  const reset = playback?.reset ?? onReset ?? propReset ?? (() => {});
  const speed = playback?.speed ?? propSpeed ?? 500;
  const setSpeed = playback?.setSpeed ?? onSpeedChange ?? propSetSpeed ?? (() => {});

  const effectiveTotalSteps = totalSteps || playback?.totalSteps || 0;
  const maxStep = Math.max(0, effectiveTotalSteps > 0 ? effectiveTotalSteps - 1 : 0);

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
          disabled={step === 0 && !isPlaying}
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
          disabled={effectiveTotalSteps <= 1}
          title={effectiveTotalSteps <= 1 ? 'Configure processes and click Simulate first' : isPlaying ? 'Pause' : 'Play Simulation'}
          aria-label={isPlaying ? 'Pause simulation animation' : 'Start playing simulation animation'}
          style={{ padding: '0.4rem 0.85rem', fontWeight: 700 }}
        >
          {isPlaying ? '⏸️ Pause' : '▶ Play'}
        </button>
        <button
          type="button"
          className="btn btn-secondary"
          onClick={next}
          disabled={step >= maxStep || effectiveTotalSteps <= 1}
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
