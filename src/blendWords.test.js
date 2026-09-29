import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import { BLEND_WORDS, picturePath } from './blendWords';
import { clipPathFor } from './letterSounds';

describe('blend words', () => {
  it('spells each word exactly with its sounds', () => {
    for (const w of BLEND_WORDS) expect(w.sounds.join(''), w.word).toBe(w.word);
  });
  it('has a recording for every sound, in the word\'s voice', () => {
    for (const w of BLEND_WORDS) for (const s of w.sounds) {
      const clip = clipPathFor(s, w.voice);
      expect(clip, `${w.word}/${s}`).toBeTruthy();
      expect(fs.existsSync(`public/${clip}`), clip).toBe(true);
      if (w.voice === 'native' && s.length === 1) expect(clip).toMatch(/\/native\//);
    }
  });
  it('has a picture file for every word', () => {
    for (const w of BLEND_WORDS) expect(fs.existsSync(`public/${picturePath(w.picture)}`), w.word).toBe(true);
  });
  it('has at least 3 words in every level, so there are always 3 choices', () => {
    for (const level of [1, 2, 3]) expect(BLEND_WORDS.filter((w) => w.level === level).length).toBeGreaterThanOrEqual(3);
  });
  it('lists each word once', () => {
    const words = BLEND_WORDS.map((w) => w.word);
    expect(new Set(words).size).toBe(words.length);
  });
});
