import React, { useState, useEffect } from 'react';
import { User, Notification } from '../types';
import { BellIcon, UserIcon, FinanceFlowIcon } from './icons';
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

const Header: React.FC<HeaderProps> = ({ 
    user, 
    notifications, 
    onMarkAsRead, 
    onClearAllNotifications, 
    pageTitle, 
    isOnline = true, 
    setActiveItem 
}) => {
    const [showNotifications, setShowNotifications] = useState(false);
    const unreadCount = notifications.filter(n => !n.read).length;
    
    const handleAccountClick = () => {
        if (setActiveItem) {
            setActiveItem('Account');
        }
    };

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
        <header className="sticky top-0 z-50 flex items-center justify-between h-20 px-4 md:px-6 transition-colors flex-shrink-0 bg-[rgb(var(--color-bg-rgb))]">
            {/* Rest of your header code... */}
            
            <div className="flex items-center space-x-4">
                {/* Network Status Indicator */}
                <div className="hidden md:flex items-center space-x-2">
                    <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-500' : 'bg-red-500'}`}></div>
                    <span className="text-xs text-[rgb(var(--color-text-muted-rgb))]">
                        {isOnline ? 'Online' : 'Offline'}
                    </span>
                </div>

                {/* Notifications */}
                <div className="relative notification-panel-wrapper">
                    {/* Your notifications code... */}
                </div>

                {/* Account Icon */}
                <div
                    className="h-12 w-12 rounded-full bg-[rgb(var(--color-card-muted-rgb))] flex items-center justify-center overflow-hidden cursor-pointer hover:bg-[rgb(var(--color-card-hover-rgb))] transition-colors"
                    onClick={handleAccountClick}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            handleAccountClick();
                        }
                    }}
                    aria-label="Open Account"
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
};

export default Header;
