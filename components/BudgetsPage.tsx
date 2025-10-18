import React, { useMemo } from 'react';
import { Budget, Transaction } from '../types';
import { PlusIcon } from './icons';
import { formatCurrency } from '../utils/formatters';
import { CATEGORY_ICON_MAP } from '../constants';

interface BudgetItemProps {
  budget: Budget;
  spent: number;
}

const BudgetItem: React.FC<BudgetItemProps> = ({ budget, spent }) => {
  const progress = budget.amount > 0 ? (spent / budget.amount) * 100 : 0;
  const progressClamped = Math.min(Math.max(progress, 0), 100);
  const remaining = Math.max(0, budget.amount - spent);

  const getProgressColor = () => {
    if (progress >= 100) return { stroke: '#ef4444', bg: '#fee2e2' };
    if (progress >= 90) return { stroke: '#eab308', bg: '#fef3c7' };
    if (progress >= 75) return { stroke: '#f59e0b', bg: '#fef3c7' };
    return { stroke: 'rgb(var(--color-primary-rgb))', bg: 'rgba(var(--color-primary-rgb), 0.1)' };
  };

  const getStatusColor = () => {
    if (progress >= 100) return 'text-red-600';
    if (progress >= 90) return 'text-yellow-600';
    return 'text-green-600';
  };

  const getStatusText = () => {
    if (progress >= 100) return 'Over Budget';
    if (progress >= 90) return 'Near Limit';
    return 'On Track';
  };

  const colors = getProgressColor();
  const circumference = 2 * Math.PI * 40; // radius = 40
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - (progressClamped / 100) * circumference;

  const Icon = CATEGORY_ICON_MAP[budget.category] || CATEGORY_ICON_MAP['Other'];

  return (
    <div className="group bg-[rgb(var(--color-card-rgb))] p-3 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 border border-[rgb(var(--color-border-rgb))] hover:border-[rgb(var(--color-primary-rgb))]/20">
      {/* Line 1: Icon, Category, Status */}
      <div className="flex items-center gap-3 mb-3">
        <div className={`rounded-full p-2 transition-all duration-200 ${colors.bg} shadow-sm`}>
          <Icon className="h-4 w-4 text-gray-700 dark:text-gray-300" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-sm text-[rgb(var(--color-text-rgb))] capitalize truncate">
              {budget.category}
            </h3>
            <div className={`px-2 py-0.5 rounded-full text-xs font-medium ${progress >= 100 ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' : progress >= 90 ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'}`}>
              {getStatusText()}
            </div>
          </div>
        </div>
      </div>

      {/* Line 2: Progress Bar */}
      <div className="mb-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-[rgb(var(--color-text-muted-rgb))]">
            Progress
          </span>
          <div className={`text-sm font-bold ${getStatusColor()}`}>
            {progressClamped.toFixed(0)}%
          </div>
        </div>

        <div className="w-full bg-[rgb(var(--color-border-rgb))] bg-opacity-30 rounded-full h-3">
          <div
            className="h-3 rounded-full transition-all duration-500 ease-out"
            style={{
              width: `${Math.min(progressClamped, 100)}%`,
              backgroundColor: colors.stroke
            }}
          />
        </div>
      </div>

      {/* Line 3: Budget Information */}
      <div className="grid grid-cols-2 gap-2">
        <div className="text-center p-2 bg-[rgb(var(--color-card-muted-rgb))] rounded-md">
          <div className="text-xs text-[rgb(var(--color-text-muted-rgb))] mb-1">Budget</div>
          <div className="font-bold text-sm text-[rgb(var(--color-text-rgb))]">
            {formatCurrency(budget.amount)}
          </div>
        </div>

        <div className="text-center p-2 bg-[rgb(var(--color-card-muted-rgb))] rounded-md">
          <div className="text-xs text-[rgb(var(--color-text-muted-rgb))] mb-1">Spent</div>
          <div className={`font-bold text-sm ${progress >= 100 ? 'text-red-600' : 'text-[rgb(var(--color-text-rgb))]'} `}>
            {formatCurrency(spent)}
          </div>
        </div>
      </div>

      {/* Additional info for remaining/over budget */}
      {(remaining > 0 || progress >= 100) && (
        <div className="mt-3 pt-3 border-t border-[rgb(var(--color-border-rgb))]">
          {remaining > 0 && (
            <div className="flex justify-between items-center text-xs">
              <span className="text-green-700 dark:text-green-300 font-medium">Remaining:</span>
              <span className="font-bold text-green-600 dark:text-green-400">
                {formatCurrency(remaining)}
              </span>
            </div>
          )}

          {progress >= 100 && (
            <div className="flex justify-between items-center text-xs mt-1">
              <span className="text-red-700 dark:text-red-300 font-medium">Over Budget:</span>
              <span className="font-bold text-red-600 dark:text-red-400">
                {formatCurrency(spent - budget.amount)}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

interface BudgetsPageProps {
  budgets: Budget[];
  transactions: Transaction[];
  onManageBudgets: () => void;
}

const BudgetsPage: React.FC<BudgetsPageProps> = ({ budgets, transactions, onManageBudgets }) => {
  const { currentMonthBudgets, totalBudget, totalSpent } = useMemo(() => {
    const today = new Date();
    const currentMonthStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
    
    const currentBudgets = budgets.filter(b => b.month === currentMonthStr);
    
    const monthlyExpenses = transactions.filter(t => {
      const tDate = new Date(t.date);
      return t.type === 'expense' &&
             tDate.getFullYear() === today.getFullYear() &&
             tDate.getMonth() === today.getMonth();
    });

    const spendingByCategory = monthlyExpenses.reduce((acc, t) => {
        acc[t.category] = (acc[t.category] || 0) + t.amount;
        return acc;
    }, {} as { [key: string]: number });

    let totalBudget = 0;
    let totalSpent = 0;

    const budgetDetails = currentBudgets.map(budget => {
      const spent = spendingByCategory[budget.category] || 0;
      totalBudget += budget.amount;
      totalSpent += spent;
      return { budget, spent };
    });

    return { currentMonthBudgets: budgetDetails, totalBudget, totalSpent };
  }, [budgets, transactions]);

  const overallProgress = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-[rgb(var(--color-text-rgb))]">
            Monthly Budgets
          </h1>
          <p className="text-sm text-[rgb(var(--color-text-muted-rgb))]">
            Track your spending against planned budgets
          </p>
        </div>
        <button
          onClick={onManageBudgets}
          className="flex items-center px-3 py-2 text-sm font-medium text-[rgb(var(--color-primary-text-rgb))] bg-[rgb(var(--color-primary-rgb))] rounded-md shadow-sm hover:bg-[rgb(var(--color-primary-hover-rgb))] focus:outline-none focus:ring-1 focus:ring-[rgb(var(--color-primary-rgb))] transition-colors"
        >
          <PlusIcon className="h-4 w-4 mr-1.5" />
          <span className="hidden sm:inline">Manage</span>
          <span className="sm:hidden">Add</span>
        </button>
      </div>

      <div className="bg-gradient-to-br from-[rgb(var(--color-card-rgb))] to-[rgb(var(--color-card-muted-rgb))] p-4 rounded-lg shadow-sm border border-[rgb(var(--color-border-rgb))]">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-bold text-lg text-[rgb(var(--color-text-rgb))]">
              Overall Progress
            </h3>
            <p className="text-xs text-[rgb(var(--color-text-muted-rgb))]">
              Monthly budget performance
            </p>
          </div>
          <div className={`px-2 py-1 rounded-full text-xs font-medium ${
            overallProgress >= 100
              ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
              : overallProgress >= 90
              ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
              : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
          }`}>
            {overallProgress >= 100 ? 'Over' : overallProgress >= 90 ? 'Near Limit' : 'On Track'}
          </div>
        </div>

        {/* Overall Circular Progress */}
        <div className="flex items-center justify-center mb-4">
          <div className="relative w-24 h-24">
            <svg className="w-24 h-24 transform -rotate-90" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="40"
                stroke="rgb(var(--color-border-rgb))"
                strokeWidth="6"
                fill="transparent"
                className="opacity-20"
              />
              <circle
                cx="50"
                cy="50"
                r="40"
                stroke={overallProgress >= 100 ? '#ef4444' : overallProgress >= 90 ? '#eab308' : 'rgb(var(--color-primary-rgb))'}
                strokeWidth="6"
                fill="transparent"
                strokeDasharray={`${2 * Math.PI * 40}`}
                strokeDashoffset={`${2 * Math.PI * 40 - (overallProgress / 100) * 2 * Math.PI * 40}`}
                strokeLinecap="round"
                className="transition-all duration-500 ease-out"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className={`text-2xl font-bold ${overallProgress >= 100 ? 'text-red-600' : overallProgress >= 90 ? 'text-yellow-600' : 'text-green-600'}`}>
                  {overallProgress.toFixed(0)}%
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-3">
          <div className="text-center p-2 bg-[rgb(var(--color-bg-rgb))] rounded-md">
            <p className="text-xs text-[rgb(var(--color-text-muted-rgb))] mb-1">Budget</p>
            <p className="text-sm font-bold text-[rgb(var(--color-text-rgb))]">
              {formatCurrency(totalBudget)}
            </p>
          </div>
          <div className="text-center p-2 bg-[rgb(var(--color-bg-rgb))] rounded-md">
            <p className="text-xs text-[rgb(var(--color-text-muted-rgb))] mb-1">Spent</p>
            <p className={`text-sm font-bold ${overallProgress >= 100 ? 'text-red-600' : 'text-[rgb(var(--color-text-rgb))]'} `}>
              {formatCurrency(totalSpent)}
            </p>
          </div>
        </div>

        <p className="text-center text-xs text-[rgb(var(--color-text-muted-rgb))]">
          {totalBudget > 0 ? (
            <>{currentMonthBudgets.length} categories • {overallProgress.toFixed(0)}% used</>
          ) : (
            <>No budgets set for this month</>
          )}
        </p>
      </div>

      {currentMonthBudgets.length > 0 ? (
        <>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-semibold text-[rgb(var(--color-text-rgb))]">
              Budget Categories
            </h2>
            <div className="text-xs text-[rgb(var(--color-text-muted-rgb))]">
              {currentMonthBudgets.length} active
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3 lg:gap-4">
            {currentMonthBudgets.map(({ budget, spent }) => (
              <BudgetItem
                key={budget.id}
                budget={budget}
                spent={spent}
              />
            ))}
          </div>
        </>
      ) : (
        <div className="text-center bg-gradient-to-br from-[rgb(var(--color-card-rgb))] to-[rgb(var(--color-card-muted-rgb))] rounded-lg shadow-sm p-8 mt-4 border border-[rgb(var(--color-border-rgb))]">
          <div className="w-16 h-16 mx-auto mb-4 bg-[rgb(var(--color-border-rgb))] bg-opacity-20 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-[rgb(var(--color-text-muted-rgb))]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
          </div>

          <h2 className="text-lg font-bold text-[rgb(var(--color-text-rgb))] mb-2">
            No budgets set yet
          </h2>

          <p className="text-sm text-[rgb(var(--color-text-muted-rgb))] mb-4">
            Start building better financial habits by creating your first budget.
          </p>

          <button
            onClick={onManageBudgets}
            className="inline-flex items-center px-4 py-2 text-sm font-medium text-[rgb(var(--color-primary-text-rgb))] bg-[rgb(var(--color-primary-rgb))] rounded-md shadow-sm hover:bg-[rgb(var(--color-primary-hover-rgb))] transition-colors"
          >
            <PlusIcon className="h-4 w-4 mr-2" />
            Create Budget
          </button>
        </div>
      )}
    </div>
  );
};

export default BudgetsPage;

