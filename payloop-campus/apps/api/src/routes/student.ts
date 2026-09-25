import { Router } from 'express';
import { studentController } from '../controllers/student.controller';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();
router.use(authenticate, authorize('STUDENT'));

router.get('/dashboard', studentController.getDashboard);
router.get('/transactions', studentController.getTransactions);
router.get('/expenses', studentController.getExpenses);
router.post('/expenses', studentController.addExpense);
router.get('/savings', studentController.getSavingsGoals);
router.post('/savings', studentController.createSavingsGoal);
router.patch('/savings/:id', studentController.updateSavingsGoal);

export default router;
