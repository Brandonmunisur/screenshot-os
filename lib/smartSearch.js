const MONTHS = {
  january: 1,
  jan: 1,
  february: 2,
  feb: 2,
  march: 3,
  mar: 3,
  april: 4,
  apr: 4,
  may: 5,
  june: 6,
  jun: 6,
  july: 7,
  jul: 7,
  august: 8,
  aug: 8,
  september: 9,
  sep: 9,
  sept: 9,
  october: 10,
  oct: 10,
  november: 11,
  nov: 11,
  december: 12,
  dec: 12,
};

const STOP_WORDS = new Set([
  'a',
  'an',
  'and',
  'for',
  'from',
  'i',
  'in',
  'is',
  'me',
  'my',
  'of',
  'on',
  'or',
  'show',
  'that',
  'the',
  'these',
  'this',
  'to',
  'with',
  'screenshot',
  'screenshots',
]);

const CATEGORY_TERMS = {
  product: ['product', 'products', 'shopping', 'shoe', 'shoes', 'sneaker', 'sneakers', 'footwear'],
  food: ['food', 'meal', 'meals', 'dish', 'dishes', 'eat'],
  place: ['place', 'places', 'location', 'locations'],
  event: ['event', 'events', 'concert', 'concerts', 'gig', 'gigs'],
  recipe: ['recipe', 'recipes', 'cooking'],
  travel: ['travel', 'trip', 'trips', 'holiday', 'holidays', 'vacation', 'vacations'],
  document: ['document', 'documents', 'doc', 'docs'],
  conversation: ['conversation', 'conversations', 'chat', 'chats', 'message', 'messages'],
};

const MULTI_CATEGORY_TERMS = {
  restaurant: ['food', 'place'],
  restaurants: ['food', 'place'],
  cafe: ['food', 'place'],
  cafes: ['food', 'place'],
};

const COLLECTION_ALIASES = [
  { id: 'wishlist', terms: ['wishlist', 'wish list'] },
  { id: 'food_to_try', terms: ['food to try'] },
  { id: 'places_to_visit', terms: ['places to visit', 'place to visit'] },
  { id: 'trip_ideas', terms: ['trip ideas', 'trip idea'] },
  { id: 'events', terms: ['saved events'] },
  { id: 'recipes', terms: ['saved recipes'] },
];

const SEMANTIC_TERMS = new Set([
  ...Object.values(CATEGORY_TERMS).flat(),
  ...Object.keys(MULTI_CATEGORY_TERMS),
  'saved',
  'save',
  'bookmarked',
  'bookmark',
  'wishlist',
]);

function normalize(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function monthForDate(value) {
  if (!value) return null;

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;

  const parts = new Intl.DateTimeFormat('en-ZA', {
    timeZone: 'Africa/Johannesburg',
    month: 'numeric',
  }).formatToParts(date);

  const month = Number(parts.find((part) => part.type === 'month')?.value);
  return month || null;
}

function parseCollection(normalizedQuery) {
  for (const collection of COLLECTION_ALIASES) {
    if (collection.terms.some((term) => normalizedQuery.includes(normalize(term)))) {
      return collection.id;
    }
  }

  return '';
}

function parseMonth(words) {
  for (const word of words) {
    if (MONTHS[word]) return MONTHS[word];
  }

  return null;
}

function parseCategoryHints(words) {
  const hints = new Set();

  for (const word of words) {
    for (const [category, terms] of Object.entries(CATEGORY_TERMS)) {
      if (terms.includes(word)) hints.add(category);
    }

    for (const category of MULTI_CATEGORY_TERMS[word] || []) {
      hints.add(category);
    }
  }

  return hints;
}

function weightedFields(item) {
  const analysis = item.ai_data || {};

  return [
    [item.title, 14],
    [analysis.brand, 16],
    [analysis.venue, 16],
    [analysis.location, 14],
    [analysis.product_type, 13],
    [analysis.primary_color, 12],
    [analysis.secondary_color, 10],
    [analysis.style, 9],
    [item.category, 10],
    [item.intent, 8],
    [analysis.keywords?.join(' '), 10],
    [item.description, 7],
    [item.original_name, 5],
    [analysis.visible_price, 5],
    [analysis.source, 4],
  ].map(([value, weight]) => [normalize(value), weight]);
}

function tokenScore(token, fields) {
  let best = 0;

  for (const [field, weight] of fields) {
    if (!field) continue;

    if (field === token) {
      best = Math.max(best, weight + 4);
    } else if (field.split(' ').includes(token)) {
      best = Math.max(best, weight + 2);
    } else if (field.includes(token)) {
      best = Math.max(best, weight);
    }
  }

  return best;
}

export function scoreScreenshotSearch(item, rawQuery, itemCollections = []) {
  const normalizedQuery = normalize(rawQuery);
  if (!normalizedQuery) return 1;

  const words = normalizedQuery.split(' ').filter(Boolean);
  const collection = parseCollection(normalizedQuery);
  const wantsAnySaved =
    !collection && words.some((word) => ['saved', 'save', 'bookmarked', 'bookmark'].includes(word));
  const month = parseMonth(words);
  const categoryHints = parseCategoryHints(words);

  if (collection && !itemCollections.includes(collection)) return 0;
  if (wantsAnySaved && itemCollections.length === 0) return 0;
  if (month && monthForDate(item.created_at) !== month) return 0;

  if (categoryHints.size > 0 && !categoryHints.has(item.category || 'other')) {
    return 0;
  }

  const collectionWords = new Set(
    COLLECTION_ALIASES.flatMap((entry) => entry.terms.flatMap((term) => normalize(term).split(' ')))
  );

  const tokens = words.filter(
    (word) =>
      !STOP_WORDS.has(word) &&
      !SEMANTIC_TERMS.has(word) &&
      !collectionWords.has(word) &&
      !MONTHS[word]
  );

  const fields = weightedFields(item);
  let score = 1;

  if (collection) score += 30;
  if (wantsAnySaved) score += 20;
  if (month) score += 18;
  if (categoryHints.size > 0) score += 22;

  for (const token of tokens) {
    const matchScore = tokenScore(token, fields);
    if (!matchScore) return 0;
    score += matchScore;
  }

  if (tokens.length > 1) {
    const phrase = tokens.join(' ');
    const phraseFields = [
      normalize(item.title),
      normalize(item.description),
      normalize(item.ai_data?.venue),
      normalize(item.ai_data?.location),
      normalize(item.ai_data?.brand),
    ];

    if (phraseFields.some((field) => field.includes(phrase))) {
      score += 18;
    }
  }

  return score;
}
