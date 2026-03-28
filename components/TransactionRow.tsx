import React, { useCallback } from 'react';
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
  variant = 'default',
}) => {
  const isIncome = transaction.type === 'income';
  const isCompact = variant === 'compact';

  // 取得自訂 category icon
  const displayEmoji = transaction.emoji ?? (() => {
    if (!user?.customCategories) return undefined;
    const all = { ...user.customCategories.expense, ...user.customCategories.income };
    for (const parent in all) {
      const sub = all[parent].find(c => c.name === transaction.category);
      if (sub) return sub.icon;
    }
    return undefined;
  })();

  const handleClick = useCallback((e: React.MouseEvent | React.KeyboardEvent) => {
    if (onClick) onClick(transaction);
    else if (onEdit) onEdit(transaction);
  }, [onClick, onEdit, transaction]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick(e);
    }
  }, [handleClick]);

  // 格式化日期
  const dateLabel = new Date(transaction.date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });

  const amountLabel = `${isIncome ? '+' : ''}${formatCurrency(transaction.amount)}`;

  return (
    <div
      style={style}
      className={`
        w-full flex items-center gap-3 rounded-2xl cursor-pointer select-none
        transition-all duration-150 group touch-manipulation
        active:scale-[0.98] active:bg-[rgb(var(--color-card-muted-rgb))]
        hover:bg-[rgb(var(--color-card-muted-rgb))]/60
        ${isCompact
          ? 'px-2.5 py-2'
          : 'px-4 py-3.5 border border-transparent hover:border-[rgb(var(--color-border-rgb))]/40 hover:shadow-sm'
        }
      `}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={0}
      aria-label={`${transaction.description}, ${amountLabel}, ${transaction.category}, ${dateLabel}`}
    >
      {/* ── Icon ── */}
      <div className={`
        flex-shrink-0 flex items-center justify-center rounded-[14px]
        transition-transform duration-200 group-hover:scale-105 group-active:scale-95
        ${isCompact ? 'w-9 h-9' : 'w-11 h-11'}
        ${isIncome
          ? 'bg-emerald-500/10 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
          : 'bg-[rgb(var(--color-border-rgb))]/40 text-[rgb(var(--color-text-rgb))]'
        }
      `}>
        <CategoryIcon
          category={transaction.category}
          emoji={displayEmoji}
          className={`
            ${isCompact ? 'h-4.5 w-4.5' : 'h-5 w-5'}
            ${isIncome ? 'drop-shadow-sm' : 'opacity-75'}
          `}
        />
      </div>

      {/* ── Content ── */}
      <div className="flex-1 min-w-0">
        {/* Row 1: description + amount */}
        <div className="flex items-center justify-between gap-2">
          <p className={`
            font-semibold text-[rgb(var(--color-text-rgb))] truncate leading-tight
            ${isCompact ? 'text-sm' : 'text-[14.5px]'}
          `}>
            {transaction.description}
          </p>
          <p className={`
            font-bold tabular-nums whitespace-nowrap flex-shrink-0
            ${isCompact ? 'text-sm' : 'text-sm'}
            ${isIncome
              ? 'text-emerald-600 dark:text-emerald-400'
              : 'text-[rgb(var(--color-text-rgb))]'
            }
          `}>
            {amountLabel}
          </p>
        </div>

        {/* Row 2: category + date */}
        <div className="flex items-center justify-between gap-2 mt-0.5">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className={`
              w-1.5 h-1.5 rounded-full flex-shrink-0
              ${isIncome ? 'bg-emerald-500' : 'bg-[rgb(var(--color-primary-rgb))]'}
            `} />
            <p className="text-xs text-[rgb(var(--color-text-muted-rgb))] truncate font-medium">
              {transaction.category}
            </p>
          </div>
          <span className="text-xs text-[rgb(var(--color-text-muted-rgb))] opacity-60 tabular-nums flex-shrink-0">
            {dateLabel}
          </span>
        </div>
      </div>

      {/* ── Chevron (default only) ── */}
      {!isCompact && (
        <div className="
          flex-shrink-0 ml-1
          opacity-0 group-hover:opacity-100
          translate-x-2 group-hover:translate-x-0
          transition-all duration-200
        ">
          <ChevronRightIcon className="w-4 h-4 text-[rgb(var(--color-primary-rgb))]/70" />
        </div>
      )}
    </div>
  );
};

export default TransactionRow;