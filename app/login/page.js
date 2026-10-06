import AuthPanel from '@/components/AuthPanel';

export const metadata = {
  title: 'Sign in — ScreenshotOS',
};

export default async function LoginPage({ searchParams }) {
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  ) {
    return (
      <main className="setup-page">
        <div className="setup-card">
          <span className="section-number">SUPABASE SETUP REQUIRED</span>

          <h1>Connect the backend first.</h1>

          <p>
            Copy <code>.env.example</code> to <code>.env.local</code>, add your
            Supabase project URL and publishable key, then run{' '}
            <code>supabase/schema.sql</code> in the Supabase SQL Editor.
          </p>
        </div>
      </main>
    );
  }

  const params = await searchParams;

  return (
    <AuthPanel
      initialMode={params?.mode}
      error={params?.error}
      message={params?.message}
    />
  );
}