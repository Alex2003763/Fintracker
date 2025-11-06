import React, { useMemo, useState } from 'react';
import { Transaction, User, AIInsight } from '../types';
import { ReportsIcon, SparklesIcon, CheckCircleIcon, ExclamationTriangleIcon, LightBulbIcon, ChevronDownIcon } from './icons';
import { formatCurrency } from '../utils/formatters';
import { CATEGORY_ICON_MAP } from '../constants';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, Sector } from 'recharts';
import AISwiperCard from './AISwiperCard';

interface MonthlyData {
  month: string;
  income: number;
  expense: number;
}

interface CashFlowData {
  month: string;
  monthlyFlow: number;
  cumulativeFlow: number;
}

interface TimeRangeOption {
  label: string;
  value: string;
  months: number;
}

const TIME_RANGE_OPTIONS: TimeRangeOption[] = [
  { label: 'This Month', value: 'current_month', months: 1 },
  { label: 'Last 3 Months', value: 'last_3_months', months: 3 },
  { label: 'Last 6 Months', value: 'last_6_months', months: 6 },
  { label: 'This Year', value: 'current_year', months: 12 },
  { label: 'All Time', value: 'all_time', months: -1 }
];

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#AF19FF', '#FF4560', '#775DD0', '#546E7A'];

const InsightItem: React.FC<{ icon: React.FC<any>, title: string, colorClass: string, children: React.ReactNode}> = ({ icon: Icon, title, colorClass, children }) => (
    <div className="animate-fade-in-up">
        <h4 className={`font-semibold flex items-center mb-2 ${colorClass}`}>
            <Icon className="h-5 w-5 mr-2" />
            {title}
        </h4>
        <div className="list-disc list-inside space-y-1 pl-7 text-[rgb(var(--color-text-muted-rgb))]">
            {children}
        </div>
    </div>
);

const FormattedAIInsights: React.FC<{ insights: AIInsight }> = ({ insights }) => {
    return (
        <div className="flex justify-center w-full max-w-full overflow-hidden">
            <div className="w-full max-w-lg">
                <AISwiperCard insights={insights} />
            </div>
        </div>
    );
};

const AIInsightsCard: React.FC<{
    user: User, 
    transactions: Transaction[],
}> = ({ user, transactions }) => {
    const [insights, setInsights] = useState<AIInsight | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const hasApiKey = !!user?.aiSettings?.apiKey;

    const handleGenerateInsights = async () => {
        if (!hasApiKey || !user.aiSettings?.apiKey) return;
        setIsLoading(true);
        setError('');
        setInsights(null);

        const oneMonthAgo = new Date();
        oneMonthAgo.setDate(oneMonthAgo.getDate() - 30);
        const recentTransactions = transactions
            .filter(t => new Date(t.date) >= oneMonthAgo)
            .map(({ description, category, type, amount }) => ({ description, category, type, amount }));

        if (recentTransactions.length < 3) {
            setError("Not enough recent transaction data to generate insights. Please add at least 3 transactions in the last month.");
            setIsLoading(false);
            return;
        }

        const prompt = `You are Finance Flow, an expert financial assistant. Analyze the following transactions from the last 30 days and provide a structured JSON response. Requirements:
- 'summary': 1 sentence only, maximum 15 words
- 'positivePoints': exactly 2 items, each under 10 words
- 'areasForImprovement': exactly 2 items, each under 10 words
- 'actionableTip': 1 specific, actionable recommendation under 15 words

Keep text friendly and concise. Focus on actionable insights.

Transactions:
${JSON.stringify(recentTransactions)}
`;

        try {
            const model = user.aiSettings?.model || 'gemini-2.5-flash';
            const apiKey = user.aiSettings.apiKey;

            const proxyUrl = `https://rainbow-gumption-2fc85c.netlify.app/v1beta/models/${model}:generateContent?key=${apiKey}`;

            const response = await fetch(proxyUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    contents: [{
                        parts: [{
                            text: prompt
                        }]
                    }]
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error.message || 'An unknown error occurred');
            }

            const data = await response.json();
            
            // Replace line 125 with proper validation:
            if (!data.candidates || data.candidates.length === 0) {
                throw new Error("No AI response candidates received");
            }

            const candidate = data.candidates[0];
            if (!candidate.content || !candidate.content.parts || candidate.content.parts.length === 0) {
                throw new Error("Invalid AI response structure");
            }

            const text = candidate.content.parts[0].text;

            if (!text) {
                throw new Error("The AI model returned an empty response. This might be due to a content safety filter.");
            }

            // Handle markdown-wrapped JSON responses
            let jsonText = text.trim();

            // Check if response is wrapped in markdown code blocks
            const jsonMatch = jsonText.match(/```(?:json)?\s*([\s\S]*?)```/);
            if (jsonMatch) {
                jsonText = jsonMatch[1].trim();
            }

            const parsedInsights = JSON.parse(jsonText);
            setInsights(parsedInsights);

        } catch (e: any) {
            setError(`Failed to generate insights. Check your API key, network connection, or model configuration. Error: ${e.message}`);
        } finally {
            setIsLoading(false);
        }
    };
    
    const buttonContent = !hasApiKey 
        ? 'Configure API Key in Settings' 
        : 'Get AI Insights';

    return (
        <div>
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-[rgb(var(--color-text-rgb))]">AI Financial Assistant</h2>
                <button
                    onClick={handleGenerateInsights}
                    disabled={!hasApiKey || isLoading}
                    className="flex items-center px-3 py-2 text-sm font-medium text-[rgb(var(--color-primary-text-rgb))] bg-[rgb(var(--color-primary-rgb))] rounded-lg hover:bg-[rgb(var(--color-primary-hover-rgb))] transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                    <SparklesIcon className="h-4 w-4 mr-2" />
                    {isLoading ? 'Analyzing...' : buttonContent}
                </button>
            </div>
             <div className="p-4 border border-[rgb(var(--color-border-rgb))] rounded-lg min-h-[14rem] flex items-center justify-center">
                {isLoading && (
                    <div className="flex flex-col items-center text-[rgb(var(--color-text-muted-rgb))]">
                        <svg className="animate-spin h-8 w-8 text-[rgb(var(--color-primary-rgb))]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span className="mt-2">Generating your financial summary...</span>
                    </div>
                )}
                {error && <p className="text-red-500 text-sm text-center">{error}</p>}
                {insights && !isLoading && (
                     <FormattedAIInsights insights={insights} />
                )}
                {!isLoading && !error && !insights && (
                     <p className="text-center text-[rgb(var(--color-text-muted-rgb))]">
                        {hasApiKey ? "Click the button to get AI-powered insights on your recent spending." : "Please add your Gemini API key in the settings page to enable this feature."}
                    </p>
                )}
            </div>
        </div>
    );
};

const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-300 rounded-lg shadow-lg">
          <p className="font-medium text-gray-900">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }} className="text-sm">
              {entry.name}: {formatCurrency(entry.value)}
            </p>
          ))}
        </div>
      );
    }
    return null;
};

const CashFlowTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-300 rounded-lg shadow-lg">
          <p className="font-medium text-gray-900">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }} className="text-sm">
              {entry.dataKey === 'monthlyFlow' ? 'Monthly Cash Flow' : 'Net Worth'}: {formatCurrency(entry.value)}
            </p>
          ))}
        </div>
      );
    }
    return null;
};

const PieTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 border border-gray-300 rounded-lg shadow-lg">
          <p className="font-medium text-gray-900">{data.name}</p>
          <p className="text-sm text-gray-600">Amount: {formatCurrency(data.value)}</p>
          <p className="text-sm text-gray-600">Percentage: {data.percentage}%</p>
        </div>
      );
    }
    return null;
};

const renderActiveShape = (props: any) => {
  const RADIAN = Math.PI / 180;
  const { cx, cy, midAngle, innerRadius, outerRadius, startAngle, endAngle, fill, payload, percent } = props;
  const sin = Math.sin(-RADIAN * midAngle);
  const cos = Math.cos(-RADIAN * midAngle);
  const sx = cx + (outerRadius + 8) * cos;
  const sy = cy + (outerRadius + 8) * sin;
  const mx = cx + (outerRadius + 20) * cos;
  const my = cy + (outerRadius + 20) * sin;
  const ex = mx + (cos >= 0 ? 1 : -1) * 15;
  const ey = my;
  const textAnchor = cos >= 0 ? 'start' : 'end';

  // Check if we're on mobile (approximation)
  const isMobile = window.innerWidth < 640;
  const nameMaxLength = isMobile ? 8 : 12;
  const displayName = payload.name.length > nameMaxLength
    ? payload.name.substring(0, nameMaxLength) + '...'
    : payload.name;

  return (
    <g>
      <text x={cx} y={cy} dy={8} textAnchor="middle" fill={fill} className="text-xs sm:text-sm font-medium">
        {displayName}
      </text>
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius}
        outerRadius={outerRadius}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
      />
      <Sector
        cx={cx}
        cy={cy}
        startAngle={startAngle}
        endAngle={endAngle}
        innerRadius={outerRadius + 4}
        outerRadius={outerRadius + 8}
        fill={fill}
      />
      <path d={`M${sx},${sy}L${mx},${my}L${ex},${ey}`} stroke={fill} fill="none" />
      <circle cx={ex} cy={ey} r={1.5} fill={fill} stroke="none" />
      <text x={ex + (cos >= 0 ? 1 : -1) * 8} y={ey} textAnchor={textAnchor} fill="#333" className="text-xs font-medium">
        {isMobile ? formatCurrency(payload.value).replace('$', '') : formatCurrency(payload.value)}
      </text>
      <text x={ex + (cos >= 0 ? 1 : -1) * 8} y={ey} dy={14} textAnchor={textAnchor} fill="#999" className="text-xs">
        {`${(percent * 100).toFixed(1)}%`}
      </text>
    </g>
  );
};

interface ReportsPageProps {
    user: User;
    transactions: Transaction[];
}

const ReportsPage: React.FC<ReportsPageProps> = ({ user, transactions }) => {
    const [selectedTimeRange, setSelectedTimeRange] = useState('last_3_months');
    const [activeIndex, setActiveIndex] = useState<number | undefined>(undefined);
    const [activeIncomeIndex, setActiveIncomeIndex] = useState<number | undefined>(undefined);

    const getFilteredTransactions = (timeRange: string) => {
        const now = new Date();
        let cutoffDate = new Date();

        switch (timeRange) {
            case 'current_month':
                cutoffDate = new Date(now.getFullYear(), now.getMonth(), 1);
                break;
            case 'last_3_months':
                cutoffDate = new Date(now.getFullYear(), now.getMonth() - 3, 1);
                break;
            case 'last_6_months':
                cutoffDate = new Date(now.getFullYear(), now.getMonth() - 6, 1);
                break;
            case 'current_year':
                cutoffDate = new Date(now.getFullYear(), 0, 1);
                break;
            case 'all_time':
                return transactions;
            default:
                cutoffDate = new Date(now.getFullYear(), now.getMonth() - 3, 1);
        }

        return transactions.filter(t => new Date(t.date) >= cutoffDate);
    };

    const filteredTransactions = useMemo(() => getFilteredTransactions(selectedTimeRange), [transactions, selectedTimeRange]);

    const monthlyData = useMemo(() => {
        const data: { [key: string]: MonthlyData } = {};
        
        filteredTransactions.forEach(transaction => {
            const date = new Date(transaction.date);
            const monthKey = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
            const monthLabel = date.toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
            
            if (!data[monthKey]) {
                data[monthKey] = { month: monthLabel, income: 0, expense: 0 };
            }
            
            if (transaction.type === 'income') {
                data[monthKey].income += transaction.amount;
            } else {
                data[monthKey].expense += Math.abs(transaction.amount);
            }
        });
        
        return Object.keys(data)
            .sort()
            .map(key => data[key]);
    }, [filteredTransactions]);

    const cashFlowData = useMemo(() => {
        let cumulativeFlow = 0;
        return monthlyData.map(month => {
            const monthlyFlow = month.income - month.expense;
            cumulativeFlow += monthlyFlow;
            return {
                month: month.month,
                monthlyFlow,
                cumulativeFlow
            };
        });
    }, [monthlyData]);

    const categoryData = useMemo(() => {
        const expenses = filteredTransactions.filter(t => t.type === 'expense');
        const categoryTotals: { [key: string]: number } = {};
        
        expenses.forEach(transaction => {
            const category = transaction.category || 'Uncategorized';
            categoryTotals[category] = (categoryTotals[category] || 0) + Math.abs(transaction.amount);
        });
        
        const total = Object.values(categoryTotals).reduce((sum, amount) => sum + amount, 0);
        
        return Object.entries(categoryTotals)
            .map(([name, value]) => ({
                name,
                value,
                percentage: total > 0 ? Math.round((value / total) * 100) : 0
            }))
            .sort((a, b) => b.value - a.value);
    }, [filteredTransactions]);

    const incomeData = useMemo(() => {
        const incomes = filteredTransactions.filter(t => t.type === 'income');
        const categoryTotals: { [key: string]: number } = {};
        
        incomes.forEach(transaction => {
            const category = transaction.category || 'Other Income';
            categoryTotals[category] = (categoryTotals[category] || 0) + transaction.amount;
        });
        
        const total = Object.values(categoryTotals).reduce((sum, amount) => sum + amount, 0);
        
        return Object.entries(categoryTotals)
            .map(([name, value]) => ({
                name,
                value,
                percentage: total > 0 ? Math.round((value / total) * 100) : 0
            }))
            .sort((a, b) => b.value - a.value);
    }, [filteredTransactions]);

    const onPieEnter = (_: any, index: number) => {
        setActiveIndex(index);
    };

    const onPieLeave = () => {
        setActiveIndex(undefined);
    };

    const onIncomeEnter = (_: any, index: number) => {
        setActiveIncomeIndex(index);
    };

    const onIncomeLeave = () => {
        setActiveIncomeIndex(undefined);
    };

    const totalIncome = filteredTransactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);
    
    const totalExpenses = filteredTransactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + Math.abs(t.amount), 0);

    const netIncome = totalIncome - totalExpenses;

    return (
        <div className="space-y-4 sm:space-y-6 px-2 sm:px-0">
            {/* Header with Time Range Filter */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                <div className="flex items-center">
                    <ReportsIcon className="h-5 w-5 sm:h-6 sm:w-6 mr-2 text-[rgb(var(--color-primary-rgb))]" />
                    <h1 className="text-xl sm:text-2xl font-bold text-[rgb(var(--color-text-rgb))]">Financial Reports</h1>
                </div>
                <div className="relative w-full sm:w-auto">
                    <select
                        value={selectedTimeRange}
                        onChange={(e) => setSelectedTimeRange(e.target.value)}
                        className="appearance-none bg-[rgb(var(--color-background-rgb))] border-2 border-[rgb(var(--color-border-rgb))] text-[rgb(var(--color-text-rgb))] px-4 py-3 pr-10 rounded-xl shadow-sm hover:shadow-md hover:border-[rgb(var(--color-primary-rgb))] focus:outline-none focus:ring-4 focus:ring-[rgb(var(--color-primary-rgb))]/20 focus:border-[rgb(var(--color-primary-rgb))] transition-all duration-200 w-full sm:min-w-[160px] text-sm sm:text-base font-medium cursor-pointer"
                        style={{
                            backgroundImage: 'none',
                            backgroundGradient: 'linear-gradient(135deg, rgb(var(--color-background-rgb)) 0%, rgba(var(--color-background-rgb), 0.95) 100%)'
                        }}
                    >
                        {TIME_RANGE_OPTIONS.map(option => (
                            <option
                                key={option.value}
                                value={option.value}
                                className="bg-[rgb(var(--color-background-rgb))] text-[rgb(var(--color-text-rgb))] py-2 px-4 hover:bg-[rgb(var(--color-primary-rgb))]/10"
                                style={{
                                    backgroundColor: 'rgb(var(--color-background-rgb))',
                                    color: 'rgb(var(--color-text-rgb))'
                                }}
                            >
                                {option.label}
                            </option>
                        ))}
                    </select>
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                        <ChevronDownIcon className="h-5 w-5 text-[rgb(var(--color-text-muted-rgb))] transition-transform duration-200 group-hover:text-[rgb(var(--color-primary-rgb))]" />
                    </div>
                    {/* Enhanced visual indicator */}
                    <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-[rgb(var(--color-primary-rgb))]/0 via-[rgb(var(--color-primary-rgb))]/5 to-[rgb(var(--color-primary-rgb))]/0 opacity-0 hover:opacity-100 transition-opacity duration-200 pointer-events-none"></div>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                <div className="bg-[rgb(var(--color-background-rgb))] border border-[rgb(var(--color-border-rgb))] rounded-lg p-3 sm:p-4">
                    <h3 className="text-xs sm:text-sm font-medium text-[rgb(var(--color-text-muted-rgb))] uppercase tracking-wide">Total Income</h3>
                    <p className="text-lg sm:text-2xl font-bold text-green-600 mt-1">{formatCurrency(totalIncome)}</p>
                </div>
                <div className="bg-[rgb(var(--color-background-rgb))] border border-[rgb(var(--color-border-rgb))] rounded-lg p-3 sm:p-4">
                    <h3 className="text-xs sm:text-sm font-medium text-[rgb(var(--color-text-muted-rgb))] uppercase tracking-wide">Total Expenses</h3>
                    <p className="text-lg sm:text-2xl font-bold text-red-600 mt-1">{formatCurrency(totalExpenses)}</p>
                </div>
                <div className="bg-[rgb(var(--color-background-rgb))] border border-[rgb(var(--color-border-rgb))] rounded-lg p-3 sm:p-4 sm:col-span-2 lg:col-span-1">
                    <h3 className="text-xs sm:text-sm font-medium text-[rgb(var(--color-text-muted-rgb))] uppercase tracking-wide">Net Income</h3>
                    <p className={`text-lg sm:text-2xl font-bold mt-1 ${netIncome >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatCurrency(netIncome)}
                    </p>
                </div>
            </div>

            {/* Financial Overview Section */}
            <div className="space-y-4 sm:space-y-6">
                <h2 className="text-lg sm:text-xl font-semibold text-[rgb(var(--color-text-rgb))]">Financial Overview</h2>
                            {/* AI Insights */}
                <div className="bg-[rgb(var(--color-background-rgb))] border border-[rgb(var(--color-border-rgb))] rounded-lg p-6" style={{ width: '500px', maxWidth: '80vw' }}>
                    <AIInsightsCard user={user} transactions={filteredTransactions} />
                </div>
                {/* Cash Flow Trend Chart */}
                <div className="bg-[rgb(var(--color-background-rgb))] border border-[rgb(var(--color-border-rgb))] rounded-lg p-4 sm:p-6">
                    <h3 className="text-base sm:text-lg font-medium text-[rgb(var(--color-text-rgb))] mb-3 sm:mb-4">Net Worth & Cash Flow Trend</h3>
                    <div className="h-64 sm:h-80">
                        {cashFlowData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={cashFlowData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgb(var(--color-border-rgb))" />
                                    <XAxis
                                        dataKey="month"
                                        tick={{ fontSize: 10, fill: 'rgb(var(--color-text-muted-rgb))' }}
                                        interval="preserveStartEnd"
                                    />
                                    <YAxis
                                        tick={{ fontSize: 10, fill: 'rgb(var(--color-text-muted-rgb))' }}
                                        tickFormatter={(value) => formatCurrency(value)}
                                        width={60}
                                    />
                                    <Tooltip content={<CashFlowTooltip />} />
                                    <Legend />
                                    <Line
                                        type="monotone"
                                        dataKey="monthlyFlow"
                                        stroke="#0088FE"
                                        strokeWidth={2}
                                        name="Monthly Cash Flow"
                                        dot={{ r: 4 }}
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey="cumulativeFlow"
                                        stroke="#00C49F"
                                        strokeWidth={2}
                                        name="Net Worth"
                                        dot={{ r: 4 }}
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-full flex items-center justify-center text-[rgb(var(--color-text-muted-rgb))]">
                                <div className="text-center">
                                    <p className="text-lg mb-2">No transaction data available</p>
                                    <p className="text-sm">for the selected time period</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Monthly Income vs Expenses Chart */}
                <div className="bg-[rgb(var(--color-background-rgb))] border border-[rgb(var(--color-border-rgb))] rounded-lg p-4 sm:p-6">
                    <h3 className="text-base sm:text-lg font-medium text-[rgb(var(--color-text-rgb))] mb-3 sm:mb-4">Monthly Income vs Expenses</h3>
                    <div className="h-64 sm:h-80">
                        {monthlyData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={monthlyData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgb(var(--color-border-rgb))" />
                                    <XAxis
                                        dataKey="month"
                                        tick={{ fontSize: 10, fill: 'rgb(var(--color-text-muted-rgb))' }}
                                        interval="preserveStartEnd"
                                    />
                                    <YAxis
                                        tick={{ fontSize: 10, fill: 'rgb(var(--color-text-muted-rgb))' }}
                                        tickFormatter={(value) => formatCurrency(value)}
                                        width={60}
                                    />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Legend />
                                    <Bar dataKey="income" fill="#10B981" name="Income" />
                                    <Bar dataKey="expense" fill="#EF4444" name="Expenses" />
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-full flex items-center justify-center text-[rgb(var(--color-text-muted-rgb))]">
                                <div className="text-center">
                                    <p className="text-lg mb-2">No transaction data available</p>
                                    <p className="text-sm">for the selected time period</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Category Analysis Charts */}
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6">
                    {/* Spending Analysis */}
                    <div className="bg-[rgb(var(--color-background-rgb))] border border-[rgb(var(--color-border-rgb))] rounded-lg p-4 sm:p-6">
                        <h3 className="text-base sm:text-lg font-medium text-[rgb(var(--color-text-rgb))] mb-3 sm:mb-4">Spending by Category</h3>
                        {categoryData.length > 0 ? (
                            <div className="h-64 sm:h-80">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            activeIndex={activeIndex}
                                            activeShape={renderActiveShape}
                                            data={categoryData}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={60}
                                            outerRadius={100}
                                            fill="#8884d8"
                                            dataKey="value"
                                            onMouseEnter={onPieEnter}
                                            onMouseLeave={onPieLeave}
                                        >
                                            {categoryData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip content={<PieTooltip />} />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        ) : (
                            <div className="h-80 flex items-center justify-center text-[rgb(var(--color-text-muted-rgb))]">
                                No expense data available for the selected period
                            </div>
                        )}
                    </div>

                    {/* Income Analysis */}
                    <div className="bg-[rgb(var(--color-background-rgb))] border border-[rgb(var(--color-border-rgb))] rounded-lg p-6">
                        <h3 className="text-lg font-medium text-[rgb(var(--color-text-rgb))] mb-4">Income by Source</h3>
                        {incomeData.length > 0 ? (
                            <div className="h-80">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            activeIndex={activeIncomeIndex}
                                            activeShape={renderActiveShape}
                                            data={incomeData}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={60}
                                            outerRadius={100}
                                            fill="#8884d8"
                                            dataKey="value"
                                            onMouseEnter={onIncomeEnter}
                                            onMouseLeave={onIncomeLeave}
                                        >
                                            {incomeData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip content={<PieTooltip />} />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        ) : (
                            <div className="h-80 flex items-center justify-center text-[rgb(var(--color-text-muted-rgb))]">
                                No income data available for the selected period
                            </div>
                        )}
                    </div>
                </div>
            </div>


        </div>
    );
};

export default ReportsPage;
