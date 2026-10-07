import React from 'react';
import {
  LayoutDashboard,
  CalendarDays,
  CheckSquare,
  Settings,
  Sparkles,
  AlertTriangle,
} from 'lucide-react';
import { usePlanner } from '../context/PlannerContext';

interface SidebarProps {
  currentTab: 'dashboard' | 'planner' | 'tasks' | 'settings';
  onTabChange: (tab: 'dashboard' | 'planner' | 'tasks' | 'settings') => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentTab, onTabChange }) => {
  const { tasks, schedule } = usePlanner();

  const overdueCount = tasks.filter(
    t => t.status !== 'Done' && new Date(t.deadline).getTime() < Date.now()
  ).length;

  const pendingCount = tasks.filter(t => t.status !== 'Done').length;

  const navItems = [
    {
      id: 'dashboard' as const,
      label: 'Dashboard',
      icon: LayoutDashboard,
      badge: null,
    },
    {
      id: 'planner' as const,
      label: 'Daily Planner',
      icon: CalendarDays,
      badge: schedule?.warnings?.length ? `${schedule.warnings.length} alerts` : null,
      badgeColor: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300',
    },
    {
      id: 'tasks' as const,
      label: 'Tasks & Matrix',
      icon: CheckSquare,
      badge: overdueCount > 0 ? `${overdueCount} overdue` : `${pendingCount}`,
      badgeColor: overdueCount > 0 ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300' : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
    },
    {
      id: 'settings' as const,
      label: 'Settings',
      icon: Settings,
      badge: null,
    },
  ];

  return (
    <aside className="w-full md:w-64 flex-shrink-0 flex md:flex-col bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 p-3 sm:p-4 gap-1">
      {navItems.map(item => {
        const Icon = item.icon;
        const isActive = currentTab === item.id;

        return (
          <button
            key={item.id}
            onClick={() => onTabChange(item.id)}
            className={`flex-1 md:flex-none flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
              isActive
                ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-bold'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-800/60'
            }`}
          >
            <div className="flex items-center gap-3">
              <Icon className={`w-4 h-4 sm:w-5 sm:h-5 ${isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-400'}`} />
              <span className="hidden sm:inline">{item.label}</span>
            </div>

            {item.badge && (
              <span
                className={`hidden md:inline-block px-2 py-0.5 rounded-full text-[11px] font-bold ${
                  item.badgeColor || 'bg-gray-100 text-gray-700'
                }`}
              >
                {item.badge}
              </span>
            )}
          </button>
        );
      })}

      {/* Quick info card at bottom of desktop sidebar */}
      <div className="hidden md:block mt-auto pt-4 border-t border-gray-100 dark:border-gray-800">
        <div className="p-3 rounded-xl bg-linear-to-br from-indigo-50 to-purple-50 dark:from-indigo-950/40 dark:to-purple-950/40 border border-indigo-100 dark:border-indigo-900/40">
          <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-900 dark:text-indigo-200 mb-1">
            <Sparkles className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
            <span>Smart Engine</span>
          </div>
          <p className="text-[11px] text-indigo-700 dark:text-indigo-300 leading-snug">
            Autonomous effort chunking and 20% emergency buffer protection active.
          </p>
        </div>
      </div>
    </aside>
  );
};
