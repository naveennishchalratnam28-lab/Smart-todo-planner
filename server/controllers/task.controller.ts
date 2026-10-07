import type { Response } from 'express';
import { dbRepo } from '../db.ts';
import type { AuthenticatedRequest } from '../middleware/auth.middleware.ts';
import { prioritizeTasks } from '../services/planner.service.ts';
import { parseNaturalLanguageTask } from '../services/parser.service.ts';

export async function getTasks(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { status, priority, category, search, sortBy } = req.query as {
      status?: string;
      priority?: string;
      category?: string;
      search?: string;
      sortBy?: string;
    };

    const rawTasks = await dbRepo.findTasksByUserId(req.userId!, {
      status,
      priority,
      category,
      search,
    });

    // Score and prioritize all retrieved tasks
    let enriched = prioritizeTasks(rawTasks);

    // Apply custom client sorting if requested
    if (sortBy === 'deadline') {
      enriched.sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime());
    } else if (sortBy === 'effort') {
      enriched.sort((a, b) => b.estimatedEffort - a.estimatedEffort);
    } else if (sortBy === 'title') {
      enriched.sort((a, b) => a.title.localeCompare(b.title));
    }
    // Default is already sorted by priorityScore descending

    res.json({
      success: true,
      tasks: enriched,
      count: enriched.length,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Failed to fetch tasks.' });
  }
}

export async function createTask(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const {
      title,
      description,
      priority,
      deadline,
      estimatedEffort,
      category,
      status,
      hoursCompleted,
    } = req.body;

    if (!title || !title.trim()) {
      res.status(400).json({ success: false, message: 'Task title is required.' });
      return;
    }

    if (!deadline) {
      res.status(400).json({ success: false, message: 'Valid deadline date/time is required.' });
      return;
    }

    const newTask = await dbRepo.createTask({
      userId: req.userId!,
      title: title.trim(),
      description: description ? description.trim() : '',
      priority: priority || 'Medium',
      deadline: new Date(deadline).toISOString(),
      estimatedEffort: Number(estimatedEffort) || 1,
      category: category ? category.trim() : 'General',
      status: status || 'Pending',
      hoursCompleted: Number(hoursCompleted) || 0,
    });

    const [enriched] = prioritizeTasks([newTask]);

    res.status(201).json({
      success: true,
      message: 'Task created successfully.',
      task: enriched,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Failed to create task.' });
  }
}

export async function updateTask(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Check if task exists and belongs to user
    const existing = await dbRepo.findTaskById(id, req.userId!);
    if (!existing) {
      res.status(404).json({ success: false, message: 'Task not found or access denied.' });
      return;
    }

    // Sanitize updates
    const sanitized: any = {};
    if (updates.title !== undefined) sanitized.title = updates.title.trim();
    if (updates.description !== undefined) sanitized.description = updates.description.trim();
    if (updates.priority !== undefined) sanitized.priority = updates.priority;
    if (updates.deadline !== undefined) sanitized.deadline = new Date(updates.deadline).toISOString();
    if (updates.estimatedEffort !== undefined) sanitized.estimatedEffort = Math.max(0.1, Number(updates.estimatedEffort));
    if (updates.category !== undefined) sanitized.category = updates.category.trim();
    if (updates.status !== undefined) {
      sanitized.status = updates.status;
      // If marking Done and hoursCompleted is less than estimatedEffort, optionally mark as completed
      if (updates.status === 'Done' && (existing.hoursCompleted === 0 || existing.hoursCompleted < existing.estimatedEffort)) {
        sanitized.hoursCompleted = existing.estimatedEffort;
      }
    }
    if (updates.hoursCompleted !== undefined) {
      sanitized.hoursCompleted = Math.max(0, Number(updates.hoursCompleted));
      if (sanitized.hoursCompleted >= (updates.estimatedEffort || existing.estimatedEffort)) {
        sanitized.status = 'Done';
      }
    }

    const updated = await dbRepo.updateTask(id, req.userId!, sanitized);
    if (!updated) {
      res.status(404).json({ success: false, message: 'Failed to update task.' });
      return;
    }

    const [enriched] = prioritizeTasks([updated]);

    res.json({
      success: true,
      message: 'Task updated successfully.',
      task: enriched,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Failed to update task.' });
  }
}

export async function deleteTask(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const deleted = await dbRepo.deleteTask(id, req.userId!);

    if (!deleted) {
      res.status(404).json({ success: false, message: 'Task not found or already deleted.' });
      return;
    }

    res.json({
      success: true,
      message: 'Task deleted successfully.',
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Failed to delete task.' });
  }
}

export async function bulkUpdateTasks(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { taskIds, updates } = req.body;
    if (!Array.isArray(taskIds) || taskIds.length === 0) {
      res.status(400).json({ success: false, message: 'taskIds array is required.' });
      return;
    }

    const modified = await dbRepo.bulkUpdateTasks(req.userId!, taskIds, updates);
    res.json({
      success: true,
      message: `${modified} tasks updated successfully.`,
      modifiedCount: modified,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Bulk update failed.' });
  }
}

export async function bulkDeleteTasks(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { taskIds } = req.body;
    if (!Array.isArray(taskIds) || taskIds.length === 0) {
      res.status(400).json({ success: false, message: 'taskIds array is required.' });
      return;
    }

    const deleted = await dbRepo.bulkDeleteTasks(req.userId!, taskIds);
    res.json({
      success: true,
      message: `${deleted} tasks deleted successfully.`,
      deletedCount: deleted,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Bulk delete failed.' });
  }
}

export async function parseTask(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { text } = req.body;
    if (!text || typeof text !== 'string') {
      res.status(400).json({ success: false, message: 'Text string is required for natural language parsing.' });
      return;
    }

    const parsed = parseNaturalLanguageTask(text);
    res.json({
      success: true,
      parsed,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Parsing failed.' });
  }
}
