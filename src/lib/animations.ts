import type { Variants, Transition } from 'framer-motion';

// ============================================================================
// SPRING CONFIGURATIONS
// ============================================================================

export const springConfig = {
  smooth: {
    type: 'spring' as const,
    stiffness: 300,
    damping: 30,
  },
  bouncy: {
    type: 'spring' as const,
    stiffness: 400,
    damping: 25,
  },
  gentle: {
    type: 'spring' as const,
    stiffness: 200,
    damping: 35,
  },
  snappy: {
    type: 'spring' as const,
    stiffness: 500,
    damping: 30,
  },
};

// ============================================================================
// STANDARD ANIMATION VARIANTS
// ============================================================================

/**
 * Fade in from bottom with slight upward movement
 * Perfect for cards, modals, and content blocks
 */
export const fadeInUp: Variants = {
  initial: {
    opacity: 0,
    y: 20,
  },
  animate: {
    opacity: 1,
    y: 0,
    transition: springConfig.smooth,
  },
  exit: {
    opacity: 0,
    y: -20,
    transition: { duration: 0.2 },
  },
};

/**
 * Slide in from right (for page transitions)
 */
export const slideIn: Variants = {
  initial: {
    x: '100%',
    opacity: 0,
  },
  animate: {
    x: 0,
    opacity: 1,
    transition: springConfig.smooth,
  },
  exit: {
    x: '-50%',
    opacity: 0,
    transition: { duration: 0.3 },
  },
};

/**
 * Scale in with fade (for modals, dialogs)
 */
export const scaleIn: Variants = {
  initial: {
    scale: 0.9,
    opacity: 0,
  },
  animate: {
    scale: 1,
    opacity: 1,
    transition: springConfig.bouncy,
  },
  exit: {
    scale: 0.9,
    opacity: 0,
    transition: { duration: 0.2 },
  },
};

/**
 * Slide up from bottom (for bottom sheets, mobile modals)
 */
export const slideUp: Variants = {
  initial: {
    y: '100%',
    opacity: 0,
  },
  animate: {
    y: 0,
    opacity: 1,
    transition: springConfig.smooth,
  },
  exit: {
    y: '100%',
    opacity: 0,
    transition: { duration: 0.3 },
  },
};

/**
 * Stagger container for lists
 * Use with staggerChildren transition
 */
export const staggerContainer: Variants = {
  initial: {},
  animate: {
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.1,
    },
  },
  exit: {
    transition: {
      staggerChildren: 0.03,
      staggerDirection: -1,
    },
  },
};

/**
 * Child item for stagger animations
 */
export const staggerItem: Variants = {
  initial: {
    opacity: 0,
    y: 10,
  },
  animate: {
    opacity: 1,
    y: 0,
    transition: springConfig.gentle,
  },
  exit: {
    opacity: 0,
    y: -10,
    transition: { duration: 0.2 },
  },
};

/**
 * Bounce in animation (for success states, checkmarks)
 */
export const bounceIn: Variants = {
  initial: {
    scale: 0,
  },
  animate: {
    scale: 1,
    transition: {
      type: 'spring',
      stiffness: 600,
      damping: 20,
    },
  },
  exit: {
    scale: 0,
    transition: { duration: 0.2 },
  },
};

/**
 * Shake animation (for error states)
 */
export const shake: Variants = {
  animate: {
    x: [0, -10, 10, -10, 10, -5, 5, 0],
    transition: { duration: 0.5 },
  },
};

/**
 * Pulse animation (for active states like running timer)
 */
export const pulse: Variants = {
  initial: {
    scale: 1,
  },
  animate: {
    scale: [1, 1.05, 1],
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  },
};

/**
 * Rotate animation (for loading spinners)
 */
export const rotate: Variants = {
  animate: {
    rotate: 360,
    transition: {
      duration: 1,
      repeat: Infinity,
      ease: 'linear',
    },
  },
};

// ============================================================================
// GESTURE-BASED ANIMATIONS
// ============================================================================

/**
 * Swipe-to-dismiss (left or right)
 */
export const swipeable: Variants = {
  initial: { x: 0 },
  swipeLeft: {
    x: '-100%',
    opacity: 0,
    transition: springConfig.snappy,
  },
  swipeRight: {
    x: '100%',
    opacity: 0,
    transition: springConfig.snappy,
  },
};

/**
 * Tap scale feedback (for buttons, cards)
 */
export const tapScale = {
  whileTap: { scale: 0.95 },
};

/**
 * Hover lift effect (for cards, interactive elements)
 */
export const hoverLift = {
  whileHover: {
    y: -4,
    transition: springConfig.snappy,
  },
};

// ============================================================================
// PAGE TRANSITION VARIANTS
// ============================================================================

/**
 * Fade transition for pages
 */
export const pageTransitionFade: Variants = {
  initial: { opacity: 0 },
  animate: {
    opacity: 1,
    transition: { duration: 0.3 },
  },
  exit: {
    opacity: 0,
    transition: { duration: 0.2 },
  },
};

/**
 * Slide transition for pages (horizontal)
 */
export const pageTransitionSlide: Variants = {
  initial: {
    x: 20,
    opacity: 0,
  },
  animate: {
    x: 0,
    opacity: 1,
    transition: springConfig.smooth,
  },
  exit: {
    x: -20,
    opacity: 0,
    transition: { duration: 0.3 },
  },
};

// ============================================================================
// LOADING STATES
// ============================================================================

/**
 * Shimmer effect for skeleton loaders
 */
export const shimmer: Variants = {
  animate: {
    backgroundPosition: ['200% 0', '-200% 0'],
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: 'linear',
    },
  },
};

/**
 * Dot pulse animation (for loading indicators)
 */
export const dotPulse = (delay: number = 0): Variants => ({
  animate: {
    scale: [1, 1.2, 1],
    opacity: [1, 0.5, 1],
    transition: {
      duration: 1,
      repeat: Infinity,
      delay,
    },
  },
});

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Create a custom stagger transition
 */
export const createStagger = (
  delayChildren: number = 0.05,
  staggerChildren: number = 0.05
): Transition => ({
  delayChildren,
  staggerChildren,
});

/**
 * Create a custom spring transition
 */
export const createSpring = (
  stiffness: number = 300,
  damping: number = 30
): Transition => ({
  type: 'spring',
  stiffness,
  damping,
});

/**
 * Get reduced motion preference
 */
export const prefersReducedMotion = (): boolean => {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
};

/**
 * Conditionally apply animation based on reduced motion preference
 */
export const withReducedMotion = <T extends Variants>(
  variants: T,
  fallback: T = {} as T
): T => {
  return prefersReducedMotion() ? fallback : variants;
};
