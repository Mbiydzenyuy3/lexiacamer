import React, { useState } from 'react';
import { ArrowLeft, Mail, ShieldCheck } from 'lucide-react';
import { useAuth } from './AuthProvider';

/**
 * SignIn — email + 6-digit code, for grown-ups.
 *
 * No passwords: one less thing for a parent to lose, and no password database
 * to leak. The trade-off is that email delivery is the single path in, so
 * every failure here needs a clear message and a way to retry rather than a
 * dead end.
 */
export default function SignIn({ t, onBack }) {
  const { signInWithOtp, verifyOtp } = useAuth();
  const [stage, setStage] = useState('email');   // 'email' | 'code'
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const sendCode = async (e) => {
    e?.preventDefault();
    setError(''); setNotice(''); setBusy(true);
    const { error: err } = await signInWithOtp(email);
    setBusy(false);
    if (err) {
      setError(err.message || 'Could not send the code. Check the address and try again.');
      return;
    }
    setStage('code');
    setNotice(`Check ${email.trim()}.`);
  };

  const submitCode = async (e) => {
    e?.preventDefault();
    setError(''); setBusy(true);
    const { error: err } = await verifyOtp(email, code);
    setBusy(false);
    if (err) {
      // Deliberately vague about WHY: wrong, expired and already-used codes
      // should look the same to anyone guessing.
      setError('That code did not work. It may have expired — send a new one.');
      setCode('');
    }
    // On success the auth listener swaps this screen out; nothing to do here.
  };

  return (
    <div className="screen">
      <div className="screen-header" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <button className="btn btn-ghost p-2" onClick={onBack} aria-label="Go back">
          <ArrowLeft size={24} />
        </button>
        <h2 style={{ margin: 0 }}>{t?.parentAreaTitle || 'For grown-ups'}</h2>
      </div>

      <div style={{ maxWidth: '26rem', margin: '0 auto', padding: '1rem' }}>
        <p className="text-muted" style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
          <ShieldCheck size={18} style={{ flexShrink: 0, marginTop: 2 }} />
          <span>Sign in to see your child's progress. We'll email you a sign-in link — no password to remember.</span>
        </p>

        {stage === 'email' ? (
          <form onSubmit={sendCode}>
            <label htmlFor="signin-email" style={{ display: 'block', marginBottom: '0.25rem' }}>
              Your email
            </label>
            <input
              id="signin-email"
              type="email"
              inputMode="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              style={{ width: '100%', marginBottom: '0.75rem' }}
            />
            <button type="submit" className="btn btn-primary" disabled={busy || !email.trim()} style={{ width: '100%' }}>
              <Mail size={18} /> {busy ? 'Sending…' : 'Email me a sign-in link'}
            </button>
          </form>
        ) : (
          <form onSubmit={submitCode}>
            {/* Supabase sends a LINK by default and only sends a 6-digit code
                once custom SMTP is configured (template editing is locked
                behind it). Support both, so this works either way. */}
            <p style={{ marginBottom: '0.75rem' }}>
              Open the email and <strong>tap the link</strong> — that signs you
              in. If the email has a 6-digit code instead, type it here.
            </p>
            <label htmlFor="signin-code" style={{ display: 'block', marginBottom: '0.25rem' }}>
              6-digit code (if your email has one)
            </label>
            <input
              id="signin-code"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              pattern="[0-9]*"
              maxLength={6}
              required
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
              placeholder="123456"
              style={{ width: '100%', marginBottom: '0.75rem', letterSpacing: '0.3em' }}
            />
            <button type="submit" className="btn btn-primary" disabled={busy || code.length < 6} style={{ width: '100%' }}>
              {busy ? 'Checking…' : 'Sign in'}
            </button>
            <button
              type="button"
              className="btn btn-ghost"
              style={{ width: '100%', marginTop: '0.5rem' }}
              disabled={busy}
              onClick={sendCode}
            >
              Send it again
            </button>
            <button
              type="button"
              className="btn btn-ghost"
              style={{ width: '100%', marginTop: '0.5rem' }}
              onClick={() => { setStage('email'); setCode(''); setError(''); setNotice(''); }}
            >
              Use a different email
            </button>
          </form>
        )}

        {notice && <p className="text-muted" style={{ marginTop: '0.75rem' }}>{notice}</p>}
        {error && (
          <p role="alert" style={{ marginTop: '0.75rem', color: 'var(--red-600, #dc2626)' }}>
            {error}
          </p>
        )}

        <p className="text-muted" style={{ marginTop: '1.5rem', fontSize: '0.85rem' }}>
          Your child does not need an account. They can keep playing without one,
          even with no internet.
        </p>
      </div>
    </div>
  );
}
