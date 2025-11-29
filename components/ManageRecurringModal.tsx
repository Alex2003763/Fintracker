import React, { useState, useEffect } from 'react';
import { RecurringTransaction, SubCategory } from '../types';
import { TRANSACTION_CATEGORIES } from '../constants';
import { RecurringIcon, PlusIcon, SettingsIcon } from './icons';
import { formatCurrency } from '../utils/formatters';
import BaseModal from './BaseModal';
import ConfirmationModal from './ConfirmationModal';
import { FormField, Input, Select, Button, ToggleButton, Tabs } from './ModalForm';

interface ManageRecurringModalProps {
  isOpen: boolean;
  onClose: () => void;
  recurringTransactions: RecurringTransaction[];
  onSaveRecurringTransaction: (transaction: Omit<RecurringTransaction, 'id'> & { id?: string }) => void;
  onDeleteRecurringTransaction: (id: string) => void;
}

const ManageRecurringModal: React.FC<ManageRecurringModalProps> = ({
  isOpen,
  onClose,
  recurringTransactions,
  onSaveRecurringTransaction,
  onDeleteRecurringTransaction
}) => {
  const [activeTab, setActiveTab] = useState('add');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [category, setCategory] = useState(TRANSACTION_CATEGORIES.expense['Food & Drink'][0].name);
  const [frequency, setFrequency] = useState<'weekly' | 'monthly' | 'yearly'>('monthly');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [itemToEditId, setItemToEditId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<RecurringTransaction | null>(null);

  useEffect(() => {
    if (!isOpen) {
      resetForm();
    }
  }, [isOpen]);

  useEffect(() => {
    const defaultCategory = Object.values(TRANSACTION_CATEGORIES[type])[0][0];
    setCategory(defaultCategory.name);
  }, [type]);

  const resetForm = () => {
    setDescription('');
    setAmount('');
    setType('expense');
    setFrequency('monthly');
    setStartDate(new Date().toISOString().split('T')[0]);
    setCategory(TRANSACTION_CATEGORIES.expense['Food & Drink'][0].name);
    setItemToEditId(null);
    setActiveTab('add');
    setErrors({});
  };

  const handleDeleteClick = (transaction: RecurringTransaction) => {
    setItemToDelete(transaction);
    setShowDeleteConfirm(true);
  };

  const handleDeleteConfirm = async () => {
    if (itemToDelete) {
      await onDeleteRecurringTransaction(itemToDelete.id);
      setShowDeleteConfirm(false);
      setItemToDelete(null);
      resetForm();
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteConfirm(false);
    setItemToDelete(null);
  };

  const handleEditClick = (rt: RecurringTransaction) => {
    setItemToEditId(rt.id);
    setDescription(rt.description);
    setAmount(rt.amount.toString());
    setType(rt.type);
    setCategory(rt.category);
    setFrequency(rt.frequency);
    setStartDate(new Date(rt.startDate).toISOString().split('T')[0]);
    setActiveTab('add');
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
        nextDueDate: startDate,
      });
      resetForm();
    } catch (error) {
      console.error('Error saving recurring transaction:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

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
      animation="slide-up"
      aria-label="Manage recurring transactions modal"
    >
      <div className="flex flex-col h-full max-h-[85vh]">
        <Tabs
          tabs={tabs}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          className="px-4 sm:px-6"
        />

        <div className="flex-1 overflow-y-auto">
          {activeTab === 'add' && (
            <div className="p-4 sm:p-6">
              <div className="max-w-2xl mx-auto">
                {/* Header Card */}
                <div className="bg-gradient-to-br from-[rgb(var(--color-primary-rgb))]/10 to-[rgb(var(--color-primary-rgb))]/5 rounded-2xl p-6 mb-6 border border-[rgb(var(--color-primary-rgb))]/20">
                  <div className="flex items-center gap-4">
                    <div className="bg-gradient-to-br from-[rgb(var(--color-primary-rgb))] to-[rgb(var(--color-primary-hover-rgb))] p-3 rounded-xl shadow-lg">
                      <RecurringIcon className="h-6 w-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-xl text-[rgb(var(--color-text-rgb))] mb-1">
                        {itemToEditId ? 'Edit Recurring Transaction' : 'Add New Recurring Transaction'}
                      </h3>
                      <p className="text-sm text-[rgb(var(--color-text-muted-rgb))]">
                        {itemToEditId ? 'Modify your recurring transaction details' : 'Set up automatic income or expense tracking'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Form Card */}
                <div className="bg-[rgb(var(--color-card-rgb))] rounded-2xl border border-[rgb(var(--color-border-rgb))] shadow-sm p-6">
                  <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Description - Full Width */}
                    <FormField
                      label="Description"
                      htmlFor="recurring-description"
                      required
                      error={errors.description}
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
                        className="text-base"
                      />
                    </FormField>

                    {/* Amount and Frequency Row */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                            <span className="text-[rgb(var(--color-text-muted-rgb))] font-semibold text-lg">$</span>
                          }
                          className="text-base"
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
                          className="text-base"
                        >
                          <option value="weekly">Weekly</option>
                          <option value="monthly">Monthly</option>
                          <option value="yearly">Yearly</option>
                        </Select>
                      </FormField>
                    </div>

                    {/* Start Date */}
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
                        className="text-base"
                      />
                    </FormField>

                    {/* Type Toggle - Full Width */}
                    <FormField
                      label="Type"
                      htmlFor="recurring-type"
                      required
                    >
                      <ToggleButton
                        options={[
                          { value: 'expense', label: '💸 Expense' },
                          { value: 'income', label: '💰 Income' }
                        ]}
                        value={type}
                        onChange={(value) => {
                          setType(value as 'income' | 'expense');
                          setCategory(Object.values(TRANSACTION_CATEGORIES[value as 'income' | 'expense'])[0][0].name);
                        }}
                      />
                    </FormField>

                    {/* Category - Full Width */}
                    <FormField
                      label="Category"
                      htmlFor="recurring-category"
                      required
                    >
                      <Select
                        id="recurring-category"
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        className="text-base"
                      >
                        {Object.entries(TRANSACTION_CATEGORIES[type]).map(([group, subcategories]) => (
                          <optgroup label={group} key={group}>
                            {(subcategories as SubCategory[]).map(cat => (
                              <option key={cat.name} value={cat.name}>{cat.name}</option>
                            ))}
                          </optgroup>
                        ))}
                      </Select>
                    </FormField>

                    {/* Action Buttons */}
                    <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-[rgb(var(--color-border-rgb))]">
                      {itemToEditId && (
                        <>
                          <Button
                            type="button"
                            variant="danger"
                            onClick={() => {
                              const transaction = recurringTransactions.find(t => t.id === itemToEditId);
                              if (transaction) {
                                handleDeleteClick(transaction);
                              }
                            }}
                            disabled={isSubmitting}
                            className="flex-1 sm:flex-none order-3 sm:order-1"
                          >
                            Delete Transaction
                          </Button>
                          <Button
                            type="button"
                            variant="secondary"
                            onClick={resetForm}
                            disabled={isSubmitting}
                            className="flex-1 sm:flex-none order-2 sm:order-2"
                          >
                            Cancel Edit
                          </Button>
                        </>
                      )}
                      <Button
                        type="submit"
                        variant="primary"
                        loading={isSubmitting}
                        className={`min-h-[48px] ${itemToEditId ? 'flex-1 sm:flex-none order-1 sm:order-3' : 'flex-1 sm:flex-none'}`}
                      >
                        {itemToEditId ? 'Save Changes' : 'Add Recurring Transaction'}
                      </Button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'all' && (
            <div className="p-4 sm:p-6">
              <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="flex flex-col sm:flex-row items-center justify-between mb-6 gap-4">
                  <div className="flex items-center gap-3">
                    <div className="bg-[rgb(var(--color-primary-rgb))] p-3 rounded-xl">
                      <RecurringIcon className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg sm:text-xl text-[rgb(var(--color-text-rgb))]">
                        Recurring Transactions
                      </h3>
                      <p className="text-sm text-[rgb(var(--color-text-muted-rgb))]">
                        {recurringTransactions.length} {recurringTransactions.length === 1 ? 'transaction' : 'transactions'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Transactions List */}
                <div className="space-y-4">
                  {recurringTransactions.length > 0 ? (
                    recurringTransactions.map(rt => (
                      <button
                        key={rt.id}
                        onClick={() => handleEditClick(rt)}
                        className="w-full text-left bg-[rgb(var(--color-card-rgb))] rounded-2xl border border-[rgb(var(--color-border-rgb))] p-5 hover:shadow-md hover:border-[rgb(var(--color-primary-rgb))]/30 transition-all duration-200 group"
                      >
                        <div className="flex items-center gap-4">
                          {/* Icon & Basic Info */}
                          <div className={`p-3 rounded-xl flex-shrink-0 group-hover:scale-105 transition-transform duration-200 ${
                            rt.type === 'income'
                              ? 'bg-green-50 border border-green-200'
                              : 'bg-red-50 border border-red-200'
                          }`}>
                            <RecurringIcon className={`h-5 w-5 ${
                              rt.type === 'income' ? 'text-green-600' : 'text-red-600'
                            }`} />
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-3 mb-2">
                              <h4 className="font-semibold text-[rgb(var(--color-text-rgb))] text-base sm:text-lg truncate group-hover:text-[rgb(var(--color-primary-rgb))] transition-colors">
                                {rt.description}
                              </h4>
                              <div className={`px-2 py-1 rounded-lg text-xs font-medium ${
                                rt.type === 'income'
                                  ? 'bg-green-100 text-green-700'
                                  : 'bg-red-100 text-red-700'
                              }`}>
                                {rt.type}
                              </div>
                            </div>
                            <div className="flex items-center gap-4 text-sm text-[rgb(var(--color-text-muted-rgb))]">
                              <span className="flex items-center gap-2">
                                <div className={`w-2 h-2 rounded-full ${
                                  rt.type === 'income' ? 'bg-green-400' : 'bg-red-400'
                                }`}></div>
                                {rt.category}
                              </span>
                              <span className="capitalize">{rt.frequency.replace('ly', '')}</span>
                            </div>
                          </div>

                          {/* Amount */}
                          <div className="text-right flex-shrink-0">
                            <div className={`font-bold text-lg sm:text-xl group-hover:scale-105 transition-transform duration-200 ${
                              rt.type === 'income' ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {rt.type === 'income' ? '+' : '-'}{formatCurrency(rt.amount)}
                            </div>
                            <div className="text-xs sm:text-sm text-[rgb(var(--color-text-muted-rgb))]">
                              per {rt.frequency.replace('ly', '')}
                            </div>
                          </div>
                        </div>
                      </button>
                    ))
                  ) : (
                    <div className="text-center py-8 sm:py-12">
                      <div className="bg-[rgb(var(--color-card-muted-rgb))] rounded-full p-4 w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-4 flex items-center justify-center">
                        <RecurringIcon className="h-8 w-8 sm:h-10 sm:w-10 text-[rgb(var(--color-text-rgb))]" />
                      </div>
                      <h4 className="text-lg sm:text-xl font-semibold text-[rgb(var(--color-text-rgb))] mb-2">
                        No recurring transactions yet
                      </h4>
                      <p className="text-sm sm:text-base text-[rgb(var(--color-text-muted-rgb))] mb-4 sm:mb-6">
                        Automate your financial tracking.
                      </p>
                      <Button
                        onClick={() => setActiveTab('add')}
                        variant="primary"
                        className="min-h-[44px] px-6"
                      >
                        <PlusIcon className="h-4 w-4 mr-2" />
                        Add Transaction
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={showDeleteConfirm}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        title="Delete Recurring Transaction"
        message={
          <div className="space-y-2">
            <p>Are you sure you want to delete this recurring transaction?</p>
            {itemToDelete && (
              <div className="bg-[rgb(var(--color-card-muted-rgb))] rounded-lg p-3 mt-3">
                <p className="font-semibold text-[rgb(var(--color-text-rgb))]">
                  {itemToDelete.description}
                </p>
                <p className="text-sm text-[rgb(var(--color-text-muted-rgb))]">
                  {itemToDelete.type === 'income' ? '+' : '-'}{formatCurrency(itemToDelete.amount)} per {itemToDelete.frequency.replace('ly', '')}
                </p>
              </div>
            )}
            <p className="text-sm text-[rgb(var(--color-text-muted-rgb))] mt-3">
              This action cannot be undone.
            </p>
          </div>
        }
        confirmButtonText="Delete"
        confirmButtonVariant="danger"
        cancelButtonText="Keep"
      />
    </BaseModal>
  );
};

export default ManageRecurringModal;