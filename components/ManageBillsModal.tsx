import React, { useState, useEffect } from 'react';
import { Bill } from '../types';
import { TRANSACTION_CATEGORIES } from '../constants';
import { BillIcon } from './icons';
import { formatCurrency } from '../utils/formatters';
import BaseModal from './BaseModal';
import { FormField, Input, Select, Button } from './ModalForm';

interface ManageBillsModalProps {
  isOpen: boolean;
  onClose: () => void;
  bills: Bill[];
  onSaveBill: (bill: Omit<Bill, 'id'> & { id?: string }) => void;
  onDeleteBill: (id: string) => void;
}

const ManageBillsModal: React.FC<ManageBillsModalProps> = ({ isOpen, onClose, bills, onSaveBill, onDeleteBill }) => {
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [dayOfMonth, setDayOfMonth] = useState('');
  const [category, setCategory] = useState(Object.values(TRANSACTION_CATEGORIES.expense)[0][0]);
  const [billToEditId, setBillToEditId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{[key: string]: string}>({});

  useEffect(() => {
    if (!isOpen) {
      resetForm();
    }
  }, [isOpen]);

  const resetForm = () => {
    setName('');
    setAmount('');
    setDayOfMonth('');
    setCategory(Object.values(TRANSACTION_CATEGORIES.expense)[0][0]);
    setBillToEditId(null);
  };

  const handleEditClick = (bill: Bill) => {
    setBillToEditId(bill.id);
    setName(bill.name);
    setAmount(bill.amount.toString());
    setDayOfMonth(bill.dayOfMonth.toString());
    setCategory(bill.category);
  };

  const validateForm = () => {
    const newErrors: {[key: string]: string} = {};

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

    if (!dayOfMonth.trim()) {
      newErrors.dayOfMonth = 'Day of month is required';
    } else {
      const parsedDay = parseInt(dayOfMonth, 10);
      if (isNaN(parsedDay) || parsedDay < 1 || parsedDay > 31) {
        newErrors.dayOfMonth = 'Please enter a valid day (1-31)';
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
      const parsedDay = parseInt(dayOfMonth, 10);

      await onSaveBill({
        id: billToEditId || undefined,
        name: name.trim(),
        amount: parsedAmount,
        dayOfMonth: parsedDay,
        category
      });
      resetForm();
    } catch (error) {
      console.error('Error saving bill:', error);
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
      title="Manage Bills"
      size="lg"
      aria-label="Manage bills modal"
    >
      <div className="p-6 space-y-6">
        {/* Add/Edit Form */}
        <div className="bg-[rgb(var(--color-card-muted-rgb))] rounded-lg p-4">
          <h3 className="font-semibold text-lg text-[rgb(var(--color-text-rgb))] mb-4">
            {billToEditId ? 'Edit Bill' : 'Add New Bill'}
          </h3>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  placeholder="e.g. Electric Bill"
                  error={errors.name}
                />
              </FormField>

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
                label="Day of Month"
                htmlFor="bill-day"
                required
                error={errors.dayOfMonth}
                hint="When is this bill due each month?"
              >
                <Input
                  id="bill-day"
                  type="number"
                  min="1"
                  max="31"
                  value={dayOfMonth}
                  onChange={(e) => {
                    setDayOfMonth(e.target.value);
                    if (errors.dayOfMonth) setErrors({ ...errors, dayOfMonth: '' });
                  }}
                  placeholder="15"
                  error={errors.dayOfMonth}
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
                  {Object.entries(TRANSACTION_CATEGORIES.expense).map(([group, subcategories]) => (
                    <optgroup label={group} key={group}>
                      {(subcategories as string[]).map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </optgroup>
                  ))}
                </Select>
              </FormField>
            </div>

            <div className="flex justify-end space-x-3 pt-2">
              {billToEditId && (
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
                {billToEditId ? 'Save Changes' : 'Add Bill'}
              </Button>
            </div>
          </form>
        </div>

        {/* Bills List */}
        <div className="space-y-3">
          <h3 className="font-semibold text-lg text-[rgb(var(--color-text-rgb))]">
            Your Bills
          </h3>
          <div className="max-h-60 overflow-y-auto space-y-2">
            {bills.length > 0 ? bills.map(bill => (
              <div key={bill.id} className="flex items-center justify-between p-4 bg-[rgb(var(--color-card-muted-rgb))] rounded-lg hover:bg-[rgb(var(--color-border-rgb))] transition-colors">
                <div className="flex items-center">
                  <BillIcon className="h-5 w-5 mr-3 text-[rgb(var(--color-text-muted-rgb))]" />
                  <div>
                    <p className="font-semibold text-[rgb(var(--color-text-rgb))]">{bill.name}</p>
                    <p className="text-sm text-[rgb(var(--color-text-muted-rgb))]">
                      {formatCurrency(bill.amount)} - Due on day {bill.dayOfMonth}
                    </p>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEditClick(bill)}
                    className="text-xs"
                  >
                    Edit
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => onDeleteBill(bill.id)}
                    className="text-xs"
                  >
                    Delete
                  </Button>
                </div>
              </div>
            )) : (
              <div className="text-center py-8 text-[rgb(var(--color-text-muted-rgb))]">
                <BillIcon className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No bills configured yet.</p>
                <p className="text-sm mt-1">Add your first bill to get started.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </BaseModal>
  );
};

export default ManageBillsModal;