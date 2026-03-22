import React, { useState, useEffect } from 'react';
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

const Header: React.FC<HeaderProps> = React.memo(({ user, notifications, onMarkAsRead, onClearAllNotifications, pageTitle, isOnline = true, setActiveItem }) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const unreadCount = notifications.filter(n => !n.read).length;
  
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (
        showNotifications &&
        !target.closest('.notification-panel-wrapper') &&
        !target.closest('.notification-trigger-btn')
      ) {
        setShowNotifications(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showNotifications]);

  return (
    <header className="sticky top-0 z-50" style={{paddingTop: 'env(safe-area-inset-top)'}}>
      <div className="flex items-center justify-between px-4 py-2 max-w-7xl mx-auto shadow-[0_25px_60px_rgba(0,0,0,0.35)] rounded-full backdrop-blur-3xl bg-[rgba(var(--color-card-rgb),0.88)] mx-4 mt-2">
        <div className="flex flex-row items-center flex-1 min-w-0 cursor-pointer gap-3" onClick={() => setActiveItem?.('Home')}>
          <FinTrackIcon className="h-8 w-8 text-[rgb(var(--color-primary-rgb))]" />
          <h1 className="font-bold text-xl text-[rgb(var(--color-text-rgb))] truncate tracking-tight">{pageTitle}</h1>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <button
             onClick={() => setShowNotifications((prev) => !prev)}
             className={`notification-trigger-btn p-2 flex items-center justify-center rounded-full transition-all duration-200 relative ${
               showNotifications
                 ? 'bg-[rgb(var(--color-primary-rgb))] text-white shadow-lg ring-2 ring-[rgba(var(--color-primary-rgb),0.25)]'
                 : 'bg-[rgba(var(--color-card-rgb),0.7)] hover:bg-[rgb(var(--color-primary-rgb))] hover:text-white'
             }`}
             aria-label="Notifications"
            >
              <BellIcon className={`h-6 w-6 transition-colors ${showNotifications ? 'text-white' : 'text-[rgb(var(--color-text-muted-rgb))]'}`} />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-[rgb(var(--color-primary-rgb))] text-white text-[10px] rounded-full flex items-center justify-center font-bold border-2 border-[rgb(var(--color-bg-rgb))] shadow animate-bounce">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>
            {showNotifications && (
              <div className="notification-panel-wrapper absolute right-0 mt-2 z-50">
                <NotificationPanel
                  notifications={notifications}
                  onMarkAsRead={onMarkAsRead}
                  onClearAll={onClearAllNotifications}
                />
              </div>
            )}
          </div>
          <button
            onClick={() => setActiveItem?.('Settings')}
            className="flex items-center justify-center h-9 w-9 rounded-xl bg-[rgb(var(--color-primary-rgb))] transition-all duration-200 active:scale-95"
            aria-label="User Settings"
          >
            {user.avatar ? (
              <img src={user.avatar} alt="User" className="w-full h-full object-cover rounded-full" />
            ) : (
              <UserIcon className="h-5 w-5 text-white" />
            )}
          </button>
        </div>
      </div>
    </header>
  );
});

export default Header;