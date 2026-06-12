import React from 'react';
import { Settings as SettingsIcon, Type, ArrowLeft } from 'lucide-react';

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

      <div className="screen-body">
        <div className="card">
          <div className="flex justify-between items-center">
            <div>
              <div className="flex items-center gap-sm font-bold text-lg">
                <Type size={20} className="text-primary" />
                Dyslexia-Friendly Mode
              </div>
              <p className="text-sm text-muted mt-1">
                Improves readability with a special font and increased letter spacing.
              </p>
            </div>
            
            <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
              <div style={{
                width: '50px',
                height: '28px',
                background: settings.dyslexiaMode ? 'var(--color-primary)' : 'var(--border-medium)',
                borderRadius: '20px',
                position: 'relative',
                transition: 'background 0.3s'
              }}>
                <div style={{
                  width: '24px',
                  height: '24px',
                  background: 'white',
                  borderRadius: '50%',
                  position: 'absolute',
                  top: '2px',
                  left: settings.dyslexiaMode ? '24px' : '2px',
                  transition: 'left 0.3s',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
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
      </div>
    </div>
  );
}
