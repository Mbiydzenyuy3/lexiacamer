import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ArrowLeft, Mail, ShieldCheck, RotateCw } from 'lucide-react';
import { useAuth } from './AuthProvider';

/**
 * SignIn: email plus a short numeric code, for grown-ups.
 *
 * No passwords. One less thing for a parent to lose, and no password database
 * to leak. The trade-off is that email is the single way in, so every failure
 * here needs a clear message and a way to retry rather than a dead end.
 *
 * Codes rather than links, deliberately. A parent reads their email on a phone;
 * a link opens inside the mail app's browser and lands the session somewhere
 * the app is not. A code can be read on one device and typed on another, which
 * is also how a teacher signs in on a shared classroom computer.
 */

/**
 * How many digits the code has. This MUST match Supabase's Email OTP Length
 * (Authentication -> Sign In / Providers -> Email). If the two disagree the row
 * fills, auto-submit fires with a truncated code, and every sign-in fails.
 *
 * The project is set to 8, so that is the default here. Override with
 * VITE_OTP_LENGTH if it ever changes.
 */
const LENGTH = Math.min(Math.max(Number(import.meta.env?.VITE_OTP_LENGTH) || 8, 4), 10);
const EMPTY = Array(LENGTH).fill('');
// "an 8-digit code", but "a 6-digit code".
const ARTICLE = LENGTH === 8 ? 'an' : 'a';

export default function SignIn({ t, onBack }) {
  const { signInWithOtp, verifyOtp } = useAuth();
  const [stage, setStage] = useState('email');   // 'email' | 'code'
  const [email, setEmail] = useState('');
  const [digits, setDigits] = useState(EMPTY);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  // Supabase enforces a minimum interval between codes to the same address.
  // Without a visible countdown a parent taps resend, nothing happens, and
  // they assume the app is broken.
  const RESEND_COOLDOWN = 60;
  const [cooldown, setCooldown] = useState(0);

  const boxes = useRef([]);
  // Remembers which code we already tried, so a failing code does not
  // resubmit itself in a loop while it is still on screen.
  const attempted = useRef('');

  const code = digits.join('');

  useEffect(() => {
    if (cooldown <= 0) return undefined;
    const timer = setInterval(() => setCooldown((n) => Math.max(0, n - 1)), 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const focusBox = (i) => boxes.current[i]?.focus();

  const sendCode = async (e) => {
    e?.preventDefault();
    setError('');
    setNotice('');
    setBusy(true);
    const { error: err } = await signInWithOtp(email);
    setBusy(false);
    if (err) {
      setError("We couldn't send that code. Check the address and try again.");
      return;
    }
    setDigits(EMPTY);
    attempted.current = '';
    setStage('code');
    setCooldown(RESEND_COOLDOWN);
    setNotice(`We sent ${ARTICLE} ${LENGTH}-digit code to ${email.trim()}.`);
    setTimeout(() => focusBox(0), 50);
  };

  const submitCode = useCallback(async (value) => {
    setError('');
    setBusy(true);
    const { error: err } = await verifyOtp(email, value);
    setBusy(false);
    if (err) {
      // Deliberately vague about which one failed. A wrong code, an expired
      // code and an already-used code should look identical to anyone guessing.
      setError('That code did not work. It may have expired, so send a new one.');
      setDigits(EMPTY);
      // Let them retype the same digits if they want to.
      attempted.current = '';
      setTimeout(() => focusBox(0), 50);
    }
    // On success the auth listener swaps this screen out for the dashboard.
  }, [email, verifyOtp]);

  // Verify as soon as the last digit lands. Nobody should have to hunt for a
  // button once they have typed the code they were sent.
  useEffect(() => {
    if (code.length === LENGTH && !busy && attempted.current !== code) {
      attempted.current = code;
      submitCode(code);
    }
  }, [code, busy, submitCode]);

  const setDigit = (i, value) => {
    const digit = value.replace(/\D/g, '').slice(-1);
    setDigits((prev) => {
      const next = [...prev];
      next[i] = digit;
      return next;
    });
    if (digit && i < LENGTH - 1) focusBox(i + 1);
  };

  const handleKeyDown = (i, e) => {
    if (e.key === 'Backspace') {
      if (digits[i]) {
        setDigits((prev) => { const n = [...prev]; n[i] = ''; return n; });
      } else if (i > 0) {
        e.preventDefault();
        setDigits((prev) => { const n = [...prev]; n[i - 1] = ''; return n; });
        focusBox(i - 1);
      }
    } else if (e.key === 'ArrowLeft' && i > 0) {
      e.preventDefault();
      focusBox(i - 1);
    } else if (e.key === 'ArrowRight' && i < LENGTH - 1) {
      e.preventDefault();
      focusBox(i + 1);
    }
  };

  // Most people paste the whole code rather than typing it.
  const handlePaste = (e) => {
    const pasted = (e.clipboardData?.getData('text') || '').replace(/\D/g, '');
    if (!pasted) return;
    e.preventDefault();
    const next = [...EMPTY];
    for (let i = 0; i < Math.min(pasted.length, LENGTH); i++) next[i] = pasted[i];
    setDigits(next);
    focusBox(Math.min(pasted.length, LENGTH - 1));
  };

  const startOver = () => {
    setStage('email');
    setDigits(EMPTY);
    attempted.current = '';
    setError('');
    setNotice('');
  };

  return (
    <div className="screen">
      <div className="screen-header" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <button className="btn btn-ghost p-2" onClick={onBack} aria-label="Go back">
          <ArrowLeft size={24} />
        </button>
        <h2 style={{ margin: 0 }}>{t?.parentAreaTitle || 'For Parents and Guardians'}</h2>
      </div>

      <div className="auth-card">
        <p className="auth-intro">
          <ShieldCheck size={18} style={{ flexShrink: 0, marginTop: 3 }} />
          <span>
            Sign in to see your child&apos;s progress. We send you a short code,
            so there is no password to remember.
          </span>
        </p>

        {stage === 'email' ? (
          <form onSubmit={sendCode}>
            <label className="auth-label" htmlFor="signin-email">
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
              className="auth-input"
              style={{ marginBottom: '1rem' }}
            />
            <button
              type="submit"
              className="btn btn-primary"
              disabled={busy || !email.trim()}
              style={{ width: '100%' }}
            >
              <Mail size={18} /> {busy ? 'Sending...' : 'Send my code'}
            </button>
          </form>
        ) : (
          <div>
            <fieldset style={{ border: 0, padding: 0, margin: 0 }}>
              <legend className="auth-label" style={{ padding: 0, marginBottom: '0.75rem' }}>
                Enter the {LENGTH}-digit code
              </legend>

              <div
                className={`otp-row${error ? ' is-error' : ''}`}
                onPaste={handlePaste}
              >
                {digits.map((digit, i) => (
                  <input
                    key={i}
                    ref={(el) => { boxes.current[i] = el; }}
                    type="text"
                    inputMode="numeric"
                    // Only the first box advertises one-time-code, or the
                    // browser tries to autofill all six with the same value.
                    autoComplete={i === 0 ? 'one-time-code' : 'off'}
                    maxLength={1}
                    value={digit}
                    disabled={busy}
                    aria-label={`Digit ${i + 1} of ${LENGTH}`}
                    onChange={(e) => setDigit(i, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(i, e)}
                    onFocus={(e) => e.target.select()}
                    className="otp-box"
                    placeholder=" "
                  />
                ))}
              </div>
            </fieldset>

            {/* No submit button: it verifies the moment the sixth digit lands. */}
            <p aria-live="polite" className="auth-status">
              {busy ? 'Checking your code...' : ''}
            </p>

            <div className="auth-resend">
              <p className="auth-resend-hint">
                Didn&apos;t get it? Check your spam folder.
              </p>
              <button
                type="button"
                className="btn-resend"
                onClick={sendCode}
                disabled={busy || cooldown > 0}
              >
                <RotateCw size={16} />
                {cooldown > 0 ? `Resend code in ${cooldown}s` : 'Resend code'}
              </button>
            </div>

            <button
              type="button"
              className="btn btn-ghost"
              style={{ width: '100%', marginTop: '0.75rem' }}
              disabled={busy}
              onClick={startOver}
            >
              Use a different email
            </button>
          </div>
        )}

        {notice && <p className="auth-status">{notice}</p>}
        {error && <p role="alert" className="auth-error">{error}</p>}

        <p className="auth-footnote">
          Your child does not need an account. They can keep playing without one,
          even with no internet.
        </p>
      </div>
    </div>
  );
}
