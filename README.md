# ScreenshotOS — Next.js Phase 1

The first real product slice of ScreenshotOS:

- Email/password sign up and sign in with Supabase Auth
- Cookie-based SSR auth for Next.js App Router
- Protected `/dashboard`
- Private screenshot storage
- `screenshots` database records linked to `auth.users`
- Row Level Security (RLS) so users can only access their own records
- Storage policies so users can only access files inside their own folder
- PNG/JPG/WebP upload with 10 MB validation
- Real screenshot library populated from Supabase
- Private signed image URLs
- Filename search
- Permanent delete
- Sign out

AI analysis is intentionally **not** included in this phase. The goal is to prove the secure account → upload → save → display loop first.

## 1. Install dependencies

```bash
npm install
```

## 2. Create a Supabase project

Create a project at Supabase and open the project dashboard.

In **SQL Editor**, create a new query and paste the entire contents of:

```text
supabase/schema.sql
```

Run it once. This creates:

- `public.screenshots`
- Row Level Security policies
- a private `screenshots` Storage bucket
- Storage policies for user-owned folders

## 3. Add environment variables

Copy:

```text
.env.example
```

to:

```text
.env.local
```

Then get the values from the Supabase project's **Connect** panel:

```env
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_YOUR_KEY
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

Never commit `.env.local`. It is already excluded by `.gitignore`.

## 4. Configure Supabase Auth

For the fastest local test you can temporarily disable email confirmation in the Supabase email-provider settings. A new signup will then receive a session immediately.

For a proper confirmation flow, keep confirmation enabled and configure the **Confirm signup** email template for SSR. Use this confirmation URL in the template:

```text
{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email
```

Also set the Supabase Auth **Site URL** to:

```text
http://localhost:3000
```

When deployed, replace the Site URL and `NEXT_PUBLIC_SITE_URL` with the production domain.

## 5. Start the project

```bash
npm run dev
```

Open:

```text
http://localhost:3000
```

Create an account through `/login`, then open `/dashboard`.

## 6. Verify security correctly

A useful test is to create two accounts:

1. Sign in as User A and upload a screenshot.
2. Sign out.
3. Sign in as User B.
4. User B should not see User A's screenshot.

That isolation is enforced by Supabase RLS and Storage policies, not merely hidden by the frontend.

## Current data model

`screenshots`

| Column | Purpose |
| --- | --- |
| `id` | Screenshot UUID |
| `user_id` | Owner from Supabase Auth |
| `storage_path` | Private bucket path |
| `original_name` | Uploaded filename |
| `mime_type` | PNG/JPEG/WebP |
| `file_size` | File size in bytes |
| `status` | `uploaded`, later used by AI processing |
| `created_at` | Upload timestamp |

The storage path is deliberately structured like:

```text
<user-id>/<random-uuid>.png
```

Storage policies require the first folder to equal the logged-in user's ID.

## Architecture

```text
Browser
  │
  ├── Supabase Auth session
  │
  ├── Upload screenshot
  ▼
Private Supabase Storage
  │
  ├── RLS ownership check
  ▼
PostgreSQL screenshots table
  │
  ▼
Next.js Server Component
  │
  ├── verifies authenticated user
  ├── queries only owned rows
  ├── creates temporary signed image URLs
  ▼
/dashboard
```

## Next phase

Once this loop is tested with a real Supabase project, Phase 2 is:

```text
Upload screenshot
   ↓
Create database row
   ↓
Server-side AI vision analysis
   ↓
Structured title/category/intent/actions
   ↓
Update screenshot record
   ↓
Dashboard displays intelligent card
```

Do not put an AI provider secret key in any `NEXT_PUBLIC_*` variable. The AI call will be server-only.


## Google sign-in setup

The app includes a **Continue with Google** button, but Google OAuth must be enabled once in Supabase and Google Cloud before it can work.

### 1. Enable Google in Supabase

In your Supabase project open **Authentication → Providers → Google**. Keep this page open because it shows the Supabase callback URL that Google needs.

### 2. Create Google OAuth credentials

Open the Google Auth Platform / Google Cloud Console, create or select a project, configure the OAuth consent/branding screens if prompted, then create an **OAuth client ID** with application type **Web application**.

For local development add:

- **Authorized JavaScript origin:** `http://localhost:3000`
- **Authorized redirect URI:** use the exact callback URL shown on the Supabase Google provider page. It normally looks like `https://YOUR_PROJECT_REF.supabase.co/auth/v1/callback`.

Copy the Google **Client ID** and **Client Secret** back into **Supabase → Authentication → Providers → Google**, enable the provider, and save.

### 3. Allow ScreenshotOS to receive the completed login

In **Supabase → Authentication → URL Configuration** set:

- **Site URL:** `http://localhost:3000`
- Add **Redirect URL:** `http://localhost:3000/auth/confirm`

When deployed, add your real production domain and production `/auth/confirm` URL as well.

### 4. Test

Restart the dev server after any `.env.local` changes:

```bash
npm run dev
```

Go to `http://localhost:3000/login`, click **Continue with Google**, choose a Google account, and you should return to `/dashboard` already signed in.

> Important: Google's authorized redirect URI is the **Supabase callback URL**, not `/auth/confirm`. Supabase then redirects the completed PKCE login back to ScreenshotOS at `/auth/confirm`.
