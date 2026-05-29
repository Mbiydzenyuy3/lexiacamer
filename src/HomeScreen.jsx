import React, { useMemo } from 'react';
import { BookOpen, Flame, Star, Type, ChevronRight, Hammer, Lightbulb } from 'lucide-react';

/**
 * HomeScreen — Landing / Dashboard
 * Shows greeting, stats, module cards, daily tip.
 */
export default function HomeScreen({ t, lang, onNavigate, stats }) {
  const todayTip = useMemo(() => {
    const tips = t.tips;
    const dayIdx = new Date().getDate() % tips.length;
    return tips[dayIdx];
  }, [t]);

  return (
    <div className="screen">
      {/* Hero */}
      <div className="hero animate-fade-in">
        <div className="hero-emoji">
          <BookOpen size={48} className="text-white opacity-90" strokeWidth={1.5} />
        </div>
        <h1 className="hero-title">{t.heroGreeting}</h1>
        <p className="hero-subtitle">{t.appSubtitle}</p>
      </div>

      <div className="container" style={{ paddingTop: 0 }}>
        {/* Stats Row */}
        <div className="stats-row animate-fade-in-delay" style={{ marginBottom: '1.5rem' }}>
          <div className="stat-card">
            <div className="stat-value">{stats.words}</div>
            <div className="stat-label">{t.statsWords}</div>
          </div>
          <div className="stat-card">
            <div className="stat-value" style={{ color: 'var(--amber-500)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
              {stats.streak > 0 ? <Flame size={24} /> : ''} {stats.streak}
            </div>
            <div className="stat-label">{t.statsStreak}</div>
          </div>
          <div className="stat-card">
            <div className="stat-value" style={{ color: 'var(--indigo-500)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
              <Star size={24} /> {stats.stars}
            </div>
            <div className="stat-label">{t.statsStars}</div>
          </div>
        </div>

        {/* Module Cards */}
        <div className="animate-fade-in-delay" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem' }}>
          <div
            className="module-card"
            onClick={() => onNavigate('phonics')}
            id="module-phonics"
            role="button"
            tabIndex={0}
          >
            <div className="module-icon" style={{ background: 'var(--green-100)', color: 'var(--green-700)' }}>
              <Type size={32} strokeWidth={2.5} />
            </div>
            <div className="module-info">
              <div className="module-title">{t.modulePhonicTitle}</div>
              <div className="module-desc">{t.modulePhonicDesc}</div>
            </div>
            <span className="module-arrow"><ChevronRight size={24} /></span>
          </div>

          <div
            className="module-card"
            onClick={() => onNavigate('forge')}
            id="module-forge"
            role="button"
            tabIndex={0}
          >
            <div className="module-icon" style={{ background: 'var(--amber-100)', color: '#92400e' }}>
              <Hammer size={32} strokeWidth={2.5} />
            </div>
            <div className="module-info">
              <div className="module-title">{t.moduleForgeTitle}</div>
              <div className="module-desc">{t.moduleForgeDesc}</div>
            </div>
            <span className="module-arrow"><ChevronRight size={24} /></span>
          </div>
        </div>

        {/* Daily Tip */}
        <div className="hint-box animate-fade-in-delay-2">
          <span className="hint-icon"><Lightbulb size={24} /></span>
          <div>
            <strong style={{ display: 'block', marginBottom: '0.2rem' }}>{t.dailyTip}</strong>
            {todayTip}
          </div>
        </div>
      </div>
    </div>
  );
}
