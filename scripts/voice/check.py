"""Check a folder of phonics clips before it goes into the app.

    ~/.local/share/lexia-voicelab/.venv/bin/python scripts/voice/check.py <dir> <standard|native>

Every expected sound present once, nothing extra, and each clip: 0.2-2.0 s
long, not clipped (distorted), silent at both ends, loudness close to the rest.
"""
import os
import subprocess
import sys

import numpy as np

folder, kind = sys.argv[1], sys.argv[2]
LETTERS = [chr(c) for c in range(ord("a"), ord("z") + 1)]
EXPECTED = LETTERS + ["ch", "sh", "th", "ph", "ng", "nd", "mb", "nk"] if kind == "standard" else LETTERS

files = sorted(f[:-4] for f in os.listdir(folder) if f.endswith(".mp3"))
missing = [e for e in EXPECTED if e not in files]
extra = [f for f in files if f not in EXPECTED]
print(f"{kind}: {len(files)} clips | missing: {missing or 'none'} | extra: {extra or 'none'}")

rows, loud = [], {}
for name in files:
    pcm = subprocess.run(["ffmpeg", "-nostdin", "-loglevel", "error", "-i", f"{folder}/{name}.mp3",
                          "-ac", "1", "-ar", "16000", "-f", "s16le", "-"], capture_output=True).stdout
    x = np.frombuffer(pcm, dtype=np.int16).astype(np.float32) / 32768
    dur = len(x) / 16000
    peak = 20 * np.log10(np.abs(x).max() + 1e-9)
    edge = lambda s: 20 * np.log10(np.sqrt(np.mean(s ** 2)) + 1e-9)
    start, end = edge(x[:160]), edge(x[-320:])
    fr = x[: len(x) // 160 * 160].reshape(-1, 160)
    db = 20 * np.log10(np.sqrt((fr ** 2).mean(1)) + 1e-9)
    loud[name] = np.percentile(db, 75)
    problems = []
    if not 0.2 <= dur <= 2.0:
        problems.append(f"length {dur:.2f}s")
    if peak > -0.3:
        problems.append("may be distorted")
    if start > -35:
        problems.append(f"starts abruptly ({start:.0f} dB)")
    if end > -35:
        problems.append(f"ends abruptly ({end:.0f} dB)")
    rows.append((name, dur, problems))

median = np.median(list(loud.values()))
for name, dur, problems in rows:
    if loud[name] < median - 10:
        problems.append(f"quieter than the rest ({loud[name] - median:.0f} dB)")
    print(f"  {name:3s} {dur:4.2f}s  {'OK' if not problems else '; '.join(problems)}")
