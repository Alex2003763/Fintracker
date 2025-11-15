// ManageBillsModal.tsx

import React, { useState, useEffect } from 'react';
import { Bill } from '../types';
import { TRANSACTION_CATEGORIES } from '../constants';
import { BillIcon, PencilIcon, TrashIcon } from './icons';
import { formatCurrency } from '../utils/formatters';
import BaseModal from './BaseModal';
import { FormField, Input, Select, Button } from './ModalForm';

import { User } from '../types';

interface ManageBillsModalProps {
  isOpen: boolean;
  onClose: () => void;
  bills: Bill[];
  onSaveBill: (bill: Omit<Bill, 'id'> & { id?: string }) => void;
  onDeleteBill: (id: string) => void;
  onOpenConfirmModal: (
    title: string,
    message: string,
    onConfirm: () => void,
    options?: { confirmText?: string; variant?: 'primary' | 'danger' }
  ) => void;
  user?: User | null;
}

type ViewMode = 'list' | 'form';

const FREQUENCY_OPTIONS = [
  { value: 'monthly', label: 'Monthly' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'yearly', label: 'Yearly' },
];

const ManageBillsModal: React.FC<ManageBillsModalProps> = ({
  isOpen,
  onClose,
  bills,
  onSaveBill,
  onDeleteBill,
  onOpenConfirmModal,
  user,
}) => {
  const currentCategories = user?.customCategories?.expense || TRANSACTION_CATEGORIES.expense;
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [dayOfMonth, setDayOfMonth] = useState('');
  // Default to first subcategory of first expense group
  const defaultCategory =
    Object.values(currentCategories)[0][0]?.name || '';
  const [category, setCategory] = useState(defaultCategory);
  const [frequency, setFrequency] = useState<'monthly' | 'weekly' | 'yearly'>('monthly');
  const [billToEditId, setBillToEditId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    if (!isOpen) {
      resetForm();
      setViewMode('list');
    }
  }, [isOpen]);

  const resetForm = () => {
    setName('');
    setAmount('');
    setDayOfMonth('');
    setCategory(
      Object.values(currentCategories)[0][0]?.name || ''
    );
    setFrequency('monthly');
    setBillToEditId(null);
    setErrors({});
  };

  const handleAddNewBill = () => {
    resetForm();
    setViewMode('form');
  };

  const handleEditBill = (bill: Bill) => {
    setBillToEditId(bill.id);
    setName(bill.name);
    setAmount(bill.amount.toString());
    setDayOfMonth(bill.dayOfMonth ? bill.dayOfMonth.toString() : '');
    setCategory(bill.category);
    setFrequency(bill.frequency || 'monthly');
    setViewMode('form');
  };

  const handleBackToList = () => {
    resetForm();
    setViewMode('list');
  };

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!name.trim()) {
      newErrors.name = 'Bill name is required';
    }

    if (!amount.trim()) {
      newErrors.amount = 'Amount is required';
    } else {
      const parsedAmount = parseFloat(amount);
      if (isNaN(parsedAmount) || parsedAmount <= 0) {
        newErrors.amount = 'Please enter a valid amount greater than 0';
      }
    }

    if (frequency === 'monthly') {
      if (!dayOfMonth.trim()) {
        newErrors.dayOfMonth = 'Day of month is required';
      } else {
        const parsedDay = parseInt(dayOfMonth, 10);
        if (isNaN(parsedDay) || parsedDay < 1 || parsedDay > 31) {
          newErrors.dayOfMonth = 'Please enter a valid day (1-31)';
        }
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
      const parsedDay = frequency === 'monthly' ? parseInt(dayOfMonth, 10) : 1;

      await onSaveBill({
        id: billToEditId || undefined,
        name: name.trim(),
        amount: parsedAmount,
        dayOfMonth: parsedDay,
        category,
        frequency,
      });

      handleBackToList();
    } catch (error) {
      console.error('Error saving bill:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteClick = (bill: Bill) => {
    onOpenConfirmModal(
      'Delete Bill',
      `Are you sure you want to delete the bill "${bill.name}"? This action cannot be undone.`,
      () => onDeleteBill(bill.id),
      { confirmText: 'Delete', variant: 'danger' }
    );
  };

  const renderListView = () => (
    <div className="p-4 sm:p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-semibold text-[rgb(var(--color-text-rgb))]">
            Your Bills
          </h3>
          <p className="text-sm text-[rgb(var(--color-text-muted-rgb))] mt-1">
            {bills.length} {bills.length === 1 ? 'bill' : 'bills'} configured
          </p>
        </div>
        <Button
          onClick={handleAddNewBill}
          variant="primary"
          className="flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Bill
        </Button>
      </div>

      <div className="space-y-3 max-h-[60vh] overflow-y-auto">
        {bills.length > 0 ? (
          bills.map((bill) => (
            <div
              key={bill.id}
              className="bg-[rgb(var(--color-card-muted-rgb))] rounded-xl p-4 border border-[rgb(var(--color-border-rgb))] transition-all duration-200"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  <div className="p-3 bg-[rgb(var(--color-primary-rgb))]/10 rounded-lg">
                    <BillIcon className="h-6 w-6 text-[rgb(var(--color-primary-rgb))]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-[rgb(var(--color-text-rgb))] truncate">
                      {bill.name}
                    </h4>
                    <p className="text-sm text-[rgb(var(--color-text-muted-rgb))]">
                      {bill.frequency === 'monthly'
                        ? `Due on day ${bill.dayOfMonth}`
                        : `Repeats ${bill.frequency}`}
                    </p>
                  </div>
                </div>
                <div className="flex flex-col items-end ml-4">
                  <span className="text-lg font-bold text-[rgb(var(--color-primary-rgb))]">
                    {formatCurrency(bill.amount)}
                  </span>
                  <span className="text-xs text-[rgb(var(--color-text-muted-rgb))]">
                    {bill.category}
                  </span>
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-4 pt-4 border-t border-[rgb(var(--color-border-rgb))]">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleEditBill(bill)}
                  className="text-xs px-3 py-2"
                >
                  <PencilIcon className="w-4 h-4 mr-1" />
                  Edit
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => handleDeleteClick(bill)}
                  className="text-xs px-3 py-2"
                >
                  <TrashIcon className="w-4 h-4 mr-1" />
                  Delete
                </Button>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-16">
            <div className="w-24 h-24 mx-auto mb-6 bg-[rgb(var(--color-card-muted-rgb))] rounded-full flex items-center justify-center">
              <BillIcon className="h-12 w-12 text-[rgb(var(--color-text-muted-rgb))] opacity-50" />
            </div>
            <h3 className="text-lg font-semibold text-[rgb(var(--color-text-rgb))] mb-2">
              No bills yet
            </h3>
            <p className="text-[rgb(var(--color-text-muted-rgb))] mb-6 max-w-sm mx-auto">
              Start by adding your recurring bills to keep track of your monthly expenses
            </p>
            <Button
              onClick={handleAddNewBill}
              variant="primary"
              className="flex items-center gap-2 mx-auto"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Your First Bill
            </Button>
          </div>
        )}
      </div>
    </div>
  );

  const renderFormView = () => (
    <div className="p-4 sm:p-6">
      <div className="flex items-center gap-3 mb-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleBackToList}
          className="p-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Button>
        <div>
          <h3 className="text-xl font-semibold text-[rgb(var(--color-text-rgb))]">
            {billToEditId ? 'Edit Bill' : 'Add New Bill'}
          </h3>
          <p className="text-sm text-[rgb(var(--color-text-muted-rgb))]">
            {billToEditId ? 'Update your bill details' : 'Enter your bill information'}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 max-h-[60vh] overflow-y-auto">
        <div className="grid grid-cols-1 gap-6">
          <FormField
            label="Bill Name"
            htmlFor="bill-name"
            required
            error={errors.name}
          >
            <Input
              id="bill-name"
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (errors.name) setErrors({ ...errors, name: '' });
              }}
              placeholder="e.g. Electric Bill, Rent, Internet"
              error={errors.name}
            />
          </FormField>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <FormField
              label="Amount"
              htmlFor="bill-amount"
              required
              error={errors.amount}
            >
              <Input
                id="bill-amount"
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
                  <span className="text-[rgb(var(--color-text-muted-rgb))] text-sm">$</span>
                }
              />
            </FormField>

            <FormField
              label="Category"
              htmlFor="bill-category"
              required
            >
              <Select
                id="bill-category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                {Object.entries(currentCategories).map(([group, subcategories]) => (
                  <optgroup label={group} key={group}>
                    {subcategories.map(cat => (
                      <option key={cat.name} value={cat.name}>{cat.name}</option>
                    ))}
                  </optgroup>
                ))}
              </Select>
            </FormField>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <FormField
              label="Frequency"
              htmlFor="bill-frequency"
              required
            >
              <Select
                id="bill-frequency"
                value={frequency}
                onChange={(e) => setFrequency(e.target.value as 'monthly' | 'weekly' | 'yearly')}
              >
                {FREQUENCY_OPTIONS.map((freq) => (
                  <option key={freq.value} value={freq.value}>
                    {freq.label}
                  </option>
                ))}
              </Select>
            </FormField>

            {frequency === 'monthly' && (
              <FormField
                label="Day of Month"
                htmlFor="bill-day-of-month"
                required
                error={errors.dayOfMonth}
              >
                <Input
                  id="bill-day-of-month"
                  type="number"
                  min="1"
                  max="31"
                  value={dayOfMonth}
                  onChange={(e) => {
                    setDayOfMonth(e.target.value);
                    if (errors.dayOfMonth) setErrors({ ...errors, dayOfMonth: '' });
                  }}
                  placeholder="e.g. 1"
                  error={errors.dayOfMonth}
                />
              </FormField>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button
            type="button"
            variant="ghost"
            onClick={handleBackToList}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            disabled={isSubmitting}
          >
            {billToEditId ? 'Update Bill' : 'Add Bill'}
          </Button>
        </div>
      </form>
    </div>
  );

  return (
    <BaseModal isOpen={isOpen} onClose={onClose}>
      {viewMode === 'list' ? renderListView() : renderFormView()}
    </BaseModal>
  );
};

export default ManageBillsModal;
