import React, { useState, useEffect } from 'react';
import { Bill } from '../types';
import { TRANSACTION_CATEGORIES } from '../constants';
import { BillIcon } from './icons';
import { formatCurrency } from '../utils/formatters';

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(amount);
    const parsedDay = parseInt(dayOfMonth, 10);
    if (!name || isNaN(parsedAmount) || isNaN(parsedDay) || parsedDay < 1 || parsedDay > 31) {
      alert('Please fill all fields with valid values.');
      return;
    }
    onSaveBill({ id: billToEditId || undefined, name, amount: parsedAmount, dayOfMonth: parsedDay, category });
    resetForm();
  };
  
  if (!isOpen) return null;
  
  const inputStyle = "block w-full px-3 py-2 bg-[rgb(var(--color-card-muted-rgb))] border border-[rgb(var(--color-border-rgb))] rounded-md text-[rgb(var(--color-text-rgb))] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--color-primary-rgb))] sm:text-sm placeholder:text-[rgb(var(--color-text-muted-rgb))] transition-colors";

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-[rgb(var(--color-card-rgb))] rounded-2xl shadow-lg p-6 md:p-8 w-full max-w-lg transition-colors max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-[rgb(var(--color-text-rgb))]">Manage Bills</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 mb-6 bg-[rgb(var(--color-card-muted-rgb))] rounded-lg space-y-4">
          <h3 className="font-semibold text-lg text-[rgb(var(--color-text-rgb))]">{billToEditId ? 'Edit Bill' : 'Add New Bill'}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input type="text" placeholder="Bill Name" value={name} onChange={e => setName(e.target.value)} required className={inputStyle} />
            <input type="number" placeholder="Amount ($)" value={amount} onChange={e => setAmount(e.target.value)} required className={inputStyle} />
            <input type="number" placeholder="Day of Month (1-31)" value={dayOfMonth} onChange={e => setDayOfMonth(e.target.value)} min="1" max="31" required className={inputStyle} />
            <select value={category} onChange={e => setCategory(e.target.value)} className={inputStyle}>
               {Object.entries(TRANSACTION_CATEGORIES.expense).map(([group, subcategories]) => (
                <optgroup label={group} key={group}>
                  {(subcategories as string[]).map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>
          <div className="flex justify-end space-x-2 pt-2">
            {billToEditId && <button type="button" onClick={resetForm} className="px-4 py-2 text-sm font-medium text-[rgb(var(--color-text-rgb))] bg-[rgb(var(--color-border-rgb))] rounded-lg hover:bg-[rgba(var(--color-border-rgb),0.8)] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500">Cancel Edit</button>}
            <button type="submit" className="px-4 py-2 text-sm font-medium text-[rgb(var(--color-primary-text-rgb))] bg-[rgb(var(--color-primary-rgb))] rounded-lg hover:bg-[rgb(var(--color-primary-hover-rgb))] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[rgb(var(--color-primary-rgb))]">{billToEditId ? 'Save Changes' : 'Add Bill'}</button>
          </div>
        </form>

        <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
          {bills.length > 0 ? bills.map(bill => (
            <div key={bill.id} className="flex items-center justify-between p-3 bg-[rgb(var(--color-card-muted-rgb))] rounded-lg">
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
                    <button onClick={() => handleEditClick(bill)} className="text-xs font-semibold text-[rgb(var(--color-primary-subtle-text-rgb))] hover:underline">EDIT</button>
                    <button onClick={() => onDeleteBill(bill.id)} className="text-xs font-semibold text-red-500 hover:underline">DELETE</button>
                </div>
            </div>
          )) : <p className="text-center text-[rgb(var(--color-text-muted-rgb))] py-4">No bills configured yet.</p>}
        </div>
      </div>
    </div>
  );
};

export default ManageBillsModal;