-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Parent Profile
CREATE TABLE parent_profile (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT,
    email TEXT,
    phone TEXT,
    home_address TEXT,
    default_currency TEXT DEFAULT 'USD',
    time_zone TEXT DEFAULT 'UTC',
    legal_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE parent_profile ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile" ON parent_profile
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile" ON parent_profile
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" ON parent_profile
    FOR UPDATE USING (auth.uid() = user_id);

-- 2. Children
CREATE TABLE children (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    birth_date DATE,
    primary_school TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE children ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their children" ON children
    FOR ALL USING (auth.uid() = user_id);

-- 3. Visits (VisitSession)
CREATE TABLE visits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    child_id UUID REFERENCES children(id) ON DELETE CASCADE,
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ,
    type TEXT CHECK (type IN ('physical_care', 'overnight', 'virtual_call', 'school_transport_only')),
    source TEXT CHECK (source IN ('manual_start_stop', 'auto_from_trip', 'imported_from_calendar')),
    location_tag TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE visits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their visits" ON visits
    FOR ALL USING (auth.uid() = user_id);

-- 4. Trips
CREATE TABLE trips (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    child_id UUID REFERENCES children(id) ON DELETE SET NULL,
    purpose TEXT CHECK (purpose IN ('pickup', 'dropoff', 'visit_activity', 'medical', 'activity', 'other_child_related')),
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ,
    start_location JSONB, -- { lat, lng, label }
    end_location JSONB,   -- { lat, lng, label }
    path JSONB,           -- Array of GPS points: [{ lat, lng, label }]
    distance_miles NUMERIC,
    mileage_rate_per_mile NUMERIC,
    reimbursable_amount NUMERIC,
    auto_detected BOOLEAN DEFAULT FALSE,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE trips ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their trips" ON trips
    FOR ALL USING (auth.uid() = user_id);

-- 5. Expenses
CREATE TABLE expenses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    child_id UUID REFERENCES children(id) ON DELETE SET NULL,
    date TIMESTAMPTZ NOT NULL,
    amount NUMERIC NOT NULL,
    category TEXT CHECK (category IN ('school', 'medical', 'clothing', 'activities', 'entertainment', 'food', 'transport', 'other')),
    merchant_name TEXT,
    payment_method TEXT,
    receipt_image_id TEXT,
    reimbursement_status TEXT CHECK (reimbursement_status IN ('not_requested', 'requested', 'partial', 'paid')),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their expenses" ON expenses
    FOR ALL USING (auth.uid() = user_id);

-- 6. Evidence (EvidenceItem)
CREATE TABLE evidence (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    child_id UUID REFERENCES children(id) ON DELETE SET NULL,
    type TEXT CHECK (type IN ('screenshot', 'photo', 'pdf', 'note', 'audio_file', 'chat_export')),
    source_app TEXT,
    imported_at TIMESTAMPTZ DEFAULT NOW(),
    file_id TEXT,
    text_preview TEXT,
    related_visit_id UUID REFERENCES visits(id) ON DELETE SET NULL,
    related_trip_id UUID REFERENCES trips(id) ON DELETE SET NULL,
    tags TEXT[],
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE evidence ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their evidence" ON evidence
    FOR ALL USING (auth.uid() = user_id);

-- 7. Conversations (ConversationLog)
CREATE TABLE conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    counterparty_name TEXT,
    channel TEXT CHECK (channel IN ('sms_share_extension', 'whatsapp_share_extension', 'email_forward', 'manual_note')),
    start_time TIMESTAMPTZ,
    end_time TIMESTAMPTZ,
    message_count INTEGER,
    direction TEXT CHECK (direction IN ('incoming', 'outgoing', 'mixed')),
    summary_text TEXT,
    evidence_item_ids UUID[], -- Array of evidence IDs
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their conversations" ON conversations
    FOR ALL USING (auth.uid() = user_id);

-- 8. Report Config
CREATE TABLE report_config (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    report_type TEXT CHECK (report_type IN ('time_share', 'mileage', 'expenses', 'all_evidence')),
    frequency TEXT CHECK (frequency IN ('manual', 'monthly', 'weekly')),
    delivery_method TEXT CHECK (delivery_method IN ('on_device_pdf', 'icloud_drive', 'email_export_prompt')),
    include_raw_exports BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE report_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their report config" ON report_config
    FOR ALL USING (auth.uid() = user_id);
