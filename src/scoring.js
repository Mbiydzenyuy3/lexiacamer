/**
 * scoring — derive a child's progress from their activity events.
 *
 * ⚠ THIS MUST MATCH supabase/migrations/0004_progress_aggregate.sql EXACTLY.
 *
 * The same rules deliberately exist in two places, because a child playing
 * offline has to see their stars move immediately — waiting for a server round
 * trip is not an option on a school connection. The server stays authoritative:
 * it recomputes from the same events, and its answer wins on reconciliation.
 * If these two ever disagree, a child sees one number and their parent sees
 * another, so both sides are tested against the same fixtures.
 *
 * The app emits EVENTS ("completed a word"), never stat deltas. That is what
 * stops a tampered device minting stars, and it is why the local and server
 * views can be derived independently and still agree.
 */

/** Sticker costs. Mirrors the `stickers` table. */
export const STICKER_COSTS = {
  lion_cub: 15,
  grey_parrot: 25,
  tortoise: 40,
  dog: 50,
  baobab: 75,
  mt_cameroon: 100,
};

export const STARS_PER_WORD = 5;
export const STARS_PER_ROUND = 20;
/** Phonics Lab challenge mode — see src/PhonicsLab.jsx. */
export const STARS_PER_PHONEME = 2;

/** Word Forge and Phonics Lab share ONE "in a row" streak. */
const extendsStreak = (e) =>
  e.kind === 'word_completed' ||
  (e.kind === 'phoneme_attempt' && e.payload?.correct === true);
const breaksStreak = (e) =>
  e.kind === 'word_missed' ||
  (e.kind === 'phoneme_attempt' && e.payload?.correct === false);

export const EVENT_KINDS = [
  'word_completed',
  'word_missed',
  'round_completed',
  'phoneme_attempt',
  'sticker_unlocked',
  'session_started',
];

/** Empty progress — the shape every screen reads. */
export function emptyProgress() {
  return {
    words: 0,
    streak: 0,
    stars: 0,
    unlockedStickers: [],
    missedPhonemes: {},
  };
}

/**
 * Drop duplicate event ids, mirroring the server's `on conflict (id) do
 * nothing`. Without this, replaying a queued batch would inflate a child's
 * stars locally while the server correctly ignored it.
 */
function dedupeById(events) {
  const seen = new Set();
  const out = [];
  for (const e of events) {
    if (!e || !e.id || seen.has(e.id)) continue;
    seen.add(e.id);
    out.push(e);
  }
  return out;
}

/**
 * Derive progress from an event list. Order-independent except for the streak,
 * which is resolved by occurred_at.
 */
export function deriveProgress(events = []) {
  const list = dedupeById(events);
  const progress = emptyProgress();

  let rounds = 0;
  let phonemes = 0;
  let lastMissAt = null;
  const stickers = new Set();

  for (const e of list) {
    if (breaksStreak(e)) {
      const at = new Date(e.occurred_at).getTime();
      if (lastMissAt === null || at > lastMissAt) lastMissAt = at;
    }
    switch (e.kind) {
      case 'word_completed':
        progress.words += 1;
        break;
      case 'round_completed':
        rounds += 1;
        break;
      case 'phoneme_attempt':
        if (e.payload?.correct === true) phonemes += 1;
        break;
      case 'word_missed': {
        const letters = e.payload?.letters;
        if (Array.isArray(letters)) {
          for (const letter of letters) {
            progress.missedPhonemes[letter] =
              (progress.missedPhonemes[letter] || 0) + 1;
          }
        }
        break;
      }
      case 'sticker_unlocked':
        if (e.payload?.sticker_id) stickers.add(e.payload.sticker_id);
        break;
      default:
        break; // session_started scores nothing
    }
  }

  progress.unlockedStickers = [...stickers];

  const spent = progress.unlockedStickers.reduce(
    (sum, id) => sum + (STICKER_COSTS[id] || 0), 0
  );

  // greatest(..., 0) in SQL: a child can never show negative stars.
  progress.stars = Math.max(
    progress.words * STARS_PER_WORD +
    rounds * STARS_PER_ROUND +
    phonemes * STARS_PER_PHONEME - spent, 0
  );

  // Consecutive successes — words OR sounds — since the most recent failure.
  progress.streak = list.filter(
    e => extendsStreak(e) &&
         (lastMissAt === null || new Date(e.occurred_at).getTime() > lastMissAt)
  ).length;

  return progress;
}

/**
 * Apply one event to an existing progress object, returning a new one.
 *
 * The device cannot keep every event it has ever produced, so it carries a
 * running total instead and folds each new event in. `applyEvent` must land on
 * exactly what `deriveProgress` would say over the same list — there is a test
 * asserting that equivalence, because a drift here means a child's stars stop
 * matching the server's.
 *
 * Needs `roundsSoFar` and `lastMissAt` carried alongside, since stars and
 * streak cannot be reconstructed from the visible totals alone.
 */
export function applyEvent(progress, event) {
  const next = {
    ...progress,
    unlockedStickers: [...progress.unlockedStickers],
    missedPhonemes: { ...progress.missedPhonemes },
    _rounds: progress._rounds || 0,
    _phonemes: progress._phonemes || 0,
    _lastMissAt: progress._lastMissAt ?? null,
  };

  if (extendsStreak(event)) next.streak += 1;
  if (breaksStreak(event)) {
    next.streak = 0;
    const at = new Date(event.occurred_at).getTime();
    if (next._lastMissAt === null || at > next._lastMissAt) next._lastMissAt = at;
  }

  switch (event.kind) {
    case 'word_completed':
      next.words += 1;
      break;
    case 'round_completed':
      next._rounds += 1;
      break;
    case 'phoneme_attempt':
      if (event.payload?.correct === true) next._phonemes += 1;
      break;
    case 'word_missed': {
      const letters = event.payload?.letters;
      if (Array.isArray(letters)) {
        for (const letter of letters) {
          next.missedPhonemes[letter] = (next.missedPhonemes[letter] || 0) + 1;
        }
      }
      break;
    }
    case 'sticker_unlocked': {
      const id = event.payload?.sticker_id;
      if (id && !next.unlockedStickers.includes(id)) next.unlockedStickers.push(id);
      break;
    }
    default:
      return next;
  }

  const spent = next.unlockedStickers.reduce(
    (sum, id) => sum + (STICKER_COSTS[id] || 0), 0
  );
  next.stars = Math.max(
    next.words * STARS_PER_WORD +
    next._rounds * STARS_PER_ROUND +
    next._phonemes * STARS_PER_PHONEME - spent, 0
  );

  return next;
}

/** Build an event. `id` is client-generated so retries stay idempotent. */
export function makeEvent(kind, payload = {}) {
  if (!EVENT_KINDS.includes(kind)) {
    throw new Error(`unknown event kind: ${kind}`);
  }
  return {
    id: crypto.randomUUID(),
    kind,
    payload,
    occurred_at: new Date().toISOString(),
  };
}
