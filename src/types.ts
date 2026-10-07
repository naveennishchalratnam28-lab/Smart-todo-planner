export type PriorityLevel = 'Low' | 'Medium' | 'High';
export type TaskStatus = 'Pending' | 'In Progress' | 'Done';

export interface IUser {
  _id: string;
  email: string;
  name: string;
  settings: {
    dailyHours: number;
    workingDays: number[];
    startTime: string;
    bufferPercent: number;
  };
  createdAt?: string;
  updatedAt?: string;
}

export interface ITask {
  _id: string;
  userId: string;
  title: string;
  description?: string;
  priority: PriorityLevel;
  deadline: string; // ISO format
  estimatedEffort: number; // in hours
  category: string;
  status: TaskStatus;
  hoursCompleted: number;
  priorityScore?: number;
  scoreReason?: string;
  quadrant?: 'Q1' | 'Q2' | 'Q3' | 'Q4';
  createdAt?: string;
  updatedAt?: string;
}

export interface IPlanChunk {
  id: string;
  taskId: string;
  taskTitle: string;
  taskCategory: string;
  taskPriority: PriorityLevel;
  allocatedHours: number;
  deadline: string;
  chunkIndex: number;
  totalChunks: number;
  isCompleted: boolean;
  notes?: string;
}

export interface IDayPlan {
  date: string;
  dayName: string;
  isWorkingDay: boolean;
  availableHours: number;
  effectiveHours: number;
  scheduledHours: number;
  bufferHours: number;
  utilizationPercent: number;
  chunks: IPlanChunk[];
  isOverloaded: boolean;
}

export interface IPlanWarning {
  type: 'overloaded_day' | 'deadline_risk' | 'capacity_exceeded';
  severity: 'warning' | 'critical';
  message: string;
  taskId?: string;
  date?: string;
  suggestion: string;
  actionPayload?: {
    action: 'extend_deadline' | 'increase_hours' | 'reduce_effort';
    taskId?: string;
    newDeadline?: string;
    suggestedHours?: number;
  };
}

export interface IPlanSchedule {
  generatedAt: string;
  startDate: string;
  endDate: string;
  dailyPlans: IDayPlan[];
  warnings: IPlanWarning[];
  summary: {
    totalTasks: number;
    plannedTasks: number;
    totalEffortHours: number;
    completedEffortHours: number;
    remainingEffortHours: number;
    totalAvailableHours: number;
    scheduledHours: number;
    utilizationRate: number;
  };
}

export interface ParsedTaskInput {
  title: string;
  deadline?: string;
  estimatedEffort?: number;
  priority?: PriorityLevel;
  category?: string;
  rawText: string;
}
