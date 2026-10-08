'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Bookmark,
  CalendarPlus,
  Check,
  Clock3,
  Eye,
  Grid2X2,
  Heart,
  ImagePlus,
  LoaderCircle,
  LogOut,
  RefreshCw,
  MapPin,
  Search,
  Settings,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Trash2,
  Utensils,
} from 'lucide-react';
import Logo from './Logo';
import UploadDropzone from './UploadDropzone';
import { signOut, switchAccount } from '@/app/auth/actions';
import { getScreenshotActionHref, getScreenshotActionLabel, getSmartActionsForScreenshot } from '@/lib/screenshotActions';
import {
  COLLECTIONS,
  collectionLabel,
  getCollectionForAction,
  savedActionLabel,
} from '@/lib/screenshotCollections';
import styles from './LibraryPatch.module.css';
import { formatScreenshotDate } from '@/lib/dateFormat';
import { scoreScreenshotSearch } from '@/lib/smartSearch';
import { trackBetaEvent } from '@/lib/betaAnalytics';

const CATEGORY_ORDER = [
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

const QUICK_SEARCHES = [
  { id: 'recent', label: 'Recent' },
  { id: 'wishlist', label: 'Wishlist' },
  { id: 'food', label: 'Food' },
  { id: 'travel', label: 'Travel' },
  { id: 'places', label: 'Places' },
];

function initials(email, name) {
  const source = name || email || 'U';
  return source.slice(0, 1).toUpperCase();
}

function pretty(value) {
  if (!value) return '';
  return value.replaceAll('_', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function actionIcon(action, saved = false) {
  if (saved) return <Check size={12} />;

  switch (action) {
    case 'find_product':
    case 'find_similar':
      return <ShoppingBag size={12} />;
    case 'track_price':
      return <Sparkles size={12} />;
    case 'save_wishlist':
      return <Heart size={12} />;
    case 'find_restaurant':
    case 'extract_ingredients':
      return <Utensils size={12} />;
    case 'open_map':
    case 'add_to_trip':
      return <MapPin size={12} />;
    case 'add_calendar':
      return <CalendarPlus size={12} />;
    case 'save_food':
    case 'save':
      return <Bookmark size={12} />;
    case 'search_web':
      return <Search size={12} />;
    default:
      return <Sparkles size={12} />;
  }
}

function collectionIcon(collection) {
  switch (collection) {
    case 'wishlist':
      return <Heart size={15} />;
    case 'food_to_try':
      return <Utensils size={15} />;
    case 'places_to_visit':
    case 'trip_ideas':
      return <MapPin size={15} />;
    case 'events':
      return <CalendarPlus size={15} />;
    case 'recipes':
      return <Sparkles size={15} />;
    default:
      return <Bookmark size={15} />;
  }
}

function searchableText(item) {
  const analysis = item.ai_data || {};

  return [
    item.original_name,
    item.title,
    item.category,
    item.description,
    item.intent,
    analysis.brand,
    analysis.venue,
    analysis.location,
    analysis.product_type,
    analysis.primary_color,
    analysis.secondary_color,
    analysis.style,
    analysis.visible_price,
    analysis.source,
    ...(analysis.keywords || []),
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
}

function cardActionsFor(item) {
  const actions = getSmartActionsForScreenshot(item);

  const saveAction = actions.find((action) => getCollectionForAction(item, action));
  const liveActions = actions.filter(
    (action) => action !== saveAction && getScreenshotActionHref(item, action)
  );

  const firstTwo = liveActions.slice(0, 2);
  if (saveAction) return [...firstTwo, saveAction];

  return actions.slice(0, 3);
}

export default function DashboardClient({
  user,
  screenshots,
  initialSavedEntries = [],
  collectionsReady = true,
}) {
  const [query, setQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedCollection, setSelectedCollection] = useState('all');
  const [sortOrder, setSortOrder] = useState('newest');
  const [deletingId, setDeletingId] = useState(null);
  const [savedEntries, setSavedEntries] = useState(initialSavedEntries);
  const [savingKey, setSavingKey] = useState('');
  const [saveError, setSaveError] = useState('');
  const router = useRouter();

  const categoryCounts = useMemo(() => {
    const counts = { all: screenshots.length };

    screenshots.forEach((item) => {
      const category = item.category || 'other';
      counts[category] = (counts[category] || 0) + 1;
    });

    return counts;
  }, [screenshots]);

  const visibleCategories = useMemo(
    () => CATEGORY_ORDER.filter((category) => (categoryCounts[category] || 0) > 0),
    [categoryCounts]
  );

  const savedLookup = useMemo(() => {
    const lookup = new Set();
    savedEntries.forEach((entry) => lookup.add(`${entry.screenshot_id}:${entry.collection}`));
    return lookup;
  }, [savedEntries]);

  const savedIdsByCollection = useMemo(() => {
    const result = {};
    COLLECTIONS.forEach(({ id }) => {
      result[id] = new Set();
    });

    savedEntries.forEach((entry) => {
      if (!result[entry.collection]) result[entry.collection] = new Set();
      result[entry.collection].add(entry.screenshot_id);
    });

    return result;
  }, [savedEntries]);

  const collectionCounts = useMemo(() => {
    const counts = {};
    COLLECTIONS.forEach(({ id }) => {
      counts[id] = savedIdsByCollection[id]?.size || 0;
    });
    return counts;
  }, [savedIdsByCollection]);

  const collectionsByScreenshot = useMemo(() => {
    const result = new Map();

    savedEntries.forEach((entry) => {
      const current = result.get(entry.screenshot_id) || [];
      current.push(entry.collection);
      result.set(entry.screenshot_id, current);
    });

    return result;
  }, [savedEntries]);

  const filtered = useMemo(() => {
    const smartQuery = query.trim();

    const result = screenshots
      .map((item) => {
        const matchesCategory =
          selectedCategory === 'all' || (item.category || 'other') === selectedCategory;
        const matchesCollection =
          selectedCollection === 'all' || savedIdsByCollection[selectedCollection]?.has(item.id);

        if (!matchesCategory || !matchesCollection) return null;

        const score = smartQuery
          ? scoreScreenshotSearch(
              item,
              smartQuery,
              collectionsByScreenshot.get(item.id) || []
            )
          : 1;

        if (smartQuery && score <= 0) return null;

        return { item, score };
      })
      .filter(Boolean);

    return result
      .sort((a, b) => {
        if (smartQuery && sortOrder === 'relevance' && b.score !== a.score) {
          return b.score - a.score;
        }

        const aTime = new Date(a.item.created_at).getTime();
        const bTime = new Date(b.item.created_at).getTime();
        return sortOrder === 'oldest' ? aTime - bTime : bTime - aTime;
      })
      .map(({ item }) => item);
  }, [
    screenshots,
    query,
    selectedCategory,
    selectedCollection,
    savedIdsByCollection,
    collectionsByScreenshot,
    sortOrder,
  ]);

  function clearLibraryFilters() {
    setQuery('');
    setSelectedCategory('all');
    setSelectedCollection('all');
    setSortOrder('newest');
  }

  function handleSearchChange(value) {
    setQuery(value);

    if (value.trim()) {
      setSortOrder('relevance');
    } else {
      setSortOrder((current) => (current === 'relevance' ? 'newest' : current));
    }
  }

  function openCollection(collection) {
    setSelectedCollection(collection);
    setSelectedCategory('all');
    setQuery('');
    setSortOrder((current) => (current === 'relevance' ? 'newest' : current));
  }

  function applyQuickSearch(id) {
    setQuery('');
    setSortOrder('newest');

    if (id === 'wishlist') {
      setSelectedCollection('wishlist');
      setSelectedCategory('all');
      return;
    }

    setSelectedCollection('all');

    if (id === 'food') {
      setSelectedCategory('food');
    } else if (id === 'travel') {
      setSelectedCategory('travel');
    } else if (id === 'places') {
      setSelectedCategory('place');
    } else {
      setSelectedCategory('all');
    }
  }

  function isQuickSearchActive(id) {
    if (query.trim()) return false;

    if (id === 'wishlist') {
      return selectedCollection === 'wishlist' && selectedCategory === 'all';
    }

    if (selectedCollection !== 'all') return false;

    if (id === 'food') return selectedCategory === 'food';
    if (id === 'travel') return selectedCategory === 'travel';
    if (id === 'places') return selectedCategory === 'place';

    return selectedCategory === 'all' && sortOrder === 'newest';
  }

  async function toggleSavedCollection(item, collection) {
    if (!collectionsReady) {
      setSaveError('Saved lists need the Supabase saved-collections migration before they can be used.');
      return;
    }

    const key = `${item.id}:${collection}`;
    setSavingKey(key);
    setSaveError('');

    try {
      const response = await fetch('/api/saves', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ screenshotId: item.id, collection }),
      });
      const payload = await response.json().catch(() => ({}));

      if (!response.ok) throw new Error(payload.error || 'Could not update saved list.');

      setSavedEntries((current) => {
        const withoutEntry = current.filter(
          (entry) => !(entry.screenshot_id === item.id && entry.collection === collection)
        );

        if (!payload.saved) return withoutEntry;

        return [
          {
            screenshot_id: item.id,
            collection,
            created_at: new Date().toISOString(),
          },
          ...withoutEntry,
        ];
      });
    } catch (error) {
      setSaveError(error.message || 'Could not update saved list.');
    } finally {
      setSavingKey('');
    }
  }

  async function deleteScreenshot(item) {
    if (!window.confirm('Delete this screenshot permanently?')) return;

    setDeletingId(item.id);

    try {
      const response = await fetch(`/api/screenshots/${item.id}`, {
        method: 'DELETE',
      });
      const payload = await response.json().catch(() => ({}));

      if (!response.ok) throw new Error(payload.error || 'Delete failed');

      setSavedEntries((current) => current.filter((entry) => entry.screenshot_id !== item.id));
      router.refresh();
    } catch (error) {
      window.alert(error.message || 'Delete failed.');
    } finally {
      setDeletingId(null);
    }
  }

  const displayName =
    user.user_metadata?.display_name ||
    user.user_metadata?.full_name ||
    user.user_metadata?.name ||
    user.email?.split('@')[0] ||
    'there';

  const avatarUrl = user.user_metadata?.avatar_url || user.user_metadata?.picture || '';
  const autoAnalyze = user.user_metadata?.auto_analyze !== false;
  const libraryHeading =
    selectedCollection === 'all' ? 'Your screenshots' : collectionLabel(selectedCollection);

  return (
    <main className="real-dashboard">
      <aside className="real-sidebar">
        <Link href="/"><Logo /></Link>
        <UploadDropzone userId={user.id} compact autoAnalyze={autoAnalyze} />

        <nav className="side-nav real-side-nav">
          <button
            type="button"
            className={selectedCollection === 'all' ? 'active' : ''}
            onClick={() => openCollection('all')}
          >
            <Grid2X2 size={17} /> Library <span>{screenshots.length}</span>
          </button>
          <button disabled><Sparkles size={17} /> AI actions <small>next</small></button>
          <button disabled><Clock3 size={17} /> Reminders <small>soon</small></button>
          <Link href="/dashboard/settings" className={styles.settingsLink}><Settings size={17} /> Settings</Link>
        </nav>

        <div className={styles.savedListsSection}>
          <span className={styles.savedListsLabel}>SAVED LISTS</span>
          <nav className={`side-nav ${styles.savedListsNav}`}>
            {COLLECTIONS.map((collection) => (
              <button
                type="button"
                key={collection.id}
                className={selectedCollection === collection.id ? 'active' : ''}
                onClick={() => openCollection(collection.id)}
              >
                {collectionIcon(collection.id)}
                {collection.label}
                <span>{collectionCounts[collection.id] || 0}</span>
              </button>
            ))}
          </nav>
        </div>

        <div className="real-sidebar-security">
          <ShieldCheck size={17} />
          <div>
            <strong>Private library</strong>
            <span>Uploads and saved lists stay account-scoped. AI analysis runs through the server.</span>
          </div>
        </div>

        <form action={signOut} className="real-profile">
          {avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img className={`avatar ${styles.avatarImage}`} src={avatarUrl} alt="" referrerPolicy="no-referrer" />
          ) : (
            <span className="avatar">{initials(user.email, displayName)}</span>
          )}
          <div><strong>{displayName}</strong><small>{user.email}</small></div>
          <button title="Sign out" aria-label="Sign out"><LogOut size={17} /></button>
        </form>
      </aside>

      <section className="real-dashboard-main">
        <header className="real-dashboard-header">
          <div className="app-search dashboard-search">
            <Search size={18} />
            <input
              value={query}
              onChange={(event) => handleSearchChange(event.target.value)}
              placeholder='Search naturally: "black Nike shoes", "Cape Town travel"...'
              aria-label="Search screenshots"
            />
          </div>
          <div className="dashboard-user-pill"><span className="live-dot" /> Connected</div>

          <div className={styles.mobileAccountControls}>
            <form action={switchAccount}>
              <button
                type="submit"
                className={styles.mobileAccountButton}
                aria-label="Switch account"
                title="Switch account"
              >
                <RefreshCw size={17} />
                <span>Switch</span>
              </button>
            </form>

            <form action={signOut}>
              <button
                type="submit"
                className={styles.mobileAccountButton}
                aria-label="Log out"
                title="Log out"
              >
                <LogOut size={17} />
                <span>Log out</span>
              </button>
            </form>

            <Link
              href="/dashboard/settings"
              className={styles.mobileSettingsButton}
              aria-label="Open settings"
              title="Settings"
            >
              <Settings size={18} />
            </Link>
          </div>
        </header>

        <div className="real-dashboard-content">
          <section className="dashboard-intro">
            <span className="eyebrow dark">YOUR PRIVATE LIBRARY</span>
            <h1>Good to see you, {displayName}.</h1>
            <p>Upload a screenshot and ScreenshotOS will save it privately, then analyse what it contains and why it may matter.</p>
          </section>

          {screenshots.length > 0 && (
            <section className={styles.smartSearchTools} aria-label="Smarter search shortcuts">
              <div className={styles.smartSearchCopy}>
                <span className={styles.smartSearchIcon}><Sparkles size={14} /></span>
                <div>
                  <strong>Smarter Search</strong>
                  <span>Try “black Nike shoes”, “restaurants I saved”, “screenshots from October” or “food from Flame Café”.</span>
                </div>
                {query.trim() && (
                  <small>{filtered.length} {filtered.length === 1 ? 'match' : 'matches'}</small>
                )}
              </div>

              <div className={styles.quickSearchChips}>
                {QUICK_SEARCHES.map((item) => (
                  <button
                    type="button"
                    key={item.id}
                    className={`${styles.quickSearchChip} ${isQuickSearchActive(item.id) ? styles.quickSearchChipActive : ''}`}
                    onClick={() => applyQuickSearch(item.id)}
                    aria-pressed={isQuickSearchActive(item.id)}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </section>
          )}

          {!collectionsReady && (
            <div className={styles.collectionsNotice}>
              <Bookmark size={16} />
              <div>
                <strong>Saved lists need one database update.</strong>
                <span>Run <code>supabase/migrations/20261006_saved_collections.sql</code> in the Supabase SQL Editor.</span>
              </div>
            </div>
          )}

          {saveError && <div className={`form-message error ${styles.saveMessage}`}>{saveError}</div>}

          <UploadDropzone userId={user.id} autoAnalyze={autoAnalyze} />

          <section className="library-section">
            <div className="library-heading">
              <div>
                <span className="section-number">{selectedCollection === 'all' ? 'LIBRARY' : 'SAVED LIST'}</span>
                <h2>{libraryHeading}</h2>
              </div>
              <span>{filtered.length} {filtered.length === 1 ? 'item' : 'items'}</span>
            </div>

            {screenshots.length > 0 && (
              <div className={styles.mobileSavedFilters} aria-label="Saved lists">
                <button
                  type="button"
                  className={selectedCollection === 'all' ? styles.mobileSavedFilterActive : ''}
                  onClick={() => openCollection('all')}
                >
                  Library <span>{screenshots.length}</span>
                </button>
                {COLLECTIONS.map((collection) => (
                  <button
                    type="button"
                    key={collection.id}
                    className={selectedCollection === collection.id ? styles.mobileSavedFilterActive : ''}
                    onClick={() => openCollection(collection.id)}
                  >
                    {collection.label} <span>{collectionCounts[collection.id] || 0}</span>
                  </button>
                ))}
              </div>
            )}

            {screenshots.length > 0 && (
              <div className={styles.libraryControls}>
                <div className={styles.categoryFilters} aria-label="Filter screenshots by category">
                  <button
                    type="button"
                    className={`${styles.filterPill} ${selectedCategory === 'all' ? styles.filterPillActive : ''}`}
                    onClick={() => setSelectedCategory('all')}
                  >
                    All <span>{categoryCounts.all}</span>
                  </button>

                  {visibleCategories.map((category) => (
                    <button
                      type="button"
                      key={category}
                      className={`${styles.filterPill} ${selectedCategory === category ? styles.filterPillActive : ''}`}
                      onClick={() => setSelectedCategory(category)}
                    >
                      {pretty(category)} <span>{categoryCounts[category]}</span>
                    </button>
                  ))}
                </div>

                <label className={styles.sortControl}>
                  <span>Sort</span>
                  <select value={sortOrder} onChange={(event) => setSortOrder(event.target.value)}>
                    {query.trim() && <option value="relevance">Best match</option>}
                    <option value="newest">Newest</option>
                    <option value="oldest">Oldest</option>
                  </select>
                </label>
              </div>
            )}

            {filtered.length > 0 ? (
              <div className="real-screenshot-grid">
                {filtered.map((item) => {
                  const label = item.title || item.original_name;
                  const analysis = item.ai_data || {};
                  const actions = cardActionsFor(item);
                  const keywords = analysis.keywords || [];

                  return (
                    <article className="real-screenshot-card" key={item.id}>
                      <div className="real-screenshot-image-wrap">
                        <Link className={styles.cardLink} href={`/dashboard/screenshot/${item.id}`} aria-label={`Open ${label}`}>
                          {item.signed_url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={item.signed_url} alt={label} className="real-screenshot-image" />
                          ) : (
                            <div className="real-image-fallback"><ImagePlus /></div>
                          )}
                        </Link>

                        <div className={styles.actions}>
                          <Link className={styles.openButton} href={`/dashboard/screenshot/${item.id}`} title="Open screenshot">
                            <Eye size={15} />
                          </Link>
                          <button
                            className={`screenshot-delete ${styles.deleteOverride}`}
                            onClick={() => deleteScreenshot(item)}
                            disabled={deletingId === item.id}
                            title="Delete screenshot"
                          >
                            {deletingId === item.id ? <LoaderCircle size={15} className="spin" /> : <Trash2 size={15} />}
                          </button>
                        </div>

                        <div className={`${styles.statusBadge} ${styles[`status_${item.status}`] || ''}`}>
                          {item.status === 'processing' && <LoaderCircle size={11} className="spin" />}
                          {item.status === 'ready' && <Sparkles size={11} />}
                          {pretty(item.status)}
                        </div>
                      </div>

                      <div className="real-screenshot-meta">
                        <Link className={styles.metaLink} href={`/dashboard/screenshot/${item.id}`} title={label}>
                          <strong>{label}</strong>
                        </Link>

                        {item.status === 'ready' ? (
                          <>
                            <div className={styles.chipRow}>
                              {item.category && <span className={styles.chip}>{pretty(item.category)}</span>}
                              {item.intent && <span className={styles.chipMuted}>{pretty(item.intent)}</span>}
                              {typeof item.confidence === 'number' && (
                                <span className={styles.confidenceChip}>{Math.round(item.confidence * 100)}%</span>
                              )}
                            </div>

                            {item.description && <p className={styles.cardDescription}>{item.description}</p>}

                            {keywords.length > 0 && (
                              <div className={styles.keywordRow} aria-label="Screenshot keywords">
                                {keywords.slice(0, 5).map((keyword) => (
                                  <span key={keyword}>{keyword}</span>
                                ))}
                              </div>
                            )}

                            {actions.length > 0 && (
                              <div className={styles.cardActionRow} aria-label="Suggested actions">
                                {actions.map((action) => {
                                  const href = getScreenshotActionHref(item, action);
                                  const collection = getCollectionForAction(item, action);
                                  const isSaved = Boolean(
                                    collection && savedLookup.has(`${item.id}:${collection}`)
                                  );
                                  const isSaving = savingKey === `${item.id}:${collection}`;
                                  const labelText = collection
                                    ? savedActionLabel(collection, isSaved)
                                    : getScreenshotActionLabel(action);

                                  if (href) {
                                    return (
                                      <a
                                        key={action}
                                        href={href}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className={`${styles.cardActionPill} ${styles.cardActionLink}`}
                                        title={`${labelText} — opens in a new tab`}
                                        onClick={() => void trackBetaEvent(user.id, 'smart_action_used', {
                                          action,
                                          category: item.category || 'other',
                                        })}
                                      >
                                        {actionIcon(action)}
                                        {labelText}
                                      </a>
                                    );
                                  }

                                  if (collection) {
                                    return (
                                      <button
                                        type="button"
                                        key={action}
                                        className={`${styles.cardActionPill} ${styles.cardSaveButton} ${isSaved ? styles.cardActionSaved : ''}`}
                                        onClick={() => {
                                          void trackBetaEvent(user.id, 'smart_action_used', {
                                            action,
                                            category: item.category || 'other',
                                            collection,
                                          });
                                          toggleSavedCollection(item, collection);
                                        }}
                                        disabled={!collectionsReady || isSaving}
                                        title={isSaved ? `Remove from ${collectionLabel(collection)}` : `Save to ${collectionLabel(collection)}`}
                                      >
                                        {isSaving ? <LoaderCircle size={12} className="spin" /> : actionIcon(action, isSaved)}
                                        {labelText}
                                      </button>
                                    );
                                  }

                                  return (
                                    <span
                                      key={action}
                                      className={`${styles.cardActionPill} ${styles.cardActionDisabled}`}
                                      title="Coming next"
                                    >
                                      {actionIcon(action)}
                                      {getScreenshotActionLabel(action)}
                                    </span>
                                  );
                                })}
                              </div>
                            )}
                          </>
                        ) : item.status === 'failed' ? (
                          <p className={styles.cardError}>Analysis failed — open to retry.</p>
                        ) : (
                          <p className={styles.cardDescription}>Waiting for AI analysis…</p>
                        )}

                        <div className={styles.cardFooterMeta}>
                          <span>{formatScreenshotDate(item.created_at)}</span>
                          <small>{(item.file_size / 1024 / 1024).toFixed(2)} MB</small>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            ) : screenshots.length === 0 ? (
              <div className="real-empty-state">
                <span><ImagePlus /></span>
                <h3>Your library is empty.</h3>
                <p>Upload the first screenshot above. ScreenshotOS will save it and analyse it automatically.</p>
              </div>
            ) : (
              <div className="real-empty-state">
                <span>{selectedCollection === 'all' ? <Search /> : <Bookmark />}</span>
                <h3>{selectedCollection === 'all' ? 'No matching screenshots.' : `${libraryHeading} is empty.`}</h3>
                <p>
                  {selectedCollection === 'all'
                    ? 'Try another search or choose a different category.'
                    : 'Use a save action on a screenshot to add it to this list.'}
                </p>
                <button type="button" className={styles.clearFiltersButton} onClick={clearLibraryFilters}>
                  Back to library
                </button>
              </div>
            )}
          </section>
        </div>
      </section>
    </main>
  );
}
