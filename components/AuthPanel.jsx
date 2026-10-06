'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  ArrowRight,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  Sparkles,
  UserRound,
} from 'lucide-react';
import Logo from './Logo';
import { signIn, signInWithGoogle, signUp } from '@/app/auth/actions';

export default function AuthPanel({
  initialMode = 'signin',
  error,
  message,
}) {
  const [mode, setMode] = useState(
    initialMode === 'signup' ? 'signup' : 'signin'
  );

  const [showPassword, setShowPassword] = useState(false);

  // Keep fields empty when the page first loads
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const isSignup = mode === 'signup';

  const clearFields = () => {
    setName('');
    setEmail('');
    setPassword('');
    setShowPassword(false);
  };

  const copy = useMemo(
    () =>
      isSignup
        ? {
            eyebrow: 'CREATE YOUR LIBRARY',
            title: "Save the things you'll want later.",
            body: 'Create an account so every screenshot belongs to your private library.',
            button: 'Create account',
          }
        : {
            eyebrow: 'WELCOME BACK',
            title: 'Your screenshots are waiting.',
            body: 'Sign in to open your private ScreenshotOS library.',
            button: 'Sign in',
          },
    [isSignup]
  );

  return (
    <main className="auth-page">
      <section className="auth-story">
        <Link className="auth-home" href="/">
          <ArrowLeft size={16} /> Back home
        </Link>

        <Logo />

        <div className="auth-story-copy">
          <span className="eyebrow">
            <Sparkles size={13} /> PRIVATE VISUAL MEMORY
          </span>

          <h1>
            Capture now.
            <br />
            <span>Remember why.</span>
          </h1>

          <p>
            Your library stays attached to your account, ready for search,
            organisation and intelligent actions later.
          </p>
        </div>

        <div className="auth-proof-grid">
          <div>
            <strong>Private</strong>
            <span>user-owned storage</span>
          </div>

          <div>
            <strong>Fast</strong>
            <span>upload from any device</span>
          </div>

          <div>
            <strong>Ready</strong>
            <span>for the AI layer next</span>
          </div>
        </div>
      </section>

      <section className="auth-form-wrap">
        <div className="auth-form-card">
          <span className="section-number">{copy.eyebrow}</span>

          <h2>{copy.title}</h2>

          <p>{copy.body}</p>

          <div
            className="auth-switch"
            role="tablist"
            aria-label="Authentication mode"
          >
            <button
              className={!isSignup ? 'active' : ''}
              onClick={() => {
                setMode('signin');
                clearFields();
              }}
              type="button"
            >
              Sign in
            </button>

            <button
              className={isSignup ? 'active' : ''}
              onClick={() => {
                setMode('signup');
                clearFields();
              }}
              type="button"
            >
              Create account
            </button>
          </div>

          {error && (
            <div className="form-message error">{error}</div>
          )}

          {message && (
            <div className="form-message success">{message}</div>
          )}

          <form action={signInWithGoogle}>
            <button
              className="google-auth-button"
              type="submit"
            >
              <svg
                className="google-auth-icon"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  fill="#4285F4"
                  d="M21.6 12.23c0-.71-.06-1.4-.18-2.07H12v3.92h5.38a4.6 4.6 0 0 1-2 3.02v2.55h3.24c1.9-1.75 2.98-4.33 2.98-7.42Z"
                />

                <path
                  fill="#34A853"
                  d="M12 22c2.7 0 4.98-.9 6.63-2.43l-3.24-2.55c-.9.6-2.05.96-3.39.96-2.6 0-4.8-1.76-5.6-4.12H3.06v2.62A10 10 0 0 0 12 22Z"
                />

                <path
                  fill="#FBBC05"
                  d="M6.4 13.86A6 6 0 0 1 6.08 12c0-.65.11-1.28.32-1.86V7.52H3.06A10 10 0 0 0 2 12c0 1.61.39 3.13 1.06 4.48l3.34-2.62Z"
                />

                <path
                  fill="#EA4335"
                  d="M12 6.02c1.47 0 2.79.51 3.83 1.5l2.87-2.87A9.64 9.64 0 0 0 12 2a10 10 0 0 0-8.94 5.52l3.34 2.62c.8-2.36 3-4.12 5.6-4.12Z"
                />
              </svg>

              Continue with Google
            </button>
          </form>

          <div
            className="auth-divider"
            aria-hidden="true"
          >
            <span>or continue with email</span>
          </div>

          <form
            action={isSignup ? signUp : signIn}
            className="auth-form"
            autoComplete="off"
          >
            {isSignup && (
              <label>
                <span>Name</span>

                <div className="auth-field">
                  <UserRound size={17} />

                  <input
                    name="name"
                    autoComplete="off"
                    placeholder="Your name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
              </label>
            )}

            <label>
              <span>Email</span>

              <div className="auth-field">
                <Mail size={17} />

                <input
                  name="email"
                  type="email"
                  autoComplete="off"
                  required
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </label>

            <label>
              <span>Password</span>

              <div className="auth-field">
                <LockKeyhole size={17} />

                <input
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  minLength={isSignup ? 8 : undefined}
                  required
                  placeholder={
                    isSignup
                      ? 'At least 8 characters'
                      : 'Your password'
                  }
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />

                <button
                  type="button"
                  className="password-toggle"
                  aria-label="Toggle password visibility"
                  onClick={() =>
                    setShowPassword((value) => !value)
                  }
                >
                  {showPassword ? (
                    <EyeOff size={16} />
                  ) : (
                    <Eye size={16} />
                  )}
                </button>
              </div>
            </label>

            <button
              className="auth-submit"
              type="submit"
            >
              {copy.button}
              <ArrowRight size={17} />
            </button>
          </form>

          <p className="auth-fineprint">
            By continuing, you agree to keep your own account credentials
            secure. Screenshot privacy controls will expand as the product
            develops.
          </p>
        </div>
      </section>
    </main>
  );
}