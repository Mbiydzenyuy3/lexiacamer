# Extractable components

Nothing here is currently a standalone component file except `FeedbackButton`, `Confetti` and `ErrorBoundary` — the rest is markup inside `App.jsx` / `HomeScreen.jsx` held together by CSS classes. These are the pieces worth extracting as reusable DraftComponents.

## Layout

### TopBar
- Source: `src/App.jsx` (inline `header.top-bar`)
- Category: layout
- Description: Fixed header with logo wordmark, centre Dashboard button, right avatar button
- Extractable props: `activeItem` (string, default `"home"`), `showDashboard` (boolean, default `true`)
- Hardcoded: `/pwa-192x192.png` logo image, the "exiaCamer" wordmark split, ShieldCheck icon, all CSS

### BottomNav
- Source: `src/App.jsx` (inline `nav.bottom-nav`)
- Category: layout
- Description: Fixed three-item bottom navigation (Home / Sounds / Spelling)
- Extractable props: `activeItem` (string, default `"home"`)
- Hardcoded: Home/Type/Hammer lucide icons, label text from `i18n`, `z-index: var(--z-sticky)` (200), all CSS

### FeedbackFab
- Source: `src/FeedbackButton.jsx`
- Category: layout
- Description: Fixed feedback button plus overlay modal, present on every screen
- Extractable props: `screen` (string), `open` (boolean, default `false`)
- Hardcoded: MessageSquare/X/Check icons, rating and category lists, Supabase table name, all CSS

## Basic

### StatCard
- Source: `src/HomeScreen.jsx` (`.stat-card`)
- Category: basic
- Description: One number over one caption, used three-up
- Extractable props: `value` (string|number), `label` (string), `accent` (string, default `"green"`)
- Hardcoded: Flame icon at streak >= 3, Star icon on stars, all CSS

### MenuCard
- Source: `src/HomeScreen.jsx` (`.menu-card`)
- Category: basic
- Description: Big rounded activity tile with tinted icon puck, title and subtitle
- Extractable props: `title` (string), `subtitle` (string), `tone` (string: green|amber|indigo|slate), `href` (string)
- Hardcoded: lucide icon per card, all CSS

### TipCard
- Source: `src/HomeScreen.jsx` (`.tip-card`)
- Category: basic
- Description: Amber panel with Lightbulb icon, heading and one line of body
- Extractable props: `title` (string), `body` (string)
- Hardcoded: Lightbulb icon, amber tokens, all CSS

### Chip
- Source: `src/EarlyTester.jsx` (`.et-chip`)
- Category: basic
- Description: Pill-shaped single-select option button
- Extractable props: `label` (string), `selected` (boolean, default `false`)
- Hardcoded: `--radius-full`, 2px border, green fill when on

### PrimaryButton
- Source: `src/EarlyTester.jsx` (`.et-btn.et-btn-primary`)
- Category: basic
- Description: Full-width pill CTA, green fill, white text, optional trailing arrow
- Extractable props: `label` (string), `disabled` (boolean, default `false`), `showArrow` (boolean, default `true`)
- Hardcoded: ArrowRight icon, `--color-primary`, `--radius-full`

### KnownIssuesPanel
- Source: `src/EarlyTester.jsx` (`.et-known`)
- Category: basic
- Description: Tinted panel that states plainly what is not finished yet — the product's honesty device
- Extractable props: `title` (string), `body` (string)
- Hardcoded: Volume2 icon, panel tint
