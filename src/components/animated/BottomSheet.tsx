import { motion, useAnimation } from 'framer-motion';
import type { PanInfo } from 'framer-motion';
import { useEffect } from 'react';
import type { ReactNode } from 'react';
import { slideUp } from '../../lib/animations';
import { triggerHaptic } from '../../utils/ios';

interface BottomSheetProps {
  /**
   * Whether the bottom sheet is open
   */
  isOpen: boolean;
  /**
   * Callback when the sheet should close
   */
  onClose: () => void;
  /**
   * Sheet content
   */
  children: ReactNode;
  /**
   * Title for the sheet (optional)
   */
  title?: string;
  /**
   * Enable drag-to-dismiss
   * @default true
   */
  draggable?: boolean;
  /**
   * Custom className for the sheet content
   */
  className?: string;
  /**
   * Maximum height of the sheet
   * @default '90vh'
   */
  maxHeight?: string;
}

/**
 * BottomSheet Component
 *
 * Mobile-friendly modal that slides up from the bottom.
 * Supports drag-to-dismiss gesture and backdrop tap to close.
 *
 * @example
 * ```tsx
 * const [isOpen, setIsOpen] = useState(false);
 *
 * <BottomSheet
 *   isOpen={isOpen}
 *   onClose={() => setIsOpen(false)}
 *   title="Add Expense"
 * >
 *   <form>...</form>
 * </BottomSheet>
 * ```
 */
export const BottomSheet: React.FC<BottomSheetProps> = ({
  isOpen,
  onClose,
  children,
  title,
  draggable = true,
  className = '',
  maxHeight = '90vh',
}) => {
  const controls = useAnimation();

  useEffect(() => {
    if (isOpen) {
      controls.start('animate');
      // Lock body scroll when sheet is open
      document.body.style.overflow = 'hidden';
    } else {
      controls.start('exit');
      // Restore body scroll
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen, controls]);

  const handleDragEnd = (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    // If dragged down more than 100px or with significant velocity, close
    if (info.offset.y > 100 || info.velocity.y > 500) {
      triggerHaptic('light');
      onClose();
    } else {
      // Snap back to open position
      controls.start('animate');
    }
  };

  const handleBackdropClick = () => {
    triggerHaptic('light');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <motion.div
        className="fixed inset-0 bg-black z-40"
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.5 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
        onClick={handleBackdropClick}
      />

      {/* Bottom Sheet */}
      <motion.div
        className={`fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl z-50 overflow-hidden ${className}`}
        style={{
          maxHeight,
          boxShadow: '0 -4px 20px rgba(0, 0, 0, 0.1)',
        }}
        variants={slideUp}
        initial="initial"
        animate={controls}
        exit="exit"
        drag={draggable ? 'y' : false}
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={{ top: 0, bottom: 0.5 }}
        onDragEnd={draggable ? handleDragEnd : undefined}
      >
        {/* Drag Handle */}
        {draggable && (
          <div className="pt-3 pb-2 flex justify-center">
            <div className="w-12 h-1.5 bg-gray-300 rounded-full" />
          </div>
        )}

        {/* Title */}
        {title && (
          <div className="px-6 py-3 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          </div>
        )}

        {/* Content */}
        <div className="overflow-y-auto" style={{ maxHeight: `calc(${maxHeight} - ${title ? '100px' : '60px'})` }}>
          {children}
        </div>
      </motion.div>
    </>
  );
};

/**
 * BottomSheetAction Component
 *
 * Styled button for bottom sheet actions
 *
 * @example
 * ```tsx
 * <BottomSheetAction onClick={handleSave}>
 *   Save
 * </BottomSheetAction>
 * ```
 */
export const BottomSheetAction: React.FC<{
  children: ReactNode;
  onClick: () => void;
  variant?: 'primary' | 'secondary' | 'danger';
  disabled?: boolean;
  className?: string;
}> = ({ children, onClick, variant = 'primary', disabled = false, className = '' }) => {
  const variantStyles = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700',
    secondary: 'bg-gray-100 text-gray-900 hover:bg-gray-200',
    danger: 'bg-red-600 text-white hover:bg-red-700',
  };

  const handleClick = () => {
    triggerHaptic('medium');
    onClick();
  };

  return (
    <motion.button
      className={`w-full py-3 px-4 rounded-xl font-medium transition-colors ${variantStyles[variant]} ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
      onClick={handleClick}
      disabled={disabled}
      whileTap={{ scale: disabled ? 1 : 0.98 }}
    >
      {children}
    </motion.button>
  );
};
