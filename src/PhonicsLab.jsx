import React, { useState, useCallback, useMemo } from 'react';
import { phonicsData } from './i18n';
import speechEngine from './speech';

/**
 * PhonicsLab — Interactive Sound Board
 * Tap tiles to hear letter sounds via Web Speech API.
 * Categorised by vowels, consonants, and blends.
 */
export default function PhonicsLab({ t, lang }) {
  const [activeCategory, setActiveCategory] = useState('all');
  const [playingTile, setPlayingTile] = useState(null);

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

  const handleTap = useCallback((item) => {
    setPlayingTile(item.letter);
    speechEngine.speakLetter(item.sound, lang);

    // Reset animation after 600ms
    setTimeout(() => setPlayingTile(null), 600);
  }, [lang]);

  return (
    <div className="screen">
      {/* Header */}
      <div className="screen-header">
        <h2 style={{ marginBottom: '0.25rem' }}>{t.phonicsTitle}</h2>
        <p className="text-sm text-muted">{t.phonicsSubtitle}</p>
      </div>

      <div className="screen-body">
        {/* Category Tabs */}
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
        <div className="hint-box" style={{ marginTop: '1.5rem' }}>
          <span className="hint-icon">💡</span>
          <span>{t.phonicsTip}</span>
        </div>
      </div>
    </div>
  );
}
