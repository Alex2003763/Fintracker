import React, { useState, useEffect, useMemo } from 'react';
import { Budget, Transaction } from '../types';
import { TRANSACTION_CATEGORIES } from '../constants';
import { BudgetIcon, PlusIcon } from './icons';
import { formatCurrency } from '../utils/formatters';
import BaseModal from './BaseModal';
import { FormField, Input, Select, Button, Tabs } from './ModalForm';

interface ManageBudgetsModalProps {
  isOpen: boolean;
  onClose: () => void;
  budgets: Budget[];
  onSaveBudget: (budget: Omit<Budget, 'id'> & { id?: string }) => void;
  onDeleteBudget: (id: string) => void;
  transactions: Transaction[];
}

const ManageBudgetsModal: React.FC<ManageBudgetsModalProps> = ({ isOpen, onClose, budgets, onSaveBudget, onDeleteBudget, transactions }) => {
  const [activeTab, setActiveTab] = useState('add');
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
    setActiveTab('add');
  };

  useEffect(() => {
    if (isOpen && !budgetToEditId) {
      setCategory(availableCategories[0] || '');
      setActiveTab('add');
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

  const tabs = [
    {
      id: 'add',
      label: budgetToEditId ? 'Edit Budget' : 'Add Budget',
      icon: <PlusIcon className="h-4 w-4" />,
    },
    {
      id: 'all',
      label: 'All Budgets',
      icon: <BudgetIcon className="h-4 w-4" />,
      badge: currentMonthBudgets.length,
    },
  ];

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title="Manage Budgets"
      size="xl"
      aria-label="Manage budgets modal"
    >
      <div className="flex flex-col h-full max-h-[80vh]">
        <Tabs
          tabs={tabs}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          className="px-4 sm:px-6"
        />

        <div className="flex-1 overflow-y-auto bg-gradient-to-b from-[rgb(var(--color-card-rgb))] to-[rgb(var(--color-card-muted-rgb))]">
          {activeTab === 'add' && (
            <div className="p-3 sm:p-4 animate-in slide-in-from-top duration-300">
              <div className="bg-[rgb(var(--color-card-muted-rgb))] rounded-lg p-3 sm:p-4 border border-[rgb(var(--color-border-rgb))] shadow-md">
                <div className="flex items-center mb-6">
                  <div className="bg-gradient-to-br from-[rgb(var(--color-primary-rgb))] to-[rgb(var(--color-primary-hover-rgb))] bg-opacity-20 p-3 rounded-xl mr-4 shadow-sm">
                    <BudgetIcon className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg text-[rgb(var(--color-text-rgb))] mb-1">
                      {budgetToEditId ? 'Edit Budget' : 'Add New Budget'}
                    </h3>
                    <p className="text-sm text-[rgb(var(--color-text-muted-rgb))]">
                      {budgetToEditId ? 'Modify your budget details below' : 'Create a new budget for better financial tracking'}
                    </p>
                  </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <FormField
                      label="Category"
                      htmlFor="budget-category"
                      required
                      error={errors.category}
                      className="lg:col-span-1"
                    >
                      <Select
                        id="budget-category"
                        value={category}
                        onChange={(e) => {
                          setCategory(e.target.value);
                          if (errors.category) setErrors({ ...errors, category: '' });
                        }}
                        error={errors.category}
                        className="w-full"
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
                      className="lg:col-span-1"
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
                        inputMode="decimal"
                        pattern="[0-9]*"
                        leftIcon={
                          <span className="text-[rgb(var(--color-text-muted-rgb))] font-medium">$</span>
                        }
                        className="w-full"
                      />
                    </FormField>
                  </div>

                  <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t border-[rgb(var(--color-border-rgb))]">
                    {budgetToEditId && (
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={resetForm}
                        disabled={isSubmitting}
                        className="w-full sm:w-auto order-2 sm:order-1 hover:scale-105 transition-transform duration-200"
                      >
                        Cancel Edit
                      </Button>
                    )}
                    <Button
                      type="submit"
                      variant="primary"
                      loading={isSubmitting}
                      className="w-full sm:w-auto order-1 sm:order-2 hover:scale-105 transition-transform duration-200"
                    >
                      {budgetToEditId ? 'Save Changes' : 'Add Budget'}
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {activeTab === 'all' && (
            <div className="p-3 sm:p-4 space-y-3 animate-in slide-in-from-bottom duration-300">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center">
                  <div className="bg-gradient-to-br from-[rgb(var(--color-primary-rgb))] to-[rgb(var(--color-primary-hover-rgb))] bg-opacity-20 p-2 rounded-lg mr-3">
                    <BudgetIcon className="h-5 w-5 text-white" />
                  </div>
                  <h3 className="font-semibold text-lg text-[rgb(var(--color-text-rgb))]">
                    Current Month Budgets
                  </h3>
                </div>
                <div className="bg-[rgb(var(--color-primary-rgb))] px-3 py-2 rounded-full shadow-sm">
                  <span className="text-white font-bold text-sm">
                    {currentMonthBudgets.length} {currentMonthBudgets.length === 1 ? 'Budget' : 'Budgets'}
                  </span>
                </div>
              </div>

              <div className="max-h-96 overflow-y-auto border border-[rgb(var(--color-border-rgb))] rounded-xl bg-[rgb(var(--color-card-rgb))]">
                {currentMonthBudgets.length > 0 ? (
                  <div className="divide-y divide-[rgb(var(--color-border-rgb))]">
                    {currentMonthBudgets.map(budget => (
                      <div key={budget.id} className="group flex items-center justify-between p-3 hover:bg-gradient-to-r hover:from-[rgb(var(--color-card-muted-rgb))] hover:to-transparent transition-all duration-200 border-b border-[rgb(var(--color-border-rgb))] last:border-b-0">
                        <div className="flex items-center flex-1 min-w-0">
                          <div className="bg-gradient-to-br from-[rgb(var(--color-primary-rgb))] to-[rgb(var(--color-primary-hover-rgb))] bg-opacity-20 p-2 rounded-lg mr-3 flex-shrink-0">
                            <BudgetIcon className="h-4 w-4 text-white" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-semibold text-[rgb(var(--color-text-rgb))] text-sm truncate mb-0.5">
                              {budget.category}
                            </div>
                            <div className="text-sm text-[rgb(var(--color-text-muted-rgb))] flex items-center">
                              <div className="w-1.5 h-1.5 bg-[rgb(var(--color-primary-rgb))] bg-opacity-30 rounded-full mr-1.5"></div>
                              Monthly budget target
                            </div>
                          </div>
                          <div className="text-right ml-3 flex-shrink-0">
                            <div className="font-bold text-[rgb(var(--color-text-rgb))] text-base mb-0.5">
                              {formatCurrency(budget.amount)}
                            </div>
                            <div className="text-sm text-[rgb(var(--color-text-muted-rgb))]">
                              per month
                            </div>
                          </div>
                        </div>
                        <div className="flex space-x-2 ml-4">
                          <button
                            onClick={() => {
                              handleEditClick(budget);
                              setActiveTab('add');
                            }}
                            className="px-3 py-1.5 text-sm font-medium text-[rgb(var(--color-primary-rgb))] hover:bg-[rgb(var(--color-primary-rgb))] hover:bg-opacity-5 hover:text-[rgb(var(--color-primary-hover-rgb))] rounded-md transition-all duration-200"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => onDeleteBudget(budget.id)}
                            className="px-3 py-1.5 text-sm font-medium text-red-500 hover:bg-red-50 hover:text-red-600 rounded-md transition-all duration-200"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 text-center">
                    <div className="bg-gradient-to-br from-[rgb(var(--color-card-muted-rgb))] to-[rgb(var(--color-border-rgb))] rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                      <BudgetIcon className="h-8 w-8 text-[rgb(var(--color-text-rgb))]" />
                    </div>
                    <h4 className="text-lg font-semibold text-[rgb(var(--color-text-rgb))] mb-2">
                      No budgets yet
                    </h4>
                    <p className="text-base text-[rgb(var(--color-text-muted-rgb))] mb-4">
                      Start building better financial habits by creating your first budget.
                    </p>
                    <button
                      onClick={() => setActiveTab('add')}
                      className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-[rgb(var(--color-primary-rgb))] to-[rgb(var(--color-primary-hover-rgb))] text-[rgb(var(--color-primary-text-rgb))] font-medium rounded-lg hover:shadow-lg hover:scale-105 transition-all duration-200 text-sm"
                    >
                      <PlusIcon className="h-3 w-3 mr-2" />
                      Create Your First Budget
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </BaseModal>
  );
};

export default ManageBudgetsModal;