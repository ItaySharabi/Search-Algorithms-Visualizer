import { useCallback, useEffect, useRef, useState } from "react";
import { useTraceStore } from "@/store/trace-store";

export type PlaybackSpeed = 1 | 4 | 16 | 64 | 256;

export interface PlaybackControls {
  isPlaying: boolean;
  speed: PlaybackSpeed;
  play(): void;
  pause(): void;
  toggle(): void;
  step(delta: number): void;
  setSpeed(s: PlaybackSpeed): void;
  jumpToStart(): void;
  jumpToEnd(): void;
}

const SPEEDS: readonly PlaybackSpeed[] = [1, 4, 16, 64, 256];

export function usePlayback(): PlaybackControls {
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState<PlaybackSpeed>(16);
  const rafRef = useRef<number | null>(null);
  const lastTickRef = useRef<number>(0);
  const accumRef = useRef<number>(0);

  const tick = useCallback(
    (now: number) => {
      const dt = lastTickRef.current === 0 ? 16 : now - lastTickRef.current;
      lastTickRef.current = now;
      accumRef.current += dt;

      const stepsPerSec = speed * 30;
      const stepIntervalMs = 1000 / stepsPerSec;
      const stepsToAdvance = Math.floor(accumRef.current / stepIntervalMs);
      if (stepsToAdvance > 0) {
        accumRef.current -= stepsToAdvance * stepIntervalMs;
        const store = useTraceStore.getState();
        const next = store.currentStepIndex + stepsToAdvance;
        const max = store.events.length - 1;
        if (next >= max) {
          store.setStepIndex(max);
          setIsPlaying(false);
          return;
        }
        store.setStepIndex(next);
      }
      rafRef.current = requestAnimationFrame(tick);
    },
    [speed],
  );

  useEffect(() => {
    if (isPlaying) {
      lastTickRef.current = 0;
      accumRef.current = 0;
      rafRef.current = requestAnimationFrame(tick);
    } else if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [isPlaying, tick]);

  const play = useCallback(() => setIsPlaying(true), []);
  const pause = useCallback(() => setIsPlaying(false), []);
  const toggle = useCallback(() => setIsPlaying(p => !p), []);
  const step = useCallback((delta: number) => {
    setIsPlaying(false);
    const store = useTraceStore.getState();
    store.setStepIndex(store.currentStepIndex + delta);
  }, []);
  const jumpToStart = useCallback(() => {
    setIsPlaying(false);
    useTraceStore.getState().setStepIndex(0);
  }, []);
  const jumpToEnd = useCallback(() => {
    setIsPlaying(false);
    const store = useTraceStore.getState();
    store.setStepIndex(Math.max(0, store.events.length - 1));
  }, []);
  const setSpeedCb = useCallback((s: PlaybackSpeed) => setSpeed(s), []);

  return { isPlaying, speed, play, pause, toggle, step, setSpeed: setSpeedCb, jumpToStart, jumpToEnd };
}

export { SPEEDS };
