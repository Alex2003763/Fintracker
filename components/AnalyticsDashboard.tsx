import React, { useState, useMemo } from 'react';
import { Transaction, Budget, User } from '../types';
import { Category } from '../types/category';
import Card, { CardHeader, CardTitle, CardContent } from './Card';
import { SparklesIcon, TrendingUpIcon, PieChartIcon, ArrowRightIcon, DownloadIcon } from './icons';
import ReportExportModal from './ReportExportModal';
import { useTheme } from './ThemeContext';
import { formatCurrency } from '../utils/formatters';
import SpendingTrendsWidget from './SpendingTrendsWidget';
import BudgetForecastingWidget from './BudgetForecastingWidget';
import SavingsRateWidget from './SavingsRateWidget';
import CategoryComparisonWidget from './CategoryComparisonWidget';
import FinancialHealthWidget from './FinancialHealthWidget';

interface AnalyticsDashboardProps {
  transactions: Transaction[];
  budgets: Budget[];
  user: User;
  categories: Category[];
}

const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({ 
  transactions, 
  budgets, 
  user,
  categories 
}) => {
  const { theme } = useTheme();
  const [activeTab, setActiveTab] = useState<'overview' | 'trends' | 'forecasting'>('overview');
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  // Simple stats for the Overview tab
  const stats = useMemo(() => {
    // Basic stats calculation to be expanded
    return {
      monthlySpending: 0,
      savingsRate: 0,
      topCategory: 'None'
    };
  }, [transactions]);

  return (
    <div className="flex flex-col gap-6 p-0 sm:p-0 pb-20 md:pb-6 max-w-7xl mx-auto animate-fade-in-up">
      

      {/* Tabs / Navigation for Analytics Sections */}
      <div className="flex space-x-1 bg-[rgb(var(--color-card-muted-rgb))] p-1 rounded-xl w-full md:w-auto self-start overflow-x-auto">
        {(['overview', 'trends', 'forecasting'] as const).map((tab, idx, arr) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{ flex: '1 1 0%', minWidth: 0, width: `${100 / arr.length}%` }}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap text-center ${
              activeTab === tab
                ? 'bg-[rgb(var(--color-card-rgb))] text-[rgb(var(--color-text-rgb))] shadow-sm'
                : 'text-[rgb(var(--color-text-muted-rgb))] hover:text-[rgb(var(--color-text-rgb))] hover:bg-[rgba(var(--color-text-rgb),0.05)]'
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Render content based on active tab */}
        {activeTab === 'overview' && (
          <>
             {/* Financial Health Score - Hero Card */}
             <div className="lg:col-span-2">
                <FinancialHealthWidget transactions={transactions} budgets={budgets} user={user} />
             </div>

             {/* Quick Stats or Savings Rate */}
             <div className="lg:col-span-1">
                <SavingsRateWidget transactions={transactions} />
             </div>
          </>
        )}

        {activeTab === 'trends' && (
           <>
              <div className="lg:col-span-2">
                <SpendingTrendsWidget transactions={transactions} period="month" />
              </div>
              <div className="lg:col-span-3 h-[500px]">
                <CategoryComparisonWidget transactions={transactions} />
              </div>
           </>
        )}

        {activeTab === 'forecasting' && (
           <>
              <div className="lg:col-span-1 h-[450px]">
                <BudgetForecastingWidget transactions={transactions} budgets={budgets} />
              </div>
           </>
        )}
      </div>
    </div>
  );
};

export default AnalyticsDashboard;
