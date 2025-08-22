import type { Task, Completion, UserProfile, TaskAssignment, TaskTemplate, Recipe, MealPlan, MealHistory, RecipeReview } from '../types';
import { clearRecurrenceCache, invalidateRecurrenceCache } from './recurrence';

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

  // user profiles and family management
  getUserProfiles(): Promise<UserProfile[]>;
  createUserProfile(profile: Omit<UserProfile, 'id' | 'createdAt' | 'lastActive'>): Promise<UserProfile>;
  updateUserProfile(id: string, profile: Partial<UserProfile>): Promise<UserProfile>;
  deleteUserProfile(id: string): Promise<void>;

  // task assignments
  getTaskAssignments(): Promise<TaskAssignment[]>;
  assignTask(assignment: Omit<TaskAssignment, 'assignedAt'>): Promise<TaskAssignment>;
  unassignTask(taskId: string, userId: string): Promise<void>;
  getTaskAssignmentsForUser(userId: string): Promise<TaskAssignment[]>;

  // task templates
  getTaskTemplates(): Promise<TaskTemplate[]>;
  createTaskTemplate(template: Omit<TaskTemplate, 'id' | 'createdAt' | 'usageCount'>): Promise<TaskTemplate>;
  updateTaskTemplate(id: string, template: Partial<TaskTemplate>): Promise<TaskTemplate>;
  deleteTaskTemplate(id: string): Promise<void>;
  createTaskFromTemplate(templateId: string, overrides?: Partial<Task>): Promise<Task>;

  // recipes
  getRecipes(): Promise<Recipe[]>;
  createRecipe(recipe: Omit<Recipe, 'id' | 'createdAt' | 'updatedAt' | 'usageCount'>): Promise<Recipe>;
  updateRecipe(id: string, recipe: Partial<Recipe>): Promise<Recipe>;
  deleteRecipe(id: string): Promise<void>;
  searchRecipes(query: string): Promise<Recipe[]>;

  // meal plans
  getMealPlans(dateRange?: { start: string; end: string }): Promise<MealPlan[]>;
  getMealPlan(date: string): Promise<MealPlan | null>;
  createMealPlan(plan: Omit<MealPlan, 'id' | 'createdAt' | 'updatedAt'>): Promise<MealPlan>;
  updateMealPlan(id: string, plan: Partial<MealPlan>): Promise<MealPlan>;
  deleteMealPlan(id: string): Promise<void>;
  generateGroceryListFromMealPlan(mealPlanId: string): Promise<Array<{ ingredient: string; quantity: number; unit: string }>>;

  // meal history
  getMealHistory(dateRange?: { start: string; end: string }): Promise<MealHistory[]>;
  getMealHistoryForDate(date: string): Promise<MealHistory[]>;
  createMealHistoryEntry(entry: Omit<MealHistory, 'id' | 'createdAt' | 'updatedAt'>): Promise<MealHistory>;
  updateMealHistoryEntry(id: string, entry: Partial<MealHistory>): Promise<MealHistory>;
  deleteMealHistoryEntry(id: string): Promise<void>;
  getMealHistoryForRecipe(recipeId: string, limit?: number): Promise<MealHistory[]>;

  // recipe reviews
  getRecipeReviews(recipeId?: string): Promise<RecipeReview[]>;
  getRecipeReview(id: string): Promise<RecipeReview | null>;
  createRecipeReview(review: Omit<RecipeReview, 'id' | 'createdAt' | 'updatedAt'>): Promise<RecipeReview>;
  updateRecipeReview(id: string, review: Partial<RecipeReview>): Promise<RecipeReview>;
  deleteRecipeReview(id: string): Promise<void>;
  getRecipeReviewsByReviewer(reviewerId: string): Promise<RecipeReview[]>;
  getAverageRating(recipeId: string): Promise<number | null>;
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
  async createTask(task: Task) {
    const list = loadTasks(); list.unshift(task); saveTasks(list);
    clearRecurrenceCache(); // Clear cache when tasks change
    return task;
  }
  async updateTask(task: Task) {
    const list = loadTasks();
    const idx = list.findIndex(t => t.id === task.id);
    if (idx >= 0) list[idx] = task; else list.unshift(task);
    saveTasks(list);
    invalidateRecurrenceCache([task.id]); // Invalidate specific task cache
    return task;
  }
  async deleteTask(taskId: string) {
    const list = loadTasks().filter(t => t.id !== taskId);
    saveTasks(list);
    invalidateRecurrenceCache([taskId]); // Invalidate specific task cache
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

  // User profiles - LocalStorage implementation
  async getUserProfiles() {
    const raw = localStorage.getItem('fd:userProfiles');
    return raw ? JSON.parse(raw) as UserProfile[] : [];
  }

  async createUserProfile(profile: Omit<UserProfile, 'id' | 'createdAt' | 'lastActive'>) {
    const profiles = await this.getUserProfiles();
    const newProfile: UserProfile = {
      ...profile,
      id: `profile_${Date.now()}_${Math.floor(Math.random() * 1e6)}`,
      createdAt: new Date().toISOString(),
      lastActive: new Date().toISOString(),
    };
    profiles.push(newProfile);
    localStorage.setItem('fd:userProfiles', JSON.stringify(profiles));
    return newProfile;
  }

  async updateUserProfile(id: string, patch: Partial<UserProfile>) {
    const profiles = await this.getUserProfiles();
    const idx = profiles.findIndex(p => p.id === id);
    if (idx >= 0) {
      profiles[idx] = { ...profiles[idx], ...patch, lastActive: new Date().toISOString() };
      localStorage.setItem('fd:userProfiles', JSON.stringify(profiles));
      return profiles[idx];
    }
    throw new Error('Profile not found');
  }

  async deleteUserProfile(id: string) {
    const profiles = await this.getUserProfiles();
    const filtered = profiles.filter(p => p.id !== id);
    localStorage.setItem('fd:userProfiles', JSON.stringify(filtered));
  }

  // Task assignments - LocalStorage implementation
  async getTaskAssignments() {
    const raw = localStorage.getItem('fd:taskAssignments');
    return raw ? JSON.parse(raw) as TaskAssignment[] : [];
  }

  async assignTask(assignment: Omit<TaskAssignment, 'assignedAt'>) {
    const assignments = await this.getTaskAssignments();
    const newAssignment: TaskAssignment = {
      ...assignment,
      assignedAt: new Date().toISOString(),
    };
    assignments.push(newAssignment);
    localStorage.setItem('fd:taskAssignments', JSON.stringify(assignments));
    return newAssignment;
  }

  async unassignTask(taskId: string, userId: string) {
    const assignments = await this.getTaskAssignments();
    const filtered = assignments.filter(a => !(a.taskId === taskId && a.userId === userId));
    localStorage.setItem('fd:taskAssignments', JSON.stringify(filtered));
  }

  async getTaskAssignmentsForUser(userId: string) {
    const assignments = await this.getTaskAssignments();
    return assignments.filter(a => a.userId === userId);
  }

  // Task templates - LocalStorage implementation
  async getTaskTemplates() {
    const raw = localStorage.getItem('fd:taskTemplates');
    return raw ? JSON.parse(raw) as TaskTemplate[] : [];
  }

  async createTaskTemplate(template: Omit<TaskTemplate, 'id' | 'createdAt' | 'usageCount'>) {
    const templates = await this.getTaskTemplates();
    const newTemplate: TaskTemplate = {
      ...template,
      id: `template_${Date.now()}_${Math.floor(Math.random() * 1e6)}`,
      createdAt: new Date().toISOString(),
      usageCount: 0,
    };
    templates.push(newTemplate);
    localStorage.setItem('fd:taskTemplates', JSON.stringify(templates));
    return newTemplate;
  }

  async updateTaskTemplate(id: string, patch: Partial<TaskTemplate>) {
    const templates = await this.getTaskTemplates();
    const idx = templates.findIndex(t => t.id === id);
    if (idx >= 0) {
      templates[idx] = { ...templates[idx], ...patch };
      localStorage.setItem('fd:taskTemplates', JSON.stringify(templates));
      return templates[idx];
    }
    throw new Error('Template not found');
  }

  async deleteTaskTemplate(id: string) {
    const templates = await this.getTaskTemplates();
    const filtered = templates.filter(t => t.id !== id);
    localStorage.setItem('fd:taskTemplates', JSON.stringify(filtered));
  }

  async createTaskFromTemplate(templateId: string, overrides?: Partial<Task>) {
    const templates = await this.getTaskTemplates();
    const template = templates.find(t => t.id === templateId);
    if (!template) throw new Error('Template not found');

    // Increment usage count
    await this.updateTaskTemplate(templateId, { usageCount: template.usageCount + 1 });

    // Create task from template
    const task: Task = {
      id: `task_${Date.now()}_${Math.floor(Math.random() * 1e6)}`,
      title: template.name,
      notes: template.notes,
      createdAt: new Date().toISOString(),
      type: template.recurrence ? 'recurring' : 'one-off',
      category: template.category,
      recurrence: template.recurrence,
      assignedTo: template.assignedTo,
      ...overrides,
    };

    return task;
  }

  // Recipe methods - LocalStorage implementation
  async getRecipes() {
    const raw = localStorage.getItem('fd:recipes');
    return raw ? JSON.parse(raw) as Recipe[] : [];
  }

  async createRecipe(recipe: Omit<Recipe, 'id' | 'createdAt' | 'updatedAt' | 'usageCount'>) {
    const recipes = await this.getRecipes();
    const newRecipe: Recipe = {
      ...recipe,
      id: `recipe_${Date.now()}_${Math.floor(Math.random() * 1e6)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      usageCount: 0,
    };
    recipes.push(newRecipe);
    localStorage.setItem('fd:recipes', JSON.stringify(recipes));
    return newRecipe;
  }

  async updateRecipe(id: string, patch: Partial<Recipe>) {
    const recipes = await this.getRecipes();
    const idx = recipes.findIndex(r => r.id === id);
    if (idx >= 0) {
      recipes[idx] = { ...recipes[idx], ...patch, updatedAt: new Date().toISOString() };
      localStorage.setItem('fd:recipes', JSON.stringify(recipes));
      return recipes[idx];
    }
    throw new Error('Recipe not found');
  }

  async deleteRecipe(id: string) {
    const recipes = await this.getRecipes();
    const filtered = recipes.filter(r => r.id !== id);
    localStorage.setItem('fd:recipes', JSON.stringify(filtered));
  }

  async searchRecipes(query: string) {
    const recipes = await this.getRecipes();
    const lowerQuery = query.toLowerCase();
    return recipes.filter(recipe =>
      recipe.name.toLowerCase().includes(lowerQuery) ||
      recipe.description?.toLowerCase().includes(lowerQuery) ||
      recipe.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
    );
  }

  // Meal plan methods - LocalStorage implementation
  async getMealPlans(dateRange?: { start: string; end: string }) {
    const raw = localStorage.getItem('fd:mealPlans');
    const plans = raw ? JSON.parse(raw) as MealPlan[] : [];

    if (dateRange) {
      return plans.filter(plan => {
        const planDate = new Date(plan.date);
        const startDate = new Date(dateRange.start);
        const endDate = new Date(dateRange.end);
        return planDate >= startDate && planDate <= endDate;
      });
    }

    return plans;
  }

  async getMealPlan(date: string) {
    const plans = await this.getMealPlans();
    return plans.find(p => p.date === date) || null;
  }

  async createMealPlan(plan: Omit<MealPlan, 'id' | 'createdAt' | 'updatedAt'>) {
    const plans = await this.getMealPlans();
    const newPlan: MealPlan = {
      ...plan,
      id: `mealplan_${Date.now()}_${Math.floor(Math.random() * 1e6)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    plans.push(newPlan);
    localStorage.setItem('fd:mealPlans', JSON.stringify(plans));
    return newPlan;
  }

  async updateMealPlan(id: string, patch: Partial<MealPlan>) {
    const plans = await this.getMealPlans();
    const idx = plans.findIndex(p => p.id === id);
    if (idx >= 0) {
      plans[idx] = { ...plans[idx], ...patch, updatedAt: new Date().toISOString() };
      localStorage.setItem('fd:mealPlans', JSON.stringify(plans));
      return plans[idx];
    }
    throw new Error('Meal plan not found');
  }

  async deleteMealPlan(id: string) {
    const plans = await this.getMealPlans();
    const filtered = plans.filter(p => p.id !== id);
    localStorage.setItem('fd:mealPlans', JSON.stringify(filtered));
  }

  async generateGroceryListFromMealPlan(mealPlanId: string) {
    const plans = await this.getMealPlans();
    const plan = plans.find(p => p.id === mealPlanId);
    if (!plan) throw new Error('Meal plan not found');

    const recipes = await this.getRecipes();
    const groceryItems: Array<{ ingredient: string; quantity: number; unit: string }> = [];

    // Collect ingredients from all meals in the plan
    Object.values(plan.meals).forEach(meal => {
      if (meal && 'recipeId' in meal && meal.recipeId) {
        const recipe = recipes.find(r => r.id === meal.recipeId);
        if (recipe) {
          const multiplier = meal.servings / recipe.servings;
          recipe.ingredients.forEach(ingredient => {
            groceryItems.push({
              ingredient: ingredient.name,
              quantity: ingredient.quantity * multiplier,
              unit: ingredient.unit
            });
          });
        }
      }
    });

    return groceryItems;
  }

  // Meal History methods - LocalStorage implementation
  async getMealHistory(dateRange?: { start: string; end: string }) {
    const raw = localStorage.getItem('fd:mealHistory');
    const history = raw ? JSON.parse(raw) as MealHistory[] : [];

    if (dateRange) {
      return history.filter(entry => {
        const entryDate = new Date(entry.date);
        const startDate = new Date(dateRange.start);
        const endDate = new Date(dateRange.end);
        return entryDate >= startDate && entryDate <= endDate;
      });
    }

    return history;
  }

  async getMealHistoryForDate(date: string) {
    const history = await this.getMealHistory();
    return history.filter(entry => entry.date === date);
  }

  async createMealHistoryEntry(entry: Omit<MealHistory, 'id' | 'createdAt' | 'updatedAt'>) {
    const history = await this.getMealHistory();
    const newEntry: MealHistory = {
      ...entry,
      id: `mealhistory_${Date.now()}_${Math.floor(Math.random() * 1e6)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    history.push(newEntry);
    localStorage.setItem('fd:mealHistory', JSON.stringify(history));
    return newEntry;
  }

  async updateMealHistoryEntry(id: string, patch: Partial<MealHistory>) {
    const history = await this.getMealHistory();
    const idx = history.findIndex(entry => entry.id === id);
    if (idx >= 0) {
      history[idx] = { ...history[idx], ...patch, updatedAt: new Date().toISOString() };
      localStorage.setItem('fd:mealHistory', JSON.stringify(history));
      return history[idx];
    }
    throw new Error('Meal history entry not found');
  }

  async deleteMealHistoryEntry(id: string) {
    const history = await this.getMealHistory();
    const filtered = history.filter(entry => entry.id !== id);
    localStorage.setItem('fd:mealHistory', JSON.stringify(filtered));
  }

  async getMealHistoryForRecipe(recipeId: string, limit?: number) {
    const history = await this.getMealHistory();
    const recipeHistory = history
      .filter(entry => entry.recipeId === recipeId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return limit ? recipeHistory.slice(0, limit) : recipeHistory;
  }

  // Recipe Review methods - LocalStorage implementation
  async getRecipeReviews(recipeId?: string) {
    const raw = localStorage.getItem('fd:recipeReviews');
    const reviews = raw ? JSON.parse(raw) as RecipeReview[] : [];

    if (recipeId) {
      return reviews.filter(review => review.recipeId === recipeId);
    }

    return reviews;
  }

  async getRecipeReview(id: string) {
    const reviews = await this.getRecipeReviews();
    return reviews.find(review => review.id === id) || null;
  }

  async createRecipeReview(review: Omit<RecipeReview, 'id' | 'createdAt' | 'updatedAt'>) {
    const reviews = await this.getRecipeReviews();
    const newReview: RecipeReview = {
      ...review,
      id: `review_${Date.now()}_${Math.floor(Math.random() * 1e6)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    reviews.push(newReview);
    localStorage.setItem('fd:recipeReviews', JSON.stringify(reviews));
    return newReview;
  }

  async updateRecipeReview(id: string, patch: Partial<RecipeReview>) {
    const reviews = await this.getRecipeReviews();
    const idx = reviews.findIndex(review => review.id === id);
    if (idx >= 0) {
      reviews[idx] = { ...reviews[idx], ...patch, updatedAt: new Date().toISOString() };
      localStorage.setItem('fd:recipeReviews', JSON.stringify(reviews));
      return reviews[idx];
    }
    throw new Error('Recipe review not found');
  }

  async deleteRecipeReview(id: string) {
    const reviews = await this.getRecipeReviews();
    const filtered = reviews.filter(review => review.id !== id);
    localStorage.setItem('fd:recipeReviews', JSON.stringify(filtered));
  }

  async getRecipeReviewsByReviewer(reviewerId: string) {
    const reviews = await this.getRecipeReviews();
    return reviews.filter(review => review.reviewerId === reviewerId);
  }

  async getAverageRating(recipeId: string) {
    const reviews = await this.getRecipeReviews(recipeId);
    if (reviews.length === 0) return null;

    const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
    return Math.round((totalRating / reviews.length) * 10) / 10; // Round to 1 decimal
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
  async createTask(task: Task) {
    const result = await this.req('/tasks', { method: 'POST', body: JSON.stringify(task) });
    clearRecurrenceCache(); // Clear cache when tasks change
    return result;
  }
  async updateTask(task: Task) {
    const result = await this.req(`/tasks/${task.id}`, { method: 'PUT', body: JSON.stringify(task) });
    invalidateRecurrenceCache([task.id]); // Invalidate specific task cache
    return result;
  }
  async deleteTask(taskId: string) {
    await this.req(`/tasks/${taskId}`, { method: 'DELETE' });
    invalidateRecurrenceCache([taskId]); // Invalidate specific task cache
  }

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

  // Task templates - Backend implementation
  async getTaskTemplates() { return this.req('/task-templates'); }
  async createTaskTemplate(template: Omit<TaskTemplate, 'id' | 'createdAt' | 'usageCount'>) { return this.req('/task-templates', { method: 'POST', body: JSON.stringify(template) }); }
  async updateTaskTemplate(id: string, template: Partial<TaskTemplate>) { return this.req(`/task-templates/${id}`, { method: 'PUT', body: JSON.stringify(template) }); }
  async deleteTaskTemplate(id: string) { await this.req(`/task-templates/${id}`, { method: 'DELETE' }); }
  async createTaskFromTemplate(templateId: string, overrides?: Partial<Task>) { return this.req(`/task-templates/${templateId}/create-task`, { method: 'POST', body: JSON.stringify(overrides || {}) }); }

  // User profiles - Backend implementation
  async getUserProfiles() { return this.req('/user-profiles'); }
  async createUserProfile(profile: Omit<UserProfile, 'id' | 'createdAt' | 'lastActive'>) { return this.req('/user-profiles', { method: 'POST', body: JSON.stringify(profile) }); }
  async updateUserProfile(id: string, profile: Partial<UserProfile>) { return this.req(`/user-profiles/${id}`, { method: 'PUT', body: JSON.stringify(profile) }); }
  async deleteUserProfile(id: string) { await this.req(`/user-profiles/${id}`, { method: 'DELETE' }); }

  // Task assignments - Backend implementation
  async getTaskAssignments() { return this.req('/task-assignments'); }
  async assignTask(assignment: Omit<TaskAssignment, 'assignedAt'>) { return this.req('/task-assignments', { method: 'POST', body: JSON.stringify(assignment) }); }
  async unassignTask(taskId: string, userId: string) { await this.req('/task-assignments', { method: 'DELETE', body: JSON.stringify({ taskId, userId }) }); }
  async getTaskAssignmentsForUser(userId: string) { return this.req(`/task-assignments?userId=${encodeURIComponent(userId)}`); }

  // Recipe methods - Backend implementation
  async getRecipes() { return this.req('/recipes'); }
  async createRecipe(recipe: Omit<Recipe, 'id' | 'createdAt' | 'updatedAt' | 'usageCount'>) { return this.req('/recipes', { method: 'POST', body: JSON.stringify(recipe) }); }
  async updateRecipe(id: string, recipe: Partial<Recipe>) { return this.req(`/recipes/${id}`, { method: 'PUT', body: JSON.stringify(recipe) }); }
  async deleteRecipe(id: string) { await this.req(`/recipes/${id}`, { method: 'DELETE' }); }
  async searchRecipes(query: string) { return this.req(`/recipes/search?q=${encodeURIComponent(query)}`); }

  // Meal plan methods - Backend implementation
  async getMealPlans(dateRange?: { start: string; end: string }) {
    const params = dateRange ? `?start=${encodeURIComponent(dateRange.start)}&end=${encodeURIComponent(dateRange.end)}` : '';
    return this.req(`/meal-plans${params}`);
  }
  async getMealPlan(date: string) { return this.req(`/meal-plans/${date}`); }
  async createMealPlan(plan: Omit<MealPlan, 'id' | 'createdAt' | 'updatedAt'>) { return this.req('/meal-plans', { method: 'POST', body: JSON.stringify(plan) }); }
  async updateMealPlan(id: string, plan: Partial<MealPlan>) { return this.req(`/meal-plans/${id}`, { method: 'PUT', body: JSON.stringify(plan) }); }
  async deleteMealPlan(id: string) { await this.req(`/meal-plans/${id}`, { method: 'DELETE' }); }
  async generateGroceryListFromMealPlan(mealPlanId: string) { return this.req(`/meal-plans/${mealPlanId}/grocery-list`); }

  // Meal History methods - Backend implementation
  async getMealHistory(dateRange?: { start: string; end: string }) {
    const params = dateRange ? `?start=${encodeURIComponent(dateRange.start)}&end=${encodeURIComponent(dateRange.end)}` : '';
    return this.req(`/meal-history${params}`);
  }

  async getMealHistoryForDate(date: string) { return this.req(`/meal-history?date=${encodeURIComponent(date)}`); }
  async createMealHistoryEntry(entry: Omit<MealHistory, 'id' | 'createdAt' | 'updatedAt'>) { return this.req('/meal-history', { method: 'POST', body: JSON.stringify(entry) }); }
  async updateMealHistoryEntry(id: string, entry: Partial<MealHistory>) { return this.req(`/meal-history/${id}`, { method: 'PUT', body: JSON.stringify(entry) }); }
  async deleteMealHistoryEntry(id: string) { await this.req(`/meal-history/${id}`, { method: 'DELETE' }); }
  async getMealHistoryForRecipe(recipeId: string, limit?: number) {
    const limitParam = limit ? `&limit=${limit}` : '';
    return this.req(`/meal-history?recipeId=${encodeURIComponent(recipeId)}${limitParam}`);
  }

  // Recipe Review methods - Backend implementation
  async getRecipeReviews(recipeId?: string) {
    const recipeParam = recipeId ? `?recipeId=${encodeURIComponent(recipeId)}` : '';
    return this.req(`/recipe-reviews${recipeParam}`);
  }

  async getRecipeReview(id: string) { return this.req(`/recipe-reviews/${id}`); }
  async createRecipeReview(review: Omit<RecipeReview, 'id' | 'createdAt' | 'updatedAt'>) { return this.req('/recipe-reviews', { method: 'POST', body: JSON.stringify(review) }); }
  async updateRecipeReview(id: string, review: Partial<RecipeReview>) { return this.req(`/recipe-reviews/${id}`, { method: 'PUT', body: JSON.stringify(review) }); }
  async deleteRecipeReview(id: string) { await this.req(`/recipe-reviews/${id}`, { method: 'DELETE' }); }
  async getRecipeReviewsByReviewer(reviewerId: string) { return this.req(`/recipe-reviews?reviewerId=${encodeURIComponent(reviewerId)}`); }
  async getAverageRating(recipeId: string) {
    const reviews = await this.getRecipeReviews(recipeId);
    if (reviews.length === 0) return null;
    const totalRating = reviews.reduce((sum: number, review: RecipeReview) => sum + review.rating, 0);
    return Math.round((totalRating / reviews.length) * 10) / 10;
  }
}

// Migration helper
export async function migrateLocalStorageToBackend(dal: IDataAccess): Promise<void> {
   if (dal instanceof LocalStorageAdapter) return; // No migration needed for localStorage

   const { loadTasks, loadCompletions, loadNotes } = await import('./storage');

   try {
     // Check if migration already completed
     const migrationKey = 'fd:migration:completed';
     const migrationCompleted = localStorage.getItem(migrationKey);
     if (migrationCompleted) return;

     console.log('Starting localStorage to SQLite migration...');

     // Migrate tasks
     const localTasks = loadTasks();
     if (localTasks.length > 0) {
       console.log(`Migrating ${localTasks.length} tasks...`);
       for (const task of localTasks) {
         try {
           await dal.createTask(task);
         } catch (err) {
           console.warn(`Failed to migrate task ${task.id}:`, err);
         }
       }
     }

     // Migrate completions
     const localCompletions = loadCompletions();
     if (localCompletions.length > 0) {
       console.log(`Migrating ${localCompletions.length} completions...`);
       for (const completion of localCompletions) {
         try {
           await dal.addCompletion(completion);
         } catch (err) {
           console.warn(`Failed to migrate completion for task ${completion.taskId}:`, err);
         }
       }
     }

     // Migrate notes
     const localNotes = loadNotes();
     const noteDates = Object.keys(localNotes);
     if (noteDates.length > 0) {
       console.log(`Migrating ${noteDates.length} notes...`);
       for (const dateIso of noteDates) {
         try {
           await dal.saveNote(dateIso, localNotes[dateIso]);
         } catch (err) {
           console.warn(`Failed to migrate note for ${dateIso}:`, err);
         }
       }
     }

     // Mark migration as completed
     localStorage.setItem(migrationKey, new Date().toISOString());
     console.log('Migration completed successfully');

   } catch (error) {
     console.error('Migration failed:', error);
     // Don't throw - allow app to continue with backend
   }
}

// Factory: choose backend by env flag
export function createDAL(): IDataAccess {
   const w = globalThis as unknown as { __FAMILY_DASHBOARD_BACKEND__?: boolean };
   const useBackend = (typeof w.__FAMILY_DASHBOARD_BACKEND__ === 'boolean') ? w.__FAMILY_DASHBOARD_BACKEND__! : false; // default to localStorage
   return useBackend ? new BackendAdapter('/api') : new LocalStorageAdapter();
}
