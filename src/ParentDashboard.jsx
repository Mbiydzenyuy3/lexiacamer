import React, { useState } from 'react';
import { ArrowLeft, Lock, ShieldCheck, Activity, AlertTriangle, Star, Lightbulb } from 'lucide-react';

export default function ParentDashboard({ stats, missedPhonemes, onBack }) {
  const [unlocked, setUnlocked] = useState(false);
  const [pinClicks, setPinClicks] = useState(0);

  const handleUnlock = () => {
    if (pinClicks + 1 >= 3) {
      setUnlocked(true);
    } else {
      setPinClicks(prev => prev + 1);
    }
  };

  if (!unlocked) {
    return (
      <div className="screen" style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        padding: '2rem', minHeight: 'calc(100vh - 8rem)',
      }}>
        <div className="animate-fade-in" style={{
          maxWidth: '380px', width: '100%', textAlign: 'center',
          background: 'var(--bg-card)',
          borderRadius: 'var(--radius-2xl)',
          padding: '2.5rem 2rem',
          boxShadow: '0 20px 60px rgba(0,0,0,0.08)',
          border: '1px solid var(--border-light)',
        }}>
          <div style={{
            width: '72px', height: '72px', borderRadius: '50%', margin: '0 auto 1.5rem',
            background: 'linear-gradient(135deg, var(--indigo-100), var(--indigo-50))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: '3px solid var(--indigo-200)',
          }}>
            <Lock size={36} style={{ color: 'var(--indigo-600)' }} />
          </div>
          <h2 style={{ marginBottom: '0.5rem' }}>Parent Area</h2>
          <p className="text-muted" style={{ marginBottom: '2rem', lineHeight: 1.6 }}>
            Tap the button below 3 times to unlock the parent dashboard.
          </p>
          <button className="btn btn-accent w-full" style={{ padding: '1rem', fontSize: '1.05rem' }} onClick={handleUnlock}>
            Tap to Unlock ({3 - pinClicks} left)
          </button>
          <button className="btn btn-ghost w-full" style={{ marginTop: '0.75rem' }} onClick={onBack}>
            Cancel
          </button>
        </div>
      </div>
    );
  }

  // Calculate most missed
  const missedEntries = Object.entries(missedPhonemes || {}).sort((a, b) => b[1] - a[1]);
  const hasMissed = missedEntries.length > 0;

  return (
    <div className="screen">
      <div className="screen-header flex items-center justify-between">
        <div className="flex items-center gap-sm">
          <button className="btn btn-ghost p-2" onClick={onBack} aria-label="Go back">
            <ArrowLeft size={24} />
          </button>
          {/* <h2 className="flex items-center gap-sm mb-0" style={{ color: 'var(--indigo-700)' }}>
            <ShieldCheck size={24} /> Parent Dashboard
          </h2> */}
        </div>
      </div>

      <div className="screen-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {/* Progress Overview */}
        <div className="card">
          <h3 className="flex items-center gap-sm mb-4" style={{ fontSize: '1rem' }}>
            <Activity size={20} style={{ color: 'var(--color-primary)' }} /> Overview
          </h3>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <div style={{
              flex: 1, textAlign: 'center', padding: '1rem', borderRadius: 'var(--radius-lg)',
              background: 'var(--green-50)', border: '1px solid var(--green-200)'
            }}>
              <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--green-700)' }}>{stats.words || 0}</div>
              <div className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--green-800)' }}>Words Built</div>
            </div>
            <div style={{
              flex: 1, textAlign: 'center', padding: '1rem', borderRadius: 'var(--radius-lg)',
              background: 'var(--indigo-50)', border: '1px solid var(--indigo-200)'
            }}>
              <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--indigo-700)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem' }}>
                <Star size={20} /> {stats.stars || 0}
              </div>
              <div className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--indigo-800)' }}>Total Stars</div>
            </div>
          </div>
        </div>

        {/* Struggle Areas */}
        <div className="card" style={{ borderColor: hasMissed ? 'var(--amber-200)' : 'var(--border-light)' }}>
          <h3 className="flex items-center gap-sm mb-4" style={{ fontSize: '1rem' }}>
            <AlertTriangle size={20} style={{ color: hasMissed ? 'var(--amber-500)' : 'var(--text-muted)' }} />
            Practice Areas
          </h3>

          {!hasMissed ? (
            <p className="text-muted text-sm italic">Not enough data yet. Let your child play more Word Forge!</p>
          ) : (
            <div>
              <p className="text-sm" style={{ color: 'var(--text-secondary)', marginBottom: '1rem', lineHeight: 1.6 }}>
                These are the letters your child frequently misses when spelling:
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1rem' }}>
                {missedEntries.slice(0, 5).map(([letter, count]) => (
                  <div key={letter} style={{
                    display: 'flex', alignItems: 'center', gap: '0.25rem',
                    padding: '0.35rem 0.75rem',
                    background: 'var(--amber-100)', color: '#92400e',
                    fontWeight: 700, borderRadius: '9999px',
                    border: '1px solid var(--amber-200)',
                    fontSize: '0.9rem',
                  }}>
                    {letter} <span style={{ fontSize: '0.75rem', opacity: 0.7 }}>({count}×)</span>
                  </div>
                ))}
              </div>
              <div style={{
                padding: '0.75rem 1rem',
                background: 'var(--amber-50)', color: '#78350f',
                fontSize: '0.85rem', borderRadius: 'var(--radius-md)',
                borderLeft: '4px solid var(--amber-500)',
                lineHeight: 1.6,
                display: 'flex', gap: '0.5rem', alignItems: 'flex-start',
              }}>
                <Lightbulb size={18} style={{ flexShrink: 0, marginTop: '0.1rem' }} />
                <span><strong>Parent Tip:</strong> Go to the <em>Phonics Lab</em> and practice the sounds for these specific letters together!</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
