import React, { useState, useEffect } from 'react';
import { ITask, PriorityLevel, TaskStatus, ParsedTaskInput } from '../types';
import { usePlanner } from '../context/PlannerContext';
import {
  X,
  Sparkles,
  Sliders,
  Calendar,
  Clock,
  Tag,
  AlertCircle,
  CheckCircle,
} from 'lucide-react';

interface TaskFormProps {
  isOpen: boolean;
  onClose: () => void;
  taskToEdit?: ITask | null;
}

export const TaskForm: React.FC<TaskFormProps> = ({
  isOpen,
  onClose,
  taskToEdit,
}) => {
  const { createTask, updateTask, parseNaturalLanguage } = usePlanner();

  // Mode: 'nl' (Natural Language) vs 'manual'
  const [tab, setTab] = useState<'nl' | 'manual'>(taskToEdit ? 'manual' : 'nl');

  // Natural language input state
  const [nlText, setNlText] = useState('');
  const [parsedPreview, setParsedPreview] = useState<ParsedTaskInput | null>(null);
  const [isParsing, setIsParsing] = useState(false);

  // Manual form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<PriorityLevel>('Medium');
  const [deadline, setDeadline] = useState('');
  const [estimatedEffort, setEstimatedEffort] = useState<number>(2);
  const [category, setCategory] = useState('General');
  const [status, setStatus] = useState<TaskStatus>('Pending');
  const [hoursCompleted, setHoursCompleted] = useState<number>(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Format date for datetime-local input
  const formatForInput = (isoDate?: string) => {
    if (!isoDate) {
      const d = new Date();
      d.setDate(d.getDate() + 2);
      d.setHours(17, 0, 0, 0);
      return d.toISOString().slice(0, 16);
    }
    const d = new Date(isoDate);
    const tzOffset = d.getTimezoneOffset() * 60000;
    const localISOTime = new Date(d.getTime() - tzOffset).toISOString().slice(0, 16);
    return localISOTime;
  };

  useEffect(() => {
    if (taskToEdit) {
      setTab('manual');
      setTitle(taskToEdit.title);
      setDescription(taskToEdit.description || '');
      setPriority(taskToEdit.priority);
      setDeadline(formatForInput(taskToEdit.deadline));
      setEstimatedEffort(taskToEdit.estimatedEffort);
      setCategory(taskToEdit.category || 'General');
      setStatus(taskToEdit.status);
      setHoursCompleted(taskToEdit.hoursCompleted || 0);
    } else {
      setTab('nl');
      setTitle('');
      setDescription('');
      setPriority('Medium');
      setDeadline(formatForInput());
      setEstimatedEffort(2);
      setCategory('Work');
      setStatus('Pending');
      setHoursCompleted(0);
      setNlText('');
      setParsedPreview(null);
    }
    setError(null);
  }, [taskToEdit, isOpen]);

  // Live parsing with debounce
  useEffect(() => {
    if (tab !== 'nl' || !nlText.trim()) {
      setParsedPreview(null);
      return;
    }

    const timer = setTimeout(async () => {
      setIsParsing(true);
      const parsed = await parseNaturalLanguage(nlText);
      setParsedPreview(parsed);
      setIsParsing(false);
    }, 300);

    return () => clearTimeout(timer);
  }, [nlText, tab, parseNaturalLanguage]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    let finalTitle = title.trim();
    let finalDeadline = deadline;
    let finalEffort = estimatedEffort;
    let finalPriority = priority;
    let finalCategory = category.trim();

    if (tab === 'nl') {
      if (!parsedPreview || !parsedPreview.title) {
        setError('Please enter a descriptive task sentence.');
        return;
      }
      finalTitle = parsedPreview.title;
      finalDeadline = parsedPreview.deadline ? formatForInput(parsedPreview.deadline) : formatForInput();
      finalEffort = parsedPreview.estimatedEffort || 1;
      finalPriority = parsedPreview.priority || 'Medium';
      finalCategory = parsedPreview.category || 'General';
    }

    if (!finalTitle) {
      setError('Task title is required.');
      return;
    }

    if (!finalDeadline) {
      setError('Please specify a valid deadline.');
      return;
    }

    setSubmitting(true);
    try {
      const payload: Partial<ITask> = {
        title: finalTitle,
        description: description.trim(),
        priority: finalPriority,
        deadline: new Date(finalDeadline).toISOString(),
        estimatedEffort: Number(finalEffort),
        category: finalCategory || 'General',
        status,
        hoursCompleted: Number(hoursCompleted),
      };

      let ok = false;
      if (taskToEdit) {
        ok = await updateTask(taskToEdit._id, payload);
      } else {
        ok = await createTask(payload);
      }

      if (ok) {
        onClose();
      }
    } catch (err: any) {
      setError(err.message || 'Failed to save task.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleApplyParsedToManual = () => {
    if (parsedPreview) {
      setTitle(parsedPreview.title);
      if (parsedPreview.deadline) setDeadline(formatForInput(parsedPreview.deadline));
      if (parsedPreview.estimatedEffort) setEstimatedEffort(parsedPreview.estimatedEffort);
      if (parsedPreview.priority) setPriority(parsedPreview.priority);
      if (parsedPreview.category) setCategory(parsedPreview.category);
      setTab('manual');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-lg w-full border border-gray-200 dark:border-gray-700 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
              {taskToEdit ? 'Edit Task' : 'Add New Task'}
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {taskToEdit ? 'Update task details and effort tracking' : 'Add to your backlog and plan'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switch for new tasks */}
        {!taskToEdit && (
          <div className="px-5 pt-3 flex gap-2 border-b border-gray-100 dark:border-gray-700">
            <button
              type="button"
              onClick={() => setTab('nl')}
              className={`pb-2.5 px-3 text-xs font-semibold flex items-center gap-1.5 border-b-2 transition-all ${
                tab === 'nl'
                  ? 'border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
              <span>Natural Language Quick Add</span>
            </button>
            <button
              type="button"
              onClick={() => setTab('manual')}
              className={`pb-2.5 px-3 text-xs font-semibold flex items-center gap-1.5 border-b-2 transition-all ${
                tab === 'manual'
                  ? 'border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Full Details</span>
            </button>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {tab === 'nl' ? (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                  Type your task naturally:
                </label>
                <textarea
                  value={nlText}
                  onChange={(e) => setNlText(e.target.value)}
                  placeholder="e.g. Finish quarterly finance report by Friday 5pm, 3.5 hours, high priority #finance"
                  rows={3}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700/60 text-gray-900 dark:text-gray-100 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  autoFocus
                />
                <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1">
                  Chrono AI parses deadlines, priority (high/medium/low), effort (e.g. 2h, 45m), and tags (#work).
                </p>
              </div>

              {/* Parsed Preview Card */}
              {parsedPreview && (
                <div className="p-3.5 rounded-xl border border-indigo-100 dark:border-indigo-900/60 bg-indigo-50/50 dark:bg-indigo-950/30 space-y-2">
                  <div className="flex items-center justify-between text-xs font-semibold text-indigo-900 dark:text-indigo-300">
                    <span className="flex items-center gap-1.5">
                      <CheckCircle className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                      Parsed Task Preview
                    </span>
                    <button
                      type="button"
                      onClick={handleApplyParsedToManual}
                      className="text-[11px] text-indigo-600 dark:text-indigo-400 hover:underline"
                    >
                      Customize in Details &rarr;
                    </button>
                  </div>

                  <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                    {parsedPreview.title}
                  </div>

                  <div className="flex items-center gap-2 flex-wrap text-xs text-gray-600 dark:text-gray-400 pt-1">
                    <span className="px-2 py-0.5 rounded-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 font-medium">
                      Priority: {parsedPreview.priority}
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 font-medium">
                      Effort: {parsedPreview.estimatedEffort}h
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 font-medium">
                      Tag: #{parsedPreview.category}
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 font-medium">
                      Due: {parsedPreview.deadline ? new Date(parsedPreview.deadline).toLocaleString() : 'Tomorrow'}
                    </span>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Task Title *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Prepare API Architecture documentation"
                  className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700/60 text-gray-900 dark:text-gray-100 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Description (Optional)
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Additional context or notes..."
                  rows={2}
                  className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700/60 text-gray-900 dark:text-gray-100 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Priority
                  </label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as PriorityLevel)}
                    className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700/60 text-gray-900 dark:text-gray-100 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  >
                    <option value="High">High (Score weight 35)</option>
                    <option value="Medium">Medium (Score weight 20)</option>
                    <option value="Low">Low (Score weight 10)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Category
                  </label>
                  <input
                    type="text"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    placeholder="Work, Study, Personal..."
                    className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700/60 text-gray-900 dark:text-gray-100 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  >
                  </input>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Deadline (Date & Time) *
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700/60 text-gray-900 dark:text-gray-100 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Estimated Effort (Hours) *
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    min="0.1"
                    max="100"
                    required
                    value={estimatedEffort}
                    onChange={(e) => setEstimatedEffort(parseFloat(e.target.value) || 0.5)}
                    className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700/60 text-gray-900 dark:text-gray-100 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Status
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as TaskStatus)}
                    className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700/60 text-gray-900 dark:text-gray-100 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  >
                    <option value="Pending">Pending</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Done">Done</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Hours Already Completed
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    max={estimatedEffort}
                    value={hoursCompleted}
                    onChange={(e) => setHoursCompleted(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700/60 text-gray-900 dark:text-gray-100 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Footer actions */}
          <div className="pt-3 border-t border-gray-100 dark:border-gray-700 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold rounded-xl text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 text-xs font-semibold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm transition-all disabled:opacity-50"
            >
              {submitting ? 'Saving...' : taskToEdit ? 'Save Changes' : 'Create Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
