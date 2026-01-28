/**
 * Shared type definitions for the Focus-Lock application
 * Used across both main process and renderer process
 */

/**
 * Task status enumeration
 */
export enum TaskStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

/**
 * Task difficulty level for XP calculation
 */
export enum TaskDifficulty {
  EASY = 'easy',
  MEDIUM = 'medium',
  HARD = 'hard',
}

/**
 * Core Task interface representing a productivity task
 */
export interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  difficulty: TaskDifficulty;
  createdAt: number; // Unix timestamp
  completedAt: number | null; // Unix timestamp or null if not completed
  dueDate?: number; // Optional due date as Unix timestamp
}

/**
 * Task creation payload (without id and timestamps)
 */
export interface CreateTaskPayload {
  title: string;
  description: string;
  difficulty: TaskDifficulty;
  dueDate?: number;
}

/**
 * Task update payload (partial update)
 */
export interface UpdateTaskPayload {
  title?: string;
  description?: string;
  status?: TaskStatus;
  difficulty?: TaskDifficulty;
  dueDate?: number;
}

/**
 * Database operation result
 */
export interface OperationResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Sticky note color options
 */
export enum StickyNoteColor {
  YELLOW = 'yellow',
  BLUE = 'blue',
  GREEN = 'green',
  PINK = 'pink',
  PURPLE = 'purple',
  ORANGE = 'orange',
}

/**
 * Sticky note position and size
 */
export interface StickyNotePosition {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Sticky note interface
 */
export interface StickyNote {
  id: string;
  taskId: string | null; // Optional link to a task
  content: string;
  color: StickyNoteColor;
  position: StickyNotePosition;
  isAlwaysOnTop: boolean;
  isMinimized: boolean;
  createdAt: number;
  updatedAt: number;
}

/**
 * Sticky note creation payload
 */
export interface CreateStickyNotePayload {
  taskId?: string;
  content?: string;
  color?: StickyNoteColor;
  position?: Partial<StickyNotePosition>;
}

/**
 * Sticky note update payload
 */
export interface UpdateStickyNotePayload {
  taskId?: string | null;
  content?: string;
  color?: StickyNoteColor;
  position?: Partial<StickyNotePosition>;
  isAlwaysOnTop?: boolean;
  isMinimized?: boolean;
}

/**
 * Focus Mode state interface
 */
export interface FocusModeState {
  isActive: boolean;
  startedAt: number | null;
  totalFocusTime: number; // Total accumulated focus time in milliseconds
  currentSessionTime: number; // Current session time in milliseconds
  lastUpdatedAt: number | null;
}

/**
 * Restricted application configuration
 */
export interface RestrictedApp {
  id: string;
  name: string;
  executableName: string; // e.g., "steam.exe"
  path?: string; // Optional full path
  isEnabled: boolean;
  isPreset: boolean; // Built-in preset vs user-added
}

/**
 * Focus session record for history
 */
export interface FocusSession {
  id: string;
  startedAt: number;
  endedAt: number;
  duration: number; // in milliseconds
  tasksCompleted: number;
  wasUnlockedNaturally: boolean; // true if all tasks completed
}
