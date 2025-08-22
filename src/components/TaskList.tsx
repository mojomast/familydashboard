import React, { useState, useEffect } from 'react';
import type { Task } from '../types';
import { createDAL } from '../lib/dal';
import ActionMenu from './ActionMenu';

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
  }, [tasks, dal]);

  if (!tasks.length) return <div className="no-tasks">No tasks</div>;

  const toggle = async (taskId: string, dateIso: string) => {
    const key = `${taskId}@${dateIso}`;
    const isDone = completedKeys.has(key);
    if (isDone) {
      setCompletedKeys((s) => { const n = new Set(s); n.delete(key); return n; });
  try { await dal.removeCompletion(taskId, dateIso); } catch (err) { console.warn('removeCompletion failed', err); }
  try { window.dispatchEvent(new CustomEvent('familydashboard:data-changed')); } catch (err) { console.warn('dispatch event failed', err); }
    } else {
      setCompletedKeys((s) => { const n = new Set(s); n.add(key); return n; });
  try { await dal.addCompletion({ taskId, instanceDate: dateIso }); } catch (err) { console.warn('addCompletion failed', err); }
  try { window.dispatchEvent(new CustomEvent('familydashboard:data-changed')); } catch (err) { console.warn('dispatch event failed', err); }
    }
  };

  const postpone = async (t: Task, fromDateIso: string) => {
    // move a one-off by one day; for recurring suggest editing; keep simple per request
    if (t.type === 'one-off' && t.dueDate) {
      const d = new Date(fromDateIso);
      d.setDate(d.getDate() + 1);
      const iso = d.toISOString().slice(0,10);
      const next = { ...t, dueDate: iso } as Task;
  try { await dal.updateTask(next); } catch (err) { console.warn('postpone update failed', err); }
  try { window.dispatchEvent(new CustomEvent('familydashboard:data-changed')); } catch (err) { console.warn('dispatch event failed', err); }
    }
  };
  const duplicate = async (t: Task, dateIso?: string) => {
    const copy: Task = { ...t, id: `dup-${Date.now()}-${Math.floor(Math.random()*1000)}`, createdAt: new Date().toISOString() };
    if (dateIso && t.type === 'one-off') copy.dueDate = dateIso;
  try { await dal.createTask(copy); } catch (err) { console.warn('duplicate create failed', err); }
  try { window.dispatchEvent(new CustomEvent('familydashboard:data-changed')); } catch {}
  };
  const archive = async (t: Task) => {
  try { await dal.updateTask({ ...t, archived: true }); } catch (err) { console.warn('archive failed', err); }
  try { window.dispatchEvent(new CustomEvent('familydashboard:data-changed')); } catch {}
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
              <ActionMenu
                items={[
                  { label: 'Edit', onSelect: () => onEdit && onEdit(t.task.id) },
                  { label: 'Delete', onSelect: () => onDelete && onDelete(t.task.id) },
                  { label: 'Postpone', onSelect: () => postpone(t.task, t.date) },
                  { label: 'Duplicate', onSelect: () => duplicate(t.task, t.date) },
                  { label: 'Archive', onSelect: () => archive(t.task) },
                ]}
              />
            </div>
          </li>
        );
      })}
    </ul>
  );
};

export default TaskList;
