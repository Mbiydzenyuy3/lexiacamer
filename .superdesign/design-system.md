# LexiaCamer — Design System

## Product context

LexiaCamer is a reading app for children in Cameroon. Primary age **10 and up**, younger children use it too. It teaches **letter sounds (phonics), blending and spelling** in English. The menus, hints and parent screens are in **English and French**, so a parent who does not read English can still help. It **works with no internet after the first visit** (it is a PWA) and is built for low-end Android phones and bright daylight.

It is **launched** (October 2026): a full product, not a prototype. What a child gets today:
- **Phonics Lab**: tap a letter and hear its sound, recorded by a real Cameroonian woman (not a robot voice). Two pronunciations to switch between in Settings: **Standard English** and **Native**, so a child can hear how a letter sounds in standard English and how it is said locally.
- **Sound It Out** (new): the word appears as letter tiles (S U N); the child taps each tile to hear its sound, presses "Say it fast" so the word pops out, then picks the matching picture. This is how reading is taught. Level 3 uses Cameroonian words (mama, koki, Kribi, Buea) with the native sounds.
- **Word Forge**: hear a word, spell it from letter tiles. 78 words, many Cameroonian (Ndolé, Achu, Yaoundé, puff-puff), each spoken in the same real voice.
- **Sticker Book**: stars earned are spent on stickers.
- **Dyslexia mode**: rounder font, wider spacing, one tap.
- **For parents**: sign in with an email code to follow progress on a dashboard. Before anything about the child is saved, the parent agrees AND the child is asked in their own words; a parent can download or delete the child's data at any time.

No account is needed for a child to play. Nothing to install from a store: it opens in the browser and can be added to the home screen.

### The story behind it (use exactly this; never add names or photos)
The founder's niece could not read or spell. She failed her exams and had to repeat a class while her friends moved up. People said she was not smart; she went quiet at family gatherings and sometimes at school. Nobody had taught her the sounds letters make. The founder built LexiaCamer and recorded every letter sound in her own voice. The niece is not perfect yet — long words still trip her up — but she has caught up a lot, is livelier and more confident, and now teaches her little sister in nursery school the alphabet. **Never name the founder or the niece, never show a photo of either.** Told in first person, unsigned.

### Audience
- **Parents and guardians**, the primary audience. They arrive mostly from a Facebook link, on an Android phone, often on weak or paid data. They decide in seconds whether to trust this with their child.
- Teachers and schools are **not mentioned at all** on the landing page (those dashboards are not built).

### Jobs to be done
- In under thirty seconds a parent wants to know: will this help my child read, does it cost anything, will it work on my phone without data, is it safe for my child.
- A parent wants to hear the voice and see the real screens before handing over the phone.

## Key pages

1. **Landing page** (`/`): what it is, the story, what a child actually does (real screenshots), hear the voice (Standard vs Native), what parents get (dashboard, consent, delete data), built for Cameroon, contact, price.
2. The app itself: Home, Phonics Lab, Sound It Out, Word Forge, Sticker Book, Parent Dashboard, Settings (a gear icon in the top bar).

There is **no early-tester form any more**: visitors go straight into the app.

## Calls to action

**Primary: "Start learning"** — opens the app straight away, no form. Every primary button does this.
**Secondary: "Hear the sounds"** — plays the real recorded letter sounds on the page.
Buttons say what happens when clicked. Never "Get started", "Learn more", "Sign up", "Join now".

## Trust and legitimacy (the hardest requirement)

A parent in Cameroon being asked to hand a phone to their child by an unknown web app is right to be suspicious. The design earns trust by being **specific and plainly honest**, never by claiming.

- **Show the real product.** Use the supplied real screenshots of the app (Home, Phonics Lab, Sound It Out, Word Forge) inside simple phone frames. Never invent UI.
- **Let them hear it.** The voice is the product's most authentic asset; a play control for letter sounds belongs high on the page.
- **Be concrete.** Real numbers only: 34 letter sounds recorded in two pronunciations, 78 words, 27 picture words to sound out, works offline after the first visit. Real place names (Douala, Yaoundé, Kribi, Buea).
- **One honest line, not a disclaimer panel:** reading lessons are in English; French reading lessons come later (menus are already in French).
- **Price, stated plainly:** "The reading games are free, with no account needed. Some features we add later, like school dashboards, may cost something. The reading games will stay free."
- **No fabricated social proof.** No invented testimonials, user counts, logos, "trusted by" rows, star ratings. The story above is real; nothing else is quoted.
- **Data, plainly:** nothing about the child leaves the phone unless a parent signs in and both parent and child agree; delete anytime.

**Avoid (these make a page look AI-made):** the default hero + three feature cards + testimonials + pricing layout; equal-weight card grids everywhere; abstract blobs, gradient hero backgrounds, glassmorphism; stock photos or illustrated people; buzzwords ("revolutionary", "empower", "unlock", "seamless", "AI-powered"); exclamation marks; countdowns; badge walls. Prefer an editorial, varied rhythm: sections of different shapes and weights, real screenshots, short plain sentences that sound like a person.

## Branding and styling

**This is a hard constraint, not a suggestion. Use only what is listed here.**

### Type
- One family: **Outfit** (Google Fonts, weights 300-900), fallback `-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`.
- **Never introduce a serif, a display face, or a second family.** No Playfair, no Inter, no decorative type.
- Headings are heavy (700-900) and tight; body is 400-500 at `line-height: 1.6`.

### Colour
Green is the brand. Amber is reward and warning. Indigo is secondary/accent. Nothing else.

| Role | Token | Value |
|---|---|---|
| Primary | `--color-primary` | `#059669` |
| Primary hover | `--color-primary-hover` | `#047857` |
| Primary light | `--color-primary-light` | `#d1fae5` |
| Secondary | `--color-secondary` | `#f59e0b` |
| Accent | `--color-accent` | `#6366f1` |
| Danger | `--color-danger` | `#f43f5e` |
| Page background | `--bg-body` | `#f0f5eb` |
| Card | `--bg-card` | `#ffffff` |
| Text | `--text-primary` | `#1a2e05` |
| Text secondary | `--text-secondary` | `#4a6741` |
| Text muted | `--text-muted` | `#7c9a6e` |
| Border light | `--border-light` | `#e2edda` |
| Border medium | `--border-medium` | `#c6d8bc` |

Supporting ramps available: greens `#ecfdf5 #d1fae5 #a7f3d0 #34d399 #10b981 #059669 #047857 #065f46 #064e3b`; ambers `#fffbeb #fef3c7 #fde68a #fcd34d #fbbf24 #f59e0b #d97706`; indigos `#eef2ff #e0e7ff #c7d2fe #818cf8 #6366f1 #4f46e5 #4338ca`; roses `#fff1f2 #ffe4e6 #fb7185 #f43f5e #e11d48`; skies `#f0f9ff #38bdf8 #0ea5e9`.

**Forbidden:** pink, neon, purple gradients, dark mode, pure grey (`#888`, `#ccc`), pure black text, and any gradient that is not a soft tint of the greens above. The page background is the warm off-green `#f0f5eb` — **never white**.

### Radius
`0.625rem` / `1rem` / `1.25rem` / `1.5rem` / `2rem` / `9999px`. Everything is generously rounded; this is a children's product. Pills (`9999px`) for all buttons and chips.

### Shadow
Green-black tinted only, never neutral grey:
`0 1px 2px rgba(16,48,0,.04)` · `0 1px 3px rgba(16,48,0,.06), 0 1px 2px rgba(16,48,0,.04)` · `0 4px 12px rgba(16,48,0,.08)` · `0 10px 30px rgba(16,48,0,.10)` · `0 16px 48px rgba(16,48,0,.12)`

### Spacing
`.25rem` `.5rem` `1rem` `1.5rem` `2rem` `3rem`. Sections on the landing page breathe: 4-6rem of vertical rhythm between them on desktop, 2.5-3rem on phones.

### Layout
- **Phone first.** Most visitors arrive from a Facebook link on an Android phone. Design 390px first, then let it grow. Content column maxes around 68rem on desktop.
- Large rounded cards on the tinted body background, the way the app's Home screen already works.
- Minimum touch target 44px. Body text never below 15px.
- Respect `env(safe-area-inset-*)`.

### Icons
**lucide-react only**, stroke icons, typically 16-24px. Available and already used in the app: AudioLines, BookOpen, Flame, Star, Type, Hammer, Lightbulb, Settings, ShieldCheck, ChevronRight, ArrowRight, Check, FlaskConical, Volume2, VolumeX, MessageSquare, WifiOff, X, Cat, Bird, Snail, Dog. Emoji are used sparingly for ratings only. **No icon fonts, no Font Awesome, no invented SVG marks.**

### Logo
`public/pwa-192x192.png` is the mark — a green rounded square holding a white "L". The wordmark is rendered as the logo image immediately followed by the text "exiaCamer", so the logo's L completes the word: **L + exiaCamer**. Reproduce this exactly. Never substitute initials, an emoji, a generic book icon, or text alone.

### Motion
`cubic-bezier(.16,1,.3,1)` for entrances, `cubic-bezier(.34,1.56,.64,1)` for anything playful. Durations 150/250/400ms. Fade-and-rise on scroll, small pop on reward. All of it collapses under `prefers-reduced-motion: reduce`. No parallax, no autoplaying carousels, no scroll-jacking — they cost battery and break on low-end Android.

## Existing class vocabulary to reuse

The app has no component library; shared UI is CSS classes in `src/index.css`. The landing page uses `.lp-*` classes.

The in-app set worth echoing visually: `.stat-card` (a number over a caption), `.menu-card` (big tile with a tinted icon puck, title, subtitle), `.tip-card` (amber panel with a Lightbulb).

## Project requirements

- Bilingual EN/FR. Copy must survive French being roughly 20% longer — never fix a button's width to its English label.
- Must work on a slow connection: no web fonts beyond Outfit, no heavy hero video, no large uncompressed imagery.
- Offline is a headline feature, not a footnote.
- Accessibility is not optional: WCAG AA contrast, visible focus rings, real `<button>`/`<label>` elements, alt text on every image. Dyslexia mode exists in the app and should be mentioned as a feature.
- Nothing on the landing page mentions or links to teacher or school dashboards.
