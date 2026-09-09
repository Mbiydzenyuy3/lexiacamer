import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  defaultState, migrateLegacy, queueEvent, pruneOutbox, reconcile,
} from './store';

describe('queueEvent', () => {
  it('updates the local view immediately — a child sees stars with no network', () => {
    const s = queueEvent(defaultState(), 'word_completed');
    expect(s.progress.stars).toBe(5);
    expect(s.progress.words).toBe(1);
  });

  it('queues the event for the server', () => {
    const s = queueEvent(defaultState(), 'word_completed');
    expect(s.outbox).toHaveLength(1);
    expect(s.outbox[0].kind).toBe('word_completed');
  });

  it('does not mutate the state it was given', () => {
    const before = defaultState();
    queueEvent(before, 'word_completed');
    expect(before.outbox).toHaveLength(0);
    expect(before.progress.stars).toBe(0);
  });

  it('accumulates across a session', () => {
    let s = defaultState();
    s = queueEvent(s, 'word_completed');
    s = queueEvent(s, 'word_completed');
    s = queueEvent(s, 'word_missed', { letters: ['A'] });
    s = queueEvent(s, 'round_completed');
    expect(s.progress.words).toBe(2);
    expect(s.progress.streak).toBe(0);
    expect(s.progress.stars).toBe(30);
    expect(s.outbox).toHaveLength(4);
  });
});

describe('pruneOutbox', () => {
  it('keeps recent events', () => {
    const outbox = [{ id: '1', occurred_at: new Date().toISOString() }];
    expect(pruneOutbox(outbox)).toHaveLength(1);
  });

  it('drops events the server would refuse anyway', () => {
    const old = new Date(Date.now() - 200 * 86_400_000).toISOString();
    const outbox = [
      { id: '1', occurred_at: old },
      { id: '2', occurred_at: new Date().toISOString() },
    ];
    const kept = pruneOutbox(outbox);
    expect(kept).toHaveLength(1);
    expect(kept[0].id).toBe('2');
  });
});

describe('migrateLegacy', () => {
  it('carries an existing child\'s stars and stickers forward', () => {
    const s = migrateLegacy({
      lang: 'fr',
      stats: { words: 12, streak: 3, stars: 40 },
      user: { name: 'Ada', avatar: 'parrot' },
      unlockedStickers: ['lion_cub'],
      missedPhonemes: { A: 2 },
      settings: { dyslexiaMode: true },
    });
    expect(s.progress.stars).toBe(40);
    expect(s.progress.words).toBe(12);
    expect(s.progress.unlockedStickers).toEqual(['lion_cub']);
    expect(s.progress.missedPhonemes).toEqual({ A: 2 });
    expect(s.user.name).toBe('Ada');
    expect(s.settings.dyslexiaMode).toBe(true);
    expect(s.lang).toBe('fr');
  });

  it('survives junk without throwing', () => {
    expect(migrateLegacy(null).progress.stars).toBe(0);
    expect(migrateLegacy('nonsense').progress.stars).toBe(0);
    expect(migrateLegacy({}).progress.stars).toBe(0);
  });
});

describe('reconcile', () => {
  it('adopts the server as authoritative', () => {
    const s = { ...defaultState(), progress: { ...defaultState().progress, stars: 5 } };
    const next = reconcile(s, {
      words: 20, streak: 4, stars: 100,
      unlocked_stickers: ['dog'], missed_phonemes: { B: 1 },
    });
    expect(next.progress.stars).toBe(100);
    expect(next.progress.unlockedStickers).toEqual(['dog']);
  });

  it('re-applies still-queued events so recent stars do not vanish', () => {
    let s = defaultState();
    s = queueEvent(s, 'word_completed');   // +5, still unsynced
    const next = reconcile(s, { words: 10, streak: 0, stars: 50 });
    // 50 from the server, plus the queued word the server has not seen yet.
    expect(next.progress.stars).toBe(55);
    expect(next.progress.words).toBe(11);
  });

  it('leaves state alone when the server says nothing', () => {
    const s = queueEvent(defaultState(), 'word_completed');
    expect(reconcile(s, null)).toEqual(s);
  });
});

describe('pruneOutbox reference stability', () => {
  it('returns the SAME array when nothing is dropped', () => {
    // The sync effect re-runs on state change, so a fresh object here when
    // nothing actually changed would spin the app in a tight retry loop.
    const outbox = [{ id: '1', occurred_at: new Date().toISOString() }];
    expect(pruneOutbox(outbox)).toBe(outbox);
  });

  it('returns a new array only when something is actually dropped', () => {
    const old = new Date(Date.now() - 200 * 86_400_000).toISOString();
    const outbox = [{ id: '1', occurred_at: old }];
    expect(pruneOutbox(outbox)).not.toBe(outbox);
  });
});
