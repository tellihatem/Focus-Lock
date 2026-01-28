/**
 * Database manager for SQLite operations
 * Handles all task-related database operations with proper error handling
 */

import sqlite3 from 'sqlite3';
import { TASKS_TABLE_SCHEMA, METADATA_TABLE_SCHEMA, INIT_METADATA } from './schema';
import { Task, TaskStatus, CreateTaskPayload, UpdateTaskPayload, OperationResult } from '../../shared/types';

/**
 * Database manager class
 * Provides CRUD operations for tasks with transaction support
 */
export class DatabaseManager {
  private db: sqlite3.Database | null = null;
  private dbPath: string;

  /**
   * Initialize database manager with file path
   * @param dbPath - Path to SQLite database file
   */
  constructor(dbPath: string) {
    this.dbPath = dbPath;
  }

  /**
   * Initialize database connection and create tables
   * @returns Promise resolving when database is ready
   */
  async initialize(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.db = new sqlite3.Database(this.dbPath, (err: Error | null) => {
        if (err) {
          reject(new Error(`Failed to open database: ${err.message}`));
          return;
        }

        // Enable foreign keys and WAL mode for better concurrency
        this.db!.run('PRAGMA foreign_keys = ON');
        this.db!.run('PRAGMA journal_mode = WAL');

        // Create tables
        this.db!.exec(TASKS_TABLE_SCHEMA, (err: Error | null) => {
          if (err) {
            reject(new Error(`Failed to create tasks table: ${err.message}`));
            return;
          }

          this.db!.exec(METADATA_TABLE_SCHEMA, (err: Error | null) => {
            if (err) {
              reject(new Error(`Failed to create metadata table: ${err.message}`));
              return;
            }

            this.db!.exec(INIT_METADATA, (err: Error | null) => {
              if (err) {
                reject(new Error(`Failed to initialize metadata: ${err.message}`));
                return;
              }

              resolve();
            });
          });
        });
      });
    });
  }

  /**
   * Close database connection
   * @returns Promise resolving when database is closed
   */
  async close(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        resolve();
        return;
      }

      this.db.close((err: Error | null) => {
        if (err) {
          reject(new Error(`Failed to close database: ${err.message}`));
        } else {
          this.db = null;
          resolve();
        }
      });
    });
  }

  /**
   * Create a new task
   * @param payload - Task creation data
   * @returns Promise with created task or error
   */
  async createTask(payload: CreateTaskPayload): Promise<OperationResult<Task>> {
    if (!this.db) {
      return { success: false, error: 'Database not initialized' };
    }

    try {
      // Validate input
      if (!payload.title || payload.title.trim().length === 0) {
        return { success: false, error: 'Task title cannot be empty' };
      }

      const id = this.generateId();
      const now = Date.now();
      const task: Task = {
        id,
        title: payload.title.trim(),
        description: payload.description || '',
        status: TaskStatus.PENDING,
        difficulty: payload.difficulty,
        createdAt: now,
        completedAt: null,
        dueDate: payload.dueDate,
      };

      return new Promise((resolve) => {
        const sql = `
          INSERT INTO tasks (id, title, description, status, difficulty, created_at, completed_at, due_date, created_at_index)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        this.db!.run(
          sql,
          [
            task.id,
            task.title,
            task.description,
            task.status,
            task.difficulty,
            task.createdAt,
            task.completedAt,
            task.dueDate || null,
            task.createdAt,
          ],
          function (this: any, err: Error | null) {
            if (err) {
              resolve({ success: false, error: `Failed to create task: ${err.message}` });
            } else {
              resolve({ success: true, data: task });
            }
          }
        );
      });
    } catch (err) {
      return { success: false, error: `Unexpected error: ${err instanceof Error ? err.message : 'Unknown'}` };
    }
  }

  /**
   * Get all tasks
   * @returns Promise with array of tasks or error
   */
  async getAllTasks(): Promise<OperationResult<Task[]>> {
    if (!this.db) {
      return { success: false, error: 'Database not initialized' };
    }

    return new Promise((resolve) => {
      const sql = 'SELECT * FROM tasks ORDER BY created_at DESC';

      this.db!.all(sql, (err: Error | null, rows: any[]) => {
        if (err) {
          resolve({ success: false, error: `Failed to fetch tasks: ${err.message}` });
        } else {
          const tasks = rows.map((row: any) => this.rowToTask(row));
          resolve({ success: true, data: tasks });
        }
      });
    });
  }

  /**
   * Get task by ID
   * @param id - Task ID
   * @returns Promise with task or error
   */
  async getTaskById(id: string): Promise<OperationResult<Task>> {
    if (!this.db) {
      return { success: false, error: 'Database not initialized' };
    }

    return new Promise((resolve) => {
      const sql = 'SELECT * FROM tasks WHERE id = ?';

      this.db!.get(sql, [id], (err: Error | null, row: any) => {
        if (err) {
          resolve({ success: false, error: `Failed to fetch task: ${err.message}` });
        } else if (!row) {
          resolve({ success: false, error: 'Task not found' });
        } else {
          resolve({ success: true, data: this.rowToTask(row) });
        }
      });
    });
  }

  /**
   * Update task
   * @param id - Task ID
   * @param payload - Partial task update data
   * @returns Promise with updated task or error
   */
  async updateTask(id: string, payload: UpdateTaskPayload): Promise<OperationResult<Task>> {
    if (!this.db) {
      return { success: false, error: 'Database not initialized' };
    }

    try {
      // Fetch current task first
      const currentResult = await this.getTaskById(id);
      if (!currentResult.success || !currentResult.data) {
        return { success: false, error: 'Task not found' };
      }

      const currentTask = currentResult.data;
      const completedAt = payload.status === TaskStatus.COMPLETED ? Date.now() : currentTask.completedAt;

      return new Promise((resolve) => {
        const sql = `
          UPDATE tasks 
          SET title = ?, description = ?, status = ?, difficulty = ?, completed_at = ?, due_date = ?
          WHERE id = ?
        `;

        this.db!.run(
          sql,
          [
            payload.title ?? currentTask.title,
            payload.description ?? currentTask.description,
            payload.status ?? currentTask.status,
            payload.difficulty ?? currentTask.difficulty,
            completedAt,
            payload.dueDate ?? currentTask.dueDate,
            id,
          ],
          async (err: Error | null) => {
            if (err) {
              resolve({ success: false, error: `Failed to update task: ${err.message}` });
            } else {
              const result = await this.getTaskById(id);
              resolve(result);
            }
          }
        );
      });
    } catch (err) {
      return { success: false, error: `Unexpected error: ${err instanceof Error ? err.message : 'Unknown'}` };
    }
  }

  /**
   * Delete task
   * @param id - Task ID
   * @returns Promise with success status or error
   */
  async deleteTask(id: string): Promise<OperationResult<void>> {
    if (!this.db) {
      return { success: false, error: 'Database not initialized' };
    }

    return new Promise((resolve) => {
      const sql = 'DELETE FROM tasks WHERE id = ?';

      this.db!.run(sql, [id], function (this: any, err: Error | null) {
        if (err) {
          resolve({ success: false, error: `Failed to delete task: ${err.message}` });
        } else if (this.changes === 0) {
          resolve({ success: false, error: 'Task not found' });
        } else {
          resolve({ success: true });
        }
      });
    });
  }

  /**
   * Get tasks by status
   * @param status - Task status to filter by
   * @returns Promise with filtered tasks or error
   */
  async getTasksByStatus(status: TaskStatus): Promise<OperationResult<Task[]>> {
    if (!this.db) {
      return { success: false, error: 'Database not initialized' };
    }

    return new Promise((resolve) => {
      const sql = 'SELECT * FROM tasks WHERE status = ? ORDER BY created_at DESC';

      this.db!.all(sql, [status], (err: Error | null, rows: any[]) => {
        if (err) {
          resolve({ success: false, error: `Failed to fetch tasks: ${err.message}` });
        } else {
          const tasks = rows.map((row: any) => this.rowToTask(row));
          resolve({ success: true, data: tasks });
        }
      });
    });
  }

  /**
   * Convert database row to Task object
   * @param row - Database row
   * @returns Task object
   */
  private rowToTask(row: any): Task {
    return {
      id: row.id,
      title: row.title,
      description: row.description,
      status: row.status as TaskStatus,
      difficulty: row.difficulty,
      createdAt: row.created_at,
      completedAt: row.completed_at,
      dueDate: row.due_date,
    };
  }

  /**
   * Generate unique ID for task
   * @returns Unique ID string
   */
  private generateId(): string {
    return `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
