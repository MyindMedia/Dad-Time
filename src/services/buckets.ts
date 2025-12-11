import { supabase } from '../lib/supabase';

const REQUIRED_BUCKETS = [
  { name: 'screenshots', public: true },
  { name: 'receipts', public: true },
  { name: 'evidence', public: true },
  { name: 'avatars', public: true },
  { name: 'exports', public: false },
];

export async function ensureBuckets() {
  if (!supabase) return;
  try {
    const list = await supabase.storage.listBuckets();
    const existing = new Set((list.data || []).map((b: any) => b.name));
    for (const b of REQUIRED_BUCKETS) {
      if (!existing.has(b.name)) {
        await supabase.storage.createBucket(b.name, { public: b.public });
      }
    }
  } catch (e) {
    console.warn('Bucket ensure failed', e);
  }
}
