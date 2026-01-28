import React, { useState } from 'react';
import { CheckCircle, Circle, Plus, Lock, Unlock, Zap, Trophy, Trash2 } from 'lucide-react';
import { TaskStatus, TaskDifficulty } from '../../shared/types';
import { useTaskStore } from '../stores/task-store';

/**
 * Main Dashboard Component
 * Displays task list, XP progress, and Focus Mode status
 */
function Dashboard(): React.ReactElement {
  // Use Zustand store for task state management
  const {
    tasks,
    addTask: storeAddTask,
    completeTask,
    uncompleteTask,
    deleteTask,
    getCompletedTasks,
    getCompletionPercentage,
  } = useTaskStore();

  const [focusModeActive, setFocusModeActive] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDifficulty, setNewTaskDifficulty] = useState<TaskDifficulty>(TaskDifficulty.MEDIUM);

  // Calculate XP and level based on completed tasks
  const completedTasksCount = getCompletedTasks().length;
  const totalXP = completedTasksCount * 100;
  const currentLevel = Math.floor(totalXP / 500) + 1;
  const xpProgress = (totalXP % 500) / 500 * 100;

  /**
   * Toggle task completion status
   */
  const toggleTask = (taskId: string, currentStatus: TaskStatus): void => {
    if (currentStatus === TaskStatus.COMPLETED) {
      uncompleteTask(taskId);
    } else {
      completeTask(taskId);
    }
  };

  /**
   * Add a new task using store
   */
  const addTask = (): void => {
    if (!newTaskTitle.trim()) return;

    storeAddTask({
      title: newTaskTitle,
      description: '',
      difficulty: newTaskDifficulty,
    });
    setNewTaskTitle('');
  };

  /**
   * Handle Enter key for task input
   */
  const handleKeyPress = (e: React.KeyboardEvent): void => {
    if (e.key === 'Enter') {
      addTask();
    }
  };

  return (
    <div className="min-h-screen p-6">
      {/* Header Section */}
      <header className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Focus-Lock</h1>
            <p className="text-gray-400">Earn your playtime</p>
          </div>

          {/* Focus Mode Toggle */}
          <button
            onClick={() => setFocusModeActive(!focusModeActive)}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all ${
              focusModeActive
                ? 'bg-red-600 hover:bg-red-700 text-white'
                : 'bg-green-600 hover:bg-green-700 text-white'
            }`}
          >
            {focusModeActive ? (
              <>
                <Lock size={20} />
                Focus Mode Active
              </>
            ) : (
              <>
                <Unlock size={20} />
                Start Focus Mode
              </>
            )}
          </button>
        </div>
      </header>

      {/* Stats Bar */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {/* Level Card */}
        <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-500/20 rounded-lg">
              <Trophy className="text-yellow-500" size={24} />
            </div>
            <div>
              <p className="text-gray-400 text-sm">Level</p>
              <p className="text-2xl font-bold text-white">{currentLevel}</p>
            </div>
          </div>
        </div>

        {/* XP Card */}
        <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/20 rounded-lg">
              <Zap className="text-blue-500" size={24} />
            </div>
            <div className="flex-1">
              <p className="text-gray-400 text-sm">XP Progress</p>
              <div className="mt-1 h-2 bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-500 transition-all duration-300"
                  style={{ width: `${xpProgress}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Tasks Completed Card */}
        <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-500/20 rounded-lg">
              <CheckCircle className="text-green-500" size={24} />
            </div>
            <div>
              <p className="text-gray-400 text-sm">Tasks Done</p>
              <p className="text-2xl font-bold text-white">
                {completedTasksCount}/{tasks.length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Task Input */}
      <div className="mb-6">
        <div className="flex gap-3">
          <input
            type="text"
            value={newTaskTitle}
            onChange={(e) => setNewTaskTitle(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Add a new task..."
            className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors"
          />
          <button
            onClick={addTask}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold flex items-center gap-2 transition-colors"
          >
            <Plus size={20} />
            Add Task
          </button>
        </div>
      </div>

      {/* Task List */}
      <div className="space-y-3">
        {tasks.map((task) => (
          <div
            key={task.id}
            className={`bg-gray-800 rounded-xl p-4 border transition-all cursor-pointer hover:border-gray-600 ${
              task.status === TaskStatus.COMPLETED
                ? 'border-green-700 bg-green-900/20'
                : 'border-gray-700'
            }`}
            onClick={() => toggleTask(task.id, task.status)}
          >
            <div className="flex items-center gap-4">
              {/* Checkbox */}
              <div className="flex-shrink-0">
                {task.status === TaskStatus.COMPLETED ? (
                  <CheckCircle className="text-green-500" size={24} />
                ) : (
                  <Circle className="text-gray-500 hover:text-gray-400" size={24} />
                )}
              </div>

              {/* Task Content */}
              <div className="flex-1">
                <h3
                  className={`font-medium ${
                    task.status === TaskStatus.COMPLETED
                      ? 'text-gray-400 line-through'
                      : 'text-white'
                  }`}
                >
                  {task.title}
                </h3>
                {task.description && (
                  <p className="text-gray-500 text-sm mt-1">{task.description}</p>
                )}
              </div>

              {/* Difficulty Badge */}
              <span
                className={`px-3 py-1 rounded-full text-xs font-medium ${
                  task.difficulty === TaskDifficulty.EASY
                    ? 'bg-green-500/20 text-green-400'
                    : task.difficulty === TaskDifficulty.MEDIUM
                    ? 'bg-yellow-500/20 text-yellow-400'
                    : 'bg-red-500/20 text-red-400'
                }`}
              >
                {task.difficulty}
              </span>
            </div>
          </div>
        ))}

        {tasks.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <p>No tasks yet. Add one to get started!</p>
          </div>
        )}
      </div>

      {/* Focus Mode Overlay */}
      {focusModeActive && completedTasksCount < tasks.length && (
        <div className="fixed bottom-6 right-6 bg-red-900/90 border border-red-700 rounded-xl p-4 shadow-lg">
          <div className="flex items-center gap-3">
            <Lock className="text-red-400" size={20} />
            <div>
              <p className="text-white font-medium">Focus Mode Active</p>
              <p className="text-red-300 text-sm">
                Complete {tasks.length - completedTasksCount} more task(s) to unlock
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Dashboard;
