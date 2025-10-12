import React, { useState, useEffect } from 'react';
import { Transaction } from '../types';
import { TRANSACTION_CATEGORIES } from '../constants';
import { parseQuickAddInput } from '../utils/formatters';

interface QuickAddPopoverProps {
  onClose: () => void;
  onSaveTransaction: (transaction: Omit<Transaction, 'id' | 'date'>) => void;
}

const QuickAddPopover: React.FC<QuickAddPopoverProps> = ({ onClose, onSaveTransaction }) => {
    const [inputValue, setInputValue] = useState('');
    const [type, setType] = useState<'income' | 'expense'>('expense');
    const [category, setCategory] = useState(TRANSACTION_CATEGORIES.expense['Food & Drink'][0]);
    const [error, setError] = useState('');

    useEffect(() => {
        setCategory(Object.values(TRANSACTION_CATEGORIES[type])[0][0]);
    }, [type]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        const parsedData = parseQuickAddInput(inputValue);

        if (!parsedData) {
            setError('Invalid format. Use "Description Amount"');
            return;
        }

        onSaveTransaction({
            description: parsedData.description,
            amount: parsedData.amount,
            type,
            category,
        });
    };

    const categories = TRANSACTION_CATEGORIES[type];

    return (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 md:left-auto md:right-24 md:translate-x-0 w-80 bg-[rgb(var(--color-card-rgb))] rounded-2xl shadow-lg border border-[rgb(var(--color-border-rgb))] z-20 transition-colors p-4">
            <form onSubmit={handleSubmit} className="space-y-3">
                 <div>
                    <label htmlFor="quick-add-input" className="block text-sm font-medium text-[rgb(var(--color-text-muted-rgb))]">
                        Description & Amount
                    </label>
                    <input
                        id="quick-add-input"
                        type="text"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        placeholder='e.g. "Coffee 5.50"'
                        className="mt-1 block w-full px-3 py-2 bg-[rgb(var(--color-card-muted-rgb))] border border-[rgb(var(--color-border-rgb))] rounded-md text-[rgb(var(--color-text-rgb))] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--color-primary-rgb))] sm:text-sm"
                        autoFocus
                        required
                    />
                    {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
                </div>
                
                <div className="flex rounded-lg border p-1 bg-[rgb(var(--color-bg-rgb))] border-[rgb(var(--color-border-rgb))]">
                  <button
                    type="button"
                    onClick={() => setType('expense')}
                    className={`w-1/2 py-1.5 rounded-md text-xs font-semibold transition-colors ${type === 'expense' ? 'bg-[rgb(var(--color-card-rgb))] shadow text-[rgb(var(--color-text-rgb))]' : 'text-[rgb(var(--color-text-muted-rgb))]'}`}
                  >
                    Expense
                  </button>
                  <button
                    type="button"
                    onClick={() => setType('income')}
                    className={`w-1/2 py-1.5 rounded-md text-xs font-semibold transition-colors ${type === 'income' ? 'bg-[rgb(var(--color-card-rgb))] shadow text-[rgb(var(--color-text-rgb))]' : 'text-[rgb(var(--color-text-muted-rgb))]'}`}
                  >
                    Income
                  </button>
                </div>

                <div>
                    <label htmlFor="quick-add-category" className="block text-sm font-medium text-[rgb(var(--color-text-muted-rgb))]">
                        Category
                    </label>
                    <select
                        id="quick-add-category"
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        className="mt-1 block w-full pl-3 pr-10 py-2 bg-[rgb(var(--color-card-muted-rgb))] border border-[rgb(var(--color-border-rgb))] rounded-md text-[rgb(var(--color-text-rgb))] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--color-primary-rgb))] sm:text-sm"
                    >
                        {Object.entries(categories).map(([group, subcategories]) => (
                            <optgroup label={group} key={group}>
                                {(subcategories as string[]).map(cat => (
                                    <option key={cat} value={cat}>{cat}</option>
                                ))}
                            </optgroup>
                        ))}
                    </select>
                </div>
                
                <button
                    type="submit"
                    className="w-full px-4 py-2 text-sm font-medium text-[rgb(var(--color-primary-text-rgb))] bg-[rgb(var(--color-primary-rgb))] rounded-lg hover:bg-[rgb(var(--color-primary-hover-rgb))] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[rgb(var(--color-primary-rgb))]"
                >
                    Add Transaction
                </button>
            </form>
        </div>
    );
};

export default QuickAddPopover;