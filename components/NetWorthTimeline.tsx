import React, { useMemo, useState } from 'react';
import { Transaction, FinancialAccount, ACCOUNT_TYPE_META } from '../types';

interface NetWorthTimelineProps {
  accounts: FinancialAccount[];
  transactions: Transaction[];
  currencySymbol: string;
}

type Range = '1M' | '3M' | '6M' | '1Y' | 'ALL';

const RANGE_DAYS: Record<Range, number> = {
  '1M': 30,
  '3M': 90,
  '6M': 180,
  '1Y': 365,
  'ALL': 9999,
};

const fmt = (v: number, sym: string) =>
  `${sym}${Math.abs(v).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

const NetWorthTimeline: React.FC<NetWorthTimelineProps> = ({ accounts, transactions, currencySymbol }) => {
  const [range, setRange] = useState<Range>('3M');

  // Build daily net worth snapshots by replaying transactions backwards from current balances
  const { dataPoints, minVal, maxVal, hasData } = useMemo(() => {
    const activeAccounts = accounts.filter(a => !a.isArchived && a.includeInNetWorth !== false);
    if (activeAccounts.length === 0 || transactions.length === 0) {
      return { dataPoints: [], minVal: 0, maxVal: 0, hasData: false };
    }

    const days = RANGE_DAYS[range];
    const now = new Date();
    const cutoff = new Date(now);
    cutoff.setDate(cutoff.getDate() - days);

    // Current net worth as starting point
    const currentNetWorth = activeAccounts.reduce((sum, a) => {
      return sum + (a.type === 'credit_card' ? -a.balance : a.balance);
    }, 0);

    // Sort transactions newest first
    const sorted = [...transactions]
      .filter(t => t.accountId && activeAccounts.some(a => a.id === t.accountId))
      .sort((a, b) => b.date.localeCompare(a.date));

    // Generate daily data points from today back to cutoff
    const points: { date: string; value: number; label: string }[] = [];
    let runningNW = currentNetWorth;
    let txIdx = 0;

    // Build map: date -> running net worth AFTER reverting that day's transactions
    const dateMap = new Map<string, number>();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Walk backwards day by day
    for (let d = 0; d <= Math.min(days, 365); d++) {
      const cur = new Date(today);
      cur.setDate(today.getDate() - d);
      const dateStr = cur.toISOString().split('T')[0];
      dateMap.set(dateStr, runningNW);

      // Revert transactions that happened on this day
      while (txIdx < sorted.length && sorted[txIdx].date.split('T')[0] === dateStr) {
        const tx = sorted[txIdx];
        const acc = activeAccounts.find(a => a.id === tx.accountId);
        if (acc) {
          const sign = acc.type === 'credit_card' ? -1 : 1;
          if (tx.type === 'income') runningNW -= sign * tx.amount;
          else runningNW += sign * tx.amount;
        }
        txIdx++;
      }
    }

    // Convert to sorted points within range, with a maximum of 60 points for performance
    const allDates = Array.from(dateMap.keys()).sort();
    const filteredDates = allDates.filter(d => d >= cutoff.toISOString().split('T')[0]);

    // Downsample to max 60 points
    const step = Math.max(1, Math.floor(filteredDates.length / 60));
    const sampled = filteredDates.filter((_, i) => i % step === 0 || i === filteredDates.length - 1);

    const pts = sampled.map(dateStr => {
      const d = new Date(dateStr);
      const label = d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
      return { date: dateStr, value: dateMap.get(dateStr) ?? currentNetWorth, label };
    });

    if (pts.length < 2) return { dataPoints: [], minVal: 0, maxVal: 0, hasData: false };

    const vals = pts.map(p => p.value);
    const mn = Math.min(...vals);
    const mx = Math.max(...vals);
    const pad = Math.max((mx - mn) * 0.15, Math.abs(mx) * 0.05, 100);

    return { dataPoints: pts, minVal: mn - pad, maxVal: mx + pad, hasData: true };
  }, [accounts, transactions, range]);

  if (!hasData) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <svg className="w-12 h-12 mb-3 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
        </svg>
        <p className="font-medium text-[rgb(var(--color-text-muted-rgb))]">Not enough data yet</p>
        <p className="text-sm text-[rgb(var(--color-text-muted-rgb))]/60 mt-1 max-w-[260px]">
          Add transactions linked to your accounts to see your net worth history.
        </p>
      </div>
    );
  }

  // SVG chart dimensions
  const W = 600;
  const H = 200;
  const PAD = { top: 16, right: 16, bottom: 32, left: 56 };
  const chartW = W - PAD.left - PAD.right;
  const chartH = H - PAD.top - PAD.bottom;

  const toX = (i: number) => PAD.left + (i / (dataPoints.length - 1)) * chartW;
  const toY = (v: number) => PAD.top + chartH - ((v - minVal) / (maxVal - minVal)) * chartH;

  // Build path
  const linePath = dataPoints
    .map((p, i) => `${i === 0 ? 'M' : 'L'}${toX(i).toFixed(1)},${toY(p.value).toFixed(1)}`)
    .join(' ');
  const areaPath = `${linePath} L${toX(dataPoints.length - 1).toFixed(1)},${(PAD.top + chartH).toFixed(1)} L${PAD.left},${(PAD.top + chartH).toFixed(1)} Z`;

  const first = dataPoints[0].value;
  const last  = dataPoints[dataPoints.length - 1].value;
  const change = last - first;
  const changePct = first !== 0 ? (change / Math.abs(first)) * 100 : 0;
  const isPositive = change >= 0;
  const accentColor = isPositive ? '#22c55e' : '#ef4444';

  // Y-axis labels: 4 evenly spaced
  const yLabels = [0, 1, 2, 3].map(i => {
    const v = minVal + (i / 3) * (maxVal - minVal);
    const y = toY(v);
    return { v, y };
  });

  // X-axis labels: first, middle, last
  const xLabels = [
    { label: dataPoints[0].label, x: toX(0) },
    { label: dataPoints[Math.floor(dataPoints.length / 2)].label, x: toX(Math.floor(dataPoints.length / 2)) },
    { label: dataPoints[dataPoints.length - 1].label, x: toX(dataPoints.length - 1) },
  ];

  return (
    <div className="space-y-4">
      {/* Header stats row */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <p className="text-2xl font-bold tabular-nums text-[rgb(var(--color-text-rgb))]">
            {fmt(last, currencySymbol)}
          </p>
          <p className={`text-sm font-semibold flex items-center gap-1 mt-0.5 ${
            isPositive ? 'text-green-500' : 'text-red-500'
          }`}>
            <span>{isPositive ? '▲' : '▼'}</span>
            <span className="tabular-nums">{fmt(Math.abs(change), currencySymbol)}</span>
            <span className="font-normal text-[rgb(var(--color-text-muted-rgb))]">
              ({changePct >= 0 ? '+' : ''}{changePct.toFixed(1)}%) in period
            </span>
          </p>
        </div>

        {/* Range selector */}
        <div className="flex items-center gap-1 bg-[rgb(var(--color-bg-rgb))] rounded-xl p-1">
          {(['1M', '3M', '6M', '1Y', 'ALL'] as Range[]).map(r => (
            <button
              key={r}
              type="button"
              onClick={() => setRange(r)}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                range === r
                  ? 'bg-[rgb(var(--color-primary-rgb))] text-white shadow-sm'
                  : 'text-[rgb(var(--color-text-muted-rgb))] hover:text-[rgb(var(--color-text-rgb))]'
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* SVG Chart */}
      <div className="w-full overflow-hidden rounded-xl">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="w-full"
          style={{ height: '200px' }}
          aria-label="Net worth timeline chart"
        >
          <defs>
            <linearGradient id="nw-area-grad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%"  stopColor={accentColor} stopOpacity="0.22" />
              <stop offset="100%" stopColor={accentColor} stopOpacity="0.01" />
            </linearGradient>
            <filter id="nw-line-glow">
              <feGaussianBlur in="SourceGraphic" stdDeviation="2" result="blur" />
              <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
            </filter>
          </defs>

          {/* Grid lines */}
          {yLabels.map(({ y }, i) => (
            <line
              key={i}
              x1={PAD.left} y1={y.toFixed(1)}
              x2={W - PAD.right} y2={y.toFixed(1)}
              stroke="currentColor"
              strokeOpacity="0.07"
              strokeDasharray="4 4"
              className="text-[rgb(var(--color-text-rgb))]"
            />
          ))}

          {/* Y-axis labels */}
          {yLabels.map(({ v, y }, i) => (
            <text
              key={i}
              x={PAD.left - 6}
              y={y}
              textAnchor="end"
              dominantBaseline="middle"
              fontSize="10"
              fill="rgb(var(--color-text-muted-rgb))"
              opacity="0.65"
            >
              {fmt(v, currencySymbol)}
            </text>
          ))}

          {/* X-axis labels */}
          {xLabels.map(({ label, x }, i) => (
            <text
              key={i}
              x={x}
              y={H - PAD.bottom + 16}
              textAnchor={i === 0 ? 'start' : i === xLabels.length - 1 ? 'end' : 'middle'}
              fontSize="10"
              fill="rgb(var(--color-text-muted-rgb))"
              opacity="0.65"
            >
              {label}
            </text>
          ))}

          {/* Zero line if visible */}
          {minVal < 0 && maxVal > 0 && (
            <line
              x1={PAD.left} y1={toY(0).toFixed(1)}
              x2={W - PAD.right} y2={toY(0).toFixed(1)}
              stroke="currentColor"
              strokeOpacity="0.18"
              strokeWidth="1"
              className="text-[rgb(var(--color-text-muted-rgb))]"
            />
          )}

          {/* Area fill */}
          <path d={areaPath} fill="url(#nw-area-grad)" />

          {/* Main line */}
          <path
            d={linePath}
            fill="none"
            stroke={accentColor}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            filter="url(#nw-line-glow)"
          />

          {/* End dot */}
          <circle
            cx={toX(dataPoints.length - 1).toFixed(1)}
            cy={toY(last).toFixed(1)}
            r="4"
            fill={accentColor}
            stroke="rgb(var(--color-card-rgb))"
            strokeWidth="2"
          />
        </svg>
      </div>

      {/* Per-account breakdown */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {accounts
          .filter(a => !a.isArchived && a.includeInNetWorth !== false)
          .map(acc => {
            const meta = ACCOUNT_TYPE_META[acc.type];
            const displayBal = acc.type === 'credit_card' ? -acc.balance : acc.balance;
            return (
              <div
                key={acc.id}
                className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[rgb(var(--color-bg-rgb))]"
              >
                <div
                  className="w-6 h-6 rounded-lg flex items-center justify-center text-xs flex-shrink-0"
                  style={{ background: `${meta.color}20` }}
                >
                  {meta.emoji}
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] text-[rgb(var(--color-text-muted-rgb))] truncate leading-tight">{acc.name}</p>
                  <p
                    className="text-xs font-bold tabular-nums leading-tight"
                    style={{ color: displayBal >= 0 ? meta.color : '#ef4444' }}
                  >
                    {displayBal < 0 ? '-' : ''}{fmt(Math.abs(displayBal), currencySymbol)}
                  </p>
                </div>
              </div>
            );
          })}
      </div>
    </div>
  );
};

export default NetWorthTimeline;
