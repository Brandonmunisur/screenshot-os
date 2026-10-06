import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { analyzeScreenshotWithGemini } from '@/lib/gemini/analyzeScreenshot';

export const runtime = 'nodejs';

export async function POST(_request, context) {
  const { id } = await context.params;
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: screenshot, error: fetchError } = await supabase
    .from('screenshots')
    .select('id, user_id, storage_path, original_name, mime_type, status')
    .eq('id', id)
    .eq('user_id', user.id)
    .single();

  if (fetchError || !screenshot) {
    return NextResponse.json({ error: 'Screenshot not found' }, { status: 404 });
  }

  if (!process.env.GEMINI_API_KEY) {
    return NextResponse.json(
      { error: 'GEMINI_API_KEY is not configured on the server.' },
      { status: 503 }
    );
  }

  const { error: processingError } = await supabase
    .from('screenshots')
    .update({
      status: 'processing',
      analysis_error: null,
    })
    .eq('id', screenshot.id)
    .eq('user_id', user.id);

  if (processingError) {
    return NextResponse.json({ error: processingError.message }, { status: 500 });
  }

  try {
    // Download the private screenshot server-side after ownership is verified.
    // This avoids exposing the Gemini API key or requiring a public image URL.
    const { data: imageBlob, error: downloadError } = await supabase.storage
      .from('screenshots')
      .download(screenshot.storage_path);

    if (downloadError || !imageBlob) {
      throw new Error(downloadError?.message || 'Could not download the screenshot for analysis.');
    }

    const imageBytes = Buffer.from(await imageBlob.arrayBuffer());

    const result = await analyzeScreenshotWithGemini({
      imageBytes,
      mimeType: screenshot.mime_type || imageBlob.type || 'image/jpeg',
      originalName: screenshot.original_name,
    });

    const analysis = result.analysis;
    const aiData = {
      ...analysis,
      _meta: {
        provider: 'google-gemini',
        model: result.model,
        response_id: result.responseId,
        usage: result.usage,
      },
    };

    const { error: updateError } = await supabase
      .from('screenshots')
      .update({
        title: analysis.title,
        category: analysis.category,
        description: analysis.description,
        intent: analysis.intent,
        confidence: analysis.confidence,
        ai_data: aiData,
        analysis_error: null,
        analyzed_at: new Date().toISOString(),
        status: 'ready',
      })
      .eq('id', screenshot.id)
      .eq('user_id', user.id);

    if (updateError) throw new Error(updateError.message);

    return NextResponse.json({ ok: true, analysis });
  } catch (error) {
    console.error('Screenshot Gemini analysis failed:', error);
    const message = error?.message || 'Screenshot analysis failed.';

    await supabase
      .from('screenshots')
      .update({
        status: 'failed',
        analysis_error: message.slice(0, 1000),
      })
      .eq('id', screenshot.id)
      .eq('user_id', user.id);

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
