/**
 * useTasks Hook
 * Custom hook for managing task state and operations
 */

import { useState, useCallback } from 'react';
import { Task, TaskStatus, CreateTaskPayload, UpdateTaskPayload } from '../../shared/types';

/**
 * Hook for managing task state and operations
 */
export const useTasks = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Add a new task to the list
   */
  const addTask = useCallback((task: Task) => {
    setTasks((prevTasks) => [task, ...prevTasks]);
  }, []);

  /**
   * Update an existing task in the list
   */
  const updateTask = useCallback((updatedTask: Task) => {
    setTasks((prevTasks) =>
      prevTasks.map((task) => (task.id === updatedTask.id ? updatedTask : task))
    );
  }, []);

  /**
   * Remove a task from the list
   */
  const removeTask = useCallback((taskId: string) => {
    setTasks((prevTasks) => prevTasks.filter((task) => task.id !== taskId));
  }, []);

  /**
   * Set all tasks
   */
  const setAllTasks = useCallback((newTasks: Task[]) => {
    setTasks(newTasks);
  }, []);

  /**
   * Get pending tasks
   */
  const getPendingTasks = useCallback((): Task[] => {
    return tasks.filter((task) => task.status === TaskStatus.PENDING);
  }, [tasks]);

  /**
   * Get completed tasks
   */
  const getCompletedTasks = useCallback((): Task[] => {
    return tasks.filter((task) => task.status === TaskStatus.COMPLETED);
  }, [tasks]);

  /**
   * Get completion percentage
   */
  const getCompletionPercentage = useCallback((): number => {
    if (tasks.length === 0) return 0;
    const completedCount = tasks.filter((task) => task.status === TaskStatus.COMPLETED).length;
    return Math.round((completedCount / tasks.length) * 100);
  }, [tasks]);

  /**
   * Check if all tasks are completed
   */
  const areAllTasksCompleted = useCallback((): boolean => {
    return tasks.length > 0 && tasks.every((task) => task.status === TaskStatus.COMPLETED);
  }, [tasks]);

  return {
    tasks,
    isLoading,
    error,
    setIsLoading,
    setError,
    addTask,
    updateTask,
    removeTask,
    setAllTasks,
    getPendingTasks,
    getCompletedTasks,
    getCompletionPercentage,
    areAllTasksCompleted,
  };
};
