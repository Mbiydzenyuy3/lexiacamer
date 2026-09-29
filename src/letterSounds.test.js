import { describe, it, expect, vi } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { LETTER_VOICES, DEFAULT_VOICE, clipPathFor, voiceLabel, warmVoice } from './letterSounds';

describe('clipPathFor', () => {
  it('plays the standard recording by default', () => {
    expect(clipPathFor('B', 'standard')).toBe('audio/phonics/standard/b.mp3');
  });

  it('plays two-letter sounds from their own clip', () => {
    expect(clipPathFor('CH', 'standard')).toBe('audio/phonics/standard/ch.mp3');
  });

  it('plays the native recording when native is chosen', () => {
    expect(clipPathFor('b', 'native')).toBe('audio/phonics/native/b.mp3');
  });

  it('falls back to standard for a sound the native voice has no recording of', () => {
    expect(clipPathFor('NG', 'native')).toBe('audio/phonics/standard/ng.mp3');
  });

  it('uses no clip for the robot voice', () => {
    expect(clipPathFor('B', 'robot')).toBeNull();
  });

  it('treats an unknown voice (one removed in an update) as the default', () => {
    expect(clipPathFor('B', 'retired-voice')).toBe('audio/phonics/standard/b.mp3');
  });

  it('has no clip for something that is not a phonics sound', () => {
    expect(clipPathFor('7', 'standard')).toBeNull();
    expect(clipPathFor('', 'standard')).toBeNull();
  });
});

describe('voice list', () => {
  it('defaults to the standard recordings', () => {
    expect(DEFAULT_VOICE).toBe('standard');
  });

  it('has a file on disk for every sound each recorded voice claims', () => {
    // Adding a voice with a missing clip must fail here, not on a child's phone.
    for (const v of LETTER_VOICES.filter((x) => x.folder)) {
      for (const sound of v.sounds) {
        const file = path.join('public', 'audio', 'phonics', v.folder, `${sound}.mp3`);
        expect(fs.existsSync(file), file).toBe(true);
      }
    }
  });

  it('names every voice in English and French', () => {
    for (const v of LETTER_VOICES) {
      expect(voiceLabel(v, 'en')).toBeTruthy();
      expect(voiceLabel(v, 'fr')).toBeTruthy();
    }
  });

  it('only falls back to voices that exist', () => {
    const ids = LETTER_VOICES.map((v) => v.id);
    for (const v of LETTER_VOICES.filter((x) => x.fallback)) expect(ids).toContain(v.fallback);
  });
});

describe('warmVoice', () => {
  it('downloads a voice that is not saved offline by default, so it works offline next time', async () => {
    const fetch = vi.fn(async () => ({ ok: true }));
    await warmVoice('native', fetch);
    expect(fetch).toHaveBeenCalledTimes(26);
    expect(fetch.mock.calls[0][0]).toMatch(/audio\/phonics\/native\/a\.mp3$/);
  });

  it('downloads nothing for the standard voice (already saved) or the robot voice', async () => {
    const fetch = vi.fn(async () => ({ ok: true }));
    await warmVoice('standard', fetch);
    await warmVoice('robot', fetch);
    expect(fetch).not.toHaveBeenCalled();
  });

  it('never throws on a bad connection', async () => {
    const fetch = vi.fn(async () => { throw new Error('offline'); });
    await expect(warmVoice('native', fetch)).resolves.toBeUndefined();
  });
});
