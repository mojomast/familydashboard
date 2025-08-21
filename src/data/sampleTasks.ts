import type { Task } from '../types';

export const sampleTasks: Task[] = [
  {
    id: 'sample-1',
    title: 'Take out trash',
    createdAt: new Date().toISOString(),
    type: 'recurring',
  recurrence: { days: [1, 4] }, // Mon, Thu
  category: 'chores',
  },
  {
    id: 'sample-2',
    title: 'Buy birthday cake',
    createdAt: new Date().toISOString(),
    type: 'one-off',
    dueDate: '2025-08-23',
  category: 'other',
  },
];
