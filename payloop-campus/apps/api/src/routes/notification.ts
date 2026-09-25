import { Router, Request, Response, NextFunction } from 'express';
import { authenticate } from '../middleware/auth';
import { notificationService } from '../services/notificationService';

const router = Router();
router.use(authenticate);

router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string || '1');
    const limit = parseInt(req.query.limit as string || '20');
    const data = await notificationService.getAll(req.user!.userId, page, limit);
    res.json({ success: true, data });
  } catch (e) { next(e); }
});

router.get('/unread', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const notifications = await notificationService.getUnread(req.user!.userId);
    res.json({ success: true, data: { notifications } });
  } catch (e) { next(e); }
});

router.patch('/:id/read', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await notificationService.markRead(req.params.id, req.user!.userId);
    res.json({ success: true });
  } catch (e) { next(e); }
});

router.post('/read-all', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await notificationService.markAllRead(req.user!.userId);
    res.json({ success: true });
  } catch (e) { next(e); }
});

export default router;
