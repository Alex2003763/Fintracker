import React, { useState, useEffect, useMemo } from 'react';
import { Budget, Transaction } from '../types';
import { TRANSACTION_CATEGORIES } from '../constants';
import { BudgetIcon } from './icons';
import { formatCurrency } from '../utils/formatters';
import BaseModal from './BaseModal';
import { FormField, Input, Select, Button } from './ModalForm';

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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{[key: string]: string}>({});

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

  const validateForm = () => {
    const newErrors: {[key: string]: string} = {};

    if (!category) {
      newErrors.category = 'Please select a category';
    }

    if (!amount.trim()) {
      newErrors.amount = 'Budget amount is required';
    } else {
      const parsedAmount = parseFloat(amount);
      if (isNaN(parsedAmount) || parsedAmount <= 0) {
        newErrors.amount = 'Please enter a valid amount greater than 0';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const parsedAmount = parseFloat(amount);
      const today = new Date();
      const currentMonthStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;

      await onSaveBudget({
        id: budgetToEditId || undefined,
        category,
        amount: parsedAmount,
        month: currentMonthStr
      });
      resetForm();
    } catch (error) {
      console.error('Error saving budget:', error);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const currentBudgetCategory = useMemo(() => {
      if (!budgetToEditId) return '';
      return budgets.find(b => b.id === budgetToEditId)?.category || '';
  }, [budgetToEditId, budgets]);

  if (!isOpen) return null;
  
  const inputStyle = "block w-full px-3 py-2 bg-[rgb(var(--color-card-muted-rgb))] border border-[rgb(var(--color-border-rgb))] rounded-md text-[rgb(var(--color-text-rgb))] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--color-primary-rgb))] sm:text-sm placeholder:text-[rgb(var(--color-text-muted-rgb))] transition-colors";

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title="Manage Budgets"
      size="lg"
      aria-label="Manage budgets modal"
    >
      <div className="p-6 space-y-6">
        {/* Add/Edit Form */}
        <div className="bg-[rgb(var(--color-card-muted-rgb))] rounded-lg p-4">
          <h3 className="font-semibold text-lg text-[rgb(var(--color-text-rgb))] mb-4">
            {budgetToEditId ? 'Edit Budget' : 'Add New Budget'}
          </h3>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                label="Category"
                htmlFor="budget-category"
                required
                error={errors.category}
              >
                <Select
                  id="budget-category"
                  value={category}
                  onChange={(e) => {
                    setCategory(e.target.value);
                    if (errors.category) setErrors({ ...errors, category: '' });
                  }}
                  error={errors.category}
                >
                  <option value="" disabled>Select a category</option>
                  {budgetToEditId && !availableCategories.includes(currentBudgetCategory) && (
                    <option value={currentBudgetCategory}>{currentBudgetCategory}</option>
                  )}
                  {availableCategories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </Select>
              </FormField>

              <FormField
                label="Budget Amount"
                htmlFor="budget-amount"
                required
                error={errors.amount}
                hint="How much do you want to budget for this category?"
              >
                <Input
                  id="budget-amount"
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={amount}
                  onChange={(e) => {
                    setAmount(e.target.value);
                    if (errors.amount) setErrors({ ...errors, amount: '' });
                  }}
                  placeholder="500.00"
                  error={errors.amount}
                  leftIcon={
                    <span className="text-[rgb(var(--color-text-muted-rgb))] text-sm">$</span>
                  }
                />
              </FormField>
            </div>

            <div className="flex justify-end space-x-3 pt-2">
              {budgetToEditId && (
                <Button
                  type="button"
                  variant="secondary"
                  onClick={resetForm}
                  disabled={isSubmitting}
                >
                  Cancel Edit
                </Button>
              )}
              <Button
                type="submit"
                variant="primary"
                loading={isSubmitting}
              >
                {budgetToEditId ? 'Save Changes' : 'Add Budget'}
              </Button>
            </div>
          </form>
        </div>

        {/* Budgets List */}
        <div className="space-y-3">
          <h3 className="font-semibold text-lg text-[rgb(var(--color-text-rgb))]">
            Current Month Budgets
          </h3>
          <div className="max-h-60 overflow-y-auto space-y-2">
            {currentMonthBudgets.length > 0 ? currentMonthBudgets.map(budget => (
              <div key={budget.id} className="flex items-center justify-between p-4 bg-[rgb(var(--color-card-muted-rgb))] rounded-lg hover:bg-[rgb(var(--color-border-rgb))] transition-colors">
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
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEditClick(budget)}
                    className="text-xs"
                  >
                    Edit
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => onDeleteBudget(budget.id)}
                    className="text-xs"
                  >
                    Delete
                  </Button>
                </div>
              </div>
            )) : (
              <div className="text-center py-8 text-[rgb(var(--color-text-muted-rgb))]">
                <BudgetIcon className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No budgets configured for this month yet.</p>
                <p className="text-sm mt-1">Add your first budget to start tracking your spending.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </BaseModal>
  );
};

export default ManageBudgetsModal;