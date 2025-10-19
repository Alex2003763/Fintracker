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
   const navItemsRight = [NAV_ITEMS[3], NAV_ITEMS[4]]; // Budgets, Goals

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-[rgb(var(--color-card-rgb))] border-t border-[rgb(var(--color-border-rgb))] h-20 flex items-center justify-around z-10 transition-colors">
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
        className="h-14 w-14 min-h-[56px] min-w-[56px] bg-gradient-to-br from-[rgb(var(--color-primary-rgb))] to-[rgb(var(--color-primary-hover-rgb))] rounded-full flex items-center justify-center -mt-9 shadow-lg hover:shadow-xl border-2 border-[rgb(var(--color-card-rgb))] hover:border-[rgba(var(--color-primary-rgb),0.3)] transition-all duration-300 ease-out transform hover:scale-110 active:scale-95 focus:outline-none focus:ring-4 focus:ring-[rgba(var(--color-primary-rgb),0.3)] group relative overflow-hidden aspect-square"
        aria-label="Add Transaction"
      >
        <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 group-active:opacity-20 transition-opacity duration-200 rounded-full"></div>
        <PlusIcon className="h-5 w-5 text-white drop-shadow-sm group-hover:text-white group-active:scale-90 transition-all duration-200 relative z-10" />
        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
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