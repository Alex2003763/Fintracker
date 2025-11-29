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
          <h1 className="text-2xl font-bold text-[rgb(var(--color-text-rgb))]">FinTrack</h1>
        </div>
        <nav className="flex-1">
          <ul className="space-y-2">
            {NAV_ITEMS.map((item) => (
              <li key={item.name}>
                <a
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    setActiveItem(item.name);
                  }}
                  className={`flex items-center justify-between px-4 py-3 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[rgb(var(--color-primary-rgb))] focus:ring-offset-2 focus:ring-offset-[rgb(var(--color-card-rgb))] ${
                    activeItem === item.name
                      ? 'text-[rgb(var(--color-text-rgb))] font-semibold bg-[rgba(var(--color-border-rgb),0.03)]'
                      : 'text-[rgb(var(--color-text-muted-rgb))] hover:text-[rgb(var(--color-text-rgb))] hover:bg-[rgba(var(--color-border-rgb),0.05)]'
                  }`}
                  aria-current={activeItem === item.name ? 'page' : undefined}
                >
                  <div className="flex items-center">
                    <item.icon className="h-6 w-6 mr-4" />
                    <span>{item.name}</span>
                  </div>
                  {activeItem === item.name && (
                    <span className="text-[rgb(var(--color-text-muted-rgb))] font-bold text-lg" aria-hidden="true">{'>'}</span>
                  )}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </aside>
  );
};

export default Sidebar;