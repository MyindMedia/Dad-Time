import { useState, useEffect, useRef, useCallback } from 'react';
import type { PanInfo } from 'framer-motion';
import { triggerHaptic } from '../utils/ios';

export type SwipeDirection = 'left' | 'right' | 'up' | 'down';

interface UseSwipeOptions {
  /**
   * Minimum distance in pixels to trigger swipe
   * @default 50
   */
  threshold?: number;
  /**
   * Callback when swipe is detected
   */
  onSwipe?: (direction: SwipeDirection) => void;
  /**
   * Callback for swipe left
   */
  onSwipeLeft?: () => void;
  /**
   * Callback for swipe right
   */
  onSwipeRight?: () => void;
  /**
   * Callback for swipe up
   */
  onSwipeUp?: () => void;
  /**
   * Callback for swipe down
   */
  onSwipeDown?: () => void;
  /**
   * Enable haptic feedback
   * @default true
   */
  haptic?: boolean;
}

/**
 * useSwipe Hook
 *
 * Detects swipe gestures and triggers callbacks.
 * Works with Framer Motion drag handlers.
 *
 * @example
 * ```tsx
 * const { handleDragEnd } = useSwipe({
 *   onSwipeLeft: () => console.log('Swiped left'),
 *   onSwipeRight: () => console.log('Swiped right'),
 * });
 *
 * <motion.div drag="x" onDragEnd={handleDragEnd}>
 *   Swipe me
 * </motion.div>
 * ```
 */
export const useSwipe = (options: UseSwipeOptions = {}) => {
  const {
    threshold = 50,
    onSwipe,
    onSwipeLeft,
    onSwipeRight,
    onSwipeUp,
    onSwipeDown,
    haptic = true,
  } = options;

  const handleDragEnd = useCallback(
    (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
      const { offset, velocity } = info;
      const absX = Math.abs(offset.x);
      const absY = Math.abs(offset.y);

      // Determine if swipe is primarily horizontal or vertical
      let direction: SwipeDirection | null = null;

      if (absX > absY) {
        // Horizontal swipe
        if (absX > threshold || Math.abs(velocity.x) > 500) {
          direction = offset.x > 0 ? 'right' : 'left';
        }
      } else {
        // Vertical swipe
        if (absY > threshold || Math.abs(velocity.y) > 500) {
          direction = offset.y > 0 ? 'down' : 'up';
        }
      }

      if (direction) {
        if (haptic) {
          triggerHaptic('medium');
        }

        onSwipe?.(direction);

        // Trigger direction-specific callbacks
        switch (direction) {
          case 'left':
            onSwipeLeft?.();
            break;
          case 'right':
            onSwipeRight?.();
            break;
          case 'up':
            onSwipeUp?.();
            break;
          case 'down':
            onSwipeDown?.();
            break;
        }
      }
    },
    [threshold, onSwipe, onSwipeLeft, onSwipeRight, onSwipeUp, onSwipeDown, haptic]
  );

  return { handleDragEnd };
};

// ============================================================================
// LONG PRESS HOOK
// ============================================================================

interface UseLongPressOptions {
  /**
   * Duration in ms to trigger long press
   * @default 500
   */
  delay?: number;
  /**
   * Callback when long press is triggered
   */
  onLongPress?: () => void;
  /**
   * Enable haptic feedback
   * @default true
   */
  haptic?: boolean;
}

/**
 * useLongPress Hook
 *
 * Detects long press gestures (touch and hold).
 *
 * @example
 * ```tsx
 * const longPressHandlers = useLongPress({
 *   onLongPress: () => console.log('Long pressed!'),
 *   delay: 500,
 * });
 *
 * <div {...longPressHandlers}>
 *   Press and hold me
 * </div>
 * ```
 */
export const useLongPress = (options: UseLongPressOptions = {}) => {
  const { delay = 500, onLongPress, haptic = true } = options;
  const [longPressTriggered, setLongPressTriggered] = useState(false);
  const timeout = useRef<number | undefined>(undefined);
  const target = useRef<EventTarget | undefined>(undefined);

  const start = useCallback(
    (event: React.MouseEvent | React.TouchEvent) => {
      event.preventDefault();
      target.current = event.target;
      timeout.current = setTimeout(() => {
        if (haptic) {
          triggerHaptic('heavy');
        }
        onLongPress?.();
        setLongPressTriggered(true);
      }, delay);
    },
    [delay, onLongPress, haptic]
  );

  const clear = useCallback(
    (_event?: React.MouseEvent | React.TouchEvent, shouldTriggerClick = true) => {
      if (timeout.current) {
        clearTimeout(timeout.current);
      }
      if (shouldTriggerClick && !longPressTriggered) {
        // Regular click/tap
      }
      setLongPressTriggered(false);
    },
    [longPressTriggered]
  );

  return {
    onMouseDown: start,
    onMouseUp: clear,
    onMouseLeave: clear,
    onTouchStart: start,
    onTouchEnd: clear,
  };
};

// ============================================================================
// PULL TO REFRESH HOOK
// ============================================================================

interface UsePullToRefreshOptions {
  /**
   * Callback when refresh is triggered
   */
  onRefresh: () => Promise<void> | void;
  /**
   * Distance in pixels to trigger refresh
   * @default 80
   */
  threshold?: number;
  /**
   * Enable haptic feedback
   * @default true
   */
  haptic?: boolean;
}

/**
 * usePullToRefresh Hook
 *
 * Implements pull-to-refresh functionality for mobile.
 * Works best on scrollable containers.
 *
 * @example
 * ```tsx
 * const { pullToRefreshHandlers, isRefreshing } = usePullToRefresh({
 *   onRefresh: async () => {
 *     await fetchData();
 *   },
 * });
 *
 * <div {...pullToRefreshHandlers}>
 *   {isRefreshing && <Spinner />}
 *   <YourContent />
 * </div>
 * ```
 */
export const usePullToRefresh = (options: UsePullToRefreshOptions) => {
  const { onRefresh, threshold = 80, haptic = true } = options;
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const startY = useRef(0);
  const scrollElement = useRef<HTMLElement | null>(null);

  const handleTouchStart = useCallback((event: TouchEvent) => {
    const element = event.currentTarget as HTMLElement;
    scrollElement.current = element;

    // Only start if we're at the top of the scroll
    if (element.scrollTop === 0) {
      startY.current = event.touches[0].clientY;
    }
  }, []);

  const handleTouchMove = useCallback((event: TouchEvent) => {
    if (!scrollElement.current || scrollElement.current.scrollTop > 0 || isRefreshing) {
      return;
    }

    const currentY = event.touches[0].clientY;
    const distance = Math.max(0, currentY - startY.current);

    // Apply resistance to pull
    const resistedDistance = distance * 0.5;

    setPullDistance(resistedDistance);

    // Prevent default scroll when pulling down
    if (distance > 0) {
      event.preventDefault();
    }
  }, [isRefreshing]);

  const handleTouchEnd = useCallback(async () => {
    if (pullDistance >= threshold && !isRefreshing) {
      if (haptic) {
        triggerHaptic('heavy');
      }
      setIsRefreshing(true);
      setPullDistance(0);

      try {
        await onRefresh();
      } finally {
        setIsRefreshing(false);
      }
    } else {
      // Snap back
      setPullDistance(0);
    }
  }, [pullDistance, threshold, isRefreshing, onRefresh, haptic]);

  useEffect(() => {
    const element = scrollElement.current;
    if (!element) return;

    element.addEventListener('touchstart', handleTouchStart, { passive: false });
    element.addEventListener('touchmove', handleTouchMove, { passive: false });
    element.addEventListener('touchend', handleTouchEnd);

    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchmove', handleTouchMove);
      element.removeEventListener('touchend', handleTouchEnd);
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd]);

  return {
    pullToRefreshHandlers: {
      ref: scrollElement,
    },
    isRefreshing,
    pullDistance,
    pullProgress: Math.min(1, pullDistance / threshold),
  };
};
