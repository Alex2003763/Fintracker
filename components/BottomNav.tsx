import React from 'react';
import { NAV_ITEMS } from '../constants';

interface BottomNavProps {
  activeItem: string;
  setActiveItem: (item: string) => void;
  onAddTransaction: (type?: 'income' | 'expense') => void;
}

const navItems = [
  NAV_ITEMS[0], // Home
  NAV_ITEMS[1], // Transactions
  NAV_ITEMS[2], // Insights
  NAV_ITEMS[4], // Budgets
  NAV_ITEMS[3], // Goals
];

const BottomNav: React.FC<BottomNavProps> = ({ activeItem, setActiveItem }) => {
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-[rgb(var(--color-card-rgb))] border-t border-[rgb(var(--color-border-rgb))] flex flex-col z-10 transition-colors">
      <div className="h-16 flex items-center justify-between px-2">
        <div className="flex flex-1 h-full">
          {navItems.map((item) => (
            <a
              key={item.name}
              href="#"
              onClick={(e) => { e.preventDefault(); setActiveItem(item.name); }}
              className={`flex flex-col items-center justify-center w-full h-full transition-colors duration-200 min-h-[44px] focus:outline-none focus:ring-2 focus:ring-inset focus:ring-[rgb(var(--color-primary-rgb))] ${
                activeItem === item.name ? 'text-[rgb(var(--color-primary-subtle-text-rgb))]' : 'text-[rgb(var(--color-text-muted-rgb))]'
              }`}
              aria-label={item.name}
              aria-current={activeItem === item.name ? 'page' : undefined}
            >
              <item.icon className="h-6 w-6" />
              <span className={`text-xs mt-1 ${activeItem === item.name ? 'font-semibold' : 'font-normal'}`}>{item.name}</span>
            </a>
          ))}
        </div>
      </div>

    </nav>
  );
};

export default BottomNav;
