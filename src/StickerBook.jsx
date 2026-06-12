import React from 'react';
import { ArrowLeft, Star, Cat, Dog, Bird, Snail, Trees, Mountain, HelpCircle, Lock } from 'lucide-react';
import Confetti from './Confetti';

const STICKERS = [
  { id: 'lion_cub', name: 'Léo the Lion Cub', cost: 15, icon: Cat, color: '#f59e0b', bg: '#fffbeb', desc: 'Brave and strong!' },
  { id: 'grey_parrot', name: 'African Grey Parrot', cost: 25, icon: Bird, color: '#0ea5e9', bg: '#f0f9ff', desc: 'The smartest bird!' },
  { id: 'tortoise', name: 'Wise Tortoise', cost: 40, icon: Snail, color: '#059669', bg: '#ecfdf5', desc: 'Clever trickster.' },
  { id: 'dog', name: 'Village Dog', cost: 50, icon: Dog, color: '#6366f1', bg: '#eef2ff', desc: 'A loyal friend.' },
  { id: 'baobab', name: 'Giant Baobab', cost: 75, icon: Trees, color: '#065f46', bg: '#ecfdf5', desc: 'The tree of life.' },
  { id: 'mt_cameroon', name: 'Mount Cameroon', cost: 100, icon: Mountain, color: '#1a2e05', bg: '#f5f5f5', desc: 'Chariot of the gods.' }
];

export default function StickerBook({ stats, setStats, unlockedStickers, setUnlockedStickers, onBack }) {
  const [showCelebration, setShowCelebration] = React.useState(false);

  const handleUnlock = (sticker) => {
    if (stats.stars >= sticker.cost && !unlockedStickers.includes(sticker.id)) {
      setStats(prev => ({ ...prev, stars: prev.stars - sticker.cost }));
      setUnlockedStickers(prev => [...prev, sticker.id]);
      setShowCelebration(true);
      setTimeout(() => setShowCelebration(false), 3000);
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
            <Star size={24} /> Sticker Book
          </h2>
        </div>
        <div className="score-display" style={{ fontSize: '0.95rem', padding: '0.4rem 0.75rem' }}>
          <Star size={16} style={{ color: 'var(--amber-500)' }} /> {stats.stars}
        </div>
      </div>

      <div className="screen-body">
        <p className="text-muted text-center" style={{ marginBottom: '1.5rem', lineHeight: 1.6 }}>
          Spend your stars to unlock Cameroonian friends and places!
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
                ) : (
                  <button 
                    className={`btn btn-sm ${canAfford ? 'btn-secondary' : 'btn-ghost'}`}
                    style={{ marginTop: '0.5rem', padding: '0.3rem 0.75rem', fontSize: '0.75rem' }}
                    disabled={!canAfford}
                    onClick={(e) => { e.stopPropagation(); handleUnlock(sticker); }}
                  >
                    {canAfford ? <><Star size={12} /> {sticker.cost}</> : <><Lock size={12} /> {sticker.cost}</>}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
