import React, { useMemo, useState, useCallback, useEffect } from 'react';
import { Transaction, User, AIInsight, Budget, Goal } from '../types';
import { Category } from '../types/category';
import CategoryIcon from './CategoryIcon';
import { ReportsIcon, SparklesIcon, ChevronDownIcon, DownloadIcon, XMarkIcon, TrendingUpIcon, TrendingDownIcon, WalletIcon } from './icons';
import { formatCurrency } from '../utils/formatters';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, Sector } from 'recharts';
import AISwiperCard from './AISwiperCard';
import Card, { CardHeader, CardTitle, CardContent } from './Card';
import ReportExportModal from './ReportExportModal';
import { useTheme } from './ThemeContext';

// Performance optimization: Virtualized list imports (if library available, otherwise we use limit)
// For this standalone implementation, we'll implement a simple windowing or just limit initial render items

interface MonthlyData {
  month: string;
  income: number;
  expense: number;
  net: number;
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

// Memoized components to prevent re-renders
const FormattedAIInsights: React.FC<{ insights: AIInsight }> = React.memo(({ insights }) => (
  <div className="flex justify-center w-full max-w-full overflow-hidden">
    <div className="w-full max-w-lg">
      <AISwiperCard insights={insights} />
    </div>
  </div>
));

const AIInsightsCard: React.FC<{
  user: User, 
  transactions: Transaction[],
}> = React.memo(({ user, transactions }) => {
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

    const prompt = `You are FinTrack, an expert financial assistant. Analyze the following transactions from the last 30 days and provide a structured JSON response. Requirements:
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

      let jsonText = text.trim();
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
    <Card className="bg-gradient-to-br from-[rgb(var(--color-card-rgb))] to-[rgb(var(--color-card-muted-rgb))] border-[rgb(var(--color-border-rgb))]">
      <CardHeader className="flex justify-between items-center">
        <CardTitle className="flex items-center gap-2">
          <SparklesIcon className="h-5 w-5 text-[rgb(var(--color-primary-rgb))]" />
          AI Financial Assistant
        </CardTitle>
        <button
          onClick={handleGenerateInsights}
          disabled={!hasApiKey || isLoading}
          className="flex items-center px-3 py-1.5 text-xs font-medium text-white bg-[rgb(var(--color-primary-rgb))] rounded-lg hover:bg-[rgb(var(--color-primary-hover-rgb))] transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed shadow-sm"
          aria-label={isLoading ? 'Analyzing financials' : 'Generate AI insights'}
        >
          <SparklesIcon className="h-4 w-4 mr-2" aria-hidden="true" />
          {isLoading ? 'Analyzing...' : buttonContent}
        </button>
      </CardHeader>
      <CardContent>
        <div className="min-h-[14rem] flex items-center justify-center">
          {isLoading && (
            <div className="flex flex-col items-center text-[rgb(var(--color-text-muted-rgb))]" role="status">
              <svg className="animate-spin h-8 w-8 text-[rgb(var(--color-primary-rgb))]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span className="mt-2">Generating your financial summary...</span>
            </div>
          )}
          {error && <p className="text-red-500 text-sm text-center max-w-md" role="alert">{error}</p>}
          {insights && !isLoading && (
            <FormattedAIInsights insights={insights} />
          )}
          {!isLoading && !error && !insights && (
            <div className="text-center text-[rgb(var(--color-text-muted-rgb))] max-w-md">
              <p className="mb-2">
                {hasApiKey ? "Click the button to get AI-powered insights on your recent spending." : "Please add your Gemini API key in the settings page to enable this feature."}
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
});

const CustomBarTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[rgb(var(--color-card-rgb))] p-3 border border-[rgb(var(--color-border-rgb))] rounded-lg shadow-lg z-50">
        <p className="font-bold text-[rgb(var(--color-text-rgb))] mb-2">{label}</p>
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex justify-between items-center gap-4 text-sm mb-1">
            <span style={{ color: entry.color }} className="font-medium">{entry.name}:</span>
            <span className="font-mono">{formatCurrency(entry.value)}</span>
          </div>
        ))}
        {payload.length >= 2 && (
          <div className="mt-2 pt-2 border-t border-[rgb(var(--color-border-rgb))] flex justify-between items-center gap-4 text-sm">
             <span className="font-medium text-[rgb(var(--color-text-muted-rgb))]">Net:</span>
             <span className={`font-mono font-bold ${payload[0].value - payload[1].value >= 0 ? 'text-green-500' : 'text-red-500'}`}>
               {payload[0].value - payload[1].value >= 0 ? '+' : ''}{formatCurrency(payload[0].value - payload[1].value)}
             </span>
          </div>
        )}
      </div>
    );
  }
  return null;
};

const PieTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-[rgb(var(--color-card-rgb))] p-3 border border-[rgb(var(--color-border-rgb))] rounded-lg shadow-lg z-50">
        <p className="font-bold text-[rgb(var(--color-text-rgb))]">{data.name}</p>
        <div className="flex justify-between gap-4 mt-1">
          <span className="text-sm text-[rgb(var(--color-text-muted-rgb))]">Amount:</span>
          <span className="text-sm font-mono">{formatCurrency(data.value)}</span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-sm text-[rgb(var(--color-text-muted-rgb))]">Share:</span>
          <span className="text-sm font-mono">{data.percentage}%</span>
        </div>
      </div>
    );
  }
  return null;
};

const renderActiveShape = (props: any) => {
  const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill, payload, percent } = props;

  return (
    <g>
      <text x={cx} y={cy} dy={-4} textAnchor="middle" fill={fill} fontSize={14} fontWeight="bold">
        {payload.name}
      </text>
      <text x={cx} y={cy} dy={14} textAnchor="middle" fill="rgb(var(--color-text-muted-rgb))" fontSize={12}>
        {`${(percent * 100).toFixed(1)}%`}
      </text>
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius}
        outerRadius={outerRadius + 6}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
      />
      <Sector
        cx={cx}
        cy={cy}
        startAngle={startAngle}
        endAngle={endAngle}
        innerRadius={outerRadius + 8}
        outerRadius={outerRadius + 10}
        fill={fill}
      />
    </g>
  );
};

// Summary Card Component
const MetricCard: React.FC<{ 
  title: string, 
  amount: number, 
  icon: React.ReactNode, 
  trend?: number, 
  colorClass: string 
}> = React.memo(({ title, amount, icon, trend, colorClass }) => (
  <Card className="flex-1 min-w-[200px]">
    <CardContent className="p-4 sm:p-6">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-sm font-medium text-[rgb(var(--color-text-muted-rgb))]">{title}</p>
          <h3 className={`text-2xl font-bold mt-1 ${colorClass}`}>{formatCurrency(amount)}</h3>
        </div>
        <div className="p-2 bg-[rgb(var(--color-card-muted-rgb))] rounded-lg">
          {icon}
        </div>
      </div>
      {trend !== undefined && (
        <div className="mt-4 flex items-center text-xs">
          {trend > 0 ? (
            <span className="flex items-center text-green-500 font-medium">
              <TrendingUpIcon className="h-3 w-3 mr-1" />
              {trend}%
            </span>
          ) : trend < 0 ? (
            <span className="flex items-center text-red-500 font-medium">
              <TrendingDownIcon className="h-3 w-3 mr-1" />
              {Math.abs(trend)}%
            </span>
          ) : (
            <span className="text-[rgb(var(--color-text-muted-rgb))] font-medium">0%</span>
          )}
          <span className="text-[rgb(var(--color-text-muted-rgb))] ml-1">vs last period</span>
        </div>
      )}
    </CardContent>
  </Card>
));

// Extracted Category List Item for better performance
const CategoryListItem = React.memo(({ 
  item, 
  index, 
  totalSpending, 
  expandedCategory, 
  setExpandedCategory, 
  transactions,
  categories 
}: any) => {
  const category = categories.find((c: any) => c.name === item.name);
  const isExpanded = expandedCategory === item.name;
  
  // Memoize filtered transactions for this category to avoid re-calculating on every render
  const categoryTransactions = useMemo(() => {
    if (!isExpanded) return [];
    return transactions
      .filter((t: any) => t.category === item.name)
      .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 10); // Limit to top 10 for performance
  }, [isExpanded, transactions, item.name]);

  return (
    <div className="mb-2 relative" style={{ zIndex: isExpanded ? 50 : 1 }}>
      <button
        className="w-full text-left cursor-pointer p-3 rounded-xl hover:bg-[rgb(var(--color-card-muted-rgb))] transition-colors focus:outline-none focus:ring-2 focus:ring-[rgb(var(--color-primary-rgb))] bg-[rgb(var(--color-card-rgb))] relative"
        onClick={() => setExpandedCategory(isExpanded ? null : item.name)}
        aria-expanded={isExpanded}
        aria-controls={`category-transactions-${item.name}`}
      >
        <div className="flex justify-between items-center mb-2">
          <div className="flex items-center gap-3">
            <CategoryIcon category={item.name} emoji={category?.icon} />
            <span className="font-bold text-[rgb(var(--color-text-rgb))]">{item.name}</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="font-bold text-[rgb(var(--color-text-rgb))]">{formatCurrency(item.value)}</div>
              <div className="text-xs text-[rgb(var(--color-text-muted-rgb))]">{item.percentage}%</div>
            </div>
            <ChevronDownIcon className={`h-4 w-4 text-[rgb(var(--color-text-muted-rgb))] transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
          </div>
        </div>
        <div className="w-full bg-[rgb(var(--color-border-rgb))] rounded-full h-1.5 overflow-hidden">
          <div 
            className="h-full rounded-full transition-all duration-500 ease-out" 
            style={{ width: `${item.percentage}%`, backgroundColor: COLORS[index % COLORS.length] }}
          />
        </div>
      </button>
      
      <div
        id={`category-transactions-${item.name}`}
        className={`transition-all duration-300 ease-in-out relative ${isExpanded ? 'opacity-100' : 'max-h-0 opacity-0 overflow-hidden'}`}
        style={{ zIndex: isExpanded ? 100 : 1 }}
      >
        {isExpanded && (
          <div className="mt-2 ml-4 pl-4 border-l-2 border-[rgb(var(--color-border-rgb))] bg-[rgb(var(--color-card-rgb))] rounded-lg shadow-lg p-2 relative max-h-[300px] overflow-y-auto custom-scrollbar" style={{ zIndex: 100 }}>
            <ul className="divide-y divide-[rgb(var(--color-border-rgb))]" role="list">
              {categoryTransactions.length > 0 ? (
                categoryTransactions.map((t: any) => (
                  <li key={t.id} className="flex justify-between items-center py-2.5 text-sm">
                    <div className="flex flex-col max-w-[70%]">
                      <span className="font-medium text-[rgb(var(--color-text-rgb))] truncate">{t.description}</span>
                      <span className="text-xs text-[rgb(var(--color-text-muted-rgb))]">
                        {new Date(t.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                    <span className="font-semibold text-red-500 whitespace-nowrap">
                      -{formatCurrency(t.amount)}
                    </span>
                  </li>
                ))
              ) : (
                <li className="text-center py-4 text-xs text-[rgb(var(--color-text-muted-rgb))]">No transactions found.</li>
              )}
              {transactions.filter((t: any) => t.category === item.name).length > 10 && (
                <li className="py-2 text-center text-xs text-[rgb(var(--color-primary-rgb))] font-medium">
                  + {transactions.filter((t: any) => t.category === item.name).length - 10} more transactions
                </li>
              )}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
});

interface ReportsPageProps {
  transactions: Transaction[];
  user: User;
  categories: Category[];
  budgets?: Budget[];
  goals?: Goal[];
}

const ReportsPage: React.FC<ReportsPageProps> = ({ transactions, user, categories, budgets = [], goals = [] }) => {
  const { theme } = useTheme();
  // Initialize with last_6_months or first available option
  const [cashFlowRange, setCashFlowRange] = useState<string>('last_6_months');
  
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isChartReady, setIsChartReady] = useState(false);

  // Lazy load chart visibility for better initial render performance
  useEffect(() => {
    const timer = setTimeout(() => setIsChartReady(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const onPieEnter = useCallback((_: any, index: number) => {
    setActiveIndex(index);
  }, []);

  const onPieLeave = useCallback(() => {
    setActiveIndex(null);
  }, []);

  // Filtered transactions based on selected range - Memoized
  const filteredTransactions = useMemo(() => {
    const selectedOption = TIME_RANGE_OPTIONS.find(opt => opt.value === cashFlowRange);
    const now = new Date();
    let startDate = new Date(0);

    if (selectedOption) {
      if (selectedOption.value === 'current_month') {
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      } else if (selectedOption.value === 'current_year') {
        startDate = new Date(now.getFullYear(), 0, 1);
      } else if (selectedOption.months > 0) {
        startDate = new Date(now.getFullYear(), now.getMonth() - selectedOption.months + 1, 1);
      }
    }

    return transactions.filter(t => new Date(t.date) >= startDate);
  }, [transactions, cashFlowRange]);

  // Comparison logic for trends (previous period)
  const previousPeriodTransactions = useMemo(() => {
     const selectedOption = TIME_RANGE_OPTIONS.find(opt => opt.value === cashFlowRange);
     if (!selectedOption || selectedOption.value === 'all_time') return [];

     const now = new Date();
     let startDate = new Date(0);
     let endDate = new Date(0);

     if (selectedOption.value === 'current_month') {
       // Previous month
       startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
       endDate = new Date(now.getFullYear(), now.getMonth(), 0);
     } else if (selectedOption.value === 'current_year') {
       // Previous year
       startDate = new Date(now.getFullYear() - 1, 0, 1);
       endDate = new Date(now.getFullYear() - 1, 11, 31);
     } else if (selectedOption.months > 0) {
       // Previous X months
       const currentStart = new Date(now.getFullYear(), now.getMonth() - selectedOption.months + 1, 1);
       startDate = new Date(currentStart);
       startDate.setMonth(startDate.getMonth() - selectedOption.months);
       endDate = new Date(currentStart);
       endDate.setDate(endDate.getDate() - 1);
     }

     return transactions.filter(t => {
       const d = new Date(t.date);
       return d >= startDate && d <= endDate;
     });
  }, [transactions, cashFlowRange]);

  // Calculate metrics
  const calculateMetrics = (txs: Transaction[]) => {
    const income = txs.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
    const expense = txs.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
    return { income, expense, net: income - expense };
  };

  const currentMetrics = useMemo(() => calculateMetrics(filteredTransactions), [filteredTransactions]);
  const previousMetrics = useMemo(() => calculateMetrics(previousPeriodTransactions), [previousPeriodTransactions]);

  const trends = useMemo(() => {
    const calcTrend = (current: number, prev: number) => {
      if (prev === 0) return current > 0 ? 100 : 0;
      return Math.round(((current - prev) / prev) * 100);
    };
    return {
      income: calcTrend(currentMetrics.income, previousMetrics.income),
      expense: calcTrend(currentMetrics.expense, previousMetrics.expense),
      net: calcTrend(currentMetrics.net, previousMetrics.net)
    };
  }, [currentMetrics, previousMetrics]);

  // Process data for Bar Chart
  const monthlyData: MonthlyData[] = useMemo(() => {
    const data: { [key: string]: MonthlyData } = {};
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    filteredTransactions.forEach(t => {
      const date = new Date(t.date);
      const yearStr = String(date.getFullYear()).slice(2);
      // Group by month-year
      const monthKey = `${date.getFullYear()}-${date.getMonth()}`;
      
      if (!data[monthKey]) {
        data[monthKey] = {
          month: `${months[date.getMonth()]} '${yearStr}`,
          income: 0,
          expense: 0,
          net: 0
        };
      }
      if (t.type === 'income') {
        data[monthKey].income += t.amount;
        data[monthKey].net += t.amount;
      } else {
        data[monthKey].expense += t.amount;
        data[monthKey].net -= t.amount;
      }
    });

    return Object.values(data).sort((a, b) => {
      const [aMonth, aYear] = a.month.split(" '");
      const [bMonth, bYear] = b.month.split(" '");
      // Create comprehensive dates for sorting
      // Note: this simple parse works because we constructed the keys cleanly
      return new Date(`${aMonth} 1, 20${aYear}`).getTime() - new Date(`${bMonth} 1, 20${bYear}`).getTime();
    });
  }, [filteredTransactions]);

  // Process data for Pie Chart
  // Optimization: Group small slices into 'Other'
  const pieData = useMemo(() => {
    const categoryMap: { [key: string]: number } = {};
    const expenseTransactions = filteredTransactions.filter(t => t.type === 'expense');
    
    expenseTransactions.forEach(t => {
      categoryMap[t.category] = (categoryMap[t.category] || 0) + t.amount;
    });

    const total = Object.values(categoryMap).reduce((sum, amount) => sum + amount, 0) || 1;
    
    let processedData = Object.entries(categoryMap)
      .map(([name, value]) => ({
        name,
        value,
        percentage: Number(((value / total) * 100).toFixed(1)),
      }))
      .sort((a, b) => b.value - a.value);

    // If too many categories, group tail into 'Other'
    if (processedData.length > 8) {
      const topCategories = processedData.slice(0, 7);
      const otherCategories = processedData.slice(7);
      const otherValue = otherCategories.reduce((sum, item) => sum + item.value, 0);
      const otherPercentage = Number(((otherValue / total) * 100).toFixed(1));
      
      // Ensure 'Other' doesn't conflict if a category explicitly named 'Other' exists
      // Although unlikely in standard use, robust data handling prevents key collisions
      const existingOther = topCategories.find(c => c.name === 'Other');
      if (existingOther) {
         existingOther.value += otherValue;
         existingOther.percentage = Number(((existingOther.value / total) * 100).toFixed(1));
         processedData = topCategories;
      } else if (otherValue > 0) {
         processedData = [
           ...topCategories,
           { name: 'Other', value: otherValue, percentage: otherPercentage }
         ];
      } else {
         processedData = topCategories;
      }
    }

    return processedData;
  }, [filteredTransactions]);

  const totalSpending = useMemo(() => pieData.reduce((sum, item) => sum + item.value, 0), [pieData]);

  return (
    <div className="flex flex-col gap-6 p-0 sm:p-0 pb-20 md:pb-6 max-w-7xl mx-auto animate-fade-in-up">
      {/* Header Section */}
      {/* Hidden Header for standalone usage */}
      <div className="hidden">
          <h1 className="text-3xl font-bold text-[rgb(var(--color-text-rgb))] tracking-tight">Financial Reports</h1>
      </div>
       
      <div className="flex flex-col md:flex-row justify-end items-start md:items-center gap-4">
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
           <div className="relative flex-1 md:flex-none min-w-[160px]">
            <select
              value={cashFlowRange}
              onChange={(e) => setCashFlowRange(e.target.value)}
              className="w-full appearance-none pl-4 pr-10 py-2.5 border border-[rgb(var(--color-border-rgb))] rounded-xl bg-[rgb(var(--color-card-rgb))] text-sm font-medium focus:ring-2 focus:ring-[rgb(var(--color-primary-rgb))] focus:border-transparent outline-none transition-all shadow-sm cursor-pointer hover:border-[rgb(var(--color-primary-rgb))]"
              aria-label="Select report time range"
              title="Filter by Time Range"
            >
              {TIME_RANGE_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <ChevronDownIcon className="h-4 w-4 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-[rgb(var(--color-text-muted-rgb))]" aria-hidden="true" />
          </div>

          <button
            onClick={() => setIsExportModalOpen(true)}
            className="flex items-center justify-center px-4 py-2.5 text-sm font-semibold bg-[rgb(var(--color-primary-rgb))] text-white rounded-xl hover:bg-[rgb(var(--color-primary-hover-rgb))] transition-colors shadow-sm focus:ring-2 focus:ring-offset-2 focus:ring-[rgb(var(--color-primary-rgb))] outline-none"
            aria-label="Export Financial Reports"
            role="button"
          >
            <DownloadIcon className="h-4 w-4 mr-2" aria-hidden="true" />
            Export
          </button>
        </div>
      </div>

      <ReportExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        transactions={transactions}
        budgets={budgets}
        goals={goals}
        user={user}
        categories={categories}
      />
      
      {/* Metrics Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <MetricCard 
          title="Total Income" 
          amount={currentMetrics.income} 
          icon={<TrendingUpIcon className="h-5 w-5 text-green-600" />}
          trend={trends.income}
          colorClass="text-green-600 dark:text-green-400"
        />
        <MetricCard 
          title="Total Expenses" 
          amount={currentMetrics.expense} 
          icon={<TrendingDownIcon className="h-5 w-5 text-red-600" />}
          trend={trends.expense}
          colorClass="text-red-600 dark:text-red-400"
        />
        <MetricCard 
          title="Net Cash Flow" 
          amount={currentMetrics.net} 
          icon={<WalletIcon className="h-5 w-5 text-blue-600" />}
          trend={trends.net}
          colorClass="text-[rgb(var(--color-text-rgb))]"
        />
      </div>

      {/* AI Insights - Full Width */}
      <div className="w-full">
        <AIInsightsCard user={user} transactions={filteredTransactions.length > 0 ? filteredTransactions : transactions.slice(0, 50)} />
      </div>

      {/* Main Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 overflow-visible">
        
        {/* Bar Chart - Takes up 2 columns on large screens */}
        <Card className="lg:col-span-2 flex flex-col h-[400px]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ReportsIcon className="h-5 w-5 text-[rgb(var(--color-primary-rgb))]" />
              Income vs Expense
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 min-h-0">
             {isChartReady ? (
               <div style={{ width: '100%', height: '100%' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={monthlyData} margin={{ top: 10, right: 10, left: 0, bottom: 20 }} barGap={0}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(var(--color-border-rgb), 0.5)" vertical={false} />
                      <XAxis 
                        dataKey="month" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fill: 'rgb(var(--color-text-muted-rgb))', fontSize: 11 }} 
                        dy={10} 
                      />
                       <YAxis 
                         axisLine={false} 
                         tickLine={false} 
                         tick={{ fill: 'rgb(var(--color-text-muted-rgb))', fontSize: 11 }} 
                         tickFormatter={(value) => `$${value >= 1000 ? `${(value / 1000).toFixed(1)}k` : value}`}
                       />
                       <Tooltip content={<CustomBarTooltip />} cursor={{ fill: 'rgba(var(--color-primary-rgb), 0.05)' }} />
                       <Legend iconType="circle" iconSize={8} wrapperStyle={{ paddingTop: '20px' }} />
                       <Bar 
                         dataKey="income" 
                         name="Income" 
                         fill={theme === 'theme-dark-green' ? '#34D399' : '#10B981'} 
                         radius={[4, 4, 0, 0]} 
                         maxBarSize={40} 
                         animationDuration={1000}
                       />
                       <Bar 
                         dataKey="expense" 
                         name="Expense" 
                         fill={theme === 'theme-dark-crimson' ? '#F87171' : '#EF4444'} 
                         radius={[4, 4, 0, 0]} 
                         maxBarSize={40} 
                         animationDuration={1000}
                         animationBegin={200}
                       />
                    </BarChart>
                  </ResponsiveContainer>
               </div>
             ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <span className="loading-spinner" />
                </div>
             )}
          </CardContent>
        </Card>

        {/* Categories Breakdown - Takes up 1 column */}
        <div className="lg:col-span-1 flex flex-col gap-6 overflow-visible">
          <Card className="flex-1 min-h-[400px] overflow-visible">
            <CardHeader>
              <CardTitle>Spending by Category</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center p-0 overflow-visible">
              {pieData.length > 0 ? (
                <>
                  <div className="h-[220px] w-full mt-2 relative">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={pieData}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={2}
                          activeIndex={activeIndex ?? -1}
                          activeShape={renderActiveShape}
                          onMouseEnter={onPieEnter}
                          onMouseLeave={onPieLeave}
                          stroke="none"
                        >
                          {pieData.map((entry, index) => (
                            <Cell 
                              key={`cell-${index}`} 
                              fill={COLORS[index % COLORS.length]} 
                              className="focus:outline-none transition-all duration-300"
                              style={{ 
                                filter: activeIndex !== null && activeIndex !== index ? 'opacity(0.4)' : 'opacity(1)',
                                transform: activeIndex === index ? 'scale(1.05)' : 'scale(1)',
                                transformOrigin: 'center'
                              }} 
                            />
                          ))}
                        </Pie>
                        <Tooltip content={<PieTooltip />} />
                      </PieChart>
                    </ResponsiveContainer>
                    {/* Centered Total Text */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
                      <p className="text-xs text-[rgb(var(--color-text-muted-rgb))] font-medium uppercase tracking-wider">Total</p>
                      <p className="text-lg font-bold text-[rgb(var(--color-text-rgb))]">{formatCurrency(totalSpending)}</p>
                    </div>
                  </div>
                  
                  {/* Category Legend/List */}
                  <div className="w-full px-6 pb-6 mt-2 overflow-visible">
                     <p className="text-xs font-semibold text-[rgb(var(--color-text-muted-rgb))] mb-3 uppercase tracking-wider">Top Categories</p>
                     <div className="space-y-1 overflow-visible">
                       {pieData.map((item, index) => (
                         <CategoryListItem 
                           key={item.name} 
                           item={item} 
                           index={index} 
                           totalSpending={totalSpending}
                           expandedCategory={expandedCategory}
                           setExpandedCategory={setExpandedCategory}
                           transactions={transactions}
                           categories={categories}
                         />
                       ))}
                     </div>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center h-[300px] text-center p-6 text-[rgb(var(--color-text-muted-rgb))]">
                  <div className="w-16 h-16 rounded-full bg-[rgb(var(--color-card-muted-rgb))] flex items-center justify-center mb-4">
                    <PieChart width={24} height={24} className="opacity-20" />
                  </div>
                  <p>No expense data found for this period.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ReportsPage;
