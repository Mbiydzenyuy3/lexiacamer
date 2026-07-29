# Recording the phonics sounds (phone guide)

We're replacing the robot (TTS) letter sounds with **real human recordings**,
because synthetic voices can't say clean isolated phonics sounds. You only record
the **34 alphabet sounds** below — not words — so it stays small and works for
any country later.

The app already plays a recording when the file exists and falls back to the
robot voice for anything not recorded yet, so you can add clips a few at a time.

---

## 1. What to say — the 34 sounds

Say the **sound**, never the letter name (say "sss", not "ess"). Standard,
clear English. Hold the stretchy sounds; keep the hard stops short and crisp.

| File name | Letter | Say this sound | Like in |
|---|---|---|---|
| `a.mp3` | A | short **a** (/æ/) | **a**pple |
| `b.mp3` | B | **b** (crisp) | **b**all |
| `c.mp3` | C | **k** | **c**at |
| `d.mp3` | D | **d** | **d**og |
| `e.mp3` | E | short **e** (/ɛ/) | **e**gg |
| `f.mp3` | F | **fff** (hold) | **f**ish |
| `g.mp3` | G | hard **g** | **g**oat |
| `h.mp3` | H | **h** (breathe) | **h**at |
| `i.mp3` | I | short **i** (/ɪ/) | **i**gloo |
| `j.mp3` | J | **j** | **j**am |
| `k.mp3` | K | **k** | **k**ite |
| `l.mp3` | L | **lll** (hold) | **l**ion |
| `m.mp3` | M | **mmm** (hum) | **m**oon |
| `n.mp3` | N | **nnn** (hum) | **n**et |
| `o.mp3` | O | short **o** (/ɒ/) | **o**ctopus |
| `p.mp3` | P | **p** | **p**ig |
| `q.mp3` | Q | **kw** | **qu**een |
| `r.mp3` | R | **rrr** | **r**ed |
| `s.mp3` | S | **sss** (hold) | **s**un |
| `t.mp3` | T | **t** | **t**op |
| `u.mp3` | U | short **u** (/ʌ/) | **u**mbrella |
| `v.mp3` | V | **vvv** (hold) | **v**an |
| `w.mp3` | W | **w** | **w**et |
| `x.mp3` | X | **ks** | fo**x** |
| `y.mp3` | Y | **y** | **y**es |
| `z.mp3` | Z | **zzz** (buzz) | **z**oo |
| `ch.mp3` | CH | **ch** | **ch**air |
| `sh.mp3` | SH | **sh** (shhh) | **sh**ip |
| `th.mp3` | TH | **th** | **th**in |
| `ph.mp3` | PH | **f** | **ph**one |
| `ng.mp3` | NG | the **ng** sound | starting **Ng**ong |
| `nd.mp3` | ND | the **nd** sound | starting **Nd**olé |
| `mb.mp3` | MB | the **mb** sound | starting **Mb**ang |
| `nk.mp3` | NK | the **nk** sound | starting **Nk**ongsamba |

Ideally the **same person** records all 34, for a consistent voice.

---

## 2. Record on your phone

1. **Quiet room** with soft things (bed, curtains, carpet). Avoid echoey rooms
   (bathroom, empty kitchen). Pro trick: sit in a wardrobe or drape a blanket
   over your head + phone — it kills echo.
2. Turn on **Do Not Disturb / Airplane mode** so no notifications interrupt.
3. Open **Voice Recorder** (Android) / **Voice Memos** (iPhone).
4. Hold the phone about **a hand's width from your mouth, slightly to the side**
   (so breath doesn't "pop"). Don't touch the phone while recording.
5. Read the list. For each letter, **say only the sound, then pause ~1 second**,
   then the next. Mistake? Pause and say it again.

**Two ways — pick one:**
- **One long recording** (recommended): all 34 sounds in a single take with
  pauses. One file. It gets split into 34 clips on a computer afterwards.
- **Separate recordings**: record each sound as its own short memo (34 memos).
  No splitting, but more files to handle.

---

## 3. Get the files ready

1. **Send them to a computer**: email them to yourself, AirDrop, Google Drive,
   or a USB cable.
2. **Split + convert with Audacity** (free):
   - One-take file: `File → Import → Audio`, then `Select All → Analyze →
     Label Sounds` (auto-marks each sound), type the letter into each label,
     then `File → Export → Export Multiple → split by Labels → MP3`.
   - Separate files: just `File → Export → Export as MP3` for each, named by
     its letter.
3. **Name every file exactly** as in the table (`a.mp3`, `ch.mp3`, `ng.mp3`).

---

## 4. Add them to the app

Put the MP3s in:

```
public/audio/phonics/
```

That's it. The app picks them up automatically — recorded sounds play in both
**Phonics Lab** and **Word Forge**, and any letter you haven't recorded yet
still uses the robot voice. They're bundled for **offline** use too.

> Tip: even 2–3 clips are enough to test. Add `a.mp3` and `b.mp3`, open Phonics
> Lab, tap A and B — you'll hear your recordings; the rest stay on the robot
> voice until you add them.
