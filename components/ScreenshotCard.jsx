import { ChevronRight, Heart } from 'lucide-react';
import ProductArt from './ProductArt';

export default function ScreenshotCard({ item }) {
  return (
    <article className="shot-card">
      <ProductArt type={item.art} />
      <div className="shot-body">
        <div className="shot-topline">
          <span className={`category-dot ${item.accent}`} />
          <span>{item.meta}</span>
          <button className="icon-button" aria-label={`Save ${item.title}`}>
            <Heart size={16} />
          </button>
        </div>
        <h4>{item.title}</h4>
        <div className="shot-footer">
          <span>{item.note}</span>
          {item.price && <strong>{item.price}</strong>}
          <button className="mini-arrow" aria-label={`Open ${item.title}`}>
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </article>
  );
}
