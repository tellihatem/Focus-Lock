/**
 * TaskForm Component
 * Form for creating and editing tasks
 */

import React, { useState, useEffect } from 'react';
import { Task, TaskDifficulty, CreateTaskPayload, UpdateTaskPayload } from '../../shared/types';
import { X } from 'lucide-react';

interface TaskFormProps {
  task?: Task;
  onSubmit: (payload: CreateTaskPayload | UpdateTaskPayload) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

/**
 * TaskForm component - form for creating and editing tasks
 */
export const TaskForm: React.FC<TaskFormProps> = ({
  task,
  onSubmit,
  onCancel,
  isLoading = false,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [difficulty, setDifficulty] = useState<TaskDifficulty>(TaskDifficulty.MEDIUM);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Initialize form with task data if editing
  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setDescription(task.description);
      setDifficulty(task.difficulty);
    }
  }, [task]);

  /**
   * Validate form inputs
   */
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!title.trim()) {
      newErrors.title = 'Title is required';
    } else if (title.length > 255) {
      newErrors.title = 'Title cannot exceed 255 characters';
    }

    if (description.length > 2000) {
      newErrors.description = 'Description cannot exceed 2000 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /**
   * Handle form submission
   */
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    const payload = {
      title: title.trim(),
      description: description.trim(),
      difficulty,
    };

    onSubmit(payload);
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">
          {task ? 'Edit Task' : 'Create New Task'}
        </h2>
        <button
          type="button"
          onClick={onCancel}
          className="p-1 text-gray-500 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-300 rounded"
          aria-label="Close form"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Title field */}
      <div>
        <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
          Task Title *
        </label>
        <input
          id="title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Enter task title"
          maxLength={255}
          disabled={isLoading}
          className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-500 ${
            errors.title ? 'border-red-500' : 'border-gray-300'
          }`}
        />
        {errors.title && <p className="text-sm text-red-600 mt-1">{errors.title}</p>}
        <p className="text-xs text-gray-500 mt-1">{title.length}/255</p>
      </div>

      {/* Description field */}
      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
          Description
        </label>
        <textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Enter task description (optional)"
          maxLength={2000}
          rows={4}
          disabled={isLoading}
          className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-500 resize-none ${
            errors.description ? 'border-red-500' : 'border-gray-300'
          }`}
        />
        {errors.description && <p className="text-sm text-red-600 mt-1">{errors.description}</p>}
        <p className="text-xs text-gray-500 mt-1">{description.length}/2000</p>
      </div>

      {/* Difficulty field */}
      <div>
        <label htmlFor="difficulty" className="block text-sm font-medium text-gray-700 mb-1">
          Difficulty
        </label>
        <select
          id="difficulty"
          value={difficulty}
          onChange={(e) => setDifficulty(e.target.value as TaskDifficulty)}
          disabled={isLoading}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
        >
          <option value={TaskDifficulty.EASY}>Easy</option>
          <option value={TaskDifficulty.MEDIUM}>Medium</option>
          <option value={TaskDifficulty.HARD}>Hard</option>
        </select>
      </div>

      {/* Action buttons */}
      <div className="flex gap-3 pt-4 border-t border-gray-200">
        <button
          type="submit"
          disabled={isLoading}
          className="flex-1 px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          {isLoading ? 'Saving...' : task ? 'Update Task' : 'Create Task'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={isLoading}
          className="flex-1 px-4 py-2 bg-gray-200 text-gray-900 font-medium rounded-lg hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400 disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  );
};
