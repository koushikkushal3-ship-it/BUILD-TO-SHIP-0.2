# Animation design prompt — paste this into a fresh Claude conversation (or any tool that builds self-contained HTML/CSS/JS animations)

Build a single self-contained animated HTML page (inline CSS + JS, no external libraries except
Google Fonts) that visually explains **Crucible**, an AI mock-interview platform, as a silent,
looping motion-graphics sequence — think product-launch explainer video, not a slideshow. It should
run automatically start to finish (~25–35 seconds), then loop, entirely through CSS/JS-driven
animation (transforms, opacity, staggered reveals) — no user interaction required, though a
play/pause/restart control in a corner is welcome.

## Visual identity (match exactly — this must look like the real product, not a generic AI mockup)

- **Background:** near-black charcoal, `#0B0C0F` as the page canvas, with card surfaces at `#121317`
  / `#1A1C22`, borders at `#24262E` / `#33363F`. Dark theme only.
- **Primary accent (amber/gold):** `#E8A628` (base), `#F2B84B` (lighter, hover/highlight),
  `#C8871A` (darker, pressed/shadow). Used for primary actions, active states, key highlights, and
  glow effects.
- **Persona accent colors** (used as left-border stripes / glowing dots / tag colors on
  interviewer-related elements): HR = soft green `#6EE7B7`, Technical = soft blue `#7DD3FC`,
  Skeptical = soft coral/red `#FCA5A5`.
- **Text:** near-white `#F1F5F9` for headings/primary text, muted slate `#94A3B8` for secondary
  text.
- **Typography:** "Space Grotesk" (weights 500–700) for all headings/display text — geometric,
  confident, slightly technical. "Manrope" (400–700) for body/secondary text. Both via Google Fonts
  (`https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700&family=Space+Grotesk:wght@500;600;700&display=swap`).
- **Shape language:** rounded-2xl cards (16–20px radius) with subtle borders and soft shadows,
  generous padding, on the near-black surface. Buttons are pill/rounded-lg with the amber fill and
  dark text. No gradients-as-decoration, no glassmorphism clichés, no stock "neural network" particle
  backgrounds — the identity is "courtroom / interview panel," serious and high-stakes, not a cutesy
  consumer app.

## What the animation must actually communicate (narrative beats, in order)

1. **Open (0–3s):** The word "Crucible" (Space Grotesk, large, amber) fades/scales in on the black
   canvas, with a one-line tagline beneath it in Manrope/slate: "An interview panel that disagrees
   with itself." Hold briefly.

2. **The problem, fast (3–7s):** A single flat gray chat-bubble-style score card — "7/10. Good job!"
   — appears center-stage, looking generic and unconvincing, then visibly gets crossed out or
   dissolves away (a quick strike-through animation or shatter/fade), making room for the real idea.

3. **Three personas (7–13s):** Three small avatar-like cards or glowing dots animate in from
   off-screen in sequence, each labeled and colored by its persona accent (HR/green, Technical/blue,
   Skeptical/coral), each showing a distinct short score number (e.g. 85, 60, 40) appearing beside
   it with a stagger — visually demonstrating disagreement, not agreement. A short connecting line or
   pulse between them can imply "independent scoring."

4. **Cross-examination (13–17s):** The lowest-scoring (skeptical/coral) card pulses or grows
   slightly, and a new card slides up beneath it with a sharp, gavel-like icon and a short label like
   "Cross-examined" — implying escalation, a follow-up challenge rather than a static grade.

5. **Real interview rounds (17–22s):** Four small pill/chip labels animate across the screen in a
   horizontal sequence, appearing one after another with a subtle progress-bar or connecting line
   beneath them: "Aptitude & Reasoning" → "Technical Fundamentals" → "HR & Behavioral" → "Coding
   Challenge." This should read as a structured pipeline, not a random question list.

6. **Weakness fingerprint (22–27s):** A minimal radar/spider-chart shape (a hexagon or octagon
   outline with a smaller amber-filled polygon inside it, representing skill scores) draws itself in
   with an animated stroke, then one vertex pulses and "connects" to a small card showing a video
   thumbnail placeholder + a short label like "Practice this now" — implying the loop from weak spot
   to actionable fix.

7. **Close (27–32s):** Everything fades except the "Crucible" wordmark and tagline again, now with a
   small amber underline or accent flourish, then the whole sequence fades to black and restarts
   (loop point).

## Technical requirements

- Single HTML file: inline `<style>` and `<script>`, no build step, no external JS libraries (pure
  CSS animations/transitions plus vanilla JS for sequencing/timing if needed — `requestAnimationFrame`
  or chained `setTimeout`/CSS animation-delay is fine).
- Fully responsive — must look correct at both a 16:9 widescreen aspect ratio (for use as a video/
  hero background) and on a narrower viewport; use relative units and `max-width` constraints, avoid
  fixed pixel layouts that break on resize.
- Keep animation timing smooth (60fps-friendly: animate `transform`/`opacity`, not `width`/`top`/
  `left` directly).
- No copyrighted assets, stock photography, or external image URLs — every visual element should be
  built from CSS shapes, SVG paths, or simple typography; the video-thumbnail placeholder in beat 6
  can be a plain rounded rectangle with a play-icon glyph, not a real image.
- Include a small, unobtrusive restart/replay control (bottom corner) so a viewer can re-trigger the
  sequence on demand, in addition to it auto-looping.

## Tone

Confident, precise, a little dramatic — like a courtroom, not a game show. No emoji, no bouncy
cartoon easing, no confetti. Motion should feel deliberate: measured fades and slides, not
elastic/bouncy spring physics.
