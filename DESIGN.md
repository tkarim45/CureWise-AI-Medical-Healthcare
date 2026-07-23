# Design

The visual system is the **Bryge design system** (extracted from bryge.io),
adapted for the medical context. The full brief lives in
`~/Desktop/bryge-theme-guide.md`; this file records how it is applied here.

**One file drives everything:** `frontend/src/app/globals.css` holds every
token and every global classname. Change a value there and it applies to every
page. No component hardcodes a color.

## Typography

Two families only; the contrast between them is the typographic idea.

- **Archivo** (variable) — everything readable: body, headings, UI.
  `--font-sans`, and `--font-serif` is aliased to it (no third face).
- **Azeret Mono** (variable) — anything that is an index, identifier, code or
  measurement: eyebrow tags, "01" ledger indices, lab values, dates, metadata.
  `--font-mono`. Prose never uses mono.
- Body 16px / 1.5 / weight 400, antialiased.
- Hero title: `clamp(32px, 5vw, 52px)`, weight 300, `-0.02em`; its `<b>` is 600.
- Section h2 (`.headline`): 34px, weight 500; `<b>` payoff is 800.
  Headline formula: plain first clause, bold payoff.
- Card headings (`.card-heading`): 21px, weight 650, `-0.015em`, balanced.
- Bold inside prose is **accent-colored**, not just heavier.

## Color

One accent. Everything else neutral. Light is the base; dark is a class-scoped
`.dark` override (default light, remembered toggle).

| Token | Light | Dark |
|---|---|---|
| `--background` | `#ffffff` | `#0a0a0a` |
| `--surface-2` / raise | `#f5f7fa` | `#1a1a1c` |
| `--border` | `#e2e6ec` | `#232326` |
| `--border-soft` | `#eef1f5` | `#1a1a1c` |
| `--foreground` | `#111114` | `#f2f2f0` |
| `--muted-foreground` (dim) | `#5a6472` | `#9c9c9c` |
| `--faint` | `#8b94a2` | `#5c5c5e` |
| `--primary` (accent) | `#2174E8` | `#3F8AF3` (lifted for AA) |
| `--primary-soft` | `rgba(33,116,232,.12)` | `rgba(63,138,243,.14)` |

Derived tints via `color-mix` (e.g. `--primary-strong`). Semantic
success/warning/danger (+`-soft`) exist for medical result states only.
Never hardcode a color in a component.

## Surfaces, radii, shadows

- Radii: buttons/inputs 8px (`--radius`), cards 12px (`--r-lg`), feature
  panels 18px (`--r-xl`), pills 999px.
- Elevation comes from borders and background steps; shadows are rare and
  quiet (`0 2px 6px rgba(15,23,42,.1)` at most). No colored glows.
- `.cellgrid` — hairline dividers via 1px-gap grid over `--border-soft`.
- `.frost` — frosted sticky headers (`color-mix` bg + 10px blur).

## Global classnames (in globals.css)

`.site-container` (990px column) · `.section` / `.section-band` (alternating
rhythm, ~96px) · `.eyebrow` + `.pulse-dot` (mono kicker pill) · `.hero-title` ·
`.headline` · `.card-heading` · `.mono-label` / `.mono-index` (mono-for-data) ·
`.ledger-row` (numbered feature rows) · `.cellgrid` · `.frost` · `.hover-flood`
(accent flood, fast-in slow-out) · `.reveal` (scroll reveal).

## Components

shadcn/ui (radix, Lucide) re-skinned by the tokens. Buttons: 44px, radius 8,
primary (accent, white text, hover opacity .85) always paired with a ghost.
Field composes shadcn Input/Textarea/Label. App chrome uses Sheet/Avatar/
Separator.

## Motion

Functional, never decorative. 250ms normal / 400ms slow; enter
`cubic-bezier(0.16,1,0.3,1)`, exit `cubic-bezier(0.55,0,1,0.45)`. Scroll
reveal is visible-by-default: hiding is armed only after the
IntersectionObserver wires, with a 1.8s failsafe (`components/reveal.tsx`).
`prefers-reduced-motion` renders resting state.

## Voice

Plain statement, bold payoff. Concrete over abstract, contractions fine.
Trust claims stated as enforced facts: "It cannot diagnose you."
