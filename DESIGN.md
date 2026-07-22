# Design

## Theme

Light is the default; dark is available via the toggle and remembered. Clean
white surfaces with a confident, credible blue. Calm and clinical-trustworthy.
The brand lives in the blue and the typography, not in a tinted surface. Color
strategy: **restrained** — white/near-neutral surfaces, one blue brand color,
semantic colors only for real medical states.

## Color (OKLCH)

Brand anchor: blue, hue ~258°.

### Light
- `--bg`: `oklch(1 0 0)` (pure white)
- `--surface`: `oklch(0.986 0.004 255)`
- `--surface-2`: `oklch(0.964 0.007 255)`
- `--border`: `oklch(0.916 0.011 255)`
- `--ink`: `oklch(0.23 0.03 262)` (primary text, high contrast on bg)
- `--muted`: `oklch(0.45 0.03 262)` (secondary text, ≥4.5:1 on bg)
- `--primary`: `oklch(0.52 0.16 258)` (fills, buttons)
- `--primary-strong`: `oklch(0.45 0.17 260)` (links / text on white, ≥4.5:1)
- `--on-primary`: `oklch(0.99 0 0)` (text on primary fill)
- `--ring`: `oklch(0.52 0.16 258)`

### Dark
- `--bg`: `oklch(0.18 0.018 262)`
- `--surface`: `oklch(0.222 0.022 262)`
- `--surface-2`: `oklch(0.262 0.026 262)`
- `--border`: `oklch(0.322 0.028 262)`
- `--ink`: `oklch(0.96 0.01 255)`
- `--muted`: `oklch(0.72 0.02 258)` (≥4.5:1 on bg)
- `--primary`: `oklch(0.68 0.16 258)` (glows on dark)
- `--primary-strong`: `oklch(0.79 0.13 258)` (links)
- `--on-primary`: `oklch(0.16 0.02 262)`
- `--ring`: `oklch(0.68 0.16 258)`

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

Built on **shadcn/ui** (radix primitives, Lucide icons) re-skinned to the
CureWise tokens above. The palette lives in shadcn's token names
(`--primary`, `--card`, `--muted-foreground`, `--border`, `--ring`, …) plus a
few CureWise extras (`--primary-strong`, `--primary-soft`, `--surface-2`,
`--success/--warning/--danger` + `-soft`). Premium blue, primary hue ~262.

- **Button**: primary (blue fill), secondary (bordered), ghost, danger. 44px min
  target (h-11 default). Visible focus ring, subtle press.
- **Field**: shadcn Input/Textarea/Label + label/hint/error, error at AA.
- **Card / Panel**: bordered `--card`, no nested cards, no side-stripe borders.
- **App chrome**: shadcn Sheet (mobile drawer), Avatar, Separator.
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
