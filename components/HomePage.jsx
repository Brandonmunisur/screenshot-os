'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  CalendarDays,
  Check,
  ChevronRight,
  ImagePlus,
  MapPin,
  Menu,
  Plane,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Star,
  Utensils,
  X,
  Zap,
} from 'lucide-react';
import DashboardDemo from './DashboardDemo';
import Logo from './Logo';
import ProductArt from './ProductArt';

export default function HomePage() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="site">
      <header className="site-nav">
        <a href="#top"><Logo /></a>
        <nav className="desktop-nav">
          <a href="#product">Product</a>
          <a href="#how">How it works</a>
          <a href="#privacy">Privacy</a>
          <a href="#pricing">Pricing</a>
        </nav>
        <div className="nav-actions">
          <Link className="text-button" href="/login">Sign in</Link>
          <Link className="pill-button small" href="/login?mode=signup">Create account <ArrowRight size={15} /></Link>
        </div>
        <button
          className="mobile-menu"
          onClick={() => setMobileOpen((open) => !open)}
          aria-label="Toggle navigation"
        >
          {mobileOpen ? <X /> : <Menu />}
        </button>
        {mobileOpen && (
          <div className="mobile-panel">
            <a href="#product" onClick={() => setMobileOpen(false)}>Product</a>
            <a href="#how" onClick={() => setMobileOpen(false)}>How it works</a>
            <a href="#privacy" onClick={() => setMobileOpen(false)}>Privacy</a>
            <a href="#pricing" onClick={() => setMobileOpen(false)}>Pricing</a>
          </div>
        )}
      </header>

      <main id="top">
        <section className="hero">
          <div className="hero-noise" />
          <div className="hero-copy">
            <div className="eyebrow"><span className="live-dot" /> YOUR SCREENSHOTS, NOW USEFUL</div>
            <h1>Save it now.<br /><span>Use it later.</span></h1>
            <p>
              ScreenshotOS turns the things you capture into organised, searchable actions — products to track,
              places to visit, events to remember and ideas worth keeping.
            </p>
            <div className="hero-actions">
              <Link className="pill-button" href="/login?mode=signup">Start your library <ArrowRight size={17} /></Link>
              <a className="ghost-button" href="#how">See how it works</a>
            </div>
            <div className="hero-trust">
              <div className="tiny-avatars"><span>B</span><span>K</span><span>M</span><span>+</span></div>
              <div>
                <div className="stars">
                  <Star size={12} fill="currentColor" /><Star size={12} fill="currentColor" />
                  <Star size={12} fill="currentColor" /><Star size={12} fill="currentColor" />
                  <Star size={12} fill="currentColor" />
                </div>
                <small>Built for screenshot hoarders</small>
              </div>
            </div>
          </div>

          <div className="hero-visual" aria-hidden="true">
            <div className="floating-card fc-one">
              <span className="fc-icon green"><ShoppingBag size={17} /></span>
              <div><small>PRODUCT FOUND</small><strong>Nike Dunk Low</strong><em>Price dropped 18%</em></div>
              <span className="fc-price">R3,499</span>
            </div>
            <div className="phone-stack">
              <div className="capture-card back-card"><ProductArt type="place" /></div>
              <div className="capture-card mid-card"><ProductArt type="recipe" /></div>
              <div className="capture-card front-card">
                <ProductArt type="shoe" />
                <div className="capture-info">
                  <span>AI understood this</span>
                  <strong>Nike Dunk Low</strong>
                  <div><Check size={14} /> Product · Purchase intent</div>
                </div>
              </div>
            </div>
            <div className="floating-card fc-two">
              <span className="fc-icon purple"><Sparkles size={17} /></span>
              <div><small>SMART ACTION</small><strong>Cape Town trip?</strong><em>7 related screenshots</em></div>
              <ChevronRight size={18} />
            </div>
          </div>
        </section>

        <section className="statement" id="product">
          <span className="section-number">01 / THE IDEA</span>
          <h2>Your camera roll remembers <em>what</em> you saved.<br />ScreenshotOS remembers <em>why.</em></h2>
          <div className="statement-grid">
            <p>
              Most screenshot apps stop at folders and search. ScreenshotOS turns visual clutter into a useful
              personal layer that understands intent and brings the next action forward.
            </p>
            <div className="stat-pair">
              <div><strong>9</strong><span>core screenshot types<br />in the AI schema</span></div>
              <div><strong>1</strong><span>searchable home<br />for every capture</span></div>
            </div>
          </div>
        </section>

        <section className="demo-section">
          <div className="section-heading">
            <div><span className="section-number">02 / WEB EXPERIENCE</span><h2>Designed for the big screen.<br />Ready for your phone.</h2></div>
            <p>A real web dashboard, not a mobile layout stretched to fit desktop. Search, filter, review and act on everything you’ve saved from one workspace.</p>
          </div>
          <DashboardDemo />
        </section>

        <section className="how-section" id="how">
          <div className="section-heading light-heading">
            <div><span className="section-number">03 / HOW IT WORKS</span><h2>One capture.<br />Three smart steps.</h2></div>
            <p>The interface stays simple because the intelligence happens behind the scenes.</p>
          </div>
          <div className="steps-grid">
            <article><span className="step-index">01</span><div className="step-icon"><ImagePlus /></div><h3>Drop it in</h3><p>Upload or share any screenshot from your phone, desktop, Instagram, TikTok or the web.</p></article>
            <article><span className="step-index">02</span><div className="step-icon"><Sparkles /></div><h3>We understand it</h3><p>AI recognises the content, useful details and the likely reason you saved it.</p></article>
            <article><span className="step-index">03</span><div className="step-icon"><Zap /></div><h3>Do something with it</h3><p>Track the product, save the place, remember the event or group it into a bigger idea.</p></article>
          </div>
        </section>

        <section className="intent-section">
          <div className="intent-title"><span className="section-number">04 / FROM CLUTTER TO INTENT</span><h2>The screenshot is only<br />the beginning.</h2></div>
          <div className="intent-list">
            <div><span className="intent-icon green"><ShoppingBag /></span><strong>Products</strong><p>Identify → compare → track</p><ArrowRight /></div>
            <div><span className="intent-icon coral"><Utensils /></span><strong>Food</strong><p>Recognise → save → find</p><ArrowRight /></div>
            <div><span className="intent-icon coral"><MapPin /></span><strong>Places</strong><p>Recognise → save → visit</p><ArrowRight /></div>
            <div><span className="intent-icon blue"><CalendarDays /></span><strong>Events</strong><p>Extract → remind → attend</p><ArrowRight /></div>
            <div><span className="intent-icon violet"><Plane /></span><strong>Travel</strong><p>Connect → group → plan</p><ArrowRight /></div>
          </div>
        </section>

        <section className="privacy-section" id="privacy">
          <div className="privacy-card">
            <span className="privacy-icon"><ShieldCheck /></span>
            <span className="section-number">05 / PRIVATE BY DESIGN</span>
            <h2>Your screenshots can be personal.<br />The product should respect that.</h2>
            <p>ScreenshotOS is designed around private libraries, clear deletion controls and minimal data collection. Your personal screenshot history should never become an advertising profile.</p>
            <div className="privacy-points"><span><Check /> Private library</span><span><Check /> Delete anytime</span><span><Check /> No ad profile</span></div>
          </div>
        </section>

        <section className="pricing-section" id="pricing">
          <div className="section-heading">
            <div><span className="section-number">06 / EARLY PRICING</span><h2>Free enough to become<br />part of your routine.</h2></div>
            <p>The MVP should earn trust before asking for money. Paid features only start once they provide ongoing value.</p>
          </div>
          <div className="pricing-grid">
            <article className="price-card"><span>FREE</span><h3>R0<small>/month</small></h3><p>For trying the habit.</p><ul><li><Check />100 screenshot saves</li><li><Check />AI categories</li><li><Check />Basic search</li><li><Check />Smart actions</li></ul><button>Start free</button></article>
            <article className="price-card featured"><div className="popular">MOST USEFUL</div><span>PRO</span><h3>R79<small>/month</small></h3><p>For people who save everything.</p><ul><li><Check />Everything in Free</li><li><Check />Unlimited library</li><li><Check />Advanced search</li><li><Check />Price & reminder alerts</li></ul><button>Join early access <ArrowRight size={16} /></button></article>
            <article className="price-card"><span>POWER</span><h3>R149<small>/month</small></h3><p>For deeper automation.</p><ul><li><Check />Everything in Pro</li><li><Check />Advanced AI actions</li><li><Check />Collections & trips</li><li><Check />Priority processing</li></ul><button>Coming later</button></article>
          </div>
        </section>

        <section className="final-cta">
          <div className="cta-orb" />
          <span className="eyebrow">STOP LOSING THE THINGS YOU SAVE</span>
          <h2>Your screenshots are trying<br />to tell you something.</h2>
          <p>Give them somewhere smarter to live.</p>
          <Link className="pill-button inverted" href="/login?mode=signup">Open ScreenshotOS <ArrowRight size={17} /></Link>
        </section>
      </main>

      <footer className="footer">
        <Logo />
        <p>ScreenshotOS — turning real captures into organised, searchable actions. Demo photography from <a href="https://unsplash.com" target="_blank" rel="noreferrer">Unsplash</a>.</p>
        <div className="footer-legal"><Link href="/privacy">Privacy</Link><Link href="/terms">Terms</Link></div>
        <span>© 2026 ScreenshotOS</span>
      </footer>
    </div>
  );
}
