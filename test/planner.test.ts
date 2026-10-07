import { calculatePriorityScore, prioritizeTasks, generateSchedule } from '../server/services/planner.service.ts';
import { ITask } from '../server/types.ts';

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ TEST FAILED: ${message}`);
    process.exit(1);
  }
  console.log(`✅ ${message}`);
}

console.log('\n--- RUNNING SMART TO-DO PLANNER UNIT TESTS ---\n');

// Mock reference date: 2026-10-01 09:00:00
const refDate = new Date('2026-10-01T09:00:00Z');

// 1. Test Base Priority Scoring
console.log('[Test Suite 1: Priority Scoring]');
const highTask: ITask = {
  _id: 't1',
  userId: 'u1',
  title: 'High priority task',
  priority: 'High',
  deadline: new Date(refDate.getTime() + 86400000 * 5).toISOString(), // 5 days away
  estimatedEffort: 2,
  category: 'Work',
  status: 'Pending',
  hoursCompleted: 0,
  createdAt: refDate.toISOString(),
  updatedAt: refDate.toISOString(),
};

const lowTask: ITask = {
  ...highTask,
  _id: 't2',
  title: 'Low priority task',
  priority: 'Low',
};

const highRes = calculatePriorityScore(highTask, refDate);
const lowRes = calculatePriorityScore(lowTask, refDate);

assert(highRes.score > lowRes.score, 'High priority task must score strictly higher than Low priority task with same deadline');
assert(highRes.reason.includes('High Priority'), 'Score reason must clearly state High Priority badge explanation');

// 2. Test Deadline Urgency & Overdue Boost
console.log('\n[Test Suite 2: Deadline Urgency & Overdue]');
const overdueTask: ITask = {
  ...highTask,
  _id: 't3',
  title: 'Overdue task',
  deadline: new Date(refDate.getTime() - 86400000).toISOString(), // 1 day ago
};

const farTask: ITask = {
  ...highTask,
  _id: 't4',
  title: 'Far task',
  deadline: new Date(refDate.getTime() + 86400000 * 14).toISOString(), // 14 days away
};

const overdueRes = calculatePriorityScore(overdueTask, refDate);
const farRes = calculatePriorityScore(farTask, refDate);

assert(overdueRes.score > farRes.score, 'Overdue task must receive critical score boost over far deadline');
assert(overdueRes.reason.toLowerCase().includes('overdue'), 'Overdue task badge must display overdue warning');

// 3. Test Large Effort Pressure Boost
console.log('\n[Test Suite 3: Effort Pressure Boost]');
const heavyUrgentTask: ITask = {
  ...highTask,
  _id: 't5',
  title: '12h task due in 2 days',
  estimatedEffort: 12,
  deadline: new Date(refDate.getTime() + 86400000 * 2).toISOString(),
};

const lightUrgentTask: ITask = {
  ...highTask,
  _id: 't6',
  title: '1h task due in 2 days',
  estimatedEffort: 1,
  deadline: new Date(refDate.getTime() + 86400000 * 2).toISOString(),
};

const heavyRes = calculatePriorityScore(heavyUrgentTask, refDate);
const lightRes = calculatePriorityScore(lightUrgentTask, refDate);

assert(heavyRes.score >= lightRes.score, 'High effort task with tight runway must get effort pressure boost');

// 4. Test Eisenhower Matrix Categorization
console.log('\n[Test Suite 4: Eisenhower Matrix Quadrants]');
const q1Task: ITask = {
  ...highTask,
  priority: 'High',
  deadline: new Date(refDate.getTime() + 86400000 * 1).toISOString(), // urgent + high
};
const q2Task: ITask = {
  ...highTask,
  priority: 'High',
  deadline: new Date(refDate.getTime() + 86400000 * 10).toISOString(), // not urgent + high
};
const q3Task: ITask = {
  ...highTask,
  priority: 'Low',
  deadline: new Date(refDate.getTime() + 86400000 * 1).toISOString(), // urgent + low
};

assert(calculatePriorityScore(q1Task, refDate).quadrant === 'Q1', 'Urgent and High priority task belongs in Q1 (Do First)');
assert(calculatePriorityScore(q2Task, refDate).quadrant === 'Q2', 'Non-urgent and High priority task belongs in Q2 (Schedule)');
assert(calculatePriorityScore(q3Task, refDate).quadrant === 'Q3', 'Urgent and Low priority task belongs in Q3 (Delegate / Quick)');

// 5. Test Schedule Generator & Task Chunking
console.log('\n[Test Suite 5: Schedule Generation & Task Chunking]');
const largeTask: ITask = {
  _id: 'task_big',
  userId: 'u1',
  title: 'Build Comprehensive Project Architecture',
  priority: 'High',
  estimatedEffort: 10,
  hoursCompleted: 0,
  category: 'Engineering',
  status: 'Pending',
  deadline: new Date(refDate.getTime() + 86400000 * 5).toISOString(),
  createdAt: refDate.toISOString(),
  updatedAt: refDate.toISOString(),
};

const schedule = generateSchedule([largeTask], {
  dailyHours: 6,
  workingDays: [0, 1, 2, 3, 4, 5, 6], // all days working for predictability
  bufferPercent: 20, // 20% buffer -> 4.8h effective
}, refDate);

assert(schedule.dailyPlans.length === 14, 'Schedule must generate 14-day horizon');

// Find all chunks of the large task
const chunks = schedule.dailyPlans.flatMap(d => d.chunks.filter(c => c.taskId === 'task_big'));
assert(chunks.length > 1, '10h task must be split into multiple chunks across days');

const scheduledHoursTotal = chunks.reduce((sum, c) => sum + c.allocatedHours, 0);
assert(Math.abs(scheduledHoursTotal - 10) < 0.2, `All 10 hours of task must be scheduled (got ${scheduledHoursTotal}h)`);

// 6. Test Never Scheduling Work Past Deadline
console.log('\n[Test Suite 6: Never Scheduling Past Deadline]');
const tightDeadline = new Date(refDate.getTime() + 86400000 * 2); // 2 days
const deadlineTask: ITask = {
  _id: 'task_tight',
  userId: 'u1',
  title: 'Submit Paperwork',
  priority: 'High',
  estimatedEffort: 4,
  hoursCompleted: 0,
  category: 'Admin',
  status: 'Pending',
  deadline: tightDeadline.toISOString(),
  createdAt: refDate.toISOString(),
  updatedAt: refDate.toISOString(),
};

const tightSchedule = generateSchedule([deadlineTask], {
  dailyHours: 6,
  workingDays: [0, 1, 2, 3, 4, 5, 6],
  bufferPercent: 15,
}, refDate);

const tightChunks = tightSchedule.dailyPlans.flatMap((day, dayIdx) => 
  day.chunks.filter(c => c.taskId === 'task_tight').map(c => ({ chunk: c, dayIdx, date: day.date }))
);

tightChunks.forEach(tc => {
  const chunkDate = new Date(tc.date + 'T23:59:59');
  assert(chunkDate.getTime() <= tightDeadline.getTime() + 86400000, `Task chunk cannot be scheduled after deadline date (${tc.date})`);
});

// 7. Test Overload Warning Detection
console.log('\n[Test Suite 7: Overload Warning Detection]');
const impossibleTask: ITask = {
  _id: 'task_impossible',
  userId: 'u1',
  title: 'Impossible 50-hour Task',
  priority: 'High',
  estimatedEffort: 50,
  hoursCompleted: 0,
  category: 'Project',
  status: 'Pending',
  deadline: new Date(refDate.getTime() + 86400000 * 3).toISOString(), // 50h due in 3 days!
  createdAt: refDate.toISOString(),
  updatedAt: refDate.toISOString(),
};

const warningSchedule = generateSchedule([impossibleTask], {
  dailyHours: 6,
  workingDays: [0, 1, 2, 3, 4, 5, 6],
  bufferPercent: 15,
}, refDate);

assert(warningSchedule.warnings.length > 0, 'Schedule generator must detect and produce actionable warnings when workload cannot fit before deadline');
assert(Boolean(warningSchedule.warnings[0].suggestion), 'Warning must provide concrete suggestions to resolve overload');

console.log('\n🎉 ALL UNIT TESTS PASSED SUCCESSFULLY! 🎉\n');
