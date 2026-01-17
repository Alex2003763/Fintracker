import React, { useMemo } from 'react';
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
        <Card className="h-full">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <PieChartIcon className="h-5 w-5 text-purple-500" />
                    Budget Forecasting
                </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center h-[300px] text-center">
                <p className="text-[rgb(var(--color-text-muted-rgb))] mb-4">No budgets set for this month.</p>
                <p className="text-sm text-[rgb(var(--color-text-muted-rgb))]">Set up budgets to see predictive insights here.</p>
            </CardContent>
        </Card>
      );
  }

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
           <div className="flex items-center gap-2">
             <PieChartIcon className="h-5 w-5 text-purple-500" />
             <span>End-of-Month Forecast</span>
           </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] w-full">
           <ResponsiveContainer width="100%" height="100%">
             <BarChart data={forecastData} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
               <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="rgba(var(--color-border-rgb), 0.3)" />
               <XAxis type="number" hide />
               <YAxis 
                 dataKey="category" 
                 type="category" 
                 width={100}
                 tick={{ fill: 'rgb(var(--color-text-rgb))', fontSize: 12 }} 
               />
               <Tooltip content={<CustomTooltip />} cursor={{fill: 'transparent'}} />
               {/* Background bar for budget limit */}
               <Bar dataKey="budget" barSize={20} fill="rgba(var(--color-border-rgb), 0.3)" radius={[0, 4, 4, 0]} />
               
               {/* Projected spending bar */}
               <Bar dataKey="projected" barSize={12} radius={[0, 4, 4, 0]}>
                 {forecastData.map((entry, index) => (
                   <Cell key={`cell-${index}`} fill={entry.projected > entry.budget ? '#EF4444' : '#10B981'} />
                 ))}
               </Bar>
             </BarChart>
           </ResponsiveContainer>
        </div>

        <div className="mt-4 space-y-3">
          {forecastData.slice(0, 3).map((item) => (
            <div key={item.category} className="flex items-center justify-between text-sm p-2 rounded-lg bg-[rgb(var(--color-card-muted-rgb))]">
               <div className="flex items-center gap-2">
                 {item.projected > item.budget ? (
                    <ExclamationTriangleIcon className="h-4 w-4 text-red-500" />
                 ) : (
                    <CheckCircleIcon className="h-4 w-4 text-green-500" />
                 )}
                 <span className="font-medium text-[rgb(var(--color-text-rgb))]">{item.category}</span>
               </div>
               <div className="text-right">
                 {item.projected > item.budget ? (
                   <span className="text-red-500 font-bold">+{formatCurrency(item.projected - item.budget)}</span>
                 ) : (
                   <span className="text-green-500 font-bold">-{formatCurrency(item.budget - item.projected)}</span>
                 )}
                 <span className="text-xs text-[rgb(var(--color-text-muted-rgb))] ml-1">expected</span>
               </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
});

export default BudgetForecastingWidget;
