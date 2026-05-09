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
                checked={user.biometricEnabled ?? false}
                onChange={handleToggleBiometrics}
                disabled={isRegistering}
              />
            }
          />
        )}

      </CardContent>
    </Card>
  );
};


// ─── Main SettingsPage ────────────────────────────────────────────────────────

const SettingsPage: React.FC<SettingsPageProps> = ({
  user,
  onUpdateUser,
  onSignOut,
  onOpenConfirmModal,
  onImportData,
  setActiveItem,
  onOpenCropModal,
  isProcessingImage,
  processingType,
  setProcessingType,
  onExportData,
  onChangePassword,
}) => {
  const { theme, setTheme } = useTheme();
  const [activeTab, setActiveTab] = useState<'account' | 'appearance' | 'data' | 'notifications' | 'advanced'>('account');
  const [showDebugPanel, setShowDebugPanel] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const backgroundInputRef = useRef<HTMLInputElement>(null);

  // ── Background image handling ──
  const handleBackgroundUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 20 * 1024 * 1024) {
      alert('File size must be less than 20 MB.');
      return;
    }
    const reader = new FileReader();
    reader.onloadend = async () => {
      const dataUrl = reader.result as string;
      if (onOpenCropModal) {
        onOpenCropModal(dataUrl, processingType || 'transparent');
      }
    };
    reader.readAsDataURL(file);
  };

  // Listen for crop completion from App.tsx
  useEffect(() => {
    const handleCropComplete = async (event: CustomEvent) => {
      const { croppedImageUrl, processingType: type } = event.detail;
      try {
        let processedImage: string;
        if (type === 'pattern') {
          processedImage = await createPatternBackground(croppedImageUrl);
        } else {
          processedImage = await processImageForBackground(croppedImageUrl);
        }
        onUpdateUser({ ...user, backgroundImage: processedImage });
      } catch (error) {
        console.error('Error processing image:', error);
        alert('Failed to process image. Please try again.');
      }
    };

    window.addEventListener('cropComplete', handleCropComplete as EventListener);
    return () => window.removeEventListener('cropComplete', handleCropComplete as EventListener);
  }, [user, onUpdateUser]);

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      try {
        const data = JSON.parse(reader.result as string);
        onOpenConfirmModal(
          'Import Data',
          'This will merge imported data with your existing data. Continue?',
          () => onImportData(data),
          { confirmText: 'Import', variant: 'primary' }
        );
      } catch {
        alert('Invalid backup file.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // ── Tab content renderers ──

  const renderAccountTab = () => (
    <div className="space-y-4 animate-fade-in">
      <ProfileSection user={user} onUpdateUser={onUpdateUser} />
      <SecuritySection user={user} onUpdateUser={onUpdateUser} onChangePassword={onChangePassword} />

      {/* ── Manage Financial Accounts quick-link ── */}
      <Card>
        <CardHeader><CardTitle>Financial Accounts</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-[rgb(var(--color-text-muted-rgb))] leading-relaxed">
            View and manage your bank accounts, credit cards, wallets, and track your net worth.
          </p>
          <SettingsRow
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
            }
            iconBg="rgba(var(--color-primary-rgb), 0.12)"
            label="Manage Accounts"
            sublabel={`${(user.financialAccounts ?? []).filter(a => !a.isArchived).length} active account(s)`}
            onClick={() => setActiveItem?.('Accounts')}
          />
        </CardContent>
      </Card>
    </div>
  );

  const renderAppearanceTab = () => (
    <div className="space-y-4 animate-fade-in">
      <Card>
        <CardHeader><CardTitle>Theme</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            {THEMES.map(t => (
              <button
                key={t.id}
                onClick={() => setTheme(t.id)}
                className={`relative rounded-2xl overflow-hidden border-2 transition-all active:scale-[0.97] ${
                  theme === t.id
                    ? 'border-[rgb(var(--color-primary-rgb))] shadow-md'
                    : 'border-transparent hover:border-[rgb(var(--color-border-rgb))]'
                }`}
              >
                <ThemePreview themeId={t.id} />
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2">
                  <p className="text-white text-xs font-medium text-center">{t.name}</p>
                </div>
                {theme === t.id && (
                  <div className="absolute top-2 right-2 w-5 h-5 bg-[rgb(var(--color-primary-rgb))] rounded-full flex items-center justify-center shadow">
                    <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                )}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Background Image */}
      <Card>
        <CardHeader><CardTitle>Background Image</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {user.backgroundImage && (
            <div className="relative w-full h-32 rounded-xl overflow-hidden border border-[rgb(var(--color-border-rgb))]">
              <img src={user.backgroundImage} alt="Background" className="w-full h-full object-cover" />
              <button
                onClick={() => onUpdateUser({ ...user, backgroundImage: undefined })}
                className="absolute top-2 right-2 w-8 h-8 bg-black/50 text-white rounded-lg flex items-center justify-center hover:bg-black/70 transition-colors"
                aria-label="Remove background"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          )}

          {/* Processing type selector */}
          <div className="flex gap-2">
            {(['transparent', 'pattern'] as const).map(type => (
              <button
                key={type}
                onClick={() => setProcessingType?.(type)}
                className={`flex-1 py-2 px-3 rounded-xl text-sm font-medium border transition-all ${
                  processingType === type
                    ? 'border-[rgb(var(--color-primary-rgb))] bg-[rgba(var(--color-primary-rgb),0.1)] text-[rgb(var(--color-primary-rgb))]'
                    : 'border-[rgb(var(--color-border-rgb))] text-[rgb(var(--color-text-muted-rgb))]'
                }`}
              >
                {type === 'transparent' ? '🎨 Transparent' : '🔲 Pattern'}
              </button>
            ))}
          </div>

          <button
            onClick={() => backgroundInputRef.current?.click()}
            disabled={isProcessingImage}
            className="w-full py-3 rounded-xl border-2 border-dashed border-[rgb(var(--color-border-rgb))] text-[rgb(var(--color-text-muted-rgb))] hover:border-[rgb(var(--color-primary-rgb))] hover:text-[rgb(var(--color-primary-rgb))] transition-all text-sm font-medium disabled:opacity-50"
          >
            {isProcessingImage ? '⏳ Processing…' : '📁 Upload Background Image'}
          </button>
          <input type="file" accept="image/*" ref={backgroundInputRef} onChange={handleBackgroundUpload} className="hidden" />
          <p className="text-xs text-[rgb(var(--color-text-muted-rgb))] text-center">
            Max 20 MB · PNG, JPG, WebP
          </p>
        </CardContent>
      </Card>

      {/* Currency */}
      <Card>
        <CardHeader><CardTitle>Currency</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-2">
            {CURRENCIES.map(c => (
              <button
                key={c.code}
                onClick={() => onUpdateUser({ ...user, currency: c.code })}
                className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border-2 text-left transition-all active:scale-[0.97] ${
                  user.currency === c.code
                    ? 'border-[rgb(var(--color-primary-rgb))] bg-[rgba(var(--color-primary-rgb),0.08)]'
                    : 'border-[rgb(var(--color-border-rgb))] hover:border-[rgb(var(--color-primary-rgb))]/50'
                }`}
              >
                <span className="text-lg">{c.symbol}</span>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-[rgb(var(--color-text-rgb))] leading-tight">{c.code}</p>
                  <p className="text-xs text-[rgb(var(--color-text-muted-rgb))] leading-tight truncate">{c.name}</p>
                </div>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderDataTab = () => (
    <div className="space-y-4 animate-fade-in">
      <Card>
        <CardHeader><CardTitle>Backup & Restore</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <SettingsRow
            icon={<BackupIcon className="w-5 h-5" />}
            iconBg="rgba(var(--color-success-rgb), 0.12)"
            label="Export Data"
            sublabel="Download a full backup as JSON"
            onClick={onExportData}
          />
          <SettingsRow
            icon={<RestoreIcon className="w-5 h-5" />}
            iconBg="rgba(var(--color-primary-rgb), 0.12)"
            label="Import Data"
            sublabel="Restore from a backup file"
            onClick={() => fileInputRef.current?.click()}
          />
          <input type="file" accept=".json" ref={fileInputRef} onChange={handleImport} className="hidden" />
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Danger Zone</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <SettingsRow
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            }
            iconBg="rgba(var(--color-error-rgb), 0.12)"
            label="Sign Out"
            sublabel="You will need to sign in again"
            onClick={() => onOpenConfirmModal('Sign Out', 'Are you sure you want to sign out?', onSignOut, { confirmText: 'Sign Out', variant: 'danger' })}
          />
        </CardContent>
      </Card>
    </div>
  );

  const renderNotificationsTab = () => (
    <div className="animate-fade-in">
      <NotificationSettingsPage user={user} onUpdateUser={onUpdateUser} />
    </div>
  );

  const renderAdvancedTab = () => (
    <div className="space-y-4 animate-fade-in">
      <Card>
        <CardHeader><CardTitle>Advanced</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <SettingsRow
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            }
            label="Service Worker Debug"
            sublabel="Developer tools for PWA debugging"
            onClick={() => setShowDebugPanel(v => !v)}
            right={
              <svg className={`w-4 h-4 text-[rgb(var(--color-text-muted-rgb))] transition-transform ${showDebugPanel ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            }
          />
          {showDebugPanel && (
            <div className="mt-2">
              <ServiceWorkerDebugPanel />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );

  // ── Tab bar ──
  const tabs = [
    { key: 'account',       label: 'Account',       icon: <UserIcon className="w-4 h-4" /> },
    { key: 'appearance',    label: 'Appearance',    icon: <SparklesIcon className="w-4 h-4" /> },
    { key: 'notifications', label: 'Alerts',        icon: <BellIcon className="w-4 h-4" /> },
    { key: 'data',          label: 'Data',          icon: <BackupIcon className="w-4 h-4" /> },
    { key: 'advanced',      label: 'Advanced',      icon: <SettingsIcon className="w-4 h-4" /> },
  ] as const;

  return (
    <div className="max-w-2xl mx-auto pb-8">
      {/* Tab Bar */}
      <div className="flex gap-1 p-1 bg-[rgb(var(--color-card-muted-rgb))] rounded-2xl mb-6 overflow-x-auto scrollbar-hide">
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all flex-shrink-0 ${
              activeTab === tab.key
                ? 'bg-[rgb(var(--color-card-rgb))] text-[rgb(var(--color-text-rgb))] shadow-sm'
                : 'text-[rgb(var(--color-text-muted-rgb))] hover:text-[rgb(var(--color-text-rgb))]'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'account'       && renderAccountTab()}
      {activeTab === 'appearance'    && renderAppearanceTab()}
      {activeTab === 'notifications' && renderNotificationsTab()}
      {activeTab === 'data'          && renderDataTab()}
      {activeTab === 'advanced'      && renderAdvancedTab()}
    </div>
  );
};

export default SettingsPage;
