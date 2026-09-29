# Phonics voice clips

The app plays one mp3 per phonics sound from `public/audio/phonics/<sound>.mp3`
(`a.mp3` … `z.mp3`, `ch.mp3`, `sh.mp3`, `th.mp3`, `ph.mp3`, `ng.mp3`, `nd.mp3`,
`mb.mp3`, `nk.mp3`). Every sound is a real recording of the owner's voice:
AI voices could not say isolated phonics sounds cleanly.

Raw recordings live in `recordings/` (gitignored: a clean voice recording is
exactly what someone would need to clone the voice, and this repo is public).

## One-time setup

```bash
mkdir -p ~/.local/share/lexia-voicelab && cd ~/.local/share/lexia-voicelab
uv venv --python 3.11 .venv
uv pip install --python .venv/bin/python noisereduce soundfile numpy
```

`ffmpeg` must be installed.

## From a recording to clips

```bash
PY=~/.local/share/lexia-voicelab/.venv/bin/python

# 1. Remove the room's background noise. Give a stretch (in seconds) where
#    nothing is said, so the tool can learn what the noise sounds like.
$PY scripts/voice/denoise.py recordings/my-voice.aac 66.2 70.5 recordings/refs/my-voice-clean.wav

# 2. Cut one clip per sound. The list gives a time window around each sound;
#    cut.py keeps only the sound itself (no breaths, clicks or extra speech).
$PY scripts/voice/cut.py recordings/refs/my-voice-clean.wav scripts/voice/alphabet.txt recordings/review
```

Listen to every clip in `recordings/review/` before copying it into
`public/audio/phonics/`.

## Exceptions chosen by ear

- `standard/ph.mp3` is a copy of `native/f.mp3` (PH makes the F sound, and the
  owner preferred that recording). After recutting, copy it again:
  `cp recordings/review-native/f.mp3 recordings/review/ph.mp3`
- `standard/th.mp3` is a copy of `native/t.mp3`, also chosen by ear:
  `cp recordings/review-native/t.mp3 recordings/review/th.mp3`
