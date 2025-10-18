import React, { useState, useEffect } from 'react';
import { Goal, GoalAllocationRule } from '../types';
import BaseModal from './BaseModal';
import { FormField, Input, Button, Select } from './ModalForm';
import { createDefaultAllocationRules, validateAllocationRules } from '../utils/goalUtils';

interface AddGoalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveGoal: (goal: Omit<Goal, 'id'> & { id?: string }) => void;
  goalToEdit: Goal | null;
}

const AddGoalModal: React.FC<AddGoalModalProps> = ({ isOpen, onClose, onSaveGoal, goalToEdit }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [currentAmount, setCurrentAmount] = useState('');
  const [category, setCategory] = useState<Goal['category']>('savings');
  const [priority, setPriority] = useState<Goal['priority']>('medium');
  const [targetDate, setTargetDate] = useState('');
  const [autoAllocate, setAutoAllocate] = useState(true);
  const [allocationRules, setAllocationRules] = useState<GoalAllocationRule[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{[key: string]: string}>({});

  const isEditing = goalToEdit !== null;

  useEffect(() => {
    if (isEditing && goalToEdit) {
      setName(goalToEdit.name);
      setDescription(goalToEdit.description || '');
      setTargetAmount(goalToEdit.targetAmount.toString());
      setCurrentAmount(goalToEdit.currentAmount.toString());
      setCategory(goalToEdit.category || 'savings');
      setPriority(goalToEdit.priority || 'medium');
      setTargetDate(goalToEdit.targetDate || '');
      setAutoAllocate(goalToEdit.autoAllocate !== false); // Default to true if undefined
      setAllocationRules(goalToEdit.allocationRules || []);
    } else {
      setName('');
      setDescription('');
      setTargetAmount('');
      setCurrentAmount('0');
      setCategory('savings');
      setPriority('medium');
      setTargetDate('');
      setAutoAllocate(true);
      setAllocationRules([]);
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

      // Validate allocation rules
      const ruleErrors = validateAllocationRules(allocationRules);
      if (ruleErrors.length > 0) {
        setErrors({ allocationRules: ruleErrors.join(', ') });
        return;
      }

      // Set up allocation rules with goal ID
      const rulesWithGoalId = allocationRules.map(rule => ({
        ...rule,
        goalId: goalToEdit?.id || ''
      }));

      await onSaveGoal({
        id: goalToEdit?.id,
        name: name.trim(),
        description: description.trim(),
        targetAmount: target,
        currentAmount: current,
        category,
        priority,
        targetDate: targetDate || undefined,
        isActive: true,
        allocationRules: rulesWithGoalId,
        progressHistory: goalToEdit?.progressHistory || [],
        autoAllocate,
        monthlyTarget: 0, // Will be calculated by utility function
      } as Goal);
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
      size="xl"
      aria-label={`${isEditing ? 'Edit' : 'Add'} goal form`}
    >
      <div className="max-h-[calc(90vh-120px)] overflow-y-auto">
        <form onSubmit={handleSubmit} className="space-y-4 p-6">
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
          label="Description"
          htmlFor="description"
          error={errors.description}
          hint="Optional: Add more details about your goal"
        >
          <Input
            id="description"
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="e.g. Family vacation to Japan"
            error={errors.description}
          />
        </FormField>

        <div className="grid grid-cols-2 gap-4">
          <FormField
            label="Category"
            htmlFor="category"
            error={errors.category}
            hint="Type of goal"
          >
            <Select
              id="category"
              value={category}
              onChange={(e) => setCategory(e.target.value as Goal['category'])}
              error={errors.category}
            >
              <option value="emergency">Emergency Fund</option>
              <option value="savings">Savings</option>
              <option value="investment">Investment</option>
              <option value="debt">Debt Payoff</option>
              <option value="purchase">Purchase</option>
              <option value="custom">Custom</option>
            </Select>
          </FormField>

          <FormField
            label="Priority"
            htmlFor="priority"
            error={errors.priority}
            hint="Goal importance"
          >
            <Select
              id="priority"
              value={priority}
              onChange={(e) => setPriority(e.target.value as Goal['priority'])}
              error={errors.priority}
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </Select>
          </FormField>
        </div>

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
            inputMode="decimal"
            pattern="[0-9]*"
            leftIcon={
              <span className="text-[rgb(var(--color-text-muted-rgb))] text-sm">$</span>
            }
          />
        </FormField>

        <FormField
          label="Target Date"
          htmlFor="targetDate"
          error={errors.targetDate}
          hint="When do you want to achieve this goal?"
        >
          <Input
            id="targetDate"
            type="date"
            value={targetDate}
            onChange={(e) => setTargetDate(e.target.value)}
            error={errors.targetDate}
            min={new Date().toISOString().split('T')[0]}
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
            inputMode="decimal"
            pattern="[0-9]*"
            leftIcon={
              <span className="text-[rgb(var(--color-text-muted-rgb))] text-sm">$</span>
            }
          />
        </FormField>

        <div className="space-y-3 border-t border-[rgb(var(--color-border-rgb))] pt-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-[rgb(var(--color-text-rgb))]">
                Automatic Allocation
              </h3>
              <p className="text-xs text-[rgb(var(--color-text-muted-rgb))]">
                Automatically contribute to this goal when adding transactions
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={autoAllocate}
                onChange={(e) => setAutoAllocate(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-[rgb(var(--color-border-rgb))] peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[rgb(var(--color-primary-rgb))]"></div>
            </label>
          </div>

          {autoAllocate && (
            <div className="bg-[rgb(var(--color-card-muted-rgb))] border border-[rgb(var(--color-border-rgb))] p-3 rounded-lg space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium text-[rgb(var(--color-text-rgb))]">
                  Allocation Rules
                </h4>
                <button
                  type="button"
                  onClick={() => {
                    const defaultRules = createDefaultAllocationRules(category);
                    setAllocationRules([...allocationRules, ...defaultRules]);
                  }}
                  className="text-xs text-[rgb(var(--color-primary-rgb))] hover:text-[rgb(var(--color-primary-hover-rgb))] hover:underline transition-colors"
                >
                  Add Default Rules
                </button>
              </div>

              {allocationRules.length > 0 ? (
                <div className="space-y-2 max-h-24 overflow-y-auto">
                  {allocationRules.map((rule, index) => (
                    <div key={rule.id} className="flex items-center gap-2 p-2 bg-[rgb(var(--color-card-rgb))] border border-[rgb(var(--color-border-rgb))] rounded-lg">
                      <span className="text-xs text-[rgb(var(--color-text-rgb))] flex-1 leading-relaxed">
                        {rule.type === 'percentage' && `${rule.value}% of ${rule.applyToIncome ? 'income' : ''}${rule.applyToExpense ? ' expenses' : ''}`}
                        {rule.type === 'category' && `All ${rule.categories?.join(', ')} transactions`}
                        {rule.type === 'amount' && `$${rule.value} per transaction`}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          const newRules = allocationRules.filter((_, i) => i !== index);
                          setAllocationRules(newRules);
                        }}
                        className="text-red-500 hover:text-red-700 hover:bg-red-50 p-1 rounded transition-colors text-sm flex-shrink-0"
                        aria-label="Remove rule"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-[rgb(var(--color-text-muted-rgb))] text-center py-2">
                  No allocation rules set. Click "Add Default Rules" to get started.
                </p>
              )}

              {errors.allocationRules && (
                <p className="text-xs text-red-500">{errors.allocationRules}</p>
              )}
            </div>
          )}
        </div>

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
      </div>
    </BaseModal>
  );
};

export default AddGoalModal;
