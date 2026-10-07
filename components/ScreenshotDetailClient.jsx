'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Bookmark,
  Check,
  ExternalLink,
  LoaderCircle,
  Pencil,
  RefreshCw,
  Save,
  Sparkles,
  Trash2,
  X,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import styles from './LibraryPatch.module.css';
import { getScreenshotActionHref, getScreenshotActionLabel, getSmartActionsForScreenshot } from '@/lib/screenshotActions';
import {
  collectionLabel,
  getCollectionForAction,
  savedActionLabel,
} from '@/lib/screenshotCollections';
import { formatScreenshotDateTime } from '@/lib/dateFormat';
import { trackBetaEvent } from '@/lib/betaAnalytics';

const CATEGORIES = [
  'product',
  'food',
  'place',
  'event',
  'recipe',
  'travel',
  'document',
  'conversation',
  'other',
];

const INTENTS = [
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
];

function pretty(value) {
  if (!value) return '—';
  return value.replaceAll('_', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function makeEditDraft(screenshot) {
  const analysis = screenshot.ai_data || {};

  return {
    title: screenshot.title || screenshot.original_name || '',
    description: screenshot.description || '',
    category: screenshot.category || 'other',
    intent: screenshot.intent || 'other',
    brand: analysis.brand || '',
    venue: analysis.venue || '',
    location: analysis.location || '',
    event_date: analysis.event_date || '',
    visible_price: analysis.visible_price || '',
    source: analysis.source || '',
    product_type: analysis.product_type || '',
    primary_color: analysis.primary_color || '',
    secondary_color: analysis.secondary_color || '',
    style: analysis.style || '',
    keywords: Array.isArray(analysis.keywords) ? analysis.keywords.join(', ') : '',
  };
}

export default function ScreenshotDetailClient({
  screenshot,
  initialSavedEntries = [],
  collectionsReady = true,
}) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [savedEntries, setSavedEntries] = useState(initialSavedEntries);
  const [savingCollection, setSavingCollection] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [savingEdits, setSavingEdits] = useState(false);
  const [editDraft, setEditDraft] = useState(() => makeEditDraft(screenshot));

  const savedCollections = useMemo(
    () => new Set(savedEntries.map((entry) => entry.collection)),
    [savedEntries]
  );

  async function removeScreenshot() {
    if (!window.confirm('Delete this screenshot permanently?')) return;

    setDeleting(true);
    setError('');
    setNotice('');

    try {
      const response = await fetch(`/api/screenshots/${screenshot.id}`, {
        method: 'DELETE',
      });

      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error || 'Delete failed');

      router.push('/dashboard');
      router.refresh();
    } catch (deleteError) {
      setError(deleteError.message || 'Delete failed.');
      setDeleting(false);
    }
  }

  async function analyseScreenshot() {
    setAnalyzing(true);
    setError('');
    setNotice('');

    try {
      const response = await fetch(`/api/screenshots/${screenshot.id}/analyze`, {
        method: 'POST',
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error || 'Analysis failed');

      setIsEditing(false);
      setNotice('Fresh AI analysis complete.');
      router.refresh();
    } catch (analysisError) {
      setError(analysisError.message || 'Analysis failed.');
    } finally {
      setAnalyzing(false);
    }
  }

  function beginEditing() {
    setEditDraft(makeEditDraft(screenshot));
    setError('');
    setNotice('');
    setIsEditing(true);
  }

  function cancelEditing() {
    setEditDraft(makeEditDraft(screenshot));
    setError('');
    setIsEditing(false);
  }

  function setEditField(field, value) {
    setEditDraft((current) => ({ ...current, [field]: value }));
  }

  async function saveEdits() {
    if (!editDraft.title.trim()) {
      setError('Title cannot be empty.');
      return;
    }

    setSavingEdits(true);
    setError('');
    setNotice('');

    try {
      const response = await fetch(`/api/screenshots/${screenshot.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...editDraft,
          keywords: editDraft.keywords
            .split(',')
            .map((item) => item.trim())
            .filter(Boolean),
        }),
      });

      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error || 'Could not save changes.');

      setIsEditing(false);
      setNotice('Changes saved. ScreenshotOS will use your corrected metadata.');
      router.refresh();
    } catch (saveError) {
      setError(saveError.message || 'Could not save changes.');
    } finally {
      setSavingEdits(false);
    }
  }

  async function toggleSavedCollection(collection) {
    if (!collectionsReady) {
      setError('Saved lists need the Supabase saved-collections migration before they can be used.');
      return;
    }

    setSavingCollection(collection);
    setError('');
    setNotice('');

    try {
      const response = await fetch('/api/saves', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ screenshotId: screenshot.id, collection }),
      });
      const payload = await response.json().catch(() => ({}));

      if (!response.ok) throw new Error(payload.error || 'Could not update saved list.');

      setSavedEntries((current) => {
        const withoutEntry = current.filter((entry) => entry.collection !== collection);

        if (!payload.saved) return withoutEntry;

        return [
          {
            screenshot_id: screenshot.id,
            collection,
            created_at: new Date().toISOString(),
          },
          ...withoutEntry,
        ];
      });
    } catch (saveError) {
      setError(saveError.message || 'Could not update saved list.');
    } finally {
      setSavingCollection('');
    }
  }

  const analysis = screenshot.ai_data || {};
  const displayTitle = screenshot.title || screenshot.original_name;
  const wasUserEdited = Boolean(analysis?._meta?.user_edited);

  return (
    <main className={styles.detailPage}>
      <div className={styles.detailShell}>
        <div className={styles.toolbar}>
          <Link href="/dashboard" className={styles.backLink}>
            <ArrowLeft size={17} /> Back to library
          </Link>
          <div className={styles.toolbarActions}>
            {screenshot.status === 'ready' && !isEditing && (
              <button
                type="button"
                className={styles.editButton}
                onClick={beginEditing}
                disabled={analyzing || deleting}
              >
                <Pencil size={16} /> Edit details
              </button>
            )}

            {isEditing && (
              <>
                <button
                  type="button"
                  className={styles.cancelEditButton}
                  onClick={cancelEditing}
                  disabled={savingEdits}
                >
                  <X size={16} /> Cancel
                </button>
                <button
                  type="button"
                  className={styles.saveEditButton}
                  onClick={saveEdits}
                  disabled={savingEdits}
                >
                  {savingEdits ? <LoaderCircle size={16} className="spin" /> : <Save size={16} />}
                  {savingEdits ? 'Saving…' : 'Save changes'}
                </button>
              </>
            )}

            {!isEditing && (
              <button className={styles.analyzeButton} onClick={analyseScreenshot} disabled={analyzing || deleting}>
                {analyzing ? <LoaderCircle size={16} className="spin" /> : screenshot.status === 'ready' ? <RefreshCw size={16} /> : <Sparkles size={16} />}
                {analyzing ? 'Analysing…' : screenshot.status === 'ready' ? 'Analyse again' : 'Analyse screenshot'}
              </button>
            )}

            {!isEditing && (
              <button className={styles.deleteButton} onClick={removeScreenshot} disabled={deleting || analyzing}>
                {deleting ? <LoaderCircle size={16} className="spin" /> : <Trash2 size={16} />}
                {deleting ? 'Deleting…' : 'Delete'}
              </button>
            )}
          </div>
        </div>

        <div className={styles.grid}>
          <section className={styles.imagePanel}>
            {screenshot.signed_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={screenshot.signed_url} alt={displayTitle} />
            ) : (
              <div className={styles.imageMissing}>Preview unavailable</div>
            )}
          </section>

          <aside className={styles.info}>
            <div className={styles.detailHeadingRow}>
              <span className="section-number">
                {isEditing ? 'EDIT DETAILS' : screenshot.status === 'ready' ? 'AI ANALYSIS' : 'SCREENSHOT'}
              </span>
              <span className={`${styles.detailStatus} ${styles[`status_${screenshot.status}`] || ''}`}>
                {pretty(screenshot.status)}
              </span>
            </div>

            {isEditing ? (
              <section className={styles.editPanel}>
                <div className={styles.editFieldFull}>
                  <label htmlFor="edit-title">Title</label>
                  <input
                    id="edit-title"
                    value={editDraft.title}
                    onChange={(event) => setEditField('title', event.target.value)}
                    maxLength={200}
                  />
                </div>

                <div className={styles.editFieldFull}>
                  <label htmlFor="edit-description">Description</label>
                  <textarea
                    id="edit-description"
                    rows={4}
                    value={editDraft.description}
                    onChange={(event) => setEditField('description', event.target.value)}
                    maxLength={2000}
                  />
                </div>

                <div className={styles.editGrid}>
                  <div className={styles.editField}>
                    <label htmlFor="edit-category">Category</label>
                    <select
                      id="edit-category"
                      value={editDraft.category}
                      onChange={(event) => setEditField('category', event.target.value)}
                    >
                      {CATEGORIES.map((category) => (
                        <option key={category} value={category}>{pretty(category)}</option>
                      ))}
                    </select>
                  </div>

                  <div className={styles.editField}>
                    <label htmlFor="edit-intent">Intent</label>
                    <select
                      id="edit-intent"
                      value={editDraft.intent}
                      onChange={(event) => setEditField('intent', event.target.value)}
                    >
                      {INTENTS.map((intent) => (
                        <option key={intent} value={intent}>{pretty(intent)}</option>
                      ))}
                    </select>
                  </div>

                  <div className={styles.editField}>
                    <label htmlFor="edit-brand">Brand</label>
                    <input id="edit-brand" value={editDraft.brand} onChange={(event) => setEditField('brand', event.target.value)} />
                  </div>

                  <div className={styles.editField}>
                    <label htmlFor="edit-venue">Venue</label>
                    <input id="edit-venue" value={editDraft.venue} onChange={(event) => setEditField('venue', event.target.value)} />
                  </div>

                  <div className={styles.editField}>
                    <label htmlFor="edit-location">Location</label>
                    <input id="edit-location" value={editDraft.location} onChange={(event) => setEditField('location', event.target.value)} />
                  </div>

                  <div className={styles.editField}>
                    <label htmlFor="edit-event-date">Event date</label>
                    <input id="edit-event-date" value={editDraft.event_date} onChange={(event) => setEditField('event_date', event.target.value)} />
                  </div>

                  <div className={styles.editField}>
                    <label htmlFor="edit-price">Visible price</label>
                    <input id="edit-price" value={editDraft.visible_price} onChange={(event) => setEditField('visible_price', event.target.value)} />
                  </div>

                  <div className={styles.editField}>
                    <label htmlFor="edit-source">Source</label>
                    <input id="edit-source" value={editDraft.source} onChange={(event) => setEditField('source', event.target.value)} />
                  </div>

                  <div className={styles.editField}>
                    <label htmlFor="edit-product-type">Product type</label>
                    <input id="edit-product-type" value={editDraft.product_type} onChange={(event) => setEditField('product_type', event.target.value)} />
                  </div>

                  <div className={styles.editField}>
                    <label htmlFor="edit-style">Style</label>
                    <input id="edit-style" value={editDraft.style} onChange={(event) => setEditField('style', event.target.value)} />
                  </div>

                  <div className={styles.editField}>
                    <label htmlFor="edit-primary-colour">Primary colour</label>
                    <input id="edit-primary-colour" value={editDraft.primary_color} onChange={(event) => setEditField('primary_color', event.target.value)} />
                  </div>

                  <div className={styles.editField}>
                    <label htmlFor="edit-secondary-colour">Secondary colour</label>
                    <input id="edit-secondary-colour" value={editDraft.secondary_color} onChange={(event) => setEditField('secondary_color', event.target.value)} />
                  </div>
                </div>

                <div className={styles.editFieldFull}>
                  <label htmlFor="edit-keywords">Keywords</label>
                  <input
                    id="edit-keywords"
                    value={editDraft.keywords}
                    onChange={(event) => setEditField('keywords', event.target.value)}
                    placeholder="Nike, sneaker, black, white"
                  />
                  <small>Separate keywords with commas. The first 8 will be saved.</small>
                </div>

                <div className={styles.editWarning}>
                  Manual corrections are saved to your screenshot. Running <strong>Analyse again</strong> later will replace them with a fresh Gemini analysis.
                </div>
              </section>
            ) : (
              <>
                <h1>{displayTitle}</h1>

                {wasUserEdited && (
                  <div className={styles.userEditedBadge}>
                    <Pencil size={12} /> User corrected
                  </div>
                )}

                {savedEntries.length > 0 && (
                  <div className={styles.savedCollectionChips} aria-label="Saved lists">
                    {savedEntries.map((entry) => (
                      <span key={entry.collection}><Check size={11} /> {collectionLabel(entry.collection)}</span>
                    ))}
                  </div>
                )}

                {!collectionsReady && (
                  <div className={styles.detailCollectionsNotice}>
                    <Bookmark size={14} /> Run <code>20261006_saved_collections.sql</code> to enable saved lists.
                  </div>
                )}

                {screenshot.status === 'ready' ? (
                  <>
                    <p>{screenshot.description || 'Analysis complete.'}</p>

                    <div className={styles.chipRowLarge}>
                      {screenshot.category && <span className={styles.chip}>{pretty(screenshot.category)}</span>}
                      {screenshot.intent && <span className={styles.chipMuted}>{pretty(screenshot.intent)}</span>}
                      {typeof screenshot.confidence === 'number' && (
                        <span className={styles.chipMuted}>{Math.round(screenshot.confidence * 100)}% confidence</span>
                      )}
                    </div>

                    <dl className={styles.metadata}>
                      {analysis.brand && <div><dt>Brand</dt><dd>{analysis.brand}</dd></div>}
                      {analysis.venue && <div><dt>Venue</dt><dd>{analysis.venue}</dd></div>}
                      {analysis.product_type && <div><dt>Product type</dt><dd>{analysis.product_type}</dd></div>}
                      {analysis.primary_color && <div><dt>Primary colour</dt><dd>{analysis.primary_color}</dd></div>}
                      {analysis.secondary_color && <div><dt>Secondary colour</dt><dd>{analysis.secondary_color}</dd></div>}
                      {analysis.style && <div><dt>Style</dt><dd>{analysis.style}</dd></div>}
                      {analysis.location && <div><dt>Location</dt><dd>{analysis.location}</dd></div>}
                      {analysis.event_date && <div><dt>Event date</dt><dd>{analysis.event_date}</dd></div>}
                      {analysis.visible_price && <div><dt>Visible price</dt><dd>{analysis.visible_price}</dd></div>}
                      {analysis.source && <div><dt>Source</dt><dd>{analysis.source}</dd></div>}
                    </dl>

                    {analysis.keywords?.length > 0 && (
                      <section className={styles.analysisSection}>
                        <h3>Keywords</h3>
                        <div className={styles.tagList}>
                          {analysis.keywords.map((keyword) => <span key={keyword}>{keyword}</span>)}
                        </div>
                      </section>
                    )}

                    {getSmartActionsForScreenshot(screenshot).length > 0 && (
                      <section className={styles.analysisSection}>
                        <h3>Suggested actions</h3>
                        <div className={styles.actionList}>
                          {getSmartActionsForScreenshot(screenshot).map((action) => {
                            const href = getScreenshotActionHref(screenshot, action);
                            const collection = getCollectionForAction(screenshot, action);
                            const isSaved = Boolean(collection && savedCollections.has(collection));
                            const isSaving = savingCollection === collection;

                            if (href) {
                              return (
                                <a
                                  key={action}
                                  href={href}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className={styles.detailActionLink}
                                  title={`${getScreenshotActionLabel(action)} — opens in a new tab`}
                                  onClick={() => void trackBetaEvent(screenshot.user_id, 'smart_action_used', {
                                    action,
                                    category: screenshot.category || 'other',
                                  })}
                                >
                                  <Sparkles size={13} />
                                  <span>{getScreenshotActionLabel(action)}</span>
                                  <ExternalLink size={12} />
                                </a>
                              );
                            }

                            if (collection) {
                              return (
                                <button
                                  type="button"
                                  key={action}
                                  className={`${styles.detailSaveButton} ${isSaved ? styles.detailActionSaved : ''}`}
                                  onClick={() => {
                                    void trackBetaEvent(screenshot.user_id, 'smart_action_used', {
                                      action,
                                      category: screenshot.category || 'other',
                                      collection,
                                    });
                                    toggleSavedCollection(collection);
                                  }}
                                  disabled={!collectionsReady || isSaving}
                                  title={isSaved ? `Remove from ${collectionLabel(collection)}` : `Save to ${collectionLabel(collection)}`}
                                >
                                  {isSaving ? <LoaderCircle size={13} className="spin" /> : isSaved ? <Check size={13} /> : <Bookmark size={13} />}
                                  <span>{savedActionLabel(collection, isSaved)}</span>
                                  <small>{isSaved ? 'Click to remove' : collectionLabel(collection)}</small>
                                </button>
                              );
                            }

                            return (
                              <span
                                key={action}
                                className={styles.detailActionDisabled}
                                title="Coming next"
                              >
                                <Sparkles size={13} />
                                <span>{pretty(action)}</span>
                                <small>Coming soon</small>
                              </span>
                            );
                          })}
                        </div>
                      </section>
                    )}

                    {analysis.uncertainties?.length > 0 && (
                      <section className={styles.analysisSection}>
                        <h3>Uncertain</h3>
                        <ul className={styles.uncertaintyList}>
                          {analysis.uncertainties.map((item) => <li key={item}>{item}</li>)}
                        </ul>
                      </section>
                    )}
                  </>
                ) : (
                  <p>
                    {screenshot.status === 'processing'
                      ? 'ScreenshotOS is analysing this image now.'
                      : screenshot.status === 'failed'
                        ? 'The image is saved safely, but the AI analysis did not complete. Use Analyse screenshot to retry.'
                        : 'The image is saved safely. Analyse it to create a title, category, intent and suggested actions.'}
                  </p>
                )}
              </>
            )}

            {screenshot.analysis_error && !isEditing && (
              <div className={styles.analysisError}>{screenshot.analysis_error}</div>
            )}

            {!isEditing && (
              <dl className={styles.metadata}>
                <div><dt>File</dt><dd>{screenshot.original_name}</dd></div>
                <div><dt>Type</dt><dd>{screenshot.mime_type}</dd></div>
                <div><dt>Size</dt><dd>{(screenshot.file_size / 1024 / 1024).toFixed(2)} MB</dd></div>
                <div><dt>Uploaded</dt><dd>{formatScreenshotDateTime(screenshot.created_at)}</dd></div>
                {screenshot.analyzed_at && <div><dt>Analysed</dt><dd>{formatScreenshotDateTime(screenshot.analyzed_at)}</dd></div>}
              </dl>
            )}

            {!isEditing && screenshot.signed_url && (
              <a href={screenshot.signed_url} target="_blank" rel="noreferrer" className={styles.openOriginal}>
                <ExternalLink size={16} /> Open original image
              </a>
            )}

            {notice && <div className={styles.editSuccess}>{notice}</div>}
            {error && <div className="form-message error">{error}</div>}
          </aside>
        </div>
      </div>
    </main>
  );
}
