import React, { useMemo, memo, useCallback } from 'react';
import { Goal, GoalContribution } from '../types';
import { PlusIcon } from './icons';
import { formatCurrency } from '../utils/formatters';
import { getGoalProgressStats, calculateMonthlyTarget } from '../utils/goalUtils';

// ─── Types ────────────────────────────────────────────────────────────────────

interface ConfirmOptions {
  confirmText?: string;
  variant?: 'primary' | 'danger';
}

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
    options?: ConfirmOptions
  ) => void;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const PRIORITY_STYLES = {
  low: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400',
  medium: 'bg-blue-50 text-blue-600 dark:bg-blue-950/30 dark:text-blue-400',
  high: 'bg-rose-50 text-rose-600 dark:bg-rose-950/30 dark:text-rose-400',
} as const;

const CATEGORY_ICONS: Record<string, string> = {
  emergency: '🛡️',
  savings: '💰',
  investment: '📈',
  debt: '💳',
  purchase: '🛍️',
  custom: '⭐',
};

/**
 * Bug Fix #2: `new Date('2026-04-01')` is parsed as UTC midnight, which in
 * UTC+8 becomes Mar 31 at 08:00 — displaying one day early. [web:12]
 * Fix: append 'T12:00:00' to force local noon, safely avoiding DST edges.
 */
function parseLocalDate(dateStr: string): Date {
  return new Date(`${dateStr}T12:00:00`);
}

function getDaysRemaining(targetDate: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = parseLocalDate(targetDate);
  target.setHours(0, 0, 0, 0);
  return Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

// ─── EditIcon / DeleteIcon (inline to avoid import bloat) ────────────────────

const EditIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none"
    viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
      d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
  </svg>
);

const DeleteIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none"
    viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
);

// ─── GoalItem ─────────────────────────────────────────────────────────────────

interface GoalItemProps {
  goal: Goal;
  // Bug Fix #1 + #4: now receives ONLY this goal's contributions, properly used
  contributions: GoalContribution[];
  onEdit: () => void;
  onDelete: () => void;
}

const GoalItem = memo(({ goal, contributions, onEdit, onDelete }: GoalItemProps) => {
  const priority = (goal.priority ?? 'medium') as keyof typeof PRIORITY_STYLES;
  const categoryIcon = CATEGORY_ICONS[goal.category ?? 'savings'] ?? '⭐';

  // Bug Fix #3: actually USE the imported utility functions
  const stats = useMemo(() => getGoalProgressStats(goal, contributions), [goal, contributions]);
  const monthlyTarget = useMemo(
    () => goal.targetDate ? calculateMonthlyTarget(goal) : null,
    [goal]
  );

  const progressClamped = Math.min(Math.max(stats.progressPercent ?? 0, 0), 100);
  const remaining = goal.targetAmount - goal.currentAmount;

  // Derive days remaining and urgency color
  const daysRemaining = useMemo(
    () => goal.targetDate ? getDaysRemaining(goal.targetDate) : null,
    [goal.targetDate]
  );

  const dateLabel = useMemo(() => {
    if (!goal.targetDate) return null;
    // Bug Fix #2: use parseLocalDate instead of bare new Date()
    return parseLocalDate(goal.targetDate).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  }, [goal.targetDate]);

  const daysColor =
    daysRemaining === null ? ''
    : daysRemaining < 30 ? 'text-rose-500'
    : daysRemaining < 90 ? 'text-amber-500'
    : 'text-[rgb(var(--color-text-muted-rgb))]';

  // Progress bar color shifts from primary → green when complete
  const progressBarClass =
    progressClamped >= 100
      ? 'bg-gradient-to-r from-emerald-400 to-emerald-500'
      : 'bg-gradient-to-r from-[rgb(var(--color-primary-rgb))] to-[rgb(var(--color-primary-hover-rgb))]';

  return (
    <article
      className="bg-[rgb(var(--color-card-rgb))] rounded-3xl p-6 border border-[rgb(var(--color-border-rgb))] shadow-sm transition-all hover:shadow-md hover:border-[rgb(var(--color-primary-rgb),0.3)]"
      aria-label={`Goal: ${goal.name}`}
    >
      {/* ── Header ── */}
      <div className="flex justify-between items-start mb-5">
        <div className="flex items-start gap-3 min-w-0">
          <span className="text-2xl leading-none mt-0.5 shrink-0" aria-hidden="true">
            {categoryIcon}
          </span>
          <div className="min-w-0">
            <h3 className="font-bold text-lg text-[rgb(var(--color-text-rgb))] leading-tight mb-1 truncate">
              {goal.name}
            </h3>
            {goal.description && (
              <p className="text-xs text-[rgb(var(--color-text-muted-rgb))] truncate mb-1">
                {goal.description}
              </p>
            )}
            <span className={`inline-block text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md ${PRIORITY_STYLES[priority]}`}>
              {priority}
            </span>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex gap-1 shrink-0 ml-2">
          <button
            onClick={onEdit}
            className="p-2 text-[rgb(var(--color-text-muted-rgb))] hover:text-[rgb(var(--color-primary-rgb))] hover:bg-[rgb(var(--color-primary-subtle-rgb))] rounded-xl transition-all"
            aria-label={`Edit goal: ${goal.name}`}
          >
            <EditIcon />
          </button>
          <button
            onClick={onDelete}
            className="p-2 text-[rgb(var(--color-text-muted-rgb))] hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-xl transition-all"
            aria-label={`Delete goal: ${goal.name}`}
          >
            <DeleteIcon />
          </button>
        </div>
      </div>

      {/* ── Progress ── */}
      <div className="space-y-4">
        <div>
          <div className="flex justify-between items-end mb-2">
            <span className="text-3xl font-black text-[rgb(var(--color-text-rgb))] tracking-tighter">
              {progressClamped.toFixed(0)}
              <span className="text-sm font-medium text-[rgb(var(--color-text-muted-rgb))] ml-1">%</span>
            </span>
            <div className="text-right">
              <p className="text-xs font-bold text-[rgb(var(--color-text-muted-rgb))] uppercase tracking-tight">
                {formatCurrency(goal.currentAmount)} / {formatCurrency(goal.targetAmount)}
              </p>
              {remaining > 0 && (
                <p className="text-xs text-[rgb(var(--color-text-muted-rgb))]">
                  {formatCurrency(remaining)} remaining
                </p>
              )}
            </div>
          </div>

          {/* Progress bar */}
          <div
            role="progressbar"
            aria-valuenow={progressClamped}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`${goal.name} progress`}
            className="h-3 w-full bg-[rgb(var(--color-bg-rgb))] rounded-full overflow-hidden border border-[rgb(var(--color-border-rgb))]"
          >
            <div
              className={`h-full rounded-full transition-all duration-1000 ease-out ${progressBarClass}`}
              style={{ width: `${progressClamped}%` }}
            />
          </div>
        </div>

        {/* ── Stats row (uses the previously unused utility functions) ── */}
        <div className="grid grid-cols-2 gap-3 pt-3 border-t border-dashed border-[rgb(var(--color-border-rgb))]">
          {/* Monthly target — Bug Fix #3: calculateMonthlyTarget now actually used */}
          {monthlyTarget !== null && monthlyTarget > 0 && (
            <div>
              <p className="text-[10px] uppercase tracking-widest font-bold text-[rgb(var(--color-text-muted-rgb))]">
                Monthly Target
              </p>
              <p className="text-sm font-bold text-[rgb(var(--color-text-rgb))]">
                {formatCurrency(monthlyTarget)}
              </p>
            </div>
          )}

          {/* Contributions count — Bug Fix #1 + #4: contributions now actually used */}
          {contributions.length > 0 && (
            <div>
              <p className="text-[10px] uppercase tracking-widest font-bold text-[rgb(var(--color-text-muted-rgb))]">
                Contributions
              </p>
              <p className="text-sm font-bold text-[rgb(var(--color-text-rgb))]">
                {contributions.length} total
              </p>
            </div>
          )}

          {/* Stats from getGoalProgressStats — Bug Fix #3 */}
          {stats?.onTrack !== undefined && (
            <div>
              <p className="text-[10px] uppercase tracking-widest font-bold text-[rgb(var(--color-text-muted-rgb))]">
                Status
              </p>
              <p className={`text-sm font-bold ${stats.onTrack ? 'text-emerald-500' : 'text-amber-500'}`}>
                {stats.onTrack ? '✓ On Track' : '⚠ Behind'}
              </p>
            </div>
          )}

          {/* Days remaining — Bug Fix #2: uses parseLocalDate */}
          {dateLabel && daysRemaining !== null && (
            <div>
              <p className="text-[10px] uppercase tracking-widest font-bold text-[rgb(var(--color-text-muted-rgb))]">
                Due {dateLabel}
              </p>
              <p className={`text-sm font-bold ${daysColor}`}>
                {daysRemaining > 0
                  ? `${daysRemaining}d left`
                  : daysRemaining === 0
                    ? 'Due today'
                    : 'Overdue'}
              </p>
            </div>
          )}
        </div>

        {/* Completion banner */}
        {progressClamped >= 100 && (
          <div className="text-center text-xs font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 dark:text-emerald-400 py-2 rounded-xl">
            🎉 Goal Achieved!
          </div>
        )}
      </div>
    </article>
  );
});

GoalItem.displayName = 'GoalItem';

// ─── EmptyState ───────────────────────────────────────────────────────────────

const EmptyState = memo(({ onAdd }: { onAdd: () => void }) => (
  <div className="flex flex-col items-center justify-center text-center bg-[rgb(var(--color-card-rgb))] rounded-2xl shadow-sm border border-[rgb(var(--color-border-rgb))] p-12 mt-4 space-y-4">
    <div className="bg-[rgb(var(--color-primary-subtle-rgb))] p-4 rounded-full">
      <PlusIcon className="h-10 w-10 text-[rgb(var(--color-primary-rgb))]" aria-hidden="true" />
    </div>
    <div className="max-w-xs">
      <h2 className="text-xl font-bold text-[rgb(var(--color-text-rgb))]">
        No goals set yet!
      </h2>
      <p className="mt-2 text-[rgb(var(--color-text-muted-rgb))]">
        Start tracking your financial future by adding your first goal.
      </p>
    </div>
    <button
      onClick={onAdd}
      className="mt-4 px-6 py-2 font-bold text-white bg-[rgb(var(--color-primary-rgb))] rounded-lg shadow-md hover:bg-[rgb(var(--color-primary-hover-rgb))] transition-colors"
    >
      Create My First Goal
    </button>
  </div>
));

EmptyState.displayName = 'EmptyState';

// ─── GoalsPage ────────────────────────────────────────────────────────────────

const GoalsPage: React.FC<GoalsPageProps> = ({
  goals,
  goalContributions,
  onAddNewGoal,
  onEditGoal,
  onDeleteGoal,
  onOpenConfirmModal,
}) => {
  // Bug Fix #4: pre-group contributions by goalId with useMemo
  // so each GoalItem only receives its own data [web:15]
  const contributionsByGoalId = useMemo(() => {
    const map = new Map<string, GoalContribution[]>();
    for (const c of goalContributions) {
      if (!map.has(c.goalId)) map.set(c.goalId, []);
      map.get(c.goalId)!.push(c);
    }
    return map;
  }, [goalContributions]);

  const handleDelete = useCallback(
    (goal: Goal) => {
      onOpenConfirmModal(
        'Delete Goal',
        `Are you sure you want to delete "${goal.name}"? This action cannot be undone.`,
        () => onDeleteGoal(goal.id),
        { confirmText: 'Delete', variant: 'danger' }
      );
    },
    [onOpenConfirmModal, onDeleteGoal]
  );

  return (
    <div className="flex flex-col min-h-screen w-full max-w-4xl mx-auto animate-fade-in-up bg-transparent pb-20">
      {/* Header */}
      <div className="flex justify-between items-center mb-10 mt-2">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-[rgb(var(--color-text-rgb))]">
            Goals
          </h1>
          {goals.length > 0 && (
            <p className="text-sm text-[rgb(var(--color-text-muted-rgb))] mt-0.5">
              {goals.filter(g => (g.currentAmount / g.targetAmount) >= 1).length} of {goals.length} completed
            </p>
          )}
        </div>
        <button
          onClick={onAddNewGoal}
          className="flex items-center gap-2 px-4 py-2 sm:px-6 sm:py-3 font-bold text-[rgb(var(--color-primary-rgb))] bg-[rgb(var(--color-primary-subtle-rgb))] hover:bg-[rgb(var(--color-primary-rgb))] hover:text-white rounded-2xl transition-all duration-300 shadow-sm hover:shadow-md hover:scale-105"
          aria-label="Add new goal"
        >
          {/* Use the imported PlusIcon consistently instead of raw '+' text */}
          <PlusIcon className="w-5 h-5" aria-hidden="true" />
          <span className="hidden sm:inline text-sm">New Goal</span>
        </button>
      </div>

      {goals.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {goals.map(goal => (
            <GoalItem
              key={goal.id}
              goal={goal}
              // Bug Fix #4: pass only this goal's contributions
              contributions={contributionsByGoalId.get(goal.id) ?? []}
              onEdit={() => onEditGoal(goal)}
              onDelete={() => handleDelete(goal)}
            />
          ))}
        </div>
      ) : (
        <EmptyState onAdd={onAddNewGoal} />
      )}
    </div>
  );
};

export default GoalsPage;