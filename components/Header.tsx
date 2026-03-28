import React, { useState, useEffect, useRef, useCallback, memo } from 'react';
import { User, Notification } from '../types';
import { BellIcon, UserIcon, FinTrackIcon } from './icons';
import NotificationPanel from './NotificationPanel';

interface HeaderProps {
  user: User;
  notifications: Notification[];
  onMarkAsRead: (id: string) => void;
  onClearAllNotifications: () => void;
  pageTitle: string;
  isOnline?: boolean;
  setActiveItem?: (item: string) => void;
}

// ─── CSS (injected once) ──────────────────────────────────────────────────────
const HEADER_CSS = `
  @keyframes hdr-badge-in {
    0%   { transform: scale(0) rotate(-15deg); opacity: 0; }
    60%  { transform: scale(1.25) rotate(4deg); }
    100% { transform: scale(1) rotate(0); opacity: 1; }
  }
  @keyframes hdr-badge-pulse {
    0%, 100% { box-shadow: 0 0 0 0 rgba(var(--color-primary-rgb), 0.5); }
    50%       { box-shadow: 0 0 0 5px rgba(var(--color-primary-rgb), 0); }
  }
  @keyframes hdr-panel-in {
    from { opacity: 0; transform: translateY(-8px) scale(0.97); }
    to   { opacity: 1; transform: translateY(0) scale(1); }
  }
  @keyframes hdr-online-pulse {
    0%, 100% { opacity: 1; }
    50%       { opacity: 0.4; }
  }

  .hdr-badge {
    animation: hdr-badge-in 0.4s cubic-bezier(0.34,1.4,0.64,1) both,
               hdr-badge-pulse 2s ease 0.5s infinite;
  }
  .hdr-panel {
    animation: hdr-panel-in 0.22s cubic-bezier(0.4,0,0.2,1) both;
  }
  .hdr-online-dot {
    animation: hdr-online-pulse 2.5s ease-in-out infinite;
  }

  /* Pill glass */
  .hdr-pill {
    background: rgba(var(--color-card-rgb), 0.82);
    border: 1px solid rgba(255,255,255,0.10);
    backdrop-filter: saturate(180%) blur(28px);
    -webkit-backdrop-filter: saturate(180%) blur(28px);
    box-shadow:
      0 1px 0 rgba(255,255,255,0.12) inset,
      0 20px 60px rgba(0,0,0,0.22),
      0 4px 12px rgba(0,0,0,0.12);
  }

  /* Icon button */
  .hdr-icon-btn {
    display: flex; align-items: center; justify-content: center;
    border-radius: 50%; width: 38px; height: 38px;
    border: 1px solid rgba(255,255,255,0.08);
    background: rgba(var(--color-card-muted-rgb), 0.55);
    color: rgb(var(--color-text-muted-rgb));
    cursor: pointer; touch-action: manipulation;
    transition: all 0.18s ease;
    position: relative;
  }
  .hdr-icon-btn:hover {
    background: rgba(var(--color-primary-rgb), 0.15);
    border-color: rgba(var(--color-primary-rgb), 0.25);
    color: rgb(var(--color-primary-rgb));
    transform: scale(1.05);
  }
  .hdr-icon-btn:active { transform: scale(0.93); }
  .hdr-icon-btn.is-active {
    background: rgb(var(--color-primary-rgb));
    border-color: transparent;
    color: white;
    box-shadow: 0 4px 14px rgba(var(--color-primary-rgb), 0.38);
  }
`;

let hdrCSSInjected = false;
const injectCSS = () => {
  if (hdrCSSInjected || typeof document === 'undefined') return;
  const el = document.createElement('style');
  el.id = 'hdr-css';
  el.textContent = HEADER_CSS;
  document.head.appendChild(el);
  hdrCSSInjected = true;
};

// ─── Component ────────────────────────────────────────────────────────────────
const Header: React.FC<HeaderProps> = memo(({
  user, notifications, onMarkAsRead, onClearAllNotifications,
  pageTitle, isOnline = true, setActiveItem,
}) => {
  injectCSS();

  const [showNotifications, setShowNotifications] = useState(false);
  const notifRef  = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const unreadCount = notifications.filter(n => !n.read).length;

  // ── Close panel on outside click ─────────────────────────────────────────
  const handleClickOutside = useCallback((e: MouseEvent) => {
    if (
      showNotifications &&
      !notifRef.current?.contains(e.target as Node) &&
      !triggerRef.current?.contains(e.target as Node)
    ) {
      setShowNotifications(false);
    }
  }, [showNotifications]);

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [handleClickOutside]);

  // ── Close on Escape ───────────────────────────────────────────────────────
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setShowNotifications(false); };
    if (showNotifications) document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [showNotifications]);

  const toggleNotif = useCallback(() => setShowNotifications(p => !p), []);

  return (
    <header
      className="sticky top-0 z-50 px-3 pt-2 pb-1"
      style={{ paddingTop: `calc(env(safe-area-inset-top, 0px) + 8px)` }}
    >
      <div className="hdr-pill flex items-center justify-between px-3 py-2 rounded-full max-w-2xl mx-auto">

        {/* ── Left: Logo + Title ── */}
        <button
          type="button"
          onClick={() => setActiveItem?.('Home')}
          className="flex items-center gap-2.5 flex-1 min-w-0 group touch-manipulation"
          aria-label="Go to Home"
        >
          {/* Logo with subtle glow */}
          <div className="relative flex-shrink-0">
            <div
              className="absolute inset-0 rounded-full blur-md opacity-0 group-hover:opacity-60 transition-opacity duration-300"
              style={{ background: 'rgba(var(--color-primary-rgb), 0.5)' }}
              aria-hidden
            />
            <FinTrackIcon className="relative h-8 w-8 text-[rgb(var(--color-primary-rgb))]" />
          </div>

          {/* Title */}
          <div className="flex items-center gap-2 min-w-0">
            <h1 className="font-bold text-[17px] text-[rgb(var(--color-text-rgb))] truncate tracking-tight leading-tight">
              {pageTitle}
            </h1>
            {/* Online indicator */}
            <span
              className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${isOnline ? 'bg-emerald-500 hdr-online-dot' : 'bg-red-400'}`}
              title={isOnline ? 'Online' : 'Offline'}
              aria-label={isOnline ? 'Online' : 'Offline'}
            />
          </div>
        </button>

        {/* ── Right: Actions ── */}
        <div className="flex items-center gap-1.5 flex-shrink-0 ml-2">

          {/* Notification bell */}
          <div className="relative">
            <button
              ref={triggerRef}
              type="button"
              onClick={toggleNotif}
              className={`hdr-icon-btn ${showNotifications ? 'is-active' : ''}`}
              aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ''}`}
              aria-expanded={showNotifications}
              aria-haspopup="true"
            >
              <BellIcon className="h-5 w-5" />

              {/* Badge */}
              {unreadCount > 0 && (
                <span
                  className="hdr-badge absolute -top-1 -right-1 min-w-[18px] h-[18px] px-0.5
                    bg-red-500 text-white text-[10px] font-bold rounded-full
                    flex items-center justify-center
                    border-2 border-[rgb(var(--color-bg-rgb))]"
                  aria-hidden
                >
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </button>

            {/* Notification panel — full width below bell */}
            {showNotifications && (
              <>
                {/* Backdrop */}
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowNotifications(false)}
                  aria-hidden
                />
                <div
                  ref={notifRef}
                  className=" fixed left-3 right-3  z-50"
                >
                  <NotificationPanel
                    notifications={notifications}
                    onMarkAsRead={onMarkAsRead}
                    onClearAll={onClearAllNotifications}
                  />
                </div>
              </>
            )}
          </div>

          {/* Avatar / Settings */}
          <button
            type="button"
            onClick={() => setActiveItem?.('Settings')}
            className="hdr-icon-btn overflow-hidden"
            style={{ borderRadius: '50%' }}
            aria-label={`${user.name ?? 'User'} — Settings`}
          >
            {user.avatar ? (
              <img
                src={user.avatar}
                alt={user.name ?? 'User avatar'}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-sm font-bold text-[rgb(var(--color-primary-rgb))]">
                {user.name?.[0]?.toUpperCase() ?? <UserIcon className="h-4 w-4" />}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
});

Header.displayName = 'Header';
export default Header;