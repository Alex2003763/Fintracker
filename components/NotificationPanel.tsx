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
     <div className="fixed top-24 left-1/2 -translate-x-1/2 md:left-auto md:right-6 md:translate-x-0 w-80 bg-[rgb(var(--color-card-rgb))] rounded-2xl shadow-lg border border-[rgb(var(--color-border-rgb))] z-20 transition-colors">
       <div className="p-4 border-b border-[rgb(var(--color-border-rgb))] flex justify-between items-center">
         <h3 className="font-bold text-[rgb(var(--color-text-rgb))]">Notifications</h3>
         {unreadCount > 0 && <span className="text-xs font-bold text-white bg-[rgb(var(--color-primary-rgb))] rounded-full px-2 py-0.5">{unreadCount} New</span>}
       </div>
       <div className="max-h-96 overflow-y-auto">
         {notifications.length > 0 ? (
           <>
             {displayedNotifications.map(notification => (
               <div
                 key={notification.id}
                 className={`p-4 border-b border-[rgb(var(--color-border-rgb))] last:border-b-0 cursor-pointer hover:bg-[rgb(var(--color-card-muted-rgb))] ${
                   !notification.read ? 'bg-[rgba(var(--color-primary-rgb),0.1)]' : ''
                 }`}
                 onClick={() => onMarkAsRead(notification.id)}
               >
                 <div className="flex items-start">
                     {!notification.read && <div className="w-2 h-2 bg-[rgb(var(--color-primary-rgb))] rounded-full mt-1.5 mr-3 flex-shrink-0"></div>}
                     <div className="flex-1">
                       <p className="font-semibold text-[rgb(var(--color-text-rgb))]">{notification.title}</p>
                       <p className="text-sm text-[rgb(var(--color-text-muted-rgb))]">{notification.message}</p>
                       <p className="text-xs text-gray-400 mt-1">{new Date(notification.date).toLocaleDateString()}</p>
                     </div>
                 </div>
               </div>
             ))}
             {hasMoreNotifications && (
               <div className="p-3 text-center text-sm text-[rgb(var(--color-text-muted-rgb))] bg-[rgb(var(--color-card-muted-rgb))]">
                 +{notifications.length - MAX_DISPLAYED} more notifications
               </div>
             )}
           </>
         ) : (
           <div className="p-8 text-center text-[rgb(var(--color-text-muted-rgb))]">
             <BellIcon className="h-12 w-12 mx-auto text-[rgb(var(--color-border-rgb))]" />
             <p className="mt-2">You're all caught up!</p>
           </div>
         )}
      </div>
      {notifications.length > 0 && (
        <div className="p-2 border-t border-[rgb(var(--color-border-rgb))]">
          <button onClick={onClearAll} className="w-full text-center text-sm font-semibold text-[rgb(var(--color-primary-subtle-text-rgb))] hover:bg-[rgb(var(--color-card-muted-rgb))] rounded-lg py-2 transition-colors">
            Mark all as read
          </button>
        </div>
      )}
    </div>
  );
};

export default NotificationPanel;