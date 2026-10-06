'use client';

import { useMemo, useState } from 'react';
import {
  ArrowRight,
  CircleUserRound,
  Clock3,
  Heart,
  ImagePlus,
  Search,
  ShieldCheck,
  Sparkles,
  Tag,
  Zap,
} from 'lucide-react';
import Logo from './Logo';
import ScreenshotCard from './ScreenshotCard';
import { categories, items } from '@/data/items';

export default function DashboardDemo() {
  const [category, setCategory] = useState('All');
  const [query, setQuery] = useState('');
  const [uploading, setUploading] = useState(false);

  const filtered = useMemo(() => {
    return items.filter((item) => {
      const inCategory = category === 'All' || item.category === category;
      const matches = `${item.title} ${item.meta} ${item.category}`
        .toLowerCase()
        .includes(query.toLowerCase());
      return inCategory && matches;
    });
  }, [category, query]);

  const simulateUpload = () => {
    setUploading(true);
    window.setTimeout(() => setUploading(false), 1300);
  };

  return (
    <div className="browser-shell" id="demo">
      <div className="browser-bar">
        <div className="browser-dots"><i /><i /><i /></div>
        <div className="browser-url"><ShieldCheck size={13} /> app.screenshot-os.com/library</div>
        <div className="browser-spacer" />
      </div>

      <div className="app-shell">
        <aside className="app-sidebar">
          <Logo />
          <button className="upload-button" onClick={simulateUpload}>
            {uploading ? <Sparkles size={17} className="spin" /> : <ImagePlus size={17} />}
            {uploading ? 'Analysing...' : 'Add screenshot'}
          </button>

          <nav className="side-nav">
            <button className="active"><Sparkles size={17} /> For you <span>12</span></button>
            <button><ImagePlus size={17} /> Library</button>
            <button><Heart size={17} /> Saved</button>
            <button><Clock3 size={17} /> Reminders <span>3</span></button>
          </nav>

          <div className="side-label">COLLECTIONS</div>
          <nav className="side-nav compact">
            <button><span className="nav-dot green" />Shopping</button>
            <button><span className="nav-dot coral" />Cape Town</button>
            <button><span className="nav-dot violet" />Ideas</button>
          </nav>

          <div className="sidebar-profile">
            <span className="avatar">B</span>
            <div><strong>Brandon</strong><small>Free plan</small></div>
            <CircleUserRound size={17} />
          </div>
        </aside>

        <main className="app-main">
          <header className="app-header">
            <div className="app-search">
              <Search size={18} />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search anything you saved..."
              />
              <kbd>⌘ K</kbd>
            </div>
            <button className="header-action"><Sparkles size={16} /> Ask your screenshots</button>
          </header>

          <div className="app-content">
            <div className="welcome-row">
              <div>
                <span className="eyebrow dark">YOUR VISUAL MEMORY</span>
                <h3>Good evening, Brandon.</h3>
                <p>Your screenshots found <strong>4 things worth acting on.</strong></p>
              </div>
              <div className="mini-stat"><span>42</span><small>saves this month</small></div>
            </div>

            <div className="action-strip">
              <div className="action-strip-icon"><Zap size={19} /></div>
              <div>
                <strong>Nike Dunk Low saved for later</strong>
                <span>ScreenshotOS recognised the product and kept the purchase intent attached.</span>
              </div>
              <button>View deal <ArrowRight size={15} /></button>
            </div>

            <div className="filter-row">
              <div className="filter-tabs">
                {categories.map((name) => (
                  <button
                    key={name}
                    onClick={() => setCategory(name)}
                    className={category === name ? 'selected' : ''}
                  >
                    {name}
                  </button>
                ))}
              </div>
              <button className="sort-button"><Tag size={15} /> Smart sort</button>
            </div>

            <div className="cards-grid">
              {filtered.map((item) => <ScreenshotCard key={item.id} item={item} />)}
              {filtered.length === 0 && <div className="empty-state">Nothing matches that search yet.</div>}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
