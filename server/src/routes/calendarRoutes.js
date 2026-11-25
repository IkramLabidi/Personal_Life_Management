import { Router } from 'express';
import { protect } from '../middleware/auth.js';
import { createCrud } from '../utils/crud.js';
import CalendarEvent from '../models/CalendarEvent.js';
import { agenda } from '../controllers/calendarController.js';

const router = Router();
router.use(protect);

const events = createCrud(CalendarEvent, { filters: ['category'], dateField: 'date', sort: { date: 1 } });
router.get('/agenda', agenda);
router.route('/events').get(events.list).post(events.create);
router.route('/events/:id').get(events.getOne).put(events.update).delete(events.remove);

export default router;
