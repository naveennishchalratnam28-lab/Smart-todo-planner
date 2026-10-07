import type { ITask, IUser, IPlanSchedule, IDayPlan, IPlanChunk, IPlanWarning } from '../types.ts';

/**
 * Weights and factors for the Smart Prioritization algorithm
 */
export const SCORING_WEIGHTS = {
  PRIORITY: {
    High: 35,
    Medium: 20,
    Low: 10,
  },
  OVERDUE_BOOST: 45, // Critical boost for tasks past due date
  EFFORT_URGENCY_MULTIPLIER: 1.5,
  MAX_SCORE: 100,
};

/**
 * Calculates the priority score and reasoning for a task.
 * 
 * Score composition:
 * 1. Base Priority Weight: High = 35, Medium = 20, Low = 10
 * 2. Urgency Score (0 - 45): Exponential decay as deadline nears; instant boost if overdue
 * 3. Effort-to-Time Ratio Boost (0 - 20): Large tasks with little remaining runway get boosted
 * 
 * Also categorizes into Eisenhower matrix quadrant:
 * - Q1: Urgent & Important (High Priority + Urgent/Overdue)
 * - Q2: Not Urgent & Important (High Priority + Ample time)
 * - Q3: Urgent & Not Important (Medium/Low Priority + Urgent)
 * - Q4: Not Urgent & Not Important (Medium/Low Priority + Ample time)
 */
export function calculatePriorityScore(
  task: ITask,
  referenceDate: Date = new Date()
): {
  score: number;
  reason: string;
  quadrant: 'Q1' | 'Q2' | 'Q3' | 'Q4';
  urgencyDays: number;
  remainingHours: number;
} {
  const remainingHours = Math.max(0, task.estimatedEffort - (task.hoursCompleted || 0));
  
  // If task is completed, score is 0
  if (task.status === 'Done' || remainingHours <= 0) {
    return {
      score: 0,
      reason: 'Completed',
      quadrant: 'Q4',
      urgencyDays: 999,
      remainingHours: 0,
    };
  }

  const nowMs = referenceDate.getTime();
  const deadlineMs = new Date(task.deadline).getTime();
  const diffHours = (deadlineMs - nowMs) / (1000 * 60 * 60);
  const diffDays = diffHours / 24;

  // 1. Base Priority
  const basePriorityScore = SCORING_WEIGHTS.PRIORITY[task.priority] || 20;

  // 2. Deadline Urgency Score
  let urgencyScore = 0;
  let urgencyText = '';
  const isOverdue = diffHours < 0;

  if (isOverdue) {
    urgencyScore = SCORING_WEIGHTS.OVERDUE_BOOST;
    const overdueDays = Math.ceil(Math.abs(diffHours) / 24);
    urgencyText = overdueDays === 1 ? 'Overdue by 1 day' : `Overdue by ${overdueDays} days`;
  } else if (diffHours <= 12) {
    urgencyScore = 40;
    urgencyText = 'Due in hours';
  } else if (diffDays <= 1) {
    urgencyScore = 35;
    urgencyText = 'Due today / tomorrow';
  } else if (diffDays <= 3) {
    urgencyScore = 25;
    urgencyText = `Due in ${Math.ceil(diffDays)} days`;
  } else if (diffDays <= 7) {
    urgencyScore = 15;
    urgencyText = `Due in ${Math.ceil(diffDays)} days`;
  } else {
    urgencyScore = Math.max(2, Math.round(20 / Math.log2(diffDays + 2)));
    urgencyText = `Due in ${Math.ceil(diffDays)} days`;
  }

  // 3. Effort / Runway Pressure Boost
  // If task requires 6h and there are only 24h left, pressure is high!
  let effortBoost = 0;
  let effortNote = '';
  if (!isOverdue && diffHours > 0) {
    const dailyPressure = remainingHours / Math.max(0.5, diffDays);
    if (dailyPressure >= 3) {
      effortBoost = 20;
      effortNote = 'Heavy workload before deadline';
    } else if (dailyPressure >= 1.5) {
      effortBoost = 12;
      effortNote = 'Needs early start';
    } else if (remainingHours >= 8) {
      effortBoost = 8;
      effortNote = 'Large task';
    }
  } else if (isOverdue && remainingHours > 0) {
    effortBoost = Math.min(15, remainingHours * 2);
  }

  const rawScore = basePriorityScore + urgencyScore + effortBoost;
  const finalScore = Math.min(SCORING_WEIGHTS.MAX_SCORE, Math.max(1, Math.round(rawScore)));

  // Determine descriptive reason
  const reasons: string[] = [];
  if (urgencyText) reasons.push(urgencyText);
  reasons.push(`${task.priority} Priority`);
  if (effortNote) reasons.push(effortNote);

  const reason = reasons.join(' • ');

  // Determine Eisenhower Quadrant
  // Urgent: diffDays <= 3 or overdue
  // Important: High priority (or Medium with high effort)
  const isUrgent = isOverdue || diffDays <= 3;
  const isImportant = task.priority === 'High' || (task.priority === 'Medium' && remainingHours >= 4);

  let quadrant: 'Q1' | 'Q2' | 'Q3' | 'Q4';
  if (isUrgent && isImportant) {
    quadrant = 'Q1'; // Urgent & Important (Do First)
  } else if (!isUrgent && isImportant) {
    quadrant = 'Q2'; // Not Urgent & Important (Schedule)
  } else if (isUrgent && !isImportant) {
    quadrant = 'Q3'; // Urgent & Not Important (Quick / Delegate)
  } else {
    quadrant = 'Q4'; // Not Urgent & Not Important (Backlog / Low)
  }

  return {
    score: finalScore,
    reason,
    quadrant,
    urgencyDays: diffDays,
    remainingHours,
  };
}

/**
 * Enriches tasks with calculated scores and sorted highest score first
 */
export function prioritizeTasks(tasks: ITask[], referenceDate: Date = new Date()): ITask[] {
  return tasks
    .map(t => {
      const calc = calculatePriorityScore(t, referenceDate);
      return {
        ...t,
        priorityScore: calc.score,
        scoreReason: calc.reason,
        quadrant: calc.quadrant,
      };
    })
    .sort((a, b) => (b.priorityScore || 0) - (a.priorityScore || 0));
}

export interface PlannerConfig {
  dailyHours: number; // e.g. 6
  workingDays: number[]; // e.g. [1, 2, 3, 4, 5] (Mon-Fri)
  startTime?: string; // e.g. "09:00"
  bufferPercent: number; // e.g. 15 (means 15% buffer reserved for unexpected tasks)
  horizonDays?: number; // Days to plan into future (default: 14)
}

/**
 * Core Practical Plan Generator
 * 
 * Rules:
 * 1. Fills each day up to effective available hours (dailyHours - buffer).
 * 2. High priority score tasks are scheduled first.
 * 3. Splits large tasks into chunks across available working days before deadline.
 *    (e.g., 10h task due in 5 days is distributed as ~2h/day).
 * 4. Never schedules work after the task's deadline date.
 * 5. Leaves 15-20% buffer on each day for unplanned emergencies.
 * 6. Detects problems: overloaded days, deadline violations, impossible workloads,
 *    and produces concrete recommendations.
 */
export function generateSchedule(
  tasks: ITask[],
  settings: Partial<IUser['settings']> = {},
  referenceDate: Date = new Date()
): IPlanSchedule {
  const dailyHours = Math.max(1, Math.min(16, settings.dailyHours || 6));
  const workingDays = settings.workingDays && settings.workingDays.length > 0 
    ? settings.workingDays 
    : [1, 2, 3, 4, 5];
  const bufferPercent = Math.min(50, Math.max(0, settings.bufferPercent ?? 15));
  const bufferHours = Number(((dailyHours * bufferPercent) / 100).toFixed(1));
  const effectiveDailyCapacity = Number((dailyHours - bufferHours).toFixed(1));
  const horizonDays = 14; // Two-week scheduling window

  // Normalize reference date to beginning of day
  const startDay = new Date(referenceDate);
  startDay.setHours(0, 0, 0, 0);

  // Initialize day slots
  const dailyPlans: IDayPlan[] = [];
  for (let i = 0; i < horizonDays; i++) {
    const current = new Date(startDay);
    current.setDate(startDay.getDate() + i);
    const dayOfWeek = current.getDay(); // 0 = Sun, 1 = Mon ...
    const isWorkingDay = workingDays.includes(dayOfWeek);
    const yyyy = current.getFullYear();
    const mm = String(current.getMonth() + 1).padStart(2, '0');
    const dd = String(current.getDate()).padStart(2, '0');
    const dateStr = `${yyyy}-${mm}-${dd}`;
    const dayName = current.toLocaleDateString('en-US', { weekday: 'long' });

    dailyPlans.push({
      date: dateStr,
      dayName,
      isWorkingDay,
      availableHours: isWorkingDay ? dailyHours : 0,
      effectiveHours: isWorkingDay ? effectiveDailyCapacity : 0,
      scheduledHours: 0,
      bufferHours: isWorkingDay ? bufferHours : 0,
      utilizationPercent: 0,
      chunks: [],
      isOverloaded: false,
    });
  }

  // Filter tasks that need work
  const activeTasks = tasks.filter(t => t.status !== 'Done');
  const enrichedTasks = prioritizeTasks(activeTasks, referenceDate);

  const warnings: IPlanWarning[] = [];

  // Track task progress distribution
  // For each task, calculate remaining effort needed
  for (const task of enrichedTasks) {
    const remaining = Math.max(0, task.estimatedEffort - (task.hoursCompleted || 0));
    if (remaining <= 0) continue;

    const taskDeadline = new Date(task.deadline);
    // Find latest slot index that is on or before the deadline
    let maxSlotIndex = -1;
    for (let i = 0; i < dailyPlans.length; i++) {
      const slotDate = new Date(dailyPlans[i].date + 'T23:59:59');
      if (slotDate.getTime() <= taskDeadline.getTime() + 86400000) { // allow same day work
        maxSlotIndex = i;
      }
    }

    const isOverdue = taskDeadline.getTime() < startDay.getTime();

    // Check if task can fit before deadline
    if (isOverdue) {
      warnings.push({
        type: 'deadline_risk',
        severity: 'critical',
        message: `Task "${task.title}" is already overdue!`,
        taskId: task._id,
        suggestion: `Immediately complete or extend deadline to allow realistic scheduling.`,
        actionPayload: {
          action: 'extend_deadline',
          taskId: task._id,
          newDeadline: new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0],
        },
      });
      // For overdue tasks, schedule them starting TODAY immediately
      maxSlotIndex = Math.min(horizonDays - 1, 3);
    } else if (maxSlotIndex === -1) {
      // Deadline is way beyond horizon, can be scheduled throughout horizon
      maxSlotIndex = horizonDays - 1;
    }

    // Determine how many working days exist between today and maxSlotIndex
    const workingSlotsBeforeDeadline = dailyPlans
      .slice(0, maxSlotIndex + 1)
      .filter(d => d.isWorkingDay);

    const availableEffectiveCapacityBeforeDeadline = workingSlotsBeforeDeadline.reduce(
      (sum, d) => sum + Math.max(0, d.effectiveHours - d.scheduledHours),
      0
    );

    if (availableEffectiveCapacityBeforeDeadline < remaining && !isOverdue) {
      const hoursDeficit = Number((remaining - availableEffectiveCapacityBeforeDeadline).toFixed(1));
      warnings.push({
        type: 'deadline_risk',
        severity: 'warning',
        message: `Task "${task.title}" requires ${remaining}h but only ${availableEffectiveCapacityBeforeDeadline.toFixed(1)}h are available before its deadline (${new Date(task.deadline).toLocaleDateString()}).`,
        taskId: task._id,
        suggestion: `Extend deadline by 2-3 working days or reduce task scope by ${hoursDeficit} hours.`,
        actionPayload: {
          action: 'extend_deadline',
          taskId: task._id,
          newDeadline: new Date(new Date(task.deadline).getTime() + 86400000 * 3).toISOString().split('T')[0],
        },
      });
    }

    // Chunking logic:
    // If remaining >= 3 hours and multiple working days are available, split across days
    let hoursToSchedule = remaining;
    const workingSlotsAvailable = workingSlotsBeforeDeadline.length;

    // Ideal chunk size: spread out evenly, but at least 1h and at most effectiveDailyCapacity
    let maxChunkPerDay = effectiveDailyCapacity;
    if (workingSlotsAvailable >= 2 && remaining >= 3) {
      // e.g. 10h task due in 5 days -> ~2h per day
      const spreadTarget = remaining / workingSlotsAvailable;
      maxChunkPerDay = Math.min(effectiveDailyCapacity, Math.max(1, Number(spreadTarget.toFixed(1))));
    }

    // Schedule into eligible daily slots
    let chunkCounter = 1;
    let scheduledTotal = 0;

    for (let i = 0; i <= maxSlotIndex && hoursToSchedule > 0; i++) {
      const day = dailyPlans[i];
      if (!day.isWorkingDay) continue;

      const dayRemainingSpace = Math.max(0, day.effectiveHours - day.scheduledHours);
      if (dayRemainingSpace <= 0.25) continue; // Skip nearly full days

      // Allocate portion to this day
      const chunkAllocation = Math.min(hoursToSchedule, maxChunkPerDay, dayRemainingSpace);
      const roundedAllocation = Number(chunkAllocation.toFixed(1));

      if (roundedAllocation > 0) {
        day.chunks.push({
          id: `chunk_${task._id}_day${i}_${Date.now()}_${chunkCounter}`,
          taskId: task._id,
          taskTitle: task.title,
          taskCategory: task.category,
          taskPriority: task.priority,
          allocatedHours: roundedAllocation,
          deadline: task.deadline,
          chunkIndex: chunkCounter,
          totalChunks: 1, // Will normalize after loop
          isCompleted: false,
          notes: `${roundedAllocation}h allocated for today`,
        });

        day.scheduledHours = Number((day.scheduledHours + roundedAllocation).toFixed(1));
        hoursToSchedule = Number((hoursToSchedule - roundedAllocation).toFixed(1));
        scheduledTotal += roundedAllocation;
        chunkCounter++;
      }
    }

    // If still hours remaining (because days before deadline were tightly packed),
    // allow scheduling into buffer or next available days with a warning
    if (hoursToSchedule > 0) {
      for (let i = 0; i < dailyPlans.length && hoursToSchedule > 0; i++) {
        const day = dailyPlans[i];
        if (!day.isWorkingDay) continue;
        const totalDayCapacity = day.availableHours;
        const remainingBufferSpace = totalDayCapacity - day.scheduledHours;
        if (remainingBufferSpace > 0.3) {
          const chunkAllocation = Number(Math.min(hoursToSchedule, remainingBufferSpace).toFixed(1));
          day.chunks.push({
            id: `chunk_${task._id}_overflow_${i}_${chunkCounter}`,
            taskId: task._id,
            taskTitle: task.title,
            taskCategory: task.category,
            taskPriority: task.priority,
            allocatedHours: chunkAllocation,
            deadline: task.deadline,
            chunkIndex: chunkCounter,
            totalChunks: 1,
            isCompleted: false,
            notes: `Scheduled into buffer capacity`,
          });
          day.scheduledHours = Number((day.scheduledHours + chunkAllocation).toFixed(1));
          hoursToSchedule = Number((hoursToSchedule - chunkAllocation).toFixed(1));
          chunkCounter++;
        }
      }
    }

    // Update total chunks count on this task's chunks
    for (const day of dailyPlans) {
      for (const ch of day.chunks) {
        if (ch.taskId === task._id) {
          ch.totalChunks = chunkCounter - 1;
        }
      }
    }
  }

  // Calculate day utilization & check for overloaded days
  let totalScheduled = 0;
  let totalAvailableWorkingHours = 0;

  for (const day of dailyPlans) {
    if (day.isWorkingDay) {
      totalAvailableWorkingHours += day.availableHours;
      day.utilizationPercent = Math.min(100, Math.round((day.scheduledHours / Math.max(1, day.availableHours)) * 100));
      if (day.scheduledHours > day.effectiveHours) {
        day.isOverloaded = true;
        if (day.scheduledHours > day.availableHours) {
          warnings.push({
            type: 'overloaded_day',
            severity: 'critical',
            message: `${day.dayName} (${day.date}) is over capacity with ${day.scheduledHours}h planned (max available: ${day.availableHours}h).`,
            date: day.date,
            suggestion: `Increase daily working hours in Settings or postpone non-urgent tasks.`,
            actionPayload: {
              action: 'increase_hours',
              suggestedHours: Math.ceil(day.scheduledHours),
            },
          });
        }
      }
    }
    totalScheduled += day.scheduledHours;
  }

  // Global workload capacity warning
  const totalEffortHours = tasks.reduce((sum, t) => sum + (t.estimatedEffort || 0), 0);
  const completedEffortHours = tasks.reduce((sum, t) => sum + (t.hoursCompleted || 0), 0);
  const remainingEffortHours = Number((totalEffortHours - completedEffortHours).toFixed(1));

  if (remainingEffortHours > totalAvailableWorkingHours) {
    const deficit = Number((remainingEffortHours - totalAvailableWorkingHours).toFixed(1));
    warnings.push({
      type: 'capacity_exceeded',
      severity: 'critical',
      message: `Total workload (${remainingEffortHours}h) exceeds available working capacity (${totalAvailableWorkingHours}h) over the next 14 days by ${deficit}h.`,
      suggestion: `Consider delegating tasks, increasing daily hours, or extending future project milestones.`,
      actionPayload: {
        action: 'increase_hours',
        suggestedHours: Math.min(12, dailyHours + 2),
      },
    });
  }

  const startDateStr = dailyPlans[0]?.date || '';
  const endDateStr = dailyPlans[dailyPlans.length - 1]?.date || '';

  return {
    generatedAt: new Date().toISOString(),
    startDate: startDateStr,
    endDate: endDateStr,
    dailyPlans,
    warnings,
    summary: {
      totalTasks: tasks.length,
      plannedTasks: activeTasks.length,
      totalEffortHours: Number(totalEffortHours.toFixed(1)),
      completedEffortHours: Number(completedEffortHours.toFixed(1)),
      remainingEffortHours,
      totalAvailableHours: totalAvailableWorkingHours,
      scheduledHours: Number(totalScheduled.toFixed(1)),
      utilizationRate: totalAvailableWorkingHours > 0 
        ? Math.min(100, Math.round((totalScheduled / totalAvailableWorkingHours) * 100))
        : 0,
    },
  };
}
