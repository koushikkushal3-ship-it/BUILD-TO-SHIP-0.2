# Crucible — Demo Video Script

Target length: **2:45–3:00**. Written for a screen-recorded walkthrough with voiceover — read the
narration at a natural, confident pace; every visual cue assumes you're clicking through the real
app live, not slides.

---

### 0:00–0:15 — Hook

**Visual:** Black screen, then cut straight into a mock-interview cliché — a single chat bubble
score: "7/10. Good job!" — then cut it away.

**Voiceover:**
> "Every AI mock-interview tool gives you the same thing: one grader's opinion, and no memory of
> what happened last time. Real interviews don't work that way. So we didn't build it that way."

### 0:15–0:35 — What Crucible actually is

**Visual:** Landing page, scroll through the four differentiator cards.

**Voiceover:**
> "This is Crucible. Three interviewer personas score every answer independently — HR, a technical
> lead, and a skeptical hiring manager — and they don't always agree. A weak answer gets cross-
> examined live. And every session runs through real interview rounds: aptitude, technical
> fundamentals, HR, and coding — not just resume trivia."

### 0:35–1:00 — Starting a session: proctoring gate

**Visual:** Profile setup (role + resume already filled) → click "Start interview session" →
proctoring gate screen appears.

**Voiceover:**
> "Before anything starts, the candidate goes through a real proctoring gate — fullscreen and
> microphone access requested up front, copy-paste disabled for the session, and two tab-switch or
> fullscreen-exit violations end it. This isn't just UI — it's enforced server-side too."

**Action:** Click "Grant access & begin."

### 1:00–1:40 — Round 1: Aptitude, and round 2: Technical

**Visual:** Question 1 of 14, round label "APTITUDE & REASONING" visible. Answer it. Move to a
Technical Fundamentals MCQ (round label changes).

**Voiceover:**
> "Round one is aptitude and reasoning — quantitative, logical, verbal — generic, exactly like a
> real placement test, never tied to the resume. Round two switches to technical fundamentals,
> grounded in the candidate's actual background. Each question shows which persona is asking, and
> which round you're in."

**Action (quick):** Click "Skip this question" once to show the skip flow briefly.

### 1:40–2:15 — Coding round: Monaco editor, panel disagreement, cross-exam

**Visual:** Jump to a Coding Challenge question. Show the real Monaco code editor (language
dropdown, syntax highlighting). Type a real answer. Submit.

**Voiceover:**
> "Coding questions use a real code editor — not a plain textarea. Submit an answer, and all three
> personas score it in parallel."

**Visual:** Three panel feedback cards animate in with different scores/comments.

**Voiceover:**
> "When they disagree, or the average score is weak, the skeptical persona doesn't just move on —
> it pushes back."

**Visual:** Cross-exam challenge card appears with a follow-up question and rebuttal box.

**Voiceover:**
> "That's the cross-examination — a live follow-up targeting the exact weakest point in the answer,
> the way a real tough interviewer would."

### 2:15–2:35 — Dashboard: skill radar, weakness explorer, daily challenge

**Visual:** Navigate to Dashboard. Click a point on the skill radar → drill-down panel opens with
score history + missed questions. Expand a weak skill in the explorer → explanation + curated videos
+ "Practice this now" → quick drill modal opens.

**Voiceover:**
> "After a session, the dashboard turns stats into action. Click any skill on the radar to see
> exactly what was missed. Expand a weak skill for a plain-language explanation, real curated videos,
> and a one-question practice drill on the spot — plus a daily challenge that targets your weakest
> skill and tracks a streak."

### 2:35–2:50 — News + security

**Visual:** Quick cut to the News page (Trending in Tech / AI News tabs scrolling). Then cut to
Settings → BYOK key field showing a masked preview.

**Voiceover:**
> "A News tab keeps candidates current on the industry. And under the hood: Row Level Security on
> every table, envelope-encrypted API keys, and Gemini calls that never leave the backend."

### 2:50–3:00 — Close

**Visual:** Cut back to Landing page hero.

**Voiceover:**
> "Crucible — an interview panel that actually pushes back. Built for Build to Ship."

**On-screen text card (2 seconds, silent):** GitHub repo URL + live deploy URL.

---

## Recording notes

- Use a test account with a resume/role already saved so setup doesn't eat runtime.
- Pre-seed one session with a couple of weak-skill answers before recording so the Dashboard segment
  has real data to show (skill radar and weakness explorer look thin on a brand-new account).
- The violation/termination flow is real and worth a **fast** 3–4 second cutaway (switch tabs twice,
  show the termination screen) if time allows — cut it first if you're over length, it's the least
  essential beat for judging criteria weighted toward AI pipeline + full-stack + security.
- Keep total takes under ~3:00 — most hackathon rubrics cap or penalize overlong demos.
