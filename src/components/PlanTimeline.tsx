import React, { useState } from 'react';
import { IPlanSchedule, IDayPlan, IPlanWarning, IPlanChunk } from '../types';
import { DayColumn } from './DayColumn';
import { usePlanner } from '../context/PlannerContext';
import { useAuth } from '../context/AuthContext';
import {
  Calendar,
  Clock,
  Sparkles,
  AlertTriangle,
  RefreshCw,
  CheckCircle2,
  ListOrdered,
  CalendarDays,
  Target,
  ArrowRight,
  ShieldAlert,
  Flame,
} from 'lucide-react';

interface PlanTimelineProps {
  schedule: IPlanSchedule | null;
  onOpenTaskModal: () => void;
}

export const PlanTimeline: React.FC<PlanTimelineProps> = ({
  schedule,
  onOpenTaskModal,
}) => {
  const { replanSchedule, isReplanning, logTaskProgress, updateTask } = usePlanner();
  const { updateSettings, user } = useAuth();
  const [plannerView, setPlannerView] = useState<'today' | 'timeline' | 'list'>('today');

  if (!schedule) {
    return (
      <div className="p-12 text-center bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700">
        <RefreshCw className="w-8 h-8 animate-spin mx-auto text-indigo-500 mb-3" />
        <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
          Generating smart schedule...
        </p>
      </div>
    );
  }

  const todayStr = new Date().toISOString().split('T')[0];
  const todayPlan = schedule.dailyPlans.find(d => d.date === todayStr) || schedule.dailyPlans[0];

  const handleFixWarning = async (warning: IPlanWarning) => {
    if (!warning.actionPayload) return;

    if (warning.actionPayload.action === 'extend_deadline' && warning.actionPayload.taskId && warning.actionPayload.newDeadline) {
      await updateTask(warning.actionPayload.taskId, {
        deadline: new Date(warning.actionPayload.newDeadline + 'T17:00:00').toISOString(),
      });
      await replanSchedule();
    } else if (warning.actionPayload.action === 'increase_hours' && warning.actionPayload.suggestedHours) {
      await updateSettings({
        dailyHours: warning.actionPayload.suggestedHours,
      });
      await replanSchedule();
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Planner Controls & Summary */}
      <div className="bg-white dark:bg-gray-800 p-4 sm:p-5 rounded-2xl border border-gray-200 dark:border-gray-700/80 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
              Practical Daily Plan
            </h3>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-700 dark:bg-indigo-950/80 dark:text-indigo-300">
              15-20% Buffer Protected
            </span>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Window: {schedule.startDate} to {schedule.endDate} • {schedule.summary.scheduledHours}h planned across {schedule.summary.plannedTasks} active tasks
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-end md:self-auto flex-wrap">
          {/* View Mode Toggle: Today / Timeline / List */}
          <div className="flex items-center bg-gray-100 dark:bg-gray-700 p-1 rounded-xl text-xs font-semibold">
            <button
              onClick={() => setPlannerView('today')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                plannerView === 'today'
                  ? 'bg-white dark:bg-gray-800 text-indigo-600 dark:text-indigo-400 shadow-xs'
                  : 'text-gray-600 dark:text-gray-300'
              }`}
            >
              <Target className="w-3.5 h-3.5" />
              <span>Today</span>
            </button>
            <button
              onClick={() => setPlannerView('timeline')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                plannerView === 'timeline'
                  ? 'bg-white dark:bg-gray-800 text-indigo-600 dark:text-indigo-400 shadow-xs'
                  : 'text-gray-600 dark:text-gray-300'
              }`}
            >
              <CalendarDays className="w-3.5 h-3.5" />
              <span>Weekly Timeline</span>
            </button>
            <button
              onClick={() => setPlannerView('list')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                plannerView === 'list'
                  ? 'bg-white dark:bg-gray-800 text-indigo-600 dark:text-indigo-400 shadow-xs'
                  : 'text-gray-600 dark:text-gray-300'
              }`}
            >
              <ListOrdered className="w-3.5 h-3.5" />
              <span>List</span>
            </button>
          </div>

          {/* Replan Button */}
          <button
            onClick={replanSchedule}
            disabled={isReplanning}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition-all disabled:opacity-50"
            title="Recalculate schedule taking latest task completions and deadlines into account"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isReplanning ? 'animate-spin' : ''}`} />
            <span>{isReplanning ? 'Optimizing...' : 'Replan'}</span>
          </button>
        </div>
      </div>

      {/* Warnings & Suggestions Banner */}
      {schedule.warnings.length > 0 && (
        <div className="space-y-2.5">
          {schedule.warnings.map((w, idx) => (
            <div
              key={idx}
              className={`p-3.5 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs ${
                w.severity === 'critical'
                  ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900/60 text-rose-900 dark:text-rose-200'
                  : 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-900/60 text-amber-900 dark:text-amber-200'
              }`}
            >
              <div className="flex items-start gap-2.5">
                <ShieldAlert className="w-4 h-4 flex-shrink-0 mt-0.5 text-rose-500" />
                <div>
                  <div className="font-bold">{w.message}</div>
                  <div className="text-[11px] opacity-90 mt-0.5">
                    <strong>Suggestion:</strong> {w.suggestion}
                  </div>
                </div>
              </div>

              {w.actionPayload && (
                <button
                  onClick={() => handleFixWarning(w)}
                  className="px-3 py-1.5 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 font-semibold text-indigo-600 dark:text-indigo-400 shadow-2xs whitespace-nowrap self-end sm:self-auto transition-all"
                >
                  Apply Fix &rarr;
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* VIEW 1: TODAY'S FOCUS VIEW */}
      {plannerView === 'today' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Today Focus list */}
          <div className="lg:col-span-2 bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-200 dark:border-gray-700/80 shadow-xs">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-gray-100 dark:border-gray-700">
              <div>
                <h4 className="text-base font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                  <Target className="w-4 h-4 text-indigo-600" />
                  Today's Execution Queue ({todayPlan?.dayName || 'Today'})
                </h4>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {todayPlan?.scheduledHours || 0}h work scheduled • {todayPlan?.effectiveHours || 0}h effective capacity
                </p>
              </div>

              <div className="text-right">
                <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                  {todayPlan?.chunks.length || 0} chunks today
                </span>
              </div>
            </div>

            {todayPlan?.chunks.length === 0 ? (
              <div className="p-8 text-center text-gray-400 dark:text-gray-500 text-xs">
                <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-500 mb-2" />
                <p className="font-semibold text-gray-700 dark:text-gray-300">
                  You're all set for today!
                </p>
                <p className="mt-1">
                  No work chunks currently scheduled today. Add new tasks or review upcoming days.
                </p>
                <button
                  onClick={onOpenTaskModal}
                  className="mt-4 px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white"
                >
                  + Add New Task
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {todayPlan.chunks.map((chunk, idx) => (
                  <div
                    key={chunk.id || idx}
                    className="p-4 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-indigo-400 transition-all bg-gray-50/50 dark:bg-gray-750/50 flex items-center justify-between gap-4"
                  >
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <button
                        onClick={() => logTaskProgress(chunk.taskId, chunk.allocatedHours, chunk.chunkIndex === chunk.totalChunks)}
                        className="mt-0.5 text-gray-400 hover:text-emerald-500 transition-colors"
                        title="Mark chunk as completed and log hours"
                      >
                        <CheckCircle2 className="w-5 h-5 text-gray-400 hover:text-emerald-500" />
                      </button>

                      <div className="min-w-0">
                        <h5 className="text-sm font-bold text-gray-900 dark:text-gray-100 truncate">
                          {chunk.taskTitle}
                        </h5>
                        <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mt-1 flex-wrap">
                          <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                            {chunk.allocatedHours} hours
                          </span>
                          <span>•</span>
                          <span>{chunk.taskPriority} Priority</span>
                          <span>•</span>
                          <span>#{chunk.taskCategory}</span>
                          {chunk.totalChunks > 1 && (
                            <>
                              <span>•</span>
                              <span>Part {chunk.chunkIndex} of {chunk.totalChunks}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => logTaskProgress(chunk.taskId, chunk.allocatedHours, true)}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 whitespace-nowrap transition-colors"
                    >
                      Finish Task
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Today's Capacity & Buffer stats */}
          <div className="space-y-4">
            <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-200 dark:border-gray-700/80 shadow-xs">
              <h4 className="text-sm font-bold text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
                <Clock className="w-4 h-4 text-indigo-600" />
                Capacity & Protection
              </h4>

              <div className="space-y-3 text-xs">
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-gray-50 dark:bg-gray-700/50">
                  <span className="text-gray-600 dark:text-gray-400 font-medium">Daily Available Hours</span>
                  <span className="font-bold text-gray-900 dark:text-gray-100">{todayPlan?.availableHours || 0} hrs</span>
                </div>

                <div className="flex items-center justify-between p-2.5 rounded-xl bg-indigo-50/60 dark:bg-indigo-950/40 text-indigo-900 dark:text-indigo-200">
                  <span className="font-medium">Scheduled Workload</span>
                  <span className="font-bold">{todayPlan?.scheduledHours || 0} hrs</span>
                </div>

                <div className="flex items-center justify-between p-2.5 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200">
                  <span className="font-medium">Emergency Buffer</span>
                  <span className="font-bold">{todayPlan?.bufferHours || 0} hrs reserved</span>
                </div>

                <div className="p-3 rounded-xl border border-gray-100 dark:border-gray-700 text-gray-500 dark:text-gray-400 text-[11px] leading-relaxed">
                  💡 The scheduler reserves 15-20% free buffer time each day to absorb spontaneous interruptions, meetings, and estimates variance without breaking deadlines.
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 2: WEEKLY TIMELINE / CALENDAR VIEW */}
      {plannerView === 'timeline' && (
        <div className="overflow-x-auto pb-4">
          <div className="flex gap-4 min-w-max">
            {schedule.dailyPlans.map(day => (
              <DayColumn
                key={day.date}
                day={day}
                isToday={day.date === todayStr}
              />
            ))}
          </div>
        </div>
      )}

      {/* VIEW 3: STRUCTURED LIST VIEW */}
      {plannerView === 'list' && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700/80 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-gray-100 dark:border-gray-700">
            <h4 className="text-sm font-bold text-gray-900 dark:text-gray-100">
              All Planned Chunks Across Calendar Horizon
            </h4>
          </div>

          <div className="divide-y divide-gray-100 dark:divide-gray-700/60">
            {schedule.dailyPlans.flatMap(day =>
              day.chunks.map(chunk => ({ day, chunk }))
            ).map(({ day, chunk }, idx) => (
              <div
                key={idx}
                className="p-3.5 hover:bg-gray-50/60 dark:hover:bg-gray-750/50 transition-colors flex items-center justify-between gap-3 text-xs"
              >
                <div className="flex items-center gap-3">
                  <span className="font-mono text-gray-500 dark:text-gray-400 w-24">
                    {day.dayName.slice(0, 3)} {day.date.slice(5)}
                  </span>

                  <div>
                    <span className="font-bold text-gray-900 dark:text-gray-100">
                      {chunk.taskTitle}
                    </span>
                    <span className="ml-2 text-gray-400 dark:text-gray-500">
                      (Part {chunk.chunkIndex}/{chunk.totalChunks})
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                    {chunk.allocatedHours} hrs
                  </span>
                  <button
                    onClick={() => logTaskProgress(chunk.taskId, chunk.allocatedHours, chunk.chunkIndex === chunk.totalChunks)}
                    className="px-2.5 py-1 rounded bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-300 font-medium hover:bg-indigo-100 transition-colors"
                  >
                    Log Done
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
