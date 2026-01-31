import React, { useState, useEffect } from 'react';
import { User, Notification, Transaction } from '../types';
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
    
    // Close notifications if clicking outside
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
         <header className="sticky top-0 z-50 flex items-center justify-between h-20 px-4 md:px-6 transition-colors flex-shrink-0 bg-[rgb(var(--color-bg-rgb))] border-b border-[rgb(var(--color-border-rgb))] mobile-safe-area">
             {/* Unified Title */}
             <div className="flex items-center space-x-3 min-w-0 flex-1">
               <FinTrackIcon className="h-7 w-7 text-green-500 flex-shrink-0" />
               <h1 className="text-xl md:text-2xl font-bold text-[rgb(var(--color-text-rgb))] truncate">{pageTitle}</h1>
             </div>
            
            <div className="flex items-center space-x-4">
                 {/* Network Status Indicator */}
                 <div className="hidden md:flex items-center space-x-2">
                   <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-500' : 'bg-red-500'}`}></div>
                   <span className="text-xs text-[rgb(var(--color-text-muted-rgb))]">
                     {isOnline ? 'Online' : 'Offline'}
                   </span>
                 </div>

                <div className="relative notification-panel-wrapper">
                    <button
                        onClick={() => setShowNotifications(!showNotifications)}
                        className="h-12 w-12 rounded-full flex items-center justify-center bg-[rgb(var(--color-card-rgb))] hover:bg-[rgb(var(--color-card-muted-rgb))] transition-colors focus:outline-none focus:ring-2 focus:ring-[rgb(var(--color-primary-rgb))] focus:ring-offset-2 focus:ring-offset-[rgb(var(--color-bg-rgb))]"
                        aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ''}`}
                        aria-expanded={showNotifications}
                        aria-haspopup="true"
                    >
                        <BellIcon className="h-6 w-6 text-[rgb(var(--color-text-muted-rgb))]" />
                        {unreadCount > 0 && <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-[rgb(var(--color-card-rgb))]" aria-hidden="true"></span>}
                    </button>
                    {showNotifications && (
                        <NotificationPanel
                            notifications={notifications}
                            onMarkAsRead={onMarkAsRead}
                            onClearAll={() => {
                                onClearAllNotifications();
                                setShowNotifications(false);
                            }}
                        />
                    )}
                </div>
                <div
                    className="h-12 w-12 rounded-full bg-[rgb(var(--color-card-muted-rgb))] flex items-center justify-center overflow-hidden cursor-pointer hover:bg-[rgb(var(--color-card-hover-rgb))] transition-colors focus:outline-none focus:ring-2 focus:ring-[rgb(var(--color-primary-rgb))] focus:ring-offset-2 focus:ring-offset-[rgb(var(--color-bg-rgb))]"
                    onClick={() => setActiveItem?.('Account')}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            setActiveItem?.('Account');
                        }
                    }}
                    aria-label="Open Account Settings"
                >
                    {user.avatar ? (
                        <img src={user.avatar} alt="User Avatar" className="w-full h-full object-cover" />
                    ) : (
                        <UserIcon className="h-6 w-6 text-[rgb(var(--color-text-muted-rgb))]" />
                    )}
                </div>
            </div>
        </header>
    );
});

export default Header;