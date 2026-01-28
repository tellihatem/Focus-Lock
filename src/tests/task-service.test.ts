/**
 * Unit tests for TaskService
 * Tests business logic for task operations
 */

import { TaskService } from '../main/services/task-service';
import { DatabaseManager } from '../main/database/database';
import { TaskStatus, TaskDifficulty } from '../shared/types';

// Mock DatabaseManager
jest.mock('../main/database/database');

describe('TaskService', () => {
  let taskService: TaskService;
  let mockDb: jest.Mocked<DatabaseManager>;

  beforeEach(() => {
    mockDb = new DatabaseManager('/test/db.sqlite') as jest.Mocked<DatabaseManager>;
    taskService = new TaskService(mockDb);
  });

  describe('createTask', () => {
    it('should reject empty title', async () => {
      const result = await taskService.createTask({
        title: '',
        description: 'Test',
        difficulty: TaskDifficulty.MEDIUM,
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('title is required');
    });

    it('should reject title exceeding 255 characters', async () => {
      const longTitle = 'a'.repeat(256);
      const result = await taskService.createTask({
        title: longTitle,
        description: 'Test',
        difficulty: TaskDifficulty.MEDIUM,
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('cannot exceed 255 characters');
    });

    it('should reject description exceeding 2000 characters', async () => {
      const longDescription = 'a'.repeat(2001);
      const result = await taskService.createTask({
        title: 'Test Task',
        description: longDescription,
        difficulty: TaskDifficulty.MEDIUM,
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('cannot exceed 2000 characters');
    });

    it('should reject past due date', async () => {
      const pastDate = Date.now() - 1000;
      const result = await taskService.createTask({
        title: 'Test Task',
        description: 'Test',
        difficulty: TaskDifficulty.MEDIUM,
        dueDate: pastDate,
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('cannot be in the past');
    });

    it('should call database createTask with valid payload', async () => {
      mockDb.createTask = jest.fn().mockResolvedValue({
        success: true,
        data: {
          id: 'task_123',
          title: 'Valid Task',
          description: 'Valid description',
          status: TaskStatus.PENDING,
          difficulty: TaskDifficulty.MEDIUM,
          createdAt: Date.now(),
          completedAt: null,
        },
      });

      const result = await taskService.createTask({
        title: 'Valid Task',
        description: 'Valid description',
        difficulty: TaskDifficulty.MEDIUM,
      });

      expect(result.success).toBe(true);
      expect(mockDb.createTask).toHaveBeenCalled();
    });
  });

  describe('updateTask', () => {
    it('should reject empty task ID', async () => {
      const result = await taskService.updateTask('', { title: 'New Title' });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Task ID is required');
    });

    it('should reject empty title in update', async () => {
      mockDb.getTaskById = jest.fn().mockResolvedValue({
        success: true,
        data: {
          id: 'task_123',
          title: 'Old Title',
          description: 'Test',
          status: TaskStatus.PENDING,
          difficulty: TaskDifficulty.MEDIUM,
          createdAt: Date.now(),
          completedAt: null,
        },
      });

      const result = await taskService.updateTask('task_123', { title: '' });

      expect(result.success).toBe(false);
      expect(result.error).toContain('cannot be empty');
    });
  });

  describe('completeTask', () => {
    it('should update task status to COMPLETED', async () => {
      mockDb.updateTask = jest.fn().mockResolvedValue({
        success: true,
        data: {
          id: 'task_123',
          title: 'Test Task',
          description: 'Test',
          status: TaskStatus.COMPLETED,
          difficulty: TaskDifficulty.MEDIUM,
          createdAt: Date.now(),
          completedAt: Date.now(),
        },
      });

      const result = await taskService.completeTask('task_123');

      expect(result.success).toBe(true);
      expect(mockDb.updateTask).toHaveBeenCalledWith('task_123', { status: TaskStatus.COMPLETED });
    });
  });

  describe('areAllTasksCompleted', () => {
    it('should return true when all tasks are completed', async () => {
      mockDb.getAllTasks = jest.fn().mockResolvedValue({
        success: true,
        data: [
          {
            id: 'task_1',
            title: 'Task 1',
            description: 'Test',
            status: TaskStatus.COMPLETED,
            difficulty: TaskDifficulty.MEDIUM,
            createdAt: Date.now(),
            completedAt: Date.now(),
          },
          {
            id: 'task_2',
            title: 'Task 2',
            description: 'Test',
            status: TaskStatus.COMPLETED,
            difficulty: TaskDifficulty.MEDIUM,
            createdAt: Date.now(),
            completedAt: Date.now(),
          },
        ],
      });

      const result = await taskService.areAllTasksCompleted();

      expect(result).toBe(true);
    });

    it('should return false when any task is pending', async () => {
      mockDb.getAllTasks = jest.fn().mockResolvedValue({
        success: true,
        data: [
          {
            id: 'task_1',
            title: 'Task 1',
            description: 'Test',
            status: TaskStatus.COMPLETED,
            difficulty: TaskDifficulty.MEDIUM,
            createdAt: Date.now(),
            completedAt: Date.now(),
          },
          {
            id: 'task_2',
            title: 'Task 2',
            description: 'Test',
            status: TaskStatus.PENDING,
            difficulty: TaskDifficulty.MEDIUM,
            createdAt: Date.now(),
            completedAt: null,
          },
        ],
      });

      const result = await taskService.areAllTasksCompleted();

      expect(result).toBe(false);
    });
  });

  describe('getCompletionPercentage', () => {
    it('should calculate completion percentage correctly', async () => {
      mockDb.getAllTasks = jest.fn().mockResolvedValue({
        success: true,
        data: [
          {
            id: 'task_1',
            title: 'Task 1',
            description: 'Test',
            status: TaskStatus.COMPLETED,
            difficulty: TaskDifficulty.MEDIUM,
            createdAt: Date.now(),
            completedAt: Date.now(),
          },
          {
            id: 'task_2',
            title: 'Task 2',
            description: 'Test',
            status: TaskStatus.PENDING,
            difficulty: TaskDifficulty.MEDIUM,
            createdAt: Date.now(),
            completedAt: null,
          },
        ],
      });

      const result = await taskService.getCompletionPercentage();

      expect(result).toBe(50);
    });

    it('should return 0 when no tasks exist', async () => {
      mockDb.getAllTasks = jest.fn().mockResolvedValue({
        success: true,
        data: [],
      });

      const result = await taskService.getCompletionPercentage();

      expect(result).toBe(0);
    });
  });
});
