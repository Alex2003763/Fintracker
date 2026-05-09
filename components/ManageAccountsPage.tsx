import React, { useState, useMemo } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { FinancialAccount, AccountType, ACCOUNT_TYPE_META, Transaction, User } from '../types';
import { formatCurrency } from '../utils/formatters';
import PremiumBalanceCard from './PremiumBalanceCard';
import Button from './Button';

interface ManageAccountsPageProps {
  user: User;
  transactions?: Transaction[];
  onUpdateUser: (user: User) => void;
  onAddTransaction: (type?: 'income' | 'expense') => void;
  setActiveItem: (item: string) => void;
}

// ─── Small helpers ────────────────────────────────────────────────────────────

const ACCOUNT_TYPES = Object.entries(ACCOUNT_TYPE_META) as [AccountType, { label: string; emoji: string; color: string }][];

const defaultAccount = (): Omit<FinancialAccount, 'id' | 'createdAt'> => ({
  name: '',
  type: 'cash',
  balance: 0,
  includeInNetWorth: true,
  isArchived: false,
});

// ─── Account Form Modal ───────────────────────────────────────────────────────

interface AccountFormModalProps {
  account: Partial<FinancialAccount> | null;
  onSave: (data: Omit<FinancialAccount, 'id' | 'createdAt'> & { id?: string }) => void;
  onClose: () => void;
}

const AccountFormModal: React.FC<AccountFormModalProps> = ({ account, onSave, onClose }) => {
  const isEdit = Boolean(account?.id);
  const [form, setForm] = useState<Omit<FinancialAccount, 'id' | 'createdAt'> & { id?: string }>({
    id: account?.id,
    name: account?.name ?? '',
    type: account?.type ?? 'cash',
    balance: account?.balance ?? 0,
    note: account?.note ?? '',
    includeInNetWorth: account?.includeInNetWorth ?? true,
    isArchived: account?.isArchived ?? false,
    creditLimit: account?.creditLimit ?? undefined,
  });
  const [errors, setErrors] = useState<{ name?: string; balance?: string; creditLimit?: string }>({});

  const validate = () => {
    const e: typeof errors = {};
    if (!form.name.trim()) e.name = 'Account name is required';
    if (isNaN(form.balance)) e.balance = 'Enter a valid number';
    if (form.type === 'credit_card' && form.creditLimit !== undefined && form.creditLimit < 0)
      e.creditLimit = 'Credit limit cannot be negative';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    onSave(form);
  };

  const meta = ACCOUNT_TYPE_META[form.type];

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-[rgb(var(--color-card-rgb))] w-full max-w-md rounded-2xl shadow-2xl max-h-[90dvh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-[rgb(var(--color-border-rgb))]">
          <h2 className="text-lg font-semibold text-[rgb(var(--color-text-rgb))]">
            {isEdit ? 'Edit Account' : 'Add Account'}
          </h2>
           <Button onClick={onClose} variant="ghost" size="sm" className="p-2 text-[rgb(var(--color-text-muted-rgb))] hover:bg-[rgb(var(--color-card-muted-rgb))]">
             <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
             </svg>
           </Button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">

          {/* Account Type Selector */}
          <div>
            <label className="block text-sm font-medium text-[rgb(var(--color-text-muted-rgb))] mb-2">Account Type</label>
            <select
              value={form.type}
              onChange={(e) => setForm(f => ({ ...f, type: e.target.value as AccountType }))}
              className="w-full px-3 py-2.5 rounded-xl border bg-[rgb(var(--color-card-muted-rgb))] text-[rgb(var(--color-text-rgb))] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--color-primary-rgb))] transition-colors appearance-none cursor-pointer"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                backgroundPosition: 'right 0.75rem center',
                backgroundRepeat: 'no-repeat',
                backgroundSize: '1.5em 1.5em',
                paddingRight: '2.5rem'
              }}
            >
              {ACCOUNT_TYPES.map(([type, m]) => (
                <option key={type} value={type}>
                  {m.emoji} {m.label}
                </option>
              ))}
             </select>
           </div>

           {/* Name */}
          <div>
            <label className="block text-sm font-medium text-[rgb(var(--color-text-muted-rgb))] mb-1.5">Account Name *</label>
            <input
              type="text"
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              placeholder={`e.g. My ${meta.label}`}
              autoFocus
              className={`w-full px-3.5 py-2.5 rounded-xl border bg-[rgb(var(--color-card-muted-rgb))] text-[rgb(var(--color-text-rgb))] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--color-primary-rgb))] transition-colors ${
                errors.name ? 'border-red-500' : 'border-[rgb(var(--color-border-rgb))]'
              }`}
            />
            {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
          </div>

          {/* Balance */}
          <div>
            <label className="block text-sm font-medium text-[rgb(var(--color-text-muted-rgb))] mb-1.5">
              {form.type === 'credit_card' ? 'Current Balance (amount owed)' : 'Current Balance'}
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[rgb(var(--color-text-muted-rgb))] font-medium">$</span>
              <input
                type="number"
                step="0.01"
                value={form.balance}
                onChange={e => setForm(f => ({ ...f, balance: parseFloat(e.target.value) || 0 }))}
                className={`w-full pl-8 pr-3 py-2.5 rounded-xl border bg-[rgb(var(--color-card-muted-rgb))] text-[rgb(var(--color-text-rgb))] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--color-primary-rgb))] transition-colors ${
                  errors.balance ? 'border-red-500' : 'border-[rgb(var(--color-border-rgb))]'
                }`}
              />
            </div>
            {errors.balance && <p className="text-red-500 text-xs mt-1">{errors.balance}</p>}
          </div>

          {/* Credit Limit (credit card only) */}
          {form.type === 'credit_card' && (
            <div>
              <label className="block text-sm font-medium text-[rgb(var(--color-text-muted-rgb))] mb-1.5">Credit Limit (optional)</label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[rgb(var(--color-text-muted-rgb))] font-medium">$</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.creditLimit ?? ''}
                  onChange={e => setForm(f => ({ ...f, creditLimit: e.target.value ? parseFloat(e.target.value) : undefined }))}
                  placeholder="e.g. 10000"
                  className={`w-full pl-8 pr-3 py-2.5 rounded-xl border bg-[rgb(var(--color-card-muted-rgb))] text-[rgb(var(--color-text-rgb))] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--color-primary-rgb))] transition-colors ${
                    errors.creditLimit ? 'border-red-500' : 'border-[rgb(var(--color-border-rgb))]'
                  }`}
                />
              </div>
              {errors.creditLimit && <p className="text-red-500 text-xs mt-1">{errors.creditLimit}</p>}
            </div>
          )}

          {/* Note */}
          <div>
            <label className="block text-sm font-medium text-[rgb(var(--color-text-muted-rgb))] mb-1.5">Note (optional)</label>
            <textarea
              value={form.note ?? ''}
              onChange={e => setForm(f => ({ ...f, note: e.target.value }))}
              rows={2}
              placeholder="Any notes about this account…"
              className="w-full px-3.5 py-2.5 rounded-xl border border-[rgb(var(--color-border-rgb))] bg-[rgb(var(--color-card-muted-rgb))] text-[rgb(var(--color-text-rgb))] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--color-primary-rgb))] resize-none transition-colors"
            />
          </div>

          {/* Include in net worth */}
          <label className="flex items-center gap-3 cursor-pointer select-none">
            <div
              onClick={() => setForm(f => ({ ...f, includeInNetWorth: !f.includeInNetWorth }))}
              className={`relative w-11 h-6 rounded-full transition-colors ${
                form.includeInNetWorth ? 'bg-[rgb(var(--color-primary-rgb))]' : 'bg-[rgb(var(--color-border-rgb))]'
              }`}
            >
              <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                form.includeInNetWorth ? 'translate-x-5' : 'translate-x-0.5'
              }`} />
            </div>
            <span className="text-sm text-[rgb(var(--color-text-rgb))]">Include in net worth calculation</span>
          </label>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <Button type="button" onClick={onClose} variant="ghost" size="md" className="flex-1 border border-[rgb(var(--color-border-rgb))] text-[rgb(var(--color-text-muted-rgb))] hover:bg-[rgb(var(--color-card-muted-rgb))] active:scale-[0.98]">
              Cancel
            </Button>
            <Button type="submit" size="md" className="flex-1 active:scale-[0.98]">
              {isEdit ? 'Save Changes' : 'Add Account'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ─── Account Card ─────────────────────────────────────────────────────────────

interface AccountCardProps {
  account: FinancialAccount;
  onEdit: (acc: FinancialAccount) => void;
  onDelete: (id: string) => void;
  onToggleArchive: (id: string) => void;
}

const AccountCard: React.FC<AccountCardProps> = ({ account, onEdit, onDelete, onToggleArchive }) => {
  const meta = ACCOUNT_TYPE_META[account.type];
  const isCreditCard = account.type === 'credit_card';
  const usageRatio = isCreditCard && account.creditLimit ? account.balance / account.creditLimit : null;

  return (
    <div className={`bg-[rgb(var(--color-card-rgb))] rounded-xl p-4 border border-[rgb(var(--color-border-rgb))] hover:shadow-md transition-all ${
      account.isArchived ? 'opacity-40' : ''
    }`}>
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div
          className="w-11 h-11 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
          style={{ backgroundColor: meta.color + '1a' }}
        >
          {meta.emoji}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-semibold text-[rgb(var(--color-text-rgb))] truncate">{account.name}</h3>
            {account.isArchived && (
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[rgb(var(--color-bg-rgb))] text-[rgb(var(--color-text-muted-rgb))] border border-[rgb(var(--color-border-rgb))]">Archived</span>
            )}
          </div>
          <p className="text-xs text-[rgb(var(--color-text-muted-rgb))] mt-0.5">{meta.label}</p>
          {account.note && (
            <p className="text-xs text-[rgb(var(--color-text-muted-rgb))] mt-1 truncate">{account.note}</p>
          )}
        </div>

        {/* Balance */}
        <div className="text-right flex-shrink-0">
          <p className={`font-bold tabular-nums ${isCreditCard ? 'text-red-500' : 'text-[rgb(var(--color-text-rgb))]'}`}>
            {isCreditCard ? '-' : ''}{formatCurrency(account.balance)}
          </p>
        </div>
      </div>

      {/* Credit card usage bar */}
      {isCreditCard && account.creditLimit && account.creditLimit > 0 && (
        <div className="mt-4 pt-3 border-t border-[rgb(var(--color-border-rgb))]">
          <div className="flex justify-between text-xs text-[rgb(var(--color-text-muted-rgb))] mb-1.5">
            <span>Credit used</span>
            <span>Limit: {formatCurrency(account.creditLimit)}</span>
          </div>
          <div className="w-full h-1.5 rounded-full bg-[rgb(var(--color-bg-rgb))] overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${
                (usageRatio ?? 0) >= 0.9 ? 'bg-red-500' :
                (usageRatio ?? 0) >= 0.7 ? 'bg-amber-500' :
                'bg-[rgb(var(--color-primary-rgb))]'
              }`}
              style={{ width: `${Math.min((usageRatio ?? 0) * 100, 100)}%` }}
            />
          </div>
          <p className="text-[10px] text-[rgb(var(--color-text-muted-rgb))] mt-1">
            {((usageRatio ?? 0) * 100).toFixed(0)}% used · Available: {formatCurrency(Math.max(0, account.creditLimit - account.balance))}
          </p>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-1 mt-3 pt-3 border-t border-[rgb(var(--color-border-rgb))]">
        <Button onClick={() => onToggleArchive(account.id)} variant="ghost" size="sm" title={account.isArchived ? 'Unarchive' : 'Archive'} className="text-[rgb(var(--color-text-muted-rgb))] hover:bg-[rgb(var(--color-card-muted-rgb))] hover:text-[rgb(var(--color-text-rgb))]">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d={account.isArchived
                ? 'M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4'
                : 'M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8'
              }
            />
          </svg>
        </Button>
        <Button onClick={() => onEdit(account)} variant="ghost" size="sm" title="Edit" className="text-[rgb(var(--color-text-muted-rgb))] hover:bg-[rgb(var(--color-card-muted-rgb))] hover:text-[rgb(var(--color-text-rgb))]">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
            />
          </svg>
        </Button>
        <Button onClick={() => onDelete(account.id)} variant="ghost" size="sm" title="Delete" className="text-red-500 hover:text-red-600 hover:bg-red-50">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
            />
          </svg>
        </Button>
      </div>
    </div>
  );
};

// ─── Main Page ────────────────────────────────────────────────────────────────

const ManageAccountsPage: React.FC<ManageAccountsPageProps> = ({ user, transactions = [], onUpdateUser, onAddTransaction, setActiveItem }) => {
  const accounts: FinancialAccount[] = user.financialAccounts ?? [];

  const [modalOpen, setModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<FinancialAccount | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [showArchived, setShowArchived] = useState(false);

  const activeAccounts = useMemo(() => accounts.filter(a => !a.isArchived), [user]);
  const archivedAccounts = useMemo(() => accounts.filter(a => a.isArchived), [user]);
  const visibleAccounts = showArchived ? archivedAccounts : activeAccounts;

  const handleSave = (data: Omit<FinancialAccount, 'id' | 'createdAt'> & { id?: string }) => {
    let updated: FinancialAccount[];
    if (data.id) {
      updated = accounts.map(a =>
        a.id === data.id ? { ...a, ...data } as FinancialAccount : a
      );
    } else {
      const newAcc: FinancialAccount = {
        ...data,
        id: uuidv4(),
        createdAt: new Date().toISOString(),
      };
      updated = [...accounts, newAcc];
    }
    onUpdateUser({ ...user, financialAccounts: updated });
    setModalOpen(false);
    setEditingAccount(null);
  };

  const handleEdit = (acc: FinancialAccount) => {
    setEditingAccount(acc);
    setModalOpen(true);
  };

  const handleDeleteConfirm = (id: string) => setDeleteConfirmId(id);

  const handleDeleteExecute = () => {
    if (!deleteConfirmId) return;
    const updated = accounts.filter(a => a.id !== deleteConfirmId);
    onUpdateUser({ ...user, financialAccounts: updated });
    setDeleteConfirmId(null);
  };

  const handleToggleArchive = (id: string) => {
    const updated = accounts.map(a =>
      a.id === id ? { ...a, isArchived: !a.isArchived } : a
    );
    onUpdateUser({ ...user, financialAccounts: updated });
  };

  const handleOpenAdd = () => {
    setEditingAccount(null);
    setModalOpen(true);
  };

  return (
    <div className="min-h-full bg-[rgb(var(--color-bg-rgb))] p-4 md:p-6">
      <div className="max-w-2xl mx-auto space-y-5">

        {/* Balance Card */}
        <PremiumBalanceCard
          transactions={transactions}
          accounts={accounts}
          onAddTransaction={onAddTransaction}
          setActiveItem={setActiveItem}
          className="w-full"
        />

        {/* Header row */}
        <div className="flex items-center justify-between gap-3">
          {/* Segmented Control: Active / Archived */}
          <div className="flex gap-1 bg-[rgb(var(--color-card-muted-rgb))] p-1 rounded-lg">
            <button
              onClick={() => setShowArchived(false)}
              className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                !showArchived
                  ? 'bg-[rgb(var(--color-card-rgb))] text-[rgb(var(--color-text-rgb))] shadow-sm'
                  : 'text-[rgb(var(--color-text-muted-rgb))] hover:text-[rgb(var(--color-text-rgb))]'
              }`}
            >
              {!showArchived && (
                <span className="absolute top-1.5 right-1.5 w-1 h-1 bg-[rgb(var(--color-primary-rgb))] rounded-full" />
                            )}
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                />
                          </svg>
              Active
              <span className="px-1 py-0.5 rounded-full bg-[rgb(var(--color-bg-rgb))] text-[10px] tabular-nums">
                {activeAccounts.length}
              </span>
            </button>

            {archivedAccounts.length > 0 && (
              <button
                onClick={() => setShowArchived(true)}
                className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                  showArchived
                    ? 'bg-[rgb(var(--color-card-rgb))] text-[rgb(var(--color-text-rgb))] shadow-sm'
                    : 'text-[rgb(var(--color-text-muted-rgb))] hover:text-[rgb(var(--color-text-rgb))]'
                }`}
              >
                {showArchived && (
                  <span className="absolute top-1.5 right-1.5 w-1 h-1 bg-[rgb(var(--color-primary-rgb))] rounded-full" />
                )}
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"
                  />
                </svg>
                Archived
                <span className="px-1 py-0.5 rounded-full bg-[rgb(var(--color-bg-rgb))] text-[10px] tabular-nums">
                  {archivedAccounts.length}
                </span>
              </button>
            )}
          </div>

          {/* Add Account Button */}
          <Button onClick={handleOpenAdd} size="sm" className="gap-1.5 active:scale-[0.98] text-xs">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Account
          </Button>
        </div>

        {/* Account List */}
        {visibleAccounts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center bg-[rgb(var(--color-card-rgb))] rounded-2xl border border-[rgb(var(--color-border-rgb))]">
            <div className="text-6xl mb-4">{showArchived ? '📦' : '🏦'}</div>
            <h3 className="text-lg font-semibold text-[rgb(var(--color-text-rgb))] mb-2">
              {showArchived ? 'No archived accounts' : 'No accounts yet'}
            </h3>
            <p className="text-sm text-[rgb(var(--color-text-muted-rgb))] max-w-xs mb-6">
              {showArchived
                ? 'Archived accounts will appear here.'
                : 'Add your bank accounts, credit cards, piggy banks and more to track your finances in one place.'}
            </p>
            {!showArchived && (
              <Button onClick={handleOpenAdd} size="md" className="active:scale-[0.98]">
                Add Your First Account
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {visibleAccounts.map(acc => (
              <AccountCard
                key={acc.id}
                account={acc}
                onEdit={handleEdit}
                onDelete={handleDeleteConfirm}
                onToggleArchive={handleToggleArchive}
              />
            ))}
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {modalOpen && (
        <AccountFormModal
          account={editingAccount}
          onSave={handleSave}
          onClose={() => { setModalOpen(false); setEditingAccount(null); }}
        />
      )}

      {/* Delete Confirmation */}
      {deleteConfirmId && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={(e) => { if (e.target === e.currentTarget) setDeleteConfirmId(null); }}
        >
          <div className="bg-[rgb(var(--color-card-rgb))] rounded-2xl p-6 max-w-sm w-full shadow-2xl">
            <div className="text-4xl mb-3 text-center">🗑️</div>
            <h3 className="text-lg font-semibold text-[rgb(var(--color-text-rgb))] text-center mb-2">Delete Account?</h3>
            <p className="text-sm text-[rgb(var(--color-text-muted-rgb))] text-center mb-6">
              This will permanently delete the account. Past transactions linked to it will remain but lose their account reference.
            </p>
            <div className="flex gap-3">
              <Button onClick={() => setDeleteConfirmId(null)} variant="secondary" size="md" className="flex-1 active:scale-[0.98]">
                Cancel
              </Button>
              <Button onClick={handleDeleteExecute} variant="danger" size="md" className="flex-1 active:scale-[0.98] shadow-sm">
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageAccountsPage;
