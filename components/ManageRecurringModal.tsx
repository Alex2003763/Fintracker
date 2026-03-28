import React, { useState, useEffect } from 'react';
import { RecurringTransaction, SubCategory } from '../types';
import { TRANSACTION_CATEGORIES } from '../constants';
import { RecurringIcon, PlusIcon } from './icons';
import { formatCurrency } from '../utils/formatters';
import BaseModal from './BaseModal';
import ConfirmationModal from './ConfirmationModal';
import { FormField, Input, Select, Button, ToggleButton, Tabs } from './ModalForm';

interface ManageRecurringModalProps {
  isOpen: boolean;
  onClose: () => void;
  recurringTransactions: RecurringTransaction[];
  onSaveRecurringTransaction: (
    transaction: Omit<RecurringTransaction, 'id'> & { id?: string }
  ) => void;
  onDeleteRecurringTransaction: (id: string) => void;
}

const FREQUENCY_LABEL: Record<string, string> = {
  weekly: 'week',
  monthly: 'month',
  yearly: 'year',
};

const ManageRecurringModal: React.FC<ManageRecurringModalProps> = ({
  isOpen,
  onClose,
  recurringTransactions,
  onSaveRecurringTransaction,
  onDeleteRecurringTransaction,
}) => {
  const [activeTab, setActiveTab]         = useState('add');
  const [description, setDescription]     = useState('');
  const [amount, setAmount]               = useState('');
  const [type, setType]                   = useState<'income' | 'expense'>('expense');
  const [category, setCategory]           = useState(TRANSACTION_CATEGORIES.expense['Food & Drink'][0].name);
  const [frequency, setFrequency]         = useState<'weekly' | 'monthly' | 'yearly'>('monthly');
  const [startDate, setStartDate]         = useState(new Date().toISOString().split('T')[0]);
  const [itemToEditId, setItemToEditId]   = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting]   = useState(false);
  const [errors, setErrors]               = useState<{ [key: string]: string }>({});
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [itemToDelete, setItemToDelete]   = useState<RecurringTransaction | null>(null);

  useEffect(() => { if (!isOpen) resetForm(); }, [isOpen]);

  useEffect(() => {
    const defaultCategory = Object.values(TRANSACTION_CATEGORIES[type])[0][0];
    setCategory(defaultCategory.name);
  }, [type]);

  const resetForm = () => {
    setDescription(''); setAmount(''); setType('expense');
    setFrequency('monthly');
    setStartDate(new Date().toISOString().split('T')[0]);
    setCategory(TRANSACTION_CATEGORIES.expense['Food & Drink'][0].name);
    setItemToEditId(null); setActiveTab('add'); setErrors({});
  };

  const handleEditClick = (rt: RecurringTransaction) => {
    setItemToEditId(rt.id); setDescription(rt.description);
    setAmount(rt.amount.toString()); setType(rt.type);
    setCategory(rt.category); setFrequency(rt.frequency);
    setStartDate(new Date(rt.startDate).toISOString().split('T')[0]);
    setActiveTab('add');
  };

  const handleDeleteClick = (transaction: RecurringTransaction) => {
    setItemToDelete(transaction); setShowDeleteConfirm(true);
  };

  const handleDeleteConfirm = async () => {
    if (itemToDelete) {
      await onDeleteRecurringTransaction(itemToDelete.id);
      setShowDeleteConfirm(false); setItemToDelete(null); resetForm();
    }
  };

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};
    if (!description.trim()) newErrors.description = 'Description is required';
    if (!amount.trim()) {
      newErrors.amount = 'Amount is required';
    } else if (isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      newErrors.amount = 'Enter a valid amount greater than 0';
    }
    if (!startDate) newErrors.startDate = 'Start date is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    setIsSubmitting(true);
    try {
      await onSaveRecurringTransaction({
        id: itemToEditId || undefined,
        description: description.trim(),
        amount: parseFloat(amount),
        type, category, frequency,
        startDate, nextDueDate: startDate,
      });
      resetForm();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const tabs = [
    {
      id: 'add',
      label: itemToEditId ? 'Edit' : 'Add New',
      icon: <PlusIcon className="h-4 w-4" />,
    },
    {
      id: 'all',
      label: 'All',
      icon: <RecurringIcon className="h-4 w-4" />,
      badge: recurringTransactions.length,
    },
  ];

  // ─── Shared type-aware colour tokens ────────────────────────────────────
  const typeColor = (t: 'income' | 'expense') =>
    t === 'income'
      ? 'text-[rgb(var(--color-success-rgb))]'
      : 'text-[rgb(var(--color-error-rgb))]';

  const typeBg = (t: 'income' | 'expense') =>
    t === 'income'
      ? 'bg-[rgba(var(--color-success-rgb),0.1)]'
      : 'bg-[rgba(var(--color-error-rgb),0.1)]';

  const typeBorder = (t: 'income' | 'expense') =>
    t === 'income'
      ? 'border-[rgba(var(--color-success-rgb),0.25)]'
      : 'border-[rgba(var(--color-error-rgb),0.25)]';

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title="Recurring Transactions"
      size="xl"
      animation="slide-up"
      className="text-[rgb(var(--color-text-rgb))]"
    >
      <div className="flex flex-col h-full max-h-[85vh]">
{/* Replace the <Tabs> component with this custom implementation */}
<div className="flex items-center gap-1 p-1 mx-4 sm:mx-6 mb-2 rounded-xl bg-[rgb(var(--color-card-muted-rgb))] border border-[rgb(var(--color-border-rgb))]">
  {tabs.map(tab => {
    const isActive = activeTab === tab.id;
    return (
      <button
        key={tab.id}
        onClick={() => setActiveTab(tab.id)}
        className={`
          relative flex-1 flex items-center justify-center gap-2
          px-4 py-2 rounded-lg text-sm font-semibold
          transition-all duration-200 active:scale-[0.97]
          ${isActive
            ? 'bg-[rgb(var(--color-card-rgb))] text-[rgb(var(--color-text-rgb))] shadow-sm'
            : 'text-[rgb(var(--color-text-muted-rgb))] hover:text-[rgb(var(--color-text-rgb))]'
          }
        `}
        aria-selected={isActive}
        role="tab"
      >
        {/* Icon */}
        <span className={`transition-colors ${isActive ? 'text-[rgb(var(--color-primary-rgb))]' : ''}`}>
          {tab.icon}
        </span>

        {/* Label */}
        <span>{tab.label}</span>

        {/* Badge */}
        {tab.badge !== undefined && tab.badge > 0 && (
          <span className={`
            text-[11px] font-bold px-1.5 py-0.5 rounded-full leading-none min-w-[18px] text-center
            ${isActive
              ? 'bg-[rgba(var(--color-primary-rgb),0.15)] text-[rgb(var(--color-primary-rgb))]'
              : 'bg-[rgb(var(--color-border-rgb))] text-[rgb(var(--color-text-muted-rgb))]'
            }
          `}>
            {tab.badge}
          </span>
        )}
      </button>
    );
  })}
</div>

        <div className="flex-1 overflow-y-auto">

          {/* ════════════════════════════════════════════
              ADD / EDIT TAB
          ════════════════════════════════════════════ */}
         {activeTab === 'add' && (
        <div className="p-5 sm:p-6 max-w-xl mx-auto">
       <form onSubmit={handleSubmit} className="space-y-4">

      {/* Description */}
      <FormField label="Description" htmlFor="rc-desc" required error={errors.description}>
        <Input
          id="rc-desc"
          type="text"
          value={description}
          onChange={e => {
            setDescription(e.target.value);
            if (errors.description) setErrors({ ...errors, description: '' });
          }}
          placeholder="e.g. Monthly Rent, Salary"
          error={errors.description}
        />
      </FormField>

      {/* Amount + Frequency side by side */}
      <div className="grid grid-cols-2 gap-3">
        <FormField label="Amount" htmlFor="rc-amount" required error={errors.amount}>
          <Input
            id="rc-amount"
            type="number"
            step="0.01"
            min="0"
            value={amount}
            onChange={e => {
              setAmount(e.target.value);
              if (errors.amount) setErrors({ ...errors, amount: '' });
            }}
            placeholder="0.00"
            error={errors.amount}
            inputMode="decimal"
            leftIcon={<span className="text-[rgb(var(--color-text-muted-rgb))] font-medium text-sm">$</span>}
          />
        </FormField>

        <FormField label="Frequency" htmlFor="rc-freq" required>
          <Select
            id="rc-freq"
            value={frequency}
            onChange={e => setFrequency(e.target.value as typeof frequency)}
          >
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
            <option value="yearly">Yearly</option>
          </Select>
        </FormField>
      </div>

      {/* Type Toggle */}
<div className="space-y-1.5">
  <label className="text-xs font-semibold text-[rgb(var(--color-text-muted-rgb))] uppercase tracking-wider">
    Type <span className="text-[rgb(var(--color-error-rgb))]">*</span>
  </label>
  <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-[rgb(var(--color-card-muted-rgb))] border border-[rgb(var(--color-border-rgb))]">
    {(['expense', 'income'] as const).map(t => {
      const isActive = type === t;
      return (
        <button
          key={t}
          type="button"
          onClick={() => {
            setType(t);
            setCategory(Object.values(TRANSACTION_CATEGORIES[t])[0][0].name);
          }}
          className={`
  flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold
  transition-all duration-200 active:scale-[0.97]
  ${isActive
    ? t === 'expense'
      ? 'bg-[rgb(var(--color-card-rgb))] text-[rgb(var(--color-error-rgb))] shadow-sm border border-[rgba(var(--color-error-rgb),0.3)]'
      : 'bg-[rgb(var(--color-card-rgb))] text-[rgb(var(--color-success-rgb))] shadow-sm border border-[rgba(var(--color-success-rgb),0.3)]'
    : 'border border-transparent text-[rgb(var(--color-text-muted-rgb))] hover:text-[rgb(var(--color-text-rgb))]'
  }
`}
        >
          <span className="text-base">{t === 'expense' ? '💸' : '💰'}</span>
          {t.charAt(0).toUpperCase() + t.slice(1)}
        </button>
      );
    })}
  </div>
</div>

      {/* Category */}
      <FormField label="Category" htmlFor="rc-cat" required>
        <Select
          id="rc-cat"
          value={category}
          onChange={e => setCategory(e.target.value)}
        >
          {Object.entries(TRANSACTION_CATEGORIES[type]).map(([group, subcats]) => (
            <optgroup label={group} key={group}>
              {(subcats as SubCategory[]).map(cat => (
                <option key={cat.name} value={cat.name}>{cat.name}</option>
              ))}
            </optgroup>
          ))}
        </Select>
      </FormField>

      {/* Start Date */}
      <FormField label="Start Date" htmlFor="rc-date" required error={errors.startDate}>
        <Input
          id="rc-date"
          type="date"
          value={startDate}
          onChange={e => {
            setStartDate(e.target.value);
            if (errors.startDate) setErrors({ ...errors, startDate: '' });
          }}
          error={errors.startDate}
        />
      </FormField>

      {/* Live Preview — only when amount is valid */}
      {amount && parseFloat(amount) > 0 && (
        <div className={`
          flex items-center justify-between px-4 py-3 rounded-xl border
          ${type === 'income'
            ? 'bg-[rgba(var(--color-success-rgb),0.08)] border-[rgba(var(--color-success-rgb),0.2)]'
            : 'bg-[rgba(var(--color-error-rgb),0.08)] border-[rgba(var(--color-error-rgb),0.2)]'
          }
        `}>
          <div className="min-w-0">
            <p className="text-xs text-[rgb(var(--color-text-muted-rgb))] mb-0.5">Preview</p>
            <p className="text-sm font-medium text-[rgb(var(--color-text-rgb))] truncate">
              {description || 'Untitled'} · <span className="capitalize">{frequency}</span>
            </p>
          </div>
          <span className={`text-base font-bold ml-4 flex-shrink-0 ${
            type === 'income'
              ? 'text-[rgb(var(--color-success-rgb))]'
              : 'text-[rgb(var(--color-error-rgb))]'
          }`}>
            {type === 'income' ? '+' : '−'}{formatCurrency(parseFloat(amount))}
          </span>
        </div>
      )}

      {/* Submit */}
      <div className={`flex gap-2.5 pt-2 ${itemToEditId ? 'flex-col sm:flex-row' : ''}`}>
        {itemToEditId && (
          <>
            <Button
              type="button"
              variant="danger"
              onClick={() => {
                const t = recurringTransactions.find(t => t.id === itemToEditId);
                if (t) handleDeleteClick(t);
              }}
              disabled={isSubmitting}
              className="sm:flex-none"
            >
              Delete
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={resetForm}
              disabled={isSubmitting}
              className="flex-1"
            >
              Cancel
            </Button>
          </>
        )}
        <Button
          type="submit"
          variant="primary"
          loading={isSubmitting}
          className="flex-1 min-h-[46px] text-sm font-semibold"
        >
          {itemToEditId ? 'Save Changes' : '+ Add Recurring'}
        </Button>
      </div>

    </form>
  </div>
)}

          {/* ════════════════════════════════════════════
              ALL TRANSACTIONS TAB
          ════════════════════════════════════════════ */}
          {activeTab === 'all' && (
            <div className="p-4 sm:p-6">

              {recurringTransactions.length === 0 ? (
                /* ── Empty state ─────────────────────────── */
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <div className="w-16 h-16 mb-4 rounded-full bg-[rgb(var(--color-card-muted-rgb))] flex items-center justify-center">
                    <RecurringIcon className="h-8 w-8 text-[rgb(var(--color-text-muted-rgb))]" />
                  </div>
                  <h4 className="text-lg font-semibold text-[rgb(var(--color-text-rgb))] mb-1">
                    No recurring transactions
                  </h4>
                  <p className="text-sm text-[rgb(var(--color-text-muted-rgb))] mb-6">
                    Set up automatic income or expense tracking.
                  </p>
                  <Button onClick={() => setActiveTab('add')} variant="primary" className="px-6">
                    <PlusIcon className="h-4 w-4 mr-2" />
                    Add Transaction
                  </Button>
                </div>
              ) : (
                /* ── Transaction list ────────────────────── */
                <div className="space-y-2.5">
                  {recurringTransactions.map(rt => (
                    <button
                      key={rt.id}
                      onClick={() => handleEditClick(rt)}
                      className="w-full text-left flex items-center gap-4 px-4 py-3.5 rounded-2xl
                        bg-[rgb(var(--color-card-rgb))] border border-[rgb(var(--color-border-rgb))]
                        hover:border-[rgba(var(--color-primary-rgb),0.4)]
                        hover:bg-[rgb(var(--color-card-muted-rgb))]
                        active:scale-[0.99] transition-all duration-150 group"
                    >
                      {/* Type dot */}
                      <div className={`w-10 h-10 flex-shrink-0 rounded-xl flex items-center justify-center border ${typeBg(rt.type)} ${typeBorder(rt.type)}`}>
                        <RecurringIcon className={`h-4 w-4 ${typeColor(rt.type)}`} />
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm text-[rgb(var(--color-text-rgb))] truncate group-hover:text-[rgb(var(--color-primary-rgb))] transition-colors">
                          {rt.description}
                        </p>
                        <p className="text-xs text-[rgb(var(--color-text-muted-rgb))] mt-0.5">
                          {rt.category} · <span className="capitalize">{rt.frequency}</span>
                        </p>
                      </div>

                      {/* Amount */}
                      <div className="text-right flex-shrink-0">
                        <p className={`font-bold text-sm ${typeColor(rt.type)}`}>
                          {rt.type === 'income' ? '+' : '−'}{formatCurrency(rt.amount)}
                        </p>
                        <p className="text-xs text-[rgb(var(--color-text-muted-rgb))] mt-0.5">
                          per {FREQUENCY_LABEL[rt.frequency]}
                        </p>
                      </div>

                      {/* Edit chevron */}
                      <svg className="h-4 w-4 text-[rgb(var(--color-text-muted-rgb))] opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M6 4l4 4-4 4" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>
      </div>

      {/* ── Delete Confirmation ──────────────────────────────────────────── */}
      <ConfirmationModal
        isOpen={showDeleteConfirm}
        onClose={() => { setShowDeleteConfirm(false); setItemToDelete(null); }}
        onConfirm={handleDeleteConfirm}
        title="Delete Recurring Transaction"
        message={
          <div className="space-y-3">
            <p className="text-[rgb(var(--color-text-muted-rgb))]">
              Are you sure you want to delete this recurring transaction?
            </p>
            {itemToDelete && (
              <div className={`flex items-center justify-between px-4 py-3 rounded-xl border ${typeBg(itemToDelete.type)} ${typeBorder(itemToDelete.type)}`}>
                <div>
                  <p className="font-semibold text-[rgb(var(--color-text-rgb))]">
                    {itemToDelete.description}
                  </p>
                  <p className="text-xs text-[rgb(var(--color-text-muted-rgb))] mt-0.5 capitalize">
                    {itemToDelete.frequency} · {itemToDelete.category}
                  </p>
                </div>
                <span className={`font-bold ${typeColor(itemToDelete.type)}`}>
                  {itemToDelete.type === 'income' ? '+' : '−'}{formatCurrency(itemToDelete.amount)}
                </span>
              </div>
            )}
            <p className="text-xs text-[rgb(var(--color-text-muted-rgb))]">
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