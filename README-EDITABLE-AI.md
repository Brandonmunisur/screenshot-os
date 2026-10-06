# ScreenshotOS — Editable AI Results

This build adds user corrections to screenshot analysis.

## What changed

- Open any analysed screenshot and choose **Edit details**.
- Edit title, description, category, intent, brand, venue, location, event date, visible price, source, product type, colours, style, and keywords.
- **Save changes** securely updates only the signed-in user's screenshot.
- Manual corrections are stored inside the existing `screenshots` row and `ai_data` JSON.
- No new Supabase migration is required.
- If the category changes, ScreenshotOS refreshes suggested actions to match the new category.
- Running **Analyse again** later intentionally replaces manual corrections with a fresh Gemini result.
- Date display is deterministic to prevent the previous server/client hydration mismatch.

## Test

1. Run `npm run dev`.
2. Open an analysed screenshot.
3. Click **Edit details**.
4. Change one field, e.g. title or venue.
5. Click **Save changes**.
6. Refresh the page and confirm the correction remains.
7. Return to the dashboard and confirm search/filtering uses the corrected metadata.
