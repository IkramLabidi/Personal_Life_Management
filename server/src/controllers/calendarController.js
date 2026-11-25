import CalendarEvent from '../models/CalendarEvent.js';
import AcademicTask from '../models/AcademicTask.js';

const label = (type) =>
  type === 'exam' ? 'Exam' : type === 'project' ? 'Project deadline' : 'Assignment due';

/**
 * Merged, de-duplicated agenda:
 *  - personal calendar events  -> id "evt:<id>"
 *  - academic deadlines        -> id "acad:<id>" (read-time merge, never copied rows)
 */
export const agenda = async (req, res) => {
  const [events, academicTasks] = await Promise.all([
    CalendarEvent.find({ user: req.user._id }).sort({ date: 1 }),
    AcademicTask.find({ user: req.user._id, status: 'pending' })
      .populate('subject', 'name color')
      .sort({ deadline: 1 }),
  ]);

  const merged = [
    ...events.map((e) => ({
      id: `evt:${e._id}`,
      recordId: e._id,
      source: 'event',
      title: e.title,
      description: e.description,
      date: e.date,
      startTime: e.startTime,
      endTime: e.endTime,
      category: e.category,
      reminder: e.reminder,
    })),
    ...academicTasks.map((t) => ({
      id: `acad:${t._id}`,
      recordId: t._id,
      source: 'academic',
      title: `${label(t.type)}: ${t.title}`,
      description: t.description,
      date: t.deadline,
      startTime: '',
      endTime: '',
      category: 'Academic',
      reminder: true,
      subject: t.subject,
      priority: t.priority,
    })),
  ].sort((a, b) => new Date(a.date) - new Date(b.date));

  res.json(merged);
};
