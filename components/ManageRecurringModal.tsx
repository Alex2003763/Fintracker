import React, { useState, useEffect } from 'react';
import { RecurringTransaction } from '../types';
import { TRANSACTION_CATEGORIES } from '../constants';
import { RecurringIcon } from './icons';
import { formatCurrency } from '../utils/formatters';
import BaseModal from './BaseModal';
import { FormField, Input, Select, Button, ToggleButton } from './ModalForm';

interface ManageRecurringModalProps {
  isOpen: boolean;
  onClose: () => void;
  recurringTransactions: RecurringTransaction[];
  onSaveRecurringTransaction: (transaction: Omit<RecurringTransaction, 'id'> & { id?: string }) => void;
  onDeleteRecurringTransaction: (id: string) => void;
}

const ManageRecurringModal: React.FC<ManageRecurringModalProps> = ({ isOpen, onClose, recurringTransactions, onSaveRecurringTransaction, onDeleteRecurringTransaction }) => {
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

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title="Manage Recurring Transactions"
      size="lg"
      aria-label="Manage recurring transactions modal"
    >
      <div className="p-4 space-y-4">
        {/* Add/Edit Form */}
        <div className="bg-[rgb(var(--color-card-muted-rgb))] rounded-lg p-3">
          <h3 className="font-semibold text-base text-[rgb(var(--color-text-rgb))] mb-3">
            {itemToEditId ? 'Edit Recurring Transaction' : 'Add New Recurring Transaction'}
          </h3>

          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <FormField
                label="Description"
                htmlFor="recurring-description"
                required
                error={errors.description}
                className="col-span-2"
              >
                <Input
                  id="recurring-description"
                  type="text"
                  value={description}
                  onChange={(e) => {
                    setDescription(e.target.value);
                    if (errors.description) setErrors({ ...errors, description: '' });
                  }}
                  placeholder="e.g. Monthly Salary"
                  error={errors.description}
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
                  leftIcon={
                    <span className="text-[rgb(var(--color-text-muted-rgb))] text-sm">$</span>
                  }
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
                />
              </FormField>

              <FormField
                label="Type"
                htmlFor="recurring-type"
                required
                className="col-span-2"
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
                className="col-span-2"
              >
                <Select
                  id="recurring-category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
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

            <div className="flex justify-end space-x-2 pt-2">
              {itemToEditId && (
                <Button
                  type="button"
                  variant="secondary"
                  onClick={resetForm}
                  disabled={isSubmitting}
                  size="sm"
                >
                  Cancel Edit
                </Button>
              )}
              <Button
                type="submit"
                variant="primary"
                loading={isSubmitting}
                size="sm"
              >
                {itemToEditId ? 'Save Changes' : 'Add Recurring'}
              </Button>
            </div>
          </form>
        </div>

        {/* Recurring Transactions List */}
        <div className="space-y-2">
          <h3 className="font-semibold text-base text-[rgb(var(--color-text-rgb))]">
            Your Recurring Transactions
          </h3>
          <div className="max-h-48 overflow-y-auto space-y-2">
            {recurringTransactions.length > 0 ? recurringTransactions.map(rt => (
              <div key={rt.id} className="flex items-center justify-between p-4 bg-[rgb(var(--color-card-muted-rgb))] rounded-lg hover:bg-[rgb(var(--color-border-rgb))] transition-colors">
                <div className="flex items-center">
                  <RecurringIcon className={`h-5 w-5 mr-3 ${rt.type === 'income' ? 'text-green-500' : 'text-red-500'}`} />
                  <div>
                    <p className="font-semibold text-[rgb(var(--color-text-rgb))]">{rt.description}</p>
                    <p className="text-sm text-[rgb(var(--color-text-muted-rgb))] capitalize">
                      {formatCurrency(rt.amount)} - {rt.frequency} - Next: {new Date(rt.nextDueDate).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEditClick(rt)}
                    className="text-xs"
                  >
                    Edit
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => onDeleteRecurringTransaction(rt.id)}
                    className="text-xs"
                  >
                    Delete
                  </Button>
                </div>
              </div>
            )) : (
              <div className="text-center py-8 text-[rgb(var(--color-text-muted-rgb))]">
                <RecurringIcon className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No recurring transactions configured yet.</p>
                <p className="text-sm mt-1">Add your first recurring transaction to automate your finances.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </BaseModal>
  );
};

export default ManageRecurringModal;