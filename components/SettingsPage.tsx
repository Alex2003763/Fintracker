import React, { useState, useEffect, useRef, Suspense, lazy } from 'react';
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

// Lazy load ManageCategoriesPage
const ManageCategoriesPage = lazy(() => import('./ManageCategoriesPage'));


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
  onDeleteAccount?: () => void;
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
      className="w-full aspect-video rounded-lg shadow-md overflow-hidden flex flex-col relative border border-black/5"
      style={{ backgroundColor: colors.bg }}
    >
      {/* Mock status bar */}
      <div
        className="h-5 flex items-center px-2 gap-1 shrink-0"
        style={{ backgroundColor: colors.card, borderBottom: '1px solid rgba(0,0,0,0.06)' }}
      >
        <div className="flex gap-1">
          <div className="w-1.5 h-1.5 rounded-full bg-red-400" />
          <div className="w-1.5 h-1.5 rounded-full bg-yellow-400" />
          <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
        </div>
      </div>

      {/* Mock content */}
      <div className="flex-1 p-2 space-y-1.5">
        <div className="w-3/4 h-3 rounded-md opacity-60" style={{ backgroundColor: colors.primary }} />
        <div className="w-full h-5 rounded-md" style={{ backgroundColor: colors.card }} />
        <div className="flex gap-1.5">
          <div className="flex-1 h-4 rounded-md" style={{ backgroundColor: colors.card, opacity: 0.6 }} />
          <div className="flex-1 h-4 rounded-md" style={{ backgroundColor: colors.card, opacity: 0.6 }} />
        </div>
        <div className="flex gap-1.5 pt-1">
          <div className="w-1/2 h-6 rounded-lg" style={{ backgroundColor: colors.primary, opacity: 0.8 }} />
          <div className="flex-1 h-6 rounded-lg" style={{ backgroundColor: colors.card }} />
        </div>
      </div>

      {/* Theme-specific subtle overlay */}
      {themeId === 'theme-pixel' && (
        <div
          className="absolute inset-0 pointer-events-none rounded-lg"
          style={{
            backgroundImage: 'linear-gradient(rgba(0,255,136,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(0,255,136,0.04) 1px, transparent 1px)',
            backgroundSize: '6px 6px',
            mixBlendMode: 'overlay'
          }}
        />
      )}
      {themeId === 'theme-cyberpunk' && (
        <div
          className="absolute inset-0 pointer-events-none rounded-lg"
          style={{
            background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,245,255,0.03) 3px)'
          }}
        />
      )}

      {/* Selection ring */}
      <div
        className="absolute inset-0 rounded-lg pointer-events-none transition-all"
        style={{ boxShadow: `inset 0 0 0 2px ${colors.primary}40` }}
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
  danger?: boolean;
}> = ({ icon, iconBg, label, sublabel, right, onClick, hoverColor = 'rgb(var(--color-primary-rgb))', danger }) => {
  const Wrapper = onClick ? 'button' : 'div';
  const finalHoverColor = danger ? 'rgb(var(--color-error-rgb))' : hoverColor;
  const [isHover, setIsHover] = useState(false);

  return (
    <Wrapper
      {...(onClick ? { type: 'button', onClick } : {})}
      className="w-full flex items-center gap-4 p-4 rounded-2xl border transition-all text-left min-h-[60px]"
      style={{ 
        cursor: onClick ? 'pointer' : 'default',
        borderColor: isHover ? finalHoverColor : 'rgb(var(--color-border-rgb))',
        backgroundColor: danger ? 'rgba(var(--color-error-rgb), 0.04)' : 'rgb(var(--color-card-muted-rgb))',
      } as React.CSSProperties}
      onMouseEnter={() => setIsHover(true)}
      onMouseLeave={() => setIsHover(false)}
    >
      <div
        className="shrink-0 w-10 h-10 rounded-xl flex items-center justify-center transition-colors"
        style={{ 
          backgroundColor: iconBg || (danger ? 'rgba(var(--color-error-rgb), 0.15)' : `rgba(var(--color-primary-rgb), 0.12)`), 
          color: isHover ? finalHoverColor : (danger ? 'rgb(var(--color-error-rgb))' : `rgb(var(--color-primary-rgb))`) 
        }}
      >
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm leading-snug" style={{ color: isHover ? finalHoverColor : (danger ? 'rgb(var(--color-error-rgb))' : 'rgb(var(--color-text-rgb))') }}>{label}</p>
        {sublabel && <p className="text-xs text-[rgb(var(--color-text-muted-rgb))] mt-0.5 leading-snug">{sublabel}</p>}
      </div>
      {right ?? (
        onClick && (
          <svg className="w-4 h-4 shrink-0 transition-colors" 
               style={{ color: isHover ? finalHoverColor : 'rgb(var(--color-text-muted-rgb))' }} 
               fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        )
      )}
    </Wrapper>
  );
};
SettingsRow.displayName = 'SettingsRow';


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
  onDeleteAccount,
}) => {
  const { theme, setTheme, customBackground, setCustomBackground } = useTheme();
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
       e.target.value = '';
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
        setCustomBackground(processedImage);
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

      {/* ── Sign Out ── */}
      <Card>
        <CardHeader><CardTitle>Session</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <SettingsRow
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            }
            iconBg="rgba(var(--color-text-muted-rgb), 0.12)"
            label="Sign Out"
            sublabel="You will need to sign in again"
            onClick={() => onOpenConfirmModal('Sign Out', 'Are you sure you want to sign out?', onSignOut, { confirmText: 'Sign Out', variant: 'danger' })}
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
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-[rgb(var(--color-text-rgb))]">Select Theme</label>
            <select
              value={theme}
              onChange={(e) => setTheme(e.target.value)}
              className="w-full px-4 py-3 bg-[rgb(var(--color-card-muted-rgb))] text-[rgb(var(--color-text-rgb))] border border-[rgb(var(--color-border-rgb))] rounded-xl focus:ring-2 focus:ring-[rgb(var(--color-primary-rgb))] outline-none appearance-none cursor-pointer"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                backgroundPosition: 'right 1rem center',
                backgroundRepeat: 'no-repeat',
                backgroundSize: '1.5em 1.5em',
                paddingRight: '2.5rem'
              }}
            >
              {THEMES.map(t => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>

          {/* Live preview */}
          <div className="mt-3">
            <ThemePreview themeId={theme} />
          </div>
        </CardContent>
      </Card>

      {/* Background Image */}
      <Card>
        <CardHeader><CardTitle>Card Background</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {customBackground ? (
            <div className="relative w-full h-32 rounded-xl overflow-hidden border border-[rgb(var(--color-border-rgb))]">
              <div
                className="w-full h-full rounded-xl"
                style={{
                  backgroundImage: `url('${customBackground}')`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center'
                }}
              />
              <button
                onClick={() => setCustomBackground(null)}
                className="absolute top-2 right-2 w-8 h-8 bg-black/50 text-white rounded-lg flex items-center justify-center hover:bg-black/70 transition-colors"
                aria-label="Remove background"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => backgroundInputRef.current?.click()}
              className="w-full p-6 border-2 border-dashed border-[rgb(var(--color-border-rgb))] rounded-xl flex flex-col items-center gap-2 text-[rgb(var(--color-text-muted-rgb))] hover:border-[rgb(var(--color-primary-rgb))] hover:text-[rgb(var(--color-primary-rgb))] transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span className="text-sm font-medium">Upload Background</span>
            </button>
          )}
          <input
            type="file"
            accept="image/*"
            ref={backgroundInputRef}
            onChange={handleBackgroundUpload}
            className="hidden"
          />
        </CardContent>
      </Card>

      {/* Currency */}
      <Card>
        <CardHeader><CardTitle>Currency</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-[rgb(var(--color-text-rgb))]">Select Currency</label>
            <select
              value={user.currency || 'USD'}
              onChange={(e) => onUpdateUser({ ...user, currency: e.target.value as any })}
              className="w-full px-4 py-3 bg-[rgb(var(--color-card-muted-rgb))] text-[rgb(var(--color-text-rgb))] border border-[rgb(var(--color-border-rgb))] rounded-xl focus:ring-2 focus:ring-[rgb(var(--color-primary-rgb))] outline-none appearance-none cursor-pointer"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                backgroundPosition: 'right 1rem center',
                backgroundRepeat: 'no-repeat',
                backgroundSize: '1.5em 1.5em',
                paddingRight: '2.5rem'
              }}
            >
              {CURRENCIES.map(c => (
                <option key={c.code} value={c.code}>
                  {c.symbol} {c.code} - {c.name}
                </option>
              ))}
            </select>
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
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            }
            iconBg="rgba(var(--color-error-rgb), 0.15)"
            label="Delete Account"
            sublabel="Permanently erase all your data"
            hoverColor="rgb(var(--color-error-rgb))"
            onClick={() => onOpenConfirmModal('Delete Account', 'Are you sure you want to delete your account? This will permanently erase all your data including transactions and balances. This action is irreversible!', () => {
                if (onDeleteAccount) onDeleteAccount();
            }, { confirmText: 'Delete Everything', variant: 'danger' })}
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

   const renderCategoriesTab = () => (
     <div className="animate-fade-in">
       <Suspense fallback={
         <div className="flex items-center justify-center p-12">
           <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[rgb(var(--color-primary-rgb))]"></div>
         </div>
       }>
         <ManageCategoriesPage
           user={user}
           onUpdateCategories={(categories) => onUpdateUser({ ...user, customCategories: categories })}
           setActiveItem={setActiveItem}
         />
       </Suspense>
     </div>
   );

   const renderAdvancedTab = () => (
    <div className="space-y-4 animate-fade-in">
      <Card>
        <CardHeader><CardTitle>AI Features</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-[rgb(var(--color-text-rgb))]">Gemini API Key</label>
            <input
              type="password"
              placeholder="AI API Key (e.g. AIzaSy...)"
              value={user.aiSettings?.apiKey || ''}
              onChange={(e) => onUpdateUser({
                ...user,
                aiSettings: {
                  ...(user.aiSettings || { model: 'gemini-1.5-flash' }),
                  apiKey: e.target.value
                }
              })}
              className="w-full px-4 py-3 bg-[rgb(var(--color-card-muted-rgb))] text-[rgb(var(--color-text-rgb))] border border-[rgb(var(--color-border-rgb))] rounded-xl focus:ring-2 focus:ring-[rgb(var(--color-primary-rgb))] outline-none text-base"
            />
            <p className="text-xs text-[rgb(var(--color-text-muted-rgb))] mt-1">Used for receipt scanning and intelligent transactions.</p>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader><CardTitle>Developer</CardTitle></CardHeader>
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
     { key: 'categories',    label: 'Categories',    icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" /></svg> },
     { key: 'appearance',    label: 'Appearance',    icon: <SparklesIcon className="w-4 h-4" /> },
     { key: 'notifications', label: 'Alerts',        icon: <BellIcon className="w-4 h-4" /> },
     { key: 'data',          label: 'Data',          icon: <BackupIcon className="w-4 h-4" /> },
     { key: 'advanced',      label: 'Advanced',      icon: <SettingsIcon className="w-4 h-4" /> },
   ] as const;

   return (
     <div className="max-w-2xl mx-auto pb-8">
       {/* Tab Bar */}
       <div className="flex gap-1.5 p-1 bg-[rgb(var(--color-card-muted-rgb))]/50 rounded-2xl mb-8 overflow-x-auto scrollbar-hide backdrop-blur-sm">
         {tabs.map(tab => (
           <button
             key={tab.key}
             onClick={() => setActiveTab(tab.key)}
             className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all flex-shrink-0 min-w-[5rem] justify-center ${
               activeTab === tab.key
                 ? 'bg-[rgb(var(--color-card-rgb))] text-[rgb(var(--color-text-rgb))] shadow-sm ring-1 ring-[rgb(var(--color-border-rgb))]'
                 : 'text-[rgb(var(--color-text-muted-rgb))] hover:text-[rgb(var(--color-text-rgb))] hover:bg-[rgb(var(--color-card-rgb))]/50'
             }`}
           >
             {React.cloneElement(tab.icon, { className: 'w-4 h-4' })}
             <span className="hidden sm:inline">{tab.label}</span>
           </button>
         ))}
       </div>

        {/* Tab Content */}
        {activeTab === 'account'       && renderAccountTab()}
        {activeTab === 'categories'    && renderCategoriesTab()}
        {activeTab === 'appearance'    && renderAppearanceTab()}
        {activeTab === 'notifications' && renderNotificationsTab()}
        {activeTab === 'data'          && renderDataTab()}
        {activeTab === 'advanced'      && renderAdvancedTab()}
     </div>
   );
};

export default SettingsPage;
