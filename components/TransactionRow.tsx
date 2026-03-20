import React from 'react';
import { Transaction, User } from '../types';
import { formatCurrency } from '../utils/formatters';
import CategoryIcon from './CategoryIcon';
import { ChevronRightIcon } from './icons';

interface TransactionRowProps {
  transaction: Transaction;
  onEdit?: (transaction: Transaction) => void;
  onClick?: (transaction: Transaction) => void;
  user: User | null;
  style?: React.CSSProperties;
  variant?: 'default' | 'compact';
}

const TransactionRow: React.FC<TransactionRowProps> = ({ 
  transaction, 
  onEdit,
  onClick,
  user, 
  style,
  variant = 'default'
}) => {
  const isIncome = transaction.type === 'income';
  const amountColor = isIncome ? 'text-green-600 dark:text-green-400' : 'text-[rgb(var(--color-text-rgb))]';
  const isCompact = variant === 'compact';
  
  const getIconForCategory = (categoryName: string) => {
    if (!user?.customCategories) return undefined;
    const allCategories = { ...user.customCategories.expense, ...user.customCategories.income };
    for (const parentCategory in allCategories) {
      const subCategory = allCategories[parentCategory].find(c => c.name === categoryName);
      if (subCategory) return subCategory.icon;
    }
    return undefined;
  };

  const displayEmoji = transaction.emoji || getIconForCategory(transaction.category);

  const handleClick = (e: React.MouseEvent) => {
    if (onClick) {
        onClick(transaction);
    } else if (onEdit) {
        onEdit(transaction);
    }
  };

  return (
    <div
      style={style}
      className={`w-full flex items-center gap-3.5 rounded-2xl hover:bg-[rgb(var(--color-card-muted-rgb))]/60 active:bg-[rgb(var(--color-card-muted-rgb))] transition-all duration-200 group cursor-pointer ${isCompact ? 'p-2.5' : 'p-4 border border-transparent hover:border-[rgb(var(--color-border-rgb))]/50 hover:shadow-sm'}`}
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            handleClick(e as any);
        }
      }}
    >
      <div className={`rounded-[14px] flex items-center justify-center flex-shrink-0 transition-transform duration-300 group-hover:scale-105 group-active:scale-95 shadow-sm ${
          isCompact
            ? 'w-10 h-10'
            : 'w-12 h-12 border border-white/10 dark:border-white/5'
        } ${
          isIncome
            ? 'bg-gradient-to-br from-green-400/20 to-green-500/10 text-green-600 dark:text-green-400'
            : 'bg-gradient-to-br from-[rgb(var(--color-border-rgb))]/50 to-[rgb(var(--color-card-muted-rgb))]/50 text-[rgb(var(--color-text-rgb))]'
        }`}>
        <CategoryIcon
          category={transaction.category}
          emoji={displayEmoji}
          className={`${isCompact ? 'h-5 w-5' : 'h-6 w-6'} ${isIncome ? 'text-current drop-shadow-sm' : 'opacity-80'}`}
        />
      </div>
      
      <div className="flex-1 min-w-0 flex flex-col justify-center">
        <div className="flex justify-between items-center mb-0.5">
            <p className={`font-bold text-[rgb(var(--color-text-rgb))] truncate ${isCompact ? 'text-sm' : 'text-[15px]'}`}>
            {transaction.description}
            </p>
            <p className={`font-extrabold whitespace-nowrap pl-2 flex items-center ${isCompact ? 'text-sm' : 'text-base'} ${amountColor}`}>
                {transaction.type === 'expense' ? '' : '+'}{formatCurrency(transaction.amount)}
            </p>
        </div>
        <div className="flex justify-between items-center text-xs text-[rgb(var(--color-text-muted-rgb))] font-medium">
            <p className="truncate opacity-80 flex items-center gap-1.5">
                <span className={`w-1.5 h-1.5 rounded-full ${isIncome ? 'bg-green-500' : 'bg-[rgb(var(--color-primary-rgb))]'} opacity-60`}></span>
                {transaction.category}
            </p>
            <span className="opacity-60 tabular-nums">
                {new Date(transaction.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </span>
        </div>
      </div>

      {!isCompact && (
        <div className="ml-1 opacity-0 group-hover:opacity-100 transform translate-x-2 group-hover:translate-x-0 transition-all duration-300">
           <ChevronRightIcon className="w-5 h-5 text-[rgb(var(--color-primary-rgb))] opacity-80" />
        </div>
      )}
    </div>
  );
};

export default TransactionRow;