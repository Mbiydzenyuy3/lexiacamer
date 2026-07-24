import React from 'react';
import { ArrowLeft, Star, Cat, Dog, Bird, Snail, Trees, Mountain, HelpCircle, Lock, Sparkles, CheckCircle2 } from 'lucide-react';
import Confetti from './Confetti';

const STICKERS = [
  { id: 'lion_cub', name: 'Léo the Lion Cub', cost: 15, icon: Cat, color: '#f59e0b', bg: '#fffbeb', desc: 'Brave and strong!' },
  { id: 'grey_parrot', name: 'African Grey Parrot', cost: 25, icon: Bird, color: '#0ea5e9', bg: '#f0f9ff', desc: 'The smartest bird!' },
  { id: 'tortoise', name: 'Wise Tortoise', cost: 40, icon: Snail, color: '#059669', bg: '#ecfdf5', desc: 'Clever trickster.' },
  { id: 'dog', name: 'Village Dog', cost: 50, icon: Dog, color: '#6366f1', bg: '#eef2ff', desc: 'A loyal friend.' },
  { id: 'baobab', name: 'Giant Baobab', cost: 75, icon: Trees, color: '#065f46', bg: '#ecfdf5', desc: 'The tree of life.' },
  { id: 'mt_cameroon', name: 'Mount Cameroon', cost: 100, icon: Mountain, color: '#1a2e05', bg: '#f5f5f5', desc: 'Chariot of the gods.' }
];

export default function StickerBook({ t, stats, setStats, unlockedStickers, setUnlockedStickers, onBack }) {
  const [showCelebration, setShowCelebration] = React.useState(false);
  const celebrationTimer = React.useRef(null);

  // App keys <main> by screen, so tapping Back mid-celebration unmounts this
  // component while the timeout is still pending. Clear it on unmount so it
  // never fires setState on an unmounted tree.
  React.useEffect(() => () => clearTimeout(celebrationTimer.current), []);

  const handleUnlock = (sticker) => {
    if (stats.stars >= sticker.cost && !unlockedStickers.includes(sticker.id)) {
      setStats(prev => ({ ...prev, stars: prev.stars - sticker.cost }));
      setUnlockedStickers(prev => [...prev, sticker.id]);
      setShowCelebration(true);
      clearTimeout(celebrationTimer.current);
      celebrationTimer.current = setTimeout(() => setShowCelebration(false), 3000);
    }
  };

  return (
    <div className="screen">
      <Confetti active={showCelebration} />
      
      <div className="screen-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div className="flex items-center gap-sm">
          <button className="btn btn-ghost p-2" onClick={onBack} aria-label="Go back">
            <ArrowLeft size={24} />
          </button>
          <h2 className="flex items-center gap-sm mb-0" style={{ color: 'var(--amber-600)' }}>
            <Star size={24} /> {t.stickerTitle}
          </h2>
        </div>
        <div className="score-display" style={{ fontSize: '0.95rem', padding: '0.4rem 0.75rem' }}>
          <Star size={16} style={{ color: 'var(--amber-500)' }} /> {stats.stars}
        </div>
      </div>

      <div className="screen-body">
        {/* How it works — so anyone understands the feature without being told */}
        <div className="card" style={{
          marginBottom: '1.25rem',
          background: 'linear-gradient(145deg, var(--amber-50), #ffffff)',
          borderColor: 'var(--amber-200)',
        }}>
          <div style={{
            fontWeight: 800, fontSize: '1rem', marginBottom: '0.85rem',
            display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--amber-600)',
          }}>
            <Sparkles size={18} /> {t.stickerHowTo}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.7rem' }}>
            {[
              { Icon: Star, color: 'var(--amber-500)', title: t.stickerStepEarn, text: t.stickerStepEarnDesc },
              { Icon: HelpCircle, color: 'var(--indigo-500)', title: t.stickerStepPick, text: t.stickerStepPickDesc },
              { Icon: CheckCircle2, color: 'var(--green-600)', title: t.stickerStepUnlock, text: t.stickerStepUnlockDesc },
            ].map((s, i) => (
              <div key={i} style={{ display: 'flex', gap: '0.6rem', alignItems: 'flex-start' }}>
                <div style={{
                  width: '1.85rem', height: '1.85rem', borderRadius: '50%',
                  background: 'var(--bg-body)', color: s.color,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}>
                  <s.Icon size={16} />
                </div>
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontWeight: 700, fontSize: '0.85rem' }}>{i + 1}. {s.title}</div>
                  <div className="text-xs text-muted" style={{ lineHeight: 1.4 }}>{s.text}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Collection progress — reinforces the goal */}
        <p className="text-center text-sm" style={{ marginBottom: '1rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
          {unlockedStickers.length} of {STICKERS.length} {t.stickerCollected}
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '0.75rem' }}>
          {STICKERS.map(sticker => {
            const isUnlocked = unlockedStickers.includes(sticker.id);
            const canAfford = stats.stars >= sticker.cost;
            const Icon = sticker.icon;

            return (
              <div 
                key={sticker.id} 
                className={!isUnlocked && canAfford ? 'card-interactive' : ''}
                style={{ 
                  borderRadius: 'var(--radius-xl)',
                  border: isUnlocked ? `2px solid ${sticker.color}40` : '2px dashed var(--border-medium)',
                  background: isUnlocked ? sticker.bg : 'var(--bg-card)',
                  padding: '1.25rem 1rem',
                  textAlign: 'center',
                  display: 'flex', flexDirection: 'column', alignItems: 'center',
                  transition: 'all 0.2s ease',
                  cursor: !isUnlocked && canAfford ? 'pointer' : 'default',
                  boxShadow: isUnlocked ? `0 4px 12px ${sticker.color}15` : 'var(--shadow-xs)',
                }}
                onClick={() => !isUnlocked && handleUnlock(sticker)}
              >
                <div style={{
                  width: '60px', height: '60px',
                  borderRadius: '50%',
                  background: isUnlocked ? `${sticker.color}15` : 'var(--border-light)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  marginBottom: '0.75rem',
                  transition: 'all 0.2s ease',
                }}>
                  {isUnlocked ? (
                    <Icon size={30} color={sticker.color} strokeWidth={1.8} />
                  ) : (
                    <HelpCircle size={28} style={{ color: 'var(--text-muted)' }} />
                  )}
                </div>
                
                <div style={{
                  fontWeight: 700, fontSize: '0.85rem', marginBottom: '0.25rem',
                  color: isUnlocked ? 'var(--text-primary)' : 'var(--text-muted)',
                }}>
                  {isUnlocked ? sticker.name : '???'}
                </div>
                
                {isUnlocked ? (
                  <p className="text-xs text-muted" style={{ lineHeight: 1.4 }}>{sticker.desc}</p>
                ) : canAfford ? (
                  <button
                    className="btn btn-sm btn-secondary"
                    style={{ marginTop: '0.5rem', padding: '0.3rem 0.85rem', fontSize: '0.75rem' }}
                    onClick={(e) => { e.stopPropagation(); handleUnlock(sticker); }}
                  >
                    <Star size={12} /> {t.stickerUnlock} · {sticker.cost}
                  </button>
                ) : (
                  <div style={{ marginTop: '0.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.15rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontWeight: 700, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                      <Lock size={12} /> {sticker.cost} <Star size={11} style={{ color: 'var(--amber-500)' }} />
                    </div>
                    <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                      {sticker.cost - stats.stars} {t.stickerMoreToGo}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
