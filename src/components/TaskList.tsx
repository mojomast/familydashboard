import React, { useState, useEffect } from 'react';
import type { Task } from '../types';
import { createDAL } from '../lib/dal';

export const TaskList: React.FC<{
  tasks: { task: Task; date: string }[];
  onEdit?: (taskId: string) => void;
  onDelete?: (taskId: string) => void;
}> = ({ tasks, onEdit, onDelete }) => {
  const dal = createDAL();
  const [completedKeys, setCompletedKeys] = useState<Set<string>>(new Set());

  useEffect(() => {
    // Load completed instances for involved dates
    (async () => {
      try {
        const perDate = new Map<string, string[]>();
        for (const it of tasks) {
          const list = perDate.get(it.date) || [];
          list.push(it.task.id);
          perDate.set(it.date, list);
        }
        const set = new Set<string>();
        for (const [dateIso] of perDate) {
          const comps = await dal.getCompletions(dateIso);
          for (const c of comps) set.add(`${c.taskId}@${c.instanceDate}`);
        }
        setCompletedKeys(set);
      } catch { /* ignore */ }
    })();
  }, [tasks.length]);

  if (!tasks.length) return <div className="no-tasks">No tasks</div>;

  const toggle = async (taskId: string, dateIso: string) => {
    const key = `${taskId}@${dateIso}`;
    const isDone = completedKeys.has(key);
    if (isDone) {
      setCompletedKeys((s) => { const n = new Set(s); n.delete(key); return n; });
      try { await dal.removeCompletion(taskId, dateIso); } catch { /* ignore */ }
    } else {
      setCompletedKeys((s) => { const n = new Set(s); n.add(key); return n; });
      try { await dal.addCompletion({ taskId, instanceDate: dateIso }); } catch { /* ignore */ }
    }
  };

  return (
    <ul>
      {tasks.map((t) => {
  const completed = completedKeys.has(`${t.task.id}@${t.date}`);
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
