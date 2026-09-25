import { Router } from 'express';
import { rewardController } from '../controllers/reward.controller';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();
router.use(authenticate, authorize('STUDENT'));

router.get('/', rewardController.getRewards);
router.post('/:id/redeem', rewardController.redeemReward);

export default router;
