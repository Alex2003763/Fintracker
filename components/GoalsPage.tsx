import React from 'react';
import { Goal, GoalContribution } from '../types';
import { PlusIcon } from './icons';
import { formatCurrency } from '../utils/formatters';
import { getGoalProgressStats, calculateMonthlyTarget } from '../utils/goalUtils';

interface GoalsPageProps {
  goals: Goal[];
  goalContributions: GoalContribution[];
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

const GoalItem: React.FC<{
  goal: Goal;
  contributions: GoalContribution[];
  onEdit: () => void;
  onDelete: () => void;
}> = ({ goal, contributions, onEdit, onDelete }) => {
  // Ensure goal has all required properties with defaults
  const safeGoal: Goal = {
    category: 'savings',
    priority: 'medium',
    isActive: true,
    allocationRules: [],
    progressHistory: [],
    autoAllocate: false,
    ...goal
  };

  const progress = safeGoal.targetAmount > 0 ? (safeGoal.currentAmount / safeGoal.targetAmount) * 100 : 0;
  const progressClamped = Math.min(Math.max(progress, 0), 100);
  const stats = getGoalProgressStats(safeGoal);
  const monthlyTarget = calculateMonthlyTarget(safeGoal);

  // Get contributions for this goal
  const goalContributions = contributions.filter(c => c.goalId === goal.id);
  const totalContributions = goalContributions.reduce((sum, c) => sum + c.amount, 0);

  // Priority color
  const priorityColors = {
    low: 'text-gray-600 bg-gray-100',
    medium: 'text-blue-600 bg-blue-100',
    high: 'text-orange-600 bg-orange-100'
  };

  // Category emoji
  const categoryEmojis = {
    emergency: '🚨',
    savings: '💰',
    investment: '📈',
    debt: '💳',
    purchase: '🛒',
    custom: '🎯'
  };

  return (
    <div className="bg-[rgb(var(--color-card-rgb))] p-4 rounded-lg shadow-sm space-y-3 flex flex-col transition-colors hover:shadow-md">
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-2">
          <span className="text-lg">{categoryEmojis[safeGoal.category]}</span>
          <div>
            <h3 className="font-bold text-lg text-[rgb(var(--color-text-rgb))]">{safeGoal.name}</h3>
            {safeGoal.description && (
              <p className="text-sm text-[rgb(var(--color-text-muted-rgb))]">{safeGoal.description}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className={`text-xs px-2 py-1 rounded-full font-medium ${priorityColors[safeGoal.priority]}`}>
            {safeGoal.priority.toUpperCase()}
          </span>
          <div className="flex space-x-2">
            <button
              onClick={onEdit}
              className="text-sm text-[rgb(var(--color-primary-subtle-text-rgb))] hover:underline focus:outline-none focus:ring-2 focus:ring-[rgb(var(--color-primary-rgb))] rounded px-1"
              aria-label={`Edit goal: ${safeGoal.name}`}
            >
              Edit
            </button>
            <button
              onClick={onDelete}
              className="text-sm text-red-500 hover:underline focus:outline-none focus:ring-2 focus:ring-red-500 rounded px-1"
              aria-label={`Delete goal: ${safeGoal.name}`}
            >
              Delete
            </button>
          </div>
        </div>
      </div>

      <div className="flex-grow flex flex-col justify-end space-y-3">
        {/* Progress Section */}
        <div>
          <div className="flex justify-between text-sm font-medium text-[rgb(var(--color-text-muted-rgb))] mb-1">
            <span>Progress</span>
            <span>{progressClamped.toFixed(0)}%</span>
          </div>
          <div
            className="w-full bg-[rgb(var(--color-border-rgb))] rounded-full h-2.5"
            role="progressbar"
            aria-valuenow={Math.round(progressClamped)}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`${safeGoal.name} progress`}
          >
            <div className="bg-[rgb(var(--color-primary-rgb))] h-2.5 rounded-full transition-all duration-300" style={{ width: `${progressClamped}%` }}></div>
          </div>
          <div className="text-right text-sm text-[rgb(var(--color-text-muted-rgb))] mt-1">
            {formatCurrency(goal.currentAmount)} / {formatCurrency(goal.targetAmount)}
          </div>
        </div>

        {/* Insights Section */}
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div>
            <span className="text-[rgb(var(--color-text-muted-rgb))]">Monthly Target:</span>
            <div className="font-medium text-[rgb(var(--color-text-rgb))]">
              {formatCurrency(monthlyTarget)}
            </div>
          </div>
          <div>
            <span className="text-[rgb(var(--color-text-muted-rgb))]">Avg Monthly:</span>
            <div className="font-medium text-[rgb(var(--color-text-rgb))]">
              {formatCurrency(stats.avgMonthly)}
            </div>
          </div>
        </div>

        {/* Target Date */}
        {safeGoal.targetDate && (
          <div className="text-xs">
            <span className="text-[rgb(var(--color-text-muted-rgb))]">Target Date:</span>
            <div className="font-medium text-[rgb(var(--color-text-rgb))]">
              {new Date(safeGoal.targetDate).toLocaleDateString()}
              {stats.projectedDate && stats.projectedDate.getTime() !== new Date(safeGoal.targetDate).getTime() && (
                <span className={`ml-2 ${stats.projectedDate > new Date(safeGoal.targetDate) ? 'text-orange-500' : 'text-green-500'}`}>
                  ({stats.projectedDate > new Date(safeGoal.targetDate) ? 'Behind' : 'On Track'})
                </span>
              )}
            </div>
          </div>
        )}

        {/* Contribution Summary */}
        {totalContributions > 0 && (
          <div className="text-xs">
            <span className="text-[rgb(var(--color-text-muted-rgb))]">Auto Contributions:</span>
            <div className="font-medium text-[rgb(var(--color-text-rgb))]">
              {formatCurrency(totalContributions)} from {goalContributions.length} transactions
            </div>
          </div>
        )}

        {/* Status Badge */}
        <div className="flex justify-between items-center pt-2 border-t border-[rgb(var(--color-border-rgb))]">
          <span className={`text-xs px-2 py-1 rounded-full ${
            progress >= 100 ? 'bg-green-100 text-green-800' :
            progress >= 75 ? 'bg-blue-100 text-blue-800' :
            progress >= 50 ? 'bg-yellow-100 text-yellow-800' :
            'bg-gray-100 text-gray-800'
          }`}>
            {progress >= 100 ? 'Completed' :
             progress >= 75 ? 'Almost There' :
             progress >= 50 ? 'Halfway' :
             'Getting Started'}
          </span>

          {!safeGoal.isActive && (
            <span className="text-xs px-2 py-1 rounded-full bg-red-100 text-red-800">
              Inactive
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

const GoalsPage: React.FC<GoalsPageProps> = ({ goals, goalContributions, onAddNewGoal, onEditGoal, onDeleteGoal, onOpenConfirmModal }) => {
  return (
     <div className="space-y-6 mobile-content">
       <div className="relative">
         <h1 className="text-2xl sm:text-3xl font-bold text-[rgb(var(--color-text-rgb))]">Financial Goals</h1>
        <button
          onClick={onAddNewGoal}
          className="absolute top-0 right-0 flex items-center px-3 py-2 text-xs sm:text-sm sm:px-4 sm:py-2 font-semibold text-[rgb(var(--color-primary-text-rgb))] bg-[rgb(var(--color-primary-rgb))] rounded-lg shadow-md hover:bg-[rgb(var(--color-primary-hover-rgb))] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--color-primary-rgb))] focus:ring-offset-2 transition-colors"
        >
          <PlusIcon className="h-3 w-3 sm:h-5 sm:w-5 mr-1 sm:mr-2" />
          <span className="hidden xs:inline">Add New Goal</span>
          <span className="xs:hidden">New Goal</span>
        </button>
      </div>

      {goals.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 px-2 sm:px-0">
          {goals.map(goal => (
            <GoalItem
              key={goal.id}
              goal={goal}
              contributions={goalContributions}
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