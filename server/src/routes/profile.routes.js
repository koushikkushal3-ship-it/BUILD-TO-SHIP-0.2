import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware.js';
import { validateBody } from '../middleware/validate.middleware.js';
import { uploadResume } from '../middleware/upload.middleware.js';
import { sessionRateLimit } from '../middleware/rateLimit.middleware.js';
import {
  getProfile,
  updateProfile,
  updateProfileSchema,
  uploadResumeFile,
  getAtsScore,
  atsScoreSchema,
} from '../controllers/profile.controller.js';

const router = Router();

router.use(requireAuth);
router.get('/', getProfile);
router.put('/', validateBody(updateProfileSchema), updateProfile);

router.post(
  '/resume',
  (req, res, next) => {
    uploadResume(req, res, (err) => {
      if (err) return res.status(400).json({ error: err.message });
      next();
    });
  },
  uploadResumeFile
);

router.post('/ats-score', sessionRateLimit, validateBody(atsScoreSchema), getAtsScore);

export default router;
