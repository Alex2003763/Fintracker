import React from 'react';
import { User } from '../types';
import Card, { CardHeader, CardTitle, CardContent } from './Card';
import { formatCurrency } from '../utils/formatters';
import AddGoalModal from './AddGoalModal';

import { Goal } from '../types';

// Deprecated local Goal interface, use types.ts


interface GoalsCardProps {
  goals: Goal[];
  user?: User;
  onAddGoal?: () => void;
  onEditGoal?: (goal: Goal) => void;
}

const GoalsCard: React.FC<GoalsCardProps> = ({ goals, user, onAddGoal, onEditGoal }) => {
  return (
    <Card>
      <CardHeader className="flex justify-between items-center">
        <CardTitle>Financial Goals</CardTitle>
        {onAddGoal && (
          <button
            onClick={onAddGoal}
            className="px-3 py-1.5 text-xs font-medium text-white bg-[rgb(var(--color-primary-rgb))] rounded-lg hover:bg-[rgb(var(--color-primary-hover-rgb))] transition-colors shadow-sm"
          >
            Add Goal
          </button>
        )}
      </CardHeader>
      <CardContent>
        {goals.length === 0 ? (
          <div className="text-center text-[rgb(var(--color-text-muted-rgb))] py-6">
            No goals yet. Start by adding one!
          </div>
        ) : (
          <ul className="space-y-3">
            {goals.map(goal => {
               const percent = Math.min(100, Math.round((goal.currentAmount / goal.targetAmount) * 100));
              return (
                <li key={goal.id} className="flex flex-col gap-1">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-[rgb(var(--color-text-rgb))]">{goal.name}</span>
                    <span className="text-[rgb(var(--color-text-muted-rgb))]">{formatCurrency(goal.currentAmount)} / {formatCurrency(goal.targetAmount)}</span>
                  </div>
                  <div className="w-full bg-[rgba(var(--color-primary-rgb),0.08)] rounded-full h-2.5">
                    <div
                      className="h-2.5 rounded-full"
                      style={{ width: `${percent}%`, backgroundColor: 'rgb(var(--color-primary-rgb))' }}
                    ></div>
                  </div>
                  <div className="text-xs text-right text-[rgb(var(--color-text-muted-rgb))]">{percent}%</div>
                  {onEditGoal && (
                    <button
                      onClick={() => onEditGoal(goal)}
                      className="text-xs text-blue-500 mt-1 self-end"
                    >
                      Edit
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
};

export default GoalsCard;