'use server';

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

function loginUrl(params) {
  const search = new URLSearchParams(params);
  return `/login?${search.toString()}`;
}

function siteUrl() {
  const vercelUrl = process.env.VERCEL_URL;

  if (process.env.VERCEL_ENV === 'preview' && vercelUrl) {
    return `https://${vercelUrl}`;
  }

  return (
    process.env.NEXT_PUBLIC_SITE_URL ||
    (vercelUrl ? `https://${vercelUrl}` : 'http://localhost:3000')
  );
}


// ------------------------------------
// EMAIL / PASSWORD SIGN IN
// ------------------------------------

export async function signIn(formData) {
  const email = String(formData.get('email') || '').trim();
  const password = String(formData.get('password') || '');

  if (!email || !password) {
    redirect(
      loginUrl({
        error: 'Enter your email and password.',
      })
    );
  }

  const supabase = await createClient();

  // Clear any previous account session first.
  await supabase.auth.signOut();

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    redirect(
      loginUrl({
        error: error.message,
      })
    );
  }

  redirect('/dashboard');
}


// ------------------------------------
// CREATE ACCOUNT
// ------------------------------------

export async function signUp(formData) {
  const name = String(formData.get('name') || '').trim();
  const email = String(formData.get('email') || '').trim();
  const password = String(formData.get('password') || '');

  if (!email || password.length < 8) {
    redirect(
      loginUrl({
        mode: 'signup',
        error:
          'Use a valid email and a password of at least 8 characters.',
      })
    );
  }

  const supabase = await createClient();

  // Remove any currently logged-in account
  // before creating the new account.
  await supabase.auth.signOut();

  const currentSiteUrl = siteUrl();

  const { data, error } = await supabase.auth.signUp({
    email,
    password,

    options: {
      data: {
        display_name: name || email.split('@')[0],
      },

      emailRedirectTo: `${currentSiteUrl}/auth/confirm`,
    },
  });

  if (error) {
    redirect(
      loginUrl({
        mode: 'signup',
        error: error.message,
      })
    );
  }

  // Some Supabase configurations log the user in immediately.
  if (data.session) {
    redirect('/dashboard');
  }

  redirect(
    loginUrl({
      message:
        'Account created. Check your email to confirm your account, then sign in.',
    })
  );
}


// ------------------------------------
// GOOGLE SIGN IN
// ------------------------------------

export async function signInWithGoogle() {
  const supabase = await createClient();

  // Remove old ScreenshotOS session first.
  await supabase.auth.signOut();

  const currentSiteUrl = siteUrl();

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',

    options: {
      redirectTo: `${currentSiteUrl}/auth/confirm`,

      // Always show Google's account selector.
      queryParams: {
        prompt: 'select_account',
      },
    },
  });

  if (error) {
    redirect(
      loginUrl({
        error: error.message,
      })
    );
  }

  if (!data?.url) {
    redirect(
      loginUrl({
        error: 'Google sign-in could not be started.',
      })
    );
  }

  redirect(data.url);
}


// ------------------------------------
// SWITCH ACCOUNT
// ------------------------------------

export async function switchAccount() {
  const supabase = await createClient();

  await supabase.auth.signOut();

  redirect('/login');
}


// ------------------------------------
// LOG OUT
// ------------------------------------

export async function signOut() {
  const supabase = await createClient();

  await supabase.auth.signOut();

  redirect('/');
}