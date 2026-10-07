import React from 'react';
import { IDayPlan, IPlanChunk } from '../types';
import { usePlanner } from '../context/PlannerContext';
import {
  Calendar,
  Clock,
  CheckCircle,
  Circle,
  AlertTriangle,
  ShieldCheck,
} from 'lucide-react';

interface DayColumnProps {
  day: IDayPlan;
  isToday?: boolean;
}

export const DayColumn: React.FC<DayColumnProps> = ({ day, isToday = false }) => {
  const { logTaskProgress } = usePlanner();

  const handleChunkCheck = async (chunk: IPlanChunk) => {
    // If not completed, log the allocated hours
    await logTaskProgress(chunk.taskId, chunk.allocatedHours, chunk.chunkIndex === chunk.totalChunks);
  };

  const utilizationPercent = day.availableHours > 0
    ? Math.min(100, Math.round((day.scheduledHours / day.availableHours) * 100))
    : 0;

  return (
    <div
      className={`flex flex-col rounded-2xl border transition-all min-w-[280px] max-w-[320px] flex-1 ${
        isToday
          ? 'border-indigo-500/80 bg-indigo-50/20 dark:bg-indigo-950/20 ring-2 ring-indigo-500/20 shadow-md'
          : !day.isWorkingDay
          ? 'border-gray-200/60 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-850/50 opacity-75'
          : day.isOverloaded
          ? 'border-rose-300 dark:border-rose-900/60 bg-white dark:bg-gray-800 shadow-xs'
          : 'border-gray-200 dark:border-gray-700/80 bg-white dark:bg-gray-800 shadow-xs'
      }`}
    >
      {/* Day Column Header */}
      <div className="p-3.5 border-b border-gray-100 dark:border-gray-700/60">
        <div className="flex items-center justify-between mb-1.5">
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-sm text-gray-900 dark:text-gray-100">
              {day.dayName}
            </span>
            {isToday && (
              <span className="px-2 py-0.5 rounded-full bg-indigo-600 text-white text-[10px] font-bold">
                TODAY
              </span>
            )}
          </div>
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {day.date.slice(5)}
          </span>
        </div>

        {/* Load summary & progress */}
        {day.isWorkingDay ? (
          <div>
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-gray-600 dark:text-gray-400 font-medium">
                {day.scheduledHours}h planned / {day.availableHours}h limit
              </span>
              <span
                className={`font-bold ${
                  day.isOverloaded
                    ? 'text-rose-500'
                    : day.scheduledHours > day.effectiveHours
                    ? 'text-amber-500'
                    : 'text-indigo-600 dark:text-indigo-400'
                }`}
              >
                {utilizationPercent}%
              </span>
            </div>

            {/* Utilization Bar */}
            <div className="w-full h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-300 ${
                  day.isOverloaded
                    ? 'bg-rose-500'
                    : day.scheduledHours > day.effectiveHours
                    ? 'bg-amber-500'
                    : 'bg-indigo-600 dark:bg-indigo-500'
                }`}
                style={{ width: `${utilizationPercent}%` }}
              />
            </div>

            {/* Buffer indicator */}
            <div className="flex items-center justify-between text-[11px] text-gray-400 dark:text-gray-500 mt-1.5">
              <span className="flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-emerald-500" />
                Buffer: {day.bufferHours}h reserved
              </span>
              {day.isOverloaded && (
                <span className="flex items-center gap-1 text-rose-500 font-medium">
                  <AlertTriangle className="w-3 h-3" />
                  Overloaded
                </span>
              )}
            </div>
          </div>
        ) : (
          <div className="text-xs text-gray-400 dark:text-gray-500 italic py-1">
            Off day / Weekend
          </div>
        )}
      </div>

      {/* Chunks List */}
      <div className="p-3 space-y-2.5 flex-1 overflow-y-auto max-h-[500px]">
        {day.chunks.length === 0 ? (
          <div className="h-28 flex flex-col items-center justify-center text-center text-gray-400 dark:text-gray-500 text-xs">
            <Clock className="w-5 h-5 mb-1 stroke-1 text-gray-300 dark:text-gray-600" />
            <span>No tasks scheduled</span>
          </div>
        ) : (
          day.chunks.map((chunk, idx) => {
            let priorityDot = 'bg-emerald-500';
            if (chunk.taskPriority === 'High') priorityDot = 'bg-rose-500';
            if (chunk.taskPriority === 'Medium') priorityDot = 'bg-amber-500';

            return (
              <div
                key={chunk.id || idx}
                className="p-3 rounded-xl bg-gray-50 dark:bg-gray-700/50 border border-gray-200/80 dark:border-gray-600/60 hover:border-indigo-400 transition-all shadow-2xs group"
              >
                <div className="flex items-start gap-2.5">
                  <button
                    onClick={() => handleChunkCheck(chunk)}
                    className="mt-0.5 text-gray-400 hover:text-emerald-500 dark:text-gray-400 dark:hover:text-emerald-400 transition-colors flex-shrink-0"
                    title={`Log ${chunk.allocatedHours}h done for this chunk`}
                  >
                    {chunk.isCompleted ? (
                      <CheckCircle className="w-4 h-4 text-emerald-500" />
                    ) : (
                      <Circle className="w-4 h-4" />
                    )}
                  </button>

                  <div className="flex-1 min-w-0">
                    <h5 className="text-xs font-bold text-gray-900 dark:text-gray-100 truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                      {chunk.taskTitle}
                    </h5>

                    <div className="flex items-center gap-1.5 text-[11px] text-gray-500 dark:text-gray-400 mt-1 flex-wrap">
                      <span className="flex items-center gap-1">
                        <span className={`w-1.5 h-1.5 rounded-full ${priorityDot}`} />
                        {chunk.taskPriority}
                      </span>
                      <span>•</span>
                      <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                        {chunk.allocatedHours} hrs
                      </span>
                      {chunk.totalChunks > 1 && (
                        <>
                          <span>•</span>
                          <span className="text-gray-400 dark:text-gray-500">
                            Part {chunk.chunkIndex} of {chunk.totalChunks}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
