"""Cut a recording into one clean clip per phonics sound.

    ~/.local/share/lexia-voicelab/.venv/bin/python scripts/voice/cut.py \
        <recording> <clip list> <out dir>

The clip list has one line per clip, `<label> <start s> <end s>`: a window that
contains the sound. A child should hear ONLY the sound, so inside each window:

  1. Keep the main sound: the loudest burst, plus any burst touching it
     (gap < 0.2 s) within 20 dB of it. That keeps X's "k"+"s" together and
     drops breaths, clicks and trailing extras.
  2. Gate so silence is silent (run denoise.py on the recording first).
  3. Trim tight: 0.03 s before, 0.05 s after.
  4. Same loudness for every clip (-20 dB), peak never above -3 dBFS;
     10 ms / 30 ms fades (no clicks). Rumble below 130 Hz removed (steep:
     the owner's voice pitch is 155-258 Hz, so nothing of the voice is lost).
  5. Save as small mono mp3 (22.05 kHz, 48 kbps).
"""
import os
import re
import subprocess
import sys

import numpy as np

SR, HOP = 16000, 160                          # 10 ms analysis frames
TARGET_RMS = -20.0                            # every clip's loudness, dB

src, clip_list, out = sys.argv[1:4]
os.makedirs(out, exist_ok=True)

pcm = subprocess.run(["ffmpeg", "-nostdin", "-loglevel", "error", "-i", src, "-ac", "1",
                      "-ar", str(SR), "-f", "s16le", "-"], capture_output=True, check=True).stdout
x = np.frombuffer(pcm, dtype=np.int16).astype(np.float32) / 32768
frames = x[: len(x) // HOP * HOP].reshape(-1, HOP)
db = 20 * np.log10(np.sqrt((frames ** 2).mean(1)) + 1e-9)


def main_sound(start, end):
    """Seconds (from, to) of the main burst inside the window."""
    a, b = int(start * 100), int(end * 100)
    seg = db[a:b]
    loud = seg > max(seg.max() - 30, -60)
    bursts, st = [], None
    for i, v in enumerate(loud):
        if v and st is None:
            st = i
        if not v and st is not None:
            bursts.append([st, i]); st = None
    if st is not None:
        bursts.append([st, len(loud)])
    merged = []                                  # micro-gaps inside one sound
    for r in bursts:
        if merged and r[0] - merged[-1][1] < 8:
            merged[-1][1] = r[1]
        else:
            merged.append(r)
    bursts = [r for r in merged if r[1] - r[0] >= 3]
    if not bursts:                               # a very quiet sound: keep the window
        return start, end
    peak = lambda r: seg[r[0]:r[1]].max()
    k = max(range(len(bursts)), key=lambda i: peak(bursts[i]))
    lo, hi = bursts[k]
    for r in reversed(bursts[:k]):              # grow left through close, loud bursts
        if lo - r[1] < 20 and peak(r) > peak(bursts[k]) - 20:
            lo = r[0]
        else:
            break
    for r in bursts[k + 1:]:                     # grow right
        if r[0] - hi < 20 and peak(r) > peak(bursts[k]) - 20:
            hi = r[1]
        else:
            break
    return (a + lo) / 100, (a + hi) / 100


for line in open(clip_list):
    if not line.strip() or line.startswith("#"):
        continue
    label, s, e = line.split()
    lo, hi = main_sound(float(s), float(e))
    ss = max(0.0, lo - 0.03)
    dur = round(hi + 0.05 - ss, 3)
    # Noise is removed from the whole recording first (denoise.py); a second
    # FFT denoiser here would make the voice sound watery. The gate only
    # silences what is left around the sound.
    clean = "highpass=f=130,highpass=f=130,agate=threshold=0.01:ratio=4:attack=2:release=40"
    # -nostdin: otherwise ffmpeg swallows the rest of the clip list.
    probe = subprocess.run(["ffmpeg", "-nostdin", "-hide_banner", "-nostats", "-ss", str(ss),
                            "-t", str(dur), "-i", src, "-af", clean + ",volumedetect",
                            "-f", "null", "-"], capture_output=True, text=True).stderr
    # Same loudness for every clip (by how loud the sound is, not its loudest
    # instant), and never above -3 dBFS: a clip turned up to the maximum strains
    # and makes faint noise audible.
    a, b = int(lo * 100), int(hi * 100)
    body = db[a:b]
    active = body[body > body.max() - 20]
    rms = 10 * np.log10(np.mean(10 ** (active / 10)))
    peak = float(re.search(r"max_volume: ([-0-9.]+)", probe).group(1))
    gain = round(min(TARGET_RMS - rms, -3.0 - peak), 2)
    af = (f"{clean},volume={gain}dB,afade=t=in:d=0.01,"
          f"afade=t=out:st={round(dur - 0.03, 3)}:d=0.03")
    subprocess.run(["ffmpeg", "-nostdin", "-hide_banner", "-loglevel", "error", "-y",
                    "-ss", str(ss), "-t", str(dur), "-i", src, "-af", af, "-ac", "1",
                    "-ar", "22050", "-c:a", "libmp3lame", "-b:a", "48k", f"{out}/{label}.mp3"],
                   check=True)
    print(f"{label:4s} kept {lo:6.2f}-{hi:6.2f}  ({dur:.2f}s)  gain {gain:+5.1f} dB")
