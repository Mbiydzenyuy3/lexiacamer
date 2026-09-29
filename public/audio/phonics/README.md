# Letter-sound recordings

One folder per voice, one mp3 per sound (`b.mp3`, `ch.mp3`, …):

- `standard/`: the default voice. All 34 sounds. Saved for offline on install.
- `native/`: native pronunciation of A–Z. Two-letter sounds fall back to
  `standard/`. Downloaded only when a child picks it in Settings.

The list of voices, their sounds and fallbacks is `src/letterSounds.js`; a test
fails if a listed sound has no file here. How the clips are made from the raw
recordings: `scripts/voice/README.md`.

_This README is not used by the app._
