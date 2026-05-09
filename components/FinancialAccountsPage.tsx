// src/components/FinancialAccountsPage.tsx
import React, { useState, useMemo } from 'react';
import { User, Transaction, Budget, Goal, DebtEntry } from '../types';
import { formatCurrency } from '../utils/formatters';

interface Props {
  user: User;
  transactions: Transaction[];
  budgets: Budget[];
  goals: Goal[];
  debts: DebtEntry[];
  onUpdateUser: (user: User) => void;
  onOpenConfirmModal: (
    title: string,
    message: string,
    onConfirm: () => void,
    options?: { confirmText?: string; variant?: 'primary' | 'danger' }
  ) => void;
  onExportData: () => void;
  onImportData: (data: any) => void;
  setActiveItem: (item: string) => void;
}

// ─── Sub-components ─────────────────────────────────────────────────────────

const SectionHeader: React.FC<{ title: string; className?: string }> = ({ title, className }) => (
  <h3 className={`text-xs font-semibold tracking-widest uppercase mb-2 px-1 ${className ?? 'text-[rgb(var(--color-text-muted-rgb))]'}`}>
    {title}
  </h3>
);

const SettingRow: React.FC<{
  icon: string;
  label: string;
  sublabel?: string;
  value?: string;
  onClick?: () => void;
  rightElement?: React.ReactNode;
  danger?: boolean;
}> = ({ icon, label, sublabel, value, onClick, rightElement, danger }) => (
  <button
    onClick={onClick}
    disabled={!onClick && !rightElement}
    className={`w-full flex items-center gap-3 px-4 py-3.5 text-left transition-colors
      ${onClick ? 'hover:bg-[rgb(var(--color-surface-hover-rgb,var(--color-bg-rgb)))] active:opacity-70 cursor-pointer' : 'cursor-default'}
      ${danger ? 'text-red-500 dark:text-red-400' : ''}
    `}
  >
    <span className="text-xl w-8 text-center select-none">{icon}</span>
    <div className="flex-1 min-w-0">
      <div className={`text-sm font-medium ${danger ? 'text-red-500 dark:text-red-400' : 'text-[rgb(var(--color-text-rgb))]'}`}>
        {label}
      </div>
      {sublabel && (
        <div className="text-xs text-[rgb(var(--color-text-muted-rgb))] mt-0.5 truncate">{sublabel}</div>
      )}
    </div>
    {value && (
      <span className="text-sm text-[rgb(var(--color-text-muted-rgb))] shrink-0">{value}</span>
    )}
    {rightElement}
    {onClick && !rightElement && (
      <svg className="w-4 h-4 text-[rgb(var(--color-text-muted-rgb))] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
      </svg>
    )}
  </button>
);

const Card: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => (
  <div className={`bg-[rgb(var(--color-surface-rgb))] rounded-2xl overflow-hidden border border-[rgb(var(--color-border-rgb))] shadow-sm ${className ?? ''}`}>
    {children}
  </div>
);

const Divider = () => (
  <div className="h-px bg-[rgb(var(--color-border-rgb))] mx-4" />
);

// ─── Toggle Switch ────────────────────────────────────────────────────────────
const Toggle: React.FC<{ checked: boolean; onChange: (v: boolean) => void }> = ({ checked, onChange }) => (
  <button
    role="switch"
    aria-checked={checked}
    onClick={() => onChange(!checked)}
    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--color-primary-rgb))]
      ${checked ? 'bg-[rgb(var(--color-primary-rgb))]' : 'bg-gray-300 dark:bg-gray-600'}`}
  >
    <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-6' : 'translate-x-1'}`} />
  </button>
);

// ─── Profile Hero ─────────────────────────────────────────────────────────────
const ProfileHero: React.FC<{ user: User; onEditName: () => void }> = ({ user, onEditName }) => {
  const initials = (user.username ?? 'U').slice(0, 2).toUpperCase();
  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[rgb(var(--color-primary-rgb))] to-[rgb(var(--color-primary-hover-rgb,var(--color-primary-rgb)))] p-6 text-white shadow-lg">
      <div className="absolute inset-0 opacity-10">
        <svg width="100%" height="100%">
          <defs>
            <pattern id="heroPattern" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
              <circle cx="20" cy="20" r="1.5" fill="currentColor" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#heroPattern)" />
        </svg>
      </div>
      <div className="relative flex items-center gap-4">
        <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center text-2xl font-bold select-none shadow-inner">
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold truncate">{user.username ?? 'User'}</h2>
            <button onClick={onEditName} className="opacity-70 hover:opacity-100 transition-opacity">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536M9 11l6.5-6.5a2 2 0 012.828 2.828L11 14H9v-2z" />
              </svg>
            </button>
          </div>
          <p className="text-white/75 text-sm mt-0.5 truncate">
            Member since {user.createdAt ? new Date(user.createdAt).getFullYear() : new Date().getFullYear()}
          </p>
        </div>
      </div>
    </div>
  );
};

// ─── Monthly Summary Bar ──────────────────────────────────────────────────────
const MonthlySummaryBar: React.FC<{ transactions: Transaction[] }> = ({ transactions }) => {
  const now = new Date();
  const { income, expense, balance } = useMemo(() => {
    const thisMonth = transactions.filter(t => {
      const d = new Date(t.date);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    });
    const income = thisMonth.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
    const expense = thisMonth.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
    return { income, expense, balance: income - expense };
  }, [transactions]);

  const month = now.toLocaleString('en-US', { month: 'long' });

  return (
    <Card>
      <div className="px-4 pt-3 pb-1">
        <p className="text-xs font-semibold text-[rgb(var(--color-text-muted-rgb))] uppercase tracking-wider">{month} Overview</p>
      </div>
      <div className="grid grid-cols-3 divide-x divide-[rgb(var(--color-border-rgb))]">
        {[
          { label: 'Income', value: income, color: 'text-emerald-500' },
          { label: 'Expense', value: expense, color: 'text-red-500' },
          { label: 'Balance', value: balance, color: balance >= 0 ? 'text-[rgb(var(--color-primary-rgb))]' : 'text-red-500' },
        ].map(({ label, value, color }) => (
          <div key={label} className="flex flex-col items-center py-4 px-2 gap-1">
            <span className="text-xs text-[rgb(var(--color-text-muted-rgb))] font-medium">{label}</span>
            <span className={`text-base font-bold ${color} tabular-nums`}>{formatCurrency(Math.abs(value))}</span>
          </div>
        ))}
      </div>
    </Card>
  );
};

// ─── Net Worth Card ───────────────────────────────────────────────────────────
const NetWorthCard: React.FC<{ transactions: Transaction[]; goals: Goal[]; debts: DebtEntry[] }> = ({ transactions, goals, debts }) => {
  const { totalSavings, totalDebt, netWorth } = useMemo(() => {
    const totalIncome = transactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
    const totalExpense = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
    const totalSavings = Math.max(0, totalIncome - totalExpense);
    const goalSavings = goals.reduce((s, g) => s + (g.currentAmount ?? 0), 0);
    const totalDebt = debts.filter(d => d.type === 'owed').reduce((s, d) => s + d.amount, 0);
    return {
      totalSavings: totalSavings + goalSavings,
      totalDebt,
      netWorth: totalSavings + goalSavings - totalDebt,
    };
  }, [transactions, goals, debts]);

  return (
    <Card className="p-4">
      <p className="text-xs font-semibold text-[rgb(var(--color-text-muted-rgb))] uppercase tracking-wider mb-3">Estimated Net Worth</p>
      <div className="flex items-end justify-between mb-4">
        <span className={`text-3xl font-bold tabular-nums ${netWorth >= 0 ? 'text-[rgb(var(--color-text-rgb))]' : 'text-red-500'}`}>
          {formatCurrency(netWorth)}
        </span>
        <span className={`text-sm font-medium px-2 py-0.5 rounded-full ${netWorth >= 0 ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'}`}>
          {netWorth >= 0 ? '↑ Positive' : '↓ Negative'}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-xl p-3">
          <p className="text-xs text-emerald-600 dark:text-emerald-400 mb-1">Total Assets</p>
          <p className="text-base font-bold text-emerald-700 dark:text-emerald-300 tabular-nums">{formatCurrency(totalSavings)}</p>
        </div>
        <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-3">
          <p className="text-xs text-red-600 dark:text-red-400 mb-1">Total Debts</p>
          <p className="text-base font-bold text-red-700 dark:text-red-300 tabular-nums">{formatCurrency(totalDebt)}</p>
        </div>
      </div>
    </Card>
  );
};

// ─── Edit Name Modal ──────────────────────────────────────────────────────────
const EditNameModal: React.FC<{
  current: string;
  onSave: (name: string) => void;
  onClose: () => void;
}> = ({ current, onSave, onClose }) => {
  const [value, setValue] = useState(current);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-[rgb(var(--color-surface-rgb))] rounded-2xl shadow-xl p-6 w-full max-w-sm" onClick={e => e.stopPropagation()}>
        <h3 className="text-lg font-semibold text-[rgb(var(--color-text-rgb))] mb-4">Edit Display Name</h3>
        <input
          autoFocus
          value={value}
          onChange={e => setValue(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && value.trim()) onSave(value.trim()); if (e.key === 'Escape') onClose(); }}
          maxLength={30}
          placeholder="Your name"
          className="w-full px-4 py-3 rounded-xl border border-[rgb(var(--color-border-rgb))] bg-[rgb(var(--color-bg-rgb))] text-[rgb(var(--color-text-rgb))] text-sm focus:outline-none focus:ring-2 focus:ring-[rgb(var(--color-primary-rgb))] mb-4"
        />
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-[rgb(var(--color-border-rgb))] text-sm font-medium text-[rgb(var(--color-text-muted-rgb))] hover:bg-[rgb(var(--color-bg-rgb))] transition-colors">
            Cancel
          </button>
          <button
            onClick={() => value.trim() && onSave(value.trim())}
            disabled={!value.trim()}
            className="flex-1 py-2.5 rounded-xl bg-[rgb(var(--color-primary-rgb))] text-white text-sm font-semibold hover:opacity-90 disabled:opacity-40 transition-colors"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────
const FinancialAccountsPage: React.FC<Props> = ({
  user,
  transactions,
  budgets,
  goals,
  debts,
  onUpdateUser,
  onOpenConfirmModal,
  onExportData,
  onImportData,
  setActiveItem,
}) => {
  const [showEditName, setShowEditName] = useState(false);

  // Notification settings — derived from user object with safe defaults
  const notifSettings = user.notificationSettings ?? {
    goalProgress: { enabled: true, milestones: [25, 50, 75, 100] },
    billReminders: { enabled: true, advanceDays: 1 },
    budgetAlerts: { enabled: true, thresholds: [80, 90, 100] },
    monthlyReports: { enabled: false, frequency: 'monthly' },
    pushNotifications: { enabled: false, quietHours: { start: '22:00', end: '08:00' } },
  };

  const updateNotifSettings = (patch: Partial<typeof notifSettings>) => {
    onUpdateUser({ ...user, notificationSettings: { ...notifSettings, ...patch } });
  };

  const handleSaveName = (name: string) => {
    onUpdateUser({ ...user, username: name });
    setShowEditName(false);
  };

  const handleImportClick = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json,application/json';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      try {
        const text = await file.text();
        const data = JSON.parse(text);
        if (!data.version || !Array.isArray(data.transactions)) {
          alert('Invalid file: This does not appear to be a FinTrack backup.');
          return;
        }
        onOpenConfirmModal(
          'Import Data',
          `Found ${data.transactions?.length ?? 0} transactions, ${data.goals?.length ?? 0} goals, ${data.bills?.length ?? 0} bills. This will add to your existing data.`,
          () => onImportData(data),
          { confirmText: 'Import', variant: 'primary' }
        );
      } catch {
        alert('Failed to parse the backup file. Please make sure it is a valid JSON file.');
      }
    };
    input.click();
  };

  const handleDeleteAllData = () => {
    onOpenConfirmModal(
      '⚠️ Delete All Data',
      'This will permanently delete ALL your transactions, goals, budgets, bills, and notifications. This cannot be undone.',
      () => {
        onOpenConfirmModal(
          'Final Confirmation',
          'Are you absolutely sure? Type your action carefully — this is irreversible.',
          () => {
            // Signal App.tsx to wipe all data — handled via a custom event
            window.dispatchEvent(new CustomEvent('fintrack:deleteAllData'));
          },
          { confirmText: 'Delete Everything', variant: 'danger' }
        );
      },
      { confirmText: 'Proceed', variant: 'danger' }
    );
  };

  // Stats for display
  const txCount = transactions.length;
  const budgetCount = budgets.length;
  const goalCount = goals.length;

  return (
    <div className="max-w-2xl mx-auto space-y-5 pb-8">
      {/* Profile Hero */}
      <ProfileHero user={user} onEditName={() => setShowEditName(true)} />

      {/* Monthly Summary */}
      <MonthlySummaryBar transactions={transactions} />

      {/* Net Worth */}
      <NetWorthCard transactions={transactions} goals={goals} debts={debts} />

      {/* ── FINANCIAL DATA ── */}
      <div>
        <SectionHeader title="Financial Data" />
        <Card>
          <SettingRow
            icon="💸"
            label="Transactions"
            sublabel="All recorded income & expenses"
            value={`${txCount} records`}
            onClick={() => setActiveItem('Transactions')}
          />
          <Divider />
          <SettingRow
            icon="🎯"
            label="Budgets"
            sublabel="Monthly spending limits"
            value={`${budgetCount} active`}
            onClick={() => setActiveItem('Budgets')}
          />
          <Divider />
          <SettingRow
            icon="🏆"
            label="Goals"
            sublabel="Savings targets"
            value={`${goalCount} goals`}
            onClick={() => setActiveItem('Goals')}
          />
          <Divider />
          <SettingRow
            icon="🏷️"
            label="Categories"
            sublabel="Manage income & expense categories"
            onClick={() => setActiveItem('Manage Categories')}
          />
        </Card>
      </div>

      {/* ── NOTIFICATIONS ── */}
      <div>
        <SectionHeader title="Notifications" />
        <Card>
          <SettingRow
            icon="🔔"
            label="Budget Alerts"
            sublabel="Notify when approaching spending limits"
            rightElement={
              <Toggle
                checked={notifSettings.budgetAlerts.enabled}
                onChange={v => updateNotifSettings({ budgetAlerts: { ...notifSettings.budgetAlerts, enabled: v } })}
              />
            }
          />
          <Divider />
          <SettingRow
            icon="🎯"
            label="Goal Progress Alerts"
            sublabel="Notify on milestone achievements"
            rightElement={
              <Toggle
                checked={notifSettings.goalProgress.enabled}
                onChange={v => updateNotifSettings({ goalProgress: { ...notifSettings.goalProgress, enabled: v } })}
              />
            }
          />
          <Divider />
          <SettingRow
            icon="📅"
            label="Bill Reminders"
            sublabel="Remind before bills are due"
            rightElement={
              <Toggle
                checked={notifSettings.billReminders.enabled}
                onChange={v => updateNotifSettings({ billReminders: { ...notifSettings.billReminders, enabled: v } })}
              />
            }
          />
          <Divider />
          <SettingRow
            icon="📊"
            label="Monthly Reports"
            sublabel="Receive a monthly spending summary"
            rightElement={
              <Toggle
                checked={notifSettings.monthlyReports.enabled}
                onChange={v => updateNotifSettings({ monthlyReports: { ...notifSettings.monthlyReports, enabled: v } })}
              />
            }
          />
          <Divider />
          <SettingRow
            icon="📲"
            label="Push Notifications"
            sublabel="Show system notifications when app is closed"
            rightElement={
              <Toggle
                checked={notifSettings.pushNotifications.enabled}
                onChange={v => updateNotifSettings({ pushNotifications: { ...notifSettings.pushNotifications, enabled: v } })}
              />
            }
          />
        </Card>
      </div>

      {/* ── DATA MANAGEMENT ── */}
      <div>
        <SectionHeader title="Data Management" />
        <Card>
          <SettingRow
            icon="📤"
            label="Export Backup"
            sublabel="Download all data as a JSON file"
            onClick={onExportData}
          />
          <Divider />
          <SettingRow
            icon="📥"
            label="Import Backup"
            sublabel="Restore from a FinTrack JSON backup"
            onClick={handleImportClick}
          />
        </Card>
      </div>

      {/* ── PREFERENCES ── */}
      <div>
        <SectionHeader title="Preferences" />
        <Card>
          <SettingRow
            icon="⚙️"
            label="Settings"
            sublabel="Currency, theme, security & more"
            onClick={() => setActiveItem('Settings')}
          />
          <Divider />
          <SettingRow
            icon="📈"
            label="Insights"
            sublabel="Analytics & spending breakdowns"
            onClick={() => setActiveItem('Insights')}
          />
        </Card>
      </div>

      {/* ── APP INFO ── */}
      <div>
        <SectionHeader title="About" />
        <Card>
          <SettingRow
            icon="ℹ️"
            label="Version"
            sublabel="FinTrack PWA"
            value="1.3.0"
          />
          <Divider />
          <SettingRow
            icon="🔒"
            label="Data Storage"
            sublabel="All data encrypted locally with AES-GCM"
          />
        </Card>
      </div>

      {/* ── DANGER ZONE ── */}
      <div>
        <SectionHeader title="Danger Zone" className="text-red-500 dark:text-red-400" />
        <Card>
          <SettingRow
            icon="🗑️"
            label="Delete All Data"
            sublabel="Permanently remove all transactions, goals & budgets"
            onClick={handleDeleteAllData}
            danger
          />
        </Card>
      </div>

      {/* Disclaimer */}
      <div className="flex items-start gap-2 px-2 text-xs text-[rgb(var(--color-text-muted-rgb))]">
        <span className="mt-0.5 shrink-0">🔐</span>
        <p>All your financial data is stored locally on this device and encrypted. No data is sent to external servers.</p>
      </div>

      {/* Edit Name Modal */}
      {showEditName && (
        <EditNameModal
          current={user.username ?? ''}
          onSave={handleSaveName}
          onClose={() => setShowEditName(false)}
        />
      )}
    </div>
  );
};

export default FinancialAccountsPage;
