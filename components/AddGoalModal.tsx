import React, { useState, useEffect } from 'react';
import { Goal, GoalAllocationRule } from '../types';
import BaseModal from './BaseModal';
import { FormField, Input, Button, Select } from './ModalForm';
import { createDefaultAllocationRules, validateAllocationRules } from '../utils/goalUtils';
import { TrashIcon, PlusIcon } from './icons';
import { TRANSACTION_CATEGORIES } from '../constants';

interface AddGoalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveGoal: (goal: Omit<Goal, 'id'> & { id?: string }) => void;
  goalToEdit: Goal | null;
}

const AddGoalModal: React.FC<AddGoalModalProps> = ({ isOpen, onClose, onSaveGoal, goalToEdit }) => {
  const [step, setStep] = useState(1);
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
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const isEditing = goalToEdit !== null;

  useEffect(() => {
    if (isOpen) {
      if (isEditing && goalToEdit) {
        setName(goalToEdit.name);
        setDescription(goalToEdit.description || '');
        setTargetAmount(goalToEdit.targetAmount.toString());
        setCurrentAmount(goalToEdit.currentAmount.toString());
        setCategory(goalToEdit.category || 'savings');
        setPriority(goalToEdit.priority || 'medium');
        setTargetDate(goalToEdit.targetDate || '');
        setAutoAllocate(goalToEdit.autoAllocate !== false);
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
      setStep(1);
      setErrors({});
    }
  }, [goalToEdit, isEditing, isOpen]);

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};
    if (!name.trim()) newErrors.name = 'Goal name is required';
    if (!targetAmount.trim()) {
      newErrors.targetAmount = 'Target amount is required';
    } else {
      const target = parseFloat(targetAmount);
      if (isNaN(target) || target <= 0) newErrors.targetAmount = 'Please enter a valid target amount > 0';
    }
    const current = parseFloat(currentAmount || '0');
    if (isNaN(current) || current < 0) newErrors.currentAmount = 'Please enter a valid non-negative amount';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNextStep = () => {
    if (validateForm()) {
      setStep(2);
    }
  };

  const handlePrevStep = () => {
    setStep(1);
  };

  const handleAddRule = () => {
    const newRule: GoalAllocationRule = {
      id: `rule_${Date.now()}`,
      goalId: goalToEdit?.id || '',
      type: 'percentage',
      value: 10,
      applyToIncome: true,
      applyToExpense: false,
      categories: [],
    };
    setAllocationRules([...allocationRules, newRule]);
  };

  const handleUpdateRule = (index: number, updatedRule: GoalAllocationRule) => {
    const newRules = [...allocationRules];
    newRules[index] = updatedRule;
    setAllocationRules(newRules);
  };

  const handleRemoveRule = (index: number) => {
    setAllocationRules(allocationRules.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      const ruleErrors = validateAllocationRules(allocationRules);
      if (ruleErrors.length > 0) {
        setErrors({ allocationRules: ruleErrors.join(', ') });
        setIsSubmitting(false);
        return;
      }

      const rulesWithGoalId = allocationRules.map(rule => ({
        ...rule,
        goalId: goalToEdit?.id || ''
      }));

      await onSaveGoal({
        id: goalToEdit?.id,
        name: name.trim(),
        description: description.trim(),
        targetAmount: parseFloat(targetAmount),
        currentAmount: parseFloat(currentAmount || '0'),
        category,
        priority,
        targetDate: targetDate || undefined,
        isActive: true,
        allocationRules: rulesWithGoalId,
        progressHistory: goalToEdit?.progressHistory || [],
        autoAllocate,
        monthlyTarget: 0,
      } as Goal);
      onClose();
    } catch (error) {
      console.error('Error saving goal:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStepIndicator = () => (
    <div className="flex items-center justify-center mb-6">
      <div className="flex items-center space-x-4">
        <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
          step >= 1 ? 'bg-[rgb(var(--color-primary-rgb))] text-white' : 'bg-gray-200 text-gray-600'
        }`}>
          1
        </div>
        <div className={`w-12 h-0.5 ${
          step >= 2 ? 'bg-[rgb(var(--color-primary-rgb))]' : 'bg-gray-200'
        }`} />
        <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
          step >= 2 ? 'bg-[rgb(var(--color-primary-rgb))] text-white' : 'bg-gray-200 text-gray-600'
        }`}>
          2
        </div>
      </div>
    </div>
  );

  const renderStep1 = () => (
    <div className="space-y-6 p-6">
      <div className="text-center">
        <h3 className="text-lg font-semibold text-[rgb(var(--color-text-rgb))] mb-2">
          Goal Details
        </h3>
        <p className="text-sm text-[rgb(var(--color-text-muted-rgb))]">
          Set up your savings goal with basic information
        </p>
      </div>

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
        hint="Optional: Add more details about your goal"
      >
        <Input 
          id="description" 
          type="text" 
          value={description} 
          onChange={(e) => setDescription(e.target.value)} 
          placeholder="e.g. Family vacation to Japan" 
        />
      </FormField>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField 
          label="Category" 
          htmlFor="category"
          hint="Type of goal"
        >
          <Select 
            id="category" 
            value={category} 
            onChange={(e) => setCategory(e.target.value as Goal['category'])}
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
          hint="Goal importance"
        >
          <Select 
            id="priority" 
            value={priority} 
            onChange={(e) => setPriority(e.target.value as Goal['priority'])}
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
          leftIcon={<span className="text-[rgb(var(--color-text-muted-rgb))] text-sm">$</span>} 
        />
      </FormField>

      <FormField 
        label="Target Date" 
        htmlFor="targetDate"
        hint="When do you want to achieve this goal?"
      >
        <Input 
          id="targetDate" 
          type="date" 
          value={targetDate} 
          onChange={(e) => setTargetDate(e.target.value)} 
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
          leftIcon={<span className="text-[rgb(var(--color-text-muted-rgb))] text-sm">$</span>} 
        />
      </FormField>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6 p-6">
      <div className="text-center">
        <h3 className="text-lg font-semibold text-[rgb(var(--color-text-rgb))] mb-2">
          Allocation Rules
        </h3>
        <p className="text-sm text-[rgb(var(--color-text-muted-rgb))]">
          Set up automatic contributions to your goal
        </p>
      </div>

      <div className="space-y-3 border-t border-[rgb(var(--color-border-rgb))] pt-3">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-sm font-medium text-[rgb(var(--color-text-rgb))]">
              Automatic Allocation
            </h4>
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
          <div className="bg-[rgb(var(--color-card-muted-rgb))] border border-[rgb(var(--color-border-rgb))] p-4 rounded-lg space-y-4">
            <div className="flex items-center justify-between">
              <h5 className="text-sm font-medium text-[rgb(var(--color-text-rgb))]">
                Allocation Rules
              </h5>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    const defaultRules = createDefaultAllocationRules(category);
                    setAllocationRules([...allocationRules, ...defaultRules]);
                  }}
                  className="text-xs"
                >
                  Add Default
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={handleAddRule}
                  className="flex items-center gap-1 text-xs"
                >
                  <PlusIcon className="w-3 h-3" />
                  Add Rule
                </Button>
              </div>
            </div>

            {allocationRules.length > 0 ? (
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {allocationRules.map((rule, index) => (
                  <div key={rule.id} className="p-3 bg-[rgb(var(--color-card-rgb))] border border-[rgb(var(--color-border-rgb))] rounded-lg space-y-3">
                    <div className="flex items-center gap-2">
                      <Select
                        value={rule.type}
                        onChange={(e) => {
                          const newType = e.target.value as GoalAllocationRule['type'];
                          handleUpdateRule(index, {
                            ...rule,
                            type: newType,
                            value: newType === 'percentage' ? 10 : 5,
                            applyToIncome: true,
                            applyToExpense: false
                          });
                        }}
                        className="flex-1"
                      >
                        <option value="percentage">Percentage of Income</option>
                        <option value="amount">Fixed Amount per Income</option>
                      </Select>
                      <Button
                        type="button"
                        variant="danger"
                        size="sm"
                        onClick={() => handleRemoveRule(index)}
                        className="p-2"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </Button>
                    </div>

                    {rule.type === 'percentage' && (
                      <div className="space-y-2">
                        <Input
                          type="number"
                          value={rule.value}
                          onChange={(e) => {
                            const value = parseFloat(e.target.value);
                            if (!isNaN(value) && value >= 0 && value <= 100) {
                              handleUpdateRule(index, { ...rule, value });
                            } else if (e.target.value === '') {
                              handleUpdateRule(index, { ...rule, value: 0 });
                            }
                          }}
                          placeholder="10"
                          min="0"
                          max="100"
                          step="0.1"
                          className="text-center text-lg font-semibold"
                          rightIcon={<span className="text-[rgb(var(--color-primary-rgb))] text-sm font-medium">%</span>}
                        />
                        <div className="flex justify-between text-xs text-[rgb(var(--color-text-muted-rgb))]">
                          <span>0%</span>
                          <span>100%</span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          step="0.1"
                          value={rule.value}
                          onChange={(e) => handleUpdateRule(index, { ...rule, value: parseFloat(e.target.value) })}
                          className="w-full h-2 bg-[rgb(var(--color-border-rgb))] rounded-lg appearance-none cursor-pointer slider"
                          style={{
                            background: `linear-gradient(to right, rgb(var(--color-primary-rgb)) 0%, rgb(var(--color-primary-rgb)) ${rule.value}%, rgb(var(--color-border-rgb)) ${rule.value}%, rgb(var(--color-border-rgb)) 100%)`
                          }}
                        />
                      </div>
                    )}

                    {rule.type === 'amount' && (
                      <div className="space-y-2">
                        <Input
                          type="number"
                          value={rule.value}
                          onChange={(e) => {
                            const value = parseFloat(e.target.value);
                            if (!isNaN(value) && value >= 0) {
                              handleUpdateRule(index, { ...rule, value });
                            } else if (e.target.value === '') {
                              handleUpdateRule(index, { ...rule, value: 0 });
                            }
                          }}
                          placeholder="5.00"
                          min="0"
                          step="0.01"
                          className="text-center text-lg font-semibold"
                          leftIcon={<span className="text-[rgb(var(--color-primary-rgb))] text-sm font-medium">$</span>}
                        />
                        <div className="flex gap-2">
                          {[5, 10, 25, 50, 100].map(amount => (
                            <button
                              key={amount}
                              type="button"
                              onClick={() => handleUpdateRule(index, { ...rule, value: amount })}
                              className={`flex-1 py-1 px-2 text-xs rounded-md transition-colors ${
                                rule.value === amount
                                  ? 'bg-[rgb(var(--color-primary-rgb))] text-white'
                                  : 'bg-[rgb(var(--color-card-muted-rgb))] text-[rgb(var(--color-text-muted-rgb))] hover:bg-[rgb(var(--color-border-rgb))]'
                              }`}
                            >
                              ${amount}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="p-3 bg-[rgb(var(--color-card-muted-rgb))] rounded-lg">
                      <p className="text-sm text-[rgb(var(--color-text-muted-rgb))]">
                        {rule.type === 'percentage'
                          ? `${rule.value}% of each income transaction will be allocated to this goal`
                          : `$${rule.value} from each income transaction will be allocated to this goal`
                        }
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-[rgb(var(--color-text-muted-rgb))]">
                <p className="text-sm mb-2">No allocation rules set yet</p>
                <p className="text-xs">Add rules to automatically contribute to this goal when you add transactions</p>
              </div>
            )}

            {errors.allocationRules && (
              <p className="text-sm text-red-500 flex items-center">
                <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                {errors.allocationRules}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );

  const renderStepActions = () => (
    <div className="flex justify-between items-center pt-4 border-t border-[rgb(var(--color-border-rgb))] px-6 pb-6">
      {step === 1 ? (
        <div />
      ) : (
        <Button
          type="button"
          variant="secondary"
          onClick={handlePrevStep}
          disabled={isSubmitting}
        >
          Previous
        </Button>
      )}
      
      <div className="flex gap-3">
        <Button
          type="button"
          variant="secondary"
          onClick={onClose}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
        
        {step === 1 ? (
          <Button
            type="button"
            variant="primary"
            onClick={handleNextStep}
          >
            Next: Allocation Rules
          </Button>
        ) : (
          <Button
            type="submit"
            variant="primary"
            loading={isSubmitting}
            onClick={handleSubmit}
          >
            {isEditing ? 'Save Changes' : 'Create Goal'}
          </Button>
        )}
      </div>
    </div>
  );

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Edit Goal' : 'Add New Goal'}
      size="xl"
      aria-label={`${isEditing ? 'Edit' : 'Add'} goal form`}
    >
      <div className="max-h-[calc(90vh-120px)] overflow-y-auto">
        {renderStepIndicator()}
        {step === 1 ? renderStep1() : renderStep2()}
        {renderStepActions()}
      </div>
    </BaseModal>
  );
};

export default AddGoalModal;
