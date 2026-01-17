import React, { useState } from 'react';
import { Transaction, Budget, User, Goal, GoalContribution } from '../types';
import { Category } from '../types/category';
import AnalyticsDashboard from './AnalyticsDashboard';
import ReportsPage from './ReportsPage';

interface InsightsPageProps {
  transactions: Transaction[];
  budgets: Budget[];
  user: User;
  categories: Category[];
  goals: Goal[];
  goalContributions: GoalContribution[];
}

const InsightsPage: React.FC<InsightsPageProps> = ({ 
  transactions, 
  budgets, 
  user,
  categories,
  goals,
  goalContributions
}) => {
  const [activeTab, setActiveTab] = useState<'analytics' | 'reports'>('analytics');

  return (
    <div className="flex flex-col h-auto min-h-screen max-w-3xl mx-auto animate-fade-in-up bg-[rgb(var(--color-background-rgb))]">
      {/* Page Header and Tabs */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 sm:p-6 pb-2 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[rgb(var(--color-text-rgb))] tracking-tight">Insights</h1>
        </div>

        {/* Top Level Tabs */}
        <div className="flex bg-[rgb(var(--color-card-muted-rgb))] p-1 rounded-xl w-full sm:w-auto self-start sm:self-center">
            <button
                onClick={() => setActiveTab('analytics')}
                className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-xs font-medium transition-all ${
                activeTab === 'analytics'
                    ? 'bg-[rgb(var(--color-card-rgb))] text-[rgb(var(--color-text-rgb))] shadow-sm'
                    : 'text-[rgb(var(--color-text-muted-rgb))] hover:text-[rgb(var(--color-text-rgb))]'
                }`}
            >
                Analytics
            </button>
            <button
                onClick={() => setActiveTab('reports')}
                className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-xs font-medium transition-all ${
                activeTab === 'reports'
                    ? 'bg-[rgb(var(--color-card-rgb))] text-[rgb(var(--color-text-rgb))] shadow-sm'
                    : 'text-[rgb(var(--color-text-muted-rgb))] hover:text-[rgb(var(--color-text-rgb))]'
                }`}
            >
                Reports
            </button>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 min-h-0 px-2 sm:px-4 pb-8">
        {activeTab === 'analytics' && (
           <div className="flex-1 flex flex-col">
             <AnalyticsDashboard
               transactions={transactions}
               budgets={budgets}
               user={user}
               categories={categories}
             />
           </div>
        )}

        {activeTab === 'reports' && (
            <div className="flex-1 flex flex-col">
               <ReportsPage
                 transactions={transactions}
                 user={user}
                 categories={categories}
                 budgets={budgets}
                 goals={goals}
               />
            </div>
        )}
      </div>
    </div>
  );
};

export default InsightsPage;
