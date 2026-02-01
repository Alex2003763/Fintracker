import React, { useMemo, useState, useEffect } from 'react';
import { Transaction, Budget } from '../types';
import Card, { CardHeader, CardTitle, CardContent } from './Card';
import { PieChartIcon, ExclamationTriangleIcon, CheckCircleIcon } from './icons';
import { formatCurrency } from '../utils/formatters';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Cell } from 'recharts';

interface BudgetForecastingWidgetProps {
  transactions: Transaction[];
  budgets: Budget[];
}

const BudgetForecastingWidget: React.FC<BudgetForecastingWidgetProps> = React.memo(({ transactions, budgets }) => {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 640);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 640);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Calculate projections based on current month's spending pace
  const forecastData = useMemo(() => {
    if (!budgets.length) return [];

    const now = new Date();
    const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const currentDay = now.getDate();
    const remainingDays = daysInMonth - currentDay;

    return budgets
      .filter(b => b.month === currentMonthStr)
      .map(budget => {
        // Calculate current spending for this category
        const spent = transactions
          .filter(t => 
            t.type === 'expense' &&
            t.category === budget.category &&
            new Date(t.date).getMonth() === now.getMonth() &&
            new Date(t.date).getFullYear() === now.getFullYear()
          )
          .reduce((sum, t) => sum + t.amount, 0);

        // Simple linear projection: average daily spend * remaining days
        const avgDailySpend = currentDay > 0 ? spent / currentDay : 0;
        const projectedAdditional = avgDailySpend * remainingDays;
        const projectedTotal = spent + projectedAdditional;
        
        const isOverBudget = projectedTotal > budget.amount;
        const isOnTrack = projectedTotal <= budget.amount;

        return {
          category: budget.category,
          budget: budget.amount,
          spent: spent,
          projected: projectedTotal,
          status: isOverBudget ? 'danger' : 'safe',
          remaining: budget.amount - spent
        };
      })
      .sort((a, b) => (b.projected / b.budget) - (a.projected / a.budget)) // Sort by % used descending
      .slice(0, 5); // Show top 5 risky/active budgets
  }, [transactions, budgets]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-[rgb(var(--color-card-rgb))] p-3 border border-[rgb(var(--color-border-rgb))] rounded-lg shadow-lg z-50">
          <p className="font-bold text-[rgb(var(--color-text-rgb))] mb-2">{label}</p>
          <div className="space-y-1">
             <p className="text-sm">Budget: <span className="font-mono font-medium">{formatCurrency(data.budget)}</span></p>
             <p className="text-sm">Spent So Far: <span className="font-mono font-medium">{formatCurrency(data.spent)}</span></p>
             <div className="border-t border-[rgb(var(--color-border-rgb))] my-1 pt-1"></div>
             <p className={`text-sm font-bold ${data.projected > data.budget ? 'text-red-500' : 'text-green-500'}`}>
               Projected: {formatCurrency(data.projected)}
             </p>
             <p className="text-xs text-[rgb(var(--color-text-muted-rgb))] mt-1">
               {data.projected > data.budget 
                 ? `On track to overspend by ${formatCurrency(data.projected - data.budget)}`
                 : `On track to save ${formatCurrency(data.budget - data.projected)}`
               }
             </p>
          </div>
        </div>
      );
    }
    return null;
  };

  if (budgets.length === 0) {
      return (
        <Card className="overflow-hidden">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <PieChartIcon className="h-5 w-5 text-purple-500" />
                    <span>End-of-Month Forecast</span>
                </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center min-h-[300px] text-center p-6">
                <div className="bg-[rgba(var(--color-primary-rgb),0.1)] p-4 rounded-full mb-4">
                  <PieChartIcon className="h-8 w-8 text-[rgb(var(--color-primary-rgb))]" />
                </div>
                <h3 className="font-semibold text-lg mb-2 text-[rgb(var(--color-text-rgb))]">No budgets set for this month</h3>
                <p className="text-[rgb(var(--color-text-muted-rgb))] max-w-xs mb-6">
                  Set up budgets for your spending categories to see predictive insights and forecasting here.
                </p>
            </CardContent>
        </Card>
      );
  }

  const barSize = isMobile ? 12 : 16;
  const projectedBarSize = isMobile ? 8 : 10;

  return (
    <Card className="overflow-hidden flex flex-col">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <PieChartIcon className="h-5 w-5 text-purple-500" />
          <span>End-of-Month Forecast</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col min-h-0">
        {/* Responsive chart container */}
        <div className="w-full flex-1 min-h-[250px] md:min-h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={forecastData}
              layout="vertical"
              margin={{
                top: 5,
                right: 30,
                left: isMobile ? 0 : 30,
                bottom: 5
              }}
            >
              <defs>
                <linearGradient id="safeGradient" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#10B981" stopOpacity={0.8} />
                  <stop offset="100%" stopColor="#059669" stopOpacity={1} />
                </linearGradient>
                <linearGradient id="dangerGradient" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#EF4444" stopOpacity={0.8} />
                  <stop offset="100%" stopColor="#B91C1C" stopOpacity={1} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} vertical={true} stroke="rgba(var(--color-border-rgb), 0.1)" />
              <XAxis type="number" hide />
              <YAxis
                dataKey="category"
                type="category"
                width={isMobile ? 85 : 100}
                tick={{ fill: 'rgb(var(--color-text-rgb))', fontSize: isMobile ? 11 : 12 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip content={<CustomTooltip />} cursor={{fill: 'rgba(var(--color-border-rgb), 0.1)'}} />
              {/* Background bar for budget limit */}
              <Bar dataKey="budget" barSize={barSize} fill="rgba(var(--color-border-rgb), 0.2)" radius={[0, 4, 4, 0]} />
              {/* Projected spending bar */}
              <Bar dataKey="projected" barSize={projectedBarSize} radius={[0, 4, 4, 0]}>
                {forecastData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={`url(#${entry.projected > entry.budget ? 'dangerGradient' : 'safeGradient'})`}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Compact horizontal summary badges */}
        <div className="mt-4 flex gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
          {forecastData.map((item) => (
            <div
              key={item.category}
              className={`flex-shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium bg-[rgb(var(--color-card-muted-rgb))] border border-[rgb(var(--color-border-rgb))] ${item.projected > item.budget ? 'text-red-600 border-red-200' : 'text-green-600 border-green-200'}`}
              title={item.category}
            >
              {item.projected > item.budget ? (
                <ExclamationTriangleIcon className="h-3.5 w-3.5 flex-shrink-0" />
              ) : (
                <CheckCircleIcon className="h-3.5 w-3.5 flex-shrink-0" />
              )}
              <span className="truncate max-w-[100px]">{item.category}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
});

export default BudgetForecastingWidget;
