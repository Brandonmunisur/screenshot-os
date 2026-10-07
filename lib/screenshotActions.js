function clean(value) {
  return String(value || '').trim();
}

function uniqueParts(parts) {
  const seen = new Set();

  return parts
    .map(clean)
    .filter(Boolean)
    .filter((part) => {
      const key = part.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
}

function placeQueryForScreenshot(screenshot) {
  const analysis = screenshot?.ai_data || {};
  const title = clean(screenshot?.title || screenshot?.original_name);
  const venue = clean(analysis.venue);
  const location = clean(analysis.location);

  return uniqueParts([venue || title, location]).join(' ');
}

function productQueryForScreenshot(screenshot) {
  const analysis = screenshot?.ai_data || {};
  const title = clean(screenshot?.title || screenshot?.original_name);

  const structuredParts = uniqueParts([
    analysis.brand,
    analysis.product_type,
    analysis.primary_color,
    analysis.secondary_color,
    analysis.style,
  ]);

  return structuredParts.length >= 2 ? structuredParts.join(' ') : title;
}

function similarProductQueryForScreenshot(screenshot) {
  const analysis = screenshot?.ai_data || {};
  const title = clean(screenshot?.title || screenshot?.original_name);

  const visualParts = uniqueParts([
    analysis.product_type,
    analysis.primary_color,
    analysis.secondary_color,
    analysis.style,
  ]);

  if (visualParts.length > 0) {
    return uniqueParts([...visualParts, 'similar']).join(' ');
  }

  return uniqueParts([title, 'similar']).join(' ');
}

function generalSearchQueryForScreenshot(screenshot) {
  const analysis = screenshot?.ai_data || {};
  const title = clean(screenshot?.title || screenshot?.original_name);

  return uniqueParts([
    title,
    analysis.brand,
    analysis.venue,
    analysis.location,
  ]).join(' ');
}

function pad(value) {
  return String(value).padStart(2, '0');
}

function nextDate(year, month, day) {
  const date = new Date(Date.UTC(year, month - 1, day + 1));
  return [
    date.getUTCFullYear(),
    pad(date.getUTCMonth() + 1),
    pad(date.getUTCDate()),
  ].join('');
}

function calendarDates(value) {
  const input = clean(value);
  if (!input) return '';

  const allDay = input.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (allDay) {
    const [, year, month, day] = allDay;
    return `${year}${month}${day}/${nextDate(Number(year), Number(month), Number(day))}`;
  }

  const timed = input.match(
    /^(\d{4})-(\d{2})-(\d{2})[T\s](\d{2}):(\d{2})(?::(\d{2}))?/
  );

  if (!timed) return '';

  const [, year, month, day, hour, minute, second = '00'] = timed;
  const start = `${year}${month}${day}T${hour}${minute}${second}`;

  const endDate = new Date(
    Date.UTC(
      Number(year),
      Number(month) - 1,
      Number(day),
      Number(hour) + 1,
      Number(minute),
      Number(second)
    )
  );

  const end =
    `${endDate.getUTCFullYear()}` +
    `${pad(endDate.getUTCMonth() + 1)}` +
    `${pad(endDate.getUTCDate())}T` +
    `${pad(endDate.getUTCHours())}` +
    `${pad(endDate.getUTCMinutes())}` +
    `${pad(endDate.getUTCSeconds())}`;

  return `${start}/${end}`;
}

function calendarHrefForScreenshot(screenshot) {
  const analysis = screenshot?.ai_data || {};
  const title = clean(screenshot?.title || screenshot?.original_name);
  if (!title) return '';

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: title,
  });

  const location = uniqueParts([analysis.venue, analysis.location]).join(', ');
  const details = clean(screenshot?.description);

  if (location) params.set('location', location);
  if (details) params.set('details', `${details}\n\nSaved from ScreenshotOS.`);

  const dates = calendarDates(analysis.event_date);
  if (dates) params.set('dates', dates);

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

function recipeSearchQueryForScreenshot(screenshot) {
  const title = clean(screenshot?.title || screenshot?.original_name);
  const analysis = screenshot?.ai_data || {};

  return uniqueParts([
    title,
    ...(Array.isArray(analysis.keywords) ? analysis.keywords.slice(0, 3) : []),
    'ingredients',
    'recipe',
  ]).join(' ');
}

const DEFAULT_ACTIONS = {
  product: ['find_product', 'find_similar', 'save_wishlist'],
  food: ['find_restaurant', 'open_map', 'save_food'],
  place: ['open_map', 'add_to_trip', 'save'],
  event: ['add_calendar', 'save'],
  recipe: ['extract_ingredients', 'save'],
  travel: ['open_map', 'add_to_trip', 'search_web'],
  document: ['search_web', 'save'],
  conversation: ['search_web', 'save'],
  other: ['search_web', 'save'],
};

export const ACTION_LABELS = {
  find_product: 'Find product',
  find_similar: 'Find similar',
  track_price: 'Track price',
  save_wishlist: 'Save to Wishlist',
  find_restaurant: 'Find restaurant',
  open_map: 'Open in Maps',
  save_food: 'Save food',
  add_calendar: 'Add to Calendar',
  extract_ingredients: 'Find ingredients',
  add_to_trip: 'Add to Trip Ideas',
  save: 'Save',
  search_web: 'Search web',
};

export function getSmartActionsForScreenshot(screenshot) {
  const category = screenshot?.category || 'other';
  const defaults = DEFAULT_ACTIONS[category] || DEFAULT_ACTIONS.other;
  const suggested = Array.isArray(screenshot?.ai_data?.suggested_actions)
    ? screenshot.ai_data.suggested_actions
    : [];

  const seen = new Set();
  return [...defaults, ...suggested].filter((action) => {
    if (!ACTION_LABELS[action] || seen.has(action)) return false;
    seen.add(action);
    return true;
  }).slice(0, 5);
}

export function getScreenshotActionLabel(action) {
  return ACTION_LABELS[action] || clean(action).replaceAll('_', ' ');
}

export function getScreenshotActionHref(screenshot, action) {
  switch (action) {
    case 'find_restaurant': {
      const baseQuery = placeQueryForScreenshot(screenshot);
      if (!baseQuery) return '';

      const query = uniqueParts([baseQuery, 'restaurant']).join(' ');
      return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
    }

    case 'open_map': {
      const query = placeQueryForScreenshot(screenshot);
      if (!query) return '';

      return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
    }

    case 'add_calendar':
      return calendarHrefForScreenshot(screenshot);

    case 'find_product': {
      const query = productQueryForScreenshot(screenshot);
      if (!query) return '';

      return `https://www.google.com/search?tbm=shop&q=${encodeURIComponent(query)}`;
    }

    case 'find_similar': {
      const query = similarProductQueryForScreenshot(screenshot);
      if (!query) return '';

      return `https://www.google.com/search?tbm=isch&q=${encodeURIComponent(query)}`;
    }

    case 'extract_ingredients': {
      const query = recipeSearchQueryForScreenshot(screenshot);
      if (!query) return '';

      return `https://www.google.com/search?q=${encodeURIComponent(query)}`;
    }

    case 'search_web': {
      const query = generalSearchQueryForScreenshot(screenshot);
      if (!query) return '';

      return `https://www.google.com/search?q=${encodeURIComponent(query)}`;
    }

    default:
      return '';
  }
}

export function isScreenshotActionLive(screenshot, action) {
  return Boolean(getScreenshotActionHref(screenshot, action));
}
