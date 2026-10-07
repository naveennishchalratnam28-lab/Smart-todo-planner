import React from 'react';
import { useAuth } from '../context/AuthContext';
import { usePlanner } from '../context/PlannerContext';
import {
  CalendarClock,
  Plus,
  RefreshCw,
  Sun,
  Moon,
  LogOut,
  User,
  Sparkles,
} from 'lucide-react';

interface NavbarProps {
  onOpenTaskModal: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenTaskModal }) => {
  const { user, logout, theme, toggleTheme } = useAuth();
  const { replanSchedule, isReplanning } = usePlanner();

  return (
    <header className="sticky top-0 z-40 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Logo & App Name */}
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-linear-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
            <CalendarClock className="w-5 h-5" />
          </div>
          <div>
            <span className="font-extrabold text-base tracking-tight text-gray-900 dark:text-gray-100 flex items-center gap-1.5">
              SmartPlanner
              <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 font-mono font-bold">
                MERN
              </span>
            </span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Quick Add Task */}
          <button
            onClick={onOpenTaskModal}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">New Task</span>
          </button>

          {/* Quick Replan */}
          <button
            onClick={replanSchedule}
            disabled={isReplanning}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 transition-all border border-gray-200 dark:border-gray-700 disabled:opacity-50"
            title="Recalculate smart daily plan"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isReplanning ? 'animate-spin text-indigo-500' : ''}`} />
            <span className="hidden md:inline">{isReplanning ? 'Planning...' : 'Replan'}</span>
          </button>

          {/* Dark / Light Mode Toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-xl text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          {/* User Menu / Logout */}
          {user && (
            <div className="flex items-center gap-2 pl-2 border-l border-gray-200 dark:border-gray-700">
              <div className="hidden sm:flex flex-col text-right">
                <span className="text-xs font-bold text-gray-900 dark:text-gray-100 truncate max-w-[120px]">
                  {user.name}
                </span>
                <span className="text-[10px] text-gray-400 truncate max-w-[120px]">
                  {user.email}
                </span>
              </div>
              <button
                onClick={logout}
                className="p-2 rounded-xl text-gray-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                title="Logout"
                aria-label="Logout"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
