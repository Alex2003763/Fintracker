
import React, { useState, useEffect, useRef } from 'react';
import { Transaction, User } from '../types';
import { TRANSACTION_CATEGORIES } from '../constants';
import { suggestCategory, getBestCategorySuggestion, testAI } from '../utils/categoryAI';
import { parseReceiptWithGemini } from '../utils/ocr';
import BaseModal from './BaseModal';
import { FormField, Input, Select, Button, ToggleButton } from './ModalForm';
import ConfirmationModal from './ConfirmationModal';

interface AddTransactionModalProps {
   isOpen: boolean;
   onClose: () => void;
   onSaveTransaction: (transaction: Omit<Transaction, 'id' | 'date'> & { id?: string }) => void;
   onDeleteTransaction?: (transactionId: string) => void;
   transactionToEdit: Transaction | null;
   initialType?: 'income' | 'expense';
   initialData?: Partial<Omit<Transaction, 'id' | 'date'>>;
   smartSuggestionsEnabled?: boolean;
   user: User | null;
}

const AddTransactionModal: React.FC<AddTransactionModalProps> = ({
   isOpen,
   onClose,
   onSaveTransaction,
   onDeleteTransaction,
   transactionToEdit,
   initialType = 'expense',
   initialData,
   smartSuggestionsEnabled = true,
   user
}) => {
  const isEditing = transactionToEdit !== null;

  const getDefaultCategory = (transactionType: 'income' | 'expense') => {
    const flattened = Object.values(TRANSACTION_CATEGORIES[transactionType]).flat();
    return flattened[0] || '';
  };

  const [type, setType] = useState<'income' | 'expense'>(() => transactionToEdit?.type || initialData?.type || initialType);
  const [description, setDescription] = useState(() => transactionToEdit?.description || initialData?.description || '');
  const [amount, setAmount] = useState(() => transactionToEdit?.amount?.toString() || initialData?.amount?.toString() || '');
  const [category, setCategory] = useState(() => {
    if (transactionToEdit) return transactionToEdit.category;
    if (initialData?.category) return initialData.category;
    const typeToUse = initialData?.type || initialType;
    return getDefaultCategory(typeToUse);
  });
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      setCategory(initialData?.category || getDefaultCategory(typeToUse));
    }
  }, [transactionToEdit, initialType, initialData]);

  useEffect(() => {
    console.log('🚀 Testing AI suggestions...');
    testAI();
  }, []);

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
      setCategory(getDefaultCategory(newType));
    }
    setErrors({});
  };

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};
    if (!description.trim()) newErrors.description = 'Description is required';
    if (!amount.trim()) {
      newErrors.amount = 'Amount is required';
    } else {
      const numAmount = parseFloat(amount);
      if (isNaN(numAmount) || numAmount <= 0) {
        newErrors.amount = 'Please enter a valid positive amount';
      }
    }
    if (!category) newErrors.category = 'Category is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleScanReceipt = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = event.target.files;
    const file = fileList?.[0];
    if (!file) {
      return;
    }

    setIsScanning(true);
    setErrors({});

    try {
      if (!user?.aiSettings?.apiKey) {
        throw new Error("API key is not configured. Please set it in the settings.");
      }
      const extractedData = await parseReceiptWithGemini(
        file,
        user.aiSettings.apiKey,
        user.aiSettings.model || 'gemini-2.5-flash'
      );
      if (extractedData.description) setDescription(extractedData.description);
      if (extractedData.amount) setAmount(extractedData.amount.toString());
    } catch (error: any) {
      setErrors(prev => ({ ...prev, scan: error.message || 'Failed to scan receipt.' }));
    } finally {
      setIsScanning(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    setIsSubmitting(true);
    try {
      await onSaveTransaction({
        id: transactionToEdit?.id,
        description: description.trim(),
        amount: parseFloat(amount),
        type,
        category,
      });
      onClose();
    } catch (error) {
      console.error('Error saving transaction:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const categories = TRANSACTION_CATEGORIES[type];

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Edit Transaction' : 'Add Transaction'}
      size="lg"
      animation="slide-up"
      aria-label={`${isEditing ? 'Edit' : 'Add'} transaction form`}
    >
      <form onSubmit={handleSubmit} className="space-y-4 p-3 sm:p-6 max-h-[calc(100vh-12rem)] overflow-y-auto">
        <FormField label="Type" htmlFor="transaction-type" required>
          <ToggleButton
            options={[{ value: 'expense', label: 'Expense' }, { value: 'income', label: 'Income' }]}
            value={type}
            onChange={handleTypeChange}
          />
        </FormField>

        <FormField
          label="Scan Receipt (Optional)"
          htmlFor="scan-receipt"
          error={errors.scan}
          hint="Upload a receipt to auto-fill description and amount"
        >
          <Button
            type="button"
            variant="secondary"
            onClick={() => fileInputRef.current?.click()}
            loading={isScanning}
            className="w-full"
          >
            📷 {isScanning ? 'Scanning...' : 'Scan Receipt'}
          </Button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleScanReceipt}
            className="hidden"
            accept="image/*"
          />
        </FormField>

        <div className="relative my-4">
          <div className="absolute inset-0 flex items-center" aria-hidden="true">
            <div className="w-full border-t border-[rgb(var(--color-border-rgb))]"></div>
          </div>
          <div className="relative flex justify-center">
            <span className="bg-[rgb(var(--color-card-rgb))] px-2 text-sm text-[rgb(var(--color-text-muted-rgb))]">Or enter manually</span>
          </div>
        </div>

        <FormField
          label="Description"
          htmlFor="description"
          required
          error={errors.description}
          hint="Enter a brief description of the transaction"
        >
          <Input
            id="description"
            type="text"
            value={description}
            onChange={(e) => {
              setDescription(e.target.value);
              if (errors.description) setErrors({ ...errors, description: '' });
            }}
            placeholder="e.g. Coffee at Starbucks"
            error={errors.description}
            autoFocus
          />
          {aiSuggestions.length > 0 && (
            <div className="mt-3">
              <p className="text-xs text-[rgb(var(--color-text-muted-rgb))] mb-2 flex items-center">
                <svg className="w-4 h-4 mr-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
                <span className="truncate">Smart suggestions:</span>
              </p>
              <div className="flex flex-wrap gap-2 max-h-20 overflow-y-auto">
                {aiSuggestions.map((suggestion) => (
                  <button
                    key={suggestion}
                    type="button"
                    onClick={() => {
                      setCategory(suggestion);
                      setErrors({ ...errors, category: '' });
                    }}
                    className={`px-2 py-1 text-xs rounded-full transition-all duration-200 flex-shrink-0 ${
                      category === suggestion
                        ? 'bg-[rgb(var(--color-primary-rgb))] text-[rgb(var(--color-primary-text-rgb))] shadow-sm'
                        : 'bg-[rgb(var(--color-card-muted-rgb))] text-[rgb(var(--color-text-muted-rgb))] hover:bg-[rgb(var(--color-border-rgb))] hover:scale-105'
                    }`}
                    title={suggestion}
                  >
                    <span className="truncate max-w-24">{suggestion}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </FormField>

        <FormField
          label="Amount"
          htmlFor="amount"
          required
          error={errors.amount}
          hint="Enter the transaction amount"
        >
          <Input
            id="amount"
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
          label="Category"
          htmlFor="category"
          required
          error={errors.category}
        >
          <Select
            id="category"
            value={category}
            onChange={(e) => {
              setCategory(e.target.value);
              if (errors.category) setErrors({ ...errors, category: '' });
            }}
            error={errors.category}
          >
            {Object.entries(categories).map(([group, subcategories]) => (
              <optgroup label={group} key={group}>
                {(subcategories as string[]).map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </optgroup>
            ))}
          </Select>
        </FormField>

        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 pt-4 border-t border-[rgb(var(--color-border-rgb))]">
          {isEditing && (
            <Button
              type="button"
              variant="danger"
              onClick={() => setShowDeleteConfirmation(true)}
              disabled={isSubmitting}
              className="w-full sm:w-auto"
            >
              🗑️ Delete
            </Button>
          )}
          <div className={`flex space-x-3 ${isEditing ? 'sm:ml-auto' : 'w-full sm:w-auto sm:ml-auto'}`}>
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 sm:flex-none"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              loading={isSubmitting}
              className="flex-1 sm:flex-none"
            >
              {isEditing ? 'Save Changes' : 'Add Transaction'}
            </Button>
          </div>
        </div>
      </form>

      <ConfirmationModal
        isOpen={showDeleteConfirmation}
        onClose={() => setShowDeleteConfirmation(false)}
        onConfirm={() => {
          if (transactionToEdit && onDeleteTransaction) {
            onDeleteTransaction(transactionToEdit.id);
          }
          setShowDeleteConfirmation(false);
        }}
        title="Delete Transaction"
        message={`Are you sure you want to delete "${transactionToEdit?.description}"? This action cannot be undone.`}
        confirmButtonText="Delete"
        confirmButtonVariant="danger"
      />
    </BaseModal>
  );
};

export default AddTransactionModal;

