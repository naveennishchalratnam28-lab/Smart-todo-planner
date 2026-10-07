export const TYPES_LOADED = true;

export type PriorityLevel = 'Low' | 'Medium' | 'High';
export type TaskStatus = 'Pending' | 'In Progress' | 'Done';

export interface IUser {
  _id: string;
  email: string;
  password?: string;
  name: string;
  settings: {
    dailyHours: number;
    workingDays: number[]; // 0=Sunday, 1=Monday, ..., 6=Saturday
    startTime: string; // "09:00"
    bufferPercent: number; // e.g. 15 or 20
  };
  createdAt: string;
  updatedAt: string;
}

export interface ITask {
  _id: string;
  userId: string;
  title: string;
  description?: string;
  priority: PriorityLevel;
  deadline: string; // ISO string
  estimatedEffort: number; // in hours, e.g. 0.5, 2, 6
  category: string;
  status: TaskStatus;
  hoursCompleted: number;
  priorityScore?: number;
  scoreReason?: string;
  quadrant?: 'Q1' | 'Q2' | 'Q3' | 'Q4';
  createdAt: string;
  updatedAt: string;
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
  date: string; // YYYY-MM-DD
  dayName: string; // Monday, etc.
  isWorkingDay: boolean;
  availableHours: number;
  effectiveHours: number; // after buffer
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
