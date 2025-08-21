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
}

// Backend Adapter
export class BackendAdapter implements IDataAccess {
  constructor(private baseUrl = '/api') {}

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
}

// Factory: choose backend by env flag
export function createDAL(): IDataAccess {
  const useBackend = (window as any).__FAMILY_DASHBOARD_BACKEND__ ?? true; // default to backend per requirements
  return useBackend ? new BackendAdapter('/api') : new LocalStorageAdapter();
}
