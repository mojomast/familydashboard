import React, { useState } from 'react';
import type { Task, Recurrence } from '../types';
import { addTask } from '../lib/storage';

type Props = {
  onCreate: (task: Task) => void;
  initial?: Partial<Task> | null;
  onUpdate?: (task: Task) => void;
};

const weekdayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function generateId() {
  return `t-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
}

export const TaskEditor: React.FC<Props> = ({ onCreate, initial = null, onUpdate }) => {
  const [title, setTitle] = useState(initial?.title ?? '');
  const [type, setType] = useState<'one-off' | 'recurring'>(initial?.type ?? 'one-off');
  const [dueDate, setDueDate] = useState(initial?.dueDate ?? '');
  const [category, setCategory] = useState<'meals' | 'chores' | 'other'>((initial as any)?.category ?? 'other');
  const [days, setDays] = useState<number[]>(initial?.recurrence?.days ?? [1]);

  const toggleDay = (d: number) => {
    setDays((prev) => (prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]));
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    const isEdit = Boolean(initial && (initial as any).id);

    const base: Task = isEdit
      ? { ...(initial as Task), title: title.trim(), type, category }
      : ({ id: generateId(), title: title.trim(), createdAt: new Date().toISOString(), type, category } as Task);

    if (type === 'one-off') {
      if (dueDate) base.dueDate = dueDate;
      base.recurrence = undefined;
    } else {
      base.recurrence = { days: days.sort((a, b) => a - b) };
      base.dueDate = undefined;
    }

    if (isEdit && onUpdate) onUpdate(base);
    else {
      // persist immediately and notify parent
      try {
        addTask(base);
        // notify app to reload tasks (in case parent didn't update state)
        try { window.dispatchEvent(new CustomEvent('familydashboard:task-added', { detail: base.id })); } catch (e) { /* ignore */ }
      } catch (e) { /* ignore */ }
      onCreate(base);
    }

    setTitle('');
    setDueDate('');
    setDays([1]);
    setType('one-off');
  };

  return (
    <form onSubmit={submit} style={{ border: '1px solid #ddd', padding: 8, marginBottom: 12 }}>
      <h4>Create Task</h4>
      <div>
        <label>
          Category:
          <select value={category} onChange={(e) => setCategory(e.target.value as any)} style={{ marginLeft: 8 }}>
            <option value="meals">Meals</option>
            <option value="chores">Chores</option>
            <option value="other">Other</option>
          </select>
        </label>
      </div>
      <div>
        <label>
          Title: <input value={title} onChange={(e) => setTitle(e.target.value)} required />
        </label>
      </div>
      <div>
        <label>
          Type:
          <select value={type} onChange={(e) => setType(e.target.value as any)}>
            <option value="one-off">One-off</option>
            <option value="recurring">Recurring (weekly)</option>
          </select>
        </label>
      </div>

      {type === 'one-off' ? (
        <div>
          <label>
            Due date: <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
          </label>
        </div>
      ) : (
        <div>
          <div>Days:</div>
          <div style={{ display: 'flex', gap: 8 }}>
            {weekdayLabels.map((lab, idx) => (
              <label key={idx} style={{ fontSize: 12 }}>
                <input type="checkbox" checked={days.includes(idx)} onChange={() => toggleDay(idx)} /> {lab}
              </label>
            ))}
          </div>
        </div>
      )}

      <div style={{ marginTop: 8 }}>
        <button type="submit">Create</button>
      </div>
    </form>
  );
};

export default TaskEditor;
