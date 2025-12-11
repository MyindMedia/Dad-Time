import { motion } from 'framer-motion';
import { shimmer, rotate, dotPulse } from '../../lib/animations';

// ============================================================================
// SPINNER COMPONENT
// ============================================================================

interface SpinnerProps {
  /**
   * Size of the spinner
   * @default 'medium'
   */
  size?: 'small' | 'medium' | 'large';
  /**
   * Color of the spinner
   * @default '#1A66FF'
   */
  color?: string;
  /**
   * Custom className
   */
  className?: string;
}

/**
 * Spinner Component
 *
 * Rotating loading spinner
 *
 * @example
 * ```tsx
 * <Spinner size="medium" />
 * ```
 */
export const Spinner: React.FC<SpinnerProps> = ({
  size = 'medium',
  color = '#1A66FF',
  className = '',
}) => {
  const sizeMap = {
    small: 16,
    medium: 24,
    large: 32,
  };

  const spinnerSize = sizeMap[size];

  return (
    <motion.div
      className={`inline-block ${className}`}
      style={{
        width: spinnerSize,
        height: spinnerSize,
        border: `3px solid ${color}20`,
        borderTop: `3px solid ${color}`,
        borderRadius: '50%',
      }}
      variants={rotate}
      animate="animate"
    />
  );
};

// ============================================================================
// DOT LOADER COMPONENT
// ============================================================================

interface DotLoaderProps {
  /**
   * Color of the dots
   * @default '#1A66FF'
   */
  color?: string;
  /**
   * Custom className
   */
  className?: string;
}

/**
 * DotLoader Component
 *
 * Three pulsing dots loading indicator
 *
 * @example
 * ```tsx
 * <DotLoader />
 * ```
 */
export const DotLoader: React.FC<DotLoaderProps> = ({
  color = '#1A66FF',
  className = '',
}) => {
  return (
    <div className={`flex items-center gap-1 ${className}`}>
      <motion.div
        className="w-2 h-2 rounded-full"
        style={{ backgroundColor: color }}
        variants={dotPulse(0)}
        animate="animate"
      />
      <motion.div
        className="w-2 h-2 rounded-full"
        style={{ backgroundColor: color }}
        variants={dotPulse(0.2)}
        animate="animate"
      />
      <motion.div
        className="w-2 h-2 rounded-full"
        style={{ backgroundColor: color }}
        variants={dotPulse(0.4)}
        animate="animate"
      />
    </div>
  );
};

// ============================================================================
// SKELETON LOADERS
// ============================================================================

interface SkeletonProps {
  /**
   * Width of the skeleton (CSS value)
   * @default '100%'
   */
  width?: string | number;
  /**
   * Height of the skeleton (CSS value)
   * @default '20px'
   */
  height?: string | number;
  /**
   * Border radius
   * @default '8px'
   */
  borderRadius?: string | number;
  /**
   * Custom className
   */
  className?: string;
}

/**
 * Skeleton Component
 *
 * Animated skeleton loader with shimmer effect
 *
 * @example
 * ```tsx
 * <Skeleton width="100%" height="20px" />
 * ```
 */
export const Skeleton: React.FC<SkeletonProps> = ({
  width = '100%',
  height = '20px',
  borderRadius = '8px',
  className = '',
}) => {
  return (
    <motion.div
      className={`bg-gray-200 ${className}`}
      style={{
        width,
        height,
        borderRadius,
        background: 'linear-gradient(90deg, #EFEFEF 25%, #FAFAFA 50%, #EFEFEF 75%)',
        backgroundSize: '200% 100%',
      }}
      variants={shimmer}
      animate="animate"
    />
  );
};

/**
 * SkeletonCard Component
 *
 * Pre-built skeleton for card layouts
 *
 * @example
 * ```tsx
 * <SkeletonCard />
 * ```
 */
export const SkeletonCard: React.FC<{ className?: string }> = ({
  className = '',
}) => {
  return (
    <div className={`p-4 bg-white rounded-2xl border border-gray-200 ${className}`}>
      <Skeleton width="60%" height="24px" className="mb-3" />
      <Skeleton width="100%" height="16px" className="mb-2" />
      <Skeleton width="80%" height="16px" className="mb-4" />
      <div className="flex gap-2">
        <Skeleton width="80px" height="32px" />
        <Skeleton width="80px" height="32px" />
      </div>
    </div>
  );
};

/**
 * SkeletonList Component
 *
 * Multiple skeleton cards for list loading states
 *
 * @example
 * ```tsx
 * <SkeletonList count={3} />
 * ```
 */
export const SkeletonList: React.FC<{
  count?: number;
  className?: string;
}> = ({ count = 3, className = '' }) => {
  return (
    <div className={`space-y-4 ${className}`}>
      {Array.from({ length: count }).map((_, index) => (
        <SkeletonCard key={index} />
      ))}
    </div>
  );
};

/**
 * SkeletonText Component
 *
 * Skeleton for text content with multiple lines
 *
 * @example
 * ```tsx
 * <SkeletonText lines={3} />
 * ```
 */
export const SkeletonText: React.FC<{
  lines?: number;
  className?: string;
}> = ({ lines = 3, className = '' }) => {
  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: lines }).map((_, index) => (
        <Skeleton
          key={index}
          width={index === lines - 1 ? '70%' : '100%'}
          height="16px"
        />
      ))}
    </div>
  );
};

// ============================================================================
// LOADING OVERLAY
// ============================================================================

interface LoadingOverlayProps {
  /**
   * Whether the overlay is visible
   */
  visible: boolean;
  /**
   * Loading message
   */
  message?: string;
  /**
   * Custom className
   */
  className?: string;
}

/**
 * LoadingOverlay Component
 *
 * Full-screen loading overlay with spinner
 *
 * @example
 * ```tsx
 * <LoadingOverlay visible={isLoading} message="Saving..." />
 * ```
 */
export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
  visible,
  message,
  className = '',
}) => {
  if (!visible) return null;

  return (
    <motion.div
      className={`fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 ${className}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="bg-white rounded-2xl p-6 flex flex-col items-center gap-4 shadow-xl">
        <Spinner size="large" />
        {message && (
          <p className="text-base text-gray-700 font-medium">{message}</p>
        )}
      </div>
    </motion.div>
  );
};
