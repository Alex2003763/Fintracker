import React, { useMemo } from 'react';
import { Transaction } from '../types';
import Card, { CardHeader, CardTitle, CardContent } from './Card';
import { TrendingUpIcon, TrendingDownIcon, CalendarIcon } from './icons';
import { formatCurrency } from '../utils/formatters';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { useTheme } from './ThemeContext';

interface SpendingTrendsWidgetProps {
  transactions: Transaction[];
  period?: 'week' | 'month' | 'year';
}

const parseDate = (dateStr: string) => {
    // Handle both YYYY-MM-DD and YYYY-MM-DDTHH:mm:ss.sssZ
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? new Date() : d;
};

const SpendingTrendsWidget: React.FC<SpendingTrendsWidgetProps> = React.memo(({ transactions, period = 'month' }) => {
  const { theme } = useTheme();
  
  const chartData = useMemo(() => {
    if (!transactions.length) return [];
    
    // Sort transactions by date
    const sortedTx = [...transactions].sort((a, b) => 
      parseDate(a.date).getTime() - parseDate(b.date).getTime()
    );

    const now = new Date();
    let startDate = new Date();
    let dateFormat: (d: Date) => string;

    if (period === 'week') {
      startDate.setDate(now.getDate() - 7);
      dateFormat = (d) => d.toLocaleDateString('en-US', { weekday: 'short' });
    } else if (period === 'month') {
      startDate.setMonth(now.getMonth() - 1);
      dateFormat = (d) => d.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
    } else {
      startDate.setFullYear(now.getFullYear() - 1);
      dateFormat = (d) => d.toLocaleDateString('en-US', { month: 'short' });
    }

    // Filter by period
    const filteredTx = sortedTx.filter(t => parseDate(t.date) >= startDate);
    
    // Group data
    const groupedData: Record<string, { date: string, income: number, expense: number }> = {};
    
    // Initialize chart with empty placeholders for continuity (optional, implementing simple aggregation first)
    // For 'year', initialize months. For 'week', initialize days.
    
    filteredTx.forEach(t => {
      const dateKey = dateFormat(parseDate(t.date));
      if (!groupedData[dateKey]) {
        groupedData[dateKey] = { date: dateKey, income: 0, expense: 0 };
      }
      if (t.type === 'income') groupedData[dateKey].income += t.amount;
      else groupedData[dateKey].expense += t.amount;
    });

    return Object.values(groupedData);
  }, [transactions, period]);

  const totalExpense = useMemo(() => chartData.reduce((acc, curr) => acc + curr.expense, 0), [chartData]);
  const totalIncome = useMemo(() => chartData.reduce((acc, curr) => acc + curr.income, 0), [chartData]);
  const netFlow = totalIncome - totalExpense;

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[rgb(var(--color-card-rgb))] p-3 border border-[rgb(var(--color-border-rgb))] rounded-lg shadow-lg z-50">
          <p className="font-bold text-[rgb(var(--color-text-rgb))] mb-2">{label}</p>
          <div className="space-y-1">
            <p className="text-sm font-medium text-green-500">Income: {formatCurrency(payload[0].value)}</p>
            <p className="text-sm font-medium text-red-500">Expense: {formatCurrency(payload[1].value)}</p>
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
           <div className="flex items-center gap-2">
             <TrendingUpIcon className="h-5 w-5 text-[rgb(var(--color-primary-rgb))]" />
             <span>Cash Flow Trends</span>
           </div>
           <span className="text-xs font-normal text-[rgb(var(--color-text-muted-rgb))] bg-[rgb(var(--color-card-muted-rgb))] px-2 py-1 rounded-md">
             {period === 'week' ? 'Last 7 Days' : period === 'month' ? 'Last 30 Days' : 'Last 12 Months'}
           </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
         <div className="flex gap-4 mb-6">
           <div>
             <p className="text-xs text-[rgb(var(--color-text-muted-rgb))]">Total Income</p>
             <p className="text-lg font-bold text-green-500">{formatCurrency(totalIncome)}</p>
           </div>
           <div>
             <p className="text-xs text-[rgb(var(--color-text-muted-rgb))]">Total Expense</p>
             <p className="text-lg font-bold text-red-500">{formatCurrency(totalExpense)}</p>
           </div>
           <div>
             <p className="text-xs text-[rgb(var(--color-text-muted-rgb))]">Net Flow</p>
             <p className={`text-lg font-bold ${netFlow >= 0 ? 'text-[rgb(var(--color-text-rgb))]' : 'text-red-500'}`}>
                {netFlow > 0 ? '+' : ''}{formatCurrency(netFlow)}
             </p>
           </div>
         </div>
         
         <div className="h-[250px] w-full">
           <ResponsiveContainer width="100%" height="100%">
             <AreaChart data={chartData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
               <defs>
                 <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                   <stop offset="5%" stopColor="#10B981" stopOpacity={0.2}/>
                   <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                 </linearGradient>
                 <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                   <stop offset="5%" stopColor="#EF4444" stopOpacity={0.2}/>
                   <stop offset="95%" stopColor="#EF4444" stopOpacity={0}/>
                 </linearGradient>
               </defs>
               <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(var(--color-border-rgb), 0.5)" />
               <XAxis 
                  dataKey="date" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: 'rgb(var(--color-text-muted-rgb))', fontSize: 11 }}
                  dy={10}
               />
               <YAxis 
                  axisLine={false} 
                  tickLine={false}
                  tick={{ fill: 'rgb(var(--color-text-muted-rgb))', fontSize: 11 }}
                  tickFormatter={(val) => `${val >= 1000 ? (val/1000).toFixed(0) + 'k' : val}`}
               />
               <Tooltip content={<CustomTooltip />} />
               <Area 
                  type="monotone" 
                  dataKey="income" 
                  stroke="#10B981" 
                  strokeWidth={2}
                  fillOpacity={1} 
                  fill="url(#colorIncome)" 
               />
               <Area 
                  type="monotone" 
                  dataKey="expense" 
                  stroke="#EF4444" 
                  strokeWidth={2}
                  fillOpacity={1} 
                  fill="url(#colorExpense)" 
               />
             </AreaChart>
           </ResponsiveContainer>
         </div>
      </CardContent>
    </Card>
  );
});

export default SpendingTrendsWidget;
