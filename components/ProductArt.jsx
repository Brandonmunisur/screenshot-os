const DEMO_IMAGES = {
  shoe: {
    src: 'https://images.unsplash.com/photo-1623684225794-a8f1f5037f5c?auto=format&fit=crop&w=1200&q=82',
    alt: 'Black and white Nike sneakers',
    label: 'NIKE DUNK LOW',
  },
  food: {
    src: 'https://images.unsplash.com/photo-1561758033-d89a9ad46330?auto=format&fit=crop&w=1200&q=82',
    alt: 'Burger served with fries',
    label: 'FOOD SAVE',
  },
  place: {
    src: 'https://images.unsplash.com/photo-1644070648746-85150d916ab7?auto=format&fit=crop&w=1200&q=82',
    alt: 'Restaurant interior in Cape Town',
    label: 'CAPE TOWN',
  },
  event: {
    src: 'https://images.unsplash.com/photo-1569498283086-7e7c11aa32d0?auto=format&fit=crop&w=1200&q=82',
    alt: 'Crowd watching a concert',
    label: 'EVENT SAVE',
  },
  recipe: {
    src: 'https://images.unsplash.com/photo-1662197480393-2a82030b7b83?auto=format&fit=crop&w=1200&q=82',
    alt: 'Creamy pasta dish',
    label: 'RECIPE',
  },
  travel: {
    src: 'https://images.unsplash.com/photo-1644102723416-e72dc2da0525?auto=format&fit=crop&w=1200&q=82',
    alt: 'Camps Bay beach in Cape Town',
    label: 'CAPE TOWN',
  },
  desk: {
    src: 'https://images.unsplash.com/photo-1762983870490-63e5ba07105b?auto=format&fit=crop&w=1200&q=82',
    alt: 'Modern home office desk setup',
    label: 'WORKSPACE',
  },
};

export default function ProductArt({ type }) {
  const image = DEMO_IMAGES[type] || DEMO_IMAGES.desk;

  return (
    <div className={`art art-photo-wrap art-${type}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className="art-photo" src={image.src} alt={image.alt} loading="lazy" />
      <div className="art-photo-shade" />
      <div className="art-photo-label">{image.label}</div>
    </div>
  );
}
