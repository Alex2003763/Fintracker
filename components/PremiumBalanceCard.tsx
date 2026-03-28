import React, { useState, useCallback, useMemo } from 'react';
import { Transaction } from '../types';
import { formatCurrency } from '../utils/formatters';
import { SalaryIcon, CartIcon } from './icons';
import { useTheme } from './ThemeContext';
import './PremiumBalanceCard.css';

interface PremiumBalanceCardProps {
  transactions: Transaction[];
  onAddTransaction: (type?: 'income' | 'expense') => void;
  setActiveItem: (item: string) => void;
  className?: string;
}

const PremiumBalanceCard: React.FC<PremiumBalanceCardProps> = React.memo(({
  transactions,
  onAddTransaction,
  setActiveItem,
  className = '',
}) => {
  const [isFlipped, setIsFlipped] = useState(false);
  const { customBackground } = useTheme();

  const { balance, dailyChange, dailyIncome, dailyExpense } = useMemo(() => {
    const currentBalance = transactions.reduce(
      (sum, t) => sum + (t.type === 'income' ? t.amount : -t.amount), 0
    );

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);

    let income = 0;
    let expense = 0;
    let hasYesterdayData = false;

    transactions.forEach(t => {
      const tDate = new Date(t.date);
      tDate.setHours(0, 0, 0, 0);
      if (tDate.getTime() === yesterday.getTime()) {
        hasYesterdayData = true;
        if (t.type === 'income') income += t.amount;
        else expense += t.amount;
      }
    });

    if (!hasYesterdayData) {
      return { balance: currentBalance, dailyChange: 0, dailyIncome: 0, dailyExpense: 0 };
    }

    const changeYesterday = income - expense;
    const previousBalance = currentBalance - changeYesterday;
    let percentageChange = 0;
    if (Math.abs(previousBalance) > 0.01) {
      percentageChange = Math.max(-999, Math.min(999, (changeYesterday / Math.abs(previousBalance)) * 100));
    }

    return { balance: currentBalance, dailyChange: percentageChange, dailyIncome: income, dailyExpense: expense };
  }, [transactions]);

  const isPositive = dailyChange >= 0;
  const sign = isPositive ? '+' : '';
  const net = dailyIncome - dailyExpense;

  const handleFlip = useCallback(() => setIsFlipped(prev => !prev), []);

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
        aria-label={isFlipped ? 'Flip to balance view' : 'Flip to daily summary'}
        aria-pressed={isFlipped}
        style={customBackground ? { backgroundImage: `url('${customBackground}')`, backgroundSize: 'cover', backgroundPosition: 'center' } : {}}
      >
        {/* ── FRONT ── */}
        <div className="premium-card-front">
          {/* Decorative orbs */}
          <div className="card-orb card-orb-1" />
          <div className="card-orb card-orb-2" />
          {/* Shimmer overlay */}
          <div className="card-shimmer" />

          {/* Header */}
          <div className="premium-card-header">
            <div className="premium-card-logo">
              <span className="logo-icon">◈</span>
              Fintracker
            </div>
            <div className="premium-card-top-right">
              {/* Change badge */}
              <div className={`daily-change ${isPositive ? 'change-positive' : 'change-negative'}`}>
                <svg className="change-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path
                    strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5}
                    d={isPositive ? 'M7 17L17 7M17 7H7M17 7v10' : 'M7 7l10 10M17 17H7M17 17V7'}
                  />
                </svg>
                {sign}{dailyChange.toFixed(1)}%
              </div>
              {/* Flip button */}
              <button
                className="premium-card-flip-button"
                onClick={(e) => { e.stopPropagation(); handleFlip(); }}
                aria-label="View daily summary"
                tabIndex={-1}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" width="14" height="14">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
            </div>
          </div>

          {/* Balance */}
          <div className="premium-card-balance">
            <span className="balance-label">Total Balance</span>
            <div className="premium-card-balance-row">
              <span className="balance-amount">{formatCurrency(balance)}</span>
              {/* EMV Chip */}
              <div className="premium-card-chip">
                <div className="chip-lines">
                  <div className="chip-line" />
                  <div className="chip-line" />
                  <div className="chip-line" />
                </div>
              </div>
            </div>
          </div>

          {/* Action Bar */}
          <div className="premium-card-actions">
            <button
              className="action-button income-button"
              onClick={(e) => { e.stopPropagation(); onAddTransaction('income'); }}
              aria-label="Add Income"
            >
              <SalaryIcon className="action-icon" />
              <span className="action-label">Income</span>
            </button>
            <button
              className="action-button expense-button"
              onClick={(e) => { e.stopPropagation(); onAddTransaction('expense'); }}
              aria-label="Add Expense"
            >
              <CartIcon className="action-icon" />
              <span className="action-label">Expense</span>
            </button>
          </div>
        </div>

        {/* ── BACK ── */}
        <div className="premium-card-back">
          <div className="card-orb card-orb-back-1" />
          <div className="card-orb card-orb-back-2" />

          <div className="premium-card-back-header">
            <div>
              <p className="back-subtitle">Yesterday's Activity</p>
              <h3 className="back-title">Daily Summary</h3>
            </div>
            <button
              className="back-close-button"
              onClick={(e) => { e.stopPropagation(); handleFlip(); }}
              aria-label="Flip to front"
              tabIndex={-1}
            >
              <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="premium-card-summary">
            {/* Income row */}
            <div className="summary-item">
              <div className="summary-item-left">
                <div className="summary-dot dot-income" />
                <span className="summary-label income-label">Income</span>
              </div>
              <span className="summary-amount income-amount">{formatCurrency(dailyIncome)}</span>
            </div>

            {/* Expense row */}
            <div className="summary-item">
              <div className="summary-item-left">
                <div className="summary-dot dot-expense" />
                <span className="summary-label expense-label">Expenses</span>
              </div>
              <span className="summary-amount expense-amount">{formatCurrency(dailyExpense)}</span>
            </div>

            <div className="summary-divider" />

            {/* Net row */}
            <div className="summary-item summary-item-net">
              <div className="summary-item-left">
                <div className={`summary-dot ${net >= 0 ? 'dot-positive' : 'dot-negative'}`} />
                <span className="summary-label net-label">Net</span>
              </div>
              <span className={`summary-amount net-amount ${net >= 0 ? 'positive' : 'negative'}`}>
                {net >= 0 ? '+' : ''}{formatCurrency(net)}
              </span>
            </div>
          </div>

          {/* Mini bar chart */}
          {(dailyIncome > 0 || dailyExpense > 0) && (
            <div className="summary-bar-chart">
              <div
                className="bar-segment bar-income"
                style={{ flex: dailyIncome || 0.001 }}
                title={`Income: ${formatCurrency(dailyIncome)}`}
              />
              <div
                className="bar-segment bar-expense"
                style={{ flex: dailyExpense || 0.001 }}
                title={`Expense: ${formatCurrency(dailyExpense)}`}
              />
            </div>
          )}

          <div className="premium-card-back-footer">
            <p className="back-footer-text">Tap card to flip back</p>
          </div>
        </div>
      </div>
    </div>
  );
});

PremiumBalanceCard.displayName = 'PremiumBalanceCard';
export default PremiumBalanceCard;