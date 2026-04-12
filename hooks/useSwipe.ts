"use client";

import { SwipeDirection } from "@/lib/types";
import { PanInfo } from "framer-motion";
import { useCallback } from "react";

interface UseSwipeOptions {
  enabled: boolean;
  threshold?: number;
  velocityThreshold?: number;
  onSwipe: (direction: SwipeDirection) => void;
}

export function useSwipe({
  enabled,
  threshold = 130,
  velocityThreshold = 500,
  onSwipe
}: UseSwipeOptions) {
  const onDragEnd = useCallback(
    (_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
      if (!enabled) return;

      if (info.offset.x > threshold || info.velocity.x > velocityThreshold) {
        onSwipe("right");
        return;
      }

      if (info.offset.x < -threshold || info.velocity.x < -velocityThreshold) {
        onSwipe("left");
      }
    },
    [enabled, onSwipe, threshold, velocityThreshold]
  );

  return {
    drag: enabled ? ("x" as const) : false,
    dragConstraints: { left: 0, right: 0 },
    dragElastic: enabled ? 0.16 : 0,
    dragMomentum: false,
    onDragEnd
  };
}
