import React, { useMemo, useState } from 'react';
import { Transaction, User, AIInsight } from '../types';
import { ReportsIcon, SparklesIcon, CheckCircleIcon, ExclamationTriangleIcon, LightBulbIcon } from './icons';
import { formatCurrency } from '../utils/formatters';
import { CATEGORY_ICON_MAP } from '../constants';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface MonthlyData {
  month: string;
  income: number;
  expense: number;
}

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
        <div className="text-[rgb(var(--color-text-rgb))] text-sm leading-relaxed w-full space-y-6">
            <p className="italic text-[rgb(var(--color-text-muted-rgb))] text-center px-4 animate-fade-in-up">{insights.summary}</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <InsightItem icon={CheckCircleIcon} title="What's Going Well" colorClass="text-green-500">
                    <ul className="list-disc list-inside space-y-1">
                        {insights.positivePoints.map((point, i) => <li key={i}>{point}</li>)}
                    </ul>
                </InsightItem>
                 <InsightItem icon={ExclamationTriangleIcon} title="Areas to Watch" colorClass="text-yellow-500">
                    <ul className="list-disc list-inside space-y-1">
                        {insights.areasForImprovement.map((point, i) => <li key={i}>{point}</li>)}
                    </ul>
                </InsightItem>
            </div>
            
            <div className="p-4 bg-[rgba(var(--color-primary-rgb),0.1)] rounded-lg animate-fade-in-up" style={{ animationDelay: '100ms' }}>
                 <h4 className="font-semibold flex items-center mb-2 text-[rgb(var(--color-primary-subtle-text-rgb))]">
                    <LightBulbIcon className="h-5 w-5 mr-2" />
                    Actionable Pro-Tip
                </h4>
                <p className="text-[rgb(var(--color-text-muted-rgb))] pl-7">{insights.actionableTip}</p>
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

        const prompt = `You are Finance Flow, an expert financial assistant. Analyze the following transactions from the last 30 days and provide a structured JSON response. The JSON object should contain: a brief 'summary' of spending habits (1-2 sentences), an array of 'positivePoints' (2-3 items), an array of 'areasForImprovement' (2-3 items), and a single 'actionableTip'. Keep the text friendly and concise.

Here are the transactions in JSON format:
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
            const text = data.candidates[0].content.parts[0].text;

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
             <div className="p-4 border border-[rgb(var(--color-border-rgb))] rounded-lg min-h-[16rem] flex items-center justify-center">
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
        <div className="bg-[rgb(var(--color-card-rgb))] p-3 border border-[rgb(var(--color-border-rgb))] rounded-lg shadow-lg">
          <p className="font-bold text-[rgb(var(--color-text-rgb))] mb-1">{label}</p>
          <p className="text-sm text-green-500">{`Income: ${formatCurrency(payload[0].value)}`}</p>
          <p className="text-sm text-red-500">{`Expense: ${formatCurrency(payload[1].value)}`}</p>
        </div>
      );
    }
    return null;
};

interface ReportsPageProps {
    transactions: Transaction[];
    user: User;
}

const ReportsPage: React.FC<ReportsPageProps> = ({ transactions, user }) => {

  const monthlyData: MonthlyData[] = useMemo(() => {
    const data: { [key: string]: { income: number, expense: number } } = {};
    const today = new Date();

    for (let i = 5; i >= 0; i--) {
        const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        data[monthKey] = { income: 0, expense: 0 };
    }
    
    transactions.forEach(t => {
      const date = new Date(t.date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      if (data[monthKey]) {
        if (t.type === 'income') {
          data[monthKey].income += t.amount;
        } else {
          data[monthKey].expense += t.amount;
        }
      }
    });

    return Object.keys(data).sort().map(key => {
        const [year, monthNum] = key.split('-');
        const date = new Date(parseInt(year), parseInt(monthNum) - 1, 1);
        const monthLabel = date.toLocaleString('default', { month: 'short' });
        return { month: monthLabel, income: data[key].income, expense: data[key].expense };
    });
  }, [transactions]);

  const yAxisTickFormatter = (value: number) => {
      if (value >= 1000) {
          return `$${value / 1000}k`;
      }
      return `$${value}`;
  }
  
  const spendingAnalysis = useMemo(() => {
    const expenses = transactions.filter(t => t.type === 'expense');
    const totalExpense = expenses.reduce((sum, t) => sum + t.amount, 0);
    if (totalExpense === 0) return [];
    
    const categoryMap: { [key: string]: { total: number, count: number } } = {};
    expenses.forEach(t => {
        if (!categoryMap[t.category]) {
            categoryMap[t.category] = { total: 0, count: 0 };
        }
        categoryMap[t.category].total += t.amount;
        categoryMap[t.category].count++;
    });

    return Object.entries(categoryMap)
        .map(([category, data]) => ({
            category,
            icon: CATEGORY_ICON_MAP[category] || CATEGORY_ICON_MAP['Other'],
            ...data,
            percentage: (data.total / totalExpense) * 100,
        }))
        .sort((a, b) => b.total - a.total);
    }, [transactions]);
  
  const hasData = useMemo(() => transactions.length > 0, [transactions]);

  if (!hasData) {
    return (
        <div className="flex flex-col items-center justify-center h-full text-center bg-[rgb(var(--color-card-rgb))] rounded-lg shadow p-8 transition-colors">
            <ReportsIcon className="h-16 w-16 text-[rgb(var(--color-text-muted-rgb))] mb-4" />
            <h1 className="text-2xl font-bold text-[rgb(var(--color-text-rgb))]">Reports</h1>
            <p className="mt-2 text-lg text-[rgb(var(--color-text-muted-rgb))]">Add some transactions to see your financial reports.</p>
        </div>
    );
  }

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold text-[rgb(var(--color-text-rgb))]">Financial Reports</h1>
      
      <div className="bg-[rgb(var(--color-card-rgb))] p-4 md:p-6 rounded-lg shadow space-y-8 transition-colors">
        <AIInsightsCard user={user} transactions={transactions} />
      </div>

      <div className="bg-[rgb(var(--color-card-rgb))] p-4 md:p-6 rounded-lg shadow space-y-8 transition-colors">
        <div>
          <h2 className="text-xl font-semibold text-[rgb(var(--color-text-rgb))] mb-4">Monthly Summary</h2>
          <div className="p-4 border border-[rgb(var(--color-border-rgb))] rounded-lg">
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                        data={monthlyData}
                        margin={{ top: 5, right: 20, left: -10, bottom: 5 }}
                    >
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(var(--color-border-rgb), 0.5)" />
                        <XAxis dataKey="month" tick={{ fill: 'rgb(var(--color-text-muted-rgb))', fontSize: 12 }} />
                        <YAxis tickFormatter={yAxisTickFormatter} tick={{ fill: 'rgb(var(--color-text-muted-rgb))', fontSize: 12 }} />
                        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(var(--color-border-rgb), 0.3)' }} />
                        <Legend />
                        <Bar dataKey="income" fill="#4ade80" name="Income" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="expense" fill="#f87171" name="Expense" radius={[4, 4, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
              </div>
          </div>
        </div>
        
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-[rgb(var(--color-text-rgb))]">Spending Analysis by Category</h2>
          <div className="p-4 border border-[rgb(var(--color-border-rgb))] rounded-lg space-y-4">
              {spendingAnalysis.length > 0 ? spendingAnalysis.map(item => (
                  <div key={item.category}>
                      <div className="flex justify-between items-center mb-1">
                          <div className="flex items-center">
                              <div className="bg-[rgb(var(--color-card-muted-rgb))] rounded-full p-2 mr-3">
                                  <item.icon className="h-5 w-5 text-[rgb(var(--color-text-muted-rgb))]" />
                              </div>
                              <span className="font-medium text-[rgb(var(--color-text-rgb))]">{item.category}</span>
                          </div>
                          <span className="font-semibold text-[rgb(var(--color-text-rgb))]">{formatCurrency(item.total)}</span>
                      </div>
                      <div className="w-full bg-[rgb(var(--color-card-muted-rgb))] rounded-full h-2">
                          <div className="bg-[rgb(var(--color-primary-rgb))] h-2 rounded-full" style={{ width: `${item.percentage}%` }}></div>
                      </div>
                      <div className="text-right text-xs text-[rgb(var(--color-text-muted-rgb))] mt-1">{item.percentage.toFixed(1)}% of total expenses</div>
                  </div>
              )) : <p className="text-center text-[rgb(var(--color-text-muted-rgb))] py-4">No expense data to analyze.</p>}
          </div>
      </div>
    </div>
    </div>
  );
};

export default ReportsPage;