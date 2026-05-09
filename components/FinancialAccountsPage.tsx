import React, { useState, useEffect, useCallback } from 'react';
import { FinancialAccount, AccountType, ACCOUNT_TYPE_META, User } from '../types';
import { useTheme } from './ThemeContext';

interface Props {
  user: User | null;
  onUpdateUser: (updatedUser: User) => Promise<void>;
}

const PRESET_COLORS = [
  '#22c55e', '#3b82f6', '#ef4444', '#f59e0b',
  '#8b5cf6', '#ec4899', '#06b6d4', '#6b7280',
  '#f97316', '#14b8a6',
];

const generateId = () => Math.random().toString(36).slice(2) + Date.now().toString(36);

const defaultFormState = () => ({
  name: '',
  type: 'cash' as AccountType,
  balance: '',
  color: '#22c55e',
  note: '',
  creditLimit: '',
  includeInNetWorth: true,
});

const FinancialAccountsPage: React.FC<Props> = ({ user, onUpdateUser }) => {
  const { theme } = useTheme();
  const [accounts, setAccounts] = useState<FinancialAccount[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingAccount, setEditingAccount] = useState<FinancialAccount | null>(null);
  const [form, setForm] = useState(defaultFormState());
  const [showArchived, setShowArchived] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const accs = user?.financialAccounts || [];
    if (accs.length === 0) {
      // create default Cash account on first load
      const defaultAcc: FinancialAccount = {
        id: generateId(),
        name: 'Cash',
        type: 'cash',
        balance: 0,
        color: '#22c55e',
        createdAt: new Date().toISOString(),
        includeInNetWorth: true,
      };
      const updated = { ...user!, financialAccounts: [defaultAcc] };
      onUpdateUser(updated);
      setAccounts([defaultAcc]);
    } else {
      setAccounts(accs);
    }
  }, [user?.financialAccounts?.length]);

  const activeAccounts = accounts.filter(a => !a.isArchived);
  const archivedAccounts = accounts.filter(a => a.isArchived);
  const totalBalance = activeAccounts.reduce((sum, a) => sum + a.balance, 0);
  const totalNetWorth = activeAccounts
    .filter(a => a.includeInNetWorth !== false)
    .reduce((sum, a) => {
      if (a.type === 'credit_card') return sum - Math.max(0, -a.balance);
      return sum + a.balance;
    }, 0);

  const openAdd = () => {
    setEditingAccount(null);
    setForm(defaultFormState());
    setShowModal(true);
  };

  const openEdit = (acc: FinancialAccount) => {
    setEditingAccount(acc);
    setForm({
      name: acc.name,
      type: acc.type,
      balance: acc.balance.toString(),
      color: acc.color || ACCOUNT_TYPE_META[acc.type].color,
      note: acc.note || '',
      creditLimit: acc.creditLimit?.toString() || '',
      includeInNetWorth: acc.includeInNetWorth !== false,
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      const balanceNum = parseFloat(form.balance) || 0;
      let updatedAccounts: FinancialAccount[];
      if (editingAccount) {
        updatedAccounts = accounts.map(a =>
          a.id === editingAccount.id
            ? {
                ...a,
                name: form.name.trim(),
                type: form.type,
                balance: balanceNum,
                color: form.color,
                note: form.note,
                creditLimit: form.type === 'credit_card' ? (parseFloat(form.creditLimit) || undefined) : undefined,
                includeInNetWorth: form.includeInNetWorth,
              }
            : a
        );
      } else {
        const newAcc: FinancialAccount = {
          id: generateId(),
          name: form.name.trim(),
          type: form.type,
          balance: balanceNum,
          color: form.color,
          note: form.note,
          createdAt: new Date().toISOString(),
          creditLimit: form.type === 'credit_card' ? (parseFloat(form.creditLimit) || undefined) : undefined,
          includeInNetWorth: form.includeInNetWorth,
        };
        updatedAccounts = [...accounts, newAcc];
      }
      await onUpdateUser({ ...user!, financialAccounts: updatedAccounts });
      setAccounts(updatedAccounts);
      setShowModal(false);
    } finally {
      setSaving(false);
    }
  };

  const handleArchive = async (id: string) => {
    const updated = accounts.map(a => a.id === id ? { ...a, isArchived: !a.isArchived } : a);
    await onUpdateUser({ ...user!, financialAccounts: updated });
    setAccounts(updated);
  };

  const handleDelete = async (id: string) => {
    const updated = accounts.filter(a => a.id !== id);
    await onUpdateUser({ ...user!, financialAccounts: updated });
    setAccounts(updated);
    setDeleteConfirm(null);
  };

  const fmt = (n: number) => {
    const abs = Math.abs(n);
    const str = abs.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    return n < 0 ? `-${str}` : str;
  };

  return (
    <div className={`min-h-screen ${theme}`} style={{ background: 'rgb(var(--color-bg-rgb))', paddingBottom: '100px' }}>
      {/* Header */}
      <div className="sticky top-0 z-10 px-4 pt-4 pb-3"
        style={{ background: 'rgba(var(--color-bg-rgb),0.92)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="flex items-center justify-between max-w-2xl mx-auto">
          <div>
            <h1 className="text-lg font-bold" style={{ color: 'rgb(var(--color-text-rgb))' }}>Accounts</h1>
            <p className="text-xs mt-0.5" style={{ color: 'rgb(var(--color-text-muted-rgb))' }}>Manage your financial accounts</p>
          </div>
          <button
            onClick={openAdd}
            className="flex items-center gap-1.5 px-4 py-2 rounded-2xl text-sm font-semibold text-white transition-all active:scale-95"
            style={{ background: 'linear-gradient(135deg, rgb(var(--color-primary-rgb)), rgb(var(--color-primary-rgb)) 60%, rgba(var(--color-primary-rgb),0.8))' }}
          >
            <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
            </svg>
            Add Account
          </button>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 pt-4 space-y-4">
        {/* Summary Card */}
        <div className="rounded-3xl p-5"
          style={{ background: 'linear-gradient(135deg, rgb(var(--color-primary-rgb)) 0%, rgba(var(--color-primary-rgb),0.7) 100%)', boxShadow: '0 8px 32px rgba(var(--color-primary-rgb),0.3)' }}>
          <p className="text-xs font-semibold text-white/70 uppercase tracking-widest">Total Balance</p>
          <p className="text-3xl font-bold text-white mt-1">{fmt(totalBalance)}</p>
          <div className="flex gap-4 mt-3">
            <div>
              <p className="text-xs text-white/60">Net Worth (accounts)</p>
              <p className="text-sm font-bold text-white">{fmt(totalNetWorth)}</p>
            </div>
            <div>
              <p className="text-xs text-white/60">Active accounts</p>
              <p className="text-sm font-bold text-white">{activeAccounts.length}</p>
            </div>
          </div>
        </div>

        {/* Account List */}
        {activeAccounts.length === 0 && (
          <div className="flex flex-col items-center py-12 text-center">
            <span className="text-5xl mb-3">💼</span>
            <p className="font-semibold" style={{ color: 'rgb(var(--color-text-rgb))' }}>No accounts yet</p>
            <p className="text-sm mt-1" style={{ color: 'rgb(var(--color-text-muted-rgb))' }}>Add your first account to get started</p>
          </div>
        )}

        {activeAccounts.map(acc => {
          const meta = ACCOUNT_TYPE_META[acc.type];
          const color = acc.color || meta.color;
          const isCreditCard = acc.type === 'credit_card';
          const usedAmount = isCreditCard ? Math.max(0, -acc.balance) : 0;
          const usagePct = isCreditCard && acc.creditLimit ? Math.min(100, (usedAmount / acc.creditLimit) * 100) : 0;

          return (
            <div key={acc.id}
              className="rounded-2xl p-4"
              style={{ background: 'rgb(var(--color-card-rgb))', border: '1px solid rgba(255,255,255,0.06)', boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }}
            >
              <div className="flex items-center gap-3">
                {/* Icon */}
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0"
                  style={{ background: color + '22', border: `1.5px solid ${color}44` }}>
                  {meta.emoji}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold truncate" style={{ color: 'rgb(var(--color-text-rgb))' }}>{acc.name}</p>
                    <span className="text-xs px-2 py-0.5 rounded-full flex-shrink-0"
                      style={{ background: color + '22', color }}>
                      {meta.label}
                    </span>
                  </div>
                  <p className={`text-lg font-bold mt-0.5 ${acc.balance < 0 ? 'text-red-500' : ''}`}
                    style={acc.balance >= 0 ? { color } : undefined}>
                    {acc.balance < 0 ? '-' : ''}{fmt(Math.abs(acc.balance))}
                  </p>
                  {acc.note && <p className="text-xs mt-0.5 truncate" style={{ color: 'rgb(var(--color-text-muted-rgb))' }}>{acc.note}</p>}
                </div>

                {/* Actions */}
                <div className="flex gap-1 flex-shrink-0">
                  <button onClick={() => openEdit(acc)}
                    className="w-8 h-8 rounded-xl flex items-center justify-center transition-all active:scale-90"
                    style={{ background: 'rgba(var(--color-text-muted-rgb),0.1)' }}>
                    <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: 'rgb(var(--color-text-muted-rgb))' }}>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button onClick={() => setDeleteConfirm(acc.id)}
                    className="w-8 h-8 rounded-xl flex items-center justify-center transition-all active:scale-90"
                    style={{ background: 'rgba(239,68,68,0.1)' }}>
                    <svg width="14" height="14" fill="none" stroke="#ef4444" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Credit Card Usage Bar */}
              {isCreditCard && acc.creditLimit && (
                <div className="mt-3">
                  <div className="flex justify-between text-xs mb-1" style={{ color: 'rgb(var(--color-text-muted-rgb))' }}>
                    <span>Used: {fmt(usedAmount)}</span>
                    <span>Limit: {fmt(acc.creditLimit)}</span>
                  </div>
                  <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(var(--color-text-muted-rgb),0.15)' }}>
                    <div className="h-full rounded-full transition-all"
                      style={{
                        width: `${usagePct}%`,
                        background: usagePct > 80 ? '#ef4444' : usagePct > 60 ? '#f59e0b' : '#22c55e'
                      }} />
                  </div>
                  <p className="text-xs mt-1" style={{ color: 'rgb(var(--color-text-muted-rgb))' }}>{usagePct.toFixed(0)}% used</p>
                </div>
              )}
            </div>
          );
        })}

        {/* Archived section */}
        {archivedAccounts.length > 0 && (
          <div>
            <button onClick={() => setShowArchived(v => !v)}
              className="flex items-center gap-2 text-sm font-medium py-2"
              style={{ color: 'rgb(var(--color-text-muted-rgb))' }}>
              <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"
                style={{ transform: showArchived ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s' }}>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
              Archived Accounts ({archivedAccounts.length})
            </button>
            {showArchived && archivedAccounts.map(acc => (
              <div key={acc.id} className="rounded-2xl p-3 mb-2 flex items-center gap-3 opacity-60"
                style={{ background: 'rgb(var(--color-card-rgb))', border: '1px solid rgba(255,255,255,0.04)' }}>
                <span className="text-xl">{ACCOUNT_TYPE_META[acc.type].emoji}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate" style={{ color: 'rgb(var(--color-text-rgb))' }}>{acc.name}</p>
                  <p className="text-xs" style={{ color: 'rgb(var(--color-text-muted-rgb))' }}>Archived</p>
                </div>
                <button onClick={() => handleArchive(acc.id)}
                  className="text-xs px-3 py-1.5 rounded-xl font-medium"
                  style={{ background: 'rgba(var(--color-primary-rgb),0.15)', color: 'rgb(var(--color-primary-rgb))' }}>
                  Unarchive
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)' }}
          onClick={e => { if (e.target === e.currentTarget) setShowModal(false); }}>
          <div className="w-full max-w-md rounded-3xl p-5 space-y-4"
            style={{ background: 'rgb(var(--color-card-rgb))', boxShadow: '0 24px 80px rgba(0,0,0,0.3)', maxHeight: '90dvh', overflowY: 'auto' }}>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold" style={{ color: 'rgb(var(--color-text-rgb))' }}>
                {editingAccount ? 'Edit Account' : 'New Account'}
              </h2>
              <button onClick={() => setShowModal(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center"
                style={{ background: 'rgba(var(--color-text-muted-rgb),0.1)' }}>
                <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24"
                  style={{ color: 'rgb(var(--color-text-muted-rgb))' }}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Account Type */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest mb-2" style={{ color: 'rgb(var(--color-text-muted-rgb))' }}>Account Type</label>
              <div className="grid grid-cols-4 gap-2">
                {(Object.keys(ACCOUNT_TYPE_META) as AccountType[]).map(t => {
                  const m = ACCOUNT_TYPE_META[t];
                  const isActive = form.type === t;
                  return (
                    <button key={t} type="button"
                      onClick={() => setForm(f => ({ ...f, type: t, color: isActive ? f.color : m.color }))}
                      className="flex flex-col items-center gap-1 py-2 px-1 rounded-2xl text-center transition-all active:scale-95"
                      style={{
                        background: isActive ? m.color + '22' : 'rgba(var(--color-text-muted-rgb),0.07)',
                        border: isActive ? `1.5px solid ${m.color}66` : '1.5px solid transparent',
                      }}>
                      <span className="text-xl">{m.emoji}</span>
                      <span className="text-[10px] font-medium leading-tight" style={{ color: isActive ? m.color : 'rgb(var(--color-text-muted-rgb))' }}>{m.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Name */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest mb-1.5" style={{ color: 'rgb(var(--color-text-muted-rgb))' }}>Account Name *</label>
              <input
                type="text"
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder={`e.g. My ${ACCOUNT_TYPE_META[form.type].label}`}
                className="w-full rounded-2xl px-4 py-3 text-sm font-medium outline-none transition-all"
                style={{ background: 'rgba(var(--color-text-muted-rgb),0.08)', color: 'rgb(var(--color-text-rgb))', border: '1px solid rgba(255,255,255,0.06)' }}
              />
            </div>

            {/* Balance */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest mb-1.5" style={{ color: 'rgb(var(--color-text-muted-rgb))' }}>
                {form.type === 'credit_card' ? 'Current Balance (negative = owed)' : 'Current Balance'}
              </label>
              <input
                type="number"
                value={form.balance}
                onChange={e => setForm(f => ({ ...f, balance: e.target.value }))}
                placeholder="0.00"
                className="w-full rounded-2xl px-4 py-3 text-sm font-medium outline-none transition-all"
                style={{ background: 'rgba(var(--color-text-muted-rgb),0.08)', color: 'rgb(var(--color-text-rgb))', border: '1px solid rgba(255,255,255,0.06)' }}
              />
            </div>

            {/* Credit Limit (credit card only) */}
            {form.type === 'credit_card' && (
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest mb-1.5" style={{ color: 'rgb(var(--color-text-muted-rgb))' }}>Credit Limit</label>
                <input
                  type="number"
                  value={form.creditLimit}
                  onChange={e => setForm(f => ({ ...f, creditLimit: e.target.value }))}
                  placeholder="e.g. 50000"
                  className="w-full rounded-2xl px-4 py-3 text-sm font-medium outline-none transition-all"
                  style={{ background: 'rgba(var(--color-text-muted-rgb),0.08)', color: 'rgb(var(--color-text-rgb))', border: '1px solid rgba(255,255,255,0.06)' }}
                />
              </div>
            )}

            {/* Color */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest mb-2" style={{ color: 'rgb(var(--color-text-muted-rgb))' }}>Color</label>
              <div className="flex gap-2 flex-wrap">
                {PRESET_COLORS.map(c => (
                  <button key={c} type="button"
                    onClick={() => setForm(f => ({ ...f, color: c }))}
                    className="w-8 h-8 rounded-full transition-all active:scale-90"
                    style={{ background: c, outline: form.color === c ? `3px solid ${c}` : 'none', outlineOffset: '2px' }} />
                ))}
              </div>
            </div>

            {/* Note */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest mb-1.5" style={{ color: 'rgb(var(--color-text-muted-rgb))' }}>Note (optional)</label>
              <input
                type="text"
                value={form.note}
                onChange={e => setForm(f => ({ ...f, note: e.target.value }))}
                placeholder="e.g. Personal savings"
                className="w-full rounded-2xl px-4 py-3 text-sm font-medium outline-none transition-all"
                style={{ background: 'rgba(var(--color-text-muted-rgb),0.08)', color: 'rgb(var(--color-text-rgb))', border: '1px solid rgba(255,255,255,0.06)' }}
              />
            </div>

            {/* Include in net worth */}
            <div className="flex items-center gap-3">
              <button type="button"
                onClick={() => setForm(f => ({ ...f, includeInNetWorth: !f.includeInNetWorth }))}
                className="w-10 h-6 rounded-full transition-all relative flex-shrink-0"
                style={{ background: form.includeInNetWorth ? 'rgb(var(--color-primary-rgb))' : 'rgba(var(--color-text-muted-rgb),0.3)' }}>
                <span className="absolute top-1 transition-all w-4 h-4 rounded-full bg-white shadow"
                  style={{ left: form.includeInNetWorth ? '22px' : '2px' }} />
              </button>
              <span className="text-sm" style={{ color: 'rgb(var(--color-text-rgb))' }}>Include in Net Worth</span>
            </div>

            {/* Footer Buttons */}
            <div className="flex gap-2 pt-1">
              <button onClick={() => setShowModal(false)}
                className="flex-1 py-3 rounded-2xl text-sm font-semibold transition-all active:scale-95"
                style={{ background: 'rgba(var(--color-text-muted-rgb),0.1)', color: 'rgb(var(--color-text-muted-rgb))' }}>
                Cancel
              </button>
              <button onClick={handleSave} disabled={!form.name.trim() || saving}
                className="flex-1 py-3 rounded-2xl text-sm font-bold text-white transition-all active:scale-95 disabled:opacity-50"
                style={{ background: `linear-gradient(135deg, ${form.color}, ${form.color}cc)`, boxShadow: `0 4px 16px ${form.color}44` }}>
                {saving ? 'Saving…' : editingAccount ? 'Save Changes' : 'Add Account'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)' }}>
          <div className="w-full max-w-sm rounded-3xl p-5 space-y-4"
            style={{ background: 'rgb(var(--color-card-rgb))' }}>
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto" style={{ background: 'rgba(239,68,68,0.15)' }}>
              <svg width="22" height="22" fill="none" stroke="#ef4444" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </div>
            <div className="text-center">
              <p className="font-bold" style={{ color: 'rgb(var(--color-text-rgb))' }}>Delete Account?</p>
              <p className="text-sm mt-1" style={{ color: 'rgb(var(--color-text-muted-rgb))' }}>This cannot be undone. Transactions linked to this account will remain.</p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setDeleteConfirm(null)}
                className="flex-1 py-3 rounded-2xl text-sm font-semibold"
                style={{ background: 'rgba(var(--color-text-muted-rgb),0.1)', color: 'rgb(var(--color-text-muted-rgb))' }}>
                Cancel
              </button>
              <button onClick={() => handleDelete(deleteConfirm)}
                className="flex-1 py-3 rounded-2xl text-sm font-bold text-white"
                style={{ background: '#ef4444' }}>
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FinancialAccountsPage;
