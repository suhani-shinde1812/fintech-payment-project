import { Router } from 'express';
import { billController } from '../controllers/bill.controller';
import { authenticate } from '../middleware/auth';

const router = Router();
router.use(authenticate);

router.post('/', billController.createBill);
router.get('/', billController.getBills);
router.get('/:id', billController.getBill);
router.post('/:id/pay', billController.markParticipantPaid);

export default router;
