# Pages — dependency trees

Every screen is a direct child of `src/App.jsx`; there are no nested page layouts. Shared CSS comes from `src/index.css`, imported once in `src/main.jsx`.

## Shell (always loaded)
Entry: `src/main.jsx`
- `src/index.css`
- `src/ErrorBoundary.jsx`
- `src/App.jsx`
  - `src/avatars.js`
  - `src/speech.js`
  - `src/store.js`
  - `src/i18n.js`
  - `src/lib/supabase.js`
  - `src/EarlyTester.jsx`
    - `src/lib/supabase.js`
  - `src/FeedbackButton.jsx`
    - `src/lib/supabase.js`

## / (Home)
Entry: `src/HomeScreen.jsx`
Dependencies:
- `lucide-react` (BookOpen, Flame, Star, Type, ChevronRight, Hammer, Lightbulb, Settings, ShieldCheck, Cat, Bird, Snail, Dog)
- props only: `t` (from `src/i18n.js`), `user`, `stats`, `onNavigate`

## Early-tester gate (the marketing-adjacent surface)
Entry: `src/EarlyTester.jsx`
Dependencies:
- `src/lib/supabase.js`
- `lucide-react` (ArrowRight, Check, FlaskConical, Volume2, MessageSquare)

**For a landing-page design, this is the page to pass as context** together with `src/index.css` tokens: it already sets the product's marketing voice (honest about what is unfinished, three questions maximum, WhatsApp-or-email contact).

## Phonics Lab
Entry: `src/PhonicsLab.jsx` — deps: `src/speech.js`, `src/Confetti.jsx`, `lucide-react`

## Word Forge
Entry: `src/WordForge.jsx` — deps: `src/speech.js`, `src/Confetti.jsx`, `lucide-react`

## Sticker Book
Entry: `src/StickerBook.jsx` — deps: `src/avatars.js`, `lucide-react`

## Parent Dashboard
Entry: `src/ParentDashboard.jsx` — deps: `lucide-react`

## Settings
Entry: `src/Settings.jsx` — deps: `lucide-react`

## Onboarding
Entry: `src/Onboarding.jsx` — deps: `src/avatars.js`, `lucide-react`
