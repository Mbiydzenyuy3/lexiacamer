import React, { useState } from 'react';

/**
 * Confetti celebration effect: lightweight, CSS-only particles.
 * No heavy libraries needed.
 */
const COLORS = ['#34d399', '#fbbf24', '#6366f1', '#fb7185', '#38bdf8', '#f59e0b'];

const makeParticles = () => Array.from({ length: 30 }, (_, i) => ({
  id: i,
  color: COLORS[i % COLORS.length],
  left: `${Math.random() * 100}%`,
  delay: `${Math.random() * 1.2}s`,
  size: `${6 + Math.random() * 8}px`,
  rotation: `${Math.random() * 360}deg`,
}));

export default function Confetti({ active }) {
  // Once per mount: re-randomising on every render made particles jump
  // whenever the parent re-rendered mid-animation.
  const [particles] = useState(makeParticles);
  if (!active) return null;

  return (
    <div className="celebration-container" aria-hidden="true">
      {particles.map((p) => (
        <div
          key={p.id}
          className="confetti"
          style={{
            left: p.left,
            width: p.size,
            height: p.size,
            backgroundColor: p.color,
            animationDelay: p.delay,
            transform: `rotate(${p.rotation})`,
          }}
        />
      ))}
    </div>
  );
}
