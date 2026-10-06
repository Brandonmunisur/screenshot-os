export const COLLECTIONS = [
  { id: 'wishlist', label: 'Wishlist' },
  { id: 'food_to_try', label: 'Food to try' },
  { id: 'places_to_visit', label: 'Places to visit' },
  { id: 'events', label: 'Events' },
  { id: 'recipes', label: 'Recipes' },
  { id: 'trip_ideas', label: 'Trip ideas' },
  { id: 'saved', label: 'Saved' },
];

const COLLECTION_IDS = new Set(COLLECTIONS.map((item) => item.id));

export function isValidCollection(value) {
  return COLLECTION_IDS.has(String(value || ''));
}

export function collectionLabel(collection) {
  return COLLECTIONS.find((item) => item.id === collection)?.label || 'Saved';
}

export function getCollectionForAction(screenshot, action) {
  switch (action) {
    case 'save_wishlist':
      return 'wishlist';
    case 'save_food':
      return 'food_to_try';
    case 'add_to_trip':
      return 'trip_ideas';
    case 'save': {
      switch (screenshot?.category) {
        case 'place':
          return 'places_to_visit';
        case 'event':
          return 'events';
        case 'recipe':
          return 'recipes';
        case 'travel':
          return 'trip_ideas';
        case 'food':
          return 'food_to_try';
        case 'product':
          return 'wishlist';
        default:
          return 'saved';
      }
    }
    default:
      return '';
  }
}

export function savedActionLabel(collection, saved) {
  const labels = {
    wishlist: saved ? 'In Wishlist' : 'Save to Wishlist',
    food_to_try: saved ? 'Food Saved' : 'Save Food',
    places_to_visit: saved ? 'Place Saved' : 'Save Place',
    events: saved ? 'Event Saved' : 'Save Event',
    recipes: saved ? 'Recipe Saved' : 'Save Recipe',
    trip_ideas: saved ? 'In Trip Ideas' : 'Add to Trip',
    saved: saved ? 'Saved' : 'Save',
  };

  return labels[collection] || (saved ? 'Saved' : 'Save');
}
