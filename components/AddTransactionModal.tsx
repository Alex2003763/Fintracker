import React, { useState, useEffect, useRef } from 'react';
import { Transaction, User, SubCategory } from '../types';
import { TRANSACTION_CATEGORIES } from '../constants';
import { suggestCategory } from '../utils/categoryAI';
import { parseReceiptWithGemini } from '../utils/ocr';
import BaseModal from './BaseModal';
import { FormField, Input, Select, Button, ToggleButton } from './ModalForm';
import ConfirmationModal from './ConfirmationModal';
import AmountInput from './AmountInput';

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
  const currentCategories = user?.customCategories || TRANSACTION_CATEGORIES;

  const getDefaultCategory = (transactionType: 'income' | 'expense') => {
    const flattened = Object.values(currentCategories[transactionType]).flat();
    return flattened[0]?.name || '';
  };

  const [type, setType] = useState<'income' | 'expense'>(() => transactionToEdit?.type || initialData?.type || initialType);
  const [description, setDescription] = useState(() => transactionToEdit?.description || initialData?.description || '');
  const [amount, setAmount] = useState(() => transactionToEdit?.amount?.toString() || initialData?.amount?.toString() || '');
  const [category, setCategory] = useState<string>(() => {
    if (transactionToEdit) return transactionToEdit.category;
    if (initialData?.category) return initialData.category;
    const typeToUse = initialData?.type || initialType;
    return getDefaultCategory(typeToUse) as string;
  });
  const [suggestedEmoji, setSuggestedEmoji] = useState<string | undefined>(transactionToEdit?.emoji || initialData?.emoji);
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
      setSuggestedEmoji(transactionToEdit.emoji);
    } else {
      const typeToUse = initialData?.type || initialType;
      setType(typeToUse);
      setDescription(initialData?.description || '');
      setAmount(initialData?.amount?.toString() || '');
      setCategory(initialData?.category || getDefaultCategory(typeToUse) as string);
      setSuggestedEmoji(initialData?.emoji);
    }
  }, [transactionToEdit, initialType, initialData]);

  useEffect(() => {
    if (smartSuggestionsEnabled && description.length > 2) {
      const availableCategories = Object.values(currentCategories[type]).flat().map(c => c.name);
      const suggestions = suggestCategory(description, availableCategories)
        .map(suggestion => suggestion.category);
      setAiSuggestions(suggestions);
    } else {
      setAiSuggestions([]);
    }
  }, [description, type, smartSuggestionsEnabled, currentCategories]);

  const handleTypeChange = (newType: 'income' | 'expense') => {
    setType(newType);
    const newTypeCategories = Object.values(currentCategories[newType]).flat();
    if (!newTypeCategories.map(c => c.name).includes(category as string)) {
      setCategory(getDefaultCategory(newType) as string);
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
        'gemini-2.5-flash-lite'
      );
      if (extractedData.description) setDescription(extractedData.description);
      if (extractedData.amount) setAmount(extractedData.amount.toString());
      if (extractedData.emoji) setSuggestedEmoji(extractedData.emoji);
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
        category: category as string,
        emoji: suggestedEmoji,
      });
      onClose();
    } catch (error) {
      console.error('Error saving transaction:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const categories = currentCategories[type];

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Edit Transaction' : 'Add Transaction'}
      size="lg"
      animation="slide-up"
      aria-label={`${isEditing ? 'Edit' : 'Add'} transaction form`}
    >
      <form onSubmit={handleSubmit} className="space-y-6 p-3 sm:p-6 max-h-[calc(100vh-12rem)] overflow-y-auto">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-end">
          <FormField label="Type" htmlFor="transaction-type" required className="flex-1 w-full">
            <ToggleButton
              options={[{ value: 'expense', label: 'Expense' }, { value: 'income', label: 'Income' }]}
              value={type}
              onChange={handleTypeChange}
            />
          </FormField>

          <div className="w-full sm:w-auto">
            <Button
              type="button"
              variant="secondary"
              onClick={() => fileInputRef.current?.click()}
              loading={isScanning}
              className="w-full sm:w-auto whitespace-nowrap"
              leftIcon={<span>📷</span>}
            >
              {isScanning ? 'Scanning...' : 'Scan Receipt'}
            </Button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleScanReceipt}
              className="hidden"
              accept="image/*"
            />
          </div>
        </div>

        {errors.scan && (
          <p className="text-sm text-red-500 mt-1">{errors.scan}</p>
        )}

        {suggestedEmoji && (
          <div className="p-3 bg-[rgba(var(--color-primary-rgb),0.05)] border border-[rgba(var(--color-primary-rgb),0.2)] rounded-lg flex items-center gap-3">
            <span className="text-2xl">{suggestedEmoji}</span>
            <div className="flex-1">
              <p className="text-sm text-[rgb(var(--color-text-rgb))] font-medium">
                AI suggested emoji
              </p>
              <p className="text-xs text-[rgb(var(--color-text-muted-rgb))]">
                This emoji will be saved with your transaction
              </p>
            </div>
            <button
              type="button"
              onClick={() => setSuggestedEmoji(undefined)}
              className="p-1 text-[rgb(var(--color-text-muted-rgb))] hover:text-red-600 transition-colors"
              title="Remove emoji"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}

        <FormField
          label="Description"
          htmlFor="description"
          required
          error={errors.description}
          hint="Enter a brief description"
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

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label htmlFor="amount" className="block text-sm font-medium text-[rgb(var(--color-text-muted-rgb))]">
              Amount <span className="text-red-500 ml-1">*</span>
            </label>
            <div className="bg-[rgb(var(--color-card-muted-rgb))] rounded-lg border border-[rgb(var(--color-border-rgb))] p-1">
              <AmountInput
                id="amount"
                value={amount}
                onChange={(value) => {
                  setAmount(value);
                  if (errors.amount) setErrors({ ...errors, amount: '' });
                }}
                error={errors.amount}
              />
            </div>
          </div>

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
                  {(subcategories as SubCategory[]).map(cat => (
                    <option key={cat.name} value={cat.name}>{cat.icon} {cat.name}</option>
                  ))}
                </optgroup>
              ))}
            </Select>
          </FormField>
        </div>

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
