import React, { useMemo } from 'react';
import { BookOpen, Flame, Star, Type, ChevronRight, Hammer, Lightbulb, Settings, ShieldCheck, Cat, Bird, Snail, Dog } from 'lucide-react';

const avatarIcons = {
  lion: Cat,
  parrot: Bird,
  tortoise: Snail,
  dog: Dog
};

export default function HomeScreen({ t, lang, user, onNavigate, stats }) {
  const todayTip = useMemo(() => {
    const tips = t.tips;
    const dayIdx = new Date().getDate() % tips.length;
    return tips[dayIdx];
  }, [t]);

  const AvatarIcon = user?.avatar ? avatarIcons[user.avatar] : BookOpen;
  const userName = user?.name || 'Young Reader';

  return (
    <div className="screen">
      {/* Hero */}
      <div className="hero animate-fade-in flex items-center justify-between" style={{ paddingBottom: '1rem' }}>
        <div>
          <h1 className="hero-title" style={{ fontSize: '1.6rem' }}>Hi, {userName}!</h1>
          <p className="hero-subtitle text-sm">{t.appSubtitle}</p>
        </div>
        <div style={{
          width: '56px', height: '56px', borderRadius: '50%', 
          background: 'var(--bg-elevated)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          border: '2px solid var(--color-primary)'
        }}>
          <AvatarIcon size={32} className="text-primary" />
        </div>
      </div>

      <div className="container" style={{ paddingTop: 0 }}>
        {/* Stats Row */}
        <div className="stats-row animate-fade-in-delay" style={{ marginBottom: '1.5rem', display: 'flex', gap: '0.5rem' }}>
          <div className="stat-card flex-1 text-center bg-card p-3 rounded-lg border shadow-sm">
            <div className="stat-value font-bold text-lg">{stats.words}</div>
            <div className="stat-label text-xs text-muted uppercase tracking-wider">{t.statsWords}</div>
          </div>
          <div className="stat-card flex-1 text-center bg-card p-3 rounded-lg border shadow-sm">
            <div className="stat-value font-bold text-lg flex justify-center items-center gap-xs text-amber-500">
              {stats.streak > 0 && <Flame size={18} />} {stats.streak}
            </div>
            <div className="stat-label text-xs text-muted uppercase tracking-wider">{t.statsStreak}</div>
          </div>
          <div className="stat-card flex-1 text-center bg-card p-3 rounded-lg border shadow-sm" onClick={() => onNavigate('sticker_book')}>
            <div className="stat-value font-bold text-lg flex justify-center items-center gap-xs text-indigo-500">
              <Star size={18} /> {stats.stars}
            </div>
            <div className="stat-label text-xs text-muted uppercase tracking-wider">Spend</div>
          </div>
        </div>

        {/* Action Grid */}
        <div className="grid grid-cols-2 gap-sm animate-fade-in-delay mb-6" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
          
          <div className="card flex flex-col items-center text-center p-4 card-interactive" onClick={() => onNavigate('phonics')} style={{ background: 'var(--green-50)', borderColor: 'var(--green-200)' }}>
            <Type size={36} className="text-green-600 mb-2" />
            <div className="font-bold">Phonics Lab</div>
            <div className="text-xs text-green-700">Learn sounds</div>
          </div>

          <div className="card flex flex-col items-center text-center p-4 card-interactive" onClick={() => onNavigate('forge')} style={{ background: 'var(--amber-50)', borderColor: 'var(--amber-200)' }}>
            <Hammer size={36} className="text-amber-600 mb-2" />
            <div className="font-bold">Word Forge</div>
            <div className="text-xs text-amber-700">Spell words</div>
          </div>

          <div className="card flex flex-col items-center text-center p-4 card-interactive" onClick={() => onNavigate('sticker_book')} style={{ background: 'var(--indigo-50)', borderColor: 'var(--indigo-200)' }}>
            <Star size={36} className="text-indigo-600 mb-2" />
            <div className="font-bold">Sticker Book</div>
            <div className="text-xs text-indigo-700">Spend stars</div>
          </div>

          <div className="card flex flex-col items-center text-center p-4 card-interactive" onClick={() => onNavigate('settings')}>
            <Settings size={36} className="text-muted mb-2" />
            <div className="font-bold">Settings</div>
            <div className="text-xs text-muted">Dyslexia mode</div>
          </div>
        </div>

        {/* Parent Dashboard Link */}
        <div className="mb-6">
          <button className="btn btn-outline w-full flex items-center justify-center gap-sm" onClick={() => onNavigate('parent_dashboard')} style={{ borderColor: 'var(--indigo-200)', color: 'var(--indigo-700)' }}>
            <ShieldCheck size={20} /> Parent Dashboard
          </button>
        </div>

        {/* Daily Tip */}
        <div className="hint-box animate-fade-in-delay-2 p-4 bg-card rounded-lg border shadow-sm flex gap-md items-start">
          <span className="hint-icon text-amber-500"><Lightbulb size={24} /></span>
          <div>
            <strong style={{ display: 'block', marginBottom: '0.2rem' }}>{t.dailyTip}</strong>
            <span className="text-sm text-secondary">{todayTip}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
