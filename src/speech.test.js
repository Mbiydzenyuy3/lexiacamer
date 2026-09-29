import { describe, it, expect, vi, beforeEach } from 'vitest';

// The browser speech API and Audio do not exist in jsdom: stand them in.
const speak = vi.fn();
window.speechSynthesis = { speak, cancel: vi.fn(), getVoices: () => [], onvoiceschanged: null };
globalThis.SpeechSynthesisUtterance = function Utterance(text) { this.text = text; };
const audios = [];
globalThis.Audio = class {
  constructor(src) { this.src = src; this.listeners = {}; audios.push(this); }
  addEventListener(event, fn) { this.listeners[event] = fn; }
  play() { return Promise.resolve(); }
  pause() {}
};

const { default: speechEngine } = await import('./speech');

beforeEach(() => { speak.mockClear(); audios.length = 0; speechEngine._missingAudio.clear(); });

describe('speakLetter', () => {
  it('plays the chosen voice\'s recording, not the robot', () => {
    speechEngine.setLetterVoice('native');
    speechEngine.speakLetter('B', 'en');
    expect(audios.at(-1).src).toMatch(/audio\/phonics\/native\/b\.mp3$/);
    expect(speak).not.toHaveBeenCalled();
  });

  it('plays the English recordings in French mode too: the app teaches English sounds', () => {
    speechEngine.setLetterVoice('standard');
    speechEngine.speakLetter('B', 'fr');
    expect(audios.at(-1).src).toMatch(/audio\/phonics\/standard\/b\.mp3$/);
  });

  it('speaks with the robot voice, loading no file, when robot is chosen', () => {
    speechEngine.setLetterVoice('robot');
    speechEngine.speakLetter('B', 'en');
    expect(audios).toHaveLength(0);
    expect(speak).toHaveBeenCalledTimes(1);
  });

  it('falls back to the robot voice if a recording fails to load', () => {
    speechEngine.setLetterVoice('standard');
    speechEngine.speakLetter('Q', 'en');
    audios.at(-1).listeners.error();
    expect(speak).toHaveBeenCalledTimes(1);
  });
});

describe('words, praise and sequences', () => {
  it('plays a word from its clip', () => {
    speechEngine.setLetterVoice('standard');
    speechEngine.speakWord('SUN', 'en');
    expect(audios.at(-1).src).toMatch(/audio\/words\/sun\.mp3$/);
  });
  it('says a word with the robot when its clip is missing', () => {
    speechEngine.speakWord('ZEBRA', 'en');
    audios.at(-1).listeners.error();
    expect(speak).toHaveBeenCalledTimes(1);
  });
  it('uses the robot for words in Robot mode', () => {
    speechEngine.setLetterVoice('robot');
    speechEngine.speakWord('SUN', 'en');
    expect(audios).toHaveLength(0);
    expect(speak).toHaveBeenCalledTimes(1);
  });
  it('plays English praise from a clip', () => {
    speechEngine.setLetterVoice('standard');
    speechEngine.speakCelebration('en');
    expect(audios.at(-1).src).toMatch(/audio\/words\/praise-[a-z-]+\.mp3$/);
  });
  it('keeps French praise on the robot until French clips exist', () => {
    speechEngine.speakCelebration('fr');
    expect(audios).toHaveLength(0);
    expect(speak).toHaveBeenCalledTimes(1);
  });
  it('plays native letter sounds for a native word, even with Standard chosen', () => {
    speechEngine.setLetterVoice('standard');
    speechEngine.speakLetter('u', 'en', 'native');
    expect(audios.at(-1).src).toMatch(/audio\/phonics\/native\/u\.mp3$/);
  });
  it('ignores the native override in Robot mode', () => {
    speechEngine.setLetterVoice('robot');
    speechEngine.speakLetter('u', 'en', 'native');
    expect(audios).toHaveLength(0);
  });
  it('plays a sequence in order, one after the other', () => {
    speechEngine.setLetterVoice('standard');
    const seen = [];
    speechEngine.speakSounds(['s', 'u', 'n'], 'standard', { gapMs: 0, onEach: (i) => seen.push(i) });
    expect(audios.at(-1).src).toMatch(/\/s\.mp3$/);
    audios.at(-1).listeners.ended();
    expect(audios.at(-1).src).toMatch(/\/u\.mp3$/);
    expect(seen).toEqual([0, 1]);
  });
  it('stops an old sequence when a new one starts', () => {
    const cancel = speechEngine.speakSounds(['s', 'u'], 'standard', { gapMs: 0 });
    speechEngine.speakSounds(['c', 'a'], 'standard', { gapMs: 0 });
    const count = audios.length;
    cancel();
    expect(audios).toHaveLength(count);
  });
});
