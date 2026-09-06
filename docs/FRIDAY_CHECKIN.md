# LexiaCamer — Friday Check-in

**Goal of LexiaCamer:** a simple, offline-friendly children's reading app
(phonics + spelling, Cameroonian context).

**How it works with Educlynk:** LexiaCamer is a **partner platform**, not a merged
feature. Educlynk puts a **link/button** in its platform that sends users to
LexiaCamer's own site. We own our accounts, data, and backend; Educlynk drives
discovery. (This keeps us independent and lets us partner with others later too.)

Use this sheet to cover: what shipped since last week, what's next, and the
partnership decisions to settle.

---

## 1. Progress since the last check-in

The app went from a working prototype to a **polished, stable version** that runs
on phone, tablet, and desktop.

**Works well everywhere**
- Rebuilt navigation so nothing overlaps or clips on any screen size; onboarding
  is now a clean full-screen flow.

**Easier to understand (no explanation needed)**
- The Sticker Book teaches itself (earn/spend stars, progress counter, and a
  "you collected them all!" reward). The parent area clearly says it's for
  grown-ups.

**More trustworthy / production-ready**
- Crash-safety screen, fixed data bugs in the parent progress report, and every
  button is keyboard- and screen-reader-accessible.

**More content**
- Grew the spelling word list from 32 to 60 (all Cameroonian).

**Cleaner foundation**
- All save/load lives in one place in the code, so plugging in our own backend is
  a contained change.

**In progress: pronunciation**
- The robot voice couldn't say clean letter sounds, so I'm switching phonics to
  **real human recordings** (34 short clips). The app already supports them and
  falls back to the robot voice until they're added. Keeps it light and offline.

---

## 2. What I intend to do next

- **Record the 34 phonics sounds** and drop them in (guide is written).
- Because we're a standalone platform, stand up **our own**: domain, sign-up/login
  (parent/teacher email + OTP, child set up after), and a small backend to store
  each child's progress.
- Wire the Educlynk **link handoff** (start with a simple outbound link).
- Small polish + a real-device test pass.

---

## 3. What I found about Educlynk (context)

From your public sign-in and site: Educlynk has its own login (email/password +
Google), a **Learning Hub** (`learning.educlynk.com`), and account types
**Parent, Tutor, Student**. That's a natural audience for a kids' reading tool —
which is why a **partner link** from the Learning Hub (or a partners section)
makes sense: your users discover us, click through, and use LexiaCamer on our
platform.

---

## 4. Partnership decisions to settle (Friday)

1. **Placement:** where does the link/button live in Educlynk, and how is it shown
   (title, icon, short blurb)?
2. **Handoff:** OK to **start with a simple outbound link** (`?ref=educlynk` for
   tracking), and add smoother single-sign-on later?
3. **Attribution:** do you want click/referral analytics? Any tracking convention
   you prefer?
4. **Branding:** any requirements to be a listed partner (logo, naming, quality
   bar)?
5. **Commercial terms:** referral deal, revenue share, or mutual promotion?

**The two that matter most:** #1 (where the link lives + how it's presented) and
#5 (what the commercial arrangement is).

---

## 5. Quick demo (if time)

Onboard a child → **Word Forge** (spell a word, earn stars, build a streak) →
**Phonics Lab** (tap letter sounds) → **Sticker Book** (unlock a sticker) →
**Parent area** (show progress + struggle areas).
