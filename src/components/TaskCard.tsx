import React, { useState } from 'react';
import { ITask } from '../types';
import { PriorityBadge } from './PriorityBadge';
import { usePlanner } from '../context/PlannerContext';
import {
  Calendar,
  Clock,
  CheckCircle,
  Circle,
  MoreVertical,
  Edit2,
  Trash2,
  Plus,
  AlertTriangle,
  Folder,
} from 'lucide-react';

interface TaskCardProps {
  task: ITask;
  isSelected?: boolean;
  onSelect?: (selected: boolean) => void;
  onEdit?: (task: ITask) => void;
}

export const TaskCard: React.FC<TaskCardProps> = ({
  task,
  isSelected = false,
  onSelect,
  onEdit,
}) => {
  const { updateTask, deleteTask, logTaskProgress } = usePlanner();
  const [showMenu, setShowMenu] = useState(false);
  const [isLogging, setIsLogging] = useState(false);

  const isDone = task.status === 'Done';
  const progressPercent = Math.min(100, Math.round(((task.hoursCompleted || 0) / Math.max(0.1, task.estimatedEffort)) * 100));

  // Deadline formatting & overdue check
  const deadlineDate = new Date(task.deadline);
  const isOverdue = !isDone && deadlineDate.getTime() < Date.now();
  const formattedDeadline = deadlineDate.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const toggleDone = () => {
    const nextStatus = isDone ? 'Pending' : 'Done';
    updateTask(task._id, {
      status: nextStatus,
      hoursCompleted: nextStatus === 'Done' ? task.estimatedEffort : task.hoursCompleted,
    });
  };

  const handleQuickLog = async (hours: number) => {
    setIsLogging(true);
    await logTaskProgress(task._id, hours);
    setIsLogging(false);
  };

  return (
    <div
      className={`group relative bg-white dark:bg-gray-800 rounded-xl border transition-all hover:shadow-md ${
        isDone
          ? 'opacity-70 border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-850'
          : isSelected
          ? 'border-indigo-500 ring-2 ring-indigo-500/20 shadow-sm'
          : isOverdue
          ? 'border-rose-300 dark:border-rose-900/60'
          : 'border-gray-200 dark:border-gray-700/80'
      }`}
    >
      <div className="p-4">
        {/* Top Header: Select / Checkbox / Title / Menu */}
        <div className="flex items-start gap-3">
          {onSelect && (
            <input
              type="checkbox"
              checked={isSelected}
              onChange={(e) => onSelect(e.target.checked)}
              className="mt-1 w-4 h-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700"
            />
          )}

          <button
            onClick={toggleDone}
            className="mt-0.5 text-gray-400 hover:text-emerald-500 dark:text-gray-500 dark:hover:text-emerald-400 transition-colors flex-shrink-0"
            title={isDone ? 'Mark as incomplete' : 'Mark as completed'}
          >
            {isDone ? (
              <CheckCircle className="w-5 h-5 text-emerald-500" />
            ) : (
              <Circle className="w-5 h-5" />
            )}
          </button>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <h4
                className={`text-base font-semibold truncate ${
                  isDone
                    ? 'line-through text-gray-400 dark:text-gray-500'
                    : 'text-gray-900 dark:text-gray-100'
                }`}
              >
                {task.title}
              </h4>
            </div>

            {task.description && (
              <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2 mb-2">
                {task.description}
              </p>
            )}

            {/* Badges: Priority, Category, Deadline */}
            <div className="flex items-center gap-2 flex-wrap mt-2">
              <PriorityBadge
                priority={task.priority}
                score={task.priorityScore}
                reason={task.scoreReason}
              />

              <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300">
                <Folder className="w-3 h-3" />
                {task.category || 'General'}
              </span>

              <span
                className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${
                  isOverdue
                    ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
                    : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                }`}
              >
                {isOverdue ? (
                  <AlertTriangle className="w-3 h-3 text-rose-500" />
                ) : (
                  <Calendar className="w-3 h-3" />
                )}
                <span>{isOverdue ? `Overdue (${formattedDeadline})` : formattedDeadline}</span>
              </span>
            </div>
          </div>

          {/* Action Menu */}
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-1 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <MoreVertical className="w-4 h-4" />
            </button>

            {showMenu && (
              <div className="absolute right-0 top-full mt-1 w-36 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg z-20 py-1 text-xs font-medium animate-in fade-in zoom-in-95">
                {onEdit && (
                  <button
                    onClick={() => {
                      setShowMenu(false);
                      onEdit(task);
                    }}
                    className="w-full text-left px-3 py-2 flex items-center gap-2 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700/60"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>Edit Task</span>
                  </button>
                )}
                <button
                  onClick={() => {
                    setShowMenu(false);
                    deleteTask(task._id);
                  }}
                  className="w-full text-left px-3 py-2 flex items-center gap-2 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete Task</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Effort Progress Bar & Quick Log Action */}
        <div className="mt-3.5 pt-3 border-t border-gray-100 dark:border-gray-700/60">
          <div className="flex items-center justify-between text-xs mb-1.5">
            <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400 font-medium">
              <Clock className="w-3.5 h-3.5 text-indigo-500" />
              <span>
                {task.hoursCompleted || 0}h / {task.estimatedEffort}h effort
              </span>
              <span className="text-gray-400 dark:text-gray-500">({progressPercent}%)</span>
            </div>

            {!isDone && (
              <div className="flex items-center gap-1">
                <button
                  disabled={isLogging}
                  onClick={() => handleQuickLog(0.5)}
                  className="px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-700 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 hover:text-indigo-600 text-[11px] font-medium text-gray-600 dark:text-gray-300 transition-colors"
                  title="Log 30 minutes"
                >
                  +0.5h
                </button>
                <button
                  disabled={isLogging}
                  onClick={() => handleQuickLog(1.0)}
                  className="px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-700 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 hover:text-indigo-600 text-[11px] font-medium text-gray-600 dark:text-gray-300 transition-colors"
                  title="Log 1 hour"
                >
                  +1h
                </button>
              </div>
            )}
          </div>

          <div className="w-full h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                isDone
                  ? 'bg-emerald-500'
                  : progressPercent > 80
                  ? 'bg-emerald-500'
                  : progressPercent > 40
                  ? 'bg-indigo-500'
                  : 'bg-indigo-400'
              }`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
