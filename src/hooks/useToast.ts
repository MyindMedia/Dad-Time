import { useState, useCallback, useEffect } from 'react';
import type { Toast, ToastType } from '../components/Toast';

let toastListeners: Array<(toast: Toast) => void> = [];

// Global function to show toast from anywhere (including services)
export const showToast = (message: string, type: ToastType = 'info', duration?: number) => {
    const toast: Toast = {
        id: `toast-${Date.now()}-${Math.random()}`,
        message,
        type,
        duration,
    };

    toastListeners.forEach(listener => listener(toast));
};

export const useToast = () => {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const addToast = useCallback((toast: Toast) => {
        setToasts(prev => [...prev, toast]);
    }, []);

    const dismissToast = useCallback((id: string) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    }, []);

    useEffect(() => {
        toastListeners.push(addToast);
        return () => {
            toastListeners = toastListeners.filter(listener => listener !== addToast);
        };
    }, [addToast]);

    return {
        toasts,
        dismissToast,
        showToast: (message: string, type: ToastType = 'info', duration?: number) => {
            showToast(message, type, duration);
        },
    };
};
