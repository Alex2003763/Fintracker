
import React, { useState, useEffect } from 'react';
import { Transaction } from '../types';
import { TRANSACTION_CATEGORIES } from '../constants';
import { suggestCategory, getBestCategorySuggestion, testAI } from '../utils/categoryAI';

interface AddTransactionModalProps {
  onClose: () => void;
  onSaveTransaction: (transaction: Omit<Transaction, 'id' | 'date'> & { id?: string }) => void;
  transactionToEdit: Transaction | null;
  initialType?: 'income' | 'expense';
  initialData?: Partial<Omit<Transaction, 'id' | 'date'>>;
  smartSuggestionsEnabled?: boolean;
}

const AddTransactionModal: React.FC<AddTransactionModalProps> = ({ onClose, onSaveTransaction, transactionToEdit, initialType = 'expense', initialData, smartSuggestionsEnabled = true }) => {
  const isEditing = transactionToEdit !== null;
  const [type, setType] = useState<'income' | 'expense'>(() => transactionToEdit?.type || initialData?.type || initialType);
  const [description, setDescription] = useState(() => transactionToEdit?.description || initialData?.description || '');
  const [amount, setAmount] = useState(() => transactionToEdit?.amount?.toString() || initialData?.amount?.toString() || '');
  const [category, setCategory] = useState(() => {
    if (transactionToEdit) return transactionToEdit.category;
    if (initialData?.category) return initialData.category;
    const typeToUse = initialData?.type || initialType;
    return Object.values(TRANSACTION_CATEGORIES[typeToUse])[0][0];
  });
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);

  useEffect(() => {
    if (transactionToEdit) {
      setType(transactionToEdit.type);
      setDescription(transactionToEdit.description);
      setAmount(transactionToEdit.amount.toString());
      setCategory(transactionToEdit.category);
    } else {
      const typeToUse = initialData?.type || initialType;
      setType(typeToUse);
      setDescription(initialData?.description || '');
      setAmount(initialData?.amount?.toString() || '');
      setCategory(initialData?.category || Object.values(TRANSACTION_CATEGORIES[typeToUse])[0][0]);
    }
  }, [transactionToEdit, initialType, initialData]);

  // Test AI on component mount
  useEffect(() => {
    console.log('🚀 Testing AI suggestions...');
    testAI();
  }, []);

  // Generate AI category suggestions when description changes
  useEffect(() => {
    if (smartSuggestionsEnabled && description.length > 2) {
      const availableCategories = Object.values(TRANSACTION_CATEGORIES[type]).flat() as string[];
      const suggestions = suggestCategory(description, availableCategories)
        .map(suggestion => suggestion.category);
      setAiSuggestions(suggestions);
      console.log('🤖 AI Suggestions for "' + description + '":', suggestions);
    } else {
      setAiSuggestions([]);
    }
  }, [description, type, smartSuggestionsEnabled]);


  const handleTypeChange = (newType: 'income' | 'expense') => {
    setType(newType);
    const newTypeCategories = Object.values(TRANSACTION_CATEGORIES[newType]).flat();
    if (!newTypeCategories.includes(category)) {
      setCategory(Object.values(TRANSACTION_CATEGORIES[newType])[0][0]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description || !amount || !category) {
      alert('Please fill all fields');
      return;
    }
    onSaveTransaction({
      id: transactionToEdit?.id,
      description,
      amount: parseFloat(amount),
      type,
      category,
    });
  };

  const categories = TRANSACTION_CATEGORIES[type];

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 modal-fade-in"
      onClick={onClose}
    >
      <div 
        className="bg-[rgb(var(--color-card-rgb))] rounded-2xl shadow-lg p-6 md:p-8 w-full max-w-md transition-colors max-h-[90vh] overflow-y-auto modal-content-slide-up relative"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-[rgb(var(--color-text-rgb))]">{isEditing ? 'Edit Transaction' : 'Add Transaction'}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-[rgb(var(--color-text-muted-rgb))] mb-2">Type</label>
            <div className="flex rounded-lg border p-1 bg-[rgb(var(--color-bg-rgb))] border-[rgb(var(--color-border-rgb))]">
              <button
                type="button"
                onClick={() => handleTypeChange('expense')}
                className={`w-1/2 py-2 rounded-md text-sm font-semibold transition-colors ${type === 'expense' ? 'bg-[rgb(var(--color-card-rgb))] shadow text-[rgb(var(--color-text-rgb))]' : 'text-[rgb(var(--color-text-muted-rgb))]'}`}
              >
                Expense
              </button>
              <button
                type="button"
                onClick={() => handleTypeChange('income')}
                className={`w-1/2 py-2 rounded-md text-sm font-semibold transition-colors ${type === 'income' ? 'bg-[rgb(var(--color-card-rgb))] shadow text-[rgb(var(--color-text-rgb))]' : 'text-[rgb(var(--color-text-muted-rgb))]'}`}
              >
                Income
              </button>
            </div>
          </div>

          <div className="mb-4">
            <label htmlFor="description" className="block text-sm font-medium text-[rgb(var(--color-text-muted-rgb))]">Description</label>
            <input
              type="text"
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="mt-1 block w-full px-3 py-2 bg-[rgb(var(--color-card-muted-rgb))] border border-[rgb(var(--color-border-rgb))] rounded-md text-[rgb(var(--color-text-rgb))] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--color-primary-rgb))] sm:text-sm placeholder:text-gray-400"
              placeholder="e.g. Coffee"
              required
            />
            {aiSuggestions.length > 0 && (
              <div className="mt-2">
                <p className="text-xs text-[rgb(var(--color-text-muted-rgb))] mb-2">Smart suggestions:</p>
                <div className="flex flex-wrap gap-2">
                  {aiSuggestions.map((suggestion, index) => (
                    <button
                      key={suggestion}
                      type="button"
                      onClick={() => {
                        console.log('🎯 Clicking suggestion:', suggestion);
                        setCategory(suggestion);
                      }}
                      className={`px-3 py-1 text-xs rounded-full transition-colors ${
                        category === suggestion
                          ? 'bg-[rgb(var(--color-primary-rgb))] text-[rgb(var(--color-primary-text-rgb))]'
                          : 'bg-[rgb(var(--color-card-muted-rgb))] text-[rgb(var(--color-text-muted-rgb))] hover:bg-[rgb(var(--color-border-rgb))]'
                      }`}
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="mb-4">
            <label htmlFor="amount" className="block text-sm font-medium text-[rgb(var(--color-text-muted-rgb))]">Amount</label>
            <div className="mt-1 relative rounded-md">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-[rgb(var(--color-text-muted-rgb))] sm:text-sm">$</span>
                </div>
                <input
                    type="number"
                    id="amount"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="block w-full pl-7 pr-12 py-2 bg-[rgb(var(--color-card-muted-rgb))] border border-[rgb(var(--color-border-rgb))] rounded-md text-[rgb(var(--color-text-rgb))] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--color-primary-rgb))] sm:text-sm placeholder:text-gray-400"
                    placeholder="0.00"
                    required
                />
            </div>
          </div>

          <div className="mb-6">
            <label htmlFor="category" className="block text-sm font-medium text-[rgb(var(--color-text-muted-rgb))]">Category</label>
            <select
              id="category"
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

          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-[rgb(var(--color-text-rgb))] bg-[rgb(var(--color-card-muted-rgb))] rounded-lg hover:bg-[rgb(var(--color-border-rgb))] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-[rgb(var(--color-primary-text-rgb))] bg-[rgb(var(--color-primary-rgb))] rounded-lg hover:bg-[rgb(var(--color-primary-hover-rgb))] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[rgb(var(--color-primary-rgb))]"
            >
              {isEditing ? 'Save Changes' : 'Add Transaction'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddTransactionModal;
