import React from 'react';
import { ArrowLeft, Star, Cat, Dog, Bird, Snail, Trees, Mountain, HelpCircle } from 'lucide-react';
import Confetti from './Confetti';

const STICKERS = [
  { id: 'lion_cub', name: 'Léo the Lion Cub', cost: 15, icon: Cat, color: 'var(--amber-500)', desc: 'Brave and strong!' },
  { id: 'grey_parrot', name: 'African Grey Parrot', cost: 25, icon: Bird, color: 'var(--sky-500)', desc: 'The smartest bird!' },
  { id: 'tortoise', name: 'Wise Tortoise', cost: 40, icon: Snail, color: 'var(--green-600)', desc: 'Clever trickster.' },
  { id: 'dog', name: 'Village Dog', cost: 50, icon: Dog, color: 'var(--indigo-500)', desc: 'A loyal friend.' },
  { id: 'baobab', name: 'Giant Baobab', cost: 75, icon: Trees, color: 'var(--green-800)', desc: 'The tree of life.' },
  { id: 'mt_cameroon', name: 'Mount Cameroon', cost: 100, icon: Mountain, color: 'var(--text-primary)', desc: 'The chariot of the gods.' }
];

export default function StickerBook({ stats, setStats, unlockedStickers, setUnlockedStickers, onBack }) {
  const [showCelebration, setShowCelebration] = React.useState(false);

  const handleUnlock = (sticker) => {
    if (stats.stars >= sticker.cost && !unlockedStickers.includes(sticker.id)) {
      // Deduct stars
      setStats(prev => ({ ...prev, stars: prev.stars - sticker.cost }));
      // Unlock sticker
      setUnlockedStickers(prev => [...prev, sticker.id]);
      // Celebrate
      setShowCelebration(true);
      setTimeout(() => setShowCelebration(false), 3000);
    }
  };

  return (
    <div className="screen">
      <Confetti active={showCelebration} />
      
      <div className="screen-header flex items-center justify-between">
        <div className="flex items-center gap-sm">
          <button className="btn btn-ghost p-2" onClick={onBack} aria-label="Go back">
            <ArrowLeft size={24} />
          </button>
          <h2 className="flex items-center gap-sm mb-0 text-amber-600">
            <Star size={24} /> Sticker Book
          </h2>
        </div>
        <div className="score-display">
          <Star size={16} className="text-amber-500" /> {stats.stars}
        </div>
      </div>

      <div className="screen-body">
        <p className="text-muted mb-6 text-center">
          Spend your stars to unlock Cameroonian friends and places!
        </p>

        <div className="grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '1rem' }}>
          {STICKERS.map(sticker => {
            const isUnlocked = unlockedStickers.includes(sticker.id);
            const canAfford = stats.stars >= sticker.cost;
            const Icon = isUnlocked ? sticker.icon : HelpCircle;

            return (
              <div 
                key={sticker.id} 
                className={`card flex-col items-center text-center p-4 ${!isUnlocked && canAfford ? 'card-interactive' : ''}`}
                style={{ 
                  border: isUnlocked ? `2px solid ${sticker.color}` : '2px dashed var(--border-medium)',
                  background: isUnlocked ? 'var(--bg-card)' : 'var(--bg-body)',
                  opacity: isUnlocked ? 1 : 0.8,
                  position: 'relative',
                  overflow: 'hidden'
                }}
                onClick={() => !isUnlocked && handleUnlock(sticker)}
              >
                <div style={{
                  width: '64px', height: '64px',
                  borderRadius: '50%',
                  background: isUnlocked ? `${sticker.color}20` : 'var(--border-light)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  marginBottom: '0.5rem'
                }}>
                  <Icon size={32} color={isUnlocked ? sticker.color : 'var(--text-muted)'} />
                </div>
                
                <h4 className="text-sm font-bold mb-1" style={{ color: isUnlocked ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                  {isUnlocked ? sticker.name : '???'}
                </h4>
                
                {isUnlocked ? (
                  <p className="text-xs text-muted leading-tight">{sticker.desc}</p>
                ) : (
                  <button 
                    className={`btn btn-sm ${canAfford ? 'btn-primary' : 'btn-ghost'}`}
                    style={{ marginTop: 'auto', padding: '0.25rem 0.75rem', fontSize: '0.75rem' }}
                    disabled={!canAfford}
                    onClick={(e) => { e.stopPropagation(); handleUnlock(sticker); }}
                  >
                    <Star size={12} /> {sticker.cost}
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
