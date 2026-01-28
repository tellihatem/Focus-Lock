/**
 * Task service layer
 * Provides business logic for task operations with validation and error handling
 */

import { DatabaseManager } from '../database/database';
import { Task, TaskStatus, CreateTaskPayload, UpdateTaskPayload, OperationResult } from '../../shared/types';

/**
 * Task service class
 * Handles task-related business logic and database interactions
 */
export class TaskService {
  private db: DatabaseManager;

  /**
   * Initialize task service with database manager
   * @param db - Database manager instance
   */
  constructor(db: DatabaseManager) {
    this.db = db;
  }

  /**
   * Create a new task with validation
   * @param payload - Task creation data
   * @returns Promise with created task or error
   */
  async createTask(payload: CreateTaskPayload): Promise<OperationResult<Task>> {
    // Validate title
    if (!payload.title || payload.title.trim().length === 0) {
      return { success: false, error: 'Task title is required' };
    }

    if (payload.title.length > 255) {
      return { success: false, error: 'Task title cannot exceed 255 characters' };
    }

    // Validate description
    if (payload.description && payload.description.length > 2000) {
      return { success: false, error: 'Task description cannot exceed 2000 characters' };
    }

    // Validate due date if provided
    if (payload.dueDate && payload.dueDate < Date.now()) {
      return { success: false, error: 'Due date cannot be in the past' };
    }

    return this.db.createTask(payload);
  }

  /**
   * Get all tasks
   * @returns Promise with array of tasks or error
   */
  async getAllTasks(): Promise<OperationResult<Task[]>> {
    return this.db.getAllTasks();
  }

  /**
   * Get task by ID
   * @param id - Task ID
   * @returns Promise with task or error
   */
  async getTaskById(id: string): Promise<OperationResult<Task>> {
    if (!id || id.trim().length === 0) {
      return { success: false, error: 'Task ID is required' };
    }

    return this.db.getTaskById(id);
  }

  /**
   * Update task with validation
   * @param id - Task ID
   * @param payload - Partial task update data
   * @returns Promise with updated task or error
   */
  async updateTask(id: string, payload: UpdateTaskPayload): Promise<OperationResult<Task>> {
    if (!id || id.trim().length === 0) {
      return { success: false, error: 'Task ID is required' };
    }

    // Validate title if provided
    if (payload.title !== undefined) {
      if (payload.title.trim().length === 0) {
        return { success: false, error: 'Task title cannot be empty' };
      }

      if (payload.title.length > 255) {
        return { success: false, error: 'Task title cannot exceed 255 characters' };
      }
    }

    // Validate description if provided
    if (payload.description !== undefined && payload.description.length > 2000) {
      return { success: false, error: 'Task description cannot exceed 2000 characters' };
    }

    // Validate due date if provided
    if (payload.dueDate !== undefined && payload.dueDate < Date.now()) {
      return { success: false, error: 'Due date cannot be in the past' };
    }

    return this.db.updateTask(id, payload);
  }

  /**
   * Mark task as completed
   * @param id - Task ID
   * @returns Promise with updated task or error
   */
  async completeTask(id: string): Promise<OperationResult<Task>> {
    return this.updateTask(id, { status: TaskStatus.COMPLETED });
  }

  /**
   * Delete task
   * @param id - Task ID
   * @returns Promise with success status or error
   */
  async deleteTask(id: string): Promise<OperationResult<void>> {
    if (!id || id.trim().length === 0) {
      return { success: false, error: 'Task ID is required' };
    }

    return this.db.deleteTask(id);
  }

  /**
   * Get pending tasks
   * @returns Promise with array of pending tasks or error
   */
  async getPendingTasks(): Promise<OperationResult<Task[]>> {
    return this.db.getTasksByStatus(TaskStatus.PENDING);
  }

  /**
   * Get completed tasks
   * @returns Promise with array of completed tasks or error
   */
  async getCompletedTasks(): Promise<OperationResult<Task[]>> {
    return this.db.getTasksByStatus(TaskStatus.COMPLETED);
  }

  /**
   * Check if all tasks are completed
   * @returns Promise with boolean indicating if all tasks are completed
   */
  async areAllTasksCompleted(): Promise<boolean> {
    const result = await this.db.getAllTasks();
    if (!result.success || !result.data) {
      return false;
    }

    return result.data.every((task) => task.status === TaskStatus.COMPLETED);
  }

  /**
   * Get task completion percentage
   * @returns Promise with completion percentage (0-100)
   */
  async getCompletionPercentage(): Promise<number> {
    const result = await this.db.getAllTasks();
    if (!result.success || !result.data || result.data.length === 0) {
      return 0;
    }

    const completedCount = result.data.filter((task: Task) => task.status === TaskStatus.COMPLETED).length;
    return Math.round((completedCount / result.data.length) * 100);
  }
}
