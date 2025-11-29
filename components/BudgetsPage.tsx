import React, { useMemo } from 'react';
import { Budget, Transaction } from '../types';
import { PlusIcon, PencilIcon } from './icons';
import { formatCurrency } from '../utils/formatters';
import { CATEGORY_ICON_MAP } from '../constants';
import Card, { CardHeader, CardTitle, CardContent } from './Card';

interface BudgetItemProps {
  budget: Budget;
  spent: number;
  onEdit: (budget: Budget) => void;
}

const BudgetItem: React.FC<BudgetItemProps> = ({ budget, spent, onEdit }) => {
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
  const Icon = CATEGORY_ICON_MAP[budget.category] || CATEGORY_ICON_MAP['Other'];

  return (
    <Card className="relative group hover:shadow-md transition-all duration-200 border border-[rgb(var(--color-border-rgb))] hover:border-[rgb(var(--color-primary-rgb))]/20">
      <button
        onClick={() => onEdit(budget)}
        className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center rounded-full bg-[rgb(var(--color-primary-rgb))]/10 text-[rgb(var(--color-primary-rgb))] hover:bg-[rgb(var(--color-primary-rgb))]/20 transition-colors duration-200 opacity-0 group-hover:opacity-100 focus:opacity-100"
        aria-label={`Edit budget for ${budget.category}`}
      >
        <PencilIcon className="h-4 w-4" />
      </button>
      
      <CardContent className="p-4">
        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className={`rounded-full p-2 transition-all duration-200 ${colors.bg} shadow-sm`}>
            <Icon className="h-5 w-5 text-gray-700 dark:text-gray-300" />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-base text-[rgb(var(--color-text-rgb))] capitalize truncate">
                {budget.category}
              </h3>
              <div className={`px-2 py-0.5 rounded-full text-xs font-medium ${progress >= 100 ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' : progress >= 90 ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'}`}>
                {getStatusText()}
              </div>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-[rgb(var(--color-text-muted-rgb))]">
              Progress
            </span>
            <div className={`text-sm font-bold ${getStatusColor()}`}>
              {progressClamped.toFixed(0)}%
            </div>
          </div>

          <div
            className="w-full bg-[rgb(var(--color-border-rgb))] bg-opacity-30 rounded-full h-2.5 overflow-hidden"
            role="progressbar"
            aria-valuenow={Math.round(progressClamped)}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`${budget.category} budget progress`}
          >
            <div
              className="h-full rounded-full transition-all duration-500 ease-out"
              style={{
                width: `${Math.min(progressClamped, 100)}%`,
                backgroundColor: colors.stroke
              }}
            />
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-2 bg-[rgb(var(--color-bg-rgb))] rounded-lg border border-[rgb(var(--color-border-rgb))]">
            <div className="text-xs text-[rgb(var(--color-text-muted-rgb))] mb-1">Budget</div>
            <div className="font-bold text-sm text-[rgb(var(--color-text-rgb))]">
              {formatCurrency(budget.amount)}
            </div>
          </div>

          <div className="p-2 bg-[rgb(var(--color-bg-rgb))] rounded-lg border border-[rgb(var(--color-border-rgb))]">
            <div className="text-xs text-[rgb(var(--color-text-muted-rgb))] mb-1">Spent</div>
            <div className={`font-bold text-sm ${progress >= 100 ? 'text-red-600' : 'text-[rgb(var(--color-text-rgb))]'} `}>
              {formatCurrency(spent)}
            </div>
          </div>
        </div>

        {/* Footer Info */}
        {(remaining > 0 || progress >= 100) && (
          <div className="mt-4 pt-3 border-t border-[rgb(var(--color-border-rgb))]">
            {remaining > 0 && (
              <div className="flex justify-between items-center text-xs">
                <span className="text-green-700 dark:text-green-300 font-medium">Remaining</span>
                <span className="font-bold text-green-600 dark:text-green-400">
                  {formatCurrency(remaining)}
                </span>
              </div>
            )}

            {progress >= 100 && (
              <div className="flex justify-between items-center text-xs">
                <span className="text-red-700 dark:text-red-300 font-medium">Over Budget</span>
                <span className="font-bold text-red-600 dark:text-red-400">
                  {formatCurrency(spent - budget.amount)}
                </span>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

interface BudgetsPageProps {
  budgets: Budget[];
  transactions: Transaction[];
  onManageBudgets: () => void;
  onEditBudget: (budget: Budget) => void;
}

const BudgetsPage: React.FC<BudgetsPageProps> = ({ budgets, transactions, onManageBudgets, onEditBudget }) => {
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
     <div className="space-y-6 max-w-7xl mx-auto px-4 pb-20">
       <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
         <div>
           <h1 className="text-3xl font-bold text-[rgb(var(--color-text-rgb))]">
             Monthly Budgets
           </h1>
           <p className="text-[rgb(var(--color-text-muted-rgb))] mt-1">
             Track your spending against planned budgets
           </p>
         </div>
        <button
          onClick={onManageBudgets}
          className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-[rgb(var(--color-primary-rgb))] rounded-lg shadow-sm hover:bg-[rgb(var(--color-primary-hover-rgb))] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[rgb(var(--color-primary-rgb))] transition-all"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          Manage Budgets
        </button>
      </div>

      <Card className="bg-gradient-to-br from-[rgb(var(--color-card-rgb))] to-[rgb(var(--color-card-muted-rgb))] border-[rgb(var(--color-border-rgb))]">
        <CardContent className="p-6 sm:p-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="flex-1 w-full">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-bold text-lg text-[rgb(var(--color-text-rgb))]">
                  Overall Progress
                </h3>
                <div className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${
                  overallProgress >= 100
                    ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                    : overallProgress >= 90
                    ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                    : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                }`}>
                  {overallProgress >= 100 ? 'Over Budget' : overallProgress >= 90 ? 'Near Limit' : 'On Track'}
                </div>
              </div>
              
              <div className="relative pt-1">
                <div className="flex mb-2 items-center justify-between">
                  <div>
                    <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-[rgb(var(--color-primary-rgb))] bg-[rgb(var(--color-primary-rgb))]/10">
                      {overallProgress.toFixed(0)}% Used
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-semibold inline-block text-[rgb(var(--color-text-muted-rgb))]">
                      {formatCurrency(totalSpent)} / {formatCurrency(totalBudget)}
                    </span>
                  </div>
                </div>
                <div
                  className="overflow-hidden h-4 mb-4 text-xs flex rounded-full bg-[rgb(var(--color-border-rgb))]/50"
                  role="progressbar"
                  aria-valuenow={Math.round(overallProgress)}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label="Overall monthly budget progress"
                >
                  <div style={{ width: `${Math.min(overallProgress, 100)}%` }} className={`shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center transition-all duration-500 ${
                    overallProgress >= 100 ? 'bg-red-500' : overallProgress >= 90 ? 'bg-yellow-500' : 'bg-[rgb(var(--color-primary-rgb))]'
                  }`}></div>
                </div>
              </div>

              <p className="text-sm text-[rgb(var(--color-text-muted-rgb))]">
                {totalBudget > 0 ? (
                  <>{currentMonthBudgets.length} active budget categories this month.</>
                ) : (
                  <>No budgets set for this month.</>
                )}
              </p>
            </div>

            {/* Circular Progress for Desktop */}
            <div className="hidden md:flex items-center justify-center flex-shrink-0">
              <div className="relative w-32 h-32">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    stroke="currentColor"
                    strokeWidth="8"
                    fill="transparent"
                    className="text-[rgb(var(--color-border-rgb))]/30"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    stroke="currentColor"
                    strokeWidth="8"
                    fill="transparent"
                    strokeDasharray={`${2 * Math.PI * 40}`}
                    strokeDashoffset={`${2 * Math.PI * 40 - (Math.min(overallProgress, 100) / 100) * 2 * Math.PI * 40}`}
                    strokeLinecap="round"
                    className={`transition-all duration-1000 ease-out ${
                      overallProgress >= 100 ? 'text-red-500' : overallProgress >= 90 ? 'text-yellow-500' : 'text-[rgb(var(--color-primary-rgb))]'
                    }`}
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center flex-col">
                  <span className="text-2xl font-bold text-[rgb(var(--color-text-rgb))]">{overallProgress.toFixed(0)}%</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {currentMonthBudgets.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {currentMonthBudgets.map(({ budget, spent }) => (
            <BudgetItem
              key={budget.id}
              budget={budget}
              spent={spent}
              onEdit={onEditBudget}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-16 bg-[rgb(var(--color-card-rgb))] rounded-xl border border-[rgb(var(--color-border-rgb))] border-dashed">
          <div className="w-20 h-20 mx-auto mb-6 bg-[rgb(var(--color-bg-rgb))] rounded-full flex items-center justify-center">
            <PlusIcon className="w-10 h-10 text-[rgb(var(--color-text-muted-rgb))]" />
          </div>
          <h2 className="text-xl font-bold text-[rgb(var(--color-text-rgb))] mb-2">
            No budgets set yet
          </h2>
          <p className="text-[rgb(var(--color-text-muted-rgb))] mb-8 max-w-md mx-auto">
            Create a budget to track your spending and save more money.
          </p>
          <button
            onClick={onManageBudgets}
            className="inline-flex items-center px-6 py-3 text-base font-medium text-white bg-[rgb(var(--color-primary-rgb))] rounded-lg shadow-sm hover:bg-[rgb(var(--color-primary-hover-rgb))] transition-colors"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            Create First Budget
          </button>
        </div>
      )}
    </div>
  );
};

export default BudgetsPage;
