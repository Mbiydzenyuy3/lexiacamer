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
    <div className="screen flex items-center justify-center" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      {step === 3 && <Confetti active={true} />}
      
      <div className="card w-full animate-fade-in" style={{ maxWidth: '480px', margin: 'auto', textAlign: 'center', padding: '3rem 2rem', boxShadow: 'var(--shadow-xl)' }}>
        
        {step === 1 && (
          <div className="animate-fade-in">
            <User size={80} className="text-primary mx-auto mb-6" />
            <h2 className="mb-2 text-2xl">What is your name?</h2>
            <p className="text-muted text-lg mb-8">Let's get you set up!</p>
            
            <input 
              type="text" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              className="w-full p-4 mb-8 transition-all"
              style={{ 
                fontSize: '1.25rem', 
                borderRadius: 'var(--radius-xl)', 
                border: '3px solid var(--border-medium)', 
                background: 'var(--bg-body)',
                textAlign: 'center',
                outline: 'none',
                boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = 'var(--color-primary)';
                e.target.style.boxShadow = '0 0 0 4px var(--green-100)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = 'var(--border-medium)';
                e.target.style.boxShadow = 'inset 0 2px 4px rgba(0,0,0,0.02)';
              }}
              onKeyDown={(e) => e.key === 'Enter' && handleNext()}
              autoFocus
            />
            
            <button 
              className="btn btn-primary w-full btn-lg mt-2 mb-2"
              style={{ padding: '1.25rem' }}
              onClick={handleNext}
              disabled={!name.trim()}
            >
              Next <ChevronRight size={24} />
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="animate-fade-in">
            <h2 className="mb-2 text-2xl">Choose your Avatar</h2>
            <p className="text-muted text-lg mb-8">Who will be your learning buddy?</p>
            
            <div className="flex flex-wrap justify-center gap-lg mb-10">
              {avatars.map((a) => {
                const Icon = a.icon;
                const isSelected = avatar === a.id;
                return (
                  <button
                    key={a.id}
                    className="flex flex-col items-center justify-center gap-sm"
                    onClick={() => setAvatar(a.id)}
                    style={{
                      width: '110px',
                      height: '120px',
                      borderRadius: 'var(--radius-xl)',
                      border: `3px solid ${isSelected ? a.color : 'var(--border-light)'}`,
                      background: isSelected ? 'var(--bg-card)' : 'var(--bg-body)',
                      boxShadow: isSelected ? `0 8px 16px ${a.color}30` : 'none',
                      transform: isSelected ? 'scale(1.05)' : 'scale(1)',
                      transition: 'all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)'
                    }}
                  >
                    <Icon size={48} color={isSelected ? a.color : 'var(--text-muted)'} />
                    <span className="text-sm font-bold mt-2" style={{ color: isSelected ? a.color : 'var(--text-muted)' }}>{a.label}</span>
                  </button>
                );
              })}
            </div>

            <button 
              className="btn btn-primary w-full btn-lg mt-2 mb-2" 
              style={{ padding: '1.25rem' }}
              onClick={handleNext}
            >
              Pick Avatar <ChevronRight size={24} />
            </button>
          </div>
        )}

        {step === 3 && (
          <div className="animate-fade-in">
            <CheckCircle2 size={96} className="text-success mx-auto mb-6" />
            <h2 className="mb-2 text-3xl">Welcome, {name}!</h2>
            <p className="text-muted text-lg mb-10">Are you ready to learn and have fun?</p>
            <button 
              className="btn btn-primary btn-lg w-full mt-2 mb-2" 
              style={{ padding: '1.25rem' }}
              onClick={handleNext}
            >
              Let's Go!
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
