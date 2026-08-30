# Crucible — Frontend Plan

## Context

Hackathon: **Build to Ship** (NIAT, Aug 28, single-day build, live deploy mandatory). Meant to be the seed of a real product — UI must not look AI-generated/generic.

**Differentiators to surface in the UI:** 3 disagreeing interviewer personas per answer (not one grader), escalating cross-examination on weak/disagreed answers, a persistent weakness fingerprint across sessions, and real YouTube resource recommendations per tagged gap.

**Shared tech decisions:** Supabase for Auth (email/password + Google OAuth) and as the data layer behind the backend API. No subscription/billing UI — cut per scope decision.

## Tech Stack

- React 18 + Vite, React Router v6
- Tailwind CSS + shadcn/ui primitives, **customized theme** (deep charcoal + amber/gold "courtroom/panel" identity) — not default shadcn purple
- Framer Motion — staggered panel-card reveal, waveform animation, animated score counters
- Recharts — score trend line, weakness-fingerprint radar chart
- Axios for API calls; Supabase JS client (anon key) used **only** for auth/session, never direct data access
- **Voice:** browser-native Web Speech API (`SpeechRecognition` + `SpeechSynthesis`) — zero cost, typed input as fallback

## Folder Layout

```
/client
  /src/pages       Landing, Login, Register, ProfileSetup, SessionLive, SessionSummary, Dashboard, Settings
  /src/components   PanelFeedbackCard, CrossExamPrompt, VoiceCapture, WaveformVisualizer, WeaknessRadarChart, ScoreTrendChart, KeyVaultForm
  /src/lib          apiClient.js, supabaseClient.js, speech.js
  /src/context      AuthContext.jsx
.env.example (VITE_ public vars only)
```

## Pages & Flows

- **`/`** — landing page, hero + differentiators explained, no bare login wall.
- **`/login`, `/register`** — email/password + "Continue with Google".
- **`/profile-setup`** — resume summary + target role.
- **`/sessions/:id/live`** — question (spoken via TTS in voice mode) → confidence slider → answer (typed or spoken) → submit → 3 panel cards animate in → cross-exam branch if triggered → next question → progress bar → summary redirect.
- **`/sessions/:id/summary`** — overall score, calibration gap, top weaknesses, tagged gaps, recommended YouTube resources.
- **`/dashboard`** — session history, score trend line, weakness-fingerprint radar.
- **`/settings`** — BYOK key add/revoke (masked preview only), profile editing, logout.

## Voice Mode

- TTS reads questions aloud, slight rate/pitch variation per persona.
- STT transcribes into the same text field the typed flow uses; live waveform via Web Audio API analyser node.
- Feature-detect and gracefully fall back to typed-only flow if unsupported.

## Embeddable Angle (later)

Keep `SessionLive` self-contained (no hard dependency on outer app chrome) so a future `/embed/:sessionToken` iframe route is a small follow-up, not a rewrite. Not built on hackathon day.

## Build Order

**Must ship:**
1. Landing + auth pages wired to Supabase Auth.
2. Profile setup page.
3. `SessionLive` in text mode: full question→answer→panel→cross-exam→next loop.
4. `SessionSummary` with resource recommendations.
5. `Dashboard` with trend + radar charts.
6. `Settings` page for BYOK (masked preview only).
7. Deploy to Vercel, confirm no secrets in `VITE_*` vars.

**Should-have:** voice mode layered onto the text flow.

## Verification

- Google OAuth and email/password both complete login → redirect.
- Full 5-question session renders all 3 panel cards, triggers cross-exam at least once, reaches summary with resource links populated.
- Settings never displays a full raw key.
- Voice mode (if shipped): TTS/STT work, typed fallback intact if unsupported.
- Full flow re-tested against live Vercel URL talking to live Render backend before demo recording.
