import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { usePlanner } from '../context/PlannerContext';
import {
  Settings,
  Clock,
  Calendar,
  Shield,
  Sparkles,
  Save,
  CheckCircle2,
} from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const { user, updateSettings } = useAuth();
  const { seedDemoData, replanSchedule, showToast } = usePlanner();

  const [dailyHours, setDailyHours] = useState(user?.settings?.dailyHours || 6);
  const [workingDays, setWorkingDays] = useState<number[]>(user?.settings?.workingDays || [1, 2, 3, 4, 5]);
  const [startTime, setStartTime] = useState(user?.settings?.startTime || '09:00');
  const [bufferPercent, setBufferPercent] = useState(user?.settings?.bufferPercent || 15);
  const [saving, setSaving] = useState(false);
  const [seeding, setSeeding] = useState(false);

  const daysList = [
    { day: 0, label: 'Sun' },
    { day: 1, label: 'Mon' },
    { day: 2, label: 'Tue' },
    { day: 3, label: 'Wed' },
    { day: 4, label: 'Thu' },
    { day: 5, label: 'Fri' },
    { day: 6, label: 'Sat' },
  ];

  const toggleDay = (day: number) => {
    if (workingDays.includes(day)) {
      if (workingDays.length === 1) {
        showToast('At least one working day must be selected', 'warning');
        return;
      }
      setWorkingDays(workingDays.filter(d => d !== day));
    } else {
      setWorkingDays([...workingDays, day].sort());
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const res = await updateSettings({
      dailyHours: Number(dailyHours),
      workingDays,
      startTime,
      bufferPercent: Number(bufferPercent),
    });
    setSaving(false);
    if (res.success) {
      showToast('Planner settings saved & schedule updated', 'success');
      await replanSchedule();
    } else {
      showToast(res.message || 'Failed to save settings', 'error');
    }
  };

  const handleSeed = async () => {
    if (window.confirm('Load 9 sample realistic tasks into your planner? (Existing tasks will be cleared)')) {
      setSeeding(true);
      await seedDemoData();
      setSeeding(false);
    }
  };

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h2 className="text-xl sm:text-2xl font-extrabold text-gray-900 dark:text-gray-100 flex items-center gap-2">
          <Settings className="w-6 h-6 text-indigo-600" />
          Planner Algorithm Settings
        </h2>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
          Tune your available capacity, working schedule, and buffer protection
        </p>
      </div>

      <form onSubmit={handleSave} className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-200 dark:border-gray-700/80 shadow-xs space-y-6">
        {/* Daily Working Hours */}
        <div className="space-y-2">
          <label className="text-sm font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <Clock className="w-4 h-4 text-indigo-500" />
            Daily Available Working Hours
          </label>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Total active hours you dedicate to tasks per working day.
          </p>
          <div className="flex items-center gap-3">
            <input
              type="range"
              min="1"
              max="14"
              step="0.5"
              value={dailyHours}
              onChange={(e) => setDailyHours(parseFloat(e.target.value))}
              className="flex-1 accent-indigo-600"
            />
            <span className="w-16 px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-700 text-center font-bold text-sm text-gray-900 dark:text-gray-100">
              {dailyHours}h
            </span>
          </div>
        </div>

        {/* Working Days */}
        <div className="space-y-2 pt-4 border-t border-gray-100 dark:border-gray-700/60">
          <label className="text-sm font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-indigo-500" />
            Active Working Days
          </label>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            The planner algorithm will never schedule tasks onto unchecked off-days.
          </p>
          <div className="flex items-center gap-2 flex-wrap">
            {daysList.map(item => {
              const active = workingDays.includes(item.day);
              return (
                <button
                  key={item.day}
                  type="button"
                  onClick={() => toggleDay(item.day)}
                  className={`w-12 h-11 rounded-xl text-xs font-bold transition-all border ${
                    active
                      ? 'bg-indigo-600 border-indigo-600 text-white shadow-xs'
                      : 'bg-gray-50 dark:bg-gray-700/50 border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:border-gray-300'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Daily Start Time */}
        <div className="space-y-2 pt-4 border-t border-gray-100 dark:border-gray-700/60">
          <label className="text-sm font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <Clock className="w-4 h-4 text-indigo-500" />
            Typical Working Start Time
          </label>
          <input
            type="time"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            className="px-3.5 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-gray-100 font-medium"
          />
        </div>

        {/* Buffer Protection Percentage */}
        <div className="space-y-2 pt-4 border-t border-gray-100 dark:border-gray-700/60">
          <label className="text-sm font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <Shield className="w-4 h-4 text-emerald-500" />
            Emergency Buffer Time ({bufferPercent}%)
          </label>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Percentage of daily available hours held in reserve to absorb delays and urgent fires without deadline slips.
          </p>
          <div className="flex items-center gap-3">
            <input
              type="range"
              min="0"
              max="40"
              step="5"
              value={bufferPercent}
              onChange={(e) => setBufferPercent(parseInt(e.target.value, 10))}
              className="flex-1 accent-emerald-600"
            />
            <span className="w-16 px-3 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-center font-bold text-sm">
              {bufferPercent}%
            </span>
          </div>
        </div>

        {/* Save button */}
        <div className="pt-4 border-t border-gray-100 dark:border-gray-700 flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs transition-all disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Saving...' : 'Save Settings'}</span>
          </button>
        </div>
      </form>

      {/* Demo Seed Section */}
      <div className="bg-linear-to-br from-indigo-50 to-purple-50 dark:from-indigo-950/40 dark:to-purple-950/40 p-6 rounded-2xl border border-indigo-100 dark:border-indigo-900/60 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-bold text-indigo-950 dark:text-indigo-200 flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-amber-500" />
            Reset & Load Realistic Demo Tasks
          </h3>
          <p className="text-xs text-indigo-700 dark:text-indigo-300 mt-1 max-w-md">
            Loads 9 realistic sample tasks (large engineering project, tax filing, security audit, presentation deck) to explore prioritization and daily chunking.
          </p>
        </div>

        <button
          onClick={handleSeed}
          disabled={seeding}
          className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold whitespace-nowrap shadow-xs transition-all disabled:opacity-50"
        >
          {seeding ? 'Loading Dataset...' : 'Seed Sample Tasks'}
        </button>
      </div>
    </div>
  );
};
