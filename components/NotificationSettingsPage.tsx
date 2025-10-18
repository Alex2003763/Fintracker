import React, { useState, useEffect } from 'react';
import { User, NotificationSettings } from '../types';
import { ChevronUpIcon } from './icons';

interface NotificationPermissionHandlerProps {
  onPermissionGranted: () => void;
}

const NotificationPermissionHandler: React.FC<NotificationPermissionHandlerProps> = ({ onPermissionGranted }) => {
  const [permissionStatus, setPermissionStatus] = useState<NotificationPermission | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    // Check current permission status
    if ('Notification' in window) {
      setPermissionStatus(Notification.permission);
    } else {
      setPermissionStatus('denied');
      setMessage('Notifications are not supported in this browser');
    }
  }, []);

  const requestPermission = async () => {
    if (!('Notification' in window)) {
      setMessage('Notifications are not supported in this browser');
      return;
    }

    setIsLoading(true);
    setMessage('');

    try {
      const permission = await Notification.requestPermission();
      setPermissionStatus(permission);

      if (permission === 'granted') {
        setMessage('✅ Notifications enabled successfully!');
        onPermissionGranted();
      } else if (permission === 'denied') {
        setMessage('❌ Notifications were denied. You can enable them in your browser settings.');
      } else {
        setMessage('⚠️ Notifications permission was not granted.');
      }
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      setMessage('❌ Failed to request notification permission.');
    } finally {
      setIsLoading(false);
    }
  };

  const getButtonText = () => {
    if (isLoading) return 'Requesting...';
    if (permissionStatus === 'granted') return '✅ Notifications Enabled';
    if (permissionStatus === 'denied') return '❌ Enable Notifications';
    return 'Allow Notifications';
  };

  const getButtonClass = () => {
    if (permissionStatus === 'granted') return 'bg-green-600 hover:bg-green-700';
    if (permissionStatus === 'denied') return 'bg-red-600 hover:bg-red-700';
    return 'bg-blue-600 hover:bg-blue-700';
  };

  return (
    <div className="space-y-3">
      <button
        onClick={requestPermission}
        disabled={isLoading || permissionStatus === 'granted'}
        className={`${getButtonClass()} text-white px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
      >
        {getButtonText()}
      </button>
      {message && (
        <p className={`text-sm ${
          message.includes('✅') ? 'text-green-600' :
          message.includes('❌') || message.includes('⚠️') ? 'text-red-600' :
          'text-blue-600'
        }`}>
          {message}
        </p>
      )}
      {permissionStatus === 'denied' && (
        <p className="text-xs text-gray-500">
          To enable notifications, go to your browser settings and allow notifications for this site.
        </p>
      )}
    </div>
  );
};

interface NotificationSettingsPageProps {
  user: User;
  onUpdateUser: (updatedUser: User) => void;
  onBack: () => void;
}

const NotificationSettingsPage: React.FC<NotificationSettingsPageProps> = ({
  user,
  onUpdateUser,
  onBack
}) => {
  const [settings, setSettings] = useState<NotificationSettings>(
    user.notificationSettings || {
      goalProgress: { enabled: true, milestones: [25, 50, 75, 100] },
      billReminders: { enabled: true, advanceDays: 1 },
      budgetAlerts: { enabled: true, thresholds: [80, 90, 100] },
      monthlyReports: { enabled: false, frequency: 'monthly' },
      pushNotifications: { enabled: false, quietHours: { start: "22:00", end: "08:00" } }
    }
  );

  const [hasChanges, setHasChanges] = useState(false);

  const handleSave = () => {
    const updatedUser = { ...user, notificationSettings: settings };
    onUpdateUser(updatedUser);
    setHasChanges(false);
  };

  const updateSetting = (category: keyof NotificationSettings, key: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [key]: value
      }
    }));
    setHasChanges(true);
  };

  const toggleMilestone = (milestone: number) => {
    setSettings(prev => ({
      ...prev,
      goalProgress: {
        ...prev.goalProgress,
        milestones: prev.goalProgress.milestones.includes(milestone)
          ? prev.goalProgress.milestones.filter(m => m !== milestone)
          : [...prev.goalProgress.milestones, milestone].sort((a, b) => a - b)
      }
    }));
    setHasChanges(true);
  };

  return (
    <div className="min-h-screen bg-[rgb(var(--color-bg-rgb))] text-[rgb(var(--color-text-rgb))]">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-[rgb(var(--color-bg-rgb))] border-b border-[rgb(var(--color-border-rgb))] p-4">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="p-2 hover:bg-[rgb(var(--color-card-muted-rgb))] rounded-lg transition-colors"
          >
            <ChevronUpIcon className="h-5 w-5" />
          </button>
          <h1 className="text-xl font-bold">Notification Settings</h1>
          {hasChanges && (
            <button
              onClick={handleSave}
              className="ml-auto bg-[rgb(var(--color-primary-rgb))] text-white px-4 py-2 rounded-lg font-medium hover:bg-[rgb(var(--color-primary-hover-rgb))] transition-colors"
            >
              Save Changes
            </button>
          )}
        </div>
      </div>

      <div className="p-4 max-w-2xl mx-auto space-y-6">
        {/* Goal Progress Notifications */}
        <div className="bg-[rgb(var(--color-card-rgb))] rounded-2xl p-6 border border-[rgb(var(--color-border-rgb))]">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold">Goal Progress</h2>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.goalProgress.enabled}
                onChange={(e) => updateSetting('goalProgress', 'enabled', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[rgb(var(--color-primary-rgb))]"></div>
            </label>
          </div>

          {settings.goalProgress.enabled && (
            <div className="space-y-3">
              <p className="text-sm text-[rgb(var(--color-text-muted-rgb))]">
                Notify me when I reach these milestones:
              </p>
              <div className="flex flex-wrap gap-2">
                {[25, 50, 75, 100].map(milestone => (
                  <button
                    key={milestone}
                    onClick={() => toggleMilestone(milestone)}
                    className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                      settings.goalProgress.milestones.includes(milestone)
                        ? 'bg-[rgb(var(--color-primary-rgb))] text-white'
                        : 'bg-[rgb(var(--color-card-muted-rgb))] text-[rgb(var(--color-text-muted-rgb))]'
                    }`}
                  >
                    {milestone}%
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Bill Reminders */}
        <div className="bg-[rgb(var(--color-card-rgb))] rounded-2xl p-6 border border-[rgb(var(--color-border-rgb))]">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold">Bill Reminders</h2>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.billReminders.enabled}
                onChange={(e) => updateSetting('billReminders', 'enabled', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[rgb(var(--color-primary-rgb))]"></div>
            </label>
          </div>

          {settings.billReminders.enabled && (
            <div className="space-y-3">
              <p className="text-sm text-[rgb(var(--color-text-muted-rgb))]">
                Remind me in advance:
              </p>
              <select
                value={settings.billReminders.advanceDays}
                onChange={(e) => updateSetting('billReminders', 'advanceDays', parseInt(e.target.value))}
                className="bg-[rgb(var(--color-card-muted-rgb))] border border-[rgb(var(--color-border-rgb))] rounded-lg px-3 py-2 text-sm"
              >
                <option value={1}>1 day before</option>
                <option value={3}>3 days before</option>
                <option value={7}>1 week before</option>
              </select>
            </div>
          )}
        </div>

        {/* Budget Alerts */}
        <div className="bg-[rgb(var(--color-card-rgb))] rounded-2xl p-6 border border-[rgb(var(--color-border-rgb))]">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold">Budget Alerts</h2>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.budgetAlerts.enabled}
                onChange={(e) => updateSetting('budgetAlerts', 'enabled', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[rgb(var(--color-primary-rgb))]"></div>
            </label>
          </div>

          {settings.budgetAlerts.enabled && (
            <div className="space-y-3">
              <p className="text-sm text-[rgb(var(--color-text-muted-rgb))]">
                Alert me when I reach these budget thresholds:
              </p>
              <div className="flex flex-wrap gap-2">
                {settings.budgetAlerts.thresholds.map(threshold => (
                  <div key={threshold} className="flex items-center gap-2">
                    <span className="text-sm">{threshold}%</span>
                    <button
                      onClick={() => {
                        const newThresholds = settings.budgetAlerts.thresholds.filter(t => t !== threshold);
                        updateSetting('budgetAlerts', 'thresholds', newThresholds);
                      }}
                      className="text-red-500 hover:text-red-700 text-sm"
                    >
                      ×
                    </button>
                  </div>
                ))}
                <button
                  onClick={() => {
                    const availableThresholds = [50, 60, 70, 80, 90, 95, 100];
                    const nextThreshold = availableThresholds.find(t => !settings.budgetAlerts.thresholds.includes(t));
                    if (nextThreshold) {
                      updateSetting('budgetAlerts', 'thresholds', [...settings.budgetAlerts.thresholds, nextThreshold].sort((a, b) => a - b));
                    }
                  }}
                  className="text-[rgb(var(--color-primary-rgb))] hover:text-[rgb(var(--color-primary-hover-rgb))] text-sm"
                >
                  + Add Threshold
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Push Notifications */}
        <div className="bg-[rgb(var(--color-card-rgb))] rounded-2xl p-6 border border-[rgb(var(--color-border-rgb))]">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold">Browser Push Notifications</h2>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.pushNotifications.enabled}
                onChange={(e) => updateSetting('pushNotifications', 'enabled', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[rgb(var(--color-primary-rgb))]"></div>
            </label>
          </div>

          {settings.pushNotifications.enabled && (
            <div className="space-y-3">
              <p className="text-sm text-[rgb(var(--color-text-muted-rgb))]">
                Quiet hours (no notifications):
              </p>
              <div className="flex items-center gap-2">
                <input
                  type="time"
                  value={settings.pushNotifications.quietHours.start}
                  onChange={(e) => updateSetting('pushNotifications', 'quietHours', {
                    ...settings.pushNotifications.quietHours,
                    start: e.target.value
                  })}
                  className="bg-[rgb(var(--color-card-muted-rgb))] border border-[rgb(var(--color-border-rgb))] rounded-lg px-3 py-2 text-sm"
                />
                <span className="text-sm text-[rgb(var(--color-text-muted-rgb))]">to</span>
                <input
                  type="time"
                  value={settings.pushNotifications.quietHours.end}
                  onChange={(e) => updateSetting('pushNotifications', 'quietHours', {
                    ...settings.pushNotifications.quietHours,
                    end: e.target.value
                  })}
                  className="bg-[rgb(var(--color-card-muted-rgb))] border border-[rgb(var(--color-border-rgb))] rounded-lg px-3 py-2 text-sm"
                />
              </div>
            </div>
          )}
        </div>

        {/* Request Permission Button for Push Notifications */}
        {settings.pushNotifications.enabled && (
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-2xl p-6 border border-blue-200 dark:border-blue-800">
            <h3 className="text-lg font-bold text-blue-900 dark:text-blue-100 mb-2">
              Enable Push Notifications
            </h3>
            <p className="text-sm text-blue-700 dark:text-blue-300 mb-4">
              Get notified even when the app is closed. Click below to allow notifications.
            </p>
            <NotificationPermissionHandler
              onPermissionGranted={() => {
                updateSetting('pushNotifications', 'enabled', true);
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationSettingsPage;