import React, { useState, useEffect } from 'react';
import { User, Notification, Transaction } from '../types';
import { BellIcon, UserIcon, PlusIcon, FinanceFlowIcon } from './icons';
import NotificationPanel from './NotificationPanel';
import QuickAddPopover from './QuickAddPopover';


interface HeaderProps {
    user: User;
    notifications: Notification[];
    onMarkAsRead: (id: string) => void;
    onClearAllNotifications: () => void;
    pageTitle: string;
    onSaveTransaction: (transaction: Omit<Transaction, 'id' | 'date' | 'icon'> & { id?: string }) => void;
}

const Header: React.FC<HeaderProps> = ({ user, notifications, onMarkAsRead, onClearAllNotifications, pageTitle, onSaveTransaction }) => {
    const [showNotifications, setShowNotifications] = useState(false);
    const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
    const unreadCount = notifications.filter(n => !n.read).length;
    
    // Close popovers if clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as HTMLElement;
            if (showNotifications && !target.closest('.notification-panel-wrapper')) {
                setShowNotifications(false);
            }
            if (isQuickAddOpen && !target.closest('.quick-add-wrapper')) {
                setIsQuickAddOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showNotifications, isQuickAddOpen]);

    return (
        <header className="flex items-center justify-between h-20 px-4 md:px-6 transition-colors flex-shrink-0">
            {/* Mobile Title */}
            <div className="flex items-center space-x-3 md:hidden">
              <FinanceFlowIcon className="h-7 w-7 text-green-500" />
              <h1 className="text-xl font-bold text-[rgb(var(--color-text-rgb))]">Finance Flow</h1>
            </div>
            {/* Desktop Title */}
            <h1 className="hidden md:block text-2xl font-bold text-[rgb(var(--color-text-rgb))]">{pageTitle}</h1>
            
            <div className="flex items-center space-x-4">
                 <div className="relative quick-add-wrapper">
                    <button 
                        onClick={() => setIsQuickAddOpen(!isQuickAddOpen)} 
                        className="h-12 w-12 rounded-full flex items-center justify-center bg-[rgb(var(--color-card-rgb))] hover:bg-[rgb(var(--color-card-muted-rgb))] transition-colors"
                        aria-label="Quick Add Transaction"
                    >
                        <PlusIcon className="h-6 w-6 text-[rgb(var(--color-text-muted-rgb))]" />
                    </button>
                    {isQuickAddOpen && (
                        <QuickAddPopover
                            onClose={() => setIsQuickAddOpen(false)}
                            onSaveTransaction={(data) => {
                                onSaveTransaction(data);
                                setIsQuickAddOpen(false);
                            }}
                        />
                    )}
                </div>
                <div className="relative notification-panel-wrapper">
                    <button onClick={() => setShowNotifications(!showNotifications)} className="h-12 w-12 rounded-full flex items-center justify-center bg-[rgb(var(--color-card-rgb))] hover:bg-[rgb(var(--color-card-muted-rgb))] transition-colors">
                        <BellIcon className="h-6 w-6 text-[rgb(var(--color-text-muted-rgb))]" />
                        {unreadCount > 0 && <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-[rgb(var(--color-card-rgb))]"></span>}
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
                <div className="h-12 w-12 rounded-full bg-[rgb(var(--color-card-muted-rgb))] flex items-center justify-center overflow-hidden">
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