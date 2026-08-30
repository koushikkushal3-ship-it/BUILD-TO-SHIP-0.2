import { z } from 'zod';
import { supabaseAdmin } from '../lib/supabaseClient.js';
import { startSession, submitAnswer, resolveCrossExam, completeSession } from '../services/agent.service.js';

export const submitAnswerSchema = z.object({
  answerText: z.string().min(1).max(8000),
  selfConfidence: z.number().int().min(1).max(5),
});

export const rebuttalSchema = z.object({
  userRebuttal: z.string().min(1).max(8000),
});

export async function listSessions(req, res, next) {
  try {
    const { data, error } = await supabaseAdmin
      .from('interview_sessions')
      .select('*, session_summaries(*)')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false });
    if (error) throw error;
    res.json({ sessions: data });
  } catch (err) {
    next(err);
  }
}

export async function getSession(req, res, next) {
  try {
    const { data: session, error } = await supabaseAdmin
      .from('interview_sessions')
      .select('*, session_summaries(*)')
      .eq('id', req.params.sessionId)
      .eq('user_id', req.user.id)
      .single();
    if (error || !session) return res.status(404).json({ error: 'Session not found' });

    const { data: questions } = await supabaseAdmin
      .from('questions')
      .select('*, answers(*, panel_feedback(*), cross_exams(*))')
      .eq('session_id', session.id)
      .order('order_index', { ascending: true });

    const { data: resources } = await supabaseAdmin
      .from('learning_resources')
      .select('*')
      .eq('session_id', session.id);

    res.json({ session, questions, resources: resources || [] });
  } catch (err) {
    next(err);
  }
}

export async function createSession(req, res, next) {
  try {
    const result = await startSession(req.user.id);
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
}

export async function postAnswer(req, res, next) {
  try {
    const result = await submitAnswer({
      userId: req.user.id,
      sessionId: req.params.sessionId,
      questionId: req.params.questionId,
      answerText: req.body.answerText,
      selfConfidence: req.body.selfConfidence,
    });
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
}

export async function postRebuttal(req, res, next) {
  try {
    const result = await resolveCrossExam({
      userId: req.user.id,
      sessionId: req.params.sessionId,
      crossExamId: req.params.crossExamId,
      userRebuttal: req.body.userRebuttal,
    });
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
}

export async function postComplete(req, res, next) {
  try {
    const result = await completeSession({ userId: req.user.id, sessionId: req.params.sessionId });
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
}
