# Sound It Out: a blending game

Status: design approved in conversation 2026-09-29; spec and word list awaiting review.
Branch: built on `feat/sound-it-out`, merged into `early-testers` when verified.

## Why

LexiaCamer teaches letter sounds (Phonics Lab) and spelling (Word Forge), but not
**blending**: hearing the sounds of written letters and joining them into a
word. Blending *is* reading. The evidence for children learning with no teacher
(Global Learning XPRIZE: Kitkit School, onebillion; Feed the Monster) and for
systematic synthetic phonics puts blending plus decodable words at the centre.
The game must work fully offline and for a child alone.

## A round

Five words from the child's current level. For each word:

1. The word appears as letter tiles, one tile per sound: `S U N`, `F I SH`.
2. The child taps each tile: it lights up and plays that sound (the owner's
   recording).
3. **Say it fast** plays the tile sounds one after another, quickly, in order.
4. Three pictures appear: the word's picture and two from the same level.
5. **Right:** the word is spoken in the owner's cloned voice ("sun!"), then
   praise and a star. **Wrong:** the sounds replay; after two wrong taps the
   right picture glows, so a child alone is never stuck.

End of round: confetti and the stars earned. A round with at least 4 of 5 right
on the first try unlocks the next level. Earlier levels keep coming back: each
round draws one word from an unlocked earlier level when there is one.

## Words (draft for the owner to check)

Only words made entirely of recorded sounds (A-Z, CH, SH, TH, PH, NG, ND, MB,
NK), no double letters, no silent letters, each with a clear picture.

| Level | Sounds from | Words (picture) |
|---|---|---|
| 1 | standard | sun (sun), cat (cat), pig (pig), hen (hen), dog (dog), bus (bus), fox (fox), box (package), ant (ant), bat (bat), bed (bed), van (van) |
| 2 | standard | fish (fish), milk (glass of milk), frog (frog), hand (raised hand), drum (drum), flag (flag), tent (tent), crab (crab), ship (ship), nest (nest) |
| 3 | **native** | mama (woman), papa (man), koki (beans), kribi (beach), buea (mountain) |

Level 3 plays each letter with the owner's **native** recordings: in these
Cameroonian words the letters take the native sounds (u as "oo", i as "ee").
Candidates without a clear picture (fufu, sisi, tabi) are left out unless the
owner picks a picture.

Data: `src/blendWords.js`, one entry per word:
`{ word: 'fish', sounds: ['f', 'i', 'sh'], picture: '1f41f', level: 2, voice: 'standard' }`.

## Pictures

Twemoji SVGs, bundled in `public/pictures/` (one file per picture, about 1-2 KB
each, ~40 KB total). System emoji render differently per phone and show as
empty boxes on older Android; bundled SVGs look the same everywhere and work
offline. Licence: CC-BY 4.0 (commercial use allowed). Credit line added to
Settings > About: "Pictures: Twemoji by Twitter, CC-BY 4.0".

## Sound

- Tile sounds: `speechEngine.speakLetter` with the word's voice: `standard`, or
  `native` for level 3. When the child chose **Robot voice** in Settings,
  everything uses the robot voice.
- **Say it fast:** the tile clips played back to back (next one starts when the
  previous ends, about 80 ms gap).
- Word: `public/audio/words/<word>.mp3`, the owner's cloned voice, made with
  `scripts/voice/generate.py` and chosen by ear like the Word Forge words. A
  missing clip falls back to the robot voice.
- Praise: the praise clips being made for Word Forge.

## Progress and stars

No database change. The server accepts a fixed list of event kinds, so the game
uses existing ones:

- right answer: `word_completed`, payload `{ source: 'blend', word }` (star,
  counts in "words" on the parent dashboard);
- wrong answer: `word_missed`, payload `{ source: 'blend', letters: sounds }`
  (feeds the dashboard's "letters your child misses");
- end of round: `round_completed`, payload `{ source: 'blend', level, firstTry }`.

The child's current level and unlocked levels are kept on the phone in
`localStorage` (`lexia_blend_state`), like Word Forge's progress.

## Home screen and navigation

- Home: the **Settings card is removed**. **Sound It Out** takes its place:
  title "Sound It Out" / "Lis les sons", subtitle "Tap the letters, hear the
  sounds, find the picture." / "Touche les lettres, écoute les sons, trouve
  l'image."
- Top bar: a **gear icon at the far right** opens Settings. Visible (primary
  colour, 44 px tap target), `aria-label` "Settings" / "Réglages".
- Bottom nav: a **Sound It Out** item joins Home, Sounds and Spelling (short
  label "Sound out" / "Lis").

## Weight

About 40 KB of pictures, about 150 KB of word clips, about 5 KB of code (gzip),
all saved for offline. The landing page is unchanged. Measured and reported
before shipping.

## Testing

- Data: every word's sounds join to spell the word; every sound has a clip for
  the word's voice; every word has a picture file and a word clip, or is flagged
  as missing its clip (robot fallback).
- Round logic (pure functions): 5 words from the level, one review word when an
  earlier level is unlocked, 3 distinct choices including the answer, level-up
  at 4 of 5 first-try, hint after 2 wrong.
- Component: tap a tile plays its sound; Say it fast plays all in order; right
  and wrong flows; hint glow.
- Navigation: gear opens Settings; card and bottom nav open the game; no
  Settings card on Home.
- Browser: full round on the production build, including offline.

## Not in this version

Child-controlled blending of longer words, sentences and stories, letter
tracing, a learning path across the whole app. See the research notes in the
conversation of 2026-09-29; to be decided with testers' feedback.
