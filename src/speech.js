/**
 * Lexia Cameroon - Speech Synthesis Utility
 * Uses the Web Speech API for offline-capable audio feedback.
 * Optimised for low-end devices with graceful fallbacks.
 */

import { clipPathFor, DEFAULT_VOICE } from './letterSounds';

// Clip names for the English praise phrases, in the same order as the phrases.
const PRAISE_KEYS = ['great-job', 'amazing', 'well-done', 'superstar'];

class SpeechEngine {
  constructor() {
    this.synth = window.speechSynthesis || null;
    this.voices = [];
    this.ready = false;

    // Recorded-clip playback state (see speakLetter).
    this._currentAudio = null;
    this._missingAudio = new Set(); // clip paths we've confirmed have no file
    this.letterVoice = DEFAULT_VOICE;   // which voice plays letter sounds (Settings)
    this._seq = 0;                      // bumps to cancel a running sound sequence

    if (this.synth) {
      this._loadVoices();
      // Some browsers fire voiceschanged asynchronously
      this.synth.onvoiceschanged = () => this._loadVoices();
    }
  }

  _loadVoices() {
    this.voices = this.synth?.getVoices() || [];
    this.ready = this.voices.length > 0;
  }

  /**
   * Pick the best voice for a given language.
   * Prefers local/offline voices for PWA resilience.
   */
  _getVoice(lang = 'en') {
    const langCode = lang === 'fr' ? 'fr' : 'en';
    const candidates = this.voices.filter(v =>
      v.lang.startsWith(langCode)
    );
    const local = candidates.find(v => v.localService);
    return local || candidates[0] || null;
  }

  /**
   * Speak a string aloud.
   */
  speak(text, lang = 'en', rate = 0.9, pitch = 1.1) {
    if (!this.synth) return;
    this.synth.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    const voice = this._getVoice(lang);
    if (voice) utterance.voice = voice;

    utterance.lang = lang === 'fr' ? 'fr-FR' : 'en-US';
    utterance.rate = rate;
    utterance.pitch = pitch;
    utterance.volume = 1;

    this.synth.speak(utterance);
    return utterance;
  }

  /**
   * Phoneme map: converts a letter / sound key into a TTS-safe string
   * that the browser engine will pronounce as a SINGLE unified sound.
   *
   * Design rules used:
   *  1. Vowels: standard-English SHORT vowel strings ("ah","eh","ih","aw","uh")
   *     that TTS reads as one short vowel sound, not the letter name.
   *  2. Consonants: consonant + schwa CV syllable ("buh","kuh") - browsers
   *     read these as one syllable because they match English syllable patterns.
   *     Sonorants & fricatives use repeated letters ("mmm","sss","zzz").
   *  3. Common blends: phonetic syllable form ("chuh","shh","thuh").
   *  4. Cameroonian prenasalized blends (NG/ND/MB/NK): word-initial /ŋ/,
   *     prenasalized /nd/, /mb/, /ŋk/ do NOT exist in English or French,
   *     so no abstract string can produce them reliably. Instead PhonicsLab
   *     passes the example word directly (e.g. "Ngong", "Ndolé") and this
   *     map's fallback speaks it as a whole word at slow rate: which is
   *     exactly how phonics teachers introduce such sounds in context.
   *  5. NO HYPHENS: hyphens tell TTS to split into separate sounds.
   */
  get _phonemeMap() {
    return {
      en: {
        // ── Vowels ────────────────────────────────────────────────────────
        // Standard-English SHORT vowel sounds: the ones mainstream phonics
        // (Jolly Phonics etc.) teaches first, understood by any English speaker.
        // We need TTS strings that produce ONE short vowel, not the letter name.
        A: 'ah',   // short a → /æ/  (as in "cat", "apple")
        E: 'eh',   // short e → /ɛ/  (as in "bed", "egg")
        I: 'ih',   // short i → /ɪ/  (as in "sit", "igloo")   - not the long "ee"
        O: 'aw',   // short o → /ɒ/  (as in "hot", "octopus") - not the long "oh"
        U: 'uh',   // short u → /ʌ/  (as in "cup", "umbrella") - not the long "oo"

        // ── Single consonants ─────────────────────────────────────────────
        // CV syllable (consonant + schwa). No hyphens. TTS reads as one unit.
        B: 'buh',   // stop  /b/
        C: 'kuh',   // stop  /k/  (hard C as in "Cameroon")
        D: 'duh',   // stop  /d/  (also a known English interjection)
        F: 'fuh',   // frica /f/
        G: 'guh',   // stop  /ɡ/  (hard G as in "Garoua")
        H: 'huh',   // aspir /h/  (also a known English interjection)
        J: 'juh',   // affri /dʒ/
        K: 'kuh',   // stop  /k/
        L: 'luh',   // lat   /l/
        M: 'mmm',   // nasal /m/  - hum; TTS reads repeated M as nasal hold
        N: 'nnn',   // nasal /n/  - hum; TTS reads repeated N as nasal hold
        P: 'puh',   // stop  /p/
        Q: 'kwuh',  // /kw/  cluster
        R: 'rrr',   // rhoti /r/  - pirate sound; TTS holds the rhotic
        S: 'sss',   // frica /s/  - snake sound; TTS holds the fricative
        T: 'tuh',   // stop  /t/
        V: 'vuh',   // frica /v/
        W: 'wuh',   // glide /w/
        X: 'ksss',  // /ks/  - TTS reads as one hissing cluster
        Y: 'yuh',   // glide /j/
        Z: 'zzz',   // frica /z/  - buzzing sound; TTS holds fricative

        // ── Common digraphs & blends ──────────────────────────────────────
        // Each produces ONE syllable/phoneme, no hyphens.
        CH: 'chuh',  // /tʃ/ add schwa so TTS reads as one syllable (Achu, Bamunka)
        SH: 'shh',   // /ʃ/  the "silence" interjection - TTS knows this as one sound
        TH: 'thuh',  // /θ/  unvoiced dental fricative + schwa (as in "thin")
        PH: 'fuh',   // /f/  PH = F sound

        // ── Cameroonian prenasalized blends ───────────────────────────────
        // /ŋ/, /nd/, /mb/, /ŋk/ word-initially do NOT exist in English.
        // PhonicsLab passes the full example word (e.g. "Ngong") for these
        // tiles, so the keys below are used only when WordForge spells words
        // containing these clusters letter by letter.
        NG: 'ngoh',  // closest single-syllable approximation for /ŋ/
        ND: 'ndoh',  // /nd/ onset approximation
        MB: 'mboh',  // /mb/ onset approximation
        NK: 'nkoh',  // /ŋk/ onset approximation
      },

      fr: {
        // ── Voyelles ──────────────────────────────────────────────────────
        // French TTS pronounces bare single vowel letters as pure cardinal
        // vowels: exactly what Cameroonian French phonics needs.
        A: 'a',    // /a/
        E: 'é',    // /e/
        I: 'i',    // /i/
        O: 'o',    // /o/
        U: 'u',    // /y/  (French rounded front vowel)

        // ── Consonnes ─────────────────────────────────────────────────────
        // Consonne + schwa en français. Pas de tirets.
        B: 'beu',   // /b/
        C: 'keu',   // /k/  (C dur)
        D: 'deu',   // /d/
        F: 'feu',   // /f/  - "feu" est un mot français, TTS le prononce /fø/ ✓
        G: 'gue',   // /ɡ/  - "gue" muet, TTS produit /ɡ/ ✓
        H: 'ach',   // H est muet en français: son d'aspiration
        J: 'jeu',   // /ʒ/  - "jeu" est un mot français, TTS produit /ʒø/ ✓
        K: 'ka',    // /k/  - syllabe simple
        L: 'el',    // /l/  - nom de la lettre en français ✓
        M: 'em',    // /m/  - nom de la lettre en français ✓
        N: 'neu',   // /n/  - "neu" (et NON "en" qui est une voyelle nasale /ɑ̃/)
        P: 'peu',   // /p/  - "peu" est un mot français
        Q: 'cu',    // /k/
        R: 'air',   // /ʁ/  - "air" en français prononce le R uvulaire /ʁ/ ✓
        S: 'ess',   // /s/
        T: 'teu',   // /t/
        V: 'veu',   // /v/
        W: 'oua',   // /w/  - son de W dans "oui", "week" en français
        X: 'iks',   // /ks/ - nom de la lettre ✓
        Y: 'igrek', // /i/  - "i grec", nom officiel en français
        Z: 'zèd',   // /z/  - nom de la lettre ✓

        // ── Combinaisons ─────────────────────────────────────────────────
        CH: 'cheu',    // /ʃ/ comme "cheval" - une seule syllabe
        SH: 'cheu',    // /ʃ/ même son en contexte camerounais
        TH: 'teuach',  // /t/ + /ʃ/ - sans tiret pour rester une unité
        PH: 'feu',     // /f/ - PH fait le son F

        // Consonnes prénasalisées camerounaises: même logique qu'en anglais
        NG: 'ngoh',
        ND: 'ndoh',
        MB: 'mboh',
        NK: 'nkoh',
      },
    };
  }

  /** Choose the voice for letter sounds (an id from src/letterSounds.js). */
  setLetterVoice(voiceId) {
    this.letterVoice = voiceId || DEFAULT_VOICE;
  }

  /**
   * Play a recorded clip. `onFail` runs if it cannot load or play (the caller
   * falls back to the robot voice, so a tap never goes silent); `onEnded` runs
   * when it finishes. Does not cancel a running sequence: speakSounds uses it.
   */
  _playClip(path, onFail, onEnded) {
    if (this._missingAudio.has(path)) { onFail(); return; }
    this._stopAudio();
    const audio = new Audio(`${import.meta.env.BASE_URL}${path}`);
    this._currentAudio = audio;
    let done = false;
    const fail = () => { if (!done) { done = true; onFail(); } };
    // A missing file fires 'error'; remember it so we don't refetch a 404.
    audio.addEventListener('error', () => { this._missingAudio.add(path); fail(); });
    if (onEnded) audio.addEventListener('ended', onEnded);
    audio.play().then(() => { done = true; }).catch(fail);
  }

  /** The voice for a letter: Robot in Settings always wins over a word's own voice. */
  _voiceFor(override) {
    return this.letterVoice === 'robot' ? 'robot' : (override || this.letterVoice);
  }

  /** Robot voice for one letter sound, calling `done` when it finishes. */
  _speakLetterTTS(letter, lang, done) {
    const key = String(letter).trim().toUpperCase();
    const map = this._phonemeMap[lang] || this._phonemeMap.en;
    const utterance = this.speak(map[key] ?? letter, lang, 0.65, 1.2);
    if (!done) return;
    if (utterance) utterance.onend = done; else done();
  }

  /**
   * Speak a single letter's phonics SOUND.
   *
   * Plays the chosen voice's recording (src/letterSounds.js decides which
   * file, with fallbacks). `voiceOverride` lets a word ask for its own voice:
   * Sound It Out's Cameroonian words use the native sounds. The robot voice,
   * or a recording that fails to load, uses the phone's own speech.
   *
   * Callers pass the canonical letter: WordForge passes the raw char ("B"),
   * PhonicsLab passes tile.letter ("A", "CH", "NG").
   */
  speakLetter(letter, lang = 'en', voiceOverride) {
    const key = String(letter).trim().toUpperCase();
    const speakTTS = () => this._speakLetterTTS(key, lang);
    const clip = clipPathFor(key, this._voiceFor(voiceOverride));
    if (!clip) { speakTTS(); return; }
    this.stop();
    this._playClip(clip, speakTTS);
  }

  /**
   * Play letter sounds one after another ("Say it fast" in Sound It Out).
   * Each starts when the previous one ends, `gapMs` apart. Starting a new
   * sequence, or stop(), cancels this one. Returns a cancel function.
   */
  speakSounds(sounds, voiceId, { gapMs = 80, onEach, lang = 'en' } = {}) {
    this.stop();
    const token = ++this._seq;
    let i = 0;
    const next = () => {
      if (token !== this._seq || i >= sounds.length) return;
      const idx = i++;
      onEach?.(idx);
      const advance = () => {
        if (token !== this._seq) return;
        if (gapMs > 0) setTimeout(next, gapMs); else next();
      };
      const tts = () => this._speakLetterTTS(sounds[idx], lang, advance);
      const clip = clipPathFor(sounds[idx], this._voiceFor(voiceId));
      if (!clip) { tts(); return; }
      this._playClip(clip, tts, advance);
    };
    next();
    return () => { if (token === this._seq) this.stop(); };
  }

  /**
   * Speak a word: the owner's cloned-voice clip (public/audio/words/<word>.mp3)
   * when there is one, the robot voice otherwise (a new word works at once).
   */
  speakWord(word, lang = 'en') {
    const say = () => this.speak(word, lang, 0.85, 1.0);
    const key = String(word).trim().toLowerCase();
    if (this.letterVoice === 'robot' || !/^[a-z]+$/.test(key)) { say(); return; }
    this.stop();
    this._playClip(`audio/words/${key}.mp3`, say);
  }

  /**
   * Speak a celebration phrase. English praise is the owner's cloned voice;
   * French stays robot until French clips exist.
   */
  speakCelebration(lang = 'en') {
    const phrases = lang === 'fr'
      ? ['Bravo !', 'Excellent !', 'Superbe !', 'Formidable !']
      : ['Great job!', 'Amazing!', 'Well done!', 'Superstar!'];
    const i = Math.floor(Math.random() * phrases.length);
    const say = () => this.speak(phrases[i], lang, 1.0, 1.3);
    if (lang !== 'en' || this.letterVoice === 'robot') { say(); return; }
    this.stop();
    this._playClip(`audio/words/praise-${PRAISE_KEYS[i]}.mp3`, say);
  }

  /** Stop the recorded clip and the robot voice, without touching a sequence. */
  _stopAudio() {
    this.synth?.cancel();
    if (this._currentAudio) {
      this._currentAudio.pause();
      this._currentAudio = null;
    }
  }

  /** Stop all speech, any playing clip, and any running sound sequence. */
  stop() {
    this._seq += 1;
    this._stopAudio();
  }

  /** Check if speech is supported. */
  get isSupported() {
    return !!this.synth;
  }
}

// Singleton instance
const speechEngine = new SpeechEngine();
export default speechEngine;
