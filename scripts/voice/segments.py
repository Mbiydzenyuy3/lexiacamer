"""List the separate sounds in a recording, with times, to build a clip list.

    ~/.local/share/lexia-voicelab/.venv/bin/python scripts/voice/segments.py <recording>

A sound is anything 12 dB above the room noise; parts closer than 0.15 s are
one sound, and blips shorter than 0.08 s (clicks) are ignored.
"""
import subprocess
import sys

import numpy as np

pcm = subprocess.run(["ffmpeg", "-nostdin", "-loglevel", "error", "-i", sys.argv[1], "-ac", "1",
                      "-ar", "16000", "-f", "s16le", "-"], capture_output=True, check=True).stdout
x = np.frombuffer(pcm, dtype=np.int16).astype(np.float32) / 32768
f = x[: len(x) // 160 * 160].reshape(-1, 160)
db = 20 * np.log10(np.sqrt((f ** 2).mean(1)) + 1e-9)
noise = np.percentile(db, 10)
voiced = db > noise + 12
regions, st = [], None
for i, v in enumerate(voiced):
    if v and st is None:
        st = i
    if not v and st is not None:
        regions.append([st, i]); st = None
if st is not None:
    regions.append([st, len(voiced)])
merged = []
for r in regions:
    if merged and r[0] - merged[-1][1] < 15:
        merged[-1][1] = r[1]
    else:
        merged.append(r)
merged = [r for r in merged if r[1] - r[0] >= 8]
print(f"room noise {noise:.1f} dB, {len(merged)} sounds, total {len(db)/100:.1f}s")
for n, (a, b) in enumerate(merged, 1):
    print(f"{n:2d}  {a/100:6.2f} - {b/100:6.2f}  ({(b-a)/100:.2f}s, peak {db[a:b].max():5.1f} dB)")
