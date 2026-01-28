/**
 * TaskList Component
 * Displays a list of tasks with status indicators and action buttons
 */

import React from 'react';
import { Task, TaskStatus } from '../../shared/types';
import { CheckCircle2, Circle, Trash2, Edit2 } from 'lucide-react';

interface TaskListProps {
  tasks: Task[];
  onTaskComplete: (taskId: string) => void;
  onTaskDelete: (taskId: string) => void;
  onTaskEdit: (task: Task) => void;
}

/**
 * TaskList component - renders a list of tasks with interactive controls
 */
export const TaskList: React.FC<TaskListProps> = ({
  tasks,
  onTaskComplete,
  onTaskDelete,
  onTaskEdit,
}) => {
  // Helper function to format timestamp to readable date
  const formatDate = (timestamp: number): string => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  // Helper function to get difficulty badge color
  const getDifficultyColor = (difficulty: string): string => {
    switch (difficulty) {
      case 'easy':
        return 'bg-green-100 text-green-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'hard':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (tasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4">
        <Circle className="w-12 h-12 text-gray-300 mb-4" />
        <p className="text-gray-500 text-center">No tasks yet. Create one to get started!</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {tasks.map((task) => (
        <div
          key={task.id}
          className="flex items-start gap-3 p-4 bg-white border border-gray-200 rounded-lg hover:shadow-md transition-shadow"
        >
          {/* Status indicator button */}
          <button
            onClick={() => onTaskComplete(task.id)}
            className="flex-shrink-0 mt-1 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
            aria-label={`Mark task as ${task.status === TaskStatus.COMPLETED ? 'incomplete' : 'complete'}`}
          >
            {task.status === TaskStatus.COMPLETED ? (
              <CheckCircle2 className="w-6 h-6 text-green-500" />
            ) : (
              <Circle className="w-6 h-6 text-gray-300 hover:text-gray-400" />
            )}
          </button>

          {/* Task content */}
          <div className="flex-1 min-w-0">
            <h3
              className={`font-semibold text-sm ${
                task.status === TaskStatus.COMPLETED
                  ? 'text-gray-400 line-through'
                  : 'text-gray-900'
              }`}
            >
              {task.title}
            </h3>
            {task.description && (
              <p
                className={`text-sm mt-1 ${
                  task.status === TaskStatus.COMPLETED
                    ? 'text-gray-300 line-through'
                    : 'text-gray-600'
                }`}
              >
                {task.description}
              </p>
            )}
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <span className={`text-xs px-2 py-1 rounded-full font-medium ${getDifficultyColor(task.difficulty)}`}>
                {task.difficulty}
              </span>
              <span className="text-xs text-gray-500">Created {formatDate(task.createdAt)}</span>
              {task.completedAt && (
                <span className="text-xs text-green-600">Completed {formatDate(task.completedAt)}</span>
              )}
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex-shrink-0 flex gap-2">
            <button
              onClick={() => onTaskEdit(task)}
              className="p-2 text-gray-500 hover:text-blue-500 hover:bg-blue-50 rounded transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label="Edit task"
            >
              <Edit2 className="w-4 h-4" />
            </button>
            <button
              onClick={() => {
                if (window.confirm('Are you sure you want to delete this task?')) {
                  onTaskDelete(task.id);
                }
              }}
              className="p-2 text-gray-500 hover:text-red-500 hover:bg-red-50 rounded transition-colors focus:outline-none focus:ring-2 focus:ring-red-500"
              aria-label="Delete task"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};
