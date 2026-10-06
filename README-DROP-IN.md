# ScreenshotOS — Drop-in Screenshot Library Patch

This patch is designed for the ScreenshotOS Next.js project where Google/Supabase login is already working.

## It does NOT replace

- `.env.local`
- your Supabase project
- Google OAuth settings
- existing users
- your auth actions/callback
- homepage/login styling

## It adds / upgrades

- real PNG/JPG/WebP uploads (max 10 MB)
- private Supabase Storage path per user
- a `screenshots` database row tied to `auth.users.id`
- server-rendered private dashboard library
- filename search
- open/view screenshot detail page
- server-side ownership check for deletion
- storage + database cleanup when deleting
- Google avatar/name on the dashboard when available

## 1. Back up your working project

Make a copy of the folder first. Do not delete the working version.

## 2. Copy this patch into your project root

Copy the folders/files from this patch over the matching paths in the ScreenshotOS project. Allow replacement for these files only:

- `app/dashboard/page.js`
- `components/DashboardClient.jsx`
- `components/UploadDropzone.jsx`

These are new files:

- `app/api/screenshots/[id]/route.js`
- `app/dashboard/screenshot/[id]/page.js`
- `components/ScreenshotDetailClient.jsx`
- `components/LibraryPatch.module.css`
- `supabase/migrations/20260917_screenshot_library.sql`

Do NOT replace `.env.local`.

## 3. Run the SQL migration in your EXISTING Supabase project

In Supabase:

`SQL Editor` -> `New query`

Paste everything from:

`supabase/migrations/20260917_screenshot_library.sql`

Then click `Run`.

This migration is idempotent for the existing ScreenshotOS schema and does not recreate/change Google OAuth.

## 4. Restart Next.js

```bash
npm run dev
```

No new npm dependency is required if your current Google-login version is already running.

## 5. Test this exact sequence

1. Continue with Google.
2. Open `/dashboard`.
3. Drop a PNG/JPG/WebP into the upload area.
4. Wait for the card to appear.
5. Refresh the browser — the card must still exist.
6. Click the screenshot — the private detail page must open.
7. Go back to the dashboard.
8. Delete the screenshot.
9. Refresh — it must stay deleted.
10. Sign out and sign back in — your remaining screenshots must still be there.

## Privacy check

Create/sign in with another test account if possible. The second account should not see the first account's screenshots. RLS and Storage policies enforce this at Supabase, not merely in the React UI.

## If upload fails

Check these first:

- Supabase `Storage` contains a private bucket named `screenshots`.
- Supabase `Table Editor` contains `public.screenshots`.
- `.env.local` still contains the same Supabase URL/publishable key that already work for login.
- The browser file is PNG, JPG/JPEG, or WebP and below 10 MB.
- Terminal/browser console error text is useful — copy the exact error rather than changing Supabase settings randomly.
