import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { existsSync } from 'node:fs';
import Landing from './Landing';
import landing, { FACEBOOK_URL, HERO_LETTERS, BOARD_LETTERS } from './landingCopy';
import { clipPathFor } from './letterSounds';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;
let host, root, played;

beforeEach(() => {
  played = [];
  globalThis.Audio = class {
    constructor(src) { this.src = src; played.push(src); }
    addEventListener() {}
    play() { return Promise.resolve(); }
    pause() {}
  };
});
afterEach(() => { act(() => root.unmount()); host.remove(); });

const render = (onStart = vi.fn()) => {
  host = document.createElement('div'); document.body.appendChild(host); root = createRoot(host);
  act(() => root.render(<Landing onStart={onStart} />));
  return onStart;
};
const buttons = (re) => [...host.querySelectorAll('button')].filter((b) => re.test(b.textContent));

describe('Landing', () => {
  it('is a launched product: no tester signup, no prototype wording', () => {
    render();
    expect(host.textContent).not.toMatch(/early tester|prototype|not finished|testeur/i);
  });

  it('every Start button opens the app', () => {
    const onStart = render();
    const starts = buttons(/Start learning/);
    expect(starts.length).toBe(3);
    starts.forEach((b) => act(() => b.click()));
    expect(onStart).toHaveBeenCalledTimes(3);
  });

  it('switches to French', () => {
    render();
    act(() => buttons(/^FR$/)[0].click());
    expect(host.textContent).toMatch(/même sans données/);
    expect(host.querySelector('.lp').getAttribute('lang')).toBe('fr');
  });

  it('the hero letters play the recorded standard clips', () => {
    render();
    host.querySelectorAll('.lp-chip').forEach((b) => act(() => b.click()));
    expect(played).toEqual(HERO_LETTERS.map((s) => `/audio/phonics/standard/${s}.mp3`));
  });

  it('the board plays the Native clip once Native is picked', () => {
    render();
    act(() => buttons(/^Native$/)[0].click());
    act(() => host.querySelector('.lp-board-grid button').click());
    expect(played).toEqual([`/audio/phonics/native/${BOARD_LETTERS[0]}.mp3`]);
  });

  it('links to the Facebook page', () => {
    render();
    const fb = [...host.querySelectorAll('a')].filter((a) => a.href === FACEBOOK_URL);
    expect(fb.map((a) => a.textContent)).toEqual(['Visit our page on Facebook', 'Facebook page']);
  });

  it('every in-page link has a target', () => {
    render();
    [...host.querySelectorAll('a[href^="#"]')].forEach((a) => {
      expect(host.querySelector(a.getAttribute('href'))).not.toBeNull();
    });
  });
});

describe('Landing assets', () => {
  it('every clip the page plays exists, in the folder it is played from', () => {
    for (const s of HERO_LETTERS) expect(clipPathFor(s, 'standard')).toBe(`audio/phonics/standard/${s}.mp3`);
    for (const s of BOARD_LETTERS) {
      expect(clipPathFor(s, 'native')).toBe(`audio/phonics/native/${s}.mp3`);
      expect(existsSync(`public/audio/phonics/native/${s}.mp3`)).toBe(true);
    }
    for (const s of HERO_LETTERS) expect(existsSync(`public/audio/phonics/standard/${s}.mp3`)).toBe(true);
  });

  it('every image the page shows exists', () => {
    const imgs = [...landing.en.steps.map((s) => `public/landing/${s.img}.webp`),
      'public/landing/hero-640.webp', 'public/landing/hero-1024.webp', 'public/landing/hero-1920.webp'];
    imgs.forEach((p) => expect(existsSync(p)).toBe(true));
  });

  it('English and French have the same shape', () => {
    const shape = (o) => Object.fromEntries(Object.entries(o).map(([k, v]) =>
      [k, Array.isArray(v) ? v.length : typeof v]));
    expect(shape(landing.fr)).toEqual(shape(landing.en));
  });
});
