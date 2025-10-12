import React from 'react';
import { Goal } from '../types';
import { PlusIcon } from './icons';
import { formatCurrency } from '../utils/formatters';

interface GoalsPageProps {
  goals: Goal[];
  onAddNewGoal: () => void;
  onEditGoal: (goal: Goal) => void;
  onDeleteGoal: (id: string) => void;
  onOpenConfirmModal: (
    title: string,
    message: string,
    onConfirm: () => void,
    options?: { confirmText?: string; variant?: 'primary' | 'danger' }
  ) => void;
}

const GoalItem: React.FC<{ goal: Goal; onEdit: () => void; onDelete: () => void; }> = ({ goal, onEdit, onDelete }) => {
  const progress = goal.targetAmount > 0 ? (goal.currentAmount / goal.targetAmount) * 100 : 0;
  const progressClamped = Math.min(Math.max(progress, 0), 100);

  return (
    <div className="bg-[rgb(var(--color-card-rgb))] p-4 rounded-lg shadow-sm space-y-3 flex flex-col transition-colors">
      <div className="flex justify-between items-start">
        <h3 className="font-bold text-lg text-[rgb(var(--color-text-rgb))]">{goal.name}</h3>
        <div className="flex space-x-2 flex-shrink-0">
          <button onClick={onEdit} className="text-sm text-[rgb(var(--color-primary-subtle-text-rgb))] hover:underline">Edit</button>
          <button onClick={onDelete} className="text-sm text-red-500 hover:underline">Delete</button>
        </div>
      </div>
      <div className="flex-grow flex flex-col justify-end">
        <div>
          <div className="flex justify-between text-sm font-medium text-[rgb(var(--color-text-muted-rgb))] mb-1">
            <span>Progress</span>
            <span>{progressClamped.toFixed(0)}%</span>
          </div>
          <div className="w-full bg-[rgb(var(--color-border-rgb))] rounded-full h-2.5">
            <div className="bg-[rgb(var(--color-primary-rgb))] h-2.5 rounded-full" style={{ width: `${progressClamped}%` }}></div>
          </div>
          <div className="text-right text-sm text-[rgb(var(--color-text-muted-rgb))] mt-1">
            {formatCurrency(goal.currentAmount)} / {formatCurrency(goal.targetAmount)}
          </div>
        </div>
      </div>
    </div>
  );
};

const GoalsPage: React.FC<GoalsPageProps> = ({ goals, onAddNewGoal, onEditGoal, onDeleteGoal, onOpenConfirmModal }) => {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-[rgb(var(--color-text-rgb))]">Financial Goals</h1>
        <button
          onClick={onAddNewGoal}
          className="flex items-center px-4 py-2 bg-[rgb(var(--color-primary-rgb))] text-[rgb(var(--color-primary-text-rgb))] font-semibold rounded-lg shadow-md hover:bg-[rgb(var(--color-primary-hover-rgb))] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--color-primary-rgb))] focus:ring-offset-2 transition-colors"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          Add New Goal
        </button>
      </div>

      {goals.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {goals.map(goal => (
            <GoalItem 
              key={goal.id} 
              goal={goal} 
              onEdit={() => onEditGoal(goal)}
              onDelete={() => {
                onOpenConfirmModal(
                  'Delete Goal',
                  `Are you sure you want to delete the goal "${goal.name}"? This action cannot be undone.`,
                  () => onDeleteGoal(goal.id),
                  { confirmText: 'Delete', variant: 'danger' }
                );
              }}
            />
          ))}
        </div>
      ) : (
        <div className="text-center bg-[rgb(var(--color-card-rgb))] rounded-lg shadow p-8 mt-6 transition-colors">
          <h2 className="text-xl font-semibold text-[rgb(var(--color-text-rgb))]">No goals set yet!</h2>
          <p className="mt-2 text-[rgb(var(--color-text-muted-rgb))]">Click "Add New Goal" to start tracking your financial goals.</p>
        </div>
      )}
    </div>
  );
};

export default GoalsPage;