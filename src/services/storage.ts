import { v4 as uuidv4 } from 'uuid';
import { supabase } from '../lib/supabase';

const STORAGE_PREFIX = 'dadtime_';

export const storage = {
    get: <T>(key: string): T[] => {
        try {
            const item = localStorage.getItem(`${STORAGE_PREFIX}${key}`);
            return item ? JSON.parse(item) : [];
        } catch (error) {
            console.error(`Error reading ${key} from storage`, error);
            return [];
        }
    },

    set: <T>(key: string, data: T[]): void => {
        try {
            localStorage.setItem(`${STORAGE_PREFIX}${key}`, JSON.stringify(data));
        } catch (error) {
            console.error(`Error writing ${key} to storage`, error);
        }
    },

    add: <T extends { id: string }>(key: string, item: Omit<T, 'id'> & { id?: string }): T => {
        const items = storage.get<T>(key);
        const newItem = { ...item, id: item.id || uuidv4() } as T;
        items.push(newItem);
        storage.set(key, items);

        if (supabase) {
            void (async () => {
                try {
                    const payload = mapCamelToSnake(key, newItem);
                    const { error } = await supabase.from(key).upsert(payload);
                    if (error) console.error(`Supabase sync error for ${key}:`, error);
                } catch (err: any) {
                    console.error('Supabase sync failed:', err);
                }
            })();
        }

        return newItem;
    },

    update: <T extends { id: string }>(key: string, id: string, updates: Partial<T>): T | null => {
        const items = storage.get<T>(key);
        const index = items.findIndex((i) => i.id === id);
        if (index === -1) return null;

        const updatedItem = { ...items[index], ...updates };
        items[index] = updatedItem;
        storage.set(key, items);

        if (supabase) {
            void (async () => {
                try {
                    const payload = mapCamelToSnake(key, updatedItem);
                    const { error } = await supabase.from(key).upsert(payload);
                    if (error) console.error(`Supabase sync error for ${key}:`, error);
                } catch (err: any) {
                    console.error('Supabase sync failed:', err);
                }
            })();
        }

        return updatedItem;
    },

    remove: <T extends { id: string }>(key: string, id: string): boolean => {
        const items = storage.get<T>(key);
        const filtered = items.filter((i) => i.id !== id);
        if (filtered.length === items.length) return false;

        storage.set(key, filtered);

        if (supabase) {
            void (async () => {
                try {
                    const { error } = await supabase.from(key).delete().eq('id', id);
                    if (error) console.error(`Supabase delete error for ${key}:`, error);
                } catch (err: any) {
                    console.error('Supabase delete failed:', err);
                }
            })();
        }

        return true;
    },

    uploadFile: async (file: File, path: string, bucket: string = 'evidence'): Promise<string | null> => {
        if (!supabase) {
            console.warn('Supabase not configured. Cannot upload file.');
            return null;
        }

        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `${uuidv4()}.${fileExt}`;
            const filePath = `${path}/${fileName}`;

            const { error } = await supabase.storage
                .from(bucket)
                .upload(filePath, file);

            if (error) {
                console.error('Supabase storage upload error:', error);
                return null;
            }

            const { data } = supabase.storage
                .from(bucket)
                .getPublicUrl(filePath);

            return data.publicUrl;
        } catch (err) {
            console.error('File upload failed:', err);
            return null;
        }
    },

    KEYS: {
        PARENT_PROFILE: 'parent_profile',
        CHILDREN: 'children',
        VISITS: 'visits',
        TRIPS: 'trips',
        EXPENSES: 'expenses',
        EVIDENCE: 'evidence',
        CONVERSATIONS: 'conversations',
        REPORT_CONFIG: 'report_config',
    }
};

// Map camelCase object keys to snake_case for known tables
function mapCamelToSnake(key: string, obj: any) {
    const toSnake = (s: string) => s.replace(/[A-Z]/g, (c) => '_' + c.toLowerCase());
    const mapped: any = {};
    for (const k of Object.keys(obj)) {
        mapped[toSnake(k)] = obj[k];
    }

    // Ensure id stays as provided
    mapped.id = obj.id;

    // Special-case evidence_item_ids: allow raw array
    if (key === storage.KEYS.CONVERSATIONS) {
        // Align known columns to avoid schema errors
        const allow = new Set([
            'id',
            'user_id',
            'counterparty_name',
            'channel',
            'start_time',
            'end_time',
            'message_count',
            'direction',
            'summary_text',
            'evidence_item_ids',
            'created_at'
        ]);
        for (const mk of Object.keys(mapped)) {
            if (!allow.has(mk)) delete mapped[mk];
        }
    }

    if (key === storage.KEYS.VISITS) {
        const allow = new Set([
            'id', 'user_id', 'child_id', 'start_time', 'end_time', 'type', 'source', 'location_tag', 'notes', 'created_at'
        ]);
        for (const mk of Object.keys(mapped)) {
            if (!allow.has(mk)) delete mapped[mk];
        }
    }

    if (key === storage.KEYS.TRIPS) {
        const allow = new Set([
            'id', 'user_id', 'child_id', 'purpose', 'start_time', 'end_time', 'start_location', 'end_location', 'path', 'distance_miles', 'mileage_rate_per_mile', 'reimbursable_amount', 'auto_detected', 'notes', 'created_at'
        ]);
        for (const mk of Object.keys(mapped)) {
            if (!allow.has(mk)) delete mapped[mk];
        }
    }

    if (key === storage.KEYS.EXPENSES) {
        const allow = new Set([
            'id', 'user_id', 'child_id', 'date', 'amount', 'category', 'merchant_name', 'payment_method', 'receipt_image_id', 'reimbursement_status', 'notes', 'created_at'
        ]);
        for (const mk of Object.keys(mapped)) {
            if (!allow.has(mk)) delete mapped[mk];
        }
    }

    return mapped;
}
