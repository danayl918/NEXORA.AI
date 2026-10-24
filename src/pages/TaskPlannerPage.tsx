import React, { useState } from 'react';
import {
  CheckSquare,
  Plus,
  Trash2,
  Edit2,
  Calendar,
  Tag,
  CheckCircle2,
  Clock,
  Sparkles,
  Search,
  Filter,
  Check,
  X,
  ArrowRight,
} from 'lucide-react';
import { Task } from '../types';
import { MarkdownRenderer } from '../utils/markdown';

interface TaskPlannerPageProps {
  tasks: Task[];
  onTasksUpdated: (newTasks: Task[]) => void;
  onLogActivity: (title: string, detail?: string) => void;
}

export const TaskPlannerPage: React.FC<TaskPlannerPageProps> = ({
  tasks,
  onTasksUpdated,
  onLogActivity,
}) => {
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Modal / Form state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [dueDate, setDueDate] = useState('');
  const [category, setCategory] = useState('Development');

  // AI Task Expansion state
  const [expandingTaskId, setExpandingTaskId] = useState<string | null>(null);
  const [aiBreakdown, setAiBreakdown] = useState<{ taskId: string; text: string } | null>(null);

  const categories = ['Development', 'Research', 'Architecture', 'Design', 'General'];

  const filteredTasks = tasks.filter((t) => {
    if (filter === 'pending' && t.completed) return false;
    if (filter === 'completed' && !t.completed) return false;
    if (priorityFilter !== 'all' && t.priority !== priorityFilter) return false;
    if (
      searchQuery &&
      !t.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !t.description?.toLowerCase().includes(searchQuery.toLowerCase())
    ) {
      return false;
    }
    return true;
  });

  const handleOpenNewModal = () => {
    setEditingTaskId(null);
    setTitle('');
    setDescription('');
    setPriority('medium');
    setDueDate('Today');
    setCategory('Development');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (task: Task) => {
    setEditingTaskId(task.id);
    setTitle(task.title);
    setDescription(task.description || '');
    setPriority(task.priority);
    setDueDate(task.dueDate || '');
    setCategory(task.category || 'General');
    setIsModalOpen(true);
  };

  const handleSaveTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    if (editingTaskId) {
      const updated = tasks.map((t) =>
        t.id === editingTaskId
          ? {
              ...t,
              title: title.trim(),
              description: description.trim(),
              priority,
              dueDate: dueDate.trim() || undefined,
              category,
            }
          : t
      );
      onTasksUpdated(updated);
      onLogActivity('Updated Task', title.trim());
    } else {
      const newTask: Task = {
        id: 'task_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 4),
        title: title.trim(),
        description: description.trim(),
        priority,
        dueDate: dueDate.trim() || undefined,
        category,
        completed: false,
        createdAt: new Date().toISOString(),
      };
      onTasksUpdated([newTask, ...tasks]);
      onLogActivity('Created Task', newTask.title);
    }

    setIsModalOpen(false);
  };

  const handleToggleComplete = (id: string) => {
    const target = tasks.find((t) => t.id === id);
    const updated = tasks.map((t) =>
      t.id === id ? { ...t, completed: !t.completed } : t
    );
    onTasksUpdated(updated);
    if (target && !target.completed) {
      onLogActivity('Completed Task', target.title);
    }
  };

  const handleDeleteTask = (id: string) => {
    const target = tasks.find((t) => t.id === id);
    const updated = tasks.filter((t) => t.id !== id);
    onTasksUpdated(updated);
    if (target) {
      onLogActivity('Deleted Task', target.title);
    }
  };

  const handleAiBreakdown = async (task: Task) => {
    setExpandingTaskId(task.id);
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [
            {
              role: 'user',
              content: `Please break down this software engineering task into clear, actionable technical subtasks with acceptance criteria:\n\nTask: "${task.title}"\nDescription: "${task.description || 'None'}"\nPriority: "${task.priority}"`,
            },
          ],
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setAiBreakdown({ taskId: task.id, text: data.text });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setExpandingTaskId(null);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#383838] pb-5">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <CheckSquare className="w-5 h-5 text-[#10A37F]" />
            Task Planner & Execution Tracker
          </h2>
          <p className="text-xs text-[#ACACAC] mt-1">
            Deterministic task management integrated seamlessly with the Primary AI Agent.
          </p>
        </div>

        <button
          onClick={handleOpenNewModal}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#10A37F] hover:bg-[#1A7F64] text-white text-xs font-semibold cursor-pointer shadow-sm transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>New Task</span>
        </button>
      </div>

      {/* Filters & Search Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-xl border border-[#424242] bg-[#2F2F2F]">
        <div className="flex flex-wrap items-center gap-2">
          {/* Status Tabs */}
          {(['all', 'pending', 'completed'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors cursor-pointer ${
                filter === s
                  ? 'bg-[#10A37F] text-white'
                  : 'bg-[#242424] text-[#ACACAC] hover:text-white border border-[#3A3A3A]'
              }`}
            >
              {s}
            </button>
          ))}

          {/* Priority filter */}
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="bg-[#242424] border border-[#3A3A3A] text-xs text-[#ACACAC] rounded-lg px-2.5 py-1.5 focus:border-[#10A37F] focus:outline-none"
          >
            <option value="all">All Priorities</option>
            <option value="high">High Priority</option>
            <option value="medium">Medium Priority</option>
            <option value="low">Low Priority</option>
          </select>
        </div>

        {/* Search Input */}
        <div className="relative flex items-center w-full sm:w-64">
          <Search className="w-3.5 h-3.5 text-[#7E7E7E] absolute left-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search tasks..."
            className="w-full bg-[#202020] border border-[#3A3A3A] focus:border-[#10A37F] text-xs text-white rounded-lg pl-8 pr-3 py-1.5 focus:outline-none"
          />
        </div>
      </div>

      {/* Task List */}
      <div className="space-y-3">
        {filteredTasks.length === 0 ? (
          <div className="p-12 text-center rounded-xl border border-dashed border-[#424242] bg-[#262626]/40 space-y-3">
            <CheckSquare className="w-8 h-8 text-[#7E7E7E] mx-auto" />
            <p className="text-sm text-white font-medium">No tasks found</p>
            <p className="text-xs text-[#ACACAC]">
              {tasks.length === 0
                ? 'Your task list is empty. Add a task or tell the AI agent in Chat to create one.'
                : 'No tasks match the active filters.'}
            </p>
          </div>
        ) : (
          filteredTasks.map((t) => (
            <div
              key={t.id}
              className={`p-4 rounded-xl border transition-all ${
                t.completed
                  ? 'border-[#383838] bg-[#242424]/60 opacity-70'
                  : 'border-[#424242] bg-[#2F2F2F] hover:border-[#525252]'
              }`}
            >
              <div className="flex items-start gap-3.5">
                <input
                  type="checkbox"
                  checked={t.completed}
                  onChange={() => handleToggleComplete(t.id)}
                  className="mt-1 w-4 h-4 rounded text-[#10A37F] focus:ring-0 cursor-pointer accent-[#10A37F]"
                />

                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3
                      className={`text-sm font-semibold ${
                        t.completed ? 'line-through text-[#7E7E7E]' : 'text-white'
                      }`}
                    >
                      {t.title}
                    </h3>

                    <span
                      className={`text-[10px] font-medium px-2 py-0.5 rounded capitalize ${
                        t.priority === 'high'
                          ? 'bg-red-500/15 text-red-400 border border-red-500/30'
                          : t.priority === 'medium'
                          ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                          : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                      }`}
                    >
                      {t.priority}
                    </span>

                    {t.category && (
                      <span className="text-[10px] px-2 py-0.5 rounded bg-[#202020] text-[#ACACAC] border border-[#383838]">
                        {t.category}
                      </span>
                    )}

                    {t.dueDate && (
                      <span className="text-[11px] text-[#8E8E8E] flex items-center gap-1">
                        <Clock className="w-3 h-3 text-[#10A37F]" />
                        {t.dueDate}
                      </span>
                    )}
                  </div>

                  {t.description && (
                    <p className="text-xs text-[#ACACAC] leading-relaxed pt-1">
                      {t.description}
                    </p>
                  )}

                  {/* AI Subtasks View if expanded */}
                  {aiBreakdown && aiBreakdown.taskId === t.id && (
                    <div className="mt-3 p-3.5 rounded-lg bg-[#222222] border border-[#10A37F]/50 text-xs text-[#CCCCCC] space-y-2 animate-in fade-in">
                      <div className="flex items-center justify-between text-[#10A37F] font-semibold">
                        <span className="flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5" />
                          AI Technical Breakdown & Subtasks
                        </span>
                        <button
                          onClick={() => setAiBreakdown(null)}
                          className="text-[#7E7E7E] hover:text-white"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <MarkdownRenderer content={aiBreakdown.text} />
                    </div>
                  )}
                </div>

                {/* Task Actions */}
                <div className="flex items-center gap-1 shrink-0 text-[#8E8E8E]">
                  <button
                    onClick={() => handleAiBreakdown(t)}
                    disabled={expandingTaskId === t.id}
                    className="p-1.5 hover:text-[#10A37F] hover:bg-[#383838] rounded-md transition-colors cursor-pointer"
                    title="Generate technical breakdown with AI"
                  >
                    <Sparkles
                      className={`w-4 h-4 ${
                        expandingTaskId === t.id ? 'animate-spin text-[#10A37F]' : ''
                      }`}
                    />
                  </button>

                  <button
                    onClick={() => handleOpenEditModal(t)}
                    className="p-1.5 hover:text-white hover:bg-[#383838] rounded-md transition-colors cursor-pointer"
                    title="Edit task"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => handleDeleteTask(t.id)}
                    className="p-1.5 hover:text-red-400 hover:bg-[#383838] rounded-md transition-colors cursor-pointer"
                    title="Delete task"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Task Creation / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-md rounded-2xl border border-[#424242] bg-[#2F2F2F] p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#383838] pb-3">
              <h3 className="text-base font-bold text-white">
                {editingTaskId ? 'Edit Workspace Task' : 'Create New Task'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-[#8E8E8E] hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveTask} className="space-y-3.5">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-white block">
                  Task Title *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Implement rate-limiting middleware"
                  className="w-full bg-[#202020] border border-[#424242] focus:border-[#10A37F] rounded-lg px-3 py-2 text-xs text-white focus:outline-none"
                  autoFocus
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-[#ACACAC] block">
                  Description / Sub-notes
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  placeholder="Additional context, links, or technical notes..."
                  className="w-full bg-[#202020] border border-[#424242] focus:border-[#10A37F] rounded-lg px-3 py-2 text-xs text-white focus:outline-none resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[#ACACAC] block">Priority</label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as any)}
                    className="w-full bg-[#202020] border border-[#424242] focus:border-[#10A37F] rounded-lg px-2.5 py-2 text-xs text-white focus:outline-none"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[#ACACAC] block">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-[#202020] border border-[#424242] focus:border-[#10A37F] rounded-lg px-2.5 py-2 text-xs text-white focus:outline-none"
                  >
                    {categories.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-[#ACACAC] block">
                  Due Date / Schedule
                </label>
                <input
                  type="text"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  placeholder="e.g. Today, Tomorrow, or 2026-10-31"
                  className="w-full bg-[#202020] border border-[#424242] focus:border-[#10A37F] rounded-lg px-3 py-2 text-xs text-white focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-[#383838]">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3.5 py-2 rounded-lg bg-[#242424] hover:bg-[#353535] text-xs font-medium text-[#ACACAC] hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-[#10A37F] hover:bg-[#1A7F64] text-xs font-semibold text-white transition-colors shadow-sm"
                >
                  {editingTaskId ? 'Save Changes' : 'Create Task'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
