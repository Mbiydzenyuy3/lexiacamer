import { describe, it, expect } from 'vitest';
import { deriveProgress, applyEvent, emptyProgress, makeEvent, STICKER_COSTS } from './scoring';

/**
 * These mirror supabase/tests/05_progress_test.sql case for case (P01–P11).
 * The same fixtures must produce the same numbers on both sides, or a child
 * sees different stars than their parent.
 */

let n = 0;
const ev = (kind, payload = {}, minutesAgo = 0) => ({
  id: `evt-${++n}`,
  kind,
  payload,
  occurred_at: new Date(Date.now() - minutesAgo * 60_000).toISOString(),
});

describe('deriveProgress — matches 0004_progress_aggregate.sql', () => {
  it('P01/P02/P03: three correct words = 3 words, 15 stars, streak 3', () => {
    const p = deriveProgress([
      ev('word_completed', {}, 3),
      ev('word_completed', {}, 2),
      ev('word_completed', {}, 1),
    ]);
    expect(p.words).toBe(3);
    expect(p.stars).toBe(15);
    expect(p.streak).toBe(3);
  });

  it('P04/P05/P06: a miss resets the streak, tallies letters, keeps words', () => {
    const p = deriveProgress([
      ev('word_completed', {}, 3),
      ev('word_completed', {}, 2),
      ev('word_completed', {}, 1),
      ev('word_missed', { letters: ['A', 'TH', 'A'] }, 0),
    ]);
    expect(p.streak).toBe(0);
    expect(p.missedPhonemes.A).toBe(2);
    expect(p.missedPhonemes.TH).toBe(1);
    expect(p.words).toBe(3);
  });

  it('P07: a completed round is worth 20', () => {
    const p = deriveProgress([
      ev('word_completed', {}, 3),
      ev('word_completed', {}, 2),
      ev('word_completed', {}, 1),
      ev('word_missed', { letters: ['A'] }, 0),
      ev('round_completed', {}, 0),
    ]);
    expect(p.stars).toBe(35);
  });

  it('P08/P09: unlocking a sticker spends stars and is recorded', () => {
    const p = deriveProgress([
      ev('word_completed', {}, 3),
      ev('word_completed', {}, 2),
      ev('word_completed', {}, 1),
      ev('round_completed', {}, 0),
      ev('sticker_unlocked', { sticker_id: 'lion_cub' }, 0),
    ]);
    expect(p.stars).toBe(35 - STICKER_COSTS.lion_cub);
    expect(p.unlockedStickers).toEqual(['lion_cub']);
  });

  it('P10: a payload claiming stars is ignored — scoring is ours', () => {
    const p = deriveProgress([ev('word_completed', { stars: 9999 }, 0)]);
    expect(p.stars).toBe(5);
  });

  it('P11: replaying the same event id does not double-count', () => {
    const dup = ev('round_completed', {}, 0);
    const p = deriveProgress([dup, { ...dup }, { ...dup }]);
    expect(p.stars).toBe(20);
  });

  it('stars never go negative', () => {
    const p = deriveProgress([
      ev('sticker_unlocked', { sticker_id: 'mt_cameroon' }, 0),
    ]);
    expect(p.stars).toBe(0);
  });

  it('a streak counts only words AFTER the most recent miss', () => {
    const p = deriveProgress([
      ev('word_completed', {}, 10),
      ev('word_missed', { letters: ['B'] }, 5),
      ev('word_completed', {}, 3),
      ev('word_completed', {}, 1),
    ]);
    expect(p.streak).toBe(2);
    expect(p.words).toBe(3);
  });

  it('is order-independent', () => {
    const events = [
      ev('word_completed', {}, 10),
      ev('word_missed', { letters: ['B'] }, 5),
      ev('word_completed', {}, 3),
    ];
    const forward = deriveProgress(events);
    const backward = deriveProgress([...events].reverse());
    expect(backward).toEqual(forward);
  });

  it('a correct sound is worth 2 and extends the shared streak', () => {
    const p = deriveProgress([
      ev('word_completed', {}, 3),
      ev('phoneme_attempt', { letter: 'A', correct: true }, 2),
      ev('phoneme_attempt', { letter: 'B', correct: true }, 1),
    ]);
    expect(p.stars).toBe(5 + 2 + 2);
    expect(p.streak).toBe(3);
    expect(p.words).toBe(1);
  });

  it('a wrong sound breaks the streak shared with Word Forge', () => {
    const p = deriveProgress([
      ev('word_completed', {}, 4),
      ev('word_completed', {}, 3),
      ev('phoneme_attempt', { letter: 'A', correct: false }, 2),
      ev('word_completed', {}, 1),
    ]);
    expect(p.streak).toBe(1);
    expect(p.stars).toBe(15);
  });

  it('session_started scores nothing', () => {
    const p = deriveProgress([ev('session_started', {}, 1)]);
    expect(p).toEqual(emptyProgress());
  });

  it('an empty history is empty progress', () => {
    expect(deriveProgress([])).toEqual(emptyProgress());
    expect(deriveProgress()).toEqual(emptyProgress());
  });
});

describe('makeEvent', () => {
  it('rejects an unknown kind rather than emitting junk the server drops', () => {
    expect(() => makeEvent('nonsense')).toThrow(/unknown event kind/);
  });

  it('gives every event a unique id so retries are idempotent', () => {
    const a = makeEvent('word_completed');
    const b = makeEvent('word_completed');
    expect(a.id).not.toBe(b.id);
  });
});

describe('applyEvent — must agree with deriveProgress', () => {
  // Drop the internal accumulators applyEvent carries; comparing only what a
  // screen actually renders. Written as a filter rather than a fixed list so a
  // new accumulator cannot silently break every case here.
  const strip = (p) =>
    Object.fromEntries(Object.entries(p).filter(([k]) => !k.startsWith('_')));

  const fold = (events) => strip(events.reduce(applyEvent, emptyProgress()));

  it('agrees on a plain run of words', () => {
    const events = [
      ev('word_completed', {}, 3),
      ev('word_completed', {}, 2),
      ev('word_completed', {}, 1),
    ];
    expect(fold(events)).toEqual(deriveProgress(events));
  });

  it('agrees across misses, rounds and stickers', () => {
    const events = [
      ev('word_completed', {}, 20),
      ev('word_missed', { letters: ['A', 'A', 'TH'] }, 15),
      ev('word_completed', {}, 10),
      ev('round_completed', {}, 8),
      ev('word_completed', {}, 6),
      ev('sticker_unlocked', { sticker_id: 'lion_cub' }, 4),
      ev('word_completed', {}, 2),
    ];
    expect(fold(events)).toEqual(deriveProgress(events));
  });

  it('agrees when a session ends on a miss', () => {
    const events = [
      ev('word_completed', {}, 5),
      ev('word_completed', {}, 4),
      ev('word_missed', { letters: ['B'] }, 3),
    ];
    expect(fold(events)).toEqual(deriveProgress(events));
  });

  it('agrees when stickers would push stars below zero', () => {
    const events = [
      ev('word_completed', {}, 2),
      ev('sticker_unlocked', { sticker_id: 'mt_cameroon' }, 1),
    ];
    expect(fold(events)).toEqual(deriveProgress(events));
    expect(fold(events).stars).toBe(0);
  });

  it('agrees over a long random run', () => {
    const kinds = ['word_completed', 'word_missed', 'round_completed',
                   'session_started', 'phoneme_attempt', 'phoneme_attempt'];
    const events = [];
    for (let i = 0; i < 300; i++) {
      const kind = kinds[i % kinds.length];
      let payload = {};
      if (kind === 'word_missed') payload = { letters: ['A'] };
      if (kind === 'phoneme_attempt') payload = { letter: 'A', correct: i % 12 < 6 };
      events.push(ev(kind, payload, 300 - i));
    }
    expect(fold(events)).toEqual(deriveProgress(events));
  });
});
