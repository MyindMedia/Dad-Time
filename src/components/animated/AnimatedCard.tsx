import { motion } from 'framer-motion';
import type { HTMLMotionProps } from 'framer-motion';
import type { ReactNode } from 'react';
import { fadeInUp, tapScale, hoverLift, staggerItem } from '../../lib/animations';

interface AnimatedCardProps extends Omit<HTMLMotionProps<'div'>, 'children'> {
  children: ReactNode;
  /**
   * Animation variant to use
   * @default 'fadeInUp'
   */
  variant?: 'fadeInUp' | 'staggerItem' | 'none';
  /**
   * Enable hover lift effect
   * @default false
   */
  hover?: boolean;
  /**
   * Enable tap scale feedback
   * @default true
   */
  tap?: boolean;
  /**
   * Delay before animation starts (in seconds)
   * @default 0
   */
  delay?: number;
  /**
   * Custom className for styling
   */
  className?: string;
}

/**
 * AnimatedCard Component
 *
 * A reusable card wrapper with built-in animations and interactions.
 * Perfect for list items, content cards, and interactive elements.
 *
 * @example
 * ```tsx
 * <AnimatedCard variant="fadeInUp" hover tap>
 *   <h3>Card Title</h3>
 *   <p>Card content...</p>
 * </AnimatedCard>
 * ```
 */
export const AnimatedCard: React.FC<AnimatedCardProps> = ({
  children,
  variant = 'fadeInUp',
  hover = false,
  tap = true,
  delay = 0,
  className = '',
  ...motionProps
}) => {
  // Select animation variant
  const getVariant = () => {
    switch (variant) {
      case 'fadeInUp':
        return fadeInUp;
      case 'staggerItem':
        return staggerItem;
      case 'none':
        return {};
      default:
        return fadeInUp;
    }
  };

  // Build motion props
  const combinedMotionProps: HTMLMotionProps<'div'> = {
    variants: variant !== 'none' ? getVariant() : undefined,
    initial: variant !== 'none' ? 'initial' : undefined,
    animate: variant !== 'none' ? 'animate' : undefined,
    exit: variant !== 'none' ? 'exit' : undefined,
    transition: delay > 0 ? { delay } : undefined,
    ...(hover && hoverLift),
    ...(tap && tapScale),
    ...motionProps,
  };

  return (
    <motion.div
      className={className}
      {...combinedMotionProps}
    >
      {children}
    </motion.div>
  );
};
