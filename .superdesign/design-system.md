# LexiaCamer — Design System

## Product context

LexiaCamer is a reading app for children in Cameroon, roughly ages 4 to 7. It teaches **letter sounds (phonics)** and **spelling**, in **English and French**, and it **works with no internet after the first load** because it is a PWA. It is built for low-end Android phones and for bright outdoor daylight.

It is an **early prototype**. There are no public users yet; the team is recruiting early testers through a Facebook page. The one thing that is honestly unfinished is the audio: the 34 letter-sound clips are not recorded, so the app currently falls back to the phone's built-in text-to-speech, which on some Android phones sounds wrong or does not play.

### Audiences
- **Parents and guardians** — the primary audience. They install it, they decide whether to trust it with their child.
- **Teachers** — see progress for the classes they teach, nothing else.
- **School directors** — see every child in their own school, never another school's.

The teacher and director dashboards are **still being built**. They may be described as what is coming; **no link or path to them may appear** anywhere in the design.

### Jobs to be done
- A parent wants to know, in under thirty seconds, whether this will help their child read, whether it costs anything, whether it will work on their phone, and whether it is safe to hand to a five-year-old.
- A director wants to know this is a real organisation that will still exist next term.
- An early tester needs to understand that rough edges are expected and that reporting them is the point.

## Key pages

1. **Landing page** (`/`) — new. Hero, what it is, how it works, features by audience, honest proof, contact and support, one call to action.
2. **Early tester intro** — what the product is, what is not finished, one button in.
3. **Early tester form** — role, name, WhatsApp or email, what they want help with. Four questions, no more.
4. **Early tester welcome** — what to do first, and where the feedback button is.
5. The app itself — Home, Phonics Lab, Word Forge, Sticker Book, Parent Dashboard, Settings.

## The one call to action

**There is exactly one primary action on the landing page: become an early tester.** Every primary button leads there. Features for teachers and schools are described as text; they get no button, no link, no form. A second competing CTA is a design error here.

Buttons must say what the person will see when they click, not a generic verb. Never "Get started", "Learn more", "Sign up". Instead: "Become an early tester", "Try it with your child now", "See what a child sees", "Read what is not finished yet". A button whose label could sit on any product in the world is wrong.

## Trust and legitimacy (the hardest requirement)

A parent in Cameroon being asked to hand a phone to their child by an unknown web app is right to be suspicious. The design earns trust by being **specific and plainly honest**, never by claiming.

What to do:
- **Name the unfinished thing before they find it.** The "What is not finished yet" panel is the product's signature device. It goes on the landing page too, visible without scrolling far. Nothing builds more trust than a product that tells you its own weakness first.
- **Say what happens next to the data.** "We ask for your WhatsApp or email so we can tell you when the next version is ready. Nothing else. No account, no password, no payment."
- **Be concrete.** Real numbers (schools in the directory, letter sounds being recorded), real place names (Cameroon, Yaoundé, Douala), real specifics about phones and data.
- **Show the actual product.** Real screenshots or faithful mock device frames of Word Forge and Phonics Lab beat any description.
- **No fabricated social proof.** No invented testimonials, no fake user counts, no fake logos, no "trusted by" rows, no five-star rows. If a number is not real it does not appear.
- **State the price plainly**: free for testers, no account needed.

What to avoid: stock-photo smiling families, countdown timers, "limited spots", badge walls, jargon, exclamation marks, anything that reads like an advert rather than a note from a person building something.

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
**lucide-react only**, stroke icons, typically 16-24px. Available and already used in the app: BookOpen, Flame, Star, Type, Hammer, Lightbulb, Settings, ShieldCheck, ChevronRight, ArrowRight, Check, FlaskConical, Volume2, VolumeX, MessageSquare, WifiOff, X, Cat, Bird, Snail, Dog. Emoji are used sparingly for ratings only. **No icon fonts, no Font Awesome, no invented SVG marks.**

### Logo
`public/pwa-192x192.png` is the mark — a green rounded square holding a white "L". The wordmark is rendered as the logo image immediately followed by the text "exiaCamer", so the logo's L completes the word: **L + exiaCamer**. Reproduce this exactly. Never substitute initials, an emoji, a generic book icon, or text alone.

### Motion
`cubic-bezier(.16,1,.3,1)` for entrances, `cubic-bezier(.34,1.56,.64,1)` for anything playful. Durations 150/250/400ms. Fade-and-rise on scroll, small pop on reward. All of it collapses under `prefers-reduced-motion: reduce`. No parallax, no autoplaying carousels, no scroll-jacking — they cost battery and break on low-end Android.

## Existing class vocabulary to reuse

The app has no component library; shared UI is CSS classes in `src/index.css`. The marketing-facing set is `.et-*`:
`.et-screen` `.et-card` `.et-badge` `.et-title` `.et-title-sm` `.et-lead` `.et-known` `.et-known-title` `.et-field` `.et-label` `.et-optional` `.et-chips` `.et-chip` `.et-input` `.et-hint` `.et-btn` `.et-btn-primary` `.et-foot` `.et-tick` `.et-steps` `.et-error`

The in-app set worth echoing visually: `.stat-card` (a number over a caption), `.menu-card` (big tile with a tinted icon puck, title, subtitle), `.tip-card` (amber panel with a Lightbulb).

## Project requirements

- Bilingual EN/FR. Copy must survive French being roughly 20% longer — never fix a button's width to its English label.
- Must work on a slow connection: no web fonts beyond Outfit, no heavy hero video, no large uncompressed imagery.
- Offline is a headline feature, not a footnote.
- Accessibility is not optional: WCAG AA contrast, visible focus rings, real `<button>`/`<label>` elements, alt text on every image. Dyslexia mode exists in the app and should be mentioned as a feature.
- Nothing on the landing page may link to a teacher or director dashboard. Those are unbuilt.
