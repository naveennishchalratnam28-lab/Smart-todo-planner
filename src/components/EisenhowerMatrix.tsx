import React from 'react';
import { ITask } from '../types';
import { TaskCard } from './TaskCard';
import { Flame, Calendar, FastForward, Archive } from 'lucide-react';

interface EisenhowerMatrixProps {
  tasks: ITask[];
  onEditTask: (task: ITask) => void;
}

export const EisenhowerMatrix: React.FC<EisenhowerMatrixProps> = ({
  tasks,
  onEditTask,
}) => {
  const q1 = tasks.filter(t => t.quadrant === 'Q1' || (t.priority === 'High' && t.status !== 'Done'));
  const q2 = tasks.filter(t => t.quadrant === 'Q2' && !q1.includes(t));
  const q3 = tasks.filter(t => t.quadrant === 'Q3' && !q1.includes(t) && !q2.includes(t));
  const q4 = tasks.filter(t => t.quadrant === 'Q4' && !q1.includes(t) && !q2.includes(t) && !q3.includes(t));

  const quadrants = [
    {
      id: 'Q1',
      title: 'Do First (Urgent & Important)',
      subtitle: 'Pressing deadlines, critical dependencies & blockers',
      color: 'border-rose-400 dark:border-rose-800 bg-rose-50/30 dark:bg-rose-950/20',
      badge: 'bg-rose-100 text-rose-800 dark:bg-rose-900/60 dark:text-rose-200',
      icon: Flame,
      tasks: q1,
    },
    {
      id: 'Q2',
      title: 'Schedule (Important, Not Urgent)',
      subtitle: 'Strategic initiatives, long-term goals & high leverage',
      color: 'border-indigo-400 dark:border-indigo-800 bg-indigo-50/30 dark:bg-indigo-950/20',
      badge: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/60 dark:text-indigo-200',
      icon: Calendar,
      tasks: q2,
    },
    {
      id: 'Q3',
      title: 'Delegate / Quick (Urgent, Not Important)',
      subtitle: 'Immediate interruptions, low cognitive effort',
      color: 'border-amber-400 dark:border-amber-800 bg-amber-50/30 dark:bg-amber-950/20',
      badge: 'bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-200',
      icon: FastForward,
      tasks: q3,
    },
    {
      id: 'Q4',
      title: 'Backlog / Eliminate (Neither)',
      subtitle: 'Low priority, no immediate deadline',
      color: 'border-gray-300 dark:border-gray-700 bg-gray-50/30 dark:bg-gray-800/20',
      badge: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
      icon: Archive,
      tasks: q4,
    },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
      {quadrants.map(q => {
        const Icon = q.icon;
        return (
          <div
            key={q.id}
            className={`p-4 rounded-2xl border-2 ${q.color} flex flex-col min-h-[380px] shadow-xs`}
          >
            {/* Header */}
            <div className="flex items-start justify-between gap-2 pb-3 mb-3 border-b border-gray-200 dark:border-gray-700/80">
              <div className="flex items-center gap-2">
                <div className={`p-1.5 rounded-lg ${q.badge}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-gray-900 dark:text-gray-100">
                    {q.title}
                  </h4>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400">
                    {q.subtitle}
                  </p>
                </div>
              </div>
              <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${q.badge}`}>
                {q.tasks.length}
              </span>
            </div>

            {/* Task Cards list */}
            <div className="space-y-3 flex-1 overflow-y-auto max-h-[500px] pr-1">
              {q.tasks.length === 0 ? (
                <div className="h-32 flex flex-col items-center justify-center text-center text-gray-400 dark:text-gray-500 text-xs">
                  <p>No active tasks in this quadrant</p>
                </div>
              ) : (
                q.tasks.map(task => (
                  <TaskCard
                    key={task._id}
                    task={task}
                    onEdit={onEditTask}
                  />
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
