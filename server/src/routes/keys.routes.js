import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware.js';
import { validateBody } from '../middleware/validate.middleware.js';
import { keyRateLimit } from '../middleware/rateLimit.middleware.js';
import { listKeys, addKey, deleteKey, addKeySchema } from '../controllers/keys.controller.js';

const router = Router();

router.use(requireAuth);
router.use(keyRateLimit);

router.get('/', listKeys);
router.post('/', validateBody(addKeySchema), addKey);
router.delete('/:keyId', deleteKey);

export default router;
