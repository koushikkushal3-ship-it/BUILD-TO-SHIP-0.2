import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware.js';
import { validateBody } from '../middleware/validate.middleware.js';
import { sessionRateLimit } from '../middleware/rateLimit.middleware.js';
import {
  listSessions,
  getSession,
  createSession,
  postAnswer,
  postRebuttal,
  postComplete,
  submitAnswerSchema,
  rebuttalSchema,
} from '../controllers/session.controller.js';

const router = Router();

router.use(requireAuth);
router.use(sessionRateLimit);

router.get('/', listSessions);
router.get('/:sessionId', getSession);
router.post('/', createSession);
router.post('/:sessionId/questions/:questionId/answers', validateBody(submitAnswerSchema), postAnswer);
router.post('/:sessionId/cross-exams/:crossExamId/rebuttal', validateBody(rebuttalSchema), postRebuttal);
router.post('/:sessionId/complete', postComplete);

export default router;
