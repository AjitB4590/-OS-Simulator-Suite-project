/**
 * Generic Animated Stepping & Playback Hook.
 * Manages discrete time-step transitions, play/pause timers, speed throttling,
 * and boundary controls. Reusable across scheduling and memory modules.
 */

import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * @param {number} totalSteps - Total count of discrete steps in simulation
 * @param {{ initialSpeedMs?: number }} [options]
 * @returns {{
 *   step: number,
 *   isPlaying: boolean,
 *   play: () => void,
 *   pause: () => void,
 *   next: () => void,
 *   prev: () => void,
 *   reset: () => void,
 *   jumpTo: (target: number) => void,
 *   speed: number,
 *   setSpeed: (ms: number) => void
 * }}
 */
export function usePlayback(totalSteps, options = {}) {
  const initialSpeed = options?.initialSpeedMs || 500;
  const [step, setStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(initialSpeed);

  const maxStep = Math.max(0, totalSteps - 1);
  const stepRef = useRef(step);
  stepRef.current = step;

  // Clamp step if totalSteps shrinks
  useEffect(() => {
    if (step > maxStep) {
      setStep(maxStep);
    }
  }, [maxStep, step]);

  const pause = useCallback(() => {
    setIsPlaying(false);
  }, []);

  const play = useCallback(() => {
    if (totalSteps <= 1) return;
    if (stepRef.current >= maxStep) {
      setStep(0);
    }
    setIsPlaying(true);
  }, [maxStep, totalSteps]);

  const next = useCallback(() => {
    setStep((prev) => Math.min(prev + 1, maxStep));
  }, [maxStep]);

  const prev = useCallback(() => {
    setStep((curr) => Math.max(curr - 1, 0));
  }, []);

  const reset = useCallback(() => {
    setIsPlaying(false);
    setStep(0);
  }, []);

  const jumpTo = useCallback(
    (target) => {
      const clamped = Math.max(0, Math.min(target, maxStep));
      setStep(clamped);
    },
    [maxStep]
  );

  useEffect(() => {
    if (!isPlaying || totalSteps <= 1) return;

    const interval = setInterval(() => {
      setStep((curr) => {
        if (curr >= maxStep) {
          setIsPlaying(false);
          return curr;
        }
        return curr + 1;
      });
    }, speed);

    return () => clearInterval(interval);
  }, [isPlaying, maxStep, speed, totalSteps]);

  return {
    step,
    isPlaying,
    play,
    pause,
    next,
    prev,
    reset,
    jumpTo,
    speed,
    setSpeed,
  };
}
