import React from 'react';
import { Settings as SettingsIcon, Type, ArrowLeft, Info } from 'lucide-react';

export default function Settings({ settings, setSettings, onBack }) {
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
          <SettingsIcon size={24} /> Settings
        </h2>
      </div>

      <div className="screen-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {/* Dyslexia Mode Toggle */}
        <div className="card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, fontSize: '1.05rem', marginBottom: '0.35rem' }}>
                <Type size={20} style={{ color: 'var(--color-primary)' }} />
                Dyslexia-Friendly Mode
              </div>
              <p className="text-sm text-muted" style={{ lineHeight: 1.5 }}>
                Uses the Comic Neue font and increased letter spacing for easier reading.
              </p>
            </div>
            
            <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', flexShrink: 0 }}>
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
              <input 
                type="checkbox" 
                checked={settings.dyslexiaMode} 
                onChange={toggleDyslexiaMode} 
                style={{ display: 'none' }} 
              />
            </label>
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
            <strong style={{ display: 'block', marginBottom: '0.25rem' }}>About LexiaCamer</strong>
            Helping Cameroon's children master reading, one sound at a time. 
            This app is 100% free and works offline!
          </div>
        </div>
      </div>
    </div>
  );
}
