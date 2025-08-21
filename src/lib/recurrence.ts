import type { Task } from '../types';

const isoDate = (d: Date) => d.toISOString().slice(0, 10);

export function instancesForWeek(tasks: Task[], weekStart: Date): Array<{ task: Task; date: string }> {
  const start = new Date(weekStart);
  start.setHours(0, 0, 0, 0);

  const out: Array<{ task: Task; date: string }> = [];

  for (let i = 0; i < 7; i++) {
    const day = new Date(start);
    day.setDate(start.getDate() + i);
    const weekday = day.getDay();
    const dayIso = isoDate(day);

    for (const task of tasks) {
      if (task.archived) continue;

      if (task.type === 'one-off') {
        if (task.dueDate && task.dueDate.slice(0, 10) === dayIso) {
          out.push({ task, date: dayIso });
        }
      } else if (task.type === 'recurring' && task.recurrence) {
        const { days, startDate, endDate } = task.recurrence;
        if (!days.includes(weekday)) continue;
        if (startDate && dayIso < startDate.slice(0, 10)) continue;
        if (endDate && dayIso > endDate.slice(0, 10)) continue;
        out.push({ task, date: dayIso });
      }
    }
  }

  return out;
}

export function nextInstance(task: Task, fromDate = new Date()): Date | null {
  if (task.type === 'one-off') {
    return task.dueDate ? new Date(task.dueDate) : null;
  }

  if (task.type === 'recurring' && task.recurrence) {
    const { days, startDate, endDate } = task.recurrence;
    const from = new Date(fromDate);
    from.setHours(0, 0, 0, 0);

    // search next 365 days
    for (let i = 0; i < 366; i++) {
      const d = new Date(from);
      d.setDate(from.getDate() + i);
      const iso = isoDate(d);
      const weekday = d.getDay();
      if (!days.includes(weekday)) continue;
      if (startDate && iso < startDate.slice(0, 10)) continue;
      if (endDate && iso > endDate.slice(0, 10)) continue;
      return d;
    }
  }

  return null;
}

export function instancesForDate(tasks: Task[], date: Date): Array<{ task: Task; date: string }> {
  const day = new Date(date);
  day.setHours(0, 0, 0, 0);
  const iso = day.toISOString().slice(0, 10);
  return instancesForWeek(tasks, new Date(day)).filter((i) => i.date === iso);
}
