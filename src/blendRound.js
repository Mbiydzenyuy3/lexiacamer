/**
 * Sound It Out: which words a round uses, the picture choices, and levelling
 * up. Pure functions (the randomness is passed in), so they are testable.
 */
export const ROUND_SIZE = 5;
const MAX_LEVEL = 3;
const LEVEL_UP_AT = 4;              // right on the first try, out of 5
const KEY = 'lexia_blend_state';
const START = { level: 1, unlocked: [1] };

/** Fisher-Yates shuffle, on a copy. */
function shuffle(list, rng) {
  const a = [...list];
  for (let i = a.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** The child's level, kept on the phone. Anything odd starts again at level 1. */
export function loadBlendState() {
  try {
    const s = JSON.parse(localStorage.getItem(KEY));
    const ok = s && Number.isInteger(s.level) && s.level >= 1 && s.level <= MAX_LEVEL
      && Array.isArray(s.unlocked) && s.unlocked.includes(1) && s.unlocked.includes(s.level);
    return ok ? { level: s.level, unlocked: [...s.unlocked] } : { ...START, unlocked: [1] };
  } catch {
    return { ...START, unlocked: [1] };
  }
}

export function saveBlendState(state) {
  try { localStorage.setItem(KEY, JSON.stringify(state)); } catch { /* storage full or blocked */ }
}

/**
 * Five different words from the current level. Once an earlier level is
 * unlocked, one of the five comes from it, so learned words keep coming back.
 */
export function pickRound(state, words, rng = Math.random) {
  const earlier = state.unlocked.filter((l) => l < state.level);
  const reviewPool = shuffle(words.filter((w) => earlier.includes(w.level)), rng);
  const review = reviewPool.slice(0, 1);
  const main = shuffle(words.filter((w) => w.level === state.level), rng)
    .slice(0, ROUND_SIZE - review.length);
  return shuffle([...main, ...review], rng);
}

/** Three different pictures from the word's own level, the answer among them. */
export function choicesFor(word, words, rng = Math.random) {
  const others = shuffle(words.filter((w) => w.level === word.level && w.word !== word.word), rng)
    .slice(0, 2);
  return shuffle([word, ...others], rng);
}

/** After a round: 4 or 5 right on the first try opens the next level. */
export function afterRound(state, firstTryCorrect) {
  if (firstTryCorrect < LEVEL_UP_AT || state.level >= MAX_LEVEL) return state;
  const level = state.level + 1;
  return { level, unlocked: [...new Set([...state.unlocked, level])].sort() };
}
