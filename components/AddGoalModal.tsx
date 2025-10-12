import React, { useState, useEffect } from 'react';
import { Goal } from '../types';

interface AddGoalModalProps {
  onClose: () => void;
  onSaveGoal: (goal: Omit<Goal, 'id'> & { id?: string }) => void;
  goalToEdit: Goal | null;
}

const AddGoalModal: React.FC<AddGoalModalProps> = ({ onClose, onSaveGoal, goalToEdit }) => {
  const [name, setName] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [currentAmount, setCurrentAmount] = useState('');

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !targetAmount) {
      alert('Please fill out Name and Target Amount.');
      return;
    }
    const target = parseFloat(targetAmount);
    const current = parseFloat(currentAmount || '0');

    if (isNaN(target) || isNaN(current) || target <= 0) {
      alert('Please enter valid numbers for amounts. Target amount must be greater than 0.');
      return;
    }

    if (current < 0) {
        alert('Current amount cannot be negative.');
        return;
    }

    onSaveGoal({
      id: goalToEdit?.id,
      name,
      targetAmount: target,
      currentAmount: current,
    });
  };

  const inputClasses = "mt-1 block w-full px-3 py-2 bg-[rgb(var(--color-card-muted-rgb))] border border-[rgb(var(--color-border-rgb))] rounded-md text-[rgb(var(--color-text-rgb))] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--color-primary-rgb))] sm:text-sm";

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div 
        className="bg-[rgb(var(--color-card-rgb))] rounded-2xl shadow-lg p-6 md:p-8 w-full max-w-md transition-colors max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-[rgb(var(--color-text-rgb))]">{isEditing ? 'Edit Goal' : 'Add New Goal'}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-[rgb(var(--color-text-muted-rgb))]">Goal Name</label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={inputClasses}
              placeholder="e.g. Vacation Fund"
              required
            />
          </div>

          <div>
            <label htmlFor="targetAmount" className="block text-sm font-medium text-[rgb(var(--color-text-muted-rgb))]">Target Amount</label>
            <input
              type="number"
              id="targetAmount"
              step="0.01"
              min="0.01"
              value={targetAmount}
              onChange={(e) => setTargetAmount(e.target.value)}
              className={inputClasses}
              placeholder="5000"
              required
            />
          </div>

          <div>
            <label htmlFor="currentAmount" className="block text-sm font-medium text-[rgb(var(--color-text-muted-rgb))]">Current Amount Saved</label>
            <input
              type="number"
              id="currentAmount"
              step="0.01"
              min="0"
              value={currentAmount}
              onChange={(e) => setCurrentAmount(e.target.value)}
              className={inputClasses}
              placeholder="0"
            />
          </div>

          <div className="flex justify-end space-x-4 pt-4">
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
              {isEditing ? 'Save Changes' : 'Add Goal'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddGoalModal;