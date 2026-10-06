# ScreenshotOS saved collections

This version adds persistent account-scoped saved lists.

## Existing Supabase project

Run only this migration in Supabase Dashboard > SQL Editor:

`supabase/migrations/20261006_saved_collections.sql`

Do not rerun the full schema on an existing working project.

## Lists included

- Wishlist
- Food to try
- Places to visit
- Events
- Recipes
- Trip ideas
- Saved

The existing AI suggested actions now save/remove screenshots from the matching list. The dashboard sidebar shows the lists and live counts. RLS keeps each user's saved-list records account-scoped.
