import { describe, it, expect } from 'vitest';
import { instancesForWeek, nextInstance } from './recurrence';

import type { Task } from '../types';

describe('recurrence', () => {
  it('generates weekly instances for Mon/Wed/Fri', () => {
    const tasks: Task[] = [
      {
        id: 't1',
        title: 'MWF task',
        createdAt: new Date().toISOString(),
        type: 'recurring',
        recurrence: { days: [1, 3, 5] },
      },
    ];

    const weekStart = new Date('2025-08-18'); // Monday
    const instances = instancesForWeek(tasks, weekStart).map((i) => i.date);
    expect(instances).toContain('2025-08-18');
    expect(instances).toContain('2025-08-20');
    expect(instances).toContain('2025-08-22');
  });

  it('nextInstance finds next occurrence', () => {
    const task: Task = {
      id: 't2',
      title: 'Tue task',
      createdAt: new Date().toISOString(),
      type: 'recurring',
      recurrence: { days: [2] },
    };

    const from = new Date('2025-08-18'); // Monday
    const next = nextInstance(task, from);
    expect(next).toBeTruthy();
    expect(next?.getDay()).toBe(2);
  });
});
