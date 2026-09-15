import React, { useState, useEffect } from 'react';
import { ArrowRight, Check, FlaskConical, Volume2, MessageSquare,
         ShieldCheck, ChevronLeft, Clock, Smartphone } from 'lucide-react';
import { getSupabase, warmSupabase } from './lib/supabase';

/**
 * EarlyTester: the gate between the landing page and the app.
 *
 * The point is not to collect data. It is to change what a bug MEANS. Someone
 * who arrives expecting a finished product and hits missing audio concludes the
 * app does not work. Someone who was asked to help test it reports the same
 * thing as a finding. Same bug, opposite outcome.
 *
 * So this screen is honest about what is unfinished BEFORE anyone taps in,
 * naming the audio specifically rather than hiding behind "some features may be
 * incomplete".
 *
 * Deliberately four questions. Every extra field costs volunteers, and nothing
 * beyond this changes what gets built next. The "Step N of 3" counter is doing
 * real work: a person who can see the end of a form finishes it.
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

const STEPS = { intro: 1, form: 2, welcome: 3 };

function Progress({ step }) {
  const n = STEPS[step];
  return (
    <div className="et-progress">
      <div className="et-dots" aria-hidden="true">
        {[1, 2, 3].map((i) => (
          <span key={i} className={`et-dot${i === n ? ' is-on' : ''}${i < n ? ' is-done' : ''}`} />
        ))}
      </div>
      <p className="et-stepcount">Step {n} of 3</p>
    </div>
  );
}

function Wordmark() {
  return (
    <div className="et-wordmark">
      <img src="/pwa-192x192.png" alt="" className="et-wordmark-img" />
      <span className="et-wordmark-text">exiaCamer</span>
    </div>
  );
}

export default function EarlyTester({ onStart, onBack }) {
  const [step, setStep] = useState('intro');   // intro | form | welcome
  const [role, setRole] = useState('');
  const [name, setName] = useState('');
  const [contact, setContact] = useState('');
  const [goal, setGoal] = useState('');
  const [busy, setBusy] = useState(false);

  const contactLooksLikeEmail = contact.includes('@');

  // Fetched in the background while they fill the form in, so pressing the
  // button does not also wait on a 35KB download over a weak connection.
  useEffect(() => { if (step === 'form') warmSupabase(); }, [step]);

  const join = async (e) => {
    e?.preventDefault();
    setBusy(true);

    const record = {
      role,
      name: name.trim(),
      whatsapp: contactLooksLikeEmail ? null : contact.trim(),
      email: contactLooksLikeEmail ? contact.trim() : null,
      wants_help_with: goal || null,
    };

    // A volunteer is NEVER blocked, by a failed save OR a slow one. This screen
    // exists to set expectations, not to collect data: losing a contact costs
    // less than losing the tester.
    //
    // So the record is written locally FIRST and treated as pending, and the
    // insert clears it if and when it lands. Measured at ~12s on this
    // connection; on mobile data in Yaounde it is worse, and nobody waits that
    // long on a spinner to volunteer. After 2.5s we let them in regardless and
    // the insert finishes in the background. If it never does, retryPendingTester
    // resends it on the next load, so the contact is usually not even lost.
    try {
      localStorage.setItem('lexia_tester', JSON.stringify({ role, at: Date.now() }));
      localStorage.setItem('lexia_tester_pending', JSON.stringify(record));
    } catch { /* private browsing; they simply see this screen again */ }

    const insert = getSupabase().then(
      (sb) => (sb ? sb.from('testers').insert(record) : null),
    ).then(
      (res) => {
        if (res && !res.error) {
          try { localStorage.removeItem('lexia_tester_pending'); } catch { /* ignore */ }
        }
      },
      () => { /* offline, or the table is not there yet */ },
    );

    const patience = new Promise((resolve) => setTimeout(resolve, 2500));
    await Promise.race([insert, patience]);

    setBusy(false);
    setStep('welcome');
  };

  if (step === 'intro') {
    return (
      <div className="et-screen">
        <Wordmark />
        <div className="et-card">
          <Progress step="intro" />
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

          <ul className="et-reassure">
            <li><ShieldCheck size={15} /> No account needed</li>
            <li><Smartphone size={15} /> Nothing to install</li>
            <li><Clock size={15} /> Takes a minute</li>
          </ul>

          <button className="et-btn et-btn-primary" onClick={() => setStep('form')}>
            Become an early tester <ArrowRight size={18} />
          </button>
          <p className="et-foot">Free. No account needed. Takes a minute.</p>
        </div>

        {onBack && (
          <button className="et-back" onClick={onBack}>
            <ChevronLeft size={16} /> Back to the home page
          </button>
        )}
      </div>
    );
  }

  if (step === 'form') {
    return (
      <div className="et-screen">
        <Wordmark />
        <form className="et-card" onSubmit={join}>
          <Progress step="form" />
          <h2 className="et-title et-title-sm">Tell us who you are</h2>
          <p className="et-lead et-lead-sm">Four questions. Then you are in.</p>

          <fieldset className="et-field">
            <legend className="et-label">I am a...</legend>
            <div className="et-chips">
              {ROLES.map((r) => (
                <button key={r.value} type="button"
                        className={`et-chip${role === r.value ? ' is-on' : ''}`}
                        aria-pressed={role === r.value}
                        onClick={() => setRole(r.value)}>
                  {r.label}
                </button>
              ))}
            </div>
          </fieldset>

          <label className="et-label" htmlFor="et-name">Your name</label>
          <input id="et-name" className="et-input" value={name} required
                 onChange={(e) => setName(e.target.value)} maxLength={120}
                 placeholder="Full name" />

          <label className="et-label" htmlFor="et-contact">
            WhatsApp number or email
          </label>
          <input id="et-contact" className="et-input et-input-tight" value={contact} required
                 onChange={(e) => setContact(e.target.value)} maxLength={200}
                 placeholder="+237 6 00 00 00 00" />

          {/* The scariest field on the page, so the answer sits directly under
              it rather than in a policy nobody opens. */}
          <div className="et-promise">
            <ShieldCheck size={17} />
            <p>
              We message you once, when the next version is ready. Nothing else.
              No account, no password, no payment, and we never share it.
            </p>
          </div>

          <fieldset className="et-field">
            <legend className="et-label">
              What would you most like it to help with?
            </legend>
            <div className="et-chips">
              {GOALS.map((g) => (
                <button key={g} type="button"
                        className={`et-chip${goal === g ? ' is-on' : ''}`}
                        aria-pressed={goal === g}
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
        </form>

        <button className="et-back" onClick={() => setStep('intro')}>
          <ChevronLeft size={16} /> Back
        </button>
      </div>
    );
  }

  return (
    <div className="et-screen">
      <Wordmark />
      <div className="et-card">
        <Progress step="welcome" />
        <div className="et-tick"><Check size={30} /></div>
        <h2 className="et-title et-title-sm et-center">You are in. Thank you.</h2>
        <p className="et-lead et-center">Here is what would help us most.</p>

        <ol className="et-tasks">
          <li>
            <span className="et-task-n">1</span>
            <div>
              <strong>Open Word Forge and spell a few words</strong>
              <p>It is the most finished part of the app.</p>
            </div>
          </li>
          <li>
            <span className="et-task-n">2</span>
            <div>
              <strong>Try Phonics Lab and tap some letters</strong>
              <p>This is where the missing audio will show.</p>
            </div>
          </li>
          <li>
            <span className="et-task-n">3</span>
            <div>
              <strong>Spend a sticker in the Sticker Book</strong>
              <p>See whether the reward feels worth it.</p>
            </div>
          </li>
          <li>
            <span className="et-task-n">4</span>
            <div>
              <strong>Notice anything confusing, and tell us</strong>
              <p>Especially anything a child could not work out alone.</p>
            </div>
          </li>
        </ol>

        <div className="et-fbnote">
          <p className="et-fbnote-title">
            <MessageSquare size={16} /> The feedback button is on every screen
          </p>
          <p>
            Use it the moment something is wrong. You do not need to remember it
            until later.
          </p>
          <p className="et-fbnote-demo">
            <span className="et-fbnote-label">What it looks like:</span>
            <span className="et-fbnote-pill"><MessageSquare size={13} /> Feedback</span>
          </p>
        </div>

        <button className="et-btn et-btn-primary" onClick={onStart}>
          Start testing <ArrowRight size={18} />
        </button>
      </div>
    </div>
  );
}
