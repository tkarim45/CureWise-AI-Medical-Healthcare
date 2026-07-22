# Design

## Theme

Light and dark, both first-class (system preference + manual toggle). Mood:
*a Scandinavian clinic at first light — cool mineral teal, quiet white, unhurried.*
Calm and clinical-trustworthy. The mood lives in the brand teal and the
typography, not in a tinted surface. Color strategy: **restrained** — near-neutral
surfaces, one teal brand color, semantic colors only for real medical states.

## Color (OKLCH)

Brand anchor: mineral teal, hue ~200° (deliberately not stock health-blue ~250°,
not mint-green ~150°, never AI-purple).

### Light
- `--bg`: `oklch(1 0 0)` (pure white)
- `--surface`: `oklch(0.986 0.004 200)`
- `--surface-2`: `oklch(0.965 0.006 200)`
- `--border`: `oklch(0.918 0.008 205)`
- `--ink`: `oklch(0.24 0.02 225)` (primary text, ~14:1 on bg)
- `--muted`: `oklch(0.455 0.02 225)` (secondary text, ≥4.5:1 on bg)
- `--primary`: `oklch(0.52 0.10 200)` (fills, buttons)
- `--primary-strong`: `oklch(0.43 0.10 205)` (links / text on white, ≥4.5:1)
- `--on-primary`: `oklch(0.99 0 0)` (text on primary fill)
- `--ring`: `oklch(0.52 0.10 200)`

### Dark
- `--bg`: `oklch(0.175 0.012 225)`
- `--surface`: `oklch(0.215 0.014 225)`
- `--surface-2`: `oklch(0.255 0.016 225)`
- `--border`: `oklch(0.315 0.016 225)`
- `--ink`: `oklch(0.955 0.006 210)`
- `--muted`: `oklch(0.72 0.012 210)` (≥4.5:1 on bg)
- `--primary`: `oklch(0.72 0.11 200)` (glows on dark)
- `--primary-strong`: `oklch(0.80 0.10 200)` (links)
- `--on-primary`: `oklch(0.16 0.01 225)`
- `--ring`: `oklch(0.72 0.11 200)`

### Semantic (medical states, both themes tune lightness)
- success/normal: hue ~150 · warning/moderate: hue ~75 · danger/urgent: hue ~25
- Used only for result badges (Normal / Watch / Urgent), never decoration.

## Typography

- `--font-sans` (body/UI): **Geist Sans** — clean, humanist, not Inter-generic.
- `--font-serif` (display h1/h2 only): **Newsreader** — a calm literary serif that
  reads credible without going full editorial. Serif + sans = a real contrast axis.
- `--font-mono` (lab values, report numbers, code): **Geist Mono**.
- Body 16px, line-height 1.6, measure capped 68ch. Display clamp max ≤ 3.5rem.
  `text-wrap: balance` on headings, `pretty` on prose. Letter-spacing ≥ -0.02em.

## Spacing & Radius

- 4px base scale (4/8/12/16/24/32/48/64). Vary rhythm; don't uniform-pad.
- Radius: `--r-sm 6px`, `--r-md 10px`, `--r-lg 16px`, `--r-full 999px`. Calm, not toy-round.
- Shadows: soft, low — `0 1px 2px / 0 8px 24px` at ~6% alpha. No neon glow (except a
  faint teal focus ring).

## Components

- **Button**: primary (teal fill), secondary (bordered), ghost, danger. 44px min
  target. Visible focus ring, subtle press.
- **Field**: label + input + hint/error, error in danger color at AA.
- **Card / Panel**: bordered `--surface`, no nested cards, no side-stripe borders.
- **Tool tile** (dashboard): icon + name + one-line purpose; whole tile is the link.
- **Result badge**: Normal / Watch / Urgent, semantic color + text, never color alone.
- **Disclaimer**: a persistent, quiet inline note on every AI result ("informs, not
  diagnoses"), part of the design.
- **App shell**: left sidebar (collapsible) on desktop, bottom/topbar on mobile;
  theme toggle; user menu.

## Motion

- ease-out-expo/quint, 150–300ms. Staggered list reveals where they fit.
- Every animation has a `prefers-reduced-motion` crossfade/instant fallback.
- Reveals enhance already-visible content; never gate visibility on JS.
