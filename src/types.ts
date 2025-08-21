export type UUID = string;

export type TaskType = 'one-off' | 'recurring';

export type Recurrence = {
  days: number[]; // 0 (Sun) - 6 (Sat)
  startDate?: string; // ISO
  endDate?: string; // ISO
};

export type Task = {
  id: UUID;
  title: string;
  notes?: string;
  createdAt: string; // ISO
  type: TaskType;
  dueDate?: string; // ISO, for one-off
  recurrence?: Recurrence;
  assignedTo?: string;
  archived?: boolean;
  category?: 'meals' | 'chores' | 'other';
};

export type Completion = {
  taskId: UUID;
  completedAt: string; // ISO
  instanceDate?: string; // ISO date string for which instance (yyyy-mm-dd)
};
