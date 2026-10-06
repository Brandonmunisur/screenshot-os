import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

const CATEGORIES = new Set([
  'product',
  'food',
  'place',
  'event',
  'recipe',
  'travel',
  'document',
  'conversation',
  'other',
]);

const INTENTS = new Set([
  'possible_purchase',
  'eat',
  'visit',
  'attend',
  'cook',
  'travel',
  'research',
  'reference',
  'save',
  'other',
]);

function cleanText(value, maxLength = 300) {
  return String(value ?? '').trim().slice(0, maxLength);
}

function cleanKeywords(value) {
  if (!Array.isArray(value)) return [];

  const unique = [];
  const seen = new Set();

  for (const raw of value) {
    const keyword = cleanText(raw, 80);
    const key = keyword.toLowerCase();
    if (!keyword || seen.has(key)) continue;
    seen.add(key);
    unique.push(keyword);
    if (unique.length >= 8) break;
  }

  return unique;
}

function defaultActionsForCategory(category) {
  switch (category) {
    case 'product':
      return ['find_product', 'find_similar', 'save_wishlist'];
    case 'food':
      return ['find_restaurant', 'save_food', 'open_map'];
    case 'place':
      return ['open_map', 'add_to_trip', 'save'];
    case 'event':
      return ['add_calendar', 'save'];
    case 'recipe':
      return ['extract_ingredients', 'save'];
    case 'travel':
      return ['add_to_trip', 'open_map', 'save'];
    case 'document':
    case 'conversation':
    case 'other':
    default:
      return ['save', 'search_web'];
  }
}

export async function PATCH(request, context) {
  const { id } = await context.params;
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== 'object') {
    return NextResponse.json({ error: 'Invalid update request.' }, { status: 400 });
  }

  const title = cleanText(body.title, 200);
  const description = cleanText(body.description, 2000);
  const category = cleanText(body.category, 40).toLowerCase();
  const intent = cleanText(body.intent, 40).toLowerCase();

  if (!title) {
    return NextResponse.json({ error: 'Title cannot be empty.' }, { status: 400 });
  }

  if (!CATEGORIES.has(category)) {
    return NextResponse.json({ error: 'Choose a valid category.' }, { status: 400 });
  }

  if (!INTENTS.has(intent)) {
    return NextResponse.json({ error: 'Choose a valid intent.' }, { status: 400 });
  }

  const { data: screenshot, error: fetchError } = await supabase
    .from('screenshots')
    .select('id, user_id, category, ai_data')
    .eq('id', id)
    .eq('user_id', user.id)
    .single();

  if (fetchError || !screenshot) {
    return NextResponse.json({ error: 'Screenshot not found' }, { status: 404 });
  }

  const existingAiData =
    screenshot.ai_data && typeof screenshot.ai_data === 'object'
      ? screenshot.ai_data
      : {};

  const categoryChanged = screenshot.category !== category;
  const nextAiData = {
    ...existingAiData,
    title,
    category,
    description,
    intent,
    brand: cleanText(body.brand),
    venue: cleanText(body.venue),
    location: cleanText(body.location),
    event_date: cleanText(body.event_date),
    visible_price: cleanText(body.visible_price),
    source: cleanText(body.source),
    product_type: cleanText(body.product_type),
    primary_color: cleanText(body.primary_color),
    secondary_color: cleanText(body.secondary_color),
    style: cleanText(body.style),
    keywords: cleanKeywords(body.keywords),
    suggested_actions: categoryChanged
      ? defaultActionsForCategory(category)
      : Array.isArray(existingAiData.suggested_actions)
        ? existingAiData.suggested_actions
        : defaultActionsForCategory(category),
    _meta: {
      ...(existingAiData._meta || {}),
      user_edited: true,
      user_edited_at: new Date().toISOString(),
    },
  };

  const { data: updated, error: updateError } = await supabase
    .from('screenshots')
    .update({
      title,
      category,
      description,
      intent,
      ai_data: nextAiData,
      analysis_error: null,
      status: 'ready',
    })
    .eq('id', id)
    .eq('user_id', user.id)
    .select('id, title, category, description, intent, confidence, ai_data, status')
    .single();

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, screenshot: updated });
}

export async function DELETE(_request, context) {
  const { id } = await context.params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: screenshot, error: fetchError } = await supabase
    .from('screenshots')
    .select('id, storage_path, user_id')
    .eq('id', id)
    .single();

  if (fetchError || !screenshot) {
    return NextResponse.json({ error: 'Screenshot not found' }, { status: 404 });
  }

  if (screenshot.user_id !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { error: storageError } = await supabase.storage
    .from('screenshots')
    .remove([screenshot.storage_path]);

  if (storageError) {
    return NextResponse.json({ error: storageError.message }, { status: 500 });
  }

  const { error: deleteError } = await supabase
    .from('screenshots')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id);

  if (deleteError) {
    return NextResponse.json({ error: deleteError.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
