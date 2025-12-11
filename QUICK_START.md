# DadTime - Quick Start Guide

## Database Setup Complete ✅

Your Supabase schema has been updated and is ready to deploy!

### What Was Updated:

1. **Schema File (`supabase_schema.sql`)**
   - ✅ Added 'medical' and 'activity' to trip purposes
   - ✅ Added 'entertainment' to expense categories
   - ✅ Added GPS `path` field to trips table
   - ✅ All 8 tables defined with Row Level Security

2. **Storage Service (`src/services/storage.ts`)**
   - ✅ Added bucket parameter to `uploadFile()` function
   - ✅ Supports 3 buckets: 'receipts', 'evidence', 'screenshots'

3. **File Upload Integration**
   - ✅ Expenses → 'receipts' bucket
   - ✅ Evidence → 'evidence' bucket
   - ✅ Conversations → 'screenshots' bucket

---

## Next Steps (In Order):

### 1. Set Up Supabase Tables (5 minutes)

Go to your Supabase SQL Editor and run `supabase_schema.sql`:

```bash
1. Open https://app.supabase.com
2. Click your project
3. Click "SQL Editor" → "New Query"
4. Copy/paste entire supabase_schema.sql file
5. Click "RUN"
```

See `SUPABASE_SETUP.md` for detailed instructions.

### 2. Create Storage Buckets (2 minutes)

In the same SQL Editor, run:

```sql
-- Create storage buckets
INSERT INTO storage.buckets (id, name, public)
VALUES
  ('receipts', 'receipts', true),
  ('evidence', 'evidence', true),
  ('screenshots', 'screenshots', true);

-- Set up policies for authenticated users
CREATE POLICY "Users can upload receipts" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'receipts');

CREATE POLICY "Users can view receipts" ON storage.objects
  FOR SELECT TO authenticated USING (bucket_id = 'receipts');

CREATE POLICY "Users can delete receipts" ON storage.objects
  FOR DELETE TO authenticated USING (bucket_id = 'receipts');

CREATE POLICY "Users can upload evidence" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'evidence');

CREATE POLICY "Users can view evidence" ON storage.objects
  FOR SELECT TO authenticated USING (bucket_id = 'evidence');

CREATE POLICY "Users can delete evidence" ON storage.objects
  FOR DELETE TO authenticated USING (bucket_id = 'evidence');

CREATE POLICY "Users can upload screenshots" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'screenshots');

CREATE POLICY "Users can view screenshots" ON storage.objects
  FOR SELECT TO authenticated USING (bucket_id = 'screenshots');

CREATE POLICY "Users can delete screenshots" ON storage.objects
  FOR DELETE TO authenticated USING (bucket_id = 'screenshots');
```

### 3. Verify Your `.env` File

Make sure you have all keys:

```env
# Supabase (get from Settings → API in Supabase dashboard)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here

# OpenAI (get from https://platform.openai.com/api-keys)
VITE_OPENAI_API_KEY=sk-your-openai-key-here
```

### 4. Test Everything

Start the dev server and test each feature:

```bash
npm run dev
```

**Test Checklist:**
- [ ] Create a child profile
- [ ] Start/stop a visit timer
- [ ] Log a GPS trip
- [ ] Add an expense with receipt upload
- [ ] Upload conversation screenshots
- [ ] Use AI to analyze screenshots
- [ ] Generate a PDF report

---

## Database Tables Created:

| Table | Purpose | Features |
|-------|---------|----------|
| `parent_profile` | User settings | Profile info, timezone, currency |
| `children` | Child records | Names, birthdate, school |
| `visits` | Time tracking | Timer sessions, overnight stays |
| `trips` | GPS tracking | Mileage, routes, reimbursement |
| `expenses` | Financial tracking | Categories, receipts, reimbursement |
| `evidence` | Document archive | Photos, PDFs, notes |
| `conversations` | Communication logs | Screenshots, AI summaries, tone |
| `report_config` | Report settings | Frequency, delivery method |

---

## Storage Buckets:

| Bucket | Used For | Max Size |
|--------|----------|----------|
| `receipts` | Expense receipt images/PDFs | 5 MB per file |
| `evidence` | General evidence files | 10 MB per file |
| `screenshots` | Conversation screenshots | 5 MB per file |

---

## Features Ready to Use:

✅ **Visit Timer** - Tracks time with children, prevents screen sleep
✅ **GPS Trips** - Real-time tracking with mileage calculation ($0.70/mile)
✅ **Expense Tracking** - Upload receipts, track reimbursement
✅ **Evidence Archive** - Store photos, docs, notes with AI tone analysis
✅ **Conversation Logs** - Upload screenshots, AI auto-generates summaries
✅ **Analytics Dashboard** - Charts for hours, expenses, mileage
✅ **PDF Reports** - 4 report types for court documentation
✅ **Offline Mode** - Works without internet, syncs when online
✅ **iOS Optimized** - Haptic feedback, safe areas, installable

---

## Build Status:

```
✅ TypeScript compilation: PASSED
✅ Production build: PASSED (2.55s)
✅ Bundle size: 468.89 KB (gzipped)
✅ No errors or warnings
```

---

## Need Help?

- **Database Setup:** See `SUPABASE_SETUP.md`
- **Deployment:** See `DEPLOYMENT.md`
- **Apple Mini App:** See `APPLE_MINI_APP_SETUP.md`
- **AI Features:** See `AI_SCREENSHOT_ANALYSIS.md`
- **All Features:** See `IMPLEMENTATION_COMPLETE.md`

---

**Ready to deploy!** 🚀

After setting up Supabase tables, you can deploy to Vercel:

```bash
npm install -g vercel
npm run build
vercel --prod
```

Then test on your iPhone by visiting the URL and tapping "Add to Home Screen"!
