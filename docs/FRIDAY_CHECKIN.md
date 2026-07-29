# LexiaCamer — Friday Check-in

**Goal of LexiaCamer:** a simple, offline-friendly children's reading app
(phonics + spelling, Cameroonian context) to ship as a **feature inside the
Educlynk platform** — specifically the **Learning Hub**.

Use this sheet to talk through: what shipped since last week, what's next, and
the decisions I need from you (Educlynk) to move on integration.

---

## 1. Progress since the last check-in

The app went from a working prototype to a **polished, stable, self-contained
version** that runs on phone, tablet, and desktop.

**Works well everywhere**
- Rebuilt the navigation so nothing overlaps or clips on any screen size
  (the old top-bar overlap on phones is gone; nav is clean on desktop too).
- Every screen scrolls properly; onboarding is now a clean full-screen flow.

**Easier to understand (no explanation needed)**
- The Sticker Book now teaches itself (how to earn/spend stars, a progress
  counter, and a "you collected them all!" reward).
- The parent area clearly says it's for grown-ups.

**More trustworthy / production-ready**
- Added a crash-safety screen (a bug can't white-screen the whole app).
- Fixed data bugs in the parent progress report (it now shows the right
  letters a child struggles with).
- Made every button keyboard- and screen-reader-accessible.

**More content**
- Grew the spelling word list from 32 to 60 (all Cameroonian).

**Ready for your backend**
- Moved all save/load into a single place in the code, so plugging into
  Educlynk's database later is a small change, not a rewrite.

**In progress: pronunciation**
- The robot voice couldn't say clean letter sounds, so I'm switching the
  phonics sounds to **real human recordings** (34 short clips, one per
  letter-sound). The app already supports them and falls back to the robot
  voice until they're added. This keeps the app light and works offline.

---

## 2. What I intend to do next

- **Record the 34 phonics sounds** and drop them in (guide is written).
- **Data model + sync sketch** so the moment we agree on integration, coding
  starts immediately (no design delay).
- Small polish and a real-device test pass.
- Then, pending your answers below: **the actual Educlynk integration** (auth +
  storing each child's progress in your backend).

---

## 3. What I found about Educlynk (so we start from facts)

From your public sign-in and site:
- Educlynk has its **own login** (email/password + Google) at
  `auth.educlynk.com`, with **Parent, Tutor, Student** account types.
- Backend is **`api.educlynk.com`** using **JWT access tokens**.
- There's a **Learning Hub** (`learning.educlynk.com`) — the natural home for
  LexiaCamer.

**What this means:** LexiaCamer should **reuse Educlynk's login and backend**,
not build its own. A **Tutor is the "teacher"**, and since Educlynk already
links tutors to their students, a tutor can see a child's reading progress with
no extra work. Parents see their own child. The child uses an offline "kid mode";
the real progress is stored on your server so parents/tutors always see the truth
(kids can't tamper with it).

---

## 4. Questions for Educlynk (to unblock integration)

1. **Where does LexiaCamer live** — a section inside the Learning Hub app (same
   origin), or its own embedded app? *(Decides how we get the logged-in user.)*
2. **How do we receive the logged-in user + token** — read the shared login
   token, or does the platform pass it to us?
3. **How is a young child represented** in your system — a full Student account,
   or a child profile under a Parent/Tutor? *(Young kids can't do
   email/password login — this shapes onboarding.)*
4. **Which API endpoints** expose the parent-child and tutor-student links we'd
   read for the dashboards?
5. **How should we store per-child reading progress** (stars, streak, words,
   struggle areas) — new tables in your database keyed by student id?
6. **Children's data / privacy** — who owns it, where is it stored, any rules we
   must follow?

**The three that matter most:** #1 (how it embeds), #3 (how a child is
represented), #5 (where progress is stored).

---

## 5. Quick demo (if time)

Onboard a child → **Word Forge** (spell a word, earn stars, build a streak) →
**Phonics Lab** (tap letter sounds) → **Sticker Book** (unlock a sticker) →
**Parent area** (show progress + struggle areas).
