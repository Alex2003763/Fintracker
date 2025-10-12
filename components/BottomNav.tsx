import React from 'react';
import { NAV_ITEMS } from '../constants';
import { PlusIcon } from './icons';

interface BottomNavProps {
  activeItem: string;
  setActiveItem: (item: string) => void;
  onAddTransaction: (type?: 'income' | 'expense') => void;
}

const BottomNav: React.FC<BottomNavProps> = ({ activeItem, setActiveItem, onAddTransaction }) => {
  const navItemsLeft = [NAV_ITEMS[0], NAV_ITEMS[1]]; // Home, Transactions
  const navItemsRight = [NAV_ITEMS[3], NAV_ITEMS[5]]; // Budgets, Account

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-[rgb(var(--color-card-rgb))] border-t border-[rgb(var(--color-border-rgb))] h-16 flex items-center justify-around z-10 transition-colors">
      {navItemsLeft.map((item) => (
        <a
          key={item.name}
          href="#"
          onClick={(e) => { e.preventDefault(); setActiveItem(item.name); }}
          className={`flex flex-col items-center justify-center w-full h-full transition-colors duration-200 ${
            activeItem === item.name ? 'text-[rgb(var(--color-primary-subtle-text-rgb))]' : 'text-[rgb(var(--color-text-muted-rgb))]'
          }`}
          aria-label={item.name}
        >
          <item.icon className="h-6 w-6" />
          <span className={`text-xs mt-1 ${activeItem === item.name ? 'font-semibold' : 'font-normal'}`}>{item.name}</span>
        </a>
      ))}
      
      <button 
        onClick={() => onAddTransaction()}
        className="h-16 w-16 bg-[rgb(var(--color-primary-rgb))] rounded-full flex items-center justify-center -mt-10 shadow-lg hover:bg-[rgb(var(--color-primary-hover-rgb))] transition-all transform hover:scale-105 border-4 border-[rgb(var(--color-card-rgb))]"
        aria-label="Add Transaction"
      >
        <PlusIcon className="h-8 w-8 text-white" />
      </button>

      {navItemsRight.map((item) => (
        <a
          key={item.name}
          href="#"
          onClick={(e) => { e.preventDefault(); setActiveItem(item.name); }}
          className={`flex flex-col items-center justify-center w-full h-full transition-colors duration-200 ${
            activeItem === item.name ? 'text-[rgb(var(--color-primary-subtle-text-rgb))]' : 'text-[rgb(var(--color-text-muted-rgb))]'
          }`}
          aria-label={item.name}
        >
          <item.icon className="h-6 w-6" />
          <span className={`text-xs mt-1 ${activeItem === item.name ? 'font-semibold' : 'font-normal'}`}>{item.name}</span>
        </a>
      ))}
    </nav>
  );
};

export default BottomNav;