import React, { useState, useMemo, useEffect } from 'react';
import { Transaction, Budget, User } from '../types';
import { Category } from '../types/category';
import { SparklesIcon, TrendingUpIcon, PieChartIcon, DownloadIcon, WalletIcon, ChevronDownIcon, ReportsIcon } from './icons';
import ReportExportModal from './ReportExportModal';
import { useTheme } from './ThemeContext';
import { formatCurrency } from '../utils/formatters';
import SpendingTrendsWidget from './SpendingTrendsWidget';
import BudgetForecastingWidget from './BudgetForecastingWidget';
import SavingsRateWidget from './SavingsRateWidget';
import CategoryComparisonWidget from './CategoryComparisonWidget';
import FinancialHealthWidget from './FinancialHealthWidget';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend
} from 'recharts';

interface AnalyticsDashboardProps {
  transactions: Transaction[];
  budgets: Budget[];
  user: User;
  categories: Category[];
}

type TabId = 'overview' | 'trends' | 'forecasting' | 'net worth';

const fmtAxis = (v: number) => {
  if (Math.abs(v) >= 1000000) return `${(v / 1000000).toFixed(1)}M`;
  if (Math.abs(v) >= 1000) return `${(v / 1000).toFixed(0)}k`;
  return `${v}`;
};

// ─── Injected CSS ─────────────────────────────────────────────────────────────
const AD_CSS = `
  @keyframes ad-fade-up {
    from { opacity: 0; transform: translateY(14px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  .ad-fade-up { animation: ad-fade-up 0.3s cubic-bezier(0.4,0,0.2,1) both; }

  .ad-glass {
    background: rgba(var(--color-card-muted-rgb), 0.55);
    border: 1px solid rgba(255,255,255,0.07);
    backdrop-filter: blur(18px);
    -webkit-backdrop-filter: blur(18px);
    box-shadow: 0 2px 16px rgba(0,0,0,0.06);
    border-radius: 20px;
  }

  .ad-kpi {
    background: rgba(var(--color-card-muted-rgb), 0.5);
    border: 1px solid rgba(var(--color-border-rgb), 0.3);
    border-radius: 18px;
    padding: 16px 18px;
    display: flex;
    flex-direction: column;
    gap: 4px;
    transition: box-shadow 0.2s;
  }
  .ad-kpi:hover { box-shadow: 0 4px 20px rgba(0,0,0,0.1); }

  .ad-tab-active {
    background: rgb(var(--color-primary-rgb));
    color: white;
    box-shadow: 0 4px 14px rgba(var(--color-primary-rgb), 0.35);
  }
  .ad-tab-inactive {
    color: rgb(var(--color-text-muted-rgb));
    background: transparent;
  }
  .ad-tab-inactive:hover {
    background: rgba(var(--color-card-muted-rgb), 0.9);
    color: rgb(var(--color-text-rgb));
  }

  .ad-chart-card {
    background: rgba(var(--color-card-muted-rgb), 0.5);
    border: 1px solid rgba(var(--color-border-rgb), 0.3);
    border-radius: 20px;
    padding: 20px 20px 16px;
    overflow: hidden;
  }

  .ad-chip {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    padding: 3px 10px;
    border-radius: 999px;
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.02em;
  }
  .ad-chip-up   { background: rgba(34,197,94,0.12);  color: #22c55e; }
  .ad-chip-down { background: rgba(239,68,68,0.12);  color: #ef4444; }
  .ad-chip-neu  { background: rgba(128,128,128,0.1); color: rgb(var(--color-text-muted-rgb)); }
`;

let adCssInjected = false;
const injectADCSS = () => {
  if (adCssInjected || typeof document === 'undefined') return;
  const el = document.createElement('style');
  el.id = 'ad-dashboard-css';
  el.textContent = AD_CSS;
  document.head.appendChild(el);
  adCssInjected = true;
};

// ─── KPI Card ─────────────────────────────────────────────────────────────────
interface KpiCardProps {
  label: string;
  value: string;
  sub?: string;
  change?: number | null;
  positiveIsUp?: boolean;
  accent?: string;
  icon?: React.ReactNode;
}
const KpiCard: React.FC<KpiCardProps> = ({ label, value, sub, change, positiveIsUp = true, accent, icon }) => {
  const up = change != null && change > 0;
  const down = change != null && change < 0;
  const good = positiveIsUp ? up : down;
  const bad  = positiveIsUp ? down : up;
  const chipClass = good ? 'ad-chip-up' : bad ? 'ad-chip-down' : 'ad-chip-neu';
  const chipArrow = good ? '↑' : bad ? '↓' : '–';

  return (
    <div className="ad-kpi">
      <div className="flex items-center justify-between mb-1">
        <span className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: 'rgb(var(--color-text-muted-rgb))' }}>{label}</span>
        {icon && <span style={{ color: accent || 'rgb(var(--color-primary-rgb))' }}>{icon}</span>}
      </div>
      <span className="text-2xl font-bold tracking-tight" style={{ color: accent || 'rgb(var(--color-text-rgb))' }}>{value}</span>
      {sub && <span className="text-xs" style={{ color: 'rgb(var(--color-text-muted-rgb))' }}>{sub}</span>}
      {change != null && (
        <span className={`ad-chip ${chipClass} mt-1 self-start`}>
          {chipArrow} {Math.abs(change).toFixed(1)}% vs last month
        </span>
      )}
    </div>
  );
};

// ─── Empty State ──────────────────────────────────────────────────────────────
const EmptyState: React.FC<{ label?: string }> = ({ label = 'No data yet' }) => (
  <div className="flex flex-col items-center justify-center py-20 gap-3" style={{ color: 'rgb(var(--color-text-muted-rgb))' }}>
    <svg className="w-12 h-12 opacity-30" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 3v18h18" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M7 16l4-4 4 4 4-6" />
    </svg>
    <p className="text-sm font-semibold">{label}</p>
    <p className="text-xs opacity-70">Add some transactions to see insights here.</p>
  </div>
);

// ─── Section Title ────────────────────────────────────────────────────────────
const SectionTitle: React.FC<{ children: React.ReactNode; sub?: string }> = ({ children, sub }) => (
  <div className="mb-3">
    <h2 className="text-base font-bold" style={{ color: 'rgb(var(--color-text-rgb))' }}>{children}</h2>
    {sub && <p className="text-xs mt-0.5" style={{ color: 'rgb(var(--color-text-muted-rgb))' }}>{sub}</p>}
  </div>
);

// ─── Main ─────────────────────────────────────────────────────────────────────
const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({
  transactions, budgets, user, categories,
}) => {
  injectADCSS();
  const { theme } = useTheme();
  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [key, setKey] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => setKey(k => k + 1), 100);
    return () => clearTimeout(timer);
  }, []);

  const isDark = !theme.includes('light') && !theme.includes('sunset');
  const chartText  = isDark ? '#9ca3af' : '#6b7280';
  const gridColor  = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)';
  const incomeColor  = isDark ? '#4ade80' : '#16a34a';
  const expenseColor = isDark ? '#f87171' : '#dc2626';
  const netColor     = isDark ? '#60a5fa' : '#2563eb';

  const tooltipStyle = {
    background: isDark ? '#1c1b19' : '#fff',
    border: '1px solid rgba(128,128,128,0.18)',
    borderRadius: 10,
    fontSize: 12,
    color: isDark ? '#cdccca' : '#28251d',
    boxShadow: '0 4px 20px rgba(0,0,0,0.12)',
  };

  // ── Stats ──
  const stats = useMemo(() => {
    const now = new Date();
    const tm = now.getMonth(), ty = now.getFullYear();
    const lm = tm === 0 ? 11 : tm - 1, ly = tm === 0 ? ty - 1 : ty;
    const isThis  = (t: Transaction) => { const d = new Date(t.date); return d.getMonth()===tm && d.getFullYear()===ty; };
    const isLast  = (t: Transaction) => { const d = new Date(t.date); return d.getMonth()===lm && d.getFullYear()===ly; };
    const sum = (txs: Transaction[], type: 'income'|'expense') => txs.filter(t=>t.type===type).reduce((a,t)=>a+t.amount,0);
    const th = transactions.filter(isThis), la = transactions.filter(isLast);
    const tI = sum(th,'income'), tE = sum(th,'expense'), lI = sum(la,'income'), lE = sum(la,'expense');
    const sr = tI > 0 ? ((tI-tE)/tI)*100 : 0;
    const catTotals: Record<string,number> = {};
    th.filter(t=>t.type==='expense').forEach(t => { catTotals[t.category||'?'] = (catTotals[t.category||'?']||0)+t.amount; });
    const topId = Object.entries(catTotals).sort((a,b)=>b[1]-a[1])[0]?.[0];
    const topCat = categories.find(c=>c.id===topId||c.name===topId)?.name || topId || 'None';
    const pct = (c:number,p:number) => p===0 ? null : ((c-p)/p)*100;
    return { tI, tE, lI, lE, sr, topCat, netThis: tI-tE, expChange: pct(tE,lE), incChange: pct(tI,lI) };
  }, [transactions, categories]);

  // ── MoM chart ──
  const momData = useMemo(() => {
    const now = new Date();
    return Array.from({length:6},(_,i)=>{
      const d = new Date(now.getFullYear(), now.getMonth()-(5-i), 1);
      const m=d.getMonth(), y=d.getFullYear();
      const txs = transactions.filter(t=>{ const td=new Date(t.date); return td.getMonth()===m&&td.getFullYear()===y; });
      return {
        label: d.toLocaleString('default',{month:'short'}),
        income:  txs.filter(t=>t.type==='income').reduce((a,t)=>a+t.amount,0),
        expense: txs.filter(t=>t.type==='expense').reduce((a,t)=>a+t.amount,0),
      };
    });
  }, [transactions]);

  // ── Net worth ──
  const netWorthData = useMemo(() => {
    if (!transactions.length) return [];
    const byMonth: Record<string,number> = {};
    [...transactions].sort((a,b)=>new Date(a.date).getTime()-new Date(b.date).getTime()).forEach(t=>{
      const d = new Date(t.date);
      const k = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
      byMonth[k] = (byMonth[k]||0) + (t.type==='income' ? t.amount : -t.amount);
    });
    let cum = 0;
    return Object.entries(byMonth).sort().map(([k,v])=>{
      cum += v;
      const [yr,mo] = k.split('-');
      return { label: new Date(+yr,+mo-1).toLocaleString('default',{month:'short',year:'2-digit'}), netWorth: cum };
    });
  }, [transactions]);

  const hasData = transactions.length > 0;

  // ── Tabs ──
  const TABS: { id: TabId; label: string; icon: React.ReactNode }[] = [
    { id: 'overview',    label: 'Overview',    icon: <ReportsIcon className="w-4 h-4" /> },
    { id: 'trends',      label: 'Trends',      icon: <TrendingUpIcon className="w-4 h-4" /> },
    { id: 'forecasting', label: 'Forecast',    icon: <SparklesIcon className="w-4 h-4" /> },
    { id: 'net worth',   label: 'Net Worth',   icon: <WalletIcon className="w-4 h-4" /> },
  ];
  const activeMeta = TABS.find(t=>t.id===activeTab)!;

  return (
    <div className="flex flex-col gap-5 pb-20 md:pb-6 w-full ad-fade-up">

      {/* ── Top Bar ── */}
      <div className="flex items-center gap-2">

        {/* Mobile dropdown */}
        <div className="relative flex-1 sm:hidden">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'rgb(var(--color-primary-rgb))' }}>
            {activeMeta.icon}
          </span>
          <select
            value={activeTab}
            onChange={e => setActiveTab(e.target.value as TabId)}
            className="w-full appearance-none pl-9 pr-9 py-2.5 rounded-2xl text-sm font-semibold outline-none cursor-pointer"
            style={{
              background: 'rgb(var(--color-card-muted-rgb))',
              color: 'rgb(var(--color-primary-rgb))',
              border: '1.5px solid rgba(var(--color-primary-rgb), 0.35)',
            }}
          >
            {TABS.map(t => (
              <option key={t.id} value={t.id} style={{ background: 'rgb(var(--color-card-rgb))', color: 'rgb(var(--color-text-rgb))' }}>
                {t.label}
              </option>
            ))}
          </select>
          <ChevronDownIcon className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: 'rgb(var(--color-primary-rgb))' }} />
        </div>

        {/* Desktop pill tabs */}
        <div className="hidden sm:flex flex-1 p-1 rounded-2xl gap-1" style={{ background: 'rgba(var(--color-card-muted-rgb), 0.7)' }}>
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${
                activeTab === t.id ? 'ad-tab-active' : 'ad-tab-inactive'
              }`}
            >
              {t.icon}
              <span>{t.label}</span>
            </button>
          ))}
        </div>

        {/* Export */}
        <button
          onClick={() => setIsExportModalOpen(true)}
          className="shrink-0 flex items-center gap-2 px-3 py-2.5 rounded-2xl text-sm font-medium transition-all"
          style={{
            background: 'rgba(var(--color-card-muted-rgb), 0.7)',
            color: 'rgb(var(--color-text-muted-rgb))',
            border: '1px solid rgba(var(--color-border-rgb), 0.35)',
          }}
          aria-label="Export Report"
        >
          <DownloadIcon className="h-4 w-4" />
          <span className="hidden sm:inline text-xs">Export</span>
        </button>
      </div>

      {/* ══ OVERVIEW ══════════════════════════════════════════════════════════ */}
      {activeTab === 'overview' && (
        <div className="flex flex-col gap-5 ad-fade-up">

          {/* KPI row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <KpiCard
              label="Income"
              value={formatCurrency(stats.tI, user.currency)}
              sub="This month"
              change={stats.incChange}
              positiveIsUp
              accent={incomeColor}
              icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>}
            />
            <KpiCard
              label="Spending"
              value={formatCurrency(stats.tE, user.currency)}
              sub="This month"
              change={stats.expChange}
              positiveIsUp={false}
              accent={expenseColor}
              icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><polyline points="23 18 13.5 8.5 8.5 13.5 1 6"/><polyline points="17 18 23 18 23 12"/></svg>}
            />
            <KpiCard
              label="Net Saved"
              value={formatCurrency(stats.netThis, user.currency)}
              sub="Income − Spending"
              accent={stats.netThis >= 0 ? incomeColor : expenseColor}
              icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path d="M12 2a10 10 0 100 20A10 10 0 0012 2z"/><path d="M12 6v6l4 2"/></svg>}
            />
            <KpiCard
              label="Savings Rate"
              value={`${stats.sr.toFixed(1)}%`}
              sub={stats.topCat !== 'None' ? `Top spend: ${stats.topCat}` : 'No spending yet'}
              accent={stats.sr >= 20 ? incomeColor : stats.sr > 0 ? '#f59e0b' : expenseColor}
            />
          </div>

          {/* Health + Savings Rate widgets */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2">
              <FinancialHealthWidget transactions={transactions} budgets={budgets} user={user} />
            </div>
            <div>
              <SavingsRateWidget transactions={transactions} />
            </div>
          </div>
        </div>
      )}

      {/* ══ TRENDS ════════════════════════════════════════════════════════════ */}
      {activeTab === 'trends' && (
        <div className="flex flex-col gap-5 ad-fade-up">
          {!hasData ? <EmptyState label="No transactions yet" /> : (
            <>
              {/* Income vs Spending bar chart */}
              <div className="ad-chart-card">
                <SectionTitle sub="Last 6 months">Income vs Spending</SectionTitle>
                <div style={{ height: 260 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={momData} margin={{ top: 4, right: 8, left: 0, bottom: 4 }} barCategoryGap="25%" barGap={3}>
                      <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
                      <XAxis dataKey="label" tick={{ fontSize: 11, fill: chartText }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 11, fill: chartText }} axisLine={false} tickLine={false} tickFormatter={fmtAxis} width={44} />
                      <Tooltip wrapperStyle={{ zIndex: 9999 }} contentStyle={tooltipStyle} formatter={(v: number, name: string) => [formatCurrency(v, user.currency), name]} />
                      <Legend wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
                      <Bar dataKey="income"  name="Income"   fill={incomeColor}  radius={[5,5,0,0]} maxBarSize={40} />
                      <Bar dataKey="expense" name="Spending" fill={expenseColor} radius={[5,5,0,0]} maxBarSize={40} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Category widgets */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <SpendingTrendsWidget transactions={transactions} period="month" />
                <div className="h-[360px]">
                  <CategoryComparisonWidget transactions={transactions} />
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* ══ FORECASTING ═══════════════════════════════════════════════════════ */}
      {activeTab === 'forecasting' && (
        <div key={key} className="ad-fade-up">
          <BudgetForecastingWidget transactions={transactions} budgets={budgets} />
        </div>
      )}

      {/* ══ NET WORTH ═════════════════════════════════════════════════════════ */}
      {activeTab === 'net worth' && (
        <div className="flex flex-col gap-5 ad-fade-up">
          {netWorthData.length < 2 ? <EmptyState label="Not enough data for net worth trend" /> : (
            <>
              {/* Summary chips */}
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: 'Starting',    value: netWorthData[0]?.netWorth ?? 0 },
                  { label: 'Current',     value: netWorthData[netWorthData.length-1]?.netWorth ?? 0 },
                  { label: 'Total Growth',value: (netWorthData[netWorthData.length-1]?.netWorth??0)-(netWorthData[0]?.netWorth??0) },
                ].map(({label,value}) => (
                  <div key={label} className="ad-kpi">
                    <span className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: 'rgb(var(--color-text-muted-rgb))' }}>{label}</span>
                    <span className="text-xl font-bold" style={{ color: value>=0 ? incomeColor : expenseColor }}>{formatCurrency(value, user.currency)}</span>
                  </div>
                ))}
              </div>

              {/* Area chart */}
              <div className="ad-chart-card">
                <SectionTitle sub="Cumulative income minus spending">Net Worth Over Time</SectionTitle>
                <div style={{ height: 280 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={netWorthData} margin={{ top: 4, right: 8, left: 0, bottom: 4 }}>
                      <defs>
                        <linearGradient id="nwGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%"  stopColor={netColor} stopOpacity={0.28} />
                          <stop offset="95%" stopColor={netColor} stopOpacity={0.01} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
                      <XAxis dataKey="label" tick={{ fontSize: 11, fill: chartText }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 11, fill: chartText }} axisLine={false} tickLine={false} tickFormatter={fmtAxis} width={48} />
                      <Tooltip
                        wrapperStyle={{ zIndex: 9999 }}
                        contentStyle={tooltipStyle}
                        formatter={(v: number) => [formatCurrency(v, user.currency), 'Net Worth']}
                      />
                      <Area
                        type="monotone"
                        dataKey="netWorth"
                        stroke={netColor}
                        strokeWidth={2.5}
                        fill="url(#nwGrad)"
                        dot={false}
                        activeDot={{ r: 5, fill: netColor }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {isExportModalOpen && (
        <ReportExportModal
          isOpen={isExportModalOpen}
          onClose={() => setIsExportModalOpen(false)}
          transactions={transactions}
          budgets={budgets}
          user={user}
          categories={categories}
        />
      )}
    </div>
  );
};

export default AnalyticsDashboard;
