-- ScreenshotOS drop-in screenshot library migration
-- Safe to run on the same Supabase project you already use for Google login.
-- It does NOT change auth providers or users.

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

drop policy if exists "Users can view own screenshots" on public.screenshots;
drop policy if exists "Users can insert own screenshots" on public.screenshots;
drop policy if exists "Users can update own screenshots" on public.screenshots;
drop policy if exists "Users can delete own screenshots" on public.screenshots;

create policy "Users can view own screenshots"
  on public.screenshots for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users can insert own screenshots"
  on public.screenshots for insert to authenticated
  with check ((select auth.uid()) = user_id);

create policy "Users can update own screenshots"
  on public.screenshots for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Users can delete own screenshots"
  on public.screenshots for delete to authenticated
  using ((select auth.uid()) = user_id);

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

drop policy if exists "Users can upload own screenshot files" on storage.objects;
drop policy if exists "Users can read own screenshot files" on storage.objects;
drop policy if exists "Users can delete own screenshot files" on storage.objects;

create policy "Users can upload own screenshot files"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'screenshots'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy "Users can read own screenshot files"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'screenshots'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy "Users can delete own screenshot files"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'screenshots'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );
