import React from 'react';
import { NAV_ITEMS } from '../constants';

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
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 md:hidden z-40 border-t-2 border-[rgb(var(--color-border-rgb))] bg-[rgb(var(--color-card-rgb))] backdrop-blur-lg shadow-2xl"
      style={{
        boxShadow: '0 -4px 16px rgba(0, 0, 0, 0.08)',
        paddingBottom: 'max(8px, env(safe-area-inset-bottom))',
      }}
    >
      <div className="flex items-stretch justify-around h-14">
        {navItems.map((item, idx) => (
          <button
            key={item.name}
            onClick={() => setActiveItem(item.name)}
            className={`flex-1 flex flex-col items-center justify-center gap-1 py-2 px-1 relative transition-all duration-300 group ${
              activeItem === item.name
                ? 'text-[rgb(var(--color-primary-rgb))]'
                : 'text-[rgb(var(--color-text-muted-rgb))] hover:text-[rgb(var(--color-text-rgb))]'
            }`}
            style={{
              borderTopWidth: activeItem === item.name ? '3px' : '0px',
              borderTopColor: 'rgb(var(--color-primary-rgb))',
              borderTopStyle: 'solid',
              transition: 'all 300ms cubic-bezier(0.34, 1.56, 0.64, 1)'
            }}
          >
            {/* Icon Container with scaling animation */}
            <div className={`transition-transform duration-300 ${activeItem === item.name ? 'scale-110' : 'group-hover:scale-105'}`}>
              <item.icon 
                className={`w-6 h-6 ${
                  activeItem === item.name
                    ? 'text-[rgb(var(--color-primary-rgb))]'
                    : 'text-[rgb(var(--color-text-muted-rgb))] group-hover:text-[rgb(var(--color-text-rgb))]'
                } transition-colors duration-200`}
              />
            </div>
            
            {/* Label */}
            <span 
              className={`text-[10px] font-semibold truncate max-w-[60px] transition-all duration-200 ${
                activeItem === item.name
                  ? 'text-[rgb(var(--color-primary-rgb))] font-bold'
                  : 'text-[rgb(var(--color-text-muted-rgb))]'
              }`}
            >
              {item.name}
            </span>

            {/* Ripple effect on active */}
            {activeItem === item.name && (
              <div 
                className="absolute inset-0 bg-[rgb(var(--color-primary-rgb))] opacity-5 rounded-lg"
                style={{
                  animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite'
                }}
              />
            )}
          </button>
        ))}
      </div>

      {/* Add dynamic animation styles */}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.05; }
          50% { opacity: 0.1; }
        }
        
        @keyframes tabbarItemBounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-2px); }
        }
      `}</style>
    </nav>
  );
};

export default BottomNav;