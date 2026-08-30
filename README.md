# Crucible — an interview panel that disagrees with itself

Built for **Build to Ship** (NIAT hackathon). Theme: Personalized AI Experiences, with a genuine
multi-step agentic pipeline underneath.

## The problem

Every AI mock-interview tool on the market gives you one grader's opinion, asks the same kind of
question over and over, and remembers nothing between sessions. Crucible is built around four
things none of them do:

1. **3 disagreeing interviewer personas** score every coding answer independently (HR / technical /
   skeptical) instead of one flat grade.
2. **Escalating cross-examination** — a weak or disputed answer gets a live follow-up challenge from
   the skeptical persona, targeting the exact weakest point.
3. **A real interview structure**, not a flat quiz — four back-to-back rounds (Aptitude & Reasoning,
   Technical Fundamentals, HR & Behavioral, Coding Challenge) covering the same ground a real
   placement drive does, not just resume-grounded trivia.
4. **A persistent weakness fingerprint** across sessions — a drill-down skill radar, a plain-language
   weakness explorer with real curated YouTube videos and one-question practice drills, and a daily
   challenge with a streak counter, all built to turn "here's your score" into "here's what to fix
   and how."

On top of the core interview loop: a full anti-cheating proctoring system (fullscreen + tab-switch
enforcement, server-side 2-strike termination), a real Monaco code editor for coding answers, and a
News page pulling live tech/AI/company industry news for interview-relevant context.

## Architecture

```
client/   React + Vite frontend (Tailwind, Framer Motion, Recharts, Monaco Editor, Web Speech API)
server/   Node/Express backend (the agent pipeline, Gemini calls, BYOK key vault, news aggregation)
Supabase  Postgres + Auth (email/password + Google OAuth), Row Level Security on every table
```

Background/original day-1 planning docs: [`server/PLAN.md`](server/PLAN.md) (data model, agent
pipeline, API key security design) and [`client/PLAN.md`](client/PLAN.md) (pages, voice mode, UI
direction). This README is the current source of truth — the product has grown substantially past
that initial plan; see **Feature walkthrough** below for what's actually built today.

**Why Supabase Auth instead of hand-rolled bcrypt/JWT:** Supabase's GoTrue server already hashes
credentials securely and issues JWTs — satisfying the hackathon's auth requirement with less code
and more security than rolling it yourself. The backend verifies every incoming Supabase JWT before
touching any data.

**AI integration:** Google Gemini API, called only from `server/`, never from the browser. Every
call uses `responseSchema` (JSON mode) so output is structurally validated, not free text. Users can
optionally add their own Gemini/OpenAI/Anthropic key (BYOK) in Settings — see **Security** below.

## Feature walkthrough

### The interview session (`/sessions/:id/live`)

A session is **14 questions across 4 rounds**, back to back, run through a proctoring gate:

| Round | Slots | What it covers |
|---|---|---|
| Aptitude & Reasoning | 4 (MCQ) | Quantitative aptitude ×2, logical reasoning, verbal/professional communication — generic, never tied to the candidate's resume, same as a real placement-test aptitude round |
| Technical Fundamentals | 4 (MCQ) | Programming & DSA, OOP, DBMS & SQL, OS & Computer Networks — resume/role-grounded where it fits |
| HR & Behavioral | 1 (MCQ) | A realistic workplace-judgment scenario, situational-judgment style |
| Coding Challenge | 5 (coding) | Core DSA implementation, role-specific coding (grounded in the resume), a practical engineering task, system design, and a low-level-design/project trade-off question |

Each question is authored in a specific persona's voice (HR / Technical Lead / Skeptical Hiring
Manager) and tagged with which round it belongs to — both shown to the candidate live. Coding
answers are scored by all three personas in parallel; if the average score is low or the personas
disagree sharply (score variance), the skeptical persona fires a live cross-exam follow-up before
the candidate can move on. A **skip** option is available on any question (scores as 0, doesn't
block progress). Coding answers are written in a real **Monaco editor** (VS Code's own engine, with
language selection) rather than a plain textarea.

**Anti-cheating (server-enforced, not just UI theater):**
- A permissions gate before question 1 requests fullscreen and microphone access.
- Tab-switching or exiting fullscreen counts as a violation; **2 violations terminates the session**.
  The check is authoritative server-side (`recordViolation` in `agent.service.js`) — a candidate
  bypassing the frontend entirely and hitting the API directly still gets rejected (409) from
  submitting answers or completing a terminated session.
- Copy, cut, paste, and the right-click context menu are disabled for the session's duration
  (document-level listeners, plus Monaco's own clipboard keybindings are separately no-op'd since
  its clipboard handling can bypass page-level listeners).
- Browser extensions genuinely cannot be detected or blocked from a webpage — the gate screen says
  so plainly and asks the candidate to close them, rather than faking enforcement that doesn't exist.

### Dashboard (`/dashboard`)

Three widgets replace a static "trend score," aimed at turning passive stats into active learning:

- **Drill-down skill radar** — plots real skill-mastery scores; clicking a skill's label opens that
  skill's score history (line chart) and the specific questions missed.
- **Weakness explorer** — an expandable list of tagged weak skills; opening one calls Gemini for a
  plain-language explanation + why it matters + one actionable tip, shows real curated YouTube
  videos (cached per user+skill so repeat visits don't re-spend YouTube's daily search quota), and
  has a "Practice this now" button that opens a focused, ungraded one-question drill (with those same
  videos alongside it) targeting exactly that skill.
- **Daily challenge** — one MCQ per calendar day targeted at the candidate's current weakest skill,
  with a streak counter that correctly breaks on a missed day (verified via direct date-manipulation
  testing, not just read from the code).

### News (`/news`)

Five tabs: **Trending in Tech** and **AI News** (Hacker News' keyless Algolia API), **Company &
Industry** (a GNews → NewsData → Currents → Mediastack fallback chain — each a free-tier provider
with a small daily quota, tried in order so one exhausted key doesn't break the feed), **Community**
(Reddit — see note below), and **Saved** (bookmark any article across any feed; persisted
server-side, owner-only).

> Reddit's public `.json` endpoints block this app's server IP outright regardless of User-Agent —
> a common anti-bot policy against cloud/datacenter IPs, not something fixable with a header tweak.
> The Community tab degrades to an honest empty state rather than erroring; it may or may not work
> once deployed depending on the host's IP reputation.

## Security

- Row Level Security on every Postgres table (`user_id = auth.uid()`), service-role key used only
  server-side for orchestration.
- BYOK keys are never hashed (that would make them unusable — the backend must recover the real key
  to call the AI provider) — instead they're protected with **envelope encryption**: AES-256-GCM,
  a per-user key derived via HKDF from a master secret that lives only in backend env vars, never
  echoed back to the client, only a masked last-4-chars preview shown in the UI.
- Application-level column redaction: RLS controls which *rows* a user can see, not which *columns*
  — the backend strips `correct_option_index`/`explanation` from any MCQ the candidate hasn't
  answered yet, since a leaked answer key isn't something a database policy can prevent.
- Resume uploads are classified by Gemini before being accepted (rejects cover letters, unrelated
  documents) — untrusted user content is never used as instructions, only as data to evaluate.
- Rate limiting, Zod validation, and log-scrubbing middleware on the backend.
- News/YouTube/Gemini API keys live only in backend env vars, never sent to the client bundle.

## Data model (Supabase Postgres)

`profiles`, `api_keys` (BYOK, encrypted), `skill_profiles` (weakness tally + skill mastery),
`interview_sessions` (status: active/completed/terminated, violation_count), `questions`
(order_index, round_label, authored_by_persona, question_type), `answers` (selected_option_index for
MCQ, skipped flag), `panel_feedback`, `cross_exams`, `session_summaries`, `learning_resources`
(cached YouTube results), `key_access_log`, `daily_challenges` (one row per user per UTC day, unique
constraint prevents duplicate generation), `saved_articles` (bookmarked news, unique per user+url).

## Setup

### 1. Supabase project (you'll need to do this — it's tied to your own account)

1. Create a free project at [supabase.com](https://supabase.com).
2. In **Authentication → Providers**, enable Email and Google (Google needs an OAuth client ID/secret from the [Google Cloud Console](https://console.cloud.google.com/) — free).
3. In the **SQL Editor**, run [`server/supabase/schema.sql`](server/supabase/schema.sql) — it creates every table and RLS policy. (Note: several tables/columns added after the initial build — `round_label`, `skipped`, `daily_challenges`, `saved_articles` — were applied as live migrations; the schema file reflects the original baseline.)
4. From **Project Settings → API**, copy: Project URL, `service_role` key (backend only, never expose it), `anon` key (frontend), and the JWT secret.

### 2. Get free API keys

- **Gemini:** [Google AI Studio](https://aistudio.google.com/) → free API key.
- **YouTube Data API v3:** [Google Cloud Console](https://console.cloud.google.com/) → enable "YouTube Data API v3" → create an API key (free quota, 10k units/day — each search costs 100 units, so budget accordingly).
- **News APIs** (all optional, all free-tier — the industry feed just returns fewer results if some are unset): [GNews](https://gnews.io) (100 requests/day), [NewsData.io](https://newsdata.io) (200 credits/day), [Currents API](https://currentsapi.services) (~600/day), [Mediastack](https://mediastack.com) (100/month, free tier is HTTP-only).

### 3. Backend

```bash
cd server
cp .env.example .env
# fill in SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, SUPABASE_JWT_SECRET, GEMINI_API_KEY, YOUTUBE_API_KEY
# generate ENCRYPTION_SECRET:
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
npm install
npm run dev
```

### 4. Frontend

```bash
cd client
cp .env.example .env
# fill in VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY (both public/safe), VITE_API_BASE_URL
npm install
npm run dev
```

Open http://localhost:5173.

### 5. Deploy (all free tiers)

- Backend → [Render](https://render.com) (Web Service, root `server/`, build `npm install`, start `npm start`). Set the same env vars as `.env` there.
- Frontend → [Vercel](https://vercel.com) (root `client/`, framework preset Vite). Set the `VITE_*` env vars there, and set `FRONTEND_URL` on the backend to the deployed Vercel URL for CORS.

## What's real vs. what's roadmap

Everything described above is fully implemented against real Supabase tables and real Gemini/
YouTube/news-provider calls — none of it is mocked. What's explicitly **not** built (by scope
decision): a subscription/billing layer (cut — this is a hackathon submission, not a commerce
build), an embeddable widget SDK, a production-grade voice upgrade beyond the free browser Web
Speech API, and genuine Reddit integration (would need a registered OAuth app with its own
client ID/secret, not just the public read-only endpoint).

One known model-reliability caveat worth stating plainly: Gemini occasionally produces incorrect
arithmetic on word-problem-style aptitude questions (observed directly during testing — visible
"let me recalculate" scratch-work, with the final answer sometimes disagreeing with its own stored
answer key). This is an inherent LLM limitation for exact arithmetic, not a bug in the pipeline; a
fix would mean either a stronger (slower/costlier) model or a separate verification pass on every
generated question, both deliberate trade-offs not made in this build.
