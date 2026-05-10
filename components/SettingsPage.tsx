import React, { useState, useEffect, useRef, Suspense, lazy } from 'react';
import { User, NotificationSettings } from '../types';
import { CURRENCIES } from '../utils/formatters';
import { useTheme, THEMES } from './ThemeContext';
import {
  SparklesIcon, BellIcon, SettingsIcon, UserIcon,
  ChevronUpIcon, HomeIcon, TrendingUpIcon, BackupIcon, RestoreIcon
} from './icons';
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

  /* Danger button — solid red */
  .sp-btn-danger {
    width: 100%;
    padding: 11px 20px;
    background: #dc2626;
    color: #ffffff;
    border: none;
    border-radius: 14px;
    font-size: 13px;
    font-weight: 600;
    transition: filter 0.15s, transform 0.12s;
    touch-action: manipulation;
  }
  .sp-btn-danger:hover { filter: brightness(1.1); }
  .sp-btn-danger:active { transform: scale(0.98); }

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

  /* Theme dropdown */
  .sp-theme-dropdown {
    width: 100%;
    padding: 11px 36px 11px 14px;
    background: rgba(30, 35, 50, 0.7);
    border: 1.5px solid rgba(120, 140, 180, 0.45);
    border-radius: 14px;
    font-size: 13px;
    color: #e8eaf0;
    -webkit-text-fill-color: #e8eaf0;
    outline: none;
    cursor: pointer;
    appearance: none;
    -webkit-appearance: none;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='rgba(160,160,160,0.7)' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E");
    background-repeat: no-repeat;
    background-position: right 14px center;
    transition: border-color 0.18s, box-shadow 0.18s;
  }
  :root[class*="light"] .sp-theme-dropdown,
  .theme-light .sp-theme-dropdown {
    background-color: rgba(255,255,255,0.85);
    border-color: rgba(80, 100, 140, 0.35);
    color: #1a1d2e;
    -webkit-text-fill-color: #1a1d2e;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='rgba(80,80,80,0.7)' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E");
    background-repeat: no-repeat;
    background-position: right 14px center;
  }
  .sp-theme-dropdown:focus {
    border-color: rgba(var(--color-primary-rgb, 99, 140, 255), 0.65);
    box-shadow: 0 0 0 3px rgba(var(--color-primary-rgb, 99, 140, 255), 0.13);
  }

  /* Theme color swatch next to dropdown label */
  .sp-theme-swatch {
    display: inline-block;
    width: 10px;
    height: 10px;
    border-radius: 50%;
    margin-right: 6px;
    vertical-align: middle;
    border: 1px solid rgba(255,255,255,0.15);
  }

  /* Theme preview card */
  @keyframes sp-preview-in {
    from { opacity: 0; transform: translateY(6px) scale(0.98); }
    to   { opacity: 1; transform: translateY(0) scale(1); }
  }
  .sp-theme-preview {
    animation: sp-preview-in 0.22s cubic-bezier(0.34,1.2,0.64,1) both;
    border-radius: 16px;
    overflow: hidden;
    border: 1px solid rgba(255,255,255,0.1);
    box-shadow: 0 4px 20px rgba(0,0,0,0.18);
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

// ─── Theme color map (for swatch preview) ────────────────────────────────────
const THEME_COLORS: Record<string, { bg: string; card: string; primary: string; text: string; textMuted: string; isLight: boolean }> = {
  'theme-light':          { bg: '#f3f4f6', card: '#ffffff',  primary: '#2563eb', text: '#111827', textMuted: '#6b7280', isLight: true },
  'theme-dark-slate':     { bg: '#0f172a', card: '#1e293b',  primary: '#3b82f6', text: '#f1f5f9', textMuted: '#94a3b8', isLight: false },
  'theme-dark-green':     { bg: '#0f1714', card: '#19271e',  primary: '#4ade80', text: '#ecfdf5', textMuted: '#6ee7b7', isLight: false },
  'theme-dark-crimson':   { bg: '#1c1518', card: '#312126',  primary: '#f43f5e', text: '#fff1f2', textMuted: '#fda4af', isLight: false },
  'theme-ocean-blue':     { bg: '#0f2337', card: '#192d41',  primary: '#648caa', text: '#e0f2fe', textMuted: '#7dd3fc', isLight: false },
  'theme-sunset-orange':  { bg: '#faf5eb', card: '#f5ebdc',  primary: '#be8264', text: '#431407', textMuted: '#92400e', isLight: true },
  'theme-purple':         { bg: '#231e2d', card: '#2d283a',  primary: '#8c78a5', text: '#f5f3ff', textMuted: '#c4b5fd', isLight: false },
  'theme-midnight-black': { bg: '#121214', card: '#1c1c20',  primary: '#788ca0', text: '#e2e8f0', textMuted: '#94a3b8', isLight: false },
  'theme-pixel':          { bg: '#0a0a14', card: '#121226',  primary: '#ffdc00', text: '#ffffff', textMuted: '#a5b4fc', isLight: false },
  'theme-cyberpunk':      { bg: '#0d0d1a', card: '#12121f',  primary: '#f5e642', text: '#ffffff', textMuted: '#a78bfa', isLight: false },
};

// ─── Theme Preview Card ───────────────────────────────────────────────────────
const ThemePreviewCard: React.FC<{ themeId: string; themeName: string }> = ({ themeId, themeName }) => {
  const tc = THEME_COLORS[themeId];
  if (!tc) return null;

  return (
    <div className="sp-theme-preview" key={themeId}>
      {/* Mock app chrome */}
      <div style={{ background: tc.bg, padding: '12px 14px 14px' }}>
        {/* Top bar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: tc.primary, opacity: 0.9 }} />
            <div style={{ width: 32, height: 6, borderRadius: 3, background: tc.text, opacity: 0.15 }} />
          </div>
          <div style={{ fontSize: 9, fontWeight: 700, color: tc.primary, letterSpacing: '0.05em', opacity: 0.9 }}>
            {themeName}
          </div>
        </div>

        {/* KPI row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 7, marginBottom: 8 }}>
          {['Income', 'Expense'].map((label, i) => (
            <div key={label} style={{
              background: tc.card,
              borderRadius: 10,
              padding: '7px 9px',
              border: `1px solid ${tc.primary}22`,
            }}>
              <div style={{ fontSize: 8, color: tc.textMuted, marginBottom: 3, fontWeight: 600 }}>{label}</div>
              <div style={{ fontSize: 11, fontWeight: 800, color: i === 0 ? tc.primary : '#f87171', fontVariantNumeric: 'tabular-nums' }}>
                {i === 0 ? '+$1,240' : '-$580'}
              </div>
            </div>
          ))}
        </div>

        {/* Transaction list mock */}
        <div style={{ background: tc.card, borderRadius: 10, overflow: 'hidden', border: `1px solid ${tc.text}0d` }}>
          {[
            { emoji: '🛒', label: 'Groceries', amt: '-$42', color: '#f87171' },
            { emoji: '💼', label: 'Salary',    amt: '+$800', color: tc.primary },
            { emoji: '🍔', label: 'Dining',    amt: '-$18', color: '#f87171' },
          ].map((row, i) => (
            <div key={i} style={{
              display: 'flex',
              alignItems: 'center',
              gap: 7,
              padding: '6px 9px',
              borderBottom: i < 2 ? `1px solid ${tc.text}0a` : 'none',
            }}>
              <span style={{ fontSize: 11 }}>{row.emoji}</span>
              <span style={{ flex: 1, fontSize: 9, color: tc.textMuted, fontWeight: 500 }}>{row.label}</span>
              <span style={{ fontSize: 10, fontWeight: 700, color: row.color, fontVariantNumeric: 'tabular-nums' }}>{row.amt}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ─── Password Field ───────────────────────────────────────────────────────────
const PasswordField: React.FC<{ label: string; value: string; onChange: (v: string) => void }> = ({ label, value, onChange }) => {
  const [show, setShow] = useState(false);
  return (
    <div className="space-y-1.5">
      <label
        className="text-[11px] font-semibold uppercase tracking-widest block"
        style={{ color: 'rgb(var(--color-text-muted-rgb))' }}
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
          style={{ color: 'rgb(var(--color-text-muted-rgb))' }}
          aria-label={show ? 'Hide' : 'Show'}
        >
          {show ? (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
              <path d="M17.94 17.94A10.07 10.07 0 0112 20c-4.478 0-8.268-2.943-9.543-7a10.025 10.025 0 014.132-5.411" />
              <path d="M9.9 4.24A9.12 9.12 0 0112 4c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411M3 3l18 18" />
            </svg>
          ) : (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
              <circle cx="12" cy="12" r="3" />
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
  const baseIconColor = danger ? '#ef4444' : (iconColor || 'rgb(var(--color-primary-rgb))');
  const baseIconBg = danger ? 'rgba(239,68,68,0.12)' : (iconBg || 'rgba(var(--color-primary-rgb), 0.11)');

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
            style={{ color: danger ? '#ef4444' : 'rgb(var(--color-text-rgb))' }}
          >
            {label}
          </p>
          {sublabel && (
            <p className="text-xs mt-0.5 leading-snug" style={{ color: 'rgb(var(--color-text-muted-rgb))' }}>{sublabel}</p>
          )}
        </div>
        {right ?? (
          onClick && (
            <svg className="w-3.5 h-3.5 shrink-0" style={{ color: 'rgb(var(--color-text-muted-rgb))' }} fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
              <path d="M9 5l7 7-7 7" />
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
        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
          <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
      }
    >
      {/* Avatar row */}
      <div className="flex items-center gap-4 px-3 py-3 mb-2">
        <div className="relative shrink-0">
          <div className="sp-avatar-ring">
            <div className="w-16 h-16 rounded-full overflow-hidden" style={{ background: 'rgba(var(--color-card-muted-rgb),0.8)' }}>
              {user.avatar
                ? <img src={user.avatar} alt="Avatar" className="w-full h-full object-cover" />
                : <div className="w-full h-full flex items-center justify-center">
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" style={{ color: 'rgb(var(--color-text-muted-rgb))' }}>
                      <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
                      <circle cx="12" cy="7" r="4" />
                    </svg>
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
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
              <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" />
              <circle cx="12" cy="13" r="4" />
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
            <label className="text-[11px] font-semibold uppercase tracking-widest block" style={{ color: 'rgb(var(--color-text-muted-rgb))' }}>Username</label>
            <input
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              className="sp-input"
              autoComplete="username"
            />
          </div>
          {message.text && (
            <p className="text-xs px-1" style={{ color: message.type === 'success' ? 'rgb(var(--color-success-rgb))' : '#ef4444' }}>
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
        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
          <path d="M7 11V7a5 5 0 0110 0v4" />
        </svg>
      }
    >
      <div className="px-3 py-3 space-y-4">
        <form onSubmit={handlePasswordChange} className="space-y-3">
          <PasswordField label="Current Password" value={passwords.current} onChange={pw('current')} />
          <PasswordField label="New Password"     value={passwords.new}     onChange={pw('new')} />
          <PasswordField label="Confirm Password" value={passwords.confirm} onChange={pw('confirm')} />
          {msg.text && (
            <p className="text-xs px-1" style={{ color: msg.type === 'success' ? 'rgb(var(--color-success-rgb))' : '#ef4444' }}>
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
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                    <path d="M12 11c0-1.1.9-2 2-2s2 .9 2 2v1m-4-1v1m-2 4h8m-9-4a4 4 0 018 0v1H7v-1z" />
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
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
            <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
            <path d="M1 10h22" />
          </svg>
        }
      >
        <div className="sp-rows">
          <SettingsRow
            icon={
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
                <path d="M1 10h22" />
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
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
            <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
        }
      >
        <div className="sp-rows">
          <SettingsRow
            icon={
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
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

  const renderAppearanceTab = () => {
    const selectedTheme = THEMES.find(t => t.id === theme);
    return (
      <div className="space-y-4 sp-fade-up">
        {/* Theme Dropdown */}
        <SectionCard
          title="Theme"
          icon={
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" />
              <path d="M2 12h20" />
            </svg>
          }
        >
          <div className="px-3 py-3 space-y-3">
            {/* Dropdown */}
            <div>
              <label className="text-[11px] font-semibold uppercase tracking-widest mb-1.5 block" style={{ color: 'rgb(var(--color-text-muted-rgb))' }}>
                Select Theme
              </label>
              <select
                value={theme}
                onChange={e => setTheme(e.target.value)}
                className="sp-theme-dropdown"
              >
                {THEMES.map(t => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Theme preview card — shown below dropdown */}
            <ThemePreviewCard themeId={theme} themeName={selectedTheme?.name ?? theme} />
          </div>
        </SectionCard>

        {/* Card Background */}
        <SectionCard
          title="Card Background"
          icon={
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <polyline points="21 15 16 10 5 21" />
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
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
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
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                  <rect x="3" y="3" width="18" height="18" rx="2" />
                  <circle cx="8.5" cy="8.5" r="1.5" />
                  <polyline points="21 15 16 10 5 21" />
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
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
              <line x1="12" y1="1" x2="12" y2="23" />
              <path d="M17 5H9.5a3.5 3.5 0 100 7h5a3.5 3.5 0 110 7H6" />
            </svg>
          }
        >
          <div className="px-3 py-3">
            <label className="text-[11px] font-semibold uppercase tracking-widest mb-1.5 block" style={{ color: 'rgb(var(--color-text-muted-rgb))' }}>Select Currency</label>
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
  };

  const renderDataTab = () => (
    <div className="space-y-4 sp-fade-up">
      <SectionCard
        title="Backup & Restore"
        icon={
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
        }
      >
        <div className="sp-rows">
          <SettingsRow
            icon={
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
            }
            iconBg="rgba(var(--color-success-rgb), 0.12)"
            iconColor="rgb(var(--color-success-rgb))"
            label="Export Data"
            sublabel="Download full backup as JSON"
            onClick={onExportData}
          />
          <SettingsRow
            icon={
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
            }
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
          <svg className="w-4 h-4" fill="none" stroke="#ef4444" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
            <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
        }
      >
        <div className="px-3 py-3">
          <button
            type="button"
            className="sp-btn-danger"
            onClick={() => onOpenConfirmModal(
              'Delete Account',
              'This will permanently erase all your data. This is irreversible!',
              () => { if (onDeleteAccount) onDeleteAccount(); },
              { confirmText: 'Delete Everything', variant: 'danger' }
            )}
          >
            <span className="flex items-center justify-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
                <path d="M10 11v6M14 11v6" />
                <path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2" />
              </svg>
              Delete Account
            </span>
          </button>
          <p className="text-xs mt-2 text-center" style={{ color: 'rgb(var(--color-text-muted-rgb))' }}>
            Permanently erases all your data — irreversible
          </p>
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
          <label className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: 'rgb(var(--color-text-muted-rgb))' }}>Gemini API Key</label>
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
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
            <polyline points="16 18 22 12 16 6" />
            <polyline points="8 6 2 12 8 18" />
          </svg>
        }
      >
        <div className="px-3 py-3">
          <p className="text-xs" style={{ color: 'rgb(var(--color-text-muted-rgb))' }}>
            Developer tools have been removed from this build.
          </p>
        </div>
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
