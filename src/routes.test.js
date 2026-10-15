import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';

// vercel.json is what stands between a link and a 404. The app's page
// addresses (/, /invite/<token>, the old /early-tester link) must all serve
// index.html; a missing FILE must stay a 404, or the offline cache would store
// the HTML page as if it were an audio clip.
const { rewrites } = JSON.parse(readFileSync('vercel.json', 'utf8'));
const toRegExp = (source) => new RegExp(`^${source}$`);
const served = (path) => rewrites.some((r) => r.destination === '/index.html' && toRegExp(r.source).test(path));

describe('vercel rewrites', () => {
  it('serve the app at every page address', () => {
    for (const p of ['/invite/abc_DEF-123', '/early-tester', '/early-tester/', '/anything']) {
      expect(served(p), p).toBe(true);
    }
  });

  it('leave a missing file as a real 404', () => {
    for (const p of ['/audio/words/eto.mp3', '/pictures/none.svg', '/landing/x.webp']) {
      expect(served(p), p).toBe(false);
    }
  });
});
