import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request) {
  const { searchParams, origin } = new URL(request.url);
  const tokenHash = searchParams.get('token_hash');
  const type = searchParams.get('type');
  const code = searchParams.get('code');

  const supabase = await createClient();
  let error = null;

  if (tokenHash && type) {
    const result = await supabase.auth.verifyOtp({
      type,
      token_hash: tokenHash,
    });
    error = result.error;
  } else if (code) {
    const result = await supabase.auth.exchangeCodeForSession(code);
    error = result.error;
  } else {
    error = new Error('Missing confirmation token.');
  }

  if (error) {
    const url = new URL('/login', origin);
    url.searchParams.set('error', 'That confirmation link is invalid or has expired.');
    return NextResponse.redirect(url);
  }

  return NextResponse.redirect(new URL('/dashboard', origin));
}
