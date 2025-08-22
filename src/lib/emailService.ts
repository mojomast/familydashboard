export interface EmailPreferences {
  enabled: boolean;
  taskReminders: boolean;
  mealReminders: boolean;
  dailySummary: boolean;
  weeklyReport: boolean;
  urgentTasks: boolean;
  quietHours: {
    enabled: boolean;
    start: string; // HH:MM format
    end: string;   // HH:MM format
  };
  frequency: 'immediate' | 'hourly' | 'daily' | 'weekly';
}

export interface EmailTemplate {
  id: string;
  subject: string;
  body: string;
  variables: string[];
}

export interface EmailNotification {
  to: string;
  subject: string;
  body: string;
  type: 'task-reminder' | 'meal-reminder' | 'daily-summary' | 'weekly-report' | 'urgent-task';
  priority: 'low' | 'normal' | 'high';
}

export interface IEmailService {
  sendEmail(notification: EmailNotification): Promise<boolean>;
  getEmailTemplates(): Promise<EmailTemplate[]>;
  getEmailTemplate(id: string): Promise<EmailTemplate | null>;
  updateEmailTemplate(id: string, template: Partial<EmailTemplate>): Promise<EmailTemplate>;
  testEmailSettings(email: string): Promise<boolean>;
}

export class EmailService implements IEmailService {
  private apiBaseUrl: string;

  constructor(apiBaseUrl = '/api') {
    this.apiBaseUrl = apiBaseUrl;
  }

  async sendEmail(notification: EmailNotification): Promise<boolean> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/email/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(notification),
      });

      if (!response.ok) {
        throw new Error(`Email send failed: ${response.statusText}`);
      }

      const result = await response.json();
      return result.success;
    } catch (error) {
      console.error('Email service error:', error);
      return false;
    }
  }

  async getEmailTemplates(): Promise<EmailTemplate[]> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/email/templates`);
      if (!response.ok) {
        throw new Error(`Failed to fetch templates: ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Failed to fetch email templates:', error);
      return this.getDefaultTemplates();
    }
  }

  async getEmailTemplate(id: string): Promise<EmailTemplate | null> {
    try {
      const templates = await this.getEmailTemplates();
      return templates.find(t => t.id === id) || null;
    } catch (error) {
      console.error('Failed to fetch email template:', error);
      return null;
    }
  }

  async updateEmailTemplate(id: string, template: Partial<EmailTemplate>): Promise<EmailTemplate> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/email/templates/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(template),
      });

      if (!response.ok) {
        throw new Error(`Failed to update template: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to update email template:', error);
      throw error;
    }
  }

  async testEmailSettings(email: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/email/test`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        throw new Error(`Email test failed: ${response.statusText}`);
      }

      const result = await response.json();
      return result.success;
    } catch (error) {
      console.error('Email test failed:', error);
      return false;
    }
  }

  private getDefaultTemplates(): EmailTemplate[] {
    return [
      {
        id: 'task-reminder',
        subject: 'Task Reminder: {{taskTitle}}',
        body: `Hi {{familyMemberName}},

This is a reminder for your task: **{{taskTitle}}**

**Due Date:** {{dueDate}}
**Notes:** {{taskNotes}}

Don't forget to mark it complete when you're done!

Best,
Family Dashboard`,
        variables: ['taskTitle', 'familyMemberName', 'dueDate', 'taskNotes']
      },
      {
        id: 'meal-reminder',
        subject: 'Meal Reminder: {{mealName}}',
        body: `Hi {{familyMemberName}},

This is a reminder about today's meal: **{{mealName}}**

**Time:** {{mealTime}}
**Type:** {{mealType}}

Enjoy your meal!

Best,
Family Dashboard`,
        variables: ['mealName', 'familyMemberName', 'mealTime', 'mealType']
      },
      {
        id: 'daily-summary',
        subject: 'Daily Family Summary - {{date}}',
        body: `Hi Family,

Here's your daily summary for {{date}}:

**Completed Tasks:** {{completedTasksCount}}
**Pending Tasks:** {{pendingTasksCount}}
**Meals Planned:** {{mealsCount}}

**Recent Activity:**
{{recentActivity}}

Keep up the great work!

Best,
Family Dashboard`,
        variables: ['date', 'completedTasksCount', 'pendingTasksCount', 'mealsCount', 'recentActivity']
      },
      {
        id: 'weekly-report',
        subject: 'Weekly Family Report - {{weekStart}} to {{weekEnd}}',
        body: `Hi Family,

Here's your weekly report for {{weekStart}} to {{weekEnd}}:

**📊 Weekly Stats:**
- Total Tasks: {{totalTasks}}
- Completed: {{completedTasks}} ({{completionRate}}%)
- Family Members Active: {{activeMembers}}

**🏆 Top Performers:**
{{topPerformers}}

**🍽️ Popular Recipes:**
{{popularRecipes}}

**📈 Trends:**
{{weeklyTrends}}

Great job this week, team!

Best,
Family Dashboard`,
        variables: ['weekStart', 'weekEnd', 'totalTasks', 'completedTasks', 'completionRate', 'activeMembers', 'topPerformers', 'popularRecipes', 'weeklyTrends']
      },
      {
        id: 'urgent-task',
        subject: '🚨 Urgent Task: {{taskTitle}}',
        body: `Hi {{familyMemberName}},

There's an urgent task that needs your attention:

**{{taskTitle}}**
**Due:** {{dueDate}}
**Priority:** High

**Notes:** {{taskNotes}}

Please address this as soon as possible!

Best,
Family Dashboard`,
        variables: ['taskTitle', 'familyMemberName', 'dueDate', 'taskNotes']
      }
    ];
  }
}

// Email notification scheduler
export class EmailScheduler {
  private emailService: IEmailService;
  private intervalId: ReturnType<typeof setInterval> | null = null;
  private isRunning: boolean = false;

  constructor(emailService: IEmailService) {
    this.emailService = emailService;
  }

  start(): void {
    if (this.isRunning) return;

    this.isRunning = true;
    // Check for notifications every 5 minutes
    this.intervalId = setInterval(() => this.processNotifications(), 5 * 60 * 1000);

    // Also check immediately
    this.processNotifications();
  }

  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isRunning = false;
  }

  private async processNotifications(): Promise<void> {
    try {
      // This would typically fetch pending notifications from the server
      // For now, we'll just log that the scheduler is running
      console.log('Email scheduler running - checking for notifications...');
    } catch (error) {
      console.error('Email scheduler error:', error);
    }
  }
}

// Utility functions for email templates
export const emailTemplateUtils = {
  formatDate: (date: Date): string => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  },

  formatTime: (date: Date): string => {
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit'
    });
  },

  truncateText: (text: string, maxLength: number): string => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength).trim() + '...';
  }
};