-- ScreenshotOS analysis reliability
alter table public.screenshots
  add column if not exists analysis_started_at timestamptz;
