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
      if (showNotifications && !target.closest('.notification-panel-wrapper')) {
        setShowNotifications(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showNotifications]);

  return (
    <header className="sticky top-0 z-40 border-b border-[rgb(var(--color-border-rgb))] bg-[rgb(var(--color-card-rgb))]/80 backdrop-blur-md transition-colors duration-200 shadow-sm" style={{paddingTop: 'env(safe-area-inset-top)'}}>
      <div className="flex items-center justify-between px-4 py-3 md:px-6 max-w-7xl mx-auto">
        <div className="flex items-center space-x-3 flex-1 min-w-0 cursor-pointer" onClick={() => setActiveItem?.('Home')}>
          <div className="p-1.5 bg-green-500/10 rounded-xl">
             <FinTrackIcon className="h-6 w-6 md:h-7 md:w-7 text-green-500 flex-shrink-0" />
          </div>
          <span className="font-bold text-lg md:text-xl text-[rgb(var(--color-text-rgb))] truncate tracking-tight">{pageTitle}</span>
        </div>

        <div className="flex items-center space-x-2 md:space-x-4">
          {/* Network Status */}
          <div className="hidden md:flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span className="text-xs text-[rgb(var(--color-text-muted-rgb))]">
              {isOnline ? 'Online' : 'Offline'}
            </span>
          </div>

          {/* Notifications */}
          <div className="relative notification-panel-wrapper">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="p-2 hover:bg-[rgb(var(--color-card-muted-rgb))] rounded-xl transition-all relative flex items-center justify-center active:scale-95"
              aria-label="Notifications"
            >
              <BellIcon className="h-6 w-6 text-[rgb(var(--color-text-muted-rgb))]" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center font-bold border-2 border-[rgb(var(--color-card-rgb))] shadow-sm">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>
            {showNotifications && (
              <div className="absolute right-0 top-full mt-2 z-50">
                <NotificationPanel
                  notifications={notifications}
                  onMarkAsRead={onMarkAsRead}
                  onClearAll={() => {
                    onClearAllNotifications();
                    setShowNotifications(false);
                  }}
                />
              </div>
            )}
          </div>

          {/* User Avatar */}
          <button
            onClick={() => setActiveItem?.('Settings')}
            className="h-9 w-9 md:h-10 md:w-10 rounded-full bg-[rgb(var(--color-card-muted-rgb))] flex items-center justify-center overflow-hidden hover:bg-[rgb(var(--color-card-hover-rgb))] transition-all flex-shrink-0 border-2 border-transparent hover:border-[rgb(var(--color-primary-rgb))] active:scale-95 shadow-sm"
            aria-label="User Settings"
          >
            {user.avatar ? (
              <img src={user.avatar} alt="User" className="w-full h-full object-cover" />
            ) : (
              <UserIcon className="h-5 w-5 text-[rgb(var(--color-text-muted-rgb))]" />
            )}
          </button>
        </div>
      </div>
    </header>
  );
});

export default Header;