import { beforeEach, describe, expect, it } from 'vitest';
import { defaultState, loadState, resetProgress, saveState } from './store.js';

beforeEach(() => localStorage.clear());

describe('store', () => {
  it('returns defaults when nothing is saved', () => {
    expect(loadState()).toEqual(defaultState());
  });

  it('round-trips saved state', () => {
    const state = { ...defaultState(), lang: 'fr', stats: { words: 4, streak: 2, stars: 9 } };
    saveState(state);
    expect(loadState()).toEqual(state);
  });

  it('fills keys missing from an older saved shape', () => {
    localStorage.setItem('lexia_state', JSON.stringify({ stats: { stars: 3 } }));
    const s = loadState();
    expect(s.stats).toEqual({ words: 0, streak: 0, stars: 3 });
    expect(s.settings).toEqual({ dyslexiaMode: false });
  });

  it('falls back to defaults on corrupt storage', () => {
    localStorage.setItem('lexia_state', '{not json');
    expect(loadState()).toEqual(defaultState());
  });

  it('resetProgress clears progress only', () => {
    expect(resetProgress()).toEqual({
      stats: { words: 0, streak: 0, stars: 0 },
      unlockedStickers: [],
      missedPhonemes: {},
    });
  });

  it('defaultState returns a fresh object each call', () => {
    const a = defaultState();
    a.stats.stars = 99;
    expect(defaultState().stats.stars).toBe(0);
  });
});
