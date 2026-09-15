import React, { useState } from 'react';
import { ArrowRight, Check, FlaskConical, Volume2, MessageSquare } from 'lucide-react';
import { supabase, isBackendConfigured } from './lib/supabase';

/**
 * EarlyTester: the gate in front of the prototype.
 *
 * The point is not to collect data. It is to change what a bug MEANS. Someone
 * who arrives from a Facebook link expecting a finished product and hits
 * missing audio concludes the app does not work. Someone who was asked to help
 * test it reports the same thing as a finding. Same bug, opposite outcome.
 *
 * So this screen is honest about what is unfinished BEFORE anyone taps in,
 * naming the audio specifically rather than hiding behind "some features may
 * be incomplete".
 *
 * Deliberately three questions and a contact. Every extra field costs
 * volunteers, and nothing beyond this changes what gets built next.
 */

const ROLES = [
  { value: 'parent', label: 'Parent or guardian' },
  { value: 'teacher', label: 'Teacher' },
  { value: 'learner', label: 'Learner' },
  { value: 'other', label: 'Someone else' },
];

const GOALS = [
  'Letter sounds',
  'Reading words',
  'Spelling',
  'Confidence',
  'Not sure yet',
];

export default function EarlyTester({ onStart }) {
  const [step, setStep] = useState('intro');   // intro | form | welcome
  const [role, setRole] = useState('');
  const [name, setName] = useState('');
  const [contact, setContact] = useState('');
  const [goal, setGoal] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const contactLooksLikeEmail = contact.includes('@');

  const join = async (e) => {
    e?.preventDefault();
    setError('');
    setBusy(true);

    const record = {
      role,
      name: name.trim(),
      whatsapp: contactLooksLikeEmail ? null : contact.trim(),
      email: contactLooksLikeEmail ? contact.trim() : null,
      wants_help_with: goal || null,
    };

    let saved = false;
    try {
      if (isBackendConfigured && supabase) {
        const { error: err } = await supabase.from('testers').insert(record);
        saved = !err;
      }
    } catch { /* offline, or the table is not there yet */ }

    // A volunteer is NEVER blocked because our storage failed. This screen
    // exists to set expectations, not to collect data: losing a contact costs
    // less than losing the tester. The signup is kept locally and retried on
    // the next load, so it is usually not even lost.
    try {
      localStorage.setItem('lexia_tester', JSON.stringify({ role, at: Date.now() }));
      if (!saved) localStorage.setItem('lexia_tester_pending', JSON.stringify(record));
    } catch { /* private browsing; they simply see this screen again */ }

    setBusy(false);
    setStep('welcome');
  };

  if (step === 'intro') {
    return (
      <div className="et-screen">
        <div className="et-card">
          <span className="et-badge"><FlaskConical size={14} /> Early prototype</span>
          <h1 className="et-title">Be one of the first to test LexiaCamer</h1>
          <p className="et-lead">
            We are building a reading app for children in Cameroon. It teaches
            letter sounds and spelling, and it works without internet.
          </p>

          {/* Named plainly, before anyone taps in. A tester who was warned
              reports a finding; a visitor who was not concludes it is broken. */}
          <div className="et-known">
            <p className="et-known-title">
              <Volume2 size={16} /> What is not finished yet
            </p>
            <p>
              The <strong>letter sounds are not recorded yet</strong>, so the app
              reads them with your phone&apos;s built-in voice. On some phones
              that sounds wrong, or does not play at all. We know, and we are
              recording real voices next.
            </p>
            <p style={{ margin: 0 }}>
              Everything else is worth your opinion: the spelling game, the
              stickers, whether a child can find their way around.
            </p>
          </div>

          <button className="et-btn et-btn-primary" onClick={() => setStep('form')}>
            Become an early tester <ArrowRight size={18} />
          </button>
          <p className="et-foot">Free. No account needed. Takes a minute.</p>
        </div>
      </div>
    );
  }

  if (step === 'form') {
    return (
      <div className="et-screen">
        <form className="et-card" onSubmit={join}>
          <h2 className="et-title et-title-sm">Tell us who you are</h2>

          <fieldset className="et-field">
            <legend className="et-label">I am a...</legend>
            <div className="et-chips">
              {ROLES.map((r) => (
                <button key={r.value} type="button"
                        className={`et-chip${role === r.value ? ' is-on' : ''}`}
                        onClick={() => setRole(r.value)}>
                  {r.label}
                </button>
              ))}
            </div>
          </fieldset>

          <label className="et-label" htmlFor="et-name">Your name</label>
          <input id="et-name" className="et-input" value={name} required
                 onChange={(e) => setName(e.target.value)} maxLength={120} />

          <label className="et-label" htmlFor="et-contact">
            WhatsApp number or email
          </label>
          <input id="et-contact" className="et-input" value={contact} required
                 onChange={(e) => setContact(e.target.value)} maxLength={200}
                 placeholder="+237 6 00 00 00 00" />
          <p className="et-hint">
            So we can tell you when the next version is ready. Nothing else.
          </p>

          <fieldset className="et-field">
            <legend className="et-label">
              What would you most like it to help with?
            </legend>
            <div className="et-chips">
              {GOALS.map((g) => (
                <button key={g} type="button"
                        className={`et-chip${goal === g ? ' is-on' : ''}`}
                        onClick={() => setGoal(g)}>
                  {g}
                </button>
              ))}
            </div>
          </fieldset>

          <button className="et-btn et-btn-primary" type="submit"
                  disabled={busy || !role || !name.trim() || !contact.trim()}>
            {busy ? 'Joining...' : 'Join and start testing'} <ArrowRight size={18} />
          </button>
          {error && <p className="et-error" role="alert">{error}</p>}
        </form>
      </div>
    );
  }

  return (
    <div className="et-screen">
      <div className="et-card">
        <div className="et-tick"><Check size={30} /></div>
        <h2 className="et-title et-title-sm">You are in. Thank you.</h2>
        <p className="et-lead">
          Here is what would help us most.
        </p>
        <ol className="et-steps">
          <li>Open <strong>Word Forge</strong> and spell a few words.</li>
          <li>Try <strong>Phonics Lab</strong> and tap some letters.</li>
          <li>Spend a sticker in the <strong>Sticker Book</strong>.</li>
          <li>Notice anything confusing, and tell us.</li>
        </ol>
        <p className="et-known-title" style={{ marginTop: '1.25rem' }}>
          <MessageSquare size={16} /> The feedback button is on every screen
        </p>
        <p className="et-hint" style={{ marginTop: 0 }}>
          Use it the moment something is wrong. You do not need to remember it
          until later.
        </p>
        <button className="et-btn et-btn-primary" onClick={onStart}>
          Start testing <ArrowRight size={18} />
        </button>
      </div>
    </div>
  );
}
