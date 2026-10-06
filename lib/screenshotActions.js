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

  // Prefer Gemini's structured product attributes when there is enough
  // information to create a useful shopping query. Fall back to the title.
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

export function getScreenshotActionHref(screenshot, action) {
  switch (action) {
    case 'find_restaurant': {
      const baseQuery = placeQueryForScreenshot(screenshot);
      if (!baseQuery) return '';

      const query = uniqueParts([baseQuery, 'restaurant']).join(' ');
      return `https://www.google.com/search?q=${encodeURIComponent(query)}`;
    }

    case 'open_map': {
      const query = placeQueryForScreenshot(screenshot);
      if (!query) return '';

      return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
    }

    case 'find_product': {
      const query = productQueryForScreenshot(screenshot);
      if (!query) return '';

      // Google Shopping keeps this action useful without adding another API,
      // account, key, or backend dependency.
      return `https://www.google.com/search?tbm=shop&q=${encodeURIComponent(query)}`;
    }

    case 'find_similar': {
      const query = similarProductQueryForScreenshot(screenshot);
      if (!query) return '';

      // Image search is a useful first version of visual "find similar".
      // A future version can replace this with a dedicated visual-search API.
      return `https://www.google.com/search?tbm=isch&q=${encodeURIComponent(query)}`;
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
