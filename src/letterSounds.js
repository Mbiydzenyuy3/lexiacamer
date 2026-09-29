/**
 * The voices a child can choose for letter sounds, and which clip each plays.
 *
 * ADDING A VOICE: put its clips in public/audio/phonics/<folder>/ (one mp3
 * per sound, named like "b.mp3" or "ch.mp3") and add one entry below, listing
 * the sounds it has. Anything it has no clip for plays from its fallback
 * voice, so a new voice can start with a few recordings. A test fails if a
 * listed sound has no file, before it can reach a child.
 *
 * WEIGHT: only the default voice is saved for offline on install (see
 * vite.config.js). Any other voice downloads when a child picks it
 * (warmVoice), so most phones never pay for voices they do not use.
 *
 * The app teaches ENGLISH letter sounds, so the same clips play whatever the
 * menu language. The robot voice has no clips: it is the phone's own speech,
 * which weighs nothing.
 */
const LETTERS = 'abcdefghijklmnopqrstuvwxyz'.split('');
const TWO_LETTER = ['ch', 'sh', 'th', 'ph', 'ng', 'nd', 'mb', 'nk'];

export const LETTER_VOICES = [
  {
    id: 'standard',
    folder: 'standard',
    sounds: [...LETTERS, ...TWO_LETTER],
    label: { en: 'Standard English', fr: 'Anglais standard' },
  },
  {
    id: 'native',
    folder: 'native',
    sounds: LETTERS,
    fallback: 'standard',
    label: { en: 'Native pronunciation', fr: 'Prononciation native' },
  },
  {
    id: 'robot',
    folder: null,
    sounds: [],
    label: { en: 'Robot voice', fr: 'Voix robot' },
  },
];

export const DEFAULT_VOICE = 'standard';

/** A voice by id; an unknown id (say, a voice removed in an update) is the default. */
const voiceById = (id) =>
  LETTER_VOICES.find((v) => v.id === id) || LETTER_VOICES.find((v) => v.id === DEFAULT_VOICE);

export const voiceLabel = (voice, lang) => voice.label[lang] || voice.label.en;

/** Path of the clip to play for a letter or two-letter sound, or null for the robot voice. */
export function clipPathFor(letter, voiceId) {
  const sound = String(letter ?? '').trim().toLowerCase();
  if (!/^[a-z]{1,2}$/.test(sound)) return null;
  let voice = voiceById(voiceId);
  if (!voice.folder) return null;
  while (voice && !voice.sounds.includes(sound)) {
    voice = voice.fallback ? voiceById(voice.fallback) : null;
  }
  return voice ? `audio/phonics/${voice.folder}/${sound}.mp3` : null;
}

/**
 * Download a voice that is not saved offline by default, so it keeps working
 * with no internet. The service worker caches each file as it arrives. Never
 * throws: on a bad connection the clips simply download when first played.
 */
export async function warmVoice(voiceId, fetchFn = globalThis.fetch, base = '/') {
  const voice = voiceById(voiceId);
  if (!voice.folder || voice.id === DEFAULT_VOICE || !fetchFn) return;
  await Promise.all(voice.sounds.map((s) =>
    Promise.resolve()
      .then(() => fetchFn(`${base}audio/phonics/${voice.folder}/${s}.mp3`))
      .catch(() => {})));
}
