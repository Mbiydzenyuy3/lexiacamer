import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { wordData } from './i18n';
import { Trophy, Star, Flame, Volume2, Lightbulb, SkipForward, RotateCcw, HelpCircle, Leaf, Soup, Package, ChefHat, Beef, Circle, Fish, ConciergeBell, Wheat, Carrot, User, Crown, UserCheck, UserSquare, Heart, Smile, Building2, Tent, Trees, Mountain, Waves, Home, MapPin, TreePine, CloudRain, Sun, Bird, Droplets } from 'lucide-react';
import speechEngine from './speech';
import Confetti from './Confetti';

const iconMap = { Leaf, Soup, Package, ChefHat, Beef, Circle, Fish, ConciergeBell, Wheat, Carrot, User, Crown, UserCheck, UserSquare, Star, Heart, Smile, Building2, Tent, Trees, Mountain, Waves, Home, MapPin, TreePine, CloudRain, Sun, Bird, Flame, Droplets };

/**
 * WordForge — Spelling Builder
 * Kids see a prompt (emoji + hint) and build the word letter-by-letter.
 * All vocabulary uses Cameroonian context.
 */

function shuffleArray(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Generate extra distractor letters
function makeLetterPool(word) {
  const wordLetters = word.split('');
  const all = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const distractors = [];

  while (distractors.length < Math.max(3, Math.ceil(word.length * 0.6))) {
    const ch = all[Math.floor(Math.random() * all.length)];
    if (!wordLetters.includes(ch) && !distractors.includes(ch)) {
      distractors.push(ch);
    }
  }

  return shuffleArray([...wordLetters, ...distractors]);
}

export default function WordForge({ t, lang }) {
  const [category, setCategory] = useState('all');
  const [wordIndex, setWordIndex] = useState(0);
  const [selected, setSelected] = useState([]);
  const [usedKeys, setUsedKeys] = useState([]);
  const [result, setResult] = useState(null); // 'correct' | 'wrong' | null
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [showCelebration, setShowCelebration] = useState(false);
  const [hintVisible, setHintVisible] = useState(false);
  const [completed, setCompleted] = useState(false);

  const categories = useMemo(() => [
    { key: 'all',    label: t.forgeCategoryAll },
    { key: 'food',   label: t.forgeCategoryFood },
    { key: 'names',  label: t.forgeCategoryNames },
    { key: 'cities', label: t.forgeCategoryCities },
    { key: 'nature', label: t.forgeCategoryNature },
  ], [t]);

  const words = useMemo(() => {
    const pool = category === 'all' ? wordData : wordData.filter(w => w.category === category);
    return shuffleArray(pool);
  }, [category]);

  const currentWord = words[wordIndex] || null;
  const targetWord = currentWord?.word || '';

  const letterPool = useMemo(() => {
    if (!targetWord) return [];
    return makeLetterPool(targetWord);
  }, [targetWord]);

  // Reset when category or word changes
  useEffect(() => {
    setSelected([]);
    setUsedKeys([]);
    setResult(null);
    setHintVisible(false);
  }, [wordIndex, category]);

  const handleLetterPick = useCallback((letter, idx) => {
    if (result) return;
    if (usedKeys.includes(idx)) return;
    if (selected.length >= targetWord.length) return;

    const newSelected = [...selected, letter];
    const newUsed = [...usedKeys, idx];

    setSelected(newSelected);
    setUsedKeys(newUsed);

    // Speak the letter
    speechEngine.speakLetter(letter, lang);

    // Auto-check when all slots filled
    if (newSelected.length === targetWord.length) {
      const attempt = newSelected.join('');
      setTimeout(() => {
        if (attempt === targetWord) {
          setResult('correct');
          setScore(s => s + 1);
          setStreak(s => s + 1);
          speechEngine.speakCelebration(lang);

          // Show confetti briefly
          setShowCelebration(true);
          setTimeout(() => setShowCelebration(false), 2500);
        } else {
          setResult('wrong');
          setStreak(0);

          // Shake & reset after 1.2s
          setTimeout(() => {
            setSelected([]);
            setUsedKeys([]);
            setResult(null);
          }, 1200);
        }
      }, 300);
    }
  }, [selected, usedKeys, targetWord, result, lang]);

  const handleNext = useCallback(() => {
    if (wordIndex + 1 >= words.length) {
      setCompleted(true);
    } else {
      setWordIndex(i => i + 1);
    }
  }, [wordIndex, words.length]);

  const handleSkip = useCallback(() => {
    setStreak(0);
    handleNext();
  }, [handleNext]);

  const handleUndo = useCallback(() => {
    if (result || selected.length === 0) return;
    // Remove the last placed letter and free its tile
    setSelected(prev => prev.slice(0, -1));
    setUsedKeys(prev => prev.slice(0, -1));
  }, [result, selected.length]);

  const handleClearAll = useCallback(() => {
    if (result) return;
    setSelected([]);
    setUsedKeys([]);
  }, [result]);

  const handlePlayAgain = useCallback(() => {
    setWordIndex(0);
    setScore(0);
    setStreak(0);
    setCompleted(false);
    setResult(null);
    setSelected([]);
    setUsedKeys([]);
  }, []);

  const handleCategoryChange = useCallback((cat) => {
    setCategory(cat);
    setWordIndex(0);
    setScore(0);
    setStreak(0);
    setCompleted(false);
  }, []);

  const handleSpeakWord = useCallback(() => {
    if (currentWord) {
      speechEngine.speakWord(currentWord.word, lang);
    }
  }, [currentWord, lang]);

  // Completion screen
  if (completed) {
    return (
      <div className="screen">
        <div className="screen-body" style={{ textAlign: 'center', paddingTop: '3rem' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
            <Trophy size={72} className="text-amber-500" strokeWidth={1.5} />
          </div>
          <h2>{t.celebTitle}</h2>
          <p className="text-secondary" style={{ margin: '0.5rem 0 1.5rem' }}>
            {t.forgeComplete}
          </p>
          <div className="score-display" style={{ justifyContent: 'center', margin: '0 auto 1.5rem', width: 'fit-content' }}>
            <Star size={18} className="text-amber-500" />
            <span>{t.forgeScore}: {score}/{words.length}</span>
          </div>
          <button className="btn btn-primary btn-lg" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }} onClick={handlePlayAgain} id="forge-play-again">
            <RotateCcw size={20} /> {t.forgePlayAgain}
          </button>
        </div>
      </div>
    );
  }

  if (!currentWord) return null;

  return (
    <div className="screen">
      <Confetti active={showCelebration} />

      {/* Header */}
      <div className="screen-header">
        <div className="flex justify-between items-center" style={{ marginBottom: '0.5rem' }}>
          <div>
            <h2 style={{ marginBottom: '0.1rem' }}>{t.forgeTitle}</h2>
            <p className="text-sm text-muted">{t.forgeSubtitle}</p>
          </div>
          <div className="score-display">
            {streak >= 3 && <Flame size={20} className="streak-fire text-amber-500" />}
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Star size={16} className="text-amber-500" /> {score}</span>
          </div>
        </div>
      </div>

      <div className="screen-body">
        {/* Category Tabs */}
        <div className="category-tabs" style={{ marginBottom: '1.25rem' }}>
          {categories.map((cat) => (
            <button
              key={cat.key}
              className={`category-tab ${category === cat.key ? 'active' : ''}`}
              onClick={() => handleCategoryChange(cat.key)}
              id={`forge-tab-${cat.key}`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Word Prompt Card */}
        <div className="word-prompt-card animate-fade-in" key={currentWord.word}>
          <div className="word-prompt-emoji" style={{ display: 'flex', justifyContent: 'center', paddingTop: '1rem', paddingBottom: '0.5rem' }}>
            {(() => {
              const Icon = iconMap[currentWord.icon] || HelpCircle;
              return <Icon size={80} className="text-primary" strokeWidth={1.5} />;
            })()}
          </div>

          {/* Speak button */}
          <button
            className="btn btn-sm btn-outline"
            onClick={handleSpeakWord}
            style={{ margin: '0 auto 0.75rem', display: 'flex', alignItems: 'center', gap: '6px' }}
            id="forge-speak-btn"
          >
            <Volume2 size={16} /> {t.speakBtn}
          </button>

          {/* Letter Slots */}
          <div className="flex gap-sm justify-center" style={{ marginBottom: '1rem', flexWrap: 'wrap' }}>
            {targetWord.split('').map((letter, i) => {
              let slotClass = 'letter-slot';
              const isFilled = !!selected[i];
              if (isFilled) {
                slotClass += ' filled';
                if (result === 'correct') slotClass += ' correct';
                if (result === 'wrong') slotClass += ' wrong';
              }
              return (
                <div
                  key={i}
                  className={slotClass}
                  role={isFilled && !result ? 'button' : undefined}
                  tabIndex={isFilled && !result ? 0 : undefined}
                  aria-label={isFilled && !result ? `Remove letter ${selected[i]}` : undefined}
                  style={isFilled && !result ? { cursor: 'pointer' } : {}}
                  onClick={() => {
                    // Clicking a filled slot undoes from the end if it's the last slot
                    if (!isFilled || result) return;
                    // Only allow removing the last filled slot (most recent)
                    const lastFilledIndex = selected.length - 1;
                    if (i === lastFilledIndex) handleUndo();
                  }}
                  onKeyDown={(e) => {
                    if ((e.key === 'Enter' || e.key === 'Backspace') && isFilled && !result) {
                      const lastFilledIndex = selected.length - 1;
                      if (i === lastFilledIndex) handleUndo();
                    }
                  }}
                >
                  {selected[i] || ''}
                </div>
              );
            })}
          </div>

          {/* Hint */}
          {hintVisible && (
            <p className="word-prompt-hint animate-fade-in" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
              <Lightbulb size={20} className="text-amber-500" /> {currentWord.hint[lang]}
            </p>
          )}
        </div>

        {/* Result Feedback */}
        {result && (
          <div
            className={`animate-fade-in text-center font-bold`}
            style={{
              margin: '1rem 0',
              fontSize: '1.1rem',
              color: result === 'correct' ? 'var(--green-700)' : 'var(--rose-600)',
            }}
          >
            {result === 'correct' ? t.forgeCorrect : t.forgeWrong}
          </div>
        )}

        {/* Letter Picker */}
        {!result || result === 'wrong' ? (
          <div className="letter-picker animate-fade-in-delay" style={{ marginTop: '1.25rem' }}>
            {letterPool.map((letter, idx) => (
              <button
                key={idx}
                className={`letter-key ${usedKeys.includes(idx) ? 'used' : ''}`}
                onClick={() => handleLetterPick(letter, idx)}
                disabled={usedKeys.includes(idx)}
                id={`key-${idx}`}
              >
                {letter}
              </button>
            ))}
          </div>
        ) : null}

        {/* Action Buttons */}
        <div className="flex gap-sm justify-center" style={{ marginTop: '1.5rem', flexWrap: 'wrap' }}>
          {!result && (
            <>
              {selected.length > 0 && (
                <button
                  className="btn btn-ghost btn-sm"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: 'var(--rose-600)' }}
                  onClick={handleUndo}
                  id="forge-undo-btn"
                  title="Remove last letter"
                >
                  ← {t.forgeUndo}
                </button>
              )}
              <button
                className="btn btn-ghost btn-sm"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                onClick={() => setHintVisible(true)}
                disabled={hintVisible}
                id="forge-hint-btn"
              >
                <Lightbulb size={18} /> {t.forgeHint}
              </button>
              <button
                className="btn btn-ghost btn-sm"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                onClick={handleSkip}
                id="forge-skip-btn"
              >
                <SkipForward size={18} /> {t.forgeSkip}
              </button>
            </>
          )}
          {result === 'correct' && (
            <button
              className="btn btn-primary"
              onClick={handleNext}
              id="forge-next-btn"
            >
              {t.forgeNext} →
            </button>
          )}
        </div>

        {/* Progress */}
        <div style={{ marginTop: '1.5rem' }}>
          <div className="flex justify-between text-xs text-muted" style={{ marginBottom: '0.3rem' }}>
            <span>{wordIndex + 1} / {words.length}</span>
            {streak >= 2 && <span style={{ display: 'flex', alignItems: 'center', gap: '2px' }}><Flame size={14} className="text-amber-500" /> {streak} {t.forgeStreak}</span>}
          </div>
          <div className="progress-bar">
            <div
              className="progress-bar-fill"
              style={{ width: `${((wordIndex + (result === 'correct' ? 1 : 0)) / words.length) * 100}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
