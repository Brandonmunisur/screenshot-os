-- ScreenshotOS Beta Readiness v1
-- Adds lightweight analysis-rate tracking and first-party product event logging.

create table if not exists public.analysis_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  screenshot_id uuid,
  created_at timestamptz not null default now()
);

create index if not exists analysis_events_user_created_idx
  on public.analysis_events (user_id, created_at desc);

alter table public.analysis_events enable row level security;

grant select, insert on public.analysis_events to authenticated;

drop policy if exists "Users can view own analysis events" on public.analysis_events;
drop policy if exists "Users can add own analysis events" on public.analysis_events;

create policy "Users can view own analysis events"
  on public.analysis_events
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users can add own analysis events"
  on public.analysis_events
  for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

create table if not exists public.beta_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  event_name text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists beta_events_user_created_idx
  on public.beta_events (user_id, created_at desc);

create index if not exists beta_events_name_created_idx
  on public.beta_events (event_name, created_at desc);

alter table public.beta_events enable row level security;

grant insert on public.beta_events to authenticated;

drop policy if exists "Users can add own beta events" on public.beta_events;

create policy "Users can add own beta events"
  on public.beta_events
  for insert
  to authenticated
  with check ((select auth.uid()) = user_id);
