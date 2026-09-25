import { Router } from 'express';
import { offerController } from '../controllers/offer.controller';
import { authenticate } from '../middleware/auth';
import { offerController as merchantOfferController } from '../controllers/offer.controller';

const router = Router();

router.get('/', offerController.getOffers);
router.get('/merchants', merchantOfferController.getAllMerchants);
router.get('/merchants/:id', merchantOfferController.getMerchantById);
router.get('/:id', authenticate, offerController.getOfferById);

export default router;
