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

export type UserProfile = {
  id: UUID;
  name: string;
  email?: string;
  avatar?: string; // URL or emoji
  color: string; // hex color for UI theming
  role: 'parent' | 'child' | 'guest';
  permissions: {
    canCreateTasks: boolean;
    canEditAllTasks: boolean;
    canDeleteTasks: boolean;
    canAssignTasks: boolean;
    canManageUsers: boolean;
    canViewAllTasks: boolean;
    canEditSettings: boolean;
  };
  preferences: {
    notifications: boolean;
    theme: 'light' | 'dark' | 'auto';
    weekStart: 'monday' | 'sunday';
  };
  createdAt: string; // ISO
  lastActive: string; // ISO
};

// Helper function to get default permissions based on role
export function getDefaultPermissions(role: 'parent' | 'child' | 'guest') {
  switch (role) {
    case 'parent':
      return {
        canCreateTasks: true,
        canEditAllTasks: true,
        canDeleteTasks: true,
        canAssignTasks: true,
        canManageUsers: true,
        canViewAllTasks: true,
        canEditSettings: true,
      };
    case 'child':
      return {
        canCreateTasks: true,
        canEditAllTasks: false, // Can only edit their own tasks
        canDeleteTasks: false,  // Cannot delete tasks
        canAssignTasks: false,  // Cannot assign tasks to others
        canManageUsers: false,  // Cannot manage users
        canViewAllTasks: true,  // Can view all tasks
        canEditSettings: false, // Cannot edit settings
      };
    case 'guest':
      return {
        canCreateTasks: false, // Cannot create tasks
        canEditAllTasks: false, // Cannot edit tasks
        canDeleteTasks: false,  // Cannot delete tasks
        canAssignTasks: false,  // Cannot assign tasks
        canManageUsers: false,  // Cannot manage users
        canViewAllTasks: false, // Can only view assigned tasks
        canEditSettings: false, // Cannot edit settings
      };
    default:
      return {
        canCreateTasks: false,
        canEditAllTasks: false,
        canDeleteTasks: false,
        canAssignTasks: false,
        canManageUsers: false,
        canViewAllTasks: false,
        canEditSettings: false,
      };
  }
}

export type TaskAssignment = {
  taskId: UUID;
  userId: UUID;
  assignedAt: string; // ISO
  assignedBy?: UUID; // user who assigned it
};

export type TaskTemplate = {
  id: UUID;
  name: string;
  description?: string;
  category: 'meals' | 'chores' | 'other';
  estimatedDuration?: number; // in minutes
  priority?: 'low' | 'medium' | 'high';
  recurrence?: Recurrence;
  assignedTo?: string; // default assignee
  notes?: string;
  createdBy: UUID;
  createdAt: string; // ISO
  usageCount: number;
};

export type Recipe = {
  id: UUID;
  name: string;
  description?: string;
  ingredients: Array<{
    name: string;
    quantity: number;
    unit: string;
    category?: string;
  }>;
  instructions: string[];
  prepTime?: number; // in minutes
  cookTime?: number; // in minutes
  servings: number;
  cuisine?: string;
  dietaryRestrictions?: string[];
  nutritionalInfo?: {
    calories?: number;
    protein?: number;
    carbs?: number;
    fat?: number;
    fiber?: number;
    sugar?: number;
    sodium?: number;
    cholesterol?: number;
    potassium?: number;
    vitaminA?: number;
    vitaminC?: number;
    calcium?: number;
    iron?: number;
  };
  imageUrl?: string;
  sourceUrl?: string;
  createdBy: UUID;
  createdAt: string; // ISO
  updatedAt: string; // ISO
  tags: string[];
  rating?: number; // 1-5 stars
  usageCount: number;
};

export type MealPlan = {
  id: UUID;
  date: string; // ISO date
  meals: {
    breakfast?: {
      recipeId?: UUID;
      customMeal?: string;
      servings: number;
    };
    lunch?: {
      recipeId?: UUID;
      customMeal?: string;
      servings: number;
    };
    dinner?: {
      recipeId?: UUID;
      customMeal?: string;
      servings: number;
    };
    snacks?: Array<{
      recipeId?: UUID;
      customMeal?: string;
      servings: number;
    }>;
  };
  totalNutrition?: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    fiber: number;
  };
  groceryListGenerated: boolean;
  createdBy: UUID;
  createdAt: string; // ISO
  updatedAt: string; // ISO
};

export type MealHistory = {
  id: UUID;
  date: string; // ISO date
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  recipeId?: UUID;
  customMeal?: string;
  servings: number;
  rating?: number; // 1-5 stars
  notes?: string;
  actualServings?: number; // if different from planned
  leftovers?: string; // what was left over
  familyMembers: UUID[]; // who ate this meal
  createdBy: UUID;
  createdAt: string; // ISO
  updatedAt: string; // ISO
};

export type RecipeReview = {
  id: UUID;
  recipeId: UUID;
  reviewerId: UUID; // family member who wrote the review
  mealHistoryId?: UUID; // link to specific meal instance
  rating: number; // 1-5 stars
  title?: string;
  review: string;
  wouldMakeAgain: boolean;
  improvements?: string; // suggestions for improvement
  tags: string[]; // quick tags like "too salty", "great texture", etc.
  photos?: string[]; // URLs to photos of the finished dish
  createdAt: string; // ISO
  updatedAt: string; // ISO
};
