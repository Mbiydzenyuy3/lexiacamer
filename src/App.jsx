
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

/**
 * App — Root Shell
 * Handles: routing, language toggle, offline detection, global stats.
 * All persistence lives in ./store so a backend can drop in without a rewrite.
 */

export default function App() {
  // Read persisted state once on mount (not once per field).
  const initial = useMemo(() => loadState(), []);

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

  return (
    <>
      {/* Top Bar */}
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

      {/* Bottom Navigation */}
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
    </>
  );
}

