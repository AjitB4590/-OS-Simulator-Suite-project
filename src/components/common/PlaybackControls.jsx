/**
 * Reusable Animated Stepping & Timeline Playback Controls.
 * Accessible cross-module control bar supporting Play, Pause, Next, Prev,
 * Reset, speed throttling slider, and both time and step counting modes.
 */

/**
 * @param {{
 *   playback?: any,
 *   totalSteps?: number,
 *   step?: number,
 *   isPlaying?: boolean,
 *   onPlay?: () => void,
 *   onPause?: () => void,
 *   onNext?: () => void,
 *   onPrev?: () => void,
 *   onReset?: () => void,
 *   speed?: number,
 *   onSpeedChange?: (ms: number) => void,
 *   stepFormat?: 'time' | 'step',
 *   stepLabel?: string
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
  stepFormat = 'time',
  stepLabel,
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

  const effectiveTotal = totalSteps || playback?.totalSteps || 0;
  const maxStep = Math.max(0, effectiveTotal > 0 ? effectiveTotal - 1 : 0);
  const isTimeMode = stepFormat === 'time';

  return (
    <div
      className="playback-controls"
      style={{
        background: 'var(--bg-surface)',
        padding: '0.75rem 1rem',
        borderRadius: 'var(--radius-md)',
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '0.75rem',
      }}
      role="region"
      aria-label="Simulation Animation Controls"
    >
      {/* 1. Step Buttons */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
        <button
          type="button"
          className="btn btn-secondary"
          onClick={reset}
          disabled={step === 0 && !isPlaying}
          title="Reset to beginning"
          aria-label="Reset simulation to beginning"
          style={{ padding: '0.35rem 0.6rem' }}
        >
          ⏮️
        </button>
        <button
          type="button"
          className="btn btn-secondary"
          onClick={prev}
          disabled={step === 0}
          title="Previous Step"
          aria-label="Step backward"
          style={{ padding: '0.35rem 0.6rem' }}
        >
          ◀
        </button>
        <button
          type="button"
          className={`btn ${isPlaying ? 'btn-secondary' : 'btn-primary'}`}
          onClick={isPlaying ? pause : play}
          disabled={effectiveTotal <= 1}
          title={effectiveTotal <= 1 ? 'Simulation not available' : isPlaying ? 'Pause' : 'Play'}
          aria-label={isPlaying ? 'Pause simulation animation' : 'Start simulation animation'}
          style={{ padding: '0.35rem 0.8rem', fontWeight: 700 }}
        >
          {isPlaying ? '⏸️ Pause' : '▶ Play'}
        </button>
        <button
          type="button"
          className="btn btn-secondary"
          onClick={next}
          disabled={step >= maxStep || effectiveTotal <= 1}
          title="Next Step"
          aria-label="Step forward"
          style={{ padding: '0.35rem 0.6rem' }}
        >
          ▶
        </button>
      </div>

      {/* 2. Step Counter / Indicator */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontFamily: 'var(--font-mono)', fontSize: '0.88rem' }}>
        <span style={{ fontWeight: 700, color: 'var(--accent-cyan)' }}>
          {stepLabel ? `${stepLabel} ${step + 1}` : isTimeMode ? `Time t=${step}` : `Step ${effectiveTotal > 0 ? step + 1 : 0}`}
        </span>
        <span style={{ color: 'var(--text-muted)' }}>
          / {isTimeMode ? maxStep : effectiveTotal}
        </span>
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
          style={{ width: '90px', cursor: 'pointer' }}
          aria-label="Animation step duration in milliseconds"
        />
      </div>

      <div className="sr-only" aria-live="polite" style={{ position: 'absolute', width: '1px', height: '1px', overflow: 'hidden' }}>
        {isPlaying ? `Playing animation at step ${step}` : `Paused at step ${step} of ${effectiveTotal}`}
      </div>
    </div>
  );
}
