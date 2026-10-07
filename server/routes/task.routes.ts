import express from 'express';
import {
  getTasks,
  createTask,
  updateTask,
  deleteTask,
  bulkUpdateTasks,
  bulkDeleteTasks,
  parseTask,
} from '../controllers/task.controller.ts';
import { authMiddleware } from '../middleware/auth.middleware.ts';

const router = express.Router();

// All task routes require authentication
router.use(authMiddleware);

router.get('/', getTasks);
router.post('/', createTask);
router.post('/parse', parseTask);
router.put('/bulk', bulkUpdateTasks);
router.delete('/bulk', bulkDeleteTasks);
router.put('/:id', updateTask);
router.delete('/:id', deleteTask);

export default router;
