import { Router } from 'express';
import { protect } from '../middleware/auth.js';
import { createCrud } from '../utils/crud.js';
import JournalEntry from '../models/JournalEntry.js';

const router = Router();
router.use(protect);

const journal = createCrud(JournalEntry, { filters: ['mood'], dateField: 'date' });
router.route('/').get(journal.list).post(journal.create);
router.route('/:id').get(journal.getOne).put(journal.update).delete(journal.remove);

export default router;
