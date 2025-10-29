import React, { useState, useEffect, useMemo } from 'react';
import { Budget, Transaction } from '../types';
import { TRANSACTION_CATEGORIES } from '../constants';
import { BudgetIcon, PlusIcon, TrashIcon } from './icons';
import BaseModal from './BaseModal';
import { FormField, Input, Select, Button } from './ModalForm';

interface ManageBudgetsModalProps {
  isOpen: boolean;
  onClose: () => void;
  budgets: Budget[];
  onSaveBudget: (budget: Omit<Budget, 'id'> & { id?: string }) => void;
  onDeleteBudget: (id: string) => void;
  transactions: Transaction[];
  budgetToEdit: Budget | null;
  onOpenConfirmModal: (title: string, message: string, onConfirm: () => void, options?: { confirmText?: string; variant?: 'primary' | 'danger' }) => void;
}

const ManageBudgetsModal: React.FC<ManageBudgetsModalProps> = ({ 
  isOpen, 
  onClose, 
  budgets, 
  onSaveBudget, 
  onDeleteBudget, 
  transactions, 
  budgetToEdit,
  onOpenConfirmModal
}) => {
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{[key: string]: string}>({});

  const { availableCategories } = useMemo(() => {
    const today = new Date();
    const currentMonthStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
    const currentBudgets = budgets.filter(b => b.month === currentMonthStr);
    const budgetedCategories = new Set(currentBudgets.map(b => b.category));
    const allExpenseCategories = Object.values(TRANSACTION_CATEGORIES.expense).flat();
    const available = allExpenseCategories.filter(c => !budgetedCategories.has(c));
    return { availableCategories: available };
  }, [budgets]);

  useEffect(() => {
    if (isOpen) {
      if (budgetToEdit) {
        setAmount(budgetToEdit.amount.toString());
        setCategory(budgetToEdit.category);
      } else {
        setAmount('');
        setCategory(availableCategories[0] ?? '');
      }
      setErrors({});
    }
  }, [isOpen, budgetToEdit, availableCategories]);

  const validateForm = () => {
    const newErrors: {[key: string]: string} = {};
    if (!category) newErrors.category = 'Please select a category';
    if (!amount.trim() || parseFloat(amount) <= 0) newErrors.amount = 'Please enter a valid amount';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      const today = new Date();
      const currentMonthStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
      await onSaveBudget({
        id: budgetToEdit?.id,
        category,
        amount: parseFloat(amount),
        month: currentMonthStr
      });
      onClose();
    } catch (error) {
      console.error('Error saving budget:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = () => {
    if (budgetToEdit) {
      onOpenConfirmModal(
        'Delete Budget',
        `Are you sure you want to delete the budget for ${budgetToEdit.category}? This action cannot be undone.`,
        () => {
          onDeleteBudget(budgetToEdit.id);
          onClose();
        },
        { confirmText: 'Delete', variant: 'danger' }
      );
    }
  };

  if (!isOpen) return null;

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={budgetToEdit ? 'Edit Budget' : 'Add Budget'}
      size="lg"
    >
      <div className="p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <FormField
              label="Category"
              htmlFor="budget-category"
              required
              error={errors.category}
            >
              <Select
                id="budget-category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                disabled={!!budgetToEdit}
              >
                <option value="" disabled>Select a category</option>
                {budgetToEdit && <option value={budgetToEdit.category}>{budgetToEdit.category}</option>}
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
            >
              <Input
                id="budget-amount"
                type="number"
                step="0.01"
                min="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="e.g., 500.00"
                leftIcon={<span className="text-gray-500">$</span>}
              />
            </FormField>
          </div>

          <div className="flex flex-col sm:flex-row justify-end items-center gap-3 pt-6 border-t border-gray-200 dark:border-gray-700">
            {budgetToEdit && (
              <Button
                type="button"
                variant="danger"
                onClick={handleDelete}
                disabled={isSubmitting}
                leftIcon={<TrashIcon className="h-4 w-4" />}
                className="w-full sm:w-auto mr-auto"
              >
                Delete
              </Button>
            )}
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
              disabled={isSubmitting}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              loading={isSubmitting}
              className="w-full sm:w-auto"
            >
              {budgetToEdit ? 'Save Changes' : 'Add Budget'}
            </Button>
          </div>
        </form>
      </div>
    </BaseModal>
  );
};

export default ManageBudgetsModal;