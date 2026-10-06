# ScreenshotOS — Gemini AI Analysis

This version replaces the OpenAI screenshot-analysis provider with Google Gemini while keeping the existing auth, Supabase database, storage, dashboard and AI-analysis fields.

## What changed

- AI provider: Google Gemini
- Default model: `gemini-3.5-flash-lite`
- New server-only env var: `GEMINI_API_KEY`
- Screenshots are downloaded privately by the Next.js server and sent to Gemini as inline image bytes.
- The Gemini key never reaches browser code.
- Existing Phase 2 database migration remains valid. Do not create a second AI schema.

## Setup

1. Keep/copy your existing `.env.local` from your working ScreenshotOS project.
2. Add:

   `GEMINI_API_KEY=YOUR_GEMINI_API_KEY`

   Optional:

   `GEMINI_SCREENSHOT_MODEL=gemini-3.5-flash-lite`

3. If you have NOT already run `supabase/migrations/20260917_ai_analysis.sql`, run it once in Supabase SQL Editor.
4. Restart Next.js with `npm run dev`.
5. Upload a non-sensitive test screenshot.

## Existing OpenAI key

The application no longer calls OpenAI for screenshot analysis. You may remove `OPENAI_API_KEY` and `OPENAI_SCREENSHOT_MODEL` from `.env.local` if nothing else in your project uses them.

## Testing

Upload a clear product, restaurant, event or recipe screenshot. The card should move from Saving -> Analysing -> Ready and display an AI title/category/intent. If analysis fails, open the screenshot or inspect the `analysis_error` column in Supabase.

## Privacy note

Google's Gemini API free tier may use submitted content to improve Google products under the current free-tier terms. Do not use sensitive/private screenshots during free-tier development testing. Move to an appropriate production/privacy arrangement before handling sensitive user content.
