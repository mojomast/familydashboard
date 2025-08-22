import React, { useEffect, useState } from 'react';
import { createDAL } from '../lib/dal';
import { EmailService } from '../lib/emailService';
import type { EmailPreferences, EmailTemplate } from '../lib/emailService';

type CatKey = 'meals' | 'chores' | 'other';

export const Settings: React.FC = () => {
  const dal = createDAL();
  const emailService = new EmailService();
  const [cats, setCats] = useState<Array<{ key: CatKey; name: string; bg?: string; fg?: string; border?: string }>>([]);
  const [weekDays, setWeekDays] = useState<number>(5);

  // Email settings state
  const [emailPreferences, setEmailPreferences] = useState<EmailPreferences>({
    enabled: false,
    taskReminders: true,
    mealReminders: true,
    dailySummary: false,
    weeklyReport: true,
    urgentTasks: true,
    quietHours: {
      enabled: false,
      start: '22:00',
      end: '07:00'
    },
    frequency: 'daily'
  });
  const [emailTemplates, setEmailTemplates] = useState<EmailTemplate[]>([]);
  const [testEmailAddress, setTestEmailAddress] = useState('');
  const [isTestingEmail, setIsTestingEmail] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  useEffect(() => {
    (async () => {
    try { setCats(await dal.getCategories()); } catch { /* ignore */ }
      try { const wd = await dal.getSetting<number>('weekDays'); if (wd) setWeekDays(Number(wd)); } catch { /* ignore */ }

      // Load email preferences
      try {
        const saved = localStorage.getItem('fd:emailPreferences');
        if (saved) {
          setEmailPreferences(JSON.parse(saved));
        }
      } catch { /* ignore */ }

      // Load email templates
      try {
        const templates = await emailService.getEmailTemplates();
        setEmailTemplates(templates);
      } catch { /* ignore */ }
    })();
  }, [dal]);

  const updateCat = async (key: CatKey, patch: Partial<{ name: string; bg: string; fg: string; border: string }>) => {
    setCats((s) => s.map(c => c.key === key ? { ...c, ...patch } : c));
    try { await dal.updateCategory(key, patch); } catch { /* ignore */ }
  };
  const saveWeekDays = async (n: number) => {
    setWeekDays(n);
    try { await dal.setSetting('weekDays', n); } catch { /* ignore */ }
  };

  // Email settings functions
  const updateEmailPreference = <K extends keyof EmailPreferences>(
    key: K,
    value: EmailPreferences[K]
  ) => {
    const newPreferences = { ...emailPreferences, [key]: value };
    setEmailPreferences(newPreferences);
    localStorage.setItem('fd:emailPreferences', JSON.stringify(newPreferences));
  };

  const updateQuietHours = (updates: Partial<EmailPreferences['quietHours']>) => {
    const newPreferences = {
      ...emailPreferences,
      quietHours: { ...emailPreferences.quietHours, ...updates }
    };
    setEmailPreferences(newPreferences);
    localStorage.setItem('fd:emailPreferences', JSON.stringify(newPreferences));
  };

  const handleTestEmail = async () => {
    if (!testEmailAddress || !testEmailAddress.includes('@')) {
      setTestResult({ success: false, message: 'Please enter a valid email address' });
      return;
    }

    setIsTestingEmail(true);
    setTestResult(null);

    try {
      const success = await emailService.testEmailSettings(testEmailAddress);
      setTestResult({
        success,
        message: success
          ? `Test email sent successfully to ${testEmailAddress}`
          : 'Failed to send test email. Please check your settings.'
      });
    } catch (error) {
      setTestResult({
        success: false,
        message: 'Failed to send test email. Please try again.'
      });
    } finally {
      setIsTestingEmail(false);
    }
  };

  return (
    <div className="container-sm">
      <h2 className="text-center">Settings</h2>
      <section>
        <h3>Categories</h3>
        {cats.map(c => (
          <div key={c.key} className="hstack-6">
            <strong style={{ minWidth: 70, display: 'inline-block' }}>{c.key}</strong>
            <label>Name <input value={c.name} onChange={(e) => updateCat(c.key, { name: e.target.value })} /></label>
            <label>Bg <input type="color" value={c.bg || '#ffffff'} onChange={(e) => updateCat(c.key, { bg: e.target.value })} /></label>
            <label>Fg <input type="color" value={c.fg || '#000000'} onChange={(e) => updateCat(c.key, { fg: e.target.value })} /></label>
            <label>Border <input type="color" value={c.border || '#cccccc'} onChange={(e) => updateCat(c.key, { border: e.target.value })} /></label>
          </div>
        ))}
      </section>

      <section style={{ marginTop: 16 }}>
        <h3>Week View</h3>
        <label>
          Days to show:
          <select value={weekDays} onChange={(e) => saveWeekDays(Number(e.target.value))} style={{ marginLeft: 8 }}>
            <option value={5}>5</option>
            <option value={7}>7</option>
          </select>
        </label>
      </section>

      <section style={{ marginTop: 16 }}>
        <h3>Email Notifications</h3>

        <div style={{ marginBottom: 12 }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <input
              type="checkbox"
              checked={emailPreferences.enabled}
              onChange={(e) => updateEmailPreference('enabled', e.target.checked)}
            />
            Enable Email Notifications
          </label>
        </div>

        {emailPreferences.enabled && (
          <>
            <div style={{ marginBottom: 12 }}>
              <label>
                Email Frequency:
                <select
                  value={emailPreferences.frequency}
                  onChange={(e) => updateEmailPreference('frequency', e.target.value as any)}
                  style={{ marginLeft: 8 }}
                >
                  <option value="immediate">Immediate (Real-time)</option>
                  <option value="hourly">Hourly Digest</option>
                  <option value="daily">Daily Summary</option>
                  <option value="weekly">Weekly Report</option>
                </select>
              </label>
            </div>

            <div style={{ marginBottom: 12 }}>
              <h4>Notification Types</h4>
              <div style={{ display: 'grid', gap: 8 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <input
                    type="checkbox"
                    checked={emailPreferences.taskReminders}
                    onChange={(e) => updateEmailPreference('taskReminders', e.target.checked)}
                  />
                  Task Reminders
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <input
                    type="checkbox"
                    checked={emailPreferences.mealReminders}
                    onChange={(e) => updateEmailPreference('mealReminders', e.target.checked)}
                  />
                  Meal Reminders
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <input
                    type="checkbox"
                    checked={emailPreferences.dailySummary}
                    onChange={(e) => updateEmailPreference('dailySummary', e.target.checked)}
                  />
                  Daily Summary
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <input
                    type="checkbox"
                    checked={emailPreferences.weeklyReport}
                    onChange={(e) => updateEmailPreference('weeklyReport', e.target.checked)}
                  />
                  Weekly Report
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <input
                    type="checkbox"
                    checked={emailPreferences.urgentTasks}
                    onChange={(e) => updateEmailPreference('urgentTasks', e.target.checked)}
                  />
                  Urgent Task Alerts
                </label>
              </div>
            </div>

            <div style={{ marginBottom: 12 }}>
              <h4>Quiet Hours</h4>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input
                  type="checkbox"
                  checked={emailPreferences.quietHours.enabled}
                  onChange={(e) => updateQuietHours({ enabled: e.target.checked })}
                />
                Enable Quiet Hours
              </label>
              {emailPreferences.quietHours.enabled && (
                <div style={{ marginTop: 8, display: 'flex', gap: 8, alignItems: 'center' }}>
                  <div>
                    <label htmlFor="quiet-start-time">Start Time:</label>
                    <input
                      id="quiet-start-time"
                      type="time"
                      value={emailPreferences.quietHours.start}
                      onChange={(e) => updateQuietHours({ start: e.target.value })}
                      style={{ marginLeft: 4 }}
                    />
                  </div>
                  <div>
                    <label htmlFor="quiet-end-time">End Time:</label>
                    <input
                      id="quiet-end-time"
                      type="time"
                      value={emailPreferences.quietHours.end}
                      onChange={(e) => updateQuietHours({ end: e.target.value })}
                      style={{ marginLeft: 4 }}
                    />
                  </div>
                </div>
              )}
            </div>

            <div style={{ marginBottom: 12 }}>
              <h4>Test Email Settings</h4>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <input
                  type="email"
                  value={testEmailAddress}
                  onChange={(e) => setTestEmailAddress(e.target.value)}
                  placeholder="Enter your email address"
                  style={{ flex: 1 }}
                />
                <button
                  onClick={handleTestEmail}
                  disabled={isTestingEmail}
                  style={{ padding: '4px 12px' }}
                >
                  {isTestingEmail ? 'Sending...' : 'Send Test'}
                </button>
              </div>
              {testResult && (
                <div style={{
                  marginTop: 8,
                  padding: 8,
                  backgroundColor: testResult.success ? '#d4edda' : '#f8d7da',
                  color: testResult.success ? '#155724' : '#721c24',
                  borderRadius: 4
                }}>
                  {testResult.message}
                </div>
              )}
            </div>

            <div style={{ marginTop: 16 }}>
              <h4>Email Templates ({emailTemplates.length})</h4>
              <div style={{ fontSize: '12px', color: '#666' }}>
                Email templates are managed automatically. Default templates are provided for all notification types.
              </div>
            </div>
          </>
        )}
      </section>
    </div>
  );
};

export default Settings;
