import type { Task, UserProfile } from '../types';
import { createDAL } from './dal';

export interface SyncEvent {
  type: 'task_created' | 'task_updated' | 'task_deleted' |
        'completion_added' | 'completion_removed' |
        'profile_created' | 'profile_updated' | 'profile_deleted' |
        'note_saved';
  data: any;
  timestamp: number;
  source: string; // device/browser identifier
}

export interface SyncState {
  isOnline: boolean;
  isSyncing: boolean;
  lastSyncTime: number;
  pendingChanges: number;
  connectionStatus: 'connected' | 'disconnected' | 'connecting' | 'error';
}

class RealTimeSync {
  private ws: WebSocket | null = null;
  private eventListeners: Map<string, Set<(event: SyncEvent) => void>> = new Map();
  private syncState: SyncState = {
    isOnline: navigator.onLine,
    isSyncing: false,
    lastSyncTime: Date.now(),
    pendingChanges: 0,
    connectionStatus: 'disconnected'
  };
  private syncStateListeners: Set<(state: SyncState) => void> = new Set();
  private dal = createDAL();
  private deviceId = this.generateDeviceId();
  private syncQueue: SyncEvent[] = [];
  private isProcessingQueue = false;

  constructor() {
    this.setupNetworkListeners();
    this.setupStorageListeners();
    this.connect();
  }

  private generateDeviceId(): string {
    let deviceId = localStorage.getItem('familydashboard_device_id');
    if (!deviceId) {
      deviceId = `device_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('familydashboard_device_id', deviceId);
    }
    return deviceId;
  }

  private setupNetworkListeners() {
    window.addEventListener('online', () => {
      this.updateSyncState({ isOnline: true });
      this.connect();
    });

    window.addEventListener('offline', () => {
      this.updateSyncState({ isOnline: false, connectionStatus: 'disconnected' });
      this.disconnect();
    });
  }

  private setupStorageListeners() {
    // Listen for storage changes from other tabs
    window.addEventListener('storage', (e) => {
      if (e.key?.startsWith('familydashboard:')) {
        this.triggerSync();
      }
    });

    // Listen for custom events
    window.addEventListener('familydashboard:data-changed', () => {
      this.triggerSync();
    });
  }

  private connect() {
    if (!this.syncState.isOnline || this.ws) return;

    try {
      this.updateSyncState({ connectionStatus: 'connecting' });

      // For now, we'll use a polling-based approach
      // In a real implementation, this would connect to a WebSocket server
      this.ws = {
        readyState: WebSocket.OPEN,
        send: (data: string) => {
          console.log('Sending data:', data);
          // Simulate WebSocket send
        },
        close: () => {
          this.ws = null;
        }
      } as any;

      this.updateSyncState({ connectionStatus: 'connected' });
      this.startPolling();
    } catch (error) {
      console.error('Failed to connect:', error);
      this.updateSyncState({ connectionStatus: 'error' });
    }
  }

  private disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.updateSyncState({ connectionStatus: 'disconnected' });
  }

  private startPolling() {
    // Poll for changes every 30 seconds
    setInterval(() => {
      if (this.syncState.isOnline && this.syncState.connectionStatus === 'connected') {
        this.triggerSync();
      }
    }, 30000);
  }

  private async triggerSync() {
    if (this.syncState.isSyncing) return;

    this.updateSyncState({ isSyncing: true });

    try {
      // Sync tasks
      const remoteTasks = await this.dal.getTasks();
      const localTasks = JSON.parse(localStorage.getItem('familydashboard_tasks') || '[]');

      // Compare and merge changes
      const mergedTasks = this.mergeTaskChanges(localTasks, remoteTasks);
      if (mergedTasks) {
        // Update tasks one by one using DAL methods
        for (const task of mergedTasks) {
          try {
            await this.dal.updateTask(task);
          } catch (error) {
            console.error(`Failed to sync task ${task.id}:`, error);
          }
        }

        localStorage.setItem('familydashboard_tasks', JSON.stringify(mergedTasks));

        // Notify listeners
        this.emit('tasks_synced', {
          type: 'task_updated',
          data: { tasks: mergedTasks },
          timestamp: Date.now(),
          source: 'sync'
        });
      }

      this.updateSyncState({
        isSyncing: false,
        lastSyncTime: Date.now(),
        pendingChanges: 0
      });

    } catch (error) {
      console.error('Sync failed:', error);
      this.updateSyncState({ isSyncing: false });
    }
  }

  private mergeTaskChanges(localTasks: Task[], remoteTasks: Task[]): Task[] | null {
    // Simple merge strategy: prefer remote changes, but keep local additions
    const localMap = new Map(localTasks.map(t => [t.id, t]));
    const remoteMap = new Map(remoteTasks.map(t => [t.id, t]));

    const merged: Task[] = [];

    // Add all remote tasks
    for (const remoteTask of remoteTasks) {
      const localTask = localMap.get(remoteTask.id);
      if (!localTask) {
        // New remote task
        merged.push(remoteTask);
      } else {
        // Compare timestamps to resolve conflicts
        const remoteTime = new Date(remoteTask.createdAt).getTime();
        const localTime = new Date(localTask.createdAt).getTime();

        if (remoteTime > localTime) {
          // Remote is newer
          merged.push(remoteTask);
        } else {
          // Local is newer or same
          merged.push(localTask);
        }
      }
    }

    // Add local tasks that don't exist remotely
    for (const localTask of localTasks) {
      if (!remoteMap.has(localTask.id)) {
        merged.push(localTask);
      }
    }

    // Check if there are actual changes
    const hasChanges = merged.length !== remoteTasks.length ||
      merged.some((task, index) => task.id !== remoteTasks[index]?.id);

    return hasChanges ? merged : null;
  }

  // Public API
  public emit(eventType: string, event: SyncEvent) {
    event.source = event.source || this.deviceId;
    event.timestamp = event.timestamp || Date.now();

    // Store in queue for processing
    this.syncQueue.push(event);

    // Process queue if not already processing
    if (!this.isProcessingQueue) {
      this.processEventQueue();
    }
  }

  private async processEventQueue() {
    if (this.isProcessingQueue || this.syncQueue.length === 0) return;

    this.isProcessingQueue = true;

    while (this.syncQueue.length > 0) {
      const event = this.syncQueue.shift()!;

      // Notify local listeners
      const listeners = this.eventListeners.get(event.type) || new Set();
      listeners.forEach(listener => {
        try {
          listener(event);
        } catch (error) {
          console.error('Event listener error:', error);
        }
      });

      // Broadcast to other tabs via localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem(`familydashboard:${event.type}:${Date.now()}`, JSON.stringify(event));
        // Clean up old events
        setTimeout(() => {
          localStorage.removeItem(`familydashboard:${event.type}:${event.timestamp}`);
        }, 1000);
      }
    }

    this.isProcessingQueue = false;
  }

  public on(eventType: string, listener: (event: SyncEvent) => void) {
    if (!this.eventListeners.has(eventType)) {
      this.eventListeners.set(eventType, new Set());
    }
    this.eventListeners.get(eventType)!.add(listener);

    // Return unsubscribe function
    return () => {
      const listeners = this.eventListeners.get(eventType);
      if (listeners) {
        listeners.delete(listener);
        if (listeners.size === 0) {
          this.eventListeners.delete(eventType);
        }
      }
    };
  }

  public onSyncStateChange(listener: (state: SyncState) => void) {
    this.syncStateListeners.add(listener);

    // Return unsubscribe function
    return () => {
      this.syncStateListeners.delete(listener);
    };
  }

  private updateSyncState(updates: Partial<SyncState>) {
    this.syncState = { ...this.syncState, ...updates };
    this.syncStateListeners.forEach(listener => {
      try {
        listener({ ...this.syncState });
      } catch (error) {
        console.error('Sync state listener error:', error);
      }
    });
  }

  public getSyncState(): SyncState {
    return { ...this.syncState };
  }

  public forceSync() {
    this.triggerSync();
  }
}

// Create singleton instance
export const realtimeSync = new RealTimeSync();

// Export convenience functions
export const emitSyncEvent = (type: SyncEvent['type'], data: any) => {
  realtimeSync.emit(type, { type, data, timestamp: Date.now(), source: '' });
};

export const onSyncEvent = (type: string, listener: (event: SyncEvent) => void) => {
  return realtimeSync.on(type, listener);
};

export const useSyncState = () => {
  const [state, setState] = React.useState(realtimeSync.getSyncState());

  React.useEffect(() => {
    const unsubscribe = realtimeSync.onSyncStateChange(setState);
    return unsubscribe;
  }, []);

  return state;
};

// Import React for useSyncState hook
import React from 'react';

// Browser Notifications System
export class NotificationManager {
  private static instance: NotificationManager;
  private permission: NotificationPermission = 'default';

  static getInstance(): NotificationManager {
    if (!NotificationManager.instance) {
      NotificationManager.instance = new NotificationManager();
    }
    return NotificationManager.instance;
  }

  async requestPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
      console.warn('This browser does not support notifications');
      return false;
    }

    if (Notification.permission === 'granted') {
      this.permission = 'granted';
      return true;
    }

    if (Notification.permission === 'denied') {
      this.permission = 'denied';
      return false;
    }

    const result = await Notification.requestPermission();
    this.permission = result;
    return result === 'granted';
  }

  async scheduleTaskReminder(taskTitle: string, dueDate: string, assignee?: string): Promise<void> {
    if (this.permission !== 'granted') {
      const granted = await this.requestPermission();
      if (!granted) return;
    }

    const dueTime = new Date(dueDate).getTime();
    const now = Date.now();
    const timeUntilDue = dueTime - now;

    // Don't schedule if task is more than 7 days away or already past
    if (timeUntilDue < 0 || timeUntilDue > 7 * 24 * 60 * 60 * 1000) {
      return;
    }

    // Schedule notification for 1 hour before due time, or immediately if less than 1 hour away
    const notificationTime = timeUntilDue > 60 * 60 * 1000 ? dueTime - 60 * 60 * 1000 : now + 1000;

    setTimeout(() => {
      const notification = new Notification('Family Dashboard - Task Reminder', {
          body: `${assignee ? `${assignee}: ` : ''}${taskTitle} is due soon!`,
          icon: '/vite.svg',
          tag: `task-${taskTitle}`,
          requireInteraction: true
        });

      notification.onclick = () => {
        window.focus();
        notification.close();
      };

      // Handle notification actions
      notification.addEventListener('click', (event) => {
        const clickedAction = (event as any).action;
        if (clickedAction === 'complete') {
          // Emit task completion event
          realtimeSync.emit('completion_added', {
            type: 'completion_added',
            data: { taskTitle, completedAt: new Date().toISOString() },
            timestamp: Date.now(),
            source: 'notification'
          });
        } else if (clickedAction === 'remind') {
          // Schedule another reminder in 1 hour
          setTimeout(() => {
            new Notification('Family Dashboard - Reminder', {
              body: `${taskTitle} - Follow up`,
              icon: '/vite.svg',
              tag: `task-${taskTitle}-followup`
            });
          }, 60 * 60 * 1000);
        }
      });

    }, Math.max(0, notificationTime - now));
  }

  async scheduleMealReminder(mealType: string, mealName: string, scheduledTime: string): Promise<void> {
    if (this.permission !== 'granted') {
      const granted = await this.requestPermission();
      if (!granted) return;
    }

    const mealTime = new Date(scheduledTime).getTime();
    const now = Date.now();
    const timeUntilMeal = mealTime - now;

    // Don't schedule if meal is more than 2 hours away or already past
    if (timeUntilMeal < 0 || timeUntilMeal > 2 * 60 * 60 * 1000) {
      return;
    }

    // Schedule notification for 15 minutes before meal time
    const notificationTime = Math.max(0, timeUntilMeal - 15 * 60 * 1000);

    setTimeout(() => {
      new Notification('Family Dashboard - Meal Time!', {
        body: `Time to prepare ${mealName} (${mealType})`,
        icon: '/vite.svg',
        tag: `meal-${mealType}`,
        requireInteraction: false
      });
    }, notificationTime);
  }

  async sendCompletionCelebration(familyMember: string, taskTitle: string): Promise<void> {
    if (this.permission !== 'granted') return;

    new Notification('Family Dashboard - Great Job! 🎉', {
      body: `${familyMember} completed: ${taskTitle}`,
      icon: '/vite.svg',
      tag: 'completion-celebration'
    });
  }

  getPermissionStatus(): NotificationPermission {
    return this.permission;
  }
}

export const notificationManager = NotificationManager.getInstance();