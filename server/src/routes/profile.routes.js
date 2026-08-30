import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware.js';
import { validateBody } from '../middleware/validate.middleware.js';
import { uploadResume } from '../middleware/upload.middleware.js';
import { getProfile, updateProfile, updateProfileSchema, uploadResumeFile } from '../controllers/profile.controller.js';

const router = Router();

router.use(requireAuth);
router.get('/', getProfile);
router.put('/', validateBody(updateProfileSchema), updateProfile);

router.post('/resume', (req, res, next) => {
  uploadResume(req, res, (err) => {
    if (err) return res.status(400).json({ error: err.message });
    next();
  });
}, uploadResumeFile);

export default router;
