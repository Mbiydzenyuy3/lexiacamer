# LexiaCamer × Educlynk — Integration Brief

**What LexiaCamer is:** a simple, offline-capable reading/phonics app for young children (ages ~4–7). It teaches letter sounds (Phonics Lab) and spelling (Word Forge), rewards progress with stars/stickers, and gives adults a progress dashboard. It's built as a React PWA and is meant to ship **as a feature inside the Educlynk Learning Hub**.

This brief proposes how it plugs into Educlynk and lists exactly what we need from your team.

---

## What we understand about the Educlynk stack (from public surface — please correct us)
- **Auth:** custom React/Vite SPA at `auth.educlynk.com` (not an OIDC/OAuth provider).
- **Backend/API:** `api.educlynk.com`, **JWT access tokens (Bearer)**, tokens kept in `localStorage`.
- **Social login:** Google Identity Services. **OTP** flows already exist in the auth app.
- **Roles:** `Parent`, `Tutor`, `Student`.
- **Home for us:** `learning.educlynk.com` — "Educlynk Learning Hub" (its own React/Vite app).

## Proposed integration model
1. **Delivery:** LexiaCamer ships as a **module/route inside the Learning Hub app** (same origin as `learning.educlynk.com`). Same origin means we can read the existing session token and share the backend — matching "shipped together, same DB/backend."
2. **Auth:** **no separate login.** The user is already authenticated in Educlynk. LexiaCamer reads the current **JWT** and calls `api.educlynk.com`. If we end up on a different origin, you hand us the token at load (e.g. `postMessage` or a short-lived token param).
3. **Roles → access** (maps cleanly to what you already have):
   - **Student** = the child using the app (kid mode, offline-capable).
   - **Parent** = sees their own child's progress.
   - **Tutor** = the "teacher"; sees the progress of students they're linked to — **using your existing tutor↔student relationship** (no separate mechanism, no parent-email sharing).
4. **Data:** child reading-progress is **stored in your backend** via `api.educlynk.com`, keyed by the Educlynk user/student id. The kid app writes locally first and **syncs when online** (offline-first); dashboards read the server record as source of truth.
5. **Keeping kids out of the dashboard on a shared device:** a lightweight adult check (a simple math question) on the child's device. The authoritative data is server-side and only fetched by an authenticated adult, so a child can't tamper with what adults see.

## What we need to store per child (so you can model the table[s])
```json
{
  "childId": "<educlynk student/user id>",
  "profile":  { "name": "string", "avatar": "lion | parrot | tortoise | dog" },
  "stats":    { "words": 0, "streak": 0, "stars": 0 },
  "missedPhonemes":   { "A": 3, "TH": 1 },     // letters the child struggles with
  "unlockedStickers": ["lion_cub", "baobab"],
  "updatedAt": "ISO-8601"
}
```
Small, bounded, one row per child. Writes are simple upserts; a monotonic `updatedAt` (or version) lets us resolve offline-sync conflicts (last-write-wins is fine for v1).

## What we need from your engineers (Friday)
1. **Delivery:** module/route inside the Learning Hub app (same origin), or a separately-hosted embedded app? *(Decides how we get the token.)*
2. **Auth handoff:** how do we obtain the current user + JWT — read the shared `localStorage` token (same origin), or do you pass it to us?
3. **Relationships:** which `api.educlynk.com` endpoints expose **parent↔child** and **tutor↔student** links (so the dashboards show the right children)?
4. **Child model:** how is a **young child (4–7)** represented — a full `Student` account, or a **child-profile under a Parent/Tutor** account? *(Young kids can't do email/password login; this drives onboarding.)*
5. **Progress storage:** can we add LexiaCamer tables to your DB (shape above), or is there a preferred service/endpoint pattern? Read + upsert endpoints keyed by child id.
6. **OTP:** can we reuse your existing OTP for an optional dashboard gate, or is platform login sufficient?
7. **Offline sync:** confirm write endpoints are **idempotent** (safe to retry) so the offline outbox can re-send without double-counting.

## What LexiaCamer already handles on its side
- Offline-first PWA; **all persistence funnels through one module (`store.js`)** — swapping localStorage for your API is a one-file change, not a rewrite.
- Error boundary, audio fallback, keyboard/screen-reader accessibility, responsive on phone/tablet/desktop.
- Standard-English pronunciation via TTS (no heavy audio files; scales beyond Cameroon).

---
*Prepared for the weekly progress check-in. Findings about Educlynk are from public inspection only; please confirm/correct.*
