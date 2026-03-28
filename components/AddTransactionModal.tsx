import React, { useState, useEffect, useRef } from 'react';
import { Transaction, User, SubCategory } from '../types';
import { TRANSACTION_CATEGORIES } from '../constants';
import { suggestCategory } from '../utils/categoryAI';
import { parseReceiptWithGemini } from '../utils/ocr';
import { compressImage } from '../utils/imageProcessing';
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
    {children}{required && <span className="text-red-500 text-[10px]">*</span>}
  </label>
);

const ErrMsg: React.FC<{ msg?: string }> = ({ msg }) => (
  <div className={`flex items-center gap-1 mt-1.5 transition-all duration-200 overflow-hidden ${msg ? 'max-h-5 opacity-100' : 'max-h-0 opacity-0'}`}>
    <svg width="9" height="9" fill="none" stroke="#f87171" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5}
        d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
    </svg>
    <span className="text-[11px] text-red-400">{msg}</span>
  </div>
);

// ─── Main ─────────────────────────────────────────────────────────────────────
const AddTransactionModal: React.FC<AddTransactionModalProps> = ({
  isOpen, onClose, onSaveTransaction, onDeleteTransaction,
  transactionToEdit, initialType = 'expense', initialData,
  smartSuggestionsEnabled = true, user,
}) => {
  injectCSS();

  const isEditing = !!transactionToEdit;
  // 修正：同時顯示自訂分類與預設分類
  const mergeCategories = (userCats: any) => {
    if (!userCats) return TRANSACTION_CATEGORIES;
    const mergeType = (typeCats: any, defaultCats: any) => {
      const out: { [key: string]: SubCategory[] } = { ...defaultCats };
      for (const group in typeCats) {
        if (!out[group]) out[group] = [];
        // 將自訂分類轉成 SubCategory 並合併
        const customSubs = (typeCats[group] as any[]).map(name => typeof name === 'string' ? { name } : name);
        // 避免重複
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
  const [category, setCategory]       = useState<string>(() => {
    if (transactionToEdit)    return transactionToEdit.category;
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

  // ── Reset on open ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (transactionToEdit) {
      setType(transactionToEdit.type);
      setDescription(transactionToEdit.description);
      setAmount(transactionToEdit.amount.toString());
      setCategory(transactionToEdit.category);
      setSuggestedEmoji(transactionToEdit.emoji);
    } else {
      const t = initialData?.type || initialType;
      setType(t);
      setDescription(initialData?.description || '');
      setAmount(initialData?.amount?.toString() || '');
      setCategory(initialData?.category || getDefaultCategory(t));
      setSuggestedEmoji(initialData?.emoji);
    }
    setErrors({});
  }, [transactionToEdit, initialType, initialData]);

  // ── AI suggestions ─────────────────────────────────────────────────────────
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
    setIsScanning(true);
    setErrors({});
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
        type,
        category,
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

  // ── Footer ─────────────────────────────────────────────────────────────────
  const footer = (
    <div className="flex items-center gap-2">
      {isEditing && (
        <button
          type="button"
          onClick={() => setShowDeleteConfirmation(true)}
          disabled={isSubmitting}
          className="flex items-center gap-1.5 px-3 py-2.5 rounded-2xl text-xs font-semibold text-red-400 hover:bg-red-500/10 active:scale-95 transition-all touch-manipulation"
        >
          <svg width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
          Delete
        </button>
      )}
      <div className="flex gap-2 ml-auto">
        <button
          type="button"
          onClick={onClose}
          disabled={isSubmitting}
          className="px-4 py-2.5 rounded-2xl text-sm font-semibold text-[rgb(var(--color-text-muted-rgb))] bg-[rgb(var(--color-card-muted-rgb))]/50 border border-white/8 hover:bg-[rgb(var(--color-card-muted-rgb))] active:scale-95 transition-all touch-manipulation"
        >
          Cancel
        </button>
        <button
          type="submit"
          form="atm-form"
          disabled={isSubmitting}
          className="atm-pulse-ring flex items-center gap-2 px-5 py-2.5 rounded-2xl text-sm font-bold text-white active:scale-95 transition-all touch-manipulation disabled:opacity-55"
          style={{
            background: isExpense
              ? 'linear-gradient(135deg,#ef4444,#dc2626)'
              : 'linear-gradient(135deg,#22c55e,#16a34a)',
            boxShadow: isExpense
              ? '0 4px 16px rgba(239,68,68,0.28)'
              : '0 4px 16px rgba(34,197,94,0.28)',
          }}
        >
          {isSubmitting ? (
            <>
              <svg className="atm-spin" width="13" height="13" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="40 20" />
              </svg>
              Saving…
            </>
          ) : isEditing
            ? '✓ Save Changes'
            : `+ Add ${isExpense ? 'Expense' : 'Income'}`
          }
        </button>
      </div>
    </div>
  );

  return (
    <>
      <BaseModal
        isOpen={isOpen}
        onClose={onClose}
        title={isEditing ? 'Edit Transaction' : 'New Transaction'}
        subtitle={isEditing ? 'Update the details below' : `Recording a new ${type}`}
        size="md"
        animation="slide-up"
        footer={footer}
        aria-label={`${isEditing ? 'Edit' : 'Add'} transaction form`}
      >
        <form id="atm-form" onSubmit={handleSubmit} noValidate className="flex flex-col gap-5 pb-1">

          {/* ── Row 1: Type + Scan ── */}
          <div className="atm-in flex items-center gap-3" style={{ animationDelay: '0ms' }}>
            <div className="atm-toggle flex-1">
              {(['expense', 'income'] as const).map(t => (
                <button
                  key={t}
                  type="button"
                  onClick={() => handleTypeChange(t)}
                  className={`atm-toggle-btn ${type === t ? `is-active ${t}` : ''}`}
                >
                  {t === 'expense' ? '↑ Expense' : '↓ Income'}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isScanning}
              className="atm-glass flex items-center gap-1.5 px-3 py-2.5 text-xs font-semibold text-[rgb(var(--color-text-muted-rgb))] hover:text-[rgb(var(--color-text-rgb))] active:scale-95 transition-all touch-manipulation flex-shrink-0"
            >
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

          {/* ── Scan error ── */}
          {errors.scan && <ErrMsg msg={errors.scan} />}

          {/* ── AI Emoji badge ── */}
          {suggestedEmoji && (
            <div
              className="atm-pop flex items-center gap-3 px-4 py-3 rounded-2xl"
              style={{ background: 'rgba(var(--color-primary-rgb),0.06)', border: '1px solid rgba(var(--color-primary-rgb),0.18)' }}
            >
              <div
                className="w-10 h-10 rounded-2xl flex items-center justify-center text-xl flex-shrink-0"
                style={{ background: 'rgba(var(--color-primary-rgb),0.10)' }}
              >
                {suggestedEmoji}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-[rgb(var(--color-text-rgb))]">AI detected emoji</p>
                <p className="text-[11px] text-[rgb(var(--color-text-muted-rgb))]/65 mt-0.5">Will be saved with this transaction</p>
              </div>
              <button
                type="button"
                onClick={() => setSuggestedEmoji(undefined)}
                className="w-6 h-6 rounded-full flex items-center justify-center bg-[rgb(var(--color-text-muted-rgb))]/10 hover:bg-red-500/20 hover:text-red-400 text-[rgb(var(--color-text-muted-rgb))] transition-all active:scale-90"
                aria-label="Remove emoji"
              >
                <svg width="9" height="9" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          )}

          {/* ── Description ── */}
          <div className="atm-in" style={{ animationDelay: '50ms' }}>
            <FieldLabel htmlFor="description" required>Description</FieldLabel>
            <div className={`atm-glass px-4 py-3 ${errors.description ? 'has-error' : ''}`}>
              <input
                id="description"
                type="text"
                value={description}
                autoFocus
                onChange={e => { setDescription(e.target.value); clrErr('description'); }}
                placeholder="e.g. Coffee at Starbucks"
                className="w-full bg-transparent text-sm font-medium text-[rgb(var(--color-text-rgb))] placeholder-[rgb(var(--color-text-muted-rgb))]/30 outline-none"
              />
            </div>
            <ErrMsg msg={errors.description} />

            {/* AI category chips */}
            {aiSuggestions.length > 0 && (
              <div className="mt-2.5 flex items-center gap-1.5 flex-wrap">
                <span className="text-[10px] font-semibold text-[rgb(var(--color-text-muted-rgb))]/50 flex items-center gap-0.5">
                  <svg width="9" height="9" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  Quick:
                </span>
                {aiSuggestions.map((s, i) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => { setCategory(s); clrErr('category'); }}
                    className={`atm-pop atm-chip ${category === s ? 'active' : 'inactive'}`}
                    style={{ animationDelay: `${i * 35}ms` }}
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* ── Amount ── */}
          <div className="atm-in" style={{ animationDelay: '100ms' }}>
            <FieldLabel htmlFor="amount" required>Amount</FieldLabel>
            <AmountInput
              id="amount"
              value={amount}
              onChange={v => { setAmount(v); clrErr('amount'); }}
              error={errors.amount}
              currencySymbol="$"
            />
          </div>

      <FormField
            label="Category"
            htmlFor="category"
            required
            error={errors.category}
          >
            <Select
              id="category"
              value={category}
              onChange={(e) => {
                setCategory(e.target.value);
                if (errors.category) setErrors({ ...errors, category: '' });
              }}
              error={errors.category}
            >
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
          onClose();
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