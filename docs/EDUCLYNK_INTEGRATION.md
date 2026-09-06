# LexiaCamer × Educlynk — Partnership Brief

**What LexiaCamer is:** a simple, offline-capable reading/phonics app for young
children (ages ~4–7). It teaches letter sounds (Phonics Lab) and spelling
(Word Forge), rewards progress with stars/stickers, and gives adults a progress
dashboard. It is its **own standalone platform** (a React PWA on its own domain).

**The model:** LexiaCamer is a **partner**, not a merged feature. Educlynk places
a **link/button** in its platform that sends users to LexiaCamer's own site.
LexiaCamer owns its users, accounts, data, and backend; Educlynk drives
traffic/discovery. This keeps both products independent and lets each move at its
own pace.

---

## How it works

```
Educlynk (Learning Hub / partners area)
      │  "Reading for young kids →"  (link/button)
      ▼
LexiaCamer  (yourdomain.com)  — own login, own backend, own data
```

Nothing about Educlynk's internal stack has to change. They add a link; we handle
everything on the other side.

## The handoff — two options

**Option A — Plain link (start here, ships in days):**
- The button points to `yourdomain.com?ref=educlynk`.
- Users sign up / log in **on LexiaCamer** (parent/teacher email + OTP; child set
  up after).
- The `?ref=educlynk` parameter lets both sides see the traffic came from Educlynk.
- **Educlynk effort: place one link.** No engineering integration needed.

**Option B — Single sign-on handoff (nicer, add later):**
- Educlynk passes the signed-in user (a short-lived signed token or verified
  email) in the link, so users skip re-registering on our side.
- Requires a small amount of Educlynk engineering; do it once the partnership is
  proven.

**Recommendation:** launch with **Option A**, upgrade to **Option B** later.

## What each side owns

| | Educlynk | LexiaCamer |
|---|---|---|
| Placement / traffic | ✅ link + presentation | — |
| Accounts & login | — | ✅ own (email + OTP, Google optional) |
| Child progress data | — | ✅ own backend/DB |
| Kids' data & privacy | — | ✅ our responsibility |
| Hosting & uptime | — | ✅ ours |
| Attribution / analytics | shared via `?ref=` | shared via `?ref=` |

## What we need from Educlynk (Friday)

1. **Placement:** where does the button/link live (Learning Hub? a partners
   section?) and how is it presented (title, icon, blurb)?
2. **Handoff:** confirm we start with a **plain outbound link + `?ref=educlynk`**,
   SSO later.
3. **Attribution:** do you want click analytics / referral tracking? Any UTM
   convention you prefer?
4. **Branding:** any rules for being a listed partner (logo, naming, quality bar)?
5. **Commercial terms:** referral deal, revenue share, or mutual promotion?

## What LexiaCamer handles on its own side

- **Own auth:** parent/teacher email + OTP; a simple math-gate keeps children out
  of the adult dashboard on shared devices.
- **Own backend + data:** child progress (stars, streak, words, struggle areas,
  stickers) stored server-side so parents/teachers always see the true record and
  kids can't tamper with it. All persistence already funnels through one module
  (`store.js`), so wiring our own API is a contained change.
- **Roles:** parent, tutor/teacher, guardian — each linked to a child so any of
  them can view that child's progress (a child can have several linked adults).
- **Standalone PWA:** offline-capable, error-safe, accessible, responsive on
  phone/tablet/desktop; standard-English phonics (moving to recorded sounds).

---
*Prepared for the weekly progress check-in. Partner-link model: Educlynk links out
to LexiaCamer's own platform; LexiaCamer owns accounts, data, and backend.*
