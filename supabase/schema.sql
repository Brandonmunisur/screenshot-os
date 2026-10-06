-- ScreenshotOS Phase 1 database + private storage setup
-- Run this entire file once in Supabase Dashboard > SQL Editor.

create extension if not exists pgcrypto;

create table if not exists public.screenshots (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  storage_path text not null unique,
  original_name text not null,
  mime_type text not null,
  file_size bigint not null check (file_size > 0),
  status text not null default 'uploaded' check (status in ('uploaded', 'processing', 'ready', 'failed')),
  created_at timestamptz not null default now()
);

create index if not exists screenshots_user_created_idx
  on public.screenshots (user_id, created_at desc);

alter table public.screenshots enable row level security;

grant select, insert, update, delete on public.screenshots to authenticated;

-- Re-running the setup file remains safe.
drop policy if exists "Users can view own screenshots" on public.screenshots;
drop policy if exists "Users can insert own screenshots" on public.screenshots;
drop policy if exists "Users can update own screenshots" on public.screenshots;
drop policy if exists "Users can delete own screenshots" on public.screenshots;

create policy "Users can view own screenshots"
  on public.screenshots
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users can insert own screenshots"
  on public.screenshots
  for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

create policy "Users can update own screenshots"
  on public.screenshots
  for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Users can delete own screenshots"
  on public.screenshots
  for delete
  to authenticated
  using ((select auth.uid()) = user_id);

-- Private screenshot bucket. The 10 MB limit is deliberately conservative for MVP screenshots.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'screenshots',
  'screenshots',
  false,
  10485760,
  array['image/png', 'image/jpeg', 'image/webp']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Storage path convention: <user_id>/<uuid>.<extension>
drop policy if exists "Users can upload own screenshot files" on storage.objects;
drop policy if exists "Users can read own screenshot files" on storage.objects;
drop policy if exists "Users can delete own screenshot files" on storage.objects;

create policy "Users can upload own screenshot files"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'screenshots'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy "Users can read own screenshot files"
  on storage.objects
  for select
  to authenticated
  using (
    bucket_id = 'screenshots'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy "Users can delete own screenshot files"
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'screenshots'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

-- Persistent saved collections (Wishlist, Food to try, Places, Events, Recipes, Trips, Saved)
create table if not exists public.screenshot_saves (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  screenshot_id uuid not null references public.screenshots(id) on delete cascade,
  collection text not null check (
    collection in (
      'wishlist',
      'food_to_try',
      'places_to_visit',
      'events',
      'recipes',
      'trip_ideas',
      'saved'
    )
  ),
  created_at timestamptz not null default now(),
  unique (user_id, screenshot_id, collection)
);

create index if not exists screenshot_saves_user_collection_idx
  on public.screenshot_saves (user_id, collection, created_at desc);

create index if not exists screenshot_saves_screenshot_idx
  on public.screenshot_saves (screenshot_id);

alter table public.screenshot_saves enable row level security;
grant select, insert, delete on public.screenshot_saves to authenticated;

drop policy if exists "Users can view own saved collections" on public.screenshot_saves;
drop policy if exists "Users can save own screenshots" on public.screenshot_saves;
drop policy if exists "Users can remove own saved screenshots" on public.screenshot_saves;

create policy "Users can view own saved collections"
  on public.screenshot_saves for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users can save own screenshots"
  on public.screenshot_saves for insert to authenticated
  with check (
    (select auth.uid()) = user_id
    and exists (
      select 1 from public.screenshots
      where screenshots.id = screenshot_saves.screenshot_id
        and screenshots.user_id = (select auth.uid())
    )
  );

create policy "Users can remove own saved screenshots"
  on public.screenshot_saves for delete to authenticated
  using ((select auth.uid()) = user_id);
