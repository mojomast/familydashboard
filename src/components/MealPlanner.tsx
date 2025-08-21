import React, { useState } from 'react';
import type { Task } from '../types';
import { instancesForDate } from '../lib/recurrence';

type Props = {
  tasks: Task[];
  onCreate: (t: Task) => void;
  onEdit: (taskId: string) => void;
  onDelete: (taskId: string) => void;
};

function iso(d: Date) {
  const dd = new Date(d);
  dd.setHours(0, 0, 0, 0);
  return dd.toISOString().slice(0, 10);
}

export const MealPlanner: React.FC<Props> = ({ tasks, onCreate, onEdit, onDelete }) => {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const days: Date[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    days.push(d);
  }

  const [inputs, setInputs] = useState<Record<string, string>>({});

  const handleAddText = (dateIso: string) => {
    const text = (inputs[dateIso] || '').trim();
    if (!text) return;
    const task: Task = {
      id: `meal-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      title: text,
      createdAt: new Date().toISOString(),
      type: 'one-off',
      dueDate: dateIso,
      category: 'meals',
    } as Task;
    onCreate(task);
    setInputs((s) => ({ ...s, [dateIso]: '' }));
  };

  return (
    <div style={{ border: '1px solid #ddd', padding: 8, marginBottom: 12 }}>
      <h3>Meal Planner — Next 7 days</h3>
      <div style={{ display: 'grid', gap: 8 }}>
        {days.map((d) => {
          const dateIso = iso(d);
          const meals = instancesForDate(tasks, d).filter((i) => i.task.category === 'meals');
          return (
            <div key={dateIso} style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
              <div style={{ width: 110 }}><strong>{dateIso}</strong></div>
              <div style={{ flex: 1 }}>
                <ul>
                  {meals.map((m) => (
                    <li key={m.task.id}>
                      {m.task.title}{' '}
                      <button onClick={() => onEdit(m.task.id)}>Edit</button>
                      <button onClick={() => onDelete(m.task.id)} style={{ marginLeft: 6 }}>Delete</button>
                    </li>
                  ))}
                </ul>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input
                    placeholder="Add meal"
                    value={inputs[dateIso] ?? ''}
                    onChange={(e) => setInputs((s) => ({ ...s, [dateIso]: e.target.value }))}
                  />
                  <button onClick={() => handleAddText(dateIso)}>+</button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default MealPlanner;
