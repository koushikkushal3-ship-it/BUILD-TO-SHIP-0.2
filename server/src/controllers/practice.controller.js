import { z } from 'zod';
import {
  getWeakSkillsOverview,
  explainWeakSkill,
  getSkillRadarData,
  getSkillHistory,
  generatePracticeDrill,
  recordPracticeDrillResult,
  getOrCreateDailyChallenge,
  answerDailyChallenge,
} from '../services/practice.service.js';

export const drillRequestSchema = z.object({
  skillTag: z.string().min(1).max(200),
});

export const drillResultSchema = z.object({
  skillTag: z.string().min(1).max(200),
  correct: z.boolean(),
});

export const dailyChallengeAnswerSchema = z.object({
  selectedOptionIndex: z.number().int().min(0).max(3),
});

function requireSkillTagQuery(req, res) {
  const skillTag = typeof req.query.skillTag === 'string' ? req.query.skillTag.trim() : '';
  if (!skillTag) {
    res.status(400).json({ error: 'skillTag query parameter is required' });
    return null;
  }
  return skillTag;
}

export async function getWeakSkills(req, res, next) {
  try {
    const overview = await getWeakSkillsOverview(req.user.id);
    res.json({ weakSkills: overview });
  } catch (err) {
    next(err);
  }
}

export async function getSkillExplanation(req, res, next) {
  try {
    const skillTag = requireSkillTagQuery(req, res);
    if (!skillTag) return;
    const explanation = await explainWeakSkill({ userId: req.user.id, skillTag });
    res.json(explanation);
  } catch (err) {
    next(err);
  }
}

export async function getSkillRadar(req, res, next) {
  try {
    const radar = await getSkillRadarData(req.user.id);
    res.json({ radar });
  } catch (err) {
    next(err);
  }
}

export async function getSkillHistoryController(req, res, next) {
  try {
    const skillTag = requireSkillTagQuery(req, res);
    if (!skillTag) return;
    const history = await getSkillHistory({ userId: req.user.id, skillTag });
    res.json({ history });
  } catch (err) {
    next(err);
  }
}

export async function postDrill(req, res, next) {
  try {
    const question = await generatePracticeDrill({ userId: req.user.id, skillTag: req.body.skillTag });
    res.status(201).json({ question });
  } catch (err) {
    next(err);
  }
}

export async function postDrillResult(req, res, next) {
  try {
    const result = await recordPracticeDrillResult({
      userId: req.user.id,
      skillTag: req.body.skillTag,
      correct: req.body.correct,
    });
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
}

export async function getDailyChallenge(req, res, next) {
  try {
    const result = await getOrCreateDailyChallenge(req.user.id);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function postDailyChallengeAnswer(req, res, next) {
  try {
    const result = await answerDailyChallenge({
      userId: req.user.id,
      selectedOptionIndex: req.body.selectedOptionIndex,
    });
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
}
