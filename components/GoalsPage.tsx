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
}> = ({ goal, onEdit, onDelete }) => {
  const progress = goal.targetAmount > 0 ? (goal.currentAmount / goal.targetAmount) * 100 : 0;
  const progressClamped = Math.min(Math.max(progress, 0), 100);

  const priorityColors = {
    low: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400',
    medium: 'bg-blue-50 text-blue-600 dark:bg-blue-950/30 dark:text-blue-400',
    high: 'bg-rose-50 text-rose-600 dark:bg-rose-950/30 dark:text-rose-400'
  };

  return (
    <div className="bg-[rgb(var(--color-card-rgb))] rounded-3xl p-6 border border-[rgb(var(--color-border-rgb))] shadow-sm transition-all hover:shadow-md hover:border-[rgb(var(--color-primary-rgb),0.3)]">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h3 className="font-bold text-xl text-[rgb(var(--color-text-rgb))] leading-tight mb-1">{goal.name}</h3>
          <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md ${priorityColors[goal.priority as keyof typeof priorityColors] || priorityColors.medium}`}>
            {goal.priority || 'medium'}
          </span>
        </div>
        <div className="flex gap-1">
          <button onClick={onEdit} className="p-2 text-[rgb(var(--color-text-muted-rgb))] hover:text-[rgb(var(--color-primary-rgb))] hover:bg-[rgb(var(--color-primary-subtle-rgb))] rounded-xl transition-all">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
          </button>
          <button onClick={onDelete} className="p-2 text-[rgb(var(--color-text-muted-rgb))] hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-xl transition-all">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
          </button>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <div className="flex justify-between items-end mb-2">
            <span className="text-3xl font-black text-[rgb(var(--color-text-rgb))] tracking-tighter">
              {progressClamped.toFixed(0)}<span className="text-sm font-medium text-[rgb(var(--color-text-muted-rgb))] ml-1">%</span>
            </span>
            <span className="text-xs font-bold text-[rgb(var(--color-text-muted-rgb))] uppercase tracking-tight">
              {formatCurrency(goal.currentAmount)} / {formatCurrency(goal.targetAmount)}
            </span>
          </div>
          <div className="h-3 w-full bg-[rgb(var(--color-bg-rgb))] rounded-full overflow-hidden border border-[rgb(var(--color-border-rgb))]">
            <div 
              className="h-full bg-gradient-to-r from-[rgb(var(--color-primary-rgb))] to-[rgb(var(--color-primary-hover-rgb))] rounded-full transition-all duration-1000 ease-out"
              style={{ width: `${progressClamped}%` }}
            ></div>
          </div>
        </div>

        {goal.targetDate && (
          <div className="text-xs font-bold text-[rgb(var(--color-text-muted-rgb))] pt-2 border-t border-[rgb(var(--color-border-rgb))] border-dashed uppercase tracking-widest">
            Target: {new Date(goal.targetDate).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}
          </div>
        )}
      </div>
    </div>
  );
};

const GoalsPage: React.FC<GoalsPageProps> = ({ goals, goalContributions, onAddNewGoal, onEditGoal, onDeleteGoal, onOpenConfirmModal }) => {
  return (
    <div className="flex flex-col h-full w-full max-w-4xl mx-auto animate-fade-in-up bg-transparent pb-20">
       <div className="flex justify-between items-center mb-10 mt-2">
         <h1 className="text-3xl font-black tracking-tight text-[rgb(var(--color-text-rgb))]">Goals</h1>
        <button
          onClick={onAddNewGoal}
          className="flex items-center justify-center p-4 sm:px-10 sm:py-4 text-[rgb(var(--color-primary-rgb))] bg-[rgb(var(--color-primary-subtle-rgb))] hover:bg-[rgb(var(--color-primary-rgb))] hover:text-white rounded-2xl transition-all duration-300 shadow-md hover:shadow-lg hover:scale-105"
          aria-label="Add new goal"
        >
          <span className="font-black text-2xl leading-none">+</span>
        </button>
      </div>
      {goals.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
        <div className="flex flex-col items-center justify-center text-center bg-[rgb(var(--color-card-rgb))] rounded-2xl shadow-sm border border-[rgb(var(--color-border-rgb))] p-12 mt-4 space-y-4">
          <div className="bg-[rgb(var(--color-primary-subtle-rgb))] p-4 rounded-full">
            <PlusIcon className="h-10 w-10 text-[rgb(var(--color-primary-rgb))]" />
          </div>
          <div className="max-w-xs">
            <h2 className="text-xl font-bold text-[rgb(var(--color-text-rgb))]">No goals set yet!</h2>
            <p className="mt-2 text-[rgb(var(--color-text-muted-rgb))]">Start tracking your financial future by adding your first goal.</p>
          </div>
          <button
            onClick={onAddNewGoal}
            className="mt-4 px-6 py-2 font-bold text-white bg-[rgb(var(--color-primary-rgb))] rounded-lg shadow-md hover:bg-[rgb(var(--color-primary-hover-rgb))] transition-colors"
          >
            Create My First Goal
          </button>
        </div>
      )}
    </div>
  );
};

export default GoalsPage;
