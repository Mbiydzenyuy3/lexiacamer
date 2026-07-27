/**
 * store — the single source of truth for persisting app state.
 *
 * Today this reads/writes localStorage. When the partner backend is defined,
 * swapping to an API happens HERE only (loadState/saveState/resetProgress) —
 * the rest of the app never touches storage directly, so integration doesn't
 * require a rewrite.
 */

const STORAGE_KEY = 'lexia_state';

/** Fresh default state. Returns a new object each call (safe to mutate). */
export function defaultState() {
  return {
    lang: 'en',
    stats: { words: 0, streak: 0, stars: 0 },
    settings: { dyslexiaMode: false },
    user: { name: '', avatar: '' },
    unlockedStickers: [],
    missedPhonemes: {},
  };
}

/** Load persisted state, merged over defaults so missing keys never break. */
export function loadState() {
  const base = defaultState();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        ...base,
        ...parsed,
        stats: { ...base.stats, ...(parsed.stats || {}) },
        settings: { ...base.settings, ...(parsed.settings || {}) },
        user: { ...base.user, ...(parsed.user || {}) },
      };
    }
  } catch (e) {
    /* corrupt or unavailable storage — fall back to defaults */
  }
  return base;
}

/** Persist the whole app state. */
export function saveState(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    /* storage full or unavailable — ignore, app still works in-memory */
  }
}

/**
 * Reset a child's learning progress — stars, streak, words, unlocked stickers
 * and missed-letter history — while KEEPING their name/avatar and settings.
 * Returns the fresh progress values for the caller to apply to React state.
 */
export function resetProgress() {
  const fresh = defaultState();
  return {
    stats: fresh.stats,
    unlockedStickers: fresh.unlockedStickers,
    missedPhonemes: fresh.missedPhonemes,
  };
}
