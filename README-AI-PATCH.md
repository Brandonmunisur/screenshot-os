# Historical note

This file describes the earlier OpenAI implementation. The current project uses Google Gemini. See `README-GEMINI.md`.

# ScreenshotOS — Phase 2 AI Analysis Drop-In

This patch adds the first ScreenshotOS intelligence layer without replacing your auth setup, Google OAuth configuration, Supabase project, or existing screenshots.

## What it adds

- AI analysis route at `POST /api/screenshots/[id]/analyze`
- automatic analysis after a new screenshot is uploaded
- retry/re-analyse button on screenshot detail pages
- structured fields: title, category, description, intent, confidence
- full AI result stored in `ai_data` JSONB
- processing / ready / failed states
- dashboard search across AI titles, descriptions, categories, intents and keywords
- visible AI result on screenshot cards and detail pages
- server-side ownership check before analysis
- server-only OpenAI API key usage

## Files to copy into your existing project

Copy these folders/files into the root of your current working ScreenshotOS project and merge/replace when asked:

- `app/api/screenshots/[id]/analyze/route.js` (new)
- `app/dashboard/page.js` (replace)
- `app/dashboard/screenshot/[id]/page.js` (replace)
- `components/UploadDropzone.jsx` (replace)
- `components/DashboardClient.jsx` (replace)
- `components/ScreenshotDetailClient.jsx` (replace)
- `components/LibraryPatch.module.css` (replace)
- `lib/openai/analyzeScreenshot.js` (new)
- `supabase/migrations/20260917_ai_analysis.sql` (new)

This patch does NOT include or replace:

- `.env.local`
- `app/auth/actions.js`
- Google login configuration
- Supabase auth client/server files
- homepage/login styling

## Database migration

Open `supabase/migrations/20260917_ai_analysis.sql`, copy it into Supabase > SQL Editor > New query, and Run it once.

Existing screenshots are kept. They will simply have empty AI fields until you open them and click **Analyse screenshot**.

## Environment

Use the secure OpenAI API key setup shown in ChatGPT. Add the resulting key to your EXISTING `.env.local` as `OPENAI_API_KEY`.

You may optionally add:

`OPENAI_SCREENSHOT_MODEL=gpt-5.4-mini`

Do not prefix the API key with `NEXT_PUBLIC_`. It must remain server-only.

Restart Next.js after changing `.env.local`.

## Test

1. Log in.
2. Upload a screenshot.
3. The upload control should show Saving, then Analysing.
4. The card should become Ready and show an AI title/category/intent.
5. Open the screenshot to inspect the structured analysis.
6. Try an old screenshot and click Analyse screenshot.
7. Temporarily remove the API key and retry one image to confirm the app displays a controlled Failed state rather than crashing.

## Privacy note

When AI analysis runs, the uploaded screenshot is sent from your Next.js server to the configured OpenAI API model for analysis. The image remains private in Supabase Storage; the browser never receives the OpenAI API key.
