# Components — LexiaCamer

**There is no `src/components/` directory and no component library.** Shared UI is expressed as **CSS classes in `src/index.css`** applied to plain elements, plus a handful of standalone `.jsx` files at the top of `src/`. Icons come from `lucide-react`. To reproduce this UI, use the class vocabulary below, not a component import.

## Shared class vocabulary (the real "primitives")

| Class | What it is |
|---|---|
| `.screen` | Page wrapper inside `<main>` |
| `.container` | Max-width content column with side padding |
| `.hero`, `.hero-title`, `.hero-subtitle` | Page heading block |
| `.stats-row`, `.stat-card`, `.stat-value`, `.stat-label` | The three-up number cards |
| `.menu-grid`, `.menu-card`, `.menu-icon`, `.menu-title`, `.menu-sub` | The 2x2 activity grid on Home |
| `.tip-card` | Amber "Tip of the Day" panel |
| `.top-bar`, `.top-bar-inner`, `.top-bar-logo`, `.top-bar-parents`, `.top-bar-avatar` | Fixed header |
| `.bottom-nav`, `.bottom-nav-item`, `.nav-icon-bg` | Fixed bottom navigation |
| `.offline-banner` | Full-width alert strip |
| `.et-*` | Early-tester / marketing surface (card, badge, title, lead, chips, input, button, hint) |
| `.fb-*` | Feedback FAB and modal |
| `.animate-fade-in`, `.animate-fade-in-delay`, `.animate-pop-in` | Entrance animations |

Full definitions for every one of these are in `theme.md` Part 2 (the whole `index.css`).

## `src/FeedbackButton.jsx`

Fixed FAB plus a real overlay modal (pinned header, scrolling body, pinned footer) for in-app feedback. Writes to the Supabase `feedback` table; never blocks the user on a failed or slow write.

```jsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MessageSquare, X, Check } from 'lucide-react';
import { supabase, isBackendConfigured } from './lib/supabase';

/**
 * FeedbackButton: reachable from every screen.
 *
 * A tester who has to leave the app, find the Facebook page and write a
 * comment will not bother. Most of what you would learn is lost in that gap,
 * and what survives arrives without the detail that makes it actionable.
 *
 * So: one tap, a feeling, an optional sentence. The screen they were on and
 * their device go along automatically, because "no sound" means something
 * different on a five-year-old Android than on a laptop, and a tester should
 * not have to know that.
 *
 * The dialog is a real modal: it owns the screen while open, the send button
 * is always reachable however long the content gets, Escape and the backdrop
 * close it, and the page behind does not scroll away underneath.
 */

const RATINGS = [
  { value: 'great',     emoji: '😊', label: 'Great' },
  { value: 'good',      emoji: '🙂', label: 'Good' },
  { value: 'confusing', emoji: '😐', label: 'Confusing' },
  { value: 'difficult', emoji: '😕', label: 'Too hard' },
];

const CATEGORIES = [
  { value: 'audio',      label: 'Sound problem' },
  { value: 'bug',        label: 'Something broke' },
  { value: 'confusing',  label: 'I got lost' },
  { value: 'content',    label: 'A word or letter' },
  { value: 'suggestion', label: 'An idea' },
];

export default function FeedbackButton({ screen }) {
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState('');
  const [category, setCategory] = useState('');
  const [message, setMessage] = useState('');
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const panelRef = useRef(null);
  const openerRef = useRef(null);

  const close = useCallback(() => {
    setOpen(false);
    // Return focus to the button that opened it, so a keyboard or screen
    // reader user is not dropped at the top of the page.
    openerRef.current?.focus();
    setTimeout(() => {
      setRating(''); setCategory(''); setMessage(''); setSent(false);
    }, 250);
  }, []);

  // While the dialog is open the page behind must not scroll: on a phone that
  // is what makes a sheet feel broken, the content sliding away underneath.
  useEffect(() => {
    if (!open) return undefined;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    panelRef.current?.focus();
    const onKey = (e) => { if (e.key === 'Escape') close(); };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener('keydown', onKey);
    };
  }, [open, close]);

  const send = async (e) => {
    e?.preventDefault();
    if (!rating && !message.trim()) return;
    setBusy(true);

    const insert = (isBackendConfigured && supabase)
      ? supabase.from('feedback').insert({
          screen: screen || null,
          category: category || 'other',
          rating: rating || null,
          message: message.trim() || null,
          user_agent: navigator.userAgent.slice(0, 400),
        }).then(() => {}, () => {})
      : Promise.resolve();

    // The round trip is ~2.5s on a good connection here; on a phone on mobile
    // data in Yaounde it is much worse. Nobody should watch "Sending..." for
    // that long to file a one-line bug report, so the thank-you appears after
    // 2.5s whatever the network is doing. The insert is not cancelled: it
    // finishes in the background, and if it fails we lose one note rather than
    // making someone think the app broke while they were reporting that it
    // broke.
    const patience = new Promise((resolve) => setTimeout(resolve, 2500));
    await Promise.race([insert, patience]);

    setBusy(false);
    setSent(true);
    setTimeout(close, 1800);
  };

  return (
    <>
      {/* Stays mounted while the dialog is open so focus has somewhere to
          return to, but gets out of the way visually. */}
      <button ref={openerRef} className={`fb-fab${open ? ' is-behind' : ''}`}
              onClick={() => setOpen(true)} aria-haspopup="dialog"
              aria-expanded={open} aria-label="Give feedback">
        <MessageSquare size={20} />
        <span className="fb-fab-label">Feedback</span>
      </button>

      {open && (
        <div className="fb-backdrop" onMouseDown={(e) => {
          // Only a click on the backdrop itself, not one that started inside
          // the panel and drifted out while selecting text.
          if (e.target === e.currentTarget) close();
        }}>
          <div className="fb-panel" role="dialog" aria-modal="true"
               aria-labelledby="fb-heading" tabIndex={-1} ref={panelRef}>

            <header className="fb-head">
              <h3 className="fb-title" id="fb-heading">
                {sent ? 'Thank you' : 'How is it going?'}
              </h3>
              <button className="fb-close" onClick={close} aria-label="Close">
                <X size={20} />
              </button>
            </header>

            {sent ? (
              <div className="fb-done">
                <div className="et-tick"><Check size={26} /></div>
                <p><strong>Thank you.</strong> That is exactly what helps.</p>
              </div>
            ) : (
              <form onSubmit={send} className="fb-form">
                {/* Scrolls on its own, so the send button below never moves
                    out of reach however much someone writes. */}
                <div className="fb-body">
                  <div className="fb-ratings">
                    {RATINGS.map((r) => (
                      <button key={r.value} type="button"
                              className={`fb-rating${rating === r.value ? ' is-on' : ''}`}
                              aria-pressed={rating === r.value}
                              onClick={() => setRating(r.value)}>
                        <span className="fb-emoji">{r.emoji}</span>
                        <span>{r.label}</span>
                      </button>
                    ))}
                  </div>

                  <p className="et-label fb-sublabel">
                    What is it about? <span className="et-optional">(optional)</span>
                  </p>
                  <div className="et-chips">
                    {CATEGORIES.map((c) => (
                      <button key={c.value} type="button"
                              className={`et-chip${category === c.value ? ' is-on' : ''}`}
                              aria-pressed={category === c.value}
                              onClick={() => setCategory(c.value)}>
                        {c.label}
                      </button>
                    ))}
                  </div>

                  <label className="et-label fb-sublabel" htmlFor="fb-msg">
                    Tell us more <span className="et-optional">(optional)</span>
                  </label>
                  <textarea id="fb-msg" className="et-input fb-textarea" rows={3}
                            value={message} maxLength={2000}
                            onChange={(e) => setMessage(e.target.value)}
                            placeholder="What were you doing when it happened?" />
                </div>

                <footer className="fb-foot">
                  <button className="et-btn et-btn-primary" type="submit"
                          disabled={busy || (!rating && !message.trim())}>
                    {busy ? 'Sending...' : 'Send feedback'}
                  </button>
                </footer>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
```

## `src/avatars.js`

Maps an avatar key to a lucide icon component.

```js
import { Cat, Dog, Bird, Snail } from 'lucide-react';

/**
 * Single source of truth for learner avatars.
 * Used by Onboarding (the picker) and App (the top-bar icon). Add or change
 * avatars here only — keeping one list prevents the two screens from drifting
 * out of sync (which is how an unknown avatar id could crash the header).
 */
export const AVATARS = [
  { id: 'lion',     icon: Cat,   color: '#f59e0b', bg: '#fffbeb', label: 'Lion' },
  { id: 'parrot',   icon: Bird,  color: '#0ea5e9', bg: '#f0f9ff', label: 'Parrot' },
  { id: 'tortoise', icon: Snail, color: '#059669', bg: '#ecfdf5', label: 'Tortoise' },
  { id: 'dog',      icon: Dog,   color: '#6366f1', bg: '#eef2ff', label: 'Dog' },
];

/**
 * Resolve an avatar id to its icon component. Falls back to `fallback` for an
 * unknown id (e.g. stale/hand-edited persisted state, or an avatar removed in a
 * later version) so the caller never renders `undefined`.
 */
export function getAvatarIcon(id, fallback) {
  return AVATARS.find((a) => a.id === id)?.icon || fallback;
}
```

## `src/ErrorBoundary.jsx`

```jsx
import React from 'react';

/**
 * Catches any runtime render error so a single bug can't white-screen the whole
 * app — important because LexiaCamer runs embedded inside a partner platform.
 * Shows a calm, child-friendly recovery screen with a reload button. Progress is
 * saved in localStorage, so reloading keeps the child's stars/streak/words.
 */
export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    // Keep a console trail for debugging; a real backend can log this later.
    console.error('LexiaCamer crashed:', error, info);
  }

  handleReload = () => {
    this.setState({ hasError: false });
    window.location.reload();
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div
        role="alert"
        style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          padding: '2rem',
          background: 'var(--bg-body, #f0fdf4)',
          color: 'var(--text-primary, #1a2e05)',
          fontFamily: 'inherit',
        }}
      >
        <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }} aria-hidden="true">🌱</div>
        <h1 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '0.5rem' }}>
          Oops! Let's try that again
        </h1>
        <p style={{ maxWidth: '22rem', lineHeight: 1.6, marginBottom: '1.5rem', opacity: 0.8 }}>
          Something went wrong, but your stars and progress are safe. Tap the button to start fresh.
        </p>
        <button
          type="button"
          onClick={this.handleReload}
          style={{
            padding: '0.9rem 1.75rem',
            fontSize: '1.05rem',
            fontWeight: 700,
            color: '#ffffff',
            background: 'var(--color-primary, #059669)',
            border: 'none',
            borderRadius: '9999px',
            cursor: 'pointer',
            boxShadow: '0 6px 16px rgba(5,150,105,0.3)',
          }}
        >
          Reload
        </button>
      </div>
    );
  }
}
```

## `src/Confetti.jsx`

```jsx
import React from 'react';

/**
 * Confetti celebration effect — lightweight, CSS-only particles.
 * No heavy libraries needed.
 */
const COLORS = ['#34d399', '#fbbf24', '#6366f1', '#fb7185', '#38bdf8', '#f59e0b'];

export default function Confetti({ active }) {
  if (!active) return null;

  const particles = Array.from({ length: 30 }, (_, i) => ({
    id: i,
    color: COLORS[i % COLORS.length],
    left: `${Math.random() * 100}%`,
    delay: `${Math.random() * 1.2}s`,
    size: `${6 + Math.random() * 8}px`,
    rotation: `${Math.random() * 360}deg`,
  }));

  return (
    <div className="celebration-container" aria-hidden="true">
      {particles.map((p) => (
        <div
          key={p.id}
          className="confetti"
          style={{
            left: p.left,
            width: p.size,
            height: p.size,
            backgroundColor: p.color,
            animationDelay: p.delay,
            transform: `rotate(${p.rotation})`,
          }}
        />
      ))}
    </div>
  );
}
```

## `src/lib/supabase.js`

Client + `isBackendConfigured` flag + `retryPendingTester()`. Landing-page forms should follow this pattern: attempt the write, never block the visitor on failure.

```js
import { createClient } from '@supabase/supabase-js';

/**
 * The Supabase client, or null when no backend is configured.
 *
 * The app has to run with NO backend at all: that is how it works today, and
 * it is what a child on a school tablet with no account still gets. So every
 * caller must handle `supabase === null`, and the offline path is the default
 * rather than a fallback bolted on later.
 *
 * Only the ANON key belongs here. It ships in the browser bundle and is public
 * by design; RLS is what protects the data. The service-role key must never
 * appear in this file or anywhere else in src/.
 */

const url = import.meta.env?.VITE_SUPABASE_URL;

// Supabase renamed the browser-safe key from "anon" to "publishable". Accept
// either, so copying straight from the dashboard works whichever name it shows.
const anonKey =
  import.meta.env?.VITE_SUPABASE_ANON_KEY ||
  import.meta.env?.VITE_SUPABASE_PUBLISHABLE_KEY;

export const isBackendConfigured = Boolean(url && anonKey);

export const supabase = isBackendConfigured
  ? createClient(url, anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null;

if (!isBackendConfigured && import.meta.env?.DEV) {
  // eslint-disable-next-line no-console
  console.info(
    '[lexia] No VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY: running fully offline.'
  );
}


/**
 * Re-send a signup that could not be stored when it was made.
 *
 * Called once on load. Quiet on purpose: a tester should never be told about
 * our retry, and a second failure simply leaves it for next time.
 */
export async function retryPendingTester() {
  if (!supabase) return;
  let record = null;
  try {
    const raw = localStorage.getItem('lexia_tester_pending');
    if (!raw) return;
    record = JSON.parse(raw);
  } catch { return; }
  try {
    const { error } = await supabase.from('testers').insert(record);
    if (!error) localStorage.removeItem('lexia_tester_pending');
  } catch { /* still unreachable; try again next load */ }
}
```
