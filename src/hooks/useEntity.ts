import { useState, useEffect, useCallback } from 'react';
import { storage } from '../services/storage';

export function useEntity<T extends { id: string }>(key: string) {
    const [items, setItems] = useState<T[]>([]);
    const [loading, setLoading] = useState(true);

    const refresh = useCallback(() => {
        const data = storage.get<T>(key);
        setItems(data);
        setLoading(false);
    }, [key]);

    useEffect(() => {
        refresh();
        // In a real app with sync, we'd subscribe to changes here.
        // For this local-first MVP, we rely on manual refresh or component mount.
        // We could add a simple event emitter for cross-component updates.
        const handleStorageChange = () => refresh();
        window.addEventListener('storage-update', handleStorageChange);
        return () => window.removeEventListener('storage-update', handleStorageChange);
    }, [refresh]);

    const add = useCallback((item: Omit<T, 'id'> & { id?: string }) => {
        const newItem = storage.add<T>(key, item);
        refresh();
        window.dispatchEvent(new Event('storage-update'));
        return newItem;
    }, [key, refresh]);

    const update = useCallback((id: string, updates: Partial<T>) => {
        const updated = storage.update<T>(key, id, updates);
        if (updated) {
            refresh();
            window.dispatchEvent(new Event('storage-update'));
        }
        return updated;
    }, [key, refresh]);

    const remove = useCallback((id: string) => {
        const success = storage.remove<T>(key, id);
        if (success) {
            refresh();
            window.dispatchEvent(new Event('storage-update'));
        }
        return success;
    }, [key, refresh]);

    return { items, loading, add, update, remove, refresh };
}
