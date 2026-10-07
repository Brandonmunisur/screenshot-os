import { redirect } from 'next/navigation';
import AccountSettingsClient from '@/components/AccountSettingsClient';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Settings — ScreenshotOS',
};

export default async function SettingsPage() {
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  ) {
    redirect('/login');
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) redirect('/login');

  const [{ data: screenshotRows }, { count: savedCount }] = await Promise.all([
    supabase
      .from('screenshots')
      .select('file_size, status')
      .eq('user_id', user.id),
    supabase
      .from('screenshot_saves')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id),
  ]);

  const screenshots = screenshotRows || [];
  const totalBytes = screenshots.reduce(
    (sum, item) => sum + (Number(item.file_size) || 0),
    0
  );
  const analysedCount = screenshots.filter(
    (item) => item.status === 'ready'
  ).length;

  return (
    <AccountSettingsClient
      user={user}
      stats={{
        screenshotCount: screenshots.length,
        analysedCount,
        savedCount: savedCount || 0,
        totalBytes,
      }}
    />
  );
}
