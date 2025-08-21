import React, { useState, useEffect } from 'react';
import type { Task } from '../types';
import { addCompletion, removeCompletion, isCompleted } from '../lib/storage';

export const TaskList: React.FC<{
  tasks: { task: Task; date: string }[];
  onEdit?: (taskId: string) => void;
  onDelete?: (taskId: string) => void;
}> = ({ tasks, onEdit, onDelete }) => {
  const [, setTick] = useState(0);

  useEffect(() => {
    // no-op placeholder to allow reactive updates if we later add an event bus
  }, []);

  if (!tasks.length) return <div className="no-tasks">No tasks</div>;

  const toggle = (taskId: string, dateIso: string) => {
    const completed = isCompleted(taskId, dateIso);
    if (completed) {
      removeCompletion(taskId, dateIso);
    } else {
      addCompletion({ taskId, completedAt: new Date().toISOString(), instanceDate: dateIso });
    }
    setTick((t) => t + 1);
  };

  return (
    <ul>
      {tasks.map((t) => {
        const completed = isCompleted(t.task.id, t.date);
        return (
          <li key={`${t.task.id}-${t.date}`} className="task-item">
            <label>
              <input type="checkbox" checked={completed} onChange={() => toggle(t.task.id, t.date)} />{' '}
              <strong className="task-title">{t.task.title}</strong>
            </label>
            <div className="task-controls">
              <button className="icon-btn" title="Edit" aria-label="Edit" onClick={() => onEdit && onEdit(t.task.id)}>✏️</button>
              <button className="icon-btn" title="Delete" aria-label="Delete" onClick={() => onDelete && onDelete(t.task.id)}>➖</button>
            </div>
          </li>
        );
      })}
    </ul>
  );
};

export default TaskList;
