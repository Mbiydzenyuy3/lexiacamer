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
  }

  /**
   * Phoneme map — converts a letter / sound key into a TTS-safe string
   * that the browser engine will pronounce as a SINGLE unified sound.
   *
   * Design rules used:
   *  1. Vowels: standard-English SHORT vowel strings ("ah","eh","ih","aw","uh")
   *     that TTS reads as one short vowel sound, not the letter name.
   *  2. Consonants: consonant + schwa CV syllable ("buh","kuh") — browsers
   *     read these as one syllable because they match English syllable patterns.
   *     Sonorants & fricatives use repeated letters ("mmm","sss","zzz").
   *  3. Common blends: phonetic syllable form ("chuh","shh","thuh").
   *  4. Cameroonian prenasalized blends (NG/ND/MB/NK): word-initial /ŋ/,
   *     prenasalized /nd/, /mb/, /ŋk/ do NOT exist in English or French,
   *     so no abstract string can produce them reliably. Instead PhonicsLab
   *     passes the example word directly (e.g. "Ngong", "Ndolé") and this
   *     map's fallback speaks it as a whole word at slow rate — which is
   *     exactly how phonics teachers introduce such sounds in context.
   *  5. NO HYPHENS — hyphens tell TTS to split into separate sounds.
   */
  get _phonemeMap() {
    return {
      en: {
        // ── Vowels ────────────────────────────────────────────────────────
        // Standard-English SHORT vowel sounds — the ones mainstream phonics
        // (Jolly Phonics etc.) teaches first, understood by any English speaker.
        // We need TTS strings that produce ONE short vowel, not the letter name.
        A: 'ah',   // short a → /æ/  (as in "cat", "apple")
        E: 'eh',   // short e → /ɛ/  (as in "bed", "egg")
        I: 'ih',   // short i → /ɪ/  (as in "sit", "igloo")   — not the long "ee"
        O: 'aw',   // short o → /ɒ/  (as in "hot", "octopus") — not the long "oh"
        U: 'uh',   // short u → /ʌ/  (as in "cup", "umbrella") — not the long "oo"

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
        M: 'mmm',   // nasal /m/  — hum; TTS reads repeated M as nasal hold
        N: 'nnn',   // nasal /n/  — hum; TTS reads repeated N as nasal hold
        P: 'puh',   // stop  /p/
        Q: 'kwuh',  // /kw/  cluster
        R: 'rrr',   // rhoti /r/  — pirate sound; TTS holds the rhotic
        S: 'sss',   // frica /s/  — snake sound; TTS holds the fricative
        T: 'tuh',   // stop  /t/
        V: 'vuh',   // frica /v/
        W: 'wuh',   // glide /w/
        X: 'ksss',  // /ks/  — TTS reads as one hissing cluster
        Y: 'yuh',   // glide /j/
        Z: 'zzz',   // frica /z/  — buzzing sound; TTS holds fricative

        // ── Common digraphs & blends ──────────────────────────────────────
        // Each produces ONE syllable/phoneme, no hyphens.
        CH: 'chuh',  // /tʃ/ add schwa so TTS reads as one syllable (Achu, Bamunka)
        SH: 'shh',   // /ʃ/  the "silence" interjection — TTS knows this as one sound
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
        // vowels — exactly what Cameroonian French phonics needs.
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
        F: 'feu',   // /f/  — "feu" est un mot français, TTS le prononce /fø/ ✓
        G: 'gue',   // /ɡ/  — "gue" muet, TTS produit /ɡ/ ✓
        H: 'ach',   // H est muet en français — son d'aspiration
        J: 'jeu',   // /ʒ/  — "jeu" est un mot français, TTS produit /ʒø/ ✓
        K: 'ka',    // /k/  — syllabe simple
        L: 'el',    // /l/  — nom de la lettre en français ✓
        M: 'em',    // /m/  — nom de la lettre en français ✓
        N: 'neu',   // /n/  — "neu" (et NON "en" qui est une voyelle nasale /ɑ̃/)
        P: 'peu',   // /p/  — "peu" est un mot français
        Q: 'cu',    // /k/
        R: 'air',   // /ʁ/  — "air" en français prononce le R uvulaire /ʁ/ ✓
        S: 'ess',   // /s/
        T: 'teu',   // /t/
        V: 'veu',   // /v/
        W: 'oua',   // /w/  — son de W dans "oui", "week" en français
        X: 'iks',   // /ks/ — nom de la lettre ✓
        Y: 'igrek', // /i/  — "i grec", nom officiel en français
        Z: 'zèd',   // /z/  — nom de la lettre ✓

        // ── Combinaisons ─────────────────────────────────────────────────
        CH: 'cheu',    // /ʃ/ comme "cheval" — une seule syllabe
        SH: 'cheu',    // /ʃ/ même son en contexte camerounais
        TH: 'teuach',  // /t/ + /ʃ/ — sans tiret pour rester une unité
        PH: 'feu',     // /f/ — PH fait le son F

        // Consonnes prénasalisées camerounaises — même logique qu'en anglais
        NG: 'ngoh',
        ND: 'ndoh',
        MB: 'mboh',
        NK: 'nkoh',
      },
    };
  }

  /**
   * Speak a single letter or phoneme slowly and clearly.
   *
   * PhonicsLab passes item.sound (e.g. "ch", "sh", "Ngong", "Ndolé").
   * WordForge passes the raw letter character (e.g. "B", "A").
   *
   * The lookup converts the key to uppercase and finds the phoneme map entry.
   * If no entry exists (e.g. "NGONG"), the raw string is spoken — which is
   * exactly right for the Cameroonian blend example words.
   */
  speakLetter(letter, lang = 'en') {
    const map = this._phonemeMap[lang] || this._phonemeMap.en;
    const key = letter.toUpperCase().trim();
    const phoneme = map[key] ?? letter;
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
