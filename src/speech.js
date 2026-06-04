/**
 * Lexia Cameroon — Speech Synthesis Utility
 * Uses the Web Speech API for offline-capable audio feedback.
 * Optimised for low-end devices with graceful fallbacks.
 */

class SpeechEngine {
  constructor() {
    this.synth = window.speechSynthesis || null;
    this.voices = [];
    this.ready = false;

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

    // Prefer local (offline-capable) voices
    const local = candidates.find(v => v.localService);
    return local || candidates[0] || null;
  }

  /**
   * Speak a string aloud.
   * @param {string} text — the text to speak
   * @param {string} lang — 'en' or 'fr'
   * @param {number} rate — playback speed (0.5 – 2.0)
   * @param {number} pitch — voice pitch (0 – 2)
   */
  speak(text, lang = 'en', rate = 0.9, pitch = 1.1) {
    if (!this.synth) return;

    // Cancel any current speech
    this.synth.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    const voice = this._getVoice(lang);
    if (voice) utterance.voice = voice;

    utterance.lang = lang === 'fr' ? 'fr-FR' : 'en-US';
    utterance.rate = rate;
    utterance.pitch = pitch;
    utterance.volume = 1;

    this.synth.speak(utterance);
  }

  /**
   * Phoneme maps — translate letters/blends into TTS-friendly phonetic
   * strings so the engine pronounces the actual SOUND, not the letter name.
   *
   * e.g. "B" → "buh"  (not "bee")
   *      "NG" → "ng-uh"  (Cameroonian nasal, e.g. Ngong, Nguemba)
   *      "ND" → "n-duh"  (e.g. Ndolé, Ndere)
   *
   * Cameroonian blends (NG, ND, MB, NK) use compound phoneme strings that
   * closely match how they are produced in Cameroonian languages and Pidgin.
   */
  get _phonemeMap() {
    return {
      en: {
        // Vowels — TTS-safe strings that produce a single unified phoneme.
        // Cameroonian vowels are pure/cardinal: A=/a:/, E=/ɛ/, I=/iː/, O=/oː/, U=/uː/
        // We use natural English interjections or double-vowel spellings that TTS
        // recognises as ONE sound rather than spelling out letter-by-letter.
        A: 'ah',   // interjection → /aː/ ✓
        E: 'eh',   // interjection → /ɛ/  ✓
        I: 'ee',   // double-vowel → /iː/ ✓ (Cameroonian I = machine, not bit)
        O: 'oh',   // interjection → /oː/ ✓
        U: 'oo',   // double-vowel → /uː/ ✓ (Cameroonian U = boot)
        // Consonants — phonetic sounds, NOT alphabet letter names
        B: 'buh', C: 'kuh', D: 'duh', F: 'fuh', G: 'guh',
        H: 'huh', J: 'juh', K: 'kuh', L: 'luh', M: 'mmm',
        N: 'nnn', P: 'puh', Q: 'kwuh',R: 'rrr', S: 'sss',
        T: 'tuh', V: 'vuh', W: 'wuh', X: 'ksss',Y: 'yuh',
        Z: 'zzz',
        // Common & Cameroonian blends
        CH: 'ch',       // as in "child"
        SH: 'sh',       // as in "shoe"
        TH: 'th',       // as in "the"
        PH: 'fuh',      // as in "phone"
        NG: 'ng-uh',    // Cameroonian nasal — Ngong, Nguemba, Ngu
        ND: 'n-duh',    // Cameroonian prefix — Ndolé, Ndem, Nde
        MB: 'm-buh',    // Cameroonian prefix — Mbang, Mbappe, Mbu
        NK: 'n-kuh',    // Cameroonian prefix — Nkongsamba, Nkam
      },
      fr: {
        // Voyelles — single letters work perfectly in French TTS; the engine
        // pronounces each as a pure cardinal vowel naturally.
        A: 'a',   // /a/  ✓
        E: 'é',   // /e/  ✓
        I: 'i',   // /i/  ✓
        O: 'o',   // /o/  ✓
        U: 'u',   // /y/  ✓ (French u)
        // Consonnes — sons phonétiques, PAS les noms de lettres
        B: 'beu', C: 'keu', D: 'deu', F: 'feu', G: 'gue',
        H: 'ach', J: 'ji',  K: 'ka',  L: 'el',  M: 'em',
        N: 'en',  P: 'peu', Q: 'cu',  R: 'air', S: 'ess',
        T: 'teu', V: 'veu', W: 'doublevé', X: 'iks', Y: 'igrek',
        Z: 'zèd',
        // Combinaisons — sons camerounais
        CH: 'ch',        // comme "cheval"
        SH: 'ch',
        TH: 'te-ach',
        PH: 'feu',
        NG: 'ng-eu',     // nasal camerounais
        ND: 'n-deu',
        MB: 'm-beu',
        NK: 'n-keu',
      },
    };
  }

  /**
   * Speak a single letter or phoneme slowly and clearly.
   * Maps the letter/blend to a phonetic string before speaking so the
   * TTS engine produces the actual phoneme sound, not the alphabet name.
   *
   * @param {string} letter — e.g. "B", "NG", "MB"
   * @param {string} lang   — 'en' | 'fr'
   */
  speakLetter(letter, lang = 'en') {
    const map = this._phonemeMap[lang] || this._phonemeMap.en;
    const key = letter.toUpperCase().trim();
    const phoneme = map[key] ?? letter; // fallback to raw if no mapping found
    this.speak(phoneme, lang, 0.65, 1.2);
  }

  /**
   * Speak a word at normal pace.
   */
  speakWord(word, lang = 'en') {
    this.speak(word, lang, 0.85, 1.0);
  }

  /**
   * Speak a celebration phrase.
   */
  speakCelebration(lang = 'en') {
    const phrases = lang === 'fr'
      ? ['Bravo !', 'Excellent !', 'Superbe !', 'Formidable !']
      : ['Great job!', 'Amazing!', 'Well done!', 'Superstar!'];
    const phrase = phrases[Math.floor(Math.random() * phrases.length)];
    this.speak(phrase, lang, 1.0, 1.3);
  }

  /** Stop all speech. */
  stop() {
    this.synth?.cancel();
  }

  /** Check if speech is supported. */
  get isSupported() {
    return !!this.synth;
  }
}

// Singleton instance
const speechEngine = new SpeechEngine();
export default speechEngine;
