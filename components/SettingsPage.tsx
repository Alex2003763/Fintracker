import React, {useState, useEffect } from 'react';
import { User } from '../types';
import { useTheme, THEMES, Theme } from './ThemeContext';
import { SparklesIcon, BellIcon, SettingsIcon, UserIcon } from './icons';
import ServiceWorkerDebugPanel from './ServiceWorkerDebugPanel';
import NotificationSettingsPage from './NotificationSettingsPage';
import { TRANSACTION_CATEGORIES } from '../constants';
import { processImageForBackground, createPatternBackground } from '../utils/imageProcessing';
import { isWebAuthnSupported, registerWebAuthn, saveBiometricSession, getBiometricSession } from '../utils/webauthn';

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
}

// Theme preview component showing a simplified color swatch
const ThemePreview: React.FC<{ themeData: Theme | undefined }> = ({ themeData }) => {
  if (!themeData) return null;

  const isLight = themeData.category === 'light';

  return (
    <div className="flex items-center gap-3 p-3 rounded-xl border border-[rgb(var(--color-border-rgb))] bg-[rgb(var(--color-card-muted-rgb))]">
      {/* Color swatch */}
      <div
        className="w-12 h-12 rounded-lg flex-shrink-0"
        style={{ backgroundColor: themeData.accentColor }}
      />
      {/* Theme info */}
      <div className="flex-1 min-w-0">
        <p className="font-medium text-[rgb(var(--color-text-rgb))] truncate">
          {themeData.name}
        </p>
        <p className="text-sm text-[rgb(var(--color-text-muted-rgb))]">
          {isLight ? 'Light' : 'Dark'}
        </p>
      </div>
      {/* Checkmark for active */}
      <div
        className="w-6 h-6 rounded-full flex items-center justify-center"
        style={{ backgroundColor: themeData.accentColor }}
      >
        <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
        </svg>
      </div>
    </div>
  );
}

// Biometric Settings Component
const BiometricSettings: React.FC<{ user: User; onUpdateUser: (user: User) => void }> = ({ user, onUpdateUser }) => {
    const [isAvailable] = useState(isWebAuthnSupported());
    const [isRegistering, setIsRegistering] = useState(false);
    const [statusMsg, setStatusMsg] = useState('');

    if (!isAvailable) return null;

    const handleToggleBiometrics = async () => {
        setStatusMsg('');
        if (user.biometricEnabled) {
            // Disable biometrics
            onUpdateUser({
                ...user,
                biometricEnabled: false,
                biometricCredentialId: undefined
            });
            setStatusMsg('Biometrics disabled.');
            // Note: We don't remove the key from localStorage here typically, or we could.
        } else {
            // Enable biometrics
            setIsRegistering(true);
            try {
                // 1. Register with WebAuthn
                const credential = await registerWebAuthn(user);
                if (credential) {
                    // 2. Save current session key for future biometric retrieval
                    // We need access to the session key here, but it's not passed to SettingsPage
                    // So we effectively just mark it as enabled on User.
                    // The App.tsx knows the session key. It should likely save it when user updates this.
                    // Actually, we can't save the session key here because we don't have it.
                    
                    // REVISION: We need the session key to save it.
                    // Passing sessionKey to SettingsPage is sensitive.
                    // However, we are in the settings, so user is auth'd.
                    // Let's assume for this "Gate" implementation, we need the App to handle the saving.
                    // We'll dispatch an event or the onUpdateUser will trigger an effect in App?
                    
                    // Simpler: Trigger a custom event with the credential ID that App.tsx listens to
                    // to save the current session key.
                    
                    const credentialId = btoa(String.fromCharCode(...new Uint8Array(credential.rawId)))
                        .replace(/\+/g, '-')
                        .replace(/\//g, '_')
                        .replace(/=+$/, '');
                        
                    onUpdateUser({
                        ...user,
                        biometricEnabled: true,
                        biometricCredentialId: credentialId
                    });
                    
                    // Signal App to save the session key
                    window.dispatchEvent(new CustomEvent('saveBiometricSession'));
                    
                    setStatusMsg('Biometrics enabled successfully!');
                }
            } catch (error) {
                console.error("Biometric registration failed", error);
                setStatusMsg('Failed to enable biometrics. Please try again.');
            } finally {
                setIsRegistering(false);
            }
        }
    };

    return (
        <div className="border-t border-[rgb(var(--color-border-rgb))] pt-4 sm:pt-6 mt-4">
             <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 sm:p-4 bg-[rgb(var(--color-card-muted-rgb))] rounded-xl space-y-3 sm:space-y-0">
                <div className="flex-1">
                  <p id="biometric-label" className="font-medium text-[rgb(var(--color-text-rgb))]">Biometric Login</p>
                  <p id="biometric-description" className="text-sm text-[rgb(var(--color-text-muted-rgb))] pr-2">
                      Use Touch ID or Face ID to sign in
                  </p>
                </div>
                <button
                  onClick={handleToggleBiometrics}
                  disabled={isRegistering}
                  role="switch"
                  aria-checked={user.biometricEnabled}
                  aria-labelledby="biometric-label"
                  aria-describedby="biometric-description biometric-status"
                  className={`relative inline-flex h-10 w-16 items-center rounded-full transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-[rgb(var(--color-primary-rgb))] focus:ring-offset-2 focus:ring-offset-[rgb(var(--color-card-muted-rgb))] min-h-[44px] touch-manipulation ${
                    user.biometricEnabled
                      ? 'bg-[rgb(var(--color-primary-rgb))]'
                      : 'bg-[rgb(var(--color-border-rgb))]'
                  } ${isRegistering ? 'opacity-50 cursor-wait' : ''}`}
                >
                  <span className="sr-only">
                    {user.biometricEnabled ? 'Disable biometric login' : 'Enable biometric login'}
                  </span>
                  <span
                    aria-hidden="true"
                    className={`inline-block h-7 w-7 transform rounded-full bg-white shadow-lg transition-transform duration-300 ${
                      user.biometricEnabled
                        ? 'translate-x-8'
                        : 'translate-x-1.5'
                    }`}
                  />
                </button>
            </div>
            <div
              id="biometric-status"
              aria-live="polite"
              aria-atomic="true"
              className="min-h-[1.5rem]"
            >
              {statusMsg && (
                  <p className={`text-sm mt-2 ${statusMsg.includes('success') ? 'text-green-600' : 'text-red-500'}`}>
                      {statusMsg}
                  </p>
              )}
            </div>
        </div>
    );
};

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
        <div className="space-y-3 sm:space-y-4" role="group" aria-labelledby="ai-settings-title">
            <h2 id="ai-settings-title" className="text-lg sm:text-xl font-semibold text-[rgb(var(--color-text-rgb))]">AI Settings</h2>
            <form onSubmit={handleSubmit} className="space-y-4" aria-describedby="ai-settings-description">
                <p id="ai-settings-description" className="text-sm text-[rgb(var(--color-text-muted-rgb))] leading-relaxed">
                    Enter your Gemini API key to enable AI-powered financial insights and smart categorization.
                </p>
                <div className="relative">
                    <label htmlFor="gemini-api-key" className="sr-only">Gemini API Key</label>
                    <input
                        id="gemini-api-key"
                        type="password"
                        value={apiKey}
                        onChange={(e) => setApiKey(e.target.value)}
                        placeholder="Gemini API Key"
                        autoComplete="off"
                        className="w-full px-4 py-3 bg-[rgb(var(--color-card-muted-rgb))] border border-[rgb(var(--color-border-rgb))] rounded-xl text-[rgb(var(--color-text-rgb))] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--color-primary-rgb))] focus:border-transparent transition-all duration-200 text-sm sm:text-base placeholder-[rgb(var(--color-text-muted-rgb))]"
                        aria-describedby="ai-settings-description ai-settings-status"
                    />
                </div>
                <div
                  id="ai-settings-status"
                  aria-live="polite"
                  aria-atomic="true"
                  className="min-h-[1rem]"
                >
                  {message && (
                      <div
                        role="status"
                        className={`p-3 rounded-lg text-sm font-medium animate-fade-in ${message.includes('success') ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}
                      >
                          {message}
                      </div>
                  )}
                </div>
                <button
                    type="submit"
                    className="w-full sm:w-auto px-6 py-3 text-sm font-medium bg-[rgb(var(--color-primary-rgb))] text-[rgb(var(--color-primary-text-rgb))] rounded-xl hover:bg-[rgb(var(--color-primary-hover-rgb))] transition-all duration-200 shadow-sm hover:shadow-md transform hover:scale-[1.02] active:scale-[0.98]"
                >
                    Save API Key
                </button>
            </form>
        </div>
    );
};

const SettingsPage: React.FC<SettingsPageProps> = ({
  user,
  onUpdateUser,
  onSignOut,
  onOpenConfirmModal,
  onImportData,
  setActiveItem,
  onOpenCropModal,
  isProcessingImage = false,
  processingType = 'transparent',
  setProcessingType,
  onExportData
}) => {
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const { theme, setTheme, customBackground, setCustomBackground } = useTheme();
  const [showNotificationSettings, setShowNotificationSettings] = useState(false);
  const [localProcessingType, setLocalProcessingType] = useState<'transparent' | 'pattern'>('transparent');
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  // Helper function to get theme colors for image processing
  const getThemeColors = () => {
    const currentTheme = THEMES.find(t => t.id === theme);
    const isDark = currentTheme?.category === 'dark';
    const primaryColor = currentTheme?.accentColor || '#3b82f6';

    return { isDark, primaryColor };
  };

  // Use local state if global state handlers aren't provided (backward compatibility)
  const currentProcessingType = processingType || localProcessingType;
  const handleSetProcessingType = setProcessingType || setLocalProcessingType;

  // Fallback function to process image directly without cropping
  const processImageDirectly = async (imageSrc: string) => {
    try {
      const themeColors = getThemeColors();
      const processedImage = currentProcessingType === 'transparent'
        ? await processImageForBackground(imageSrc, themeColors)
        : await createPatternBackground(imageSrc, themeColors);
      setCustomBackground(processedImage);
    } catch (error) {
      console.error('Error processing image:', error);
      alert('Failed to process image. Please try again.');
    }
  };

  // Listen for crop completion events from the global modal
  useEffect(() => {
    const handleCropComplete = async (event: CustomEvent) => {
      const { croppedImageUrl, processingType: eventProcessingType } = event.detail;
      try {
        const themeColors = getThemeColors();
        const processedImage = eventProcessingType === 'transparent'
          ? await processImageForBackground(croppedImageUrl, themeColors)
          : await createPatternBackground(croppedImageUrl, themeColors);
        setCustomBackground(processedImage);
      } catch (error) {
        console.error('Error processing cropped image:', error);
        alert('Failed to process image. Please try again.');
      }
    };

    window.addEventListener('cropComplete', handleCropComplete as EventListener);
    return () => {
      window.removeEventListener('cropComplete', handleCropComplete as EventListener);
    };
  }, [theme]); // Re-run when theme changes to get updated colors

  const handleSignOut = () => {
    onOpenConfirmModal(
      'Sign Out',
      'Are you sure you want to sign out?',
      onSignOut,
      { confirmText: 'Sign Out', variant: 'danger' }
    );
  };

  const handleExport = () => {
    setIsExporting(true);
    // Delegate to parent component which has access to decrypted data
    onExportData();
    // Reset state after a short delay
    setTimeout(() => setIsExporting(false), 1000);
  };

  const handleImportClick = () => {
      fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      setIsImporting(true);
      const reader = new FileReader();
      reader.onload = (e) => {
          try {
              const text = e.target?.result;
              if (typeof text !== 'string') throw new Error("File content is not a string");
              const data = JSON.parse(text);
              
              // Validate the backup file structure
              if (!data || !data.user || !Array.isArray(data.transactions)) {
                  alert('Invalid backup file format. Missing required data.');
                  return;
              }

              // Check version compatibility
              if (data.version && data.version !== '1.3.0') {
                  console.warn(`Backup version ${data.version} may not be fully compatible with current version 1.3.0`);
              }

              onOpenConfirmModal(
                  'Import Data',
                  'Are you sure? This will overwrite ALL current data, including your account info.',
                  () => {
                      onImportData(data);
                      setIsImporting(false);
                  },
                  { confirmText: 'Import & Overwrite', variant: 'danger' }
              );
          } catch (error) {
              console.error('Error parsing backup file:', error);
              alert('Failed to read or parse the backup file. Please ensure it\'s a valid FinTrack backup.');
          } finally {
              setIsImporting(false);
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


   return (
     <div
       className="bg-[rgb(var(--color-background-rgb))] px-4 sm:px-6 lg:px-8 py-6 sm:py-8 max-w-6xl mx-auto min-h-screen"
       role="main"
       aria-label="Settings page"
     >
       {/* Enhanced Header with User Profile */}
      <header className="mb-8">
        <div className="bg-gradient-to-r from-[rgb(var(--color-primary-rgb))]/10 via-[rgb(var(--color-card-rgb))] to-[rgb(var(--color-primary-rgb))]/5 rounded-2xl sm:rounded-3xl p-6 sm:p-8 border border-[rgb(var(--color-border-rgb))]">
          <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
            {/* User Avatar */}
            <div className="relative">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-br from-[rgb(var(--color-primary-rgb))] to-[rgb(var(--color-primary-hover-rgb))] flex items-center justify-center shadow-lg">
                <span className="text-2xl sm:text-3xl font-bold text-[rgb(var(--color-primary-text-rgb))]">
                  {user.username.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full border-2 border-[rgb(var(--color-card-rgb))] flex items-center justify-center">
                <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
            </div>

            {/* User Info */}
            <div className="flex-1 text-center sm:text-left">
              <h1 id="settings-page-title" className="text-2xl sm:text-3xl font-bold text-[rgb(var(--color-text-rgb))] mb-1">
                Settings
              </h1>
              <p className="text-[rgb(var(--color-text-muted-rgb))] text-sm sm:text-base">
                Signed in as <span className="font-medium text-[rgb(var(--color-text-rgb))]">{user.username}</span>
              </p>
            </div>

            {/* Quick Actions */}
            <div className="flex gap-2 sm:gap-3 w-full sm:w-auto justify-center sm:justify-end">
              <button
                onClick={() => setActiveItem?.('Account')}
                className="flex-1 sm:flex-none px-3 sm:px-4 py-2 text-sm bg-[rgb(var(--color-card-rgb))] text-[rgb(var(--color-text-rgb))] rounded-xl border border-[rgb(var(--color-border-rgb))] hover:bg-[rgb(var(--color-card-muted-rgb))] hover:border-[rgb(var(--color-primary-rgb))]/30 transition-all duration-200 font-medium min-h-[44px] touch-manipulation"
                aria-label="Manage your account settings"
              >
                Edit Profile
              </button>
              <button
                onClick={handleSignOut}
                className="flex-1 sm:flex-none px-3 sm:px-4 py-2 text-sm bg-[rgb(var(--color-primary-rgb))] text-[rgb(var(--color-primary-text-rgb))] rounded-xl hover:bg-[rgb(var(--color-primary-hover-rgb))] transition-all duration-200 font-medium shadow-sm min-h-[44px] touch-manipulation"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">

        {/* Left Column */}
        <div className="space-y-6">
          {/* Account & Security Card */}
          <section aria-labelledby="account-section-title" role="region">
            <div className="bg-[rgb(var(--color-card-rgb))] rounded-2xl border border-[rgb(var(--color-border-rgb))] overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300">
              <div className="px-5 py-4 bg-gradient-to-r from-[rgb(var(--color-card-muted-rgb))] to-[rgb(var(--color-card-rgb))] border-b border-[rgb(var(--color-border-rgb))]">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-[rgb(var(--color-primary-rgb))]/10 rounded-lg" aria-hidden="true">
                    <UserIcon className="w-5 h-5 text-[rgb(var(--color-primary-rgb))]" />
                  </div>
                  <h2 id="account-section-title" className="text-lg font-semibold text-[rgb(var(--color-text-rgb))]">Account & Security</h2>
                </div>
              </div>
              <div className="p-5">
                <BiometricSettings user={user} onUpdateUser={onUpdateUser} />
              </div>
            </div>
          </section>

          {/* Appearance Card */}
          <section aria-labelledby="appearance-section-title" role="region">
            <div className="bg-[rgb(var(--color-card-rgb))] rounded-2xl border border-[rgb(var(--color-border-rgb))] overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300">
              <div className="px-5 py-4 bg-gradient-to-r from-[rgb(var(--color-card-muted-rgb))] to-[rgb(var(--color-card-rgb))] border-b border-[rgb(var(--color-border-rgb))]">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-500/10 rounded-lg" aria-hidden="true">
                    <SparklesIcon className="w-5 h-5 text-purple-500" />
                  </div>
                  <h2 id="appearance-section-title" className="text-lg font-semibold text-[rgb(var(--color-text-rgb))]">Appearance</h2>
                </div>
              </div>
              <div className="p-5 space-y-4">
                <p id="theme-description" className="text-sm text-[rgb(var(--color-text-muted-rgb))]">Choose your preferred theme</p>

                {/* Theme Dropdown Selector */}
                <div>
                  <label htmlFor="theme-select" className="block text-sm font-medium text-[rgb(var(--color-text-rgb))] mb-2">
                    Select Theme
                  </label>
                  <div className="relative">
                    <select
                      id="theme-select"
                      value={theme}
                      onChange={(e) => setTheme(e.target.value)}
                      aria-describedby="theme-description"
                      className="w-full appearance-none bg-[rgb(var(--color-bg-rgb))] border border-[rgb(var(--color-border-rgb))] rounded-xl px-4 py-3 pr-10 text-[rgb(var(--color-text-rgb))] text-base focus:outline-none focus:ring-2 focus:ring-[rgb(var(--color-primary-rgb))] focus:border-transparent transition-all cursor-pointer touch-manipulation"
                    >
                      <optgroup label="Light Themes">
                        {THEMES.filter(t => t.category === 'light').map(t => (
                          <option key={t.id} value={t.id}>{t.name}</option>
                        ))}
                      </optgroup>
                      <optgroup label="Dark Themes">
                        {THEMES.filter(t => t.category === 'dark').map(t => (
                          <option key={t.id} value={t.id}>{t.name}</option>
                        ))}
                      </optgroup>
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none" aria-hidden="true">
                      <svg className="w-5 h-5 text-[rgb(var(--color-text-muted-rgb))]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Theme Preview */}
                <div>
                  <p id="theme-preview-label" className="block text-sm font-medium text-[rgb(var(--color-text-rgb))] mb-2">
                    Preview
                  </p>
                  <div aria-labelledby="theme-preview-label" aria-live="polite">
                    <ThemePreview themeData={THEMES.find(t => t.id === theme)} />
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* Right Column */}
        <div className="space-y-6">

          {/* Custom Background Card */}
          <section aria-labelledby="background-section-title" role="region">
            <div className="bg-[rgb(var(--color-card-rgb))] rounded-2xl border border-[rgb(var(--color-border-rgb))] overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300">
              <div className="px-5 py-4 bg-gradient-to-r from-[rgb(var(--color-card-muted-rgb))] to-[rgb(var(--color-card-rgb))] border-b border-[rgb(var(--color-border-rgb))]">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-pink-500/10 rounded-lg" aria-hidden="true">
                    <svg className="w-5 h-5 text-pink-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <h2 id="background-section-title" className="text-lg font-semibold text-[rgb(var(--color-text-rgb))]">Card Background</h2>
                </div>
              </div>
              <div className="p-5">
                <p id="background-description" className="text-sm text-[rgb(var(--color-text-muted-rgb))] mb-4">
                  Customize your balance card with a background image
                </p>
            
            {customBackground ? (
              <div className="space-y-4">
                <div className="p-4 bg-[rgb(var(--color-card-muted-rgb))] rounded-xl border border-[rgb(var(--color-border-rgb))]">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 rounded-lg overflow-hidden border border-[rgb(var(--color-border-rgb))]">
                        <img
                          src={customBackground}
                          alt="Custom background preview"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div>
                        <p className="font-medium text-[rgb(var(--color-text-rgb))]">Custom Background Active</p>
                        <p className="text-sm text-[rgb(var(--color-text-muted-rgb))]">Your card background is customized</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setCustomBackground(null)}
                      aria-label="Remove custom background image"
                      className="px-4 py-2 text-sm bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="border-2 border-dashed border-[rgb(var(--color-border-rgb))] rounded-xl p-8 text-center">
                  <svg className="w-12 h-12 text-[rgb(var(--color-text-muted-rgb))] mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  <p className="text-[rgb(var(--color-text-rgb))] font-medium mb-2">Upload Background Image</p>
                  <p className="text-sm text-[rgb(var(--color-text-muted-rgb))] mb-4">
                    Choose a transparent PNG or any image to customize your card background
                  </p>
                  <div className="space-y-4">
                    <div className="flex gap-2 mb-4">
                      <button
                        onClick={() => handleSetProcessingType('transparent')}
                        className={`px-4 py-3 text-sm rounded-xl transition-colors min-h-[44px] touch-manipulation ${
                          currentProcessingType === 'transparent'
                            ? 'bg-[rgb(var(--color-primary-rgb))] text-[rgb(var(--color-primary-text-rgb))]'
                            : 'bg-[rgb(var(--color-card-muted-rgb))] text-[rgb(var(--color-text-rgb))]'
                        }`}
                      >
                        Transparent
                      </button>
                      <button
                        onClick={() => handleSetProcessingType('pattern')}
                        className={`px-4 py-3 text-sm rounded-xl transition-colors min-h-[44px] touch-manipulation ${
                          currentProcessingType === 'pattern'
                            ? 'bg-[rgb(var(--color-primary-rgb))] text-[rgb(var(--color-primary-text-rgb))]'
                            : 'bg-[rgb(var(--color-card-muted-rgb))] text-[rgb(var(--color-text-rgb))]'
                        }`}
                      >
                        Pattern
                      </button>
                    </div>
                    
                    {/* Hidden file input for mobile accessibility */}
                    <input
                      type="file"
                      accept="image/*"
                      disabled={isProcessingImage}
                      id="background-image-upload"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onload = () => {
                            const imageSrc = reader.result as string;
                            if (onOpenCropModal) {
                              // Use the global crop modal
                              onOpenCropModal(imageSrc, currentProcessingType);
                            } else {
                              // Fallback: process image directly without cropping
                              console.warn('Crop modal not available, processing image directly');
                              processImageDirectly(imageSrc);
                            }
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                      className="hidden"
                      aria-hidden="true"
                    />
                    {/* Custom button for mobile-friendly file selection */}
                    <label
                      htmlFor="background-image-upload"
                      className="block w-full text-sm text-[rgb(var(--color-text-rgb))]
                        file:mr-2 sm:file:mr-4 file:py-3 file:px-4
                        file:rounded-xl file:border-0
                        file:text-sm file:font-medium
                        file:bg-[rgb(var(--color-primary-rgb))] file:text-[rgb(var(--color-primary-text-rgb))]
                        hover:file:bg-[rgb(var(--color-primary-hover-rgb))]
                        file:cursor-pointer cursor-pointer
                        file:min-h-[44px] file:touch-manipulation
                        disabled:opacity-50 disabled:cursor-not-allowed"
                      aria-label="Upload background image"
                    >
                      Upload Background Image
                    </label>
                    
                    {isProcessingImage && (
                      <div className="flex items-center justify-center py-4">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[rgb(var(--color-primary-rgb))]"></div>
                        <span className="ml-2 text-sm text-[rgb(var(--color-text-muted-rgb))]">
                          Processing image...
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <svg className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div>
                      <p className="text-sm font-medium text-blue-800 dark:text-blue-200">Tips for best results:</p>
                      <ul className="text-sm text-blue-700 dark:text-blue-300 mt-1 space-y-1">
                        <li>• <strong>Transparent:</strong> Automatically makes images semi-transparent</li>
                        <li>• <strong>Pattern:</strong> Creates a subtle pattern effect with gradient overlay</li>
                        <li>• Images are optimized and resized for better performance</li>
                        <li>• Both options work well with all themes</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            )}
              </div>
            </div>
          </section>

          {/* Smart Features Card */}
          <section aria-labelledby="smart-features-section-title" role="region">
            <div className="bg-[rgb(var(--color-card-rgb))] rounded-2xl border border-[rgb(var(--color-border-rgb))] overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300">
              <div className="px-5 py-4 bg-gradient-to-r from-[rgb(var(--color-card-muted-rgb))] to-[rgb(var(--color-card-rgb))] border-b border-[rgb(var(--color-border-rgb))]">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-amber-500/10 rounded-lg" aria-hidden="true">
                    <SparklesIcon className="w-5 h-5 text-amber-500" />
                  </div>
                  <h2 id="smart-features-section-title" className="text-lg font-semibold text-[rgb(var(--color-text-rgb))]">Smart Features</h2>
                </div>
              </div>
              <div className="p-5 space-y-4">
                <AISettings user={user} onUpdateUser={onUpdateUser} />

                <div className="border-t border-[rgb(var(--color-border-rgb))] pt-4">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 sm:p-4 bg-[rgb(var(--color-card-muted-rgb))] rounded-xl space-y-3 sm:space-y-0">
                    <div className="flex-1">
                      <p id="category-suggestions-label" className="font-medium text-[rgb(var(--color-text-rgb))]">Smart Category Suggestions</p>
                      <p id="category-suggestions-description" className="text-sm text-[rgb(var(--color-text-muted-rgb))] pr-2">AI suggests categories based on transaction descriptions</p>
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
                      role="switch"
                      aria-checked={user.smartFeatures?.categorySuggestions ?? true}
                      aria-labelledby="category-suggestions-label"
                      aria-describedby="category-suggestions-description"
                      className={`relative inline-flex h-10 w-16 items-center rounded-full transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-[rgb(var(--color-primary-rgb))] focus:ring-offset-2 focus:ring-offset-[rgb(var(--color-card-muted-rgb))] min-h-[44px] touch-manipulation ${
                        user.smartFeatures?.categorySuggestions ?? true
                          ? 'bg-[rgb(var(--color-primary-rgb))]'
                          : 'bg-[rgb(var(--color-border-rgb))]'
                      }`}
                    >
                      <span className="sr-only">
                        {user.smartFeatures?.categorySuggestions ?? true ? 'Disable smart category suggestions' : 'Enable smart category suggestions'}
                      </span>
                      <span
                        aria-hidden="true"
                        className={`inline-block h-7 w-7 transform rounded-full bg-white shadow-lg transition-transform duration-300 ${
                          user.smartFeatures?.categorySuggestions ?? true
                            ? 'translate-x-8'
                            : 'translate-x-1.5'
                        }`}
                      />
                    </button>
                  </div>

                  <div className="mt-3 sm:mt-4">
                    <button
                      onClick={() => setActiveItem?.('Manage Categories')}
                      aria-label="Manage Categories - Create and organize custom categories"
                      className="w-full p-3 sm:p-4 text-left bg-[rgb(var(--color-card-muted-rgb))] border border-[rgb(var(--color-border-rgb))] rounded-xl hover:bg-[rgb(var(--color-card-rgb))] hover:border-[rgb(var(--color-primary-rgb))]/30 transition-all duration-200 group"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1 pr-2">
                          <p className="font-medium text-[rgb(var(--color-text-rgb))] group-hover:text-[rgb(var(--color-primary-rgb))] transition-colors">Manage Categories</p>
                          <p className="text-sm text-[rgb(var(--color-text-muted-rgb))]">Create and organize custom categories</p>
                        </div>
                        <svg className="w-5 h-5 text-[rgb(var(--color-text-muted-rgb))] group-hover:text-[rgb(var(--color-primary-rgb))] transition-colors flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>

      {/* Full-width sections below the grid */}
      <div className="mt-8 space-y-6">
        {/* Notifications Card */}
        <section aria-labelledby="notifications-section-title" role="region">
          <div className="bg-[rgb(var(--color-card-rgb))] rounded-2xl border border-[rgb(var(--color-border-rgb))] overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300">
            <button
              onClick={() => setShowNotificationSettings(true)}
              aria-label="Open notification preferences to customize alerts and reminders"
              className="w-full text-left"
            >
              <div className="px-5 py-4 bg-gradient-to-r from-[rgb(var(--color-card-muted-rgb))] to-[rgb(var(--color-card-rgb))] border-b border-[rgb(var(--color-border-rgb))] hover:from-[rgb(var(--color-card-rgb))] transition-all duration-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-500/10 rounded-lg" aria-hidden="true">
                      <BellIcon className="w-5 h-5 text-blue-500" />
                    </div>
                    <div>
                      <h2 id="notifications-section-title" className="text-lg font-semibold text-[rgb(var(--color-text-rgb))]">Notifications</h2>
                      <p className="text-sm text-[rgb(var(--color-text-muted-rgb))]">Customize alerts and reminders</p>
                    </div>
                  </div>
                  <svg className="w-5 h-5 text-[rgb(var(--color-text-muted-rgb))]" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </button>
          </div>
        </section>

        {/* Data & Privacy Card */}
        <section aria-labelledby="data-privacy-section-title" role="region">
          <div className="bg-[rgb(var(--color-card-rgb))] rounded-2xl border border-[rgb(var(--color-border-rgb))] overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300">
            <div className="px-5 py-4 bg-gradient-to-r from-[rgb(var(--color-card-muted-rgb))] to-[rgb(var(--color-card-rgb))] border-b border-[rgb(var(--color-border-rgb))]">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-500/10 rounded-lg" aria-hidden="true">
                  <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <h2 id="data-privacy-section-title" className="text-lg font-semibold text-[rgb(var(--color-text-rgb))]">Data & Privacy</h2>
              </div>
            </div>
            <div className="p-5 space-y-3">
            <button
              onClick={handleExport}
              disabled={isExporting}
              aria-label={isExporting ? 'Exporting data, please wait' : 'Export data - Save a backup of all your data'}
              aria-busy={isExporting}
              className="w-full p-3 sm:p-4 text-left bg-[rgb(var(--color-card-muted-rgb))] border border-[rgb(var(--color-border-rgb))] rounded-xl hover:bg-[rgb(var(--color-card-rgb))] hover:border-[rgb(var(--color-primary-rgb))]/30 transition-all duration-200 group disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px] touch-manipulation"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3 sm:space-x-4 flex-1">
                  <div className="p-2 bg-green-100 rounded-lg flex-shrink-0" aria-hidden="true">
                    {isExporting ? (
                      <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-green-600 border-t-transparent rounded-full animate-spin" role="status" aria-label="Loading"></div>
                    ) : (
                      <svg className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l4-4m-4 4l-4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-[rgb(var(--color-text-rgb))] group-hover:text-[rgb(var(--color-primary-rgb))] transition-colors">
                      {isExporting ? 'Exporting...' : 'Export Data'}
                    </p>
                    <p className="text-sm text-[rgb(var(--color-text-muted-rgb))]">Save a backup of all your data</p>
                  </div>
                </div>
                <svg className="w-5 h-5 text-[rgb(var(--color-text-muted-rgb))] group-hover:text-[rgb(var(--color-primary-rgb))] transition-colors flex-shrink-0 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </button>

            <button
              onClick={handleImportClick}
              disabled={isImporting}
              aria-label={isImporting ? 'Importing data, please wait' : 'Import data - Restore from a backup file'}
              aria-busy={isImporting}
              className="w-full p-3 sm:p-4 text-left bg-[rgb(var(--color-card-muted-rgb))] border border-[rgb(var(--color-border-rgb))] rounded-xl hover:bg-[rgb(var(--color-card-rgb))] hover:border-[rgb(var(--color-primary-rgb))]/30 transition-all duration-200 group disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px] touch-manipulation"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3 sm:space-x-4 flex-1">
                  <div className="p-2 bg-blue-100 rounded-lg flex-shrink-0" aria-hidden="true">
                    {isImporting ? (
                      <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" role="status" aria-label="Loading"></div>
                    ) : (
                      <svg className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                      </svg>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-[rgb(var(--color-text-rgb))] group-hover:text-[rgb(var(--color-primary-rgb))] transition-colors">
                      {isImporting ? 'Importing...' : 'Import Data'}
                    </p>
                    <p className="text-sm text-[rgb(var(--color-text-muted-rgb))]">Restore from a backup file</p>
                  </div>
                </div>
                <svg className="w-5 h-5 text-[rgb(var(--color-text-muted-rgb))] group-hover:text-[rgb(var(--color-primary-rgb))] transition-colors flex-shrink-0 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
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
              aria-label="Select JSON file to import"
            />
            </div>
          </div>
        </section>

        {/* Support Card */}
        <section aria-labelledby="support-section-title" role="region">
          <div className="bg-[rgb(var(--color-card-rgb))] rounded-2xl border border-[rgb(var(--color-border-rgb))] overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300">
            <div className="px-5 py-4 bg-gradient-to-r from-[rgb(var(--color-card-muted-rgb))] to-[rgb(var(--color-card-rgb))] border-b border-[rgb(var(--color-border-rgb))]">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-cyan-500/10 rounded-lg" aria-hidden="true">
                  <svg className="w-5 h-5 text-cyan-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h2 id="support-section-title" className="text-lg font-semibold text-[rgb(var(--color-text-rgb))]">Support & Info</h2>
              </div>
            </div>
            <div className="p-5">
              <ServiceWorkerDebugPanel />
            </div>
          </div>
        </section>
      </div>

      {/* Footer */}
      <footer className="mt-8 text-center py-6 border-t border-[rgb(var(--color-border-rgb))]" role="contentinfo">
        <p className="text-[rgb(var(--color-text-muted-rgb))] text-sm">FinTrack App v1.3.0</p>
      </footer>
    </div>
  );
};

export default SettingsPage;