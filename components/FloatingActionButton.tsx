import React from 'react';
import { PlusIcon } from './icons';

const FloatingActionButton: React.FC<{ onClick: () => void }> = ({ onClick }) => {
  // Return null to hide the button while keeping the code
  return null;

  return (
    <button
      onClick={onClick}
      className="fixed z-30 md:bottom-8 md:right-8 h-16 w-16 bg-gradient-to-br from-[rgb(var(--color-primary-rgb))] to-[rgb(var(--color-primary-hover-rgb))] rounded-full flex items-center justify-center shadow-xl border-4 border-[rgb(var(--color-card-rgb))] hover:border-[rgba(var(--color-primary-rgb),0.3)] transition-all duration-300 ease-out transform hover:scale-110 active:scale-95 focus:outline-none focus:ring-4 focus:ring-[rgba(var(--color-primary-rgb),0.3)] group overflow-hidden aspect-square"
      aria-label="Add Transaction"
      aria-haspopup="dialog"
      style={{ boxShadow: '0 8px 32px rgba(0,0,0,0.18)', bottom: 'calc(6rem + env(safe-area-inset-bottom))', right: 'max(1.5rem, env(safe-area-inset-right))' }}
    >
      <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 group-active:opacity-20 transition-opacity duration-200 rounded-full"></div>
      <PlusIcon className="h-7 w-7 text-white drop-shadow-sm group-hover:text-white group-active:scale-90 transition-all duration-200 relative z-10" />
      <div className="absolute inset-0 rounded-full bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
    </button>
  );
};

export default FloatingActionButton;
