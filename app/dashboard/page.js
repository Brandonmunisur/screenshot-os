import { redirect } from 'next/navigation';
import DashboardClient from '@/components/DashboardClient';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Your library — ScreenshotOS',
};

export default async function DashboardPage() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) {
    redirect('/login');
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) redirect('/login');

  const { data: rows, error } = await supabase
    .from('screenshots')
    .select('id, storage_path, original_name, mime_type, file_size, status, title, category, description, intent, confidence, analysis_error, analyzed_at, ai_data, created_at')
    .order('created_at', { ascending: false });

  if (error) {
    return (
      <main className="setup-page">
        <div className="setup-card">
          <span className="section-number">DATABASE UPDATE NEEDED</span>
          <h1>ScreenshotOS can authenticate you, but the AI analysis fields are not ready.</h1>
          <p>Run <code>supabase/migrations/20260917_ai_analysis.sql</code> in your Supabase SQL Editor, then refresh this page.</p>
          <p className="setup-error">{error.message}</p>
        </div>
      </main>
    );
  }

  const { data: savedRows, error: savedRowsError } = await supabase
    .from('screenshot_saves')
    .select('screenshot_id, collection, created_at')
    .order('created_at', { ascending: false });

  const screenshots = await Promise.all((rows || []).map(async (row) => {
    const { data } = await supabase.storage
      .from('screenshots')
      .createSignedUrl(row.storage_path, 60 * 60);

    return {
      ...row,
      signed_url: data?.signedUrl || '',
    };
  }));

  return (
    <DashboardClient
      user={user}
      screenshots={screenshots}
      initialSavedEntries={savedRows || []}
      collectionsReady={!savedRowsError}
    />
  );
}
