import { Router } from 'express';
import { protect } from '../middleware/auth.js';
import { createCrud } from '../utils/crud.js';
import Meal from '../models/Meal.js';
import WaterEntry from '../models/WaterEntry.js';
import Measurement from '../models/Measurement.js';
import Exercise from '../models/Exercise.js';
import {
  getWaterSettings,
  updateWaterSettings,
  waterSummary,
} from '../controllers/healthController.js';

const router = Router();
router.use(protect);

const meals = createCrud(Meal, { filters: ['type', 'status', 'dayOfWeek'], dateField: 'date' });
router.route('/meals').get(meals.list).post(meals.create);
router.route('/meals/:id').get(meals.getOne).put(meals.update).delete(meals.remove);

const water = createCrud(WaterEntry, { dateField: 'date' });
router.get('/water/settings', getWaterSettings);
router.put('/water/settings', updateWaterSettings);
router.get('/water/summary', waterSummary);
router.route('/water').get(water.list).post(water.create);
router.route('/water/:id').delete(water.remove);

const measurements = createCrud(Measurement, { dateField: 'date', sort: { date: 1 } });
router.route('/measurements').get(measurements.list).post(measurements.create);
router.route('/measurements/:id').get(measurements.getOne).put(measurements.update).delete(measurements.remove);

const exercises = createCrud(Exercise, { filters: ['completed'], dateField: 'date', sort: { date: 1 } });
router.route('/exercises').get(exercises.list).post(exercises.create);
router.route('/exercises/:id').get(exercises.getOne).put(exercises.update).delete(exercises.remove);

export default router;
