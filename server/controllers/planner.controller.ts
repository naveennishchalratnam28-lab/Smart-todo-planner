import type { Response } from 'express';
import { dbRepo } from '../db.ts';
import type { AuthenticatedRequest } from '../middleware/auth.middleware.ts';
import { generateSchedule, prioritizeTasks } from '../services/planner.service.ts';

export async function getSchedule(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const user = await dbRepo.findUserById(req.userId!);
    if (!user) {
      res.status(404).json({ success: false, message: 'User not found.' });
      return;
    }

    const tasks = await dbRepo.findTasksByUserId(req.userId!);
    const schedule = generateSchedule(tasks, user.settings);

    res.json({
      success: true,
      schedule,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Failed to generate schedule.' });
  }
}

export async function logProgress(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { taskId, hoursLogged, markDone } = req.body;

    if (!taskId) {
      res.status(400).json({ success: false, message: 'taskId is required.' });
      return;
    }

    const task = await dbRepo.findTaskById(taskId, req.userId!);
    if (!task) {
      res.status(404).json({ success: false, message: 'Task not found.' });
      return;
    }

    let updatedHours = (task.hoursCompleted || 0) + (Number(hoursLogged) || 0);
    let updatedStatus = task.status;

    if (markDone || updatedHours >= task.estimatedEffort) {
      updatedStatus = 'Done';
      if (updatedHours < task.estimatedEffort) {
        updatedHours = task.estimatedEffort;
      }
    } else if (updatedHours > 0 && task.status === 'Pending') {
      updatedStatus = 'In Progress';
    }

    const updated = await dbRepo.updateTask(taskId, req.userId!, {
      hoursCompleted: updatedHours,
      status: updatedStatus,
    });

    res.json({
      success: true,
      message: 'Progress logged successfully.',
      task: updated,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Failed to log progress.' });
  }
}

export async function seedDemoData(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const userId = req.userId!;
    
    // Clear existing tasks to give a clean experience
    await dbRepo.clearUserTasks(userId);

    const now = new Date();
    const dayMs = 86400000;

    const sampleTasks = [
      {
        userId,
        title: 'Review Quarterly Security Audit',
        description: 'Verify IAM role permissions and audit VPC security group rules.',
        priority: 'High' as const,
        deadline: new Date(now.getTime() + dayMs * 1).toISOString(), // Tomorrow
        estimatedEffort: 3.5,
        category: 'Security',
        status: 'In Progress' as const,
        hoursCompleted: 1,
      },
      {
        userId,
        title: 'Implement Core Planner Algorithm',
        description: 'Implement workload leveling, deadline constraints, and 20% buffer reservation.',
        priority: 'High' as const,
        deadline: new Date(now.getTime() + dayMs * 2).toISOString(),
        estimatedEffort: 6.0,
        category: 'Engineering',
        status: 'In Progress' as const,
        hoursCompleted: 2.5,
      },
      {
        userId,
        title: 'Design Client Presentation Deck',
        description: 'Prepare pitch deck slides with product roadmap and ROI projections.',
        priority: 'Medium' as const,
        deadline: new Date(now.getTime() + dayMs * 4).toISOString(),
        estimatedEffort: 4.0,
        category: 'Marketing',
        status: 'Pending' as const,
        hoursCompleted: 0,
      },
      {
        userId,
        title: 'Prepare Tax & Financial Invoices',
        description: 'Reconcile Q3 receipts and submit expense filings to accounting.',
        priority: 'High' as const,
        deadline: new Date(now.getTime() - dayMs * 0.5).toISOString(), // Overdue by a bit
        estimatedEffort: 2.0,
        category: 'Finance',
        status: 'Pending' as const,
        hoursCompleted: 0,
      },
      {
        userId,
        title: 'Write Unit Tests for Task Prioritizer',
        description: 'Cover priority weights, deadline urgency decays, and effort pressure multipliers.',
        priority: 'Medium' as const,
        deadline: new Date(now.getTime() + dayMs * 3).toISOString(),
        estimatedEffort: 3.0,
        category: 'Engineering',
        status: 'Pending' as const,
        hoursCompleted: 0,
      },
      {
        userId,
        title: 'Annual Health Checkup & Lab Tests',
        description: 'Routine blood panel and physical checkup at clinic.',
        priority: 'Low' as const,
        deadline: new Date(now.getTime() + dayMs * 7).toISOString(),
        estimatedEffort: 1.5,
        category: 'Health',
        status: 'Pending' as const,
        hoursCompleted: 0,
      },
      {
        userId,
        title: 'Draft Product Architecture Whitepaper',
        description: 'Large multi-day effort describing system scalability, data isolation, and JWT auth flow.',
        priority: 'High' as const,
        deadline: new Date(now.getTime() + dayMs * 5).toISOString(),
        estimatedEffort: 10.0, // High effort task that gets chunked across 5 days!
        category: 'Engineering',
        status: 'Pending' as const,
        hoursCompleted: 0,
      },
      {
        userId,
        title: 'Renew Home Office Equipment Insurance',
        description: 'Review policy coverage and update electronics serial list.',
        priority: 'Low' as const,
        deadline: new Date(now.getTime() + dayMs * 9).toISOString(),
        estimatedEffort: 1.0,
        category: 'Personal',
        status: 'Pending' as const,
        hoursCompleted: 0,
      },
      {
        userId,
        title: 'Setup CI/CD Automated Test Pipeline',
        description: 'Configure GitHub Actions workflow for linting and build validation.',
        priority: 'Medium' as const,
        deadline: new Date(now.getTime() + dayMs * 6).toISOString(),
        estimatedEffort: 2.5,
        category: 'DevOps',
        status: 'Done' as const,
        hoursCompleted: 2.5,
      },
    ];

    for (const t of sampleTasks) {
      await dbRepo.createTask(t);
    }

    const allTasks = await dbRepo.findTasksByUserId(userId);
    const enriched = prioritizeTasks(allTasks);

    res.json({
      success: true,
      message: 'Demo dataset with 9 realistic tasks successfully seeded!',
      tasks: enriched,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Failed to seed sample data.' });
  }
}
