
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Home, Type, Hammer, BookOpen, WifiOff, ShieldCheck, VolumeX, X, AudioLines, Settings as SettingsIcon } from 'lucide-react';
import { getAvatarIcon } from './avatars';
import speechEngine from './speech';
import { warmVoice } from './letterSounds';
import {
  loadState, saveState, queueEvent, syncOutbox,
  fetchServerProgress, reconcile, forgetServerLink, eraseChild, startLink,
} from './store';
import { useAuth } from './auth/AuthProvider';
import SignIn from './auth/SignIn';
import ParentOnboarding from './auth/ParentOnboarding';
import ParentConsent from './auth/ParentConsent';
import { CONSENT_VERSION, copyFor } from './consentCopy';
import YourData from './auth/YourData';
import { deleteChildData } from './lib/dataRights';
import InviteRedeem from './auth/InviteRedeem';
import SchoolDashboard from './school/SchoolDashboard';
import { useSchoolContext } from './school/useSchool';
import i18n from './i18n';
import HomeScreen from './HomeScreen';
import PhonicsLab from './PhonicsLab';
import WordForge from './WordForge';
import Settings from './Settings';
import BlendGame from './BlendGame';
import ParentDashboard from './ParentDashboard';
import StickerBook from './StickerBook';
import Onboarding from './Onboarding';
import FeedbackButton from './FeedbackButton';

/**
 * App — Root Shell
 * Handles: routing, offline detection, global stats.
 * All persistence lives in ./store so a backend can drop in without a rewrite.
 *
 * The screens are imported statically, deliberately. App is already a separate
 * lazy chunk that main.jsx prefetches in the background while someone reads the
 * landing page, so by the time a child taps in it is there. Splitting it
 * further would turn each tap between Phonics Lab, Word Forge and the Sticker
 * Book into its own request -- and on a weak connection a round trip costs far
 * more than the few kilobytes it would save.
 */

export default function App() {
  // One state object, owned here and persisted through ./store. Progress is
  // DERIVED from the child's events rather than mutated directly, which is what
  // lets the device and the server compute the same numbers independently.
  const [state, setState] = useState(() => loadState());
  // Latest state for async work that must not start inside a state updater.
  const stateRef = useRef(state);
  useEffect(() => { stateRef.current = state; }, [state]);
  // One linkChild at a time. StrictMode mounts effects twice and a token
  // refresh re-runs the effect; two parallel calls would both see no
  // studentId and create the child twice.
  const linkingRef = useRef(null);
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

  // /invite/<token>: the link the onboarding script hands a director. Read
  // once on mount and held in state, because signing in navigates away from
  // the URL and the token has to survive that.
  const [inviteToken, setInviteToken] = useState(() => {
    const m = typeof window !== 'undefined'
      && window.location.pathname.match(/^\/invite\/([A-Za-z0-9_-]+)$/);
    return m ? m[1] : null;
  });
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

  // Check Onboarding. Adjusted during render, so the wrong screen never paints.
  if (!user.name && screen !== 'onboarding') {
    setScreen('onboarding');
  }

  // The voice for letter sounds. A voice not saved offline by default is
  // downloaded in the background once chosen, so it works offline after.
  useEffect(() => {
    speechEngine.setLetterVoice(settings.letterVoice);
    warmVoice(settings.letterVoice, globalThis.fetch?.bind(globalThis), import.meta.env.BASE_URL);
  }, [settings.letterVoice]);

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
    if (!auth.session || isOffline || !state.consent?.childAssent) return;
    let cancelled = false;
    startLink({
      stateRef,
      linkingRef,
      // Ids and consent land in state the moment linkChild answers (see
      // startLink). A forgotten link clears consent, which brings the parent
      // back to the consent screen instead of retrying forever.
      write: (linked) => setState(current => ({
        ...current,
        studentId: linked.studentId,
        deviceToken: linked.deviceToken,
        consent: linked.consent,
      })),
    }).then(async linked => {
      if (cancelled || !linked.studentId) return;
      const server = await fetchServerProgress(linked.studentId);
      if (cancelled) return;
      // Merged, never adopted outright: the server knows less than the phone
      // about anything from before consent (see reconcile).
      setState(current => (server ? reconcile(current, server) : current));
    });
    return () => { cancelled = true; };
  }, [auth.session, isOffline, state.consent?.childAssent]);

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
  // When this phone is linked, erasing deletes the server copy first: resetting
  // only the phone would strand a record the parent can no longer reach.
  const handleEraseChild = useCallback(async () => {
    try {
      const next = await eraseChild(stateRef.current, {
        online: !isOffline,
        deleteServer: deleteChildData,
      });
      setState(next);
      setScreen('onboarding');
    } catch (err) {
      // The reset card has no message slot, and silently not erasing is worse.
      // "Connect to the internet" only when that is actually the problem.
      const copy = copyFor(lang);
      window.alert(err?.message === 'offline' ? copy.eraseNeedsInternet : copy.failed);
    }
  }, [isOffline, lang]);

  // Screens that own the whole viewport: child onboarding, adult sign-in, and
  // parent onboarding. These are focused one-task flows, so the app chrome
  // would only offer ways to wander off mid-form. Each provides its own back
  // arrow instead.
  const needsSignIn = screen === 'parent_dashboard' && auth.available && !auth.session;
  const needsParentOnboarding =
    screen === 'parent_dashboard' && Boolean(auth.session) && !school.isSchoolUser
    && Boolean(state.studentId) && !state.onboardedAt;
  const needsConsent =
    screen === 'parent_dashboard' && Boolean(auth.session) && !school.isSchoolUser
    && !state.consent?.childAssent;
  const isFocusedFlow = screen === 'onboarding' || needsSignIn || needsConsent
    || needsParentOnboarding || Boolean(inviteToken);

  const finishInvite = useCallback(() => {
    // Drop the token from the URL so a refresh does not retry a consumed one.
    if (typeof window !== 'undefined') {
      window.history.replaceState({}, '', '/');
    }
    setInviteToken(null);
    setScreen('parent_dashboard');
  }, []);

  // Render current screen
  const renderScreen = () => {
    // An invite link outranks everything: it is why this person opened the app.
    if (inviteToken) {
      return (
        <InviteRedeem
          t={t}
          token={inviteToken}
          onDone={finishInvite}
          onBack={finishInvite}
        />
      );
    }
    switch (screen) {
      case 'onboarding':
        return <Onboarding t={t} onComplete={(userData) => {
          setUser(userData);
          setScreen('home');
        }} />;
      case 'settings':
        return <Settings t={t} lang={lang} settings={settings} setSettings={setSettings} onBack={() => setScreen('home')} />;
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
        // Nothing about the child goes to the server until the parent has
        // agreed and the child has said yes. Saying no keeps the whole app.
        if (auth.session && !state.consent?.childAssent) {
          return (
            <ParentConsent
              lang={lang}
              childName={user.name}
              childDeclined={state.consent?.childAssent === false}
              onAgree={(childAssent) => setState(s2 => ({
                ...s2, consent: { version: CONSENT_VERSION, childAssent },
              }))}
              onBack={() => setScreen('home')}
            />
          );
        }
        // First time in: collect the child's details, the parent's, and
        // optionally where they are, before showing a dashboard of zeros.
        if (auth.session && state.studentId && !state.onboardedAt) {
          return (
            <ParentOnboarding
              lang={lang}
              studentId={state.studentId}
              initialChildName={user.name}
              onBack={() => setScreen('home')}
              onDone={() => setState(s2 => ({ ...s2, onboardedAt: new Date().toISOString() }))}
            />
          );
        }
        return (
          <ParentDashboard
            t={t} stats={stats} missedPhonemes={missedPhonemes}
            onResetProgress={handleEraseChild} onBack={() => setScreen('home')}
            yourData={
              <YourData
                lang={lang}
                studentId={state.studentId}
                childName={user.name}
                isOffline={isOffline}
                onChildDeleted={() => setState(s2 => forgetServerLink(s2))}
                onAccountDeleted={async () => {
                  setState(s2 => forgetServerLink(s2));
                  await auth.signOut();
                  setScreen('home');
                }}
              />
            }
          />
        );
      case 'sticker_book':
        return <StickerBook t={t} stats={stats} unlockedStickers={unlockedStickers} onUnlockSticker={handleUnlockSticker} onBack={() => setScreen('home')} />;
      case 'phonics':
        return <PhonicsLab t={t} lang={lang} stats={stats} onPhonemeAttempt={handlePhonemeAttempt} />;
      case 'blend':
        return (
          <BlendGame
            t={t}
            lang={lang}
            onWordCorrect={(word) => record('word_completed', { source: 'blend', word })}
            onWordMissed={(letters) => record('word_missed', { source: 'blend', letters })}
            onRoundComplete={(level, firstTry) => record('round_completed', { source: 'blend', level, firstTry })}
          />
        );
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


  return (
    <>
      {/* Top Bar: hidden during onboarding for a clean full-screen first run */}
      {!isFocusedFlow && (
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

            {/* Right: avatar, then Settings. One grid column (the bar is a
                3-column grid: logo | Dashboard | right side). */}
            <div className="top-bar-right">
            {user?.name ? (
              <button
                className="top-bar-avatar"
                onClick={() => handleNavigate('home')}
                aria-label="Go to home"
              >
                {React.createElement(getAvatarIcon(user?.avatar, BookOpen), { size: 20, style: { color: 'var(--green-700)' } })}
              </button>
            ) : (
              <span className="top-bar-avatar-placeholder" aria-hidden="true" />
            )}

              {/* Far right: Settings. A clear gear, not hidden in a card. */}
            <button
              className={`top-bar-settings ${screen === 'settings' ? 'active' : ''}`}
              onClick={() => handleNavigate('settings')}
              aria-label={t.settingsTitle}
            >
              <SettingsIcon size={22} />
            </button>
            </div>
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

      {/* Bottom Navigation: hidden during onboarding */}
      {!isFocusedFlow && (
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
            className={`bottom-nav-item ${screen === 'blend' ? 'active' : ''}`}
            onClick={() => handleNavigate('blend')}
            id="nav-blend"
          >
            <div className="nav-icon-bg"><AudioLines size={22} /></div>
            <span>{t.navBlend}</span>
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

