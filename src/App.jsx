
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Home, Type, Hammer, BookOpen, WifiOff, ShieldCheck, VolumeX, X } from 'lucide-react';
import { getAvatarIcon } from './avatars';
import speechEngine from './speech';
import {
  loadState, saveState, queueEvent, syncOutbox, defaultState,
  linkChild, fetchServerProgress, reconcile,
} from './store';
import { useAuth } from './auth/AuthProvider';
import SignIn from './auth/SignIn';
import ParentOnboarding from './auth/ParentOnboarding';
import SchoolDashboard from './school/SchoolDashboard';
import { useSchoolContext } from './school/useSchool';
import i18n from './i18n';
import HomeScreen from './HomeScreen';
import PhonicsLab from './PhonicsLab';
import WordForge from './WordForge';
import Settings from './Settings';
import ParentDashboard from './ParentDashboard';
import StickerBook from './StickerBook';
import Onboarding from './Onboarding';

/**
 * App - Root Shell
 * Handles: routing, language toggle, offline detection, global stats.
 * All persistence lives in ./store so a backend can drop in without a rewrite.
 */

export default function App() {
  // One state object, owned here and persisted through ./store. Progress is
  // DERIVED from the child's events rather than mutated directly, which is what
  // lets the device and the server compute the same numbers independently.
  const [state, setState] = useState(() => loadState());
  const { progress, settings, user, lang } = state;

  // The screens read {words, streak, stars} - the same shape progress already
  // has: so nothing below needed changing when the store was rewritten.
  const stats = progress;
  const unlockedStickers = progress.unlockedStickers;
  const missedPhonemes = progress.missedPhonemes;

  const setSettings = useCallback((next) => setState(s => ({
    ...s, settings: typeof next === 'function' ? next(s.settings) : next,
  })), []);
  const setUser = useCallback((next) => setState(s => ({
    ...s, user: typeof next === 'function' ? next(s.user) : next,
  })), []);

  // Start new users straight on onboarding (no brief flash of Home first).
  const [screen, setScreen] = useState(state.user?.name ? 'home' : 'onboarding');
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const auth = useAuth();
  // Where an adult belongs is answered by the database, not by what they
  // picked at signup. A parent gets no schools; a teacher or director does.
  const school = useSchoolContext(auth.session);
  // Warn once if this device has no speech synthesis: the app still works, but
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
  useEffect(() => { saveState(state); }, [state]);

  // Drain the outbox on a timer and whenever the connection returns - NOT on
  // every state change, which would retry instantly in a tight loop against a
  // failing server. Events stay queued until accepted, so a bad connection
  // never costs a child their progress.
  useEffect(() => {
    if (isOffline) return;
    let cancelled = false;
    const flush = () => {
      setState(current => {
        if (current.outbox.length === 0) return current;
        syncOutbox(current).then(next => {
          if (!cancelled && next !== current) setState(next);
        });
        return current;
      });
    };
    flush();
    const timer = setInterval(flush, 30_000);
    return () => { cancelled = true; clearInterval(timer); };
  }, [isOffline]);

  // Once an adult signs in, attach this device's child to their account and
  // mint the device grant that lets the outbox drain. Idempotent, so it is
  // safe to run on every sign-in.
  useEffect(() => {
    if (!auth.session || isOffline) return;
    let cancelled = false;
    setState(current => {
      linkChild(current).then(async linked => {
        if (cancelled) return;
        const server = await fetchServerProgress(linked.studentId);
        if (cancelled) return;
        // The server is authoritative, but anything still queued is re-applied
        // so the child does not watch their most recent stars disappear.
        setState(server ? reconcile(linked, server) : linked);
      });
      return current;
    });
    return () => { cancelled = true; };
  }, [auth.session, isOffline]);

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

  // Every one of these records WHAT THE CHILD DID. Scoring is applied by
  // ./scoring (and independently by the server), never sent from here: which
  // is why a tampered device cannot mint stars.
  const record = useCallback((kind, payload) => {
    setState(s => queueEvent(s, kind, payload));
  }, []);

  const handleWordCorrect = useCallback(() => {
    record('word_completed');
  }, [record]);

  const handleWordMissed = useCallback((incorrectLetters = []) => {
    record('word_missed', { letters: incorrectLetters });
  }, [record]);

  const handleRoundComplete = useCallback(() => {
    record('round_completed');
  }, [record]);

  const handlePhonemeAttempt = useCallback((letter, correct) => {
    record('phoneme_attempt', { letter, correct });
  }, [record]);

  const handleUnlockSticker = useCallback((stickerId) => {
    record('sticker_unlocked', { sticker_id: stickerId });
  }, [record]);

  /**
   * Erase this child's record entirely.
   *
   * There is no longer a "reset the numbers" operation: progress is derived
   * from an immutable log of what the child actually did, so the only honest
   * way to clear it is to delete the record. Locally that is everything we
   * hold; once accounts exist this becomes delete_student() on the server.
   */
  const handleEraseChild = useCallback(() => {
    setState({ ...defaultState(), lang, settings });
    setScreen('onboarding');
  }, [lang, settings]);

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
        // Kid mode never needs an account. The ADULT side does, once there is
        // a backend to hold the record.
        if (auth.available && !auth.session) {
          return <SignIn t={t} onBack={() => setScreen('home')} />;
        }
        // A teacher or director lands on their class roster, not on a child's
        // progress screen.
        if (school.isSchoolUser) {
          return (
            <SchoolDashboard
              schools={school.schools}
              classes={school.classes}
              onBack={() => setScreen('home')}
            />
          );
        }
        // First time in: collect the child's details, the parent's, and
        // optionally where they are, before showing a dashboard of zeros.
        if (auth.session && state.studentId && !state.onboardedAt) {
          return (
            <ParentOnboarding
              studentId={state.studentId}
              initialChildName={user.name}
              onDone={() => setState(s2 => ({ ...s2, onboardedAt: new Date().toISOString() }))}
            />
          );
        }
        return <ParentDashboard t={t} stats={stats} missedPhonemes={missedPhonemes} onResetProgress={handleEraseChild} onBack={() => setScreen('home')} />;
      case 'sticker_book':
        return <StickerBook t={t} stats={stats} unlockedStickers={unlockedStickers} onUnlockSticker={handleUnlockSticker} onBack={() => setScreen('home')} />;
      case 'phonics':
        return <PhonicsLab t={t} lang={lang} stats={stats} onPhonemeAttempt={handlePhonemeAttempt} />;
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

  return (
    <>
      {/* Top Bar: hidden during onboarding for a clean full-screen first run */}
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

      {/* Bottom Navigation: hidden during onboarding */}
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

