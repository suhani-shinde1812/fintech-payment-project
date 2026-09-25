import { Router } from 'express';
import { merchantController } from '../controllers/merchant.controller';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

// Public routes
router.get('/', merchantController.getAllMerchants);

// Protected merchant-only routes
router.get('/dashboard', authenticate, authorize('MERCHANT'), merchantController.getDashboard);
router.get('/qr', authenticate, authorize('MERCHANT'), merchantController.getQrCode);
router.get('/analytics', authenticate, authorize('MERCHANT'), merchantController.getAnalytics);
router.get('/offers', authenticate, authorize('MERCHANT'), merchantController.getOffers);
router.post('/offers', authenticate, authorize('MERCHANT'), merchantController.createOffer);
router.patch('/offers/:id', authenticate, authorize('MERCHANT'), merchantController.updateOffer);
router.delete('/offers/:id', authenticate, authorize('MERCHANT'), merchantController.deleteOffer);

// Public merchant lookup (for payment)
router.get('/:id', merchantController.getMerchantById);

export default router;
