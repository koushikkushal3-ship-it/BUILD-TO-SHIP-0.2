import { supabaseAdmin } from '../lib/supabaseClient.js';
import { decryptApiKey } from './crypto.service.js';
import {
  generateMcqQuestion,
  generateCodingQuestion,
  generatePanelFeedback,
  generateCrossExamChallenge,
} from './gemini.service.js';
import { findLearningResources } from './youtube.service.js';

const QUESTIONS_PER_SESSION = 10;
const ESCALATE_SCORE_THRESHOLD = 60;
const ESCALATE_STDDEV_THRESHOLD = 20;
const WEAK_SKILL_THRESHOLD = 65;
const PERSONAS = ['hr', 'technical', 'skeptical'];
const RECENT_QUESTIONS_LIMIT = 40;

// Fixed structure: 5 MCQ first, then 5 coding — not interleaved, so the
// session reads as two clear sections rather than a shuffled mix.
const TYPE_BY_ORDER = { 1: 'mcq', 2: 'mcq', 3: 'mcq', 4: 'mcq', 5: 'mcq', 6: 'coding', 7: 'coding', 8: 'coding', 9: 'coding', 10: 'coding' };

function normalizeQuestionText(text) {
  return text.toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, ' ').trim();
}

function isDuplicateQuestion(candidateText, avoidTexts) {
  const normalizedCandidate = normalizeQuestionText(candidateText);
  return avoidTexts.some((prev) => {
    const normalizedPrev = normalizeQuestionText(prev);
    return (
      normalizedCandidate === normalizedPrev ||
      normalizedCandidate.includes(normalizedPrev) ||
      normalizedPrev.includes(normalizedCandidate)
    );
  });
}

function mean(nums) {
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

function stddev(nums) {
  const m = mean(nums);
  return Math.sqrt(mean(nums.map((n) => (n - m) ** 2)));
}

// Never send correct_option_index/explanation for a question the candidate
// hasn't answered yet — RLS controls which ROWS a user can see, not which
// COLUMNS, so hiding the answer key is this app's job, not the database's.
function sanitizeUnansweredQuestion(question) {
  if (!question) return question;
  const { correct_option_index, explanation, ...safe } = question;
  return safe;
}

// Returns the caller's own Gemini key if they've added one via Settings (BYOK),
// otherwise null so the platform default key is used. Logs the "used" event
// either way is unnecessary for the platform key — only BYOK usage is audited.
export async function resolveApiKey(userId) {
  const { data } = await supabaseAdmin
    .from('api_keys')
    .select('id, encrypted_key, iv, auth_tag')
    .eq('user_id', userId)
    .eq('provider', 'gemini')
    .maybeSingle();

  if (!data) return null;

  const plaintext = decryptApiKey(userId, {
    encryptedKey: Buffer.from(data.encrypted_key),
    iv: Buffer.from(data.iv),
    authTag: Buffer.from(data.auth_tag),
  });

  await supabaseAdmin.from('key_access_log').insert({
    user_id: userId,
    api_key_id: data.id,
    provider: 'gemini',
    action: 'used',
  });

  return plaintext;
}

async function getOrCreateSkillProfile(userId) {
  const { data: existing } = await supabaseAdmin
    .from('skill_profiles')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (existing) return existing;

  const { data: created, error } = await supabaseAdmin
    .from('skill_profiles')
    .insert({ user_id: userId, weakness_tally: {}, skill_mastery: {} })
    .select('*')
    .single();

  if (error) throw error;
  return created;
}

function weakestSkillTags(skillMastery, limit = 3) {
  return Object.entries(skillMastery)
    .filter(([, score]) => score < WEAK_SKILL_THRESHOLD)
    .sort((a, b) => a[1] - b[1])
    .slice(0, limit)
    .map(([tag]) => tag);
}

// Pulled across ALL of the user's past sessions, not just the current one —
// "never repeat" means never, not just within one sitting.
async function getRecentQuestionTexts(userId) {
  const { data } = await supabaseAdmin
    .from('questions')
    .select('text, interview_sessions!inner(user_id)')
    .eq('interview_sessions.user_id', userId)
    .order('created_at', { ascending: false })
    .limit(RECENT_QUESTIONS_LIMIT);

  return (data || []).map((q) => q.text);
}

// The prompt instruction is the primary defense against repeats; this is a
// cheap secondary check that retries once if Gemini echoes something too
// close to a past question despite being told not to.
async function generateUniqueQuestionForOrder(orderIndex, baseParams) {
  const type = TYPE_BY_ORDER[orderIndex] || 'coding';
  const generator = type === 'mcq' ? generateMcqQuestion : generateCodingQuestion;

  const first = await generator(baseParams);
  const generated = isDuplicateQuestion(first.text, baseParams.avoidQuestions)
    ? await generator({ ...baseParams, avoidQuestions: [first.text, ...baseParams.avoidQuestions] })
    : first;

  return { type, generated };
}

async function insertQuestion({ sessionId, orderIndex, type, generated }) {
  const row = {
    session_id: sessionId,
    text: generated.text,
    skill_tag: generated.skillTag,
    difficulty: generated.difficulty,
    order_index: orderIndex,
    question_type: type,
  };
  if (type === 'mcq') {
    row.options = generated.options;
    row.correct_option_index = generated.correctOptionIndex;
    row.explanation = generated.explanation;
  }

  const { data, error } = await supabaseAdmin.from('questions').insert(row).select('*').single();
  if (error) throw error;
  return data;
}

async function generateAndInsertQuestion({ sessionId, orderIndex, apiKey, targetRole, resumeSummary, weakSkillTags, difficulty, avoidQuestions }) {
  const { type, generated } = await generateUniqueQuestionForOrder(orderIndex, {
    apiKey,
    targetRole,
    resumeSummary,
    weakSkillTags,
    difficulty,
    avoidQuestions,
  });
  return insertQuestion({ sessionId, orderIndex, type, generated });
}

export async function startSession(userId) {
  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('target_role, resume_summary')
    .eq('id', userId)
    .single();

  // Both are mandatory: questions must be grounded in an actual resume and
  // an actual target role, never a generic quiz — so there's nothing
  // meaningful to start until both exist.
  if (!profile?.target_role) {
    const err = new Error('Set your target role before starting a session');
    err.status = 400;
    err.publicMessage = err.message;
    throw err;
  }
  if (!profile?.resume_summary) {
    const err = new Error('Upload or paste your resume before starting a session');
    err.status = 400;
    err.publicMessage = err.message;
    throw err;
  }

  const skillProfile = await getOrCreateSkillProfile(userId);
  const apiKey = await resolveApiKey(userId);
  const avoidQuestions = await getRecentQuestionTexts(userId);

  const { data: session, error: sessionErr } = await supabaseAdmin
    .from('interview_sessions')
    .insert({ user_id: userId, target_role: profile.target_role, status: 'active' })
    .select('*')
    .single();
  if (sessionErr) throw sessionErr;

  const question = await generateAndInsertQuestion({
    sessionId: session.id,
    orderIndex: 1,
    apiKey,
    targetRole: profile.target_role,
    resumeSummary: profile.resume_summary,
    weakSkillTags: weakestSkillTags(skillProfile.skill_mastery),
    difficulty: 'medium',
    avoidQuestions,
  });

  return { session, question: sanitizeUnansweredQuestion(question) };
}

// Shared by both MCQ (score is 100/0) and coding (score is the panel
// average) — tags the skill profile and generates whatever comes next.
async function recordScoreAndAdvance({ userId, session, question, allFlaggedIssues, avgScore }) {
  const skillProfile = await getOrCreateSkillProfile(userId);

  const nextTally = { ...skillProfile.weakness_tally };
  for (const issue of allFlaggedIssues) {
    nextTally[issue] = (nextTally[issue] || 0) + 1;
  }

  const prevMastery = skillProfile.skill_mastery[question.skill_tag];
  const nextMasteryScore = prevMastery === undefined ? avgScore : Math.round(prevMastery * 0.5 + avgScore * 0.5);
  const nextMastery = { ...skillProfile.skill_mastery, [question.skill_tag]: nextMasteryScore };

  await supabaseAdmin
    .from('skill_profiles')
    .update({ weakness_tally: nextTally, skill_mastery: nextMastery, updated_at: new Date().toISOString() })
    .eq('user_id', userId);

  if (question.order_index >= QUESTIONS_PER_SESSION) {
    return { status: 'ready_to_complete' };
  }

  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('target_role, resume_summary')
    .eq('id', userId)
    .single();

  const apiKey = await resolveApiKey(userId);
  const difficulty = avgScore >= 80 ? 'hard' : avgScore < 50 ? 'easy' : 'medium';
  const nextOrderIndex = question.order_index + 1;
  const avoidQuestions = await getRecentQuestionTexts(userId);

  const nextQuestion = await generateAndInsertQuestion({
    sessionId: session.id,
    orderIndex: nextOrderIndex,
    apiKey,
    targetRole: profile.target_role,
    resumeSummary: profile.resume_summary,
    weakSkillTags: weakestSkillTags(nextMastery),
    difficulty,
    avoidQuestions,
  });

  return { status: 'next_question', question: sanitizeUnansweredQuestion(nextQuestion) };
}

async function submitMcqAnswer({ userId, question, selectedOptionIndex, selfConfidence }) {
  const selectedText = question.options?.[selectedOptionIndex] ?? null;

  const { data: answer, error: aErr } = await supabaseAdmin
    .from('answers')
    .insert({
      question_id: question.id,
      answer_text: selectedText,
      selected_option_index: selectedOptionIndex,
      self_confidence: selfConfidence,
    })
    .select('*')
    .single();
  if (aErr) throw aErr;

  const correct = selectedOptionIndex === question.correct_option_index;
  const score = correct ? 100 : 0;

  const session = { id: question.interview_sessions.id };
  const advance = await recordScoreAndAdvance({
    userId,
    session,
    question,
    allFlaggedIssues: [],
    avgScore: score,
  });

  return {
    status: advance.status,
    answer,
    mcqResult: {
      correct,
      correctOptionIndex: question.correct_option_index,
      explanation: question.explanation,
      selectedOptionIndex,
    },
    nextQuestion: advance.question,
  };
}

async function submitCodingAnswer({ userId, question, answerText, selfConfidence, apiKey }) {
  const { data: answer, error: aErr } = await supabaseAdmin
    .from('answers')
    .insert({ question_id: question.id, answer_text: answerText, self_confidence: selfConfidence })
    .select('*')
    .single();
  if (aErr) throw aErr;

  const feedbackResults = await Promise.all(
    PERSONAS.map((persona) =>
      generatePanelFeedback({ apiKey, persona, questionText: question.text, answerText }).then((result) => ({
        persona,
        ...result,
      }))
    )
  );

  const { data: panelRows, error: pErr } = await supabaseAdmin
    .from('panel_feedback')
    .insert(
      feedbackResults.map((f) => ({
        answer_id: answer.id,
        persona: f.persona,
        score: f.score,
        comment: f.comment,
        flagged_issues: f.flaggedIssues,
      }))
    )
    .select('*');
  if (pErr) throw pErr;

  const scores = feedbackResults.map((f) => f.score);
  const avgScore = Math.round(mean(scores));
  const disagreement = stddev(scores);
  const allFlaggedIssues = feedbackResults.flatMap((f) => f.flaggedIssues);

  const session = { id: question.interview_sessions.id };

  if (avgScore < ESCALATE_SCORE_THRESHOLD || disagreement > ESCALATE_STDDEV_THRESHOLD) {
    const skeptical = feedbackResults.find((f) => f.persona === 'skeptical');
    const weakestIssue = skeptical?.flaggedIssues?.[0] || allFlaggedIssues[0] || 'lack of concrete detail';

    const challenge = await generateCrossExamChallenge({
      apiKey,
      questionText: question.text,
      answerText,
      weakestIssue,
    });

    const { data: crossExam, error: cErr } = await supabaseAdmin
      .from('cross_exams')
      .insert({ answer_id: answer.id, challenge_question: challenge.challengeQuestion })
      .select('*')
      .single();
    if (cErr) throw cErr;

    return { status: 'cross_exam', answer, panelFeedback: panelRows, crossExam };
  }

  const advance = await recordScoreAndAdvance({ userId, session, question, allFlaggedIssues, avgScore });

  return { status: advance.status, answer, panelFeedback: panelRows, nextQuestion: advance.question };
}

export async function submitAnswer({ userId, sessionId, questionId, answerText, selectedOptionIndex, selfConfidence }) {
  const { data: question, error: qErr } = await supabaseAdmin
    .from('questions')
    .select('*, interview_sessions!inner(id, user_id)')
    .eq('id', questionId)
    .eq('interview_sessions.user_id', userId)
    .single();
  if (qErr || !question) {
    const err = new Error('Question not found');
    err.status = 404;
    err.publicMessage = err.message;
    throw err;
  }

  if (question.question_type === 'mcq') {
    if (selectedOptionIndex === undefined || selectedOptionIndex === null) {
      const err = new Error('Select an answer');
      err.status = 400;
      err.publicMessage = err.message;
      throw err;
    }
    return submitMcqAnswer({ userId, question, selectedOptionIndex, selfConfidence });
  }

  if (!answerText || !answerText.trim()) {
    const err = new Error('Write an answer');
    err.status = 400;
    err.publicMessage = err.message;
    throw err;
  }
  const apiKey = await resolveApiKey(userId);
  return submitCodingAnswer({ userId, question, answerText, selfConfidence, apiKey });
}

export async function resolveCrossExam({ userId, sessionId, crossExamId, userRebuttal }) {
  const { data: crossExam, error: cErr } = await supabaseAdmin
    .from('cross_exams')
    .select('*, answers!inner(id, question_id, questions!inner(*, interview_sessions!inner(id, user_id)))')
    .eq('id', crossExamId)
    .single();
  if (cErr || !crossExam) {
    const err = new Error('Cross-exam not found');
    err.status = 404;
    err.publicMessage = err.message;
    throw err;
  }

  const question = crossExam.answers.questions;
  if (question.interview_sessions.user_id !== userId) {
    const err = new Error('Not found');
    err.status = 404;
    err.publicMessage = err.message;
    throw err;
  }

  const apiKey = await resolveApiKey(userId);
  const rebuttalFeedback = await generatePanelFeedback({
    apiKey,
    persona: 'skeptical',
    questionText: crossExam.challenge_question,
    answerText: userRebuttal,
  });

  await supabaseAdmin
    .from('cross_exams')
    .update({
      user_rebuttal: userRebuttal,
      rebuttal_score: rebuttalFeedback.score,
      resolved: true,
    })
    .eq('id', crossExamId);

  const session = { id: question.interview_sessions.id };
  const advance = await recordScoreAndAdvance({
    userId,
    session,
    question,
    allFlaggedIssues: rebuttalFeedback.flaggedIssues,
    avgScore: rebuttalFeedback.score,
  });

  return { status: advance.status, rebuttalScore: rebuttalFeedback.score, nextQuestion: advance.question };
}

export async function completeSession({ userId, sessionId }) {
  const { data: session, error: sErr } = await supabaseAdmin
    .from('interview_sessions')
    .select('*')
    .eq('id', sessionId)
    .eq('user_id', userId)
    .single();
  if (sErr || !session) {
    const err = new Error('Session not found');
    err.status = 404;
    err.publicMessage = err.message;
    throw err;
  }

  const { data: questions } = await supabaseAdmin
    .from('questions')
    .select(
      'id, skill_tag, question_type, correct_option_index, answers(id, self_confidence, selected_option_index, panel_feedback(score, flagged_issues))'
    )
    .eq('session_id', sessionId);

  // `answers.question_id` is a unique FK, so PostgREST embeds it as a single
  // object (not an array) — same for any other 1:1 embed in this codebase.
  const answered = (questions || []).filter((q) => q.answers && (q.question_type === 'mcq' || q.answers.panel_feedback?.length));

  function scoreFor(q) {
    if (q.question_type === 'mcq') return q.answers.selected_option_index === q.correct_option_index ? 100 : 0;
    return mean(q.answers.panel_feedback.map((f) => f.score));
  }

  const perQuestionScores = answered.map(scoreFor);
  const overallScore = Math.round(mean(perQuestionScores));

  const selfConfidences = answered.map((q) => q.answers.self_confidence * 20); // normalize 1-5 -> 0-100
  const calibrationGap = Math.round(mean(selfConfidences) - overallScore);

  const mcqAnswered = answered.filter((q) => q.question_type === 'mcq');
  const codingAnswered = answered.filter((q) => q.question_type === 'coding');
  const typeBreakdown = {
    mcq: {
      correct: mcqAnswered.filter((q) => q.answers.selected_option_index === q.correct_option_index).length,
      total: mcqAnswered.length,
    },
    coding: {
      avgScore: codingAnswered.length ? Math.round(mean(codingAnswered.map(scoreFor))) : null,
      total: codingAnswered.length,
    },
  };

  const issueTally = {};
  for (const q of codingAnswered) {
    for (const fb of q.answers.panel_feedback) {
      for (const issue of fb.flagged_issues || []) {
        issueTally[issue] = (issueTally[issue] || 0) + 1;
      }
    }
  }
  const topWeaknesses = Object.entries(issueTally)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([issue, count]) => ({ issue, count }));

  const knowledgeGaps = [
    ...new Set(answered.filter((q) => scoreFor(q) < WEAK_SKILL_THRESHOLD).map((q) => q.skill_tag)),
  ];

  const { data: summary, error: sumErr } = await supabaseAdmin
    .from('session_summaries')
    .insert({
      session_id: sessionId,
      overall_score: overallScore,
      calibration_gap: calibrationGap,
      top_weaknesses: topWeaknesses,
      knowledge_gaps: knowledgeGaps,
      type_breakdown: typeBreakdown,
    })
    .select('*')
    .single();
  if (sumErr) throw sumErr;

  await supabaseAdmin
    .from('interview_sessions')
    .update({ status: 'completed', overall_score: overallScore, calibration_gap: calibrationGap, completed_at: new Date().toISOString() })
    .eq('id', sessionId);

  const resourceRows = [];
  for (const gap of knowledgeGaps) {
    const videos = await findLearningResources(gap);
    for (const video of videos) {
      resourceRows.push({
        user_id: userId,
        session_id: sessionId,
        skill_tag: gap,
        source: 'youtube',
        title: video.title,
        url: video.url,
        thumbnail_url: video.thumbnailUrl,
      });
    }
  }

  let resources = [];
  if (resourceRows.length) {
    const { data } = await supabaseAdmin.from('learning_resources').insert(resourceRows).select('*');
    resources = data || [];
  }

  return { summary, resources };
}
