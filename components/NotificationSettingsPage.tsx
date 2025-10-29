import React, { useState, useEffect } from 'react';
import { User, NotificationSettings } from '../types';
import { ChevronUpIcon } from './icons';
import { requestNotificationPermission } from '../utils/notifications';

interface NotificationPermissionHandlerProps {
  onPermissionGranted: () => void;
}

const NotificationPermissionHandler: React.FC<NotificationPermissionHandlerProps> = ({ onPermissionGranted }) => {
  const [permissionStatus, setPermissionStatus] = useState<NotificationPermission | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if ('Notification' in window) {
      setPermissionStatus(Notification.permission);
    } else {
      setPermissionStatus('denied');
      setMessage('Notifications are not supported in this browser');
    }
  }, []);

  const handleRequestPermission = async () => {
    setIsLoading(true);
    setMessage('');

    const granted = await requestNotificationPermission();

    if (granted) {
      setPermissionStatus('granted');
      setMessage('✅ Notifications enabled successfully!');
      onPermissionGranted();
    } else {
      // After the request, the permission status will be either 'denied' or 'default'
      const currentPermission = 'Notification' in window ? Notification.permission : 'denied';
      setPermissionStatus(currentPermission);
      if (currentPermission === 'denied') {
        setMessage('❌ Notifications were denied. You can enable them in your browser settings.');
      } else {
        setMessage('⚠️ Notifications permission was not granted.');
      }
    }

    setIsLoading(false);
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
    return 'bg-[rgb(var(--color-primary-rgb))] hover:bg-[rgb(var(--color-primary-hover-rgb))]';
  };

  return (
    <div className="space-y-3">
      <button
        onClick={handleRequestPermission}
        disabled={isLoading || permissionStatus === 'granted'}
        className={`${getButtonClass()} text-white px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
      >
        {getButtonText()}
      </button>
      {message && (
        <div className={`p-3 rounded-lg text-sm font-medium ${
          message.includes('✅') ? 'bg-green-50 text-green-700 border border-green-200' :
          message.includes('❌') || message.includes('⚠️') ? 'bg-red-50 text-red-700 border border-red-200' :
          'bg-[rgb(var(--color-primary-rgb))]/10 text-[rgb(var(--color-primary-rgb))]'
        }`}>
          {message}
        </div>
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
    <div className="min-h-screen bg-[rgb(var(--color-background-rgb))] text-[rgb(var(--color-text-rgb))]">
      {/* Header */}
      <div className="top-0 z-10 bg-[rgb(var(--color-background-rgb))] border-b border-[rgb(var(--color-border-rgb))] p-4">
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

      <div className="p-6 max-w-4xl mx-auto space-y-8">
        {/* Goal Progress Notifications */}
        <div className="bg-[rgb(var(--color-card-rgb))] rounded-2xl p-6 border border-[rgb(var(--color-border-rgb))] shadow-sm hover:shadow-md transition-all duration-200">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-br from-green-100 to-green-50 rounded-lg">
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                </svg>
              </div>
              <h2 className="text-xl font-bold">Goal Progress</h2>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.goalProgress.enabled}
                onChange={(e) => updateSetting('goalProgress', 'enabled', e.target.checked)}
                className="sr-only peer"
              />
              <div className={`w-12 h-7 bg-[rgb(var(--color-border-rgb))] peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-[rgb(var(--color-primary-rgb))] rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-[rgb(var(--color-primary-rgb))]`}></div>
            </label>
          </div>

          {settings.goalProgress.enabled && (
            <div className="space-y-4">
              <p className="text-sm text-[rgb(var(--color-text-muted-rgb))]">
                Notify me when I reach these milestones:
              </p>
              <div className="flex flex-wrap gap-3">
                {[25, 50, 75, 100].map(milestone => (
                  <button
                    key={milestone}
                    onClick={() => toggleMilestone(milestone)}
                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 transform hover:scale-105 ${
                      settings.goalProgress.milestones.includes(milestone)
                        ? 'bg-[rgb(var(--color-primary-rgb))] text-[rgb(var(--color-primary-text-rgb))] shadow-sm'
                        : 'bg-[rgb(var(--color-card-muted-rgb))] text-[rgb(var(--color-text-muted-rgb))] hover:bg-[rgb(var(--color-border-rgb))]'
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
        <div className="bg-[rgb(var(--color-card-rgb))] rounded-2xl p-6 border border-[rgb(var(--color-border-rgb))] shadow-sm hover:shadow-md transition-all duration-200">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-br from-blue-100 to-blue-50 rounded-lg">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h2 className="text-xl font-bold">Bill Reminders</h2>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.billReminders.enabled}
                onChange={(e) => updateSetting('billReminders', 'enabled', e.target.checked)}
                className="sr-only peer"
              />
              <div className={`w-12 h-7 bg-[rgb(var(--color-border-rgb))] peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-[rgb(var(--color-primary-rgb))] rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-[rgb(var(--color-primary-rgb))]`}></div>
            </label>
          </div>

          {settings.billReminders.enabled && (
            <div className="space-y-4">
              <p className="text-sm text-[rgb(var(--color-text-muted-rgb))]">
                Remind me in advance:
              </p>
              <select
                value={settings.billReminders.advanceDays}
                onChange={(e) => updateSetting('billReminders', 'advanceDays', parseInt(e.target.value))}
                className="w-full px-4 py-3 bg-[rgb(var(--color-card-muted-rgb))] border border-[rgb(var(--color-border-rgb))] rounded-xl text-[rgb(var(--color-text-rgb))] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--color-primary-rgb))] focus:border-transparent transition-all duration-200"
              >
                <option value={1}>1 day before</option>
                <option value={3}>3 days before</option>
                <option value={7}>1 week before</option>
              </select>
            </div>
          )}
        </div>

        {/* Budget Alerts */}
        <div className="bg-[rgb(var(--color-card-rgb))] rounded-2xl p-6 border border-[rgb(var(--color-border-rgb))] shadow-sm hover:shadow-md transition-all duration-200">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-br from-amber-100 to-amber-50 rounded-lg">
                <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h2 className="text-xl font-bold">Budget Alerts</h2>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.budgetAlerts.enabled}
                onChange={(e) => updateSetting('budgetAlerts', 'enabled', e.target.checked)}
                className="sr-only peer"
              />
              <div className={`w-12 h-7 bg-[rgb(var(--color-border-rgb))] peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-[rgb(var(--color-primary-rgb))] rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-[rgb(var(--color-primary-rgb))]`}></div>
            </label>
          </div>

          {settings.budgetAlerts.enabled && (
            <div className="space-y-4">
              <p className="text-sm text-[rgb(var(--color-text-muted-rgb))]">
                Alert me when I reach these budget thresholds:
              </p>
              <div className="flex flex-wrap gap-3">
                {settings.budgetAlerts.thresholds.map(threshold => (
                  <div key={threshold} className="flex items-center gap-2 bg-[rgb(var(--color-card-muted-rgb))] px-3 py-2 rounded-xl">
                    <span className="text-sm font-medium text-[rgb(var(--color-text-rgb))]">{threshold}%</span>
                    <button
                      onClick={() => {
                        const newThresholds = settings.budgetAlerts.thresholds.filter(t => t !== threshold);
                        updateSetting('budgetAlerts', 'thresholds', newThresholds);
                      }}
                      className="text-red-500 hover:text-red-700 text-sm font-bold transition-colors"
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
                  className="px-4 py-2 text-sm font-medium text-[rgb(var(--color-primary-rgb))] hover:text-[rgb(var(--color-primary-hover-rgb))] bg-[rgb(var(--color-primary-rgb))]/10 hover:bg-[rgb(var(--color-primary-rgb))]/20 rounded-xl transition-all duration-200"
                >
                  + Add Threshold
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Push Notifications */}
        <div className="bg-[rgb(var(--color-card-rgb))] rounded-2xl p-4 sm:p-6 border border-[rgb(var(--color-border-rgb))] shadow-sm hover:shadow-md transition-all duration-200">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-br from-purple-100 to-purple-50 rounded-lg flex-shrink-0">
                <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
              </div>
              <h2 className="text-lg sm:text-xl font-bold">Browser Push Notifications</h2>
            </div>
            <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
              <input
                type="checkbox"
                checked={settings.pushNotifications.enabled}
                onChange={(e) => updateSetting('pushNotifications', 'enabled', e.target.checked)}
                className="sr-only peer"
              />
              <div className={`w-11 h-6 sm:w-12 sm:h-7 bg-[rgb(var(--color-border-rgb))] peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-[rgb(var(--color-primary-rgb))] rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 sm:after:h-5 sm:after:w-5 after:transition-all peer-checked:bg-[rgb(var(--color-primary-rgb))]`}></div>
            </label>
          </div>

          {settings.pushNotifications.enabled && (
            <div className="space-y-4">
              <p className="text-sm text-[rgb(var(--color-text-muted-rgb))]">
                Quiet hours (no notifications):
              </p>
              <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
                <div className="flex items-center space-x-2">
                  <label className="text-sm font-medium text-[rgb(var(--color-text-muted-rgb))] min-w-[40px]">
                    From:
                  </label>
                  <input
                    type="time"
                    value={settings.pushNotifications.quietHours.start}
                    onChange={(e) => updateSetting('pushNotifications', 'quietHours', {
                      ...settings.pushNotifications.quietHours,
                      start: e.target.value
                    })}
                    className="flex-1 sm:flex-none px-3 py-2 bg-[rgb(var(--color-card-muted-rgb))] border border-[rgb(var(--color-border-rgb))] rounded-lg text-[rgb(var(--color-text-rgb))] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--color-primary-rgb))] focus:border-transparent transition-all duration-200"
                  />
                </div>
                <span className="text-sm text-[rgb(var(--color-text-muted-rgb))] hidden sm:block">to</span>
                <div className="flex items-center space-x-2">
                  <label className="text-sm font-medium text-[rgb(var(--color-text-muted-rgb))] min-w-[30px]">
                    To:
                  </label>
                  <input
                    type="time"
                    value={settings.pushNotifications.quietHours.end}
                    onChange={(e) => updateSetting('pushNotifications', 'quietHours', {
                      ...settings.pushNotifications.quietHours,
                      end: e.target.value
                    })}
                    className="flex-1 sm:flex-none px-3 py-2 bg-[rgb(var(--color-card-muted-rgb))] border border-[rgb(var(--color-border-rgb))] rounded-lg text-[rgb(var(--color-text-rgb))] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--color-primary-rgb))] focus:border-transparent transition-all duration-200"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Request Permission Button for Push Notifications */}
        {settings.pushNotifications.enabled && (
          <div className="bg-gradient-to-br from-[rgb(var(--color-primary-rgb))]/5 to-[rgb(var(--color-primary-rgb))]/10 rounded-2xl p-6 border border-[rgb(var(--color-primary-rgb))]/20">
            <div className="flex items-start space-x-4">
              <div className="p-3 bg-[rgb(var(--color-primary-rgb))] rounded-xl flex-shrink-0">
                <svg className="w-6 h-6 text-[rgb(var(--color-primary-text-rgb))]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-[rgb(var(--color-text-rgb))] mb-2">
                  Enable Push Notifications
                </h3>
                <p className="text-sm text-[rgb(var(--color-text-muted-rgb))] mb-6 leading-relaxed">
                  Get notified even when the app is closed. Click below to allow notifications in your browser.
                </p>
                <NotificationPermissionHandler
                  onPermissionGranted={() => {
                    updateSetting('pushNotifications', 'enabled', true);
                  }}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationSettingsPage;
