import React, { useState, useEffect } from 'react';
import type { UserProfile } from '../types';
import { notificationManager } from '../lib/realtime';
import { createDAL } from '../lib/dal';

interface NotificationSettingsProps {
  familyMembers: UserProfile[];
  onClose: () => void;
}

export const NotificationSettings: React.FC<NotificationSettingsProps> = ({
  familyMembers,
  onClose
}) => {
  const [permissionStatus, setPermissionStatus] = useState<NotificationPermission>('default');
  const [settings, setSettings] = useState({
    taskReminders: true,
    mealReminders: true,
    completionCelebrations: false,
    reminderAdvanceTime: 60, // minutes before due time
    quietHoursStart: '22:00',
    quietHoursEnd: '08:00'
  });

  const dal = createDAL();

  useEffect(() => {
    setPermissionStatus(notificationManager.getPermissionStatus());
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const savedSettings = await dal.getSetting<typeof settings>('notificationSettings');
      if (savedSettings) {
        setSettings({ ...settings, ...savedSettings });
      }
    } catch (error) {
      console.error('Failed to load notification settings:', error);
    }
  };

  const saveSettings = async () => {
    try {
      await dal.setSetting('notificationSettings', settings);
    } catch (error) {
      console.error('Failed to save notification settings:', error);
    }
  };

  const requestPermission = async () => {
    const granted = await notificationManager.requestPermission();
    setPermissionStatus(granted ? 'granted' : 'denied');

    if (granted) {
      // Send a test notification
      new Notification('Family Dashboard', {
        body: 'Notifications are now enabled! 🎉',
        icon: '/vite.svg'
      });
    }
  };

  const handleSettingChange = (key: keyof typeof settings, value: any) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    saveSettings();
  };

  const getPermissionStatusText = () => {
    switch (permissionStatus) {
      case 'granted':
        return '✅ Enabled';
      case 'denied':
        return '❌ Disabled (check browser settings)';
      default:
        return '⏳ Not requested';
    }
  };

  const getPermissionStatusColor = () => {
    switch (permissionStatus) {
      case 'granted':
        return 'text-green-600';
      case 'denied':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <div className="notification-settings">
      <div className="settings-header">
        <h2>Notification Settings</h2>
        <button className="btn-secondary" onClick={onClose}>Close</button>
      </div>

      <div className="settings-content">
        {/* Permission Status */}
        <div className="setting-section">
          <h3>Browser Notifications</h3>
          <div className="permission-status">
            <span>Status: <span className={getPermissionStatusColor()}>{getPermissionStatusText()}</span></span>
            {permissionStatus !== 'granted' && (
              <button className="btn-primary" onClick={requestPermission}>
                Enable Notifications
              </button>
            )}
          </div>
          <p className="setting-description">
            Browser notifications help remind you about upcoming tasks and meal times.
          </p>
        </div>

        {/* Notification Types */}
        <div className="setting-section">
          <h3>Notification Types</h3>

          <div className="setting-item">
            <label className="setting-label">
              <input
                type="checkbox"
                checked={settings.taskReminders}
                onChange={(e) => handleSettingChange('taskReminders', e.target.checked)}
                disabled={permissionStatus !== 'granted'}
              />
              Task Reminders
            </label>
            <p className="setting-description">
              Get notified before tasks are due
            </p>
          </div>

          <div className="setting-item">
            <label className="setting-label">
              <input
                type="checkbox"
                checked={settings.mealReminders}
                onChange={(e) => handleSettingChange('mealReminders', e.target.checked)}
                disabled={permissionStatus !== 'granted'}
              />
              Meal Reminders
            </label>
            <p className="setting-description">
              Get notified 15 minutes before scheduled meal times
            </p>
          </div>

          <div className="setting-item">
            <label className="setting-label">
              <input
                type="checkbox"
                checked={settings.completionCelebrations}
                onChange={(e) => handleSettingChange('completionCelebrations', e.target.checked)}
                disabled={permissionStatus !== 'granted'}
              />
              Completion Celebrations
            </label>
            <p className="setting-description">
              Celebrate when family members complete tasks
            </p>
          </div>
        </div>

        {/* Timing Settings */}
        <div className="setting-section">
          <h3>Timing Settings</h3>

          <div className="setting-item">
            <label className="setting-label">
              Task Reminder Time
              <select
                value={settings.reminderAdvanceTime}
                onChange={(e) => handleSettingChange('reminderAdvanceTime', parseInt(e.target.value))}
                disabled={permissionStatus !== 'granted'}
                className="setting-select"
              >
                <option value={15}>15 minutes before</option>
                <option value={30}>30 minutes before</option>
                <option value={60}>1 hour before</option>
                <option value={120}>2 hours before</option>
                <option value={240}>4 hours before</option>
              </select>
            </label>
          </div>

          <div className="setting-item">
            <label className="setting-label">
              Quiet Hours Start
              <input
                type="time"
                value={settings.quietHoursStart}
                onChange={(e) => handleSettingChange('quietHoursStart', e.target.value)}
                disabled={permissionStatus !== 'granted'}
                className="setting-input"
              />
            </label>
          </div>

          <div className="setting-item">
            <label className="setting-label">
              Quiet Hours End
              <input
                type="time"
                value={settings.quietHoursEnd}
                onChange={(e) => handleSettingChange('quietHoursEnd', e.target.value)}
                disabled={permissionStatus !== 'granted'}
                className="setting-input"
              />
            </label>
          </div>
        </div>

        {/* Test Notifications */}
        {permissionStatus === 'granted' && (
          <div className="setting-section">
            <h3>Test Notifications</h3>
            <div className="test-buttons">
              <button
                className="btn-secondary"
                onClick={() => {
                  new Notification('Family Dashboard - Test', {
                    body: 'This is a test notification!',
                    icon: '/vite.svg'
                  });
                }}
              >
                Send Test Notification
              </button>
              <button
                className="btn-secondary"
                onClick={() => {
                  notificationManager.scheduleTaskReminder(
                    'Test Task',
                    new Date(Date.now() + 5000).toISOString(),
                    'Test User'
                  );
                }}
              >
                Schedule Test Reminder (5s)
              </button>
            </div>
          </div>
        )}

        {/* Browser Settings Info */}
        <div className="setting-section">
          <h3>Browser Settings</h3>
          <p className="setting-description">
            If notifications are disabled, you can enable them in your browser settings:
          </p>
          <ul className="browser-settings-list">
            <li><strong>Chrome:</strong> Settings → Privacy → Notifications → Allow</li>
            <li><strong>Firefox:</strong> Preferences → Privacy & Security → Permissions → Notifications</li>
            <li><strong>Safari:</strong> Preferences → Websites → Notifications</li>
            <li><strong>Edge:</strong> Settings → Cookies and site permissions → Notifications</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default NotificationSettings;