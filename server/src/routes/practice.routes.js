import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware.js';
import { validateBody } from '../middleware/validate.middleware.js';
import { sessionRateLimit } from '../middleware/rateLimit.middleware.js';
import {
  getWeakSkills,
  getSkillExplanation,
  getSkillRadar,
  getSkillHistoryController,
  postDrill,
  postDrillResult,
  getDailyChallenge,
  postDailyChallengeAnswer,
  drillRequestSchema,
  drillResultSchema,
  dailyChallengeAnswerSchema,
} from '../controllers/practice.controller.js';

const router = Router();

router.use(requireAuth);
router.use(sessionRateLimit);

router.get('/weak-skills', getWeakSkills);
router.get('/weak-skills/explain', getSkillExplanation);
router.get('/skill-radar', getSkillRadar);
router.get('/skill-radar/history', getSkillHistoryController);
router.post('/drill', validateBody(drillRequestSchema), postDrill);
router.post('/drill/result', validateBody(drillResultSchema), postDrillResult);
router.get('/daily-challenge', getDailyChallenge);
router.post('/daily-challenge/answer', validateBody(dailyChallengeAnswerSchema), postDailyChallengeAnswer);

export default router;
