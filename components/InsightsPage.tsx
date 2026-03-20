import React, { useState } from 'react';
import { Transaction, Budget, User, Goal, GoalContribution } from '../types';
import { Category } from '../types/category';
import AnalyticsDashboard from './AnalyticsDashboard';
import ReportsPage from './ReportsPage';
import ErrorBoundary from './ErrorBoundary';

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
    <div className="flex flex-col h-auto min-h-screen max-w-7xl mx-auto animate-fade-in-up md:px-4">
      {/* Page Header and Tabs */}
      <div className="bg-[rgb(var(--color-card-rgb))] sm:rounded-3xl sm:-mx-2 sm:mt-4 shadow-sm border-b sm:border border-[rgb(var(--color-border-rgb))] flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 sm:p-5 gap-4 sticky top-0 md:relative z-10 backdrop-blur-md sm:!bg-[rgb(var(--color-card-rgb))] !bg-[rgba(var(--color-card-rgb),0.9)]">
        <div>
          <h1 className="text-2xl sm:text-3xl  text-[rgb(var(--color-text-rgb))]  font-bold  bg-clip-text  tracking-tight whitespace-nowrap">Financial Insights</h1>
          <p className="text-sm text-[rgb(var(--color-text-muted-rgb))] mt-1 hidden sm:block">Deep dive into your financial habits</p>
        </div>

        {/* Top Level Tabs */}
        <div className="flex bg-[rgb(var(--color-card-muted-rgb))] p-1.5 rounded-2xl w-full sm:w-auto self-start sm:self-center shrink-0 shadow-inner">
          <button
            onClick={() => setActiveTab('analytics')}
            className={`flex-1 sm:flex-none px-6 py-2.5 rounded-xl text-sm font-semibold transition-all whitespace-nowrap active:scale-95 ${
              activeTab === 'analytics'
                ? 'bg-[rgb(var(--color-card-rgb))] text-[rgb(var(--color-primary-rgb))] shadow-sm border border-[rgb(var(--color-border-rgb))]'
                : 'text-[rgb(var(--color-text-muted-rgb))] hover:text-[rgb(var(--color-text-rgb))] hover:bg-[rgba(var(--color-card-rgb),0.5)]'
            }`}
          >
            Analytics
          </button>
          <button
            onClick={() => setActiveTab('reports')}
            className={`flex-1 sm:flex-none px-6 py-2.5 rounded-xl text-sm font-semibold transition-all whitespace-nowrap active:scale-95 ${
              activeTab === 'reports'
                ? 'bg-[rgb(var(--color-card-rgb))] text-[rgb(var(--color-primary-rgb))] shadow-sm border border-[rgb(var(--color-border-rgb))]'
                : 'text-[rgb(var(--color-text-muted-rgb))] hover:text-[rgb(var(--color-text-rgb))] hover:bg-[rgba(var(--color-card-rgb),0.5)]'
            }`}
          >
            Reports
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 min-h-0 px-2 sm:px-0 pt-4 sm:pt-6 pb-24 md:pb-8 overflow-y-auto">
        <ErrorBoundary>
          {activeTab === 'analytics' && (
            <div className="flex-1 flex flex-col w-full">
              <div className="bg-[rgb(var(--color-card-rgb))] rounded-3xl shadow-sm border border-[rgb(var(--color-border-rgb))] p-1 sm:p-2 overflow-y-auto w-full lg:max-w-4xl mx-auto h-auto min-h-min text-[rgb(var(--color-text-rgb))] [&_h1]:text-[rgb(var(--color-text-rgb))] [&_h2]:text-[rgb(var(--color-text-rgb))] [&_h3]:text-[rgb(var(--color-text-rgb))] [&_p]:text-[rgb(var(--color-text-muted-rgb))] [&_span]:text-[rgb(var(--color-text-muted-rgb))]">
                  <AnalyticsDashboard
                    transactions={transactions}
                    budgets={budgets}
                    user={user}
                    categories={categories}
                  />
              </div>
            </div>
          )}

          {activeTab === 'reports' && (
            <div className="flex-1 flex flex-col w-full">
              <ReportsPage
                transactions={transactions}
                user={user}
                categories={categories}
                budgets={budgets}
                goals={goals}
              />
            </div>
          )}
        </ErrorBoundary>
      </div>
    </div>
  );
};

export default InsightsPage;
