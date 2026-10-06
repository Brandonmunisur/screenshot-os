-- ScreenshotOS Phase 2: AI screenshot analysis fields
-- Safe to run against the existing Phase 1 screenshots table.

alter table public.screenshots
  add column if not exists title text,
  add column if not exists category text,
  add column if not exists description text,
  add column if not exists intent text,
  add column if not exists confidence double precision,
  add column if not exists ai_data jsonb,
  add column if not exists analysis_error text,
  add column if not exists analyzed_at timestamptz;

-- Keep values constrained to the categories/intents ScreenshotOS currently understands.
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'screenshots_category_check'
  ) then
    alter table public.screenshots
      add constraint screenshots_category_check
      check (category is null or category in ('product', 'food', 'place', 'event', 'recipe', 'travel', 'document', 'conversation', 'other'));
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'screenshots_intent_check'
  ) then
    alter table public.screenshots
      add constraint screenshots_intent_check
      check (intent is null or intent in ('possible_purchase', 'eat', 'visit', 'attend', 'cook', 'travel', 'research', 'reference', 'save', 'other'));
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'screenshots_confidence_check'
  ) then
    alter table public.screenshots
      add constraint screenshots_confidence_check
      check (confidence is null or (confidence >= 0 and confidence <= 1));
  end if;
end $$;

create index if not exists screenshots_user_category_idx
  on public.screenshots (user_id, category, created_at desc);
