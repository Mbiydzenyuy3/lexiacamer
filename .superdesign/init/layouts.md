# Layouts — LexiaCamer

There is **no router and no layout component tree**. `src/App.jsx` is the entire app shell: it holds the top bar, the feedback FAB, the offline/audio banners, a `<main>` that swaps on a `screen` string, and the fixed bottom nav. Everything below is that one file.

## App shell — `src/App.jsx`

Renders, in order:
1. `header.top-bar` (hidden during onboarding) — logo button, centre "Dashboard" button, right avatar button
2. `<FeedbackButton screen={screen} />` — fixed FAB + modal, present on every screen
3. `.offline-banner` when `navigator.onLine` is false
4. `.offline-banner` again for the "no speech synthesis on this device" notice (dismissible)
5. `<main key={screen}>` — the swapped screen
6. `nav.bottom-nav` (hidden during onboarding) — Home / Sounds / Spelling

Before any of that, an **early-tester gate**: if `localStorage.lexia_tester` is unset, `<EarlyTester>` owns the whole viewport and no app chrome renders at all.

```jsx

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Home, Type, Hammer, BookOpen, WifiOff, ShieldCheck, VolumeX, X } from 'lucide-react';
import { getAvatarIcon } from './avatars';
import speechEngine from './speech';
import { loadState, saveState, resetProgress } from './store';
import i18n from './i18n';
import HomeScreen from './HomeScreen';
import PhonicsLab from './PhonicsLab';
import WordForge from './WordForge';
import Settings from './Settings';
import ParentDashboard from './ParentDashboard';
import StickerBook from './StickerBook';
import Onboarding from './Onboarding';
import EarlyTester from './EarlyTester';
import FeedbackButton from './FeedbackButton';
import { retryPendingTester } from './lib/supabase';

/**
 * App — Root Shell
 * Handles: routing, language toggle, offline detection, global stats.
 * All persistence lives in ./store so a backend can drop in without a rewrite.
 */

export default function App() {
  // Read persisted state once on mount (not once per field).
  const initial = useMemo(() => loadState(), []);

  // The prototype sits behind an early-tester gate. Someone arriving from a
  // link expecting a finished product and meeting unfinished audio decides the
  // app does not work; someone asked to help test it reports a finding. Same
  // bug, opposite conclusion, so the framing comes first.
  //
  // Remembered per device, so a tester is never asked twice.
  const [isTester, setIsTester] = useState(() => {
    try { return Boolean(localStorage.getItem('lexia_tester')); } catch { return false; }
  });

  // Start new users straight on onboarding (no brief flash of Home first).
  const [screen, setScreen] = useState(initial.user?.name ? 'home' : 'onboarding');
  const [lang, setLang] = useState('en');
  const [stats, setStats] = useState(initial.stats);
  const [settings, setSettings] = useState(initial.settings);
  const [user, setUser] = useState(initial.user);
  const [unlockedStickers, setUnlockedStickers] = useState(initial.unlockedStickers);
  const [missedPhonemes, setMissedPhonemes] = useState(initial.missedPhonemes);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  // Warn once if this device has no speech synthesis — the app still works, but
  // the child won't hear the letter/word sounds. Dismissible so it never nags.
  const [audioNoticeDismissed, setAudioNoticeDismissed] = useState(false);
  const audioUnavailable = !speechEngine.isSupported;

  const t = useMemo(() => i18n[lang] || i18n.en, [lang]);

  // Apply Dyslexia Mode
  useEffect(() => {
    if (settings.dyslexiaMode) {
      document.body.classList.add('dyslexia-mode');
    } else {
      document.body.classList.remove('dyslexia-mode');
    }
  }, [settings.dyslexiaMode]);

  // Check Onboarding
  useEffect(() => {
    if (!user.name && screen !== 'onboarding') {
      setScreen('onboarding');
    }
  }, [user.name, screen]);

  // Persist state
  useEffect(() => {
    saveState({ lang, stats, settings, user, unlockedStickers, missedPhonemes });
  }, [lang, stats, settings, user, unlockedStickers, missedPhonemes]);

  // A signup stranded by a bad connection goes out on the next load.
  useEffect(() => { retryPendingTester(); }, []);

  // Offline detection
  useEffect(() => {
    const goOffline = () => setIsOffline(true);
    const goOnline = () => setIsOffline(false);
    window.addEventListener('offline', goOffline);
    window.addEventListener('online', goOnline);
    return () => {
      window.removeEventListener('offline', goOffline);
      window.removeEventListener('online', goOnline);
    };
  }, []);

  const handleNavigate = useCallback((target) => {
    setScreen(target);
  }, []);

  // const toggleLang = useCallback(() => {
  //   setLang(prev => prev === 'en' ? 'fr' : 'en');
  // }, []);

  const handleWordCorrect = useCallback(() => {
    setStats(prev => ({
      ...prev,
      words: (prev.words || 0) + 1,
      streak: (prev.streak || 0) + 1,
      stars: (prev.stars || 0) + 5
    }));
  }, []);

  const handleWordMissed = useCallback((incorrectLetters = []) => {
    setStats(prev => ({
      ...prev,
      streak: 0
    }));

    if (incorrectLetters.length > 0) {
      setMissedPhonemes(prev => {
        const next = { ...prev };
        incorrectLetters.forEach(l => {
          if (!next[l]) next[l] = 0;
          next[l] += 1;
        });
        return next;
      });
    }
  }, []);

  const handleRoundComplete = useCallback(() => {
    setStats(prev => ({
      ...prev,
      stars: (prev.stars || 0) + 20
    }));
  }, []);

  // Parent-only: wipe learning progress, keep the child profile and settings.
  const handleResetProgress = useCallback(() => {
    const fresh = resetProgress();
    setStats(fresh.stats);
    setUnlockedStickers(fresh.unlockedStickers);
    setMissedPhonemes(fresh.missedPhonemes);
  }, []);

  // Render current screen
  const renderScreen = () => {
    switch (screen) {
      case 'onboarding':
        return <Onboarding t={t} onComplete={(userData) => {
          setUser(userData);
          setScreen('home');
        }} />;
      case 'settings':
        return <Settings t={t} settings={settings} setSettings={setSettings} onBack={() => setScreen('home')} />;
      case 'parent_dashboard':
        return <ParentDashboard t={t} stats={stats} missedPhonemes={missedPhonemes} onResetProgress={handleResetProgress} onBack={() => setScreen('home')} />;
      case 'sticker_book':
        return <StickerBook t={t} stats={stats} setStats={setStats} unlockedStickers={unlockedStickers} setUnlockedStickers={setUnlockedStickers} onBack={() => setScreen('home')} />;
      case 'phonics':
        return <PhonicsLab t={t} lang={lang} stats={stats} setStats={setStats} />;
      case 'forge':
        return (
          <WordForge
            t={t}
            lang={lang}
            stats={stats}
            onWordCorrect={handleWordCorrect}
            onWordMissed={handleWordMissed}
            onRoundComplete={handleRoundComplete}
          />
        );
      default:
        return <HomeScreen t={t} lang={lang} user={user} onNavigate={handleNavigate} stats={stats} />;
    }
  };

  const AvatarIcon = getAvatarIcon(user?.avatar, BookOpen);

  // The gate owns the whole screen: no app chrome to wander off into while
  // someone is deciding whether to help.
  if (!isTester) {
    return <EarlyTester onStart={() => setIsTester(true)} />;
  }

  return (
    <>
      {/* Top Bar — hidden during onboarding for a clean full-screen first run */}
      {screen !== 'onboarding' && (
      <header className="top-bar">
        <div className="top-bar-inner">
          {/* Left: Logo */}
          <button
            className="top-bar-logo"
            onClick={() => handleNavigate('home')}
            aria-label="LexiaCamer home"
          >
            <img src="/pwa-192x192.png" alt="L" className="top-bar-logo-img" />
            <span className="top-bar-logo-text">exiaCamer</span>
          </button>

          {/* Center: Dashboard */}
          <button
            className={`top-bar-parents ${screen === 'parent_dashboard' ? 'active' : ''}`}
            onClick={() => handleNavigate('parent_dashboard')}
            aria-label={t.dashboardLabel}
          >
            <ShieldCheck size={18} />
            <span className="top-bar-parents-label">{t.dashboardLabel}</span>
          </button>

          {/* Right: Avatar */}
          {user?.name ? (
            <button
              className="top-bar-avatar"
              onClick={() => handleNavigate('home')}
              aria-label="Go to home"
            >
              <AvatarIcon size={20} style={{ color: 'var(--green-700)' }} />
            </button>
          ) : (
            <span className="top-bar-avatar-placeholder" aria-hidden="true" />
          )}
        </div>
      </header>
      )}

      {/* Reachable everywhere: a tester who has to leave the app to report
          something mostly will not. */}
      <FeedbackButton screen={screen} />

      {/* Offline Banner */}
      {isOffline && (
        <div className="offline-banner" role="alert">
          <WifiOff size={18} />
          <span>{t.offline}</span>
        </div>
      )}

      {/* Audio-unavailable notice (rare; dismissible) */}
      {audioUnavailable && !audioNoticeDismissed && (
        <div className="offline-banner" role="alert" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <VolumeX size={18} />
          <span style={{ flex: 1 }}>{t.audioUnavailable}</span>
          <button
            type="button"
            onClick={() => setAudioNoticeDismissed(true)}
            aria-label="Dismiss"
            style={{ display: 'inline-flex', padding: '0.25rem', color: 'inherit' }}
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Main Content */}
      <main key={screen}>
        {renderScreen()}
      </main>

      {/* Bottom Navigation — hidden during onboarding */}
      {screen !== 'onboarding' && (
      <nav className="bottom-nav" role="navigation" aria-label="Main navigation">
        <button
          className={`bottom-nav-item ${screen === 'home' ? 'active' : ''}`}
          onClick={() => handleNavigate('home')}
          id="nav-home"
        >
          <div className="nav-icon-bg"><Home size={22} /></div>
          <span>{t.navHome}</span>
        </button>
        <button
          className={`bottom-nav-item ${screen === 'phonics' ? 'active' : ''}`}
          onClick={() => handleNavigate('phonics')}
          id="nav-phonics"
        >
          <div className="nav-icon-bg"><Type size={22} /></div>
          <span>{t.navPhonics}</span>
        </button>

        <button
          className={`bottom-nav-item ${screen === 'forge' ? 'active' : ''}`}
          onClick={() => handleNavigate('forge')}
          id="nav-forge"
        >
          <div className="nav-icon-bg"><Hammer size={22} /></div>
          <span>{t.navSpelling}</span>
        </button>
      </nav>
      )}
    </>
  );
}

```

## Early-tester gate — `src/EarlyTester.jsx`

Full-viewport, three steps (`intro` | `form` | `welcome`). This is the closest thing in the repo to a **marketing/landing surface**, and its `.et-*` CSS classes (`.et-screen`, `.et-card`, `.et-badge`, `.et-title`, `.et-lead`, `.et-known`, `.et-chips`, `.et-chip`, `.et-input`, `.et-btn`, `.et-btn-primary`, `.et-hint`, `.et-foot`, `.et-tick`, `.et-steps`) are the existing vocabulary a landing page should reuse.

```jsx
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
```
