/**
 * Unit tests for UnlockService
 * Tests unlock logic and task completion tracking
 */

import { UnlockService, resetUnlockService } from '../main/services/unlock-service';
import { Task, TaskStatus, TaskDifficulty } from '../shared/types';

describe('UnlockService', () => {
  let service: UnlockService;

  // Helper to create test tasks
  const createTask = (
    id: string,
    status: TaskStatus = TaskStatus.PENDING,
    difficulty: TaskDifficulty = TaskDifficulty.MEDIUM
  ): Task => ({
    id,
    title: `Task ${id}`,
    description: '',
    status,
    difficulty,
    createdAt: Date.now(),
    completedAt: status === TaskStatus.COMPLETED ? Date.now() : null,
  });

  beforeEach(() => {
    resetUnlockService();
    service = new UnlockService();
  });

  describe('evaluateUnlockCondition', () => {
    it('should return canUnlock true when all tasks completed', () => {
      const tasks = [
        createTask('1', TaskStatus.COMPLETED),
        createTask('2', TaskStatus.COMPLETED),
      ];

      const result = service.evaluateUnlockCondition(tasks);

      expect(result.canUnlock).toBe(true);
      expect(result.completedTasks).toBe(2);
      expect(result.totalTasks).toBe(2);
      expect(result.completionPercentage).toBe(100);
      expect(result.remainingTasks).toBe(0);
    });

    it('should return canUnlock false when some tasks pending', () => {
      const tasks = [
        createTask('1', TaskStatus.COMPLETED),
        createTask('2', TaskStatus.PENDING),
      ];

      const result = service.evaluateUnlockCondition(tasks);

      expect(result.canUnlock).toBe(false);
      expect(result.completedTasks).toBe(1);
      expect(result.completionPercentage).toBe(50);
      expect(result.remainingTasks).toBe(1);
    });

    it('should return canUnlock false when no tasks exist', () => {
      const result = service.evaluateUnlockCondition([]);

      expect(result.canUnlock).toBe(false);
      expect(result.completionPercentage).toBe(0);
    });

    it('should calculate completion percentage correctly', () => {
      const tasks = [
        createTask('1', TaskStatus.COMPLETED),
        createTask('2', TaskStatus.COMPLETED),
        createTask('3', TaskStatus.PENDING),
        createTask('4', TaskStatus.PENDING),
      ];

      const result = service.evaluateUnlockCondition(tasks);

      expect(result.completionPercentage).toBe(50);
    });
  });

  describe('areAllTasksCompleted', () => {
    it('should return true when all tasks completed', () => {
      const tasks = [
        createTask('1', TaskStatus.COMPLETED),
        createTask('2', TaskStatus.COMPLETED),
      ];

      expect(service.areAllTasksCompleted(tasks)).toBe(true);
    });

    it('should return false when any task pending', () => {
      const tasks = [
        createTask('1', TaskStatus.COMPLETED),
        createTask('2', TaskStatus.PENDING),
      ];

      expect(service.areAllTasksCompleted(tasks)).toBe(false);
    });

    it('should return false when no tasks', () => {
      expect(service.areAllTasksCompleted([])).toBe(false);
    });
  });

  describe('processTaskCompletion', () => {
    it('should return full_unlock notification when all tasks completed', () => {
      const tasks = [
        createTask('1', TaskStatus.COMPLETED),
        createTask('2', TaskStatus.COMPLETED),
      ];

      const notification = service.processTaskCompletion(tasks);

      expect(notification).not.toBeNull();
      expect(notification?.type).toBe('full_unlock');
      expect(notification?.xpEarned).toBeDefined();
    });

    it('should return partial_unlock notification at 50% threshold', () => {
      // First call with 0% complete
      service.processTaskCompletion([
        createTask('1', TaskStatus.PENDING),
        createTask('2', TaskStatus.PENDING),
      ]);

      // Second call with 50% complete
      const tasks = [
        createTask('1', TaskStatus.COMPLETED),
        createTask('2', TaskStatus.PENDING),
      ];

      const notification = service.processTaskCompletion(tasks);

      expect(notification).not.toBeNull();
      expect(notification?.type).toBe('partial_unlock');
      expect(notification?.message).toContain('50%');
    });

    it('should return progress_update for regular progress', () => {
      // First call establishes baseline
      service.processTaskCompletion([
        createTask('1', TaskStatus.PENDING),
        createTask('2', TaskStatus.PENDING),
        createTask('3', TaskStatus.PENDING),
        createTask('4', TaskStatus.PENDING),
      ]);

      // Second call with 25% complete (below 50% threshold)
      const tasks = [
        createTask('1', TaskStatus.COMPLETED),
        createTask('2', TaskStatus.PENDING),
        createTask('3', TaskStatus.PENDING),
        createTask('4', TaskStatus.PENDING),
      ];

      const notification = service.processTaskCompletion(tasks);

      expect(notification).not.toBeNull();
      expect(notification?.type).toBe('progress_update');
    });

    it('should call unlock callback when set', () => {
      const callback = jest.fn();
      service.setUnlockCallback(callback);

      const tasks = [createTask('1', TaskStatus.COMPLETED)];
      service.processTaskCompletion(tasks);

      expect(callback).toHaveBeenCalled();
    });

    it('should not notify same threshold twice', () => {
      // Get to 50%
      service.processTaskCompletion([
        createTask('1', TaskStatus.PENDING),
        createTask('2', TaskStatus.PENDING),
      ]);
      const first = service.processTaskCompletion([
        createTask('1', TaskStatus.COMPLETED),
        createTask('2', TaskStatus.PENDING),
      ]);

      // Call again at 50%
      const second = service.processTaskCompletion([
        createTask('1', TaskStatus.COMPLETED),
        createTask('2', TaskStatus.PENDING),
      ]);

      expect(first?.type).toBe('partial_unlock');
      expect(second).toBeNull(); // No notification for same state
    });
  });

  describe('calculateXPEarned', () => {
    it('should calculate base XP for medium tasks', () => {
      const tasks = [createTask('1', TaskStatus.COMPLETED, TaskDifficulty.MEDIUM)];

      const xp = service.calculateXPEarned(tasks);

      expect(xp).toBe(100);
    });

    it('should apply 0.75x multiplier for easy tasks', () => {
      const tasks = [createTask('1', TaskStatus.COMPLETED, TaskDifficulty.EASY)];

      const xp = service.calculateXPEarned(tasks);

      expect(xp).toBe(75);
    });

    it('should apply 1.5x multiplier for hard tasks', () => {
      const tasks = [createTask('1', TaskStatus.COMPLETED, TaskDifficulty.HARD)];

      const xp = service.calculateXPEarned(tasks);

      expect(xp).toBe(150);
    });

    it('should sum XP from multiple completed tasks', () => {
      const tasks = [
        createTask('1', TaskStatus.COMPLETED, TaskDifficulty.EASY),
        createTask('2', TaskStatus.COMPLETED, TaskDifficulty.MEDIUM),
        createTask('3', TaskStatus.COMPLETED, TaskDifficulty.HARD),
      ];

      const xp = service.calculateXPEarned(tasks);

      expect(xp).toBe(75 + 100 + 150);
    });

    it('should only count completed tasks', () => {
      const tasks = [
        createTask('1', TaskStatus.COMPLETED, TaskDifficulty.MEDIUM),
        createTask('2', TaskStatus.PENDING, TaskDifficulty.MEDIUM),
      ];

      const xp = service.calculateXPEarned(tasks);

      expect(xp).toBe(100);
    });
  });

  describe('resetTracking', () => {
    it('should reset completion percentage', () => {
      // Advance to 50%
      service.processTaskCompletion([
        createTask('1', TaskStatus.COMPLETED),
        createTask('2', TaskStatus.PENDING),
      ]);

      service.resetTracking();

      // Should be able to trigger 50% notification again
      service.processTaskCompletion([
        createTask('1', TaskStatus.PENDING),
        createTask('2', TaskStatus.PENDING),
      ]);
      const notification = service.processTaskCompletion([
        createTask('1', TaskStatus.COMPLETED),
        createTask('2', TaskStatus.PENDING),
      ]);

      expect(notification?.type).toBe('partial_unlock');
    });
  });

  describe('getEstimatedTimeRemaining', () => {
    it('should estimate time based on remaining tasks', () => {
      const tasks = [
        createTask('1', TaskStatus.PENDING),
        createTask('2', TaskStatus.PENDING),
      ];

      const estimate = service.getEstimatedTimeRemaining(tasks);

      // 2 tasks * 15 minutes * 60 seconds * 1000 ms
      expect(estimate).toBe(2 * 15 * 60 * 1000);
    });

    it('should return 0 for no remaining tasks', () => {
      const tasks = [createTask('1', TaskStatus.COMPLETED)];

      const estimate = service.getEstimatedTimeRemaining(tasks);

      expect(estimate).toBe(0);
    });
  });

  describe('formatTimeRemaining', () => {
    it('should format time in minutes when under 1 hour', () => {
      const tasks = [
        createTask('1', TaskStatus.PENDING),
        createTask('2', TaskStatus.PENDING),
      ];

      const formatted = service.formatTimeRemaining(tasks);

      expect(formatted).toBe('~30m');
    });

    it('should format time in hours and minutes', () => {
      const tasks = Array.from({ length: 8 }, (_, i) =>
        createTask(`${i}`, TaskStatus.PENDING)
      );

      const formatted = service.formatTimeRemaining(tasks);

      expect(formatted).toBe('~2h 0m');
    });
  });

  describe('configuration', () => {
    it('should use default config', () => {
      const config = service.getConfig();

      expect(config.autoUnlockOnComplete).toBe(true);
      expect(config.showNotifications).toBe(true);
      expect(config.partialUnlockThresholds).toEqual([50, 75]);
    });

    it('should accept custom config', () => {
      const customService = new UnlockService({
        autoUnlockOnComplete: false,
        partialUnlockThresholds: [25, 50, 75],
      });

      const config = customService.getConfig();

      expect(config.autoUnlockOnComplete).toBe(false);
      expect(config.partialUnlockThresholds).toEqual([25, 50, 75]);
    });

    it('should update config', () => {
      service.updateConfig({ autoUnlockOnComplete: false });

      expect(service.isAutoUnlockEnabled()).toBe(false);
    });
  });

  describe('callback management', () => {
    it('should set and clear callback', () => {
      const callback = jest.fn();

      service.setUnlockCallback(callback);
      service.processTaskCompletion([createTask('1', TaskStatus.COMPLETED)]);

      expect(callback).toHaveBeenCalled();

      callback.mockClear();
      service.clearUnlockCallback();
      service.resetTracking();
      service.processTaskCompletion([createTask('1', TaskStatus.COMPLETED)]);

      expect(callback).not.toHaveBeenCalled();
    });
  });
});
