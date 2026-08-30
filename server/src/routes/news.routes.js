import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware.js';
import { validateBody } from '../middleware/validate.middleware.js';
import {
  getIndustry,
  getCommunity,
  postSaveArticle,
  deleteSaveArticle,
  getSaved,
  saveArticleSchema,
  unsaveArticleSchema,
} from '../controllers/news.controller.js';

const router = Router();

router.use(requireAuth);

router.get('/industry', getIndustry);
router.get('/community', getCommunity);
router.get('/saved', getSaved);
router.post('/saved', validateBody(saveArticleSchema), postSaveArticle);
router.delete('/saved', validateBody(unsaveArticleSchema), deleteSaveArticle);

export default router;
