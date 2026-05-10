import React, { useState, useEffect, useRef, useCallback } from 'react';
import ReactDOM from 'react-dom';
import { Transaction, User, SubCategory, ACCOUNT_TYPE_META } from '../types';
import { TRANSACTION_CATEGORIES } from '../constants';
import { suggestCategory } from '../utils/categoryAI';
import { parseReceiptWithGemini } from '../utils/ocr';
import { compressImage } from '../utils/imageProcessing';
import { formatCurrency } from '../utils/formatters';
import BaseModal from './BaseModal';
import { FormField, Input, Select, Button, ToggleButton } from './ModalForm';
import ConfirmationModal from './ConfirmationModal';
import AmountInput from './AmountInput';

interface AddTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveTransaction: (transaction: Omit<Transaction, 'id' | 'date'> & { id?: string }) => void;
  onDeleteTransaction?: (transactionId: string) => void;
  transactionToEdit: Transaction | null;
  initialType?: 'income' | 'expense';
  initialData?: Partial<Omit<Transaction, 'id' | 'date'>>;
  smartSuggestionsEnabled?: boolean;
  user: User | null;
}

// ─── CSS ─────────────────────────────────────────────────────────────────────
const CSS = `
  @keyframes atm-in {
    from { opacity: 0; transform: translateY(10px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes atm-pop {
    from { opacity: 0; transform: scale(0.88); }
    to   { opacity: 1; transform: scale(1); }
  }
  @keyframes atm-spin {
    to { transform: rotate(360deg); }
  }
  @keyframes atm-pulse-ring {
    0%   { box-shadow: 0 0 0 0 rgba(var(--color-primary-rgb), 0.4); }
    70%  { box-shadow: 0 0 0 7px rgba(var(--color-primary-rgb), 0); }
    100% { box-shadow: 0 0 0 0 rgba(var(--color-primary-rgb), 0); }
  }
  @keyframes atm-sheet-up {
    from { transform: translateY(100%); }
    to   { transform: translateY(0); }
  }
  @keyframes atm-overlay-in {
    from { opacity: 0; }
    to   { opacity: 1; }
  }

  .atm-in   { animation: atm-in  0.32s cubic-bezier(0.4,0,0.2,1) both; }
  .atm-pop  { animation: atm-pop 0.26s cubic-bezier(0.34,1.2,0.64,1) both; }
  .atm-spin { animation: atm-spin 0.75s linear infinite; }
  .atm-pulse-ring { animation: atm-pulse-ring 0.9s ease 0.3s 1; }

  /* Glass input field */
  .atm-glass {
    background: rgba(var(--color-card-muted-rgb), 0.45);
    border: 1px solid rgba(255,255,255,0.09);
    backdrop-filter: blur(16px);
    -webkit-backdrop-filter: blur(16px);
    box-shadow: inset 0 1.5px 0 rgba(255,255,255,0.09), 0 2px 10px rgba(0,0,0,0.06);
    transition: all 0.22s ease;
    border-radius: 16px;
  }
  .atm-glass:focus-within {
    background: rgba(var(--color-card-muted-rgb), 0.72);
    border-color: rgba(var(--color-primary-rgb), 0.38);
    box-shadow:
      inset 0 1.5px 0 rgba(255,255,255,0.11),
      0 0 0 3.5px rgba(var(--color-primary-rgb), 0.11),
      0 4px 16px rgba(0,0,0,0.08);
  }
  .atm-glass.has-error {
    border-color: rgba(239,68,68,0.48);
    box-shadow: inset 0 1.5px 0 rgba(255,255,255,0.08), 0 0 0 3.5px rgba(239,68,68,0.11);
  }

  /* Type toggle */
  .atm-toggle {
    display: flex;
    background: rgba(var(--color-card-muted-rgb), 0.55);
    border: 1px solid rgba(255,255,255,0.08);
    border-radius: 14px;
    padding: 3px;
    gap: 2px;
  }
  .atm-toggle-btn {
    flex: 1; border-radius: 11px;
    padding: 8px 14px;
    font-size: 13px; font-weight: 600;
    border: none; outline: none;
    cursor: pointer; touch-action: manipulation;
    transition: all 0.22s cubic-bezier(0.4,0,0.2,1);
    color: rgb(var(--color-text-muted-rgb));
    background: transparent;
  }
  .atm-toggle-btn:hover:not(.is-active) {
    background: rgba(var(--color-card-muted-rgb), 0.7);
    color: rgb(var(--color-text-rgb));
  }
  .atm-toggle-btn.is-active.expense {
    background: linear-gradient(135deg,#ef4444,#dc2626);
    color: white;
    box-shadow: 0 2px 10px rgba(239,68,68,0.32);
  }
  .atm-toggle-btn.is-active.income {
    background: linear-gradient(135deg,#22c55e,#16a34a);
    color: white;
    box-shadow: 0 2px 10px rgba(34,197,94,0.32);
  }

  /* Chip */
  .atm-chip {
    padding: 3px 10px; border-radius: 999px;
    font-size: 11px; font-weight: 600;
    cursor: pointer; touch-action: manipulation;
    border: 1px solid rgba(255,255,255,0.08);
    transition: all 0.15s ease;
  }
  .atm-chip:active { transform: scale(0.93); }
  .atm-chip.active {
    background: rgb(var(--color-primary-rgb));
    color: white; border-color: transparent;
    box-shadow: 0 2px 8px rgba(var(--color-primary-rgb),0.30);
  }
  .atm-chip.inactive {
    background: rgba(var(--color-card-muted-rgb), 0.65);
    color: rgb(var(--color-text-muted-rgb));
  }
  .atm-chip.inactive:hover {
    background: rgba(var(--color-card-muted-rgb), 0.9);
    color: rgb(var(--color-text-rgb));
  }

  /* ── Account selector trigger ───────────────────────────────────────────── */
  .atm-acc-trigger {
    width: 100%;
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 11px 14px;
    background: var(--atm-acc-bg);
    border: 1px solid rgba(var(--color-border-rgb), 0.55);
    border-radius: 14px;
    cursor: pointer;
    transition: background 0.18s ease, border-color 0.18s ease, box-shadow 0.18s ease;
    touch-action: manipulation;
    -webkit-tap-highlight-color: transparent;
  }
  .atm-acc-trigger:active {
    transform: scale(0.985);
    background: var(--atm-acc-bg-hover);
  }
  .atm-acc-trigger:hover {
    background: var(--atm-acc-bg-hover);
    border-color: rgba(var(--color-border-rgb), 0.85);
  }
  .atm-acc-trigger.open {
    border-color: rgba(var(--color-primary-rgb), 0.5);
    box-shadow: 0 0 0 3px rgba(var(--color-primary-rgb), 0.12);
  }
  .atm-acc-trigger.has-error {
    border-color: rgba(239,68,68,0.55);
    box-shadow: 0 0 0 3px rgba(239,68,68,0.12);
  }
  .atm-acc-dot {
    width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0;
  }

  /* ── Account type badge (NEW) ───────────────────────────────────────────── */
  .atm-acc-badge {
    display: inline-flex;
    align-items: center;
    gap: 3px;
    padding: 2px 6px;
    border-radius: 6px;
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.02em;
    flex-shrink: 0;
  }

  /* ── Balance utilisation bar (NEW — credit card) ────────────────────────── */
  .atm-acc-util-bar {
    height: 3px;
    border-radius: 2px;
    background: rgba(var(--color-border-rgb), 0.5);
    overflow: hidden;
    margin-top: 4px;
  }
  .atm-acc-util-fill {
    height: 100%;
    border-radius: 2px;
    transition: width 0.35s ease;
  }

  /* ── Desktop inline dropdown ────────────────────────────────────────────── */
  .atm-acc-desktop-menu {
    position: fixed;
    background: var(--atm-acc-menu-bg);
    border: 1px solid rgba(var(--color-border-rgb), 0.55);
    border-radius: 14px;
    overflow: hidden;
    z-index: 99999;
    box-shadow: 0 20px 60px rgba(0,0,0,0.45), 0 4px 16px rgba(0,0,0,0.25);
    animation: atm-in 0.16s cubic-bezier(0.4,0,0.2,1) both;
  }
  .atm-acc-option {
    width: 100%;
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 11px 14px;
    cursor: pointer;
    transition: background 0.12s ease;
    touch-action: manipulation;
    border: none;
    background: transparent;
    -webkit-tap-highlight-color: transparent;
    text-align: left;
  }
  .atm-acc-option:hover { background: rgba(var(--color-primary-rgb), 0.09); }
  .atm-acc-option.selected { background: rgba(var(--color-primary-rgb), 0.13); }
  .atm-acc-option + .atm-acc-option {
    border-top: 1px solid rgba(var(--color-border-rgb), 0.3);
  }

  /* ── Mobile bottom sheet ────────────────────────────────────────────────── */
  .atm-sheet-overlay {
    position: fixed; inset: 0;
    background: rgba(0,0,0,0.55);
    z-index: 99998;
    animation: atm-overlay-in 0.22s ease both;
    -webkit-backdrop-filter: blur(2px);
    backdrop-filter: blur(2px);
  }
  .atm-sheet {
    position: fixed;
    left: 0; right: 0; bottom: 0;
    background: var(--atm-acc-menu-bg);
    border-radius: 20px 20px 0 0;
    z-index: 99999;
    padding-bottom: env(safe-area-inset-bottom, 16px);
    animation: atm-sheet-up 0.32s cubic-bezier(0.32,0.72,0,1) both;
    box-shadow: 0 -8px 40px rgba(0,0,0,0.35);
    max-height: 75vh;
    display: flex;
    flex-direction: column;
  }
  .atm-sheet-handle {
    width: 36px; height: 4px; border-radius: 2px;
    background: rgba(var(--color-text-muted-rgb), 0.3);
    margin: 10px auto 0;
    flex-shrink: 0;
  }
  .atm-sheet-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 14px 18px 10px;
    flex-shrink: 0;
    border-bottom: 1px solid rgba(var(--color-border-rgb), 0.3);
  }
  .atm-sheet-list {
    overflow-y: auto;
    -webkit-overflow-scrolling: touch;
    overscroll-behavior: contain;
    flex: 1;
  }
  .atm-sheet-option {
    width: 100%;
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 14px 18px;
    border: none;
    background: transparent;
    cursor: pointer;
    -webkit-tap-highlight-color: transparent;
    transition: background 0.12s ease;
    touch-action: manipulation;
  }
  .atm-sheet-option:active { background: rgba(var(--color-primary-rgb), 0.09); }
  .atm-sheet-option.selected { background: rgba(var(--color-primary-rgb), 0.10); }
  .atm-sheet-option + .atm-sheet-option {
    border-top: 1px solid rgba(var(--color-border-rgb), 0.22);
  }
`;

let cssInjected = false;
const injectCSS = () => {
  if (cssInjected || typeof document === 'undefined') return;
  const el = document.createElement('style');
  el.id = 'atm-modal-css';
  el.textContent = CSS;
  document.head.appendChild(el);
  cssInjected = true;
};

// ─── Sub-components ───────────────────────────────────────────────────────────
const FieldLabel: React.FC<{ htmlFor?: string; required?: boolean; children: React.ReactNode }> = ({ htmlFor, required, children }) => (
  <label htmlFor={htmlFor}
    className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-widest text-[rgb(var(--color-text-muted-rgb))]/60 mb-2 select-none">
    {children}{required && <span className="text-[10px]" style={{color:'rgb(var(--color-error-rgb))'}}>*</span>}
  </label>
);

const ErrMsg: React.FC<{ msg?: string }> = ({ msg }) => (
  <div className={`flex items-center gap-1 mt-1.5 transition-all duration-200 overflow-hidden ${msg ? 'max-h-5 opacity-100' : 'max-h-0 opacity-0'}`}>
    <svg width="9" height="9" fill="none" stroke="#f87171" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5}
        d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
    </svg>
    <span className="text-[11px]" style={{color:'rgb(var(--color-error-rgb))'}}>{msg}</span>
  </div>
);

// ─── CSS variable helper — reads current theme color as opaque hex ─────────
const getThemeColor = (varName: string, fallback: string) => {
  if (typeof window === 'undefined') return fallback;
  const rgb = getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
  if (rgb) return `rgb(${rgb})`;
  return fallback;
};

// ─── Account Dropdown ─────────────────────────────────────────────────────────
interface AccountDropdownProps {
  accounts: NonNullable<User['financialAccounts']>;
  value: string;
  onChange: (id: string) => void;
  isExpense: boolean;
  hasError?: boolean;
}

const AccountDropdown: React.FC<AccountDropdownProps> = ({ accounts, value, onChange, isExpense, hasError }) => {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [menuStyle, setMenuStyle] = useState<React.CSSProperties>({});

  const activeAccounts = accounts.filter(a => !a.isArchived);
  const selected = activeAccounts.find(a => a.id === value);
  const selectedMeta = selected ? ACCOUNT_TYPE_META[selected.type] : null;

  // Detect mobile
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 640);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  // Position desktop dropdown under the trigger
  const calcMenuStyle = useCallback(() => {
    if (!triggerRef.current) return;
    const r = triggerRef.current.getBoundingClientRect();
    setMenuStyle({
      top: r.bottom + 6,
      left: r.left,
      width: r.width,
      '--atm-acc-menu-bg': getThemeColor('--color-card-rgb', '#1c1b19'),
    } as React.CSSProperties);
  }, []);

  const handleOpen = () => {
    calcMenuStyle();
    setOpen(true);
  };

  // Close on outside click (desktop)
  useEffect(() => {
    if (!open || isMobile) return;
    const handler = (e: MouseEvent) => {
      if (triggerRef.current && !triggerRef.current.contains(e.target as Node)) {
        const menu = document.getElementById('atm-acc-portal');
        if (menu && menu.contains(e.target as Node)) return;
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open, isMobile]);

  const handleSelect = (id: string) => {
    onChange(id);
    setOpen(false);
  };

  const cardBg = typeof window !== 'undefined'
    ? getThemeColor('--color-card-rgb', '#1c1b19') : '#1c1b19';
  const cardMutedBg = typeof window !== 'undefined'
    ? getThemeColor('--color-card-muted-rgb', '#22211f') : '#22211f';

  // ── Util bar for credit cards ──────────────────────────────────────────────
  const UtilBar: React.FC<{ acc: typeof activeAccounts[0]; meta: typeof selectedMeta }> = ({ acc, meta }) => {
    if (acc.type !== 'credit_card' || !acc.creditLimit) return null;
    const pct = Math.min((acc.balance / acc.creditLimit) * 100, 100);
    const color = pct > 80 ? '#f87171' : pct > 50 ? '#fbbf24' : meta?.color ?? '#22c55e';
    return (
      <div className="atm-acc-util-bar" style={{ marginTop: 3 }}>
        <div className="atm-acc-util-fill" style={{ width: `${pct}%`, background: color }} />
      </div>
    );
  };

  // ── Account type badge ─────────────────────────────────────────────────────
  const TypeBadge: React.FC<{ meta: NonNullable<typeof selectedMeta> }> = ({ meta }) => (
    <span
      className="atm-acc-badge"
      style={{
        background: `${meta.color}1a`,
        color: meta.color,
        border: `1px solid ${meta.color}33`,
      }}
    >
      {meta.label}
    </span>
  );

  const TriggerContent = (
    <>
      {selected && selectedMeta ? (
        <>
          <span className="atm-acc-dot" style={{ background: selectedMeta.color }} />
          <span className="text-base leading-none">{selectedMeta.emoji}</span>
          <div className="flex-1 min-w-0 text-left">
            <div className="flex items-center gap-1.5 flex-wrap">
              <p className="text-sm font-semibold text-[rgb(var(--color-text-rgb))] truncate leading-tight">
                {selected.name}
              </p>
              <TypeBadge meta={selectedMeta} />
            </div>
            <div className="flex items-center gap-1.5">
              <p className="text-[11px] font-medium tabular-nums leading-tight"
                style={{ color: selected.balance < 0 ? '#f87171' : selectedMeta.color }}>
                {formatCurrency(selected.balance)}
              </p>
              {selected.type === 'credit_card' && selected.creditLimit && (
                <p className="text-[10px] leading-tight" style={{ color: 'rgb(var(--color-text-muted-rgb))' }}>
                  / {formatCurrency(selected.creditLimit)} limit
                </p>
              )}
            </div>
            <UtilBar acc={selected} meta={selectedMeta} />
          </div>
        </>
      ) : (
        <>
          <span className="atm-acc-dot" style={{ background: 'rgba(var(--color-text-muted-rgb),0.4)' }} />
          <span className="text-base leading-none">🚫</span>
          <p className="flex-1 text-sm text-left" style={{ color: 'rgb(var(--color-text-muted-rgb))' }}>No Account</p>
        </>
      )}
      <svg
        style={{ flexShrink: 0, color: 'rgb(var(--color-text-muted-rgb))', transform: open ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s ease' }}
        width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
      </svg>
    </>
  );

  const OptionList = ({ sheet }: { sheet?: boolean }) => (
    <>
      {/* No Account */}
      <button
        type="button"
        role="option"
        aria-selected={value === ''}
        className={sheet ? `atm-sheet-option ${value === '' ? 'selected' : ''}` : `atm-acc-option ${value === '' ? 'selected' : ''}`}
        onClick={() => handleSelect('')}
      >
        <span className="atm-acc-dot" style={{ background: 'rgba(var(--color-text-muted-rgb),0.35)' }} />
        <span className="text-sm leading-none">🚫</span>
        <p className="flex-1 text-sm" style={{ color: 'rgb(var(--color-text-muted-rgb))' }}>No Account</p>
        {value === '' && (
          <svg width="14" height="14" fill="none" stroke="rgb(var(--color-primary-rgb))" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
          </svg>
        )}
      </button>

      {activeAccounts.map(acc => {
        const meta = ACCOUNT_TYPE_META[acc.type] ?? ACCOUNT_TYPE_META['other' as keyof typeof ACCOUNT_TYPE_META];
        const isSel = value === acc.id;
        const utilPct = acc.type === 'credit_card' && acc.creditLimit
          ? Math.min((acc.balance / acc.creditLimit) * 100, 100) : null;
        const utilColor = utilPct !== null
          ? (utilPct > 80 ? '#f87171' : utilPct > 50 ? '#fbbf24' : meta.color)
          : meta.color;
        return (
          <button
            key={acc.id}
            type="button"
            role="option"
            aria-selected={isSel}
            className={sheet ? `atm-sheet-option ${isSel ? 'selected' : ''}` : `atm-acc-option ${isSel ? 'selected' : ''}`}
            onClick={() => handleSelect(acc.id)}
          >
            <span className="atm-acc-dot" style={{ background: meta.color }} />
            <span className="text-sm leading-none">{meta.emoji}</span>
            <div className="flex-1 min-w-0 text-left">
              <div className="flex items-center gap-1.5 flex-wrap">
                <p className="text-sm font-semibold truncate leading-tight"
                  style={{ color: 'rgb(var(--color-text-rgb))' }}>{acc.name}</p>
                {/* Type badge in list */}
                <span
                  className="atm-acc-badge"
                  style={{ background: `${meta.color}18`, color: meta.color, border: `1px solid ${meta.color}2e` }}
                >
                  {meta.label}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <p className="text-[11px] font-medium tabular-nums leading-tight"
                  style={{ color: acc.balance < 0 ? '#f87171' : meta.color }}>
                  {formatCurrency(acc.balance)}
                </p>
                {acc.type === 'credit_card' && acc.creditLimit && (
                  <p className="text-[10px] leading-tight" style={{ color: 'rgb(var(--color-text-muted-rgb))' }}>
                    / {formatCurrency(acc.creditLimit)}
                    {utilPct !== null && (
                      <span style={{ color: utilColor, fontWeight: 700 }}> · {utilPct.toFixed(0)}%</span>
                    )}
                  </p>
                )}
              </div>
              {/* Util bar in list for credit cards */}
              {utilPct !== null && (
                <div className="atm-acc-util-bar" style={{ marginTop: 4, width: '100%' }}>
                  <div className="atm-acc-util-fill" style={{ width: `${utilPct}%`, background: utilColor }} />
                </div>
              )}
            </div>
            {isSel && (
              <svg width="14" height="14" fill="none" stroke="rgb(var(--color-primary-rgb))" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
            )}
          </button>
        );
      })}
    </>
  );

  return (
    <>
      {/* Trigger */}
      <button
        ref={triggerRef}
        type="button"
        onClick={handleOpen}
        className={`atm-acc-trigger ${open ? 'open' : ''} ${hasError ? 'has-error' : ''}`}
        style={{
          '--atm-acc-bg': cardBg,
          '--atm-acc-bg-hover': cardMutedBg,
        } as React.CSSProperties}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={isExpense ? 'From Account' : 'To Account'}
      >
        {TriggerContent}
      </button>

      {/* ── Mobile: Bottom Sheet via portal ── */}
      {open && isMobile && typeof document !== 'undefined' && ReactDOM.createPortal(
        <>
          {/* Overlay */}
          <div className="atm-sheet-overlay" onClick={() => setOpen(false)} />
          {/* Sheet */}
          <div
            className="atm-sheet"
            style={{ '--atm-acc-menu-bg': cardBg } as React.CSSProperties}
            role="listbox"
          >
            <div className="atm-sheet-handle" />
            <div className="atm-sheet-header">
              <p className="text-sm font-bold" style={{ color: 'rgb(var(--color-text-rgb))' }}>
                {isExpense ? 'From Account' : 'To Account'}
              </p>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="w-7 h-7 rounded-full flex items-center justify-center"
                style={{ background: 'rgba(var(--color-text-muted-rgb),0.12)' }}
                aria-label="Close"
              >
                <svg width="11" height="11" fill="none" stroke="currentColor" viewBox="0 0 24 24"
                  style={{ color: 'rgb(var(--color-text-muted-rgb))' }}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="atm-sheet-list">
              <OptionList sheet />
            </div>
          </div>
        </>,
        document.body
      )}

      {/* ── Desktop: floating dropdown via portal ── */}
      {open && !isMobile && typeof document !== 'undefined' && ReactDOM.createPortal(
        <div
          id="atm-acc-portal"
          className="atm-acc-desktop-menu"
          style={{ ...menuStyle, '--atm-acc-menu-bg': cardBg } as React.CSSProperties}
          role="listbox"
        >
          <OptionList />
        </div>,
        document.body
      )}
    </>
  );
};

// ─── Main ─────────────────────────────────────────────────────────────────────
const AddTransactionModal: React.FC<AddTransactionModalProps> = ({
  isOpen, onClose, onSaveTransaction, onDeleteTransaction,
  transactionToEdit, initialType = 'expense', initialData,
  smartSuggestionsEnabled = true, user,
}) => {
  injectCSS();

  const isEditing = !!transactionToEdit;
  const mergeCategories = (userCats: any) => {
    if (!userCats) return TRANSACTION_CATEGORIES;
    const mergeType = (typeCats: any, defaultCats: any) => {
      const out: { [key: string]: SubCategory[] } = { ...defaultCats };
      for (const group in typeCats) {
        if (!out[group]) out[group] = [];
        const customSubs = (typeCats[group] as any[]).map(name => typeof name === 'string' ? { name } : name);
        customSubs.forEach(sub => {
          if (!out[group].some(c => c.name === sub.name)) out[group].push(sub);
        });
      }
      return out;
    };
    return {
      expense: mergeType(userCats.expense, TRANSACTION_CATEGORIES.expense),
      income: mergeType(userCats.income, TRANSACTION_CATEGORIES.income),
    };
  };
  const currentCategories = user?.customCategories ? mergeCategories(user.customCategories) : TRANSACTION_CATEGORIES;
  const getDefaultCategory = (t: 'income' | 'expense') =>
    Object.values(currentCategories[t]).flat()[0]?.name || '';

  const [type, setType]               = useState<'income' | 'expense'>(() => transactionToEdit?.type || initialData?.type || initialType);
  const [description, setDescription] = useState(() => transactionToEdit?.description || initialData?.description || '');
  const [amount, setAmount]           = useState(() => transactionToEdit?.amount?.toString() || initialData?.amount?.toString() || '');
  const [accountId, setAccountId]     = useState<string>(() => {
    if (transactionToEdit?.accountId) return transactionToEdit.accountId;
    if (initialData?.accountId) return initialData.accountId;
    const activeAccounts = user?.financialAccounts?.filter(a => !a.isArchived) || [];
    return activeAccounts.length > 0 ? activeAccounts[0].id : '';
  });
  const [category, setCategory]       = useState<string>(() => {
    if (transactionToEdit)     return transactionToEdit.category;
    if (initialData?.category) return initialData.category;
    return getDefaultCategory(initialData?.type || initialType);
  });
  const [suggestedEmoji, setSuggestedEmoji] = useState<string | undefined>(transactionToEdit?.emoji || initialData?.emoji);
  const [aiSuggestions, setAiSuggestions]   = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting]     = useState(false);
  const [errors, setErrors]                 = useState<Record<string, string>>({});
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [isScanning, setIsScanning]         = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (transactionToEdit) {
      setType(transactionToEdit.type);
      setDescription(transactionToEdit.description);
      setAmount(transactionToEdit.amount.toString());
      setCategory(transactionToEdit.category);
      setAccountId(transactionToEdit.accountId || '');
      setSuggestedEmoji(transactionToEdit.emoji);
    } else {
      const t = initialData?.type || initialType;
      setType(t);
      setDescription(initialData?.description || '');
      setAmount(initialData?.amount?.toString() || '');
      setCategory(initialData?.category || getDefaultCategory(t));
      setSuggestedEmoji(initialData?.emoji);
      const activeAccounts = user?.financialAccounts?.filter(a => !a.isArchived) || [];
      setAccountId(initialData?.accountId || (activeAccounts.length > 0 ? activeAccounts[0].id : ''));
    }
    setErrors({});
  }, [transactionToEdit, initialType, initialData, user]);

  useEffect(() => {
    if (smartSuggestionsEnabled && description.length > 2) {
      const avail = Object.values(currentCategories[type]).flat().map(c => c.name);
      setAiSuggestions(suggestCategory(description, avail).map(s => s.category).slice(0, 5));
    } else {
      setAiSuggestions([]);
    }
  }, [description, type, smartSuggestionsEnabled]);

  const clrErr = (k: string) => setErrors(p => { const n = { ...p }; delete n[k]; return n; });

  const handleTypeChange = (newType: 'income' | 'expense') => {
    setType(newType);
    const cats = Object.values(currentCategories[newType]).flat().map(c => c.name);
    if (!cats.includes(category)) setCategory(getDefaultCategory(newType));
    setErrors({});
  };

  const validateForm = () => {
    const e: Record<string, string> = {};
    if (!description.trim())                            e.description = 'Description is required';
    if (!amount.trim())                                  e.amount      = 'Amount is required';
    else if (isNaN(+amount) || parseFloat(amount) <= 0) e.amount      = 'Enter a valid positive amount';
    if (!category)                                       e.category    = 'Category is required';
    setErrors(e);
    return !Object.keys(e).length;
  };

  const handleScanReceipt = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setIsScanning(true); setErrors({});
    try {
      if (!user?.aiSettings?.apiKey) throw new Error('API key not configured. Set it in Settings.');
      const compressed = await compressImage(file, { maxWidth: 1024, maxHeight: 1024, quality: 0.7 });
      const data = await parseReceiptWithGemini(compressed, user.aiSettings.apiKey, 'gemini-2.5-flash-lite');
      if (data.description) setDescription(data.description);
      if (data.amount)       setAmount(data.amount.toString());
      if (data.emoji)        setSuggestedEmoji(data.emoji);
    } catch (err: any) {
      setErrors(p => ({ ...p, scan: err.message || 'Failed to scan receipt.' }));
    } finally {
      setIsScanning(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    setIsSubmitting(true);
    try {
      await onSaveTransaction({
        id: transactionToEdit?.id,
        description: description.trim(),
        amount: parseFloat(amount),
        type, category,
        accountId: accountId,
        emoji: suggestedEmoji,
      });
      onClose();
    } catch (err) {
      console.error('Error saving transaction:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const categories = currentCategories[type];
  const isExpense  = type === 'expense';

  const footer = (
    <div className="flex items-center gap-2">
      {isEditing && (
        <button type="button" onClick={() => setShowDeleteConfirmation(true)} disabled={isSubmitting}
          className="atm-btn-danger flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold touch-manipulation focus:outline-none focus:ring-2 focus:ring-red-400/25">
          <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2}
              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
          Delete
        </button>
      )}
      <div className="flex items-center gap-2 ml-auto">
        <button type="button" onClick={onClose} disabled={isSubmitting}
          className="atm-btn-ghost px-4 py-2 rounded-xl text-sm font-medium touch-manipulation focus:outline-none focus:ring-2 focus:ring-white/10">
          Cancel
        </button>
        <button type="submit" form="atm-form" disabled={isSubmitting}
          className="atm-btn-submit atm-pulse-ring flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-bold touch-manipulation focus:outline-none focus:ring-2"
          style={{
            background: isExpense
              ? 'linear-gradient(135deg,#f87171 0%,#ef4444 50%,#dc2626 100%)'
              : 'linear-gradient(135deg,#4ade80 0%,#22c55e 50%,#16a34a 100%)',
            boxShadow: isExpense
              ? '0 1px 2px rgba(239,68,68,0.20),0 4px 14px rgba(239,68,68,0.30)'
              : '0 1px 2px rgba(34,197,94,0.20),0 4px 14px rgba(34,197,94,0.30)',
          }}
        >
          {isSubmitting ? (
            <><svg className="atm-spin" width="13" height="13" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="40 20"/></svg>Saving…</>
          ) : isEditing ? (
            <><svg width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7"/></svg>Save Changes</>
          ) : (
            <><svg width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4"/></svg>Add {isExpense ? 'Expense' : 'Income'}</>
          )}
        </button>
      </div>
    </div>
  );

  return (
    <>
      <BaseModal isOpen={isOpen} onClose={onClose}
        title={isEditing ? 'Edit Transaction' : 'New Transaction'}
        subtitle={isEditing ? 'Update the details below' : `Recording a new ${type}`}
        size="md" animation="slide-up" footer={footer}
        aria-label={`${isEditing ? 'Edit' : 'Add'} transaction form`}
      >
        <form id="atm-form" onSubmit={handleSubmit} noValidate className="flex flex-col gap-5 pb-1">

          {/* Row 1: Type + Scan */}
          <div className="atm-in flex items-center gap-3" style={{ animationDelay: '0ms' }}>
            <div className="atm-toggle flex-1">
              {(['expense', 'income'] as const).map(t => (
                <button key={t} type="button" onClick={() => handleTypeChange(t)}
                  className={`atm-toggle-btn ${type === t ? `is-active ${t}` : ''}`}>
                  {t === 'expense' ? '↑ Expense' : '↓ Income'}
                </button>
              ))}
            </div>
            <button type="button" onClick={() => fileInputRef.current?.click()} disabled={isScanning}
              className="atm-glass flex items-center gap-1.5 px-3 py-2.5 text-xs font-semibold text-[rgb(var(--color-text-muted-rgb))] hover:text-[rgb(var(--color-text-rgb))] active:scale-95 transition-all touch-manipulation flex-shrink-0">
              {isScanning
                ? <svg className="atm-spin" width="13" height="13" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="40 20"/></svg>
                : <svg width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"/>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"/>
                  </svg>
              }
              {isScanning ? 'Scanning…' : 'Scan Receipt'}
            </button>
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleScanReceipt} className="hidden" />
          </div>

          {errors.scan && <ErrMsg msg={errors.scan} />}

          {/* AI Emoji badge */}
          {suggestedEmoji && (
            <div className="atm-pop flex items-center gap-3 px-4 py-3 rounded-2xl"
              style={{ background: 'rgba(var(--color-primary-rgb),0.06)', border: '1px solid rgba(var(--color-primary-rgb),0.18)' }}>
              <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-xl flex-shrink-0"
                style={{ background: 'rgba(var(--color-primary-rgb),0.10)' }}>
                {suggestedEmoji}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-[rgb(var(--color-text-rgb))]">AI detected emoji</p>
                <p className="text-[11px] text-[rgb(var(--color-text-muted-rgb))]/65 mt-0.5">Will be saved with this transaction</p>
              </div>
              <button type="button" onClick={() => setSuggestedEmoji(undefined)}
                className="w-6 h-6 rounded-full flex items-center justify-center bg-[rgb(var(--color-text-muted-rgb))]/10 hover:bg-[rgba(var(--color-error-rgb),0.20)] hover:text-[rgb(var(--color-error-rgb))] text-[rgb(var(--color-text-muted-rgb))] transition-all active:scale-90"
                aria-label="Remove emoji">
                <svg width="9" height="9" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          )}

          {/* Account Selector */}
          {user?.financialAccounts && user.financialAccounts.filter(a => !a.isArchived).length > 0 && (
            <div className="atm-in" style={{ animationDelay: '40ms' }}>
              <FieldLabel>{isExpense ? 'From Account' : 'To Account'}</FieldLabel>
              <AccountDropdown
                accounts={user.financialAccounts}
                value={accountId}
                onChange={(id) => { setAccountId(id); clrErr('accountId'); }}
                isExpense={isExpense}
                hasError={!!errors.accountId}
              />
              <ErrMsg msg={errors.accountId} />
            </div>
          )}

          {/* Description */}
          <div className="atm-in" style={{ animationDelay: '50ms' }}>
            <FieldLabel htmlFor="description" required>Description</FieldLabel>
            <div className={`atm-glass px-4 py-3 ${errors.description ? 'has-error' : ''}`}>
              <input id="description" type="text" value={description} autoFocus
                onChange={e => { setDescription(e.target.value); clrErr('description'); }}
                placeholder="e.g. Coffee at Starbucks"
                className="w-full bg-transparent text-sm font-medium text-[rgb(var(--color-text-rgb))] placeholder-[rgb(var(--color-text-muted-rgb))]/30 outline-none"
              />
            </div>
            <ErrMsg msg={errors.description} />
            {aiSuggestions.length > 0 && (
              <div className="mt-2.5 flex items-center gap-1.5 flex-wrap">
                <span className="text-[10px] font-semibold text-[rgb(var(--color-text-muted-rgb))]/50 flex items-center gap-0.5">
                  <svg width="9" height="9" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  Quick:
                </span>
                {aiSuggestions.map((s, i) => (
                  <button key={s} type="button" onClick={() => { setCategory(s); clrErr('category'); }}
                    className={`atm-pop atm-chip ${category === s ? 'active' : 'inactive'}`}
                    style={{ animationDelay: `${i * 35}ms` }}>
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Amount */}
          <div className="atm-in" style={{ animationDelay: '100ms' }}>
            <FieldLabel htmlFor="amount" required>Amount</FieldLabel>
            <AmountInput id="amount" value={amount}
              onChange={v => { setAmount(v); clrErr('amount'); }}
              error={errors.amount} currencySymbol="$"
            />
          </div>

          <FormField label="Category" htmlFor="category" required error={errors.category}>
            <Select id="category" value={category}
              onChange={(e) => { setCategory(e.target.value); if (errors.category) setErrors({ ...errors, category: '' }); }}
              error={errors.category}>
              {Object.entries(categories).map(([group, subcategories]) => (
                <optgroup label={group} key={group}>
                  {(subcategories as SubCategory[]).map(cat => (
                    <option key={cat.name} value={cat.name}>{cat.icon} {cat.name}</option>
                  ))}
                </optgroup>
              ))}
            </Select>
          </FormField>
        </form>
      </BaseModal>

      <ConfirmationModal
        isOpen={showDeleteConfirmation}
        onClose={() => setShowDeleteConfirmation(false)}
        onConfirm={() => {
          if (transactionToEdit && onDeleteTransaction) onDeleteTransaction(transactionToEdit.id);
          setShowDeleteConfirmation(false);
          setTimeout(() => { onClose(); }, 10);
          setTimeout(() => {
            if (typeof document !== 'undefined') {
              document.body.style.overflow = '';
              document.querySelectorAll('.lg-backdrop').forEach(el => el.parentNode?.removeChild(el));
            }
          }, 350);
        }}
        title="Delete Transaction"
        message={`Are you sure you want to delete "${transactionToEdit?.description}"? This action cannot be undone.`}
        confirmButtonText="Delete"
        confirmButtonVariant="danger"
      />
    </>
  );
};

export default AddTransactionModal;
