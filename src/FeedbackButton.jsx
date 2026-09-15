import React, { useState } from 'react';
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

  const close = () => {
    setOpen(false);
    setTimeout(() => {
      setRating(''); setCategory(''); setMessage(''); setSent(false);
    }, 250);
  };

  const send = async (e) => {
    e?.preventDefault();
    if (!rating && !message.trim()) return;
    setBusy(true);
    try {
      if (isBackendConfigured && supabase) {
        await supabase.from('feedback').insert({
          screen: screen || null,
          category: category || 'other',
          rating: rating || null,
          message: message.trim() || null,
          user_agent: navigator.userAgent.slice(0, 400),
        });
      }
    } catch {
      // Never block a tester on our own storage failing. Losing one note is
      // better than making them think the app broke while reporting a bug.
    } finally {
      setBusy(false);
      setSent(true);
      setTimeout(close, 1800);
    }
  };

  if (!open) {
    return (
      <button className="fb-fab" onClick={() => setOpen(true)}
              aria-label="Give feedback">
        <MessageSquare size={20} />
        <span className="fb-fab-label">Feedback</span>
      </button>
    );
  }

  return (
    <div className="fb-sheet" role="dialog" aria-label="Give feedback">
      <div className="fb-panel">
        <button className="fb-close" onClick={close} aria-label="Close">
          <X size={20} />
        </button>

        {sent ? (
          <div className="fb-done">
            <div className="et-tick"><Check size={26} /></div>
            <p><strong>Thank you.</strong> That is exactly what helps.</p>
          </div>
        ) : (
          <form onSubmit={send}>
            <h3 className="fb-title">How is it going?</h3>

            <div className="fb-ratings">
              {RATINGS.map((r) => (
                <button key={r.value} type="button"
                        className={`fb-rating${rating === r.value ? ' is-on' : ''}`}
                        onClick={() => setRating(r.value)}>
                  <span className="fb-emoji">{r.emoji}</span>
                  <span>{r.label}</span>
                </button>
              ))}
            </div>

            <p className="et-label" style={{ marginTop: '1rem' }}>
              What is it about? <span className="et-optional">(optional)</span>
            </p>
            <div className="et-chips">
              {CATEGORIES.map((c) => (
                <button key={c.value} type="button"
                        className={`et-chip${category === c.value ? ' is-on' : ''}`}
                        onClick={() => setCategory(c.value)}>
                  {c.label}
                </button>
              ))}
            </div>

            <label className="et-label" htmlFor="fb-msg" style={{ marginTop: '1rem' }}>
              Tell us more <span className="et-optional">(optional)</span>
            </label>
            <textarea id="fb-msg" className="et-input fb-textarea" rows={3}
                      value={message} maxLength={2000}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="What were you doing when it happened?" />

            <button className="et-btn et-btn-primary" type="submit"
                    disabled={busy || (!rating && !message.trim())}>
              {busy ? 'Sending...' : 'Send feedback'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
