"use client";

import { useEffect, useMemo, useState } from "react";

interface UseCountdownOptions {
  duration: number;
  resetKey: number | string | null;
  elapsedMs: number;
  isRunning: boolean;
}

export function useCountdown({ duration, resetKey, elapsedMs, isRunning }: UseCountdownOptions) {
  const durationMs = duration * 1000;
  const [localElapsedMs, setLocalElapsedMs] = useState(elapsedMs);

  useEffect(() => {
    setLocalElapsedMs(elapsedMs);
  }, [elapsedMs, resetKey]);

  useEffect(() => {
    if (!isRunning) return;

    const intervalId = window.setInterval(() => {
      setLocalElapsedMs((current) => Math.min(durationMs, current + 1000));
    }, 1000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [durationMs, isRunning, resetKey]);

  const secondsLeft = useMemo(() => {
    return Math.max(0, duration - Math.floor(localElapsedMs / 1000));
  }, [duration, localElapsedMs]);

  const progress = useMemo(() => {
    return Math.min(1, Math.max(0, localElapsedMs / durationMs));
  }, [durationMs, localElapsedMs]);

  return {
    secondsLeft,
    progress,
    isComplete: secondsLeft <= 0
  };
}
