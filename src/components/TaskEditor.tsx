import React, { useState, useEffect } from 'react';
import type { Task, UserProfile } from '../types';
import { createDAL } from '../lib/dal';

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
  const [category, setCategory] = useState<'meals' | 'chores' | 'other'>(initial?.category as 'meals'|'chores'|'other' ?? 'other');
  const [days, setDays] = useState<number[]>(initial?.recurrence?.days ?? [1]);
  const [assignedTo, setAssignedTo] = useState(initial?.assignedTo ?? '');
  const [familyMembers, setFamilyMembers] = useState<UserProfile[]>([]);

  const dal = createDAL();

  useEffect(() => {
    loadFamilyMembers();
  }, []);

  const loadFamilyMembers = async () => {
    try {
      const members = await dal.getUserProfiles();
      setFamilyMembers(members);
    } catch (err) {
      console.warn('Failed to load family members:', err);
    }
  };

  const toggleDay = (d: number) => {
    setDays((prev) => (prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]));
  };

  const submit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!title.trim()) return;
  const isEdit = Boolean(initial && 'id' in (initial as Record<string, unknown>));

    const base: Task = isEdit
      ? { ...(initial as Task), title: title.trim(), type, category, assignedTo: assignedTo || undefined }
      : ({ id: generateId(), title: title.trim(), createdAt: new Date().toISOString(), type, category, assignedTo: assignedTo || undefined } as Task);

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
      try { dal.createTask(base); } catch { /* ignore */ }
      try { window.dispatchEvent(new CustomEvent('familydashboard:task-added', { detail: base.id })); } catch { /* ignore */ }
      onCreate(base);
    }

    setTitle('');
    setDueDate('');
    setDays([1]);
    setType('one-off');
  };

  return (
    <form onSubmit={submit} className="task-editor">
      <h4>Create Task</h4>
      <div>
        <label>
          Category:
          <select value={category} onChange={(e) => setCategory(e.target.value as 'meals'|'chores'|'other')} className="ml-8">
            <option value="meals">Meals</option>
            <option value="chores">Chores</option>
            <option value="other">Other</option>
          </select>
        </label>
      </div>
      <div>
        <label>
          Assign to:
          <select value={assignedTo} onChange={(e) => setAssignedTo(e.target.value)} className="ml-8">
            <option value="">Unassigned</option>
            {familyMembers.map((member) => (
              <option key={member.id} value={member.name}>
                {member.avatar} {member.name} ({member.role})
              </option>
            ))}
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
          <select value={type} onChange={(e) => setType(e.target.value as 'one-off'|'recurring')}>
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
    <div className="flex-gap-8">
            {weekdayLabels.map((lab, idx) => (
        <label key={idx} className="fs-12">
                <input type="checkbox" checked={days.includes(idx)} onChange={() => toggleDay(idx)} /> {lab}
              </label>
            ))}
          </div>
        </div>
      )}

      <div className="mt-8">
        <button type="submit">Create</button>
      </div>
    </form>
  );
};

export default TaskEditor;
