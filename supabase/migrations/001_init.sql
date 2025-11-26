-- Schema initialization for Dad Time

-- Users table (app-level profile; auth is handled by Supabase Auth)
create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  email varchar(255) unique not null,
  password_hash varchar(255) not null,
  full_name varchar(255) not null,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Custody sessions table
create table if not exists public.custody_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  start_time timestamp with time zone not null,
  end_time timestamp with time zone,
  child_name varchar(255) not null,
  notes text,
  is_active boolean default true,
  created_at timestamp with time zone default now()
);

-- GPS trips table
create table if not exists public.gps_trips (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references public.custody_sessions(id) on delete cascade,
  start_location jsonb not null,
  end_location jsonb not null,
  distance_miles numeric(10,2) not null,
  mileage_rate numeric(10,2) default 0.70,
  route_data jsonb,
  created_at timestamp with time zone default now()
);

-- Expenses table
create table if not exists public.expenses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  receipt_url text not null,
  category varchar(100) not null,
  amount numeric(10,2) not null,
  expense_date date not null,
  reimbursement_status varchar(50) default 'pending',
  created_at timestamp with time zone default now()
);

-- Evidence items table
create table if not exists public.evidence_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  item_type varchar(50) not null,
  file_url text not null,
  description text,
  ai_analysis jsonb,
  created_at timestamp with time zone default now()
);

-- AI conversations table
create table if not exists public.ai_conversations (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references public.custody_sessions(id) on delete cascade,
  image_url text not null,
  summary text not null,
  tone varchar(50) not null,
  key_points jsonb,
  cost numeric(10,4) not null,
  created_at timestamp with time zone default now()
);

-- Indexes
create index if not exists idx_custody_sessions_user_id on public.custody_sessions(user_id);
create index if not exists idx_custody_sessions_start_time on public.custody_sessions(start_time);
create index if not exists idx_gps_trips_session_id on public.gps_trips(session_id);
create index if not exists idx_expenses_user_id on public.expenses(user_id);
create index if not exists idx_expenses_date on public.expenses(expense_date);
create index if not exists idx_evidence_user_id on public.evidence_items(user_id);
create index if not exists idx_ai_conversations_session_id on public.ai_conversations(session_id);

-- Row Level Security
alter table public.custody_sessions enable row level security;
alter table public.gps_trips enable row level security;
alter table public.expenses enable row level security;
alter table public.evidence_items enable row level security;
alter table public.ai_conversations enable row level security;

-- Policies (users only access their own records)
create policy "Users can view own custody sessions" on public.custody_sessions
  for select using (auth.uid() = user_id);
create policy "Users can insert own custody sessions" on public.custody_sessions
  for insert with check (auth.uid() = user_id);
create policy "Users can update own custody sessions" on public.custody_sessions
  for update using (auth.uid() = user_id);

create policy "Users view own expenses" on public.expenses
  for select using (auth.uid() = user_id);
create policy "Users insert own expenses" on public.expenses
  for insert with check (auth.uid() = user_id);
create policy "Users update own expenses" on public.expenses
  for update using (auth.uid() = user_id);
create policy "Users delete own expenses" on public.expenses
  for delete using (auth.uid() = user_id);

create policy "Users view own evidence" on public.evidence_items
  for select using (auth.uid() = user_id);
create policy "Users insert own evidence" on public.evidence_items
  for insert with check (auth.uid() = user_id);

create policy "Users view own trips" on public.gps_trips
  for select using (
    exists (
      select 1 from public.custody_sessions cs
      where cs.id = gps_trips.session_id and cs.user_id = auth.uid()
    )
  );
create policy "Users insert trips for own session" on public.gps_trips
  for insert with check (
    (session_id is null) or exists (
      select 1 from public.custody_sessions cs
      where cs.id = session_id and cs.user_id = auth.uid()
    )
  );

create policy "Users view own AI conversations" on public.ai_conversations
  for select using (
    exists (
      select 1 from public.custody_sessions cs
      where cs.id = ai_conversations.session_id and cs.user_id = auth.uid()
    )
  );
create policy "Users insert AI conversations for own session" on public.ai_conversations
  for insert with check (
    (session_id is null) or exists (
      select 1 from public.custody_sessions cs
      where cs.id = session_id and cs.user_id = auth.uid()
    )
  );

-- Create storage buckets for receipts and evidence (requires service role)
select storage.create_bucket('receipts', public => true);
select storage.create_bucket('evidence', public => true);
