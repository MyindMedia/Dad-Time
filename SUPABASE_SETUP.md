# Supabase Database Setup Guide

## Quick Setup (5 minutes)

### Step 1: Open Supabase SQL Editor

1. Go to your Supabase project dashboard: https://app.supabase.com
2. Click on your DadTime project
3. Click **SQL Editor** in the left sidebar
4. Click **New Query**

### Step 2: Run the Schema

1. Copy the entire contents of `supabase_schema.sql`
2. Paste into the SQL Editor
3. Click **RUN** button (or press Cmd/Ctrl + Enter)

This will create all 8 tables:
- ✅ `parent_profile` - User profile and settings
- ✅ `children` - Child information
- ✅ `visits` - Visit/time tracking sessions
- ✅ `trips` - GPS-tracked trips with mileage
- ✅ `expenses` - Expense tracking with receipts
- ✅ `evidence` - Evidence archive (photos, docs, notes)
- ✅ `conversations` - Conversation logs with AI summaries
- ✅ `report_config` - Report generation settings

### Step 3: Set Up Storage Buckets

Run this SQL to create storage buckets for receipts and screenshots:

```sql
-- Create storage buckets
INSERT INTO storage.buckets (id, name, public)
VALUES
  ('receipts', 'receipts', true),
  ('evidence', 'evidence', true),
  ('screenshots', 'screenshots', true);

-- Set up storage policies (allow authenticated users to upload)
CREATE POLICY "Users can upload receipts" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'receipts');

CREATE POLICY "Users can view receipts" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'receipts');

CREATE POLICY "Users can delete receipts" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'receipts');

CREATE POLICY "Users can upload evidence" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'evidence');

CREATE POLICY "Users can view evidence" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'evidence');

CREATE POLICY "Users can delete evidence" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'evidence');

CREATE POLICY "Users can upload screenshots" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'screenshots');

CREATE POLICY "Users can view screenshots" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'screenshots');

CREATE POLICY "Users can delete screenshots" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'screenshots');
```

### Step 4: Verify Your .env File

Make sure your `.env` file has these keys:

```env
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here

# OpenAI Configuration (for AI screenshot analysis)
VITE_OPENAI_API_KEY=sk-your-openai-key-here
```

You can find your Supabase keys at:
**Settings → API** in your Supabase dashboard

### Step 5: Test the Connection

Restart your dev server:

```bash
npm run dev
```

Then try:
1. Creating a child profile
2. Starting a visit timer
3. Adding an expense with receipt upload
4. Logging a conversation with screenshot upload
5. Using AI to analyze screenshots

All data will sync to Supabase automatically!

---

## What's Already Configured

### Row Level Security (RLS)
All tables have RLS enabled. Users can only access their own data based on `user_id = auth.uid()`.

### UUID Generation
The `uuid-ossp` extension is enabled for automatic ID generation.

### Timestamps
All tables have `created_at` timestamps. Parent profile has `updated_at` for tracking changes.

### Data Types
- **JSONB** for complex objects (locations, GPS paths)
- **NUMERIC** for precise financial calculations
- **TIMESTAMPTZ** for timezone-aware dates
- **Arrays** for tags and evidence IDs

---

## Optional: Enable Realtime (Advanced)

If you want real-time sync between devices, enable realtime for specific tables:

```sql
ALTER PUBLICATION supabase_realtime ADD TABLE visits;
ALTER PUBLICATION supabase_realtime ADD TABLE trips;
ALTER PUBLICATION supabase_realtime ADD TABLE expenses;
ALTER PUBLICATION supabase_realtime ADD TABLE conversations;
```

---

## Troubleshooting

### "relation already exists"
If you see this error, the table was already created. You can either:
- Skip it (tables are already set up)
- Drop and recreate: `DROP TABLE table_name CASCADE;` then run the schema again

### Storage policies not working
Make sure you've enabled the storage extension:
```sql
CREATE EXTENSION IF NOT EXISTS "storage";
```

### Can't upload files
Check that your storage buckets are created:
```sql
SELECT * FROM storage.buckets;
```

---

## Database Schema Summary

| Table | Purpose | Key Fields |
|-------|---------|------------|
| `parent_profile` | User settings | `full_name`, `email`, `default_currency` |
| `children` | Child records | `full_name`, `birth_date`, `primary_school` |
| `visits` | Time tracking | `start_time`, `end_time`, `type` |
| `trips` | GPS tracking | `purpose`, `distance_miles`, `path`, `reimbursable_amount` |
| `expenses` | Financial tracking | `amount`, `category`, `receipt_image_id` |
| `evidence` | Document archive | `type`, `file_id`, `text_preview` |
| `conversations` | Communication logs | `channel`, `summary_text`, `message_count` |
| `report_config` | Report settings | `report_type`, `frequency`, `delivery_method` |

---

**Done!** Your Supabase database is now ready for DadTime. All features will work with cloud sync enabled.
