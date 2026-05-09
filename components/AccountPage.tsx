import React, { useState, useRef } from 'react';
import { User, FinancialAccount, AccountType, ACCOUNT_TYPE_META, CurrencyCode, CurrencyOption, NotificationSettings } from '../types';
import { UserIcon, SettingsIcon } from './icons';
import Card, { CardHeader, CardTitle, CardContent } from './Card';

// ─── Currency Options ─────────────────────────────────────────────────────────
const CURRENCY_OPTIONS: CurrencyOption[] = [
  { code: 'HKD', symbol: 'HK$', name: 'Hong Kong Dollar', locale: 'zh-HK' },
  { code: 'USD', symbol: '$',   name: 'US Dollar',         locale: 'en-US' },
  { code: 'EUR', symbol: '€',   name: 'Euro',              locale: 'de-DE' },
  { code: 'GBP', symbol: '£',   name: 'British Pound',     locale: 'en-GB' },
  { code: 'JPY', symbol: '¥',   name: 'Japanese Yen',      locale: 'ja-JP' },
  { code: 'CNY', symbol: '¥',   name: 'Chinese Yuan',      locale: 'zh-CN' },
  { code: 'AUD', symbol: 'A$',  name: 'Australian Dollar', locale: 'en-AU' },
  { code: 'CAD', symbol: 'C$',  name: 'Canadian Dollar',   locale: 'en-CA' },
  { code: 'SGD', symbol: 'S$',  name: 'Singapore Dollar',  locale: 'en-SG' },
  { code: 'KRW', symbol: '₩',   name: 'Korean Won',        locale: 'ko-KR' },
  { code: 'TWD', symbol: 'NT$', name: 'Taiwan Dollar',     locale: 'zh-TW' },
  { code: 'MYR', symbol: 'RM',  name: 'Malaysian Ringgit', locale: 'ms-MY' },
  { code: 'THB', symbol: '฿',   name: 'Thai Baht',         locale: 'th-TH' },
  { code: 'INR', symbol: '₹',   name: 'Indian Rupee',      locale: 'hi-IN' },
  { code: 'CHF', symbol: 'Fr',  name: 'Swiss Franc',       locale: 'de-CH' },
  { code: 'NZD', symbol: 'NZ$', name: 'New Zealand Dollar',locale: 'en-NZ' },
  { code: 'SEK', symbol: 'kr',  name: 'Swedish Krona',     locale: 'sv-SE' },
  { code: 'NOK', symbol: 'kr',  name: 'Norwegian Krone',   locale: 'nb-NO' },
];

const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettings = {
  goalProgress: { enabled: true, milestones: [25, 50, 75, 100] },
  billReminders: { enabled: true, advanceDays: 3 },
  budgetAlerts: { enabled: true, thresholds: [80, 100] },
  monthlyReports: { enabled: true, frequency: 'monthly' },
  pushNotifications: { enabled: false, quietHours: { start: '22:00', end: '08:00' } },
};

// ─── Sub-components ───────────────────────────────────────────────────────────
const Toggle: React.FC<{ checked: boolean; onChange: (v: boolean) => void; disabled?: boolean }> = ({ checked, onChange, disabled }) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    disabled={disabled}
    onClick={() => onChange(!checked)}
    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-[rgb(var(--color-primary-rgb))] focus:ring-offset-2 disabled:opacity-50 ${checked ? 'bg-[rgb(var(--color-primary-rgb))]' : 'bg-[rgb(var(--color-border-rgb))]'}`}
  >
    <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-6' : 'translate-x-1'}`} />
  </button>
);

const SectionHeader: React.FC<{ icon: React.ReactNode; title: string; subtitle?: string }> = ({ icon, title, subtitle }) => (
  <div className="flex items-center gap-3 mb-4">
    <div className="p-2 bg-primary-subtle rounded-lg text-[rgb(var(--color-primary-rgb))]">{icon}</div>
    <div>
      <h3 className="font-semibold text-[rgb(var(--color-text-rgb))]">{title}</h3>
      {subtitle && <p className="text-xs text-[rgb(var(--color-text-muted-rgb))]">{subtitle}</p>}
    </div>
  </div>
);

// ─── Account Form Modal ───────────────────────────────────────────────────────
interface AccountFormData {
  name: string;
  type: AccountType;
  balance: string;
  creditLimit: string;
  note: string;
  includeInNetWorth: boolean;
}

const EMPTY_FORM: AccountFormData = { name: '', type: 'cash', balance: '', creditLimit: '', note: '', includeInNetWorth: true };

const FinancialAccountModal: React.FC<{
  account: FinancialAccount | null;
  onSave: (data: Partial<FinancialAccount>) => void;
  onClose: () => void;
}> = ({ account, onSave, onClose }) => {
  const [form, setForm] = useState<AccountFormData>(
    account
      ? { name: account.name, type: account.type, balance: String(account.balance), creditLimit: String(account.creditLimit ?? ''), note: account.note ?? '', includeInNetWorth: account.includeInNetWorth ?? true }
      : EMPTY_FORM
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    onSave({
      name: form.name.trim(),
      type: form.type,
      balance: parseFloat(form.balance) || 0,
      creditLimit: form.type === 'credit_card' ? (parseFloat(form.creditLimit) || undefined) : undefined,
      note: form.note.trim() || undefined,
      includeInNetWorth: form.includeInNetWorth,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="bg-[rgb(var(--color-card-rgb))] rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-[rgb(var(--color-text-rgb))]">{account ? 'Edit Account' : 'New Account'}</h3>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-[rgb(var(--color-border-rgb))] transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Account Type */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-[rgb(var(--color-text-rgb))]">Account Type</label>
            <div className="grid grid-cols-4 gap-2">
              {(Object.keys(ACCOUNT_TYPE_META) as AccountType[]).map(t => (
                <button key={t} type="button" onClick={() => setForm(f => ({ ...f, type: t }))}
                  className={`flex flex-col items-center gap-1 p-2 rounded-lg border-2 text-xs transition-all ${form.type === t ? 'border-[rgb(var(--color-primary-rgb))] bg-primary-subtle' : 'border-[rgb(var(--color-border-rgb))] hover:border-[rgb(var(--color-primary-rgb))]/50'}`}>
                  <span className="text-xl">{ACCOUNT_TYPE_META[t].emoji}</span>
                  <span className="text-[rgb(var(--color-text-muted-rgb))] leading-tight text-center">{ACCOUNT_TYPE_META[t].label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Name */}
          <div className="space-y-1">
            <label className="text-sm font-medium text-[rgb(var(--color-text-rgb))]">Account Name</label>
            <input type="text" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required maxLength={40}
              className="w-full px-4 py-2 bg-[rgb(var(--color-bg-rgb))] border border-[rgb(var(--color-border-rgb))] rounded-lg focus:ring-2 focus:ring-[rgb(var(--color-primary-rgb))] focus:border-transparent outline-none"
              placeholder={`e.g. ${ACCOUNT_TYPE_META[form.type].label}`} />
          </div>

          {/* Balance */}
          <div className="space-y-1">
            <label className="text-sm font-medium text-[rgb(var(--color-text-rgb))]">Current Balance</label>
            <input type="number" value={form.balance} onChange={e => setForm(f => ({ ...f, balance: e.target.value }))} step="0.01"
              className="w-full px-4 py-2 bg-[rgb(var(--color-bg-rgb))] border border-[rgb(var(--color-border-rgb))] rounded-lg focus:ring-2 focus:ring-[rgb(var(--color-primary-rgb))] focus:border-transparent outline-none"
              placeholder="0.00" />
          </div>

          {/* Credit Limit (credit card only) */}
          {form.type === 'credit_card' && (
            <div className="space-y-1">
              <label className="text-sm font-medium text-[rgb(var(--color-text-rgb))]">Credit Limit</label>
              <input type="number" value={form.creditLimit} onChange={e => setForm(f => ({ ...f, creditLimit: e.target.value }))} step="0.01"
                className="w-full px-4 py-2 bg-[rgb(var(--color-bg-rgb))] border border-[rgb(var(--color-border-rgb))] rounded-lg focus:ring-2 focus:ring-[rgb(var(--color-primary-rgb))] focus:border-transparent outline-none"
                placeholder="e.g. 50000" />
            </div>
          )}

          {/* Note */}
          <div className="space-y-1">
            <label className="text-sm font-medium text-[rgb(var(--color-text-rgb))]">Note (optional)</label>
            <input type="text" value={form.note} onChange={e => setForm(f => ({ ...f, note: e.target.value }))} maxLength={80}
              className="w-full px-4 py-2 bg-[rgb(var(--color-bg-rgb))] border border-[rgb(var(--color-border-rgb))] rounded-lg focus:ring-2 focus:ring-[rgb(var(--color-primary-rgb))] focus:border-transparent outline-none"
              placeholder="e.g. Main spending account" />
          </div>

          {/* Include in Net Worth */}
          <div className="flex items-center justify-between py-2 px-3 bg-[rgb(var(--color-bg-rgb))] rounded-lg">
            <div>
              <p className="text-sm font-medium text-[rgb(var(--color-text-rgb))]">Include in Net Worth</p>
              <p className="text-xs text-[rgb(var(--color-text-muted-rgb))]">Count this account's balance in your net worth</p>
            </div>
            <Toggle checked={form.includeInNetWorth} onChange={v => setForm(f => ({ ...f, includeInNetWorth: v }))} />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2 border border-[rgb(var(--color-border-rgb))] rounded-lg hover:bg-[rgb(var(--color-border-rgb))]/30 transition-colors font-medium text-[rgb(var(--color-text-rgb))]">Cancel</button>
            <button type="submit" className="flex-1 px-4 py-2 bg-[rgb(var(--color-primary-rgb))] text-white rounded-lg hover:bg-[rgb(var(--color-primary-hover-rgb))] transition-colors font-medium">
              {account ? 'Save Changes' : 'Add Account'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ─── Main AccountPage ─────────────────────────────────────────────────────────
interface AccountPageProps {
  user: User;
  onUpdateUser: (updatedUser: User) => void;
  onChangePassword: (oldPw: string, newPw: string) => Promise<boolean>;
  setActiveItem: (item: string) => void;
}

const AccountPage: React.FC<AccountPageProps> = ({ user, onUpdateUser, onChangePassword, setActiveItem }) => {
  // ── Profile states ──
  const [username, setUsername] = useState(user.username);
  const [avatar, setAvatar] = useState(user.avatar);
  const [usernameMessage, setUsernameMessage] = useState({ text: '', type: '' });
  const [isLoading, setIsLoading] = useState({ avatar: false, username: false, password: false });
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Password states ──
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showPasswords, setShowPasswords] = useState({ current: false, new: false, confirm: false });
  const [passwordMessage, setPasswordMessage] = useState({ text: '', type: '' });

  // ── Currency ──
  const [currency, setCurrency] = useState<CurrencyCode>(user.currency ?? 'HKD');
  const [currencyMessage, setCurrencyMessage] = useState('');

  // ── Financial Accounts ──
  const [accounts, setAccounts] = useState<FinancialAccount[]>(user.financialAccounts ?? []);
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [editingAccount, setEditingAccount] = useState<FinancialAccount | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // ── Notification Settings ──
  const [notifSettings, setNotifSettings] = useState<NotificationSettings>(
    user.notificationSettings ?? DEFAULT_NOTIFICATION_SETTINGS
  );
  const [notifMessage, setNotifMessage] = useState('');

  // ── AI Settings ──
  const [aiApiKey, setAiApiKey] = useState(user.aiSettings?.apiKey ?? '');
  const [aiModel, setAiModel] = useState(user.aiSettings?.model ?? 'gemini-1.5-flash');
  const [showApiKey, setShowApiKey] = useState(false);
  const [aiMessage, setAiMessage] = useState('');

  // ── Export / Import ──
  const [exportMessage, setExportMessage] = useState('');
  const [importMessage, setImportMessage] = useState({ text: '', type: '' });
  const importFileRef = useRef<HTMLInputElement>(null);

  // ── Danger Zone ──
  const [deleteStep, setDeleteStep] = useState(0);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');

  // ─── Helpers ────────────────────────────────────────────────────────────────
  const flash = (setter: (v: string) => void, msg: string, delay = 3000) => {
    setter(msg);
    setTimeout(() => setter(''), delay);
  };

  // ─── Avatar ─────────────────────────────────────────────────────────────────
  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) { setUsernameMessage({ text: 'File size must be less than 10MB.', type: 'error' }); return; }
    setIsLoading(p => ({ ...p, avatar: true }));
    const reader = new FileReader();
    reader.onloadend = () => {
      const b64 = reader.result as string;
      setAvatar(b64);
      onUpdateUser({ ...user, avatar: b64 });
      setIsLoading(p => ({ ...p, avatar: false }));
    };
    reader.onerror = () => { setUsernameMessage({ text: 'Failed to upload image.', type: 'error' }); setIsLoading(p => ({ ...p, avatar: false })); };
    reader.readAsDataURL(file);
  };

  // ─── Username ────────────────────────────────────────────────────────────────
  const handleUpdateUsername = async (e: React.FormEvent) => {
    e.preventDefault();
    setUsernameMessage({ text: '', type: '' });
    if (username.length < 3) { setUsernameMessage({ text: 'Username must be at least 3 characters.', type: 'error' }); return; }
    if (username === user.username) { setUsernameMessage({ text: 'Username is already up to date.', type: 'error' }); return; }
    setIsLoading(p => ({ ...p, username: true }));
    try {
      await new Promise(r => setTimeout(r, 400));
      onUpdateUser({ ...user, username });
      setUsernameMessage({ text: 'Username updated successfully!', type: 'success' });
      setTimeout(() => setUsernameMessage({ text: '', type: '' }), 3000);
    } catch { setUsernameMessage({ text: 'Failed to update username.', type: 'error' }); }
    finally { setIsLoading(p => ({ ...p, username: false })); }
  };

  // ─── Password ────────────────────────────────────────────────────────────────
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMessage({ text: '', type: '' });
    if (newPassword.length < 6) { setPasswordMessage({ text: 'New password must be at least 6 characters.', type: 'error' }); return; }
    if (newPassword !== confirmNewPassword) { setPasswordMessage({ text: 'New passwords do not match.', type: 'error' }); return; }
    setIsLoading(p => ({ ...p, password: true }));
    try {
      const ok = await onChangePassword(currentPassword, newPassword);
      if (ok) {
        setPasswordMessage({ text: 'Password changed successfully!', type: 'success' });
        setCurrentPassword(''); setNewPassword(''); setConfirmNewPassword('');
        setTimeout(() => setPasswordMessage({ text: '', type: '' }), 3000);
      } else { setPasswordMessage({ text: 'Current password is incorrect.', type: 'error' }); }
    } catch { setPasswordMessage({ text: 'An error occurred.', type: 'error' }); }
    finally { setIsLoading(p => ({ ...p, password: false })); }
  };

  // ─── Currency ────────────────────────────────────────────────────────────────
  const handleSaveCurrency = () => {
    onUpdateUser({ ...user, currency });
    flash(setCurrencyMessage, '✓ Currency saved');
  };

  // ─── Financial Accounts ──────────────────────────────────────────────────────
  const handleSaveAccount = (data: Partial<FinancialAccount>) => {
    let updated: FinancialAccount[];
    if (editingAccount) {
      updated = accounts.map(a => a.id === editingAccount.id ? { ...editingAccount, ...data } : a);
    } else {
      const newAcc: FinancialAccount = {
        id: `acc_${Date.now()}`,
        name: data.name!,
        type: data.type!,
        balance: data.balance ?? 0,
        createdAt: new Date().toISOString(),
        ...data,
      };
      updated = [...accounts, newAcc];
    }
    setAccounts(updated);
    onUpdateUser({ ...user, financialAccounts: updated });
    setShowAccountModal(false);
    setEditingAccount(null);
  };

  const handleDeleteAccount = (id: string) => {
    const updated = accounts.filter(a => a.id !== id);
    setAccounts(updated);
    onUpdateUser({ ...user, financialAccounts: updated });
    setDeleteConfirmId(null);
  };

  const handleToggleArchive = (id: string) => {
    const updated = accounts.map(a => a.id === id ? { ...a, isArchived: !a.isArchived } : a);
    setAccounts(updated);
    onUpdateUser({ ...user, financialAccounts: updated });
  };

  // ─── Notification Settings ───────────────────────────────────────────────────
  const handleSaveNotifSettings = () => {
    onUpdateUser({ ...user, notificationSettings: notifSettings });
    flash(setNotifMessage, '✓ Notification settings saved');
  };

  // ─── AI Settings ─────────────────────────────────────────────────────────────
  const handleSaveAiSettings = () => {
    onUpdateUser({ ...user, aiSettings: { apiKey: aiApiKey.trim(), model: aiModel } });
    flash(setAiMessage, '✓ AI settings saved');
  };

  // ─── Export ──────────────────────────────────────────────────────────────────
  const handleExport = () => {
    const exportData = { exportedAt: new Date().toISOString(), version: 2, user };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fintracker-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    flash(setExportMessage, '✓ Data exported successfully');
  };

  // ─── Import ──────────────────────────────────────────────────────────────────
  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      try {
        const data = JSON.parse(reader.result as string);
        if (!data.user) { setImportMessage({ text: 'Invalid backup file.', type: 'error' }); return; }
        onUpdateUser(data.user);
        setImportMessage({ text: '✓ Data imported successfully! Page will refresh shortly.', type: 'success' });
        setTimeout(() => window.location.reload(), 2000);
      } catch { setImportMessage({ text: 'Failed to parse the backup file.', type: 'error' }); }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // ─── Danger Zone ─────────────────────────────────────────────────────────────
  const handleDeleteAllData = () => {
    if (deleteConfirmText !== 'DELETE') return;
    const freshUser: User = { username: user.username, salt: user.salt, passwordCheck: user.passwordCheck };
    onUpdateUser(freshUser);
    localStorage.clear();
    window.location.reload();
  };

  // ─── Computed ────────────────────────────────────────────────────────────────
  const activeAccounts = accounts.filter(a => !a.isArchived);
  const archivedAccounts = accounts.filter(a => a.isArchived);
  const totalBalance = activeAccounts.reduce((sum, a) => {
    const meta = ACCOUNT_TYPE_META[a.type];
    return sum + (a.type === 'credit_card' ? -a.balance : a.balance);
  }, 0);
  const currencySymbol = CURRENCY_OPTIONS.find(c => c.code === currency)?.symbol ?? currency;

  // ─── Render ───────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6 max-w-4xl mx-auto px-4 pb-8">
      {/* Page Header */}
      <header className="text-center pb-6 border-b border-[rgb(var(--color-border-rgb))]">
        <div className="inline-flex items-center justify-center p-3 bg-primary-subtle rounded-full mb-4">
          <UserIcon className="w-8 h-8 text-[rgb(var(--color-primary-rgb))]" />
        </div>
        <h1 className="text-3xl font-bold text-[rgb(var(--color-text-rgb))]">Account Settings</h1>
        <p className="text-[rgb(var(--color-text-muted-rgb))] mt-2">Manage your profile, accounts, and preferences</p>
      </header>

      {/* ── Section 1: Profile + Security ── */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Profile */}
        <Card>
          <CardHeader><CardTitle>Profile</CardTitle></CardHeader>
          <CardContent className="space-y-6">
            <div className="flex flex-col items-center space-y-4">
              <div className="relative group">
                <div className="w-28 h-28 rounded-full overflow-hidden border-4 border-[rgb(var(--color-card-rgb))] shadow-lg bg-[rgb(var(--color-card-muted-rgb))]">
                  {avatar
                    ? <img src={avatar} alt="User Avatar" className="w-full h-full object-cover" />
                    : <div className="w-full h-full flex items-center justify-center"><UserIcon className="w-14 h-14 text-[rgb(var(--color-text-muted-rgb))]" /></div>}
                </div>
                <button onClick={() => fileInputRef.current?.click()} disabled={isLoading.avatar}
                  className="absolute bottom-0 right-0 p-2 bg-[rgb(var(--color-primary-rgb))] text-white rounded-full shadow-md hover:bg-[rgb(var(--color-primary-hover-rgb))] transition-colors disabled:opacity-50"
                  aria-label="Upload new profile picture">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </button>
                <input type="file" accept="image/*" ref={fileInputRef} onChange={handleAvatarUpload} className="hidden" />
              </div>
              {isLoading.avatar && <p className="text-sm text-[rgb(var(--color-text-muted-rgb))]">Uploading...</p>}
              {avatar && (
                <button onClick={() => { setAvatar(''); onUpdateUser({ ...user, avatar: '' }); }}
                  className="text-xs text-red-500 hover:text-red-600 transition-colors">
                  Remove photo
                </button>
              )}
            </div>

            <form onSubmit={handleUpdateUsername} className="space-y-3">
              <div className="space-y-1">
                <label htmlFor="username" className="text-sm font-medium text-[rgb(var(--color-text-rgb))]">Username</label>
                <input id="username" type="text" value={username} onChange={e => setUsername(e.target.value)} disabled={isLoading.username}
                  className="w-full px-4 py-2 bg-[rgb(var(--color-bg-rgb))] border border-[rgb(var(--color-border-rgb))] rounded-lg focus:ring-2 focus:ring-[rgb(var(--color-primary-rgb))] focus:border-transparent outline-none transition-all"
                  placeholder="Enter your username" />
              </div>
              {usernameMessage.text && (
                <p className={`text-sm ${usernameMessage.type === 'success' ? 'text-green-600' : 'text-red-600'}`} role="alert">{usernameMessage.text}</p>
              )}
              <button type="submit" disabled={isLoading.username}
                className="w-full px-4 py-2 bg-[rgb(var(--color-primary-rgb))] text-white rounded-lg hover:bg-[rgb(var(--color-primary-hover-rgb))] disabled:opacity-50 transition-colors font-medium">
                {isLoading.username ? 'Updating...' : 'Update Username'}
              </button>
            </form>
          </CardContent>
        </Card>

        {/* Security */}
        <div className="space-y-4">
          <Card>
            <CardHeader><CardTitle>Security</CardTitle></CardHeader>
            <CardContent>
              <form onSubmit={handleChangePassword} className="space-y-3">
                {(['current', 'new', 'confirm'] as const).map((field, i) => (
                  <div key={field} className="space-y-1">
                    <label htmlFor={`${field}-password`} className="text-sm font-medium text-[rgb(var(--color-text-rgb))]">
                      {['Current Password', 'New Password', 'Confirm New Password'][i]}
                    </label>
                    <div className="relative">
                      <input id={`${field}-password`}
                        type={showPasswords[field] ? 'text' : 'password'}
                        value={field === 'current' ? currentPassword : field === 'new' ? newPassword : confirmNewPassword}
                        onChange={e => { if (field === 'current') setCurrentPassword(e.target.value); else if (field === 'new') setNewPassword(e.target.value); else setConfirmNewPassword(e.target.value); }}
                        disabled={isLoading.password}
                        className="w-full px-4 py-2 pr-10 bg-[rgb(var(--color-bg-rgb))] border border-[rgb(var(--color-border-rgb))] rounded-lg focus:ring-2 focus:ring-[rgb(var(--color-primary-rgb))] focus:border-transparent outline-none"
                        placeholder={['Enter current password', 'Min. 6 characters', 'Confirm new password'][i]} />
                      <button type="button" onClick={() => setShowPasswords(p => ({ ...p, [field]: !p[field] }))}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[rgb(var(--color-text-muted-rgb))] hover:text-[rgb(var(--color-text-rgb))]">
                        {showPasswords[field]
                          ? <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                          : <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>}
                      </button>
                    </div>
                  </div>
                ))}
                {passwordMessage.text && (
                  <p className={`text-sm ${passwordMessage.type === 'success' ? 'text-green-600' : 'text-red-600'}`} role="alert">{passwordMessage.text}</p>
                )}
                <button type="submit" disabled={isLoading.password}
                  className="w-full px-4 py-2 bg-[rgb(var(--color-primary-rgb))] text-white rounded-lg hover:bg-[rgb(var(--color-primary-hover-rgb))] disabled:opacity-50 transition-colors font-medium">
                  {isLoading.password ? 'Changing...' : 'Change Password'}
                </button>
              </form>
            </CardContent>
          </Card>

          <button onClick={() => setActiveItem('Settings')}
            className="w-full flex items-center justify-between p-4 bg-[rgb(var(--color-card-rgb))] border border-[rgb(var(--color-border-rgb))] rounded-xl hover:border-[rgb(var(--color-primary-rgb))] transition-colors group">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-primary-subtle rounded-lg group-hover:bg-[rgb(var(--color-primary-rgb))] group-hover:text-white transition-colors">
                <SettingsIcon className="w-5 h-5" />
              </div>
              <div className="text-left">
                <p className="font-semibold text-[rgb(var(--color-text-rgb))]">App Preferences</p>
                <p className="text-sm text-[rgb(var(--color-text-muted-rgb))]">Theme, display, and more</p>
              </div>
            </div>
            <svg className="w-5 h-5 text-[rgb(var(--color-text-muted-rgb))] group-hover:text-[rgb(var(--color-primary-rgb))] transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      {/* ── Section 2: Currency ── */}
      <Card>
        <CardHeader>
          <CardTitle>Currency</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-[rgb(var(--color-text-muted-rgb))]">Select the currency used throughout the app for displaying balances and transactions.</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {CURRENCY_OPTIONS.map(opt => (
              <button key={opt.code} onClick={() => setCurrency(opt.code)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg border-2 text-sm transition-all ${currency === opt.code ? 'border-[rgb(var(--color-primary-rgb))] bg-primary-subtle font-semibold' : 'border-[rgb(var(--color-border-rgb))] hover:border-[rgb(var(--color-primary-rgb))]/50'}`}>
                <span className="font-mono text-base w-8 text-center">{opt.symbol}</span>
                <span className="text-[rgb(var(--color-text-muted-rgb))] truncate">{opt.code}</span>
              </button>
            ))}
          </div>
          <div className="flex items-center gap-3">
            <button onClick={handleSaveCurrency}
              className="px-6 py-2 bg-[rgb(var(--color-primary-rgb))] text-white rounded-lg hover:bg-[rgb(var(--color-primary-hover-rgb))] transition-colors font-medium">
              Save Currency
            </button>
            {currencyMessage && <span className="text-sm text-green-600">{currencyMessage}</span>}
          </div>
        </CardContent>
      </Card>

      {/* ── Section 3: Financial Accounts ── */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Financial Accounts</CardTitle>
            <button onClick={() => { setEditingAccount(null); setShowAccountModal(true); }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[rgb(var(--color-primary-rgb))] text-white rounded-lg hover:bg-[rgb(var(--color-primary-hover-rgb))] transition-colors text-sm font-medium">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
              Add Account
            </button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Net Worth Summary */}
          {activeAccounts.length > 0 && (
            <div className="mb-4 p-4 bg-[rgb(var(--color-bg-rgb))] rounded-xl flex items-center justify-between">
              <div>
                <p className="text-xs text-[rgb(var(--color-text-muted-rgb))] font-medium uppercase tracking-wide">Total Balance</p>
                <p className={`text-2xl font-bold ${totalBalance >= 0 ? 'text-[rgb(var(--color-primary-rgb))]' : 'text-red-500'}`}>
                  {totalBalance < 0 ? '-' : ''}{currencySymbol}{Math.abs(totalBalance).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              </div>
              <p className="text-sm text-[rgb(var(--color-text-muted-rgb))]">{activeAccounts.length} active account{activeAccounts.length !== 1 ? 's' : ''}</p>
            </div>
          )}

          {accounts.length === 0 ? (
            <div className="text-center py-10 text-[rgb(var(--color-text-muted-rgb))]">
              <svg className="w-12 h-12 mx-auto mb-3 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>
              <p className="font-medium">No accounts yet</p>
              <p className="text-sm mt-1">Add your bank accounts, wallets, or cards to track your net worth.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {[...activeAccounts, ...archivedAccounts].map(acc => {
                const meta = ACCOUNT_TYPE_META[acc.type];
                const isCredit = acc.type === 'credit_card';
                const utilization = isCredit && acc.creditLimit ? (acc.balance / acc.creditLimit) * 100 : null;
                return (
                  <div key={acc.id} className={`flex items-center gap-3 p-3 rounded-xl border transition-colors ${acc.isArchived ? 'opacity-50 border-dashed border-[rgb(var(--color-border-rgb))]' : 'border-[rgb(var(--color-border-rgb))] hover:border-[rgb(var(--color-primary-rgb))]/40'}`}>
                    <div className="text-2xl w-10 h-10 flex items-center justify-center bg-[rgb(var(--color-bg-rgb))] rounded-lg flex-shrink-0">{meta.emoji}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-[rgb(var(--color-text-rgb))] truncate">{acc.name}</p>
                        {acc.isArchived && <span className="text-xs bg-[rgb(var(--color-border-rgb))] px-1.5 py-0.5 rounded text-[rgb(var(--color-text-muted-rgb))]">Archived</span>}
                      </div>
                      <p className="text-xs text-[rgb(var(--color-text-muted-rgb))]">{meta.label}{acc.note ? ` · ${acc.note}` : ''}</p>
                      {utilization !== null && (
                        <div className="mt-1.5 w-full bg-[rgb(var(--color-border-rgb))] rounded-full h-1.5">
                          <div className={`h-1.5 rounded-full transition-all ${utilization > 80 ? 'bg-red-500' : utilization > 50 ? 'bg-yellow-500' : 'bg-green-500'}`} style={{ width: `${Math.min(utilization, 100)}%` }} />
                        </div>
                      )}
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className={`font-semibold ${isCredit ? 'text-red-500' : 'text-[rgb(var(--color-text-rgb))]'}`}>
                        {isCredit ? '-' : ''}{currencySymbol}{acc.balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                      {acc.creditLimit && <p className="text-xs text-[rgb(var(--color-text-muted-rgb))]">Limit: {currencySymbol}{acc.creditLimit.toLocaleString()}</p>}
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button onClick={() => { setEditingAccount(acc); setShowAccountModal(true); }} title="Edit"
                        className="p-1.5 rounded-lg hover:bg-[rgb(var(--color-border-rgb))] transition-colors text-[rgb(var(--color-text-muted-rgb))]">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                      </button>
                      <button onClick={() => handleToggleArchive(acc.id)} title={acc.isArchived ? 'Unarchive' : 'Archive'}
                        className="p-1.5 rounded-lg hover:bg-[rgb(var(--color-border-rgb))] transition-colors text-[rgb(var(--color-text-muted-rgb))]">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" /></svg>
                      </button>
                      {deleteConfirmId === acc.id ? (
                        <div className="flex items-center gap-1">
                          <button onClick={() => handleDeleteAccount(acc.id)} className="px-2 py-1 text-xs bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors">Delete</button>
                          <button onClick={() => setDeleteConfirmId(null)} className="px-2 py-1 text-xs bg-[rgb(var(--color-border-rgb))] rounded-lg hover:bg-[rgb(var(--color-border-rgb))]/70 transition-colors">Cancel</button>
                        </div>
                      ) : (
                        <button onClick={() => setDeleteConfirmId(acc.id)} title="Delete"
                          className="p-1.5 rounded-lg hover:bg-red-100 hover:text-red-600 transition-colors text-[rgb(var(--color-text-muted-rgb))]">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Section 4: Notification Settings ── */}
      <Card>
        <CardHeader><CardTitle>Notification Settings</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          {/* Goal Progress */}
          <div className="p-4 bg-[rgb(var(--color-bg-rgb))] rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-[rgb(var(--color-text-rgb))]">Goal Progress Alerts</p>
                <p className="text-xs text-[rgb(var(--color-text-muted-rgb))]">Notify when reaching savings goal milestones</p>
              </div>
              <Toggle checked={notifSettings.goalProgress.enabled} onChange={v => setNotifSettings(p => ({ ...p, goalProgress: { ...p.goalProgress, enabled: v } }))} />
            </div>
          </div>

          {/* Bill Reminders */}
          <div className="p-4 bg-[rgb(var(--color-bg-rgb))] rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-[rgb(var(--color-text-rgb))]">Bill Reminders</p>
                <p className="text-xs text-[rgb(var(--color-text-muted-rgb))]">Remind before bill due dates</p>
              </div>
              <Toggle checked={notifSettings.billReminders.enabled} onChange={v => setNotifSettings(p => ({ ...p, billReminders: { ...p.billReminders, enabled: v } }))} />
            </div>
            {notifSettings.billReminders.enabled && (
              <div className="flex items-center gap-3">
                <label className="text-sm text-[rgb(var(--color-text-muted-rgb))] whitespace-nowrap">Remind</label>
                <select value={notifSettings.billReminders.advanceDays}
                  onChange={e => setNotifSettings(p => ({ ...p, billReminders: { ...p.billReminders, advanceDays: +e.target.value } }))}
                  className="flex-1 px-3 py-1.5 bg-[rgb(var(--color-card-rgb))] border border-[rgb(var(--color-border-rgb))] rounded-lg text-sm outline-none focus:ring-2 focus:ring-[rgb(var(--color-primary-rgb))]">
                  {[1, 2, 3, 5, 7].map(d => <option key={d} value={d}>{d} day{d !== 1 ? 's' : ''} before</option>)}
                </select>
              </div>
            )}
          </div>

          {/* Budget Alerts */}
          <div className="p-4 bg-[rgb(var(--color-bg-rgb))] rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-[rgb(var(--color-text-rgb))]">Budget Alerts</p>
                <p className="text-xs text-[rgb(var(--color-text-muted-rgb))]">Alert when spending approaches budget limits</p>
              </div>
              <Toggle checked={notifSettings.budgetAlerts.enabled} onChange={v => setNotifSettings(p => ({ ...p, budgetAlerts: { ...p.budgetAlerts, enabled: v } }))} />
            </div>
            {notifSettings.budgetAlerts.enabled && (
              <div className="flex gap-2 flex-wrap">
                {[60, 75, 80, 90, 100].map(t => (
                  <button key={t} type="button"
                    onClick={() => setNotifSettings(p => {
                      const thresholds = p.budgetAlerts.thresholds.includes(t)
                        ? p.budgetAlerts.thresholds.filter(x => x !== t)
                        : [...p.budgetAlerts.thresholds, t].sort((a, b) => a - b);
                      return { ...p, budgetAlerts: { ...p.budgetAlerts, thresholds } };
                    })}
                    className={`px-3 py-1 rounded-full text-sm font-medium border transition-all ${notifSettings.budgetAlerts.thresholds.includes(t) ? 'bg-[rgb(var(--color-primary-rgb))] text-white border-transparent' : 'border-[rgb(var(--color-border-rgb))] text-[rgb(var(--color-text-muted-rgb))]'}`}>
                    {t}%
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Monthly Reports */}
          <div className="p-4 bg-[rgb(var(--color-bg-rgb))] rounded-xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-[rgb(var(--color-text-rgb))]">Monthly Reports</p>
                <p className="text-xs text-[rgb(var(--color-text-muted-rgb))]">Periodic spending summaries</p>
              </div>
              <Toggle checked={notifSettings.monthlyReports.enabled} onChange={v => setNotifSettings(p => ({ ...p, monthlyReports: { ...p.monthlyReports, enabled: v } }))} />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button onClick={handleSaveNotifSettings}
              className="px-6 py-2 bg-[rgb(var(--color-primary-rgb))] text-white rounded-lg hover:bg-[rgb(var(--color-primary-hover-rgb))] transition-colors font-medium">
              Save Notifications
            </button>
            {notifMessage && <span className="text-sm text-green-600">{notifMessage}</span>}
          </div>
        </CardContent>
      </Card>

      {/* ── Section 5: AI Settings ── */}
      <Card>
        <CardHeader><CardTitle>AI Settings</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-[rgb(var(--color-text-muted-rgb))]">
            Configure your AI provider for smart features like category suggestions and financial insights.
          </p>
          <div className="space-y-1">
            <label className="text-sm font-medium text-[rgb(var(--color-text-rgb))]">API Key</label>
            <div className="relative">
              <input type={showApiKey ? 'text' : 'password'} value={aiApiKey} onChange={e => setAiApiKey(e.target.value)}
                className="w-full px-4 py-2 pr-10 bg-[rgb(var(--color-bg-rgb))] border border-[rgb(var(--color-border-rgb))] rounded-lg focus:ring-2 focus:ring-[rgb(var(--color-primary-rgb))] focus:border-transparent outline-none font-mono text-sm"
                placeholder="Enter your Gemini API key" />
              <button type="button" onClick={() => setShowApiKey(p => !p)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[rgb(var(--color-text-muted-rgb))] hover:text-[rgb(var(--color-text-rgb))]">
                {showApiKey
                  ? <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                  : <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>}
              </button>
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium text-[rgb(var(--color-text-rgb))]">Model</label>
            <select value={aiModel} onChange={e => setAiModel(e.target.value)}
              className="w-full px-4 py-2 bg-[rgb(var(--color-bg-rgb))] border border-[rgb(var(--color-border-rgb))] rounded-lg focus:ring-2 focus:ring-[rgb(var(--color-primary-rgb))] outline-none text-sm">
              <option value="gemini-1.5-flash">Gemini 1.5 Flash (Fast)</option>
              <option value="gemini-1.5-pro">Gemini 1.5 Pro (Powerful)</option>
              <option value="gemini-2.0-flash">Gemini 2.0 Flash (Latest)</option>
            </select>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={handleSaveAiSettings}
              className="px-6 py-2 bg-[rgb(var(--color-primary-rgb))] text-white rounded-lg hover:bg-[rgb(var(--color-primary-hover-rgb))] transition-colors font-medium">
              Save AI Settings
            </button>
            {aiMessage && <span className="text-sm text-green-600">{aiMessage}</span>}
          </div>
        </CardContent>
      </Card>

      {/* ── Section 6: Data Export / Import ── */}
      <Card>
        <CardHeader><CardTitle>Data Backup</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-[rgb(var(--color-text-muted-rgb))]">Export all your data as a JSON backup, or restore from a previous backup file.</p>
          <div className="grid sm:grid-cols-2 gap-3">
            <button onClick={handleExport}
              className="flex items-center justify-center gap-2 px-4 py-3 bg-[rgb(var(--color-primary-rgb))] text-white rounded-xl hover:bg-[rgb(var(--color-primary-hover-rgb))] transition-colors font-medium">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
              Export Backup
            </button>
            <button onClick={() => importFileRef.current?.click()}
              className="flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-[rgb(var(--color-border-rgb))] rounded-xl hover:border-[rgb(var(--color-primary-rgb))] transition-colors font-medium text-[rgb(var(--color-text-rgb))]">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
              Import Backup
            </button>
            <input type="file" accept=".json" ref={importFileRef} onChange={handleImport} className="hidden" />
          </div>
          {exportMessage && <p className="text-sm text-green-600">{exportMessage}</p>}
          {importMessage.text && <p className={`text-sm ${importMessage.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>{importMessage.text}</p>}
          <p className="text-xs text-[rgb(var(--color-text-muted-rgb))]">⚠️ Importing will overwrite your current data.</p>
        </CardContent>
      </Card>

      {/* ── Section 7: Danger Zone ── */}
      <Card>
        <CardHeader>
          <CardTitle>
            <span className="text-red-500">Danger Zone</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 border-2 border-red-200 dark:border-red-900 rounded-xl space-y-4">
            <div>
              <p className="font-semibold text-[rgb(var(--color-text-rgb))]">Delete All Data</p>
              <p className="text-sm text-[rgb(var(--color-text-muted-rgb))] mt-1">
                This will permanently erase all your transactions, budgets, goals, bills, and settings. Your login credentials will be preserved.
              </p>
            </div>
            {deleteStep === 0 && (
              <button onClick={() => setDeleteStep(1)}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-medium text-sm">
                Delete All Data
              </button>
            )}
            {deleteStep === 1 && (
              <div className="space-y-3">
                <p className="text-sm font-medium text-red-600">Type <strong>DELETE</strong> to confirm:</p>
                <input type="text" value={deleteConfirmText} onChange={e => setDeleteConfirmText(e.target.value)}
                  className="w-full px-4 py-2 border-2 border-red-300 rounded-lg focus:ring-2 focus:ring-red-400 focus:border-transparent outline-none bg-[rgb(var(--color-bg-rgb))] font-mono"
                  placeholder="DELETE" autoFocus />
                <div className="flex gap-3">
                  <button onClick={() => { setDeleteStep(0); setDeleteConfirmText(''); }}
                    className="flex-1 px-4 py-2 border border-[rgb(var(--color-border-rgb))] rounded-lg hover:bg-[rgb(var(--color-border-rgb))]/30 transition-colors font-medium">
                    Cancel
                  </button>
                  <button onClick={handleDeleteAllData} disabled={deleteConfirmText !== 'DELETE'}
                    className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors font-medium">
                    Confirm Delete
                  </button>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* ── Financial Account Modal ── */}
      {showAccountModal && (
        <FinancialAccountModal
          account={editingAccount}
          onSave={handleSaveAccount}
          onClose={() => { setShowAccountModal(false); setEditingAccount(null); }}
        />
      )}
    </div>
  );
};

export default AccountPage;
