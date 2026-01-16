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
      className={`w-full flex items-center gap-3 rounded-xl hover:bg-[rgb(var(--color-card-muted-rgb))] transition-all group cursor-pointer ${isCompact ? 'py-2 px-2' : 'px-3 py-3'}`}
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            handleClick(e as any);
        }
      }}
    >
      <div className={`rounded-full flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-110 ${
          isCompact
            ? 'p-1.5'
            : 'p-2.5'
        } ${
          isIncome
            ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400'
            : 'bg-[rgba(var(--color-border-rgb),0.4)] text-[rgb(var(--color-text-muted-rgb))]'
        }`}>
        <CategoryIcon
          category={transaction.category}
          emoji={displayEmoji}
          className={`${isCompact ? 'h-4 w-4' : 'h-5 w-5'} ${isIncome ? 'text-current' : 'text-[rgb(var(--color-text-rgb))]'}`}
        />
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-baseline mb-1">
            <p className={`font-semibold text-[rgb(var(--color-text-rgb))] truncate ${isCompact ? 'text-sm' : 'text-base'}`}>
            {transaction.description}
            </p>
            <p className={`font-bold whitespace-nowrap ml-2 ${isCompact ? 'text-xs' : 'text-sm'} ${amountColor}`}>
                {transaction.type === 'expense' ? '-' : '+'}{formatCurrency(transaction.amount)}
            </p>
        </div>
        <div className="flex justify-between items-center text-[10px] sm:text-xs text-[rgb(var(--color-text-muted-rgb))] mt-0.5">
            <p className="truncate">
                {transaction.category}
            </p>
            {isCompact && (
                 <span className="opacity-75">{new Date(transaction.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
            )}
        </div>
      </div>

      {!isCompact && (
        <ChevronRightIcon className="w-4 h-4 text-[rgb(var(--color-text-muted-rgb))] opacity-30 group-hover:opacity-100 transition-opacity" />
      )}
    </div>
  );
};

export default TransactionRow;