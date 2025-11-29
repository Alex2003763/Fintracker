import React from 'react';
import { Notification } from '../types';
import { BellIcon } from './icons';

interface NotificationPanelProps {
  notifications: Notification[];
  onMarkAsRead: (id: string) => void;
  onClearAll: () => void;
}

const NotificationPanel: React.FC<NotificationPanelProps> = ({ notifications, onMarkAsRead, onClearAll }) => {
   const unreadCount = notifications.filter(n => !n.read).length;
   const MAX_DISPLAYED = 10;
   const displayedNotifications = notifications.slice(0, MAX_DISPLAYED);
   const hasMoreNotifications = notifications.length > MAX_DISPLAYED;

   return (
     <div className="fixed top-24 inset-x-4 sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2 sm:w-96 md:left-auto md:right-6 md:translate-x-0 bg-[rgb(var(--color-card-rgb))] rounded-2xl shadow-xl border border-[rgb(var(--color-border-rgb))] z-50 transition-all duration-200 animate-fade-in-up">
       <div className="p-4 border-b border-[rgb(var(--color-border-rgb))] flex justify-between items-center bg-[rgb(var(--color-card-rgb))] rounded-t-2xl">
         <div className="flex items-center gap-2">
            <BellIcon className="w-5 h-5 text-[rgb(var(--color-primary-rgb))]" />
            <h3 className="font-bold text-[rgb(var(--color-text-rgb))]">Notifications</h3>
         </div>
         {unreadCount > 0 && (
            <span className="text-xs font-bold text-[rgb(var(--color-primary-text-rgb))] bg-[rgb(var(--color-primary-rgb))] rounded-full px-2.5 py-0.5 shadow-sm">
                {unreadCount} New
            </span>
         )}
       </div>
       <div className="max-h-[28rem] overflow-y-auto custom-scrollbar">
         {notifications.length > 0 ? (
           <>
             {displayedNotifications.map(notification => (
               <div
                 key={notification.id}
                 className={`p-4 border-b border-[rgb(var(--color-border-rgb))] last:border-b-0 cursor-pointer transition-colors duration-200 group ${
                   !notification.read
                    ? 'bg-[rgb(var(--color-primary-rgb))]/5 hover:bg-[rgb(var(--color-primary-rgb))]/10'
                    : 'hover:bg-[rgb(var(--color-card-muted-rgb))]'
                 }`}
                 onClick={() => onMarkAsRead(notification.id)}
                 role="button"
                 tabIndex={0}
                 onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        onMarkAsRead(notification.id);
                    }
                 }}
               >
                 <div className="flex items-start gap-3">
                     <div className={`mt-1.5 w-2.5 h-2.5 rounded-full flex-shrink-0 transition-colors duration-200 ${!notification.read ? 'bg-[rgb(var(--color-primary-rgb))] shadow-sm' : 'bg-transparent border border-[rgb(var(--color-border-rgb))]'}`}></div>
                     <div className="flex-1 min-w-0">
                       <p className={`text-sm font-semibold mb-0.5 truncate ${!notification.read ? 'text-[rgb(var(--color-text-rgb))]' : 'text-[rgb(var(--color-text-muted-rgb))]'}`}>
                           {notification.title}
                       </p>
                       <p className="text-sm text-[rgb(var(--color-text-muted-rgb))] leading-snug line-clamp-2 group-hover:text-[rgb(var(--color-text-rgb))] transition-colors">
                           {notification.message}
                       </p>
                       <p className="text-xs text-[rgb(var(--color-text-muted-rgb))]/70 mt-2 font-medium">
                           {new Date(notification.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                       </p>
                     </div>
                 </div>
               </div>
             ))}
             {hasMoreNotifications && (
               <div className="p-3 text-center text-xs font-medium text-[rgb(var(--color-text-muted-rgb))] bg-[rgb(var(--color-card-muted-rgb))]/50">
                 +{notifications.length - MAX_DISPLAYED} more notifications
               </div>
             )}
           </>
         ) : (
           <div className="p-12 text-center flex flex-col items-center justify-center text-[rgb(var(--color-text-muted-rgb))]">
             <div className="w-16 h-16 bg-[rgb(var(--color-card-muted-rgb))] rounded-full flex items-center justify-center mb-4">
                <BellIcon className="h-8 w-8 text-[rgb(var(--color-text-muted-rgb))]/50" />
             </div>
             <p className="font-medium text-[rgb(var(--color-text-rgb))]">All caught up!</p>
             <p className="text-sm mt-1 opacity-70">No new notifications at the moment.</p>
           </div>
         )}
      </div>
      {notifications.length > 0 && (
        <div className="p-3 border-t border-[rgb(var(--color-border-rgb))] bg-[rgb(var(--color-card-rgb))] rounded-b-2xl">
          <button
            onClick={onClearAll}
            className="w-full text-center text-sm font-semibold text-[rgb(var(--color-text-muted-rgb))] hover:text-[rgb(var(--color-primary-rgb))] hover:bg-[rgb(var(--color-card-muted-rgb))] rounded-xl py-2.5 transition-all duration-200"
          >
            Clear All Notifications
          </button>
        </div>
      )}
    </div>
  );
};

export default NotificationPanel;