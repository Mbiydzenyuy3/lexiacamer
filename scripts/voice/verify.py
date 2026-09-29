"""Flag word takes that do not sound like their word, before the owner listens.

    ~/.local/share/lexia-voicelab/.venv/bin/python scripts/voice/verify.py <dir>

Transcribes every "<word>-<n>.mp3" with faster-whisper (MIT) and scores how
close it sounds to the word. It cannot judge Cameroonian pronunciation (the
model mishears "Kribi" as "creepy"), so a low score means "listen carefully",
not "wrong". It does catch takes that say something else entirely: every Puff
take said "half", "pa pa" or "ha".
"""
import difflib
import os
import re
import sys

from faster_whisper import WhisperModel

folder = sys.argv[1]
model = WhisperModel("small.en", device="cpu", compute_type="int8")
rows = []
for f in sorted(os.listdir(folder)):
    m = re.match(r"^(.+?)-(\d+)\.mp3$", f)
    if not m:
        continue
    word = m.group(1).replace("praise-", "").replace("-", " ")
    segs, _ = model.transcribe(os.path.join(folder, f), beam_size=5, language="en")
    heard = re.sub(r"[^a-z ]", "", " ".join(s.text for s in segs).lower()).strip()
    score = difflib.SequenceMatcher(None, word.replace(" ", ""), heard.replace(" ", "")).ratio()
    rows.append((f, heard, score))

with open(os.path.join(folder, "_check.txt"), "w") as out:
    out.write("Automatic check. LOW = listen carefully (may say another word);\n"
              "Cameroonian words often score low even when right.\n\n")
    for f, heard, score in rows:
        out.write(f"{'LOW ' if score < 0.5 else 'ok  '} {f:24s} heard: {heard!r}\n")
low = sum(1 for r in rows if r[2] < 0.5)
print(f"{len(rows)} takes checked, {low} flagged LOW -> {folder}/_check.txt")
