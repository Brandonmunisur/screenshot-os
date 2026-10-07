'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  CheckCircle2,
  Database,
  LoaderCircle,
  LogOut,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Trash2,
  UserRound,
} from 'lucide-react';
import Logo from './Logo';
import { createClient } from '@/lib/supabase/client';
import styles from './AccountSettings.module.css';

function formatStorage(bytes) {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 MB';

  const mb = bytes / 1024 / 1024;
  if (mb < 1000) return `${mb.toFixed(mb < 10 ? 1 : 0)} MB`;

  return `${(mb / 1024).toFixed(2)} GB`;
}

function displayNameFor(user) {
  return (
    user.user_metadata?.display_name ||
    user.user_metadata?.full_name ||
    user.user_metadata?.name ||
    user.email?.split('@')[0] ||
    ''
  );
}

export default function AccountSettingsClient({ user, stats }) {
  const router = useRouter();
  const [displayName, setDisplayName] = useState(displayNameFor(user));
  const [autoAnalyze, setAutoAnalyze] = useState(
    user.user_metadata?.auto_analyze !== false
  );
  const [saving, setSaving] = useState(false);
  const [profileMessage, setProfileMessage] = useState('');
  const [profileError, setProfileError] = useState('');
  const [deletingLibrary, setDeletingLibrary] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [dangerError, setDangerError] = useState('');

  async function savePreferences() {
    const name = displayName.trim();

    if (!name) {
      setProfileError('Enter a display name.');
      return;
    }

    setSaving(true);
    setProfileError('');
    setProfileMessage('');

    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({
      data: {
        display_name: name,
        auto_analyze: autoAnalyze,
      },
    });

    if (error) {
      setProfileError(error.message || 'Could not save your settings.');
      setSaving(false);
      return;
    }

    setProfileMessage('Settings saved.');
    setSaving(false);
    router.refresh();
  }

  async function switchAccount() {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.assign('/login');
  }

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.assign('/');
  }

  async function deleteLibrary() {
    const confirmed = window.confirm(
      'Delete every screenshot and saved-list entry in this account? This cannot be undone.'
    );

    if (!confirmed) return;

    setDeletingLibrary(true);
    setDangerError('');

    try {
      const response = await fetch('/api/library', { method: 'DELETE' });
      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(payload.error || 'Could not delete the library.');
      }

      window.location.assign('/dashboard');
    } catch (error) {
      setDangerError(error.message || 'Could not delete the library.');
      setDeletingLibrary(false);
    }
  }

  async function deleteAccount() {
    const typed = window.prompt(
      'This permanently deletes your ScreenshotOS account and its library. Type DELETE ACCOUNT to continue.'
    );

    if (typed !== 'DELETE ACCOUNT') return;

    setDeletingAccount(true);
    setDangerError('');

    try {
      const supabase = createClient();
      const { data, error } = await supabase.functions.invoke('delete-account', {
        method: 'POST',
      });

      if (error) throw error;
      if (!data?.ok) throw new Error(data?.error || 'Account deletion failed.');

      await supabase.auth.signOut();
      window.location.assign('/');
    } catch (error) {
      setDangerError(error.message || 'Account deletion failed.');
      setDeletingAccount(false);
    }
  }

  return (
    <main className={styles.page}>
      <div className={styles.shell}>
        <header className={styles.header}>
          <Link href="/dashboard" className={styles.back}>
            <ArrowLeft size={16} /> Back to library
          </Link>
          <Logo />
        </header>

        <section className={styles.hero}>
          <span>ACCOUNT & SETTINGS</span>
          <h1>Keep ScreenshotOS yours.</h1>
          <p>
            Manage your profile, AI behaviour, library data and account access
            from one place.
          </p>
        </section>

        <div className={styles.grid}>
          <section className={styles.card}>
            <div className={styles.cardHeading}>
              <span className={styles.icon}><UserRound size={17} /></span>
              <div>
                <strong>Profile</strong>
                <p>Your account identity inside ScreenshotOS.</p>
              </div>
            </div>

            <label className={styles.field}>
              <span>Display name</span>
              <input
                value={displayName}
                onChange={(event) => setDisplayName(event.target.value)}
                maxLength={80}
              />
            </label>

            <label className={styles.field}>
              <span>Email</span>
              <input value={user.email || ''} disabled />
              <small>Email changes are managed through your sign-in provider.</small>
            </label>

            <div className={styles.actions}>
              <button
                type="button"
                className={styles.primaryButton}
                onClick={savePreferences}
                disabled={saving}
              >
                {saving ? <LoaderCircle size={15} className="spin" /> : <CheckCircle2 size={15} />}
                Save changes
              </button>
            </div>

            {profileMessage && <div className={styles.success}>{profileMessage}</div>}
            {profileError && <div className={styles.error}>{profileError}</div>}
          </section>

          <section className={styles.card}>
            <div className={styles.cardHeading}>
              <span className={styles.icon}><Sparkles size={17} /></span>
              <div>
                <strong>AI behaviour</strong>
                <p>Choose what happens after a new screenshot is uploaded.</p>
              </div>
            </div>

            <button
              type="button"
              className={styles.toggleRow}
              onClick={() => setAutoAnalyze((value) => !value)}
              aria-pressed={autoAnalyze}
            >
              <span>
                <strong>Analyse new uploads automatically</strong>
                <small>
                  {autoAnalyze
                    ? 'New screenshots are analysed with Gemini after upload.'
                    : 'New screenshots are saved first. You can analyse them manually later.'}
                </small>
              </span>
              <span className={`${styles.toggle} ${autoAnalyze ? styles.toggleOn : ''}`}>
                <span />
              </span>
            </button>

            <div className={styles.actions}>
              <button
                type="button"
                className={styles.secondaryButton}
                onClick={savePreferences}
                disabled={saving}
              >
                {saving ? <LoaderCircle size={15} className="spin" /> : <CheckCircle2 size={15} />}
                Save AI setting
              </button>
            </div>
          </section>

          <section className={styles.card}>
            <div className={styles.cardHeading}>
              <span className={styles.icon}><Database size={17} /></span>
              <div>
                <strong>Your library</strong>
                <p>A quick view of the data stored in this account.</p>
              </div>
            </div>

            <div className={styles.stats}>
              <div><strong>{stats.screenshotCount}</strong><span>Screenshots</span></div>
              <div><strong>{stats.analysedCount}</strong><span>Analysed</span></div>
              <div><strong>{stats.savedCount}</strong><span>Saved-list entries</span></div>
              <div><strong>{formatStorage(stats.totalBytes)}</strong><span>Image storage</span></div>
            </div>
          </section>

          <section className={styles.card}>
            <div className={styles.cardHeading}>
              <span className={styles.icon}><ShieldCheck size={17} /></span>
              <div>
                <strong>Account access</strong>
                <p>Move between accounts or end the current session.</p>
              </div>
            </div>

            <div className={styles.stackActions}>
              <button type="button" className={styles.secondaryButton} onClick={switchAccount}>
                <RefreshCw size={15} /> Switch account
              </button>
              <button type="button" className={styles.secondaryButton} onClick={signOut}>
                <LogOut size={15} /> Sign out
              </button>
            </div>
          </section>
        </div>

        <section className={styles.dangerCard}>
          <div className={styles.cardHeading}>
            <span className={styles.dangerIcon}><Trash2 size={17} /></span>
            <div>
              <strong>Danger zone</strong>
              <p>These actions are permanent. ScreenshotOS will ask you to confirm first.</p>
            </div>
          </div>

          <div className={styles.dangerRows}>
            <div>
              <span>
                <strong>Delete library</strong>
                <small>Remove every screenshot, image and saved-list entry while keeping your account.</small>
              </span>
              <button
                type="button"
                className={styles.dangerButton}
                onClick={deleteLibrary}
                disabled={deletingLibrary || deletingAccount}
              >
                {deletingLibrary ? <LoaderCircle size={15} className="spin" /> : <Trash2 size={15} />}
                Delete library
              </button>
            </div>

            <div>
              <span>
                <strong>Delete account</strong>
                <small>Permanently remove your account and all ScreenshotOS data.</small>
              </span>
              <button
                type="button"
                className={styles.dangerButton}
                onClick={deleteAccount}
                disabled={deletingLibrary || deletingAccount}
              >
                {deletingAccount ? <LoaderCircle size={15} className="spin" /> : <Trash2 size={15} />}
                Delete account
              </button>
            </div>
          </div>

          {dangerError && <div className={styles.error}>{dangerError}</div>}
        </section>
      </div>
    </main>
  );
}
