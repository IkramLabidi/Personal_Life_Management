import { Router } from 'express';
import { protect } from '../middleware/auth.js';
import { createCrud } from '../utils/crud.js';
import Task from '../models/Task.js';
import WeeklyGoal from '../models/WeeklyGoal.js';
import { getReview, saveReview } from '../controllers/plannerController.js';
import { getCycle, updateCycle, addPeriod, deletePeriod } from '../controllers/cycleController.js';

const router = Router();
router.use(protect);

const tasks = createCrud(Task, {
  filters: ['completed', 'lifeRole', 'quadrant', 'priority', 'status'],
  dateField: 'date',
  sort: { date: 1, time: 1 },
});
router.route('/tasks').get(tasks.list).post(tasks.create);
router.route('/tasks/:id').get(tasks.getOne).put(tasks.update).delete(tasks.remove);

const goals = createCrud(WeeklyGoal, { filters: ['week'] });
router.route('/goals').get(goals.list).post(goals.create);
router.route('/goals/:id').get(goals.getOne).put(goals.update).delete(goals.remove);

router.get('/review', getReview);
router.put('/review', saveReview);

router.get('/cycle', getCycle);
router.put('/cycle', updateCycle);
router.post('/cycle/periods', addPeriod);
router.delete('/cycle/periods/:periodId', deletePeriod);

export default router;
