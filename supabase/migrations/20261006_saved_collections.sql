-- ScreenshotOS: persistent saved collections
-- Safe to run on the existing ScreenshotOS Supabase project.
-- It does not alter or delete existing screenshots.

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
  on public.screenshot_saves
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users can save own screenshots"
  on public.screenshot_saves
  for insert
  to authenticated
  with check (
    (select auth.uid()) = user_id
    and exists (
      select 1
      from public.screenshots
      where screenshots.id = screenshot_saves.screenshot_id
        and screenshots.user_id = (select auth.uid())
    )
  );

create policy "Users can remove own saved screenshots"
  on public.screenshot_saves
  for delete
  to authenticated
  using ((select auth.uid()) = user_id);
