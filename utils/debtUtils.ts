import { DebtEntry } from '../types';

/**
 * Summary of debt balance per person.
 * Positive = they owe you; Negative = you owe them.
 */
export interface DebtSummary {
  personName: string;
  netAmount: number; // positive = they owe you, negative = you owe them
  totalTheyOwe: number;
  totalYouOwe: number;
  entryCount: number;
}

/**
 * Summarize debts per person.
 * Returns a map where:
 *   - Positive netAmount = that person owes you
 *   - Negative netAmount = you owe that person
 */
export function summarizeDebts(entries: DebtEntry[]): Record<string, DebtSummary> {
  return entries.reduce((acc, entry) => {
    const name = entry.personName;
    if (!acc[name]) {
      acc[name] = {
        personName: name,
        netAmount: 0,
        totalTheyOwe: 0,
        totalYouOwe: 0,
        entryCount: 0,
      };
    }

    if (entry.direction === 'they_owe_me') {
      acc[name].netAmount += entry.amount;
      acc[name].totalTheyOwe += entry.amount;
    } else {
      acc[name].netAmount -= entry.amount;
      acc[name].totalYouOwe += entry.amount;
    }
    acc[name].entryCount += 1;

    return acc;
  }, {} as Record<string, DebtSummary>);
}

/**
 * Get sorted list of people who owe you (positive balance).
 */
export function getPeopleWhoOweYou(summaries: Record<string, DebtSummary>): DebtSummary[] {
  return Object.values(summaries)
    .filter(s => s.netAmount > 0)
    .sort((a, b) => b.netAmount - a.netAmount);
}

/**
 * Get sorted list of people you owe (negative balance).
 */
export function getPeopleYouOwe(summaries: Record<string, DebtSummary>): DebtSummary[] {
  return Object.values(summaries)
    .filter(s => s.netAmount < 0)
    .sort((a, b) => a.netAmount - b.netAmount); // most negative first
}

/**
 * Calculate total amounts.
 */
export function calculateDebtTotals(summaries: Record<string, DebtSummary>): {
  totalOwedToYou: number;
  totalYouOwe: number;
  netBalance: number;
} {
  const values = Object.values(summaries);
  const totalOwedToYou = values.reduce((sum, s) => sum + Math.max(0, s.netAmount), 0);
  const totalYouOwe = values.reduce((sum, s) => sum + Math.abs(Math.min(0, s.netAmount)), 0);
  return {
    totalOwedToYou,
    totalYouOwe,
    netBalance: totalOwedToYou - totalYouOwe,
  };
}

