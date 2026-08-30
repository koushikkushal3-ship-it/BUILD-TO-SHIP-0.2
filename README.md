# Crucible — an interview panel that disagrees with itself

Built for **Build to Ship** (NIAT hackathon). Theme: Personalized AI Experiences, with a genuine
multi-step agentic pipeline underneath.

## The problem

Every AI mock-interview tool on the market gives you one grader's opinion and no memory between
sessions (see the competitive research in [`client/PLAN.md`](client/PLAN.md) / [`server/PLAN.md`](server/PLAN.md)).
Crucible is built around three things none of them do:

1. **3 disagreeing interviewer personas** score every answer independently (HR / technical / skeptical) instead of one flat grade.
2. **Escalating cross-examination** — a weak or disputed answer gets a live follow-up challenge from the skeptical persona, targeting the exact weakest point.
3. **A persistent weakness fingerprint** across sessions, paired with real YouTube resource recommendations (actual search results, not AI-hallucinated advice) for your tagged gaps.

## Architecture

```
client/   React + Vite frontend (Tailwind, Framer Motion, Recharts, Web Speech API for voice)
server/   Node/Express backend (the agent pipeline, Gemini calls, BYOK key vault)
Supabase  Postgres + Auth (email/password + Google OAuth), Row Level Security on every table
```

Full detail lives in [`server/PLAN.md`](server/PLAN.md) (data model, agent pipeline, API key
security design) and [`client/PLAN.md`](client/PLAN.md) (pages, voice mode, UI direction).

**Why Supabase Auth instead of hand-rolled bcrypt/JWT:** Supabase's GoTrue server already hashes
credentials securely and issues JWTs — satisfying the hackathon's auth requirement with less code
and more security than rolling it yourself. The backend verifies every incoming Supabase JWT before
touching any data.

**AI integration:** Google Gemini API, called only from `server/`, never from the browser. Every
call uses `responseSchema` (JSON mode) so output is structurally validated, not free text. Users can
optionally add their own Gemini/OpenAI/Anthropic key (BYOK) in Settings — see the **API key
security** section below.

**Security:**
- Row Level Security on every Postgres table (`user_id = auth.uid()`).
- BYOK keys are never hashed (that would make them unusable — the backend must recover the real key
  to call the AI provider) — instead they're protected with **envelope encryption**: AES-256-GCM,
  a per-user key derived via HKDF from a master secret that lives only in backend env vars, never
  echoed back to the client, only a masked last-4-chars preview shown in the UI. Full design in
  `server/PLAN.md`.
- Rate limiting, Zod validation, and log-scrubbing middleware on the backend.

## Setup

### 1. Supabase project (you'll need to do this — it's tied to your own account)

1. Create a free project at [supabase.com](https://supabase.com).
2. In **Authentication → Providers**, enable Email and Google (Google needs an OAuth client ID/secret from the [Google Cloud Console](https://console.cloud.google.com/) — free).
3. In the **SQL Editor**, run [`server/supabase/schema.sql`](server/supabase/schema.sql) — it creates every table and RLS policy.
4. From **Project Settings → API**, copy: Project URL, `service_role` key (backend only, never expose it), `anon` key (frontend), and the JWT secret.

### 2. Get free API keys

- **Gemini:** [Google AI Studio](https://aistudio.google.com/) → free API key.
- **YouTube Data API v3:** [Google Cloud Console](https://console.cloud.google.com/) → enable "YouTube Data API v3" → create an API key (free quota, 10k units/day).

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

Everything above is fully implemented, not mocked — the panel pipeline, cross-exam branching,
weakness tagging, BYOK envelope encryption, and YouTube resource lookup all run against real
Supabase tables and real Gemini calls. What's explicitly **not** built (by scope decision, see
`server/PLAN.md`/`client/PLAN.md`): a subscription/billing layer (cut — this is a hackathon
submission, not a commerce build), an embeddable widget SDK, and a production-grade voice upgrade
beyond the free browser Web Speech API.
