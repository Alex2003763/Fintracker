import React, { useState, useEffect, useRef } from 'react';
import { User, NotificationSettings } from '../types';
import { useTheme, THEMES } from './ThemeContext';
import { SparklesIcon, BellIcon, SettingsIcon, UserIcon, ChevronUpIcon, HomeIcon, TrendingUpIcon, BackupIcon, RestoreIcon } from './icons';
import ServiceWorkerDebugPanel from './ServiceWorkerDebugPanel';
import NotificationSettingsPage from './NotificationSettingsPage';
import { processImageForBackground, createPatternBackground } from '../utils/imageProcessing';
import { isWebAuthnSupported, registerWebAuthn } from '../utils/webauthn';
import Card, { CardHeader, CardTitle, CardContent } from './Card';

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
  onOpenCropModal?: (imageSrc: string, type: 'transparent' | 'pattern') => void;
  isProcessingImage?: boolean;
  processingType?: 'transparent' | 'pattern';
  setProcessingType?: (type: 'transparent' | 'pattern') => void;
  onExportData: () => void;
  onChangePassword: (oldPw: string, newPw: string) => Promise<boolean>;
}

const THEME_COLORS: Record<string, { bg: string; card: string; primary: string; isLight: boolean }> = {
  'theme-light': { bg: '#f3f4f6', card: '#ffffff', primary: '#2563eb', isLight: true },
  'theme-dark-slate': { bg: '#0f172a', card: '#1e293b', primary: '#3b82f6', isLight: false },
  'theme-dark-green': { bg: '#0f1714', card: '#19271e', primary: '#4ade80', isLight: false },
  'theme-dark-crimson': { bg: '#1c1518', card: '#312126', primary: '#f43f5e', isLight: false },
  'theme-ocean-blue': { bg: '#0f2337', card: '#192d41', primary: '#648caa', isLight: false },
  'theme-sunset-orange': { bg: '#faf5eb', card: '#f5ebdc', primary: '#be8264', isLight: true },
  'theme-purple': { bg: '#231e2d', card: '#2d283a', primary: '#8c78a5', isLight: false },
  'theme-midnight-black': { bg: '#121214', card: '#1c1c20', primary: '#788ca0', isLight: false },
};

const ThemePreview: React.FC<{ themeId: string }> = ({ themeId }) => {
  const colors = THEME_COLORS[themeId] || THEME_COLORS['theme-light'];
  
  return (
    <div className="w-full aspect-video rounded-xl shadow-lg border border-[rgb(var(--color-border-rgb))] overflow-hidden flex flex-col transition-all duration-300 relative group"
         style={{ backgroundColor: colors.bg }}>
        {/* Mock Header */}
        <div className="h-10 border-b flex items-center px-3 justify-between"
              style={{ backgroundColor: colors.card, borderColor: 'rgba(0,0,0,0.1)' }}>
             <div className="w-20 h-3 rounded-full bg-gray-200/50"></div>
             <div className="w-6 h-6 rounded-full" style={{ backgroundColor: colors.primary }}></div>
        </div>

        {/* Mock Content */}
        <div className="flex-1 p-3 space-y-2">
            <div className="w-full h-16 rounded-lg shadow-sm" style={{ backgroundColor: colors.card }}></div>
             <div className="flex gap-2">
                <div className="w-1/2 h-12 rounded-lg shadow-sm" style={{ backgroundColor: colors.card }}></div>
                <div className="w-1/2 h-12 rounded-lg shadow-sm" style={{ backgroundColor: colors.card }}></div>
             </div>
        </div>
        
        {/* Active Badge for currently selected theme only shown if used in list, but here we just show plain preview */}
         <div className="absolute inset-0 ring-4 ring-inset pointer-events-none rounded-xl" style={{
            boxShadow: `inset 0 0 0 2px ${colors.primary}`,
            opacity: 0.1
          }} />
    </div>
  );
};

const ProfileSection: React.FC<{ user: User; onUpdateUser: (updatedUser: User) => void }> = ({ user, onUpdateUser }) => {
  const [username, setUsername] = useState(user.username);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        setMessage({ text: 'File size must be less than 10MB.', type: 'error' });
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        onUpdateUser({ ...user, avatar: base64String });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpdateUsername = async (e: React.FormEvent) => {
    e.preventDefault();
    if (username.length < 3) {
      setMessage({ text: 'Username must be at least 3 characters.', type: 'error' });
      return;
    }
    if (username === user.username) return;

    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      onUpdateUser({ ...user, username });
      setMessage({ text: 'Username updated successfully!', type: 'success' });
      setTimeout(() => setMessage({ text: '', type: '' }), 3000);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Profile</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex flex-col items-center space-y-4">
          <div className="relative group">
            <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full overflow-hidden border-4 border-[rgb(var(--color-card-rgb))] shadow-lg bg-[rgb(var(--color-card-muted-rgb))]">
              {user.avatar ? (
                <img src={user.avatar} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <UserIcon className="w-12 h-12 text-[rgb(var(--color-text-muted-rgb))]" />
                </div>
              )}
            </div>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="absolute bottom-0 right-0 p-2 bg-[rgb(var(--color-primary-rgb))] text-white rounded-full shadow-md hover:bg-[rgb(var(--color-primary-hover-rgb))] transition-colors"
            >
              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>
            <input type="file" accept="image/*" ref={fileInputRef} onChange={handleAvatarUpload} className="hidden" />
          </div>
        </div>

        <form onSubmit={handleUpdateUsername} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-[rgb(var(--color-text-rgb))]">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-2 bg-[rgb(var(--color-card-muted-rgb))] border border-[rgb(var(--color-border-rgb))] rounded-lg focus:ring-2 focus:ring-[rgb(var(--color-primary-rgb))] outline-none"
            />
          </div>
          {message.text && (
            <p className={`text-sm ${message.type === 'success' ? 'text-green-600' : 'text-red-500'}`}>{message.text}</p>
          )}
          <button
            type="submit"
            disabled={isLoading || username === user.username}
            className="w-full py-2 bg-[rgb(var(--color-primary-rgb))] text-white rounded-lg hover:bg-[rgb(var(--color-primary-hover-rgb))] disabled:opacity-50 transition-colors font-medium"
          >
            {isLoading ? 'Updating...' : 'Update Username'}
          </button>
        </form>
      </CardContent>
    </Card>
  );
};

const SecuritySection: React.FC<{
  user: User;
  onUpdateUser: (user: User) => void;
  onChangePassword: (oldPw: string, newPw: string) => Promise<boolean>;
}> = ({ user, onUpdateUser, onChangePassword }) => {
  const [passwords, setPasswords] = useState({ current: '', new: '', confirm: '' });
  const [msg, setMsg] = useState({ text: '', type: '' });
  const [loading, setLoading] = useState(false);
  const [isBiometricAvailable] = useState(isWebAuthnSupported());
  const [isRegistering, setIsRegistering] = useState(false);

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwords.new.length < 6) {
      setMsg({ text: 'New password must be at least 6 characters.', type: 'error' });
      return;
    }
    if (passwords.new !== passwords.confirm) {
      setMsg({ text: 'Passwords do not match.', type: 'error' });
      return;
    }

    setLoading(true);
    try {
      const success = await onChangePassword(passwords.current, passwords.new);
      if (success) {
        setMsg({ text: 'Password updated successfully!', type: 'success' });
        setPasswords({ current: '', new: '', confirm: '' });
      } else {
        setMsg({ text: 'Incorrect current password.', type: 'error' });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleToggleBiometrics = async () => {
    if (user.biometricEnabled) {
      onUpdateUser({ ...user, biometricEnabled: false, biometricCredentialId: undefined });
    } else {
      setIsRegistering(true);
      try {
        const credential = await registerWebAuthn(user);
        if (credential) {
          const credentialId = btoa(String.fromCharCode(...new Uint8Array(credential.rawId)))
            .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
          onUpdateUser({ ...user, biometricEnabled: true, biometricCredentialId: credentialId });
          window.dispatchEvent(new CustomEvent('saveBiometricSession'));
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsRegistering(false);
      }
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Security</CardTitle>
      </CardHeader>
      <CardContent className="space-y-8">
        <form onSubmit={handlePasswordChange} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Current Password</label>
            <input
              type="password"
              value={passwords.current}
              onChange={e => setPasswords({ ...passwords, current: e.target.value })}
              className="w-full px-4 py-2 bg-[rgb(var(--color-card-muted-rgb))] border border-[rgb(var(--color-border-rgb))] rounded-lg focus:ring-2 focus:ring-[rgb(var(--color-primary-rgb))] outline-none"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">New Password</label>
            <input
              type="password"
              value={passwords.new}
              onChange={e => setPasswords({ ...passwords, new: e.target.value })}
              className="w-full px-4 py-2 bg-[rgb(var(--color-card-muted-rgb))] border border-[rgb(var(--color-border-rgb))] rounded-lg focus:ring-2 focus:ring-[rgb(var(--color-primary-rgb))] outline-none"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Confirm New Password</label>
            <input
              type="password"
              value={passwords.confirm}
              onChange={e => setPasswords({ ...passwords, confirm: e.target.value })}
              className="w-full px-4 py-2 bg-[rgb(var(--color-card-muted-rgb))] border border-[rgb(var(--color-border-rgb))] rounded-lg focus:ring-2 focus:ring-[rgb(var(--color-primary-rgb))] outline-none"
            />
          </div>
          {msg.text && <p className={`text-sm ${msg.type === 'success' ? 'text-green-600' : 'text-red-500'}`}>{msg.text}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 bg-[rgb(var(--color-primary-rgb))] text-white rounded-lg hover:bg-[rgb(var(--color-primary-hover-rgb))] disabled:opacity-50 transition-colors font-medium"
          >
            Update Password
          </button>
        </form>

        {isBiometricAvailable && (
          <div className="pt-6 border-t border-[rgb(var(--color-border-rgb))]">
            <div className="flex items-center justify-between p-4 bg-[rgb(var(--color-card-muted-rgb))] rounded-xl">
              <div>
                <p className="font-medium">Biometric Login</p>
                <p className="text-xs text-[rgb(var(--color-text-muted-rgb))]">Use Touch ID or Face ID</p>
              </div>
              <button
                onClick={handleToggleBiometrics}
                disabled={isRegistering}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  user.biometricEnabled ? 'bg-[rgb(var(--color-primary-rgb))]' : 'bg-[rgb(var(--color-border-rgb))]'
                }`}
              >
                <span className={`h-4 w-4 bg-white rounded-full transition-transform ${user.biometricEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

const SmartFeaturesSection: React.FC<{ user: User; onUpdateUser: (user: User) => void; setActiveItem?: (item: string) => void }> = ({ user, onUpdateUser, setActiveItem }) => {
  const [apiKey, setApiKey] = useState(user.aiSettings?.apiKey || '');
  const [msg, setMsg] = useState('');

  const saveApiKey = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateUser({ ...user, aiSettings: { apiKey, model: 'gemini-2.0-flash' } });
    setMsg('API Key saved!');
    setTimeout(() => setMsg(''), 3000);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>AI Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-[rgb(var(--color-text-muted-rgb))]">
            Enter your Gemini API key to enable AI-powered financial insights and smart categorization.
          </p>
          <form onSubmit={saveApiKey} className="space-y-4">
            <input
              type="password"
              placeholder="Gemini API Key"
              value={apiKey}
              onChange={e => setApiKey(e.target.value)}
              className="w-full px-4 py-2 bg-[rgb(var(--color-card-muted-rgb))] border border-[rgb(var(--color-border-rgb))] rounded-lg focus:ring-2 focus:ring-[rgb(var(--color-primary-rgb))] outline-none"
            />
            {msg && <p className="text-sm text-green-600">{msg}</p>}
            <button type="submit" className="w-full py-2 bg-[rgb(var(--color-primary-rgb))] text-white rounded-lg hover:bg-[rgb(var(--color-primary-hover-rgb))] transition-colors font-medium">
              Save API Key
            </button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Categorization</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between p-4 bg-[rgb(var(--color-card-muted-rgb))] rounded-xl">
            <div>
              <p className="font-medium">Smart Suggestions</p>
              <p className="text-xs text-[rgb(var(--color-text-muted-rgb))]">AI suggests categories for transactions</p>
            </div>
            <button
               onClick={() => onUpdateUser({ ...user, smartFeatures: { ...user.smartFeatures, categorySuggestions: !(user.smartFeatures?.categorySuggestions ?? true) } })}
               className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                (user.smartFeatures?.categorySuggestions ?? true) ? 'bg-[rgb(var(--color-primary-rgb))]' : 'bg-[rgb(var(--color-border-rgb))]'
              }`}
            >
              <span className={`h-4 w-4 bg-white rounded-full transition-transform ${(user.smartFeatures?.categorySuggestions ?? true) ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
          </div>
          <button
            onClick={() => setActiveItem?.('Manage Categories')}
            className="w-full flex items-center justify-between p-4 bg-[rgb(var(--color-card-muted-rgb))] border border-[rgb(var(--color-border-rgb))] rounded-xl hover:border-[rgb(var(--color-primary-rgb))] transition-colors group"
          >
            <span className="font-medium group-hover:text-[rgb(var(--color-primary-rgb))] transition-colors">Manage Categories</span>
            <svg className="w-5 h-5 group-hover:text-[rgb(var(--color-primary-rgb))]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M9 5l7 7-7 7" strokeWidth={2} /></svg>
          </button>
        </CardContent>
      </Card>
    </div>
  );
};

const SettingsPage: React.FC<SettingsPageProps> = ({
  user,
  onUpdateUser,
  onSignOut,
  onOpenConfirmModal,
  onImportData,
  onExportData,
  setActiveItem,
  onOpenCropModal,
  isProcessingImage = false,
  processingType = 'transparent',
  setProcessingType,
  onChangePassword
}) => {
  const [activeHubTab, setActiveHubTab] = useState<'account' | 'app'>('account');
  const [showNotificationSettings, setShowNotificationSettings] = useState(false);
  const { theme, setTheme, customBackground, setCustomBackground } = useTheme();
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleCropComplete = async (event: CustomEvent) => {
      const { croppedImageUrl, processingType: eventType } = event.detail;
      const colors = THEME_COLORS[theme] || THEME_COLORS['theme-light'];
      const themeColors = { isDark: !colors.isLight, primaryColor: colors.primary };
      const processed = eventType === 'transparent'
        ? await processImageForBackground(croppedImageUrl, themeColors)
        : await createPatternBackground(croppedImageUrl, themeColors);
      setCustomBackground(processed);
    };
    window.addEventListener('cropComplete', handleCropComplete as EventListener);
    return () => window.removeEventListener('cropComplete', handleCropComplete as EventListener);
  }, [theme, setCustomBackground]);

  if (showNotificationSettings) {
    return (
      <NotificationSettingsPage
        user={user}
        onUpdateUser={onUpdateUser}
        onBack={() => setShowNotificationSettings(false)}
      />
    );
  }

  const renderAccountTab = () => (
    <div className="space-y-6 animate-fade-in">
      <ProfileSection user={user} onUpdateUser={onUpdateUser} />
      <SecuritySection user={user} onUpdateUser={onUpdateUser} onChangePassword={onChangePassword} />
    </div>
  );

  const renderAppTab = () => (
    <div className="space-y-6 animate-fade-in">
      <Card>
        <CardHeader>
          <CardTitle>Appearance</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <label className="text-sm font-medium">Theme</label>
            <div className="flex flex-col sm:flex-row gap-6">
              <div className="w-full sm:w-1/2 space-y-2">
                <select
                  value={theme}
                  onChange={(e) => setTheme(e.target.value)}
                  className="w-full p-3 bg-[rgb(var(--color-card-muted-rgb))] border border-[rgb(var(--color-border-rgb))] rounded-xl focus:ring-2 focus:ring-[rgb(var(--color-primary-rgb))] outline-none transition-all"
                >
                  {THEMES.map(t => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
                <div className="text-xs text-[rgb(var(--color-text-muted-rgb))] px-1">
                  Select a theme to customize the look and feel of the app.
                </div>
              </div>
              
              <div className="w-full sm:w-1/2 flex items-start justify-center p-4 bg-[rgb(var(--color-card-muted-rgb))] rounded-xl border border-[rgb(var(--color-border-rgb))]">
                 <div className="w-full max-w-[200px]">
                    <p className="text-xs font-medium text-[rgb(var(--color-text-muted-rgb))] mb-3 text-center">Preview</p>
                    <ThemePreview
                      themeId={theme}
                    />
                 </div>
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-[rgb(var(--color-border-rgb))] space-y-4">
            <label className="text-sm font-medium">Card Background</label>
            {customBackground ? (
              <div className="p-4 bg-[rgb(var(--color-card-muted-rgb))] rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded border border-[rgb(var(--color-border-rgb))] overflow-hidden">
                    <img src={customBackground} className="w-full h-full object-cover" alt="Preview" />
                  </div>
                  <span className="text-sm font-medium">Custom active</span>
                </div>
                <button onClick={() => setCustomBackground(null)} className="text-sm text-red-500 font-medium">Remove</button>
              </div>
            ) : (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-[rgb(var(--color-border-rgb))] rounded-xl p-6 text-center cursor-pointer hover:border-[rgb(var(--color-primary-rgb))] transition-colors"
              >
                <p className="text-sm text-[rgb(var(--color-text-muted-rgb))]">Click to upload custom card background</p>
                <div className="mt-4 flex justify-center gap-2">
                  <button onClick={(e) => { e.stopPropagation(); setProcessingType?.('transparent'); }} className={`px-3 py-1 rounded-full text-xs ${processingType === 'transparent' ? 'bg-[rgb(var(--color-primary-rgb))] text-white' : 'bg-gray-100 dark:bg-gray-800'}`}>Transparent</button>
                  <button onClick={(e) => { e.stopPropagation(); setProcessingType?.('pattern'); }} className={`px-3 py-1 rounded-full text-xs ${processingType === 'pattern' ? 'bg-[rgb(var(--color-primary-rgb))] text-white' : 'bg-gray-100 dark:bg-gray-800'}`}>Pattern</button>
                </div>
                <input
                  type="file"
                  accept="image/*"
                  ref={fileInputRef}
                  className="hidden"
                  onChange={e => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onload = () => onOpenCropModal?.(reader.result as string, processingType);
                      reader.readAsDataURL(file);
                    }
                  }}
                />
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <SmartFeaturesSection user={user} onUpdateUser={onUpdateUser} setActiveItem={setActiveItem} />

      <Card>
        <CardHeader>
          <CardTitle>Notifications</CardTitle>
        </CardHeader>
        <CardContent>
          <button
            onClick={() => setShowNotificationSettings(true)}
            className="w-full flex items-center justify-between p-4 bg-[rgb(var(--color-card-muted-rgb))] border border-[rgb(var(--color-border-rgb))] rounded-xl hover:border-[rgb(var(--color-primary-rgb))] transition-colors group"
          >
            <div className="flex items-center gap-3">
              <BellIcon className="w-5 h-5 text-[rgb(var(--color-text-muted-rgb))] group-hover:text-[rgb(var(--color-primary-rgb))]" />
              <span className="font-medium group-hover:text-[rgb(var(--color-primary-rgb))]">Preferences & Alerts</span>
            </div>
            <svg className="w-5 h-5 group-hover:text-[rgb(var(--color-primary-rgb))]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M9 5l7 7-7 7" strokeWidth={2} /></svg>
          </button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Data & Privacy</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <button onClick={onExportData} className="w-full flex items-center justify-between p-4 bg-[rgb(var(--color-card-muted-rgb))] border border-[rgb(var(--color-border-rgb))] rounded-xl hover:border-green-500/50 transition-colors group">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/10 text-green-600 group-hover:bg-green-500 group-hover:text-white transition-colors">
                <BackupIcon className="w-5 h-5" />
              </div>
              <div className="text-left">
                <span className="block font-medium">Backup Data</span>
                <span className="text-xs text-[rgb(var(--color-text-muted-rgb))]">Export all data to a .json file</span>
              </div>
            </div>
            <svg className="w-5 h-5 text-[rgb(var(--color-text-muted-rgb))] group-hover:text-green-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M9 5l7 7-7 7" strokeWidth={2} /></svg>
          </button>
          
          <button
            onClick={() => {
              const input = document.createElement('input');
              input.type = 'file';
              input.accept = '.json';
              input.onchange = (e: any) => {
                const file = e.target.files?.[0];
                if (file) {
                  const reader = new FileReader();
                  reader.onload = (re: any) => {
                    const data = JSON.parse(re.target.result);
                    onOpenConfirmModal('Import Data', 'Overwrite ALL current data?', () => onImportData(data), { variant: 'danger' });
                  };
                  reader.readAsText(file);
                }
              };
              input.click();
            }}
            className="w-full flex items-center justify-between p-4 bg-[rgb(var(--color-card-muted-rgb))] border border-[rgb(var(--color-border-rgb))] rounded-xl hover:border-blue-500/50 transition-colors group"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10 text-blue-600 group-hover:bg-blue-500 group-hover:text-white transition-colors">
                <RestoreIcon className="w-5 h-5" />
              </div>
              <div className="text-left">
                <span className="block font-medium">Restore Backup</span>
                <span className="text-xs text-[rgb(var(--color-text-muted-rgb))]">Import data from a .json file</span>
              </div>
            </div>
            <svg className="w-5 h-5 text-[rgb(var(--color-text-muted-rgb))] group-hover:text-blue-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M9 5l7 7-7 7" strokeWidth={2} /></svg>
          </button>
        </CardContent>
      </Card>
      
      <Card>
          <CardHeader><CardTitle>App Information</CardTitle></CardHeader>
          <CardContent><ServiceWorkerDebugPanel /></CardContent>
      </Card>

      <button
        onClick={() => onOpenConfirmModal('Sign Out', 'Are you sure?', onSignOut, { variant: 'danger' })}
        className="w-full py-4 bg-red-500/10 text-red-500 border border-red-500/20 rounded-xl font-bold hover:bg-red-500 hover:text-white transition-colors"
      >
        Sign Out
      </button>
    </div>
  );

  return (
    <div className="pb-20 max-w-4xl mx-auto px-4 py-6 space-y-8">
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="p-3 bg-[rgb(var(--color-primary-rgb))]/10 rounded-2xl">
          <SettingsIcon className="w-8 h-8 text-[rgb(var(--color-primary-rgb))]" />
        </div>
        <h1 className="text-3xl font-bold">Settings Hub</h1>
      </div>

      <div className="flex p-1 bg-[rgb(var(--color-card-muted-rgb))] rounded-xl w-fit mx-auto">
        <button
          onClick={() => setActiveHubTab('account')}
          className={`px-6 py-2 rounded-lg font-semibold transition-all ${
            activeHubTab === 'account' ? 'bg-[rgb(var(--color-card-rgb))] text-[rgb(var(--color-primary-rgb))] shadow-sm' : 'text-[rgb(var(--color-text-muted-rgb))]'
          }`}
        >
          My Account
        </button>
        <button
          onClick={() => setActiveHubTab('app')}
          className={`px-6 py-2 rounded-lg font-semibold transition-all ${
            activeHubTab === 'app' ? 'bg-[rgb(var(--color-card-rgb))] text-[rgb(var(--color-primary-rgb))] shadow-sm' : 'text-[rgb(var(--color-text-muted-rgb))]'
          }`}
        >
          App Settings
        </button>
      </div>

      <div className="mt-8">
        {activeHubTab === 'account' ? renderAccountTab() : renderAppTab()}
      </div>

      <footer className="text-center text-[rgb(var(--color-text-muted-rgb))] text-sm pt-8 border-t border-[rgb(var(--color-border-rgb))]">
        <p>FinTrack v1.3.0</p>
      </footer>
    </div>
  );
};

export default SettingsPage;
