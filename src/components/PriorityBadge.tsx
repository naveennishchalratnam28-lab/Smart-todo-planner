import React, { useState } from 'react';
import { PriorityLevel } from '../types';
import { Flame, Clock, Sparkles, HelpCircle } from 'lucide-react';

interface PriorityBadgeProps {
  priority: PriorityLevel;
  score?: number;
  reason?: string;
  showScore?: boolean;
}

export const PriorityBadge: React.FC<PriorityBadgeProps> = ({
  priority,
  score,
  reason,
  showScore = true,
}) => {
  const [showTooltip, setShowTooltip] = useState(false);

  let badgeColor = 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800';
  let dotColor = 'bg-emerald-500';

  if (priority === 'High') {
    badgeColor = 'bg-rose-100 text-rose-800 border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800';
    dotColor = 'bg-rose-500';
  } else if (priority === 'Medium') {
    badgeColor = 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800';
    dotColor = 'bg-amber-500';
  }

  return (
    <div className="relative inline-flex items-center gap-1.5">
      <span
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border cursor-help transition-all ${badgeColor}`}
      >
        <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`} />
        <span>{priority}</span>
        {showScore && score !== undefined && (
          <span className="ml-0.5 px-1.5 py-0.2 bg-black/10 dark:bg-white/10 rounded text-[11px] font-mono font-bold">
            {score}
          </span>
        )}
      </span>

      {reason && (
        <button
          type="button"
          onClick={() => setShowTooltip(!showTooltip)}
          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          title={reason}
        >
          <HelpCircle className="w-3.5 h-3.5" />
        </button>
      )}

      {showTooltip && reason && (
        <div className="absolute bottom-full left-0 mb-2 z-30 w-56 p-2.5 bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900 text-xs rounded-lg shadow-xl pointer-events-none transform -translate-x-1 animate-in fade-in zoom-in-95">
          <div className="font-semibold mb-1 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-amber-400 dark:text-amber-600" />
            <span>Why this rank?</span>
          </div>
          <div className="text-gray-200 dark:text-gray-700 leading-snug">{reason}</div>
          <div className="absolute top-full left-4 -mt-1 border-4 border-transparent border-t-gray-900 dark:border-t-gray-100" />
        </div>
      )}
    </div>
  );
};
