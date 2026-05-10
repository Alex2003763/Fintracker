import React, { useMemo, useState, useRef, useCallback, useEffect } from 'react';
import { Transaction, FinancialAccount, ACCOUNT_TYPE_META } from '../types';

interface NetWorthTimelineProps {
  accounts: FinancialAccount[];
  transactions: Transaction[];
  currencySymbol: string;
}

type Range = '1M' | '3M' | '6M' | '1Y' | 'ALL';
const RANGES: Range[] = ['1M', '3M', '6M', '1Y', 'ALL'];
const RANGE_DAYS: Record<Range, number> = {
  '1M': 30, '3M': 90, '6M': 180, '1Y': 365, 'ALL': 9999,
};

const fmt = (v: number, sym: string) =>
  `${sym}${Math.abs(v).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

const fmtSigned = (v: number, sym: string) =>
  `${v >= 0 ? '+' : '-'}${sym}${Math.abs(v).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

const NWT_CSS = `
  @keyframes nwt-fadein { from { opacity:0; transform:translateY(6px); } to { opacity:1; transform:translateY(0); } }
  @keyframes nwt-linedraw {
    from { stroke-dashoffset: var(--nwt-dash-len, 2000); }
    to   { stroke-dashoffset: 0; }
  }
  .nwt-animate { animation: nwt-fadein 0.38s cubic-bezier(0.4,0,0.2,1) both; }
  .nwt-line-anim {
    stroke-dasharray: var(--nwt-dash-len, 2000);
    stroke-dashoffset: 0;
    animation: nwt-linedraw 1s cubic-bezier(0.4,0,0.2,1) both;
  }

  /* ── Container card ── */
  .nwt-container {
    background: rgba(var(--color-card-rgb), 0.72);
    border: 1px solid rgba(var(--color-border-rgb), 0.35);
    border-radius: 20px;
    padding: 20px;
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    box-shadow:
      inset 0 1px 0 rgba(255,255,255,0.07),
      0 4px 24px rgba(0,0,0,0.10),
      0 1px 4px rgba(0,0,0,0.06);
  }
  @media (max-width: 639px) {
    .nwt-container {
      padding: 16px 14px;
      border-radius: 18px;
    }
  }

  /* ── Range pill selector ── */
  .nwt-range-row {
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 3px;
    border-radius: 12px;
    background: rgba(var(--color-card-muted-rgb), 0.55);
    border: 1px solid rgba(var(--color-border-rgb), 0.28);
  }
  .nwt-range-btn {
    padding: 5px 11px;
    border-radius: 9px;
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.02em;
    border: none;
    cursor: pointer;
    transition: all 0.17s ease;
    touch-action: manipulation;
    -webkit-tap-highlight-color: transparent;
    min-width: 36px;
  }
  @media (max-width: 380px) {
    .nwt-range-btn { padding: 5px 8px; font-size: 10px; min-width: 28px; }
  }
  .nwt-range-btn:not(.active) {
    background: transparent;
    color: rgb(var(--color-text-muted-rgb));
  }
  .nwt-range-btn:not(.active):hover {
    color: rgb(var(--color-text-rgb));
    background: rgba(var(--color-text-muted-rgb),0.08);
  }
  .nwt-range-btn.active {
    background: rgb(var(--color-card-rgb));
    color: rgb(var(--color-text-rgb));
    box-shadow: 0 1px 4px rgba(0,0,0,0.18), 0 0 0 1px rgba(var(--color-border-rgb),0.5);
  }
  .nwt-range-btn:active { transform: scale(0.92); }

  /* ── Account cards ── */
  .nwt-acc-card {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px 12px;
    border-radius: 14px;
    background: rgba(var(--color-card-muted-rgb),0.35);
    border: 1px solid rgba(var(--color-border-rgb),0.22);
    transition: background 0.15s ease, transform 0.15s ease;
  }
  .nwt-acc-card:hover {
    background: rgba(var(--color-card-muted-rgb),0.55);
    transform: translateY(-1px);
  }

  /* ── Tooltip ── */
  .nwt-tooltip {
    pointer-events: none;
    position: absolute;
    transform: translateX(-50%);
    bottom: calc(100% + 10px);
    background: rgb(var(--color-card-rgb));
    border: 1px solid rgba(var(--color-border-rgb),0.5);
    border-radius: 10px;
    padding: 7px 11px;
    white-space: nowrap;
    box-shadow: 0 8px 24px rgba(0,0,0,0.25);
    animation: nwt-fadein 0.12s ease both;
    z-index: 10;
  }
  /* Keep tooltip inside container on small screens */
  @media (max-width: 400px) {
    .nwt-tooltip {
      transform: translateX(calc(-50% + 0px));
      max-width: 110px;
      white-space: normal;
      text-align: center;
    }
  }

  /* ── Chart area ── */
  .nwt-chart-area {
    position: relative;
    border-radius: 12px;
    overflow: visible;
    cursor: crosshair;
    touch-action: pan-y;
  }
  @media (max-width: 639px) {
    .nwt-chart-area { cursor: default; touch-action: none; }
  }

  /* ── Divider ── */
  .nwt-divider {
    height: 1px;
    background: rgba(var(--color-border-rgb), 0.25);
    margin: 16px 0;
  }
  @media (max-width: 639px) { .nwt-divider { margin: 12px 0; } }

  /* ── Stats row responsive ── */
  .nwt-stats-row {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 12px;
    flex-wrap: wrap;
  }
  @media (max-width: 400px) {
    .nwt-stats-row { gap: 8px; }
    .nwt-stats-row .nwt-range-row { width: 100%; justify-content: space-between; }
  }
`;

let nwtCssInjected = false;
const injectNwtCSS = () => {
  if (nwtCssInjected || typeof document === 'undefined') return;
  const el = document.createElement('style');
  el.id = 'nwt-css';
  el.textContent = NWT_CSS;
  document.head.appendChild(el);
  nwtCssInjected = true;
};

const NetWorthTimeline: React.FC<NetWorthTimelineProps> = ({ accounts, transactions, currencySymbol }) => {
  injectNwtCSS();
  const [range, setRange] = useState<Range>('3M');
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Responsive chart height
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 640);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  // Swipe to change range on mobile
  const touchStartX = useRef<number | null>(null);
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(dx) < 40) return;
    const idx = RANGES.indexOf(range);
    if (dx < 0 && idx < RANGES.length - 1) setRange(RANGES[idx + 1]);
    if (dx > 0 && idx > 0) setRange(RANGES[idx - 1]);
    touchStartX.current = null;
    setHoverIdx(null);
  };

  const { dataPoints, minVal, maxVal, hasData } = useMemo(() => {
    const activeAccounts = accounts.filter(a => !a.isArchived && a.includeInNetWorth !== false);
    if (activeAccounts.length === 0 || transactions.length === 0)
      return { dataPoints: [], minVal: 0, maxVal: 0, hasData: false };

    const days = RANGE_DAYS[range];
    const now = new Date();
    const cutoff = new Date(now);
    cutoff.setDate(cutoff.getDate() - days);

    const currentNetWorth = activeAccounts.reduce((sum, a) =>
      sum + (a.type === 'credit_card' ? -a.balance : a.balance), 0);

    const sorted = [...transactions]
      .filter(t => t.accountId && activeAccounts.some(a => a.id === t.accountId))
      .sort((a, b) => b.date.localeCompare(a.date));

    const dateMap = new Map<string, number>();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    let runningNW = currentNetWorth;
    let txIdx = 0;

    for (let d = 0; d <= Math.min(days, 365); d++) {
      const cur = new Date(today);
      cur.setDate(today.getDate() - d);
      const dateStr = cur.toISOString().split('T')[0];
      dateMap.set(dateStr, runningNW);
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

    const allDates = Array.from(dateMap.keys()).sort();
    const filteredDates = allDates.filter(d => d >= cutoff.toISOString().split('T')[0]);
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
    const pad = Math.max((mx - mn) * 0.2, Math.abs(mx) * 0.06, 100);
    return { dataPoints: pts, minVal: mn - pad, maxVal: mx + pad, hasData: true };
  }, [accounts, transactions, range]);

  // SVG dimensions — shorter on mobile
  const W = 600;
  const H = isMobile ? 180 : 220;
  const PAD = { top: 16, right: 16, bottom: isMobile ? 28 : 36, left: isMobile ? 50 : 60 };
  const chartW = W - PAD.left - PAD.right;
  const chartH = H - PAD.top - PAD.bottom;

  const toX = useCallback((i: number) =>
    PAD.left + (i / Math.max(dataPoints.length - 1, 1)) * chartW,
    [dataPoints.length, chartW, PAD.left]);
  const toY = useCallback((v: number) =>
    PAD.top + chartH - ((v - minVal) / Math.max(maxVal - minVal, 1)) * chartH,
    [minVal, maxVal, chartH, PAD.top]);

  const linePath = useMemo(() =>
    dataPoints.map((p, i) => `${i === 0 ? 'M' : 'L'}${toX(i).toFixed(1)},${toY(p.value).toFixed(1)}`).join(' '),
    [dataPoints, toX, toY]);

  const areaPath = useMemo(() => {
    if (!dataPoints.length) return '';
    const baseY = (PAD.top + chartH).toFixed(1);
    return `${linePath} L${toX(dataPoints.length - 1).toFixed(1)},${baseY} L${PAD.left},${baseY} Z`;
  }, [linePath, dataPoints.length, toX, chartH, PAD.top, PAD.left]);

  // Mouse interaction (desktop)
  const handleMouseMove = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    if (!svgRef.current || !dataPoints.length) return;
    const rect = svgRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width * W;
    const relX = x - PAD.left;
    const idx = Math.round((relX / chartW) * (dataPoints.length - 1));
    setHoverIdx(Math.max(0, Math.min(dataPoints.length - 1, idx)));
  }, [dataPoints.length, chartW, PAD.left]);

  // Touch interaction (mobile — tap/drag on chart)
  const handleTouchMoveChart = useCallback((e: React.TouchEvent<SVGSVGElement>) => {
    if (!svgRef.current || !dataPoints.length) return;
    e.stopPropagation();
    const rect = svgRef.current.getBoundingClientRect();
    const x = (e.touches[0].clientX - rect.left) / rect.width * W;
    const relX = x - PAD.left;
    const idx = Math.round((relX / chartW) * (dataPoints.length - 1));
    setHoverIdx(Math.max(0, Math.min(dataPoints.length - 1, idx)));
  }, [dataPoints.length, chartW, PAD.left]);

  if (!hasData) {
    return (
      <div className="nwt-container nwt-animate">
        <div className="flex flex-col items-center justify-center py-12 text-center gap-3">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center"
            style={{ background: 'rgba(var(--color-primary-rgb),0.08)' }}>
            <svg className="w-7 h-7" style={{ color: 'rgba(var(--color-primary-rgb),0.5)' }}
              fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
            </svg>
          </div>
          <div>
            <p className="font-semibold text-[rgb(var(--color-text-rgb))]">No timeline data yet</p>
            <p className="text-sm mt-1 max-w-[260px]" style={{ color: 'rgb(var(--color-text-muted-rgb))' }}>
              Link transactions to accounts to start tracking your net worth over time.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const first = dataPoints[0].value;
  const last  = dataPoints[dataPoints.length - 1].value;
  const change = last - first;
  const changePct = first !== 0 ? (change / Math.abs(first)) * 100 : 0;
  const isPositive = change >= 0;
  const accentColor = isPositive ? '#22c55e' : '#ef4444';

  const hovered = hoverIdx !== null ? dataPoints[hoverIdx] : null;
  const hoverX  = hoverIdx !== null ? toX(hoverIdx) : null;
  const hoverY  = hovered ? toY(hovered.value) : null;

  // Y-axis: fewer labels on mobile
  const yCount = isMobile ? 3 : 5;
  const yLabels = Array.from({ length: yCount }, (_, i) => {
    const v = minVal + (i / (yCount - 1)) * (maxVal - minVal);
    return { v, y: toY(v) };
  });

  // X-axis labels
  const xCount = isMobile ? 3 : 5;
  const xIdxs = Array.from({ length: xCount }, (_, i) =>
    Math.round(i * (dataPoints.length - 1) / (xCount - 1)));
  const xLabels = [...new Set(xIdxs)].map(i => ({ label: dataPoints[i].label, x: toX(i), i }));

  const activeAccCards = accounts.filter(a => !a.isArchived && a.includeInNetWorth !== false);
  const totalNetWorth = activeAccCards.reduce((s, a) => s + (a.type === 'credit_card' ? -a.balance : a.balance), 0);

  return (
    <div
      ref={containerRef}
      className="nwt-container nwt-animate"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* ── Top stats row ── */}
      <div className="nwt-stats-row">
        <div className="space-y-0.5">
          <p className="text-[11px] font-bold uppercase tracking-widest"
            style={{ color: 'rgb(var(--color-text-muted-rgb))' }}>
            Net Worth
          </p>
          <p className="text-3xl font-bold tabular-nums tracking-tight"
            style={{ color: 'rgb(var(--color-text-rgb))' }}>
            {fmt(last, currencySymbol)}
          </p>
          <div className="flex items-center gap-2 flex-wrap mt-1">
            <span
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold"
              style={{
                background: isPositive ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.12)',
                color: accentColor,
              }}
            >
              <svg width="8" height="8" viewBox="0 0 10 10" fill="currentColor">
                {isPositive
                  ? <path d="M5 1L9 7H1L5 1Z"/>
                  : <path d="M5 9L1 3H9L5 9Z"/>}
              </svg>
              {fmtSigned(change, currencySymbol)}
            </span>
            <span className="text-[11px]" style={{ color: 'rgb(var(--color-text-muted-rgb))' }}>
              {changePct >= 0 ? '+' : ''}{changePct.toFixed(1)}% this period
            </span>
          </div>
        </div>

        {/* Range pill selector */}
        <div className="nwt-range-row">
          {RANGES.map(r => (
            <button
              key={r}
              type="button"
              onClick={() => { setRange(r); setHoverIdx(null); }}
              className={`nwt-range-btn ${range === r ? 'active' : ''}`}
              aria-pressed={range === r}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* ── Swipe hint (mobile only) ── */}
      {isMobile && (
        <p className="text-[10px] text-center mt-2 -mb-1 select-none"
          style={{ color: 'rgba(var(--color-text-muted-rgb),0.4)' }}>
          ← swipe to change range · tap chart to inspect →
        </p>
      )}

      {/* ── Chart ── */}
      <div className="nwt-chart-area mt-3">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${W} ${H}`}
          className="w-full select-none"
          style={{ height: isMobile ? '160px' : '220px', overflow: 'visible' }}
          aria-label="Net worth timeline chart"
          onMouseMove={handleMouseMove}
          onMouseLeave={() => setHoverIdx(null)}
          onTouchMove={handleTouchMoveChart}
          onTouchEnd={() => setTimeout(() => setHoverIdx(null), 1400)}
        >
          <defs>
            <linearGradient id="nwt-area" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%"  stopColor={accentColor} stopOpacity="0.28" />
              <stop offset="75%" stopColor={accentColor} stopOpacity="0.04" />
              <stop offset="100%" stopColor={accentColor} stopOpacity="0" />
            </linearGradient>
            <filter id="nwt-glow" x="-20%" y="-40%" width="140%" height="180%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="2.5" result="blur" />
              <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
            </filter>
            <linearGradient id="nwt-vline" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={accentColor} stopOpacity="0.6" />
              <stop offset="100%" stopColor={accentColor} stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          {yLabels.map(({ y }, i) => (
            <line key={i}
              x1={PAD.left} y1={y.toFixed(1)}
              x2={W - PAD.right} y2={y.toFixed(1)}
              stroke="currentColor"
              strokeOpacity={i === 0 ? 0.12 : 0.055}
              strokeDasharray={i === 0 ? '0' : '3 5'}
              className="text-[rgb(var(--color-text-rgb))]"
            />
          ))}

          {/* Y-axis labels */}
          {yLabels.map(({ v, y }, i) => (
            <text key={i}
              x={PAD.left - 6} y={y}
              textAnchor="end" dominantBaseline="middle"
              fontSize={isMobile ? '8.5' : '9.5'}
              fill="rgb(var(--color-text-muted-rgb))" opacity="0.6"
              fontFamily="ui-monospace, monospace"
            >
              {fmt(v, currencySymbol)}
            </text>
          ))}

          {/* X-axis labels */}
          {xLabels.map(({ label, x, i }, idx) => (
            <text key={i}
              x={x} y={H - 4}
              textAnchor={idx === 0 ? 'start' : idx === xLabels.length - 1 ? 'end' : 'middle'}
              fontSize={isMobile ? '8.5' : '9.5'}
              fill="rgb(var(--color-text-muted-rgb))" opacity="0.55"
            >
              {label}
            </text>
          ))}

          {/* Zero line */}
          {minVal < 0 && maxVal > 0 && (
            <line
              x1={PAD.left} y1={toY(0).toFixed(1)}
              x2={W - PAD.right} y2={toY(0).toFixed(1)}
              stroke="rgb(var(--color-text-muted-rgb))" strokeOpacity="0.25"
              strokeWidth="1" strokeDasharray="2 4"
            />
          )}

          {/* Area fill */}
          <path d={areaPath} fill="url(#nwt-area)" />

          {/* Main line */}
          <path
            d={linePath}
            fill="none" stroke={accentColor}
            strokeWidth={isMobile ? '2' : '2.2'}
            strokeLinecap="round" strokeLinejoin="round"
            filter="url(#nwt-glow)"
            className="nwt-line-anim"
          />

          {/* Hover crosshair */}
          {hoverIdx !== null && hoverX !== null && hoverY !== null && (
            <g>
              <line
                x1={hoverX.toFixed(1)} y1={PAD.top}
                x2={hoverX.toFixed(1)} y2={(PAD.top + chartH).toFixed(1)}
                stroke="url(#nwt-vline)" strokeWidth="1"
              />
              <circle cx={hoverX.toFixed(1)} cy={hoverY.toFixed(1)} r={isMobile ? '9' : '7'}
                fill={accentColor} opacity="0.18" />
              <circle cx={hoverX.toFixed(1)} cy={hoverY.toFixed(1)} r={isMobile ? '5' : '4'}
                fill={accentColor}
                stroke="rgb(var(--color-card-rgb))" strokeWidth="2"
              />
            </g>
          )}

          {/* End dot (when not hovering) */}
          {hoverIdx === null && (
            <>
              <circle
                cx={toX(dataPoints.length - 1).toFixed(1)}
                cy={toY(last).toFixed(1)}
                r="6" fill={accentColor} opacity="0.18"
              />
              <circle
                cx={toX(dataPoints.length - 1).toFixed(1)}
                cy={toY(last).toFixed(1)}
                r="3.5" fill={accentColor}
                stroke="rgb(var(--color-card-rgb))" strokeWidth="2"
              />
            </>
          )}
        </svg>

        {/* Hover tooltip */}
        {hovered && hoverX !== null && (
          <div
            className="nwt-tooltip"
            style={{
              left: `${Math.max(10, Math.min(90, (hoverX / W * 100))).toFixed(1)}%`,
            }}
          >
            <p className="text-[10px] font-semibold mb-0.5"
              style={{ color: 'rgb(var(--color-text-muted-rgb))' }}>
              {hovered.label}
            </p>
            <p className="text-sm font-bold tabular-nums"
              style={{ color: accentColor }}>
              {fmt(hovered.value, currencySymbol)}
            </p>
          </div>
        )}
      </div>

      {/* ── Divider ── */}
      <div className="nwt-divider" />

      {/* ── Account breakdown ── */}
      {activeAccCards.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-2.5">
            <p className="text-[10px] font-bold uppercase tracking-widest"
              style={{ color: 'rgb(var(--color-text-muted-rgb))' }}>
              Account Breakdown
            </p>
            <p className="text-[11px] font-bold tabular-nums"
              style={{ color: 'rgb(var(--color-text-rgb))' }}>
              {fmt(totalNetWorth, currencySymbol)} total
            </p>
          </div>

          {/* 1 col on very small screens, 2 on small, 3 on sm+ */}
          <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 gap-2">
            {activeAccCards.map(acc => {
              const meta = ACCOUNT_TYPE_META[acc.type];
              const displayBal = acc.type === 'credit_card' ? -acc.balance : acc.balance;
              const pct = totalNetWorth !== 0 ? Math.abs(displayBal / totalNetWorth) * 100 : 0;
              return (
                <div key={acc.id} className="nwt-acc-card">
                  <div
                    className="w-8 h-8 rounded-xl flex items-center justify-center text-sm flex-shrink-0"
                    style={{ background: `${meta.color}1a` }}
                  >
                    {meta.emoji}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-medium truncate leading-tight"
                      style={{ color: 'rgb(var(--color-text-muted-rgb))' }}>
                      {acc.name}
                    </p>
                    <p className="text-[13px] font-bold tabular-nums leading-tight mt-0.5"
                      style={{ color: displayBal >= 0 ? meta.color : '#ef4444' }}>
                      {displayBal < 0 ? '-' : ''}{fmt(Math.abs(displayBal), currencySymbol)}
                    </p>
                    <div className="mt-1.5 h-1 rounded-full overflow-hidden"
                      style={{ background: 'rgba(var(--color-border-rgb),0.3)' }}>
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${Math.min(pct, 100).toFixed(1)}%`,
                          background: displayBal >= 0 ? meta.color : '#ef4444',
                          opacity: 0.7,
                        }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default NetWorthTimeline;
