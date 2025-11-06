import React, { useState, useCallback, useMemo } from 'react';
import { Transaction } from '../types';
import { formatCurrency } from '../utils/formatters';
import { SalaryIcon, CartIcon, ReportsIcon } from './icons';
import { useTheme } from './ThemeContext';
import './PremiumBalanceCard.css';

interface PremiumBalanceCardProps {
  transactions: Transaction[];
  onAddTransaction: (type?: 'income' | 'expense') => void;
  setActiveItem: (item: string) => void;
  className?: string;
}

const PremiumBalanceCard: React.FC<PremiumBalanceCardProps> = ({
  transactions,
  onAddTransaction,
  setActiveItem,
  className = '',
}) => {
  const [isFlipped, setIsFlipped] = useState(false);
  const { customBackground } = useTheme();

  const { balance, dailyChange, dailyIncome, dailyExpense } = useMemo(() => {
    const currentBalance = transactions.reduce((sum, t) => sum + (t.type === 'income' ? t.amount : -t.amount), 0);

    const today = new Date();
    const yesterday = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1);

    let income = 0;
    let expense = 0;

    const transactionsYesterday = transactions.filter(t => {
        const tDate = new Date(t.date);
        if (tDate >= yesterday && tDate < today) {
            if (t.type === 'income') income += t.amount;
            else expense += t.amount;
            return true;
        }
        return false;
    });

    if (transactionsYesterday.length === 0) {
        return { balance: currentBalance, dailyChange: 0, dailyIncome: 0, dailyExpense: 0 };
    }

    const changeYesterday = income - expense;
    const previousBalance = currentBalance - changeYesterday;

    let percentageChange = 0;
    if (previousBalance !== 0 && Math.abs(previousBalance) > 0.01) {
      percentageChange = (changeYesterday / Math.abs(previousBalance)) * 100;
      // Cap percentage at reasonable bounds to prevent extreme values
      percentageChange = Math.max(-999, Math.min(999, percentageChange));
    }

    return { balance: currentBalance, dailyChange: percentageChange, dailyIncome: income, dailyExpense: expense };
  }, [transactions]);

  const changeColor = dailyChange >= 0 ? 'text-green-400 bg-green-400/20' : 'text-red-400 bg-red-400/20';
  const sign = dailyChange >= 0 ? '+' : '';

  const handleFlip = useCallback(() => {
    setIsFlipped(prev => !prev);
  }, []);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleFlip();
    }
  }, [handleFlip]);

  return (
    <div className={`premium-card-container ${className}`}>
      <div
        className={`premium-card-flipper ${isFlipped ? 'flipped' : ''}`}
        onClick={handleFlip}
        onKeyDown={handleKeyDown}
        tabIndex={0}
        role="button"
        aria-label={`Premium balance card showing ${formatCurrency(balance)}. ${isFlipped ? 'Currently showing back of card' : 'Currently showing front of card'}. Press Enter to flip card.`}
        aria-pressed={isFlipped}
      >
        {/* Card Front */}
        <div
          className="premium-card-front"
          aria-hidden={isFlipped}
          style={{
            backgroundImage: customBackground
              ? `url(${customBackground})`
              : `linear-gradient(135deg, rgb(var(--gradient-from-rgb)), rgb(var(--gradient-to-rgb)))`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat'
          }}
        >
          <div className="premium-card-header">
            <div className="premium-card-logo">
              <span>Fintracker</span>
            </div>
            <div className="premium-card-top-right">
              <div className="premium-card-change">
                <div className={`daily-change ${changeColor}`}>
                  <span className="change-icon">{dailyChange >= 0 ? '↗' : '↘'}</span>
                  <span>{sign}{dailyChange.toFixed(1)}%</span>
                </div>
              </div>
              <button
                className="premium-card-flip-button"
                aria-label="Flip to back of card"
                onClick={(e) => {
                  e.stopPropagation();
                  handleFlip();
                }}
                tabIndex={-1}
              >
                <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                  <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.012 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          </div>
          
          <div className="premium-card-balance">
            <span className="balance-label">Current Balance</span>
            <div className="premium-card-balance-row">
              <span className="balance-amount" aria-label={`Balance ${formatCurrency(balance)}`}>
                {formatCurrency(balance)}
              </span>
              <div className="premium-card-chip" aria-hidden="true"></div>
            </div>
          </div>
          
          {/* Action Bar */}
          <div className="premium-card-actions">
            <button
              className="action-button income-button"
              onClick={(e) => {
                e.stopPropagation();
                onAddTransaction('income');
              }}
              aria-label="Add Income"
              title="Add Income"
            >
              <SalaryIcon className="action-icon" />
              <span className="action-label">Income</span>
            </button>
            <button
              className="action-button expense-button"
              onClick={(e) => {
                e.stopPropagation();
                onAddTransaction('expense');
              }}
              aria-label="Add Expense"
              title="Add Expense"
            >
              <CartIcon className="action-icon" />
              <span className="action-label">Expense</span>
            </button>
            <button
              className="action-button reports-button"
              onClick={(e) => {
                e.stopPropagation();
                setActiveItem('Reports');
              }}
              aria-label="View Reports"
              title="View Reports"
            >
              <ReportsIcon className="action-icon" />
              <span className="action-label">Reports</span>
            </button>
          </div>
        </div>
        
        {/* Card Back */}
        <div className="premium-card-back" aria-hidden={!isFlipped}>
          <div className="premium-card-back-header">
            <h3 className="back-title">Daily Summary</h3>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleFlip();
              }}
              className="back-close-button"
              aria-label="Flip to front of card"
              tabIndex={-1}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </button>
          </div>

          <div className="premium-card-summary">
            <div className="summary-item">
              <span className="summary-label income-label">Income</span>
              <span className="summary-amount income-amount">{formatCurrency(dailyIncome)}</span>
            </div>
            <div className="summary-item">
              <span className="summary-label expense-label">Expenses</span>
              <span className="summary-amount expense-amount">{formatCurrency(dailyExpense)}</span>
            </div>
            <div className="summary-divider"></div>
            <div className="summary-item">
              <span className="summary-label net-label">Net</span>
              <span className={`summary-amount net-amount ${dailyIncome - dailyExpense >= 0 ? 'positive' : 'negative'}`}>
                {dailyIncome - dailyExpense >= 0 ? '+' : ''}{formatCurrency(dailyIncome - dailyExpense)}
              </span>
            </div>
          </div>

          <div className="premium-card-back-footer">
            <p className="back-footer-text">Yesterday</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PremiumBalanceCard;