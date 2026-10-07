import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import confetti from 'canvas-confetti';
import api from '../services/api';
import { useAuth } from './AuthContext';
import { ITask, IPlanSchedule, PriorityLevel, TaskStatus, ParsedTaskInput } from '../types';

interface ToastItem {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  message: string;
}

interface FilterState {
  status: string;
  priority: string;
  category: string;
  search: string;
  sortBy: string;
}

interface PlannerContextType {
  tasks: ITask[];
  schedule: IPlanSchedule | null;
  loadingTasks: boolean;
  loadingSchedule: boolean;
  isReplanning: boolean;
  filters: FilterState;
  toasts: ToastItem[];
  setFilters: React.Dispatch<React.SetStateAction<FilterState>>;
  fetchTasks: () => Promise<void>;
  fetchSchedule: () => Promise<void>;
  createTask: (data: Partial<ITask>) => Promise<boolean>;
  updateTask: (id: string, data: Partial<ITask>) => Promise<boolean>;
  deleteTask: (id: string) => Promise<boolean>;
  bulkUpdateTasks: (ids: string[], updates: Partial<ITask>) => Promise<boolean>;
  bulkDeleteTasks: (ids: string[]) => Promise<boolean>;
  logTaskProgress: (taskId: string, hoursLogged: number, markDone?: boolean) => Promise<boolean>;
  replanSchedule: () => Promise<void>;
  seedDemoData: () => Promise<void>;
  parseNaturalLanguage: (text: string) => Promise<ParsedTaskInput | null>;
  showToast: (message: string, type?: ToastItem['type']) => void;
  removeToast: (id: string) => void;
}

const PlannerContext = createContext<PlannerContextType | undefined>(undefined);

export const PlannerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, token } = useAuth();
  const [tasks, setTasks] = useState<ITask[]>([]);
  const [schedule, setSchedule] = useState<IPlanSchedule | null>(null);
  const [loadingTasks, setLoadingTasks] = useState<boolean>(false);
  const [loadingSchedule, setLoadingSchedule] = useState<boolean>(false);
  const [isReplanning, setIsReplanning] = useState<boolean>(false);
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const [filters, setFilters] = useState<FilterState>({
    status: 'all',
    priority: 'all',
    category: 'all',
    search: '',
    sortBy: 'score', // 'score' | 'deadline' | 'effort' | 'title'
  });

  const showToast = useCallback((message: string, type: ToastItem['type'] = 'info') => {
    const id = Date.now().toString() + Math.random().toString(36).substring(2, 6);
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const fetchTasks = useCallback(async () => {
    if (!token) return;
    setLoadingTasks(true);
    try {
      const params = new URLSearchParams();
      if (filters.status !== 'all') params.append('status', filters.status);
      if (filters.priority !== 'all') params.append('priority', filters.priority);
      if (filters.category !== 'all') params.append('category', filters.category);
      if (filters.search) params.append('search', filters.search);
      if (filters.sortBy) params.append('sortBy', filters.sortBy);

      const res = await api.get(`/tasks?${params.toString()}`);
      if (res.data.success) {
        setTasks(res.data.tasks);
      }
    } catch (err: any) {
      console.error('Error fetching tasks:', err);
      showToast('Could not load tasks', 'error');
    } finally {
      setLoadingTasks(false);
    }
  }, [token, filters, showToast]);

  const fetchSchedule = useCallback(async () => {
    if (!token) return;
    setLoadingSchedule(true);
    try {
      const res = await api.get('/planner/schedule');
      if (res.data.success) {
        setSchedule(res.data.schedule);
      }
    } catch (err: any) {
      console.error('Error fetching schedule:', err);
      showToast('Could not generate schedule', 'error');
    } finally {
      setLoadingSchedule(false);
    }
  }, [token, showToast]);

  // Initial data load when logged in
  useEffect(() => {
    if (token && user) {
      fetchTasks();
      fetchSchedule();
    } else {
      setTasks([]);
      setSchedule(null);
    }
  }, [token, user?.settings?.dailyHours, user?.settings?.workingDays, filters]);

  const replanSchedule = async () => {
    setIsReplanning(true);
    try {
      await fetchSchedule();
      showToast('Schedule re-optimized with current priorities!', 'success');
    } catch (err) {
      showToast('Failed to re-plan schedule', 'error');
    } finally {
      setTimeout(() => setIsReplanning(false), 500);
    }
  };

  const createTask = async (data: Partial<ITask>): Promise<boolean> => {
    try {
      const res = await api.post('/tasks', data);
      if (res.data.success) {
        showToast('Task added to your plan', 'success');
        await fetchTasks();
        await fetchSchedule();
        return true;
      }
      return false;
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to create task', 'error');
      return false;
    }
  };

  const updateTask = async (id: string, data: Partial<ITask>): Promise<boolean> => {
    try {
      const res = await api.put(`/tasks/${id}`, data);
      if (res.data.success) {
        showToast('Task updated', 'success');
        if (data.status === 'Done') {
          confetti({
            particleCount: 80,
            spread: 60,
            origin: { y: 0.7 },
          });
        }
        await fetchTasks();
        await fetchSchedule();
        return true;
      }
      return false;
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to update task', 'error');
      return false;
    }
  };

  const deleteTask = async (id: string): Promise<boolean> => {
    try {
      const res = await api.delete(`/tasks/${id}`);
      if (res.data.success) {
        showToast('Task removed', 'info');
        await fetchTasks();
        await fetchSchedule();
        return true;
      }
      return false;
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to delete task', 'error');
      return false;
    }
  };

  const bulkUpdateTasks = async (ids: string[], updates: Partial<ITask>): Promise<boolean> => {
    try {
      const res = await api.put('/tasks/bulk', { taskIds: ids, updates });
      if (res.data.success) {
        showToast(`Updated ${ids.length} tasks`, 'success');
        if (updates.status === 'Done') {
          confetti({ particleCount: 100, spread: 80, origin: { y: 0.6 } });
        }
        await fetchTasks();
        await fetchSchedule();
        return true;
      }
      return false;
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Bulk update failed', 'error');
      return false;
    }
  };

  const bulkDeleteTasks = async (ids: string[]): Promise<boolean> => {
    try {
      const res = await api.delete('/tasks/bulk', { data: { taskIds: ids } });
      if (res.data.success) {
        showToast(`Deleted ${ids.length} tasks`, 'info');
        await fetchTasks();
        await fetchSchedule();
        return true;
      }
      return false;
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Bulk delete failed', 'error');
      return false;
    }
  };

  const logTaskProgress = async (taskId: string, hoursLogged: number, markDone = false): Promise<boolean> => {
    try {
      const res = await api.post('/planner/progress', { taskId, hoursLogged, markDone });
      if (res.data.success) {
        showToast(`Logged ${hoursLogged}h progress`, 'success');
        if (markDone || res.data.task?.status === 'Done') {
          confetti({
            particleCount: 90,
            spread: 70,
            origin: { y: 0.65 },
          });
        }
        await fetchTasks();
        await fetchSchedule();
        return true;
      }
      return false;
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to log progress', 'error');
      return false;
    }
  };

  const seedDemoData = async (): Promise<void> => {
    try {
      const res = await api.post('/planner/seed');
      if (res.data.success) {
        showToast('Sample realistic tasks successfully loaded!', 'success');
        await fetchTasks();
        await fetchSchedule();
      }
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to seed sample tasks', 'error');
    }
  };

  const parseNaturalLanguage = async (text: string): Promise<ParsedTaskInput | null> => {
    try {
      const res = await api.post('/tasks/parse', { text });
      if (res.data.success) {
        return res.data.parsed;
      }
      return null;
    } catch (err) {
      return null;
    }
  };

  return (
    <PlannerContext.Provider
      value={{
        tasks,
        schedule,
        loadingTasks,
        loadingSchedule,
        isReplanning,
        filters,
        toasts,
        setFilters,
        fetchTasks,
        fetchSchedule,
        createTask,
        updateTask,
        deleteTask,
        bulkUpdateTasks,
        bulkDeleteTasks,
        logTaskProgress,
        replanSchedule,
        seedDemoData,
        parseNaturalLanguage,
        showToast,
        removeToast,
      }}
    >
      {children}
    </PlannerContext.Provider>
  );
};

export const usePlanner = () => {
  const context = useContext(PlannerContext);
  if (!context) {
    throw new Error('usePlanner must be used within a PlannerProvider');
  }
  return context;
};
