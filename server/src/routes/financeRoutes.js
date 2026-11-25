import { Router } from 'express';
import { protect } from '../middleware/auth.js';
import { createCrud } from '../utils/crud.js';
import Transaction from '../models/Transaction.js';
import SavingsTx from '../models/SavingsTx.js';
import SavingsGoal from '../models/SavingsGoal.js';
import {
  getFinanceProfile,
  updateFinanceProfile,
  summary,
  listSavingsGoals,
} from '../controllers/financeController.js';

const router = Router();
router.use(protect);

router.get('/profile', getFinanceProfile);
router.put('/profile', updateFinanceProfile);
router.get('/summary', summary);

const tx = createCrud(Transaction, { filters: ['type', 'category'], dateField: 'date' });
router.route('/transactions').get(tx.list).post(tx.create);
router.route('/transactions/:id').get(tx.getOne).put(tx.update).delete(tx.remove);

const savings = createCrud(SavingsTx, { filters: ['type'], dateField: 'date' });
router.route('/savings').get(savings.list).post(savings.create);
router.route('/savings/:id').get(savings.getOne).put(savings.update).delete(savings.remove);

const goals = createCrud(SavingsGoal, { dateField: 'deadline' });
router.get('/savings-goals', listSavingsGoals);
router.post('/savings-goals', goals.create);
router.route('/savings-goals/:id').put(goals.update).delete(goals.remove);

export default router;
