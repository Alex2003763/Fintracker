import React, { useState, useEffect } from 'react';
import { RecurringTransaction } from '../types';
import { TRANSACTION_CATEGORIES } from '../constants';
import { RecurringIcon } from './icons';
import { formatCurrency } from '../utils/formatters';

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(amount);
    if (!description || isNaN(parsedAmount) || parsedAmount <= 0 || !startDate) {
      alert('Please fill all fields with valid values.');
      return;
    }
    onSaveRecurringTransaction({
      id: itemToEditId || undefined,
      description,
      amount: parsedAmount,
      type,
      category,
      frequency,
      startDate,
      nextDueDate: startDate, // The backend logic will process this on next load.
    });
    resetForm();
  };
  
  if (!isOpen) return null;
  
  const inputStyle = "block w-full px-3 py-2 bg-[rgb(var(--color-card-muted-rgb))] border border-[rgb(var(--color-border-rgb))] rounded-md text-[rgb(var(--color-text-rgb))] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--color-primary-rgb))] sm:text-sm placeholder:text-[rgb(var(--color-text-muted-rgb))] transition-colors";

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-[rgb(var(--color-card-rgb))] rounded-2xl shadow-lg p-6 md:p-8 w-full max-w-2xl transition-colors max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-[rgb(var(--color-text-rgb))]">Manage Recurring Transactions</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 mb-6 bg-[rgb(var(--color-card-muted-rgb))] rounded-lg space-y-4">
          <h3 className="font-semibold text-lg text-[rgb(var(--color-text-rgb))]">{itemToEditId ? 'Edit Recurring Transaction' : 'Add New'}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input type="text" placeholder="Description (e.g., Salary)" value={description} onChange={e => setDescription(e.target.value)} required className={inputStyle} />
            <input type="number" placeholder="Amount ($)" value={amount} onChange={e => setAmount(e.target.value)} required className={inputStyle} />
            <select value={frequency} onChange={e => setFrequency(e.target.value as any)} className={inputStyle}>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="yearly">Yearly</option>
            </select>
            <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} required className={inputStyle} />
            <div className="md:col-span-2">
                <div className="flex rounded-lg border p-1 bg-[rgb(var(--color-bg-rgb))] border-[rgb(var(--color-border-rgb))]">
                    <button type="button" onClick={() => setType('expense')} className={`w-1/2 py-2 rounded-md text-sm font-semibold transition-colors ${type === 'expense' ? 'bg-[rgb(var(--color-card-rgb))] shadow text-[rgb(var(--color-text-rgb))]' : 'text-[rgb(var(--color-text-muted-rgb))]'}`}>Expense</button>
                    <button type="button" onClick={() => setType('income')} className={`w-1/2 py-2 rounded-md text-sm font-semibold transition-colors ${type === 'income' ? 'bg-[rgb(var(--color-card-rgb))] shadow text-[rgb(var(--color-text-rgb))]' : 'text-[rgb(var(--color-text-muted-rgb))]'}`}>Income</button>
                </div>
            </div>
             <select value={category} onChange={e => setCategory(e.target.value)} className={`${inputStyle} md:col-span-2`}>
               {Object.entries(TRANSACTION_CATEGORIES[type]).map(([group, subcategories]) => (
                <optgroup label={group} key={group}>
                  {/* FIX: Cast subcategories to a string array to resolve a TypeScript inference issue. */}
                  {(subcategories as string[]).map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>
          <div className="flex justify-end space-x-2 pt-2">
            {itemToEditId && <button type="button" onClick={resetForm} className="px-4 py-2 text-sm font-medium text-[rgb(var(--color-text-rgb))] bg-[rgb(var(--color-border-rgb))] rounded-lg hover:bg-[rgba(var(--color-border-rgb),0.8)] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500">Cancel Edit</button>}
            <button type="submit" className="px-4 py-2 text-sm font-medium text-[rgb(var(--color-primary-text-rgb))] bg-[rgb(var(--color-primary-rgb))] rounded-lg hover:bg-[rgb(var(--color-primary-hover-rgb))] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[rgb(var(--color-primary-rgb))]">{itemToEditId ? 'Save Changes' : 'Add Recurring'}</button>
          </div>
        </form>

        <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
          {recurringTransactions.length > 0 ? recurringTransactions.map(rt => (
            <div key={rt.id} className="flex items-center justify-between p-3 bg-[rgb(var(--color-card-muted-rgb))] rounded-lg">
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
                    <button onClick={() => handleEditClick(rt)} className="text-xs font-semibold text-[rgb(var(--color-primary-subtle-text-rgb))] hover:underline">EDIT</button>
                    <button onClick={() => onDeleteRecurringTransaction(rt.id)} className="text-xs font-semibold text-red-500 hover:underline">DELETE</button>
                </div>
            </div>
          )) : <p className="text-center text-[rgb(var(--color-text-muted-rgb))] py-4">No recurring transactions configured yet.</p>}
        </div>
      </div>
    </div>
  );
};

export default ManageRecurringModal;