import React, { useState, useEffect } from 'react';
import { RecurringTransaction } from '../types';
import { TRANSACTION_CATEGORIES } from '../constants';
import { RecurringIcon, PlusIcon } from './icons';
import { formatCurrency } from '../utils/formatters';
import BaseModal from './BaseModal';
import { FormField, Input, Select, Button, ToggleButton, Tabs } from './ModalForm';

interface ManageRecurringModalProps {
  isOpen: boolean;
  onClose: () => void;
  recurringTransactions: RecurringTransaction[];
  onSaveRecurringTransaction: (transaction: Omit<RecurringTransaction, 'id'> & { id?: string }) => void;
  onDeleteRecurringTransaction: (id: string) => void;
}

const ManageRecurringModal: React.FC<ManageRecurringModalProps> = ({ isOpen, onClose, recurringTransactions, onSaveRecurringTransaction, onDeleteRecurringTransaction }) => {
  const [activeTab, setActiveTab] = useState('add');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [category, setCategory] = useState(TRANSACTION_CATEGORIES.expense['Food & Drink'][0]);
  const [frequency, setFrequency] = useState<'weekly' | 'monthly' | 'yearly'>('monthly');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [itemToEditId, setItemToEditId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{[key: string]: string}>({});

  useEffect(() => {
    if (!isOpen) {
      resetForm();
    }
  }, [isOpen]);

  useEffect(() => {
    const defaultCategory = Object.values(TRANSACTION_CATEGORIES[type])[0][0];
    setCategory(defaultCategory);
  }, [type]);

  const resetForm = () => {
    setDescription('');
    setAmount('');
    setType('expense');
    setFrequency('monthly');
    setStartDate(new Date().toISOString().split('T')[0]);
    setCategory(TRANSACTION_CATEGORIES.expense['Food & Drink'][0]);
    setItemToEditId(null);
    setActiveTab('add');
  };

  const handleEditClick = (rt: RecurringTransaction) => {
    setItemToEditId(rt.id);
    setDescription(rt.description);
    setAmount(rt.amount.toString());
    setType(rt.type);
    setCategory(rt.category);
    setFrequency(rt.frequency);
    setStartDate(new Date(rt.startDate).toISOString().split('T')[0]);
  };

  const validateForm = () => {
    const newErrors: {[key: string]: string} = {};

    if (!description.trim()) {
      newErrors.description = 'Description is required';
    }

    if (!amount.trim()) {
      newErrors.amount = 'Amount is required';
    } else {
      const parsedAmount = parseFloat(amount);
      if (isNaN(parsedAmount) || parsedAmount <= 0) {
        newErrors.amount = 'Please enter a valid amount greater than 0';
      }
    }

    if (!startDate) {
      newErrors.startDate = 'Start date is required';
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

      await onSaveRecurringTransaction({
        id: itemToEditId || undefined,
        description: description.trim(),
        amount: parsedAmount,
        type,
        category,
        frequency,
        startDate,
        nextDueDate: startDate, // The backend logic will process this on next load.
      });
      resetForm();
    } catch (error) {
      console.error('Error saving recurring transaction:', error);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  if (!isOpen) return null;
  
  const inputStyle = "block w-full px-3 py-2 bg-[rgb(var(--color-card-muted-rgb))] border border-[rgb(var(--color-border-rgb))] rounded-md text-[rgb(var(--color-text-rgb))] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--color-primary-rgb))] sm:text-sm placeholder:text-[rgb(var(--color-text-muted-rgb))] transition-colors";

  const tabs = [
    {
      id: 'add',
      label: itemToEditId ? 'Edit Transaction' : 'Add Transaction',
      icon: <PlusIcon className="h-4 w-4" />,
    },
    {
      id: 'all',
      label: 'All Transactions',
      icon: <RecurringIcon className="h-4 w-4" />,
      badge: recurringTransactions.length,
    },
  ];

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title="Manage Recurring Transactions"
      size="xl"
      aria-label="Manage recurring transactions modal"
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
                    <RecurringIcon className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg text-[rgb(var(--color-text-rgb))] mb-1">
                      {itemToEditId ? 'Edit Recurring Transaction' : 'Add New Recurring Transaction'}
                    </h3>
                    <p className="text-sm text-[rgb(var(--color-text-muted-rgb))]">
                      {itemToEditId ? 'Modify your recurring transaction details' : 'Set up automatic income or expense tracking'}
                    </p>
                  </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <FormField
                      label="Description"
                      htmlFor="recurring-description"
                      required
                      error={errors.description}
                      className="lg:col-span-2"
                    >
                      <Input
                        id="recurring-description"
                        type="text"
                        value={description}
                        onChange={(e) => {
                          setDescription(e.target.value);
                          if (errors.description) setErrors({ ...errors, description: '' });
                        }}
                        placeholder="e.g. Monthly Salary, Rent Payment"
                        error={errors.description}
                        className="w-full"
                      />
                    </FormField>

                    <FormField
                      label="Amount"
                      htmlFor="recurring-amount"
                      required
                      error={errors.amount}
                    >
                      <Input
                        id="recurring-amount"
                        type="number"
                        step="0.01"
                        min="0"
                        value={amount}
                        onChange={(e) => {
                          setAmount(e.target.value);
                          if (errors.amount) setErrors({ ...errors, amount: '' });
                        }}
                        placeholder="0.00"
                        error={errors.amount}
                        inputMode="decimal"
                        pattern="[0-9]*"
                        leftIcon={
                          <span className="text-[rgb(var(--color-text-muted-rgb))] font-medium">$</span>
                        }
                        className="w-full"
                      />
                    </FormField>

                    <FormField
                      label="Frequency"
                      htmlFor="recurring-frequency"
                      required
                    >
                      <Select
                        id="recurring-frequency"
                        value={frequency}
                        onChange={(e) => setFrequency(e.target.value as 'weekly' | 'monthly' | 'yearly')}
                        className="w-full"
                      >
                        <option value="weekly">Weekly</option>
                        <option value="monthly">Monthly</option>
                        <option value="yearly">Yearly</option>
                      </Select>
                    </FormField>

                    <FormField
                      label="Start Date"
                      htmlFor="recurring-start-date"
                      required
                      error={errors.startDate}
                    >
                      <Input
                        id="recurring-start-date"
                        type="date"
                        value={startDate}
                        onChange={(e) => {
                          setStartDate(e.target.value);
                          if (errors.startDate) setErrors({ ...errors, startDate: '' });
                        }}
                        error={errors.startDate}
                        className="w-full"
                      />
                    </FormField>

                    <FormField
                      label="Type"
                      htmlFor="recurring-type"
                      required
                      className="lg:col-span-2"
                    >
                      <ToggleButton
                        options={[
                          { value: 'expense', label: 'Expense' },
                          { value: 'income', label: 'Income' }
                        ]}
                        value={type}
                        onChange={(value) => {
                          setType(value as 'income' | 'expense');
                          setCategory(Object.values(TRANSACTION_CATEGORIES[value as 'income' | 'expense'])[0][0]);
                        }}
                      />
                    </FormField>

                    <FormField
                      label="Category"
                      htmlFor="recurring-category"
                      required
                      className="lg:col-span-2"
                    >
                      <Select
                        id="recurring-category"
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        className="w-full"
                      >
                        {Object.entries(TRANSACTION_CATEGORIES[type]).map(([group, subcategories]) => (
                          <optgroup label={group} key={group}>
                            {(subcategories as string[]).map(cat => (
                              <option key={cat} value={cat}>{cat}</option>
                            ))}
                          </optgroup>
                        ))}
                      </Select>
                    </FormField>
                  </div>

                  <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t border-[rgb(var(--color-border-rgb))]">
                    {itemToEditId && (
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
                      {itemToEditId ? 'Save Changes' : 'Add Recurring'}
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
                    <RecurringIcon className="h-5 w-5 text-white" />
                  </div>
                  <h3 className="font-semibold text-lg text-[rgb(var(--color-text-rgb))]">
                    Your Recurring Transactions
                  </h3>
                </div>
                <div className="bg-[rgb(var(--color-primary-rgb))] px-3 py-2 rounded-full shadow-sm">
                  <span className="text-white font-bold text-sm">
                    {recurringTransactions.length} {recurringTransactions.length === 1 ? 'Transaction' : 'Transactions'}
                  </span>
                </div>
              </div>

              <div className="max-h-96 overflow-y-auto border border-[rgb(var(--color-border-rgb))] rounded-xl bg-[rgb(var(--color-card-rgb))]">
                {recurringTransactions.length > 0 ? (
                  <div className="divide-y divide-[rgb(var(--color-border-rgb))]">
                    {recurringTransactions.map(rt => (
                      <div key={rt.id} className="group flex items-center justify-between p-3 hover:bg-gradient-to-r hover:from-[rgb(var(--color-card-muted-rgb))] hover:to-transparent transition-all duration-200 border-b border-[rgb(var(--color-border-rgb))] last:border-b-0">
                        <div className="flex items-center flex-1 min-w-0">
                          <div className={`p-2 rounded-lg mr-3 flex-shrink-0 ${rt.type === 'income' ? 'bg-gradient-to-br from-green-100 to-green-50' : 'bg-gradient-to-br from-red-100 to-red-50'}`}>
                            <RecurringIcon className={`h-4 w-4 ${rt.type === 'income' ? 'text-green-600' : 'text-red-600'}`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-semibold text-[rgb(var(--color-text-rgb))] text-sm truncate mb-0.5">
                              {rt.description}
                            </div>
                            <div className="text-sm text-[rgb(var(--color-text-muted-rgb))] flex items-center">
                              <div className={`w-1.5 h-1.5 rounded-full mr-1.5 ${rt.type === 'income' ? 'bg-green-400' : 'bg-red-400'}`}></div>
                              {rt.category} • {rt.frequency}
                            </div>
                          </div>
                          <div className="text-right ml-3 flex-shrink-0">
                            <div className={`font-bold text-base mb-0.5 ${rt.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                              {rt.type === 'income' ? '+' : '-'}{formatCurrency(rt.amount)}
                            </div>
                            <div className="text-sm text-[rgb(var(--color-text-muted-rgb))]">
                              per {rt.frequency.replace('ly', '')}
                            </div>
                          </div>
                        </div>
                        <div className="flex space-x-2 ml-4">
                          <button
                            onClick={() => {
                              handleEditClick(rt);
                              setActiveTab('add');
                            }}
                            className="px-3 py-1.5 text-sm font-medium text-[rgb(var(--color-primary-rgb))] hover:bg-[rgb(var(--color-primary-rgb))] hover:bg-opacity-5 hover:text-[rgb(var(--color-primary-hover-rgb))] rounded-md transition-all duration-200"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => onDeleteRecurringTransaction(rt.id)}
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
                      <RecurringIcon className="h-8 w-8 text-[rgb(var(--color-text-rgb))]" />
                    </div>
                    <h4 className="text-lg font-semibold text-[rgb(var(--color-text-rgb))] mb-2">
                      No recurring transactions yet
                    </h4>
                    <p className="text-base text-[rgb(var(--color-text-muted-rgb))] mb-4">
                      Automate your financial tracking by setting up recurring income and expenses.
                    </p>
                    <button
                      onClick={() => setActiveTab('add')}
                      className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-[rgb(var(--color-primary-rgb))] to-[rgb(var(--color-primary-hover-rgb))] text-[rgb(var(--color-primary-text-rgb))] font-medium rounded-lg hover:shadow-lg hover:scale-105 transition-all duration-200 text-sm"
                    >
                      <PlusIcon className="h-3 w-3 mr-2" />
                      Add Your First Transaction
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

export default ManageRecurringModal;