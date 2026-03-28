import React, { useState, useCallback } from 'react';
import { User, NotificationSettings } from '../types';
import { ChevronUpIcon } from './icons';
import { requestNotificationPermission } from '../utils/notifications';

// ─── NotificationPermissionHandler ───────────────────────────────────────────

const NotificationPermissionHandler: React.FC<{
  onPermissionGranted: () => void;
}> = ({ onPermissionGranted }) => {
  const [status, setStatus] = useState<NotificationPermission | null>(() =>
    'Notification' in window ? Notification.permission : 'denied'
  );
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleRequest = async () => {
    setIsLoading(true);
    setMessage('');
    const granted = await requestNotificationPermission();
    const current = 'Notification' in window ? Notification.permission : 'denied';
    setStatus(current);
    if (granted) {
      setMessage('Notifications enabled successfully!');
      onPermissionGranted();
    } else {
      setMessage(
        current === 'denied'
          ? 'Notifications were denied. Enable them in your browser settings.'
          : 'Notification permission was not granted.'
      );
    }
    setIsLoading(false);
  };

  if (status === 'granted') {
    return (
      <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-green-500/10 text-green-600 dark:text-green-400 text-sm font-medium w-fit">
        <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
        </svg>
        Notifications are enabled
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <button
        onClick={handleRequest}
        disabled={isLoading}
        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white
          bg-[rgb(var(--color-primary-rgb))] hover:bg-[rgb(var(--color-primary-hover-rgb))]
          disabled:opacity-50 disabled:cursor-not-allowed
          active:scale-95 touch-manipulation transition-all duration-150 shadow-sm"
      >
        {isLoading ? (
          <>
            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
            Requesting...
          </>
        ) : (
          <>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            Allow Notifications
          </>
        )}
      </button>

      {message && (
        <div className={`flex items-start gap-2 text-xs font-medium px-3 py-2.5 rounded-xl ${
          message.includes('successfully')
            ? 'bg-green-500/10 text-green-700 dark:text-green-400'
            : 'bg-red-500/10 text-red-600 dark:text-red-400'
        }`}>
          <span className="mt-0.5 flex-shrink-0">
            {message.includes('successfully') ? '✓' : '✕'}
          </span>
          {message}
        </div>
      )}

      {status === 'denied' && (
        <div className="flex items-start gap-2 text-xs text-[rgb(var(--color-text-muted-rgb))] leading-relaxed bg-[rgb(var(--color-card-muted-rgb))] px-3 py-2.5 rounded-xl">
          <svg className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Go to browser settings and allow notifications for this site.
        </div>
      )}
    </div>
  );
};

// ─── ToggleSwitch ─────────────────────────────────────────────────────────────

const ToggleSwitch: React.FC<{
  checked: boolean;
  onChange: () => void;
}> = ({ checked, onChange }) => {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={onChange}
      className={`inline-flex items-center justify-center px-4 py-1.5 rounded-full text-sm font-semibold border-2 transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--color-primary-rgb))] focus-visible:ring-offset-2 touch-manipulation active:scale-95 ${
        checked
          ? 'bg-[rgb(var(--color-primary-rgb))] text-white border-[rgb(var(--color-primary-rgb))]'
          : 'bg-[rgb(var(--color-card-muted-rgb))] text-[rgb(var(--color-text-muted-rgb))] border-[rgb(var(--color-border-rgb))]'
      }`}
      style={{ minWidth: 64, minHeight: 32 }}
    >
      {checked ? 'ON' : 'OFF'}
    </button>
  );
};

// ─── SettingCard ──────────────────────────────────────────────────────────────

const SettingCard: React.FC<{
  icon: React.ReactNode;
  iconBg: string;
  iconColor: string;
  title: string;
  description: string;
  checked: boolean;
  onToggle: () => void;
  children?: React.ReactNode;
}> = ({ icon, iconBg, iconColor, title, description, checked, onToggle, children }) => (
  <div className={`rounded-2xl border overflow-hidden transition-all duration-200 ${
    checked
      ? 'bg-[rgb(var(--color-card-rgb))] border-[rgb(var(--color-border-rgb))]/60 shadow-sm'
      : 'bg-[rgb(var(--color-card-rgb))]/50 border-[rgb(var(--color-border-rgb))]/30'
  }`}>
    {/* Card Header */}
    <div className="flex items-center gap-4 px-5 py-4">
      {/* Icon */}
      <div className={`p-2.5 rounded-xl flex-shrink-0 ${iconBg}`}>
        <div className={iconColor}>{icon}</div>
      </div>

      {/* Text */}
      <div className="flex-1 min-w-0">
        <p className={`font-semibold text-sm leading-tight ${!checked && 'opacity-50'}`}>{title}</p>
        <p className="text-xs text-[rgb(var(--color-text-muted-rgb))] mt-0.5 leading-snug opacity-75">{description}</p>
      </div>

      {/* Toggle */}
      <ToggleSwitch checked={checked} onChange={onToggle} />
    </div>

    {/* Expanded Content */}
    {checked && children && (
      <div className="px-5 pb-5 pt-1 border-t border-[rgb(var(--color-border-rgb))]/30">
        <div className="pt-4 space-y-3">{children}</div>
      </div>
    )}
  </div>
);

// ─── TagSelector ──────────────────────────────────────────────────────────────

const TagSelector: React.FC<{
  label: string;
  options: number[];
  selected: number[];
  onToggle: (value: number) => void;
  suffix?: string;
}> = ({ label, options, selected, onToggle, suffix = '' }) => (
  <div className="space-y-2">
    <p className="text-xs text-[rgb(var(--color-text-muted-rgb))]">{label}</p>
    <div className="flex flex-wrap gap-2">
      {options.map(opt => {
        const isSelected = selected.includes(opt);
        return (
          <button
            key={opt}
            onClick={() => onToggle(opt)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all duration-150 active:scale-95 touch-manipulation border ${
              isSelected
                ? 'bg-[rgb(var(--color-primary-rgb))] text-white border-transparent shadow-sm'
                : 'bg-transparent text-[rgb(var(--color-text-muted-rgb))] border-[rgb(var(--color-border-rgb))]/60 hover:border-[rgb(var(--color-primary-rgb))]/50 hover:text-[rgb(var(--color-primary-rgb))]'
            }`}
          >
            {opt}{suffix}
          </button>
        );
      })}
    </div>
  </div>
);

// ─── Main Page ────────────────────────────────────────────────────────────────

interface NotificationSettingsPageProps {
  user: User;
  onUpdateUser: (updatedUser: User) => void;
  onBack: () => void;
}

const NotificationSettingsPage: React.FC<NotificationSettingsPageProps> = ({
  user,
  onUpdateUser,
  onBack,
}) => {
  const [settings, setSettings] = useState<NotificationSettings>(
    user.notificationSettings ?? {
      goalProgress:      { enabled: true,  milestones: [25, 50, 75, 100] },
      billReminders:     { enabled: true,  advanceDays: 1 },
      budgetAlerts:      { enabled: true,  thresholds: [80, 90, 100] },
      monthlyReports:    { enabled: false, frequency: 'monthly' },
      pushNotifications: { enabled: false, quietHours: { start: '22:00', end: '08:00' } },
    }
  );
  const [hasChanges, setHasChanges] = useState(false);
  const [saved, setSaved] = useState(false);

  const update = useCallback(<K extends keyof NotificationSettings>(
    category: K, key: string, value: unknown
  ) => {
    setSettings(prev => ({ ...prev, [category]: { ...prev[category], [key]: value } }));
    setHasChanges(true);
    setSaved(false);
  }, []);

  const toggle = useCallback((category: keyof NotificationSettings) => {
    setSettings(prev => ({
      ...prev,
      [category]: { ...prev[category], enabled: !(prev[category] as any).enabled },
    }));
    setHasChanges(true);
    setSaved(false);
  }, []);

  const toggleMilestone = useCallback((m: number) => {
    setSettings(prev => ({
      ...prev,
      goalProgress: {
        ...prev.goalProgress,
        milestones: prev.goalProgress.milestones.includes(m)
          ? prev.goalProgress.milestones.filter(x => x !== m)
          : [...prev.goalProgress.milestones, m].sort((a, b) => a - b),
      },
    }));
    setHasChanges(true);
  }, []);

  const handleSave = () => {
    onUpdateUser({ ...user, notificationSettings: settings });
    setHasChanges(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="min-h-screen bg-[rgb(var(--color-background-rgb))] text-[rgb(var(--color-text-rgb))]">

      {/* ── Sticky Header ── */}
      <div className="sticky top-0 z-10 bg-[rgb(var(--color-background-rgb))]/90 backdrop-blur-md border-b border-[rgb(var(--color-border-rgb))]/40 px-4 py-3">
        <div className="flex items-center gap-3 max-w-2xl mx-auto">
          <button
            onClick={onBack}
            className="p-2 hover:bg-[rgb(var(--color-card-muted-rgb))] rounded-xl transition-colors active:scale-95 touch-manipulation"
            aria-label="Go back"
          >
            <ChevronUpIcon className="h-5 w-5 -rotate-90" />
          </button>
          <h1 className="text-base font-bold flex-1 tracking-tight">Notifications</h1>

          <button
            onClick={handleSave}
            disabled={!hasChanges}
            className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all duration-200 active:scale-95 touch-manipulation ${
              saved
                ? 'bg-green-500/15 text-green-600 dark:text-green-400'
                : hasChanges
                  ? 'bg-[rgb(var(--color-primary-rgb))] text-white shadow-sm'
                  : 'opacity-0 pointer-events-none'
            }`}
          >
            {saved ? '✓ Saved' : 'Save'}
          </button>
        </div>
      </div>

      {/* ── Content ── */}
      <div className="px-4 pt-5 pb-10 max-w-2xl mx-auto space-y-3">

        {/* Section label */}
        <p className="text-xs font-semibold text-[rgb(var(--color-text-muted-rgb))] uppercase tracking-widest px-1 pb-1">
          Activity
        </p>

        {/* Goal Progress */}
        <SettingCard
          iconBg="bg-emerald-500/10"
          iconColor="text-emerald-500"
          icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
          title="Goal Progress"
          description="Alerts when you hit savings milestones"
          checked={settings.goalProgress.enabled}
          onToggle={() => toggle('goalProgress')}
        >
          <TagSelector
            label="Notify me at:"
            options={[25, 50, 75, 100]}
            selected={settings.goalProgress.milestones}
            onToggle={toggleMilestone}
            suffix="%"
          />
        </SettingCard>

        {/* Bill Reminders */}
        <SettingCard
          iconBg="bg-blue-500/10"
          iconColor="text-blue-500"
          icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>}
          title="Bill Reminders"
          description="Get reminded before upcoming bills are due"
          checked={settings.billReminders.enabled}
          onToggle={() => toggle('billReminders')}
        >
          <div className="space-y-2">
            <p className="text-xs text-[rgb(var(--color-text-muted-rgb))]">Remind me in advance:</p>
            <div className="flex gap-2">
              {[{ value: 1, label: '1 day' }, { value: 3, label: '3 days' }, { value: 7, label: '1 week' }].map(({ value, label }) => (
                <button
                  key={value}
                  onClick={() => update('billReminders', 'advanceDays', value)}
                  className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-all duration-150 active:scale-95 touch-manipulation border ${
                    settings.billReminders.advanceDays === value
                      ? 'bg-[rgb(var(--color-primary-rgb))] text-white border-transparent shadow-sm'
                      : 'bg-transparent text-[rgb(var(--color-text-muted-rgb))] border-[rgb(var(--color-border-rgb))]/60 hover:border-[rgb(var(--color-primary-rgb))]/50 hover:text-[rgb(var(--color-primary-rgb))]'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </SettingCard>

        {/* Budget Alerts */}
        <SettingCard
          iconBg="bg-amber-500/10"
          iconColor="text-amber-500"
          icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" /></svg>}
          title="Budget Alerts"
          description="Warnings when spending approaches limits"
          checked={settings.budgetAlerts.enabled}
          onToggle={() => toggle('budgetAlerts')}
        >
          <TagSelector
            label="Alert me at:"
            options={[50, 60, 70, 80, 90, 95, 100]}
            selected={settings.budgetAlerts.thresholds}
            onToggle={(t) => {
              const next = settings.budgetAlerts.thresholds.includes(t)
                ? settings.budgetAlerts.thresholds.filter(x => x !== t)
                : [...settings.budgetAlerts.thresholds, t].sort((a, b) => a - b);
              update('budgetAlerts', 'thresholds', next);
            }}
            suffix="%"
          />
        </SettingCard>

        {/* Section label */}
        <p className="text-xs font-semibold text-[rgb(var(--color-text-muted-rgb))] uppercase tracking-widest px-1 pb-1 pt-3">
          Push
        </p>

        {/* Push Notifications */}
        <SettingCard
          iconBg="bg-violet-500/10"
          iconColor="text-violet-500"
          icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>}
          title="Push Notifications"
          description="Receive alerts even when the app is closed"
          checked={settings.pushNotifications.enabled}
          onToggle={() => toggle('pushNotifications')}
        >
          <div className="space-y-4">
            <NotificationPermissionHandler
              onPermissionGranted={() => update('pushNotifications', 'enabled', true)}
            />

            {/* Quiet Hours */}
            <div className="rounded-xl bg-[rgb(var(--color-card-muted-rgb))]/60 p-4 space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-base leading-none">🌙</span>
                <p className="text-xs font-semibold text-[rgb(var(--color-text-rgb))]">Quiet Hours</p>
                <span className="text-xs text-[rgb(var(--color-text-muted-rgb))]">— no notifications during this time</span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {(['start', 'end'] as const).map((key) => (
                  <div key={key} className="space-y-1.5">
                    <label className="text-xs font-medium text-[rgb(var(--color-text-muted-rgb))] capitalize">
                      {key === 'start' ? '🔕 From' : '🔔 Until'}
                    </label>
                    <input
                      type="time"
                      value={settings.pushNotifications.quietHours[key]}
                      onChange={(e) =>
                        update('pushNotifications', 'quietHours', {
                          ...settings.pushNotifications.quietHours,
                          [key]: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 text-sm bg-[rgb(var(--color-card-rgb))] border border-[rgb(var(--color-border-rgb))]/60 rounded-xl text-[rgb(var(--color-text-rgb))] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--color-primary-rgb))]/40 transition-all"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </SettingCard>

      </div>
    </div>
  );
};

export default NotificationSettingsPage;