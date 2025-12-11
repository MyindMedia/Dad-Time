import { motion, AnimatePresence } from 'framer-motion';
import type { HTMLMotionProps } from 'framer-motion';
import { Children } from 'react';
import type { ReactNode } from 'react';
import { staggerContainer, createStagger } from '../../lib/animations';

interface AnimatedListProps extends Omit<HTMLMotionProps<'div'>, 'children'> {
  children: ReactNode;
  /**
   * Delay between each child animation (in seconds)
   * @default 0.05
   */
  staggerDelay?: number;
  /**
   * Initial delay before first child animates (in seconds)
   * @default 0.1
   */
  delayChildren?: number;
  /**
   * Enable layout animations for reordering
   * @default true
   */
  layoutAnimation?: boolean;
  /**
   * Custom className for the container
   */
  className?: string;
}

/**
 * AnimatedList Component
 *
 * A container that staggers the animation of its children.
 * Perfect for lists, grids, and any collection of items.
 *
 * Children should use `variants` prop with 'initial', 'animate', 'exit' states
 * or use AnimatedCard with variant="staggerItem"
 *
 * @example
 * ```tsx
 * <AnimatedList staggerDelay={0.1}>
 *   {items.map(item => (
 *     <AnimatedCard key={item.id} variant="staggerItem">
 *       {item.content}
 *     </AnimatedCard>
 *   ))}
 * </AnimatedList>
 * ```
 */
export const AnimatedList: React.FC<AnimatedListProps> = ({
  children,
  staggerDelay = 0.05,
  delayChildren = 0.1,
  layoutAnimation = true,
  className = '',
  ...motionProps
}) => {
  const childrenArray = Children.toArray(children);

  return (
    <motion.div
      className={className}
      variants={staggerContainer}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={createStagger(delayChildren, staggerDelay)}
      {...motionProps}
    >
      <AnimatePresence mode="popLayout">
        {childrenArray.map((child, index) => (
          <motion.div
            key={index}
            layout={layoutAnimation}
            layoutId={layoutAnimation ? `item-${index}` : undefined}
          >
            {child}
          </motion.div>
        ))}
      </AnimatePresence>
    </motion.div>
  );
};
