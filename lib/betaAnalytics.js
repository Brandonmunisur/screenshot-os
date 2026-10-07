import { createClient } from '@/lib/supabase/client';

function cleanMetadata(metadata) {
  if (!metadata || typeof metadata !== 'object') return {};

  const result = {};
  for (const [key, value] of Object.entries(metadata)) {
    if (value === undefined || value === null) continue;
    if (['string', 'number', 'boolean'].includes(typeof value)) {
      result[key] = value;
    }
  }
  return result;
}

export async function trackBetaEvent(userId, eventName, metadata = {}) {
  if (!userId || !eventName) return;

  try {
    const supabase = createClient();
    await supabase.from('beta_events').insert({
      user_id: userId,
      event_name: String(eventName).slice(0, 80),
      metadata: cleanMetadata(metadata),
    });
  } catch {
    // Analytics must never interrupt the product workflow.
  }
}
