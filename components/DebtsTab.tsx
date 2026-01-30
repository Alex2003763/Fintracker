import React, { useMemo, useState } from 'react';
import { DebtEntry } from '../types';
import { PlusIcon, PencilIcon, TrashIcon, UserIcon, ArrowRightIcon } from './icons';
import { formatCurrency } from '../utils/formatters';
import { summarizeDebts, getPeopleWhoOweYou, getPeopleYouOwe, calculateDebtTotals, DebtSummary } from '../utils/debtUtils';
import Card, { CardContent } from './Card';
import { BaseModal } from './BaseModal';
import { dbMutations } from '../hooks/useDatabase';

interface DebtsTabProps {
  debts: DebtEntry[];
}

interface DebtFormData {
  personName: string;
  direction: 'they_owe_me' | 'i_owe_them';
  amount: string;
  note: string;
}

type ViewMode = 'people' | 'entries';

const DebtsTab: React.FC<DebtsTabProps> = ({ debts }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDebt, setEditingDebt] = useState<DebtEntry | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('people');
  const [expandedPerson, setExpandedPerson] = useState<string | null>(null);
  const [formData, setFormData] = useState<DebtFormData>({
    personName: '',
    direction: 'they_owe_me',
    amount: '',
    note: '',
  });

  const { summaries, oweYou, youOwe, totals, allPeople } = useMemo(() => {
    const summaries = summarizeDebts(debts);
    const oweYou = getPeopleWhoOweYou(summaries);
    const youOwe = getPeopleYouOwe(summaries);
    return {
      summaries,
      oweYou,
      youOwe,
      totals: calculateDebtTotals(summaries),
      allPeople: [...oweYou, ...youOwe],
    };
  }, [debts]);

  const openAddModal = (prefilledName?: string) => {
    setEditingDebt(null);
    setFormData({
      personName: prefilledName || '',
      direction: 'they_owe_me',
      amount: '',
      note: ''
    });
    setIsModalOpen(true);
  };

  const openEditModal = (debt: DebtEntry) => {
    setEditingDebt(debt);
    setFormData({
      personName: debt.personName,
      direction: debt.direction,
      amount: debt.amount.toString(),
      note: debt.note || '',
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(formData.amount);
    if (!formData.personName.trim() || isNaN(amount) || amount <= 0) return;

    if (editingDebt) {
      await dbMutations.updateDebt(editingDebt.id, {
        personName: formData.personName.trim(),
        direction: formData.direction,
        amount,
        note: formData.note.trim() || undefined,
      });
    } else {
      await dbMutations.addDebt({
        id: crypto.randomUUID(),
        personName: formData.personName.trim(),
        direction: formData.direction,
        amount,
        date: new Date().toISOString(),
        note: formData.note.trim() || undefined,
      });
    }
    setIsModalOpen(false);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this debt entry?')) {
      await dbMutations.deleteDebt(id);
    }
  };

  const getPersonDebts = (personName: string) => {
    return debts.filter(d => d.personName === personName);
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div className="space-y-4 sm:space-y-6 max-w-7xl mx-auto px-2 sm:px-4 pb-24">
      {/* Hero Summary Card */}
      <div className="relative overflow-hidden rounded-2xl bg-[rgb(var(--color-card-rgb))] border border-[rgb(var(--color-border-rgb))] p-4 sm:p-6 shadow-sm">
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-[rgb(var(--color-text-rgb))]">Debts & IOUs</h1>
              <p className="text-[rgb(var(--color-text-muted-rgb))] text-xs sm:text-sm mt-0.5">Track your personal loans</p>
            </div>
            <button
              onClick={() => openAddModal()}
              className="flex items-center gap-1.5 px-3 py-2 sm:px-4 sm:py-2.5 bg-[rgb(var(--color-primary-rgb))] hover:bg-[rgb(var(--color-primary-hover-rgb))] text-white rounded-xl text-sm font-medium transition-all active:scale-95"
            >
              <PlusIcon className="h-4 w-4 sm:h-5 sm:w-5" />
              <span className="hidden xs:inline">Add</span>
            </button>
          </div>

          {/* Net Balance Display */}
          <div className="text-center py-3 sm:py-5">
            <div className="text-[rgb(var(--color-text-muted-rgb))] text-xs sm:text-sm mb-1">Net Balance</div>
            <div className={`text-3xl sm:text-4xl font-bold ${totals.netBalance >= 0 ? 'text-green-500 dark:text-green-400' : 'text-red-500 dark:text-red-400'}`}>
              {totals.netBalance >= 0 ? '+' : ''}{formatCurrency(Math.abs(totals.netBalance))}
            </div>
            <div className="text-[rgb(var(--color-text-muted-rgb))] text-xs mt-1">
              {totals.netBalance >= 0 ? "You're owed overall" : "You owe overall"}
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 gap-3 mt-2">
            <div className="bg-green-50 dark:bg-green-500/10 border border-green-200 dark:border-green-800/50 rounded-xl p-3 text-center">
              <div className="text-lg sm:text-xl font-bold text-green-600 dark:text-green-400">{formatCurrency(totals.totalOwedToYou)}</div>
              <div className="text-green-600/70 dark:text-green-400/70 text-xs mt-0.5">Owed to you</div>
              <div className="text-green-600/50 dark:text-green-400/50 text-xs">{oweYou.length} {oweYou.length === 1 ? 'person' : 'people'}</div>
            </div>
            <div className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-800/50 rounded-xl p-3 text-center">
              <div className="text-lg sm:text-xl font-bold text-red-600 dark:text-red-400">{formatCurrency(totals.totalYouOwe)}</div>
              <div className="text-red-600/70 dark:text-red-400/70 text-xs mt-0.5">You owe</div>
              <div className="text-red-600/50 dark:text-red-400/50 text-xs">{youOwe.length} {youOwe.length === 1 ? 'person' : 'people'}</div>
            </div>
          </div>
        </div>
      </div>

      {/* View Mode Toggle */}
      {debts.length > 0 && (
        <div className="flex gap-1 p-1 bg-[rgb(var(--color-card-rgb))] rounded-xl border border-[rgb(var(--color-border-rgb))] w-fit">
          <button
            onClick={() => setViewMode('people')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              viewMode === 'people'
                ? 'bg-[rgb(var(--color-primary-rgb))] text-white shadow-sm'
                : 'text-[rgb(var(--color-text-muted-rgb))] hover:text-[rgb(var(--color-text-rgb))] hover:bg-[rgb(var(--color-bg-rgb))]'
            }`}
          >
            By Person
          </button>
          <button
            onClick={() => setViewMode('entries')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              viewMode === 'entries'
                ? 'bg-[rgb(var(--color-primary-rgb))] text-white shadow-sm'
                : 'text-[rgb(var(--color-text-muted-rgb))] hover:text-[rgb(var(--color-text-rgb))] hover:bg-[rgb(var(--color-bg-rgb))]'
            }`}
          >
            All Entries
          </button>
        </div>
      )}

      {/* Content */}
      {debts.length > 0 ? (
        <div className="space-y-3">
          {viewMode === 'people' ? (
            /* People Grouped View */
            <>
              {allPeople.map((person) => {
                const personDebts = getPersonDebts(person.personName);
                const isExpanded = expandedPerson === person.personName;
                const isPositive = person.netAmount > 0;

                return (
                  <div key={person.personName} className={`rounded-xl border overflow-hidden transition-all ${
                    isPositive
                      ? 'border-green-200 dark:border-green-800/50 bg-[rgb(var(--color-card-rgb))] dark:bg-green-950/20'
                      : 'border-red-200 dark:border-red-800/50 bg-[rgb(var(--color-card-rgb))] dark:bg-red-950/20'
                  }`}>
                    {/* Person Header - Always visible */}
                    <button
                      onClick={() => setExpandedPerson(isExpanded ? null : person.personName)}
                      className={`w-full p-3 sm:p-4 flex items-center gap-3 transition-colors ${
                        isPositive
                          ? 'hover:bg-green-50/50 dark:hover:bg-green-900/20 active:bg-green-50/50 dark:active:bg-green-900/20'
                          : 'hover:bg-red-50/50 dark:hover:bg-red-900/20 active:bg-red-50/50 dark:active:bg-red-900/20'
                      }`}
                    >
                      {/* Avatar */}
                      <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center text-sm sm:text-base font-bold ${
                        isPositive
                          ? 'bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400'
                          : 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400'
                      }`}>
                        {getInitials(person.personName)}
                      </div>

                      {/* Info */}
                      <div className="flex-1 text-left">
                        <div className="font-semibold text-[rgb(var(--color-text-rgb))]">{person.personName}</div>
                        <div className="text-xs text-[rgb(var(--color-text-muted-rgb))]">
                          {personDebts.length} {personDebts.length === 1 ? 'entry' : 'entries'}
                        </div>
                      </div>

                      {/* Net Balance */}
                      <div className="text-right">
                        <div className={`font-bold ${isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                          {isPositive ? '+' : ''}{formatCurrency(person.netAmount)}
                        </div>
                        <div className={`text-xs ${isPositive ? 'text-green-600/70 dark:text-green-400/70' : 'text-red-600/70 dark:text-red-400/70'}`}>
                          {isPositive ? 'owes you' : 'you owe'}
                        </div>
                      </div>

                      {/* Expand Arrow */}
                      <ArrowRightIcon className={`h-5 w-5 text-[rgb(var(--color-text-muted-rgb))] transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                    </button>

                    {/* Expanded Entries */}
                    {isExpanded && (
                      <div className="border-t border-[rgb(var(--color-border-rgb))] bg-[rgb(var(--color-bg-rgb))]">
                        {personDebts.map((debt, idx) => (
                          <div
                            key={debt.id}
                            className={`flex items-center gap-3 p-3 sm:p-4 ${idx !== personDebts.length - 1 ? 'border-b border-[rgb(var(--color-border-rgb))]' : ''}`}
                          >
                            <div className={`w-2 h-2 rounded-full ${debt.direction === 'they_owe_me' ? 'bg-green-500' : 'bg-red-500'}`} />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className={`font-medium ${debt.direction === 'they_owe_me' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                  {formatCurrency(debt.amount)}
                                </span>
                                <span className="text-xs text-[rgb(var(--color-text-muted-rgb))]">
                                  {formatDate(debt.date)}
                                </span>
                              </div>
                              {debt.note && (
                                <div className="text-xs text-[rgb(var(--color-text-muted-rgb))] truncate">{debt.note}</div>
                              )}
                            </div>
                            {/* Action buttons - always visible on mobile */}
                            <div className="flex gap-1">
                              <button
                                onClick={(e) => { e.stopPropagation(); openEditModal(debt); }}
                                className="p-2 rounded-lg hover:bg-[rgb(var(--color-card-rgb))] text-[rgb(var(--color-primary-rgb))] active:scale-95 transition-all"
                                aria-label="Edit"
                              >
                                <PencilIcon className="h-4 w-4" />
                              </button>
                              <button
                                onClick={(e) => { e.stopPropagation(); handleDelete(debt.id); }}
                                className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 active:scale-95 transition-all"
                                aria-label="Delete"
                              >
                                <TrashIcon className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        ))}
                        {/* Quick add for this person */}
                        <button
                          onClick={() => openAddModal(person.personName)}
                          className="w-full p-3 flex items-center justify-center gap-2 text-sm text-[rgb(var(--color-primary-rgb))] hover:bg-[rgb(var(--color-primary-rgb))]/5 transition-colors"
                        >
                          <PlusIcon className="h-4 w-4" />
                          Add entry for {person.personName}
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </>
          ) : (
            /* All Entries List View */
            <div className="space-y-2">
              {debts.map((debt) => (
                <div
                  key={debt.id}
                  className={`flex items-center gap-3 p-3 sm:p-4 rounded-xl border transition-all ${
                    debt.direction === 'they_owe_me'
                      ? 'bg-[rgb(var(--color-card-rgb))] dark:bg-green-950/20 border-green-200 dark:border-green-800/50 hover:border-green-300 dark:hover:border-green-700/60'
                      : 'bg-[rgb(var(--color-card-rgb))] dark:bg-red-950/20 border-red-200 dark:border-red-800/50 hover:border-red-300 dark:hover:border-red-700/60'
                  }`}
                >
                  {/* Avatar */}
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold ${
                    debt.direction === 'they_owe_me'
                      ? 'bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400'
                      : 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400'
                  }`}>
                    {getInitials(debt.personName)}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-[rgb(var(--color-text-rgb))] truncate">{debt.personName}</span>
                      <span className="text-xs text-[rgb(var(--color-text-muted-rgb))] flex-shrink-0">{formatDate(debt.date)}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className={`text-sm font-medium ${debt.direction === 'they_owe_me' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                        {debt.direction === 'they_owe_me' ? '+' : '-'}{formatCurrency(debt.amount)}
                      </span>
                      {debt.note && (
                        <span className="text-xs text-[rgb(var(--color-text-muted-rgb))] truncate">• {debt.note}</span>
                      )}
                    </div>
                  </div>

                  {/* Actions - always visible */}
                  <div className="flex gap-1 flex-shrink-0">
                    <button
                      onClick={() => openEditModal(debt)}
                      className="p-2.5 rounded-xl hover:bg-[rgb(var(--color-bg-rgb))] text-[rgb(var(--color-primary-rgb))] active:scale-95 transition-all"
                      aria-label="Edit"
                    >
                      <PencilIcon className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(debt.id)}
                      className="p-2.5 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 active:scale-95 transition-all"
                      aria-label="Delete"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* Empty State */
        <div className="text-center py-12 sm:py-16">
          <div className="w-24 h-24 sm:w-28 sm:h-28 mx-auto mb-6 bg-gradient-to-br from-[rgb(var(--color-primary-rgb))]/20 to-[rgb(var(--color-primary-rgb))]/5 rounded-full flex items-center justify-center">
            <UserIcon className="w-12 h-12 sm:w-14 sm:h-14 text-[rgb(var(--color-primary-rgb))]" />
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-[rgb(var(--color-text-rgb))] mb-2">No debts yet</h2>
          <p className="text-[rgb(var(--color-text-muted-rgb))] mb-8 max-w-sm mx-auto text-sm sm:text-base px-4">
            Start tracking who owes you money and who you need to pay back
          </p>
          <button
            onClick={() => openAddModal()}
            className="inline-flex items-center gap-2 px-6 py-3 text-base font-medium text-white bg-[rgb(var(--color-primary-rgb))] rounded-xl shadow-lg hover:bg-[rgb(var(--color-primary-hover-rgb))] active:scale-95 transition-all"
          >
            <PlusIcon className="h-5 w-5" />
            Add First Debt
          </button>
        </div>
      )}

      {/* Add/Edit Modal - Improved */}
      <BaseModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingDebt ? 'Edit Entry' : 'New Debt Entry'} size="sm">
        <form onSubmit={handleSubmit} className="space-y-5 p-4 sm:p-5">
          {/* Person Name */}
          <div>
            <label className="block text-sm font-medium text-[rgb(var(--color-text-rgb))] mb-2">Who?</label>
            <input
              type="text"
              value={formData.personName}
              onChange={(e) => setFormData({ ...formData, personName: e.target.value })}
              className="w-full px-4 py-3 border border-[rgb(var(--color-border-rgb))] rounded-xl bg-[rgb(var(--color-bg-rgb))] text-[rgb(var(--color-text-rgb))] text-base focus:ring-2 focus:ring-[rgb(var(--color-primary-rgb))] focus:border-transparent transition-all"
              placeholder="Enter name..."
              required
              autoComplete="off"
            />
          </div>

          {/* Direction - Large Touch Targets */}
          <div>
            <label className="block text-sm font-medium text-[rgb(var(--color-text-rgb))] mb-2">Direction</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, direction: 'they_owe_me' })}
                className={`p-4 rounded-xl border-2 text-center transition-all active:scale-98 ${
                  formData.direction === 'they_owe_me'
                    ? 'bg-green-50 border-green-500 dark:bg-green-900/40 dark:border-green-500'
                    : 'border-[rgb(var(--color-border-rgb))] hover:border-green-300 dark:hover:border-green-600'
                }`}
              >
                <div className={`text-2xl mb-1 ${formData.direction === 'they_owe_me' ? 'text-green-600 dark:text-green-400' : 'text-[rgb(var(--color-text-muted-rgb))]'}`}>↓</div>
                <div className={`text-sm font-medium ${formData.direction === 'they_owe_me' ? 'text-green-700 dark:text-green-400' : 'text-[rgb(var(--color-text-muted-rgb))]'}`}>
                  They Owe Me
                </div>
              </button>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, direction: 'i_owe_them' })}
                className={`p-4 rounded-xl border-2 text-center transition-all active:scale-98 ${
                  formData.direction === 'i_owe_them'
                    ? 'bg-red-50 border-red-500 dark:bg-red-900/40 dark:border-red-500'
                    : 'border-[rgb(var(--color-border-rgb))] hover:border-red-300 dark:hover:border-red-600'
                }`}
              >
                <div className={`text-2xl mb-1 ${formData.direction === 'i_owe_them' ? 'text-red-600 dark:text-red-400' : 'text-[rgb(var(--color-text-muted-rgb))]'}`}>↑</div>
                <div className={`text-sm font-medium ${formData.direction === 'i_owe_them' ? 'text-red-700 dark:text-red-400' : 'text-[rgb(var(--color-text-muted-rgb))]'}`}>
                  I Owe Them
                </div>
              </button>
            </div>
          </div>

          {/* Amount */}
          <div>
            <label className="block text-sm font-medium text-[rgb(var(--color-text-rgb))] mb-2">Amount</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[rgb(var(--color-text-muted-rgb))]">$</span>
              <input
                type="number"
                inputMode="decimal"
                step="0.01"
                min="0.01"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                className="w-full pl-8 pr-4 py-3 border border-[rgb(var(--color-border-rgb))] rounded-xl bg-[rgb(var(--color-bg-rgb))] text-[rgb(var(--color-text-rgb))] text-lg font-medium focus:ring-2 focus:ring-[rgb(var(--color-primary-rgb))] focus:border-transparent transition-all"
                placeholder="0.00"
                required
              />
            </div>
          </div>

          {/* Note */}
          <div>
            <label className="block text-sm font-medium text-[rgb(var(--color-text-rgb))] mb-2">Note <span className="text-[rgb(var(--color-text-muted-rgb))] font-normal">(optional)</span></label>
            <input
              type="text"
              value={formData.note}
              onChange={(e) => setFormData({ ...formData, note: e.target.value })}
              className="w-full px-4 py-3 border border-[rgb(var(--color-border-rgb))] rounded-xl bg-[rgb(var(--color-bg-rgb))] text-[rgb(var(--color-text-rgb))] text-base focus:ring-2 focus:ring-[rgb(var(--color-primary-rgb))] focus:border-transparent transition-all"
              placeholder="What's this for?"
            />
          </div>

          {/* Submit Buttons */}
          <div className="flex gap-3 pt-3">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="flex-1 px-4 py-3 border border-[rgb(var(--color-border-rgb))] rounded-xl text-[rgb(var(--color-text-rgb))] font-medium hover:bg-[rgb(var(--color-bg-rgb))] active:scale-98 transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-3 bg-[rgb(var(--color-primary-rgb))] text-white font-medium rounded-xl hover:bg-[rgb(var(--color-primary-hover-rgb))] active:scale-98 transition-all shadow-sm"
            >
              {editingDebt ? 'Update' : 'Add Entry'}
            </button>
          </div>
        </form>
      </BaseModal>
    </div>
  );
};

export default DebtsTab;
