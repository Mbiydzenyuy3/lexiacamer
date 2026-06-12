import React, { useState } from 'react';
import { User, Cat, Dog, Bird, Snail, ChevronRight, CheckCircle2 } from 'lucide-react';
import Confetti from './Confetti';

const avatars = [
  { id: 'lion', icon: Cat, color: 'var(--amber-500)', label: 'Lion' },
  { id: 'parrot', icon: Bird, color: 'var(--sky-500)', label: 'Parrot' },
  { id: 'tortoise', icon: Snail, color: 'var(--green-600)', label: 'Tortoise' },
  { id: 'dog', icon: Dog, color: 'var(--indigo-500)', label: 'Dog' }
];

export default function Onboarding({ t, onComplete }) {
  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [avatar, setAvatar] = useState(avatars[0].id);

  const handleNext = () => {
    if (step === 1 && name.trim()) {
      setStep(2);
    } else if (step === 2) {
      setStep(3);
    } else if (step === 3) {
      onComplete({ name: name.trim(), avatar });
    }
  };

  return (
    <div className="screen flex-col items-center justify-center" style={{ minHeight: '100vh', padding: '2rem' }}>
      {step === 3 && <Confetti active={true} />}
      
      <div className="card w-full animate-fade-in" style={{ maxWidth: '400px', textAlign: 'center' }}>
        
        {step === 1 && (
          <div className="animate-fade-in">
            <User size={64} className="text-primary mx-auto mb-4" />
            <h2 className="mb-2">What is your name?</h2>
            <p className="text-muted text-sm mb-4">Let's get you set up!</p>
            <input 
              type="text" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              className="w-full p-3 mb-4"
              style={{ fontSize: '1.2rem', borderRadius: '8px', border: '2px solid var(--border-medium)', textAlign: 'center' }}
              onKeyDown={(e) => e.key === 'Enter' && handleNext()}
              autoFocus
            />
            <button 
              className="btn btn-primary w-full"
              onClick={handleNext}
              disabled={!name.trim()}
            >
              Next <ChevronRight size={20} />
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="animate-fade-in">
            <h2 className="mb-2">Choose your Avatar</h2>
            <p className="text-muted text-sm mb-4">Who will be your learning buddy?</p>
            
            <div className="flex flex-wrap justify-center gap-md mb-6">
              {avatars.map((a) => {
                const Icon = a.icon;
                const isSelected = avatar === a.id;
                return (
                  <button
                    key={a.id}
                    className="flex flex-col items-center gap-sm p-3"
                    onClick={() => setAvatar(a.id)}
                    style={{
                      borderRadius: '16px',
                      border: `3px solid ${isSelected ? a.color : 'transparent'}`,
                      background: isSelected ? 'var(--green-50)' : 'transparent',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <Icon size={48} color={a.color} />
                    <span className="text-sm font-bold" style={{ color: a.color }}>{a.label}</span>
                  </button>
                );
              })}
            </div>

            <button className="btn btn-primary w-full" onClick={handleNext}>
              Pick Avatar <ChevronRight size={20} />
            </button>
          </div>
        )}

        {step === 3 && (
          <div className="animate-fade-in">
            <CheckCircle2 size={80} className="text-success mx-auto mb-4" />
            <h2 className="mb-2">Welcome, {name}!</h2>
            <p className="text-muted mb-6">Are you ready to learn and have fun?</p>
            <button className="btn btn-primary btn-lg w-full" onClick={handleNext}>
              Let's Go!
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
