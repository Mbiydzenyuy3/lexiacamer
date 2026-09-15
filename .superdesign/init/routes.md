# Routes — LexiaCamer

**No router library.** There is no `react-router`, no file-based routing. Navigation is a single `screen` string in `src/App.jsx` state, switched by `handleNavigate(target)` and rendered by a `switch` in `renderScreen()`.

`public/_redirects` sends every path to `index.html` (SPA fallback), so any URL the marketing side uses (`/early-tester`, `/landing`) resolves to the same bundle.

## Screen map

| `screen` value | Component | Reached from |
|---|---|---|
| `onboarding` | `src/Onboarding.jsx` | Auto, when `user.name` is unset. Hides top bar and bottom nav. |
| `home` (default) | `src/HomeScreen.jsx` | Logo, avatar, bottom-nav "Home" |
| `phonics` | `src/PhonicsLab.jsx` | Home menu card, bottom-nav "Sounds" |
| `forge` | `src/WordForge.jsx` | Home menu card, bottom-nav "Spelling" |
| `sticker_book` | `src/StickerBook.jsx` | Home menu card, stars button |
| `parent_dashboard` | `src/ParentDashboard.jsx` | Top-bar "Dashboard" |
| `settings` | `src/Settings.jsx` | Home menu card |

## Gate (sits in front of all of the above)

`src/EarlyTester.jsx` renders instead of the entire app when `localStorage.lexia_tester` is unset. Its `onStart` flips `isTester` and the app shell appears. **A landing page would live in front of or alongside this gate**, and its primary CTA leads into it.

## Page summaries

- **HomeScreen** — greeting hero (`Hi, {name}`), three stat cards (words / streak / stars), a 2x2 menu grid (Phonics Lab, Word Forge, Sticker Book, Settings), and an amber "Tip of the Day" card.
- **PhonicsLab** — letter/sound practice; awards +2 stars per correct sound, shares a streak with Word Forge.
- **WordForge** — spelling game; +5 stars per correct word, +20 per completed round.
- **StickerBook** — spend stars on stickers.
- **ParentDashboard** — read-only progress: what the child is doing well and what they are missing. Nobody can edit a child's record.
- **Settings** — dyslexia mode, language.
- **Onboarding** — name and avatar, full screen, no chrome.
