import type { Task, Completion } from '../types';

const TASKS_KEY = 'familydashboard:tasks';
const COMPLETIONS_KEY = 'familydashboard:completions';
const NOTES_KEY = 'familydashboard:notes';

export const loadTasks = (): Task[] => {
  try {
    const raw = localStorage.getItem(TASKS_KEY);
    return raw ? JSON.parse(raw) as Task[] : [];
  } catch (e) {
    console.error('loadTasks error', e);
    return [];
  }
};

export const saveTasks = (tasks: Task[]) => {
  try {
    localStorage.setItem(TASKS_KEY, JSON.stringify(tasks));
  } catch (e) {
    console.error('saveTasks error', e);
  }
};

export const loadCompletions = (): Completion[] => {
  try {
    const raw = localStorage.getItem(COMPLETIONS_KEY);
    return raw ? JSON.parse(raw) as Completion[] : [];
  } catch (e) {
    console.error('loadCompletions error', e);
    return [];
  }
};

export const saveCompletions = (completions: Completion[]) => {
  try {
    localStorage.setItem(COMPLETIONS_KEY, JSON.stringify(completions));
  } catch (e) {
    console.error('saveCompletions error', e);
  }
};

// Convenience APIs for completions
export const addCompletion = (completion: Completion) => {
  const list = loadCompletions();
  list.push(completion);
  saveCompletions(list);
};

export const removeCompletion = (taskId: string, instanceDate?: string) => {
  let list = loadCompletions();
  list = list.filter((c) => !(c.taskId === taskId && (instanceDate ? c.instanceDate === instanceDate : true)));
  saveCompletions(list);
};

export const isCompleted = (taskId: string, instanceDate?: string) => {
  const list = loadCompletions();
  return list.some((c) => c.taskId === taskId && (instanceDate ? c.instanceDate === instanceDate : true));
};

export const getCompletionsForDate = (dateIso: string) => {
  const list = loadCompletions();
  return list.filter((c) => c.instanceDate === dateIso);
};

export const loadNotes = (): Record<string, string> => {
  try {
    const raw = localStorage.getItem(NOTES_KEY);
    return raw ? JSON.parse(raw) as Record<string, string> : {};
  } catch (e) {
    console.error('loadNotes error', e);
    return {};
  }
};

export const saveNote = (dateIso: string, note: string) => {
  const notes = loadNotes();
  notes[dateIso] = note;
  try {
    localStorage.setItem(NOTES_KEY, JSON.stringify(notes));
  } catch (e) {
    console.error('saveNote error', e);
  }
};

export const deleteNote = (dateIso: string) => {
  const notes = loadNotes();
  delete notes[dateIso];
  try {
    localStorage.setItem(NOTES_KEY, JSON.stringify(notes));
  } catch (e) {
    console.error('deleteNote error', e);
  }
};

// Task convenience APIs
export const addTask = (task: Task) => {
  const list = loadTasks();
  list.unshift(task);
  saveTasks(list);
};

export const updateTask = (task: Task) => {
  const list = loadTasks();
  const idx = list.findIndex((t) => t.id === task.id);
  if (idx >= 0) list[idx] = task;
  else list.unshift(task);
  saveTasks(list);
};

export const deleteTask = (taskId: string) => {
  let list = loadTasks();
  list = list.filter((t) => t.id !== taskId);
  saveTasks(list);
  // also remove any completions for that task
  removeCompletion(taskId);
};
