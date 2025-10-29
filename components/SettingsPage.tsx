import React, { useState } from 'react';
import { User } from '../types';
import { useTheme, THEMES } from './ThemeContext';
import { SparklesIcon, BellIcon, SettingsIcon, UserIcon } from './icons';
import ServiceWorkerDebugPanel from './ServiceWorkerDebugPanel';
import NotificationSettingsPage from './NotificationSettingsPage';
import ManageCategoriesModal from './ManageCategoriesModal';
import { TRANSACTION_CATEGORIES } from '../constants';

interface SettingsPageProps {
  user: User;
  onUpdateUser: (updatedUser: User) => void;
  onSignOut: () => void;
  onOpenConfirmModal: (
    title: string,
    message: string,
    onConfirm: () => void,
    options?: { confirmText?: string; variant?: 'primary' | 'danger' }
  ) => void;
  onImportData: (data: any) => void;
  setActiveItem?: (item: string) => void;
}

const ThemeOption: React.FC<{ id: string, name: string, active: boolean, onClick: () => void}> = ({ id, name, active, onClick }) => {
    const isLight = id === 'theme-light';
    return (
        <button
            onClick={onClick}
            className={`text-left p-2 sm:p-3 rounded border-2 w-full transition-all ${
              active
                ? 'border-[rgb(var(--color-primary-rgb))] bg-[rgb(var(--color-primary-rgb))] bg-opacity-5'
                : 'border-[rgb(var(--color-border-rgb))] hover:border-[rgb(var(--color-primary-rgb))]'
            }`}
        >
            <div className={`p-2 sm:p-3 rounded ${isLight ? 'bg-gray-100' : 'bg-slate-900'}`}>
                <div className="flex items-center justify-between">
                    <div className={`w-1/2 h-4 sm:h-6 rounded ${isLight ? 'bg-white' : 'bg-slate-800'}`}></div>
                    <div className={`w-4 h-4 sm:w-6 sm:h-6 rounded-full ${
                      id.includes('crimson') ? 'bg-rose-500' :
                      id.includes('green') ? 'bg-emerald-500' :
                      id.includes('slate') ? 'bg-blue-500' :
                      'bg-blue-500'
                    }`}></div>
                </div>
            </div>
            <p className="font-semibold mt-1 sm:mt-2 text-xs sm:text-sm text-[rgb(var(--color-text-rgb))] truncate">{name}</p>
        </button>
    )
}

const AISettings: React.FC<{ user: User; onUpdateUser: (user: User) => void }> = ({ user, onUpdateUser }) => {
    const [apiKey, setApiKey] = useState(user.aiSettings?.apiKey || '');
    const [message, setMessage] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onUpdateUser({
            ...user,
            aiSettings: {
                apiKey,
                model: 'gemini-2.5-flash',
            }
        });
        setMessage('API Key saved successfully!');
        setTimeout(() => setMessage(''), 3000);
    };

    return (
        <div className="space-y-3 sm:space-y-4">
            <h2 className="text-lg sm:text-xl font-semibold text-[rgb(var(--color-text-rgb))]">AI Settings</h2>
            <form onSubmit={handleSubmit} className="space-y-3">
                <p className="text-sm text-[rgb(var(--color-text-muted-rgb))]">
                    Enter your Gemini API key for AI-powered financial insights.
                </p>
                <input
                    type="password"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="Gemini API Key"
                    className="w-full px-3 py-2.5 sm:py-2 bg-[rgb(var(--color-card-muted-rgb))] border border-[rgb(var(--color-border-rgb))] rounded text-[rgb(var(--color-text-rgb))] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--color-primary-rgb))] text-sm sm:text-base"
                />
                {message && (
                    <p className={`text-sm ${message.includes('success') ? 'text-green-600' : 'text-red-600'}`}>
                        {message}
                    </p>
                )}
                <button
                    type="submit"
                    className="w-full sm:w-auto px-4 py-2.5 sm:py-2 text-sm bg-[rgb(var(--color-primary-rgb))] text-[rgb(var(--color-primary-text-rgb))] rounded hover:bg-[rgb(var(--color-primary-hover-rgb))] transition-colors"
                >
                    Save API Key
                </button>
            </form>
        </div>
    );
};

const SettingsPage: React.FC<SettingsPageProps> = ({ user, onUpdateUser, onSignOut, onOpenConfirmModal, onImportData, setActiveItem }) => {
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const { theme, setTheme } = useTheme();
  const [showNotificationSettings, setShowNotificationSettings] = useState(false);
  const [showManageCategories, setShowManageCategories] = useState(false);

  const handleSignOut = () => {
    onOpenConfirmModal(
      'Sign Out',
      'Are you sure you want to sign out?',
      onSignOut,
      { confirmText: 'Sign Out', variant: 'danger' }
    );
  };

  const handleExport = () => {
    try {
      const transactions = localStorage.getItem('financeFlowTransactions') || '[]';
      const goals = localStorage.getItem('financeFlowGoals') || '[]';
      const bills = localStorage.getItem('financeFlowBills') || '[]';

      const backupData = {
          user,
          transactions: JSON.parse(transactions),
          goals: JSON.parse(goals),
          bills: JSON.parse(bills),
          version: '1.3.0',
          exportedAt: new Date().toISOString(),
      };

      const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `finance-flow-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
        console.error("Failed to export data", error);
        alert("An error occurred while exporting your data.");
    }
  };

  const handleImportClick = () => {
      fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (e) => {
          try {
              const text = e.target?.result;
              if (typeof text !== 'string') throw new Error("File content is not a string");
              const data = JSON.parse(text);
              if (data && data.user && Array.isArray(data.transactions) && Array.isArray(data.goals) && Array.isArray(data.bills)) {
                  onOpenConfirmModal(
                      'Import Data',
                      'Are you sure? This will overwrite ALL current data, including your account info.',
                      () => onImportData(data),
                      { confirmText: 'Import & Overwrite', variant: 'danger' }
                  );
              } else {
                  alert('Invalid backup file format.');
              }
          } catch (error) {
              console.error('Error parsing backup file:', error);
              alert('Failed to read or parse the backup file.');
          } finally {
              if (fileInputRef.current) {
                  fileInputRef.current.value = '';
              }
          }
      };
      reader.readAsText(file);
  };

  if (showNotificationSettings) {
    return (
      <NotificationSettingsPage
        user={user}
        onUpdateUser={onUpdateUser}
        onBack={() => setShowNotificationSettings(false)}
      />
    );
  }

  if (showManageCategories) {
    return (
      <ManageCategoriesModal
        isOpen={showManageCategories}
        onClose={() => setShowManageCategories(false)}
        categories={TRANSACTION_CATEGORIES.expense}
        onUpdateCategories={(categories) => {
          console.log('Updated categories:', categories);
        }}
      />
    );
  }

  return (
    <div className="bg-[rgb(var(--color-background-rgb))] px-4 sm:px-6 py-4 sm:py-6 space-y-6 sm:space-y-8 max-w-4xl mx-auto min-h-screen">
      {/* Enhanced Header */}
      <div className="text-center pb-6 sm:pb-8 border-b border-[rgb(var(--color-border-rgb))]">
        <div className="flex flex-col sm:flex-row items-center justify-center mb-4 space-y-3 sm:space-y-0 sm:space-x-3">
          <div className="p-2 sm:p-3 bg-gradient-to-br from-[rgb(var(--color-primary-rgb))]/10 to-[rgb(var(--color-primary-rgb))]/5 rounded-xl sm:rounded-2xl">
            <SettingsIcon className="w-6 h-6 sm:w-8 sm:h-8 text-[rgb(var(--color-primary-rgb))]" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[rgb(var(--color-text-rgb))]">Settings</h1>
        </div>
      </div>

      <div className="space-y-6 sm:space-y-8">
        {/* Account & Profile Section */}
        <div className="space-y-6">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gradient-to-br from-[rgb(var(--color-primary-rgb))]/10 to-[rgb(var(--color-primary-rgb))]/5 rounded-lg">
              <UserIcon className="w-5 h-5 text-[rgb(var(--color-primary-rgb))]" />
            </div>
            <h2 className="text-xl font-semibold text-[rgb(var(--color-text-rgb))]">Account & Profile</h2>
          </div>
          <div className="bg-[rgb(var(--color-card-rgb))] rounded-xl sm:rounded-2xl border border-[rgb(var(--color-border-rgb))] p-4 sm:p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-3 sm:space-y-0">
              <div className="flex-1">
                <p className="text-sm text-[rgb(var(--color-text-muted-rgb))]">Logged in as</p>
                <p className="font-semibold text-[rgb(var(--color-text-rgb))] text-base sm:text-lg break-all">{user.username}</p>
              </div>
              <button
                onClick={() => setActiveItem?.('Account')}
                className="w-full sm:w-auto px-4 py-2.5 sm:py-2 text-sm bg-[rgb(var(--color-primary-rgb))] text-[rgb(var(--color-primary-text-rgb))] rounded-lg hover:bg-[rgb(var(--color-primary-hover-rgb))] transition-all duration-200 font-medium shadow-sm hover:shadow-md transform hover:scale-[1.02] active:scale-[0.98]"
              >
                Manage Account
              </button>
            </div>
          </div>
        </div>

        {/* Appearance Section */}
        <div className="space-y-6">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gradient-to-br from-[rgb(var(--color-primary-rgb))]/10 to-[rgb(var(--color-primary-rgb))]/5 rounded-lg">
              <SparklesIcon className="w-5 h-5 text-[rgb(var(--color-primary-rgb))]" />
            </div>
            <h2 className="text-xl font-semibold text-[rgb(var(--color-text-rgb))]">Appearance</h2>
          </div>
          <div className="bg-[rgb(var(--color-card-rgb))] rounded-xl sm:rounded-2xl border border-[rgb(var(--color-border-rgb))] p-4 sm:p-6 shadow-sm">
            <p className="text-sm text-[rgb(var(--color-text-muted-rgb))] mb-4 sm:mb-6">Choose your preferred theme</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              {THEMES.map(t => (
                <ThemeOption
                  key={t.id}
                  id={t.id}
                  name={t.name}
                  active={theme === t.id}
                  onClick={() => setTheme(t.id)}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Smart Features Section */}
        <div className="space-y-6">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gradient-to-br from-[rgb(var(--color-primary-rgb))]/10 to-[rgb(var(--color-primary-rgb))]/5 rounded-lg">
              <SparklesIcon className="w-5 h-5 text-[rgb(var(--color-primary-rgb))]" />
            </div>
            <h2 className="text-xl font-semibold text-[rgb(var(--color-text-rgb))]">Smart Features</h2>
          </div>
          <div className="bg-[rgb(var(--color-card-rgb))] rounded-xl sm:rounded-2xl border border-[rgb(var(--color-border-rgb))] p-4 sm:p-6 shadow-sm space-y-4 sm:space-y-6">
            <AISettings user={user} onUpdateUser={onUpdateUser} />

            <div className="border-t border-[rgb(var(--color-border-rgb))] pt-4 sm:pt-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 sm:p-4 bg-[rgb(var(--color-card-muted-rgb))] rounded-xl space-y-3 sm:space-y-0">
                <div className="flex-1">
                  <p className="font-medium text-[rgb(var(--color-text-rgb))]">Smart Category Suggestions</p>
                  <p className="text-sm text-[rgb(var(--color-text-muted-rgb))] pr-2">AI suggests categories based on transaction descriptions</p>
                </div>
                <button
                  onClick={() => {
                    const currentSetting = user.smartFeatures?.categorySuggestions ?? true;
                    onUpdateUser({
                      ...user,
                      smartFeatures: {
                        ...user.smartFeatures,
                        categorySuggestions: !currentSetting
                      }
                    });
                  }}
                  className={`relative inline-flex h-7 w-12 items-center rounded-full transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-[rgb(var(--color-primary-rgb))] focus:ring-offset-2 ${
                    user.smartFeatures?.categorySuggestions ?? true
                      ? 'bg-[rgb(var(--color-primary-rgb))]'
                      : 'bg-[rgb(var(--color-border-rgb))]'
                  }`}
                  aria-label={`Smart category suggestions are ${user.smartFeatures?.categorySuggestions ?? true ? 'enabled' : 'disabled'}`}
                >
                  <span
                    className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-lg transition-transform duration-300 ${
                      user.smartFeatures?.categorySuggestions ?? true
                        ? 'translate-x-6'
                        : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              <div className="mt-3 sm:mt-4">
                <button
                  onClick={() => setShowManageCategories(true)}
                  className="w-full p-3 sm:p-4 text-left bg-[rgb(var(--color-card-muted-rgb))] border border-[rgb(var(--color-border-rgb))] rounded-xl hover:bg-[rgb(var(--color-card-rgb))] hover:border-[rgb(var(--color-primary-rgb))]/30 transition-all duration-200 group"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 pr-2">
                      <p className="font-medium text-[rgb(var(--color-text-rgb))] group-hover:text-[rgb(var(--color-primary-rgb))] transition-colors">Manage Categories</p>
                      <p className="text-sm text-[rgb(var(--color-text-muted-rgb))]">Create and organize custom categories</p>
                    </div>
                    <svg className="w-5 h-5 text-[rgb(var(--color-text-muted-rgb))] group-hover:text-[rgb(var(--color-primary-rgb))] transition-colors flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Notifications Section */}
        <div className="space-y-6">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gradient-to-br from-[rgb(var(--color-primary-rgb))]/10 to-[rgb(var(--color-primary-rgb))]/5 rounded-lg">
              <BellIcon className="w-5 h-5 text-[rgb(var(--color-primary-rgb))]" />
            </div>
            <h2 className="text-xl font-semibold text-[rgb(var(--color-text-rgb))]">Notifications</h2>
          </div>
          <button
            onClick={() => setShowNotificationSettings(true)}
            className="w-full bg-[rgb(var(--color-card-rgb))] rounded-xl sm:rounded-2xl border border-[rgb(var(--color-border-rgb))] p-4 sm:p-6 hover:shadow-md hover:border-[rgb(var(--color-primary-rgb))]/30 transition-all duration-200 group"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3 sm:space-x-4 flex-1">
                <div className="p-2 sm:p-3 bg-gradient-to-br from-[rgb(var(--color-primary-rgb))]/10 to-[rgb(var(--color-primary-rgb))]/5 rounded-lg sm:rounded-xl flex-shrink-0">
                  <BellIcon className="w-5 h-5 sm:w-6 sm:h-6 text-[rgb(var(--color-primary-rgb))]" />
                </div>
                <div className="text-left flex-1 min-w-0">
                  <p className="font-semibold text-[rgb(var(--color-text-rgb))] group-hover:text-[rgb(var(--color-primary-rgb))] transition-colors truncate">Notification Preferences</p>
                  <p className="text-sm text-[rgb(var(--color-text-muted-rgb))]">Customize alerts and reminders</p>
                </div>
              </div>
              <svg className="w-5 h-5 text-[rgb(var(--color-text-muted-rgb))] group-hover:text-[rgb(var(--color-primary-rgb))] transition-colors flex-shrink-0 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </button>
        </div>

        {/* Data & Privacy Section */}
        <div className="space-y-6">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gradient-to-br from-[rgb(var(--color-primary-rgb))]/10 to-[rgb(var(--color-primary-rgb))]/5 rounded-lg">
              <svg className="w-5 h-5 text-[rgb(var(--color-primary-rgb))]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-[rgb(var(--color-text-rgb))]">Data & Privacy</h2>
          </div>
          <div className="bg-[rgb(var(--color-card-rgb))] rounded-xl sm:rounded-2xl border border-[rgb(var(--color-border-rgb))] p-4 sm:p-6 shadow-sm space-y-3 sm:space-y-4">
            <button
              onClick={handleExport}
              className="w-full p-3 sm:p-4 text-left bg-[rgb(var(--color-card-muted-rgb))] border border-[rgb(var(--color-border-rgb))] rounded-xl hover:bg-[rgb(var(--color-card-rgb))] hover:border-[rgb(var(--color-primary-rgb))]/30 transition-all duration-200 group"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3 sm:space-x-4 flex-1">
                  <div className="p-2 bg-green-100 rounded-lg flex-shrink-0">
                    <svg className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l4-4m-4 4l-4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-[rgb(var(--color-text-rgb))] group-hover:text-[rgb(var(--color-primary-rgb))] transition-colors">Export Data</p>
                    <p className="text-sm text-[rgb(var(--color-text-muted-rgb))]">Save a backup of all your data</p>
                  </div>
                </div>
                <svg className="w-5 h-5 text-[rgb(var(--color-text-muted-rgb))] group-hover:text-[rgb(var(--color-primary-rgb))] transition-colors flex-shrink-0 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </button>

            <button
              onClick={handleImportClick}
              className="w-full p-3 sm:p-4 text-left bg-[rgb(var(--color-card-muted-rgb))] border border-[rgb(var(--color-border-rgb))] rounded-xl hover:bg-[rgb(var(--color-card-rgb))] hover:border-[rgb(var(--color-primary-rgb))]/30 transition-all duration-200 group"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3 sm:space-x-4 flex-1">
                  <div className="p-2 bg-blue-100 rounded-lg flex-shrink-0">
                    <svg className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-[rgb(var(--color-text-rgb))] group-hover:text-[rgb(var(--color-primary-rgb))] transition-colors">Import Data</p>
                    <p className="text-sm text-[rgb(var(--color-text-muted-rgb))]">Restore from a backup file</p>
                  </div>
                </div>
                <svg className="w-5 h-5 text-[rgb(var(--color-text-muted-rgb))] group-hover:text-[rgb(var(--color-primary-rgb))] transition-colors flex-shrink-0 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </button>

            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept=".json"
              onChange={handleFileChange}
            />
          </div>
        </div>

        {/* Support Section */}
        <div className="space-y-6">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gradient-to-br from-[rgb(var(--color-primary-rgb))]/10 to-[rgb(var(--color-primary-rgb))]/5 rounded-lg">
              <svg className="w-5 h-5 text-[rgb(var(--color-primary-rgb))]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-12.728 12.728M5.636 5.636l12.728 12.728" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-[rgb(var(--color-text-rgb))]">Support & Info</h2>
          </div>
          <div className="bg-[rgb(var(--color-card-rgb))] rounded-xl sm:rounded-2xl border border-[rgb(var(--color-border-rgb))] p-4 sm:p-6 shadow-sm">
            <ServiceWorkerDebugPanel />
          </div>
        </div>

        {/* Sign Out Section */}
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-[rgba(var(--color-primary-rgb),0.08)] to-[rgba(var(--color-primary-rgb),0.04)] rounded-xl sm:rounded-2xl border border-[rgb(var(--color-primary-rgb))]/20 p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-3 sm:space-y-0">
              <div className="flex-1">
                <h3 className="font-semibold text-[rgb(var(--color-text-rgb))] mb-1">Sign Out</h3>
                <p className="text-sm text-[rgb(var(--color-text-muted-rgb))]">End your current session</p>
              </div>
              <button
                onClick={handleSignOut}
                className="w-full sm:w-auto px-6 py-3 bg-[rgb(var(--color-primary-rgb))] text-[rgb(var(--color-primary-text-rgb))] rounded-xl hover:bg-[rgb(var(--color-primary-hover-rgb))] transition-all duration-200 font-medium shadow-sm hover:shadow-md transform hover:scale-[1.02] active:scale-[0.98]"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-[rgb(var(--color-text-muted-rgb))] text-sm pt-6 sm:pt-8 border-t border-[rgb(var(--color-border-rgb))]">
          <p>Finance Flow App v1.3.0</p>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;