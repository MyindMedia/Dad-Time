import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle, Info, AlertCircle } from 'lucide-react';

export type ToastType = 'success' | 'info' | 'warning' | 'error';

export interface Toast {
    id: string;
    message: string;
    type: ToastType;
    duration?: number;
}

interface ToastProps {
    toast: Toast;
    onDismiss: (id: string) => void;
}

const ToastItem: React.FC<ToastProps> = ({ toast, onDismiss }) => {
    useEffect(() => {
        const duration = toast.duration || 5000;
        const timer = setTimeout(() => {
            onDismiss(toast.id);
        }, duration);

        return () => clearTimeout(timer);
    }, [toast, onDismiss]);

    const getIcon = () => {
        switch (toast.type) {
            case 'success':
                return <CheckCircle size={20} className="text-[#10B981]" />;
            case 'warning':
                return <AlertCircle size={20} className="text-[#F59E0B]" />;
            case 'error':
                return <AlertCircle size={20} className="text-[#F14040]" />;
            default:
                return <Info size={20} className="text-[#1A66FF]" />;
        }
    };

    const getBackgroundColor = () => {
        switch (toast.type) {
            case 'success':
                return 'bg-[#10B981]/10 border-[#10B981]/30';
            case 'warning':
                return 'bg-[#F59E0B]/10 border-[#F59E0B]/30';
            case 'error':
                return 'bg-[#F14040]/10 border-[#F14040]/30';
            default:
                return 'bg-[#1A66FF]/10 border-[#1A66FF]/30';
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: -50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            className={`flex items-center gap-3 p-4 rounded-xl border ${getBackgroundColor()} backdrop-blur-sm shadow-lg min-w-[300px] max-w-md`}
        >
            <div className="flex-shrink-0">{getIcon()}</div>
            <p className="flex-1 text-sm font-medium text-[#00082D]">{toast.message}</p>
            <button
                onClick={() => onDismiss(toast.id)}
                className="flex-shrink-0 text-[#202020] opacity-50 hover:opacity-100 transition-opacity"
            >
                <X size={18} />
            </button>
        </motion.div>
    );
};

interface ToastContainerProps {
    toasts: Toast[];
    onDismiss: (id: string) => void;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onDismiss }) => {
    return (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[9999] flex flex-col gap-2 pointer-events-none">
            <AnimatePresence>
                {toasts.map((toast) => (
                    <div key={toast.id} className="pointer-events-auto">
                        <ToastItem toast={toast} onDismiss={onDismiss} />
                    </div>
                ))}
            </AnimatePresence>
        </div>
    );
};
