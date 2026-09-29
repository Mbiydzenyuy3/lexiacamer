"""Generate Word Forge words and praise in the owner's cloned voice (Chatterbox, MIT).

    ~/.local/share/lexia-voicelab/.venv/bin/python scripts/voice/generate.py \
        <reference.wav> <out dir> [word ...]

With no words given: every word in src/i18n.js's wordData that has no approved
clip (public/audio/words/ or recordings/approved-words/), plus the English
praise phrases. Use recordings/refs/words-style.wav as the reference: it is
built from the owner's approved words, so new words copy that pronunciation. So adding words
to the app later and re-running this makes takes only for the new ones.

Three takes per item, written differently, because very short inputs can make
the model add noises: the owner listens and picks. Resumable: existing takes
are skipped. Letter sounds are NOT generated: those are real recordings.
"""
import json
import os
import re
import subprocess
import sys

import torchaudio as ta
from chatterbox.tts import ChatterboxTTS

REF, OUT = sys.argv[1], sys.argv[2]
ONLY = [w.upper() for w in sys.argv[3:]]
os.makedirs(OUT, exist_ok=True)

# How to SAY a word, where plain capitals would mislead the model.
SPOKEN = {
    "NDOLE": "Ndolé", "LIMBE": "Limbé", "YAOUNDE": "Yaoundé", "EDEA": "Edéa",
    "BUEA": "Bwea", "NJOYA": "Njoya", "NGWA": "Ngwa",
    "PUFFPUFF": "Puff-puff",
}
PRAISE = {
    "praise-great-job": "Great job!", "praise-amazing": "Amazing!",
    "praise-well-done": "Well done!", "praise-superstar": "Superstar!",
}

# Word Forge words, then Sound It Out words (lower case there), without repeats.
words = json.loads(subprocess.run(
    ["node", "--input-type=module", "-e",
     "const a = await import('./src/i18n.js'); const b = await import('./src/blendWords.js');"
     "const all = [...a.wordData.map(w => w.word), ...b.BLEND_WORDS.map(w => w.word.toUpperCase())];"
     "console.log(JSON.stringify([...new Set(all)]))"],
    capture_output=True, text=True, check=True).stdout)

items = {}
for w in words:
    if ONLY and w not in ONLY:
        continue
    if not ONLY and (os.path.exists(f"public/audio/words/{w.lower()}.mp3")
                     or os.path.exists(f"recordings/approved-words/{w.lower()}.mp3")
                     or w == "FISH"):         # FISH: 3 approved takes, owner picks one
        continue                                  # already approved
    say = SPOKEN.get(w, w.capitalize())
    # Pilot (Fish, Kribi, Ndolé, Yaoundé): "Word!" and "Word. Word." came out
    # clean; "Word." added stray noises. "Word!" twice, since each take differs.
    items[w.lower()] = [f"{say}!", f"{say}. {say}.", f"{say}!"]
if not ONLY:
    for key, text in PRAISE.items():
        if not os.path.exists(f"public/audio/words/{key}.mp3"):
            items[key] = [text, text, text]       # sentences: plain text is stable

model = ChatterboxTTS.from_pretrained(device="cpu")
for key, variants in items.items():
    for i, text in enumerate(variants, 1):
        path = f"{OUT}/{key}-{i}.wav"
        if os.path.exists(path):
            continue
        wav = model.generate(text, audio_prompt_path=REF, exaggeration=0.5, cfg_weight=0.5)
        ta.save(path, wav, model.sr)
        print(f"{key}-{i}  {text!r:24}  {wav.shape[-1] / model.sr:.2f}s", flush=True)
