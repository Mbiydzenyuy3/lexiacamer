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
