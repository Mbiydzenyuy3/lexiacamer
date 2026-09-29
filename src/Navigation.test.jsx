import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { PICTURE_CREDIT } from './blendWords';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;
let host, root;
beforeEach(() => {
  localStorage.clear();
  localStorage.setItem('lexia_state_v2', JSON.stringify({ user: { name: 'Amina', avatar: 'parrot' } }));
  host = document.createElement('div'); document.body.appendChild(host); root = createRoot(host);
  act(() => root.render(<App />));
});
afterEach(() => { act(() => root.unmount()); host.remove(); });

const click = (el) => act(() => el.click());

describe('home and navigation', () => {
  it('has no Settings card on the home screen', () => {
    const cards = [...host.querySelectorAll('.card')].map((c) => c.textContent);
    expect(cards.some((c) => /Dyslexia mode/.test(c))).toBe(false);
  });

  it('has a Sound It Out card that says what it does, and it opens the game', () => {
    const card = [...host.querySelectorAll('.card')].find((c) => /Sound It Out/.test(c.textContent));
    expect(card.textContent).toMatch(/Tap the letters, hear the sounds, find the picture/);
    click(card);
    expect(host.querySelector('.blend-tile')).not.toBeNull();
  });

  it('opens Settings from a gear in the top bar', () => {
    const gear = host.querySelector('.top-bar [aria-label="Settings"]');
    expect(gear).not.toBeNull();
    click(gear);
    expect(host.textContent).toMatch(/Letter sounds/);
    expect(host.textContent).toContain(PICTURE_CREDIT);
  });

  it('opens Sound It Out from the bottom menu', () => {
    const item = host.querySelector('#nav-blend');
    expect(item.textContent).toMatch(/Sound out/);
    click(item);
    expect(host.querySelector('.blend-tile')).not.toBeNull();
    expect(item.className).toMatch(/active/);
  });
});
