import { Router } from 'express';
import { protect } from '../middleware/auth.js';
import { createCrud } from '../utils/crud.js';
import Subject from '../models/Subject.js';
import AcademicTask from '../models/AcademicTask.js';
import StudySession from '../models/StudySession.js';
import { studyStats } from '../controllers/studyController.js';

const router = Router();
router.use(protect);

const subjects = createCrud(Subject, { sort: { name: 1 } });
router.route('/subjects').get(subjects.list).post(subjects.create);
router.route('/subjects/:id').get(subjects.getOne).put(subjects.update).delete(subjects.remove);

const tasks = createCrud(AcademicTask, {
  filters: ['status', 'type', 'priority'],
  populate: { path: 'subject', select: 'name color' },
  dateField: 'deadline',
  sort: { deadline: 1 },
});
router.route('/tasks').get(tasks.list).post(tasks.create);
router.route('/tasks/:id').get(tasks.getOne).put(tasks.update).delete(tasks.remove);

const sessions = createCrud(StudySession, {
  filters: ['subject'],
  populate: { path: 'subject', select: 'name color' },
  dateField: 'date',
  sort: { date: -1 },
});
router.route('/sessions').get(sessions.list).post(sessions.create);
router.route('/sessions/:id').get(sessions.getOne).put(sessions.update).delete(sessions.remove);

router.get('/stats', studyStats);

export default router;
