---
name: Crucible
colors:
  surface: '#0b0c0f'
  surface-dim: '#0b0c0f'
  surface-bright: '#33363f'
  surface-container-lowest: '#0b0c0f'
  surface-container-low: '#121317'
  surface-container: '#1a1c22'
  surface-container-high: '#24262e'
  surface-container-highest: '#33363f'
  on-surface: '#f1f5f9'
  on-surface-variant: '#94a3b8'
  inverse-surface: '#f1f5f9'
  inverse-on-surface: '#0b0c0f'
  outline: '#33363f'
  outline-variant: '#24262e'
  primary: '#e8a628'
  on-primary: '#0b0c0f'
  primary-container: '#f2b84b'
  on-primary-container: '#0b0c0f'
  inverse-primary: '#c8871a'
  secondary: '#7dd3fc'
  on-secondary: '#0b0c0f'
  secondary-container: '#1a1c22'
  on-secondary-container: '#7dd3fc'
  tertiary: '#6ee7b7'
  on-tertiary: '#0b0c0f'
  tertiary-container: '#1a1c22'
  on-tertiary-container: '#6ee7b7'
  error: '#f87171'
  on-error: '#0b0c0f'
  error-container: '#1a1c22'
  on-error-container: '#fca5a5'
  background: '#0b0c0f'
  on-background: '#f1f5f9'
  surface-variant: '#1a1c22'
  persona-hr: '#6ee7b7'
  persona-technical: '#7dd3fc'
  persona-skeptical: '#fca5a5'
typography:
  display-lg:
    fontFamily: Space Grotesk
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 56px
    letterSpacing: -0.01em
  display-md:
    fontFamily: Space Grotesk
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: '0'
  display-sm:
    fontFamily: Space Grotesk
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 26px
    letterSpacing: '0'
  body-base:
    fontFamily: Manrope
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
    letterSpacing: '0'
  body-sm:
    fontFamily: Manrope
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
    letterSpacing: '0'
  label-md:
    fontFamily: Manrope
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 20px
    letterSpacing: '0'
  stat-lg:
    fontFamily: Space Grotesk
    fontSize: 36px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.01em
  stat-sm:
    fontFamily: Space Grotesk
    fontSize: 20px
    fontWeight: '700'
    lineHeight: 24px
    letterSpacing: '0'
rounded:
  sm: 0.375rem
  DEFAULT: 0.5rem
  md: 0.5rem
  lg: 0.5rem
  xl: 1rem
  2xl: 1rem
  full: 9999px
spacing:
  unit: 4px
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
  gutter: 16px
  margin-mobile: 24px
  margin-desktop: 24px
---

## Brand & Style

Crucible is an AI mock-interview platform built around a single, sharp idea: a
panel of interviewers who don't agree with each other. The visual language
matches that premise — it reads as a **tribunal, not a chat app**. Everything
sits on a near-black stage, so the amber accent and the three persona colors
carry all the weight of the interface. There is no light theme; the product is
meant to feel like walking into a dim, serious room where a panel is about to
judge your answer.

The philosophy is **restraint with one bright signal**. Surfaces are built
from a tight, four-step charcoal scale rather than pure black, giving cards
just enough separation to feel like distinct physical objects (a courtroom
bench, a case file) without introducing color noise. Amber gold is the single
recurring accent — buttons, links, active states, score highlights — so a
user's eye always knows where the primary action is. Everything else stays
quiet on purpose.

## Colors

The palette is anchored by **Near-Black Charcoal** (`#0b0c0f`), the page's
base surface, with three progressively lighter charcoal steps —
**Slate Charcoal** (`#121317`), **Panel Gray** (`#1a1c22`), and
**Graphite Border** (`#24262e`) — used respectively for the app shell, card
surfaces, and card borders. **Muted Steel** (`#33363f`) is the lightest step,
reserved for hover borders and dividers that need to read slightly brighter
without breaking the dark mood.

**Warm Amber Gold** (`#e8a628`) is the sole primary accent: every primary
button, active link, focus ring, and score highlight uses it, with
**Soft Amber** (`#f2b84b`) as its hover/lighter state and **Burnt Amber**
(`#c8871a`) reserved for pressed states. Because amber is used so sparingly
elsewhere, it reads as unmistakably "the important thing" wherever it appears.

Three **persona accent colors** exist specifically for the interview panel
feature and should never be used for generic UI: **Mint Green** (`#6ee7b7`)
identifies the friendly HR panelist, **Sky Blue** (`#7dd3fc`) the rigorous
Technical Lead, and **Coral Red** (`#fca5a5`) the skeptical Hiring Manager.
These appear as left-border accents and small text labels on feedback cards —
never as backgrounds — so three simultaneous verdicts stay instantly
distinguishable at a glance. Coral doubles as the escalation color for the
cross-examination state, reinforcing that the skeptical persona is the one
who pushes back.

Text uses a plain two-step gray scale rather than a tinted one: **Off-White**
(`#f1f5f9`) for headings and primary copy, **Muted Slate** (`#94a3b8`, with
`#64748b` for the quietest captions) for secondary and supporting text.
**Soft Red** (`#f87171`) is the single functional error color, used only for
form validation and request-failure messages — kept deliberately distinct
from the softer coral persona color so a real error never gets confused with
the skeptical panelist's branding.

## Typography

The system pairs two Google Fonts with clearly separated jobs. **Space
Grotesk** — geometric, slightly technical, confident — is used exclusively
for display type: page titles, hero headlines, section headings, and every
numeric score. Its distinct character is what makes scores and headings feel
like verdicts rather than ordinary UI copy. **Manrope** — a warmer, humanist
sans — carries every other piece of text: body copy, form labels, buttons,
and captions, keeping day-to-day reading comfortable against the dark
backdrop.

Hierarchy is intentionally shallow: a large display size for hero headlines
(`48px/700`), a mid display size for page and card titles (`24px/600` and
`18px/600`), and a single body size (`16px/400`) with one smaller caption
size (`14px/400`) for secondary text. Scores get their own dedicated scale —
a large stat style (`36px/700`) for the hero "overall score" number, and a
smaller stat style (`20px/700`) for the per-panelist score badges — always
set in Space Grotesk so a number is legible as a verdict from across the
screen. Letter-spacing stays close to neutral throughout; the type doesn't
need tightening or expansion to do its job, the font choice itself carries
the personality.

## Layout & Spacing

Crucible uses **narrow, content-hugging containers** rather than wide
dashboards — most screens cap at `672px` (interview flow, summary) or
`576px` (auth, profile, settings) so the single most important element (a
question, a form, a score) stays the visual center of gravity. The dashboard
is the one wider screen (`896px`), since it needs to hold two charts
side-by-side plus a session list.

Spacing follows a simple `4px` base rhythm expressed mostly through Tailwind's
`gap-2` through `gap-5` (`8px`–`20px`) between related elements, with a
consistent `24px` internal card padding and `24px`–`48px` vertical rhythm
between page sections. Nothing needs to feel dense — this is a
one-thing-at-a-time flow (one question, one form, one score), so whitespace
is generous rather than compact.

## Elevation & Depth

Depth is conveyed with **flat surfaces plus a single soft shadow**, not
layered blur or glass effects. Cards sit on a semi-transparent panel-gray
background (`bg-charcoal-900` at ~80% opacity) with a `backdrop-blur`, a
hairline `1px` border in Graphite Border, and one soft black drop shadow
(`shadow-lg shadow-black/20`) — just enough lift to read as a distinct
object on the near-black stage, without competing with the amber accent for
attention. There is no secondary elevation tier; every card in the product
sits at the same depth, which keeps the "panel of equals" feeling intact
even for the more dramatic cross-examination card (which is distinguished by
color, not by floating higher).

## Shapes

Corners are **moderately rounded and consistent**: buttons and form inputs
use an `8px` radius (`rounded-lg`), cards use a slightly larger `16px`
radius (`rounded-2xl`), and fully circular shapes (`rounded-full`) are
reserved for icon-only controls (the microphone toggle) and small status/tag
chips. Nothing in the system uses sharp corners or heavy rounding — the
shape language is meant to feel composed and professional, not playful.

## Components

### Buttons

Primary buttons are a solid Amber Gold fill with near-black text
(`bg-amber-500 text-charcoal-950`), `8px` corners, and generous horizontal
padding (`px-5 py-2.5`); hover lightens to Soft Amber. Secondary buttons are
outlined — Graphite Border with a Panel Gray fill and off-white text — and
their hover state shifts the border toward amber at 50% opacity rather than
filling with color, keeping secondary actions clearly subordinate to the one
amber primary action per screen.

### Cards

The single `.card` primitive (rounded-2xl, Graphite Border, translucent
Panel Gray background, soft shadow, `24px` padding) is reused everywhere —
feature cards, stat cards, the interview question card, and every panelist
feedback card. Persona feedback cards add a `4px` colored left border
(`border-l-4`) in the relevant persona color as the only visual variant of
the base card, which is what lets three simultaneous verdicts read as
"the same kind of thing, different judges" rather than three different
components.

### Forms & Inputs

Inputs share the same visual language as secondary buttons: Graphite Border
border, Charcoal Panel background, off-white text, muted-slate placeholder
text, `8px` corners, and an amber border-and-ring focus state
(`focus:border-amber-500 focus:ring-1 focus:ring-amber-500`). Labels sit
above fields in small, medium-weight Manrope. There is no floating-label or
inline-label pattern — labels are always static and visible.

### Panel Feedback & Cross-Examination (domain-specific)

The core differentiated component: three feedback cards, each color-coded by
persona (mint HR, sky-blue Technical, coral Skeptical), showing the
persona's name in its accent color, a large bold Space Grotesk score badge
(0–100) top-right, a short comment, and small pill-shaped "flagged issue"
tag chips in a neutral charcoal background. The cross-examination state
reuses the same card shape but escalates visually — coral left border, an
urgent icon (sword/gavel), and a bold challenge question — so it reads as a
heightened variant of the same panel, not a separate alert system.

## Design System Notes for Stitch Generation

### Language to Use

Describe this system to Stitch as: "a dark-only, high-stakes tribunal/panel
aesthetic — near-black charcoal surfaces, one warm amber accent used
sparingly for every primary action, flat cards with a single soft shadow (no
glassmorphism), moderately rounded corners, Space Grotesk for headings and
scores, Manrope for body text."

### Color References

- Near-Black Charcoal (`#0b0c0f`) — page background
- Slate Charcoal (`#121317`) / Panel Gray (`#1a1c22`) / Graphite Border
  (`#24262e`) / Muted Steel (`#33363f`) — surface and border scale, darkest
  to lightest
- Warm Amber Gold (`#e8a628`), Soft Amber (`#f2b84b`), Burnt Amber
  (`#c8871a`) — primary accent, hover, pressed
- Persona Mint Green (`#6ee7b7`), Persona Sky Blue (`#7dd3fc`), Persona
  Coral Red (`#fca5a5`) — HR / Technical / Skeptical panelists only
- Off-White (`#f1f5f9`) primary text, Muted Slate (`#94a3b8`) secondary text
- Soft Red (`#f87171`) — form/request errors only, never used for the
  skeptical persona

### Component Prompts

- "A feedback card with a 4px coral-red left border, the label 'Skeptical
  Hiring Manager' in coral text, a bold 20px score badge top-right in
  off-white, a short comment in muted-slate body text, and two small
  charcoal pill tags below reading 'unquantified impact' and 'no evidence'."
- "A primary call-to-action button: solid warm amber gold fill, near-black
  bold text, 8px rounded corners, generous horizontal padding, on a
  near-black page background."
- "A stat card on a translucent panel-gray card background with a soft
  shadow: a 36px bold Space Grotesk amber number as the overall score, with
  a small muted-slate label above it reading 'Overall score'."

### Incremental Iteration

When refining a single screen, explicitly say "keep the existing dark
charcoal/amber tribunal design system" so Stitch doesn't drift toward a
lighter or more generic palette — the near-black base and the amber-as-only-
accent rule are the two things most likely to get diluted on repeated edits.
