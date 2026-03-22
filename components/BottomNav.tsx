import React from 'react';
import { NAV_ITEMS } from '../constants';
import { useTheme } from './ThemeContext';

interface BottomNavProps {
  activeItem: string;
  setActiveItem: (item: string) => void;
  onAddTransaction?: (type?: 'income' | 'expense') => void;
}

const navItems = [
  NAV_ITEMS[0], // Home
  NAV_ITEMS[1], // Transactions
  NAV_ITEMS[2], // Insights
  NAV_ITEMS[4], // Budgets
  NAV_ITEMS[3], // Goals
];

const BottomNav: React.FC<BottomNavProps> = ({ activeItem, setActiveItem }) => {
  const { theme } = useTheme();

  return (
    <nav
      className={`fixed bottom-0 left-0 right-0 md:hidden z-50 flex justify-center pointer-events-none ${theme}`}
      style={{
        paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 20px)',
        paddingTop: '12px',
      }}
    >
      <div 
        className={`flex items-center p-1.5 shadow-[0_25px_60px_rgba(0,0,0,0.35)] rounded-full pointer-events-auto mx-4 backdrop-blur-3xl bg-[rgba(var(--color-card-rgb),0.88)]`}
      >
        <div className="flex items-center gap-1.5 px-1">
          {navItems.map((item) => {
            const isActive = activeItem === item.name;
            return (
              <button
                key={item.name}
                onClick={() => setActiveItem(item.name)}
                className={`relative flex items-center justify-center w-12 h-12 rounded-full transition-all duration-500 group overflow-hidden`}
              >
                {/* Active Backdrop Layer */}
                <div className={`absolute inset-0 transition-all duration-500 ease-out rounded-full
                  ${isActive 
                    ? 'bg-[rgb(var(--color-primary-rgb))] scale-100 opacity-100' 
                    : 'bg-[rgba(var(--color-primary-rgb),0.1)] scale-50 opacity-0 group-hover:scale-100 group-hover:opacity-100'
                  }`} 
                />

                {/* Icon */}
                <item.icon className={`relative z-10 w-6 h-6 transition-all duration-500
                  ${isActive ? 'text-white scale-110 rotate-[360deg]' : 'text-[rgb(var(--color-text-muted-rgb))]'}
                `} />

                {/* Animated Ring for Active Tab */}
                {isActive && (
                  <div className="absolute inset-0 rounded-full border-2 border-white/20 animate-ping opacity-40" />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
};

export default BottomNav;
