import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { isValidCollection } from '@/lib/screenshotCollections';

export async function POST(request) {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ error: 'You must be signed in.' }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const screenshotId = String(body.screenshotId || '');
  const collection = String(body.collection || '');

  if (!screenshotId || !isValidCollection(collection)) {
    return NextResponse.json({ error: 'Invalid save request.' }, { status: 400 });
  }

  const { data: screenshot, error: screenshotError } = await supabase
    .from('screenshots')
    .select('id')
    .eq('id', screenshotId)
    .eq('user_id', user.id)
    .maybeSingle();

  if (screenshotError || !screenshot) {
    return NextResponse.json({ error: 'Screenshot not found.' }, { status: 404 });
  }

  const { data: existing, error: existingError } = await supabase
    .from('screenshot_saves')
    .select('id')
    .eq('user_id', user.id)
    .eq('screenshot_id', screenshotId)
    .eq('collection', collection)
    .maybeSingle();

  if (existingError) {
    return NextResponse.json(
      { error: 'Saved collections are not ready yet. Run the saved-collections migration in Supabase.' },
      { status: 500 }
    );
  }

  if (existing) {
    const { error: deleteError } = await supabase
      .from('screenshot_saves')
      .delete()
      .eq('id', existing.id)
      .eq('user_id', user.id);

    if (deleteError) {
      return NextResponse.json({ error: deleteError.message }, { status: 500 });
    }

    return NextResponse.json({ screenshotId, collection, saved: false });
  }

  const { error: insertError } = await supabase.from('screenshot_saves').insert({
    user_id: user.id,
    screenshot_id: screenshotId,
    collection,
  });

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  return NextResponse.json({ screenshotId, collection, saved: true });
}
