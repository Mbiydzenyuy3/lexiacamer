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
   * Speak a single letter / phoneme slowly and clearly.
   */
  speakLetter(letter, lang = 'en') {
    this.speak(letter, lang, 0.7, 1.2);
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
