import React, { useMemo } from 'react';
import { BookOpen, Flame, Star, Type, ChevronRight, Hammer, Lightbulb, Settings, ShieldCheck, Cat, Bird, Snail, Dog } from 'lucide-react';

export default function HomeScreen({ t, lang, user, onNavigate, stats }) {
  const todayTip = useMemo(() => {
    const tips = t.tips;
    const dayIdx = new Date().getDate() % tips.length;
    return tips[dayIdx];
  }, [t]);

  const userName = user?.name || 'Young Reader';

  return (
    <div className="screen">
      {/* Hero */}
      <div className="hero animate-fade-in" style={{ textAlign: 'center' }}>
        <h1 className="hero-title" style={{ fontSize: '1.75rem' }}>Hi, {userName}</h1>
        <p className="hero-subtitle" style={{ margin: '0 auto' }}>{t.appSubtitle}</p>
      </div>

      <div className="container" style={{ paddingTop: 0 }}>
        {/* Stats Row */}
        <div className="stats-row animate-fade-in-delay" style={{ marginBottom: '1.5rem' }}>
          <div className="stat-card">
            <div className="stat-value" style={{ color: 'var(--green-700)' }}>{stats.words}</div>
            <div className="stat-label">{t.statsWords}</div>
          </div>
          <div className="stat-card">
            <div className="stat-value" style={{ color: 'var(--amber-600)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem' }}>
              {stats.streak >= 3 && <Flame size={20} />} {stats.streak}
            </div>
            <div className="stat-label">{t.statsStreak}</div>
          </div>
          <button type="button" className="stat-card card-interactive" onClick={() => onNavigate('sticker_book')} aria-label={`${stats.stars} stars — open Sticker Book`} style={{ cursor: 'pointer', width: '100%' }}>
            <div className="stat-value" style={{ color: 'var(--indigo-600)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem' }}>
              <Star size={20} /> {stats.stars}
            </div>
            <div className="stat-label">{t.statsStars}</div>
          </button>
        </div>

        {/* Action Grid */}
        <div className="animate-fade-in-delay" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1.5rem' }}>

          <button type="button" className="card card-interactive" onClick={() => onNavigate('phonics')} style={{
            width: '100%',
            background: 'linear-gradient(145deg, var(--green-50), #ffffff)',
            borderColor: 'var(--green-200)',
            display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center',
            padding: '1.5rem 1rem',
          }}>
            <div style={{
              width: '56px', height: '56px', borderRadius: '16px',
              background: 'var(--green-100)', display: 'flex', alignItems: 'center', justifyContent: 'center',
              marginBottom: '0.75rem'
            }}>
              <Type size={28} style={{ color: 'var(--green-700)' }} />
            </div>
            <div className="font-bold" style={{ marginBottom: '0.15rem' }}>Phonics Lab</div>
            <div className="text-xs" style={{ color: 'var(--green-700)' }}>Learn sounds</div>
          </button>

          <button type="button" className="card card-interactive" onClick={() => onNavigate('forge')} style={{
            width: '100%',
            background: 'linear-gradient(145deg, var(--amber-50), #ffffff)',
            borderColor: 'var(--amber-200)',
            display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center',
            padding: '1.5rem 1rem',
          }}>
            <div style={{
              width: '56px', height: '56px', borderRadius: '16px',
              background: 'var(--amber-100)', display: 'flex', alignItems: 'center', justifyContent: 'center',
              marginBottom: '0.75rem'
            }}>
              <Hammer size={28} style={{ color: 'var(--amber-600)' }} />
            </div>
            <div className="font-bold" style={{ marginBottom: '0.15rem' }}>Word Forge</div>
            <div className="text-xs" style={{ color: 'var(--amber-600)' }}>Spell words</div>
          </button>

          <button type="button" className="card card-interactive" onClick={() => onNavigate('sticker_book')} style={{
            width: '100%',
            background: 'linear-gradient(145deg, var(--indigo-50), #ffffff)',
            borderColor: 'var(--indigo-200)',
            display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center',
            padding: '1.5rem 1rem',
          }}>
            <div style={{
              width: '56px', height: '56px', borderRadius: '16px',
              background: 'var(--indigo-100)', display: 'flex', alignItems: 'center', justifyContent: 'center',
              marginBottom: '0.75rem'
            }}>
              <Star size={28} style={{ color: 'var(--indigo-600)' }} />
            </div>
            <div className="font-bold" style={{ marginBottom: '0.15rem' }}>Sticker Book</div>
            <div className="text-xs" style={{ color: 'var(--indigo-600)' }}>Spend stars</div>
          </button>

          <button type="button" className="card card-interactive" onClick={() => onNavigate('settings')} style={{
            width: '100%',
            background: 'linear-gradient(145deg, #f5f5f5, #ffffff)',
            display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center',
            padding: '1.5rem 1rem',
          }}>
            <div style={{
              width: '56px', height: '56px', borderRadius: '16px',
              background: 'var(--border-light)', display: 'flex', alignItems: 'center', justifyContent: 'center',
              marginBottom: '0.75rem'
            }}>
              <Settings size={28} style={{ color: 'var(--text-secondary)' }} />
            </div>
            <div className="font-bold" style={{ marginBottom: '0.15rem' }}>Settings</div>
            <div className="text-xs text-muted">Dyslexia mode</div>
          </button>
        </div>

        {/* Parent Dashboard Link */}
        {/* <div style={{ marginBottom: '1.5rem' }}>
          <button className="btn btn-outline w-full" onClick={() => onNavigate('parent_dashboard')} style={{
            borderColor: 'var(--indigo-200)', color: 'var(--indigo-700)',
            padding: '0.9rem',
            borderRadius: 'var(--radius-xl)',
          }}>
            <ShieldCheck size={20} /> Parent Dashboard
          </button>
        </div> */}

        {/* Daily Tip */}
        <div className="hint-box animate-fade-in-delay-2">
          <span className="hint-icon" style={{ color: 'var(--amber-500)' }}><Lightbulb size={24} /></span>
          <div>
            <strong style={{ display: 'block', marginBottom: '0.2rem' }}>{t.dailyTip}</strong>
            <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>{todayTip}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
