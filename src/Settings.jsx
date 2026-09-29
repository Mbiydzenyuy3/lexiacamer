import React from 'react';
import { Settings as SettingsIcon, Type, ArrowLeft, Info, Volume2 } from 'lucide-react';
import { LETTER_VOICES, DEFAULT_VOICE, voiceLabel } from './letterSounds';

export default function Settings({ t, lang, settings, setSettings, onBack }) {
  const letterVoice = settings.letterVoice || DEFAULT_VOICE;
  const toggleDyslexiaMode = () => {
    setSettings(prev => ({ ...prev, dyslexiaMode: !prev.dyslexiaMode }));
  };

  return (
    <div className="screen">
      <div className="screen-header flex items-center gap-sm">
        <button className="btn btn-ghost p-2" onClick={onBack} aria-label="Go back">
          <ArrowLeft size={24} />
        </button>
        <h2 className="flex items-center gap-sm mb-0">
          <SettingsIcon size={24} /> {t.settingsTitle}
        </h2>
      </div>

      <div className="screen-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {/* Dyslexia Mode Toggle */}
        <div className="card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, fontSize: '1.05rem', marginBottom: '0.35rem' }}>
                <Type size={20} style={{ color: 'var(--color-primary)' }} />
                {t.settingsDyslexiaTitle}
              </div>
              <p className="text-sm text-muted" style={{ lineHeight: 1.5 }}>
                {t.settingsDyslexiaDesc}
              </p>
            </div>
            
            <button
              type="button"
              role="switch"
              aria-checked={settings.dyslexiaMode}
              aria-label="Dyslexia-friendly mode"
              onClick={toggleDyslexiaMode}
              className="switch"
              style={{ flexShrink: 0, padding: 0, borderRadius: '15px', cursor: 'pointer' }}
            >
              <div style={{
                width: '52px',
                height: '30px',
                background: settings.dyslexiaMode ? 'var(--color-primary)' : 'var(--border-medium)',
                borderRadius: '15px',
                position: 'relative',
                transition: 'background 0.3s ease',
                boxShadow: settings.dyslexiaMode ? '0 2px 8px rgba(5,150,105,0.3)' : 'inset 0 1px 3px rgba(0,0,0,0.1)',
              }}>
                <div style={{
                  width: '26px',
                  height: '26px',
                  background: 'white',
                  borderRadius: '50%',
                  position: 'absolute',
                  top: '2px',
                  left: settings.dyslexiaMode ? '24px' : '2px',
                  transition: 'left 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.15)'
                }} />
              </div>
            </button>
          </div>
        </div>

        {/* Letter sounds: which voice says each letter */}
        <div className="card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, fontSize: '1.05rem', marginBottom: '0.35rem' }}>
            <Volume2 size={20} style={{ color: 'var(--color-primary)' }} />
            <span id="letter-voice-title">{t.settingsVoiceTitle}</span>
          </div>
          <p className="text-sm text-muted" style={{ lineHeight: 1.5, marginBottom: '0.75rem' }}>
            {t.settingsVoiceDesc}
          </p>
          <div role="radiogroup" aria-labelledby="letter-voice-title" className="voice-options">
            {LETTER_VOICES.map((v) => (
              <button
                key={v.id}
                type="button"
                role="radio"
                aria-checked={letterVoice === v.id}
                className={`voice-option${letterVoice === v.id ? ' is-selected' : ''}`}
                onClick={() => setSettings(prev => ({ ...prev, letterVoice: v.id }))}
              >
                {voiceLabel(v, lang)}
              </button>
            ))}
          </div>
        </div>

        {/* Info Card */}
        <div style={{
          display: 'flex', gap: '0.75rem', alignItems: 'flex-start',
          padding: '1rem',
          borderRadius: 'var(--radius-lg)',
          background: 'var(--indigo-50)',
          border: '1px solid var(--indigo-200)',
          color: 'var(--indigo-700)',
          fontSize: '0.85rem',
          lineHeight: 1.6,
        }}>
          <Info size={20} style={{ flexShrink: 0, marginTop: '0.1rem' }} />
          <div>
            <strong style={{ display: 'block', marginBottom: '0.25rem' }}>{t.settingsAboutTitle}</strong>
            {t.settingsAboutDesc}
          </div>
        </div>
      </div>
    </div>
  );
}
