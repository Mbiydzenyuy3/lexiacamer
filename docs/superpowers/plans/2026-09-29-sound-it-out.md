# Sound It Out Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A blending game (see letters, tap to hear each sound, "say it fast", pick the picture) plus the home/nav changes, the last feature before launch.

**Architecture:** Word data in `src/blendWords.js`; pure round logic in `src/blendRound.js`; UI in `src/BlendGame.jsx`. Sound goes through `src/speech.js`, which gains word clips, praise clips and sound sequences (shared with Word Forge). Progress uses existing event kinds, so there's no database change. Pictures are bundled Twemoji SVGs.

**Tech Stack:** React 18.3, Vite 7 + vite-plugin-pwa, Vitest 5 + jsdom (render with `react-dom/client` + `act`), Chatterbox (MIT) for the owner's cloned voice.

**Spec:** `docs/superpowers/specs/2026-09-29-sound-it-out-design.md`

## Global Constraints

- Branch `feat/sound-it-out` off `early-testers`; merge into `early-testers` only when every check passes; push only on the owner's go.
- Commits carry NO Claude attribution.
- Every string a child sees exists in English and French (`src/i18n.js`).
- No database change: events are `word_completed`, `word_missed`, `round_completed` with payload `source: 'blend'`.
- Offline: pictures and word clips are precached; the landing page bundle size must not change.
- Robot voice setting (`letterVoice === 'robot'`) makes every sound robot; any missing clip falls back to robot.
- Before done: `npm run lint` (0 errors), `npm test`, `npm run build`.

## Review Focus

1. **A word whose clip is missing** (new word, not generated yet): the round must still play, with the robot saying the word. Test in Task 2.
2. **Rapid taps**: tapping tiles or "Say it fast" while a sequence plays must not overlap sounds or leave a tile lit. Covered in Task 2 (sequence cancels the previous one) and Task 4.
3. **Level 3 in Robot mode**: native sounds requested but voice is robot → robot, not native clips. Test in Task 2.
4. **A child with an old saved state** (no `lexia_blend_state`): starts at level 1 without errors. Test in Task 3.
5. **Distractor pictures equal to the answer** when a level has few words: choices must always be 3 distinct words. Test in Task 3.

---

### Task 1: Word list and pictures

**Files:** create `src/blendWords.js`, `src/blendWords.test.js`, `public/pictures/*.svg` (27 files).

**Produces:** `BLEND_WORDS: Array<{ word, sounds: string[], picture: string, level: 1|2|3, voice: 'standard'|'native' }>`, `PICTURE_CREDIT: string`, `picturePath(code) → 'pictures/<code>.svg'`.

- [ ] **Step 1: Failing test** `src/blendWords.test.js`:

```js
import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import { BLEND_WORDS, picturePath } from './blendWords';
import { clipPathFor } from './letterSounds';

describe('blend words', () => {
  it('spells each word exactly with its sounds', () => {
    for (const w of BLEND_WORDS) expect(w.sounds.join(''), w.word).toBe(w.word);
  });
  it('has a recording for every sound, in the word\'s voice', () => {
    for (const w of BLEND_WORDS) for (const s of w.sounds) {
      const clip = clipPathFor(s, w.voice);
      expect(clip, `${w.word}/${s}`).toBeTruthy();
      expect(fs.existsSync(`public/${clip}`), clip).toBe(true);
      if (w.voice === 'native' && s.length === 1) expect(clip).toMatch(/\/native\//);
    }
  });
  it('has a picture file for every word', () => {
    for (const w of BLEND_WORDS) expect(fs.existsSync(`public/${picturePath(w.picture)}`), w.word).toBe(true);
  });
  it('has at least 3 words in every level, so there are always 3 choices', () => {
    for (const level of [1, 2, 3]) expect(BLEND_WORDS.filter((w) => w.level === level).length).toBeGreaterThanOrEqual(3);
  });
  it('lists each word once', () => {
    const words = BLEND_WORDS.map((w) => w.word);
    expect(new Set(words).size).toBe(words.length);
  });
});
```

- [ ] **Step 2: Run, verify FAIL** (`npx vitest run src/blendWords.test.js`: cannot resolve `./blendWords`).

- [ ] **Step 3: Pictures.** Download the Twemoji SVGs (CC-BY 4.0) once and commit them:

```bash
mkdir -p public/pictures && cd public/pictures && for c in 2600 1f408 1f416 1f414 1f415 1f68c 1f98a 1f4e6 1f41c 1f987 1f6cf 1f690 1f41f 1f95b 1f438 270b 1f941 1f6a9 26fa 1f980 1f6a2 1faba 1f469 1f468 1fad8 1f3d6 26f0; do curl -fsSL -o $c.svg https://cdn.jsdelivr.net/gh/jdecked/twemoji@15.1.0/assets/svg/$c.svg; done; ls | wc -l
```

Expected: 27.

- [ ] **Step 4: Implement** `src/blendWords.js`:

```js
/**
 * Words for Sound It Out. Each is made only of recorded sounds (no silent or
 * double letters), so a child can read it by blending its sounds. Level 3 uses
 * the NATIVE letter sounds: in these Cameroonian words u says "oo", i says "ee".
 * Adding a word: its sounds must join to spell it, and it needs a picture in
 * public/pictures/ (tests check both) and ideally a word clip (robot until then).
 */
const w = (word, sounds, picture, level, voice = 'standard') => ({ word, sounds, picture, level, voice });

export const BLEND_WORDS = [
  w('sun', ['s', 'u', 'n'], '2600', 1), w('cat', ['c', 'a', 't'], '1f408', 1),
  w('pig', ['p', 'i', 'g'], '1f416', 1), w('hen', ['h', 'e', 'n'], '1f414', 1),
  w('dog', ['d', 'o', 'g'], '1f415', 1), w('bus', ['b', 'u', 's'], '1f68c', 1),
  w('fox', ['f', 'o', 'x'], '1f98a', 1), w('box', ['b', 'o', 'x'], '1f4e6', 1),
  w('ant', ['a', 'n', 't'], '1f41c', 1), w('bat', ['b', 'a', 't'], '1f987', 1),
  w('bed', ['b', 'e', 'd'], '1f6cf', 1), w('van', ['v', 'a', 'n'], '1f690', 1),
  w('fish', ['f', 'i', 'sh'], '1f41f', 2), w('milk', ['m', 'i', 'l', 'k'], '1f95b', 2),
  w('frog', ['f', 'r', 'o', 'g'], '1f438', 2), w('hand', ['h', 'a', 'n', 'd'], '270b', 2),
  w('drum', ['d', 'r', 'u', 'm'], '1f941', 2), w('flag', ['f', 'l', 'a', 'g'], '1f6a9', 2),
  w('tent', ['t', 'e', 'n', 't'], '26fa', 2), w('crab', ['c', 'r', 'a', 'b'], '1f980', 2),
  w('ship', ['sh', 'i', 'p'], '1f6a2', 2), w('nest', ['n', 'e', 's', 't'], '1faba', 2),
  w('mama', ['m', 'a', 'm', 'a'], '1f469', 3, 'native'), w('papa', ['p', 'a', 'p', 'a'], '1f468', 3, 'native'),
  w('koki', ['k', 'o', 'k', 'i'], '1fad8', 3, 'native'), w('kribi', ['k', 'r', 'i', 'b', 'i'], '1f3d6', 3, 'native'),
  w('buea', ['b', 'u', 'e', 'a'], '26f0', 3, 'native'),
];

export const picturePath = (code) => `pictures/${code}.svg`;
export const PICTURE_CREDIT = 'Pictures: Twemoji, CC-BY 4.0';
```

- [ ] **Step 5: Run, verify PASS.** **Step 6: Commit** `feat(blend): word list and pictures for Sound It Out`.

### Task 2: Speech: word clips, praise clips, sound sequences

**Files:** modify `src/speech.js`, `src/speech.test.js`.

**Consumes:** `clipPathFor(letter, voiceId)`. **Produces:** `speakLetter(letter, lang, voiceOverride?)`, `speakWord(word, lang)` (clip `audio/words/<word>.mp3`, robot fallback), `speakCelebration(lang)` (EN: `audio/words/praise-<key>.mp3`), `speakSounds(sounds, voiceId, { gapMs, onEach }) → cancel()`.

- [ ] **Step 1: Failing tests** (append to `src/speech.test.js`, reusing its Audio/speechSynthesis stand-ins):

```js
describe('words, praise and sequences', () => {
  it('plays a word from its clip', () => {
    speechEngine.setLetterVoice('standard');
    speechEngine.speakWord('SUN', 'en');
    expect(audios.at(-1).src).toMatch(/audio\/words\/sun\.mp3$/);
  });
  it('says a word with the robot when its clip is missing', () => {
    speechEngine.speakWord('ZEBRA', 'en');
    audios.at(-1).listeners.error();
    expect(speak).toHaveBeenCalledTimes(1);
  });
  it('uses the robot for words in Robot mode', () => {
    speechEngine.setLetterVoice('robot');
    speechEngine.speakWord('SUN', 'en');
    expect(audios).toHaveLength(0);
    expect(speak).toHaveBeenCalledTimes(1);
  });
  it('plays English praise from a clip', () => {
    speechEngine.setLetterVoice('standard');
    speechEngine.speakCelebration('en');
    expect(audios.at(-1).src).toMatch(/audio\/words\/praise-[a-z-]+\.mp3$/);
  });
  it('keeps French praise on the robot until French clips exist', () => {
    speechEngine.speakCelebration('fr');
    expect(audios).toHaveLength(0);
    expect(speak).toHaveBeenCalledTimes(1);
  });
  it('plays native letter sounds for a native word, even with Standard chosen', () => {
    speechEngine.setLetterVoice('standard');
    speechEngine.speakLetter('u', 'en', 'native');
    expect(audios.at(-1).src).toMatch(/audio\/phonics\/native\/u\.mp3$/);
  });
  it('ignores the native override in Robot mode', () => {
    speechEngine.setLetterVoice('robot');
    speechEngine.speakLetter('u', 'en', 'native');
    expect(audios).toHaveLength(0);
  });
  it('plays a sequence in order, one after the other', () => {
    speechEngine.setLetterVoice('standard');
    const seen = [];
    speechEngine.speakSounds(['s', 'u', 'n'], 'standard', { gapMs: 0, onEach: (i) => seen.push(i) });
    expect(audios.at(-1).src).toMatch(/\/s\.mp3$/);
    audios.at(-1).listeners.ended();
    expect(audios.at(-1).src).toMatch(/\/u\.mp3$/);
    expect(seen).toEqual([0, 1]);
  });
  it('stops an old sequence when a new one starts', () => {
    const cancel = speechEngine.speakSounds(['s', 'u'], 'standard', { gapMs: 0 });
    speechEngine.speakSounds(['c', 'a'], 'standard', { gapMs: 0 });
    const count = audios.length;
    cancel();
    expect(audios).toHaveLength(count);
  });
});
```

(The Audio stand-in needs `ended` support: listeners are already stored by name.)

- [ ] **Step 2: Run, verify FAIL** (`speakSounds is not a function`, word src not a clip).

- [ ] **Step 3: Implement** in `src/speech.js`: a private `_playClip(path, onFail, onEnded)` used by `speakLetter`, `speakWord` and `speakCelebration`; `speakLetter(letter, lang, voiceOverride)` resolves `this.letterVoice === 'robot' ? 'robot' : (voiceOverride || this.letterVoice)`; `speakWord` uses `audio/words/${word.toLowerCase()}.mp3` unless robot; `speakCelebration('en')` picks from `['great-job','amazing','well-done','superstar']`; `speakSounds` keeps a sequence token so a new sequence (or `stop()`) cancels the old one, advancing on each clip's `ended` (or after the robot utterance's `onend`) with `gapMs` between.

- [ ] **Step 4: Run all tests, verify PASS.** **Step 5: Commit** `feat(speech): word and praise clips, native override, sound sequences`.

### Task 3: Round logic

**Files:** create `src/blendRound.js`, `src/blendRound.test.js`.

**Produces:** `loadBlendState() → { level, unlocked: number[] }`, `saveBlendState(s)`, `pickRound(state, words, rng) → word[5]`, `choicesFor(word, words, rng) → word[3]`, `afterRound(state, firstTryCorrect) → state`.

- [ ] **Step 1: Failing tests** covering: fresh/old state → `{ level: 1, unlocked: [1] }`; corrupt storage → default; `pickRound` returns 5 words, all from the current level except at most one review word from an unlocked lower level; `choicesFor` returns 3 distinct words including the answer, others from the same level; `afterRound` with 4 or 5 first-try correct unlocks the next level (max 3) and moves to it, with 3 or fewer it stays.

- [ ] **Step 2: FAIL. Step 3: Implement** (pure functions, `rng` defaults to `Math.random`; storage key `lexia_blend_state`, wrapped in try/catch). **Step 4: PASS. Step 5: Commit** `feat(blend): round logic`.

### Task 4: The game screen

**Files:** create `src/BlendGame.jsx`, `src/BlendGame.test.jsx`; modify `src/index.css`, `src/i18n.js` (EN/FR: `blendTitle`, `blendSubtitle`, `blendSayItFast`, `blendFindPicture`, `blendRoundDone`, `blendNext`).

**Consumes:** Tasks 1–3. **Produces:** `<BlendGame t lang onWordCorrect(word) onWordMissed(sounds) onRoundComplete(level, firstTry) />`.

- [ ] **Step 1: Failing tests** (mock `./speech`): tiles render one per sound; tapping a tile calls `speakLetter(sound, lang, voice)` and marks it lit; "Say it fast" calls `speakSounds(sounds, voice, …)`; tapping the right picture calls `onWordCorrect('sun')` and `speakWord`; two wrong taps call `onWordMissed` and add the hint class to the right picture; after 5 words `onRoundComplete(level, n)` fires.

- [ ] **Step 2: FAIL. Step 3: Implement** the screen and styles (big tiles, 3 large picture buttons with `alt`, hint glow, Confetti at round end). **Step 4: PASS. Step 5: Commit** `feat(blend): the Sound It Out game`.

### Task 5: Home, top bar and bottom nav

**Files:** modify `src/HomeScreen.jsx`, `src/App.jsx`, `src/i18n.js` (`homeBlendTitle`, `homeBlendDesc`, `navBlend`, `settingsLabel`), `src/Settings.jsx` (picture credit in About), `src/index.css`; create `src/Navigation.test.jsx`.

- [ ] **Step 1: Failing tests**: Home has no Settings card and has a Sound It Out card whose text includes the subtitle; the card calls `onNavigate('blend')`; `App` renders a top-bar button labelled Settings that opens Settings; the bottom nav has a Sound It Out item (id `nav-blend`) that opens the game; Settings About shows `PICTURE_CREDIT`.

- [ ] **Step 2: FAIL. Step 3: Implement**: remove the Settings card; add the Sound It Out card in its place (`homeBlendTitle` "Sound It Out" / "Lis les sons", `homeBlendDesc` "Tap the letters, hear the sounds, find the picture." / "Touche les lettres, écoute les sons, trouve l'image."); gear button at the right end of the top bar (primary colour, 44 px, `aria-label={t.settingsLabel}`); route `'blend'` in `renderScreen` wired to `record('word_completed', { source: 'blend', word })`, `record('word_missed', { source: 'blend', letters })`, `record('round_completed', { source: 'blend', level, firstTry })`; bottom nav item with `navBlend` "Sound out" / "Lis". **Step 4: PASS. Step 5: Commit** `feat(nav): Sound It Out on home and bottom nav, settings as a gear`.

### Task 6: Offline, word clips and verification

**Files:** modify `vite.config.js` (precache `pictures/*.svg` and `audio/words/*.mp3`), `scripts/voice/generate.py` (also read `BLEND_WORDS`).

- [ ] **Step 1:** Build before/after: landing `index-*.js` unchanged; report precache entries and KiB added.
- [ ] **Step 2:** Generate takes for blend words without clips (after the Word Forge batch); clean into `recordings/review-words/`; the owner keeps one per word; copy approved clips (Word Forge + blend + praise) to `public/audio/words/`.
- [ ] **Step 3:** Browser QA on the production build: a full round (tiles, say it fast, right, wrong, hint, round end, stars on Home), Level 3 native sounds, Robot mode, gear → Settings, card and bottom nav → game, then offline (server stopped): a round still plays.
- [ ] **Step 4:** Lint, tests, build; commit; merge into `early-testers`; push on the owner's go.
