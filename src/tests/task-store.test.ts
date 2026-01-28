/**
 * Unit tests for TaskStore (Zustand)
 * Tests state management for tasks in the UI layer
 */

import { useTaskStore } from '../renderer/stores/task-store';
import { TaskStatus, TaskDifficulty } from '../shared/types';

describe('TaskStore', () => {
  // Reset store before each test
  beforeEach(() => {
    useTaskStore.getState().clearTasks();
    useTaskStore.getState().setError(null);
    useTaskStore.getState().setLoading(false);
  });

  describe('addTask', () => {
    it('should add a new task with correct properties', () => {
      const { addTask } = useTaskStore.getState();

      addTask({
        title: 'Test Task',
        description: 'Test Description',
        difficulty: TaskDifficulty.MEDIUM,
      });

      const { tasks } = useTaskStore.getState();
      expect(tasks).toHaveLength(1);
      expect(tasks[0].title).toBe('Test Task');
      expect(tasks[0].description).toBe('Test Description');
      expect(tasks[0].status).toBe(TaskStatus.PENDING);
      expect(tasks[0].difficulty).toBe(TaskDifficulty.MEDIUM);
      expect(tasks[0].completedAt).toBeNull();
    });

    it('should generate unique IDs for tasks', () => {
      const { addTask } = useTaskStore.getState();

      addTask({ title: 'Task 1', description: '', difficulty: TaskDifficulty.EASY });
      addTask({ title: 'Task 2', description: '', difficulty: TaskDifficulty.EASY });

      const { tasks } = useTaskStore.getState();
      expect(tasks[0].id).not.toBe(tasks[1].id);
    });

    it('should trim whitespace from title', () => {
      const { addTask } = useTaskStore.getState();

      addTask({ title: '  Trimmed Title  ', description: '', difficulty: TaskDifficulty.EASY });

      const { tasks } = useTaskStore.getState();
      expect(tasks[0].title).toBe('Trimmed Title');
    });

    it('should add new tasks to the beginning of the list', () => {
      const { addTask } = useTaskStore.getState();

      addTask({ title: 'First Task', description: '', difficulty: TaskDifficulty.EASY });
      addTask({ title: 'Second Task', description: '', difficulty: TaskDifficulty.EASY });

      const { tasks } = useTaskStore.getState();
      expect(tasks[0].title).toBe('Second Task');
      expect(tasks[1].title).toBe('First Task');
    });
  });

  describe('updateTask', () => {
    it('should update task title', () => {
      const { addTask, updateTask } = useTaskStore.getState();

      addTask({ title: 'Original', description: '', difficulty: TaskDifficulty.EASY });
      const taskId = useTaskStore.getState().tasks[0].id;

      updateTask(taskId, { title: 'Updated' });

      const { tasks } = useTaskStore.getState();
      expect(tasks[0].title).toBe('Updated');
    });

    it('should set completedAt when status changes to COMPLETED', () => {
      const { addTask, updateTask } = useTaskStore.getState();

      addTask({ title: 'Test', description: '', difficulty: TaskDifficulty.EASY });
      const taskId = useTaskStore.getState().tasks[0].id;

      updateTask(taskId, { status: TaskStatus.COMPLETED });

      const { tasks } = useTaskStore.getState();
      expect(tasks[0].status).toBe(TaskStatus.COMPLETED);
      expect(tasks[0].completedAt).not.toBeNull();
    });

    it('should clear completedAt when status changes to PENDING', () => {
      const { addTask, updateTask } = useTaskStore.getState();

      addTask({ title: 'Test', description: '', difficulty: TaskDifficulty.EASY });
      const taskId = useTaskStore.getState().tasks[0].id;

      updateTask(taskId, { status: TaskStatus.COMPLETED });
      updateTask(taskId, { status: TaskStatus.PENDING });

      const { tasks } = useTaskStore.getState();
      expect(tasks[0].status).toBe(TaskStatus.PENDING);
      expect(tasks[0].completedAt).toBeNull();
    });
  });

  describe('deleteTask', () => {
    it('should remove task from store', () => {
      const { addTask, deleteTask } = useTaskStore.getState();

      addTask({ title: 'To Delete', description: '', difficulty: TaskDifficulty.EASY });
      const taskId = useTaskStore.getState().tasks[0].id;

      deleteTask(taskId);

      const { tasks } = useTaskStore.getState();
      expect(tasks).toHaveLength(0);
    });

    it('should not affect other tasks', () => {
      const { addTask, deleteTask } = useTaskStore.getState();

      addTask({ title: 'Keep', description: '', difficulty: TaskDifficulty.EASY });
      addTask({ title: 'Delete', description: '', difficulty: TaskDifficulty.EASY });

      const taskToDelete = useTaskStore.getState().tasks[0].id;
      deleteTask(taskToDelete);

      const { tasks } = useTaskStore.getState();
      expect(tasks).toHaveLength(1);
      expect(tasks[0].title).toBe('Keep');
    });
  });

  describe('completeTask / uncompleteTask', () => {
    it('should mark task as completed', () => {
      const { addTask, completeTask } = useTaskStore.getState();

      addTask({ title: 'Test', description: '', difficulty: TaskDifficulty.EASY });
      const taskId = useTaskStore.getState().tasks[0].id;

      completeTask(taskId);

      const { tasks } = useTaskStore.getState();
      expect(tasks[0].status).toBe(TaskStatus.COMPLETED);
    });

    it('should mark task as pending (uncomplete)', () => {
      const { addTask, completeTask, uncompleteTask } = useTaskStore.getState();

      addTask({ title: 'Test', description: '', difficulty: TaskDifficulty.EASY });
      const taskId = useTaskStore.getState().tasks[0].id;

      completeTask(taskId);
      uncompleteTask(taskId);

      const { tasks } = useTaskStore.getState();
      expect(tasks[0].status).toBe(TaskStatus.PENDING);
    });
  });

  describe('getPendingTasks / getCompletedTasks', () => {
    it('should return only pending tasks', () => {
      const { addTask, completeTask, getPendingTasks } = useTaskStore.getState();

      addTask({ title: 'Pending 1', description: '', difficulty: TaskDifficulty.EASY });
      addTask({ title: 'Pending 2', description: '', difficulty: TaskDifficulty.EASY });
      addTask({ title: 'Completed', description: '', difficulty: TaskDifficulty.EASY });

      const completedTaskId = useTaskStore.getState().tasks[0].id;
      completeTask(completedTaskId);

      const pending = useTaskStore.getState().getPendingTasks();
      expect(pending).toHaveLength(2);
    });

    it('should return only completed tasks', () => {
      const { addTask, completeTask, getCompletedTasks } = useTaskStore.getState();

      addTask({ title: 'Pending', description: '', difficulty: TaskDifficulty.EASY });
      addTask({ title: 'Completed', description: '', difficulty: TaskDifficulty.EASY });

      const taskToComplete = useTaskStore.getState().tasks[0].id;
      completeTask(taskToComplete);

      const completed = useTaskStore.getState().getCompletedTasks();
      expect(completed).toHaveLength(1);
      expect(completed[0].title).toBe('Completed');
    });
  });

  describe('getCompletionPercentage', () => {
    it('should return 0 when no tasks exist', () => {
      const { getCompletionPercentage } = useTaskStore.getState();
      expect(getCompletionPercentage()).toBe(0);
    });

    it('should return 50 when half tasks are completed', () => {
      const { addTask, completeTask, getCompletionPercentage } = useTaskStore.getState();

      addTask({ title: 'Task 1', description: '', difficulty: TaskDifficulty.EASY });
      addTask({ title: 'Task 2', description: '', difficulty: TaskDifficulty.EASY });

      const taskToComplete = useTaskStore.getState().tasks[0].id;
      completeTask(taskToComplete);

      expect(useTaskStore.getState().getCompletionPercentage()).toBe(50);
    });

    it('should return 100 when all tasks are completed', () => {
      const { addTask, completeTask, getCompletionPercentage } = useTaskStore.getState();

      addTask({ title: 'Task 1', description: '', difficulty: TaskDifficulty.EASY });
      const taskId = useTaskStore.getState().tasks[0].id;
      completeTask(taskId);

      expect(useTaskStore.getState().getCompletionPercentage()).toBe(100);
    });
  });

  describe('areAllTasksCompleted', () => {
    it('should return false when no tasks exist', () => {
      const { areAllTasksCompleted } = useTaskStore.getState();
      expect(areAllTasksCompleted()).toBe(false);
    });

    it('should return false when some tasks are pending', () => {
      const { addTask, completeTask, areAllTasksCompleted } = useTaskStore.getState();

      addTask({ title: 'Task 1', description: '', difficulty: TaskDifficulty.EASY });
      addTask({ title: 'Task 2', description: '', difficulty: TaskDifficulty.EASY });

      const taskToComplete = useTaskStore.getState().tasks[0].id;
      completeTask(taskToComplete);

      expect(useTaskStore.getState().areAllTasksCompleted()).toBe(false);
    });

    it('should return true when all tasks are completed', () => {
      const { addTask, completeTask, areAllTasksCompleted } = useTaskStore.getState();

      addTask({ title: 'Task 1', description: '', difficulty: TaskDifficulty.EASY });
      addTask({ title: 'Task 2', description: '', difficulty: TaskDifficulty.EASY });

      const tasks = useTaskStore.getState().tasks;
      completeTask(tasks[0].id);
      completeTask(tasks[1].id);

      expect(useTaskStore.getState().areAllTasksCompleted()).toBe(true);
    });
  });

  describe('setTasks / clearTasks', () => {
    it('should set tasks from external source', () => {
      const { setTasks } = useTaskStore.getState();

      setTasks([
        {
          id: 'ext_1',
          title: 'External Task',
          description: '',
          status: TaskStatus.PENDING,
          difficulty: TaskDifficulty.EASY,
          createdAt: Date.now(),
          completedAt: null,
        },
      ]);

      const { tasks } = useTaskStore.getState();
      expect(tasks).toHaveLength(1);
      expect(tasks[0].id).toBe('ext_1');
    });

    it('should clear all tasks', () => {
      const { addTask, clearTasks } = useTaskStore.getState();

      addTask({ title: 'Task 1', description: '', difficulty: TaskDifficulty.EASY });
      addTask({ title: 'Task 2', description: '', difficulty: TaskDifficulty.EASY });

      clearTasks();

      const { tasks } = useTaskStore.getState();
      expect(tasks).toHaveLength(0);
    });
  });

  describe('loading and error states', () => {
    it('should set loading state', () => {
      const { setLoading } = useTaskStore.getState();

      setLoading(true);
      expect(useTaskStore.getState().isLoading).toBe(true);

      setLoading(false);
      expect(useTaskStore.getState().isLoading).toBe(false);
    });

    it('should set error state', () => {
      const { setError } = useTaskStore.getState();

      setError('Something went wrong');
      expect(useTaskStore.getState().error).toBe('Something went wrong');

      setError(null);
      expect(useTaskStore.getState().error).toBeNull();
    });
  });
});
