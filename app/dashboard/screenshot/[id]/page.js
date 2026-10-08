import { notFound, redirect } from 'next/navigation';
import ScreenshotDetailClient from '@/components/ScreenshotDetailClient';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Screenshot — ScreenshotOS',
};

export default async function ScreenshotDetailPage({ params }) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) redirect('/login');

  const { data: screenshot, error } = await supabase
    .from('screenshots')
    .select('id, user_id, storage_path, original_name, mime_type, file_size, status, title, category, description, intent, confidence, ai_data, analysis_error, analyzed_at, analysis_started_at, created_at')
    .eq('id', id)
    .eq('user_id', user.id)
    .single();

  if (error || !screenshot) notFound();

  let normalizedScreenshot = screenshot;
  const startedAt = screenshot.analysis_started_at
    ? new Date(screenshot.analysis_started_at).getTime()
    : 0;

  if (
    screenshot.status === 'processing' &&
    startedAt &&
    startedAt < Date.now() - 2 * 60 * 1000
  ) {
    const analysis_error =
      'AI analysis did not finish in time. Use Analyse screenshot to retry.';

    await supabase
      .from('screenshots')
      .update({
        status: 'failed',
        analysis_error,
        analysis_started_at: null,
      })
      .eq('id', screenshot.id)
      .eq('user_id', user.id);

    normalizedScreenshot = {
      ...screenshot,
      status: 'failed',
      analysis_error,
      analysis_started_at: null,
    };
  }

  const { data: signed } = await supabase.storage
    .from('screenshots')
    .createSignedUrl(screenshot.storage_path, 60 * 60);

  const { data: savedRows, error: savedRowsError } = await supabase
    .from('screenshot_saves')
    .select('screenshot_id, collection, created_at')
    .eq('screenshot_id', screenshot.id)
    .order('created_at', { ascending: false });

  return (
    <ScreenshotDetailClient
      screenshot={{ ...normalizedScreenshot, signed_url: signed?.signedUrl || '' }}
      initialSavedEntries={savedRows || []}
      collectionsReady={!savedRowsError}
    />
  );
}
