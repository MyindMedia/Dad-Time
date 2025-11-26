create table if not exists public.calendar_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  provider text not null, -- e.g., 'ics', 'google', 'outlook', 'apple'
  calendar_name text,
  external_id text,
  title text not null,
  description text,
  location text,
  start_time timestamp with time zone not null,
  end_time timestamp with time zone,
  created_at timestamp with time zone default now()
);

alter table public.calendar_events enable row level security;

create policy "Users view own calendar events" on public.calendar_events
  for select using (auth.uid() = user_id);

create policy "Users insert own calendar events" on public.calendar_events
  for insert with check (auth.uid() = user_id);

create index if not exists idx_calendar_events_user_id on public.calendar_events(user_id);
create index if not exists idx_calendar_events_time on public.calendar_events(start_time);
