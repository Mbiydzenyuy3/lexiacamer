"""Remove steady background noise from a whole recording, before cutting.

    ~/.local/share/lexia-voicelab/.venv/bin/python scripts/voice/denoise.py \
        <recording> <noise start s> <noise end s> <out.wav> [--adaptive]

--adaptive: for noise that changes during the recording (traffic, a fan
speeding up, the phone being moved). Follows the noise over time instead of
assuming it is constant.

Learns the room's noise "fingerprint" from a stretch where nothing is said,
and subtracts it everywhere (noisereduce, MIT licence). Cleaning before the
clips are turned up matters: levelling a clip by +15 dB also raises any hiss
mixed into the voice, which is what a child would hear.
"""
import subprocess
import sys

import noisereduce as nr
import numpy as np
import soundfile as sf

src, n0, n1, out = sys.argv[1], float(sys.argv[2]), float(sys.argv[3]), sys.argv[4]
SR = 44100
pcm = subprocess.run(["ffmpeg", "-nostdin", "-loglevel", "error", "-i", src, "-ac", "1",
                      "-ar", str(SR), "-f", "f32le", "-"], capture_output=True, check=True).stdout
y = np.frombuffer(pcm, dtype=np.float32).copy()
noise = y[int(n0 * SR):int(n1 * SR)]
if "--adaptive" in sys.argv:
    clean = nr.reduce_noise(y=y, sr=SR, stationary=False, prop_decrease=0.95, n_fft=2048,
                            time_constant_s=1.0)
else:
    clean = nr.reduce_noise(y=y, sr=SR, y_noise=noise, stationary=True, prop_decrease=1.0,
                            n_fft=2048)


def level(sig):
    return 20 * np.log10(np.sqrt(np.mean(sig ** 2)) + 1e-12)


print(f"noise stretch: {level(noise):.1f} dB before, {level(clean[int(n0*SR):int(n1*SR)]):.1f} dB after")
sf.write(out, clean, SR, subtype="PCM_16")
