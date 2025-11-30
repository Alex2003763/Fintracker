import React, { useMemo } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { Transaction } from '../types';
import { formatCurrency } from '../utils/formatters';

interface TransactionChartProps {
  transactions: Transaction[];
}

const TransactionChart: React.FC<TransactionChartProps> = ({ transactions }) => {
  const data = useMemo(() => {
    const last7Days = new Array(7).fill(0).map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      return d;
    });

    return last7Days.map(date => {
      const dateStr = date.toDateString();
      const dayTransactions = transactions.filter(t => new Date(t.date).toDateString() === dateStr);
      const income = dayTransactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);
      const expense = dayTransactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);

      return {
        date: date.toLocaleDateString('en-US', { weekday: 'short' }),
        income,
        expense,
      };
    });
  }, [transactions]);

  return (
    <div className="h-72 w-full mt-6">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={data}
          margin={{
            top: 20,
            right: 20,
            left: 0,
            bottom: 0,
          }}
        >
          <defs>
            <linearGradient id="incomeGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10B981" stopOpacity={0.5}/>
              <stop offset="100%" stopColor="#10B981" stopOpacity={0.1}/>
            </linearGradient>
            <linearGradient id="expenseGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#EF4444" stopOpacity={0.5}/>
              <stop offset="100%" stopColor="#EF4444" stopOpacity={0.1}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(var(--color-border-rgb), 0.3)" />
          <XAxis
            dataKey="date"
            axisLine={false}
            tickLine={false}
            tick={{ fill: 'rgb(var(--color-text-muted-rgb))', fontSize: 13, fontWeight: 500 }}
            dy={12}
          />
          <YAxis
            hide={true}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'rgb(var(--color-card-rgb))',
              border: '1px solid rgb(var(--color-border-rgb))',
              borderRadius: '10px',
              boxShadow: '0 6px 12px -2px rgba(0,0,0,0.08)',
              padding: '12px 16px',
            }}
            itemStyle={{ color: 'rgb(var(--color-text-rgb))', fontWeight: 500 }}
            formatter={(value: number) => [formatCurrency(value), '']}
            labelStyle={{ color: 'rgb(var(--color-text-muted-rgb))', marginBottom: '0.5rem', fontWeight: 600 }}
          />
          <Area
            type="monotone"
            dataKey="income"
            stroke="#10B981"
            strokeWidth={3}
            fillOpacity={1}
            fill="url(#incomeGradient)"
            name="Income"
            dot={{ r: 4, stroke: "#10B981", strokeWidth: 2, fill: "#fff" }}
            activeDot={{ r: 6, fill: "#10B981" }}
          />
          <Area
            type="monotone"
            dataKey="expense"
            stroke="#EF4444"
            strokeWidth={3}
            fillOpacity={1}
            fill="url(#expenseGradient)"
            name="Expense"
            dot={{ r: 4, stroke: "#EF4444", strokeWidth: 2, fill: "#fff" }}
            activeDot={{ r: 6, fill: "#EF4444" }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

export default TransactionChart;