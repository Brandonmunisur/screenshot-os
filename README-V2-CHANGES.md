# ScreenshotOS — AI schema + real-photo demo update

This update keeps your existing auth, Supabase project, screenshots, and Gemini setup.

## AI improvements

The Gemini analysis schema now distinguishes:

- product
- food
- place
- event
- recipe
- travel
- document
- conversation
- other

Food screenshots can now use intents such as `eat` or `save`, instead of being forced into `possible_purchase`.
Restaurant/cafe names are stored as `venue` rather than `brand` when appropriate.
Product analysis also returns optional product type, primary/secondary colour and style fields.

### Existing Supabase projects

If you already ran the first AI migration, run this new migration once:

`supabase/migrations/20260918_expand_ai_categories.sql`

It only widens the allowed category/intent values. It does not delete screenshots.

## Gemini model

The default is now:

`gemini-3.5-flash-lite`

Your `.env.local` can contain:

`GEMINI_SCREENSHOT_MODEL=gemini-3.5-flash-lite`

## Public website imagery

The CSS-drawn demo art has been replaced by real, royalty-free Unsplash photography for the product, food, restaurant, event, recipe, travel and workspace demo cards.
