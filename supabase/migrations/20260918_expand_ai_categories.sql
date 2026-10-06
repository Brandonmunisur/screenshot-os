-- ScreenshotOS Phase 2.1: broaden screenshot categories and intents.
-- Safe to run after 20260917_ai_analysis.sql.

alter table public.screenshots
  drop constraint if exists screenshots_category_check;

alter table public.screenshots
  add constraint screenshots_category_check
  check (
    category is null or category in (
      'product', 'food', 'place', 'event', 'recipe', 'travel',
      'document', 'conversation', 'other'
    )
  );

alter table public.screenshots
  drop constraint if exists screenshots_intent_check;

alter table public.screenshots
  add constraint screenshots_intent_check
  check (
    intent is null or intent in (
      'possible_purchase', 'eat', 'visit', 'attend', 'cook', 'travel',
      'research', 'reference', 'save', 'other'
    )
  );
