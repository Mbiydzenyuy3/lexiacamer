
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Home, Type, Hammer, BookOpen, WifiOff } from 'lucide-react';
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
 */

const STORAGE_KEY = 'lexia_state';

function loadState() {
  const defaultState = {
    lang: 'en',
    stats: { words: 0, streak: 0, stars: 0, timeSpent: 0 },
    settings: { dyslexiaMode: false },
    user: { name: '', avatar: '' },
    unlockedStickers: [],
    missedPhonemes: {}
  };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        ...defaultState,
        ...parsed,
        stats: { ...defaultState.stats, ...(parsed.stats || {}) },
        settings: { ...defaultState.settings, ...(parsed.settings || {}) },
        user: { ...defaultState.user, ...(parsed.user || {}) },
      };
    }
  } catch (e) { /* ignore */ }
  return defaultState;
}

function saveState(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) { /* ignore */ }
}

export default function App() {
  const [screen, setScreen] = useState('home');
  const [lang, setLang] = useState('en');
  const [stats, setStats] = useState(() => loadState().stats);
  const [settings, setSettings] = useState(() => loadState().settings);
  const [user, setUser] = useState(() => loadState().user);
  const [unlockedStickers, setUnlockedStickers] = useState(() => loadState().unlockedStickers);
  const [missedPhonemes, setMissedPhonemes] = useState(() => loadState().missedPhonemes);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

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

  const toggleLang = useCallback(() => {
    setLang(prev => prev === 'en' ? 'fr' : 'en');
  }, []);

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

  // Render current screen
  const renderScreen = () => {
    switch (screen) {
      case 'onboarding':
        return <Onboarding t={t} onComplete={(userData) => {
          setUser(userData);
          setScreen('home');
        }} />;
      case 'settings':
        return <Settings settings={settings} setSettings={setSettings} onBack={() => setScreen('home')} />;
      case 'parent_dashboard':
        return <ParentDashboard stats={stats} missedPhonemes={missedPhonemes} onBack={() => setScreen('home')} />;
      case 'sticker_book':
        return <StickerBook stats={stats} setStats={setStats} unlockedStickers={unlockedStickers} setUnlockedStickers={setUnlockedStickers} onBack={() => setScreen('home')} />;
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

  return (
    <>
      {/* Top Bar */}
      <header className="top-bar">
        <div className="top-bar-title">
          <img src="/pwa-192x192.png" alt="LexiaCamer Logo" style={{ width: 48, height: 48, borderRadius: '6px' }} />
          <span>{t.appName}</span>
        </div>

        <div className="flex items-center gap-sm">
          {/* Language Toggle (Hidden for v1) */}
          {/*
          <div className="lang-toggle" id="lang-toggle">
            <button
              className={`lang-option ${lang === 'en' ? 'active' : ''}`}
              onClick={() => setLang('en')}
              aria-label="English"
            >
              EN
            </button>
            <button
              className={`lang-option ${lang === 'fr' ? 'active' : ''}`}
              onClick={() => setLang('fr')}
              aria-label="Français"
            >
              FR
            </button>
          </div>
          */}
        </div>
      </header>

      {/* Offline Banner */}
      {isOffline && (
        <div className="offline-banner" role="alert">
          <WifiOff size={18} />
          <span>{t.offline}</span>
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
