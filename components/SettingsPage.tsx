import React, { useState } from 'react';
import { User } from '../types';
import { useTheme, THEMES } from './ThemeContext';
import { SparklesIcon } from './icons';
import ServiceWorkerDebugPanel from './ServiceWorkerDebugPanel';

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
}

const ThemeOption: React.FC<{ id: string, name: string, active: boolean, onClick: () => void}> = ({ id, name, active, onClick }) => {
    const isLight = id === 'theme-light';
    return (
        <button
            onClick={onClick}
            className={`text-left p-3 rounded-lg border-2 w-full transition-all ${active ? 'border-[rgb(var(--color-primary-rgb))] shadow-md' : 'border-transparent hover:border-[rgb(var(--color-border-rgb))]'}`}
        >
            <div className={`p-4 rounded-md ${isLight ? 'bg-gray-100' : 'bg-slate-900'}`}>
                <div className="flex items-center justify-between">
                    <div className={`w-1/2 h-8 rounded-md ${isLight ? 'bg-white' : 'bg-slate-800'}`}></div>
                    <div className={`w-8 h-8 rounded-full ${id.includes('crimson') ? 'bg-rose-500' : 'bg-blue-500'}`}></div>
                </div>
            </div>
            <p className="font-semibold mt-2 text-sm text-[rgb(var(--color-text-rgb))]">{name}</p>
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
        <div className="space-y-4">
            <h2 className="text-xl font-semibold text-[rgb(var(--color-text-rgb))]">AI Financial Assistant</h2>
            <form onSubmit={handleSubmit} className="p-4 border border-[rgb(var(--color-border-rgb))] rounded-lg space-y-3">
                <div className="flex items-center space-x-2 text-[rgb(var(--color-text-muted-rgb))]">
                    <SparklesIcon className="h-5 w-5" />
                    <p className="font-medium text-sm">Powered by Gemini</p>
                </div>
                <p className="text-sm text-[rgb(var(--color-text-muted-rgb))]">
                    Enter your Gemini API key to unlock personalized financial insights on the Reports page.
                    The model is set to `gemini-2.5-flash`.
                </p>
                <div>
                    <label htmlFor="apiKey" className="block text-sm font-medium text-[rgb(var(--color-text-rgb))] mb-1">Gemini API Key</label>
                    <input
                        id="apiKey"
                        type="password"
                        value={apiKey}
                        onChange={(e) => setApiKey(e.target.value)}
                        placeholder="Enter your API key"
                        className="w-full px-4 py-2 rounded-lg bg-[rgb(var(--color-card-muted-rgb))] border border-[rgb(var(--color-border-rgb))] text-[rgb(var(--color-text-rgb))] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--color-primary-rgb))] transition-colors"
                    />
                </div>
                {message && <p className="text-sm text-green-500">{message}</p>}
                <button type="submit" className="px-4 py-2 text-sm font-medium text-[rgb(var(--color-primary-text-rgb))] bg-[rgb(var(--color-primary-rgb))] rounded-lg hover:bg-[rgb(var(--color-primary-hover-rgb))] transition-colors">
                    Save API Key
                </button>
            </form>
        </div>
    );
};


const SettingsPage: React.FC<SettingsPageProps> = ({ user, onUpdateUser, onSignOut, onOpenConfirmModal, onImportData }) => {
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const { theme, setTheme } = useTheme();
  
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


  return (
    <div className="bg-[rgb(var(--color-card-rgb))] p-6 rounded-lg shadow space-y-8 max-w-2xl mx-auto transition-colors">
      <h1 className="text-3xl font-bold text-[rgb(var(--color-text-rgb))]">Settings</h1>
      
      <AISettings user={user} onUpdateUser={onUpdateUser} />

      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-[rgb(var(--color-text-rgb))]">Smart Features</h2>
        <div className="p-4 border border-[rgb(var(--color-border-rgb))] rounded-lg space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-[rgb(var(--color-text-rgb))]">Smart Category Suggestions</p>
              <p className="text-sm text-[rgb(var(--color-text-muted-rgb))]">
                Automatically suggest categories based on transaction descriptions
              </p>
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
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-[rgb(var(--color-primary-rgb))] focus:ring-offset-2 ${
                user.smartFeatures?.categorySuggestions ?? true
                  ? 'bg-[rgb(var(--color-primary-rgb))]'
                  : 'bg-gray-200'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  user.smartFeatures?.categorySuggestions ?? true
                    ? 'translate-x-6'
                    : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-[rgb(var(--color-text-rgb))]">Appearance</h2>
        <div className="p-4 border border-[rgb(var(--color-border-rgb))] rounded-lg">
            <p className="text-sm text-[rgb(var(--color-text-muted-rgb))] mb-4">Choose a theme to personalize your experience.</p>
            <div className="grid grid-cols-2 gap-4">
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
      
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-[rgb(var(--color-text-rgb))]">Account Action</h2>
        <div className="flex justify-between items-center p-4 border border-[rgb(var(--color-border-rgb))] rounded-lg">
          <div>
            <p className="font-medium text-[rgb(var(--color-text-muted-rgb))]">Logged in as</p>
            <p className="font-semibold text-[rgb(var(--color-text-rgb))]">{user.username}</p>
          </div>
          <button
            onClick={handleSignOut}
            className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
          >
            Sign Out
          </button>
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-[rgb(var(--color-text-rgb))]">Data Management</h2>
        <div className="p-4 border border-[rgb(var(--color-border-rgb))] rounded-lg space-y-4">
          <div>
            <p className="font-medium text-[rgb(var(--color-text-rgb))]">Export Data</p>
            <p className="text-sm text-[rgb(var(--color-text-muted-rgb))]">Save a backup of all your data to a JSON file.</p>
            <button
              onClick={handleExport}
              className="mt-2 px-4 py-2 text-sm font-medium text-[rgb(var(--color-primary-text-rgb))] bg-[rgb(var(--color-primary-rgb))] rounded-lg hover:bg-[rgb(var(--color-primary-hover-rgb))]"
            >
              Export Data
            </button>
          </div>
          <hr className="border-[rgb(var(--color-border-rgb))]"/>
          <div>
            <p className="font-medium text-[rgb(var(--color-text-rgb))]">Import Data</p>
            <p className="text-sm text-[rgb(var(--color-text-muted-rgb))]">Import data from a backup file. This will overwrite current data.</p>
            <button
              onClick={handleImportClick}
              className="mt-2 px-4 py-2 text-sm font-medium text-white bg-orange-500 rounded-lg hover:bg-orange-600"
            >
              Import Data
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
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-[rgb(var(--color-text-rgb))]">
          Developer Tools
        </h2>
        <ServiceWorkerDebugPanel />
      </div>

      <div className="text-center text-[rgb(var(--color-text-muted-rgb))] text-sm pt-4">
        <p>Finance Flow App v1.3.0</p>
      </div>
    </div>
  );
};

export default SettingsPage;