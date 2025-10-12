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

  const getProgressBarColor = () => {
    if (progress >= 100) return 'bg-red-500';
    if (progress >= 90) return 'bg-yellow-500';
    return 'bg-[rgb(var(--color-primary-rgb))]';
  };

  const Icon = CATEGORY_ICON_MAP[budget.category] || CATEGORY_ICON_MAP['Other'];

  return (
    <div className="bg-[rgb(var(--color-card-rgb))] p-4 rounded-lg shadow-sm space-y-3 flex flex-col transition-colors">
      <div className="flex justify-between items-center">
        <div className="flex items-center">
            <div className="bg-[rgb(var(--color-card-muted-rgb))] rounded-full p-2 mr-3">
                <Icon className="h-5 w-5 text-[rgb(var(--color-text-muted-rgb))]" />
            </div>
            <h3 className="font-bold text-lg text-[rgb(var(--color-text-rgb))]">{budget.category}</h3>
        </div>
      </div>
      <div>
        <div className="flex justify-between text-sm font-medium text-[rgb(var(--color-text-muted-rgb))] mb-1">
          <span>{formatCurrency(spent)}</span>
          <span className="text-[rgb(var(--color-text-rgb))] font-semibold">{formatCurrency(budget.amount)}</span>
        </div>
        <div className="w-full bg-[rgb(var(--color-border-rgb))] rounded-full h-2.5">
          <div className={`${getProgressBarColor()} h-2.5 rounded-full transition-all duration-500`} style={{ width: `${progressClamped}%` }}></div>
        </div>
        <div className="text-right text-sm text-[rgb(var(--color-text-muted-rgb))] mt-1">
          {formatCurrency(Math.max(0, budget.amount - spent))} remaining
        </div>
      </div>
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
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-[rgb(var(--color-text-rgb))]">Monthly Budgets</h1>
        <button
          onClick={onManageBudgets}
          className="flex items-center px-4 py-2 bg-[rgb(var(--color-primary-rgb))] text-[rgb(var(--color-primary-text-rgb))] font-semibold rounded-lg shadow-md hover:bg-[rgb(var(--color-primary-hover-rgb))] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--color-primary-rgb))] focus:ring-offset-2 transition-colors"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          Manage Budgets
        </button>
      </div>

      <div className="bg-[rgb(var(--color-card-rgb))] p-4 rounded-lg shadow-sm space-y-2 transition-colors">
        <h3 className="font-bold text-lg text-[rgb(var(--color-text-rgb))]">Overall Progress</h3>
        <div className="w-full bg-[rgb(var(--color-border-rgb))] rounded-full h-4">
          <div className="bg-gradient-to-r from-green-400 to-blue-500 h-4 rounded-full" style={{ width: `${Math.min(overallProgress, 100)}%` }}></div>
        </div>
        <p className="text-center text-sm text-[rgb(var(--color-text-muted-rgb))] mt-1">
          You have spent <strong>{formatCurrency(totalSpent)}</strong> of your <strong>{formatCurrency(totalBudget)}</strong> total budget this month.
        </p>
      </div>

      {currentMonthBudgets.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {currentMonthBudgets.map(({ budget, spent }) => (
            <BudgetItem 
              key={budget.id} 
              budget={budget} 
              spent={spent}
            />
          ))}
        </div>
      ) : (
        <div className="text-center bg-[rgb(var(--color-card-rgb))] rounded-lg shadow p-8 mt-6 transition-colors">
          <h2 className="text-xl font-semibold text-[rgb(var(--color-text-rgb))]">No budgets set for this month!</h2>
          <p className="mt-2 text-[rgb(var(--color-text-muted-rgb))]">Click "Manage Budgets" to create your first budget and start tracking your spending.</p>
        </div>
      )}
    </div>
  );
};

export default BudgetsPage;
