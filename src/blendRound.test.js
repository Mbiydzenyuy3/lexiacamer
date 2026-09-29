import { describe, it, expect, beforeEach } from 'vitest';
import { loadBlendState, saveBlendState, pickRound, choicesFor, afterRound, ROUND_SIZE } from './blendRound';
import { BLEND_WORDS } from './blendWords';

// A predictable "random": walks through a fixed list.
const seq = (...values) => { let i = 0; return () => values[i++ % values.length]; };

beforeEach(() => localStorage.clear());

describe('blend state', () => {
  it('starts a new child at level 1', () => {
    expect(loadBlendState()).toEqual({ level: 1, unlocked: [1] });
  });
  it('starts at level 1 when the saved state is corrupt', () => {
    localStorage.setItem('lexia_blend_state', '{nope');
    expect(loadBlendState()).toEqual({ level: 1, unlocked: [1] });
  });
  it('keeps what was saved', () => {
    saveBlendState({ level: 2, unlocked: [1, 2] });
    expect(loadBlendState()).toEqual({ level: 2, unlocked: [1, 2] });
  });
});

describe('pickRound', () => {
  it('gives five different words from the current level', () => {
    const round = pickRound({ level: 1, unlocked: [1] }, BLEND_WORDS, Math.random);
    expect(round).toHaveLength(ROUND_SIZE);
    expect(new Set(round.map((w) => w.word)).size).toBe(ROUND_SIZE);
    expect(round.every((w) => w.level === 1)).toBe(true);
  });
  it('mixes in one review word from an earlier level once one is unlocked', () => {
    const round = pickRound({ level: 2, unlocked: [1, 2] }, BLEND_WORDS, Math.random);
    expect(round.filter((w) => w.level === 1)).toHaveLength(1);
    expect(round.filter((w) => w.level === 2)).toHaveLength(ROUND_SIZE - 1);
  });
});

describe('choicesFor', () => {
  it('always gives three different pictures, one of them the answer', () => {
    for (const word of BLEND_WORDS) {
      const choices = choicesFor(word, BLEND_WORDS, Math.random);
      expect(choices).toHaveLength(3);
      expect(new Set(choices.map((w) => w.word)).size).toBe(3);
      expect(choices.map((w) => w.word)).toContain(word.word);
      expect(choices.every((w) => w.level === word.level)).toBe(true);
    }
  });
  it('does not always put the answer in the same place', () => {
    const sun = BLEND_WORDS.find((w) => w.word === 'sun');
    const spots = new Set([seq(0), seq(0.5), seq(0.99)].map((rng) =>
      choicesFor(sun, BLEND_WORDS, rng).findIndex((w) => w.word === 'sun')));
    expect(spots.size).toBeGreaterThan(1);
  });
});

describe('afterRound', () => {
  it('opens the next level after 4 or 5 right on the first try', () => {
    expect(afterRound({ level: 1, unlocked: [1] }, 4)).toEqual({ level: 2, unlocked: [1, 2] });
    expect(afterRound({ level: 1, unlocked: [1] }, 5)).toEqual({ level: 2, unlocked: [1, 2] });
  });
  it('stays on the level with 3 or fewer', () => {
    expect(afterRound({ level: 1, unlocked: [1] }, 3)).toEqual({ level: 1, unlocked: [1] });
  });
  it('never goes past the last level', () => {
    expect(afterRound({ level: 3, unlocked: [1, 2, 3] }, 5)).toEqual({ level: 3, unlocked: [1, 2, 3] });
  });
});
