import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import { wordData } from './i18n';
import { BLEND_WORDS } from './blendWords';

const PRAISE = ['praise-great-job', 'praise-amazing', 'praise-well-done', 'praise-superstar'];
const words = new Set([...wordData.map((w) => w.word.toLowerCase()), ...BLEND_WORDS.map((w) => w.word)]);
const clips = fs.readdirSync('public/audio/words').filter((f) => f.endsWith('.mp3')).map((f) => f.slice(0, -4));

describe('word clips', () => {
  it('only exist for real words, so a renamed word can never keep an old clip', () => {
    // okra.mp3 would still play if the word became OKRU and the clip stayed.
    for (const clip of clips) expect(words.has(clip) || PRAISE.includes(clip), clip).toBe(true);
  });

  it('cover every praise phrase the app asks for', () => {
    const speech = fs.readFileSync('src/speech.js', 'utf8');
    for (const key of PRAISE) {
      expect(speech, key).toContain(`'${key.replace('praise-', '')}'`);
      expect(clips, key).toContain(key);
    }
  });

  it('are named in lower case with no spaces, as speakWord looks them up', () => {
    for (const clip of clips) expect(clip).toMatch(/^[a-z]+(-[a-z]+)*$/);
  });
});
