import React, { useState, useEffect } from 'react';
import { Transaction, SubCategory } from '../types';
import { TRANSACTION_CATEGORIES } from '../constants';
import { parseQuickAddInput } from '../utils/formatters';
import BaseModal from './BaseModal';
import { FormField, Input, Select, Button, ToggleButton } from './ModalForm';

interface QuickAddPopoverProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveTransaction: (transaction: Omit<Transaction, 'id' | 'date'>) => void;
}

const QuickAddPopover: React.FC<QuickAddPopoverProps> = ({ isOpen, onClose, onSaveTransaction }) => {
    const [inputValue, setInputValue] = useState('');
    const [type, setType] = useState<'income' | 'expense'>('expense');
    const [category, setCategory] = useState(TRANSACTION_CATEGORIES.expense['Food & Drink'][0].name);
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        setCategory(Object.values(TRANSACTION_CATEGORIES[type])[0][0].name);
    }, [type]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!inputValue.trim()) {
            setError('Please enter a description and amount');
            return;
        }

        const parsedData = parseQuickAddInput(inputValue);

        if (!parsedData) {
            setError('Invalid format. Use "Description Amount" like "Coffee 5.50"');
            return;
        }

        setIsSubmitting(true);

        try {
            await onSaveTransaction({
                description: parsedData.description,
                amount: parsedData.amount,
                type,
                category,
            });
            setInputValue('');
            onClose();
        } catch (error) {
            console.error('Error saving transaction:', error);
            setError('Failed to save transaction. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const categories = TRANSACTION_CATEGORIES[type];

    return (
        <BaseModal
             isOpen={isOpen}
             onClose={onClose}
             title="Quick Add Transaction"
             size="sm"
             animation="bounce"
             aria-label="Quick add transaction form"
         >
             <form onSubmit={handleSubmit} className="space-y-4 p-4 sm:p-6">
                <FormField
                    label="Description & Amount"
                    htmlFor="quick-add-input"
                    required
                    error={error}
                    hint='Format: "Description Amount" (e.g. "Coffee 5.50")'
                >
                    <Input
                        id="quick-add-input"
                        type="text"
                        value={inputValue}
                        onChange={(e) => {
                            setInputValue(e.target.value);
                            if (error) setError('');
                        }}
                        placeholder='e.g. "Coffee 5.50"'
                        error={error}
                        autoFocus
                        required
                    />
                </FormField>

                <FormField
                    label="Type"
                    htmlFor="transaction-type"
                    required
                >
                    <ToggleButton
                        options={[
                            { value: 'expense', label: 'Expense' },
                            { value: 'income', label: 'Income' }
                        ]}
                        value={type}
                        onChange={(value) => {
                            setType(value as 'income' | 'expense');
                            setCategory(Object.values(TRANSACTION_CATEGORIES[value as 'income' | 'expense'])[0][0].name);
                        }}
                    />
                </FormField>

                <FormField
                    label="Category"
                    htmlFor="quick-add-category"
                    required
                >
                    <Select
                        id="quick-add-category"
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                    >
                        {Object.entries(categories).map(([group, subcategories]) => (
                            <optgroup label={group} key={group}>
                                {(subcategories as SubCategory[]).map(cat => (
                                    <option key={cat.name} value={cat.name}>{cat.name}</option>
                                ))}
                            </optgroup>
                        ))}
                    </Select>
                </FormField>

                <div className="flex justify-end pt-4 border-t border-[rgb(var(--color-border-rgb))]">
                    <Button
                        type="submit"
                        variant="primary"
                        loading={isSubmitting}
                        className="w-full sm:w-auto min-h-[44px]"
                    >
                        Add Transaction
                    </Button>
                </div>
            </form>
        </BaseModal>
    );
};

export default QuickAddPopover;