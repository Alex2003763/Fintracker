import React, { useMemo } from 'react';
import { Transaction, Budget, User } from '../types';
import Card, { CardHeader, CardTitle, CardContent } from './Card';
import { SparklesIcon } from './icons';
import { ResponsiveContainer, RadialBarChart, RadialBar, Legend, Tooltip } from 'recharts';

interface FinancialHealthWidgetProps {
  transactions: Transaction[];
  budgets: Budget[];
  user: User;
}

const FinancialHealthWidget: React.FC<FinancialHealthWidgetProps> = React.memo(({ transactions, budgets }) => {
  const healthMetrics = useMemo(() => {
    // 1. Savings Score (30%)
    // Ideal savings rate >= 20%
    const now = new Date();
    const currentMonthTxs = transactions.filter(t => 
      new Date(t.date).getMonth() === now.getMonth() &&
      new Date(t.date).getFullYear() === now.getFullYear()
    );
    const income = currentMonthTxs.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
    const expenses = currentMonthTxs.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
    const savingsRate = income > 0 ? ((income - expenses) / income) * 100 : 0;
    const savingsScore = Math.min(100, Math.max(0, (savingsRate / 20) * 100));

    // 2. Budget Adherence Score (30%)
    // Percentage of budgets not exceeded
    const currentMonthBudgets = budgets.filter(b => b.month === `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`);
    let budgetsOnTrack = 0;
    currentMonthBudgets.forEach(b => {
      const spent = currentMonthTxs
        .filter(t => t.type === 'expense' && t.category === b.category)
        .reduce((sum, t) => sum + t.amount, 0);
      if (spent <= b.amount) budgetsOnTrack++;
    });
    const budgetScore = currentMonthBudgets.length > 0 
      ? (budgetsOnTrack / currentMonthBudgets.length) * 100 
      : 100; // Default to 100 if no budgets set (or maybe 50?) - Let's stay positive 100 for now or handling "No Data" separately

    // 3. Spending Trends Score (20%)
    // Lower spending vs previous month is better
    // This is simplified. Real score might look at stability.
    // For now: 100 if spending < last month, else proportional penalty
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthTxs = transactions.filter(t => 
      new Date(t.date).getMonth() === lastMonth.getMonth() &&
      new Date(t.date).getFullYear() === lastMonth.getFullYear()
    );
    const lastMonthExpenses = lastMonthTxs.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
    const trendScore = expenses <= lastMonthExpenses ? 100 : Math.max(0, 100 - (((expenses - lastMonthExpenses) / lastMonthExpenses) * 100));

    // 4. Activity Score (20%)
    // Consistency of tracking
    const activityScore = currentMonthTxs.length > 5 ? 100 : (currentMonthTxs.length / 5) * 100;

    // Weighted Total
    const totalScore = Math.round(
      (savingsScore * 0.3) +
      (budgetScore * 0.3) +
      (trendScore * 0.2) +
      (activityScore * 0.2)
    );

    let status = 'Needs Improvement';
    if (totalScore >= 80) status = 'Excellent';
    else if (totalScore >= 60) status = 'Good';
    else if (totalScore >= 40) status = 'Fair';

    return {
      totalScore,
      status,
      details: [
        { name: 'Savings Rate', score: Math.round(savingsScore), weight: '30%', fill: '#10B981' },
        { name: 'Budget Adherence', score: Math.round(budgetScore), weight: '30%', fill: '#8884d8' },
        { name: 'Spending Trend', score: Math.round(trendScore), weight: '20%', fill: '#FFBB28' },
        { name: 'Tracking Activity', score: Math.round(activityScore), weight: '20%', fill: '#FF8042' }
      ]
    };
  }, [transactions, budgets]);

  const chartData = [
    { name: 'Score', uv: 100, pv: 100, fill: '#f0f0f0' }, // Background track
    { name: 'Health', uv: healthMetrics.totalScore, fill: healthMetrics.totalScore >= 80 ? '#10B981' : healthMetrics.totalScore >= 60 ? '#3B82F6' : '#EF4444' }
  ];
  
  return (
    <Card className="h-full bg-gradient-to-br from-[rgb(var(--color-primary-rgb))] to-[rgb(var(--color-primary-hover-rgb))] text-white border-none overflow-hidden relative">
      <div className="absolute top-0 right-0 p-32 bg-white opacity-5 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2 pointer-events-none"></div>
      
      <CardHeader>
        <CardTitle className="flex items-center text-white relative z-10">
          <SparklesIcon className="h-5 w-5 mr-2" />
          Financial Health Score
        </CardTitle>
      </CardHeader>
      <CardContent className="relative z-10">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
           <div className="flex flex-col items-center justify-center min-w-[150px]">
              <div className="text-6xl font-bold mb-1 drop-shadow-md">{healthMetrics.totalScore}</div>
              <div className="px-3 py-1 rounded-full bg-white/20 backdrop-blur-sm text-sm font-medium border border-white/10">
                {healthMetrics.status}
              </div>
           </div>

           <div className="flex-1 w-full space-y-3 bg-black/20 p-4 rounded-xl backdrop-blur-sm border border-white/10">
              {healthMetrics.details.map((metric) => (
                 <div key={metric.name}>
                    <div className="flex justify-between text-xs mb-1 opacity-90">
                       <span>{metric.name}</span>
                       <span>{metric.score}/100</span>
                    </div>
                    <div className="w-full bg-white/10 rounded-full h-1.5">
                       <div 
                         className="h-1.5 rounded-full transition-all duration-1000 ease-out"
                         style={{ width: `${metric.score}%`, backgroundColor: metric.fill }}
                       />
                    </div>
                 </div>
              ))}
           </div>
        </div>
        
        <p className="mt-6 text-sm text-white/80 text-center md:text-left">
           Based on your savings rate, budget adherence, and spending habits this month.
        </p>
      </CardContent>
    </Card>
  );
});

export default FinancialHealthWidget;
