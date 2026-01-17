import React, { useMemo, useState } from 'react';
import { Transaction } from '../types';
import Card, { CardHeader, CardTitle, CardContent } from './Card';
import { ExclamationTriangleIcon, ChevronDownIcon } from './icons';
import { formatCurrency } from '../utils/formatters';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from 'recharts';

interface CategoryComparisonWidgetProps {
  transactions: Transaction[];
}

const CategoryComparisonWidget: React.FC<CategoryComparisonWidgetProps> = React.memo(({ transactions }) => {
  const [comparisonPeriod, setComparisonPeriod] = useState<'month' | 'year'>('month');

  const chartData = useMemo(() => {
    if (!transactions.length) return [];

    const now = new Date();
    let currentStart = new Date();
    let prevStart = new Date();
    let prevEnd = new Date();

    if (comparisonPeriod === 'month') {
        // Current Month vs Last Month
        currentStart = new Date(now.getFullYear(), now.getMonth(), 1);
        prevStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        prevEnd = new Date(now.getFullYear(), now.getMonth(), 0);
    } else {
        // Current Year vs Last Year
        currentStart = new Date(now.getFullYear(), 0, 1);
        prevStart = new Date(now.getFullYear() - 1, 0, 1);
        prevEnd = new Date(now.getFullYear() - 1, 11, 31);
    }

    const currentData: Record<string, number> = {};
    const prevData: Record<string, number> = {};

    transactions.forEach(t => {
        const d = new Date(t.date);
        if (t.type === 'expense') {
            if (d >= currentStart) {
                currentData[t.category] = (currentData[t.category] || 0) + t.amount;
            } else if (d >= prevStart && d <= prevEnd) {
                prevData[t.category] = (prevData[t.category] || 0) + t.amount;
            }
        }
    });

    // Merge and compute deltas
    const categories = Array.from(new Set([...Object.keys(currentData), ...Object.keys(prevData)]));
    
    return categories.map(cat => {
        const current = currentData[cat] || 0;
        const prev = prevData[cat] || 0;
        const delta = current - prev;
        const percentChange = prev > 0 ? (delta / prev) * 100 : current > 0 ? 100 : 0;
        
        return {
            category: cat,
            current,
            prev,
            delta,
            percentChange
        };
    })
    .sort((a, b) => b.current - a.current) // Rank by current spending usage
    .slice(0, 10); // Show top 10

  }, [transactions, comparisonPeriod]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[rgb(var(--color-card-rgb))] p-3 border border-[rgb(var(--color-border-rgb))] rounded-lg shadow-lg z-50">
          <p className="font-bold text-[rgb(var(--color-text-rgb))] mb-2">{label}</p>
          <div className="space-y-1">
            <p className="text-sm">
                <span className="text-[rgb(var(--color-text-muted-rgb))]">Current:</span> <span className="font-mono font-medium">{formatCurrency(payload[0].value)}</span>
            </p>
            <p className="text-sm">
                <span className="text-[rgb(var(--color-text-muted-rgb))]">Previous:</span> <span className="font-mono font-medium">{formatCurrency(payload[1].value)}</span>
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
            <span>Category Comparison</span>
            <div className="relative">
                <select 
                    value={comparisonPeriod}
                    onChange={(e) => setComparisonPeriod(e.target.value as 'month' | 'year')}
                    className="appearance-none bg-[rgb(var(--color-card-muted-rgb))] border border-[rgb(var(--color-border-rgb))] text-xs rounded-md px-3 py-1 pr-8 focus:outline-none focus:ring-2 focus:ring-[rgb(var(--color-primary-rgb))]"
                >
                    <option value="month">Month-over-Month</option>
                    <option value="year">Year-over-Year</option>
                </select>
                <ChevronDownIcon className="h-3 w-3 absolute right-2 top-1/2 transform -translate-y-1/2 pointer-events-none text-[rgb(var(--color-text-muted-rgb))]" />
            </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(var(--color-border-rgb), 0.3)" />
                    <XAxis 
                        dataKey="category" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fill: 'rgb(var(--color-text-muted-rgb))', fontSize: 10 }}
                        interval={0}
                        angle={-45}
                        textAnchor="end"
                        height={60}
                    />
                    <YAxis 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fill: 'rgb(var(--color-text-muted-rgb))', fontSize: 10 }}
                        tickFormatter={(val) => `${val >= 1000 ? (val/1000).toFixed(0) + 'k' : val}`}
                    />
                    <Tooltip content={<CustomTooltip />} cursor={{fill: 'rgba(var(--color-primary-rgb), 0.05)'}} />
                    <Legend wrapperStyle={{ fontSize: '12px' }} />
                    <Bar name={comparisonPeriod === 'month' ? 'This Month' : 'This Year'} dataKey="current" fill="#8884d8" radius={[4, 4, 0, 0]} />
                    <Bar name={comparisonPeriod === 'month' ? 'Last Month' : 'Last Year'} dataKey="prev" fill="#82ca9d" radius={[4, 4, 0, 0]} />
                </BarChart>
            </ResponsiveContainer>
        </div>
        
        {/* Callout for biggest increase */}
        {chartData.length > 0 && (
            <div className="mt-4 p-3 bg-yellow-500/10 rounded-lg flex items-start gap-3">
                 <ExclamationTriangleIcon className="h-5 w-5 text-yellow-600 dark:text-yellow-500 flex-shrink-0 mt-0.5" />
                 <div>
                    <p className="text-sm font-medium text-[rgb(var(--color-text-rgb))]">
                        Highest Increase: {chartData.sort((a,b) => b.delta - a.delta)[0]?.category}
                    </p>
                    <p className="text-xs text-[rgb(var(--color-text-muted-rgb))] mt-1">
                        Spending increased by <span className="font-bold text-red-500">{formatCurrency(chartData[0].delta)}</span> compared to the previous period.
                    </p>
                 </div>
            </div>
        )}
      </CardContent>
    </Card>
  );
});

export default CategoryComparisonWidget;
