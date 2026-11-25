import { Router } from 'express';
import { protect } from '../middleware/auth.js';
import { createCrud } from '../utils/crud.js';
import Goal from '../models/Goal.js';

const router = Router();
router.use(protect);

const goals = createCrud(Goal, { filters: ['category', 'type', 'status'], dateField: 'deadline' });
router.route('/').get(goals.list).post(goals.create);
router.route('/:id').get(goals.getOne).put(goals.update).delete(goals.remove);

export default router;
