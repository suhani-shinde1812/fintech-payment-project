import { Router } from 'express';
import { paymentController } from '../controllers/payment.controller';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();
router.use(authenticate);

router.post('/create', authorize('STUDENT'), paymentController.createPayment);
router.get('/:id', authorize('STUDENT'), paymentController.getPayment);

export default router;
