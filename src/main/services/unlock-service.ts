/**
 * Unlock Service
 * Manages the unlock logic between tasks and Focus Mode
 * Automatically disables Focus Mode when all tasks are completed
 */

import { Task, TaskStatus } from '../../shared/types';

/**
 * Unlock condition result
 */
export interface UnlockConditionResult {
  canUnlock: boolean;
  completedTasks: number;
  totalTasks: number;
  completionPercentage: number;
  remainingTasks: number;
}

/**
 * Unlock notification payload
 */
export interface UnlockNotification {
  type: 'full_unlock' | 'partial_unlock' | 'progress_update';
  message: string;
  completedTasks: number;
  totalTasks: number;
  xpEarned?: number;
}

/**
 * Unlock service configuration
 */
export interface UnlockServiceConfig {
  autoUnlockOnComplete: boolean;
  showNotifications: boolean;
  partialUnlockThresholds: number[]; // e.g., [50, 75] for 50% and 75%
}

/**
 * Default configuration
 */
const DEFAULT_CONFIG: UnlockServiceConfig = {
  autoUnlockOnComplete: true,
  showNotifications: true,
  partialUnlockThresholds: [50, 75],
};

/**
 * Unlock Service class
 * Evaluates unlock conditions and manages Focus Mode state transitions
 */
export class UnlockService {
  private config: UnlockServiceConfig;
  private onUnlockCallback: ((notification: UnlockNotification) => void) | null = null;
  private previousCompletionPercentage: number = 0;
  private notifiedThresholds: Set<number> = new Set();

  /**
   * Initialize unlock service with optional configuration
   */
  constructor(config: Partial<UnlockServiceConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Evaluate unlock conditions based on task list
   */
  evaluateUnlockCondition(tasks: Task[]): UnlockConditionResult {
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter((t) => t.status === TaskStatus.COMPLETED).length;
    const completionPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
    const remainingTasks = totalTasks - completedTasks;

    return {
      canUnlock: totalTasks > 0 && completedTasks === totalTasks,
      completedTasks,
      totalTasks,
      completionPercentage,
      remainingTasks,
    };
  }

  /**
   * Check if all tasks are completed
   */
  areAllTasksCompleted(tasks: Task[]): boolean {
    if (tasks.length === 0) return false;
    return tasks.every((task) => task.status === TaskStatus.COMPLETED);
  }

  /**
   * Check if a partial unlock threshold has been reached
   */
  checkPartialUnlockThreshold(tasks: Task[]): number | null {
    const { completionPercentage } = this.evaluateUnlockCondition(tasks);

    for (const threshold of this.config.partialUnlockThresholds) {
      if (
        completionPercentage >= threshold &&
        this.previousCompletionPercentage < threshold &&
        !this.notifiedThresholds.has(threshold)
      ) {
        this.notifiedThresholds.add(threshold);
        return threshold;
      }
    }

    return null;
  }

  /**
   * Process task completion and check for unlock conditions
   * Returns an UnlockNotification if unlock/threshold is reached
   */
  processTaskCompletion(tasks: Task[]): UnlockNotification | null {
    const condition = this.evaluateUnlockCondition(tasks);

    // Check for full unlock
    if (condition.canUnlock) {
      const notification: UnlockNotification = {
        type: 'full_unlock',
        message: 'All tasks completed! Focus Mode unlocked.',
        completedTasks: condition.completedTasks,
        totalTasks: condition.totalTasks,
        xpEarned: this.calculateXPEarned(tasks),
      };

      if (this.onUnlockCallback) {
        this.onUnlockCallback(notification);
      }

      this.previousCompletionPercentage = condition.completionPercentage;
      return notification;
    }

    // Check for partial unlock threshold
    const reachedThreshold = this.checkPartialUnlockThreshold(tasks);
    if (reachedThreshold !== null) {
      const notification: UnlockNotification = {
        type: 'partial_unlock',
        message: `${reachedThreshold}% complete! Keep going!`,
        completedTasks: condition.completedTasks,
        totalTasks: condition.totalTasks,
      };

      if (this.onUnlockCallback) {
        this.onUnlockCallback(notification);
      }

      this.previousCompletionPercentage = condition.completionPercentage;
      return notification;
    }

    // Progress update without threshold
    if (condition.completionPercentage !== this.previousCompletionPercentage) {
      this.previousCompletionPercentage = condition.completionPercentage;

      return {
        type: 'progress_update',
        message: `${condition.completedTasks}/${condition.totalTasks} tasks completed`,
        completedTasks: condition.completedTasks,
        totalTasks: condition.totalTasks,
      };
    }

    return null;
  }

  /**
   * Calculate XP earned from completed tasks
   * Basic calculation: 100 XP base + difficulty bonus
   */
  calculateXPEarned(tasks: Task[]): number {
    const completedTasks = tasks.filter((t) => t.status === TaskStatus.COMPLETED);
    let totalXP = 0;

    for (const task of completedTasks) {
      let baseXP = 100;

      // Difficulty multiplier
      switch (task.difficulty) {
        case 'easy':
          baseXP *= 0.75;
          break;
        case 'medium':
          baseXP *= 1.0;
          break;
        case 'hard':
          baseXP *= 1.5;
          break;
      }

      totalXP += Math.round(baseXP);
    }

    return totalXP;
  }

  /**
   * Set callback for unlock notifications
   */
  setUnlockCallback(callback: (notification: UnlockNotification) => void): void {
    this.onUnlockCallback = callback;
  }

  /**
   * Clear unlock callback
   */
  clearUnlockCallback(): void {
    this.onUnlockCallback = null;
  }

  /**
   * Reset tracking state (call when Focus Mode starts)
   */
  resetTracking(): void {
    this.previousCompletionPercentage = 0;
    this.notifiedThresholds.clear();
  }

  /**
   * Get current configuration
   */
  getConfig(): UnlockServiceConfig {
    return { ...this.config };
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<UnlockServiceConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Check if auto-unlock is enabled
   */
  isAutoUnlockEnabled(): boolean {
    return this.config.autoUnlockOnComplete;
  }

  /**
   * Get time estimate to complete remaining tasks
   * Assumes average task takes 15 minutes
   */
  getEstimatedTimeRemaining(tasks: Task[]): number {
    const remainingTasks = tasks.filter((t) => t.status !== TaskStatus.COMPLETED).length;
    const avgTaskMinutes = 15;
    return remainingTasks * avgTaskMinutes * 60 * 1000; // Return in milliseconds
  }

  /**
   * Format time remaining as string
   */
  formatTimeRemaining(tasks: Task[]): string {
    const ms = this.getEstimatedTimeRemaining(tasks);
    const minutes = Math.round(ms / 60000);

    if (minutes < 60) {
      return `~${minutes}m`;
    }

    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `~${hours}h ${remainingMinutes}m`;
  }
}

/**
 * Singleton instance
 */
let unlockServiceInstance: UnlockService | null = null;

/**
 * Get or create the unlock service instance
 */
export function getUnlockService(config?: Partial<UnlockServiceConfig>): UnlockService {
  if (!unlockServiceInstance) {
    unlockServiceInstance = new UnlockService(config);
  }
  return unlockServiceInstance;
}

/**
 * Reset the unlock service instance (for testing)
 */
export function resetUnlockService(): void {
  if (unlockServiceInstance) {
    unlockServiceInstance.clearUnlockCallback();
    unlockServiceInstance = null;
  }
}
