import type { Task, Completion } from '../types';

// Unified Data Access Layer interface
export interface IDataAccess {
  // tasks
  getTasks(): Promise<Task[]>;
  createTask(task: Task): Promise<Task>;
  updateTask(task: Task): Promise<Task>;
  deleteTask(taskId: string): Promise<void>;

  // completions
  getCompletions(dateIso?: string): Promise<Completion[]>;
  addCompletion(c: Omit<Completion, 'completedAt'> & { completedAt?: string }): Promise<Completion>; // completedAt filled by server
  removeCompletion(taskId: string, instanceDate?: string): Promise<void>;

  // notes
  getNote(dateIso: string): Promise<string>;
  saveNote(dateIso: string, note: string): Promise<void>;
  deleteNote(dateIso: string): Promise<void>;

  // groceries
  listGroceries(dateIso?: string): Promise<Array<{ id: string; dateIso: string; label: string; done: boolean; mealTaskId?: string }>>;
  addGrocery(item: { dateIso: string; label: string; mealTaskId?: string }): Promise<{ id: string; dateIso: string; label: string; done: boolean; mealTaskId?: string }>;
  updateGrocery(id: string, patch: Partial<{ label: string; done: boolean }>): Promise<{ id: string; dateIso: string; label: string; done: boolean; mealTaskId?: string }>;
  deleteGrocery(id: string): Promise<void>;

  // categories and settings
  getCategories(): Promise<Array<{ key: 'meals' | 'chores' | 'other'; name: string; bg?: string; fg?: string; border?: string }>>;
  updateCategory(key: 'meals' | 'chores' | 'other', patch: Partial<{ name: string; bg: string; fg: string; border: string }>): Promise<{ key: string; name: string; bg?: string; fg?: string; border?: string }>;
  getSetting<T = string>(key: string): Promise<T | null>;
  setSetting<T = string>(key: string, value: T): Promise<void>;
}

// LocalStorage Adapter (wraps existing helpers for compatibility)
import {
  loadTasks,
  saveTasks,
  loadCompletions,
  saveCompletions,
  loadNotes,
  saveNote as lsSaveNote,
  deleteNote as lsDeleteNote,
} from './storage';

export class LocalStorageAdapter implements IDataAccess {
  private catStoreKey = 'fd:categories';
  private settingsPrefix = 'fd:setting:';

  async getTasks() { return loadTasks(); }
  async createTask(task: Task) { const list = loadTasks(); list.unshift(task); saveTasks(list); return task; }
  async updateTask(task: Task) {
    const list = loadTasks();
    const idx = list.findIndex(t => t.id === task.id);
    if (idx >= 0) list[idx] = task; else list.unshift(task);
    saveTasks(list);
    return task;
  }
  async deleteTask(taskId: string) {
    const list = loadTasks().filter(t => t.id !== taskId);
    saveTasks(list);
  }

  async getCompletions(dateIso?: string) {
    const all = loadCompletions();
    return dateIso ? all.filter(c => c.instanceDate === dateIso) : all;
  }
  async addCompletion(c: Omit<Completion, 'completedAt'> & { completedAt?: string }) {
    const list = loadCompletions();
    const comp: Completion = { taskId: c.taskId, instanceDate: c.instanceDate, completedAt: c.completedAt || new Date().toISOString() };
    list.push(comp); saveCompletions(list); return comp;
  }
  async removeCompletion(taskId: string, instanceDate?: string) {
    const list = loadCompletions().filter(x => !(x.taskId === taskId && (instanceDate ? x.instanceDate === instanceDate : true)));
    saveCompletions(list);
  }

  async getNote(dateIso: string) { const notes = loadNotes(); return notes[dateIso] || ''; }
  async saveNote(dateIso: string, note: string) { lsSaveNote(dateIso, note); }
  async deleteNote(dateIso: string) { lsDeleteNote(dateIso); }

  // Local adapter has no groceries persistence; emulate with note JSON if desired (simple no-op list)
  async listGroceries() { return []; }
  async addGrocery(item: { dateIso: string; label: string; mealTaskId?: string }) { return { id: `local-${Date.now()}`, dateIso: item.dateIso, label: item.label, done: false, mealTaskId: item.mealTaskId }; }
  async updateGrocery(id: string, patch: Partial<{ label: string; done: boolean }>) { return { id, dateIso: '', label: patch.label || '', done: !!patch.done }; }
  async deleteGrocery() { /* no-op */ }

  async getCategories() {
    const raw = localStorage.getItem(this.catStoreKey);
    if (raw) return JSON.parse(raw) as Array<{ key: 'meals'|'chores'|'other'; name: string; bg?: string; fg?: string; border?: string }>;
    const defaults = [
      { key: 'meals' as const, name: 'Meals', bg: '#fff8f6', fg: '#8b3d2e', border: '#ffe6dc' },
      { key: 'chores' as const, name: 'Chores', bg: '#f6fff8', fg: '#2a7f48', border: '#dcffdf' },
      { key: 'other' as const, name: 'Other', bg: '#f3f2ff', fg: '#4a2e8f', border: '#ebe9ff' },
    ];
    return defaults;
  }
  async updateCategory(key: 'meals' | 'chores' | 'other', patch: Partial<{ name: string; bg: string; fg: string; border: string }>) {
    const list = await this.getCategories();
    const idx = list.findIndex(c => c.key === key);
    if (idx >= 0) list[idx] = { ...list[idx], ...patch };
    localStorage.setItem(this.catStoreKey, JSON.stringify(list));
    return list[idx];
  }
  async getSetting<T = string>(key: string) {
    const raw = localStorage.getItem(this.settingsPrefix + key);
    return raw != null ? (JSON.parse(raw) as T) : null;
  }
  async setSetting<T = string>(key: string, value: T) {
    localStorage.setItem(this.settingsPrefix + key, JSON.stringify(value));
  }
}

// Backend Adapter
export class BackendAdapter implements IDataAccess {
  private baseUrl: string;
  constructor(baseUrl = '/api') { this.baseUrl = baseUrl; }

  // helpers
  private async req(path: string, opts?: RequestInit) {
    const res = await fetch(`${this.baseUrl}${path}`, { headers: { 'Content-Type': 'application/json' }, ...opts });
    if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
    const data = await res.json();
    if (!data.ok) throw new Error(data.message || 'Request failed');
    return data.data;
  }

  async getTasks() { return this.req('/tasks'); }
  async createTask(task: Task) { return this.req('/tasks', { method: 'POST', body: JSON.stringify(task) }); }
  async updateTask(task: Task) { return this.req(`/tasks/${task.id}`, { method: 'PUT', body: JSON.stringify(task) }); }
  async deleteTask(taskId: string) { await this.req(`/tasks/${taskId}`, { method: 'DELETE' }); }

  async getCompletions(dateIso?: string) { return this.req(`/completions${dateIso ? `?date=${encodeURIComponent(dateIso)}` : ''}`); }
  async addCompletion(c: Omit<Completion, 'completedAt'> & { completedAt?: string }) { return this.req('/completions', { method: 'POST', body: JSON.stringify(c) }); }
  async removeCompletion(taskId: string, instanceDate?: string) { await this.req('/completions', { method: 'DELETE', body: JSON.stringify({ taskId, instanceDate }) }); }

  async getNote(dateIso: string) { const r = await this.req(`/notes/${dateIso}`); return r?.content || ''; }
  async saveNote(dateIso: string, note: string) { await this.req(`/notes/${dateIso}`, { method: 'PUT', body: JSON.stringify({ content: note }) }); }
  async deleteNote(dateIso: string) { await this.req(`/notes/${dateIso}`, { method: 'DELETE' }); }

  async listGroceries(dateIso?: string) { return this.req(`/groceries${dateIso ? `?date=${encodeURIComponent(dateIso)}` : ''}`); }
  async addGrocery(item: { dateIso: string; label: string; mealTaskId?: string }) { return this.req('/groceries', { method: 'POST', body: JSON.stringify(item) }); }
  async updateGrocery(id: string, patch: Partial<{ label: string; done: boolean }>) { return this.req(`/groceries/${id}`, { method: 'PUT', body: JSON.stringify(patch) }); }
  async deleteGrocery(id: string) { await this.req(`/groceries/${id}`, { method: 'DELETE' }); }

  async getCategories() { return this.req('/categories'); }
  async updateCategory(key: 'meals' | 'chores' | 'other', patch: Partial<{ name: string; bg: string; fg: string; border: string }>) { return this.req(`/categories/${key}`, { method: 'PUT', body: JSON.stringify(patch) }); }
  async getSetting<T = string>(key: string) { const r = await this.req(`/settings/${encodeURIComponent(key)}`); return (r && r.value != null) ? (r.value as T) : null; }
  async setSetting<T = string>(key: string, value: T) { await this.req(`/settings/${encodeURIComponent(key)}`, { method: 'PUT', body: JSON.stringify({ value }) }); }
}

// Factory: choose backend by env flag
export function createDAL(): IDataAccess {
  const w = globalThis as unknown as { __FAMILY_DASHBOARD_BACKEND__?: boolean };
  const useBackend = (typeof w.__FAMILY_DASHBOARD_BACKEND__ === 'boolean') ? w.__FAMILY_DASHBOARD_BACKEND__! : true; // default to backend
  return useBackend ? new BackendAdapter('/api') : new LocalStorageAdapter();
}
