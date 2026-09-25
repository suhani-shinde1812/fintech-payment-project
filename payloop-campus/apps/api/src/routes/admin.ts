import { Router } from 'express';
import { adminController } from '../controllers/admin.controller';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();
router.use(authenticate, authorize('ADMIN'));

router.get('/dashboard', adminController.getDashboard);
router.get('/users', adminController.getUsers);
router.patch('/users/:id/status', adminController.suspendUser);
router.get('/merchants', adminController.getMerchants);
router.patch('/merchants/:id/status', adminController.approveMerchant);
router.get('/transactions', adminController.getTransactions);
router.get('/offers', adminController.getOffers);
router.patch('/offers/:id', adminController.updateOffer);
router.get('/categories', adminController.getCategories);

export default router;
