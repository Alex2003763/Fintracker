import React, { useState, useEffect, useMemo } from 'react';
import { Budget, Transaction } from '../types';
import { TRANSACTION_CATEGORIES } from '../constants';
import { BudgetIcon } from './icons';
import { formatCurrency } from '../utils/formatters';

interface ManageBudgetsModalProps {
  isOpen: boolean;
  onClose: () => void;
  budgets: Budget[];
  onSaveBudget: (budget: Omit<Budget, 'id'> & { id?: string }) => void;
  onDeleteBudget: (id: string) => void;
  transactions: Transaction[];
}

const ManageBudgetsModal: React.FC<ManageBudgetsModalProps> = ({ isOpen, onClose, budgets, onSaveBudget, onDeleteBudget, transactions }) => {
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [budgetToEditId, setBudgetToEditId] = useState<string | null>(null);

  const { currentMonthBudgets, availableCategories } = useMemo(() => {
    const today = new Date();
    const currentMonthStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
    const currentBudgets = budgets.filter(b => b.month === currentMonthStr);
    const budgetedCategories = new Set(currentBudgets.map(b => b.category));
    const allExpenseCategories = Object.values(TRANSACTION_CATEGORIES.expense).flat();
    const available = allExpenseCategories.filter(c => !budgetedCategories.has(c));
    return { currentMonthBudgets: currentBudgets, availableCategories: available };
  }, [budgets]);
  
  const resetForm = () => {
    setAmount('');
    setCategory(availableCategories[0] || '');
    setBudgetToEditId(null);
  };
  
  useEffect(() => {
    if (isOpen && !budgetToEditId) {
      setCategory(availableCategories[0] || '');
    } else if (!isOpen) {
        resetForm();
    }
  }, [isOpen, budgetToEditId, availableCategories]);

  const handleEditClick = (budget: Budget) => {
    setBudgetToEditId(budget.id);
    setAmount(budget.amount.toString());
    setCategory(budget.category);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(amount);
    if (!category || isNaN(parsedAmount) || parsedAmount <= 0) {
      alert('Please fill all fields with valid values.');
      return;
    }
    const today = new Date();
    const currentMonthStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;

    onSaveBudget({ 
      id: budgetToEditId || undefined, 
      category, 
      amount: parsedAmount, 
      month: currentMonthStr 
    });
    resetForm();
  };
  
  const currentBudgetCategory = useMemo(() => {
      if (!budgetToEditId) return '';
      return budgets.find(b => b.id === budgetToEditId)?.category || '';
  }, [budgetToEditId, budgets]);

  if (!isOpen) return null;
  
  const inputStyle = "block w-full px-3 py-2 bg-[rgb(var(--color-card-muted-rgb))] border border-[rgb(var(--color-border-rgb))] rounded-md text-[rgb(var(--color-text-rgb))] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--color-primary-rgb))] sm:text-sm placeholder:text-[rgb(var(--color-text-muted-rgb))] transition-colors";

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-[rgb(var(--color-card-rgb))] rounded-2xl shadow-lg p-6 md:p-8 w-full max-w-lg transition-colors max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-[rgb(var(--color-text-rgb))]">Manage Budgets</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 mb-6 bg-[rgb(var(--color-card-muted-rgb))] rounded-lg space-y-4">
          <h3 className="font-semibold text-lg text-[rgb(var(--color-text-rgb))]">{budgetToEditId ? 'Edit Budget' : 'Add New Budget'}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <select value={category} onChange={e => setCategory(e.target.value)} required className={inputStyle}>
                <option value="" disabled>Select a category</option>
                {budgetToEditId && !availableCategories.includes(currentBudgetCategory) && (
                    <option value={currentBudgetCategory}>{currentBudgetCategory}</option>
                )}
                {availableCategories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                ))}
            </select>
            <input type="number" placeholder="Amount ($)" value={amount} onChange={e => setAmount(e.target.value)} required className={inputStyle} min="0.01" step="0.01"/>
          </div>
          <div className="flex justify-end space-x-2 pt-2">
            {budgetToEditId && <button type="button" onClick={resetForm} className="px-4 py-2 text-sm font-medium text-[rgb(var(--color-text-rgb))] bg-[rgb(var(--color-border-rgb))] rounded-lg hover:bg-[rgba(var(--color-border-rgb),0.8)] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500">Cancel Edit</button>}
            <button type="submit" className="px-4 py-2 text-sm font-medium text-[rgb(var(--color-primary-text-rgb))] bg-[rgb(var(--color-primary-rgb))] rounded-lg hover:bg-[rgb(var(--color-primary-hover-rgb))] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[rgb(var(--color-primary-rgb))]">{budgetToEditId ? 'Save Changes' : 'Add Budget'}</button>
          </div>
        </form>

        <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
          {currentMonthBudgets.length > 0 ? currentMonthBudgets.map(budget => (
            <div key={budget.id} className="flex items-center justify-between p-3 bg-[rgb(var(--color-card-muted-rgb))] rounded-lg">
                <div className="flex items-center">
                    <BudgetIcon className="h-5 w-5 mr-3 text-[rgb(var(--color-text-muted-rgb))]" />
                    <div>
                        <p className="font-semibold text-[rgb(var(--color-text-rgb))]">{budget.category}</p>
                        <p className="text-sm text-[rgb(var(--color-text-muted-rgb))]">
                            Budget: {formatCurrency(budget.amount)}
                        </p>
                    </div>
                </div>
                <div className="flex space-x-2">
                    <button onClick={() => handleEditClick(budget)} className="text-xs font-semibold text-[rgb(var(--color-primary-subtle-text-rgb))] hover:underline">EDIT</button>
                    <button onClick={() => onDeleteBudget(budget.id)} className="text-xs font-semibold text-red-500 hover:underline">DELETE</button>
                </div>
            </div>
          )) : <p className="text-center text-[rgb(var(--color-text-muted-rgb))] py-4">No budgets configured for this month yet.</p>}
        </div>
      </div>
    </div>
  );
};

export default ManageBudgetsModal;