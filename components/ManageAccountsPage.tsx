import React, { useState, useMemo } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { FinancialAccount, AccountType, ACCOUNT_TYPE_META, User } from '../types';
import { formatCurrency } from '../utils/formatters';

interface ManageAccountsPageProps {
  user: User;
  onUpdateUser: (user: User) => void;
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
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-[rgb(var(--color-card-rgb))] w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl shadow-2xl max-h-[90dvh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-[rgb(var(--color-border-rgb))]">
          <h2 className="text-lg font-semibold text-[rgb(var(--color-text-rgb))]">
            {isEdit ? 'Edit Account' : 'Add Account'}
          </h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-[rgb(var(--color-bg-rgb))] text-[rgb(var(--color-text-muted-rgb))] transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">

          {/* Account Type Selector */}
          <div>
            <label className="block text-sm font-medium text-[rgb(var(--color-text-muted-rgb))] mb-2">Account Type</label>
            <div className="grid grid-cols-2 gap-2">
              {ACCOUNT_TYPES.map(([type, m]) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setForm(f => ({ ...f, type }))}
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border-2 text-left transition-all ${
                    form.type === type
                      ? 'border-[rgb(var(--color-primary-rgb))] bg-[rgba(var(--color-primary-rgb),0.08)]'
                      : 'border-[rgb(var(--color-border-rgb))] hover:border-[rgb(var(--color-primary-rgb))]/50'
                  }`}
                >
                  <span className="text-xl">{m.emoji}</span>
                  <span className="text-sm font-medium text-[rgb(var(--color-text-rgb))]">{m.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-[rgb(var(--color-text-muted-rgb))] mb-1">Account Name *</label>
            <input
              type="text"
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              placeholder={`e.g. My ${meta.label}`}
              className={`w-full px-3 py-2 rounded-xl border bg-[rgb(var(--color-bg-rgb))] text-[rgb(var(--color-text-rgb))] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--color-primary-rgb))] transition-colors ${
                errors.name ? 'border-red-500' : 'border-[rgb(var(--color-border-rgb))]'
              }`}
            />
            {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
          </div>

          {/* Balance */}
          <div>
            <label className="block text-sm font-medium text-[rgb(var(--color-text-muted-rgb))] mb-1">
              {form.type === 'credit_card' ? 'Current Balance (amount owed)' : 'Current Balance'}
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[rgb(var(--color-text-muted-rgb))] font-medium">$</span>
              <input
                type="number"
                step="0.01"
                value={form.balance}
                onChange={e => setForm(f => ({ ...f, balance: parseFloat(e.target.value) || 0 }))}
                className={`w-full pl-7 pr-3 py-2 rounded-xl border bg-[rgb(var(--color-bg-rgb))] text-[rgb(var(--color-text-rgb))] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--color-primary-rgb))] transition-colors ${
                  errors.balance ? 'border-red-500' : 'border-[rgb(var(--color-border-rgb))]'
                }`}
              />
            </div>
            {errors.balance && <p className="text-red-500 text-xs mt-1">{errors.balance}</p>}
          </div>

          {/* Credit Limit (credit card only) */}
          {form.type === 'credit_card' && (
            <div>
              <label className="block text-sm font-medium text-[rgb(var(--color-text-muted-rgb))] mb-1">Credit Limit (optional)</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[rgb(var(--color-text-muted-rgb))] font-medium">$</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.creditLimit ?? ''}
                  onChange={e => setForm(f => ({ ...f, creditLimit: e.target.value ? parseFloat(e.target.value) : undefined }))}
                  placeholder="e.g. 10000"
                  className={`w-full pl-7 pr-3 py-2 rounded-xl border bg-[rgb(var(--color-bg-rgb))] text-[rgb(var(--color-text-rgb))] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--color-primary-rgb))] transition-colors ${
                    errors.creditLimit ? 'border-red-500' : 'border-[rgb(var(--color-border-rgb))]'
                  }`}
                />
              </div>
              {errors.creditLimit && <p className="text-red-500 text-xs mt-1">{errors.creditLimit}</p>}
            </div>
          )}

          {/* Note */}
          <div>
            <label className="block text-sm font-medium text-[rgb(var(--color-text-muted-rgb))] mb-1">Note (optional)</label>
            <textarea
              value={form.note ?? ''}
              onChange={e => setForm(f => ({ ...f, note: e.target.value }))}
              rows={2}
              placeholder="Any notes about this account…"
              className="w-full px-3 py-2 rounded-xl border border-[rgb(var(--color-border-rgb))] bg-[rgb(var(--color-bg-rgb))] text-[rgb(var(--color-text-rgb))] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--color-primary-rgb))] resize-none transition-colors"
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
          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-[rgb(var(--color-border-rgb))] text-[rgb(var(--color-text-muted-rgb))] font-medium hover:bg-[rgb(var(--color-bg-rgb))] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 rounded-xl bg-[rgb(var(--color-primary-rgb))] text-white font-semibold hover:opacity-90 transition-opacity"
            >
              {isEdit ? 'Save Changes' : 'Add Account'}
            </button>
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
    <div className={`bg-[rgb(var(--color-card-rgb))] rounded-2xl p-4 border border-[rgb(var(--color-border-rgb))] shadow-sm transition-all hover:shadow-md ${
      account.isArchived ? 'opacity-50' : ''
    }`}>
      <div className="flex items-start justify-between gap-3">
        {/* Left: icon + info */}
        <div className="flex items-center gap-3 min-w-0">
          <div
            className="w-11 h-11 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
            style={{ background: meta.color + '22' }}
          >
            {meta.emoji}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-[rgb(var(--color-text-rgb))] truncate">{account.name}</h3>
              {account.isArchived && (
                <span className="text-xs px-1.5 py-0.5 rounded-full bg-[rgb(var(--color-bg-rgb))] text-[rgb(var(--color-text-muted-rgb))] border border-[rgb(var(--color-border-rgb))]">Archived</span>
              )}
            </div>
            <p className="text-xs text-[rgb(var(--color-text-muted-rgb))] mt-0.5">{meta.label}</p>
            {account.note && (
              <p className="text-xs text-[rgb(var(--color-text-muted-rgb))] mt-0.5 truncate">{account.note}</p>
            )}
          </div>
        </div>

        {/* Right: balance + actions */}
        <div className="flex flex-col items-end gap-2 flex-shrink-0">
          <p className={`font-bold text-lg tabular-nums ${
            isCreditCard ? 'text-red-500' : 'text-[rgb(var(--color-text-rgb))]'
          }`}>
            {isCreditCard ? '-' : ''}{formatCurrency(account.balance)}
          </p>
          <div className="flex gap-1">
            <button
              onClick={() => onToggleArchive(account.id)}
              title={account.isArchived ? 'Unarchive' : 'Archive'}
              className="p-1.5 rounded-lg hover:bg-[rgb(var(--color-bg-rgb))] text-[rgb(var(--color-text-muted-rgb))] transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d={account.isArchived
                    ? 'M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4'
                    : 'M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8'
                  }
                />
              </svg>
            </button>
            <button
              onClick={() => onEdit(account)}
              className="p-1.5 rounded-lg hover:bg-[rgb(var(--color-bg-rgb))] text-[rgb(var(--color-text-muted-rgb))] transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                />
              </svg>
            </button>
            <button
              onClick={() => onDelete(account.id)}
              className="p-1.5 rounded-lg hover:bg-red-50 hover:text-red-500 text-[rgb(var(--color-text-muted-rgb))] transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Credit card usage bar */}
      {isCreditCard && account.creditLimit && account.creditLimit > 0 && (
        <div className="mt-3">
          <div className="flex justify-between text-xs text-[rgb(var(--color-text-muted-rgb))] mb-1">
            <span>Used: {formatCurrency(account.balance)}</span>
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
          <p className="text-xs text-[rgb(var(--color-text-muted-rgb))] mt-1">
            {((usageRatio ?? 0) * 100).toFixed(0)}% used · Available: {formatCurrency(Math.max(0, account.creditLimit - account.balance))}
          </p>
        </div>
      )}
    </div>
  );
};

// ─── Main Page ────────────────────────────────────────────────────────────────

const ManageAccountsPage: React.FC<ManageAccountsPageProps> = ({ user, onUpdateUser }) => {
  const accounts: FinancialAccount[] = user.financialAccounts ?? [];

  const [modalOpen, setModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<FinancialAccount | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [showArchived, setShowArchived] = useState(false);

  const activeAccounts = useMemo(() => accounts.filter(a => !a.isArchived), [accounts]);
  const archivedAccounts = useMemo(() => accounts.filter(a => a.isArchived), [accounts]);
  const visibleAccounts = showArchived ? archivedAccounts : activeAccounts;

  const netWorth = useMemo(() => {
    return accounts
      .filter(a => !a.isArchived && a.includeInNetWorth)
      .reduce((sum, a) => {
        return a.type === 'credit_card' ? sum - a.balance : sum + a.balance;
      }, 0);
  }, [accounts]);

  const totalAssets = useMemo(() => {
    return accounts
      .filter(a => !a.isArchived && a.includeInNetWorth && a.type !== 'credit_card')
      .reduce((sum, a) => sum + a.balance, 0);
  }, [accounts]);

  const totalLiabilities = useMemo(() => {
    return accounts
      .filter(a => !a.isArchived && a.includeInNetWorth && a.type === 'credit_card')
      .reduce((sum, a) => sum + a.balance, 0);
  }, [accounts]);

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

        {/* Net Worth Summary Card */}
        <div className="bg-[rgb(var(--color-card-rgb))] rounded-2xl p-5 border border-[rgb(var(--color-border-rgb))] shadow-sm">
          <p className="text-sm text-[rgb(var(--color-text-muted-rgb))] mb-1">Net Worth</p>
          <p className={`text-3xl font-bold tabular-nums mb-4 ${
            netWorth >= 0 ? 'text-[rgb(var(--color-primary-rgb))]' : 'text-red-500'
          }`}>
            {formatCurrency(netWorth)}
          </p>
          <div className="flex gap-4">
            <div className="flex-1 bg-[rgb(var(--color-bg-rgb))] rounded-xl p-3">
              <p className="text-xs text-[rgb(var(--color-text-muted-rgb))]" >Total Assets</p>
              <p className="text-lg font-semibold text-green-500 tabular-nums">{formatCurrency(totalAssets)}</p>
            </div>
            <div className="flex-1 bg-[rgb(var(--color-bg-rgb))] rounded-xl p-3">
              <p className="text-xs text-[rgb(var(--color-text-muted-rgb))]">Total Liabilities</p>
              <p className="text-lg font-semibold text-red-500 tabular-nums">{formatCurrency(totalLiabilities)}</p>
            </div>
          </div>
        </div>

        {/* Header row */}
        <div className="flex items-center justify-between">
          <div className="flex gap-2">
            <button
              onClick={() => setShowArchived(false)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                !showArchived
                  ? 'bg-[rgb(var(--color-primary-rgb))] text-white'
                  : 'text-[rgb(var(--color-text-muted-rgb))] hover:bg-[rgb(var(--color-bg-rgb))]'
              }`}
            >
              Active ({activeAccounts.length})
            </button>
            {archivedAccounts.length > 0 && (
              <button
                onClick={() => setShowArchived(true)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  showArchived
                    ? 'bg-[rgb(var(--color-primary-rgb))] text-white'
                    : 'text-[rgb(var(--color-text-muted-rgb))] hover:bg-[rgb(var(--color-bg-rgb))]'
                }`}
              >
                Archived ({archivedAccounts.length})
              </button>
            )}
          </div>
          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[rgb(var(--color-primary-rgb))] text-white font-semibold text-sm hover:opacity-90 transition-opacity"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Account
          </button>
        </div>

        {/* Account List */}
        {visibleAccounts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="text-5xl mb-4">{showArchived ? '📦' : '🏦'}</div>
            <h3 className="text-lg font-semibold text-[rgb(var(--color-text-rgb))] mb-2">
              {showArchived ? 'No archived accounts' : 'No accounts yet'}
            </h3>
            <p className="text-sm text-[rgb(var(--color-text-muted-rgb))] max-w-xs mb-6">
              {showArchived
                ? 'Archived accounts will appear here.'
                : 'Add your bank accounts, credit cards, piggy banks and more to track your finances in one place.'}
            </p>
            {!showArchived && (
              <button
                onClick={handleOpenAdd}
                className="px-5 py-2.5 rounded-xl bg-[rgb(var(--color-primary-rgb))] text-white font-semibold hover:opacity-90 transition-opacity"
              >
                Add Your First Account
              </button>
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
            <div className="text-3xl mb-3 text-center">🗑️</div>
            <h3 className="text-lg font-semibold text-[rgb(var(--color-text-rgb))] text-center mb-2">Delete Account?</h3>
            <p className="text-sm text-[rgb(var(--color-text-muted-rgb))] text-center mb-5">
              This will permanently delete the account. Past transactions linked to it will remain but lose their account reference.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="flex-1 py-2.5 rounded-xl border border-[rgb(var(--color-border-rgb))] text-[rgb(var(--color-text-muted-rgb))] font-medium hover:bg-[rgb(var(--color-bg-rgb))] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteExecute}
                className="flex-1 py-2.5 rounded-xl bg-red-500 text-white font-semibold hover:bg-red-600 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageAccountsPage;
