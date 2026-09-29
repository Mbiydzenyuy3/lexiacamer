import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';

const speech = {
  speakLetter: vi.fn(), speakSounds: vi.fn(() => () => {}), speakWord: vi.fn(),
  speakCelebration: vi.fn(), stop: vi.fn(),
};
vi.mock('./speech', () => ({ default: speech }));
const { default: BlendGame } = await import('./BlendGame');
const { default: i18n } = await import('./i18n');

globalThis.IS_REACT_ACT_ENVIRONMENT = true;
let host, root, props;
beforeEach(() => {
  localStorage.clear();
  Object.values(speech).forEach((f) => f.mockClear());
  props = { onWordCorrect: vi.fn(), onWordMissed: vi.fn(), onRoundComplete: vi.fn() };
  host = document.createElement('div'); document.body.appendChild(host); root = createRoot(host);
  act(() => root.render(<BlendGame t={i18n.en} lang="en" rng={() => 0} {...props} />));
});
afterEach(() => { act(() => root.unmount()); host.remove(); });

const tiles = () => [...host.querySelectorAll('.blend-tile')];
const currentWord = () => tiles().map((b) => b.textContent.toLowerCase()).join('');
const pictures = () => [...host.querySelectorAll('.blend-picture')];
const answer = () => pictures().find((p) => p.dataset.word === currentWord());
const wrong = () => pictures().find((p) => p.dataset.word !== currentWord());
const button = (text) => [...host.querySelectorAll('button')].find((b) => b.textContent.includes(text));

describe('Sound It Out', () => {
  it('shows the word as one tile per sound', () => {
    expect(tiles().length).toBeGreaterThanOrEqual(2);
    expect(currentWord()).toMatch(/^[a-z]+$/);
  });

  it('plays a tile\'s sound when tapped, and lights it up', () => {
    const first = tiles()[0];
    act(() => first.click());
    expect(speech.speakLetter).toHaveBeenCalledWith(first.textContent.toLowerCase(), 'en', 'standard');
    expect(first.className).toMatch(/is-lit/);
  });

  it('plays all the sounds in a row on "Say it fast"', () => {
    act(() => button('Say it fast').click());
    expect(speech.speakSounds).toHaveBeenCalledWith(
      tiles().map((b) => b.textContent.toLowerCase()), 'standard', expect.any(Object));
  });

  it('records a star and says the word when the right picture is chosen', () => {
    const word = currentWord();
    act(() => answer().click());
    expect(props.onWordCorrect).toHaveBeenCalledWith(word);
    expect(speech.speakWord).toHaveBeenCalledWith(word, 'en');
  });

  it('replays the sounds after a wrong picture, and shows the answer after two', () => {
    act(() => wrong().click());
    expect(props.onWordMissed).toHaveBeenCalledTimes(1);
    expect(speech.speakSounds).toHaveBeenCalled();
    expect(answer().className).not.toMatch(/is-hint/);
    act(() => wrong().click());
    expect(answer().className).toMatch(/is-hint/);
  });

  it('finishes a round of five and opens the next level after 4+ first-try', () => {
    for (let i = 0; i < 5; i += 1) {
      act(() => answer().click());
      act(() => button(i < 4 ? 'Next' : 'Finish').click());
    }
    expect(props.onRoundComplete).toHaveBeenCalledWith(1, 5);
    expect(JSON.parse(localStorage.getItem('lexia_blend_state')).level).toBe(2);
  });
});
