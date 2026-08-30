# Crucible — Backend Plan

## Context

Hackathon: **Build to Ship** (NIAT, Aug 28, single-day build, live deploy mandatory, judged 25% problem alignment / 25% full-stack / 20% AI security / 20% deployment+UX / 10% docs+demo). Meant to be the seed of a real product — real auth, real security.

**Why this idea:** existing mock-interview tools (Yoodli = delivery coaching only, Huru = unlimited reps with no retention, Final Round AI = live-interview cheating tool) give ONE grader's opinion with no memory between sessions. Crucible's wedge: 3 disagreeing interviewer personas per answer, an escalating cross-examination when they disagree or the answer is weak, a persistent weakness fingerprint across sessions, and real YouTube resource recommendations targeted at tagged gaps. No subscription/billing layer — cut per scope decision.

**Shared tech decisions:**
- Database + Auth: **Supabase** (Postgres + Auth, email/password + Google OAuth, RLS on every table).
- AI: Google Gemini API, backend-only, `responseSchema` JSON mode on every call.
- Deploy: Render (backend), Supabase (DB+Auth).

## Tech Stack

- Node.js + Express (REST API)
- Supabase service-role client for data orchestration
- Google Gemini API (`@google/genai`), backend-only
- YouTube Data API v3 (free quota) for resource recommendations
- Zod for validation, `express-rate-limit`, Node's built-in `crypto` (AES-256-GCM + HKDF) for BYOK encryption

## Data Model (Supabase Postgres, RLS on every table)

- `profiles` — id (=auth.uid()), email, name, target_role, resume_summary, created_at
- `api_keys` — id, user_id, provider, encrypted_key (bytea), iv (bytea), auth_tag (bytea), key_preview (text), created_at
- `skill_profiles` — id, user_id (unique), weakness_tally (jsonb), skill_mastery (jsonb), updated_at
- `interview_sessions` — id, user_id, target_role, mode (text/voice), status, overall_score, calibration_gap, created_at, completed_at
- `questions` — id, session_id, text, skill_tag, difficulty, order_index, created_at
- `answers` — id, question_id (unique), answer_text, self_confidence, created_at
- `panel_feedback` — id, answer_id, persona (hr/technical/skeptical), score, comment, flagged_issues (jsonb), created_at
- `cross_exams` — id, answer_id, challenge_question, user_rebuttal, resolved, created_at
- `session_summaries` — id, session_id (unique), overall_score, calibration_gap, top_weaknesses (jsonb), knowledge_gaps (jsonb), created_at
- `learning_resources` — id, user_id, skill_tag, source, title, url, thumbnail_url, created_at
- `key_access_log` — id, user_id, api_key_id, action, created_at

## Folder Layout

```
/server
  /src/routes         auth.routes.js, session.routes.js, profile.routes.js, keys.routes.js
  /src/controllers    auth.controller.js, session.controller.js, profile.controller.js, keys.controller.js
  /src/middleware     auth.middleware.js, validate.middleware.js, errorHandler.js, rateLimit.middleware.js
  /src/services       gemini.service.js, agent.service.js, youtube.service.js, crypto.service.js
  /src/lib            supabaseClient.js
  server.js
.env.example
```

## Agent Pipeline

1. **Start session** `POST /api/sessions` — reads `skill_profiles`, Gemini generates Question 1 weighted toward existing gaps.
2. **Submit answer** `POST /api/sessions/:id/answers` — save answer, run 3 parallel Gemini persona calls (HR/technical/skeptical) → store `panel_feedback` x3. If avg score < 60 or high variance → escalate to `cross_exams`. Else → tag gaps into `skill_profiles`, generate next question.
3. **Resolve cross-exam** `POST /api/sessions/:id/rebuttal` — skeptical persona re-scores, marks resolved, proceeds to gap-tagging + next question.
4. **Complete session** `POST /api/sessions/:id/complete` — aggregate into `session_summaries`, update `skill_profiles`, fetch YouTube resources per tagged gap.

## API Key Security (BYOK)

One-way hash is not usable here (backend must recover the real key to call providers). Envelope encryption instead:
1. AES-256-GCM at rest — `encrypted_key`, `iv`, `auth_tag` in separate columns, never plaintext.
2. Master secret (`ENCRYPTION_SECRET`) lives only in backend env, never in DB/logs.
3. Per-user key derivation via HKDF(`ENCRYPTION_SECRET + user_id`).
4. Decrypt only transiently, in-memory, per request — never cached/logged.
5. Never echoed back — only `key_preview` (last 4 chars) shown to the user.
6. GCM auth tag gives tamper detection.
7. Log-scrubbing middleware redacts key-like fields.
8. `DELETE /api/keys/:id` for immediate revocation.
9. `key_access_log` audit trail on every create/use/delete.
10. HTTPS everywhere, authenticated requests only.

## Security Checklist

- Supabase Auth handles hashing + JWT; backend middleware verifies JWT on every protected route.
- RLS on every table, verified with a cross-user access test.
- BYOK per above.
- Platform Gemini key backend-only, verified absent from client bundle.
- Zod validation everywhere; rate limiting on session/answer/key endpoints.
- `responseSchema` JSON mode on every Gemini call.

## Build Order

**Must ship:**
1. Supabase project (Auth + schema + RLS live).
2. Express scaffold + Supabase JWT verification middleware.
3. `gemini.service.js` + `agent.service.js` — test full branching loop via Postman.
4. `crypto.service.js` + `keys.routes.js` wired and tested.
5. `youtube.service.js` wired into session completion.
6. Deploy to Render, confirm env vars set and never logged.

## Verification

- Register/login issues valid JWT; protected routes reject missing/invalid tokens.
- RLS: user A cannot fetch user B's data.
- Full pipeline test including a deliberately weak answer confirms cross-exam fires.
- BYOK: DB row has only ciphertext/IV/auth-tag; that user's calls route through their key; deletion falls back to platform key.
- Grep deployed frontend bundle for secrets — must return nothing.
