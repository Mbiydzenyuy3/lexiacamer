import React, { useState } from 'react';
import { User, ChevronRight, CheckCircle2, Sparkles } from 'lucide-react';
import Confetti from './Confetti';
import { AVATARS as avatars } from './avatars';

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

  // Step indicator dots
  const StepDots = () => (
    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', marginBottom: '2rem' }}>
      {[1, 2, 3].map(s => (
        <div key={s} style={{
          width: s === step ? '2rem' : '0.5rem',
          height: '0.5rem',
          borderRadius: '9999px',
          background: s === step ? 'var(--color-primary)' : 'var(--border-medium)',
          transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)'
        }} />
      ))}
    </div>
  );

  return (
    <div className="screen" style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: '2rem', minHeight: 'calc(100vh - 8rem)',
      background: 'linear-gradient(180deg, var(--green-50) 0%, var(--bg-body) 50%, var(--amber-50) 100%)'
    }}>
      {step === 3 && <Confetti active={true} />}

      <div className="animate-fade-in" style={{
        maxWidth: '440px', width: '100%', margin: 'auto', marginTop: '-4rem', textAlign: 'center',
        background: 'var(--bg-card)',
        borderRadius: 'var(--radius-2xl)',
        padding: '2.5rem 2rem',
        boxShadow: '0 20px 60px rgba(0,0,0,0.08), 0 1px 3px rgba(0,0,0,0.04)',
        border: '1px solid var(--border-light)',
      }}>

        <StepDots />

        {step === 1 && (
          <div className="animate-fade-in">
            <div style={{
              width: '80px', height: '80px', borderRadius: '50%', margin: '0 auto 1.5rem',
              background: 'linear-gradient(135deg, var(--green-100), var(--green-50))',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              border: '3px solid var(--green-200)',
            }}>
              <User size={40} style={{ color: 'var(--green-700)' }} />
            </div>

            <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>{t.onboardNameTitle}</h2>
            <p className="text-muted" style={{ fontSize: '1rem', marginBottom: '2rem' }}>{t.onboardNameSubtitle}</p>

            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t.onboardNamePlaceholder}
              style={{
                width: '100%',
                padding: '1rem 1.25rem',
                fontSize: '1.15rem',
                borderRadius: 'var(--radius-xl)',
                border: '2px solid var(--border-light)',
                background: 'var(--bg-body)',
                textAlign: 'center',
                outline: 'none',
                transition: 'all 0.2s ease',
                marginBottom: '2rem',
                fontFamily: 'inherit',
              }}
              onFocus={(e) => {
                e.target.style.borderColor = 'var(--color-primary)';
                e.target.style.boxShadow = '0 0 0 4px var(--green-100)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = 'var(--border-light)';
                e.target.style.boxShadow = 'none';
              }}
              onKeyDown={(e) => e.key === 'Enter' && handleNext()}
              autoFocus
            />

            <button
              className="btn btn-primary w-full"
              style={{ padding: '1rem', fontSize: '1.1rem' }}
              onClick={handleNext}
              disabled={!name.trim()}
            >
              {t.onboardContinue} <ChevronRight size={22} />
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="animate-fade-in">
            <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>{t.onboardAvatarTitle}</h2>
            <p className="text-muted" style={{ fontSize: '1rem', marginBottom: '2rem' }}>{t.onboardAvatarSubtitle}</p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '2rem' }}>
              {avatars.map((a) => {
                const Icon = a.icon;
                const isSelected = avatar === a.id;
                return (
                  <button
                    key={a.id}
                    onClick={() => setAvatar(a.id)}
                    style={{
                      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                      gap: '0.5rem',
                      padding: '1.25rem 0.75rem',
                      borderRadius: 'var(--radius-xl)',
                      border: `3px solid ${isSelected ? a.color : 'var(--border-light)'}`,
                      background: isSelected ? a.bg : 'var(--bg-body)',
                      boxShadow: isSelected ? `0 6px 20px ${a.color}25` : 'var(--shadow-xs)',
                      transform: isSelected ? 'scale(1.03)' : 'scale(1)',
                      transition: 'all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)',
                      cursor: 'pointer',
                    }}
                  >
                    <Icon size={44} color={isSelected ? a.color : 'var(--text-muted)'} strokeWidth={1.8} />
                    <span style={{
                      fontWeight: 700, fontSize: '0.85rem',
                      color: isSelected ? a.color : 'var(--text-muted)',
                    }}>{a.label}</span>
                  </button>
                );
              })}
            </div>

            <button
              className="btn btn-primary w-full"
              style={{ padding: '1rem', fontSize: '1.1rem' }}
              onClick={handleNext}
            >
              {t.onboardContinue} <ChevronRight size={22} />
            </button>
          </div>
        )}

        {step === 3 && (
          <div className="animate-fade-in">
            <div style={{
              width: '96px', height: '96px', borderRadius: '50%', margin: '0 auto 1.5rem',
              background: 'linear-gradient(135deg, var(--green-100), var(--green-200))',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <CheckCircle2 size={56} style={{ color: 'var(--green-600)' }} />
            </div>

            <h2 style={{ fontSize: '1.75rem', marginBottom: '0.5rem' }}>{t.onboardWelcome.replace('{name}', name)}</h2>
            <p className="text-muted" style={{ fontSize: '1.05rem', marginBottom: '2.5rem' }}>{t.onboardReady}</p>

            <button
              className="btn btn-primary w-full"
              style={{ padding: '1rem', fontSize: '1.1rem' }}
              onClick={handleNext}
            >
              <Sparkles size={20} /> {t.onboardLetsGo}
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
