import { supabaseAdmin } from '../lib/supabaseClient.js';
import {
  resolveApiKey,
  getOrCreateSkillProfile,
  weakestSkillTags,
  WEAK_SKILL_THRESHOLD,
} from './agent.service.js';
import { generateMcqQuestion, explainSkillGap } from './gemini.service.js';
import { findLearningResources } from './youtube.service.js';

async function getProfileForGeneration(userId) {
  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('target_role, resume_summary')
    .eq('id', userId)
    .single();
  return {
    targetRole: profile?.target_role || 'Software Engineer',
    resumeSummary: profile?.resume_summary || 'Not provided',
  };
}

// Blends a single practice signal into skill_mastery more gently (0.3) than a
// real scored interview answer does (0.5) — an ungraded drill or daily
// challenge is weaker evidence of actual skill than a full panel-scored
// interview answer, so it shouldn't swing the mastery number as hard.
async function nudgeSkillMastery(userId, skillTag, correct) {
  const skillProfile = await getOrCreateSkillProfile(userId);
  const score = correct ? 100 : 0;
  const prevMastery = skillProfile.skill_mastery[skillTag];
  const nextScore = prevMastery === undefined ? score : Math.round(prevMastery * 0.7 + score * 0.3);
  const nextMastery = { ...skillProfile.skill_mastery, [skillTag]: nextScore };

  await supabaseAdmin
    .from('skill_profiles')
    .update({ skill_mastery: nextMastery, updated_at: new Date().toISOString() })
    .eq('user_id', userId);

  return nextScore;
}

// The "interactive weakness explorer" widget's data — every tagged weak
// skill plus real curated videos for it, reusing cached learning_resources
// from past session completions when available so this doesn't burn a fresh
// YouTube quota call every dashboard load.
export async function getWeakSkillsOverview(userId) {
  const skillProfile = await getOrCreateSkillProfile(userId);
  const weakTags = weakestSkillTags(skillProfile.skill_mastery, 8);

  const results = [];
  for (const skillTag of weakTags) {
    const { data: cached } = await supabaseAdmin
      .from('learning_resources')
      .select('title, url, thumbnail_url')
      .eq('user_id', userId)
      .eq('skill_tag', skillTag)
      .limit(3);

    let resources = cached || [];
    if (!resources.length) {
      const videos = await findLearningResources(skillTag);
      resources = videos.map((v) => ({ title: v.title, url: v.url, thumbnail_url: v.thumbnailUrl }));

      // Persist so the next dashboard load reuses this instead of spending
      // another YouTube Data API search quota unit on the same skill — the
      // daily search quota is small (100/day on the free tier) and this
      // endpoint runs on every dashboard visit, not just session completion.
      if (resources.length) {
        await supabaseAdmin.from('learning_resources').insert(
          resources.map((r) => ({ user_id: userId, skill_tag: skillTag, source: 'youtube', ...r }))
        );
      }
    }

    results.push({ skillTag, masteryScore: skillProfile.skill_mastery[skillTag], resources });
  }

  return results;
}

export async function explainWeakSkill({ userId, skillTag }) {
  const skillProfile = await getOrCreateSkillProfile(userId);
  const masteryScore = skillProfile.skill_mastery[skillTag] ?? null;
  const apiKey = await resolveApiKey(userId);
  return explainSkillGap({ apiKey, skillTag, masteryScore });
}

// Full skill-mastery map for the drill-down radar — every skill tagged so
// far, not just the weak ones the explorer surfaces.
export async function getSkillRadarData(userId) {
  const skillProfile = await getOrCreateSkillProfile(userId);
  return Object.entries(skillProfile.skill_mastery).map(([skillTag, score]) => ({ skillTag, score }));
}

// Clicking a radar point drills into that skill's score history across every
// answered question tagged with it, plus which of those were actually
// missed — this is what makes the radar "drill-down" instead of read-only.
export async function getSkillHistory({ userId, skillTag }) {
  const { data: questions } = await supabaseAdmin
    .from('questions')
    .select(
      'id, text, question_type, correct_option_index, created_at, interview_sessions!inner(user_id), answers(selected_option_index, skipped, panel_feedback(score))'
    )
    .eq('skill_tag', skillTag)
    .eq('interview_sessions.user_id', userId)
    .order('created_at', { ascending: true });

  const history = (questions || [])
    .filter((q) => q.answers && !q.answers.skipped)
    .map((q) => {
      const isMcq = q.question_type === 'mcq';
      const score = isMcq
        ? q.answers.selected_option_index === q.correct_option_index
          ? 100
          : 0
        : q.answers.panel_feedback?.length
          ? Math.round(q.answers.panel_feedback.reduce((sum, f) => sum + f.score, 0) / q.answers.panel_feedback.length)
          : null;

      return {
        questionId: q.id,
        text: q.text,
        type: q.question_type,
        date: q.created_at,
        score,
        missed: score !== null && score < WEAK_SKILL_THRESHOLD,
      };
    })
    .filter((h) => h.score !== null);

  return history;
}

// A quick, ungraded, single-question drill on demand — deliberately not
// persisted as a session/question row (it's practice, not an interview), so
// the answer key can travel with the question in one response instead of
// needing a second round-trip to "reveal" it after the candidate answers.
export async function generatePracticeDrill({ userId, skillTag }) {
  const { targetRole, resumeSummary } = await getProfileForGeneration(userId);
  const apiKey = await resolveApiKey(userId);

  return generateMcqQuestion({
    apiKey,
    targetRole,
    resumeSummary,
    difficulty: 'medium',
    category: 'drill',
    persona: 'technical',
    subjectFocus: skillTag,
  });
}

export async function recordPracticeDrillResult({ userId, skillTag, correct }) {
  const nextScore = await nudgeSkillMastery(userId, skillTag, correct);
  return { masteryScore: nextScore };
}

function todayDateString() {
  return new Date().toISOString().slice(0, 10);
}

function sanitizeChallenge(challenge) {
  if (challenge.completed) return challenge;
  const { correct_option_index, explanation, ...safe } = challenge;
  return safe;
}

async function computeStreak(userId) {
  const { data: rows } = await supabaseAdmin
    .from('daily_challenges')
    .select('challenge_date')
    .eq('user_id', userId)
    .eq('completed', true);

  if (!rows || !rows.length) return 0;

  const completedDates = new Set(rows.map((r) => r.challenge_date));
  const cursor = new Date();
  // If today isn't completed yet, count backward starting from yesterday so
  // an in-progress streak doesn't look broken before the day is even over.
  if (!completedDates.has(todayDateString())) {
    cursor.setUTCDate(cursor.getUTCDate() - 1);
  }

  let streak = 0;
  while (completedDates.has(cursor.toISOString().slice(0, 10))) {
    streak++;
    cursor.setUTCDate(cursor.getUTCDate() - 1);
  }
  return streak;
}

// One question per calendar day (UTC), targeted at the candidate's current
// weakest skill, created lazily on first request each day and reused for
// every subsequent load that same day.
export async function getOrCreateDailyChallenge(userId) {
  const today = todayDateString();
  const { data: existing } = await supabaseAdmin
    .from('daily_challenges')
    .select('*')
    .eq('user_id', userId)
    .eq('challenge_date', today)
    .maybeSingle();

  let challenge = existing;
  if (!challenge) {
    const skillProfile = await getOrCreateSkillProfile(userId);
    const [weakestTag] = weakestSkillTags(skillProfile.skill_mastery, 1);
    const { targetRole, resumeSummary } = await getProfileForGeneration(userId);
    const apiKey = await resolveApiKey(userId);

    const generated = await generateMcqQuestion({
      apiKey,
      targetRole,
      resumeSummary,
      difficulty: 'medium',
      category: 'drill',
      persona: 'technical',
      subjectFocus: weakestTag || 'Programming & DSA fundamentals — a well-rounded fresher-level question',
    });

    const { data: inserted, error } = await supabaseAdmin
      .from('daily_challenges')
      .insert({
        user_id: userId,
        challenge_date: today,
        skill_tag: generated.skillTag,
        question_text: generated.text,
        options: generated.options,
        correct_option_index: generated.correctOptionIndex,
        explanation: generated.explanation,
        difficulty: generated.difficulty,
      })
      .select('*')
      .single();

    if (error) {
      // Unique-violation on (user_id, challenge_date) means a concurrent
      // request (e.g. two open tabs) already created today's row a moment
      // ago — use that one instead of failing the request.
      if (error.code === '23505') {
        const { data: raceWinner, error: refetchErr } = await supabaseAdmin
          .from('daily_challenges')
          .select('*')
          .eq('user_id', userId)
          .eq('challenge_date', today)
          .single();
        if (refetchErr) throw refetchErr;
        challenge = raceWinner;
      } else {
        throw error;
      }
    } else {
      challenge = inserted;
    }
  }

  const streak = await computeStreak(userId);
  return { challenge: sanitizeChallenge(challenge), streak };
}

export async function answerDailyChallenge({ userId, selectedOptionIndex }) {
  const today = todayDateString();
  const { data: challenge, error } = await supabaseAdmin
    .from('daily_challenges')
    .select('*')
    .eq('user_id', userId)
    .eq('challenge_date', today)
    .single();
  if (error || !challenge) {
    const err = new Error('No challenge found for today');
    err.status = 404;
    err.publicMessage = err.message;
    throw err;
  }
  if (challenge.completed) {
    const err = new Error("Today's challenge is already answered");
    err.status = 409;
    err.publicMessage = err.message;
    throw err;
  }

  const correct = selectedOptionIndex === challenge.correct_option_index;
  await supabaseAdmin
    .from('daily_challenges')
    .update({ completed: true, selected_option_index: selectedOptionIndex })
    .eq('id', challenge.id);

  if (challenge.skill_tag) await nudgeSkillMastery(userId, challenge.skill_tag, correct);

  const streak = await computeStreak(userId);
  return { correct, correctOptionIndex: challenge.correct_option_index, explanation: challenge.explanation, streak };
}
