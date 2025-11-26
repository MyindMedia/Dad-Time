-- Users table (managed by Supabase Auth)
-- Note: Users are handled by Supabase Auth, but we can extend the auth.users table

-- Custody sessions table
CREATE TABLE custody_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE,
  child_name VARCHAR(255) NOT NULL,
  notes TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- GPS trips table
CREATE TABLE gps_trips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES custody_sessions(id) ON DELETE CASCADE,
  start_location JSONB NOT NULL,
  end_location JSONB NOT NULL,
  distance_miles DECIMAL(10,2) NOT NULL,
  mileage_rate DECIMAL(10,2) DEFAULT 0.70,
  route_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Expenses table
CREATE TABLE expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  receipt_url TEXT NOT NULL,
  category VARCHAR(100) NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  expense_date DATE NOT NULL,
  reimbursement_status VARCHAR(50) DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Evidence items table
CREATE TABLE evidence_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  item_type VARCHAR(50) NOT NULL,
  file_url TEXT NOT NULL,
  description TEXT,
  ai_analysis JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- AI conversations table
CREATE TABLE ai_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES custody_sessions(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  summary TEXT NOT NULL,
  tone VARCHAR(50) NOT NULL,
  key_points JSONB,
  cost DECIMAL(10,4) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_custody_sessions_user_id ON custody_sessions(user_id);
CREATE INDEX idx_custody_sessions_start_time ON custody_sessions(start_time);
CREATE INDEX idx_gps_trips_session_id ON gps_trips(session_id);
CREATE INDEX idx_expenses_user_id ON expenses(user_id);
CREATE INDEX idx_expenses_date ON expenses(expense_date);
CREATE INDEX idx_evidence_user_id ON evidence_items(user_id);
CREATE INDEX idx_ai_conversations_session_id ON ai_conversations(session_id);

-- Set up Row Level Security (RLS)
ALTER TABLE custody_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE gps_trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE evidence_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_conversations ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view own custody sessions" ON custody_sessions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own custody sessions" ON custody_sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own custody sessions" ON custody_sessions
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own GPS trips" ON gps_trips
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM custody_sessions 
    WHERE custody_sessions.id = gps_trips.session_id 
    AND custody_sessions.user_id = auth.uid()
  ));

CREATE POLICY "Users can insert own GPS trips" ON gps_trips
  FOR INSERT WITH CHECK (EXISTS (
    SELECT 1 FROM custody_sessions 
    WHERE custody_sessions.id = gps_trips.session_id 
    AND custody_sessions.user_id = auth.uid()
  ));

CREATE POLICY "Users can view own expenses" ON expenses
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own expenses" ON expenses
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own expenses" ON expenses
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own evidence items" ON evidence_items
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own evidence items" ON evidence_items
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own evidence items" ON evidence_items
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own AI conversations" ON ai_conversations
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM custody_sessions 
    WHERE custody_sessions.id = ai_conversations.session_id 
    AND custody_sessions.user_id = auth.uid()
  ));

CREATE POLICY "Users can insert own AI conversations" ON ai_conversations
  FOR INSERT WITH CHECK (EXISTS (
    SELECT 1 FROM custody_sessions 
    WHERE custody_sessions.id = ai_conversations.session_id 
    AND custody_sessions.user_id = auth.uid()
  ));