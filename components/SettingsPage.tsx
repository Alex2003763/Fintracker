import React, { useState, useEffect, useRef } from 'react';
import { User, NotificationSettings } from '../types';
import { CURRENCIES } from '../utils/formatters';
import { useTheme, THEMES } from './ThemeContext';
import {
  SparklesIcon, BellIcon, SettingsIcon, UserIcon,
  ChevronUpIcon, HomeIcon, TrendingUpIcon, BackupIcon, RestoreIcon
} from './icons';
import ServiceWorkerDebugPanel from './ServiceWorkerDebugPanel';
import NotificationSettingsPage from './NotificationSettingsPage';
import { processImageForBackground, createPatternBackground } from '../utils/imageProcessing';
import { isWebAuthnSupported, registerWebAuthn } from '../utils/webauthn';
import Card, { CardHeader, CardTitle, CardContent } from './Card';
import Button from './Button';
import ToggleButton from './ToggleButton';


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


// ─── Theme Preview ────────────────────────────────────────────────────────────

const THEME_COLORS: Record<string, { bg: string; card: string; primary: string; isLight: boolean }> = {
  'theme-light':          { bg: '#f3f4f6', card: '#ffffff',  primary: '#2563eb', isLight: true },
  'theme-dark-slate':     { bg: '#0f172a', card: '#1e293b',  primary: '#3b82f6', isLight: false },
  'theme-dark-green':     { bg: '#0f1714', card: '#19271e',  primary: '#4ade80', isLight: false },
  'theme-dark-crimson':   { bg: '#1c1518', card: '#312126',  primary: '#f43f5e', isLight: false },
  'theme-ocean-blue':     { bg: '#0f2337', card: '#192d41',  primary: '#648caa', isLight: false },
  'theme-sunset-orange':  { bg: '#faf5eb', card: '#f5ebdc',  primary: '#be8264', isLight: true },
  'theme-purple':         { bg: '#231e2d', card: '#2d283a',  primary: '#8c78a5', isLight: false },
  'theme-midnight-black': { bg: '#121214', card: '#1c1c20',  primary: '#788ca0', isLight: false },
  'theme-pixel':          { bg: '#0a0a14', card: '#121226',  primary: '#ffdc00', isLight: false },
  'theme-cyberpunk':     { bg: '#0d0d1a', card: '#12121f',  primary: '#f5e642', isLight: false },
};

const ThemePreview: React.FC<{ themeId: string }> = ({ themeId }) => {
  const colors = THEME_COLORS[themeId] || THEME_COLORS['theme-light'];
  return (
    <div
      className="w-full aspect-video rounded-xl shadow-lg border border-[rgb(var(--color-border-rgb))] overflow-hidden flex flex-col relative"
      style={{ backgroundColor: colors.bg }}
    >
      {/* Mock header */}
      <div
        className="h-8 border-b flex items-center px-3 justify-between shrink-0"
        style={{ backgroundColor: colors.card, borderColor: 'rgba(0,0,0,0.1)' }}
      >
        <div className="w-16 h-2 rounded-full bg-gray-200/50" />
        <div className="w-5 h-5 rounded-full" style={{ backgroundColor: colors.primary }} />
      </div>
      {/* Mock content */}
      <div className="flex-1 p-2 space-y-1.5">
        <div className="w-full h-10 rounded-md" style={{ backgroundColor: colors.card }} />
        <div className="flex gap-1.5">
          <div className="w-1/2 h-8 rounded-md" style={{ backgroundColor: colors.card }} />
          <div className="w-1/2 h-8 rounded-md" style={{ backgroundColor: colors.card }} />
        </div>
      </div>
      {/* Accent ring */}
      {/* Theme-specific subtle overlays for preview */}
      {themeId === 'theme-pixel' && (
        <div
          className="absolute inset-0 pointer-events-none rounded-xl"
          style={{
            backgroundImage: 'linear-gradient(rgba(0,255,136,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(0,255,136,0.06) 1px, transparent 1px)',
            backgroundSize: '8px 8px',
            mixBlendMode: 'overlay'
          }}
        />
      )}
      {themeId === 'theme-cyberpunk' && (
        <>
          <div
            className="absolute inset-0 pointer-events-none rounded-xl"
            style={{
              backgroundImage: 'repeating-linear-gradient(180deg, rgba(255,255,255,0.02) 0px, rgba(255,255,255,0.02) 1px, transparent 1px, transparent 4px)'
            }}
          />
          <div className="absolute left-0 top-0 w-full h-1 pointer-events-none" style={{ background: 'linear-gradient(90deg, transparent, rgba(0,245,255,0.30), transparent)' }} />
        </>
      )}

      <div
        className="absolute inset-0 rounded-xl pointer-events-none"
        style={{ boxShadow: `inset 0 0 0 2px ${colors.primary}20` }}
      />
    </div>
  );
};


// ─── Reusable: Password Field with show/hide ──────────────────────────────────

const PasswordField: React.FC<{
  label: string;
  value: string;
  onChange: (v: string) => void;
}> = ({ label, value, onChange }) => {
  const [show, setShow] = useState(false);
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium text-[rgb(var(--color-text-rgb))]">{label}</label>
      <div className="relative">
        <input
          type={show ? 'text' : 'password'}
          value={value}
          onChange={e => onChange(e.target.value)}
          className="w-full px-4 py-3 pr-12 bg-[rgb(var(--color-card-muted-rgb))] border border-[rgb(var(--color-border-rgb))] rounded-xl focus:ring-2 focus:ring-[rgb(var(--color-primary-rgb))] outline-none text-[rgb(var(--color-text-rgb))] text-base"
        />
        <button
          type="button"
          onClick={() => setShow(s => !s)}
          className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-[rgb(var(--color-text-muted-rgb))] hover:text-[rgb(var(--color-primary-rgb))] transition-colors"
          aria-label={show ? 'Hide password' : 'Show password'}
        >
          {show ? (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 4.411m0 0L21 21" />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          )}
        </button>
      </div>
    </div>
  );
};


// ─── Row: icon + label + right slot (used for list items) ─────────────────────

const SettingsRow: React.FC<{
  icon: React.ReactNode;
  iconBg?: string;
  label: string;
  sublabel?: string;
  right?: React.ReactNode;
  onClick?: () => void;
  hoverColor?: string;
}> = ({ icon, iconBg, label, sublabel, right, onClick, hoverColor = 'rgb(var(--color-primary-rgb))' }) => {
  const Wrapper = onClick ? 'button' : 'div';
  return (
    <Wrapper
      {...(onClick ? { type: 'button', onClick } : {})}
      className="w-full flex items-center gap-4 p-4 bg-[rgb(var(--color-card-muted-rgb))] rounded-2xl border border-[rgb(var(--color-border-rgb))] hover:border-[rgb(var(--color-primary-rgb))]/60 active:scale-[0.98] transition-all text-left min-h-[60px]"
      style={{ cursor: onClick ? 'pointer' : 'default' }}
    >
      <div
        className="shrink-0 w-10 h-10 rounded-xl flex items-center justify-center"
        style={{ backgroundColor: iconBg || `rgb(var(--color-primary-rgb), 0.12)`, color: `rgb(var(--color-primary-rgb))` }}
      >
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-[rgb(var(--color-text-rgb))] text-sm leading-snug">{label}</p>
        {sublabel && <p className="text-xs text-[rgb(var(--color-text-muted-rgb))] mt-0.5 leading-snug">{sublabel}</p>}
      </div>
      {right ?? (
        onClick && (
          <svg className="w-4 h-4 text-[rgb(var(--color-text-muted-rgb))] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        )
      )}
    </Wrapper>
  );
};


// ─── Profile Section ──────────────────────────────────────────────────────────

const ProfileSection: React.FC<{ user: User; onUpdateUser: (u: User) => void }> = ({ user, onUpdateUser }) => {
  const [username, setUsername] = useState(user.username);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      setMessage({ text: 'File size must be less than 10 MB.', type: 'error' });
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => onUpdateUser({ ...user, avatar: reader.result as string });
    reader.readAsDataURL(file);
  };

  const handleUpdateUsername = async (e: React.FormEvent) => {
    e.preventDefault();
    if (username.length < 3) { setMessage({ text: 'Username must be at least 3 characters.', type: 'error' }); return; }
    if (username === user.username) return;
    setIsLoading(true);
    try {
      await new Promise(r => setTimeout(r, 500));
      onUpdateUser({ ...user, username });
      setMessage({ text: 'Username updated!', type: 'success' });
      setTimeout(() => setMessage({ text: '', type: '' }), 3000);
    } finally { setIsLoading(false); }
  };

  return (
    <Card>
      <CardHeader><CardTitle>Profile</CardTitle></CardHeader>
      <CardContent className="space-y-6">

        {/* ── Avatar ── */}
        <div className="flex items-center gap-5">
          <div className="relative shrink-0">
            <div className="w-20 h-20 rounded-2xl overflow-hidden border-2 border-[rgb(var(--color-border-rgb))] bg-[rgb(var(--color-card-muted-rgb))] shadow-md">
              {user.avatar
                ? <img src={user.avatar} alt="Profile" className="w-full h-full object-cover" />
                : <div className="w-full h-full flex items-center justify-center">
                    <UserIcon className="w-10 h-10 text-[rgb(var(--color-text-muted-rgb))]" />
                  </div>
              }
            </div>
            {/* Camera button — 44×44 touch target */}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="absolute -bottom-2 -right-2 w-8 h-8 bg-[rgb(var(--color-primary-rgb))] text-white rounded-xl shadow-lg flex items-center justify-center hover:brightness-110 active:scale-95 transition-all"
              aria-label="Change avatar"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>
            <input type="file" accept="image/*" ref={fileInputRef} onChange={handleAvatarUpload} className="hidden" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-[rgb(var(--color-text-rgb))] text-lg leading-tight truncate">{user.username}</p>
            <p className="text-xs text-[rgb(var(--color-text-muted-rgb))] mt-0.5">Tap camera to change photo</p>
          </div>
        </div>

        {/* ── Username form ── */}
        <form onSubmit={handleUpdateUsername} className="space-y-3">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-[rgb(var(--color-text-rgb))]">Username</label>
            <input
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              className="w-full px-4 py-3 bg-[rgb(var(--color-card-muted-rgb))] text-[rgb(var(--color-text-rgb))] border border-[rgb(var(--color-border-rgb))] rounded-xl focus:ring-2 focus:ring-[rgb(var(--color-primary-rgb))] outline-none text-base"
              autoComplete="username"
            />
          </div>
          {message.text && (
            <p className={`text-sm px-1 ${message.type === 'success' ? 'text-[rgb(var(--color-success-rgb))]' : 'text-[rgb(var(--color-error-rgb))]'}`}>
              {message.text}
            </p>
          )}
          <Button
            type="submit"
            disabled={isLoading || username === user.username}
            variant="primary"
            fullWidth
            isLoading={isLoading}
          >
            {isLoading ? 'Updating…' : 'Update Username'}
          </Button>
        </form>

      </CardContent>
    </Card>
  );
};


// ─── Security Section ─────────────────────────────────────────────────────────

const SecuritySection: React.FC<{
  user: User;
  onUpdateUser: (u: User) => void;
  onChangePassword: (oldPw: string, newPw: string) => Promise<boolean>;
}> = ({ user, onUpdateUser, onChangePassword }) => {
  const [passwords, setPasswords] = useState({ current: '', new: '', confirm: '' });
  const [msg, setMsg] = useState({ text: '', type: '' });
  const [loading, setLoading] = useState(false);
  const [isBiometricAvailable] = useState(isWebAuthnSupported());
  const [isRegistering, setIsRegistering] = useState(false);

  const pw = (k: keyof typeof passwords) => (v: string) => setPasswords(p => ({ ...p, [k]: v }));

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwords.new.length < 6) { setMsg({ text: 'New password must be at least 6 characters.', type: 'error' }); return; }
    if (passwords.new !== passwords.confirm) { setMsg({ text: 'Passwords do not match.', type: 'error' }); return; }
    setLoading(true);
    try {
      const ok = await onChangePassword(passwords.current, passwords.new);
      if (ok) { setMsg({ text: 'Password updated!', type: 'success' }); setPasswords({ current: '', new: '', confirm: '' }); }
      else { setMsg({ text: 'Incorrect current password.', type: 'error' }); }
    } finally { setLoading(false); }
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
      } catch (err) { console.error(err); }
      finally { setIsRegistering(false); }
    }
  };

  return (
    <Card>
      <CardHeader><CardTitle>Security</CardTitle></CardHeader>
      <CardContent className="space-y-6">

        <form onSubmit={handlePasswordChange} className="space-y-4">
          <PasswordField label="Current Password" value={passwords.current} onChange={pw('current')} />
          <PasswordField label="New Password"     value={passwords.new}     onChange={pw('new')} />
          <PasswordField label="Confirm Password" value={passwords.confirm} onChange={pw('confirm')} />
          {msg.text && (
            <p className={`text-sm px-1 ${msg.type === 'success' ? 'text-[rgb(var(--color-success-rgb))]' : 'text-[rgb(var(--color-error-rgb))]'}`}>
              {msg.text}
            </p>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-[rgb(var(--color-primary-rgb))] text-white rounded-xl hover:brightness-110 disabled:opacity-50 active:scale-[0.98] transition-all font-semibold text-base"
          >
            {loading ? 'Updating…' : 'Update Password'}
          </button>
        </form>

        {isBiometricAvailable && (
          <SettingsRow
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M12 11c0-1.1.9-2 2-2s2 .9 2 2v1m-4-1v1m-2 4h8m-9-4a4 4 0 018 0v1H7v-1z" />
              </svg>
            }
            label="Biometric Login"
            sublabel={isRegistering ? 'Registering…' : 'Touch ID / Face ID'}
            right={
              <ToggleButton
                checked={user.biometricEnabled}
                onChange={handleToggleBiometrics}
                disabled={isRegistering}
                size="md"
              />
            }
          />
        )}

      </CardContent>
    </Card>
  );
};


// ─── Smart Features Section ───────────────────────────────────────────────────

const SmartFeaturesSection: React.FC<{
  user: User;
  onUpdateUser: (u: User) => void;
  setActiveItem?: (item: string) => void;
}> = ({ user, onUpdateUser, setActiveItem }) => {
  const [apiKey, setApiKey] = useState(user.aiSettings?.apiKey || '');
  const [show, setShow] = useState(false);
  const [msg, setMsg] = useState('');

  const saveApiKey = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateUser({ ...user, aiSettings: { apiKey, model: 'gemini-2.0-flash' } });
    setMsg('API Key saved!');
    setTimeout(() => setMsg(''), 3000);
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader><CardTitle>AI Settings</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-[rgb(var(--color-text-muted-rgb))] leading-relaxed">
            Enter your Gemini API key to enable AI-powered financial insights and smart categorization.
          </p>
          <form onSubmit={saveApiKey} className="space-y-3">
            <div className="relative">
              <input
                type={show ? 'text' : 'password'}
                placeholder="Gemini API Key"
                value={apiKey}
                onChange={e => setApiKey(e.target.value)}
                className="w-full px-4 py-3 pr-12 bg-[rgb(var(--color-card-muted-rgb))] border border-[rgb(var(--color-border-rgb))] rounded-xl focus:ring-2 focus:ring-[rgb(var(--color-primary-rgb))] outline-none text-[rgb(var(--color-text-rgb))] text-base"
              />
              <button type="button" onClick={() => setShow(s => !s)}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-[rgb(var(--color-text-muted-rgb))]">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {show
                    ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M3 3l18 18" />
                    : <>
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </>
                  }
                </svg>
              </button>
            </div>
            {msg && <p className="text-sm text-[rgb(var(--color-success-rgb))] px-1">{msg}</p>}
            <button type="submit"
              className="w-full py-3 bg-[rgb(var(--color-primary-rgb))] text-white rounded-xl hover:brightness-110 active:scale-[0.98] transition-all font-semibold">
              Save API Key
            </button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Categorization</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <SettingsRow
            icon={<SparklesIcon className="w-5 h-5" />}
            label="Smart Suggestions"
            sublabel="Auto-suggest categories for transactions"
            right={
              <ToggleButton
                checked={user.smartFeatures?.categorySuggestions ?? true}
                onChange={() => onUpdateUser({
                  ...user,
                  smartFeatures: {
                    ...user.smartFeatures,
                    categorySuggestions: !(user.smartFeatures?.categorySuggestions ?? true),
                  },
                })}
                size="md"
              />
            }
          />
          <SettingsRow
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
              </svg>
            }
            label="Manage Categories"
            sublabel="Add, edit or remove categories"
            onClick={() => setActiveItem?.('Manage Categories')}
          />
        </CardContent>
      </Card>
    </div>
  );
};


// ─── Main SettingsPage ────────────────────────────────────────────────────────

const SettingsPage: React.FC<SettingsPageProps> = ({
  user, onUpdateUser, onSignOut, onOpenConfirmModal,
  onImportData, onExportData, setActiveItem,
  onOpenCropModal, isProcessingImage = false,
  processingType = 'transparent', setProcessingType,
  onChangePassword,
}) => {
  const [activeHubTab, setActiveHubTab] = useState<'account' | 'app'>('account');
  const [showNotificationSettings, setShowNotificationSettings] = useState(false);
  const { theme, setTheme, customBackground, setCustomBackground } = useTheme();
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleCropComplete = async (event: CustomEvent) => {
      const { croppedImageUrl, processingType: et } = event.detail;
      const colors = THEME_COLORS[theme] || THEME_COLORS['theme-light'];
      const tc = { isDark: !colors.isLight, primaryColor: colors.primary };
      const processed = et === 'transparent'
        ? await processImageForBackground(croppedImageUrl, tc)
        : await createPatternBackground(croppedImageUrl, tc);
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

  // ── Account Tab ──────────────────────────────────────────────────────────────
  const renderAccountTab = () => (
    <div className="space-y-4 animate-fade-in">
      <ProfileSection user={user} onUpdateUser={onUpdateUser} />
      <SecuritySection user={user} onUpdateUser={onUpdateUser} onChangePassword={onChangePassword} />
    </div>
  );

  // ── App Tab ──────────────────────────────────────────────────────────────────
  const renderAppTab = () => (
    <div className="space-y-4 animate-fade-in">

      {/* Appearance */}
      <Card>
        <CardHeader><CardTitle>Appearance</CardTitle></CardHeader>
        <CardContent className="space-y-6">
          {/* Theme selector + live preview stacked on mobile */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-[rgb(var(--color-text-rgb))]">Theme</label>
            <select
              value={theme}
              onChange={e => setTheme(e.target.value)}
              className="w-full p-3.5 bg-[rgb(var(--color-card-muted-rgb))] border border-[rgb(var(--color-border-rgb))] rounded-xl focus:ring-2 focus:ring-[rgb(var(--color-primary-rgb))] outline-none text-[rgb(var(--color-text-rgb))] text-base appearance-none"
              style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%236b7280'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center', backgroundSize: '18px' }}
            >
              {THEMES.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
            {/* Preview */}
            <div className="p-3 bg-[rgb(var(--color-card-muted-rgb))] rounded-xl border border-[rgb(var(--color-border-rgb))]">
              <p className="text-xs font-medium text-[rgb(var(--color-text-muted-rgb))] mb-2 text-center">Preview</p>
              <ThemePreview themeId={theme} />
            </div>
          </div>

          {/* Currency */}           <div className="pt-4 border-t border-[rgb(var(--color-border-rgb))] space-y-3">             <label className="text-sm font-medium text-[rgb(var(--color-text-rgb))]">Currency</label>             <select               value={user.currency || 'USD'}               onChange={e => onUpdateUser({ ...user, currency: e.target.value as any })}               className="w-full p-3.5 bg-[rgb(var(--color-card-muted-rgb))] border border-[rgb(var(--color-border-rgb))] rounded-xl focus:ring-2 focus:ring-[rgb(var(--color-primary-rgb))] outline-none text-[rgb(var(--color-text-rgb))] text-base appearance-none"               style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%236b7280'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center', backgroundSize: '18px' }}             >               {CURRENCIES.map(c => <option key={c.code} value={c.code}>{c.symbol} {c.name} ({c.code})</option>)}             </select>           </div>            {/* Card Background */}
          <div className="pt-4 border-t border-[rgb(var(--color-border-rgb))] space-y-3">
            <label className="text-sm font-medium text-[rgb(var(--color-text-rgb))]">Card Background</label>
            {customBackground ? (
              <div className="flex items-center gap-3 p-4 bg-[rgb(var(--color-card-muted-rgb))] rounded-2xl border border-[rgb(var(--color-border-rgb))]">
                <div className="w-14 h-14 rounded-xl border border-[rgb(var(--color-border-rgb))] overflow-hidden shrink-0">
                  <img src={customBackground} className="w-full h-full object-cover" alt="Background preview" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-[rgb(var(--color-text-rgb))]">Custom background active</p>
                  <p className="text-xs text-red-600">Tap remove to reset</p>
                </div>
                <button
                  onClick={() => setCustomBackground(null)}
                  className="px-3 py-2 text-sm font-semibold text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
                >
                  Remove
                </button>
              </div>
            ) : (
              <>
                {/* Processing type toggle */}
                <div className="flex gap-2">
                  {(['transparent', 'pattern'] as const).map(type => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setProcessingType?.(type)}
                      className={`flex-1 py-2.5 rounded-xl text-sm font-semibold capitalize transition-all ${
                        processingType === type
                          ? 'bg-[rgb(var(--color-primary-rgb))] text-white shadow-sm'
                          : 'bg-[rgb(var(--color-card-muted-rgb))] text-[rgb(var(--color-text-rgb))] border border-[rgb(var(--color-border-rgb))]'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full border-2 border-dashed border-[rgb(var(--color-border-rgb))] rounded-2xl py-8 flex flex-col items-center gap-2 hover:border-[rgb(var(--color-primary-rgb))] active:scale-[0.99] transition-all"
                >
                  <div className="w-12 h-12 rounded-xl bg-[rgb(var(--color-primary-rgb))]/10 flex items-center justify-center text-[rgb(var(--color-primary-rgb))]">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <p className="text-sm font-medium text-[rgb(var(--color-text-rgb))]">Upload custom background</p>
                  <p className="text-xs text-[rgb(var(--color-text-muted-rgb))]">{processingType === 'transparent' ? 'Transparent' : 'Pattern'} style • max 10 MB</p>
                </button>
                <input
                  type="file" accept="image/*" ref={fileInputRef} className="hidden"
                  onChange={e => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onload = () => onOpenCropModal?.(reader.result as string, processingType);
                      reader.readAsDataURL(file);
                    }
                  }}
                />
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Smart Features */}
      <SmartFeaturesSection user={user} onUpdateUser={onUpdateUser} setActiveItem={setActiveItem} />

      {/* Notifications */}
      <Card>
        <CardHeader><CardTitle>Notifications</CardTitle></CardHeader>
        <CardContent>
          <SettingsRow
            icon={<BellIcon className="w-5 h-5" />}
            label="Preferences & Alerts"
            sublabel="Budget alerts, reminders & more"
            onClick={() => setShowNotificationSettings(true)}
          />
        </CardContent>
      </Card>

      {/* Data & Privacy */}
      <Card>
        <CardHeader><CardTitle>Data & Privacy</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <SettingsRow
            icon={<BackupIcon className="w-5 h-5" />}
            iconBg="rgba(34,197,94,0.12)"
            label="Backup Data"
            sublabel="Export all data to a .json file"
            onClick={onExportData}
          />
          <SettingsRow
            icon={<RestoreIcon className="w-5 h-5" />}
            iconBg="rgba(59,130,246,0.12)"
            label="Restore Backup"
            sublabel="Import data from a .json file"
            onClick={() => {
              const input = document.createElement('input');
              input.type = 'file'; input.accept = '.json';
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
          />
        </CardContent>
      </Card>

      {/* App Info */}
      <Card>
        <CardHeader><CardTitle>App Information</CardTitle></CardHeader>
        <CardContent><ServiceWorkerDebugPanel /></CardContent>
      </Card>

      {/* Sign Out — thumb-zone friendly, full width, generous padding */}
      <button
        onClick={() => onOpenConfirmModal('Sign Out', 'Are you sure you want to sign out?', onSignOut, { variant: 'danger' })}
        className="w-full py-4 rounded-2xl font-bold text-base bg-red-600 text-white hover:bg-red-700 active:scale-[0.98] transition-all focus:outline-none focus:ring-2 focus:ring-red-700"
      >
        Sign Out
      </button>

    </div>
  );

  return (
    <div className="min-h-screen pb-24">

      {/* ── Sticky header + tab bar ── */}
      <div className="sticky top-0 z-20 bg-[rgb(var(--color-bg-rgb))]/90 backdrop-blur-md border-b border-[rgb(var(--color-border-rgb))] safe-top">
        {/* Page title row */}
        <div className="flex items-center gap-3 px-4 pt-4 pb-3">
          <div className="p-2 bg-[rgb(var(--color-primary-rgb))]/10 rounded-xl shrink-0">
            <SettingsIcon className="w-5 h-5 text-[rgb(var(--color-primary-rgb))]" />
          </div>
          <h1 className="text-xl font-bold text-[rgb(var(--color-text-rgb))]">Settings</h1>
        </div>

        {/* Segmented tab control */}
        <div className="px-4 pb-3">
          <div className="flex p-1 bg-[rgb(var(--color-card-muted-rgb))] rounded-xl">
            {([
              { id: 'account', label: 'My Account' },
              { id: 'app',     label: 'App Settings' },
            ] as const).map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveHubTab(tab.id)}
                className={`flex-1 py-2.5 rounded-lg font-semibold text-sm transition-all ${
                  activeHubTab === tab.id
                    ? 'bg-[rgb(var(--color-card-rgb))] text-[rgb(var(--color-primary-rgb))] shadow-sm'
                    : 'text-[rgb(var(--color-text-muted-rgb))]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Content ── */}
      <div className="max-w-xl mx-auto px-4 pt-5 space-y-4 bg-[rgb(var(--color-card-rgb))] rounded-2xl border border-[rgb(var(--color-border-rgb))]">
        {activeHubTab === 'account' ? renderAccountTab() : renderAppTab()}

        <footer className="text-center text-[rgb(var(--color-text-muted-rgb))] text-xs pt-4 pb-2 border-t border-[rgb(var(--color-border-rgb))]">
          FinTrack v2.1.0
        </footer>
      </div>

    </div>
  );
};


export default SettingsPage;
