import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { Lightbulb, Play, RotateCcw, CheckCircle2 } from 'lucide-react';
import { phonicsData } from './i18n';
import speechEngine from './speech';
import Confetti from './Confetti';

export default function PhonicsLab({ t, lang, stats, setStats }) {
  const [activeCategory, setActiveCategory] = useState('all');
  const [playingTile, setPlayingTile] = useState(null);
  
  // Challenge Mode State
  const [isChallengeMode, setIsChallengeMode] = useState(false);
  const [targetItem, setTargetItem] = useState(null);
  const [score, setScore] = useState(0);
  const [showCelebration, setShowCelebration] = useState(false);

  const categories = useMemo(() => [
    { key: 'all',        label: t.categoryAll },
    { key: 'vowels',     label: t.categoryVowels },
    { key: 'consonants', label: t.categoryConsonants },
    { key: 'blends',     label: t.categoryBlends },
  ], [t]);

  const filtered = useMemo(() => {
    if (activeCategory === 'all') return phonicsData;
    return phonicsData.filter(p => p.category === activeCategory);
  }, [activeCategory]);

  const startChallenge = useCallback(() => {
    setIsChallengeMode(true);
    setScore(0);
    const randomItem = filtered[Math.floor(Math.random() * filtered.length)];
    setTargetItem(randomItem);
    speechEngine.speakLetter(randomItem.sound, lang);
  }, [filtered, lang]);

  const stopChallenge = useCallback(() => {
    setIsChallengeMode(false);
    setTargetItem(null);
  }, []);

  const handleTap = useCallback((item) => {
    setPlayingTile(item.letter);
    
    if (isChallengeMode && targetItem) {
      if (item.letter === targetItem.letter) {
        // Correct! Award stars and extend the shared "in a row" streak.
        setScore(s => s + 1);
        if (setStats) {
          setStats(prev => ({
            ...prev,
            stars: (prev.stars || 0) + 2,
            streak: (prev.streak || 0) + 1,
          }));
        }
        speechEngine.speakCelebration(lang);
        setShowCelebration(true);
        setTimeout(() => setShowCelebration(false), 2000);

        // Next sound
        setTimeout(() => {
          const nextItem = filtered[Math.floor(Math.random() * filtered.length)];
          setTargetItem(nextItem);
          speechEngine.speakLetter(nextItem.sound, lang);
        }, 2000);
      } else {
        // Wrong — repeat the target sound and break the streak.
        if (setStats) {
          setStats(prev => ({ ...prev, streak: 0 }));
        }
        speechEngine.speakLetter(targetItem.sound, lang);
      }
    } else {
      // Normal mode
      speechEngine.speakLetter(item.sound, lang);
    }

    setTimeout(() => setPlayingTile(null), 600);
  }, [isChallengeMode, targetItem, lang, filtered]);

  const repeatSound = useCallback(() => {
    if (targetItem) {
      speechEngine.speakLetter(targetItem.sound, lang);
    }
  }, [targetItem, lang]);

  return (
    <div className="screen">
      <Confetti active={showCelebration} />
      
      <div className="screen-header flex items-center justify-between">
        <div>
          <h2 style={{ marginBottom: '0.25rem' }}>{t.phonicsTitle}</h2>
          <p className="text-sm text-muted">{t.phonicsSubtitle}</p>
        </div>
        {isChallengeMode && (
          <div className="score-display">
            <CheckCircle2 size={16} style={{ color: 'var(--green-600)' }} /> {score}
          </div>
        )}
      </div>

      <div className="screen-body">
        {/* Mode Toggle */}
        <div style={{ marginBottom: '1rem' }}>
          {!isChallengeMode ? (
            <button className="btn btn-outline w-full" onClick={startChallenge}>
              <Play size={18} /> {t.phonicsPlayChallenge}
            </button>
          ) : (
            <div className="flex w-full gap-sm">
              <button className="btn btn-primary flex-1" onClick={repeatSound}>
                <RotateCcw size={18} /> {t.phonicsRepeatSound}
              </button>
              <button className="btn btn-ghost" onClick={stopChallenge}>
                {t.phonicsQuit}
              </button>
            </div>
          )}
        </div>

        {/* Category Tabs */}
        {!isChallengeMode && (
          <div className="category-tabs" style={{ marginBottom: '1rem' }}>
            {categories.map((cat) => (
              <button
                key={cat.key}
                className={`category-tab ${activeCategory === cat.key ? 'active' : ''}`}
                onClick={() => setActiveCategory(cat.key)}
                id={`phonics-tab-${cat.key}`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        )}

        {isChallengeMode && targetItem && (
          <div style={{
            textAlign: 'center', marginBottom: '1rem', padding: '0.75rem 1rem',
            background: 'var(--indigo-50)', border: '1px solid var(--indigo-200)',
            borderRadius: 'var(--radius-lg)', color: 'var(--indigo-700)', fontWeight: 600,
            fontSize: '0.9rem',
          }}>
            {t.phonicsListenPrompt}
          </div>
        )}

        {/* Phonics Grid */}
        <div className="phonics-grid animate-fade-in">
          {filtered.map((item) => (
            <button
              key={item.letter}
              className={`phonics-tile ${item.color} ${playingTile === item.letter ? 'playing' : ''}`}
              onClick={() => handleTap(item)}
              aria-label={`${item.letter}, ${item.example}`}
              id={`tile-${item.letter}`}
            >
              {item.letter}
              <span className="tile-label">{item.example}</span>
            </button>
          ))}
        </div>

        {/* Tip Box */}
        {!isChallengeMode && (
          <div className="hint-box" style={{ marginTop: '1.5rem' }}>
            <span className="hint-icon" style={{ color: 'var(--amber-500)' }}><Lightbulb size={24} /></span>
            <span>{t.phonicsTip}</span>
          </div>
        )}
      </div>
    </div>
  );
}
