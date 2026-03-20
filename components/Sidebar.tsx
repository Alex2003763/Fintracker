import React from 'react';
import { NAV_ITEMS } from '../constants';
import { FinTrackIcon } from './icons';

interface SidebarProps {
  activeItem: string;
  setActiveItem: (item: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeItem, setActiveItem }) => {
  return (
    <div className="h-full flex flex-col bg-[rgb(var(--color-card-rgb))] border-r border-[rgb(var(--color-border-rgb))]">
      <div className="flex items-center space-x-3 w-full justify-center p-4 border-b border-[rgb(var(--color-border-rgb))]">
        <FinTrackIcon className="h-8 w-8 text-green-500" />
        <h1 className="text-2xl font-bold text-[rgb(var(--color-text-rgb))]">FinTrack</h1>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4">
        <div className="text-xs font-semibold text-[rgb(var(--color-text-muted-rgb))] uppercase tracking-wide mb-4">Menu</div>
        <div className="space-y-2">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.name}
              onClick={() => setActiveItem(item.name)}
              className={`w-full flex items-center space-x-3 px-4 py-2 rounded-lg transition-colors ${
                activeItem === item.name
                  ? 'bg-[rgba(var(--color-border-rgb),0.1)] text-[rgb(var(--color-text-rgb))]'
                  : 'text-[rgb(var(--color-text-muted-rgb))] hover:text-[rgb(var(--color-text-rgb))]'
              }`}
            >
              <item.icon className="h-5 w-5 flex-shrink-0" />
              <span className="font-medium">{item.name}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Sidebar;