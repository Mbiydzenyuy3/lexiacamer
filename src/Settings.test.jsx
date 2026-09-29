import { describe, it, expect, vi, afterEach } from 'vitest';
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import Settings from './Settings';
import i18n from './i18n';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;
let host, root;
afterEach(() => { act(() => root.unmount()); host.remove(); });

const render = (settings, setSettings = vi.fn(), lang = 'en') => {
  host = document.createElement('div'); document.body.appendChild(host); root = createRoot(host);
  act(() => root.render(<Settings t={i18n[lang]} lang={lang} settings={settings} setSettings={setSettings} onBack={() => {}} />));
  return setSettings;
};

describe('Settings: letter sounds', () => {
  it('offers the three voices, with the saved one selected', () => {
    render({ dyslexiaMode: false, letterVoice: 'standard' });
    const radios = [...host.querySelectorAll('[role="radio"]')];
    expect(radios).toHaveLength(3);
    expect(radios.filter((r) => r.getAttribute('aria-checked') === 'true').map((r) => r.textContent))
      .toEqual([expect.stringMatching(/Standard/)]);
  });

  it('saves the voice a child picks', () => {
    const setSettings = render({ dyslexiaMode: false, letterVoice: 'standard' });
    const native = [...host.querySelectorAll('[role="radio"]')].find((r) => /Native/.test(r.textContent));
    act(() => native.click());
    const update = setSettings.mock.calls[0][0];
    expect(update({ dyslexiaMode: true, letterVoice: 'standard' })).toEqual({ dyslexiaMode: true, letterVoice: 'native' });
  });

  it('is in French for a French-speaking child', () => {
    render({ dyslexiaMode: false, letterVoice: 'standard' }, vi.fn(), 'fr');
    expect(host.textContent).toMatch(/Voix robot/);
  });
});
