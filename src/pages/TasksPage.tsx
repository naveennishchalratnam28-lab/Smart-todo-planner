import React, { useState } from 'react';
import { usePlanner } from '../context/PlannerContext';
import { ITask, PriorityLevel, TaskStatus } from '../types';
import { TaskCard } from '../components/TaskCard';
import { FilterBar } from '../components/FilterBar';
import { EisenhowerMatrix } from '../components/EisenhowerMatrix';
import {
  Plus,
  Trash2,
  CheckCircle,
  Clock,
  Sparkles,
  Inbox,
  Flame,
} from 'lucide-react';

interface TasksPageProps {
  onOpenTaskModal: () => void;
  onEditTask: (task: ITask) => void;
}

export const TasksPage: React.FC<TasksPageProps> = ({
  onOpenTaskModal,
  onEditTask,
}) => {
  const {
    tasks,
    loadingTasks,
    bulkUpdateTasks,
    bulkDeleteTasks,
  } = usePlanner();

  const [viewMode, setViewMode] = useState<'list' | 'kanban' | 'matrix'>('list');
  const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>([]);

  // Collect unique categories for filter
  const categories = Array.from(new Set(tasks.map(t => t.category).filter(Boolean)));

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedTaskIds(tasks.map(t => t._id));
    } else {
      setSelectedTaskIds([]);
    }
  };

  const handleSelectOne = (taskId: string, checked: boolean) => {
    if (checked) {
      setSelectedTaskIds(prev => [...prev, taskId]);
    } else {
      setSelectedTaskIds(prev => prev.filter(id => id !== taskId));
    }
  };

  const handleBulkComplete = async () => {
    if (selectedTaskIds.length === 0) return;
    await bulkUpdateTasks(selectedTaskIds, { status: 'Done' });
    setSelectedTaskIds([]);
  };

  const handleBulkDelete = async () => {
    if (selectedTaskIds.length === 0) return;
    if (window.confirm(`Delete ${selectedTaskIds.length} selected tasks?`)) {
      await bulkDeleteTasks(selectedTaskIds);
      setSelectedTaskIds([]);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            Tasks & Prioritization
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            Manage, prioritize, and categorize all active work items
          </p>
        </div>

        <button
          onClick={onOpenTaskModal}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition-all hover:scale-[1.02] active:scale-[0.98]"
        >
          <Plus className="w-4 h-4" />
          <span>New Task</span>
        </button>
      </div>

      {/* Filter and View mode bar */}
      <FilterBar
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        categories={categories}
      />

      {/* Bulk Actions Floating Bar */}
      {selectedTaskIds.length > 0 && (
        <div className="p-3 bg-indigo-50 dark:bg-indigo-950/80 border border-indigo-200 dark:border-indigo-800 rounded-xl flex items-center justify-between gap-3 text-xs animate-in fade-in">
          <span className="font-semibold text-indigo-900 dark:text-indigo-200">
            {selectedTaskIds.length} tasks selected
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={handleBulkComplete}
              className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold flex items-center gap-1.5 transition-colors"
            >
              <CheckCircle className="w-3.5 h-3.5" />
              <span>Mark Done</span>
            </button>
            <button
              onClick={handleBulkDelete}
              className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-semibold flex items-center gap-1.5 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete</span>
            </button>
            <button
              onClick={() => setSelectedTaskIds([])}
              className="px-2.5 py-1.5 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              Clear
            </button>
          </div>
        </div>
      )}

      {/* VIEW: EISENHOWER MATRIX */}
      {viewMode === 'matrix' && (
        <EisenhowerMatrix tasks={tasks} onEditTask={onEditTask} />
      )}

      {/* VIEW: KANBAN BOARD */}
      {viewMode === 'kanban' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {(['Pending', 'In Progress', 'Done'] as TaskStatus[]).map(status => {
            const columnTasks = tasks.filter(t => t.status === status);
            return (
              <div
                key={status}
                className="bg-gray-50/70 dark:bg-gray-800/40 p-4 rounded-2xl border border-gray-200/80 dark:border-gray-700/80 flex flex-col min-h-[450px]"
              >
                <div className="flex items-center justify-between pb-3 mb-3 border-b border-gray-200 dark:border-gray-700">
                  <h4 className="text-sm font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                    <span
                      className={`w-2 h-2 rounded-full ${
                        status === 'Done'
                          ? 'bg-emerald-500'
                          : status === 'In Progress'
                          ? 'bg-indigo-500'
                          : 'bg-amber-500'
                      }`}
                    />
                    {status}
                  </h4>
                  <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                    {columnTasks.length}
                  </span>
                </div>

                <div className="space-y-3 flex-1 overflow-y-auto">
                  {columnTasks.length === 0 ? (
                    <div className="h-32 flex items-center justify-center text-xs text-gray-400">
                      No tasks
                    </div>
                  ) : (
                    columnTasks.map(t => (
                      <TaskCard
                        key={t._id}
                        task={t}
                        onEdit={onEditTask}
                      />
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* VIEW: STANDARD LIST */}
      {viewMode === 'list' && (
        <div className="space-y-3">
          {tasks.length > 0 && (
            <div className="px-3 py-1 flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
              <input
                type="checkbox"
                checked={selectedTaskIds.length === tasks.length && tasks.length > 0}
                onChange={(e) => handleSelectAll(e.target.checked)}
                className="w-4 h-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700"
              />
              <span>Select All Tasks</span>
            </div>
          )}

          {tasks.length === 0 ? (
            <div className="p-12 text-center bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700">
              <Inbox className="w-10 h-10 mx-auto text-gray-300 dark:text-gray-600 mb-3" />
              <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100">
                No matching tasks found
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Try adjusting your search filters or create a new task.
              </p>
              <button
                onClick={onOpenTaskModal}
                className="mt-4 px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white"
              >
                + Add Task
              </button>
            </div>
          ) : (
            tasks.map(task => (
              <TaskCard
                key={task._id}
                task={task}
                isSelected={selectedTaskIds.includes(task._id)}
                onSelect={(selected) => handleSelectOne(task._id, selected)}
                onEdit={onEditTask}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
};
