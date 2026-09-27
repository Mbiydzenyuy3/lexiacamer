import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MessageSquare, X, Check } from 'lucide-react';
import { getSupabase, warmSupabase, queueFeedback, unqueueFeedback } from './lib/supabase';

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
    warmSupabase();
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    panelRef.current?.focus();

    // aria-modal tells a screen reader the rest of the page is inert; it does
    // NOT stop Tab walking out of the panel into the page behind, including
    // the opener button that is deliberately kept mounted. Without this, a
    // keyboard user tabs out of a dialog they cannot see they have left.
    const FOCUSABLE = 'a[href],button:not([disabled]),textarea,input,select,[tabindex]:not([tabindex="-1"])';
    const onKey = (e) => {
      if (e.key === 'Escape') { close(); return; }
      if (e.key !== 'Tab') return;
      const items = panelRef.current?.querySelectorAll(FOCUSABLE);
      if (!items?.length) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    };
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

    // Written locally FIRST, and only cleared once the server confirms. The
    // previous version ignored res.error entirely, so an offline tester -- on
    // the app whose whole pitch is that it works offline -- saw "Thank you"
    // while their report went nowhere.
    const row = {
      id: (crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`),
      screen: screen || null,
      category: category || 'other',
      rating: rating || null,
      message: message.trim() || null,
      user_agent: navigator.userAgent.slice(0, 400),
    };
    queueFeedback(row);

    const insert = getSupabase()
      .then((sb) => (sb ? sb.from('feedback').insert(row) : null))
      .then((res) => {
        if (res && (!res.error || res.error.code === '23505')) unqueueFeedback(row.id);
      }, () => {});

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
