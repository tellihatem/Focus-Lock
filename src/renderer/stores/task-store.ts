/**
 * Zustand store for task state management
 * Provides reactive state for tasks across the UI
 */

import { create } from 'zustand';
import { Task, TaskStatus, TaskDifficulty, CreateTaskPayload, UpdateTaskPayload } from '../../shared/types';

/**
 * Task store state interface
 */
interface TaskState {
  tasks: Task[];
  isLoading: boolean;
  error: string | null;
}

/**
 * Task store actions interface
 */
interface TaskActions {
  // CRUD operations
  addTask: (payload: CreateTaskPayload) => void;
  updateTask: (id: string, payload: UpdateTaskPayload) => void;
  deleteTask: (id: string) => void;
  completeTask: (id: string) => void;
  uncompleteTask: (id: string) => void;
  
  // Bulk operations
  setTasks: (tasks: Task[]) => void;
  clearTasks: () => void;
  
  // State management
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  
  // Computed helpers
  getPendingTasks: () => Task[];
  getCompletedTasks: () => Task[];
  getCompletionPercentage: () => number;
  areAllTasksCompleted: () => boolean;
}

/**
 * Combined store type
 */
export type TaskStore = TaskState & TaskActions;

/**
 * Generate unique task ID
 */
const generateTaskId = (): string => {
  return `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Task store instance
 * Manages all task-related state and actions
 */
export const useTaskStore = create<TaskStore>((set, get) => ({
  // Initial state
  tasks: [],
  isLoading: false,
  error: null,

  /**
   * Add a new task to the store
   */
  addTask: (payload: CreateTaskPayload) => {
    const newTask: Task = {
      id: generateTaskId(),
      title: payload.title.trim(),
      description: payload.description || '',
      status: TaskStatus.PENDING,
      difficulty: payload.difficulty,
      createdAt: Date.now(),
      completedAt: null,
      dueDate: payload.dueDate,
    };

    set((state) => ({
      tasks: [newTask, ...state.tasks],
      error: null,
    }));
  },

  /**
   * Update an existing task
   */
  updateTask: (id: string, payload: UpdateTaskPayload) => {
    set((state) => ({
      tasks: state.tasks.map((task) =>
        task.id === id
          ? {
              ...task,
              ...payload,
              completedAt:
                payload.status === TaskStatus.COMPLETED
                  ? Date.now()
                  : payload.status === TaskStatus.PENDING
                  ? null
                  : task.completedAt,
            }
          : task
      ),
      error: null,
    }));
  },

  /**
   * Delete a task from the store
   */
  deleteTask: (id: string) => {
    set((state) => ({
      tasks: state.tasks.filter((task) => task.id !== id),
      error: null,
    }));
  },

  /**
   * Mark a task as completed
   */
  completeTask: (id: string) => {
    get().updateTask(id, { status: TaskStatus.COMPLETED });
  },

  /**
   * Mark a task as pending (uncomplete)
   */
  uncompleteTask: (id: string) => {
    get().updateTask(id, { status: TaskStatus.PENDING });
  },

  /**
   * Set all tasks (for initial load)
   */
  setTasks: (tasks: Task[]) => {
    set({ tasks, error: null });
  },

  /**
   * Clear all tasks
   */
  clearTasks: () => {
    set({ tasks: [], error: null });
  },

  /**
   * Set loading state
   */
  setLoading: (isLoading: boolean) => {
    set({ isLoading });
  },

  /**
   * Set error state
   */
  setError: (error: string | null) => {
    set({ error });
  },

  /**
   * Get all pending tasks
   */
  getPendingTasks: () => {
    return get().tasks.filter((task) => task.status === TaskStatus.PENDING);
  },

  /**
   * Get all completed tasks
   */
  getCompletedTasks: () => {
    return get().tasks.filter((task) => task.status === TaskStatus.COMPLETED);
  },

  /**
   * Calculate completion percentage
   */
  getCompletionPercentage: () => {
    const { tasks } = get();
    if (tasks.length === 0) return 0;
    const completedCount = tasks.filter((t) => t.status === TaskStatus.COMPLETED).length;
    return Math.round((completedCount / tasks.length) * 100);
  },

  /**
   * Check if all tasks are completed
   */
  areAllTasksCompleted: () => {
    const { tasks } = get();
    if (tasks.length === 0) return false;
    return tasks.every((task) => task.status === TaskStatus.COMPLETED);
  },
}));
