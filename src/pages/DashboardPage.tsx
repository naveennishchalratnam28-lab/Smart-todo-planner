import React from 'react';
import { usePlanner } from '../context/PlannerContext';
import { useAuth } from '../context/AuthContext';
import { TaskCard } from '../components/TaskCard';
import { WorkloadChart } from '../components/WorkloadChart';
import {
  Clock,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  Sparkles,
  ArrowRight,
  Plus,
  Calendar,
} from 'lucide-react';
import { ITask } from '../types';

interface DashboardPageProps {
  onOpenTaskModal: () => void;
  onNavigateToTab: (tab: 'dashboard' | 'planner' | 'tasks' | 'settings') => void;
  onEditTask: (task: ITask) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  onOpenTaskModal,
  onNavigateToTab,
  onEditTask,
}) => {
  const { tasks, schedule } = usePlanner();
  const { user } = useAuth();

  // Metrics calculations
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.status === 'Done').length;
  const pendingTasks = tasks.filter(t => t.status !== 'Done');
  const overdueTasks = pendingTasks.filter(
    t => new Date(t.deadline).getTime() < Date.now()
  );

  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // Top 3 tasks for Today's Focus (highest priority score)
  const topFocusTasks = [...pendingTasks]
    .sort((a, b) => (b.priorityScore || 0) - (a.priorityScore || 0))
    .slice(0, 3);

  // Weekly hours calculations from schedule
  const thisWeekPlans = schedule?.dailyPlans.slice(0, 7) || [];
  const hoursPlannedThisWeek = thisWeekPlans.reduce((sum, d) => sum + d.scheduledHours, 0);
  const hoursAvailableThisWeek = thisWeekPlans.reduce((sum, d) => sum + d.availableHours, 0);

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-linear-to-r from-indigo-600 via-indigo-700 to-purple-700 rounded-3xl p-6 sm:p-8 text-white shadow-lg shadow-indigo-500/15 relative overflow-hidden">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 text-white text-xs font-semibold backdrop-blur-md mb-3">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>AI Studio Smart Planner</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Welcome back, {user?.name || 'Planner'}!
          </h2>
          <p className="mt-2 text-indigo-100 text-xs sm:text-sm leading-relaxed">
            Your schedule has been prioritized with dynamic urgency decay and effort chunking. You have{' '}
            <strong className="text-white underline">{pendingTasks.length} active tasks</strong> across the next 14 days.
          </p>

          <div className="mt-5 flex items-center gap-3 flex-wrap">
            <button
              onClick={onOpenTaskModal}
              className="px-4 py-2 rounded-xl bg-white text-indigo-700 text-xs font-bold shadow-xs hover:bg-indigo-50 transition-all flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Quick Add Task</span>
            </button>
            <button
              onClick={() => onNavigateToTab('planner')}
              className="px-4 py-2 rounded-xl bg-indigo-500/30 hover:bg-indigo-500/50 text-white text-xs font-bold border border-white/20 transition-all flex items-center gap-1.5"
            >
              <span>View Today's Execution Plan</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Decorative background circle */}
        <div className="absolute -right-12 -bottom-12 w-64 h-64 bg-white/10 rounded-full blur-2xl pointer-events-none" />
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Hours Planned vs Available */}
        <div className="bg-white dark:bg-gray-800 p-4 sm:p-5 rounded-2xl border border-gray-200 dark:border-gray-700/80 shadow-xs">
          <div className="flex items-center justify-between text-gray-500 dark:text-gray-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Weekly Workload</span>
            <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-gray-900 dark:text-gray-100">
            {hoursPlannedThisWeek}h <span className="text-xs font-normal text-gray-400">/ {hoursAvailableThisWeek}h</span>
          </div>
          <div className="text-[11px] text-gray-500 dark:text-gray-400 mt-1">
            Planned vs. available capacity this week
          </div>
        </div>

        {/* Completion Rate */}
        <div className="bg-white dark:bg-gray-800 p-4 sm:p-5 rounded-2xl border border-gray-200 dark:border-gray-700/80 shadow-xs">
          <div className="flex items-center justify-between text-gray-500 dark:text-gray-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Completion Rate</span>
            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-gray-900 dark:text-gray-100">
            {completionRate}%
          </div>
          <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium mt-1">
            {completedTasks} completed of {totalTasks} total
          </div>
        </div>

        {/* Overdue Count */}
        <div className="bg-white dark:bg-gray-800 p-4 sm:p-5 rounded-2xl border border-gray-200 dark:border-gray-700/80 shadow-xs">
          <div className="flex items-center justify-between text-gray-500 dark:text-gray-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Overdue Tasks</span>
            <div className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-rose-600 dark:text-rose-400">
            {overdueTasks.length}
          </div>
          <div className="text-[11px] text-gray-500 dark:text-gray-400 mt-1">
            {overdueTasks.length === 0 ? 'All deadlines are safe' : 'Require urgent replanning'}
          </div>
        </div>

        {/* Active Schedule Horizon */}
        <div className="bg-white dark:bg-gray-800 p-4 sm:p-5 rounded-2xl border border-gray-200 dark:border-gray-700/80 shadow-xs">
          <div className="flex items-center justify-between text-gray-500 dark:text-gray-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Buffer Protected</span>
            <div className="p-2 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-gray-900 dark:text-gray-100">
            {user?.settings?.bufferPercent || 15}%
          </div>
          <div className="text-[11px] text-gray-500 dark:text-gray-400 mt-1">
            Reserved for unforeseen tasks
          </div>
        </div>
      </div>

      {/* Main Grid: Today's Focus (Top 3) & Workload Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Today's Focus: Top 3 prioritized tasks */}
        <div className="lg:col-span-1 bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-200 dark:border-gray-700/80 shadow-xs flex flex-col">
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-gray-100 dark:border-gray-700">
            <div>
              <h3 className="text-base font-bold text-gray-900 dark:text-gray-100 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-500" />
                Today's Focus
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Top 3 tasks by smart priority score
              </p>
            </div>
            <button
              onClick={() => onNavigateToTab('tasks')}
              className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
            >
              See all &rarr;
            </button>
          </div>

          <div className="space-y-3 flex-1">
            {topFocusTasks.length === 0 ? (
              <div className="h-48 flex flex-col items-center justify-center text-center text-gray-400 dark:text-gray-500 text-xs">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mb-2" />
                <p className="font-semibold text-gray-700 dark:text-gray-300">
                  All caught up!
                </p>
                <p className="mt-1">Add tasks to see smart priorities here.</p>
              </div>
            ) : (
              topFocusTasks.map(task => (
                <TaskCard
                  key={task._id}
                  task={task}
                  onEdit={onEditTask}
                />
              ))
            )}
          </div>
        </div>

        {/* Workload per Day Recharts Chart */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-200 dark:border-gray-700/80 shadow-xs flex flex-col">
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-gray-100 dark:border-gray-700">
            <div>
              <h3 className="text-base font-bold text-gray-900 dark:text-gray-100">
                Workload Distribution (Hours / Day)
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Scheduled effort vs. daily capacity limit with buffer threshold
              </p>
            </div>
            <button
              onClick={() => onNavigateToTab('planner')}
              className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
            >
              Calendar details &rarr;
            </button>
          </div>

          <div className="flex-1 flex items-center justify-center">
            {schedule?.dailyPlans ? (
              <WorkloadChart
                dailyPlans={schedule.dailyPlans}
                dailyHoursLimit={user?.settings?.dailyHours || 6}
              />
            ) : (
              <div className="text-xs text-gray-400">Loading workload chart...</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
