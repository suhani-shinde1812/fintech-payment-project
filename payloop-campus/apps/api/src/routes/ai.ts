import { Router } from 'express';
import { aiController } from '../controllers/ai.controller';
import { authenticate } from '../middleware/auth';

const router = Router();
router.use(authenticate);

router.post('/insights', aiController.getInsights);
router.post('/chat', aiController.chat);
router.get('/recommendations', aiController.getRecommendations);

export default router;
