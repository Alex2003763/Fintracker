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

// ─── Injected CSS ─────────────────────────────────────────────────────────────
const SP_CSS = `
  @keyframes sp-fade-up {
    from { opacity: 0; transform: translateY(12px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes sp-pop {
    from { opacity: 0; transform: scale(0.94); }
    to   { opacity: 1; transform: scale(1); }
  }
  .sp-fade-up { animation: sp-fade-up 0.28s cubic-bezier(0.4,0,0.2,1) both; }
  .sp-pop     { animation: sp-pop     0.22s cubic-bezier(0.34,1.2,0.64,1) both; }

  /* Glass card */
  .sp-glass {
    background: rgba(var(--color-card-muted-rgb), 0.55);
    border: 1px solid rgba(255,255,255,0.08);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    box-shadow: 0 2px 20px rgba(0,0,0,0.07), inset 0 1px 0 rgba(255,255,255,0.06);
    border-radius: 20px;
  }

  /* Input — strong defaults so text is always visible */
  .sp-input {
    width: 100%;
    padding: 11px 16px;
    background: rgba(30, 35, 50, 0.7);
    border: 1.5px solid rgba(120, 140, 180, 0.45);
    border-radius: 14px;
    font-size: 13px;
    color: #e8eaf0;
    outline: none;
    transition: border-color 0.18s, box-shadow 0.18s;
    /* override any theme variable that resolves to transparent */
    -webkit-text-fill-color: #e8eaf0;
  }
  /* theme-aware override for light themes */
  :root[class*="light"] .sp-input,
  .theme-light .sp-input {
    background: rgba(255,255,255,0.85);
    border-color: rgba(80, 100, 140, 0.35);
    color: #1a1d2e;
    -webkit-text-fill-color: #1a1d2e;
  }
  .sp-input:focus {
    border-color: rgba(var(--color-primary-rgb, 99, 140, 255), 0.65);
    box-shadow: 0 0 0 3px rgba(var(--color-primary-rgb, 99, 140, 255), 0.13);
  }
  .sp-input::placeholder {
    color: rgba(160, 170, 200, 0.55);
    -webkit-text-fill-color: rgba(160, 170, 200, 0.55);
  }

  /* Select */
  .sp-select {
    appearance: none;
    -webkit-appearance: none;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='rgba(160,160,160,0.7)' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E");
    background-repeat: no-repeat;
    background-position: right 14px center;
    padding-right: 36px !important;
    cursor: pointer;
  }

  /* Tab pill */
  .sp-tab-active {
    background: rgba(var(--color-primary-rgb), 0.14);
    color: rgb(var(--color-primary-rgb));
    box-shadow: 0 0 0 1px rgba(var(--color-primary-rgb), 0.22);
  }
  .sp-tab-inactive {
    color: rgb(var(--color-text-muted-rgb));
  }
  .sp-tab-inactive:hover {
    background: rgba(var(--color-card-muted-rgb), 0.8);
    color: rgb(var(--color-text-rgb));
  }

  /* Settings row */
  .sp-row {
    display: flex;
    align-items: center;
    gap: 14px;
    padding: 13px 16px;
    border-radius: 16px;
    transition: background 0.16s;
    width: 100%;
    text-align: left;
  }
  .sp-row:hover { background: rgba(var(--color-card-muted-rgb), 0.7); }
  .sp-row-danger:hover { background: rgba(var(--color-error-rgb), 0.07); }

  /* Divider between rows */
  .sp-rows > .sp-row-wrap:not(:last-child) {
    border-bottom: 1px solid rgba(var(--color-border-rgb), 0.35);
  }

  /* Avatar gradient ring */
  .sp-avatar-ring {
    background: linear-gradient(135deg, rgb(var(--color-primary-rgb)), rgba(var(--color-primary-rgb),0.4));
    padding: 2.5px;
    border-radius: 50%;
  }

  /* Section label */
  .sp-section-label {
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: rgba(var(--color-text-muted-rgb), 0.55);
    padding: 0 4px;
    margin-bottom: 6px;
  }

  /* Submit button */
  .sp-btn-primary {
    width: 100%;
    padding: 11px 20px;
    background: rgb(var(--color-primary-rgb));
    color: white;
    border-radius: 14px;
    font-size: 13px;
    font-weight: 600;
    transition: filter 0.15s, transform 0.12s;
    touch-action: manipulation;
  }
  .sp-btn-primary:hover:not(:disabled) { filter: brightness(1.1); }
  .sp-btn-primary:active:not(:disabled) { transform: scale(0.98); }
  .sp-btn-primary:disabled { opacity: 0.45; }

  /* Danger button */
  .sp-btn-danger {
    width: 100%;
    padding: 11px 20px;
    background: rgba(var(--color-error-rgb), 0.12);
    color: rgb(var(--color-error-rgb));
    border: 1px solid rgba(var(--color-error-rgb), 0.2);
    border-radius: 14px;
    font-size: 13px;
    font-weight: 600;
    transition: all 0.15s;
    touch-action: manipulation;
  }
  .sp-btn-danger:hover { background: rgba(var(--color-error-rgb), 0.18); }

  /* Tag badge */
  .sp-badge {
    display: inline-flex;
    align-items: center;
    padding: 2px 8px;
    border-radius: 999px;
    font-size: 10px;
    font-weight: 600;
    background: rgba(var(--color-primary-rgb), 0.12);
    color: rgb(var(--color-primary-rgb));
  }

  /* Theme grid */
  .sp-theme-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
    gap: 10px;
  }
  .sp-theme-card {
    border-radius: 14px;
    overflow: hidden;
    cursor: pointer;
    border: 2px solid transparent;
    transition: border-color 0.15s, transform 0.12s, box-shadow 0.15s;
  }
  .sp-theme-card:hover { transform: scale(1.03); }
  .sp-theme-card.selected {
    border-color: rgb(var(--color-primary-rgb));
    box-shadow: 0 0 0 3px rgba(var(--color-primary-rgb), 0.2);
  }
`;

let spCssInjected = false;
const injectSPCSS = () => {
  if (spCssInjected || typeof document === 'undefined') return;
  const el = document.createElement('style');
  el.id = 'sp-settings-css';
  el.textContent = SP_CSS;
  document.head.appendChild(el);
  spCssInjected = true;
};

// ─── Theme Preview ─────────────────────────────────────────────────────────────
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
  'theme-cyberpunk':      { bg: '#0d0d1a', card: '#12121f',  primary: '#f5e642', isLight: false },
};

const ThemePreview: React.FC<{ themeId: string; selected: boolean; onClick: () => void; name: string }> = ({ themeId, selected, onClick, name }) => {
  const c = THEME_COLORS[themeId] || THEME_COLORS['theme-light'];
  return (
    <button
      type="button"
      onClick={onClick}
      className={`sp-theme-card ${selected ? 'selected' : ''}`}
      aria-pressed={selected}
    >
      <div className="w-full" style={{ aspectRatio: '4/3', backgroundColor: c.bg, position: 'relative' }}>
        {/* mock header */}
        <div style={{ height: 18, backgroundColor: c.card, borderBottom: '1px solid rgba(0,0,0,0.06)', display:'flex', alignItems:'center', padding:'0 6px', gap: 3 }}>
          <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#f87171' }} />
          <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#fbbf24' }} />
          <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#4ade80' }} />
        </div>
        {/* mock content */}
        <div style={{ padding: '5px 6px', display:'flex', flexDirection:'column', gap: 4 }}>
          <div style={{ width: '60%', height: 7, borderRadius: 4, background: c.primary, opacity: 0.8 }} />
          <div style={{ width: '100%', height: 14, borderRadius: 5, background: c.card }} />
          <div style={{ display:'flex', gap: 4 }}>
            <div style={{ flex: 1, height: 10, borderRadius: 4, background: c.card, opacity: 0.6 }} />
            <div style={{ flex: 1, height: 10, borderRadius: 4, background: c.primary, opacity: 0.5 }} />
          </div>
        </div>
        {selected && (
          <div style={{ position:'absolute', top: 4, right: 4, width: 16, height: 16, borderRadius: '50%', background: c.primary, display:'flex', alignItems:'center', justifyContent:'center' }}>
            <svg width="9" height="9" viewBox="0 0 10 8" fill="none">
              <path d="M1 4l2.5 2.5L9 1" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        )}
      </div>
      <div style={{ backgroundColor: c.card, padding: '5px 8px' }}>
        <p style={{ fontSize: 10, fontWeight: 600, color: c.isLight ? '#374151' : '#d1d5db', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{name}</p>
      </div>
    </button>
  );
};

// ─── Password Field ───────────────────────────────────────────────────────────
const PasswordField: React.FC<{ label: string; value: string; onChange: (v: string) => void }> = ({ label, value, onChange }) => {
  const [show, setShow] = useState(false);
  return (
    <div className="space-y-1.5">
      <label
        className="text-[11px] font-semibold uppercase tracking-widest block"
        style={{ color: 'rgba(160, 175, 210, 0.85)' }}
      >
        {label}
      </label>
      <div className="relative">
        <input
          type={show ? 'text' : 'password'}
          value={value}
          onChange={e => onChange(e.target.value)}
          className="sp-input pr-11"
          style={{
            /* Hard-coded fallbacks so the field is ALWAYS legible */
            color: '#e8eaf0',
            WebkitTextFillColor: '#e8eaf0',
            background: 'rgba(20, 25, 45, 0.75)',
            border: '1.5px solid rgba(100, 130, 200, 0.45)',
          }}
        />
        <button
          type="button"
          onClick={() => setShow(s => !s)}
          className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 transition-colors"
          style={{ color: 'rgba(160, 175, 210, 0.75)' }}
          aria-label={show ? 'Hide' : 'Show'}
        >
          {show ? (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 4.411m0 0L21 21" />
            </svg>
          ) : (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          )}
        </button>
      </div>
    </div>
  );
};

// ─── Settings Row ─────────────────────────────────────────────────────────────
const SettingsRow: React.FC<{
  icon: React.ReactNode;
  iconBg?: string;
  iconColor?: string;
  label: string;
  sublabel?: string;
  right?: React.ReactNode;
  onClick?: () => void;
  danger?: boolean;
}> = ({ icon, iconBg, iconColor, label, sublabel, right, onClick, danger }) => {
  const Wrapper = (onClick ? 'button' : 'div') as any;
  const baseIconColor = danger ? 'rgb(var(--color-error-rgb))' : (iconColor || 'rgb(var(--color-primary-rgb))');
  const baseIconBg = danger ? 'rgba(var(--color-error-rgb), 0.12)' : (iconBg || 'rgba(var(--color-primary-rgb), 0.11)');

  return (
    <div className="sp-row-wrap">
      <Wrapper
        {...(onClick ? { type: 'button', onClick } : {})}
        className={`sp-row ${danger ? 'sp-row-danger' : ''}`}
      >
        <div
          className="shrink-0 w-9 h-9 rounded-xl flex items-center justify-center"
          style={{ background: baseIconBg, color: baseIconColor }}
        >
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <p
            className="text-sm font-medium leading-snug"
            style={{ color: danger ? 'rgb(var(--color-error-rgb))' : 'rgb(var(--color-text-rgb))' }}
          >
            {label}
          </p>
          {sublabel && (
            <p className="text-xs mt-0.5 leading-snug" style={{ color: 'rgb(var(--color-text-muted-rgb))' }}>{sublabel}</p>
          )}
        </div>
        {right ?? (
          onClick && (
            <svg className="w-3.5 h-3.5 shrink-0" style={{ color: 'rgba(var(--color-text-muted-rgb),0.5)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
            </svg>
          )
        )}
      </Wrapper>
    </div>
  );
};

// ─── Glass Section Card ───────────────────────────────────────────────────────
const SectionCard: React.FC<{
  icon?: React.ReactNode;
  title: string;
  children: React.ReactNode;
  className?: string;
}> = ({ icon, title, children, className = '' }) => (
  <div className={`sp-glass overflow-hidden ${className}`}>
    {/* Header */}
    <div
      className="flex items-center gap-2.5 px-5 py-4"
      style={{ borderBottom: '1px solid rgba(var(--color-border-rgb), 0.3)' }}
    >
      {icon && (
        <div
          className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ background: 'rgba(var(--color-primary-rgb), 0.12)', color: 'rgb(var(--color-primary-rgb))' }}
        >
          {icon}
        </div>
      )}
      <h3 className="text-sm font-bold" style={{ color: 'rgb(var(--color-text-rgb))' }}>{title}</h3>
    </div>
    {/* Body */}
    <div className="px-2 py-2">
      {children}
    </div>
  </div>
);

// ─── Profile Section ──────────────────────────────────────────────────────────
const ProfileSection: React.FC<{ user: User; onUpdateUser: (u: User) => void }> = ({ user, onUpdateUser }) => {
  const [username, setUsername] = useState(user.username);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) { setMessage({ text: 'Max 10 MB.', type: 'error' }); return; }
    const reader = new FileReader();
    reader.onloadend = () => onUpdateUser({ ...user, avatar: reader.result as string });
    reader.readAsDataURL(file);
  };

  const handleUpdateUsername = async (e: React.FormEvent) => {
    e.preventDefault();
    if (username.length < 3) { setMessage({ text: 'At least 3 characters.', type: 'error' }); return; }
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
    <SectionCard
      title="Profile"
      icon={
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      }
    >
      {/* Avatar row */}
      <div className="flex items-center gap-4 px-3 py-3 mb-2">
        <div className="relative shrink-0">
          {/* Gradient ring */}
          <div className="sp-avatar-ring">
            <div className="w-16 h-16 rounded-full overflow-hidden" style={{ background: 'rgb(var(--color-card-muted-rgb))' }}>
              {user.avatar
                ? <img src={user.avatar} alt="Avatar" className="w-full h-full object-cover" />
                : <div className="w-full h-full flex items-center justify-center">
                    <UserIcon className="w-8 h-8" style={{ color: 'rgb(var(--color-text-muted-rgb))' }} />
                  </div>
              }
            </div>
          </div>
          {/* Camera badge */}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full flex items-center justify-center shadow-lg active:scale-90 transition-all"
            style={{ background: 'rgb(var(--color-primary-rgb))', color: 'white' }}
            aria-label="Change photo"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2}
                d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
          <input type="file" accept="image/*" ref={fileInputRef} onChange={handleAvatarUpload} className="hidden" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-base truncate" style={{ color: 'rgb(var(--color-text-rgb))' }}>{user.username}</p>
          <p className="text-xs mt-0.5" style={{ color: 'rgb(var(--color-text-muted-rgb))' }}>Tap camera icon to change photo</p>
        </div>
      </div>

      {/* Username form */}
      <div className="px-3 pb-3">
        <form onSubmit={handleUpdateUsername} className="space-y-3">
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: 'rgba(var(--color-text-muted-rgb), 0.6)' }}>Username</label>
            <input
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              className="sp-input"
              autoComplete="username"
            />
          </div>
          {message.text && (
            <p className="text-xs px-1" style={{ color: message.type === 'success' ? 'rgb(var(--color-success-rgb))' : 'rgb(var(--color-error-rgb))' }}>
              {message.text}
            </p>
          )}
          <button
            type="submit"
            disabled={isLoading || username === user.username}
            className="sp-btn-primary"
          >
            {isLoading ? 'Updating…' : 'Update Username'}
          </button>
        </form>
      </div>
    </SectionCard>
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
    if (passwords.new.length < 6) { setMsg({ text: 'Min 6 characters.', type: 'error' }); return; }
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
      } catch (err) { console.error(err); } finally { setIsRegistering(false); }
    }
  };

  return (
    <SectionCard
      title="Security"
      icon={
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
      }
    >
      <div className="px-3 py-3 space-y-4">
        <form onSubmit={handlePasswordChange} className="space-y-3">
          <PasswordField label="Current Password" value={passwords.current} onChange={pw('current')} />
          <PasswordField label="New Password"     value={passwords.new}     onChange={pw('new')} />
          <PasswordField label="Confirm Password" value={passwords.confirm} onChange={pw('confirm')} />
          {msg.text && (
            <p className="text-xs px-1" style={{ color: msg.type === 'success' ? 'rgb(var(--color-success-rgb))' : 'rgb(var(--color-error-rgb))' }}>
              {msg.text}
            </p>
          )}
          <button type="submit" disabled={loading} className="sp-btn-primary">
            {loading ? 'Updating…' : 'Change Password'}
          </button>
        </form>

        {isBiometricAvailable && (
          <>
            <div style={{ height: 1, background: 'rgba(var(--color-border-rgb), 0.35)', margin: '4px 0' }} />
            <div className="sp-rows">
              <SettingsRow
                icon={
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 11c0-1.1.9-2 2-2s2 .9 2 2v1m-4-1v1m-2 4h8m-9-4a4 4 0 018 0v1H7v-1z" />
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
            </div>
          </>
        )}
      </div>
    </SectionCard>
  );
};

// ─── Main ─────────────────────────────────────────────────────────────────────
const SettingsPage: React.FC<SettingsPageProps> = ({
  user, onUpdateUser, onSignOut, onOpenConfirmModal, onImportData,
  setActiveItem, onOpenCropModal, isProcessingImage, processingType,
  setProcessingType, onExportData, onChangePassword, onDeleteAccount,
}) => {
  injectSPCSS();
  const { theme, setTheme, customBackground, setCustomBackground } = useTheme();
  const [activeTab, setActiveTab] = useState<'account' | 'appearance' | 'data' | 'notifications' | 'advanced' | 'categories'>('account');
  const [showDebugPanel, setShowDebugPanel] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const backgroundInputRef = useRef<HTMLInputElement>(null);

  const handleBackgroundUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 20 * 1024 * 1024) { alert('Max 20 MB.'); return; }
    const reader = new FileReader();
    reader.onloadend = async () => {
      if (onOpenCropModal) onOpenCropModal(reader.result as string, processingType || 'transparent');
      e.target.value = '';
    };
    reader.readAsDataURL(file);
  };

  useEffect(() => {
    const handleCropComplete = async (event: CustomEvent) => {
      const { croppedImageUrl, processingType: type } = event.detail;
      try {
        const processedImage = type === 'pattern'
          ? await createPatternBackground(croppedImageUrl)
          : await processImageForBackground(croppedImageUrl);
        setCustomBackground(processedImage);
      } catch { alert('Failed to process image.'); }
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
        onOpenConfirmModal('Import Data', 'Merge imported data with existing data?', () => onImportData(data), { confirmText: 'Import', variant: 'primary' });
      } catch { alert('Invalid backup file.'); }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // ── Tabs ──
  const tabs = [
    { key: 'account',       label: 'Account',    emoji: '👤' },
    { key: 'categories',    label: 'Categories', emoji: '🗂️' },
    { key: 'appearance',    label: 'Appearance', emoji: '🎨' },
    { key: 'notifications', label: 'Alerts',     emoji: '🔔' },
    { key: 'data',          label: 'Data',       emoji: '💾' },
    { key: 'advanced',      label: 'Advanced',   emoji: '⚙️' },
  ] as const;

  // ── Tab content ──

  const renderAccountTab = () => (
    <div className="space-y-4 sp-fade-up">
      <ProfileSection user={user} onUpdateUser={onUpdateUser} />
      <SecuritySection user={user} onUpdateUser={onUpdateUser} onChangePassword={onChangePassword} />

      <SectionCard
        title="Financial Accounts"
        icon={
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
          </svg>
        }
      >
        <div className="sp-rows">
          <SettingsRow
            icon={
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
            }
            label="Manage Accounts"
            sublabel={`${(user.financialAccounts ?? []).filter(a => !a.isArchived).length} active account(s)`}
            right={
              <span className="sp-badge">
                {(user.financialAccounts ?? []).filter(a => !a.isArchived).length}
              </span>
            }
            onClick={() => setActiveItem?.('Accounts')}
          />
        </div>
      </SectionCard>

      <SectionCard
        title="Session"
        icon={
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
        }
      >
        <div className="sp-rows">
          <SettingsRow
            icon={
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            }
            iconBg="rgba(var(--color-text-muted-rgb), 0.1)"
            iconColor="rgb(var(--color-text-muted-rgb))"
            label="Sign Out"
            sublabel="You will need to sign in again"
            onClick={() => onOpenConfirmModal('Sign Out', 'Sign out of your account?', onSignOut, { confirmText: 'Sign Out', variant: 'danger' })}
          />
        </div>
      </SectionCard>
    </div>
  );

  const renderAppearanceTab = () => (
    <div className="space-y-4 sp-fade-up">
      {/* Theme picker grid */}
      <SectionCard
        title="Theme"
        icon={
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
          </svg>
        }
      >
        <div className="px-3 py-3">
          <div className="sp-theme-grid">
            {THEMES.map(t => (
              <ThemePreview
                key={t.id}
                themeId={t.id}
                name={t.name}
                selected={theme === t.id}
                onClick={() => setTheme(t.id)}
              />
            ))}
          </div>
        </div>
      </SectionCard>

      {/* Card Background */}
      <SectionCard
        title="Card Background"
        icon={
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        }
      >
        <div className="px-3 py-3">
          {customBackground ? (
            <div className="relative w-full h-28 rounded-xl overflow-hidden" style={{ border: '1px solid rgba(var(--color-border-rgb),0.4)' }}>
              <div className="w-full h-full" style={{ backgroundImage: `url('${customBackground}')`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
              <button
                onClick={() => setCustomBackground(null)}
                className="absolute top-2 right-2 w-7 h-7 rounded-lg flex items-center justify-center transition-colors"
                style={{ background: 'rgba(0,0,0,0.55)', color: 'white' }}
                aria-label="Remove"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => backgroundInputRef.current?.click()}
              className="w-full py-8 flex flex-col items-center gap-2 rounded-xl transition-colors"
              style={{
                border: '1.5px dashed rgba(var(--color-border-rgb), 0.6)',
                color: 'rgb(var(--color-text-muted-rgb))'
              }}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span className="text-xs font-semibold">Upload Background Image</span>
            </button>
          )}
          <input type="file" accept="image/*" ref={backgroundInputRef} onChange={handleBackgroundUpload} className="hidden" />
        </div>
      </SectionCard>

      {/* Currency */}
      <SectionCard
        title="Currency"
        icon={
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        }
      >
        <div className="px-3 py-3">
          <label className="text-[11px] font-semibold uppercase tracking-widest mb-1.5 block" style={{ color: 'rgba(var(--color-text-muted-rgb),0.6)' }}>Select Currency</label>
          <select
            value={user.currency || 'USD'}
            onChange={e => onUpdateUser({ ...user, currency: e.target.value as any })}
            className="sp-input sp-select"
          >
            {CURRENCIES.map(c => (
              <option key={c.code} value={c.code} style={{ background: 'rgb(var(--color-card-muted-rgb))' }}>
                {c.symbol} {c.code} — {c.name}
              </option>
            ))}
          </select>
        </div>
      </SectionCard>
    </div>
  );

  const renderDataTab = () => (
    <div className="space-y-4 sp-fade-up">
      <SectionCard
        title="Backup & Restore"
        icon={<BackupIcon className="w-4 h-4" />}
      >
        <div className="sp-rows">
          <SettingsRow
            icon={<BackupIcon className="w-4 h-4" />}
            iconBg="rgba(var(--color-success-rgb), 0.12)"
            iconColor="rgb(var(--color-success-rgb))"
            label="Export Data"
            sublabel="Download full backup as JSON"
            onClick={onExportData}
          />
          <SettingsRow
            icon={<RestoreIcon className="w-4 h-4" />}
            label="Import Data"
            sublabel="Restore from a backup file"
            onClick={() => fileInputRef.current?.click()}
          />
        </div>
        <input type="file" accept=".json" ref={fileInputRef} onChange={handleImport} className="hidden" />
      </SectionCard>

      <SectionCard
        title="Danger Zone"
        icon={
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: 'rgb(var(--color-error-rgb))' }}>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        }
      >
        <div className="sp-rows">
          <SettingsRow
            icon={
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            }
            danger
            label="Delete Account"
            sublabel="Permanently erase all your data"
            onClick={() => onOpenConfirmModal(
              'Delete Account',
              'This will permanently erase all your data. This is irreversible!',
              () => { if (onDeleteAccount) onDeleteAccount(); },
              { confirmText: 'Delete Everything', variant: 'danger' }
            )}
          />
        </div>
      </SectionCard>
    </div>
  );

  const renderNotificationsTab = () => (
    <div className="sp-fade-up">
      <NotificationSettingsPage user={user} onUpdateUser={onUpdateUser} />
    </div>
  );

  const renderCategoriesTab = () => (
    <div className="sp-fade-up">
      <Suspense fallback={
        <div className="flex items-center justify-center p-12">
          <div className="animate-spin rounded-full h-7 w-7" style={{ borderBottom: '2px solid rgb(var(--color-primary-rgb))' }} />
        </div>
      }>
        <ManageCategoriesPage
          user={user}
          onUpdateCategories={categories => onUpdateUser({ ...user, customCategories: categories })}
          setActiveItem={setActiveItem}
        />
      </Suspense>
    </div>
  );

  const renderAdvancedTab = () => (
    <div className="space-y-4 sp-fade-up">
      <SectionCard
        title="AI Features"
        icon={<SparklesIcon className="w-4 h-4" />}
      >
        <div className="px-3 py-3 space-y-2">
          <label className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: 'rgba(var(--color-text-muted-rgb),0.6)' }}>Gemini API Key</label>
          <input
            type="password"
            placeholder="AIzaSy…"
            value={user.aiSettings?.apiKey || ''}
            onChange={e => onUpdateUser({
              ...user,
              aiSettings: { ...(user.aiSettings || { model: 'gemini-1.5-flash' }), apiKey: e.target.value }
            })}
            className="sp-input"
          />
          <p className="text-xs" style={{ color: 'rgb(var(--color-text-muted-rgb))' }}>Used for receipt scanning and intelligent transactions.</p>
        </div>
      </SectionCard>

      <SectionCard
        title="Developer"
        icon={
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
          </svg>
        }
      >
        <div className="sp-rows">
          <SettingsRow
            icon={
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            }
            label="Service Worker Debug"
            sublabel="PWA developer tools"
            onClick={() => setShowDebugPanel(v => !v)}
            right={
              <svg
                className="w-3.5 h-3.5 transition-transform"
                style={{
                  color: 'rgba(var(--color-text-muted-rgb),0.5)',
                  transform: showDebugPanel ? 'rotate(90deg)' : 'none'
                }}
                fill="none" stroke="currentColor" viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
              </svg>
            }
          />
        </div>
        {showDebugPanel && (
          <div className="px-3 pb-3 mt-1">
            <ServiceWorkerDebugPanel />
          </div>
        )}
      </SectionCard>
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto pb-10">

      {/* ── Page title ── */}
      <div className="mb-6 px-1">
        <h1 className="text-xl font-bold" style={{ color: 'rgb(var(--color-text-rgb))' }}>Settings</h1>
        <p className="text-xs mt-0.5" style={{ color: 'rgb(var(--color-text-muted-rgb))' }}>Manage your account, appearance, and preferences</p>
      </div>

      {/* ── Tab Bar ── */}
      <div
        className="flex gap-1 p-1.5 mb-6 overflow-x-auto scrollbar-hide"
        style={{
          background: 'rgba(var(--color-card-muted-rgb), 0.5)',
          borderRadius: 18,
          border: '1px solid rgba(var(--color-border-rgb), 0.3)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
        }}
      >
        {tabs.map(tab => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-2xl text-xs font-semibold whitespace-nowrap flex-shrink-0 transition-all touch-manipulation ${
              activeTab === tab.key ? 'sp-tab-active' : 'sp-tab-inactive'
            }`}
          >
            <span style={{ fontSize: 14, lineHeight: 1 }}>{tab.emoji}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* ── Tab Content ── */}
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
