import React, { useState } from 'react';
import { ArrowLeft, Lock, ShieldCheck, Activity, Clock, AlertTriangle } from 'lucide-react';

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
      <div className="screen flex-col items-center justify-center text-center" style={{ minHeight: '100vh', padding: '2rem' }}>
        <div className="card w-full animate-fade-in" style={{ maxWidth: '350px', margin: '0 auto' }}>
          <Lock size={64} className="text-indigo-500 mx-auto mb-4" />
          <h2 className="mb-2">Parent Area</h2>
          <p className="text-muted text-sm mb-6">
            Tap the button below 3 times to unlock the parent dashboard.
          </p>
          <button className="btn btn-primary w-full btn-lg" onClick={handleUnlock}>
            Tap to Unlock ({3 - pinClicks} left)
          </button>
          <button className="btn btn-ghost w-full mt-4" onClick={onBack}>
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
          <h2 className="flex items-center gap-sm mb-0 text-indigo-700">
            <ShieldCheck size={24} /> Parent Dashboard
          </h2>
        </div>
      </div>

      <div className="screen-body flex-col gap-lg">
        {/* Progress Overview */}
        <div className="card">
          <h3 className="flex items-center gap-sm mb-4"><Activity size={20} className="text-primary"/> Overview</h3>
          <div className="flex gap-md text-center">
            <div className="flex-1 bg-green-50 p-3 rounded-lg" style={{ borderRadius: '12px' }}>
              <div className="text-2xl font-bold text-green-700">{stats.words || 0}</div>
              <div className="text-xs text-green-800 font-bold uppercase tracking-wider">Words Built</div>
            </div>
            <div className="flex-1 p-3 rounded-lg" style={{ background: 'var(--indigo-50)', borderRadius: '12px' }}>
              <div className="text-2xl font-bold text-indigo-700">{stats.stars || 0}</div>
              <div className="text-xs text-indigo-800 font-bold uppercase tracking-wider">Total Stars</div>
            </div>
          </div>
        </div>

        {/* Struggle Areas */}
        <div className="card" style={{ borderColor: hasMissed ? 'var(--amber-300)' : 'var(--border-light)' }}>
          <h3 className="flex items-center gap-sm mb-4">
            <AlertTriangle size={20} className={hasMissed ? "text-amber-500" : "text-muted"}/> 
            Areas for Practice
          </h3>
          
          {!hasMissed ? (
            <p className="text-muted text-sm italic">Not enough data yet. Let your child play more Word Forge!</p>
          ) : (
            <div>
              <p className="text-sm text-secondary mb-4">
                These are the letters or sounds your child frequently misses when spelling:
              </p>
              <div className="flex flex-wrap gap-sm">
                {missedEntries.slice(0, 5).map(([letter, count]) => (
                  <div key={letter} className="flex items-center gap-xs px-3 py-1 bg-amber-100 text-amber-800 font-bold rounded-full" style={{ border: '1px solid var(--amber-300)' }}>
                    {letter} <span className="text-xs opacity-70">({count}x)</span>
                  </div>
                ))}
              </div>
              <div className="mt-4 p-3 bg-amber-50 text-amber-900 text-sm rounded-md" style={{ borderLeft: '4px solid var(--amber-500)' }}>
                <strong>Parent Tip:</strong> Go to the <em>Phonics Lab</em> and practice the sounds for these specific letters together!
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
