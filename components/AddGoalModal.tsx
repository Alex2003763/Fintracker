import React, { useState, useEffect } from 'react';
import { Goal } from '../types';
import BaseModal from './BaseModal';
import { FormField, Input, Button } from './ModalForm';

interface AddGoalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveGoal: (goal: Omit<Goal, 'id'> & { id?: string }) => void;
  goalToEdit: Goal | null;
}

const AddGoalModal: React.FC<AddGoalModalProps> = ({ isOpen, onClose, onSaveGoal, goalToEdit }) => {
  const [name, setName] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [currentAmount, setCurrentAmount] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{[key: string]: string}>({});

  const isEditing = goalToEdit !== null;

  useEffect(() => {
    if (isEditing) {
      setName(goalToEdit.name);
      setTargetAmount(goalToEdit.targetAmount.toString());
      setCurrentAmount(goalToEdit.currentAmount.toString());
    } else {
      setName('');
      setTargetAmount('');
      setCurrentAmount('0');
    }
  }, [goalToEdit, isEditing]);

  const validateForm = () => {
    const newErrors: {[key: string]: string} = {};

    if (!name.trim()) {
      newErrors.name = 'Goal name is required';
    }

    if (!targetAmount.trim()) {
      newErrors.targetAmount = 'Target amount is required';
    } else {
      const target = parseFloat(targetAmount);
      if (isNaN(target) || target <= 0) {
        newErrors.targetAmount = 'Please enter a valid target amount greater than 0';
      }
    }

    const current = parseFloat(currentAmount || '0');
    if (!currentAmount.trim()) {
      // Allow empty current amount (defaults to 0)
    } else if (isNaN(current) || current < 0) {
      newErrors.currentAmount = 'Please enter a valid non-negative amount';
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
      const target = parseFloat(targetAmount);
      const current = parseFloat(currentAmount || '0');

      await onSaveGoal({
        id: goalToEdit?.id,
        name: name.trim(),
        targetAmount: target,
        currentAmount: current,
      });
      onClose();
    } catch (error) {
      console.error('Error saving goal:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Edit Goal' : 'Add New Goal'}
      size="md"
      aria-label={`${isEditing ? 'Edit' : 'Add'} goal form`}
    >
      <form onSubmit={handleSubmit} className="space-y-6 p-6">
        <FormField
          label="Goal Name"
          htmlFor="name"
          required
          error={errors.name}
          hint="Choose a descriptive name for your savings goal"
        >
          <Input
            id="name"
            type="text"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (errors.name) setErrors({ ...errors, name: '' });
            }}
            placeholder="e.g. Vacation Fund, Emergency Fund"
            error={errors.name}
            autoFocus
          />
        </FormField>

        <FormField
          label="Target Amount"
          htmlFor="targetAmount"
          required
          error={errors.targetAmount}
          hint="The total amount you want to save"
        >
          <Input
            id="targetAmount"
            type="number"
            step="0.01"
            min="0.01"
            value={targetAmount}
            onChange={(e) => {
              setTargetAmount(e.target.value);
              if (errors.targetAmount) setErrors({ ...errors, targetAmount: '' });
            }}
            placeholder="5000.00"
            error={errors.targetAmount}
            leftIcon={
              <span className="text-[rgb(var(--color-text-muted-rgb))] text-sm">$</span>
            }
          />
        </FormField>

        <FormField
          label="Current Amount Saved"
          htmlFor="currentAmount"
          error={errors.currentAmount}
          hint="How much you've already saved (optional)"
        >
          <Input
            id="currentAmount"
            type="number"
            step="0.01"
            min="0"
            value={currentAmount}
            onChange={(e) => {
              setCurrentAmount(e.target.value);
              if (errors.currentAmount) setErrors({ ...errors, currentAmount: '' });
            }}
            placeholder="0.00"
            error={errors.currentAmount}
            leftIcon={
              <span className="text-[rgb(var(--color-text-muted-rgb))] text-sm">$</span>
            }
          />
        </FormField>

        <div className="flex justify-end space-x-3 pt-4 border-t border-[rgb(var(--color-border-rgb))]">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            loading={isSubmitting}
          >
            {isEditing ? 'Save Changes' : 'Add Goal'}
          </Button>
        </div>
      </form>
    </BaseModal>
  );
};

export default AddGoalModal;