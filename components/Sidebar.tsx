import React from 'react';
import { NAV_ITEMS } from '../constants';
import { FinanceFlowIcon } from './icons';

interface SidebarProps {
  activeItem: string;
  setActiveItem: (item: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeItem, setActiveItem }) => {
  return (
    <aside className="hidden md:block w-72 p-4">
      <div className="flex flex-col h-full bg-[rgb(var(--color-card-rgb))] rounded-2xl shadow-sm p-6 transition-colors">
        <div className="flex items-center space-x-3 mb-10">
          <FinanceFlowIcon className="h-8 w-8 text-green-500" />
          <h1 className="text-2xl font-bold text-[rgb(var(--color-text-rgb))]">Finance Flow</h1>
        </div>
        <nav className="flex-1 space-y-2">
          {NAV_ITEMS.map((item) => (
            <a
              key={item.name}
              href="#"
              onClick={(e) => {
                e.preventDefault();
                setActiveItem(item.name);
              }}
              className={`flex items-center justify-between px-4 py-3 rounded-lg transition-colors duration-200 ${
                activeItem === item.name
                  ? 'text-[rgb(var(--color-text-rgb))] font-semibold'
                  : 'text-[rgb(var(--color-text-muted-rgb))] hover:text-[rgb(var(--color-text-rgb))] hover:bg-[rgba(var(--color-border-rgb),0.5)]'
              }`}
            >
              <div className="flex items-center">
                <item.icon className="h-6 w-6 mr-4" />
                <span>{item.name}</span>
              </div>
              {activeItem === item.name && (
                <span className="text-[rgb(var(--color-text-muted-rgb))] font-bold text-lg">&gt;</span>
              )}
            </a>
          ))}
        </nav>
      </div>
    </aside>
  );
};

export default Sidebar;